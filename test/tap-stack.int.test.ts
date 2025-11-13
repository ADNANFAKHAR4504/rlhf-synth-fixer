import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeFlowLogsCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  KMSClient,
} from '@aws-sdk/client-kms';
import {
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
  InvokeCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client
} from '@aws-sdk/client-s3';
import fs from 'fs';

// Load outputs from deployed stack
const outputs = JSON.parse(
  fs.readFileSync('./cfn-outputs/flat-outputs.json', 'utf8')
);
const region = process.env.AWS_REGION || 'us-east-1';

const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const ec2Client = new EC2Client({ region });
const kmsClient = new KMSClient({ region });
const logsClient = new CloudWatchLogsClient({ region });

describe('PCI-DSS Compliant Secure Data Processing Infrastructure Integration Tests', () => {
  describe('S3 Bucket Security Configuration', () => {
    test('S3 bucket exists and is accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.DataBucketName,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('S3 bucket has versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.DataBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket has KMS encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.DataBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('S3 bucket has public access blocked', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.DataBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(
        true
      );
      expect(
        response.PublicAccessBlockConfiguration?.RestrictPublicBuckets
      ).toBe(true);
    });

    test('S3 bucket has lifecycle policies configured', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.DataBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);

      const rule = response.Rules?.[0];
      expect(rule?.Status).toBe('Enabled');
      expect(rule?.Transitions).toBeDefined();
      expect(rule?.Transitions?.length).toBeGreaterThan(0);
    });
  });

  describe('Lambda Function Configuration', () => {
    test('Lambda function exists and is configured correctly', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.FunctionName).toBe(
        outputs.LambdaFunctionName
      );
      expect(response.Configuration?.Runtime).toBe('python3.11');
      expect(response.Configuration?.Timeout).toBe(300);
      expect(response.Configuration?.MemorySize).toBe(512);
    });

    test('Lambda function is deployed in VPC private subnets', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.LambdaFunctionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.VpcConfig).toBeDefined();
      expect(response.VpcConfig?.VpcId).toBe(outputs.VPCId);
      expect(response.VpcConfig?.SubnetIds).toContain(outputs.PrivateSubnet1Id);
      expect(response.VpcConfig?.SubnetIds).toContain(outputs.PrivateSubnet2Id);
      expect(response.VpcConfig?.SecurityGroupIds).toContain(
        outputs.LambdaSecurityGroupId
      );
    });

    test('Lambda function has correct environment variables', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.LambdaFunctionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Environment?.Variables?.BUCKET_NAME).toBe(
        outputs.DataBucketName
      );
      expect(response.Environment?.Variables?.KMS_KEY_ID).toBe(
        outputs.KMSKeyId
      );
    });

    test('Lambda function can be invoked successfully', async () => {
      const command = new InvokeCommand({
        FunctionName: outputs.LambdaFunctionName,
        Payload: JSON.stringify({}),
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);

      const payload = JSON.parse(
        new TextDecoder().decode(response.Payload)
      );
      expect(payload.statusCode).toBe(200);
      expect(JSON.parse(payload.body).message).toBe('Data processor is ready');
    });
  });

  describe('VPC Network Configuration', () => {
    test('VPC exists with correct configuration', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs?.[0].VpcId).toBe(outputs.VPCId);
    });

    test('Private subnets exist in different availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id],
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(2);

      const azs = response.Subnets?.map((subnet) => subnet.AvailabilityZone);
      expect(new Set(azs).size).toBe(2); // Different AZs

      response.Subnets?.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(outputs.VPCId);
      });
    });

    test('Security group has explicit egress rules only', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.LambdaSecurityGroupId],
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);

      const sg = response.SecurityGroups?.[0];
      expect(sg?.IpPermissions).toHaveLength(0); // No ingress rules
      expect(sg?.IpPermissionsEgress).toBeDefined();

      // Verify no 0.0.0.0/0 CIDR blocks
      sg?.IpPermissionsEgress?.forEach((rule) => {
        rule.IpRanges?.forEach((ipRange) => {
          expect(ipRange.CidrIp).not.toBe('0.0.0.0/0');
        });
      });
    });

    test('VPC Flow Logs are enabled', async () => {
      const command = new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: 'resource-id',
            Values: [outputs.VPCId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.FlowLogs).toBeDefined();
      expect(response.FlowLogs?.length).toBeGreaterThan(0);

      const flowLog = response.FlowLogs?.[0];
      expect(flowLog?.TrafficType).toBe('ALL');
      expect(flowLog?.LogDestinationType).toBe('cloud-watch-logs');
    });
  });

  describe('KMS Key Configuration', () => {
    test('KMS key exists and has rotation enabled', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.KMSKeyId,
      });

      const response = await kmsClient.send(command);
      expect(response.KeyMetadata?.KeyId).toBe(outputs.KMSKeyId);
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });

    test('KMS key has automatic rotation enabled', async () => {
      const command = new GetKeyRotationStatusCommand({
        KeyId: outputs.KMSKeyId,
      });

      const response = await kmsClient.send(command);
      expect(response.KeyRotationEnabled).toBe(true);
    });
  });

  describe('CloudWatch Logs Configuration', () => {
    test('VPC Flow Logs log group exists with correct retention', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.VPCFlowLogsLogGroupName,
      });

      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);

      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === outputs.VPCFlowLogsLogGroupName
      );
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(90);
      expect(logGroup?.kmsKeyId).toContain(outputs.KMSKeyId);
    });

    test('Lambda log group exists with correct retention', async () => {
      const lambdaLogGroupName = `/aws/lambda/${outputs.LambdaFunctionName}`;
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: lambdaLogGroupName,
      });

      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);

      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === lambdaLogGroupName
      );
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(90);
      expect(logGroup?.kmsKeyId).toContain(outputs.KMSKeyId);
    });
  });

  describe('Resource Tagging Compliance', () => {
    test('All resources have required tags', async () => {
      // Check VPC tags
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcTags = vpcResponse.Vpcs?.[0].Tags || [];
      expect(vpcTags.some((tag) => tag.Key === 'Environment')).toBe(true);
      expect(vpcTags.some((tag) => tag.Key === 'Owner')).toBe(true);
      expect(vpcTags.some((tag) => tag.Key === 'CostCenter')).toBe(true);

      // Check subnet tags
      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PrivateSubnet1Id],
      });
      const subnetResponse = await ec2Client.send(subnetCommand);
      const subnetTags = subnetResponse.Subnets?.[0].Tags || [];
      expect(subnetTags.some((tag) => tag.Key === 'Environment')).toBe(true);
      expect(subnetTags.some((tag) => tag.Key === 'Owner')).toBe(true);
      expect(subnetTags.some((tag) => tag.Key === 'CostCenter')).toBe(true);

      // Check security group tags
      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.LambdaSecurityGroupId],
      });
      const sgResponse = await ec2Client.send(sgCommand);
      const sgTags = sgResponse.SecurityGroups?.[0].Tags || [];
      expect(sgTags.some((tag) => tag.Key === 'Environment')).toBe(true);
      expect(sgTags.some((tag) => tag.Key === 'Owner')).toBe(true);
      expect(sgTags.some((tag) => tag.Key === 'CostCenter')).toBe(true);
    });
  });
});
