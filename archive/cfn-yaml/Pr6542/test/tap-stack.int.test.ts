// Configuration - These are coming from cfn-outputs after CloudFormation deployment
import fs from 'fs';
import { ConfigServiceClient, DescribeDeliveryChannelsCommand } from '@aws-sdk/client-config-service';
import { S3Client, HeadBucketCommand, GetBucketEncryptionCommand } from '@aws-sdk/client-s3';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS SDK clients
const configClient = new ConfigServiceClient({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });
const snsClient = new SNSClient({ region: 'us-east-1' });
const iamClient = new IAMClient({ region: 'us-east-1' });

describe('AWS Config Infrastructure Integration Tests', () => {
  describe('S3 Bucket Tests', () => {
    test('Config bucket should exist', async () => {
      const bucketName = outputs.ConfigBucketName;
      expect(bucketName).toBeDefined();

      const command = new HeadBucketCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('Config bucket should have encryption enabled', async () => {
      const bucketName = outputs.ConfigBucketName;
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
    });
  });

  describe('Config Service Tests', () => {
    test('Config delivery channel should exist', async () => {
      const command = new DescribeDeliveryChannelsCommand({});
      const response = await configClient.send(command);

      expect(response.DeliveryChannels).toBeDefined();
      expect(response.DeliveryChannels?.length).toBeGreaterThan(0);
    });
  });

  describe('SNS Topic Tests', () => {
    test('Config SNS topic should exist', async () => {
      const topicArn = outputs.ConfigTopicArn;
      expect(topicArn).toBeDefined();

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(topicArn);
    });

    test('Config SNS topic should have encryption enabled', async () => {
      const topicArn = outputs.ConfigTopicArn;
      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
    });
  });

  describe('IAM Role Tests', () => {
    test('Config IAM role should exist', async () => {
      const roleArn = outputs.ConfigRoleArn;
      expect(roleArn).toBeDefined();

      const roleName = roleArn.split('/').pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.Arn).toBe(roleArn);
    });
  });

  describe('Environment Suffix Tests', () => {
    test('Environment suffix should match expected value', () => {
      const suffix = outputs.EnvironmentSuffix;
      expect(suffix).toBeDefined();
      expect(suffix).toBe(environmentSuffix);
    });
  });
});
