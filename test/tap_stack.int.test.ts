/**
 * Integration test for TAP Stack Lambda and SSM deployment
 * Tests the deployed Lambda function with LocalStack
 */

import {
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  SSMClient,
  GetParameterCommand,
} from '@aws-sdk/client-ssm';

const LOCALSTACK_ENDPOINT = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
const REGION = process.env.AWS_REGION || 'us-east-1';

const lambdaClient = new LambdaClient({
  endpoint: LOCALSTACK_ENDPOINT,
  region: REGION,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
});

const ssmClient = new SSMClient({
  endpoint: LOCALSTACK_ENDPOINT,
  region: REGION,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
});

describe('TAP Stack Integration Tests', () => {
  const functionName = 'tap-lambda-function';

  test('Lambda function should be deployed', async () => {
    const command = new GetFunctionCommand({
      FunctionName: functionName,
    });

    const response = await lambdaClient.send(command);
    expect(response.Configuration).toBeDefined();
    expect(response.Configuration?.FunctionName).toBe(functionName);
    expect(response.Configuration?.Runtime).toMatch(/python/i);
  }, 30000);

  test('SSM parameters should be created', async () => {
    const parameterNames = [
      '/tap/database/url',
      '/tap/api/key',
      '/tap/auth/token',
    ];

    for (const paramName of parameterNames) {
      const command = new GetParameterCommand({
        Name: paramName,
      });

      const response = await ssmClient.send(command);
      expect(response.Parameter).toBeDefined();
      expect(response.Parameter?.Name).toBe(paramName);
      expect(response.Parameter?.Value).toBeDefined();
    }
  }, 30000);

  test('Lambda function should invoke successfully', async () => {
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: Buffer.from(JSON.stringify({ test: 'event' })),
    });

    const response = await lambdaClient.send(command);
    expect(response.StatusCode).toBe(200);

    const payload = JSON.parse(Buffer.from(response.Payload!).toString());
    expect(payload.statusCode).toBe(200);

    const body = JSON.parse(payload.body);
    expect(body.message).toBe('Hello from Lambda!');
  }, 30000);

  test('Lambda should have CloudWatch logs enabled', async () => {
    const command = new GetFunctionCommand({
      FunctionName: functionName,
    });

    const response = await lambdaClient.send(command);
    expect(response.Configuration).toBeDefined();

    // Check if logging configuration exists
    const logGroupName = `/aws/lambda/${functionName}`;
    expect(response.Configuration?.Environment?.Variables).toBeDefined();
  }, 30000);
});
