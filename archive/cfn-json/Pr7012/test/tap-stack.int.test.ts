/**
 * Integration tests for Crypto Alert System CloudFormation deployment.
 * Tests actual deployed resources using CloudFormation stack outputs.
 */

import { DeleteItemCommand, DescribeTableCommand, DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { GetFunctionCommand, GetFunctionConfigurationCommand, InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import * as fs from 'fs';
import * as path from 'path';

describe('Crypto Alert System - Integration Tests', () => {
  let outputs: any;
  let dynamodbClient: DynamoDBClient;
  let lambdaClient: LambdaClient;
  const region = process.env.AWS_REGION || 'us-east-1';
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

  beforeAll(() => {
    // Load stack outputs
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Outputs file not found at ${outputsPath}. Please ensure deployment has completed.`
      );
    }
    const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent);

    // Initialize AWS SDK clients
    dynamodbClient = new DynamoDBClient({ region });
    lambdaClient = new LambdaClient({ region });
  });

  describe('DynamoDB Table Integration', () => {
    let tableName: string;

    beforeAll(() => {
      tableName = outputs.CryptoAlertsTableName;
    });

    test('should have deployed DynamoDB table', () => {
      expect(tableName).toBeDefined();
      expect(tableName).toContain('CryptoAlerts');
    });

    test('table should be accessible and in ACTIVE state', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table!.TableStatus).toBe('ACTIVE');
    });

    test('table should have correct key schema', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      const keySchema = response.Table!.KeySchema;
      expect(keySchema).toHaveLength(2);

      const hashKey = keySchema!.find(k => k.KeyType === 'HASH');
      const rangeKey = keySchema!.find(k => k.KeyType === 'RANGE');

      expect(hashKey!.AttributeName).toBe('userId');
      expect(rangeKey!.AttributeName).toBe('alertId');
    });

    test('table should have PAY_PER_REQUEST billing mode', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      expect(response.Table!.BillingModeSummary!.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should be able to write and read items', async () => {
      const testItem = {
        TableName: tableName,
        Item: {
          userId: { S: 'test-user-integration' },
          alertId: { S: 'test-alert-integration' },
          symbol: { S: 'BTC' },
          targetPrice: { N: '50000' },
          timestamp: { S: new Date().toISOString() }
        }
      };

      // Write item
      await dynamodbClient.send(new PutItemCommand(testItem));

      // Read item
      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          userId: { S: 'test-user-integration' },
          alertId: { S: 'test-alert-integration' }
        }
      });

      const response = await dynamodbClient.send(getCommand);
      expect(response.Item).toBeDefined();
      expect(response.Item!.userId.S).toBe('test-user-integration');
      expect(response.Item!.symbol.S).toBe('BTC');

      // Cleanup
      await dynamodbClient.send(new DeleteItemCommand({
        TableName: tableName,
        Key: {
          userId: { S: 'test-user-integration' },
          alertId: { S: 'test-alert-integration' }
        }
      }));
    });
  });

  describe('Lambda Functions Integration', () => {
    describe('PriceWebhookProcessor Lambda', () => {
      let functionArn: string;

      beforeAll(() => {
        functionArn = outputs.PriceWebhookProcessorArn;
      });

      test('should have deployed Lambda function', () => {
        expect(functionArn).toBeDefined();
        expect(functionArn).toContain('lambda');
        expect(functionArn).toContain('PriceWebhookProcessor');
      });

      test('function should exist and be accessible', async () => {
        const command = new GetFunctionCommand({ FunctionName: functionArn });
        const response = await lambdaClient.send(command);

        expect(response.Configuration).toBeDefined();
        expect(response.Configuration!.State).toBe('Active');
      });

      test('function should have correct runtime and architecture', async () => {
        const command = new GetFunctionConfigurationCommand({ FunctionName: functionArn });
        const response = await lambdaClient.send(command);

        expect(response.Runtime).toBe('python3.11');
        expect(response.Architectures).toEqual(['arm64']);
      });

      test('function should be invokable', async () => {
        const testEvent = {
          body: JSON.stringify({
            symbol: 'BTC',
            price: 45000,
            timestamp: new Date().toISOString()
          })
        };

        const command = new InvokeCommand({
          FunctionName: functionArn,
          Payload: JSON.stringify(testEvent),
        });

        const response = await lambdaClient.send(command);
        expect(response.StatusCode).toBe(200);
      });
    });

    describe('AlertMatcher Lambda', () => {
      let functionArn: string;

      beforeAll(() => {
        functionArn = outputs.AlertMatcherArn;
      });

      test('should have deployed Lambda function', () => {
        expect(functionArn).toBeDefined();
        expect(functionArn).toContain('lambda');
        expect(functionArn).toContain('AlertMatcher');
      });

      test('function should exist and be accessible', async () => {
        const command = new GetFunctionCommand({ FunctionName: functionArn });
        const response = await lambdaClient.send(command);

        expect(response.Configuration).toBeDefined();
        expect(response.Configuration!.State).toBe('Active');
      });

      test('function should have correct runtime and architecture', async () => {
        const command = new GetFunctionConfigurationCommand({ FunctionName: functionArn });
        const response = await lambdaClient.send(command);

        expect(response.Runtime).toBe('python3.11');
        expect(response.Architectures).toEqual(['arm64']);
      });

      test('function should be invokable', async () => {
        const command = new InvokeCommand({
          FunctionName: functionArn,
          Payload: JSON.stringify({}),
        });

        const response = await lambdaClient.send(command);
        expect(response.StatusCode).toBe(200);
      });
    });

    describe('ProcessedAlerts Lambda', () => {
      let functionArn: string;

      beforeAll(() => {
        functionArn = outputs.ProcessedAlertsArn;
      });

      test('should have deployed Lambda function', () => {
        expect(functionArn).toBeDefined();
        expect(functionArn).toContain('lambda');
        expect(functionArn).toContain('ProcessedAlerts');
      });

      test('function should exist and be accessible', async () => {
        const command = new GetFunctionCommand({ FunctionName: functionArn });
        const response = await lambdaClient.send(command);

        expect(response.Configuration).toBeDefined();
        expect(response.Configuration!.State).toBe('Active');
      });

      test('function should have correct runtime and architecture', async () => {
        const command = new GetFunctionConfigurationCommand({ FunctionName: functionArn });
        const response = await lambdaClient.send(command);

        expect(response.Runtime).toBe('python3.11');
        expect(response.Architectures).toEqual(['arm64']);
      });

      test('function should be invokable', async () => {
        const testEvent = {
          responsePayload: {
            statusCode: 200,
            matched_count: 5,
            message: 'Alert matching completed'
          }
        };

        const command = new InvokeCommand({
          FunctionName: functionArn,
          Payload: JSON.stringify(testEvent),
        });

        const response = await lambdaClient.send(command);
        expect(response.StatusCode).toBe(200);
      });
    });
  });

  describe('Stack Outputs Validation', () => {
    test('should have CryptoAlertsTableName output', () => {
      expect(outputs.CryptoAlertsTableName).toBeDefined();
      expect(typeof outputs.CryptoAlertsTableName).toBe('string');
      expect(outputs.CryptoAlertsTableName).toContain('CryptoAlerts');
    });

    test('should have CryptoAlertsTableArn output', () => {
      expect(outputs.CryptoAlertsTableArn).toBeDefined();
      expect(outputs.CryptoAlertsTableArn).toContain('arn:aws:dynamodb');
      expect(outputs.CryptoAlertsTableArn).toContain('CryptoAlerts');
    });

    test('should have PriceWebhookProcessorArn output', () => {
      expect(outputs.PriceWebhookProcessorArn).toBeDefined();
      expect(outputs.PriceWebhookProcessorArn).toContain('arn:aws:lambda');
      expect(outputs.PriceWebhookProcessorArn).toContain('PriceWebhookProcessor');
    });

    test('should have AlertMatcherArn output', () => {
      expect(outputs.AlertMatcherArn).toBeDefined();
      expect(outputs.AlertMatcherArn).toContain('arn:aws:lambda');
      expect(outputs.AlertMatcherArn).toContain('AlertMatcher');
    });

    test('should have ProcessedAlertsArn output', () => {
      expect(outputs.ProcessedAlertsArn).toBeDefined();
      expect(outputs.ProcessedAlertsArn).toContain('arn:aws:lambda');
      expect(outputs.ProcessedAlertsArn).toContain('ProcessedAlerts');
    });
  });

  describe('End-to-End Workflow', () => {
    test('complete workflow: webhook -> storage -> matching -> processing', async () => {
      const tableName = outputs.CryptoAlertsTableName;
      const webhookArn = outputs.PriceWebhookProcessorArn;
      const matcherArn = outputs.AlertMatcherArn;

      // Step 1: Create test alert in DynamoDB
      const testAlert = {
        TableName: tableName,
        Item: {
          userId: { S: 'e2e-test-user' },
          alertId: { S: 'e2e-test-alert' },
          symbol: { S: 'BTC' },
          targetPrice: { N: '45000' },
          alertType: { S: 'ABOVE' },
          timestamp: { S: new Date().toISOString() }
        }
      };
      await dynamodbClient.send(new PutItemCommand(testAlert));

      // Step 2: Invoke webhook processor
      const webhookEvent = {
        body: JSON.stringify({
          symbol: 'BTC',
          price: 46000,
          timestamp: new Date().toISOString()
        })
      };
      const webhookResponse = await lambdaClient.send(new InvokeCommand({
        FunctionName: webhookArn,
        Payload: JSON.stringify(webhookEvent),
      }));
      expect(webhookResponse.StatusCode).toBe(200);

      // Step 3: Invoke alert matcher
      const matcherResponse = await lambdaClient.send(new InvokeCommand({
        FunctionName: matcherArn,
        Payload: JSON.stringify({}),
      }));
      expect(matcherResponse.StatusCode).toBe(200);

      // Step 4: Verify alert still exists in table
      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          userId: { S: 'e2e-test-user' },
          alertId: { S: 'e2e-test-alert' }
        }
      });
      const getResponse = await dynamodbClient.send(getCommand);
      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item!.symbol.S).toBe('BTC');

      // Cleanup
      await dynamodbClient.send(new DeleteItemCommand({
        TableName: tableName,
        Key: {
          userId: { S: 'e2e-test-user' },
          alertId: { S: 'e2e-test-alert' }
        }
      }));
    });
  });
});
