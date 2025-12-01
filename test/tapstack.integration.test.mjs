import { describe, test, expect } from '@jest/globals';
import { readFileSync } from 'fs';

// Load deployment outputs
const outputs = JSON.parse(readFileSync('cfn-outputs/flat-outputs.json', 'utf-8'));

// AWS SDK v3 imports
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand
} from '@aws-sdk/client-dynamodb';

import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand
} from '@aws-sdk/client-lambda';

import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand
} from '@aws-sdk/client-api-gateway';

import {
  SFNClient,
  DescribeStateMachineCommand
} from '@aws-sdk/client-sfn';

import {
  SQSClient,
  GetQueueAttributesCommand
} from '@aws-sdk/client-sqs';

import {
  CloudWatchClient,
  GetDashboardCommand
} from '@aws-sdk/client-cloudwatch';

const region = 'us-east-1';

describe('Integration Tests - Deployed Infrastructure', () => {
  describe('DynamoDB Table', () => {
    const dynamodb = new DynamoDBClient({ region });

    test('should exist and be active', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.dynamodb_table_name
      });
      const response = await dynamodb.send(command);
      expect(response.Table.TableStatus).toBe('ACTIVE');
      expect(response.Table.TableName).toBe(outputs.dynamodb_table_name);
    });

    test('should have point-in-time recovery enabled', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.dynamodb_table_name
      });
      const response = await dynamodb.send(command);
      expect(response.Table).toBeDefined();
    });

    test('should have correct key schema', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.dynamodb_table_name
      });
      const response = await dynamodb.send(command);
      const keys = response.Table.KeySchema;
      const hashKey = keys.find(k => k.KeyType === 'HASH');
      const rangeKey = keys.find(k => k.KeyType === 'RANGE');
      expect(hashKey.AttributeName).toBe('transaction_id');
      expect(rangeKey.AttributeName).toBe('timestamp');
    });

    test('should be able to write and read data', async () => {
      const testId = 'test-' + new Date().getTime();
      const timestamp = new Date().getTime();

      // Write test data
      const putCommand = new PutItemCommand({
        TableName: outputs.dynamodb_table_name,
        Item: {
          transaction_id: { S: testId },
          timestamp: { N: timestamp.toString() },
          provider: { S: 'stripe' },
          test_data: { S: 'integration test' }
        }
      });
      await dynamodb.send(putCommand);

      // Read test data
      const getCommand = new GetItemCommand({
        TableName: outputs.dynamodb_table_name,
        Key: {
          transaction_id: { S: testId },
          timestamp: { N: timestamp.toString() }
        }
      });
      const response = await dynamodb.send(getCommand);
      expect(response.Item).toBeDefined();
      expect(response.Item.transaction_id.S).toBe(testId);
      expect(response.Item.provider.S).toBe('stripe');
    }, 15000);
  });

  describe('Lambda Function', () => {
    const lambda = new LambdaClient({ region });

    test('should exist and be active', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.lambda_function_name
      });
      const response = await lambda.send(command);
      expect(response.Configuration.FunctionName).toBe(outputs.lambda_function_name);
      expect(response.Configuration.State).toBe('Active');
    });

    test('should have correct runtime and architecture', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.lambda_function_name
      });
      const response = await lambda.send(command);
      expect(response.Configuration.Runtime).toBe('python3.11');
      expect(response.Configuration.Architectures).toContain('arm64');
    });

    test('should have environment variables configured', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.lambda_function_name
      });
      const response = await lambda.send(command);
      expect(response.Configuration.Environment.Variables).toBeDefined();
      expect(response.Configuration.Environment.Variables.DYNAMODB_TABLE_NAME).toBe(outputs.dynamodb_table_name);
    });

    test('should have dead letter queue configured', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.lambda_function_name
      });
      const response = await lambda.send(command);
      expect(response.Configuration.DeadLetterConfig).toBeDefined();
      expect(response.Configuration.DeadLetterConfig.TargetArn).toBe(outputs.dlq_arn);
    });

    test('should be invokable', async () => {
      const command = new InvokeCommand({
        FunctionName: outputs.lambda_function_name,
        Payload: JSON.stringify({
          pathParameters: { provider: 'stripe' },
          body: JSON.stringify({ id: 'test-123', type: 'payment' })
        })
      });
      const response = await lambda.send(command);
      expect(response.StatusCode).toBe(200);
    }, 15000);
  });

  describe('API Gateway', () => {
    const apigateway = new APIGatewayClient({ region });

    test('should exist with correct configuration', async () => {
      const command = new GetRestApiCommand({
        restApiId: outputs.api_gateway_id
      });
      const response = await apigateway.send(command);
      expect(response.id).toBe(outputs.api_gateway_id);
      expect(response.name).toContain('webhook-api');
    });

    test('should have prod stage deployed', async () => {
      const command = new GetStageCommand({
        restApiId: outputs.api_gateway_id,
        stageName: 'prod'
      });
      const response = await apigateway.send(command);
      expect(response.stageName).toBe('prod');
      expect(response.deploymentId).toBeDefined();
    });

    test('should have correct invoke URL format', () => {
      const expectedPattern = /^https:\/\/.*\.execute-api\.us-east-1\.amazonaws\.com\/prod\/webhook\/\{provider\}$/;
      expect(outputs.api_gateway_url).toMatch(expectedPattern);
    });
  });

  describe('Step Functions', () => {
    const sfn = new SFNClient({ region });

    test('should exist and be active', async () => {
      const command = new DescribeStateMachineCommand({
        stateMachineArn: outputs.step_functions_arn
      });
      const response = await sfn.send(command);
      expect(response.stateMachineArn).toBe(outputs.step_functions_arn);
      expect(response.status).toBe('ACTIVE');
    });

    test('should have correct naming', async () => {
      const command = new DescribeStateMachineCommand({
        stateMachineArn: outputs.step_functions_arn
      });
      const response = await sfn.send(command);
      expect(response.name).toContain('webhook-orchestration');
    });

    test('should have logging enabled', async () => {
      const command = new DescribeStateMachineCommand({
        stateMachineArn: outputs.step_functions_arn
      });
      const response = await sfn.send(command);
      expect(response.loggingConfiguration).toBeDefined();
      expect(response.loggingConfiguration.level).toBe('ALL');
    });
  });

  describe('SQS Dead Letter Queue', () => {
    const sqs = new SQSClient({ region });

    test('should exist with correct attributes', async () => {
      const command = new GetQueueAttributesCommand({
        QueueUrl: outputs.dlq_url,
        AttributeNames: ['All']
      });
      const response = await sqs.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes.QueueArn).toBe(outputs.dlq_arn);
    });

    test('should have correct message retention', async () => {
      const command = new GetQueueAttributesCommand({
        QueueUrl: outputs.dlq_url,
        AttributeNames: ['MessageRetentionPeriod']
      });
      const response = await sqs.send(command);
      expect(response.Attributes.MessageRetentionPeriod).toBe('1209600');
    });
  });

  describe('CloudWatch Dashboard', () => {
    const cloudwatch = new CloudWatchClient({ region });

    test('should exist', async () => {
      const command = new GetDashboardCommand({
        DashboardName: outputs.cloudwatch_dashboard_name
      });
      const response = await cloudwatch.send(command);
      expect(response.DashboardName).toBe(outputs.cloudwatch_dashboard_name);
      expect(response.DashboardBody).toBeDefined();
    });

    test('should monitor all key metrics', async () => {
      const command = new GetDashboardCommand({
        DashboardName: outputs.cloudwatch_dashboard_name
      });
      const response = await cloudwatch.send(command);
      const dashboard = JSON.parse(response.DashboardBody);
      expect(dashboard.widgets.length).toBeGreaterThan(0);
      const metrics = JSON.stringify(dashboard);
      expect(metrics).toContain('AWS/ApiGateway');
      expect(metrics).toContain('AWS/Lambda');
      expect(metrics).toContain('AWS/DynamoDB');
      expect(metrics).toContain('AWS/States');
    });
  });

  describe('End-to-End Workflow', () => {
    test('all resources should be interconnected', () => {
      expect(outputs.api_gateway_url).toBeDefined();
      expect(outputs.lambda_function_name).toBeDefined();
      expect(outputs.dynamodb_table_name).toBeDefined();
      expect(outputs.step_functions_arn).toBeDefined();
      expect(outputs.dlq_url).toBeDefined();
      expect(outputs.cloudwatch_dashboard_name).toBeDefined();
    });

    test('all resources should follow naming convention with environment suffix', () => {
      const suffix = 'synth101912391';
      expect(outputs.lambda_function_name).toContain(suffix);
      expect(outputs.dynamodb_table_name).toContain(suffix);
      expect(outputs.cloudwatch_dashboard_name).toContain(suffix);
    });
  });
});
