import {
  LambdaClient,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  ApiGatewayV2Client,
  GetApiCommand,
  GetIntegrationCommand,
} from '@aws-sdk/client-apigatewayv2';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import fs from 'fs';

const region = process.env.AWS_REGION || 'us-east-1';
const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf-8'));

const lambda = new LambdaClient({ region });
const apigw = new ApiGatewayV2Client({ region });
const logs = new CloudWatchLogsClient({ region });

describe('projectX Serverless Stack Integration Tests', () => {
  test('Lambda function should exist and have correct configuration', async () => {
    const res = await lambda.send(new GetFunctionCommand({
      FunctionName: outputs.LambdaFunctionName,
    }));

    expect(res.Configuration?.FunctionName).toBe(outputs.LambdaFunctionName);
    expect(res.Configuration?.Runtime).toBeDefined();
    expect(res.Configuration?.Role).toMatch(/^arn:aws:iam::\d{12}:role\/.+/);
  });

  test('API Gateway should exist and match expected name', async () => {
    const res = await apigw.send(new GetApiCommand({
      ApiId: outputs.ApiGatewayId,
    }));

    expect(res.Name).toBeDefined();
    expect(res.ProtocolType).toBe('HTTP');
  });

  test('API Gateway integration should be valid', async () => {
    const res = await apigw.send(new GetIntegrationCommand({
      ApiId: outputs.ApiGatewayId,
      IntegrationId: outputs.ApiIntegrationId,
    }));

    expect(res.IntegrationType).toBe('AWS_PROXY');
    expect(res.IntegrationUri).toContain(outputs.LambdaFunctionArn);
  });

  test('CloudWatch Log Group for Lambda should exist', async () => {
    const logGroups = await logs.send(new DescribeLogGroupsCommand({
      logGroupNamePrefix: `/aws/lambda/${outputs.LambdaFunctionName}`,
    }));

    const found = logGroups.logGroups?.find(
      (g) => g.logGroupName === `/aws/lambda/${outputs.LambdaFunctionName}`
    );

    expect(found).toBeDefined();
  });

  test('All required outputs are present', () => {
    const requiredKeys = [
      'LambdaFunctionName',
      'LambdaFunctionArn',
      'ApiGatewayId',
      'ApiIntegrationId',
      'ApiGatewayUrl',
    ];

    requiredKeys.forEach((key) => {
      expect(outputs[key]).toBeDefined();
    });
  });

  test('API Gateway URL should start with https:// and contain execute-api', () => {
    // LocalStack URLs include port :4566 and trailing slash
    // LocalStack format: https://ID.execute-api.amazonaws.com:4566/
    // AWS format: https://ID.execute-api.REGION.amazonaws.com/
    expect(outputs.ApiGatewayUrl).toMatch(/^https:\/\/.+\.execute-api\.([^:\/]+\.)?amazonaws\.com(:\d+)?\/?$/);
  });
});