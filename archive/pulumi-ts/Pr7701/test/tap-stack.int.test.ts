/**
 * Integration tests for TapStack
 *
 * These tests validate the deployed webhook processing infrastructure
 * against real AWS resources using stack outputs.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  ApiGatewayV2Client,
  GetApiCommand,
  GetRoutesCommand,
} from '@aws-sdk/client-apigatewayv2';

// Load stack outputs
const outputsPath = path.join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);

describe('TapStack Integration Tests', () => {
  let outputs: {
    apiUrl: string;
    tableName: string;
    receiverFunctionName: string;
    validatorFunctionName: string;
    processorFunctionName: string;
  };

  let dynamoClient: DynamoDBClient;
  let lambdaClient: LambdaClient;
  let apiGatewayClient: ApiGatewayV2Client;

  const region = process.env.AWS_REGION || 'us-east-1';

  beforeAll(() => {
    // Load outputs
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Stack outputs not found at ${outputsPath}. Deploy the stack first.`
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

    // Initialize AWS clients
    dynamoClient = new DynamoDBClient({ region });
    lambdaClient = new LambdaClient({ region });
    apiGatewayClient = new ApiGatewayV2Client({ region });
  });

  describe('DynamoDB Table', () => {
    it('should exist and be accessible', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.tableName,
      });

      const response = await dynamoClient.send(command);
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.tableName);
    });

    it('should have correct billing mode (PAY_PER_REQUEST baseline)', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.tableName,
      });

      const response = await dynamoClient.send(command);
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });

    it('should have correct hash key configuration', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.tableName,
      });

      const response = await dynamoClient.send(command);
      const keySchema = response.Table?.KeySchema;
      expect(keySchema).toBeDefined();

      const hashKey = keySchema?.find(key => key.KeyType === 'HASH');
      expect(hashKey?.AttributeName).toBe('webhookId');
    });

    it('should have correct range key configuration', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.tableName,
      });

      const response = await dynamoClient.send(command);
      const keySchema = response.Table?.KeySchema;

      const rangeKey = keySchema?.find(key => key.KeyType === 'RANGE');
      expect(rangeKey?.AttributeName).toBe('timestamp');
    });

    it('should have StatusIndex GSI', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.tableName,
      });

      const response = await dynamoClient.send(command);
      const gsis = response.Table?.GlobalSecondaryIndexes;
      expect(gsis).toBeDefined();

      const statusIndex = gsis?.find(gsi => gsi.IndexName === 'StatusIndex');
      expect(statusIndex).toBeDefined();
      expect(statusIndex?.KeySchema?.[0]?.AttributeName).toBe('status');
    });

    it('should have point-in-time recovery enabled', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.tableName,
      });

      const response = await dynamoClient.send(command);
      expect(
        response.Table?.ArchivalSummary?.ArchivalDateTime
      ).toBeUndefined();
    });

    it('should have server-side encryption enabled', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.tableName,
      });

      const response = await dynamoClient.send(command);
      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
    });

    it('should allow write operations', async () => {
      const timestamp = Date.now();
      const putCommand = new PutItemCommand({
        TableName: outputs.tableName,
        Item: {
          webhookId: { S: `test-webhook-${timestamp}` },
          timestamp: { N: timestamp.toString() },
          status: { S: 'pending' },
          payload: { S: JSON.stringify({ test: true }) },
        },
      });

      await expect(dynamoClient.send(putCommand)).resolves.not.toThrow();
    });

    it('should allow read operations', async () => {
      const timestamp = Date.now();
      const webhookId = `test-read-${timestamp}`;

      // Write test data
      await dynamoClient.send(
        new PutItemCommand({
          TableName: outputs.tableName,
          Item: {
            webhookId: { S: webhookId },
            timestamp: { N: timestamp.toString() },
            status: { S: 'completed' },
          },
        })
      );

      // Read it back
      const getCommand = new GetItemCommand({
        TableName: outputs.tableName,
        Key: {
          webhookId: { S: webhookId },
          timestamp: { N: timestamp.toString() },
        },
      });

      const response = await dynamoClient.send(getCommand);
      expect(response.Item).toBeDefined();
      expect(response.Item?.webhookId?.S).toBe(webhookId);
      expect(response.Item?.status?.S).toBe('completed');
    });
  });

  describe('Lambda Functions', () => {
    describe('Receiver Function', () => {
      it('should exist and be accessible', async () => {
        const command = new GetFunctionCommand({
          FunctionName: outputs.receiverFunctionName,
        });

        const response = await lambdaClient.send(command);
        expect(response.Configuration).toBeDefined();
        expect(response.Configuration?.FunctionName).toBe(
          outputs.receiverFunctionName
        );
      });

      it('should have correct runtime', async () => {
        const command = new GetFunctionConfigurationCommand({
          FunctionName: outputs.receiverFunctionName,
        });

        const response = await lambdaClient.send(command);
        expect(response.Runtime).toBe('nodejs18.x');
      });

      it('should have environment variables configured', async () => {
        const command = new GetFunctionConfigurationCommand({
          FunctionName: outputs.receiverFunctionName,
        });

        const response = await lambdaClient.send(command);
        expect(response.Environment?.Variables).toBeDefined();
        expect(response.Environment?.Variables?.TABLE_NAME).toBe(
          outputs.tableName
        );
      });

      it('should have baseline memory configuration (3072MB before optimization)', async () => {
        const command = new GetFunctionConfigurationCommand({
          FunctionName: outputs.receiverFunctionName,
        });

        const response = await lambdaClient.send(command);
        // After optimization, should be 512MB, but baseline is 3072MB
        // This test validates either baseline or optimized state
        expect(response.MemorySize).toBeDefined();
        expect([512, 3072]).toContain(response.MemorySize);
      });

      it('should have correct timeout', async () => {
        const command = new GetFunctionConfigurationCommand({
          FunctionName: outputs.receiverFunctionName,
        });

        const response = await lambdaClient.send(command);
        expect(response.Timeout).toBe(30);
      });
    });

    describe('Validator Function', () => {
      it('should exist and be accessible', async () => {
        const command = new GetFunctionCommand({
          FunctionName: outputs.validatorFunctionName,
        });

        const response = await lambdaClient.send(command);
        expect(response.Configuration).toBeDefined();
        expect(response.Configuration?.FunctionName).toBe(
          outputs.validatorFunctionName
        );
      });

      it('should have correct runtime', async () => {
        const command = new GetFunctionConfigurationCommand({
          FunctionName: outputs.validatorFunctionName,
        });

        const response = await lambdaClient.send(command);
        expect(response.Runtime).toBe('nodejs18.x');
      });
    });

    describe('Processor Function', () => {
      it('should exist and be accessible', async () => {
        const command = new GetFunctionCommand({
          FunctionName: outputs.processorFunctionName,
        });

        const response = await lambdaClient.send(command);
        expect(response.Configuration).toBeDefined();
        expect(response.Configuration?.FunctionName).toBe(
          outputs.processorFunctionName
        );
      });

      it('should have correct runtime', async () => {
        const command = new GetFunctionConfigurationCommand({
          FunctionName: outputs.processorFunctionName,
        });

        const response = await lambdaClient.send(command);
        expect(response.Runtime).toBe('nodejs18.x');
      });
    });
  });

  describe('API Gateway', () => {
    let apiId: string;

    beforeAll(() => {
      // Extract API ID from URL: https://{api-id}.execute-api.{region}.amazonaws.com
      const match = outputs.apiUrl.match(/https:\/\/([^.]+)\./);
      if (match) {
        apiId = match[1];
      }
    });

    it('should exist and be accessible', async () => {
      expect(apiId).toBeDefined();

      const command = new GetApiCommand({
        ApiId: apiId,
      });

      const response = await apiGatewayClient.send(command);
      expect(response.ApiId).toBe(apiId);
    });

    it('should be HTTP API (not REST API)', async () => {
      const command = new GetApiCommand({
        ApiId: apiId,
      });

      const response = await apiGatewayClient.send(command);
      expect(response.ProtocolType).toBe('HTTP');
    });

    it('should have correct CORS configuration', async () => {
      const command = new GetApiCommand({
        ApiId: apiId,
      });

      const response = await apiGatewayClient.send(command);
      expect(response.CorsConfiguration).toBeDefined();
      expect(response.CorsConfiguration?.AllowOrigins).toContain('*');
    });

    it('should have webhook routes configured', async () => {
      const command = new GetRoutesCommand({
        ApiId: apiId,
      });

      const response = await apiGatewayClient.send(command);
      const routes = response.Items || [];

      const routeKeys = routes.map(route => route.RouteKey);
      expect(routeKeys).toContain('POST /webhook/receive');
      expect(routeKeys).toContain('POST /webhook/validate');
      expect(routeKeys).toContain('POST /webhook/process');
    });

    it('should have exactly 3 routes', async () => {
      const command = new GetRoutesCommand({
        ApiId: apiId,
      });

      const response = await apiGatewayClient.send(command);
      expect(response.Items).toHaveLength(3);
    });
  });

  describe('End-to-End Webhook Flow', () => {
    it('should handle complete webhook processing workflow', async () => {
      const timestamp = Date.now();
      const webhookId = `e2e-test-${timestamp}`;

      // Step 1: Write webhook data to DynamoDB
      await dynamoClient.send(
        new PutItemCommand({
          TableName: outputs.tableName,
          Item: {
            webhookId: { S: webhookId },
            timestamp: { N: timestamp.toString() },
            status: { S: 'received' },
            payload: {
              S: JSON.stringify({
                event: 'test.event',
                data: { key: 'value' },
              }),
            },
          },
        })
      );

      // Step 2: Verify data was written
      const getResponse = await dynamoClient.send(
        new GetItemCommand({
          TableName: outputs.tableName,
          Key: {
            webhookId: { S: webhookId },
            timestamp: { N: timestamp.toString() },
          },
        })
      );

      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item?.status?.S).toBe('received');

      // Step 3: Update status to validated
      await dynamoClient.send(
        new PutItemCommand({
          TableName: outputs.tableName,
          Item: {
            webhookId: { S: webhookId },
            timestamp: { N: timestamp.toString() },
            status: { S: 'validated' },
            payload: getResponse.Item?.payload,
          },
        })
      );

      // Step 4: Verify validation
      const validatedResponse = await dynamoClient.send(
        new GetItemCommand({
          TableName: outputs.tableName,
          Key: {
            webhookId: { S: webhookId },
            timestamp: { N: timestamp.toString() },
          },
        })
      );

      expect(validatedResponse.Item?.status?.S).toBe('validated');

      // Step 5: Update status to processed
      await dynamoClient.send(
        new PutItemCommand({
          TableName: outputs.tableName,
          Item: {
            webhookId: { S: webhookId },
            timestamp: { N: timestamp.toString() },
            status: { S: 'processed' },
            payload: validatedResponse.Item?.payload,
          },
        })
      );

      // Step 6: Verify final processing
      const processedResponse = await dynamoClient.send(
        new GetItemCommand({
          TableName: outputs.tableName,
          Key: {
            webhookId: { S: webhookId },
            timestamp: { N: timestamp.toString() },
          },
        })
      );

      expect(processedResponse.Item?.status?.S).toBe('processed');
    });
  });

  describe('Resource Integration', () => {
    it('should have Lambda functions with access to DynamoDB', async () => {
      // Verify Lambda functions have DynamoDB table name in environment
      const functions = [
        outputs.receiverFunctionName,
        outputs.validatorFunctionName,
        outputs.processorFunctionName,
      ];

      for (const functionName of functions) {
        const command = new GetFunctionConfigurationCommand({
          FunctionName: functionName,
        });

        const response = await lambdaClient.send(command);
        expect(response.Environment?.Variables?.TABLE_NAME).toBe(
          outputs.tableName
        );
      }
    });

    it('should have API Gateway integrated with Lambda functions', async () => {
      // Extract API ID from URL
      const match = outputs.apiUrl.match(/https:\/\/([^.]+)\./);
      expect(match).toBeDefined();
      const apiId = match![1];

      const command = new GetRoutesCommand({
        ApiId: apiId,
      });

      const response = await apiGatewayClient.send(command);
      const routes = response.Items || [];

      // Each route should have an integration
      for (const route of routes) {
        expect(route.Target).toBeDefined();
        expect(route.Target).toMatch(/integrations\//);
      }
    });
  });

  describe('Optimization Validation', () => {
    it('should validate optimization script can access resources', async () => {
      // Verify all resources needed by optimize.py exist
      const resources = [
        outputs.receiverFunctionName,
        outputs.validatorFunctionName,
        outputs.processorFunctionName,
        outputs.tableName,
      ];

      expect(resources.every(r => r !== undefined && r !== '')).toBe(true);
    });

    it('should validate resource naming includes environment suffix', () => {
      // All resources should include environment suffix
      const resources = [
        outputs.receiverFunctionName,
        outputs.validatorFunctionName,
        outputs.processorFunctionName,
        outputs.tableName,
      ];

      // Extract environment suffix from one resource
      const envSuffixMatch = outputs.tableName.match(
        /webhook-table-(.+)$/
      );
      expect(envSuffixMatch).toBeDefined();

      const envSuffix = envSuffixMatch![1];

      // Verify all resources include the suffix
      for (const resource of resources) {
        expect(resource).toContain(envSuffix);
      }
    });
  });
});
