import fs from 'fs';
import { DynamoDBClient, DescribeTableCommand, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, HeadBucketCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { ECRClient, DescribeRepositoriesCommand } from '@aws-sdk/client-ecr';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synth101905';
const region = process.env.AWS_REGION || 'us-east-1';

const dynamoDBClient = new DynamoDBClient({ region });
const s3Client = new S3Client({ region });
const ecrClient = new ECRClient({ region });

describe('Transaction Processing Infrastructure Integration Tests', () => {
  describe('DynamoDB Resources', () => {
    test('SessionTable should exist and be accessible', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.SessionTableName
      });

      const response = await dynamoDBClient.send(command);
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.SessionTableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });

    test('SessionTable should have correct configuration', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.SessionTableName
      });

      const response = await dynamoDBClient.send(command);
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
    });

    test('SessionTable should have UserIdIndex GSI', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.SessionTableName
      });

      const response = await dynamoDBClient.send(command);
      const gsi = response.Table?.GlobalSecondaryIndexes?.find(
        idx => idx.IndexName === 'UserIdIndex'
      );
      expect(gsi).toBeDefined();
      expect(gsi?.IndexStatus).toBe('ACTIVE');
    });

    test('SessionTable should allow write operations', async () => {
      const timestamp = Date.now();
      const putCommand = new PutItemCommand({
        TableName: outputs.SessionTableName,
        Item: {
          session_id: { S: `test-session-${timestamp}` },
          user_id: { S: `test-user-${timestamp}` },
          created_at: { N: timestamp.toString() }
        }
      });

      await expect(dynamoDBClient.send(putCommand)).resolves.toBeDefined();
    });

    test('TransactionTable should exist and be accessible', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.TransactionTableName
      });

      const response = await dynamoDBClient.send(command);
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.TransactionTableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });

    test('TransactionTable should have DynamoDB Streams enabled', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.TransactionTableName
      });

      const response = await dynamoDBClient.send(command);
      expect(response.Table?.StreamSpecification?.StreamEnabled).toBe(true);
      expect(response.Table?.StreamSpecification?.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
      expect(response.Table?.LatestStreamArn).toBe(outputs.TransactionTableStreamArn);
    });

    test('TransactionTable should allow write operations', async () => {
      const timestamp = Date.now();
      const putCommand = new PutItemCommand({
        TableName: outputs.TransactionTableName,
        Item: {
          transaction_id: { S: `test-txn-${timestamp}` },
          timestamp: { N: timestamp.toString() },
          amount: { N: '100.50' },
          currency: { S: 'USD' }
        }
      });

      await expect(dynamoDBClient.send(putCommand)).resolves.toBeDefined();
    });
  });

  describe('S3 Resources', () => {
    test('AuditLogBucket should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.AuditLogBucketName
      });

      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('AuditLogBucket should allow write operations', async () => {
      const timestamp = Date.now();
      const putCommand = new PutObjectCommand({
        Bucket: outputs.AuditLogBucketName,
        Key: `test-logs/integration-test-${timestamp}.json`,
        Body: JSON.stringify({ test: 'data', timestamp }),
        ServerSideEncryption: 'AES256'
      });

      await expect(s3Client.send(putCommand)).resolves.toBeDefined();
    });

    test('TemplatesBucket should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.TemplatesBucketName
      });

      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('TemplatesBucket should allow write operations', async () => {
      const timestamp = Date.now();
      const putCommand = new PutObjectCommand({
        Bucket: outputs.TemplatesBucketName,
        Key: `test-templates/test-template-${timestamp}.json`,
        Body: JSON.stringify({
          AWSTemplateFormatVersion: '2010-09-09',
          Description: 'Test template',
          Resources: {}
        })
      });

      await expect(s3Client.send(putCommand)).resolves.toBeDefined();
    });
  });

  describe('ECR Resources', () => {
    test('TransactionValidatorECRRepository should exist', async () => {
      const repoName = `transaction-validator-${environmentSuffix}`;
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName]
      });

      const response = await ecrClient.send(command);
      expect(response.repositories).toBeDefined();
      expect(response.repositories?.length).toBe(1);
      expect(response.repositories?.[0].repositoryName).toBe(repoName);
    });

    test('ECR repository should have image scanning enabled', async () => {
      const repoName = `transaction-validator-${environmentSuffix}`;
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName]
      });

      const response = await ecrClient.send(command);
      const scanConfig = response.repositories?.[0].imageScanningConfiguration;
      expect(scanConfig?.scanOnPush).toBe(true);
    });

    test('ECR repository URI should match output', async () => {
      const repoName = `transaction-validator-${environmentSuffix}`;
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName]
      });

      const response = await ecrClient.send(command);
      const uri = response.repositories?.[0].repositoryUri;
      expect(uri).toBe(outputs.TransactionValidatorECRRepositoryUri);
    });
  });

  describe('Stack Outputs Validation', () => {
    test('all outputs should be non-empty strings', () => {
      Object.keys(outputs).forEach(key => {
        expect(outputs[key]).toBeDefined();
        expect(typeof outputs[key]).toBe('string');
        expect(outputs[key].length).toBeGreaterThan(0);
      });
    });

    test('all resource names should include environment suffix', () => {
      expect(outputs.SessionTableName).toContain(environmentSuffix);
      expect(outputs.TransactionTableName).toContain(environmentSuffix);
      expect(outputs.AuditLogBucketName).toContain(environmentSuffix);
      expect(outputs.TemplatesBucketName).toContain(environmentSuffix);
      expect(outputs.TransactionValidatorECRRepositoryUri).toContain(environmentSuffix);
    });

    test('TransactionTableStreamArn should be valid ARN format', () => {
      expect(outputs.TransactionTableStreamArn).toMatch(/^arn:aws:dynamodb:[a-z0-9-]+:\d+:table\/[a-z0-9-]+\/stream\//);
    });
  });

  describe('End-to-End Workflow', () => {
    test('should write to DynamoDB, verify stream exists, and write audit to S3', async () => {
      const timestamp = Date.now();
      const transactionId = `e2e-txn-${timestamp}`;

      // Write transaction to DynamoDB
      const putDynamoCommand = new PutItemCommand({
        TableName: outputs.TransactionTableName,
        Item: {
          transaction_id: { S: transactionId },
          timestamp: { N: timestamp.toString() },
          amount: { N: '250.75' },
          currency: { S: 'USD' },
          status: { S: 'completed' }
        }
      });

      await dynamoDBClient.send(putDynamoCommand);

      // Verify transaction was written
      const getCommand = new GetItemCommand({
        TableName: outputs.TransactionTableName,
        Key: {
          transaction_id: { S: transactionId },
          timestamp: { N: timestamp.toString() }
        }
      });

      const getResponse = await dynamoDBClient.send(getCommand);
      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item?.transaction_id.S).toBe(transactionId);

      // Write audit log to S3
      const auditLog = {
        transaction_id: transactionId,
        timestamp,
        action: 'transaction_created',
        details: { amount: 250.75, currency: 'USD' }
      };

      const putS3Command = new PutObjectCommand({
        Bucket: outputs.AuditLogBucketName,
        Key: `audit-logs/e2e-test/${transactionId}.json`,
        Body: JSON.stringify(auditLog),
        ServerSideEncryption: 'AES256'
      });

      await s3Client.send(putS3Command);

      // Verify stream ARN exists
      expect(outputs.TransactionTableStreamArn).toBeDefined();
      expect(outputs.TransactionTableStreamArn).toContain(outputs.TransactionTableName);
    });
  });
});
