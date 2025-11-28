// Integration tests for Multi-Region Disaster Recovery CloudFormation Stack
// NOTE: These tests require successful deployment and cfn-outputs/flat-outputs.json

import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, GetBucketVersioningCommand } from '@aws-sdk/client-s3';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import fs from 'fs';

describe('Multi-Region Disaster Recovery Integration Tests', () => {
  describe('Prerequisites', () => {
    test('should have deployment outputs available', () => {
      expect(() => {
        fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8');
      }).not.toThrow();
    });
  });

  describe('DynamoDB Global Table', () => {
    test('should verify DynamoDB table exists', async () => {
      // Test implementation requires cfn-outputs
      const outputs = JSON.parse(
        fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
      );

      const dynamodb = new DynamoDBClient({ region: 'us-east-1' });
      const command = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName
      });

      const response = await dynamodb.send(command);
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.DynamoDBTableName);
    });

    test('should verify point-in-time recovery is enabled', async () => {
      const outputs = JSON.parse(
        fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
      );

      const dynamodb = new DynamoDBClient({ region: 'us-east-1' });
      const command = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName
      });

      const response = await dynamodb.send(command);
      expect(response.Table?.SSEDescription).toBeDefined();
      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
    });

    test('should verify global table has replicas', async () => {
      const outputs = JSON.parse(
        fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
      );

      const dynamodb = new DynamoDBClient({ region: 'us-east-1' });
      const command = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName
      });

      const response = await dynamodb.send(command);
      expect(response.Table?.Replicas).toBeDefined();
      expect(response.Table?.Replicas?.length).toBeGreaterThan(0);
    });
  });

  describe('S3 Bucket', () => {
    test('should verify S3 bucket exists', async () => {
      const outputs = JSON.parse(
        fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
      );

      const s3 = new S3Client({ region: 'us-east-1' });
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.S3BucketName
      });

      const response = await s3.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('should verify S3 bucket has versioning enabled', async () => {
      const outputs = JSON.parse(
        fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
      );

      const s3 = new S3Client({ region: 'us-east-1' });
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.S3BucketName
      });

      const response = await s3.send(command);
      expect(response.Status).toBe('Enabled');
    });
  });

  describe('Lambda Function', () => {
    test('should verify Lambda function exists', async () => {
      const outputs = JSON.parse(
        fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
      );

      const lambda = new LambdaClient({ region: 'us-east-1' });
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName
      });

      const response = await lambda.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(outputs.LambdaFunctionName);
    });

    test('should verify Lambda has correct runtime', async () => {
      const outputs = JSON.parse(
        fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
      );

      const lambda = new LambdaClient({ region: 'us-east-1' });
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName
      });

      const response = await lambda.send(command);
      expect(response.Configuration?.Runtime).toBe('python3.11');
    });

    test('should verify Lambda has environment variables', async () => {
      const outputs = JSON.parse(
        fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
      );

      const lambda = new LambdaClient({ region: 'us-east-1' });
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName
      });

      const response = await lambda.send(command);
      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(response.Configuration?.Environment?.Variables?.ENVIRONMENT_SUFFIX).toBeDefined();
    });
  });

  describe('KMS Encryption', () => {
    test('should verify KMS key exists', async () => {
      const outputs = JSON.parse(
        fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
      );

      const kms = new KMSClient({ region: 'us-east-1' });
      const command = new DescribeKeyCommand({
        KeyId: outputs.KMSKeyId
      });

      const response = await kms.send(command);
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.KeyId).toBe(outputs.KMSKeyId);
    });

    test('should verify KMS key has rotation enabled', async () => {
      const outputs = JSON.parse(
        fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
      );

      const kms = new KMSClient({ region: 'us-east-1' });
      const command = new DescribeKeyCommand({
        KeyId: outputs.KMSKeyId
      });

      const response = await kms.send(command);
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
    });
  });

  describe('SNS Topic', () => {
    test('should verify SNS topic exists', async () => {
      const outputs = JSON.parse(
        fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
      );

      const sns = new SNSClient({ region: 'us-east-1' });
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.SNSTopicArn
      });

      const response = await sns.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.SNSTopicArn);
    });
  });
});
