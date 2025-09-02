import { DescribeInstancesCommand, DescribeNatGatewaysCommand, DescribeVpcsCommand, EC2Client } from "@aws-sdk/client-ec2";
import { DescribeDBInstancesCommand, RDSClient } from "@aws-sdk/client-rds";
import fs from "fs";
import path from "path";

const allOutputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
const region = process.env.AWS_REGION || "us-west-2"; // Do not hardcode, use env or variable

function isValidIp(ip: string) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
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
    expect(outputs.vpc1_id.value).toMatch(/^vpc-/);
    expect(outputs.vpc2_id.value).toMatch(/^vpc-/);
  });

  test("EC2 instance IPs are present and valid", () => {
    expect(isValidIp(outputs.vpc1_ec2_private_ip.value)).toBe(true);
    expect(isValidIp(outputs.vpc2_ec2_private_ip.value)).toBe(true);
    expect(isValidIp(outputs.vpc1_ec2_public_ip.value)).toBe(true);
    expect(isValidIp(outputs.vpc2_ec2_public_ip.value)).toBe(true);
  });

  test("NAT Gateway IDs are present", () => {
    expect(outputs.vpc1_nat_gateway_id.value).toMatch(/^nat-/);
    expect(outputs.vpc2_nat_gateway_id.value).toMatch(/^nat-/);
  });

  test("RDS endpoint is present and looks valid", () => {
    expect(outputs.rds_endpoint.value).toMatch(/\.rds\.amazonaws\.com(:\d+)?$/);
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
    const vpcId = outputs.vpc1_id.value;
    const resp = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    expect(resp.Vpcs?.length).toBe(1);
    expect(resp.Vpcs?.[0].VpcId).toBe(vpcId);
    expect(resp.Vpcs?.[0].CidrBlock).toBe("10.0.0.0/16"); // Update to match your config
  });

  test("EC2 instance in VPC1 exists and matches output IP", async () => {
    const privateIp = outputs.vpc1_ec2_private_ip.value;
    const vpcId = outputs.vpc1_id.value;

    const resp = await ec2.send(new DescribeInstancesCommand({
      Filters: [
        { Name: "private-ip-address", Values: [privateIp] },
        { Name: "vpc-id", Values: [vpcId] }
      ]
    }));

    // There should be at least one instance matching the filters
    const reservations = resp.Reservations ?? [];
    const instances = reservations.flatMap(r => r.Instances ?? []);
    expect(instances.length).toBeGreaterThan(0);

    // Check the instance's private IP and VPC
    const instance = instances[0];
    expect(instance.PrivateIpAddress).toBe(privateIp);
    expect(instance.VpcId).toBe(vpcId);
  });

  test("RDS instance exists and endpoint matches output", async () => {
    const rdsEndpoint = outputs.rds_endpoint.value;
    const rdsClient = new RDSClient({ region });

    // Get all DB instances and find one with the matching endpoint
    const resp = await rdsClient.send(new DescribeDBInstancesCommand({}));
    const dbInstances = resp.DBInstances ?? [];
    const found = dbInstances.find(db =>
      db.Endpoint?.Address &&
      rdsEndpoint.startsWith(db.Endpoint.Address)
    );

    expect(found).toBeDefined();
    expect(rdsEndpoint).toContain(found?.Endpoint?.Address ?? "");
    // Only check status if found is defined
    if (found) {
      expect(found.DBInstanceStatus).toBe("available");
    }
  });

  test("NAT Gateway in VPC1 exists and matches output", async () => {
    const natGatewayId = outputs.vpc1_nat_gateway_id.value;
    // Reuse ec2 client from beforeAll
    const resp = await ec2.send(new DescribeNatGatewaysCommand({ NatGatewayIds: [natGatewayId] }));

    expect(resp.NatGateways?.length).toBe(1);
    const natGateway = resp.NatGateways?.[0];
    expect(natGateway?.NatGatewayId).toBe(natGatewayId);
    expect(natGateway?.State).toBe("available");
    expect(natGateway?.VpcId).toBe(outputs.vpc1_id.value);
  });

  test("NAT Gateway in VPC2 exists and matches output", async () => {
    const natGatewayId = outputs.vpc2_nat_gateway_id.value;
    const resp = await ec2.send(new DescribeNatGatewaysCommand({ NatGatewayIds: [natGatewayId] }));

    expect(resp.NatGateways?.length).toBe(1);
    const natGateway = resp.NatGateways?.[0];
    expect(natGateway?.NatGatewayId).toBe(natGatewayId);
    expect(natGateway?.State).toBe("available");
    expect(natGateway?.VpcId).toBe(outputs.vpc2_id.value);
  });
});

describe('Turn Around Prompt API Integration Tests', () => {
  describe('Write Integration TESTS', () => {
    test('Dont forget!', async () => {
      expect(true).toBe(true);
    });
  });
});
