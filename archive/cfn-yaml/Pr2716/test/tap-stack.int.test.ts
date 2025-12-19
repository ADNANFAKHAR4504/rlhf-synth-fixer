import {
  DescribeAddressesCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client,
} from "@aws-sdk/client-ec2";
import {
  GetInstanceProfileCommand,
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
} from "@aws-sdk/client-iam";
import fs from "fs";
import path from "path";

const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";

const ec2 = new EC2Client({ region });
const iam = new IAMClient({ region });

// Load CloudFormation flat outputs
const outputs: Record<string, string> = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../cfn-outputs/flat-outputs.json"), "utf8")
);

describe("TapStack Infrastructure Integration Tests", () => {
  describe("CloudFormation Outputs", () => {
    test("should have required stack outputs", () => {
      const keys = [
        "VPCId",
        "PublicSubnet1Id",
        "PublicSubnet2Id",
        "PrivateSubnet1Id",
        "PrivateSubnet2Id",
        "WebSecurityGroupId",
        "EC2InstanceProfileArn",
        "NatGatewayId",
        "InternetGatewayId",
      ];
      keys.forEach((key) => {
        expect(outputs[key]).toBeDefined();
        expect(outputs[key]).not.toBe("");
      });
    });
  });

  describe("VPC", () => {
    test("should exist in region with DNS enabled", async () => {
      const vpcId = outputs.VPCId;
      try {
        const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
        expect(res.Vpcs?.length).toBe(1);
        const vpc = res.Vpcs?.[0];
        expect(vpc?.VpcId).toBe(vpcId);

        const dnsHostnames = await ec2.send(
          new DescribeVpcAttributeCommand({
            VpcId: vpcId,
            Attribute: "enableDnsHostnames",
          })
        );
        expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);

        const dnsSupport = await ec2.send(
          new DescribeVpcAttributeCommand({
            VpcId: vpcId,
            Attribute: "enableDnsSupport",
          })
        );
        expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);
      } catch (error) {
        throw new Error(`VPC test failed: ${error}`);
      }
    });
  });

  describe("Subnets", () => {
    test("should have 4 subnets (2 public, 2 private) in the VPC", async () => {
      const vpcId = outputs.VPCId;
      try {
        const res = await ec2.send(
          new DescribeSubnetsCommand({
            Filters: [{ Name: "vpc-id", Values: [vpcId] }],
          })
        );
        expect(res.Subnets?.length).toBe(4);

        const subnetIds = res.Subnets?.map((s) => s.SubnetId) || [];
        expect(subnetIds).toContain(outputs.PublicSubnet1Id);
        expect(subnetIds).toContain(outputs.PublicSubnet2Id);
        expect(subnetIds).toContain(outputs.PrivateSubnet1Id);
        expect(subnetIds).toContain(outputs.PrivateSubnet2Id);

        const publicSubnets = res.Subnets?.filter((s) => s.MapPublicIpOnLaunch) || [];
        const privateSubnets = res.Subnets?.filter((s) => !s.MapPublicIpOnLaunch) || [];
        expect(publicSubnets.length).toBe(2);
        expect(privateSubnets.length).toBe(2);

        publicSubnets.forEach((subnet) => {
          expect([outputs.PublicSubnet1Id, outputs.PublicSubnet2Id]).toContain(subnet.SubnetId);
        });
        privateSubnets.forEach((subnet) => {
          expect([outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id]).toContain(subnet.SubnetId);
        });
      } catch (error) {
        throw new Error(`Subnets test failed: ${error}`);
      }
    });
  });

  describe("Internet Gateway", () => {
    test("should exist and be attached to the VPC", async () => {
      const igwId = outputs.InternetGatewayId;
      const vpcId = outputs.VPCId;
      try {
        const res = await ec2.send(
          new DescribeInternetGatewaysCommand({
            InternetGatewayIds: [igwId],
          })
        );
        expect(res.InternetGateways?.length).toBe(1);
        const igw = res.InternetGateways?.[0];
        expect(igw?.InternetGatewayId).toBe(igwId);
        expect(igw?.Attachments?.[0]?.VpcId).toBe(vpcId);
        expect(igw?.Attachments?.[0]?.State).toBe("available");
      } catch (error) {
        throw new Error(`Internet Gateway test failed: ${error}`);
      }
    });
  });

  describe("NAT Gateway", () => {
    test("should exist in a public subnet with an Elastic IP", async () => {
      const natId = outputs.NatGatewayId;
      const publicSubnet1Id = outputs.PublicSubnet1Id;
      try {
        const res = await ec2.send(
          new DescribeNatGatewaysCommand({
            NatGatewayIds: [natId],
          })
        );
        expect(res.NatGateways?.length).toBe(1);
        const nat = res.NatGateways?.[0];
        expect(nat?.NatGatewayId).toBe(natId);
        expect(nat?.SubnetId).toBe(publicSubnet1Id);
        expect(nat?.State).toBe("available");

        const eipAllocationId = nat?.NatGatewayAddresses?.[0]?.AllocationId;
        expect(eipAllocationId).toBeDefined();
        const eipRes = await ec2.send(
          new DescribeAddressesCommand({
            AllocationIds: [eipAllocationId!],
          })
        );
        expect(eipRes.Addresses?.length).toBe(1);
        expect(eipRes.Addresses?.[0]?.Domain).toBe("vpc");
      } catch (error) {
        throw new Error(`NAT Gateway test failed: ${error}`);
      }
    });
  });

  describe("Security Group", () => {
    test("should have security group with SSH and HTTP ingress and all egress", async () => {
      const sgId = outputs.WebSecurityGroupId;
      const vpcId = outputs.VPCId;
      try {
        const res = await ec2.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [sgId],
          })
        );
        expect(res.SecurityGroups?.length).toBe(1);
        const sg = res.SecurityGroups?.[0];
        expect(sg?.GroupId).toBe(sgId);
        expect(sg?.VpcId).toBe(vpcId);

        const ingress = sg?.IpPermissions || [];
        expect(ingress.length).toBe(2);
        expect(ingress).toContainEqual(
          expect.objectContaining({
            IpProtocol: "tcp",
            FromPort: 22,
            ToPort: 22,
            IpRanges: expect.arrayContaining([{ CidrIp: "0.0.0.0/0", Description: "SSH access" }]),
          })
        );
        expect(ingress).toContainEqual(
          expect.objectContaining({
            IpProtocol: "tcp",
            FromPort: 80,
            ToPort: 80,
            IpRanges: expect.arrayContaining([{ CidrIp: "0.0.0.0/0", Description: "HTTP access" }]),
          })
        );

        const egress = sg?.IpPermissionsEgress || [];
        expect(egress.length).toBe(1);
        expect(egress).toContainEqual(
          expect.objectContaining({
            IpProtocol: "-1",
            IpRanges: expect.arrayContaining([{ CidrIp: "0.0.0.0/0", Description: "All outbound traffic" }]),
          })
        );
      } catch (error) {
        throw new Error(`Security Group test failed: ${error}`);
      }
    });
  });

  describe("Route Tables", () => {
    test("should have public and private route tables with correct routes and associations", async () => {
      const vpcId = outputs.VPCId;
      try {
        const res = await ec2.send(
          new DescribeRouteTablesCommand({
            Filters: [{ Name: "vpc-id", Values: [vpcId] }],
          })
        );

        // Identify public route table by route to Internet Gateway
        const publicRouteTable = res.RouteTables?.find((rt) =>
          rt.Routes?.some((r) => r.GatewayId === outputs.InternetGatewayId && r.DestinationCidrBlock === "0.0.0.0/0")
        );
        expect(publicRouteTable).toBeDefined();
        expect(publicRouteTable?.Associations?.length).toBe(2);
        const publicSubnetIds = [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id];
        publicRouteTable?.Associations?.forEach((assoc) => {
          expect(publicSubnetIds).toContain(assoc.SubnetId);
        });

        // Identify private route table by route to NAT Gateway
        const privateRouteTable = res.RouteTables?.find((rt) =>
          rt.Routes?.some((r) => r.NatGatewayId === outputs.NatGatewayId && r.DestinationCidrBlock === "0.0.0.0/0")
        );
        expect(privateRouteTable).toBeDefined();
        expect(privateRouteTable?.Associations?.length).toBe(2);
        const privateSubnetIds = [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id];
        privateRouteTable?.Associations?.forEach((assoc) => {
          expect(privateSubnetIds).toContain(assoc.SubnetId);
        });

        // Check that other route tables (e.g., main) have no conflicting routes
        const otherRouteTables = res.RouteTables?.filter(
          (rt) => rt.RouteTableId !== publicRouteTable?.RouteTableId && rt.RouteTableId !== privateRouteTable?.RouteTableId
        );
        otherRouteTables?.forEach((rt) => {
          const internetRoutes = rt.Routes?.filter(
            (r) => r.DestinationCidrBlock === "0.0.0.0/0" && (r.GatewayId || r.NatGatewayId)
          );
          expect(internetRoutes?.length).toBe(0); // No unexpected internet routes
        });
      } catch (error) {
        throw new Error(`Route Tables test failed: ${error}`);
      }
    });
  });

  describe("Tagging", () => {
    test("should have Environment and Name tags on taggable resources", async () => {
      const vpcId = outputs.VPCId;
      const subnetIds = [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id, outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id];
      const igwId = outputs.InternetGatewayId;
      const natId = outputs.NatGatewayId;
      const sgId = outputs.WebSecurityGroupId;

      try {
        // VPC Tags
        const vpcRes = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
        const vpcTags = vpcRes.Vpcs?.[0]?.Tags || [];
        expect(vpcTags).toContainEqual(expect.objectContaining({ Key: "Environment" }));
        expect(vpcTags).toContainEqual(expect.objectContaining({ Key: "Name" }));

        // Subnet Tags
        const subnetRes = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));
        subnetRes.Subnets?.forEach((subnet) => {
          const tags = subnet.Tags || [];
          expect(tags).toContainEqual(expect.objectContaining({ Key: "Environment" }));
          expect(tags).toContainEqual(expect.objectContaining({ Key: "Name" }));
        });

        // Internet Gateway Tags
        const igwRes = await ec2.send(new DescribeInternetGatewaysCommand({ InternetGatewayIds: [igwId] }));
        const igwTags = igwRes.InternetGateways?.[0]?.Tags || [];
        expect(igwTags).toContainEqual(expect.objectContaining({ Key: "Environment" }));
        expect(igwTags).toContainEqual(expect.objectContaining({ Key: "Name" }));

        // NAT Gateway Tags
        const natRes = await ec2.send(new DescribeNatGatewaysCommand({ NatGatewayIds: [natId] }));
        const natTags = natRes.NatGateways?.[0]?.Tags || [];
        expect(natTags).toContainEqual(expect.objectContaining({ Key: "Environment" }));
        expect(natTags).toContainEqual(expect.objectContaining({ Key: "Name" }));

        // Security Group Tags
        const sgRes = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [sgId] }));
        const sgTags = sgRes.SecurityGroups?.[0]?.Tags || [];
        expect(sgTags).toContainEqual(expect.objectContaining({ Key: "Environment" }));
        expect(sgTags).toContainEqual(expect.objectContaining({ Key: "Name" }));

        // IAM Role Tags
        const profileArn = outputs.EC2InstanceProfileArn;
        const profileName = profileArn.split("/").pop();
        const profileRes = await iam.send(new GetInstanceProfileCommand({ InstanceProfileName: profileName }));
        const roleName = profileRes.InstanceProfile?.Roles?.[0]?.Arn?.split("/").pop();
        const roleRes = await iam.send(new GetRoleCommand({ RoleName: roleName }));
        const roleTags = roleRes.Role?.Tags || [];
        expect(roleTags).toContainEqual(expect.objectContaining({ Key: "Environment" }));
        expect(roleTags).toContainEqual(expect.objectContaining({ Key: "Name" }));
      } catch (error) {
        throw new Error(`Tagging test failed: ${error}`);
      }
    });
  });

  describe("IAM Role and Instance Profile", () => {
    test("should have a role with S3 read-only access", async () => {
      const profileArn = outputs.EC2InstanceProfileArn;
      const profileName = profileArn.split("/").pop();
      try {
        const profileRes = await iam.send(
          new GetInstanceProfileCommand({ InstanceProfileName: profileName })
        );
        expect(profileRes.InstanceProfile?.InstanceProfileName).toBe(profileName);
        expect(profileRes.InstanceProfile?.Arn).toBe(profileArn);
        expect(profileRes.InstanceProfile?.Roles?.length).toBe(1);

        const roleArn = profileRes.InstanceProfile?.Roles?.[0]?.Arn;
        const roleName = roleArn?.split("/").pop();
        const roleRes = await iam.send(
          new GetRoleCommand({ RoleName: roleName })
        );
        expect(roleRes.Role?.RoleName).toBe(roleName);
        expect(roleRes.Role?.Arn).toBe(roleArn);
        expect(JSON.parse(decodeURIComponent(roleRes.Role?.AssumeRolePolicyDocument || ""))).toMatchObject({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: { Service: "ec2.amazonaws.com" },
              Action: "sts:AssumeRole",
            },
          ],
        });

        const policyRes = await iam.send(
          new ListAttachedRolePoliciesCommand({ RoleName: roleName })
        );
        expect(policyRes.AttachedPolicies).toContainEqual(
          expect.objectContaining({
            PolicyArn: "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess",
          })
        );
      } catch (error) {
        throw new Error(`IAM Role test failed: ${error}`);
      }
    });

    test("should have an instance profile referencing the role", async () => {
      const profileArn = outputs.EC2InstanceProfileArn;
      const profileName = profileArn.split("/").pop();
      try {
        const res = await iam.send(
          new GetInstanceProfileCommand({ InstanceProfileName: profileName })
        );
        expect(res.InstanceProfile?.InstanceProfileName).toBe(profileName);
        expect(res.InstanceProfile?.Arn).toBe(profileArn);
        expect(res.InstanceProfile?.Roles?.length).toBe(1);
        expect(res.InstanceProfile?.Roles?.[0]?.Arn).toBeDefined();
      } catch (error) {
        throw new Error(`Instance Profile test failed: ${error}`);
      }
    });
  });
});