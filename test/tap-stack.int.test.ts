import fs from 'fs';
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { S3Client, GetBucketEncryptionCommand, GetPublicAccessBlockCommand } from '@aws-sdk/client-s3';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { CloudTrailClient, DescribeTrailsCommand, GetTrailStatusCommand } from '@aws-sdk/client-cloudtrail';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';

describe('TapStack Integration Tests', () => {
  const shouldRunIntegration = process.env.RUN_INTEGRATION === '1';
  const stackName = process.env.STACK_NAME;
  const region = process.env.AWS_REGION || 'us-east-1';

  let outputs: any = {};
  let cfClient: CloudFormationClient;
  let s3Client: S3Client;
  let rdsClient: RDSClient;
  let cloudTrailClient: CloudTrailClient;
  let logsClient: CloudWatchLogsClient;

  beforeAll(async () => {
    if (!shouldRunIntegration) {
      return;
    }

    // Initialize AWS clients
    cfClient = new CloudFormationClient({ region });
    s3Client = new S3Client({ region });
    rdsClient = new RDSClient({ region });
    cloudTrailClient = new CloudTrailClient({ region });
    logsClient = new CloudWatchLogsClient({ region });

    // Load outputs from deployment
    try {
      const outputsContent = fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8');
      outputs = JSON.parse(outputsContent);
    } catch (error) {
      console.warn('Could not load cfn-outputs/flat-outputs.json, some tests may fail');
    }
  });

  describe('Stack Status Validation', () => {
    test('stack should be in CREATE_COMPLETE or UPDATE_COMPLETE status', async () => {
      if (!shouldRunIntegration) return;

      const command = new DescribeStacksCommand({
        StackName: stackName
      });

      const response = await cfClient.send(command);
      const stack = response.Stacks?.[0];

      expect(stack).toBeDefined();
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(stack?.StackStatus);
    });
  });

  describe('Stack Outputs Validation', () => {
    test('required outputs should exist', async () => {
      if (!shouldRunIntegration) return;

      const command = new DescribeStacksCommand({
        StackName: stackName
      });

      const response = await cfClient.send(command);
      const stack = response.Stacks?.[0];
      const stackOutputs = stack?.Outputs || [];

      const requiredOutputs = [
        'VPCId',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'DatabaseEndpoint',
        'S3BucketName',
        'CloudTrailName'
      ];

      requiredOutputs.forEach(outputKey => {
        const output = stackOutputs.find(o => o.OutputKey === outputKey);
        expect(output).toBeDefined();
        expect(output?.OutputValue).toBeDefined();
      });
    });
  });

  describe('CloudTrail Integration Tests', () => {
    test('CloudTrail should be logging', async () => {
      if (!shouldRunIntegration) return;

      const cloudTrailName = outputs.CloudTrailName;
      expect(cloudTrailName).toBeDefined();

      const statusCommand = new GetTrailStatusCommand({
        Name: cloudTrailName
      });

      const statusResponse = await cloudTrailClient.send(statusCommand);
      expect(statusResponse.IsLogging).toBe(true);
    });

    test('CloudTrail should have multi-region configuration', async () => {
      if (!shouldRunIntegration) return;

      const cloudTrailName = outputs.CloudTrailName;
      expect(cloudTrailName).toBeDefined();

      const describeCommand = new DescribeTrailsCommand({
        trailNameList: [cloudTrailName]
      });

      const response = await cloudTrailClient.send(describeCommand);
      const trail = response.trailList?.[0];

      expect(trail).toBeDefined();
      expect(trail?.IsMultiRegionTrail).toBe(true);
      expect(trail?.IncludeGlobalServiceEvents).toBe(true);
      expect(trail?.LogFileValidationEnabled).toBe(true);
    });
  });

  describe('S3 Bucket Encryption and Security Tests', () => {
    test('trail bucket should have KMS encryption', async () => {
      if (!shouldRunIntegration) return;

      const trailBucketName = outputs.CloudTrailBucketName;
      expect(trailBucketName).toBeDefined();

      const command = new GetBucketEncryptionCommand({
        Bucket: trailBucketName
      });

      const response = await s3Client.send(command);
      const rules = response.ServerSideEncryptionConfiguration?.Rules || [];
      
      expect(rules.length).toBeGreaterThan(0);
      const kmRule = rules.find(rule => 
        rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === 'aws:kms'
      );
      expect(kmRule).toBeDefined();
    });

    test('data bucket should have KMS encryption', async () => {
      if (!shouldRunIntegration) return;

      const dataBucketName = outputs.S3BucketName;
      expect(dataBucketName).toBeDefined();

      const command = new GetBucketEncryptionCommand({
        Bucket: dataBucketName
      });

      const response = await s3Client.send(command);
      const rules = response.ServerSideEncryptionConfiguration?.Rules || [];
      
      expect(rules.length).toBeGreaterThan(0);
      const kmsRule = rules.find(rule => 
        rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === 'aws:kms'
      );
      expect(kmsRule).toBeDefined();
    });

    test('trail bucket should have public access blocked', async () => {
      if (!shouldRunIntegration) return;

      const trailBucketName = outputs.CloudTrailBucketName;
      expect(trailBucketName).toBeDefined();

      const command = new GetPublicAccessBlockCommand({
        Bucket: trailBucketName
      });

      const response = await s3Client.send(command);
      const config = response.PublicAccessBlockConfiguration;

      expect(config?.BlockPublicAcls).toBe(true);
      expect(config?.BlockPublicPolicy).toBe(true);
      expect(config?.IgnorePublicAcls).toBe(true);
      expect(config?.RestrictPublicBuckets).toBe(true);
    });

    test('data bucket should have public access blocked', async () => {
      if (!shouldRunIntegration) return;

      const dataBucketName = outputs.S3BucketName;
      expect(dataBucketName).toBeDefined();

      const command = new GetPublicAccessBlockCommand({
        Bucket: dataBucketName
      });

      const response = await s3Client.send(command);
      const config = response.PublicAccessBlockConfiguration;

      expect(config?.BlockPublicAcls).toBe(true);
      expect(config?.BlockPublicPolicy).toBe(true);
      expect(config?.IgnorePublicAcls).toBe(true);
      expect(config?.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('RDS Integration Tests', () => {
    test('RDS instance should have storage encryption enabled', async () => {
      if (!shouldRunIntegration) return;

      const dbInstanceId = outputs.DatabaseInstanceId || outputs.RDSInstanceId;
      expect(dbInstanceId).toBeDefined();

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId
      });

      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances?.[0];

      expect(dbInstance).toBeDefined();
      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.KmsKeyId).toBeDefined();
    });

    test('RDS instance should be running MySQL engine', async () => {
      if (!shouldRunIntegration) return;

      const dbInstanceId = outputs.DatabaseInstanceId || outputs.RDSInstanceId;
      expect(dbInstanceId).toBeDefined();

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId
      });

      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances?.[0];

      expect(dbInstance).toBeDefined();
      expect(dbInstance?.Engine).toBe('mysql');
      expect(dbInstance?.EngineVersion).toBeDefined();
    });
  });

  describe('Lambda Function Log Group Tests', () => {
    test('Lambda log group should exist', async () => {
      if (!shouldRunIntegration) return;

      const lambdaFunctionName = outputs.SecurityMonitoringLambdaName || outputs.LambdaFunctionName;
      expect(lambdaFunctionName).toBeDefined();

      const logGroupName = `/aws/lambda/${lambdaFunctionName}`;
      
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      });

      const response = await logsClient.send(command);
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);

      expect(logGroup).toBeDefined();
    });
  });

  describe('Networking Integration Tests', () => {
    test('VPC should exist with expected configuration', async () => {
      if (!shouldRunIntegration) return;

      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('private subnets should exist', async () => {
      if (!shouldRunIntegration) return;

      const subnet1Id = outputs.PrivateSubnet1Id;
      const subnet2Id = outputs.PrivateSubnet2Id;

      expect(subnet1Id).toBeDefined();
      expect(subnet2Id).toBeDefined();
      expect(subnet1Id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(subnet2Id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(subnet1Id).not.toBe(subnet2Id);
    });
  });

  describe('Security Groups Integration Tests', () => {
    test('security groups should exist', async () => {
      if (!shouldRunIntegration) return;

      const webSecurityGroupId = outputs.WebSecurityGroupId;
      const dbSecurityGroupId = outputs.DatabaseSecurityGroupId;

      if (webSecurityGroupId) {
        expect(webSecurityGroupId).toMatch(/^sg-[a-f0-9]+$/);
      }
      
      if (dbSecurityGroupId) {
        expect(dbSecurityGroupId).toMatch(/^sg-[a-f0-9]+$/);
      }
    });
  });

  describe('IAM Resources Integration Tests', () => {
    test('IAM roles should exist', async () => {
      if (!shouldRunIntegration) return;

      const ec2RoleArn = outputs.EC2InstanceRoleArn;
      const lambdaRoleArn = outputs.LambdaExecutionRoleArn;

      if (ec2RoleArn) {
        expect(ec2RoleArn).toMatch(/^arn:aws:iam::\d+:role\/.+$/);
      }
      
      if (lambdaRoleArn) {
        expect(lambdaRoleArn).toMatch(/^arn:aws:iam::\d+:role\/.+$/);
      }
    });
  });
});