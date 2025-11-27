/**
 * Integration tests for Payment Webhook Processing System
 * Tests validate deployed AWS resources and their integrations
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  DynamoDBClient,
  DescribeTableCommand,
  DescribeContinuousBackupsCommand,
  GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
  GetFunctionConcurrencyCommand,
} from '@aws-sdk/client-lambda';
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';
import {
  SFNClient,
  DescribeStateMachineCommand,
} from '@aws-sdk/client-sfn';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';

// Load deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any;

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
} catch (error) {
  console.error('Failed to load deployment outputs:', error);
  outputs = {};
}

const region = 'us-east-1';

const dynamoClient = new DynamoDBClient({ region });
const lambdaClient = new LambdaClient({ region });
const apiGatewayClient = new APIGatewayClient({ region });
const sfnClient = new SFNClient({ region });
const kmsClient = new KMSClient({ region });

describe('Payment Webhook Processing System - Integration Tests', () => {
  describe('DynamoDB Table', () => {
    it('table exists and has correct configuration', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.paymentsTableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.paymentsTableName);
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(response.Table?.KeySchema).toBeDefined();

      // Verify partition key and sort key
      const hashKey = response.Table?.KeySchema?.find(k => k.KeyType === 'HASH');
      const rangeKey = response.Table?.KeySchema?.find(k => k.KeyType === 'RANGE');
      expect(hashKey?.AttributeName).toBe('paymentId');
      expect(rangeKey?.AttributeName).toBe('timestamp');
    }, 30000);

    it('has point-in-time recovery enabled', async () => {
      const command = new DescribeContinuousBackupsCommand({
        TableName: outputs.paymentsTableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus).toBe('ENABLED');
    }, 30000);

    it('has encryption enabled', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.paymentsTableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
    }, 30000);

    it('has streams enabled', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.paymentsTableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table?.StreamSpecification?.StreamEnabled).toBe(true);
      expect(response.Table?.LatestStreamArn).toBeDefined();
    }, 30000);
  });

  describe('Lambda Functions', () => {
    it('webhook validator exists with correct configuration', async () => {
      const configCommand = new GetFunctionConfigurationCommand({
        FunctionName: outputs.webhookValidatorFunctionName,
      });
      const configResponse = await lambdaClient.send(configCommand);

      expect(configResponse.FunctionName).toBe(outputs.webhookValidatorFunctionName);
      expect(configResponse.Runtime).toBe('nodejs18.x');
      expect(configResponse.Architectures).toContain('arm64');
      expect(configResponse.TracingConfig?.Mode).toBe('Active');
      expect(configResponse.KMSKeyArn).toBeDefined();

      // Check reserved concurrency separately
      const functionCommand = new GetFunctionCommand({
        FunctionName: outputs.webhookValidatorFunctionName,
      });
      const functionResponse = await lambdaClient.send(functionCommand);
      expect(functionResponse.Concurrency?.ReservedConcurrentExecutions).toBe(10);
    }, 30000);

    it('payment processor exists with correct configuration', async () => {
      const configCommand = new GetFunctionConfigurationCommand({
        FunctionName: outputs.paymentProcessorFunctionName,
      });
      const configResponse = await lambdaClient.send(configCommand);

      expect(configResponse.FunctionName).toBe(outputs.paymentProcessorFunctionName);
      expect(configResponse.Runtime).toBe('nodejs18.x');
      expect(configResponse.Architectures).toContain('arm64');
      expect(configResponse.TracingConfig?.Mode).toBe('Active');
      expect(configResponse.KMSKeyArn).toBeDefined();

      // Check reserved concurrency separately
      const functionCommand = new GetFunctionCommand({
        FunctionName: outputs.paymentProcessorFunctionName,
      });
      const functionResponse = await lambdaClient.send(functionCommand);
      expect(functionResponse.Concurrency?.ReservedConcurrentExecutions).toBe(10);
    }, 30000);
  });

  describe('API Gateway', () => {
    it('REST API exists', async () => {
      const command = new GetRestApiCommand({
        restApiId: outputs.apiId,
      });
      const response = await apiGatewayClient.send(command);

      expect(response.id).toBe(outputs.apiId);
      expect(response.name).toContain('payment-webhook-api');
    }, 30000);

    it('stage has X-Ray tracing enabled', async () => {
      const command = new GetStageCommand({
        restApiId: outputs.apiId,
        stageName: 'prod',
      });
      const response = await apiGatewayClient.send(command);

      expect(response.stageName).toBe('prod');
      expect(response.tracingEnabled).toBe(true);
    }, 30000);
  });

  describe('Step Functions State Machine', () => {
    it('state machine exists with correct configuration', async () => {
      const command = new DescribeStateMachineCommand({
        stateMachineArn: outputs.stateMachineArn,
      });
      const response = await sfnClient.send(command);

      expect(response.stateMachineArn).toBe(outputs.stateMachineArn);
      expect(response.name).toContain('payment-processor');
      expect(response.tracingConfiguration?.enabled).toBe(true);

      // Verify definition includes retry logic
      const definition = JSON.parse(response.definition || '{}');
      expect(definition.States.ProcessPayment.Retry).toBeDefined();
      expect(definition.States.ProcessPayment.Retry[0].BackoffRate).toBe(2.0);
      expect(definition.States.ProcessPayment.Retry[0].MaxAttempts).toBe(3);
    }, 30000);
  });

  describe('KMS Key', () => {
    it('KMS key exists and has rotation enabled', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.kmsKeyId,
      });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata?.KeyId).toBe(outputs.kmsKeyId);
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');

      // Check rotation status
      const rotationCommand = new GetKeyRotationStatusCommand({
        KeyId: outputs.kmsKeyId,
      });
      const rotationResponse = await kmsClient.send(rotationCommand);
      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    }, 30000);
  });

  describe('Resource Integration', () => {
    it('all resources are properly connected', async () => {
      // Verify API Gateway can reach Lambda
      const lambdaConfig = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: outputs.webhookValidatorFunctionName,
        })
      );
      expect(lambdaConfig.Environment?.Variables?.TABLE_NAME).toBe(outputs.paymentsTableName);

      // Verify DynamoDB table has streams for EventBridge
      const tableDesc = await dynamoClient.send(
        new DescribeTableCommand({
          TableName: outputs.paymentsTableName,
        })
      );
      expect(tableDesc.Table?.LatestStreamArn).toBeDefined();

      // Verify state machine exists and is reachable
      const sfnDesc = await sfnClient.send(
        new DescribeStateMachineCommand({
          stateMachineArn: outputs.stateMachineArn,
        })
      );
      expect(sfnDesc.status).toBe('ACTIVE');
    }, 30000);
  });
});
