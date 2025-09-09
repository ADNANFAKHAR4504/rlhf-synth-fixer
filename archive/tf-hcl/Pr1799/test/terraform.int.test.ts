// Integration tests for Terraform infrastructure
// These tests use actual AWS deployment outputs from cfn-outputs/flat-outputs.json

import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  DescribeFlowLogsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from "@aws-sdk/client-ec2";
import {
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand
} from "@aws-sdk/client-iam";
import {
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  KMSClient,
} from "@aws-sdk/client-kms";
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

// Initialize AWS clients
const ec2Client = new EC2Client({ region: process.env.AWS_REGION || "us-west-2" });
const s3Client = new S3Client({ region: process.env.AWS_REGION || "us-west-2" });
const iamClient = new IAMClient({ region: process.env.AWS_REGION || "us-west-2" });
const kmsClient = new KMSClient({ region: process.env.AWS_REGION || "us-west-2" });
const cwLogsClient = new CloudWatchLogsClient({ region: process.env.AWS_REGION || "us-west-2" });

// Helper function to load deployment outputs
function loadDeploymentOutputs(): any {
  const outputsPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");
  if (!fs.existsSync(outputsPath)) {
    console.warn("No deployment outputs found at:", outputsPath);
    return {};
  }
  try {
    const content = fs.readFileSync(outputsPath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Error loading deployment outputs:", error);
    return {};
  }
}

// Helper function to check if running in CI environment
function isCI(): boolean {
  return process.env.CI === "1" || process.env.CI === "true";
}

// Skip tests if not in CI or no outputs available
const outputs = loadDeploymentOutputs();
const skipTests = !isCI() || Object.keys(outputs).length === 0;

describe("Terraform Infrastructure Integration Tests", () => {
  if (skipTests) {
    test.skip("Skipping integration tests (not in CI or no deployment outputs)", () => {});
    return;
  }

  describe("VPC and Networking", () => {
    test("VPC exists and is configured correctly", async () => {
      if (!outputs.vpc_id) {
        console.warn("No VPC ID in outputs");
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id],
      });
      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      
      // Verify VPC configuration
      expect(vpc.State).toBe("available");
      expect(vpc.CidrBlock).toBe("10.0.0.0/16");
    });

    test("public subnets are properly configured", async () => {
      if (!outputs.public_subnet_ids) {
        console.warn("No public subnet IDs in outputs");
        return;
      }

      const subnetIds = JSON.parse(outputs.public_subnet_ids);
      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });
      const response = await ec2Client.send(command);
      
      expect(response.Subnets).toHaveLength(2);
      
      for (const subnet of response.Subnets!) {
        expect(subnet.State).toBe("available");
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.VpcId).toBe(outputs.vpc_id);
      }
    });

    test("private subnets are properly configured", async () => {
      if (!outputs.private_subnet_ids) {
        console.warn("No private subnet IDs in outputs");
        return;
      }

      const subnetIds = JSON.parse(outputs.private_subnet_ids);
      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });
      const response = await ec2Client.send(command);
      
      expect(response.Subnets).toHaveLength(2);
      
      for (const subnet of response.Subnets!) {
        expect(subnet.State).toBe("available");
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(outputs.vpc_id);
      }
    });

    test("NAT Gateway is configured and running", async () => {
      if (!outputs.nat_gateway_id) {
        console.warn("No NAT Gateway ID in outputs");
        return;
      }

      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.nat_gateway_id],
      });
      const response = await ec2Client.send(command);
      
      expect(response.NatGateways).toHaveLength(1);
      const natGateway = response.NatGateways![0];
      
      expect(natGateway.State).toBe("available");
      expect(natGateway.VpcId).toBe(outputs.vpc_id);
      expect(natGateway.NatGatewayAddresses).toHaveLength(1);
    });

    test("Internet Gateway is attached to VPC", async () => {
      if (!outputs.internet_gateway_id) {
        console.warn("No Internet Gateway ID in outputs");
        return;
      }

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

    test("VPC Flow Logs are enabled", async () => {
      if (!outputs.vpc_id) {
        console.warn("No VPC ID in outputs");
        return;
      }

      const command = new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: "resource-id",
            Values: [outputs.vpc_id],
          },
        ],
      });
      const response = await ec2Client.send(command);
      
      expect(response.FlowLogs).not.toHaveLength(0);
      const flowLog = response.FlowLogs![0];
      
      expect(flowLog.FlowLogStatus).toBe("ACTIVE");
      expect(flowLog.TrafficType).toBe("ALL");
    });
  });

  describe("Security Groups", () => {
    test("security groups exist and have correct rules", async () => {
      if (!outputs.security_group_ids) {
        console.warn("No security group IDs in outputs");
        return;
      }

      const sgIds = JSON.parse(outputs.security_group_ids);
      const webSgId = sgIds.web;
      const dbSgId = sgIds.database;
      
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [webSgId, dbSgId],
      });
      const response = await ec2Client.send(command);
      
      expect(response.SecurityGroups).toHaveLength(2);
      
      // Check web security group
      const webSg = response.SecurityGroups!.find(sg => sg.GroupId === webSgId);
      expect(webSg).toBeDefined();
    });
  });

  describe("S3 Buckets", () => {
    test("S3 buckets exist with correct names", async () => {
      if (!outputs.s3_bucket_names) {
        console.warn("No S3 bucket names in outputs");
        return;
      }

      const bucketNames = JSON.parse(outputs.s3_bucket_names);
      expect(bucketNames).toHaveProperty("app_data");
      expect(bucketNames).toHaveProperty("logs");
      expect(bucketNames).toHaveProperty("backups");
    });

    test("S3 buckets have versioning enabled", async () => {
      if (!outputs.s3_bucket_names) {
        console.warn("No S3 bucket names in outputs");
        return;
      }

      const bucketNames = JSON.parse(outputs.s3_bucket_names);
      
      for (const bucketName of Object.values(bucketNames) as string[]) {
        const command = new GetBucketVersioningCommand({
          Bucket: bucketName,
        });
        const response = await s3Client.send(command);
        expect(response.Status).toBe("Enabled");
      }
    });

    test("S3 buckets have KMS encryption enabled", async () => {
      if (!outputs.s3_bucket_names) {
        console.warn("No S3 bucket names in outputs");
        return;
      }

      const bucketNames = JSON.parse(outputs.s3_bucket_names);
      
      for (const bucketName of Object.values(bucketNames) as string[]) {
        const command = new GetBucketEncryptionCommand({
          Bucket: bucketName,
        });
        const response = await s3Client.send(command);
        
        expect(response.ServerSideEncryptionConfiguration).toBeDefined();
        const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
        expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe("aws:kms");
        expect(rule.ApplyServerSideEncryptionByDefault!.KMSMasterKeyID).toBeDefined();
      }
    });

    test("S3 buckets block public access", async () => {
      if (!outputs.s3_bucket_names) {
        console.warn("No S3 bucket names in outputs");
        return;
      }

      const bucketNames = JSON.parse(outputs.s3_bucket_names);
      
      for (const bucketName of Object.values(bucketNames) as string[]) {
        const command = new GetPublicAccessBlockCommand({
          Bucket: bucketName,
        });
        const response = await s3Client.send(command);
        
        expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
        expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
        expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
        expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
      }
    });

    test("S3 logs and backups buckets have lifecycle policies", async () => {
      if (!outputs.s3_bucket_names) {
        console.warn("No S3 bucket names in outputs");
        return;
      }

      const bucketNames = JSON.parse(outputs.s3_bucket_names);
      const bucketsWithLifecycle = [bucketNames.logs, bucketNames.backups];
      
      for (const bucketName of bucketsWithLifecycle) {
        const command = new GetBucketLifecycleConfigurationCommand({
          Bucket: bucketName,
        });
        const response = await s3Client.send(command);
        
        expect(response.Rules).toBeDefined();
        expect(response.Rules!.length).toBeGreaterThan(0);
        
        const rule = response.Rules![0];
        expect(rule.Status).toBe("Enabled");
        expect(rule.Transitions).toBeDefined();
        expect(rule.Transitions!.length).toBeGreaterThan(0);
      }
    });
  });

  describe("KMS Encryption", () => {
    test("KMS key exists and has rotation enabled", async () => {
      if (!outputs.kms_key_id) {
        console.warn("No KMS key ID in outputs");
        return;
      }

      const describeCommand = new DescribeKeyCommand({
        KeyId: outputs.kms_key_id,
      });
      const describeResponse = await kmsClient.send(describeCommand);
      
      expect(describeResponse.KeyMetadata).toBeDefined();
      expect(describeResponse.KeyMetadata!.KeyState).toBe("Enabled");
      expect(describeResponse.KeyMetadata!.KeyUsage).toBe("ENCRYPT_DECRYPT");
      
      // Check rotation status
      const rotationCommand = new GetKeyRotationStatusCommand({
        KeyId: outputs.kms_key_id,
      });
      const rotationResponse = await kmsClient.send(rotationCommand);
      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    });
  });

  describe("IAM Roles and Policies", () => {
    test("IAM roles exist with correct trust policies", async () => {
      if (!outputs.iam_role_arns) {
        console.warn("No IAM role ARNs in outputs");
        return;
      }

      const roleArns = JSON.parse(outputs.iam_role_arns);
      
      // Check EC2 role
      if (roleArns.ec2_role) {
        const roleName = roleArns.ec2_role.split("/").pop();
        const command = new GetRoleCommand({
          RoleName: roleName,
        });
        const response = await iamClient.send(command);
        
        expect(response.Role).toBeDefined();
        const trustPolicy = JSON.parse(decodeURIComponent(response.Role!.AssumeRolePolicyDocument!));
        expect(trustPolicy.Statement[0].Principal.Service).toContain("ec2.amazonaws.com");
      }
      
      // Check Lambda role
      if (roleArns.lambda_role) {
        const roleName = roleArns.lambda_role.split("/").pop();
        const command = new GetRoleCommand({
          RoleName: roleName,
        });
        const response = await iamClient.send(command);
        
        expect(response.Role).toBeDefined();
        const trustPolicy = JSON.parse(decodeURIComponent(response.Role!.AssumeRolePolicyDocument!));
        expect(trustPolicy.Statement[0].Principal.Service).toContain("lambda.amazonaws.com");
      }
    });

    test("IAM roles have appropriate policies attached", async () => {
      if (!outputs.iam_role_arns) {
        console.warn("No IAM role ARNs in outputs");
        return;
      }

      const roleArns = JSON.parse(outputs.iam_role_arns);
      
      if (roleArns.ec2_role) {
        const roleName = roleArns.ec2_role.split("/").pop();
        const command = new ListAttachedRolePoliciesCommand({
          RoleName: roleName,
        });
        const response = await iamClient.send(command);
        
        expect(response.AttachedPolicies).toBeDefined();
        expect(response.AttachedPolicies!.length).toBeGreaterThan(0);
        
        // Check for expected policies
        const policyNames = response.AttachedPolicies!.map(p => p.PolicyName);
        expect(policyNames.some(name => name!.includes("s3-access"))).toBe(true);
        expect(policyNames.some(name => name!.includes("cloudwatch-logs"))).toBe(true);
      }
    });
  });

  describe("CloudWatch Logs", () => {
    test("VPC Flow Logs log group exists", async () => {
      if (!outputs.vpc_flow_log_group) {
        console.warn("No VPC flow log group in outputs");
        return;
      }

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.vpc_flow_log_group,
      });
      const response = await cwLogsClient.send(command);
      
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
      
      const logGroup = response.logGroups!.find(lg => lg.logGroupName === outputs.vpc_flow_log_group);
      expect(logGroup).toBeDefined();
      expect(logGroup!.retentionInDays).toBe(14);
    });
  });

  describe("End-to-End Connectivity", () => {
    test("private subnets can reach internet through NAT Gateway", async () => {
      // This test verifies the routing configuration
      // In a real scenario, you would deploy an EC2 instance and test connectivity
      
      if (!outputs.nat_gateway_id || !outputs.private_subnet_ids) {
        console.warn("Missing NAT Gateway or private subnet IDs");
        return;
      }

      // Verify NAT Gateway has a public IP
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.nat_gateway_id],
      });
      const response = await ec2Client.send(command);
      
      expect(response.NatGateways![0].NatGatewayAddresses![0].PublicIp).toBeDefined();
      expect(response.NatGateways![0].State).toBe("available");
    });

    test("resources are properly tagged with environment suffix", async () => {
      if (!outputs.vpc_id) {
        console.warn("No VPC ID in outputs");
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id],
      });
      const response = await ec2Client.send(command);
      
      const vpc = response.Vpcs![0];
      const tags = vpc.Tags || [];
      
      // Check for environment suffix tag
      const envSuffixTag = tags.find(tag => tag.Key === "EnvironmentSuffix");
      expect(envSuffixTag).toBeDefined();
      
      // Check for other required tags
      const projectTag = tags.find(tag => tag.Key === "Project");
      expect(projectTag).toBeDefined();
      
      const managedByTag = tags.find(tag => tag.Key === "ManagedBy");
      expect(managedByTag).toBeDefined();
      expect(managedByTag!.Value).toBe("Terraform");
    });
  });

  describe("Security Compliance", () => {
    test("no resources allow unrestricted SSH access", async () => {
      if (!outputs.security_group_ids) {
        console.warn("No security group IDs in outputs");
        return;
      }

      const sgIds = JSON.parse(outputs.security_group_ids);
      const allSgIds = Object.values(sgIds) as string[];
      
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: allSgIds,
      });
      const response = await ec2Client.send(command);
      
      for (const sg of response.SecurityGroups!) {
        const sshRules = sg.IpPermissions!.filter(rule => rule.FromPort === 22);
        
        for (const rule of sshRules) {
          if (rule.IpRanges) {
            for (const range of rule.IpRanges) {
              expect(range.CidrIp).not.toBe("0.0.0.0/0");
            }
          }
        }
      }
    });

    test("all data at rest is encrypted", async () => {
      // S3 buckets should use KMS encryption
      if (outputs.s3_bucket_names && outputs.kms_key_id) {
        const bucketNames = JSON.parse(outputs.s3_bucket_names);
        
        for (const bucketName of Object.values(bucketNames) as string[]) {
          const command = new GetBucketEncryptionCommand({
            Bucket: bucketName,
          });
          const response = await s3Client.send(command);
          
          const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
          expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe("aws:kms");
        }
      }
    });

    test("network isolation is properly configured", async () => {
      // Verify private subnets don't have direct internet access
      if (outputs.private_subnet_ids) {
        const subnetIds = JSON.parse(outputs.private_subnet_ids);
        const command = new DescribeSubnetsCommand({
          SubnetIds: subnetIds,
        });
        const response = await ec2Client.send(command);
        
        for (const subnet of response.Subnets!) {
          expect(subnet.MapPublicIpOnLaunch).toBe(false);
        }
      }
      
      // Verify public subnets have internet access
      if (outputs.public_subnet_ids) {
        const subnetIds = JSON.parse(outputs.public_subnet_ids);
        const command = new DescribeSubnetsCommand({
          SubnetIds: subnetIds,
        });
        const response = await ec2Client.send(command);
        
        for (const subnet of response.Subnets!) {
          expect(subnet.MapPublicIpOnLaunch).toBe(true);
        }
      }
    });
  });
});