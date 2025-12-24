import {
  CloudWatchClient
} from '@aws-sdk/client-cloudwatch';
import {
  DynamoDBClient
} from '@aws-sdk/client-dynamodb';
import {
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  GetRoleCommand,
  GetRolePolicyCommand,
  IAMClient
} from '@aws-sdk/client-iam';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import * as fs from 'fs';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// AWS clients
const s3Client = new S3Client({ region: 'us-west-2' });
const ec2Client = new EC2Client({ region: 'us-west-2' });
const dynamoClient = new DynamoDBClient({ region: 'us-west-2' });
const cloudWatchClient = new CloudWatchClient({ region: 'us-west-2' });
const iamClient = new IAMClient({ region: 'us-west-2' });

describe('CloudFormation Stack Integration Tests', () => {
  describe('S3 Bucket Tests', () => {
    test('should have S3 bucket created with correct name', async () => {
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.S3BucketName).toContain('cloud-setup-bucket');
      expect(outputs.S3BucketName).toContain(outputs.EnvironmentSuffix);
    });

    test('should have versioning enabled on S3 bucket', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('should have encryption enabled on S3 bucket', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('should have public access blocked on S3 bucket', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    test('should be able to upload and list objects in S3 bucket', async () => {
      const testKey = `test-object-${Date.now()}.txt`;
      const testContent = 'Test content for integration test';

      // Upload object
      const putCommand = new PutObjectCommand({
        Bucket: outputs.S3BucketName,
        Key: testKey,
        Body: testContent,
      });
      await s3Client.send(putCommand);

      // List objects
      const listCommand = new ListObjectsV2Command({
        Bucket: outputs.S3BucketName,
        Prefix: 'test-object',
      });
      const listResponse = await s3Client.send(listCommand);

      expect(listResponse.Contents).toBeDefined();
      const uploadedObject = listResponse.Contents?.find(obj => obj.Key === testKey);
      expect(uploadedObject).toBeDefined();
    });
  });

  describe('IAM Role Tests', () => {
    test('should have IAM role created for EC2 instance', async () => {
      expect(outputs.IAMRoleArn).toBeDefined();

      const roleName = outputs.IAMRoleArn.split('/').pop();
      const command = new GetRoleCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
      expect(response.Role?.AssumeRolePolicyDocument).toContain('ec2.amazonaws.com');
    });

    test('should have S3 ListBucket permission in IAM role', async () => {
      const roleName = outputs.IAMRoleArn.split('/').pop();
      const command = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'S3ListBucketPolicy',
      });
      const response = await iamClient.send(command);

      expect(response.PolicyDocument).toBeDefined();
      const policyDoc = JSON.parse(decodeURIComponent(response.PolicyDocument || '{}'));

      expect(policyDoc.Statement).toBeDefined();
      expect(policyDoc.Statement[0]?.Action).toBe('s3:ListBucket');
      expect(policyDoc.Statement[0]?.Effect).toBe('Allow');
    });
  });

  describe('DynamoDB Table Tests', () => {
    test('should have DynamoDB table created with correct name', async () => {
      expect(outputs.DynamoDBTableName).toBeDefined();
      expect(outputs.DynamoDBTableName).toContain('CloudSetupTable');
      expect(outputs.DynamoDBTableName).toContain(outputs.EnvironmentSuffix);
    });
  });

  describe('Stack Outputs Tests', () => {
    test('should have all required stack outputs', () => {
      const requiredOutputs = [
        'S3BucketName',
        'S3BucketArn',
        'EC2InstanceId',
        'EC2InstancePublicIP',
        'EC2SecurityGroupId',
        'DynamoDBTableName',
        'DynamoDBTableArn',
        'IAMRoleArn',
        'CloudWatchAlarmName',
        'StackName',
        'EnvironmentSuffix',
        'VPCId',
        'SubnetId'
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });
  });

});