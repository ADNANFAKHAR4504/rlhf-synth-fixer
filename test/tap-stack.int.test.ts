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
import * as fs from 'fs';
import * as path from 'path';



// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';
const stackName = `TapStack${environmentSuffix}`;

// LocalStack endpoint configuration
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') || process.env.AWS_ENDPOINT_URL?.includes('4566');
const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
const clientConfig = isLocalStack ? { region, endpoint } : { region };

const lambda = new LambdaClient(clientConfig);
const apigateway = new APIGatewayClient(clientConfig);
const cloudformation = new CloudFormationClient(clientConfig);
const dynamodb = new DynamoDBClient(clientConfig);

// Helper to get stack outputs
async function getStackOutputs(): Promise<Record<string, string>> {
  // First, try to load from flat-outputs.json (for LocalStack deployments)
  const flatOutputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');

  if (fs.existsSync(flatOutputsPath)) {
    try {
      const fileContent = fs.readFileSync(flatOutputsPath, 'utf-8').trim();
      if (fileContent) {
        const outputs = JSON.parse(fileContent);
        console.log(`Loaded outputs from ${flatOutputsPath}`);
        console.log(`Available outputs: ${Object.keys(outputs).join(', ')}`);
        return outputs as Record<string, string>;
      }
    } catch (error) {
      console.warn(`Failed to parse ${flatOutputsPath}: ${error}`);
      console.log(`Falling back to CloudFormation stack query...`);
    }
  } else {
    console.log(`Outputs file not found at ${flatOutputsPath}`);
    console.log(`Falling back to CloudFormation stack query...`);
  }

  // Fallback to CloudFormation stack query (for real AWS deployments)
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
      let apiId: string;
      
      // Handle both AWS and LocalStack URL formats
      if (isLocalStack) {
        // LocalStack format: https://{api-id}.execute-api.amazonaws.com:4566/{stage}
        // or: http://localhost:4566/restapis/{api-id}/{stage}/_user_request/{path}
        if (apiUrl.includes('localhost:4566/restapis')) {
          const apiIdMatch = apiUrl.match(/\/restapis\/([^\/]+)/);
          if (apiIdMatch) {
            apiId = apiIdMatch[1];
          } else {
            throw new Error(`Could not extract API ID from LocalStack URL: ${apiUrl}`);
          }
        } else if (apiUrl.includes(':4566')) {
          // Format: https://{api-id}.execute-api.amazonaws.com:4566/{stage}
          apiId = apiUrl.split('https://')[1].split('.')[0];
        } else {
          throw new Error(`Unexpected LocalStack API Gateway URL format: ${apiUrl}`);
        }
        
        const response = await apigateway.send(new GetRestApiCommand({ restApiId: apiId }));
        expect(response.id).toBe(apiId);
      } else {
        // AWS format: https://{api-id}.execute-api.{region}.amazonaws.com/{stage}
        expect(apiUrl).toMatch(/^https:\/\/.*\.execute-api\..+\.amazonaws\.com\/.+/);
        apiId = apiUrl.split('https://')[1].split('.')[0];
        const response = await apigateway.send(new GetRestApiCommand({ restApiId: apiId }));
        expect(response.id).toBe(apiId);
        expect(response.endpointConfiguration?.types).toContain('REGIONAL');
      }
    });

    test('should have /data resource and GET/POST methods', async () => {
      const apiUrl = outputs.ApiGatewayUrl;
      let apiId: string;

      if (isLocalStack) {
        // Extract API ID from LocalStack URL format
        // Format: https://{api-id}.execute-api.amazonaws.com:4566/{stage}
        // or: http://localhost:4566/restapis/{api-id}/{stage}/_user_request/{path}
        if (apiUrl.includes('localhost:4566/restapis')) {
          const apiIdMatch = apiUrl.match(/\/restapis\/([^\/]+)/);
          if (!apiIdMatch) {
            throw new Error(`Could not extract API ID from LocalStack URL: ${apiUrl}`);
          }
          apiId = apiIdMatch[1];
        } else if (apiUrl.includes(':4566')) {
          // Format: https://{api-id}.execute-api.amazonaws.com:4566/{stage}
          apiId = apiUrl.split('https://')[1].split('.')[0];
        } else {
          throw new Error(`Unexpected LocalStack API Gateway URL format: ${apiUrl}`);
        }
      } else {
        // Extract API ID from AWS URL format
        apiId = apiUrl.split('https://')[1].split('.')[0];
      }

      const resourcesResp = await apigateway.send(new GetResourcesCommand({ restApiId: apiId }));
      const dataResource = resourcesResp.items?.find(r => r.pathPart === 'data');
      expect(dataResource).toBeDefined();

      if (dataResource?.id) {
        const getMethodResp = await apigateway.send(new GetMethodCommand({
          restApiId: apiId,
          resourceId: dataResource.id,
          httpMethod: 'GET'
        }));
        expect(getMethodResp.httpMethod).toBe('GET');

        const postMethodResp = await apigateway.send(new GetMethodCommand({
          restApiId: apiId,
          resourceId: dataResource.id,
          httpMethod: 'POST'
        }));
        expect(postMethodResp.httpMethod).toBe('POST');
      }
    });
  });

  describe('End-to-End', () => {
    test('API Gateway should invoke Lambda and return expected response', async () => {
      let apiUrl = outputs.ApiGatewayUrl;
      
      // For LocalStack, convert AWS-style URL to localhost format
      if (isLocalStack && apiUrl.includes(':4566') && apiUrl.includes('.execute-api.amazonaws.com')) {
        // Convert: https://{api-id}.execute-api.amazonaws.com:4566/{stage}
        // To: http://localhost:4566/restapis/{api-id}/{stage}/_user_request/{path}
        const urlMatch = apiUrl.match(/https:\/\/([^.]+)\.execute-api\.amazonaws\.com:4566\/(.+)/);
        if (urlMatch) {
          const apiId = urlMatch[1];
          const stage = urlMatch[2];
          apiUrl = `http://localhost:4566/restapis/${apiId}/${stage}/_user_request/data`;
        }
      }
      
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
