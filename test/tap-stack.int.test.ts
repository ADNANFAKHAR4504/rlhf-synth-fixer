/**
 * Integration Tests for Infrastructure Stack
 *
 * Tests validate both deployment outputs and live AWS resources.
 * Some tests are "live" - they interact with actual AWS resources.
 *
 * Prerequisites:
 * - Deployment outputs available in cfn-outputs/flat-outputs.json
 * - AWS credentials configured with appropriate permissions
 * - AWS_REGION environment variable set (or defaults to us-east-1)
 * - Resources deployed in the specified region
 */

import {
  DeleteItemCommand,
  DescribeTableCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  GetRoleCommand,
  IAMClient,
} from '@aws-sdk/client-iam';
import {
  DeleteObjectCommand,
  GetBucketVersioningCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import {
  GetTopicAttributesCommand,
  PublishCommand,
  SNSClient,
} from '@aws-sdk/client-sns';
import * as fs from 'fs';
import * as path from 'path';

describe('Infrastructure Integration Tests', () => {
  let outputs: Record<string, string>;
  const region = process.env.AWS_REGION || 'us-east-1'; // Read from environment variable
  let hasDeployment = false;

  // AWS clients for live tests
  const s3Client = new S3Client({ region });
  const dynamoClient = new DynamoDBClient({ region });
  const snsClient = new SNSClient({ region });
  const iamClient = new IAMClient({ region: 'us-east-1' }); // IAM is global

  beforeAll(() => {
    const outputsPath = path.join(
      process.cwd(),
      'cfn-outputs',
      'flat-outputs.json'
    );
    if (fs.existsSync(outputsPath)) {
      try {
        const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
        outputs = JSON.parse(outputsContent);
        hasDeployment = true;
      } catch (error) {
        console.log('No deployment outputs found or invalid JSON');
        hasDeployment = false;
      }
    } else {
      console.log('No deployment outputs file found, skipping integration tests');
      hasDeployment = false;
    }
  });

  describe('Deployment Outputs Validation', () => {
    it('should have valid environment configuration', () => {
      if (!hasDeployment) {
        console.log('⊘ Skipped: No deployment exists');
        return;
      }

      const envKey = Object.keys(outputs).find((key) => key.includes('Environment'));
      if (envKey) {
        const environment = outputs[envKey];
        expect(environment).toBeTruthy();
        expect(typeof environment).toBe('string');
      }
    });
  });

  describe('Live S3 Bucket Tests', () => {
    let bucketName: string;

    beforeAll(() => {
      if (!hasDeployment) return;
      const bucketKey = Object.keys(outputs).find((key) => key.includes('S3BucketName'));
      if (bucketKey) {
        bucketName = outputs[bucketKey];
      }
    });

    it('should have S3 bucket accessible (LIVE TEST)', async () => {
      if (!hasDeployment || !bucketName) {
        console.log('⊘ Skipped: No deployment or bucket name');
        return;
      }

      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    }, 10000);

    it('should have versioning enabled (LIVE TEST)', async () => {
      if (!hasDeployment || !bucketName) {
        console.log('⊘ Skipped: No deployment or bucket name');
        return;
      }

      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    }, 10000);

    it('should allow PUT and GET operations (LIVE TEST)', async () => {
      if (!hasDeployment || !bucketName) {
        console.log('⊘ Skipped: No deployment or bucket name');
        return;
      }

      const testKey = `integration-test-${Date.now()}.txt`;
      const testContent = 'Integration test content';

      // PUT object
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
      });
      await s3Client.send(putCommand);

      // GET object
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      });
      const getResponse = await s3Client.send(getCommand);
      const content = await getResponse.Body?.transformToString();
      expect(content).toBe(testContent);

      // Cleanup
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      });
      await s3Client.send(deleteCommand);
    }, 15000);
  });

  describe('Live DynamoDB Table Tests', () => {
    let tableName: string;

    beforeAll(() => {
      if (!hasDeployment) return;
      const tableKey = Object.keys(outputs).find((key) => key.includes('DynamoDBTableName'));
      if (tableKey) {
        tableName = outputs[tableKey];
      }
    });

    it('should have DynamoDB table in ACTIVE state (LIVE TEST)', async () => {
      if (!hasDeployment || !tableName) {
        console.log('⊘ Skipped: No deployment or table name');
        return;
      }

      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    }, 10000);

    it('should allow PUT and GET operations (LIVE TEST)', async () => {
      if (!hasDeployment || !tableName) {
        console.log('⊘ Skipped: No deployment or table name');
        return;
      }

      const testId = `test-${Date.now()}`;
      const testTimestamp = Date.now();

      // PUT item
      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: testId },
          timestamp: { N: testTimestamp.toString() },
          status: { S: 'active' },
          data: { S: 'Integration test data' },
        },
      });
      await dynamoClient.send(putCommand);

      // GET item
      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          id: { S: testId },
          timestamp: { N: testTimestamp.toString() },
        },
      });
      const getResponse = await dynamoClient.send(getCommand);
      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item?.id.S).toBe(testId);

      // Cleanup
      const deleteCommand = new DeleteItemCommand({
        TableName: tableName,
        Key: {
          id: { S: testId },
          timestamp: { N: testTimestamp.toString() },
        },
      });
      await dynamoClient.send(deleteCommand);
    }, 15000);
  });

  describe('Live SNS Topic Tests', () => {
    let topicArn: string;

    beforeAll(() => {
      if (!hasDeployment) return;
      const topicKey = Object.keys(outputs).find((key) => key.includes('SNSTopicArn'));
      if (topicKey) {
        topicArn = outputs[topicKey];
      }
    });

    it('should have SNS topic accessible (LIVE TEST)', async () => {
      if (!hasDeployment || !topicArn) {
        console.log('⊘ Skipped: No deployment or topic ARN');
        return;
      }

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(topicArn);
    }, 10000);

    it('should allow publishing messages (LIVE TEST)', async () => {
      if (!hasDeployment || !topicArn) {
        console.log('⊘ Skipped: No deployment or topic ARN');
        return;
      }

      const publishCommand = new PublishCommand({
        TopicArn: topicArn,
        Message: `Integration test message at ${new Date().toISOString()}`,
        Subject: 'Integration Test',
      });
      const response = await snsClient.send(publishCommand);
      expect(response.MessageId).toBeDefined();
    }, 10000);
  });

  describe('Live IAM Role Tests', () => {
    let roleArn: string;
    let roleName: string;

    beforeAll(() => {
      if (!hasDeployment) return;
      const roleKey = Object.keys(outputs).find((key) => key.includes('DataAccessRoleArn'));
      if (roleKey) {
        roleArn = outputs[roleKey];
        roleName = roleArn.split('/').pop()!;
      }
    });

    it('should have IAM role accessible (LIVE TEST)', async () => {
      if (!hasDeployment || !roleName) {
        console.log('⊘ Skipped: No deployment or role name');
        return;
      }

      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
      expect(response.Role?.Arn).toBe(roleArn);
    }, 10000);
  });
});
