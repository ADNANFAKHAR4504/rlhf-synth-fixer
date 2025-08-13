// Configuration - These are coming from cfn-outputs after cdk deploy
import * as Lambda from '@aws-sdk/client-lambda';
import * as CloudWatchLogs from '@aws-sdk/client-cloudwatch-logs';
import fs from 'fs';

// AWS SDK Configuration
const region = process.env.AWS_DEFAULT_REGION || 'us-west-2';
const lambda = new Lambda.LambdaClient({ region });
const cloudWatchLogs = new CloudWatchLogs.CloudWatchLogsClient({ region });

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
    expect(result.Configuration?.Runtime).toMatch(/nodejs/);
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
});