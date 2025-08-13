// Configuration - These are coming from cfn-outputs after cdk deploy
import * as Lambda from '@aws-sdk/client-lambda';
import * as CloudWatchLogs from '@aws-sdk/client-cloudwatch-logs';
import * as IAM from '@aws-sdk/client-iam';
import * as ApplicationAutoScaling from '@aws-sdk/client-application-auto-scaling';
import fs from 'fs';
import fetch from 'node-fetch';

// AWS SDK Configuration
const region = process.env.AWS_DEFAULT_REGION || 'us-west-2';
const lambda = new Lambda.LambdaClient({ region });
const cloudWatchLogs = new CloudWatchLogs.CloudWatchLogsClient({ region });
const iam = new IAM.IAMClient({ region });
const appAutoScaling = new ApplicationAutoScaling.ApplicationAutoScalingClient({ region });

// Load outputs if file exists, otherwise use environment variables
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn(
    'cfn-outputs/flat-outputs.json not found, using environment variables'
  );
}

const LAMBDA_FUNCTION_NAME = outputs['LambdaFunctionName'] || process.env.LAMBDA_FUNCTION_NAME;
const LAMBDA_ALIAS_NAME = outputs['LambdaAliasName'] || process.env.LAMBDA_ALIAS_NAME;
const LOG_GROUP_NAME = outputs['LogGroupName'] || process.env.LOG_GROUP_NAME;
const API_GATEWAY_URL = outputs['ApiGatewayUrl'] || process.env.API_GATEWAY_URL;

// Utility function to generate unique test IDs
const generateTestId = () =>
  `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Test utilities
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('TapStack Integration Tests', () => {
  test('Lambda function exists and is active', async () => {
    const result = await lambda.send(
      new Lambda.GetFunctionCommand({ FunctionName: LAMBDA_FUNCTION_NAME })
    );
    expect(result.Configuration?.State).toBe('Active');
    expect(result.Configuration?.Runtime).toMatch(/nodejs18/);
  });

  test('Lambda alias exists and points to a version', async () => {
    const result = await lambda.send(
      new Lambda.GetAliasCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Name: LAMBDA_ALIAS_NAME,
      })
    );
    expect(result.AliasArn).toBeDefined();
    expect(result.FunctionVersion).not.toBe('$LATEST');
    expect(result.Name).toMatch(/^TapStack.*-live-[a-zA-Z0-9]+$/); // Match dynamic alias name pattern
  });

  test('CloudWatch log group exists for Lambda', async () => {
    const result = await cloudWatchLogs.send(
      new CloudWatchLogs.DescribeLogGroupsCommand({
        logGroupNamePrefix: LOG_GROUP_NAME,
      })
    );
    expect(result.logGroups?.length).toBeGreaterThan(0);
  });

  test('Can invoke Lambda function (integration smoke test)', async () => {
    const payload = JSON.stringify({ test: 'integration' });
    const result = await lambda.send(
      new Lambda.InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: Buffer.from(payload),
        Qualifier: LAMBDA_ALIAS_NAME,
      })
    );
    expect(result.StatusCode).toBe(200);
    // Optionally, check the response payload
    if (result.Payload) {
      const response = JSON.parse(Buffer.from(result.Payload).toString());
      expect(response).toBeDefined();
    }
  });

  test('API Gateway endpoint responds to GET', async () => {
    expect(API_GATEWAY_URL).toBeDefined();
    const response = await fetch(API_GATEWAY_URL, { method: 'GET' });
    expect(response.status).toBeLessThan(500); // Accept 2xx, 3xx, 4xx
  });

  test('API Gateway endpoint responds to POST', async () => {
    expect(API_GATEWAY_URL).toBeDefined();
    const response = await fetch(API_GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'integration' }),
    });
    expect(response.status).toBeLessThan(500);
  });

  test('IAM role for Lambda exists and has correct trust policy', async () => {
    // The role name is usually in the format: <stack>-<lambda>-role-<unique>
    // Try to discover it from the Lambda function config
    const fn = await lambda.send(
      new Lambda.GetFunctionCommand({ FunctionName: LAMBDA_FUNCTION_NAME })
    );
    const roleArn = fn.Configuration?.Role;
    expect(roleArn).toBeDefined();
    const roleName = roleArn?.split('/').pop();
    expect(roleName).toBeDefined();
    const role = await iam.send(new IAM.GetRoleCommand({ RoleName: roleName! }));
    expect(role.Role).toBeDefined();
    if (!role.Role) throw new Error('IAM Role not found');
    // Trust policy should allow lambda.amazonaws.com
    const trust = JSON.parse(decodeURIComponent(role.Role.AssumeRolePolicyDocument!));
    const principal = trust.Statement.find((s: any) => s.Principal?.Service === 'lambda.amazonaws.com');
    expect(principal).toBeDefined();
  });

  test('Lambda has Application Auto Scaling scalable target and scaling policy', async () => {
    // Lambda scalable target resourceId format: function:<function-name>:<alias>
    const resourceId = `function:${LAMBDA_FUNCTION_NAME}:${LAMBDA_ALIAS_NAME}`;
    // Check scalable target
    const scalableTargets = await appAutoScaling.send(
      new ApplicationAutoScaling.DescribeScalableTargetsCommand({
        ServiceNamespace: 'lambda',
        ResourceIds: [resourceId],
        ScalableDimension: 'lambda:function:ProvisionedConcurrency',
      })
    );
    expect(scalableTargets.ScalableTargets?.length).toBeGreaterThan(0);
    // Check scaling policy
    const scalingPolicies = await appAutoScaling.send(
      new ApplicationAutoScaling.DescribeScalingPoliciesCommand({
        ServiceNamespace: 'lambda',
        ResourceId: resourceId,
        ScalableDimension: 'lambda:function:ProvisionedConcurrency',
      })
    );
    expect(scalingPolicies.ScalingPolicies?.length).toBeGreaterThan(0);
  });

  test('Lambda alias has provisioned concurrency set to 100', async () => {
    const result = await lambda.send(
      new Lambda.GetAliasCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Name: LAMBDA_ALIAS_NAME,
      })
    );
    expect(result.Name).toBeDefined();
    // Check provisioned concurrency config
    const pcResult = await lambda.send(
      new Lambda.GetProvisionedConcurrencyConfigCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Qualifier: LAMBDA_ALIAS_NAME,
      })
    );
    expect(pcResult.RequestedProvisionedConcurrentExecutions).toBe(100);
    expect(pcResult.Status).toBe('READY');
  });
});