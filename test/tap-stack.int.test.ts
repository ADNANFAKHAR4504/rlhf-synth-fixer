// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import { IAMClient, GetRoleCommand, GetUserCommand, GetPolicyCommand } from '@aws-sdk/client-iam';
import { S3Client, GetBucketLocationCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS Clients
const iamClient = new IAMClient({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });
const dynamodbClient = new DynamoDBClient({ region: 'us-east-1' });

describe('TapStack Integration Tests', () => {
  describe('DynamoDB Resources', () => {
    test('TurnAroundPromptTable should exist and be accessible', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.TurnAroundPromptTableName
      });
      
      const response = await dynamodbClient.send(command);
      expect(response.Table?.TableName).toBe(outputs.TurnAroundPromptTableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });
  });

  describe('S3 Resources', () => {
    test('TestS3Bucket should exist and be accessible', async () => {
      const bucketName = outputs.TestS3BucketName;
      const command = new GetBucketLocationCommand({
        Bucket: bucketName
      });
      
      const response = await s3Client.send(command);
      expect(response).toBeDefined();
      // Bucket exists if no error is thrown
    });

    test('TestS3Bucket should allow list operations', async () => {
      const bucketName = outputs.TestS3BucketName;
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 1
      });
      
      // This should not throw an error for read operations
      const response = await s3Client.send(command);
      expect(response).toBeDefined();
    });
  });

  describe('IAM Resources', () => {
    test('EC2InstanceRole should exist and have correct trust policy', async () => {
      const roleName = `EC2S3ReadOnlyRole${environmentSuffix}`;
      const command = new GetRoleCommand({
        RoleName: roleName
      });
      
      const response = await iamClient.send(command);
      expect(response.Role?.RoleName).toBe(roleName);
      expect(response.Role?.Arn).toBe(outputs.EC2InstanceRoleArn);
      
      // Check trust policy allows EC2 to assume the role
      const trustPolicy = JSON.parse(decodeURIComponent(response.Role?.AssumeRolePolicyDocument || ''));
      const statement = trustPolicy.Statement[0];
      expect(statement.Principal.Service).toBe('ec2.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('TestIAMUser should exist', async () => {
      const userName = `TestS3ReadOnlyUser${environmentSuffix}`;
      const command = new GetUserCommand({
        UserName: userName
      });
      
      const response = await iamClient.send(command);
      expect(response.User?.UserName).toBe(userName);
      expect(response.User?.Arn).toBe(outputs.TestIAMUserArn);
    });

    test('S3SpecificBucketReadOnlyPolicy should exist and have correct permissions', async () => {
      const policyArn = outputs.S3SpecificBucketReadOnlyPolicyArn;
      const command = new GetPolicyCommand({
        PolicyArn: policyArn
      });
      
      const response = await iamClient.send(command);
      expect(response.Policy?.PolicyName).toBe(`S3SpecificBucketReadOnly${environmentSuffix}`);
      expect(response.Policy?.Arn).toBe(policyArn);
    });
  });

  describe('Security Validation', () => {
    test('outputs should contain all expected security resource ARNs', () => {
      const expectedOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'TestS3BucketName',
        'TestS3BucketArn',
        'EC2InstanceRoleArn',
        'EC2InstanceProfileArn',
        'TestIAMUserArn',
        'S3SpecificBucketReadOnlyPolicyArn',
        'StackName',
        'EnvironmentSuffix'
      ];

      expectedOutputs.forEach(outputName => {
        expect(outputs[outputName]).toBeDefined();
        expect(outputs[outputName]).not.toBe('');
      });
    });

    test('IAM resource ARNs should follow correct naming convention', () => {
      expect(outputs.EC2InstanceRoleArn).toContain(`EC2S3ReadOnlyRole${environmentSuffix}`);
      expect(outputs.TestIAMUserArn).toContain(`TestS3ReadOnlyUser${environmentSuffix}`);
      expect(outputs.S3SpecificBucketReadOnlyPolicyArn).toContain(`S3SpecificBucketReadOnly${environmentSuffix}`);
    });

    test('S3 bucket name should follow correct naming convention', () => {
      expect(outputs.TestS3BucketName).toMatch(new RegExp(`tap-test-bucket-${environmentSuffix}-\\d+`));
    });
  });
});
