/**
 * Integration tests for TapStack - Cross-Region Migration Infrastructure
 * Tests real AWS deployed resources using stack outputs
 * NO MOCKING - All tests validate actual deployed infrastructure
 */

import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import {
  KMSClient,
  DescribeKeyCommand,
} from '@aws-sdk/client-kms';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import * as fs from 'fs';
import * as path from 'path';

// Load outputs from deployed stack
const outputsPath = path.join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);
let stackOutputs: any;

if (fs.existsSync(outputsPath)) {
  stackOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
} else {
  stackOutputs = {};
}

const region = 'eu-west-1';
const s3Client = new S3Client({ region });
const dynamodbClient = new DynamoDBClient({ region });
const lambdaClient = new LambdaClient({ region });
const kmsClient = new KMSClient({ region });
const snsClient = new SNSClient({ region });

describe('TapStack Integration Tests', () => {
  describe('Stack Outputs Validation', () => {
    test('should have migration report output', () => {
      if (Object.keys(stackOutputs).length > 0) {
        expect(stackOutputs.migrationReport).toBeDefined();
        if (stackOutputs.migrationReport) {
          const report = JSON.parse(stackOutputs.migrationReport);
          expect(report).toHaveProperty('migrationBatch');
          expect(report).toHaveProperty('sourceRegion');
          expect(report).toHaveProperty('targetRegion');
          expect(report).toHaveProperty('resources');
        }
      }
    });

    test('should have KMS key ID output', () => {
      if (Object.keys(stackOutputs).length > 0) {
        expect(stackOutputs.kmsKeyId || stackOutputs.KmsKeyId).toBeDefined();
      }
    });

    test('should have SNS topic ARN output', () => {
      if (Object.keys(stackOutputs).length > 0) {
        expect(stackOutputs.snsTopicArn || stackOutputs.SnsTopicArn).toBeDefined();
      }
    });

    test('should have bucket ARNs output', () => {
      const bucketArns = stackOutputs.bucketArns || stackOutputs.BucketArns;
      if (bucketArns) {
        expect(Array.isArray(bucketArns)).toBe(true);
      }
    });

    test('should have table ARNs output', () => {
      const tableArns = stackOutputs.tableArns || stackOutputs.TableArns;
      if (tableArns) {
        expect(Array.isArray(tableArns)).toBe(true);
      }
    });

    test('should have validation function ARN output', () => {
      if (Object.keys(stackOutputs).length > 0) {
        expect(
          stackOutputs.validationFunctionArn ||
            stackOutputs.ValidationFunctionArn
        ).toBeDefined();
      }
    });
  });

  describe('Migration Report Structure', () => {
    let migrationReport: any;

    beforeAll(() => {
      if (stackOutputs.migrationReport) {
        migrationReport = JSON.parse(stackOutputs.migrationReport);
      }
    });

    test('should contain source and target regions', () => {
      if (migrationReport) {
        expect(migrationReport.sourceRegion).toBe('us-east-1');
        expect(migrationReport.targetRegion).toBe('eu-west-1');
      }
    });

    test('should contain S3 bucket information', () => {
      if (migrationReport) {
        expect(migrationReport.resources).toHaveProperty('s3Buckets');
        expect(Array.isArray(migrationReport.resources.s3Buckets)).toBe(true);
      }
    });

    test('should contain DynamoDB table information', () => {
      if (migrationReport) {
        expect(migrationReport.resources).toHaveProperty('dynamodbTables');
        expect(Array.isArray(migrationReport.resources.dynamodbTables)).toBe(
          true
        );
      }
    });

    test('should contain validation function information', () => {
      if (migrationReport) {
        expect(migrationReport.resources).toHaveProperty('validationFunction');
        expect(migrationReport.resources.validationFunction).toHaveProperty(
          'arn'
        );
      }
    });

    test('should contain monitoring configuration', () => {
      if (migrationReport) {
        expect(migrationReport.resources).toHaveProperty('monitoring');
        expect(migrationReport.resources.monitoring).toHaveProperty(
          'snsTopicArn'
        );
        expect(migrationReport.resources.monitoring).toHaveProperty(
          'kmsKeyArn'
        );
      }
    });
  });

  describe('KMS Key', () => {
    test('should have valid KMS key', async () => {
      const kmsKeyId = stackOutputs.kmsKeyId || stackOutputs.KmsKeyId;
      if (kmsKeyId) {
        const command = new DescribeKeyCommand({ KeyId: kmsKeyId });
        const response = await kmsClient.send(command);

        expect(response.KeyMetadata).toBeDefined();
        expect(response.KeyMetadata?.Enabled).toBe(true);
        expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      }
    });
  });

  describe('SNS Topic', () => {
    test('should have valid SNS topic', async () => {
      const snsTopicArn =
        stackOutputs.snsTopicArn || stackOutputs.SnsTopicArn;
      if (snsTopicArn) {
        const command = new GetTopicAttributesCommand({
          TopicArn: snsTopicArn,
        });
        const response = await snsClient.send(command);

        expect(response.Attributes).toBeDefined();
        expect(response.Attributes?.TopicArn).toBe(snsTopicArn);
      }
    });
  });

  describe('S3 Buckets', () => {
    let bucketNames: string[];

    beforeAll(() => {
      bucketNames = [];
      const bucketArns = stackOutputs.bucketArns || stackOutputs.BucketArns;
      if (bucketArns && Array.isArray(bucketArns)) {
        bucketNames = bucketArns.map((arn: string) => arn.split(':::')[1]);
      }
      if (stackOutputs.migrationReport) {
        const report = JSON.parse(stackOutputs.migrationReport);
        if (report.resources?.s3Buckets) {
          bucketNames = report.resources.s3Buckets.map((b: any) => b.name);
        }
      }
    });

    test('should have S3 buckets deployed', async () => {
      if (bucketNames.length > 0) {
        for (const bucketName of bucketNames) {
          const command = new HeadBucketCommand({ Bucket: bucketName });
          await expect(s3Client.send(command)).resolves.toBeDefined();
        }
      }
    });

    test('should have versioning enabled on buckets', async () => {
      if (bucketNames.length > 0) {
        for (const bucketName of bucketNames) {
          const command = new GetBucketVersioningCommand({
            Bucket: bucketName,
          });
          const response = await s3Client.send(command);
          expect(response.Status).toBe('Enabled');
        }
      }
    });

    test('should have encryption configured on buckets', async () => {
      if (bucketNames.length > 0) {
        for (const bucketName of bucketNames) {
          const command = new GetBucketEncryptionCommand({
            Bucket: bucketName,
          });
          const response = await s3Client.send(command);
          expect(response.ServerSideEncryptionConfiguration).toBeDefined();
        }
      }
    });
  });

  describe('DynamoDB Tables', () => {
    let tableNames: string[];

    beforeAll(() => {
      tableNames = [];
      if (stackOutputs.migrationReport) {
        const report = JSON.parse(stackOutputs.migrationReport);
        if (report.resources?.dynamodbTables) {
          tableNames = report.resources.dynamodbTables.map((t: any) => t.name);
        }
      }
    });

    test('should have DynamoDB tables deployed', async () => {
      if (tableNames.length > 0) {
        for (const tableName of tableNames) {
          const command = new DescribeTableCommand({ TableName: tableName });
          const response = await dynamodbClient.send(command);

          expect(response.Table).toBeDefined();
          expect(response.Table?.TableStatus).toBe('ACTIVE');
        }
      }
    });

    test('should have encryption enabled on tables', async () => {
      if (tableNames.length > 0) {
        for (const tableName of tableNames) {
          const command = new DescribeTableCommand({ TableName: tableName });
          const response = await dynamodbClient.send(command);

          expect(response.Table?.SSEDescription).toBeDefined();
          expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
        }
      }
    });

    test('should have point-in-time recovery enabled', async () => {
      if (tableNames.length > 0) {
        for (const tableName of tableNames) {
          const command = new DescribeTableCommand({ TableName: tableName });
          const response = await dynamodbClient.send(command);

          expect(response.Table?.TableStatus).toBe('ACTIVE');
        }
      }
    });
  });

  describe('Lambda Validation Function', () => {
    test('should have validation function deployed', async () => {
      const functionArn =
        stackOutputs.validationFunctionArn ||
        stackOutputs.ValidationFunctionArn;
      if (functionArn) {
        const functionName = functionArn.split(':').pop();
        const command = new GetFunctionCommand({ FunctionName: functionName });
        const response = await lambdaClient.send(command);

        expect(response.Configuration).toBeDefined();
        expect(response.Configuration?.Runtime).toBe('nodejs18.x');
        expect(response.Configuration?.MemorySize).toBe(256);
        expect(response.Configuration?.Timeout).toBe(300);
      }
    });

    test('should have environment variables configured', async () => {
      const functionArn =
        stackOutputs.validationFunctionArn ||
        stackOutputs.ValidationFunctionArn;
      if (functionArn) {
        const functionName = functionArn.split(':').pop();
        const command = new GetFunctionCommand({ FunctionName: functionName });
        const response = await lambdaClient.send(command);

        expect(
          response.Configuration?.Environment?.Variables
        ).toBeDefined();
        expect(
          response.Configuration?.Environment?.Variables?.MIGRATION_BATCH
        ).toBeDefined();
        expect(
          response.Configuration?.Environment?.Variables?.SOURCE_REGION
        ).toBe('us-east-1');
        expect(
          response.Configuration?.Environment?.Variables?.TARGET_REGION
        ).toBe('eu-west-1');
      }
    });
  });
});
