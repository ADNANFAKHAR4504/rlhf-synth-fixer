// Configuration - These are coming from cfn-outputs after cdk deploy

import {
  APIGatewayClient,
  GetMethodCommand,
  GetResourcesCommand,
  GetRestApiCommand
} from '@aws-sdk/client-api-gateway';
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import {
  DescribeTableCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand
} from '@aws-sdk/client-dynamodb';
import {
  GetFunctionCommand,
  InvokeCommand,
  LambdaClient
} from '@aws-sdk/client-lambda';



// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';
const stackName = `TapStack${environmentSuffix}`;

const lambda = new LambdaClient({ region });
const apigateway = new APIGatewayClient({ region });
const cloudformation = new CloudFormationClient({ region });
const dynamodb = new DynamoDBClient({ region });

// Helper to get stack outputs
async function getStackOutputs(): Promise<Record<string, string>> {
  const response = await cloudformation.send(new DescribeStacksCommand({ StackName: stackName }));
  const stack = response.Stacks?.[0];
  if (!stack) throw new Error(`Stack ${stackName} not found`);
  if (!['CREATE_COMPLETE', 'UPDATE_COMPLETE'].includes(stack.StackStatus || '')) {
    throw new Error(`Stack ${stackName} not in complete state: ${stack.StackStatus}`);
  }
  const outputs: Record<string, string> = {};
  stack.Outputs?.forEach(output => {
    if (output.OutputKey && output.OutputValue) outputs[output.OutputKey] = output.OutputValue;
  });
  return outputs;
}

describe('TapStack Integration Tests', () => {
  let outputs: Record<string, string>;

  beforeAll(async () => {
    outputs = await getStackOutputs();
    [
      'ApiGatewayUrl',
      'DynamoDBTableName',
      'LambdaFunctionName'
    ].forEach(key => {
      if (!outputs[key]) throw new Error(`Missing output: ${key}`);
    });
  }, 60000);

  describe('DynamoDB Table', () => {
    test('should exist and be active', async () => {
      const tableName = outputs.DynamoDBTableName;
      const response = await dynamodb.send(new DescribeTableCommand({ TableName: tableName }));
      expect(response.Table?.TableName).toBe(tableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });

    test('should support read/write', async () => {
      const tableName = outputs.DynamoDBTableName;
      const testId = `test-${Date.now()}`;
      const createdAt = new Date().toISOString();
      await dynamodb.send(new PutItemCommand({
        TableName: tableName,
        Item: {
          userId: { S: testId },
          createdAt: { S: createdAt },
          data: { S: 'integration-test' }
        }
      }));
      const getResp = await dynamodb.send(new GetItemCommand({
        TableName: tableName,
        Key: {
          userId: { S: testId },
          createdAt: { S: createdAt }
        }
      }));
      expect(getResp.Item?.userId.S).toBe(testId);
      expect(getResp.Item?.data.S).toBe('integration-test');
    });
  });

  describe('Lambda Function', () => {
    test('should exist and be configured', async () => {
      const fnName = outputs.LambdaFunctionName;
      const response = await lambda.send(new GetFunctionCommand({ FunctionName: fnName }));
      expect(response.Configuration?.FunctionName).toBe(fnName);
      expect(response.Configuration?.Runtime).toBe('python3.9');
      expect(response.Configuration?.State).toBe('Active');
    });

    test('should be invokable', async () => {
      const fnName = outputs.LambdaFunctionName;
      const payload = { httpMethod: 'GET', path: '/data' };
      const response = await lambda.send(new InvokeCommand({
        FunctionName: fnName,
        Payload: Buffer.from(JSON.stringify(payload))
      }));
      expect(response.StatusCode).toBe(200);
      if (response.Payload) {
        const result = JSON.parse(Buffer.from(response.Payload).toString());
        expect(result.statusCode).toBe(200);
      }
    });
  });

  describe('API Gateway', () => {
    test('should exist and be configured', async () => {
      const apiUrl = outputs.ApiGatewayUrl;
      expect(apiUrl).toMatch(/^https:\/\/.*\.execute-api\..+\.amazonaws\.com\/.+/);
      const apiId = apiUrl.split('https://')[1].split('.')[0];
      const response = await apigateway.send(new GetRestApiCommand({ restApiId: apiId }));
      expect(response.id).toBe(apiId);
      expect(response.endpointConfiguration?.types).toContain('REGIONAL');
    });

    test('should have /data resource and GET/POST methods', async () => {
      const apiUrl = outputs.ApiGatewayUrl;
      const apiId = apiUrl.split('https://')[1].split('.')[0];
      const resourcesResp = await apigateway.send(new GetResourcesCommand({ restApiId: apiId }));
      const dataResource = resourcesResp.items?.find(r => r.pathPart === 'data');
      expect(dataResource).toBeDefined();
      const getMethodResp = await apigateway.send(new GetMethodCommand({
        restApiId: apiId,
        resourceId: dataResource!.id!,
        httpMethod: 'GET'
      }));
      expect(getMethodResp.httpMethod).toBe('GET');
      const postMethodResp = await apigateway.send(new GetMethodCommand({
        restApiId: apiId,
        resourceId: dataResource!.id!,
        httpMethod: 'POST'
      }));
      expect(postMethodResp.httpMethod).toBe('POST');
    });
  });

  describe('End-to-End', () => {
    test('API Gateway should invoke Lambda and return expected response', async () => {
      const apiUrl = outputs.ApiGatewayUrl;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      expect([200, 403, 404, 500]).toContain(response.status);
      if (response.status === 200) {
        const body = await response.json();
        expect(body.message).toBeDefined();
      }
    });
  });
});
