import {
  LambdaClient,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  IAMClient,
  GetRoleCommand,
} from '@aws-sdk/client-iam';
import {
  ApiGatewayV2Client,
  GetApiCommand,
  GetIntegrationCommand,
  GetRouteCommand,
  GetStageCommand,
} from '@aws-sdk/client-apigatewayv2';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import fs from 'fs';

const region = process.env.AWS_REGION || 'us-east-1';
const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));

const lambda = new LambdaClient({ region });
const iam = new IAMClient({ region });
const apigw = new ApiGatewayV2Client({ region });
const logs = new CloudWatchLogsClient({ region });

describe('TapStack CloudFormation Integration Tests', () => {
  test('Lambda function should exist and be configured', async () => {
    const res = await lambda.send(new GetFunctionCommand({
      FunctionName: outputs.LambdaFunctionName,
    }));
    expect(res.Configuration?.Runtime).toMatch(/nodejs\d{2}\.x/);
  });

  test('IAM role for Lambda should exist', async () => {
    const res = await iam.send(new GetRoleCommand({
      RoleName: outputs.LambdaRoleName,
    }));
    expect(res.Role?.Arn).toMatch(/^arn:aws:iam::\d{12}:role\//);
  });

  test('API Gateway should exist', async () => {
    const res = await apigw.send(new GetApiCommand({
      ApiId: outputs.ApiId,
    }));
    expect(res.Name).toBeDefined();
    expect(res.ProtocolType).toBe('HTTP');
  });

  test('API Integration should be set up', async () => {
    const res = await apigw.send(new GetIntegrationCommand({
      ApiId: outputs.ApiId,
      IntegrationId: outputs.IntegrationId,
    }));
    expect(res.IntegrationType).toBe('AWS_PROXY');
  });

  test('API Route should exist', async () => {
    const res = await apigw.send(new GetRouteCommand({
      ApiId: outputs.ApiId,
      RouteId: outputs.RouteId,
    }));
    expect(res.RouteKey).toBeDefined();
  });

  test('API Stage should exist', async () => {
    const res = await apigw.send(new GetStageCommand({
      ApiId: outputs.ApiId,
      StageName: outputs.StageName,
    }));
    expect(res.StageName).toBeDefined();
  });

  test('CloudWatch log group for Lambda should be present', async () => {
    const res = await logs.send(new DescribeLogGroupsCommand({}));
    const found = res.logGroups?.find(group =>
      group.logGroupName?.includes(outputs.LambdaFunctionName)
    );
    expect(found).toBeDefined();
  });
});