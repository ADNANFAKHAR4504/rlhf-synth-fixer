// Integration tests for Terraform-deployed serverless infrastructure
// These tests use real AWS outputs from cfn-outputs/flat-outputs.json

import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  GetRoleCommand,
  IAMClient,
} from '@aws-sdk/client-iam';
import {
  GetFunctionCommand,
  InvokeCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import fs from 'fs';
import path from 'path';

// Load deployment outputs
const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any = {};

// AWS clients
const region = 'us-west-2';
const lambdaClient = new LambdaClient({ region });
const apiGatewayClient = new APIGatewayClient({ region });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region });
const iamClient = new IAMClient({ region });

describe('Terraform Serverless Infrastructure Integration Tests', () => {
  beforeAll(() => {
    // Load outputs from deployment
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(outputsContent);
    } else {
      throw new Error('Deployment outputs not found. Please run terraform apply first.');
    }
  });

  describe('Lambda Function Tests', () => {
    test('Lambda function exists and is configured correctly', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.lambda_function_name,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(outputs.lambda_function_name);
      expect(response.Configuration?.Runtime).toContain('python');
      expect(response.Configuration?.Handler).toBe('lambda_function.lambda_handler');
      expect(response.Configuration?.Timeout).toBe(30);
      expect(response.Configuration?.MemorySize).toBe(128);
    });

    test('Lambda function can be invoked directly', async () => {
      const command = new InvokeCommand({
        FunctionName: outputs.lambda_function_name,
        Payload: JSON.stringify({
          httpMethod: 'GET',
          queryStringParameters: { test: 'direct-invoke' },
        }),
      });

      const response = await lambdaClient.send(command);
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));

      expect(response.StatusCode).toBe(200);
      expect(payload.statusCode).toBe(200);

      const body = JSON.parse(payload.body);
      expect(body.message).toBe('Hello from Lambda!');
      expect(body.httpMethod).toBe('GET');
      expect(body.queryParameters?.test).toBe('direct-invoke');
    });

    test('Lambda function has correct IAM role', async () => {
      const lambdaCommand = new GetFunctionCommand({
        FunctionName: outputs.lambda_function_name,
      });
      const lambdaResponse = await lambdaClient.send(lambdaCommand);

      const roleArn = lambdaResponse.Configuration?.Role;
      expect(roleArn).toBe(outputs.lambda_execution_role_arn);

      // Extract role name from ARN
      const roleName = roleArn?.split('/').pop();

      const roleCommand = new GetRoleCommand({
        RoleName: roleName,
      });
      const roleResponse = await iamClient.send(roleCommand);

      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role?.AssumeRolePolicyDocument).toContain('lambda.amazonaws.com');
    });
  });

  describe('API Gateway Tests', () => {
    test('API Gateway REST API exists', async () => {
      const command = new GetRestApiCommand({
        restApiId: outputs.api_gateway_id,
      });

      const response = await apiGatewayClient.send(command);

      expect(response.id).toBe(outputs.api_gateway_id);
      expect(response.endpointConfiguration?.types).toContain('REGIONAL');
    });

    test('API Gateway stage is deployed', async () => {
      const command = new GetStageCommand({
        restApiId: outputs.api_gateway_id,
        stageName: 'prod',
      });

      const response = await apiGatewayClient.send(command);

      expect(response.stageName).toBe('prod');
      expect(response.deploymentId).toBeDefined();
    });
  });

  describe('CloudWatch Logs Tests', () => {
    test('CloudWatch log group exists', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.cloudwatch_log_group,
      });

      const response = await cloudWatchLogsClient.send(command);

      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === outputs.cloudwatch_log_group
      );

      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(14);
    });
  });

  describe('Infrastructure Validation', () => {
    test('All expected outputs are present', () => {
      expect(outputs.api_gateway_url).toBeDefined();
      expect(outputs.lambda_function_name).toBeDefined();
      expect(outputs.lambda_function_arn).toBeDefined();
      expect(outputs.api_gateway_id).toBeDefined();
      expect(outputs.lambda_execution_role_arn).toBeDefined();
      expect(outputs.cloudwatch_log_group).toBeDefined();
      expect(outputs.environment_suffix).toBeDefined();
    });

    test('Resources use environment suffix', () => {
      const suffix = outputs.environment_suffix;

      expect(outputs.lambda_function_name).toContain(suffix);
      expect(outputs.lambda_execution_role_arn).toContain(suffix);
      expect(outputs.cloudwatch_log_group).toContain(suffix);
    });

    test('Resources are deployed in correct region', () => {
      expect(outputs.lambda_function_arn).toContain(region);
      expect(outputs.api_gateway_url).toContain(region);
    });
  });
});
