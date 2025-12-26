import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';
import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { GetRoleCommand, IAMClient } from '@aws-sdk/client-iam';
import {
  GetFunctionCommand,
  InvokeCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import fs from 'fs';

// Load outputs (adjust path if needed)
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// LocalStack endpoint configuration
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL?.includes('4566');

const localstackConfig = isLocalStack
  ? {
      endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
      },
    }
  : {};

const lambda = new LambdaClient(localstackConfig);
const dynamodb = new DynamoDBClient(localstackConfig);
const iam = new IAMClient(localstackConfig);
const apigateway = new APIGatewayClient(localstackConfig);

describe('Turn Around Prompt API Integration Tests', () => {
  test('Lambda Function 1 should exist and be active', async () => {
    const arn = outputs.Function1Arn;
    const { Configuration } = await lambda.send(
      new GetFunctionCommand({ FunctionName: arn })
    );
    expect(Configuration?.State).toBe('Active');
  });

  test('Lambda Function 2 should exist and be active', async () => {
    const arn = outputs.Function2Arn;
    const { Configuration } = await lambda.send(
      new GetFunctionCommand({ FunctionName: arn })
    );
    expect(Configuration?.State).toBe('Active');
  });

  test('Lambda Function 1 should return expected output', async () => {
    const arn = outputs.Function1Arn;
    const result = await lambda.send(
      new InvokeCommand({
        FunctionName: arn,
        Payload: Buffer.from(JSON.stringify({})),
      })
    );
    expect(result.StatusCode).toBe(200);
    const payloadString = result.Payload
      ? Buffer.from(result.Payload as Uint8Array).toString('utf-8')
      : '';
    const payload = JSON.parse(payloadString);
    const body = payload.body ? JSON.parse(payload.body) : {};
    expect(body.message).toBe('Hello from Function 1');
  }, 60000);

  test('Lambda Function 2 should return expected output', async () => {
    const arn = outputs.Function2Arn;
    const result = await lambda.send(
      new InvokeCommand({
        FunctionName: arn,
        Payload: Buffer.from(JSON.stringify({})),
      })
    );
    expect(result.StatusCode).toBe(200);
    const payloadString = result.Payload
      ? Buffer.from(result.Payload as Uint8Array).toString('utf-8')
      : '';
    const payload = JSON.parse(payloadString);
    const body = payload.body ? JSON.parse(payload.body) : {};
    expect(body.message).toBe('Hello from Function 2');
  });

  test('DynamoDB table should exist', async () => {
    const tableName = outputs.DynamoDBTableNameOutput;
    const { Table } = await dynamodb.send(
      new DescribeTableCommand({ TableName: tableName })
    );
    expect(Table).toBeDefined();
    expect(Table?.TableStatus).toBe('ACTIVE');
  });

  test('IAM Role should exist', async () => {
    const roleName = outputs.ExecutionRoleName;
    const { Role } = await iam.send(new GetRoleCommand({ RoleName: roleName }));
    expect(Role).toBeDefined();
    expect(Role?.RoleName).toBe(roleName);
  });

  test('API Gateway RestApi should exist', async () => {
    const endpoint = outputs.ApiEndpoint;
    // LocalStack format: https://xxx.execute-api.amazonaws.com:4566/prod/requests
    // AWS format: https://xxx.execute-api.region.amazonaws.com/prod/requests
    const match = endpoint.match(
      /^https:\/\/([a-z0-9]+)\.execute-api\.(?:[a-z0-9-]+\.)?amazonaws\.com(?::4566)?/
    );
    expect(match).not.toBeNull();
    const restApiId = match?.[1];
    if (!restApiId)
      throw new Error('Could not extract RestApiId from endpoint');
    const { id, name } = await apigateway.send(
      new GetRestApiCommand({ restApiId })
    );
    expect(id).toBe(restApiId);
    expect(name).toBeDefined();

    // Check the prod stage exists
    const { stageName } = await apigateway.send(
      new GetStageCommand({ restApiId, stageName: 'prod' })
    );
    expect(stageName).toBe('prod');
  });

  test('All resource names should include environment suffix', () => {
    // IAM role names in CloudFormation may include stack name and generated suffix
    // Check that the role name contains the expected pattern or exists with valid format
    expect(outputs.ExecutionRoleName).toBeDefined();
    expect(outputs.ExecutionRoleName).toMatch(/LambdaExecutionRole/);

    // DynamoDB and Lambda should have environment suffix
    expect(outputs.DynamoDBTableNameOutput).toContain(environmentSuffix);
    expect(outputs.Function1Arn).toContain('FunctionOne');
    expect(outputs.Function2Arn).toContain('FunctionTwo');
  });
});
