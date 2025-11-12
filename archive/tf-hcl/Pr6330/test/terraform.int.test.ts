// Comprehensive integration tests for deployed Terraform VPC infrastructure
// Tests validate actual AWS resources using AWS SDK

import {
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  EC2Client
} from "@aws-sdk/client-ec2";
import fs from "fs";
import path from "path";

const region = process.env.AWS_REGION || "us-east-1";
const ec2Client = new EC2Client({ region });

// Load Terraform outputs
const outputsPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");
let outputs: any;

beforeAll(() => {

  if (!fs.existsSync(outputsPath)) {
    throw new Error(`Terraform outputs not found at ${outputsPath}. Run terraform apply first.`);
  }
  outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
});

describe("Terraform VPC Infrastructure - Integration Tests", () => {
  describe("VPC Configuration", () => {
    test("VPC exists with correct CIDR block", async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe("10.0.0.0/16");
      expect(vpc.State).toBe("available");
    });

  });


  describe("Internet Gateway", () => {
    test("Internet Gateway exists and is attached to VPC", async () => {
      const command = new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [outputs.internet_gateway_id],
      });
      const response = await ec2Client.send(command);

      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].VpcId).toBe(outputs.vpc_id);
      expect(igw.Attachments![0].State).toBe("available");
    });

    test("Internet Gateway has correct tags", async () => {
      const command = new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [outputs.internet_gateway_id],
      });
      const response = await ec2Client.send(command);

      const igw = response.InternetGateways![0];
      const tags = igw.Tags || [];
      const nameTag = tags.find((t) => t.Key === "Name");

      expect(nameTag?.Value).toContain("igw");
      expect(nameTag?.Value).toContain("startup-vpc-igw-prod");
    });
  });

  describe("Route Tables", () => {
    test("Public route table exists", async () => {
      const command = new DescribeRouteTablesCommand({
        RouteTableIds: [outputs.public_route_table_id],
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables).toHaveLength(1);
    });

    test("Public route table has route to Internet Gateway", async () => {
      const command = new DescribeRouteTablesCommand({
        RouteTableIds: [outputs.public_route_table_id],
      });
      const response = await ec2Client.send(command);

      const rt = response.RouteTables![0];
      const igwRoute = rt.Routes!.find((r) => r.GatewayId?.startsWith("igw-"));

      expect(igwRoute).toBeTruthy();
      expect(igwRoute!.DestinationCidrBlock).toBe("0.0.0.0/0");
      expect(igwRoute!.GatewayId).toBe(outputs.internet_gateway_id);
      expect(igwRoute!.State).toBe("active");
    });
  });

  describe("Security Group", () => {
    test("Security group exists", async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.default_security_group_id],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toHaveLength(1);
    });

    test("Security group is attached to VPC", async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.default_security_group_id],
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.vpc_id);
    });

    test("Security group allows HTTPS inbound", async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.default_security_group_id],
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups![0];
      const httpsRule = sg.IpPermissions!.find(
        (rule) => rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === "tcp"
      );

      expect(httpsRule).toBeTruthy();
      const hasCorrectCidr = httpsRule!.IpRanges?.some((range) => range.CidrIp === "0.0.0.0/0");
      expect(hasCorrectCidr).toBe(true);
    });

    test("Security group allows all outbound traffic", async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.default_security_group_id],
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups![0];
      const allOutboundRule = sg.IpPermissionsEgress!.find(
        (rule) => rule.IpProtocol === "-1" && rule.FromPort === undefined && rule.ToPort === undefined
      );

      expect(allOutboundRule).toBeTruthy();
      const hasCorrectCidr = allOutboundRule!.IpRanges?.some((range) => range.CidrIp === "0.0.0.0/0");
      expect(hasCorrectCidr).toBe(true);
    });

    test("Security group has correct tags", async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.default_security_group_id],
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups![0];
      const tags = sg.Tags || [];
      const nameTag = tags.find((t) => t.Key === "Name");

      expect(nameTag?.Value).toContain("default-sg");
      expect(nameTag?.Value).toContain("startup-vpc-default-sg-pro");
    });
  });
});
