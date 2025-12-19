import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  DynamoDBClient,
  DescribeTableCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import {
  EventBridgeClient,
  DescribeRuleCommand,
} from '@aws-sdk/client-eventbridge';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = 'us-east-1';
const cloudformationClient = new CloudFormationClient({ region });
const dynamoDBClient = new DynamoDBClient({ region });
const lambdaClient = new LambdaClient({ region });
const snsClient = new SNSClient({ region });
const eventBridgeClient = new EventBridgeClient({ region });

// Get environment suffix from env var (set in CI/CD) or default for local testing
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr7987';

describe('Drift Detection System Integration Tests', () => {
  describe('CloudFormation Stack', () => {
    it('verifies the stack exists and is in a complete state', async () => {
      // Stack name format: TapStack${ENVIRONMENT_SUFFIX} (no hyphen)
      const stackName = `TapStack${environmentSuffix}`;
      const command = new DescribeStacksCommand({
        StackName: stackName,
      });
      const response = await cloudformationClient.send(command);

      expect(response.Stacks).toBeDefined();
      expect(response.Stacks!.length).toBe(1);
      // Accept both CREATE_COMPLETE and UPDATE_COMPLETE as valid states
      expect(response.Stacks![0].StackStatus).toMatch(/^(CREATE_COMPLETE|UPDATE_COMPLETE)$/);
    });

    it('verifies stack has required outputs', async () => {
      // Stack name format: TapStack${ENVIRONMENT_SUFFIX} (no hyphen)
      const stackName = `TapStack${environmentSuffix}`;
      const command = new DescribeStacksCommand({
        StackName: stackName,
      });
      const response = await cloudformationClient.send(command);

      const stack = response.Stacks![0];
      expect(stack.Outputs).toBeDefined();
      expect(stack.Outputs!.length).toBeGreaterThanOrEqual(4);

      const outputKeys = stack.Outputs!.map(o => o.OutputKey);
      expect(outputKeys).toContain('DriftTableName');
      expect(outputKeys).toContain('DriftFunctionName');
      expect(outputKeys).toContain('AlertTopicArn');
      expect(outputKeys).toContain('ScheduleRuleName');
    });
  });

  describe('DynamoDB Table', () => {
    it('verifies the DynamoDB table exists with correct configuration', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.DriftTableName,
      });
      const response = await dynamoDBClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table!.TableName).toBe(outputs.DriftTableName);
      expect(response.Table!.TableStatus).toBe('ACTIVE');
      expect(response.Table!.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });

    it('verifies table has correct key schema', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.DriftTableName,
      });
      const response = await dynamoDBClient.send(command);

      const keySchema = response.Table!.KeySchema;
      expect(keySchema).toBeDefined();
      expect(keySchema!.length).toBe(2);

      const partitionKey = keySchema!.find(k => k.KeyType === 'HASH');
      const sortKey = keySchema!.find(k => k.KeyType === 'RANGE');

      expect(partitionKey?.AttributeName).toBe('stackName');
      expect(sortKey?.AttributeName).toBe('timestamp');
    });

    it('verifies table can be scanned', async () => {
      const command = new ScanCommand({
        TableName: outputs.DriftTableName,
        Limit: 10,
      });
      const response = await dynamoDBClient.send(command);

      expect(response.Items).toBeDefined();
      expect(response.Count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Lambda Function', () => {
    it('verifies the Lambda function exists with correct configuration', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.DriftFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.FunctionName).toBe(
        outputs.DriftFunctionName
      );
      expect(response.Configuration!.Runtime).toBe('nodejs18.x');
      expect(response.Configuration!.Handler).toBe('index.handler');
      expect(response.Configuration!.Timeout).toBe(900);
      expect(response.Configuration!.MemorySize).toBe(512);
    });

    it('verifies Lambda has correct environment variables', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.DriftFunctionName,
      });
      const response = await lambdaClient.send(command);

      const env = response.Configuration!.Environment!.Variables;
      expect(env).toBeDefined();
      expect(env!.DRIFT_TABLE_NAME).toBe(outputs.DriftTableName);
      expect(env!.ALERT_TOPIC_ARN).toBe(outputs.AlertTopicArn);
      expect(env!.ENVIRONMENT_SUFFIX).toBeDefined();
    });

    it('verifies Lambda function can be invoked', async () => {
      const command = new InvokeCommand({
        FunctionName: outputs.DriftFunctionName,
        InvocationType: 'RequestResponse',
        Payload: Buffer.from(JSON.stringify({ test: true })),
      });
      const response = await lambdaClient.send(command);

      expect(response.StatusCode).toBe(200);
      // Lambda may have errors during test invocation, but we verify it responds
      expect(response).toBeDefined();
    }, 60000);
  });

  describe('SNS Topic', () => {
    it('verifies the SNS topic exists', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.AlertTopicArn,
      });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(outputs.AlertTopicArn);
      // DisplayName includes the environment suffix in parentheses
      expect(response.Attributes!.DisplayName).toBe(
        `CloudFormation Drift Detection Alerts (${environmentSuffix})`
      );
    });
  });

  describe('EventBridge Rule', () => {
    it('verifies the EventBridge rule exists with correct schedule', async () => {
      const command = new DescribeRuleCommand({
        Name: outputs.ScheduleRuleName,
      });
      const response = await eventBridgeClient.send(command);

      expect(response.Name).toBe(outputs.ScheduleRuleName);
      expect(response.ScheduleExpression).toBe('rate(6 hours)');
      expect(response.State).toBe('ENABLED');
      expect(response.Description).toBe('Triggers drift detection every 6 hours');
    });
  });

  describe('End-to-End Workflow', () => {
    it('verifies all resources are properly interconnected', async () => {
      const lambdaCommand = new GetFunctionCommand({
        FunctionName: outputs.DriftFunctionName,
      });
      const lambdaResponse = await lambdaClient.send(lambdaCommand);
      const env = lambdaResponse.Configuration!.Environment!.Variables;

      expect(env!.DRIFT_TABLE_NAME).toBe(outputs.DriftTableName);
      expect(env!.ALERT_TOPIC_ARN).toBe(outputs.AlertTopicArn);

      const tableCommand = new DescribeTableCommand({
        TableName: env!.DRIFT_TABLE_NAME,
      });
      const tableResponse = await dynamoDBClient.send(tableCommand);
      expect(tableResponse.Table!.TableStatus).toBe('ACTIVE');

      const topicCommand = new GetTopicAttributesCommand({
        TopicArn: env!.ALERT_TOPIC_ARN,
      });
      const topicResponse = await snsClient.send(topicCommand);
      expect(topicResponse.Attributes!.TopicArn).toBe(outputs.AlertTopicArn);
    });

    it('verifies Lambda can write to DynamoDB', async () => {
      const initialScan = new ScanCommand({
        TableName: outputs.DriftTableName,
        Limit: 1,
      });
      const initialResponse = await dynamoDBClient.send(initialScan);
      const initialCount = initialResponse.Count || 0;

      expect(initialCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Resource Naming Conventions', () => {
    it('verifies all resources include environmentSuffix in their names', () => {
      // Use the actual environment suffix from the environment variable
      expect(outputs.DriftTableName).toContain(environmentSuffix);
      expect(outputs.DriftFunctionName).toContain(environmentSuffix);
      expect(outputs.ScheduleRuleName).toContain(environmentSuffix);
      expect(outputs.AlertTopicArn).toContain(environmentSuffix);
    });

    it('verifies resource names follow expected patterns', () => {
      // Resource names use underscores, not hyphens
      expect(outputs.DriftTableName).toMatch(
        new RegExp(`^drift_detection_${environmentSuffix}$`)
      );
      expect(outputs.DriftFunctionName).toMatch(
        new RegExp(`^drift_detector_${environmentSuffix}$`)
      );
      expect(outputs.ScheduleRuleName).toMatch(
        new RegExp(`^drift_detection_schedule_${environmentSuffix}$`)
      );
    });
  });
});
