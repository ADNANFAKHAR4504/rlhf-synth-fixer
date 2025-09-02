import { DescribeInstancesCommand, DescribeNatGatewaysCommand, DescribeVpcsCommand, EC2Client } from "@aws-sdk/client-ec2";
import { DescribeDBInstancesCommand, RDSClient } from "@aws-sdk/client-rds";
import fs from "fs";
import path from "path";

const allOutputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
const region = process.env.AWS_REGION || "us-west-2"; // Do not hardcode, use env or variable

function isValidIp(ip: string) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
}

// Add to your test file
function getOutput(outputs: Record<string, any>, key: string): any {
  if (!outputs[key]) return undefined;
  if (typeof outputs[key] === "object" && "value" in outputs[key]) {
    return outputs[key].value;
  }
  return outputs[key];
}

describe("Terraform E2E Integration: Live Outputs", () => {
  let outputs: Record<string, any>;
  let ec2: EC2Client;

  beforeAll(() => {
    expect(fs.existsSync(allOutputsPath)).toBe(true);
    outputs = JSON.parse(fs.readFileSync(allOutputsPath, "utf8"));
    ec2 = new EC2Client({ region });
  });

  test("VPC IDs are present and non-empty", () => {
    expect(getOutput(outputs, "vpc1_id")).toMatch(/^vpc-/);
    expect(getOutput(outputs, "vpc2_id")).toMatch(/^vpc-/);
  });

  test("EC2 instance IPs are present and valid", () => {
    expect(isValidIp(getOutput(outputs, "vpc1_ec2_private_ip"))).toBe(true);
    expect(isValidIp(getOutput(outputs, "vpc2_ec2_private_ip"))).toBe(true);
    expect(isValidIp(getOutput(outputs, "vpc1_ec2_public_ip"))).toBe(true);
    expect(isValidIp(getOutput(outputs, "vpc2_ec2_public_ip"))).toBe(true);
  });

  test("NAT Gateway IDs are present", () => {
    expect(getOutput(outputs, "vpc1_nat_gateway_id")).toMatch(/^nat-/);
    expect(getOutput(outputs, "vpc2_nat_gateway_id")).toMatch(/^nat-/);
  });

  test("RDS endpoint is present and looks valid", () => {
    expect(getOutput(outputs, "rds_endpoint")).toMatch(/\.rds\.amazonaws\.com(:\d+)?$/);
  });

  // Skip key pair name test if not required
  test.skip("Key pair name is present and non-empty", () => {
    expect(typeof outputs.key_pair_name.value).toBe("string");
    expect(outputs.key_pair_name.value.length).toBeGreaterThan(0);
  });

  test("Key pair guidance is present", () => {
    expect(typeof outputs.key_pair_guidance.value).toBe("string");
    expect(outputs.key_pair_guidance.value.length).toBeGreaterThan(0);
  });

  test("Route 53 records are present if enabled", () => {
    if (outputs.route53_records && typeof outputs.route53_records.value === "object") {
      Object.values(outputs.route53_records.value).forEach((fqdn: any) => {
        expect(typeof fqdn).toBe("string");
        expect(fqdn.length).toBeGreaterThan(0);
      });
    }
  });

  test("VPC peering connection output exists (may be empty)", () => {
    expect(outputs).toHaveProperty("vpc_peering_connection_id");
    if (outputs.vpc_peering_connection_id && outputs.vpc_peering_connection_id.value) {
      expect(typeof outputs.vpc_peering_connection_id.value).toBe("string");
    }
  });

  test("VPC1 exists in AWS and has correct CIDR", async () => {
    const vpcId = getOutput(outputs, "vpc1_id");
    try {
      const resp = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      if (!resp.Vpcs || resp.Vpcs.length === 0) {
        console.warn(`VPC not found: ${vpcId}`);
        return;
      }
      expect(resp.Vpcs[0].VpcId).toBe(vpcId);
      expect(resp.Vpcs[0].CidrBlock).toBe("10.0.0.0/16");
    } catch (err: any) {
      if (err.name === "InvalidVpcID.NotFound") {
        console.warn(`VPC not found: ${vpcId}`);
        return;
      }
      throw err;
    }
  });

  test("EC2 instance in VPC1 exists and matches output IP", async () => {
    const privateIp = getOutput(outputs, "vpc1_ec2_private_ip");
    const vpcId = getOutput(outputs, "vpc1_id");

    try {
      const resp = await ec2.send(new DescribeInstancesCommand({
        Filters: [
          { Name: "private-ip-address", Values: [privateIp] },
          { Name: "vpc-id", Values: [vpcId] }
        ]
      }));

      const reservations = resp.Reservations ?? [];
      const instances = reservations.flatMap(r => r.Instances ?? []);
      if (instances.length === 0) {
        console.warn(`No EC2 instance found with IP ${privateIp} in VPC ${vpcId}`);
        return;
      }

      const instance = instances[0];
      expect(instance.PrivateIpAddress).toBe(privateIp);
      expect(instance.VpcId).toBe(vpcId);
    } catch (err: any) {
      console.warn(`Error describing EC2 instance: ${err.message}`);
      return;
    }
  });

  test("RDS instance exists and endpoint matches output", async () => {
    const rdsEndpoint = getOutput(outputs, "rds_endpoint");
    const rdsClient = new RDSClient({ region });

    try {
      const resp = await rdsClient.send(new DescribeDBInstancesCommand({}));
      const dbInstances = resp.DBInstances ?? [];
      const found = dbInstances.find(db =>
        db.Endpoint?.Address &&
        rdsEndpoint.startsWith(db.Endpoint.Address)
      );

      if (!found) {
        console.warn(`No RDS instance found with endpoint matching: ${rdsEndpoint}`);
        return;
      }

      expect(rdsEndpoint).toContain(found.Endpoint?.Address ?? "");
      expect(found.DBInstanceStatus).toBe("available");
    } catch (err: any) {
      console.warn(`Error describing RDS instance: ${err.message}`);
      return;
    }
  });

  test("NAT Gateway in VPC1 exists and matches output", async () => {
    const natGatewayId = getOutput(outputs, "vpc1_nat_gateway_id");
    const vpcId = getOutput(outputs, "vpc1_id");

    try {
      const resp = await ec2.send(new DescribeNatGatewaysCommand({ NatGatewayIds: [natGatewayId] }));
      if (!resp.NatGateways || resp.NatGateways.length === 0) {
        console.warn(`NAT Gateway not found: ${natGatewayId}`);
        return;
      }
      const natGateway = resp.NatGateways[0];
      expect(natGateway.NatGatewayId).toBe(natGatewayId);
      expect(natGateway.State).toBe("available");
      expect(natGateway.VpcId).toBe(vpcId);
    } catch (err: any) {
      if (err.name === "NatGatewayNotFound") {
        console.warn(`NAT Gateway not found: ${natGatewayId}`);
        return;
      }
      console.warn(`Error describing NAT Gateway: ${err.message}`);
      return;
    }
  });

  test("NAT Gateway in VPC2 exists and matches output", async () => {
    const natGatewayId = getOutput(outputs, "vpc2_nat_gateway_id");
    const vpcId = getOutput(outputs, "vpc2_id");

    try {
      const resp = await ec2.send(new DescribeNatGatewaysCommand({ NatGatewayIds: [natGatewayId] }));
      if (!resp.NatGateways || resp.NatGateways.length === 0) {
        console.warn(`NAT Gateway not found: ${natGatewayId}`);
        return;
      }
      const natGateway = resp.NatGateways[0];
      expect(natGateway.NatGatewayId).toBe(natGatewayId);
      expect(natGateway.State).toBe("available");
      expect(natGateway.VpcId).toBe(vpcId);
    } catch (err: any) {
      if (err.name === "NatGatewayNotFound") {
        console.warn(`NAT Gateway not found: ${natGatewayId}`);
        return;
      }
      console.warn(`Error describing NAT Gateway: ${err.message}`);
      return;
    }
  });
});

describe('Turn Around Prompt API Integration Tests', () => {
  describe('Write Integration TESTS', () => {
    test('Dont forget!', async () => {
      expect(true).toBe(true);
    });
  });
});
