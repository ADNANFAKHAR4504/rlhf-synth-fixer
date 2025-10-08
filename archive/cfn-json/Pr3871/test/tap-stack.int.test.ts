// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  DynamoDBClient,
  GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  ApiGatewayV2Client,
  GetApiCommand,
} from '@aws-sdk/client-apigatewayv2';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get AWS region from environment variable
const region = process.env.AWS_REGION || 'us-west-2';

// Initialize AWS clients
const lambdaClient = new LambdaClient({ region });
const dynamoDbClient = new DynamoDBClient({ region });
const apiGatewayClient = new ApiGatewayV2Client({ region });

describe('Serverless Infrastructure Integration Tests', () => {
  const lambdaFunctionName = outputs.LambdaFunctionName;
  const dynamoDbTableName = outputs.DynamoDBTableName;
  const apiId = outputs.ApiEndpoint.split('/')[2].split('.')[0];

  describe('Lambda and DynamoDB Integration', () => {
    test('Lambda function should successfully write data to DynamoDB table', async () => {
      // Invoke Lambda function with test payload
      const invokeCommand = new InvokeCommand({
        FunctionName: lambdaFunctionName,
        Payload: JSON.stringify({
          body: JSON.stringify({
            testData: 'integration-test-data',
            timestamp: new Date().toISOString(),
          }),
        }),
      });

      const invokeResponse = await lambdaClient.send(invokeCommand);
      expect(invokeResponse.StatusCode).toBe(200);

      const responsePayload = JSON.parse(
        new TextDecoder().decode(invokeResponse.Payload)
      );
      expect(responsePayload.statusCode).toBe(200);

      const body = JSON.parse(responsePayload.body);
      expect(body.requestId).toBeDefined();
      expect(body.message).toBe('Request processed successfully');

      // Verify data was written to DynamoDB
      const requestId = body.requestId;
      const timestamp = body.timestamp;

      const getItemCommand = new GetItemCommand({
        TableName: dynamoDbTableName,
        Key: {
          RequestId: { S: requestId },
          Timestamp: { S: timestamp },
        },
      });

      const getItemResponse = await dynamoDbClient.send(getItemCommand);
      expect(getItemResponse.Item).toBeDefined();
      expect(getItemResponse.Item?.RequestId.S).toBe(requestId);
      expect(getItemResponse.Item?.Timestamp.S).toBe(timestamp);
      expect(getItemResponse.Item?.Source.S).toBeDefined();
    }, 30000);

    test('Lambda function should handle scheduled CloudWatch Events and store in DynamoDB', async () => {
      // Invoke Lambda with CloudWatch Events payload format
      const scheduledEventPayload = {
        'detail-type': 'Scheduled Event',
        source: 'aws.events',
        time: new Date().toISOString(),
        detail: {},
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: lambdaFunctionName,
        Payload: JSON.stringify(scheduledEventPayload),
      });

      const invokeResponse = await lambdaClient.send(invokeCommand);
      expect(invokeResponse.StatusCode).toBe(200);

      const responsePayload = JSON.parse(
        new TextDecoder().decode(invokeResponse.Payload)
      );
      expect(responsePayload.statusCode).toBe(200);

      const body = JSON.parse(responsePayload.body);
      const requestId = body.requestId;
      const timestamp = body.timestamp;

      // Verify scheduled event data in DynamoDB using GetItem (composite key)
      const getItemCommand = new GetItemCommand({
        TableName: dynamoDbTableName,
        Key: {
          RequestId: { S: requestId },
          Timestamp: { S: timestamp },
        },
      });

      const getItemResponse = await dynamoDbClient.send(getItemCommand);
      expect(getItemResponse.Item).toBeDefined();
      expect(getItemResponse.Item!.RequestId.S).toBe(requestId);
      expect(getItemResponse.Item!.Source.S).toBe(
        'CloudWatch Scheduled Event'
      );
      expect(getItemResponse.Item!.Method.S).toBe('SCHEDULED');
    }, 30000);
  });

  describe('API Gateway and Lambda Integration', () => {
    test('API Gateway should successfully invoke Lambda function', async () => {
      // Get API Gateway configuration
      const getApiCommand = new GetApiCommand({
        ApiId: apiId,
      });

      const apiResponse = await apiGatewayClient.send(getApiCommand);
      expect(apiResponse.Name).toContain('http-api');
      expect(apiResponse.ProtocolType).toBe('HTTP');

      // Verify Lambda function can be invoked (simulating API Gateway invoke)
      const testPayload = {
        requestContext: {
          http: {
            method: 'POST',
            path: '/test',
          },
        },
        body: JSON.stringify({
          message: 'API Gateway integration test',
        }),
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: lambdaFunctionName,
        Payload: JSON.stringify(testPayload),
      });

      const invokeResponse = await lambdaClient.send(invokeCommand);
      expect(invokeResponse.StatusCode).toBe(200);

      const responsePayload = JSON.parse(
        new TextDecoder().decode(invokeResponse.Payload)
      );
      expect(responsePayload.statusCode).toBe(200);
      expect(responsePayload.headers).toBeDefined();
      expect(responsePayload.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(responsePayload.headers['Content-Type']).toBe(
        'application/json'
      );
    }, 30000);

    test('Lambda function should return proper CORS headers for API Gateway requests', async () => {
      const corsTestPayload = {
        requestContext: {
          http: {
            method: 'OPTIONS',
            path: '/test',
          },
        },
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: lambdaFunctionName,
        Payload: JSON.stringify(corsTestPayload),
      });

      const invokeResponse = await lambdaClient.send(invokeCommand);
      const responsePayload = JSON.parse(
        new TextDecoder().decode(invokeResponse.Payload)
      );

      expect(responsePayload.headers).toBeDefined();
      expect(responsePayload.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(responsePayload.headers['Access-Control-Allow-Methods']).toContain(
        'OPTIONS'
      );
      expect(responsePayload.headers['Access-Control-Allow-Headers']).toContain(
        'Content-Type'
      );
    }, 30000);
  });

  describe('Lambda Function Configuration Validation', () => {
    test('Lambda function should have correct runtime and configuration', async () => {
      const getFunctionCommand = new GetFunctionCommand({
        FunctionName: lambdaFunctionName,
      });

      const functionResponse = await lambdaClient.send(getFunctionCommand);
      expect(functionResponse.Configuration).toBeDefined();
      expect(functionResponse.Configuration!.Runtime).toBe('python3.13');
      expect(functionResponse.Configuration!.Timeout).toBe(30);
      expect(functionResponse.Configuration!.MemorySize).toBe(256);
      expect(functionResponse.Configuration!.Environment).toBeDefined();
      expect(
        functionResponse.Configuration!.Environment!.Variables!.DYNAMODB_TABLE_NAME
      ).toBe(dynamoDbTableName);
    }, 30000);

    test('Lambda function should have Dead Letter Queue configured', async () => {
      const getFunctionCommand = new GetFunctionCommand({
        FunctionName: lambdaFunctionName,
      });

      const functionResponse = await lambdaClient.send(getFunctionCommand);
      expect(functionResponse.Configuration!.DeadLetterConfig).toBeDefined();
      expect(
        functionResponse.Configuration!.DeadLetterConfig!.TargetArn
      ).toContain('sqs');
      expect(
        functionResponse.Configuration!.DeadLetterConfig!.TargetArn
      ).toContain('dlq');
    }, 30000);
  });
});
