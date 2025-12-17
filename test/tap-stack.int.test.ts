import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { S3Client, GetBucketEncryptionCommand, GetPublicAccessBlockCommand } from '@aws-sdk/client-s3';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { CloudTrailClient, GetTrailStatusCommand } from '@aws-sdk/client-cloudtrail';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import fs from 'fs';

const STACK_NAME = process.env.STACK_NAME;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

describe('TapStack CloudFormation Integration Tests', () => {
  let outputs: any = {};

  beforeAll(() => {
    // Skip all tests if RUN_INTEGRATION is not set to '1'
    if (process.env.RUN_INTEGRATION !== '1') {
      console.log('Skipping integration tests. Set RUN_INTEGRATION=1 to run.');
      return;
    }

    if (!STACK_NAME) {
      throw new Error('STACK_NAME environment variable is required');
    }

    // Load stack outputs if available
    try {
      outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
    } catch (error) {
      console.warn('Could not load flat-outputs.json, some tests may fail');
    }
  });

  describe('Stack Status', () => {
    test('stack should be in CREATE_COMPLETE or UPDATE_COMPLETE status', async () => {
      if (process.env.RUN_INTEGRATION !== '1') return;

      const cfnClient = new CloudFormationClient({ region: AWS_REGION });
      const response = await cfnClient.send(new DescribeStacksCommand({
        StackName: STACK_NAME
      }));

      const stack = response.Stacks?.[0];
      expect(stack).toBeDefined();
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(stack?.StackStatus);
    });
  });

  describe('Stack Outputs', () => {
    test('required outputs should exist', async () => {
      if (process.env.RUN_INTEGRATION !== '1') return;

      const cfnClient = new CloudFormationClient({ region: AWS_REGION });
      const response = await cfnClient.send(new DescribeStacksCommand({
        StackName: STACK_NAME
      }));

      const stack = response.Stacks?.[0];
      const outputs = stack?.Outputs || [];
      const outputKeys = outputs.map(output => output.OutputKey);

      const expectedOutputs = [
        'VPCId',
        'PrivateSubnet1Id', 
        'PrivateSubnet2Id',
        'EC2SecurityGroupId',
        'S3BucketName',
        'CloudTrailBucketName',
        'EC2InstanceId',
        'RDSInstanceEndpoint'
      ];

      expectedOutputs.forEach(expectedOutput => {
        expect(outputKeys).toContain(expectedOutput);
      });
    });
  });

  describe('CloudTrail Validation', () => {
    test('CloudTrail should be logging', async () => {
      if (process.env.RUN_INTEGRATION !== '1') return;

      const cloudTrailClient = new CloudTrailClient({ region: AWS_REGION });
      
      // Get trail name from outputs or construct it
      const trailName = outputs.CloudTrailName || `${process.env.Environment || 'production'}-cloudtrail`;
      
      const response = await cloudTrailClient.send(new GetTrailStatusCommand({
        Name: trailName
      }));

      expect(response.IsLogging).toBe(true);
    });
  });

  describe('S3 Bucket Validation', () => {
    test('data bucket should have KMS encryption and public access blocked', async () => {
      if (process.env.RUN_INTEGRATION !== '1') return;

      const s3Client = new S3Client({ region: AWS_REGION });
      const bucketName = outputs.S3BucketName;
      
      if (!bucketName) {
        throw new Error('S3BucketName not found in outputs');
      }

      // Test encryption
      const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: bucketName
      }));

      const encryptionConfig = encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(encryptionConfig?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
      expect(encryptionConfig?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBeDefined();

      // Test public access block
      const publicAccessResponse = await s3Client.send(new GetPublicAccessBlockCommand({
        Bucket: bucketName
      }));

      const publicAccessConfig = publicAccessResponse.PublicAccessBlockConfiguration;
      expect(publicAccessConfig?.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig?.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig?.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig?.RestrictPublicBuckets).toBe(true);
    });

    test('CloudTrail bucket should have KMS encryption and public access blocked', async () => {
      if (process.env.RUN_INTEGRATION !== '1') return;

      const s3Client = new S3Client({ region: AWS_REGION });
      const bucketName = outputs.CloudTrailBucketName;
      
      if (!bucketName) {
        throw new Error('CloudTrailBucketName not found in outputs');
      }

      // Test encryption
      const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: bucketName
      }));

      const encryptionConfig = encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(encryptionConfig?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
      expect(encryptionConfig?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBeDefined();

      // Test public access block
      const publicAccessResponse = await s3Client.send(new GetPublicAccessBlockCommand({
        Bucket: bucketName
      }));

      const publicAccessConfig = publicAccessResponse.PublicAccessBlockConfiguration;
      expect(publicAccessConfig?.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig?.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig?.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig?.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('RDS Validation', () => {
    test('RDS instance should have storage encryption enabled', async () => {
      if (process.env.RUN_INTEGRATION !== '1') return;

      const rdsClient = new RDSClient({ region: AWS_REGION });
      const instanceId = outputs.RDSInstanceId || `${process.env.Environment || 'production'}-rds-instance`;
      
      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: instanceId
      }));

      const dbInstance = response.DBInstances?.[0];
      expect(dbInstance).toBeDefined();
      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.KmsKeyId).toBeDefined();
    });
  });

  describe('Lambda Log Group Validation', () => {
    test('Lambda log group should exist', async () => {
      if (process.env.RUN_INTEGRATION !== '1') return;

      const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });
      const logGroupName = `/aws/lambda/${process.env.Environment || 'production'}-function`;
      
      const response = await logsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      }));

      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(14);
    });
  });

  describe('CloudTrail Log Group Validation', () => {
    test('CloudTrail log group should exist', async () => {
      if (process.env.RUN_INTEGRATION !== '1') return;

      const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });
      const logGroupName = `${process.env.Environment || 'production'}-cloudtrail-log-group`;
      
      const response = await logsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      }));

      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(90);
    });
  });
});