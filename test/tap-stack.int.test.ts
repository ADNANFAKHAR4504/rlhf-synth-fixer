import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after stack deploy
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn(
    'cfn-outputs/flat-outputs.json not found - using empty outputs for testing'
  );
  outputs = {};
}

const region = process.env.AWS_REGION || 'us-east-1';
const s3Client = new S3Client({ region });
const iamClient = new IAMClient({ region });
const snsClient = new SNSClient({ region });
const dynamoClient = new DynamoDBClient({ region });

const hasAwsCredentials = () => {
  return process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
};

describe('TapStack CloudFormation Outputs AWS Integration', () => {
  beforeAll(() => {
    if (!hasAwsCredentials()) {
      console.warn('AWS credentials not available - skipping integration tests');
    }
  });

  describe('CloudFormation Outputs Validation', () => {
    const requiredOutputs = [
      'SourceBucketArn',
      'ReplicationRoleArn',
      'SourceBucketName',
      'SNSTopicArn',
      'DynamoDBTableName',
    ];
    test('should have all required outputs', () => {
      requiredOutputs.forEach(outputName => {
        expect(outputs[outputName]).toBeDefined();
        expect(outputs[outputName]).not.toBe('');
      });
    });
  });

  describe('S3 Bucket Validation', () => {
    test('SourceBucket should exist and have versioning and encryption enabled', async () => {
      if (!hasAwsCredentials()) return;
      const bucketName = outputs.SourceBucketName;
      if (!bucketName || bucketName.includes('***')) {
        console.warn('Skipping S3 test: bucket name is a placeholder');
        return;
      }
      // Check bucket exists by getting versioning
      const versioning = await s3Client.send(new GetBucketVersioningCommand({ Bucket: bucketName }));
      expect(versioning.Status).toBe('Enabled');
      // Check encryption
      const encryption = await s3Client.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = encryption.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
      // Check public access block
      const publicAccess = await s3Client.send(new GetPublicAccessBlockCommand({ Bucket: bucketName }));
      expect(publicAccess.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('IAM Role Validation', () => {
    test('ReplicationRoleArn should exist in IAM', async () => {
      if (!hasAwsCredentials()) return;
      const roleArn = outputs.ReplicationRoleArn;
      const roleName = roleArn.split('/').pop();
      if (!roleName || roleArn.includes('***')) {
        console.warn('Skipping IAM test: role ARN is a placeholder');
        return;
      }
      const response = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
      expect(response.Role).toBeDefined();
      if (response.Role && response.Role.Arn) {
        expect(response.Role.Arn.startsWith('arn:aws:iam::')).toBe(true);
        expect(response.Role.Arn.endsWith(roleName)).toBe(true);
      }
    });
  });

  describe('SNS Topic Validation', () => {
    test('SNSTopicArn should exist in SNS', async () => {
      if (!hasAwsCredentials()) return;
      const topicArn = outputs.SNSTopicArn;
      if (!topicArn || topicArn.includes('***')) {
        console.warn('Skipping SNS test: topic ARN is a placeholder');
        return;
      }
      const response = await snsClient.send(new GetTopicAttributesCommand({ TopicArn: topicArn }));
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(topicArn);
    });
  });

  describe('DynamoDB Table Validation', () => {
    test('DynamoDBTableName should exist in DynamoDB', async () => {
      if (!hasAwsCredentials()) return;
      const tableName = outputs.DynamoDBTableName;
      const response = await dynamoClient.send(new DescribeTableCommand({ TableName: tableName }));
      expect(response.Table).toBeDefined();
      expect(response.Table!.TableName).toBe(tableName);
      expect(response.Table!.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(response.Table!.SSEDescription?.Status).toBe('ENABLED');
    });
  });
});
