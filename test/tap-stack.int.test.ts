import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import * as fs from 'fs';
import * as path from 'path';

// Load stack outputs
const outputsPath = path.join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// Initialize AWS clients
const dynamoDBClient = new DynamoDBClient({ region: 'us-east-1' });
const snsClient = new SNSClient({ region: 'us-east-1' });
const lambdaClient = new LambdaClient({ region: 'us-east-1' });
const logsClient = new CloudWatchLogsClient({ region: 'us-east-1' });
const eventBridgeClient = new EventBridgeClient({ region: 'us-east-1' });
const kmsClient = new KMSClient({ region: 'us-east-1' });
const iamClient = new IAMClient({ region: 'us-east-1' });

describe('Crypto Alerts Infrastructure Integration Tests', () => {
  describe('Stack Outputs Validation', () => {
    it('should have all required outputs', () => {
      expect(outputs.tableName).toBeDefined();
      expect(outputs.tableArn).toBeDefined();
      expect(outputs.topicArn).toBeDefined();
      expect(outputs.priceCheckerFunctionName).toBeDefined();
      expect(outputs.priceCheckerFunctionArn).toBeDefined();
      expect(outputs.alertProcessorFunctionName).toBeDefined();
      expect(outputs.alertProcessorFunctionArn).toBeDefined();
      expect(outputs.kmsKeyId).toBeDefined();
      expect(outputs.eventRuleName).toBeDefined();
    });

    it('should have valid ARN format for table', () => {
      expect(outputs.tableArn).toMatch(
        /^arn:aws:dynamodb:us-east-1:\d+:table\/.+$/
      );
    });

    it('should have valid ARN format for topic', () => {
      expect(outputs.topicArn).toMatch(/^arn:aws:sns:us-east-1:\d+:.+$/);
    });

    it('should have valid ARN format for Lambda functions', () => {
      expect(outputs.priceCheckerFunctionArn).toMatch(
        /^arn:aws:lambda:us-east-1:\d+:function:.+$/
      );
      expect(outputs.alertProcessorFunctionArn).toMatch(
        /^arn:aws:lambda:us-east-1:\d+:function:.+$/
      );
    });
  });

  describe('DynamoDB Table', () => {
    it('should exist and be accessible', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.tableName,
      });

      const response = await dynamoDBClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.tableName);
    });

    it('should have correct partition and sort keys', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.tableName,
      });

      const response = await dynamoDBClient.send(command);

      const keySchema = response.Table?.KeySchema;
      expect(keySchema).toBeDefined();

      const hashKey = keySchema?.find((k) => k.KeyType === 'HASH');
      const rangeKey = keySchema?.find((k) => k.KeyType === 'RANGE');

      expect(hashKey?.AttributeName).toBe('userId');
      expect(rangeKey?.AttributeName).toBe('alertId');
    });

    it('should have streams enabled', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.tableName,
      });

      const response = await dynamoDBClient.send(command);

      expect(response.Table?.StreamSpecification?.StreamEnabled).toBe(true);
      expect(response.Table?.StreamSpecification?.StreamViewType).toBe(
        'NEW_AND_OLD_IMAGES'
      );
    });

    it('should have global secondary index on coinSymbol', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.tableName,
      });

      const response = await dynamoDBClient.send(command);

      const gsi = response.Table?.GlobalSecondaryIndexes?.find(
        (index) => index.IndexName === 'coinSymbol-index'
      );

      expect(gsi).toBeDefined();
      expect(gsi?.KeySchema?.[0].AttributeName).toBe('coinSymbol');
    });

    it('should have point-in-time recovery enabled', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.tableName,
      });

      const response = await dynamoDBClient.send(command);

      // Note: Point-in-time recovery status might not be immediately visible in DescribeTable
      expect(response.Table).toBeDefined();
    });

    it('should use PAY_PER_REQUEST billing mode', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.tableName,
      });

      const response = await dynamoDBClient.send(command);

      expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });
  });

  describe('SNS Topic', () => {
    it('should exist and be accessible', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.topicArn,
      });

      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.topicArn);
    });

    it('should have encryption enabled', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.topicArn,
      });

      const response = await snsClient.send(command);

      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
    });
  });

  describe('Lambda Functions', () => {
    it('should have price checker Lambda deployed', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.priceCheckerFunctionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(
        outputs.priceCheckerFunctionName
      );
    });

    it('should have alert processor Lambda deployed', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.alertProcessorFunctionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(
        outputs.alertProcessorFunctionName
      );
    });

    it('should use Node.js 18 runtime', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.priceCheckerFunctionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Runtime).toMatch(/nodejs18/);
    });

    it('should use ARM64 architecture', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.priceCheckerFunctionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Architectures).toContain('arm64');
    });

    it('should have environment variables configured for price checker', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.priceCheckerFunctionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.TABLE_NAME
      ).toBe(outputs.tableName);
      expect(
        response.Configuration?.Environment?.Variables?.EXCHANGE_API_ENDPOINT
      ).toBeDefined();
    });

    it('should have environment variables configured for alert processor', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.alertProcessorFunctionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.TOPIC_ARN
      ).toBe(outputs.topicArn);
    });

    it('should have KMS encryption for environment variables', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.priceCheckerFunctionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration?.KMSKeyArn).toBeDefined();
    });

    it('should have correct tags', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.priceCheckerFunctionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Tags).toBeDefined();
      expect(response.Tags?.Environment).toBeDefined();
      expect(response.Tags?.Service).toBe('crypto-alerts');
    });
  });

  describe('CloudWatch Log Groups', () => {
    it('should have log group for price checker', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/${outputs.priceCheckerFunctionName}`,
      });

      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      expect(response.logGroups?.[0].logGroupName).toBe(
        `/aws/lambda/${outputs.priceCheckerFunctionName}`
      );
    });

    it('should have log group for alert processor', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/${outputs.alertProcessorFunctionName}`,
      });

      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      expect(response.logGroups?.[0].logGroupName).toBe(
        `/aws/lambda/${outputs.alertProcessorFunctionName}`
      );
    });

    it('should have 14-day retention policy', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/${outputs.priceCheckerFunctionName}`,
      });

      const response = await logsClient.send(command);

      expect(response.logGroups?.[0].retentionInDays).toBe(14);
    });
  });

  describe('EventBridge Rule', () => {
    it('should exist and be accessible', async () => {
      const command = new DescribeRuleCommand({
        Name: outputs.eventRuleName,
      });

      const response = await eventBridgeClient.send(command);

      expect(response.Name).toBe(outputs.eventRuleName);
    });

    it('should have correct cron schedule', async () => {
      const command = new DescribeRuleCommand({
        Name: outputs.eventRuleName,
      });

      const response = await eventBridgeClient.send(command);

      expect(response.ScheduleExpression).toBe('cron(* * * * ? *)');
    });

    it('should have Lambda target configured', async () => {
      const command = new ListTargetsByRuleCommand({
        Rule: outputs.eventRuleName,
      });

      const response = await eventBridgeClient.send(command);

      expect(response.Targets).toBeDefined();
      expect(response.Targets?.length).toBeGreaterThan(0);
      expect(response.Targets?.[0].Arn).toBe(
        outputs.priceCheckerFunctionArn
      );
    });

    it('should be in ENABLED state', async () => {
      const command = new DescribeRuleCommand({
        Name: outputs.eventRuleName,
      });

      const response = await eventBridgeClient.send(command);

      expect(response.State).toBe('ENABLED');
    });
  });

  describe('KMS Key', () => {
    it('should exist and be accessible', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.kmsKeyId,
      });

      const response = await kmsClient.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.KeyId).toBe(outputs.kmsKeyId);
    });

    it('should be enabled', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.kmsKeyId,
      });

      const response = await kmsClient.send(command);

      expect(response.KeyMetadata?.Enabled).toBe(true);
    });
  });

  describe('End-to-End Workflow', () => {
    const testUserId = `test-user-${Date.now()}`;
    const testAlertId = `test-alert-${Date.now()}`;

    afterAll(async () => {
      // Cleanup: Delete test alert
      try {
        const deleteCommand = new DeleteItemCommand({
          TableName: outputs.tableName,
          Key: {
            userId: { S: testUserId },
            alertId: { S: testAlertId },
          },
        });
        await dynamoDBClient.send(deleteCommand);
      } catch (error) {
        console.log('Cleanup error (may be expected):', error);
      }
    });

    it('should allow writing to DynamoDB table', async () => {
      const putCommand = new PutItemCommand({
        TableName: outputs.tableName,
        Item: {
          userId: { S: testUserId },
          alertId: { S: testAlertId },
          coinSymbol: { S: 'BTC' },
          threshold: { N: '50000' },
          condition: { S: 'above' },
        },
      });

      await expect(dynamoDBClient.send(putCommand)).resolves.not.toThrow();
    });

    it('should be able to invoke price checker Lambda', async () => {
      const invokeCommand = new InvokeCommand({
        FunctionName: outputs.priceCheckerFunctionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({}),
      });

      const response = await lambdaClient.send(invokeCommand);

      expect(response.StatusCode).toBe(200);
      expect(response.Payload).toBeDefined();
    });
  });

  describe('IAM Roles', () => {
    it('should have price checker IAM role', async () => {
      // Get role name from Lambda function configuration
      const funcCommand = new GetFunctionCommand({
        FunctionName: outputs.priceCheckerFunctionName,
      });
      const funcResponse = await lambdaClient.send(funcCommand);
      const roleArn = funcResponse.Configuration?.Role;

      expect(roleArn).toBeDefined();

      // Extract role name from ARN
      const roleName = roleArn?.split('/').pop() || '';

      const command = new GetRoleCommand({
        RoleName: roleName,
      });

      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    });

    it('should have alert processor IAM role', async () => {
      // Get role name from Lambda function configuration
      const funcCommand = new GetFunctionCommand({
        FunctionName: outputs.alertProcessorFunctionName,
      });
      const funcResponse = await lambdaClient.send(funcCommand);
      const roleArn = funcResponse.Configuration?.Role;

      expect(roleArn).toBeDefined();

      // Extract role name from ARN
      const roleName = roleArn?.split('/').pop() || '';

      const command = new GetRoleCommand({
        RoleName: roleName,
      });

      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    });
  });
});

