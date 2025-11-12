// Comprehensive integration tests for deployed Terraform VPC infrastructure
// Tests validate actual AWS resources using AWS SDK

import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeAddressesCommand,
} from "@aws-sdk/client-ec2";
import fs from "fs";
import path from "path";

const region = process.env.AWS_REGION || "us-east-1";
const ec2Client = new EC2Client({ region });

// Load Terraform outputs
const outputsPath = path.resolve(__dirname, "../tf-outputs/terraform-outputs.json");
let outputs: any;

beforeAll(() => {
  if (!fs.existsSync(outputsPath)) {
    throw new Error(`Terraform outputs not found at ${outputsPath}. Run terraform apply first.`);
  }
  const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
  // Extract values from Terraform output format
  outputs = Object.entries(rawOutputs).reduce((acc: any, [key, val]: [string, any]) => {
    acc[key] = val.value;
    return acc;
  }, {});
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

    test("VPC has DNS hostnames enabled", async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id],
      });
      const response = await ec2Client.send(command);

      const vpc = response.Vpcs![0];
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test("VPC has correct tags", async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id],
      });
      const response = await ec2Client.send(command);

      const vpc = response.Vpcs![0];
      const tags = vpc.Tags || [];
      const nameTag = tags.find((t) => t.Key === "Name");
      const envTag = tags.find((t) => t.Key === "Environment");
      const projectTag = tags.find((t) => t.Key === "Project");

      expect(nameTag?.Value).toContain("synth101000913");
      expect(envTag?.Value).toBe("production");
      expect(projectTag?.Value).toBe("startup-infrastructure");
    });
  });

  describe("Public Subnets", () => {
    test("3 public subnets exist", async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.public_subnet_ids,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(3);
    });

    test("public subnets have correct CIDR blocks", async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.public_subnet_ids,
      });
      const response = await ec2Client.send(command);

      const cidrs = response.Subnets!.map((s) => s.CidrBlock).sort();
      expect(cidrs).toEqual(["10.0.1.0/24", "10.0.3.0/24", "10.0.5.0/24"]);
    });

    test("public subnets are in different availability zones", async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.public_subnet_ids,
      });
      const response = await ec2Client.send(command);

      const azs = response.Subnets!.map((s) => s.AvailabilityZone);
      const uniqueAzs = new Set(azs);
      expect(uniqueAzs.size).toBe(3);
    });

    test("public subnets have map_public_ip_on_launch enabled", async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.public_subnet_ids,
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test("public subnets have correct tags", async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.public_subnet_ids,
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach((subnet) => {
        const tags = subnet.Tags || [];
        const nameTag = tags.find((t) => t.Key === "Name");
        const typeTag = tags.find((t) => t.Key === "Type");

        expect(nameTag?.Value).toContain("synth101000913");
        expect(typeTag?.Value).toBe("Public");
      });
    });
  });

  describe("Private Subnets", () => {
    test("3 private subnets exist", async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.private_subnet_ids,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(3);
    });

    test("private subnets have correct CIDR blocks", async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.private_subnet_ids,
      });
      const response = await ec2Client.send(command);

      const cidrs = response.Subnets!.map((s) => s.CidrBlock).sort();
      expect(cidrs).toEqual(["10.0.2.0/24", "10.0.4.0/24", "10.0.6.0/24"]);
    });

    test("private subnets are in different availability zones", async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.private_subnet_ids,
      });
      const response = await ec2Client.send(command);

      const azs = response.Subnets!.map((s) => s.AvailabilityZone);
      const uniqueAzs = new Set(azs);
      expect(uniqueAzs.size).toBe(3);
    });

    test("private subnets do not have map_public_ip_on_launch enabled", async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.private_subnet_ids,
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test("private subnets have correct tags", async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.private_subnet_ids,
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach((subnet) => {
        const tags = subnet.Tags || [];
        const nameTag = tags.find((t) => t.Key === "Name");
        const typeTag = tags.find((t) => t.Key === "Type");

        expect(nameTag?.Value).toContain("synth101000913");
        expect(typeTag?.Value).toBe("Private");
      });
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
      expect(nameTag?.Value).toContain("synth101000913");
    });
  });

  describe("NAT Gateways", () => {
    test("2 NAT Gateways exist", async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: outputs.nat_gateway_ids,
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toHaveLength(2);
    });

    test("NAT Gateways are in available state", async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: outputs.nat_gateway_ids,
      });
      const response = await ec2Client.send(command);

      response.NatGateways!.forEach((nat) => {
        expect(nat.State).toBe("available");
      });
    });

    test("NAT Gateways are in first two public subnets", async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: outputs.nat_gateway_ids,
      });
      const response = await ec2Client.send(command);

      const natSubnetIds = response.NatGateways!.map((nat) => nat.SubnetId).sort();
      const firstTwoPublicSubnets = outputs.public_subnet_ids.slice(0, 2).sort();
      expect(natSubnetIds).toEqual(firstTwoPublicSubnets);
    });

    test("NAT Gateways have Elastic IPs attached", async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: outputs.nat_gateway_ids,
      });
      const response = await ec2Client.send(command);

      response.NatGateways!.forEach((nat) => {
        expect(nat.NatGatewayAddresses).toHaveLength(1);
        expect(nat.NatGatewayAddresses![0].AllocationId).toBeTruthy();
        expect(nat.NatGatewayAddresses![0].PublicIp).toBeTruthy();
      });
    });

    test("NAT Gateway Elastic IPs match outputs", async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: outputs.nat_gateway_ids,
      });
      const response = await ec2Client.send(command);

      const natPublicIps = response.NatGateways!.map((nat) => nat.NatGatewayAddresses![0].PublicIp).sort();
      const expectedIps = outputs.nat_gateway_eips.sort();
      expect(natPublicIps).toEqual(expectedIps);
    });

    test("NAT Gateways have correct tags", async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: outputs.nat_gateway_ids,
      });
      const response = await ec2Client.send(command);

      response.NatGateways!.forEach((nat) => {
        const tags = nat.Tags || [];
        const nameTag = tags.find((t) => t.Key === "Name");

        expect(nameTag?.Value).toContain("nat-gateway");
        expect(nameTag?.Value).toContain("synth101000913");
      });
    });
  });

  describe("Elastic IPs", () => {
    test("2 Elastic IPs exist for NAT Gateways", async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: outputs.nat_gateway_ids,
      });
      const response = await ec2Client.send(command);

      const allocationIds = response.NatGateways!.map((nat) => nat.NatGatewayAddresses![0].AllocationId!);

      const eipCommand = new DescribeAddressesCommand({
        AllocationIds: allocationIds,
      });
      const eipResponse = await ec2Client.send(eipCommand);

      expect(eipResponse.Addresses).toHaveLength(2);
    });

    test("Elastic IPs are associated with NAT Gateways", async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: outputs.nat_gateway_ids,
      });
      const response = await ec2Client.send(command);

      const allocationIds = response.NatGateways!.map((nat) => nat.NatGatewayAddresses![0].AllocationId!);

      const eipCommand = new DescribeAddressesCommand({
        AllocationIds: allocationIds,
      });
      const eipResponse = await ec2Client.send(eipCommand);

      eipResponse.Addresses!.forEach((eip) => {
        expect(eip.AssociationId).toBeTruthy();
        expect(eip.Domain).toBe("vpc");
      });
    });

    test("Elastic IPs have correct tags", async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: outputs.nat_gateway_ids,
      });
      const response = await ec2Client.send(command);

      const allocationIds = response.NatGateways!.map((nat) => nat.NatGatewayAddresses![0].AllocationId!);

      const eipCommand = new DescribeAddressesCommand({
        AllocationIds: allocationIds,
      });
      const eipResponse = await ec2Client.send(eipCommand);

      eipResponse.Addresses!.forEach((eip) => {
        const tags = eip.Tags || [];
        const nameTag = tags.find((t) => t.Key === "Name");

        expect(nameTag?.Value).toContain("nat-eip");
        expect(nameTag?.Value).toContain("synth101000913");
      });
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

    test("Public route table is associated with all public subnets", async () => {
      const command = new DescribeRouteTablesCommand({
        RouteTableIds: [outputs.public_route_table_id],
      });
      const response = await ec2Client.send(command);

      const rt = response.RouteTables![0];
      const associatedSubnets = rt.Associations!.filter((a) => a.SubnetId).map((a) => a.SubnetId).sort();
      const expectedSubnets = outputs.public_subnet_ids.sort();

      expect(associatedSubnets).toEqual(expectedSubnets);
    });

    test("3 private route tables exist", async () => {
      const command = new DescribeRouteTablesCommand({
        RouteTableIds: outputs.private_route_table_ids,
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables).toHaveLength(3);
    });

    test("Private route tables have routes to NAT Gateways", async () => {
      const command = new DescribeRouteTablesCommand({
        RouteTableIds: outputs.private_route_table_ids,
      });
      const response = await ec2Client.send(command);

      response.RouteTables!.forEach((rt) => {
        const natRoute = rt.Routes!.find((r) => r.NatGatewayId?.startsWith("nat-"));

        expect(natRoute).toBeTruthy();
        expect(natRoute!.DestinationCidrBlock).toBe("0.0.0.0/0");
        expect(natRoute!.State).toBe("active");
        expect(outputs.nat_gateway_ids).toContain(natRoute!.NatGatewayId);
      });
    });

    test("Private route tables are associated with private subnets", async () => {
      const command = new DescribeRouteTablesCommand({
        RouteTableIds: outputs.private_route_table_ids,
      });
      const response = await ec2Client.send(command);

      const associatedSubnets = response.RouteTables!.flatMap((rt) =>
        rt.Associations!.filter((a) => a.SubnetId).map((a) => a.SubnetId)
      ).sort();
      const expectedSubnets = outputs.private_subnet_ids.sort();

      expect(associatedSubnets).toEqual(expectedSubnets);
    });

    test("First two private route tables route to respective NAT Gateways", async () => {
      const command = new DescribeRouteTablesCommand({
        RouteTableIds: outputs.private_route_table_ids.slice(0, 2),
      });
      const response = await ec2Client.send(command);

      const natGatewayIds = response.RouteTables!.map((rt) => {
        const natRoute = rt.Routes!.find((r) => r.NatGatewayId?.startsWith("nat-"));
        return natRoute!.NatGatewayId;
      }).sort();

      const expectedNatIds = outputs.nat_gateway_ids.sort();
      expect(natGatewayIds).toEqual(expectedNatIds);
    });

    test("Third private route table routes to second NAT Gateway", async () => {
      const command = new DescribeRouteTablesCommand({
        RouteTableIds: [outputs.private_route_table_ids[2]],
      });
      const response = await ec2Client.send(command);

      const rt = response.RouteTables![0];
      const natRoute = rt.Routes!.find((r) => r.NatGatewayId?.startsWith("nat-"));

      expect(natRoute!.NatGatewayId).toBe(outputs.nat_gateway_ids[1]);
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
      expect(nameTag?.Value).toContain("synth101000913");
    });
  });

  describe("High Availability Architecture", () => {
    test("Public and private subnets are in same availability zones", async () => {
      const publicCommand = new DescribeSubnetsCommand({
        SubnetIds: outputs.public_subnet_ids,
      });
      const publicResponse = await ec2Client.send(publicCommand);

      const privateCommand = new DescribeSubnetsCommand({
        SubnetIds: outputs.private_subnet_ids,
      });
      const privateResponse = await ec2Client.send(privateCommand);

      const publicAzs = publicResponse.Subnets!.map((s) => s.AvailabilityZone).sort();
      const privateAzs = privateResponse.Subnets!.map((s) => s.AvailabilityZone).sort();

      expect(publicAzs).toEqual(privateAzs);
    });

    test("Resources span exactly 3 availability zones", async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [...outputs.public_subnet_ids, ...outputs.private_subnet_ids],
      });
      const response = await ec2Client.send(command);

      const azs = response.Subnets!.map((s) => s.AvailabilityZone);
      const uniqueAzs = new Set(azs);
      expect(uniqueAzs.size).toBe(3);
    });

    test("NAT Gateways provide redundancy across 2 availability zones", async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: outputs.nat_gateway_ids,
      });
      const response = await ec2Client.send(command);

      const natAzs = response.NatGateways!.map((nat) => nat.SubnetId).map((subnetId) => {
        const subnet = outputs.public_subnet_ids.indexOf(subnetId);
        return subnet;
      });

      expect(new Set(natAzs).size).toBe(2);
    });
  });

  describe("Resource Naming Convention", () => {
    test("All resources include environment suffix in names", async () => {
      const vpcCommand = new DescribeVpcsCommand({ VpcIds: [outputs.vpc_id] });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcName = vpcResponse.Vpcs![0].Tags?.find((t) => t.Key === "Name")?.Value;
      expect(vpcName).toContain("synth101000913");

      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: [...outputs.public_subnet_ids, ...outputs.private_subnet_ids],
      });
      const subnetResponse = await ec2Client.send(subnetCommand);
      subnetResponse.Subnets!.forEach((subnet) => {
        const name = subnet.Tags?.find((t) => t.Key === "Name")?.Value;
        expect(name).toContain("synth101000913");
      });

      const igwCommand = new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [outputs.internet_gateway_id],
      });
      const igwResponse = await ec2Client.send(igwCommand);
      const igwName = igwResponse.InternetGateways![0].Tags?.find((t) => t.Key === "Name")?.Value;
      expect(igwName).toContain("synth101000913");
    });
  });
});
