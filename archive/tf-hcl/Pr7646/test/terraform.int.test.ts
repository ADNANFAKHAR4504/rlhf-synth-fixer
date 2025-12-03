// test/terraform.int.test.ts
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeAddressesCommand
} from "@aws-sdk/client-ec2";
import fs from "fs";
import path from "path";

const OUTPUTS_PATH = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");

describe("Terraform VPC Infrastructure Integration Tests", () => {
  let outputs: any;
  let ec2Client: EC2Client;

  beforeAll(() => {
    // 1. Initialize AWS SDK
    ec2Client = new EC2Client({ region: "us-east-1" });

    // 2. Load deployment outputs safely
    if (!fs.existsSync(OUTPUTS_PATH)) {
      throw new Error(`Outputs file not found at ${OUTPUTS_PATH}`);
    }
    const outputsContent = fs.readFileSync(OUTPUTS_PATH, "utf8");
    outputs = JSON.parse(outputsContent);

    // 3. Handle potential stringified arrays (e.g. from Terraform output wrappers)
    // We try to parse them; if it fails, we assume they are already correct or strings.
    const arrayKeys = ['availability_zones', 'public_subnet_ids', 'private_subnet_ids'];
    arrayKeys.forEach(key => {
      if (outputs[key] && typeof outputs[key] === 'string') {
        try {
          const parsed = JSON.parse(outputs[key]);
          if (Array.isArray(parsed)) {
            outputs[key] = parsed;
          }
        } catch (e) {
          // Keep original value if parsing fails
        }
      }
    });
  });

  describe("Output Availability", () => {
    test("Critical outputs should be present", () => {
      expect(outputs.vpc_id).toBeDefined();
      expect(outputs.public_subnet_ids).toBeDefined();
      expect(outputs.private_subnet_ids).toBeDefined();
      expect(outputs.internet_gateway_id).toBeDefined();
      expect(outputs.nat_gateway_id).toBeDefined();
    });
  });

  describe("VPC Validation", () => {
    test("VPC should exist in AWS", async () => {
      const command = new DescribeVpcsCommand({ VpcIds: [outputs.vpc_id] });
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs![0].State).toBe("available");
    });

    test("VPC should have correct CIDR", async () => {
      const command = new DescribeVpcsCommand({ VpcIds: [outputs.vpc_id] });
      const response = await ec2Client.send(command);
      expect(response.Vpcs![0].CidrBlock).toBe(outputs.vpc_cidr);
    });

    test("VPC should have Name and Environment tags (regardless of value)", async () => {
      const command = new DescribeVpcsCommand({ VpcIds: [outputs.vpc_id] });
      const response = await ec2Client.send(command);
      const tags = response.Vpcs![0].Tags || [];

      const nameTag = tags.find(t => t.Key === "Name");
      const envTag = tags.find(t => t.Key === "Environment");

      expect(nameTag).toBeDefined();
      expect(nameTag?.Value?.length).toBeGreaterThan(0);

      expect(envTag).toBeDefined();
      expect(envTag?.Value?.length).toBeGreaterThan(0);
    });
  });

  describe("Subnets Validation", () => {
    test("Public subnets should exist", async () => {
      // Ensure it's an array before checking length
      const subnetIds = Array.isArray(outputs.public_subnet_ids)
        ? outputs.public_subnet_ids
        : JSON.parse(outputs.public_subnet_ids);

      expect(subnetIds.length).toBeGreaterThan(0);
    });

    test("Private subnets should exist", async () => {
      const subnetIds = Array.isArray(outputs.private_subnet_ids)
        ? outputs.private_subnet_ids
        : JSON.parse(outputs.private_subnet_ids);

      expect(subnetIds.length).toBeGreaterThan(0);
    });
  });

  describe("Gateways Validation", () => {
    test("Internet Gateway should be attached to the VPC", async () => {
      const command = new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [outputs.internet_gateway_id]
      });
      const response = await ec2Client.send(command);
      const igw = response.InternetGateways![0];

      const attachment = igw.Attachments?.find(a => a.VpcId === outputs.vpc_id);
      expect(attachment).toBeDefined();
      expect(attachment?.State).toBe("available");
    });

    test("NAT Gateway should be available", async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.nat_gateway_id]
      });
      const response = await ec2Client.send(command);
      expect(response.NatGateways![0].State).toBe("available");
    });

    test("NAT Gateway should have an EIP allocated", async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.nat_gateway_id]
      });
      const response = await ec2Client.send(command);
      const addresses = response.NatGateways![0].NatGatewayAddresses || [];

      expect(addresses.length).toBeGreaterThan(0);
      expect(addresses[0].PublicIp).toBe(outputs.nat_gateway_eip);
    });
  });

  describe("Route Tables", () => {
    test("Public Route Table should have a route to Internet Gateway", async () => {
      const command = new DescribeRouteTablesCommand({
        RouteTableIds: [outputs.public_route_table_id]
      });
      const response = await ec2Client.send(command);
      const routes = response.RouteTables![0].Routes || [];

      const igwRoute = routes.find(r => r.GatewayId === outputs.internet_gateway_id);
      expect(igwRoute).toBeDefined();
      expect(igwRoute?.State).toBe("active");
    });

    test("Private Route Table should have a route to NAT Gateway", async () => {
      const command = new DescribeRouteTablesCommand({
        RouteTableIds: [outputs.private_route_table_id]
      });
      const response = await ec2Client.send(command);
      const routes = response.RouteTables![0].Routes || [];

      const natRoute = routes.find(r => r.NatGatewayId === outputs.nat_gateway_id);
      expect(natRoute).toBeDefined();
      expect(natRoute?.State).toBe("active");
    });
  });
});
