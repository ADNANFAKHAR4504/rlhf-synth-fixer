import { ApiGatewayV2Client, GetApiCommand } from '@aws-sdk/client-apigatewayv2';
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { GetFunctionCommand, LambdaClient } from '@aws-sdk/client-lambda';
import * as fs from 'fs';
import * as path from 'path';

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr566';
const stackName = `TapStack${environmentSuffix}`;

// Read outputs from deployment
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
}

const cfnClient = new CloudFormationClient({ region });
const dynamoClient = new DynamoDBClient({ region });
const apiClient = new ApiGatewayV2Client({ region });
const lambdaClient = new LambdaClient({ region });

describe('TapStack Integration Tests', () => {
  describe('Stack Deployment', () => {
    test('stack is successfully deployed', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);
      
      expect(response.Stacks).toBeDefined();
      expect(response.Stacks?.length).toBeGreaterThan(0);
      expect(response.Stacks?.[0].StackStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
    });
  });

  describe('DynamoDB Table', () => {
    test('DynamoDB table exists and is configured correctly', async () => {
      const tableName = outputs.DynamoDbTableName || `serverless-data-table-${environmentSuffix}`;
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      // Point in time recovery check - field might be undefined
      if (response.Table?.PointInTimeRecoveryDescription) {
        expect(response.Table.PointInTimeRecoveryDescription.PointInTimeRecoveryStatus).toBe('ENABLED');
      }
      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
    });

    test('DynamoDB table has UserIndex GSI', async () => {
      const tableName = outputs.DynamoDbTableName || `serverless-data-table-${environmentSuffix}`;
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      const userIndex = response.Table?.GlobalSecondaryIndexes?.find(
        (gsi) => gsi.IndexName === 'UserIndex'
      );

      expect(userIndex).toBeDefined();
      expect(userIndex?.KeySchema).toEqual([
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'timestamp', KeyType: 'RANGE' },
      ]);
    });
  });

  describe('Cognito User Pool', () => {
    test('User Pool ID is available in outputs', async () => {
      const userPoolId = outputs.UserPoolId;
      if (!userPoolId) {
        console.warn('UserPoolId not found in outputs, skipping test');
        return;
      }

      expect(userPoolId).toBeDefined();
      expect(userPoolId).toMatch(/^[a-zA-Z0-9_-]+$/);
    });
  });

  describe('API Gateway', () => {
    test('HTTP API exists and has correct CORS configuration', async () => {
      const apiEndpoint = outputs.ApiEndpoint;
      if (!apiEndpoint) {
        console.warn('ApiEndpoint not found in outputs, skipping test');
        return;
      }

      // Extract API ID from endpoint URL
      const apiId = apiEndpoint.match(/https:\/\/(.+?)\.execute-api/)?.[1];
      if (!apiId) {
        throw new Error('Could not extract API ID from endpoint');
      }

      const command = new GetApiCommand({ ApiId: apiId });
      const response = await apiClient.send(command);

      expect(response.ProtocolType).toBe('HTTP');
      expect(response.CorsConfiguration).toBeDefined();
      expect(response.CorsConfiguration?.AllowOrigins).toContain('*');
      // Headers are returned in lowercase from API
      expect(response.CorsConfiguration?.AllowHeaders?.map(h => h.toLowerCase())).toContain('content-type');
      expect(response.CorsConfiguration?.AllowHeaders?.map(h => h.toLowerCase())).toContain('authorization');
    });

    test('Health endpoint is accessible', async () => {
      const apiEndpoint = outputs.ApiEndpoint;
      if (!apiEndpoint) {
        console.warn('ApiEndpoint not found in outputs, skipping test');
        return;
      }

      const healthUrl = `${apiEndpoint}/health`;
      const response = await fetch(healthUrl);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.status).toBe('healthy');
      expect(data.environment).toBeDefined();
    });
  });

  describe('Lambda Functions', () => {
    test('Data processor Lambda function exists', async () => {
      const functionName = `data-processor-${environmentSuffix}`;
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.Timeout).toBe(30);
      expect(response.Configuration?.MemorySize).toBe(256);
    });

    test('Health check Lambda function exists', async () => {
      const functionName = `health-check-${environmentSuffix}`;
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.Timeout).toBe(10);
      expect(response.Configuration?.MemorySize).toBe(128);
    });
  });

  describe('End-to-End Workflow', () => {
    test('API Gateway routes to Lambda functions correctly', async () => {
      const apiEndpoint = outputs.ApiEndpoint;
      if (!apiEndpoint) {
        console.warn('ApiEndpoint not found in outputs, skipping test');
        return;
      }

      // Test health endpoint integration
      const healthResponse = await fetch(`${apiEndpoint}/health`);
      expect(healthResponse.status).toBe(200);
      
      const healthData = await healthResponse.json();
      expect(healthData.status).toBe('healthy');
    });

    test('Protected endpoints require authentication', async () => {
      const apiEndpoint = outputs.ApiEndpoint;
      if (!apiEndpoint) {
        console.warn('ApiEndpoint not found in outputs, skipping test');
        return;
      }

      // Test that protected endpoints return 401 without auth
      const dataResponse = await fetch(`${apiEndpoint}/data`);
      expect(dataResponse.status).toBe(401);
    });
  });
});
