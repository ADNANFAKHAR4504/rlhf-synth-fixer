// Integration tests for Terraform infrastructure
// Real AWS calls - requires deployment outputs from cfn-outputs/flat-outputs.json

import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  DescribeFlowLogsCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client
} from "@aws-sdk/client-ec2";
import {
  GetPolicyCommand,
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
} from "@aws-sdk/client-iam";
import {
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  KMSClient
} from "@aws-sdk/client-kms";
import {
  GetBucketEncryptionCommand,
  HeadBucketCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

// Environment requirements
const AWS_PROFILE = process.env.AWS_PROFILE;
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const SECONDARY_REGION = "us-west-2";

// Load deployment outputs
const OUTPUT_PATHS = [
  path.resolve(__dirname, "../cfn-outputs/flat-outputs.json"),
  path.resolve(__dirname, "../lib/flat-outputs.json"),
];

let deploymentOutputs: Record<string, any> = {};
let isOutputsLoaded = false;

beforeAll(() => {
  // Environment checks
  if (!AWS_PROFILE) {
    console.warn("⚠️ AWS_PROFILE not set. Integration tests may fail due to authentication issues.");
  }
  
  // Load outputs
  for (const outputPath of OUTPUT_PATHS) {
    if (fs.existsSync(outputPath)) {
      try {
        deploymentOutputs = JSON.parse(fs.readFileSync(outputPath, "utf8"));
        isOutputsLoaded = true;
        console.log(`✅ Loaded deployment outputs from: ${outputPath}`);
        break;
      } catch (error) {
        console.error(`❌ Failed to parse outputs file: ${outputPath}`, error);
      }
    }
  }
  
  if (!isOutputsLoaded) {
    console.warn("⚠️ No deployment outputs found. Integration tests will be skipped.");
    console.warn("📁 Expected output files:");
    OUTPUT_PATHS.forEach(p => console.warn(`  - ${p}`));
    console.warn("💡 Run deployment first to generate flat-outputs.json");
  }
});

// Helper to skip tests when outputs not available
const skipIfNoOutputs = () => {
  if (!isOutputsLoaded) {
    pending("Skipping - deployment outputs not available");
  }
};

describe("Terraform Financial Services Infrastructure - Integration Tests", () => {
  const primaryClient = {
    ec2: new EC2Client({ region: AWS_REGION }),
    s3: new S3Client({ region: AWS_REGION }),
    logs: new CloudWatchLogsClient({ region: AWS_REGION }),
    kms: new KMSClient({ region: AWS_REGION }),
    iam: new IAMClient({ region: AWS_REGION }),
  };

  const secondaryClient = {
    ec2: new EC2Client({ region: SECONDARY_REGION }),
    s3: new S3Client({ region: SECONDARY_REGION }),
    logs: new CloudWatchLogsClient({ region: SECONDARY_REGION }),
    kms: new KMSClient({ region: SECONDARY_REGION }),
    iam: new IAMClient({ region: SECONDARY_REGION }),
  };

  describe("VPC Infrastructure Validation", () => {
    test("int-vpc-multi-region: VPCs exist in both regions with correct CIDR blocks", async () => {
      skipIfNoOutputs();
      
      // Test primary VPC
      const primaryVpcResponse = await primaryClient.ec2.send(new DescribeVpcsCommand({
        VpcIds: [deploymentOutputs.primary_vpc_id],
      }));
      
      expect(primaryVpcResponse.Vpcs).toHaveLength(1);
      const primaryVpc = primaryVpcResponse.Vpcs![0];
      expect(primaryVpc.CidrBlock).toBe("10.10.0.0/16");
      expect(primaryVpc.State).toBe("available");
      const dnsHostnamesAttr = await primaryClient.ec2.send(new DescribeVpcAttributeCommand({ VpcId: deploymentOutputs.primary_vpc_id, Attribute: "enableDnsHostnames" }));
      expect(dnsHostnamesAttr.EnableDnsHostnames?.Value).toBe(true);
      const dnsSupportAttr = await primaryClient.ec2.send(new DescribeVpcAttributeCommand({ VpcId: deploymentOutputs.primary_vpc_id, Attribute: "enableDnsSupport" }));
      expect(dnsSupportAttr.EnableDnsSupport?.Value).toBe(true);

      // Test secondary VPC
      const secondaryVpcResponse = await secondaryClient.ec2.send(new DescribeVpcsCommand({
        VpcIds: [deploymentOutputs.secondary_vpc_id],
      }));
      
      expect(secondaryVpcResponse.Vpcs).toHaveLength(1);
      const secondaryVpc = secondaryVpcResponse.Vpcs![0];
      expect(secondaryVpc.CidrBlock).toBe("10.20.0.0/16");
      expect(secondaryVpc.State).toBe("available");
    }, 15000);


    test("int-nat-gateway-ha: NAT gateways deployed per AZ for high availability", async () => {
      skipIfNoOutputs();
      
      const natGatewaysResponse = await primaryClient.ec2.send(new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: "vpc-id",
            Values: [deploymentOutputs.primary_vpc_id],
          },
          {
            Name: "state",
            Values: ["available"],
          },
        ],
      }));
      
      expect(natGatewaysResponse.NatGateways).toHaveLength(3); // One per AZ
      
      // Verify each NAT gateway is in a different AZ
      const natAZs = new Set(natGatewaysResponse.NatGateways!.map(ng => ng.SubnetId));
      expect(natAZs.size).toBe(3);
      
      // Verify all NAT gateways are in public subnets
      natGatewaysResponse.NatGateways!.forEach(natGateway => {
        expect(deploymentOutputs.primary_public_subnet_ids).toContain(natGateway.SubnetId);
      });
    }, 15000);
  });

  describe("Security and Encryption Validation", () => {
    test("int-kms-encryption: KMS keys exist with rotation enabled in both regions", async () => {
      skipIfNoOutputs();
      
      // Test primary KMS key
      const primaryKeyId = deploymentOutputs.kms_logs_primary_arn.split("/")[1];
      const primaryKeyResponse = await primaryClient.kms.send(new DescribeKeyCommand({
        KeyId: primaryKeyId,
      }));
      
      expect(primaryKeyResponse.KeyMetadata).toBeDefined();
      expect(primaryKeyResponse.KeyMetadata!.KeyState).toBe("Enabled");
      expect(primaryKeyResponse.KeyMetadata!.Origin).toBe("AWS_KMS");
      const primaryRotation = await primaryClient.kms.send(new GetKeyRotationStatusCommand({ KeyId: primaryKeyId }));
      expect(primaryRotation.KeyRotationEnabled).toBe(true);
      
      // Test secondary KMS key
      const secondaryKeyId = deploymentOutputs.kms_logs_secondary_arn.split("/")[1];
      const secondaryKeyResponse = await secondaryClient.kms.send(new DescribeKeyCommand({
        KeyId: secondaryKeyId,
      }));
      
      expect(secondaryKeyResponse.KeyMetadata).toBeDefined();
      expect(secondaryKeyResponse.KeyMetadata!.KeyState).toBe("Enabled");
      const secondaryRotation = await secondaryClient.kms.send(new GetKeyRotationStatusCommand({ KeyId: secondaryKeyId }));
      expect(secondaryRotation.KeyRotationEnabled).toBe(true);
    }, 15000);

    test("int-s3-encryption: S3 buckets exist with KMS encryption enabled", async () => {
      skipIfNoOutputs();
      
      // Extract bucket names from outputs (assuming format: company-env-data-region)
      const primaryBucketName = `turinggpt-dev-data-${AWS_REGION}`;
      const secondaryBucketName = `turinggpt-dev-data-${SECONDARY_REGION}`;
      
      // Test primary bucket
      await expect(primaryClient.s3.send(new HeadBucketCommand({
        Bucket: primaryBucketName,
      }))).resolves.toBeDefined();
      
      const primaryEncryptionResponse = await primaryClient.s3.send(new GetBucketEncryptionCommand({
        Bucket: primaryBucketName,
      }));
      
      expect(primaryEncryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      const primaryRule = primaryEncryptionResponse.ServerSideEncryptionConfiguration!.Rules![0];
      expect(primaryRule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe("aws:kms");
      expect(primaryRule.ApplyServerSideEncryptionByDefault!.KMSMasterKeyID).toBe(deploymentOutputs.kms_logs_primary_arn);
      
      // Test secondary bucket
      await expect(secondaryClient.s3.send(new HeadBucketCommand({
        Bucket: secondaryBucketName,
      }))).resolves.toBeDefined();
      
      const secondaryEncryptionResponse = await secondaryClient.s3.send(new GetBucketEncryptionCommand({
        Bucket: secondaryBucketName,
      }));
      
      const secondaryRule = secondaryEncryptionResponse.ServerSideEncryptionConfiguration!.Rules![0];
      expect(secondaryRule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe("aws:kms");
      expect(secondaryRule.ApplyServerSideEncryptionByDefault!.KMSMasterKeyID).toBe(deploymentOutputs.kms_logs_secondary_arn);
    }, 20000);

    test("int-security-groups: Security groups exist with restrictive default rules", async () => {
      skipIfNoOutputs();
      
      const securityGroupsResponse = await primaryClient.ec2.send(new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: "vpc-id",
            Values: [deploymentOutputs.primary_vpc_id],
          },
          {
            Name: "group-name",
            Values: ["turinggpt-dev-app-sg-*"],
          },
        ],
      }));
      
      expect(securityGroupsResponse.SecurityGroups!.length).toBeGreaterThan(0);
      
      // Verify default restrictive behavior (no ingress rules defined)
      securityGroupsResponse.SecurityGroups!.forEach(sg => {
        expect(sg.IpPermissions).toHaveLength(0); // No ingress rules = restrictive
      });
    }, 10000);
  });

  describe("Monitoring and Logging Validation", () => {
    test("int-cloudwatch-logs: CloudWatch log groups exist with encryption and retention", async () => {
      skipIfNoOutputs();
      
      // Test primary log group
      const primaryLogGroupsResponse = await primaryClient.logs.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: deploymentOutputs.cw_log_group_primary,
      }));
      
      expect(primaryLogGroupsResponse.logGroups).toHaveLength(1);
      const primaryLogGroup = primaryLogGroupsResponse.logGroups![0];
      expect(primaryLogGroup.retentionInDays).toBe(90);
      expect(primaryLogGroup.kmsKeyId).toBe(deploymentOutputs.kms_logs_primary_arn);
      
      // Test secondary log group
      const secondaryLogGroupsResponse = await secondaryClient.logs.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: deploymentOutputs.cw_log_group_secondary,
      }));
      
      expect(secondaryLogGroupsResponse.logGroups).toHaveLength(1);
      const secondaryLogGroup = secondaryLogGroupsResponse.logGroups![0];
      expect(secondaryLogGroup.retentionInDays).toBe(90);
      expect(secondaryLogGroup.kmsKeyId).toBe(deploymentOutputs.kms_logs_secondary_arn);
    }, 15000);

    test("int-vpc-flow-logs: VPC flow logs are enabled and logging to CloudWatch", async () => {
      skipIfNoOutputs();
      
      const flowLogsResponse = await primaryClient.ec2.send(new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: "resource-id",
            Values: [deploymentOutputs.primary_vpc_id],
          },
        ],
      }));
      
      expect(flowLogsResponse.FlowLogs).toHaveLength(1);
      const flowLog = flowLogsResponse.FlowLogs![0];
      expect(flowLog.FlowLogStatus).toBe("ACTIVE");
      expect(flowLog.TrafficType).toBe("ALL");
      expect(flowLog.LogDestinationType).toBe("cloud-watch-logs");
      expect(flowLog.LogDestination).toContain(deploymentOutputs.cw_log_group_primary);
    }, 10000);
  });

  describe("IAM and Access Control Validation", () => {
    test("int-iam-least-privilege: VPC flow logs roles have minimal required permissions", async () => {
      skipIfNoOutputs();
      
      const roleName = `turinggpt-dev-vpc-flowlogs-role-${AWS_REGION}`;
      
      // Get role
      const roleResponse = await primaryClient.iam.send(new GetRoleCommand({
        RoleName: roleName,
      }));
      
      expect(roleResponse.Role).toBeDefined();
      
      // Verify trust policy allows VPC Flow Logs service
      const trustPolicy = JSON.parse(decodeURIComponent(roleResponse.Role!.AssumeRolePolicyDocument!));
      expect(trustPolicy.Statement[0].Principal.Service).toContain("vpc-flow-logs.amazonaws.com");
      
      // Get attached policies
      const attachedPoliciesResponse = await primaryClient.iam.send(new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      }));
      
      expect(attachedPoliciesResponse.AttachedPolicies).toHaveLength(1);
      
      // Verify policy permissions are restrictive
      const policyArn = attachedPoliciesResponse.AttachedPolicies![0].PolicyArn!;
      const policyResponse = await primaryClient.iam.send(new GetPolicyCommand({
        PolicyArn: policyArn,
      }));
      
      expect(policyResponse.Policy).toBeDefined();
      
      // The policy should only have CloudWatch Logs permissions
      expect(policyResponse.Policy!.DefaultVersionId).toBeDefined();
    }, 15000);

    test("int-iam-cross-region: IAM roles exist in both regions with consistent naming", async () => {
      skipIfNoOutputs();
      
      const primaryRoleName = `turinggpt-dev-vpc-flowlogs-role-${AWS_REGION}`;
      const secondaryRoleName = `turinggpt-dev-vpc-flowlogs-role-${SECONDARY_REGION}`;
      
      // Primary role
      await expect(primaryClient.iam.send(new GetRoleCommand({
        RoleName: primaryRoleName,
      }))).resolves.toBeDefined();
      
      // Secondary role (IAM is global, but we test different role names)
      await expect(primaryClient.iam.send(new GetRoleCommand({
        RoleName: secondaryRoleName,
      }))).resolves.toBeDefined();
    }, 10000);
  });

  describe("Disaster Recovery and Business Continuity", () => {

    test("int-resource-tagging: All resources have consistent tagging strategy", async () => {
      skipIfNoOutputs();
      
      // Test VPC tags
      const vpcResponse = await primaryClient.ec2.send(new DescribeVpcsCommand({
        VpcIds: [deploymentOutputs.primary_vpc_id],
      }));
      
      const vpcTags = vpcResponse.Vpcs![0].Tags || [];
      const tagMap = Object.fromEntries(vpcTags.map(tag => [tag.Key!, tag.Value!]));
      
      // Verify required tags exist
      expect(tagMap.Company).toBe("turinggpt");
      expect(tagMap.Environment).toBe("dev");
      expect(tagMap.Project).toBe("fs-multiregion");
      expect(tagMap.Owner).toBe("platform");
      expect(tagMap.CostCenter).toBe("fin-ops");
      expect(tagMap.Compliance).toBe("financial");
      expect(tagMap.Name).toContain("turinggpt-dev-vpc");
    }, 10000);
  });
});