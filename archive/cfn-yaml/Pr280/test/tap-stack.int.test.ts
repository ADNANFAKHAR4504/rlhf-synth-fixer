import fs from 'fs';
import path from 'path';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Load CloudFormation Outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

const region = 'us-east-1';

const lambdaClient = new LambdaClient({ region });
const logsClient = new CloudWatchLogsClient({ region });

describe('Turn Around Prompt API Integration Tests', () => {
  let dataProcessorName: string;
  let responseHandlerName: string;

  beforeAll(() => {
    try {
      dataProcessorName = outputs.DataProcessorFunctionName;
      responseHandlerName = outputs.ResponseHandlerFunctionName;

      if (!dataProcessorName || !responseHandlerName) {
        throw new Error('Missing Lambda function names in CloudFormation outputs.');
      }
    } catch (err) {
      console.error('❌ Failed to load output values:', err);
      throw err;
    }
  });

  describe('Lambda Functions', () => {
    test('dataProcessor function exists and is active', async () => {
      try {
        const command = new GetFunctionConfigurationCommand({
          FunctionName: dataProcessorName,
        });
        const result = await lambdaClient.send(command);

        expect(result.FunctionName).toBe(dataProcessorName);
        expect(result.State).toMatch(/Active|Pending/);
      } catch (err) {
        console.error(`❌ Lambda check failed for ${dataProcessorName}:`, err);
        throw err;
      }
    });

    test('responseHandler function exists and is active', async () => {
      try {
        const command = new GetFunctionConfigurationCommand({
          FunctionName: responseHandlerName,
        });
        const result = await lambdaClient.send(command);

        expect(result.FunctionName).toBe(responseHandlerName);
        expect(result.State).toMatch(/Active|Pending/);
      } catch (err) {
        console.error(`❌ Lambda check failed for ${responseHandlerName}:`, err);
        throw err;
      }
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('log group for dataProcessor exists', async () => {
      const expectedLogGroupName = `/aws/lambda/${dataProcessorName}`;
      try {
        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: expectedLogGroupName,
        });
        const result = await logsClient.send(command);

        const logGroup = result.logGroups?.find(
          (lg) => lg.logGroupName === expectedLogGroupName
        );

        expect(logGroup).toBeDefined();
      } catch (err) {
        console.error(`❌ Log group check failed for ${expectedLogGroupName}:`, err);
        throw err;
      }
    });

    test('log group for responseHandler exists', async () => {
      const expectedLogGroupName = `/aws/lambda/${responseHandlerName}`;
      try {
        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: expectedLogGroupName,
        });
        const result = await logsClient.send(command);

        const logGroup = result.logGroups?.find(
          (lg) => lg.logGroupName === expectedLogGroupName
        );

        expect(logGroup).toBeDefined();
      } catch (err) {
        console.error(`❌ Log group check failed for ${expectedLogGroupName}:`, err);
        throw err;
      }
    });
  });
});
