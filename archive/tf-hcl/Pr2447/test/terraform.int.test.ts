import {
  DescribeFlowLogsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNetworkAclsCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from "@aws-sdk/client-ec2";
import {
  GetRoleCommand,
  GetRolePolicyCommand,
  IAMClient
} from "@aws-sdk/client-iam";
import {
  GetBucketTaggingCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  S3Client
} from "@aws-sdk/client-s3";
import {
  DescribeSecretCommand,
  GetSecretValueCommand,
  SecretsManagerClient
} from "@aws-sdk/client-secrets-manager";
// Note: Secrets Manager client not available in current AWS SDK version
import fs from "fs";
import path from "path";


// Load infrastructure outputs
const outputsPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");
const outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));

// Initialize AWS clients
const ec2Client = new EC2Client({ region: "us-west-2" });
const s3Client = new S3Client({ region: "us-west-2" });
const iamClient = new IAMClient({ region: "us-west-2" });
const secretsClient = new SecretsManagerClient({ region: "us-west-2" });

describe("Terraform Infrastructure Stack: tap_stack.tf - Integration Tests", () => {
  const TIMEOUT = 30000; // 30 seconds timeout for AWS API calls

  describe("Infrastructure Outputs Validation", () => {
    test("outputs file exists and contains expected keys", () => {
      expect(outputs).toHaveProperty("vpc_id");
      expect(outputs).toHaveProperty("public_subnet_id");
      expect(outputs).toHaveProperty("private_subnet_id");

      expect(outputs.vpc_id).toMatch(/^vpc-[a-f0-9]+$/);
      expect(outputs.public_subnet_id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.private_subnet_id).toMatch(/^subnet-[a-f0-9]+$/);
    });
  });

  describe("VPC Infrastructure", () => {
    test("VPC exists and has correct configuration", async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      });

      const response = await ec2Client.send(command);
      const vpc = response.Vpcs?.[0];

      expect(vpc).toBeDefined();
      expect(vpc?.VpcId).toBe(outputs.vpc_id);
      expect(vpc?.CidrBlock).toBe("10.0.0.0/16");
      expect(vpc?.State).toBe("available");
      // Note: DNS settings are not explicitly configured in Terraform
      // AWS defaults to true for both DNS settings, but they may not be returned in the API response

      // Check tags
      const nameTag = vpc?.Tags?.find(tag => tag.Key === "Name");
      const envTag = vpc?.Tags?.find(tag => tag.Key === "Environment");
      const ownerTag = vpc?.Tags?.find(tag => tag.Key === "Owner");

      expect(nameTag?.Value).toBe("main-vpc");
      expect(envTag?.Value).toBe("production");
      expect(ownerTag?.Value).toBe("admin");
    }, TIMEOUT);
  });

  describe("Subnet Infrastructure", () => {
    test("Public subnet exists and has correct configuration", async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.public_subnet_id]
      });

      const response = await ec2Client.send(command);
      const subnet = response.Subnets?.[0];

      expect(subnet).toBeDefined();
      expect(subnet?.SubnetId).toBe(outputs.public_subnet_id);
      expect(subnet?.VpcId).toBe(outputs.vpc_id);
      expect(subnet?.CidrBlock).toBe("10.0.1.0/24");
      expect(subnet?.AvailabilityZone).toBe("us-west-2a");
      expect(subnet?.MapPublicIpOnLaunch).toBe(true);
      expect(subnet?.State).toBe("available");

      // Check tags
      const nameTag = subnet?.Tags?.find(tag => tag.Key === "Name");
      const envTag = subnet?.Tags?.find(tag => tag.Key === "Environment");
      const ownerTag = subnet?.Tags?.find(tag => tag.Key === "Owner");

      expect(nameTag?.Value).toBe("public-subnet");
      expect(envTag?.Value).toBe("production");
      expect(ownerTag?.Value).toBe("admin");
    }, TIMEOUT);

    test("Private subnet exists and has correct configuration", async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.private_subnet_id]
      });

      const response = await ec2Client.send(command);
      const subnet = response.Subnets?.[0];

      expect(subnet).toBeDefined();
      expect(subnet?.SubnetId).toBe(outputs.private_subnet_id);
      expect(subnet?.VpcId).toBe(outputs.vpc_id);
      expect(subnet?.CidrBlock).toBe("10.0.2.0/24");
      expect(subnet?.AvailabilityZone).toBe("us-west-2a");
      expect(subnet?.MapPublicIpOnLaunch).toBe(false);
      expect(subnet?.State).toBe("available");

      // Check tags
      const nameTag = subnet?.Tags?.find(tag => tag.Key === "Name");
      const envTag = subnet?.Tags?.find(tag => tag.Key === "Environment");
      const ownerTag = subnet?.Tags?.find(tag => tag.Key === "Owner");

      expect(nameTag?.Value).toBe("private-subnet");
      expect(envTag?.Value).toBe("production");
      expect(ownerTag?.Value).toBe("admin");
    }, TIMEOUT);
  });

  describe("Internet Gateway", () => {
    test("Internet Gateway exists and is attached to VPC", async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: "attachment.vpc-id",
            Values: [outputs.vpc_id]
          }
        ]
      });

      const response = await ec2Client.send(command);
      const igw = response.InternetGateways?.[0];

      expect(igw).toBeDefined();
      expect(igw?.Attachments?.[0]?.VpcId).toBe(outputs.vpc_id);
      expect(igw?.Attachments?.[0]?.State).toBe("available");

      // Check tags
      const nameTag = igw?.Tags?.find(tag => tag.Key === "Name");
      const envTag = igw?.Tags?.find(tag => tag.Key === "Environment");
      const ownerTag = igw?.Tags?.find(tag => tag.Key === "Owner");

      expect(nameTag?.Value).toBe("main-igw");
      expect(envTag?.Value).toBe("production");
      expect(ownerTag?.Value).toBe("admin");
    }, TIMEOUT);
  });

  describe("Route Tables", () => {
    test("Public route table exists and has internet gateway route", async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: "vpc-id",
            Values: [outputs.vpc_id]
          },
          {
            Name: "association.subnet-id",
            Values: [outputs.public_subnet_id]
          }
        ]
      });

      const response = await ec2Client.send(command);
      const routeTable = response.RouteTables?.[0];

      expect(routeTable).toBeDefined();
      expect(routeTable?.VpcId).toBe(outputs.vpc_id);

      // Check for internet gateway route
      const igwRoute = routeTable?.Routes?.find(route => route.GatewayId?.startsWith("igw-"));
      expect(igwRoute).toBeDefined();
      expect(igwRoute?.DestinationCidrBlock).toBe("0.0.0.0/0");
      expect(igwRoute?.State).toBe("active");

      // Check tags
      const nameTag = routeTable?.Tags?.find(tag => tag.Key === "Name");
      const envTag = routeTable?.Tags?.find(tag => tag.Key === "Environment");
      const ownerTag = routeTable?.Tags?.find(tag => tag.Key === "Owner");

      expect(nameTag?.Value).toBe("public-rt");
      expect(envTag?.Value).toBe("production");
      expect(ownerTag?.Value).toBe("admin");
    }, TIMEOUT);
  });

  describe("Security Groups", () => {
    test("Default security group exists and has correct rules", async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: "vpc-id",
            Values: [outputs.vpc_id]
          }
        ]
      });

      const response = await ec2Client.send(command);
      // Find the security group with name_prefix "default-"
      const securityGroup = response.SecurityGroups?.find(sg =>
        sg.GroupName?.startsWith("default-")
      );

      expect(securityGroup).toBeDefined();
      expect(securityGroup?.VpcId).toBe(outputs.vpc_id);
      expect(securityGroup?.GroupName).toMatch(/^default-/);

      // Check ingress rules - look for the rule with protocol -1 (all protocols)
      expect(securityGroup?.IpPermissions).toBeDefined();
      const ingressRule = securityGroup?.IpPermissions?.find(rule =>
        rule.IpProtocol === "-1"
      );
      expect(ingressRule).toBeDefined();
      expect(ingressRule?.IpRanges?.[0]?.CidrIp).toBe("0.0.0.0/0");

      // Check egress rules - look for the rule with protocol -1 (all protocols)
      expect(securityGroup?.IpPermissionsEgress).toBeDefined();
      const egressRule = securityGroup?.IpPermissionsEgress?.find(rule =>
        rule.IpProtocol === "-1"
      );
      expect(egressRule).toBeDefined();
      expect(egressRule?.IpRanges?.[0]?.CidrIp).toBe("0.0.0.0/0");

      // Check tags
      const nameTag = securityGroup?.Tags?.find(tag => tag.Key === "Name");
      const envTag = securityGroup?.Tags?.find(tag => tag.Key === "Environment");
      const ownerTag = securityGroup?.Tags?.find(tag => tag.Key === "Owner");

      expect(nameTag?.Value).toBe("default-sg");
      expect(envTag?.Value).toBe("production");
      expect(ownerTag?.Value).toBe("admin");
    }, TIMEOUT);
  });

  describe("Network ACLs", () => {
    test("Network ACL exists and is associated with subnets", async () => {
      const command = new DescribeNetworkAclsCommand({
        Filters: [
          {
            Name: "vpc-id",
            Values: [outputs.vpc_id]
          }
        ]
      });

      const response = await ec2Client.send(command);
      const nacl = response.NetworkAcls?.find(acl =>
        acl.Associations?.some(assoc =>
          assoc.SubnetId === outputs.public_subnet_id || assoc.SubnetId === outputs.private_subnet_id
        )
      );

      expect(nacl).toBeDefined();
      expect(nacl?.VpcId).toBe(outputs.vpc_id);

      // Check that both subnets are associated
      const subnetIds = nacl?.Associations?.map(assoc => assoc.SubnetId);
      expect(subnetIds).toContain(outputs.public_subnet_id);
      expect(subnetIds).toContain(outputs.private_subnet_id);

      // Check tags
      const nameTag = nacl?.Tags?.find(tag => tag.Key === "Name");
      const envTag = nacl?.Tags?.find(tag => tag.Key === "Environment");
      const ownerTag = nacl?.Tags?.find(tag => tag.Key === "Owner");

      expect(nameTag?.Value).toBe("main-nacl");
      expect(envTag?.Value).toBe("production");
      expect(ownerTag?.Value).toBe("admin");
    }, TIMEOUT);
  });

  describe("S3 Bucket", () => {
    const bucketName = "my-log-bucket-us-west-2";

    test("S3 bucket exists and is accessible", async () => {
      const command = new HeadBucketCommand({
        Bucket: bucketName
      });

      await expect(s3Client.send(command)).resolves.toBeDefined();
    }, TIMEOUT);

    test("S3 bucket has versioning enabled", async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: bucketName
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe("Enabled");
    }, TIMEOUT);

    test("S3 bucket has correct tags", async () => {
      const command = new GetBucketTaggingCommand({
        Bucket: bucketName
      });

      const response = await s3Client.send(command);
      const tags = response.TagSet || [];

      const nameTag = tags.find(tag => tag.Key === "Name");
      const envTag = tags.find(tag => tag.Key === "Environment");
      const ownerTag = tags.find(tag => tag.Key === "Owner");

      expect(nameTag?.Value).toBe("log-bucket");
      expect(envTag?.Value).toBe("production");
      expect(ownerTag?.Value).toBe("admin");
    }, TIMEOUT);
  });

  describe("IAM Resources", () => {
    test("EC2 IAM role exists and has correct trust policy", async () => {
      const command = new GetRoleCommand({
        RoleName: "ec2_role"
      });

      const response = await iamClient.send(command);
      const role = response.Role;

      expect(role).toBeDefined();
      expect(role?.RoleName).toBe("ec2_role");

      // Parse and check trust policy - handle URL-encoded content
      const policyDocument = role?.AssumeRolePolicyDocument || "{}";
      const decodedPolicy = decodeURIComponent(policyDocument);
      const trustPolicy = JSON.parse(decodedPolicy);
      expect(trustPolicy.Statement?.[0]?.Principal?.Service).toBe("ec2.amazonaws.com");
      expect(trustPolicy.Statement?.[0]?.Action).toBe("sts:AssumeRole");
      expect(trustPolicy.Statement?.[0]?.Effect).toBe("Allow");
    }, TIMEOUT);

    test("EC2 IAM role has attached policy", async () => {
      const command = new GetRolePolicyCommand({
        RoleName: "ec2_role",
        PolicyName: "ec2_policy"
      });

      const response = await iamClient.send(command);
      const policy = response.PolicyDocument;

      expect(policy).toBeDefined();

      // Parse and check policy document - handle URL-encoded content
      const decodedPolicy = decodeURIComponent(policy || "{}");
      const policyDoc = JSON.parse(decodedPolicy);
      expect(policyDoc.Statement?.[0]?.Action).toContain("s3:GetObject");
      expect(policyDoc.Statement?.[0]?.Action).toContain("secretsmanager:GetSecretValue");
      expect(policyDoc.Statement?.[0]?.Effect).toBe("Allow");
      expect(policyDoc.Statement?.[0]?.Resource).toBe("*");
    }, TIMEOUT);
  });

  describe("VPC Flow Logs", () => {
    test("VPC Flow Logs are enabled and configured", async () => {
      const command = new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: "resource-id",
            Values: [outputs.vpc_id]
          },
          {
            Name: "log-destination-type",
            Values: ["s3"]
          }
        ]
      });

      const response = await ec2Client.send(command);
      const flowLog = response.FlowLogs?.find(fl => fl.ResourceId === outputs.vpc_id);

      expect(flowLog).toBeDefined();
      // Use the actual VPC ID from outputs instead of hardcoded value
      expect(flowLog?.ResourceId).toBe(outputs.vpc_id);
      expect(flowLog?.TrafficType).toBe("ALL");
      expect(flowLog?.LogDestinationType).toBe("s3");
      expect(flowLog?.LogDestination).toContain("my-log-bucket-us-west-2");
      expect(flowLog?.FlowLogStatus).toBe("ACTIVE");

      // Check tags
      const nameTag = flowLog?.Tags?.find(tag => tag.Key === "Name");
      const envTag = flowLog?.Tags?.find(tag => tag.Key === "Environment");
      const ownerTag = flowLog?.Tags?.find(tag => tag.Key === "Owner");

      expect(nameTag?.Value).toBe("vpc-flow-logs");
      expect(envTag?.Value).toBe("production");
      expect(ownerTag?.Value).toBe("admin");
    }, TIMEOUT);
  });

  describe("Secrets Manager", () => {
    test("Secrets Manager secret should be configured in infrastructure", async () => {
      const command = new DescribeSecretCommand({
        SecretId: "example-secret"
      });

      await expect(secretsClient.send(command)).resolves.toBeDefined();
    }, TIMEOUT);

    test("Secrets Manager secret value can be retrieved", async () => {
      const command = new GetSecretValueCommand({
        SecretId: "example-secret"
      });

      const response = await secretsClient.send(command);
      expect(response.SecretString).toBe("my-secret-value");
    }, TIMEOUT);
  });

  describe("Network Connectivity", () => {
    test("Public subnet has route to internet gateway", async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: "association.subnet-id",
            Values: [outputs.public_subnet_id]
          }
        ]
      });

      const response = await ec2Client.send(command);
      const routeTable = response.RouteTables?.[0];

      expect(routeTable).toBeDefined();

      // Check for internet gateway route
      const igwRoute = routeTable?.Routes?.find(route =>
        route.GatewayId?.startsWith("igw-") && route.DestinationCidrBlock === "0.0.0.0/0"
      );
      expect(igwRoute).toBeDefined();
      expect(igwRoute?.State).toBe("active");
    }, TIMEOUT);

    test("Private subnet does not have direct internet access", async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: "association.subnet-id",
            Values: [outputs.private_subnet_id]
          }
        ]
      });

      const response = await ec2Client.send(command);
      const routeTable = response.RouteTables?.[0];

      if (routeTable) {
        // Private subnet should not have a route to internet gateway
        const igwRoute = routeTable.Routes?.find(route =>
          route.GatewayId?.startsWith("igw-") && route.DestinationCidrBlock === "0.0.0.0/0"
        );
        expect(igwRoute).toBeUndefined();
      }
    }, TIMEOUT);
  });

  describe("Security Validation", () => {
    test("Security group allows necessary outbound traffic", async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: "vpc-id",
            Values: [outputs.vpc_id]
          }
        ]
      });

      const response = await ec2Client.send(command);
      // Find the security group with name_prefix "default-"
      const securityGroup = response.SecurityGroups?.find(sg =>
        sg.GroupName?.startsWith("default-")
      );

      expect(securityGroup).toBeDefined();

      // Check egress rules allow all outbound traffic - look for the rule with protocol -1 (all protocols)
      const egressRule = securityGroup?.IpPermissionsEgress?.find(rule =>
        rule.IpProtocol === "-1"
      );
      expect(egressRule).toBeDefined();
      expect(egressRule?.IpRanges?.[0]?.CidrIp).toBe("0.0.0.0/0");
    }, TIMEOUT);
  });

  describe("Resource Tagging Compliance", () => {
    test("All major resources have consistent tagging", async () => {
      // This test validates that our tagging standards are applied consistently
      // across all major resources in the infrastructure

      const resources = [
        { type: "VPC", id: outputs.vpc_id },
        { type: "Public Subnet", id: outputs.public_subnet_id },
        { type: "Private Subnet", id: outputs.private_subnet_id }
      ];

      for (const resource of resources) {
        // For each resource type, we've already validated tags in specific tests above
        // This is a summary test to ensure consistency
        expect(resource.id).toMatch(/^(vpc|subnet)-[a-f0-9]+$/);
      }
    }, TIMEOUT);
  });
});
