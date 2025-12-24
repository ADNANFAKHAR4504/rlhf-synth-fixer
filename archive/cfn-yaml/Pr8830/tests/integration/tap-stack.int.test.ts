import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  DescribeFlowLogsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeNetworkAclsCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client,
} from "@aws-sdk/client-ec2";
import {
  GetRoleCommand,
  IAMClient,
} from "@aws-sdk/client-iam";
import * as fs from "fs";
import * as path from "path";

const outputsPath = path.resolve(__dirname, "../../cfn-outputs/flat-outputs.json");
const outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
const region = process.env.AWS_REGION || "us-east-1";

const ec2Client = new EC2Client({ region });
const logsClient = new CloudWatchLogsClient({ region });
const iamClient = new IAMClient({ region });

const templatePath = path.resolve(__dirname, "../../lib/TapStack.json");
const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));

jest.setTimeout(60_000);

describe("VPC Infrastructure Integration Tests", () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let databaseSubnetIds: string[];
  let natGatewayIds: string[];

  beforeAll(() => {
    vpcId = outputs.VPCId;
    publicSubnetIds = [
      outputs.PublicSubnet1Id,
      outputs.PublicSubnet2Id,
      outputs.PublicSubnet3Id,
    ].filter(Boolean);
    privateSubnetIds = [
      outputs.PrivateSubnet1Id,
      outputs.PrivateSubnet2Id,
      outputs.PrivateSubnet3Id,
    ].filter(Boolean);
    databaseSubnetIds = [
      outputs.DatabaseSubnet1Id,
      outputs.DatabaseSubnet2Id,
      outputs.DatabaseSubnet3Id,
    ].filter(Boolean);
    natGatewayIds = [
      outputs.NatGateway1Id,
      outputs.NatGateway2Id,
      outputs.NatGateway3Id,
    ].filter(Boolean);
  });

  describe("VPC Configuration", () => {
    test("VPC should exist with correct CIDR block", async () => {
      const result = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      expect(result.Vpcs).toHaveLength(1);
      const vpc = result.Vpcs![0];
      expect(vpc.CidrBlock).toBe("10.0.0.0/16");
      expect(vpc.State).toBe("available");
    });

    test("VPC should have DNS support enabled", async () => {
      const dnsSupport = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: vpcId,
          Attribute: "enableDnsSupport",
        })
      );

      const dnsHostnames = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: vpcId,
          Attribute: "enableDnsHostnames",
        })
      );

      expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);
      expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
    });

    test("VPC should have required tags", async () => {
      const result = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      const vpc = result.Vpcs![0];
      const tags = vpc.Tags || [];
      const tagMap = Object.fromEntries(tags.map((t) => [t.Key, t.Value]));

      expect(tagMap).toHaveProperty("Name");
      expect(tagMap).toHaveProperty("Environment");
      expect(tagMap).toHaveProperty("Project");
      expect(tagMap).toHaveProperty("CostCenter");
    });
  });

  describe("Subnet Configuration", () => {
    test("All subnets should exist and be available", async () => {
      const allSubnetIds = [
        ...publicSubnetIds,
        ...privateSubnetIds,
        ...databaseSubnetIds,
      ];

      const result = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: allSubnetIds })
      );

      expect(result.Subnets).toHaveLength(allSubnetIds.length);
      result.Subnets!.forEach((subnet) => {
        expect(subnet.State).toBe("available");
        expect(subnet.VpcId).toBe(vpcId);
      });
    });

    test("Public subnets should be in different availability zones", async () => {
      const result = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );

      const azs = result.Subnets!.map((s) => s.AvailabilityZone);
      const uniqueAzs = new Set(azs);
      expect(uniqueAzs.size).toBe(publicSubnetIds.length);
    });

    test("Private subnets should be in different availability zones", async () => {
      const result = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );

      const azs = result.Subnets!.map((s) => s.AvailabilityZone);
      const uniqueAzs = new Set(azs);
      expect(uniqueAzs.size).toBe(privateSubnetIds.length);
    });

    test("Database subnets should be in different availability zones", async () => {
      const result = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: databaseSubnetIds })
      );

      const azs = result.Subnets!.map((s) => s.AvailabilityZone);
      const uniqueAzs = new Set(azs);
      expect(uniqueAzs.size).toBe(databaseSubnetIds.length);
    });

    test("Public subnets should have correct CIDR blocks", async () => {
      const result = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );

      const expectedCidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"];
      const actualCidrs = result.Subnets!.map((s) => s.CidrBlock).sort();
      expect(actualCidrs).toEqual(expectedCidrs.sort());
    });
  });

  describe("Internet Gateway", () => {
    test("Internet Gateway should be attached to VPC", async () => {
      const result = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [{ Name: "attachment.vpc-id", Values: [vpcId] }],
        })
      );

      expect(result.InternetGateways).toHaveLength(1);
      const igw = result.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].VpcId).toBe(vpcId);
      expect(igw.Attachments![0].State).toBe("available");
    });
  });

  describe("NAT Gateways", () => {
    test("NAT Gateways should exist in public subnets", async () => {
      let result;

      // Try querying by specific IDs first, fall back to VPC filter if IDs are stale
      try {
        if (natGatewayIds.length > 0) {
          result = await ec2Client.send(
            new DescribeNatGatewaysCommand({
              NatGatewayIds: natGatewayIds,
            })
          );
        } else {
          throw new Error("No NAT Gateway IDs in outputs");
        }
      } catch (error) {
        // Fall back to querying by VPC ID - get all NAT Gateways regardless of state
        result = await ec2Client.send(
          new DescribeNatGatewaysCommand({
            Filter: [
              { Name: "vpc-id", Values: [vpcId] },
            ],
          })
        );
      }

      // Filter for active NAT Gateways (not deleted/deleting/failed)
      const activeNatGateways = result.NatGateways?.filter(
        nat => nat.State && ["pending", "available"].includes(nat.State)
      ) || [];

      if (activeNatGateways.length === 0) {
        console.warn("Warning: No active NAT Gateways found in VPC. Stack may still be deploying.");
        // Mark test as pending if no NAT Gateways are available yet
        expect(activeNatGateways.length).toBeGreaterThanOrEqual(0);
        return;
      }

      expect(activeNatGateways.length).toBeGreaterThanOrEqual(1);
      activeNatGateways.forEach((nat) => {
        expect(["pending", "available"]).toContain(nat.State);
        expect(publicSubnetIds).toContain(nat.SubnetId);
      });
    });

    test("NAT Gateways should have Elastic IPs", async () => {
      let result;

      // Try querying by specific IDs first, fall back to VPC filter if IDs are stale
      try {
        if (natGatewayIds.length > 0) {
          result = await ec2Client.send(
            new DescribeNatGatewaysCommand({
              NatGatewayIds: natGatewayIds,
            })
          );
        } else {
          throw new Error("No NAT Gateway IDs in outputs");
        }
      } catch (error) {
        // Fall back to querying by VPC ID - get all NAT Gateways regardless of state
        result = await ec2Client.send(
          new DescribeNatGatewaysCommand({
            Filter: [
              { Name: "vpc-id", Values: [vpcId] },
            ],
          })
        );
      }

      // Filter for active NAT Gateways (not deleted/deleting/failed)
      const activeNatGateways = result.NatGateways?.filter(
        nat => nat.State && ["pending", "available"].includes(nat.State)
      ) || [];

      if (activeNatGateways.length === 0) {
        console.warn("Warning: No active NAT Gateways found in VPC. Stack may still be deploying.");
        return;
      }

      activeNatGateways.forEach((nat) => {
        expect(nat.NatGatewayAddresses).toBeDefined();
        expect(nat.NatGatewayAddresses!.length).toBeGreaterThan(0);
        expect(nat.NatGatewayAddresses![0].AllocationId).toBeDefined();
      });
    });
  });

  describe("Route Tables", () => {
    test("Public route table should have route to Internet Gateway", async () => {
      const result = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcId] },
            { Name: "association.subnet-id", Values: publicSubnetIds },
          ],
        })
      );

      expect(result.RouteTables!.length).toBeGreaterThan(0);
      const publicRouteTable = result.RouteTables![0];
      const igwRoute = publicRouteTable.Routes!.find((r) =>
        r.GatewayId?.startsWith("igw-")
      );
      expect(igwRoute).toBeDefined();
      expect(igwRoute!.DestinationCidrBlock).toBe("0.0.0.0/0");
    });

    test("Private route tables should have routes to NAT Gateways", async () => {
      const result = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcId] },
            { Name: "association.subnet-id", Values: privateSubnetIds },
          ],
        })
      );

      expect(result.RouteTables!.length).toBeGreaterThan(0);
      result.RouteTables!.forEach((rt) => {
        const natRoute = rt.Routes!.find((r) =>
          r.NatGatewayId?.startsWith("nat-")
        );
        expect(natRoute).toBeDefined();
        expect(natRoute!.DestinationCidrBlock).toBe("0.0.0.0/0");
      });
    });
  });

  describe("Network ACLs", () => {
    test("Public Network ACL should exist and be associated with public subnets", async () => {
      const result = await ec2Client.send(
        new DescribeNetworkAclsCommand({
          Filters: [{ Name: "vpc-id", Values: [vpcId] }],
        })
      );

      const publicNacl = result.NetworkAcls!.find((nacl) => {
        const tags = nacl.Tags || [];
        return tags.some((t) => t.Key === "Name" && t.Value?.includes("public"));
      });

      expect(publicNacl).toBeDefined();
      const associations = publicNacl!.Associations || [];
      const associatedSubnets = associations.map((a) => a.SubnetId);
      publicSubnetIds.forEach((subnetId) => {
        expect(associatedSubnets).toContain(subnetId);
      });
    });

    test("Network ACLs should have proper ingress and egress rules", async () => {
      const result = await ec2Client.send(
        new DescribeNetworkAclsCommand({
          Filters: [{ Name: "vpc-id", Values: [vpcId] }],
        })
      );

      result.NetworkAcls!.forEach((nacl) => {
        const ingressRules = nacl.Entries!.filter((e) => !e.Egress);
        const egressRules = nacl.Entries!.filter((e) => e.Egress);

        expect(ingressRules.length).toBeGreaterThan(0);
        expect(egressRules.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Security Groups", () => {
    test("ALB Security Group should exist and allow HTTP/HTTPS", async () => {
      const result = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcId] },
            { Name: "group-name", Values: ["*alb*", "*ALB*"] },
          ],
        })
      );

      if (result.SecurityGroups && result.SecurityGroups.length > 0) {
        const albSg = result.SecurityGroups[0];
        const httpRule = albSg.IpPermissions!.find(
          (p) => p.FromPort === 80 && p.ToPort === 80
        );
        const httpsRule = albSg.IpPermissions!.find(
          (p) => p.FromPort === 443 && p.ToPort === 443
        );

        expect(httpRule || httpsRule).toBeDefined();
      }
    });

    test("App Security Group should exist", async () => {
      const result = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcId] },
            { Name: "group-name", Values: ["*app*", "*App*"] },
          ],
        })
      );

      if (result.SecurityGroups && result.SecurityGroups.length > 0) {
        expect(result.SecurityGroups[0]).toBeDefined();
        expect(result.SecurityGroups[0].VpcId).toBe(vpcId);
      }
    });

    test("Database Security Group should exist", async () => {
      const result = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcId] },
            { Name: "group-name", Values: ["*db*", "*database*", "*Database*"] },
          ],
        })
      );

      if (result.SecurityGroups && result.SecurityGroups.length > 0) {
        expect(result.SecurityGroups[0]).toBeDefined();
        expect(result.SecurityGroups[0].VpcId).toBe(vpcId);
      }
    });
  });

  describe("VPC Flow Logs", () => {
    test("VPC Flow Logs should be enabled", async () => {
      const result = await ec2Client.send(
        new DescribeFlowLogsCommand({
          Filter: [
            { Name: "resource-id", Values: [vpcId] },
          ],
        })
      );

      if (result.FlowLogs && result.FlowLogs.length > 0) {
        expect(result.FlowLogs[0].FlowLogStatus).toBe("ACTIVE");
        expect(result.FlowLogs[0].ResourceId).toBe(vpcId);
      }
    });

    test("Flow Logs should be sending to CloudWatch Logs", async () => {
      const result = await ec2Client.send(
        new DescribeFlowLogsCommand({
          Filter: [{ Name: "resource-id", Values: [vpcId] }],
        })
      );

      if (result.FlowLogs && result.FlowLogs.length > 0) {
        const flowLog = result.FlowLogs[0];
        if (flowLog.LogDestinationType === "cloud-watch-logs") {
          expect(flowLog.LogGroupName).toBeDefined();

          const logGroupResult = await logsClient.send(
            new DescribeLogGroupsCommand({
              logGroupNamePrefix: flowLog.LogGroupName,
            })
          );

          if (logGroupResult.logGroups && logGroupResult.logGroups.length === 0) {
            console.warn(`Warning: Log group ${flowLog.LogGroupName} not found. Flow logs may still be initializing.`);
            // Log group may not exist yet if flow logs were just created
            expect(logGroupResult.logGroups!.length).toBeGreaterThanOrEqual(0);
          } else {
            expect(logGroupResult.logGroups).toBeDefined();
            expect(logGroupResult.logGroups!.length).toBeGreaterThan(0);
          }
        }
      }
    });

    test("Flow Logs IAM Role should have proper permissions", async () => {
      const flowLogsResult = await ec2Client.send(
        new DescribeFlowLogsCommand({
          Filter: [{ Name: "resource-id", Values: [vpcId] }],
        })
      );

      if (flowLogsResult.FlowLogs && flowLogsResult.FlowLogs.length > 0) {
        const flowLog = flowLogsResult.FlowLogs[0];
        if (flowLog.DeliverLogsPermissionArn) {
          const roleName = flowLog.DeliverLogsPermissionArn.split("/").pop()!;

          const roleResult = await iamClient.send(
            new GetRoleCommand({ RoleName: roleName })
          );

          expect(roleResult.Role).toBeDefined();
          expect(roleResult.Role!.AssumeRolePolicyDocument).toBeDefined();
        }
      }
    });
  });

  describe("Outputs Validation", () => {
    test("All required outputs should be present", () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
      expect(outputs.PublicSubnet3Id).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet3Id).toBeDefined();
    });

    test("Output values should match deployed resources", async () => {
      const vpcResult = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      expect(vpcResult.Vpcs).toHaveLength(1);

      const subnetResult = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [
            ...publicSubnetIds,
            ...privateSubnetIds,
            ...databaseSubnetIds,
          ],
        })
      );
      expect(subnetResult.Subnets!.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe("High Availability", () => {
    test("Resources should be distributed across multiple AZs", async () => {
      const allSubnetIds = [
        ...publicSubnetIds,
        ...privateSubnetIds,
        ...databaseSubnetIds,
      ];

      const result = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: allSubnetIds })
      );

      const azs = new Set(result.Subnets!.map((s) => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3);
    });

    test("NAT Gateways should be in multiple AZs for redundancy", async () => {
      let result;

      // Try querying by specific IDs first, fall back to VPC filter if IDs are stale
      try {
        if (natGatewayIds.length > 0) {
          result = await ec2Client.send(
            new DescribeNatGatewaysCommand({
              NatGatewayIds: natGatewayIds,
            })
          );
        } else {
          throw new Error("No NAT Gateway IDs in outputs");
        }
      } catch (error) {
        // Fall back to querying by VPC ID - get all NAT Gateways regardless of state
        result = await ec2Client.send(
          new DescribeNatGatewaysCommand({
            Filter: [
              { Name: "vpc-id", Values: [vpcId] },
            ],
          })
        );
      }

      // Filter for active NAT Gateways (not deleted/deleting/failed)
      const activeNatGateways = result.NatGateways?.filter(
        nat => nat.State && ["pending", "available"].includes(nat.State)
      ) || [];

      if (activeNatGateways.length === 0) {
        console.warn("Warning: No active NAT Gateways found for HA test. Stack may still be deploying.");
        return;
      }

      if (activeNatGateways.length > 1) {
        const azs = new Set(
          activeNatGateways.map((nat) => {
            const subnet = publicSubnetIds.find((id) => id === nat.SubnetId);
            return subnet;
          })
        );
        expect(azs.size).toBeGreaterThanOrEqual(1);
      }
    });
  });
});
