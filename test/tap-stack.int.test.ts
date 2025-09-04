import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { DescribeTableCommand, DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { GetFunctionCommand, InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get AWS region from file
const awsRegion = fs.readFileSync('lib/AWS_REGION', 'utf8').trim();

// AWS SDK clients
const dynamodbClient = new DynamoDBClient({ region: awsRegion });
const lambdaClient = new LambdaClient({ region: awsRegion });
const cloudwatchClient = new CloudWatchClient({ region: awsRegion });

// Test configuration from stack outputs
const apiGatewayUrl = outputs.ApiGatewayUrl;
const dynamoTableName = outputs.DynamoDBTableName;
const apiLambdaFunctionName = outputs.ApiLambdaFunctionName;
const streamProcessorFunctionName = outputs.StreamProcessorFunctionName;

test('DynamoDB table exists and has correct configuration', async () => {
  const command = new DescribeTableCommand({
    TableName: dynamoTableName,
  });

  const response = await dynamodbClient.send(command);

  expect(response.Table).toBeDefined();
  expect(response.Table?.TableName).toBe(dynamoTableName);
  expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
  expect(response.Table?.StreamSpecification?.StreamEnabled).toBe(true);
  expect(response.Table?.StreamSpecification?.StreamViewType).toBe('NEW_AND_OLD_IMAGES');

  // Check key schema
  const keySchema = response.Table?.KeySchema;
  expect(keySchema).toHaveLength(2);
  expect(keySchema?.[0]).toEqual({
    AttributeName: 'id',
    KeyType: 'HASH',
  });
  expect(keySchema?.[1]).toEqual({
    AttributeName: 'createdAt',
    KeyType: 'RANGE',
  });

  // Point-in-time recovery is enabled via CloudFormation but not returned in DescribeTable
});

test('can read from empty DynamoDB table', async () => {
  const command = new ScanCommand({
    TableName: dynamoTableName,
    Limit: 10,
  });

  const response = await dynamodbClient.send(command);
  expect(response.Items).toBeDefined();
  expect(Array.isArray(response.Items)).toBe(true);
});

test('API Lambda function exists and has correct configuration', async () => {
  const command = new GetFunctionCommand({
    FunctionName: apiLambdaFunctionName,
  });

  const response = await lambdaClient.send(command);

  expect(response.Configuration).toBeDefined();
  expect(response.Configuration?.FunctionName).toBe(apiLambdaFunctionName);
  expect(response.Configuration?.Runtime).toBe('nodejs18.x');
  expect(response.Configuration?.Handler).toBe('index.handler');
  expect(response.Configuration?.MemorySize).toBe(128);
  expect(response.Configuration?.Timeout).toBe(10);
  expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');

  // Check environment variables
  const env = response.Configuration?.Environment?.Variables;
  expect(env?.TABLE_NAME).toBe(dynamoTableName);
  expect(env?.ENVIRONMENT).toBe(environmentSuffix);
});

test('Stream Processor Lambda function exists and has correct configuration', async () => {
  const command = new GetFunctionCommand({
    FunctionName: streamProcessorFunctionName,
  });

  const response = await lambdaClient.send(command);

  expect(response.Configuration).toBeDefined();
  expect(response.Configuration?.FunctionName).toBe(streamProcessorFunctionName);
  expect(response.Configuration?.Runtime).toBe('nodejs18.x');
  expect(response.Configuration?.Handler).toBe('index.handler');
  expect(response.Configuration?.MemorySize).toBe(128);
  expect(response.Configuration?.Timeout).toBe(10);
  expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
});

test('API Lambda function can be invoked directly', async () => {
  const testEvent = {
    httpMethod: 'GET',
    pathParameters: null,
    body: null,
  };

  const command = new InvokeCommand({
    FunctionName: apiLambdaFunctionName,
    Payload: Buffer.from(JSON.stringify(testEvent)),
  });

  const response = await lambdaClient.send(command);

  expect(response.StatusCode).toBe(200);
  expect(response.Payload).toBeDefined();

  if (response.Payload) {
    const result = JSON.parse(Buffer.from(response.Payload).toString());
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual([]);
  }
});

test('API Gateway endpoint is accessible', async () => {
  const response = await fetch(`${apiGatewayUrl}items`);

  expect(response).toBeDefined();
  expect(response.status).toBe(200);

  const data = await response.json();
  expect(Array.isArray(data)).toBe(true);
});

test('CRUD operations through API Gateway', async () => {
  const testItem = {
    data: 'Test integration item',
    category: 'integration-test',
  };

  // CREATE - POST /items
  const createResponse = await fetch(`${apiGatewayUrl}items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(testItem),
  });

  expect(createResponse.status).toBe(201);
  const createdItem = await createResponse.json() as any;
  expect(createdItem.id).toBeDefined();
  expect(createdItem.createdAt).toBeDefined();
  expect(createdItem.data).toBe(testItem.data);

  // READ - GET /items/{id}/{createdAt}
  const readResponse = await fetch(
    `${apiGatewayUrl}items/${createdItem.id}/${createdItem.createdAt}`
  );

  expect(readResponse.status).toBe(200);
  const readItem = await readResponse.json() as any;
  expect(readItem.id).toBe(createdItem.id);
  expect(readItem.data).toBe(testItem.data);

  // UPDATE - PUT /items/{id}/{createdAt}
  const updatedData = { data: 'Updated test data', createdAt: createdItem.createdAt };
  const updateResponse = await fetch(
    `${apiGatewayUrl}items/${createdItem.id}/${createdItem.createdAt}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    }
  );

  expect(updateResponse.status).toBe(200);
  const updatedItem = await updateResponse.json() as any;
  expect(updatedItem.data).toBe(updatedData.data);

  // DELETE - DELETE /items/{id}/{createdAt}
  const deleteResponse = await fetch(
    `${apiGatewayUrl}items/${createdItem.id}/${createdItem.createdAt}`,
    {
      method: 'DELETE',
    }
  );

  expect(deleteResponse.status).toBe(204);

  // Verify item is deleted
  const verifyResponse = await fetch(
    `${apiGatewayUrl}items/${createdItem.id}/${createdItem.createdAt}`
  );
  expect(verifyResponse.status).toBe(404);
});

test('CORS headers are present', async () => {
  const response = await fetch(`${apiGatewayUrl}items`, {
    method: 'OPTIONS',
  });

  expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://localhost:3000');
  expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  expect(response.headers.get('Access-Control-Allow-Methods')).toContain('PUT');
  expect(response.headers.get('Access-Control-Allow-Methods')).toContain('DELETE');
});

test('CloudWatch alarms exist and are configured', async () => {
  const alarmNames = [
    `tap-api-lambda-errors-${environmentSuffix}`,
    `tap-stream-processor-errors-${environmentSuffix}`,
    `tap-api-gateway-4xx-errors-${environmentSuffix}`,
    `tap-api-gateway-5xx-errors-${environmentSuffix}`,
  ];

  for (const alarmName of alarmNames) {
    const command = new DescribeAlarmsCommand({
      AlarmNames: [alarmName],
    });

    const response = await cloudwatchClient.send(command);
    expect(response.MetricAlarms).toHaveLength(1);

    const alarm = response.MetricAlarms?.[0];
    expect(alarm?.AlarmName).toBe(alarmName);
    expect(alarm?.StateValue).toBeDefined();
  }
});

test('handles invalid HTTP methods', async () => {
  const response = await fetch(`${apiGatewayUrl}items`, {
    method: 'PATCH',
  });

  // API Gateway returns 403 for unsupported methods
  expect(response.status).toBe(403);
  const errorData = await response.json() as any;
  expect(errorData.message).toBeDefined(); // API Gateway error structure
});

test('handles invalid JSON in request body', async () => {
  const response = await fetch(`${apiGatewayUrl}items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: 'invalid json',
  });

  expect(response.status).toBe(500);
  const errorData = await response.json() as any;
  expect(errorData.error).toBe('Internal server error');
});

test('handles non-existent item retrieval', async () => {
  const response = await fetch(
    `${apiGatewayUrl}items/non-existent-id/1234567890`
  );

  expect(response.status).toBe(404);
  const errorData = await response.json() as any;
  expect(errorData.error).toBe('Item not found');
});

test('API response time is acceptable', async () => {
  const startTime = Date.now();

  const response = await fetch(`${apiGatewayUrl}items`);

  const endTime = Date.now();
  const responseTime = endTime - startTime;

  expect(response.status).toBe(200);
  expect(responseTime).toBeLessThan(5000); // 5 seconds max
});

test('can handle multiple concurrent requests', async () => {
  const promises = Array.from({ length: 5 }, () =>
    fetch(`${apiGatewayUrl}items`)
  );

  const responses = await Promise.all(promises);

  responses.forEach((response) => {
    expect(response.status).toBe(200);
  });
});
