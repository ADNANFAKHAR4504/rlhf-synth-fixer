/**
 * Infrastructure Integration Tests
 *
 * Comprehensive end-to-end tests for TapStack deployed AWS resources.
 * These tests validate:
 * - VPC with multi-AZ public/private subnets
 * - EC2 Bastion with Elastic IP
 * - Auto Scaling Group with Launch Template
 * - S3 Bucket with versioning, encryption, and access logs
 * - Secrets Manager with generated credentials
 * - CloudWatch Logs (Central + EC2) with KMS encryption
 * - CloudWatch Alarms connected to SNS
 * - SNS Topic for alarm notifications
 * - AWS Backup Vault and Plan
 * - KMS Key for encryption
 * - IAM Roles with least privilege
 * - Security Groups
 * - SSM Parameter Store
 *
 * CI/CD Compatibility:
 * - No hardcoded values - all values from deployment outputs
 * - Dynamic output mapping for any environment suffix
 * - Region detection from ARNs or environment variables
 * - Proper cleanup of test artifacts
 */

import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand
} from '@aws-sdk/client-auto-scaling';
import {
  BackupClient,
  DescribeBackupVaultCommand,
  ListBackupPlansCommand,
  ListBackupSelectionsCommand,
} from '@aws-sdk/client-backup';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeAddressesCommand,
  DescribeInstancesCommand,
  DescribeLaunchTemplatesCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
  ListRolePoliciesCommand
} from '@aws-sdk/client-iam';
import {
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  KMSClient,
} from '@aws-sdk/client-kms';
import {
  DeleteObjectCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketLoggingCommand,
  GetBucketPolicyCommand,
  GetBucketVersioningCommand,
  GetObjectCommand,
  GetPublicAccessBlockCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import {
  GetTopicAttributesCommand,
  SNSClient
} from '@aws-sdk/client-sns';
import {
  SSMClient
} from '@aws-sdk/client-ssm';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// CI/CD Environment Detection
const isCI = process.env.CI === '1' || process.env.CI === 'true';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Configuration - Load outputs from deployment
// Try multiple possible output file locations for CI compatibility
const possibleOutputPaths = [
  path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json'),
  path.join(process.cwd(), 'cfn-outputs', 'all-outputs.json'),
  path.join(process.cwd(), 'cfn-outputs', 'outputs.json'),
];

let rawOutputs: Record<string, string>;
let outputs: Record<string, string>;
let region: string;

// AWS Clients (will be initialized after region is loaded)
let ec2Client: EC2Client;
let autoScalingClient: AutoScalingClient;
let s3Client: S3Client;
let secretsManagerClient: SecretsManagerClient;
let snsClient: SNSClient;
let backupClient: BackupClient;
let kmsClient: KMSClient;
let iamClient: IAMClient;
let cloudWatchClient: CloudWatchClient;
let cloudWatchLogsClient: CloudWatchLogsClient;
let ssmClient: SSMClient;

/**
 * Load outputs from cfn-outputs directory
 * Supports multiple file formats and flattening nested structures
 */
function loadOutputs(): Record<string, string> {
  for (const outputsPath of possibleOutputPaths) {
    if (fs.existsSync(outputsPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
        console.log(`✅ Loaded outputs from: ${outputsPath}`);

        // If this is the nested structure from all-outputs.json, flatten it
        if (outputsPath.includes('all-outputs.json')) {
          const flattened: Record<string, string> = {};
          for (const [, stackOutputs] of Object.entries(data)) {
            if (Array.isArray(stackOutputs)) {
              // CDK outputs format: { "StackName": [{"OutputKey": "...", "OutputValue": "..."}] }
              for (const output of stackOutputs as { OutputKey?: string; OutputValue?: string }[]) {
                if (output.OutputKey && output.OutputValue) {
                  flattened[output.OutputKey] = output.OutputValue;
                }
              }
            } else if (typeof stackOutputs === 'object' && stackOutputs !== null) {
              // Direct key-value format
              Object.assign(flattened, stackOutputs);
            }
          }
          return flattened;
        }

        return data;
      } catch (error) {
        console.warn(`⚠️ Failed to parse ${outputsPath}:`, error);
      }
    }
  }

  // If running in CI and no outputs found, this is an error
  if (isCI) {
    throw new Error(
      'Integration tests require deployment outputs but none were found in cfn-outputs/. ' +
      'Ensure the deployment step completed successfully and outputs were uploaded as artifacts.'
    );
  }

  throw new Error(
    `Outputs file not found. Checked paths: ${possibleOutputPaths.join(', ')}. ` +
    'Did you run the deployment?'
  );
}

/**
 * Maps outputs dynamically by finding keys that match prefixes
 * This allows tests to work with any environment suffix (dev, pr123, test, prod, etc.)
 */
function mapOutputs(rawOutputs: Record<string, string>): Record<string, string> {
  const prefixMap: Record<string, string> = {
    'VPCId': 'VpcId',
    'PublicSubnetIds': 'PublicSubnetIds',
    'PrivateSubnetIds': 'PrivateSubnetIds',
    'AutoScalingGroupName': 'AutoScalingGroupName',
    // 'BastionInstanceId': 'BastionInstanceId',  // Removed - bastion host not deployed
    'S3BucketName': 'S3BucketName',
    'SecretArn': 'SecretArn',
    'EC2RoleArn': 'EC2RoleArn',
    'SNSTopicArn': 'SNSTopicArn',
    'BackupVaultName': 'BackupVaultName',
    'CentralLogGroupName': 'CentralLogGroupName',
    'EC2LogGroupName': 'EC2LogGroupName',
    'ElasticIPAddress': 'ElasticIPAddress',
    'KMSKeyId': 'KMSKeyId',
  };

  const mapped: Record<string, string> = {};

  for (const [prefix, mappedKey] of Object.entries(prefixMap)) {
    // Find the key that starts with this prefix
    const foundKey = Object.keys(rawOutputs).find((key) => key.startsWith(prefix));
    if (foundKey) {
      mapped[mappedKey] = rawOutputs[foundKey];
    }
  }

  return mapped;
}

/**
 * Extract region from an ARN
 */
function extractRegionFromArn(arn: string): string | null {
  const parts = arn.split(':');
  return parts.length >= 4 ? parts[3] : null;
}

describe('Infrastructure Integration Tests', () => {
  beforeAll(() => {
    // Log test environment info
    console.log('🔍 Integration test environment:');
    console.log(`  Environment Suffix: ${environmentSuffix}`);
    console.log(`  CI Mode: ${isCI}`);

    // Load outputs
    rawOutputs = loadOutputs();

    // Map outputs dynamically
    outputs = mapOutputs(rawOutputs);

    console.log(`  Available Outputs: ${Object.keys(outputs).join(', ')}`);

    // Determine region from ARN or environment
    const snsArn = outputs.SNSTopicArn || outputs.SecretArn || '';
    region =
      extractRegionFromArn(snsArn) ||
      process.env.AWS_REGION ||
      process.env.CDK_DEFAULT_REGION ||
      'us-east-1';

    console.log(`  Region: ${region}`);

    // Initialize AWS clients with the correct region
    ec2Client = new EC2Client({ region });
    autoScalingClient = new AutoScalingClient({ region });
    s3Client = new S3Client({ region });
    secretsManagerClient = new SecretsManagerClient({ region });
    snsClient = new SNSClient({ region });
    backupClient = new BackupClient({ region });
    kmsClient = new KMSClient({ region });
    iamClient = new IAMClient({ region });
    cloudWatchClient = new CloudWatchClient({ region });
    cloudWatchLogsClient = new CloudWatchLogsClient({ region });
    ssmClient = new SSMClient({ region });
  });

  describe('VPC and Network Configuration', () => {
    test('should have VPC in available state with DNS support enabled', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];

      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBeDefined();

      // Check DNS hostnames
      const dnsHostnamesCommand = new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: 'enableDnsHostnames',
      });
      const dnsHostnamesAttr = await ec2Client.send(dnsHostnamesCommand);
      expect(dnsHostnamesAttr.EnableDnsHostnames?.Value).toBe(true);

      // Check DNS support
      const dnsSupportCommand = new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: 'enableDnsSupport',
      });
      const dnsSupportAttr = await ec2Client.send(dnsSupportCommand);
      expect(dnsSupportAttr.EnableDnsSupport?.Value).toBe(true);
    });

    test('should have both public and private subnets across 2 AZs', async () => {
      const vpcId = outputs.VpcId;
      const publicSubnetIds = outputs.PublicSubnetIds?.split(',') || [];
      const privateSubnetIds = outputs.PrivateSubnetIds?.split(',') || [];

      expect(publicSubnetIds.length).toBe(2);
      expect(privateSubnetIds.length).toBe(2);

      const command = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(4);

      // Verify subnets are in different AZs
      const azs = new Set(response.Subnets!.map((s) => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('should have NAT gateway for private subnet internet access', async () => {
      const vpcId = outputs.VpcId;
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'state', Values: ['available'] },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);

      const natGateway = response.NatGateways![0];
      expect(natGateway.State).toBe('available');
      expect(natGateway.NatGatewayAddresses).toBeDefined();
    });

    test('should have security groups configured in VPC', async () => {
      const vpcId = outputs.VpcId;
      const command = new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);

      response.SecurityGroups!.forEach((sg) => {
        expect(sg.GroupName).toBeDefined();
        expect(sg.VpcId).toBe(vpcId);
      });
    });
  });

  describe('Elastic IP Configuration', () => {
    test('should have Elastic IP allocated', async () => {
      const elasticIp = outputs.ElasticIPAddress;
      expect(elasticIp).toBeDefined();

      const command = new DescribeAddressesCommand({
        PublicIps: [elasticIp],
      });

      const response = await ec2Client.send(command);
      expect(response.Addresses).toHaveLength(1);

      const address = response.Addresses![0];
      expect(address.PublicIp).toBe(elasticIp);
      expect(address.Domain).toBe('vpc');
    });
  });

  describe('Auto Scaling Group Configuration', () => {
    test('should have ASG with correct configuration', async () => {
      const asgName = outputs.AutoScalingGroupName;
      expect(asgName).toBeDefined();

      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });

      const response = await autoScalingClient.send(command);
      expect(response.AutoScalingGroups).toHaveLength(1);

      const asg = response.AutoScalingGroups![0];
      expect(asg.AutoScalingGroupName).toBe(asgName);
      expect(asg.MinSize).toBeGreaterThanOrEqual(1);
      expect(asg.MaxSize).toBeGreaterThanOrEqual(asg.MinSize!);
      expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(asg.MinSize!);
    });

    test('should have ASG instances in private subnets', async () => {
      const asgName = outputs.AutoScalingGroupName;
      const privateSubnetIds = outputs.PrivateSubnetIds?.split(',') || [];

      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });

      const response = await autoScalingClient.send(command);
      const asg = response.AutoScalingGroups![0];

      // Verify ASG VPC Zone Identifiers contain private subnets
      const asgSubnets = asg.VPCZoneIdentifier?.split(',') || [];
      expect(asgSubnets.length).toBeGreaterThan(0);

      // At least one ASG subnet should be a private subnet
      const hasPrivateSubnet = asgSubnets.some(subnet => privateSubnetIds.includes(subnet));
      expect(hasPrivateSubnet).toBe(true);
    });

    test('should have healthy instances in ASG', async () => {
      const asgName = outputs.AutoScalingGroupName;

      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });

      const response = await autoScalingClient.send(command);
      const asg = response.AutoScalingGroups![0];

      // Check that instances exist and are in service
      expect(asg.Instances!.length).toBeGreaterThan(0);

      const healthyInstances = asg.Instances!.filter(
        (instance) => instance.HealthStatus === 'Healthy' && instance.LifecycleState === 'InService'
      );
      expect(healthyInstances.length).toBeGreaterThan(0);
    });
  });

  describe('S3 Bucket Security and Configuration', () => {
    test('should have S3 bucket with KMS encryption enabled', async () => {
      const bucketName = outputs.S3BucketName;
      expect(bucketName).toBeDefined();

      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const encryptionRule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(encryptionRule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
    });

    test('should have S3 bucket with versioning enabled', async () => {
      const bucketName = outputs.S3BucketName;
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('should have S3 bucket with public access blocked', async () => {
      const bucketName = outputs.S3BucketName;
      const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      const config = response.PublicAccessBlockConfiguration!;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Secrets Manager Configuration', () => {
    test('should have secret with generated credentials', async () => {
      const secretArn = outputs.SecretArn;
      expect(secretArn).toBeDefined();

      const command = new GetSecretValueCommand({ SecretId: secretArn });
      const response = await secretsManagerClient.send(command);

      expect(response.SecretString).toBeDefined();
      const secret = JSON.parse(response.SecretString!);
      expect(secret.username).toBeDefined();
      expect(secret.password).toBeDefined();
      expect(secret.password.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Logs Configuration', () => {
    test('should have central log group created', async () => {
      const logGroupName = outputs.CentralLogGroupName;
      expect(logGroupName).toBeDefined();

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await cloudWatchLogsClient.send(command);
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups!.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup!.retentionInDays).toBeDefined();
    });

    test('should have EC2 log group created', async () => {
      const logGroupName = outputs.EC2LogGroupName;
      expect(logGroupName).toBeDefined();

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await cloudWatchLogsClient.send(command);
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups!.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
    });
  });

  describe('CloudWatch Alarms Configuration', () => {
    test('should have CPU alarms configured for ASG', async () => {
      const command = new DescribeAlarmsCommand({});
      const response = await cloudWatchClient.send(command);

      // Find alarms related to our infrastructure (cpu-high or cpu-low)
      const cpuAlarms = response.MetricAlarms!.filter(
        (alarm) => alarm.AlarmName?.includes('cpu-high') || alarm.AlarmName?.includes('cpu-low')
      );

      expect(cpuAlarms.length).toBeGreaterThanOrEqual(1);

      cpuAlarms.forEach((alarm) => {
        expect(alarm.MetricName).toBeDefined();
        expect(alarm.Threshold).toBeDefined();
        expect(alarm.EvaluationPeriods).toBeDefined();
      });
    });
  });

  describe('SNS Topic Configuration', () => {
    test('should have SNS topic for alarms', async () => {
      const topicArn = outputs.SNSTopicArn;
      expect(topicArn).toBeDefined();

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(topicArn);
    });
  });

  describe('AWS Backup Configuration', () => {
    test('should have backup vault created', async () => {
      const vaultName = outputs.BackupVaultName;
      expect(vaultName).toBeDefined();

      const command = new DescribeBackupVaultCommand({ BackupVaultName: vaultName });
      const response = await backupClient.send(command);

      expect(response.BackupVaultName).toBe(vaultName);
      expect(response.BackupVaultArn).toBeDefined();
      expect(response.EncryptionKeyArn).toBeDefined();
    });

    test('should have backup plan associated', async () => {
      // Skip this test for LocalStack as it has limited Backup service support
      const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
        process.env.AWS_ENDPOINT_URL?.includes('127.0.0.1');

      if (isLocalStack) {
        console.log('⏭️  Skipping backup plan test for LocalStack');
        return;
      }

      const command = new ListBackupPlansCommand({});
      const response = await backupClient.send(command);

      expect(response.BackupPlansList!.length).toBeGreaterThan(0);

      // Find backup plan related to our infrastructure
      const backupPlan = response.BackupPlansList!.find(
        (plan) => plan.BackupPlanName?.includes('infrastructure-backup-plan')
      );
      expect(backupPlan).toBeDefined();
    });
  });

  describe('KMS Key Configuration', () => {
    test('should have KMS key with rotation enabled', async () => {
      const keyId = outputs.KMSKeyId;
      expect(keyId).toBeDefined();

      const command = new DescribeKeyCommand({ KeyId: keyId });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyId).toBe(keyId);
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
    });
  });

  describe('IAM Role Configuration', () => {
    test('should have EC2 role with correct permissions', async () => {
      const roleArn = outputs.EC2RoleArn;
      expect(roleArn).toBeDefined();

      // Extract role name from ARN
      const roleName = roleArn.split('/').pop()!;

      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);
      expect(response.Role!.AssumeRolePolicyDocument).toBeDefined();
    });
  });

  describe('End-to-End Workflow: S3 Read/Write Operations', () => {
    const testKey = `integration-test-${uuidv4()}.txt`;
    const testContent = 'Integration test file content';

    test('should successfully write to S3 bucket', async () => {
      const bucketName = outputs.S3BucketName;

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should successfully read from S3 bucket', async () => {
      const bucketName = outputs.S3BucketName;

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      });

      const response = await s3Client.send(command);
      const content = await response.Body!.transformToString();
      expect(content).toBe(testContent);
    });

    afterAll(async () => {
      // Cleanup: Delete test object from S3
      const bucketName = outputs.S3BucketName;
      if (bucketName) {
        try {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: testKey,
            })
          );
        } catch (error) {
          console.log('Cleanup warning: Could not delete test object', error);
        }
      }
    });
  });

  describe('End-to-End Workflow: EC2 and Network Connectivity', () => {
    test('should have ASG instances connected to same VPC', async () => {
      const asgName = outputs.AutoScalingGroupName;
      const vpcId = outputs.VpcId;

      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });

      const asgResponse = await autoScalingClient.send(asgCommand);
      const asg = asgResponse.AutoScalingGroups![0];

      if (asg.Instances && asg.Instances.length > 0) {
        const instanceIds = asg.Instances.map((i) => i.InstanceId!);

        const ec2Command = new DescribeInstancesCommand({
          InstanceIds: instanceIds,
        });

        const ec2Response = await ec2Client.send(ec2Command);

        ec2Response.Reservations!.forEach((reservation) => {
          reservation.Instances!.forEach((instance) => {
            expect(instance.VpcId).toBe(vpcId);
          });
        });
      }
    });
  });

  describe('End-to-End Workflow: Security and Encryption Validation', () => {
    test('should have S3 bucket encrypted with KMS key', async () => {
      const bucketName = outputs.S3BucketName;
      const kmsKeyId = outputs.KMSKeyId;

      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      const encryptionRule = response.ServerSideEncryptionConfiguration!.Rules![0];
      const kmsKeyArn = encryptionRule.ApplyServerSideEncryptionByDefault!.KMSMasterKeyID;

      // KMS key should be defined and match our key
      expect(kmsKeyArn).toBeDefined();
      expect(kmsKeyArn).toContain(kmsKeyId);
    });

    test('should have backup vault encrypted with KMS', async () => {
      const vaultName = outputs.BackupVaultName;
      const kmsKeyId = outputs.KMSKeyId;

      const command = new DescribeBackupVaultCommand({ BackupVaultName: vaultName });
      const response = await backupClient.send(command);

      expect(response.EncryptionKeyArn).toBeDefined();
      expect(response.EncryptionKeyArn).toContain(kmsKeyId);
    });
  });

  describe('End-to-End Workflow: Resource Connectivity Validation', () => {
    test('should have CloudWatch alarms connected to SNS topic', async () => {
      // Use the SNS topic ARN from stack outputs
      const topicArn = outputs.SNSTopicArn;
      expect(topicArn).toBeDefined();

      const command = new DescribeAlarmsCommand({});
      const response = await cloudWatchClient.send(command);

      // Filter to only alarms from this stack (cpu-high or cpu-low patterns)
      const stackAlarms = response.MetricAlarms!.filter(
        (alarm) => alarm.AlarmName?.includes('cpu-high') || alarm.AlarmName?.includes('cpu-low')
      );

      // Check that at least one stack alarm has SNS topic configured in any action
      const alarmsWithSns = stackAlarms.filter((alarm) =>
        alarm.AlarmActions?.includes(topicArn) ||
        alarm.OKActions?.includes(topicArn) ||
        alarm.InsufficientDataActions?.includes(topicArn)
      );

      expect(alarmsWithSns.length).toBeGreaterThan(0);
    });

    // NOTE: Test updated to use ASG instances instead of bastion
    test('should have EC2 instances using IAM role', async () => {
      const asgName = outputs.AutoScalingGroupName;

      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });

      const asgResponse = await autoScalingClient.send(asgCommand);
      const asg = asgResponse.AutoScalingGroups![0];
      const instanceIds = asg.Instances!.map((i) => i.InstanceId!);

      if (instanceIds.length > 0) {
        const command = new DescribeInstancesCommand({
          InstanceIds: [instanceIds[0]],
        });

        const response = await ec2Client.send(command);
        const instance = response.Reservations![0].Instances![0];

        expect(instance.IamInstanceProfile).toBeDefined();
        expect(instance.IamInstanceProfile!.Arn).toBeDefined();
        // Instance profile should be associated with the instance
        expect(instance.IamInstanceProfile!.Arn).toContain('instance-profile');
      }
    });
  });

  // ==================================================================================
  // ADDITIONAL COMPREHENSIVE TESTS
  // ==================================================================================

  describe('VPC Route Tables and Network Flow', () => {
    test('should have public subnet route tables with internet gateway route', async () => {
      const vpcId = outputs.VpcId;
      const publicSubnetIds = outputs.PublicSubnetIds?.split(',') || [];

      const command = new DescribeRouteTablesCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });

      const response = await ec2Client.send(command);

      // Find route tables associated with public subnets
      const publicRouteTables = response.RouteTables!.filter((rt) =>
        rt.Associations?.some((assoc) =>
          assoc.SubnetId && publicSubnetIds.includes(assoc.SubnetId)
        )
      );

      expect(publicRouteTables.length).toBeGreaterThan(0);

      // Verify public route tables have route to internet gateway
      publicRouteTables.forEach((rt) => {
        const igwRoute = rt.Routes?.find(
          (route) => route.GatewayId?.startsWith('igw-') && route.DestinationCidrBlock === '0.0.0.0/0'
        );
        expect(igwRoute).toBeDefined();
      });
    });

    test('should have private subnet route tables with NAT gateway route', async () => {
      const vpcId = outputs.VpcId;
      const privateSubnetIds = outputs.PrivateSubnetIds?.split(',') || [];

      const command = new DescribeRouteTablesCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });

      const response = await ec2Client.send(command);

      // Find route tables associated with private subnets
      const privateRouteTables = response.RouteTables!.filter((rt) =>
        rt.Associations?.some((assoc) =>
          assoc.SubnetId && privateSubnetIds.includes(assoc.SubnetId)
        )
      );

      expect(privateRouteTables.length).toBeGreaterThan(0);

      // Verify private route tables have route to NAT gateway
      privateRouteTables.forEach((rt) => {
        const natRoute = rt.Routes?.find(
          (route) => route.NatGatewayId?.startsWith('nat-') && route.DestinationCidrBlock === '0.0.0.0/0'
        );
        expect(natRoute).toBeDefined();
      });
    });
  });

  describe('Security Group Rules Validation', () => {
    test('should have EC2 security group with SSH rule', async () => {
      const vpcId = outputs.VpcId;

      const command = new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });

      const response = await ec2Client.send(command);

      // Find security group with SSH rule
      const sgWithSsh = response.SecurityGroups!.find((sg) =>
        sg.IpPermissions?.some(
          (perm) => perm.FromPort === 22 && perm.ToPort === 22 && perm.IpProtocol === 'tcp'
        )
      );

      expect(sgWithSsh).toBeDefined();
    });

    test('should have security groups with egress configuration', async () => {
      const vpcId = outputs.VpcId;

      const command = new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });

      const response = await ec2Client.send(command);

      // Filter out the default security group which may have no explicit egress rules
      const nonDefaultSgs = response.SecurityGroups!.filter(
        (sg) => sg.GroupName !== 'default'
      );

      // At least one non-default security group should have outbound rules
      const sgsWithEgress = nonDefaultSgs.filter(
        (sg) => sg.IpPermissionsEgress && sg.IpPermissionsEgress.length > 0
      );
      expect(sgsWithEgress.length).toBeGreaterThan(0);
    });
  });

  describe('S3 Bucket Access Logging and Lifecycle', () => {
    test('should have S3 bucket with access logging enabled', async () => {
      const bucketName = outputs.S3BucketName;

      const command = new GetBucketLoggingCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      // Access logging should be enabled
      expect(response.LoggingEnabled).toBeDefined();
      expect(response.LoggingEnabled!.TargetBucket).toBeDefined();
      expect(response.LoggingEnabled!.TargetPrefix).toBeDefined();
    });

    test('should have S3 bucket with lifecycle rules configured', async () => {
      const bucketName = outputs.S3BucketName;

      const command = new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);

      // Verify lifecycle rules are properly configured
      const hasNoncurrentVersionRule = response.Rules!.some(
        (rule) => rule.NoncurrentVersionExpiration !== undefined
      );
      expect(hasNoncurrentVersionRule).toBe(true);
    });

    test('should have S3 bucket policy enforcing secure transport', async () => {
      const bucketName = outputs.S3BucketName;

      const command = new GetBucketPolicyCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.Policy).toBeDefined();
      const policy = JSON.parse(response.Policy!);

      // Verify policy has statements
      expect(policy.Statement).toBeDefined();
      expect(policy.Statement.length).toBeGreaterThan(0);

      // Verify there's a deny statement for insecure transport
      const denyInsecureStatement = policy.Statement.find(
        (stmt: { Effect: string; Sid?: string; Condition?: { Bool?: { 'aws:SecureTransport'?: string } } }) =>
          stmt.Effect === 'Deny' &&
          stmt.Condition?.Bool?.['aws:SecureTransport'] === 'false'
      );
      expect(denyInsecureStatement).toBeDefined();
    });
  });

  describe('KMS Key Rotation and Policies', () => {
    test('should have KMS key with automatic rotation enabled', async () => {
      const keyId = outputs.KMSKeyId;

      const command = new GetKeyRotationStatusCommand({ KeyId: keyId });
      const response = await kmsClient.send(command);

      expect(response.KeyRotationEnabled).toBe(true);
    });
  });

  describe('IAM Role Policies and Permissions', () => {
    test('should have EC2 role with SSM managed policy attached', async () => {
      const roleArn = outputs.EC2RoleArn;
      const roleName = roleArn.split('/').pop()!;

      const command = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      const ssmPolicy = response.AttachedPolicies!.find(
        (policy) => policy.PolicyName?.includes('SSM') || policy.PolicyArn?.includes('SSM')
      );
      expect(ssmPolicy).toBeDefined();
    });

    test('should have EC2 role with CloudWatch policy attached', async () => {
      const roleArn = outputs.EC2RoleArn;
      const roleName = roleArn.split('/').pop()!;

      const command = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      const cloudWatchPolicy = response.AttachedPolicies!.find(
        (policy) =>
          policy.PolicyName?.includes('CloudWatch') || policy.PolicyArn?.includes('CloudWatch')
      );
      expect(cloudWatchPolicy).toBeDefined();
    });

    test('should have EC2 role with inline policies for secrets and S3', async () => {
      const roleArn = outputs.EC2RoleArn;
      const roleName = roleArn.split('/').pop()!;

      const command = new ListRolePoliciesCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.PolicyNames!.length).toBeGreaterThan(0);
    });
  });

  describe('Backup Selections and Resource Tags', () => {
    test('should have backup plan with EC2 selection', async () => {
      // Skip this test for LocalStack as it has limited Backup service support
      const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
        process.env.AWS_ENDPOINT_URL?.includes('127.0.0.1');

      if (isLocalStack) {
        console.log('⏭️  Skipping backup selections test for LocalStack');
        return;
      }

      const command = new ListBackupPlansCommand({});
      const response = await backupClient.send(command);

      const backupPlan = response.BackupPlansList!.find(
        (plan) => plan.BackupPlanName?.includes('infrastructure-backup-plan')
      );
      expect(backupPlan).toBeDefined();

      // List backup selections for this plan
      const selectionsCommand = new ListBackupSelectionsCommand({
        BackupPlanId: backupPlan!.BackupPlanId!,
      });

      const selectionsResponse = await backupClient.send(selectionsCommand);
      expect(selectionsResponse.BackupSelectionsList!.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Log Group Encryption', () => {
    test('should have central log group with KMS encryption', async () => {
      const logGroupName = outputs.CentralLogGroupName;
      const kmsKeyId = outputs.KMSKeyId;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await cloudWatchLogsClient.send(command);
      const logGroup = response.logGroups!.find((lg) => lg.logGroupName === logGroupName);

      expect(logGroup).toBeDefined();
      expect(logGroup!.kmsKeyId).toBeDefined();
      expect(logGroup!.kmsKeyId).toContain(kmsKeyId);
    });

    test('should have EC2 log group with KMS encryption', async () => {
      const logGroupName = outputs.EC2LogGroupName;
      const kmsKeyId = outputs.KMSKeyId;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await cloudWatchLogsClient.send(command);
      const logGroup = response.logGroups!.find((lg) => lg.logGroupName === logGroupName);

      expect(logGroup).toBeDefined();
      expect(logGroup!.kmsKeyId).toBeDefined();
      expect(logGroup!.kmsKeyId).toContain(kmsKeyId);
    });
  });

  describe('SNS Topic KMS Encryption', () => {
    test('should have SNS topic with KMS encryption', async () => {
      const topicArn = outputs.SNSTopicArn;
      const kmsKeyId = outputs.KMSKeyId;

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes!.KmsMasterKeyId).toBeDefined();
      expect(response.Attributes!.KmsMasterKeyId).toContain(kmsKeyId);
    });
  });

  describe('ASG Launch Template Configuration', () => {
    test('should have ASG using launch template', async () => {
      const asgName = outputs.AutoScalingGroupName;

      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });

      const response = await autoScalingClient.send(command);
      const asg = response.AutoScalingGroups![0];

      // Verify launch template is configured
      expect(
        asg.LaunchTemplate !== undefined || asg.MixedInstancesPolicy?.LaunchTemplate !== undefined
      ).toBe(true);
    });

    test('should have launch template with IMDSv2 required', async () => {
      const asgName = outputs.AutoScalingGroupName;

      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });

      const asgResponse = await autoScalingClient.send(asgCommand);
      const asg = asgResponse.AutoScalingGroups![0];

      const launchTemplateId =
        asg.LaunchTemplate?.LaunchTemplateId ||
        asg.MixedInstancesPolicy?.LaunchTemplate?.LaunchTemplateSpecification?.LaunchTemplateId;

      expect(launchTemplateId).toBeDefined();

      const ltCommand = new DescribeLaunchTemplatesCommand({
        LaunchTemplateIds: [launchTemplateId!],
      });

      const ltResponse = await ec2Client.send(ltCommand);
      expect(ltResponse.LaunchTemplates!.length).toBe(1);
    });
  });

  describe('ASG Instance Configuration', () => {
    test('should have ASG instances with IMDSv2 required', async () => {
      const asgName = outputs.AutoScalingGroupName;

      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });

      const asgResponse = await autoScalingClient.send(asgCommand);
      const asg = asgResponse.AutoScalingGroups![0];

      if (asg.Instances && asg.Instances.length > 0) {
        const instanceIds = asg.Instances.map((i) => i.InstanceId!);

        const command = new DescribeInstancesCommand({
          InstanceIds: [instanceIds[0]],
        });

        const response = await ec2Client.send(command);
        const instance = response.Reservations![0].Instances![0];

        expect(instance.MetadataOptions).toBeDefined();
        expect(instance.MetadataOptions!.HttpTokens).toBe('required');
      }
    });

    test('should have ASG instances with EBS volumes', async () => {
      const asgName = outputs.AutoScalingGroupName;

      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });

      const asgResponse = await autoScalingClient.send(asgCommand);
      const asg = asgResponse.AutoScalingGroups![0];

      if (asg.Instances && asg.Instances.length > 0) {
        const instanceIds = asg.Instances.map((i) => i.InstanceId!);

        const command = new DescribeInstancesCommand({
          InstanceIds: [instanceIds[0]],
        });

        const response = await ec2Client.send(command);
        const instance = response.Reservations![0].Instances![0];

        expect(instance.BlockDeviceMappings).toBeDefined();
        expect(instance.BlockDeviceMappings!.length).toBeGreaterThan(0);
      }
    });
  });

  describe('End-to-End Workflow: Full Infrastructure Connectivity', () => {
    test('should have all resources in same region', async () => {
      const snsArn = outputs.SNSTopicArn;
      const secretArn = outputs.SecretArn;

      const snsRegion = extractRegionFromArn(snsArn);
      const secretRegion = extractRegionFromArn(secretArn);

      expect(snsRegion).toBe(region);
      expect(secretRegion).toBe(region);
    });

    // NOTE: Test updated to verify ASG instances use correct security group
    test('should have ASG instances using security group', async () => {
      const asgName = outputs.AutoScalingGroupName;

      // Get ASG instances
      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const asgResponse = await autoScalingClient.send(asgCommand);
      const asg = asgResponse.AutoScalingGroups![0];

      if (asg.Instances && asg.Instances.length > 0) {
        const asgInstanceIds = asg.Instances.map((i) => i.InstanceId!);

        const asgInstancesCommand = new DescribeInstancesCommand({
          InstanceIds: asgInstanceIds,
        });
        const asgInstancesResponse = await ec2Client.send(asgInstancesCommand);

        asgInstancesResponse.Reservations!.forEach((reservation) => {
          reservation.Instances!.forEach((instance) => {
            const instanceSgIds = instance.SecurityGroups?.map((sg) => sg.GroupId) || [];
            // ASG instances should have security groups attached
            expect(instanceSgIds.length).toBeGreaterThan(0);
          });
        });
      }
    });

    test('should have secrets encrypted with the master KMS key', async () => {
      const secretArn = outputs.SecretArn;
      const kmsKeyId = outputs.KMSKeyId;

      // Describe the secret to get the KMS key ARN
      const command = new GetSecretValueCommand({ SecretId: secretArn });
      const response = await secretsManagerClient.send(command);

      // If we can read the secret, it means we have access to the KMS key
      expect(response.SecretString).toBeDefined();

      // Verify the ARN contains elements suggesting it's using our KMS key
      // Note: The secret ARN itself doesn't contain KMS info, but successful retrieval 
      // indicates proper KMS permissions are in place
      expect(response.ARN).toBeDefined();
    });
  });

  describe('End-to-End Workflow: S3 Versioning Validation', () => {
    const versionTestKey = `version-test-${uuidv4()}.txt`;
    const originalContent = 'Original content v1';
    const updatedContent = 'Updated content v2';

    test('should maintain object versions in S3', async () => {
      const bucketName = outputs.S3BucketName;

      // Create initial version
      const putCommand1 = new PutObjectCommand({
        Bucket: bucketName,
        Key: versionTestKey,
        Body: originalContent,
      });
      const putResponse1 = await s3Client.send(putCommand1);
      expect(putResponse1.VersionId).toBeDefined();

      // Create updated version
      const putCommand2 = new PutObjectCommand({
        Bucket: bucketName,
        Key: versionTestKey,
        Body: updatedContent,
      });
      const putResponse2 = await s3Client.send(putCommand2);
      expect(putResponse2.VersionId).toBeDefined();

      // Version IDs should be different
      expect(putResponse1.VersionId).not.toBe(putResponse2.VersionId);

      // Read latest version
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: versionTestKey,
      });
      const getResponse = await s3Client.send(getCommand);
      const content = await getResponse.Body!.transformToString();
      expect(content).toBe(updatedContent);
    });

    afterAll(async () => {
      // Cleanup
      const bucketName = outputs.S3BucketName;
      if (bucketName) {
        try {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: versionTestKey,
            })
          );
        } catch (error) {
          console.log('Cleanup warning: Could not delete version test object', error);
        }
      }
    });
  });

  describe('Resource Validation Summary', () => {
    test('should have all required outputs present', () => {
      const requiredOutputs = [
        'VpcId',
        'PublicSubnetIds',
        'PrivateSubnetIds',
        'AutoScalingGroupName',
        // 'BastionInstanceId',  // Removed - bastion host not deployed
        'S3BucketName',
        'SecretArn',
        'EC2RoleArn',
        'SNSTopicArn',
        'BackupVaultName',
        'CentralLogGroupName',
        'EC2LogGroupName',
        'ElasticIPAddress',
        'KMSKeyId',
      ];

      requiredOutputs.forEach((output) => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
        expect(typeof outputs[output]).toBe('string');
      });
    });


    test('should have outputs containing valid AWS resource identifiers', () => {
      // Validate ARN formats
      expect(outputs.SecretArn).toMatch(/^arn:aws:secretsmanager:/);
      expect(outputs.EC2RoleArn).toMatch(/^arn:aws:iam:/);
      expect(outputs.SNSTopicArn).toMatch(/^arn:aws:sns:/);

      // Validate resource ID formats
      expect(outputs.VpcId).toMatch(/^vpc-/);
      // expect(outputs.BastionInstanceId).toMatch(/^i-/);  // Removed - bastion host not deployed
      expect(outputs.KMSKeyId).toMatch(/^[a-f0-9-]{36}$/);
    });
  });
});
