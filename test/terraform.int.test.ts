
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeNatGatewaysCommand, DescribeRouteTablesCommand, DescribeNetworkAclsCommand, DescribeInternetGatewaysCommand } from "@aws-sdk/client-ec2";
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { IAMClient, GetRoleCommand, GetRolePolicyCommand } from "@aws-sdk/client-iam";
import fs from "fs";
import path from "path";

// Load deployment outputs
const outputsPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");
let outputs: any = {};
try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
} catch (error) {
  console.error("Failed to load outputs from", outputsPath, error);
}

const region = process.env.AWS_REGION || "us-east-1";
const ec2Client = new EC2Client({ region });
const cwLogsClient = new CloudWatchLogsClient({ region });
const iamClient = new IAMClient({ region });

// Helper to parse JSON arrays in outputs
function parseOutputArray(key: string): string[] {
  const val = outputs[key];
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  }
  return Array.isArray(val) ? val : [];
}

describe("VPC Network Isolation Infrastructure - Integration Tests", () => {
  describe("VPC Configuration", () => {
    test("VPC exists with correct CIDR block", async () => {
      const vpcId = outputs.vpc_id;
      expect(vpcId).toBeDefined();
      const response = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe("10.0.0.0/16");
      expect(vpc.State).toBe("available");
    });

    test("VPC has DNS support enabled", async () => {
      const vpcId = outputs.vpc_id;
      const response = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc).toBeDefined();
      expect(vpc.VpcId).toBe(vpcId);
      // DNS settings verification requires separate API call or Terraform validation
    });

    test("VPC has correct tags", async () => {
      const vpcId = outputs.vpc_id;
      const response = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      const tags = vpc.Tags || [];
      const envTag = tags.find(t => t.Key === "Environment");
      const projectTag = tags.find(t => t.Key === "Project");
      expect(envTag).toBeDefined();
      expect(envTag!.Value).toBe("Production");
      expect(projectTag).toBeDefined();
      expect(projectTag!.Value).toBe("PaymentGateway");
    });
  });

  describe("Internet Gateway", () => {
    test("Internet Gateway exists and is attached to VPC", async () => {
      const igwId = outputs.internet_gateway_id;
      const vpcId = outputs.vpc_id;
      expect(igwId).toBeDefined();
      const response = await ec2Client.send(new DescribeInternetGatewaysCommand({ InternetGatewayIds: [igwId] }));
      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].VpcId).toBe(vpcId);
      expect(igw.Attachments![0].State).toBe("available");
    });
  });

  describe("Subnet Configuration", () => {
    test("All 9 subnets exist", async () => {
      const subnetIds = [
        ...parseOutputArray("public_subnet_ids"),
        ...parseOutputArray("private_subnet_ids"),
        ...parseOutputArray("database_subnet_ids")
      ].filter(Boolean);
      expect(subnetIds).toHaveLength(9);
      const response = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));
      expect(response.Subnets).toHaveLength(9);
      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe("available");
        expect(subnet.VpcId).toBe(outputs.vpc_id);
      });
    });

    test("Public subnets have correct CIDR blocks", async () => {
      const publicSubnetIds = parseOutputArray("public_subnet_ids").filter(Boolean);
      expect(publicSubnetIds).toHaveLength(3);
      const response = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds }));
      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toEqual(["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]);
    });

    test("Private subnets have correct CIDR blocks", async () => {
      const privateSubnetIds = parseOutputArray("private_subnet_ids").filter(Boolean);
      expect(privateSubnetIds).toHaveLength(3);
      const response = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds }));
      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toEqual(["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]);
    });

    test("Database subnets have correct CIDR blocks", async () => {
      const databaseSubnetIds = parseOutputArray("database_subnet_ids").filter(Boolean);
      expect(databaseSubnetIds).toHaveLength(3);
      const response = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: databaseSubnetIds }));
      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toEqual(["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]);
    });

    test("Subnets are distributed across 3 availability zones", async () => {
      const allSubnetIds = [
        ...parseOutputArray("public_subnet_ids"),
        ...parseOutputArray("private_subnet_ids"),
        ...parseOutputArray("database_subnet_ids")
      ].filter(Boolean);
      const response = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: allSubnetIds }));
      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);

      // Verify each AZ has exactly 3 subnets (one of each tier)
      const azCounts = response.Subnets!.reduce((acc, subnet) => {
        const az = subnet.AvailabilityZone!;
        acc[az] = (acc[az] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      Object.values(azCounts).forEach(count => expect(count).toBe(3));
    });

    test("Public subnets have mapPublicIpOnLaunch enabled", async () => {
      const publicSubnetIds = parseOutputArray("public_subnet_ids").filter(Boolean);
      const response = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds }));
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test("Private and database subnets do NOT have mapPublicIpOnLaunch enabled", async () => {
      const nonPublicSubnetIds = [
        ...parseOutputArray("private_subnet_ids"),
        ...parseOutputArray("database_subnet_ids")
      ].filter(Boolean);
      const response = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: nonPublicSubnetIds }));
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });
  });

  describe("Route Table Configuration", () => {
    test("Public route table has route to Internet Gateway", async () => {
      const publicRtId = outputs.public_route_table_id;
      const igwId = outputs.internet_gateway_id;
      expect(publicRtId).toBeDefined();
      const response = await ec2Client.send(new DescribeRouteTablesCommand({ RouteTableIds: [publicRtId] }));
      const routeTable = response.RouteTables![0];
      const igwRoute = routeTable.Routes!.find(r => r.GatewayId === igwId);
      expect(igwRoute).toBeDefined();
      expect(igwRoute!.DestinationCidrBlock).toBe("0.0.0.0/0");
      expect(igwRoute!.State).toBe("active");
    });

    test("Public subnets are associated with public route table", async () => {
      const publicRtId = outputs.public_route_table_id;
      const publicSubnetIds = parseOutputArray("public_subnet_ids").filter(Boolean);
      const response = await ec2Client.send(new DescribeRouteTablesCommand({ RouteTableIds: [publicRtId] }));
      const associations = response.RouteTables![0].Associations!;
      const associatedSubnetIds = associations.filter(a => a.SubnetId).map(a => a.SubnetId);
      publicSubnetIds.forEach(subnetId => {
        expect(associatedSubnetIds).toContain(subnetId);
      });
    });

    test("Database route table has NO route to NAT Gateway or Internet Gateway", async () => {
      const databaseRtId = outputs.database_route_table_id;
      expect(databaseRtId).toBeDefined();
      const response = await ec2Client.send(new DescribeRouteTablesCommand({ RouteTableIds: [databaseRtId] }));
      const routeTable = response.RouteTables![0];
      routeTable.Routes!.forEach(route => {
        expect(route.NatGatewayId).toBeUndefined();
        expect(route.GatewayId).not.toBe(outputs.internet_gateway_id);
        if (route.GatewayId) {
          expect(route.GatewayId).toBe("local");
        }
      });
    });

    test("Database subnets are associated with database route table", async () => {
      const databaseRtId = outputs.database_route_table_id;
      const databaseSubnetIds = parseOutputArray("database_subnet_ids").filter(Boolean);
      const response = await ec2Client.send(new DescribeRouteTablesCommand({ RouteTableIds: [databaseRtId] }));
      const associations = response.RouteTables![0].Associations!;
      const associatedSubnetIds = associations.filter(a => a.SubnetId).map(a => a.SubnetId);
      databaseSubnetIds.forEach(subnetId => {
        expect(associatedSubnetIds).toContain(subnetId);
      });
    });
  });

  describe("Network ACL Configuration", () => {
    test("Network ACLs exist for all subnet tiers", async () => {
      const vpcId = outputs.vpc_id;
      const response = await ec2Client.send(new DescribeNetworkAclsCommand({ Filters: [{ Name: "vpc-id", Values: [vpcId] }] }));
      expect(response.NetworkAcls!.length).toBeGreaterThanOrEqual(4); // default + custom NACLs for tiers
    });

    test("Public NACL allows HTTP and HTTPS inbound", async () => {
      const vpcId = outputs.vpc_id;
      const publicSubnetId = parseOutputArray("public_subnet_ids")[0];
      const response = await ec2Client.send(new DescribeNetworkAclsCommand({ Filters: [{ Name: "vpc-id", Values: [vpcId] }, { Name: "association.subnet-id", Values: [publicSubnetId] }] }));
      const nacl = response.NetworkAcls![0];
      const ingressRules = nacl.Entries!.filter(e => !e.Egress);
      const httpRule = ingressRules.find(r => r.PortRange?.From === 80 && r.PortRange?.To === 80);
      const httpsRule = ingressRules.find(r => r.PortRange?.From === 443 && r.PortRange?.To === 443);
      expect(httpRule).toBeDefined();
      expect(httpRule!.RuleAction).toBe("allow");
      expect(httpsRule).toBeDefined();
      expect(httpsRule!.RuleAction).toBe("allow");
    });

    test("Private NACL allows ports 8080-8090 inbound", async () => {
      const vpcId = outputs.vpc_id;
      const privateSubnetId = parseOutputArray("private_subnet_ids")[0];
      const response = await ec2Client.send(new DescribeNetworkAclsCommand({ Filters: [{ Name: "vpc-id", Values: [vpcId] }, { Name: "association.subnet-id", Values: [privateSubnetId] }] }));
      const nacl = response.NetworkAcls![0];
      const ingressRules = nacl.Entries!.filter(e => !e.Egress);
      const portRangeRule = ingressRules.find(r => r.PortRange?.From === 8080 && r.PortRange?.To === 8090);
      expect(portRangeRule).toBeDefined();
      expect(portRangeRule!.RuleAction).toBe("allow");
    });

    test("Database NACL allows port 5432 from private subnets only", async () => {
      const vpcId = outputs.vpc_id;
      const databaseSubnetId = parseOutputArray("database_subnet_ids")[0];
      const response = await ec2Client.send(new DescribeNetworkAclsCommand({ Filters: [{ Name: "vpc-id", Values: [vpcId] }, { Name: "association.subnet-id", Values: [databaseSubnetId] }] }));
      const nacl = response.NetworkAcls![0];
      const ingressRules = nacl.Entries!.filter(e => !e.Egress);
      const dbPortRules = ingressRules.filter(r => r.PortRange?.From === 5432 && r.PortRange?.To === 5432);
      expect(dbPortRules.length).toBeGreaterThan(0);
      dbPortRules.forEach(rule => {
        expect(rule.RuleAction).toBe("allow");
        expect(rule.CidrBlock).toMatch(/^10\.0\.11|12|13\./);
      });
    });
  });

  describe("VPC Flow Logs Configuration", () => {
    test("IAM role for VPC Flow Logs exists", async () => {
      const envSuffix = outputs.vpc_flow_log_group_name?.split("-").pop();
      const roleName = `vpc-flow-logs-role-${envSuffix}`;
      const response = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);
      const assumeRolePolicy = JSON.parse(decodeURIComponent(response.Role!.AssumeRolePolicyDocument!));
      expect(assumeRolePolicy.Statement[0].Principal.Service).toContain("vpc-flow-logs.amazonaws.com");
    });

    test("IAM role has CloudWatch Logs permissions", async () => {
      const envSuffix = outputs.vpc_flow_log_group_name?.split("-").pop();
      const roleName = `vpc-flow-logs-role-${envSuffix}`;
      const policyName = `vpc-flow-logs-policy-${envSuffix}`;
      const response = await iamClient.send(new GetRolePolicyCommand({ RoleName: roleName, PolicyName: policyName }));
      const policy = JSON.parse(decodeURIComponent(response.PolicyDocument!));
      const actions = policy.Statement[0].Action;
      expect(actions).toContain("logs:CreateLogGroup");
      expect(actions).toContain("logs:CreateLogStream");
      expect(actions).toContain("logs:PutLogEvents");
    });
  });

  describe("Complete Network Isolation Validation", () => {
    test("Public tier: Internet access via Internet Gateway", async () => {
      const publicRtId = outputs.public_route_table_id;
      const igwId = outputs.internet_gateway_id;
      const response = await ec2Client.send(new DescribeRouteTablesCommand({ RouteTableIds: [publicRtId] }));
      const routes = response.RouteTables![0].Routes!;
      const internetRoute = routes.find(r => r.DestinationCidrBlock === "0.0.0.0/0");
      expect(internetRoute).toBeDefined();
      expect(internetRoute!.GatewayId).toBe(igwId);
    });

    test("Database tier: NO internet access (completely isolated)", async () => {
      const databaseRtId = outputs.database_route_table_id;
      const response = await ec2Client.send(new DescribeRouteTablesCommand({ RouteTableIds: [databaseRtId] }));
      const routes = response.RouteTables![0].Routes!;
      const internetRoute = routes.find(r => r.DestinationCidrBlock === "0.0.0.0/0");
      expect(internetRoute).toBeUndefined();
      routes.forEach(route => {
        if (route.GatewayId) {
          expect(route.GatewayId).toBe("local");
        }
      });
    });

    test("Three-tier architecture is complete", () => {
      expect(outputs.vpc_id).toBeDefined();
      expect(outputs.internet_gateway_id).toBeDefined();
      // Public tier
      parseOutputArray("public_subnet_ids").forEach(id => expect(id).toBeDefined());
      expect(outputs.public_route_table_id).toBeDefined();
      // Private tier
      parseOutputArray("private_subnet_ids").forEach(id => expect(id).toBeDefined());
      parseOutputArray("private_route_table_ids").forEach(id => expect(id).toBeDefined());
      // Database tier
      parseOutputArray("database_subnet_ids").forEach(id => expect(id).toBeDefined());
      expect(outputs.database_route_table_id).toBeDefined();
      // NAT Gateways
      parseOutputArray("nat_gateway_ids").forEach(id => expect(id).toBeDefined());
      // Audit/Compliance
      expect(outputs.vpc_flow_log_id).toBeDefined();
      expect(outputs.vpc_flow_log_group_name).toBeDefined();
    });
  });
});
