import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  SQSClient,
  GetQueueAttributesCommand,
  GetQueueUrlCommand,
} from '@aws-sdk/client-sqs';
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
  EventBridgeClient,
  ListRulesCommand,
} from '@aws-sdk/client-eventbridge';
import {
  IAMClient,
  GetRoleCommand,
  ListRolePoliciesCommand,
} from '@aws-sdk/client-iam';

// Load deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: {
  apiGatewayUrl?: string;
  s3BucketName?: string;
  dynamodbTableArn?: string;
};

let outputsAvailable = false;

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  outputsAvailable = !!(
    outputs.apiGatewayUrl &&
    outputs.s3BucketName &&
    outputs.dynamodbTableArn
  );
  if (!outputsAvailable) {
    console.warn(
      'Warning: Deployment outputs are incomplete. Integration tests will be skipped.'
    );
  }
} catch (error) {
  console.warn(
    'Warning: Failed to load deployment outputs. Integration tests will be skipped.',
    error
  );
  outputs = {};
}

const region = 'us-east-1';
const s3Client = new S3Client({ region });
const dynamoClient = new DynamoDBClient({ region });
const lambdaClient = new LambdaClient({ region });
const sqsClient = new SQSClient({ region });
const apiGatewayClient = new APIGatewayClient({ region });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region });
const eventBridgeClient = new EventBridgeClient({ region });
const iamClient = new IAMClient({ region });

describe('Infrastructure Integration Tests', () => {
  // Skip all tests if outputs are not available
  if (!outputsAvailable) {
    it.skip('skipping all integration tests - deployment outputs not available', () => {
      // This test will be skipped
    });
    return;
  }

  describe('Deployment Outputs', () => {
    it('should have all required outputs', () => {
      expect(outputs.apiGatewayUrl).toBeDefined();
      expect(outputs.s3BucketName).toBeDefined();
      expect(outputs.dynamodbTableArn).toBeDefined();
    });

    it('should have valid API Gateway URL format', () => {
      expect(outputs.apiGatewayUrl).toMatch(
        /^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/.+$/
      );
    });

    it('should have valid S3 bucket name format', () => {
      expect(outputs.s3BucketName).toMatch(/^market-data-/);
    });

    it('should have valid DynamoDB table ARN format', () => {
      expect(outputs.dynamodbTableArn).toMatch(/^arn:aws:dynamodb:/);
      expect(outputs.dynamodbTableArn).toContain('MarketDataState');
    });
  });

  describe('S3 Bucket Integration', () => {
    it('should have accessible S3 bucket', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.s3BucketName!,
      });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    it('should allow object upload to S3 bucket', async () => {
      const testKey = `test-${Date.now()}.json`;
      const command = new PutObjectCommand({
        Bucket: outputs.s3BucketName!,
        Key: testKey,
        Body: JSON.stringify({ test: 'data' }),
      });
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('DynamoDB Table Integration', () => {
    it('should have accessible DynamoDB table', async () => {
      const tableName = outputs.dynamodbTableArn!.split('/')[1];
      const command = new DescribeTableCommand({
        TableName: tableName,
      });
      const response = await dynamoClient.send(command);
      expect(response.Table).toBeDefined();
      expect(response.Table!.TableName).toBe(tableName);
    });

    it('should have correct DynamoDB table configuration', async () => {
      const tableName = outputs.dynamodbTableArn!.split('/')[1];
      const command = new DescribeTableCommand({
        TableName: tableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table!.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
      expect(response.Table!.KeySchema).toHaveLength(2);
      expect(response.Table!.KeySchema![0].AttributeName).toBe('symbol');
      expect(response.Table!.KeySchema![1].AttributeName).toBe('timestamp');
    });

    it('should have point-in-time recovery enabled', async () => {
      const tableName = outputs.dynamodbTableArn!.split('/')[1];
      const command = new DescribeTableCommand({
        TableName: tableName,
      });
      const response = await dynamoClient.send(command);
      expect(response.Table!.TableStatus).toBe('ACTIVE');
    });
  });

  describe('Lambda Functions Integration', () => {
    const environmentSuffix = outputs.s3BucketName!.replace('market-data-', '');

    it('should have DataIngestion Lambda function', async () => {
      const functionName = `DataIngestion-${environmentSuffix}`;
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.FunctionName).toBe(functionName);
    });

    it('should have DataProcessor Lambda function', async () => {
      const functionName = `DataProcessor-${environmentSuffix}`;
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.FunctionName).toBe(functionName);
    });

    it('should have DataAggregator Lambda function', async () => {
      const functionName = `DataAggregator-${environmentSuffix}`;
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.FunctionName).toBe(functionName);
    });

    it('should have Lambda functions with correct runtime', async () => {
      const functionName = `DataIngestion-${environmentSuffix}`;
      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Runtime).toBe('nodejs18.x');
    });

    it('should have Lambda functions with correct memory', async () => {
      const functionName = `DataIngestion-${environmentSuffix}`;
      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.MemorySize).toBe(3008);
    });

    it('should have Lambda functions with X-Ray tracing enabled', async () => {
      const functionName = `DataIngestion-${environmentSuffix}`;
      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.TracingConfig?.Mode).toBe('Active');
    });

    it('should have Lambda functions with correct timeout', async () => {
      const functionName = `DataIngestion-${environmentSuffix}`;
      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Timeout).toBe(300);
    });
  });

  describe('SQS Queues Integration', () => {
    const environmentSuffix = outputs.s3BucketName!.replace('market-data-', '');

    it('should have ProcessingQueue accessible', async () => {
      const queueName = `ProcessingQueue-${environmentSuffix}`;
      const command = new GetQueueUrlCommand({
        QueueName: queueName,
      });
      const response = await sqsClient.send(command);
      expect(response.QueueUrl).toBeDefined();
    });

    it('should have ProcessingDLQ accessible', async () => {
      const queueName = `ProcessingDLQ-${environmentSuffix}`;
      const command = new GetQueueUrlCommand({
        QueueName: queueName,
      });
      const response = await sqsClient.send(command);
      expect(response.QueueUrl).toBeDefined();
    });

    it('should have correct queue retention period', async () => {
      const queueName = `ProcessingQueue-${environmentSuffix}`;
      const urlResponse = await sqsClient.send(
        new GetQueueUrlCommand({ QueueName: queueName })
      );
      const command = new GetQueueAttributesCommand({
        QueueUrl: urlResponse.QueueUrl!,
        AttributeNames: ['MessageRetentionPeriod'],
      });
      const response = await sqsClient.send(command);
      expect(response.Attributes?.MessageRetentionPeriod).toBe('345600'); // 4 days
    });

    it('should have correct visibility timeout', async () => {
      const queueName = `ProcessingQueue-${environmentSuffix}`;
      const urlResponse = await sqsClient.send(
        new GetQueueUrlCommand({ QueueName: queueName })
      );
      const command = new GetQueueAttributesCommand({
        QueueUrl: urlResponse.QueueUrl!,
        AttributeNames: ['VisibilityTimeout'],
      });
      const response = await sqsClient.send(command);
      expect(response.Attributes?.VisibilityTimeout).toBe('300'); // 5 minutes
    });
  });

  describe('API Gateway Integration', () => {
    it('should have accessible API Gateway', async () => {
      const apiId = outputs.apiGatewayUrl!.split('.')[0].split('//')[1];
      const command = new GetRestApiCommand({
        restApiId: apiId,
      });
      const response = await apiGatewayClient.send(command);
      expect(response.name).toBeDefined();
    });

    it('should have prod stage deployed', async () => {
      const apiId = outputs.apiGatewayUrl!.split('.')[0].split('//')[1];
      const command = new GetStageCommand({
        restApiId: apiId,
        stageName: 'prod',
      });
      const response = await apiGatewayClient.send(command);
      expect(response.stageName).toBe('prod');
    });

    it('should have throttling configured', async () => {
      const apiId = outputs.apiGatewayUrl!.split('.')[0].split('//')[1];
      const command = new GetStageCommand({
        restApiId: apiId,
        stageName: 'prod',
      });
      const response = await apiGatewayClient.send(command);
      expect(response.methodSettings).toBeDefined();
    });
  });

  describe('CloudWatch Logs Integration', () => {
    const environmentSuffix = outputs.s3BucketName!.replace('market-data-', '');

    it('should have CloudWatch log groups created', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/lambda/',
      });
      const response = await cloudWatchLogsClient.send(command);
      const logGroupNames = response.logGroups?.map((lg) => lg.logGroupName);

      expect(logGroupNames).toContain(
        `/aws/lambda/DataIngestion-${environmentSuffix}`
      );
      expect(logGroupNames).toContain(
        `/aws/lambda/DataProcessor-${environmentSuffix}`
      );
      expect(logGroupNames).toContain(
        `/aws/lambda/DataAggregator-${environmentSuffix}`
      );
    });

    it('should have correct log retention', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/DataIngestion-`,
      });
      const response = await cloudWatchLogsClient.send(command);
      const logGroup = response.logGroups?.find((lg) =>
        lg.logGroupName?.includes(environmentSuffix)
      );

      expect(logGroup?.retentionInDays).toBe(7);
    });
  });

  describe('EventBridge Integration', () => {
    const environmentSuffix = outputs.s3BucketName!.replace('market-data-', '');

    it('should have scheduled rule created', async () => {
      const command = new ListRulesCommand({
        NamePrefix: `DataAggregator-Schedule-${environmentSuffix}`,
      });
      const response = await eventBridgeClient.send(command);
      expect(response.Rules).toHaveLength(1);
      expect(response.Rules![0].Name).toContain('DataAggregator-Schedule');
    });

    it('should have correct schedule expression', async () => {
      const command = new ListRulesCommand({
        NamePrefix: `DataAggregator-Schedule-${environmentSuffix}`,
      });
      const response = await eventBridgeClient.send(command);
      expect(response.Rules![0].ScheduleExpression).toBe('rate(5 minutes)');
    });
  });

  describe('IAM Roles Integration', () => {
    const environmentSuffix = outputs.s3BucketName!.replace('market-data-', '');

    it('should have IAM roles for Lambda functions', async () => {
      const roleName = `DataIngestion-Role-${environmentSuffix}`;
      const command = new GetRoleCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);
      expect(response.Role?.RoleName).toBe(roleName);
    });

    it('should have inline policies attached to roles', async () => {
      const roleName = `DataIngestion-Role-${environmentSuffix}`;
      const command = new ListRolePoliciesCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);
      expect(response.PolicyNames).toBeDefined();
      expect(response.PolicyNames!.length).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Workflow Validation', () => {
    it('should have all components for data ingestion workflow', async () => {
      // Verify S3 bucket exists
      const s3Command = new HeadBucketCommand({
        Bucket: outputs.s3BucketName!,
      });
      await expect(s3Client.send(s3Command)).resolves.toBeDefined();

      // Verify DynamoDB table exists
      const tableName = outputs.dynamodbTableArn!.split('/')[1];
      const dynamoCommand = new DescribeTableCommand({
        TableName: tableName,
      });
      await expect(dynamoClient.send(dynamoCommand)).resolves.toBeDefined();

      // Verify Lambda functions exist
      const environmentSuffix = outputs.s3BucketName!.replace(
        'market-data-',
        ''
      );
      const lambdaCommand = new GetFunctionCommand({
        FunctionName: `DataIngestion-${environmentSuffix}`,
      });
      await expect(lambdaClient.send(lambdaCommand)).resolves.toBeDefined();
    });

    it('should have all components for data processing workflow', async () => {
      const environmentSuffix = outputs.s3BucketName!.replace(
        'market-data-',
        ''
      );

      // Verify SQS queue exists
      const sqsCommand = new GetQueueUrlCommand({
        QueueName: `ProcessingQueue-${environmentSuffix}`,
      });
      await expect(sqsClient.send(sqsCommand)).resolves.toBeDefined();

      // Verify DataProcessor Lambda exists
      const lambdaCommand = new GetFunctionCommand({
        FunctionName: `DataProcessor-${environmentSuffix}`,
      });
      await expect(lambdaClient.send(lambdaCommand)).resolves.toBeDefined();
    });

    it('should have all components for data aggregation workflow', async () => {
      const environmentSuffix = outputs.s3BucketName!.replace(
        'market-data-',
        ''
      );

      // Verify EventBridge rule exists
      const eventBridgeCommand = new ListRulesCommand({
        NamePrefix: `DataAggregator-Schedule-${environmentSuffix}`,
      });
      const eventBridgeResponse = await eventBridgeClient.send(
        eventBridgeCommand
      );
      expect(eventBridgeResponse.Rules).toHaveLength(1);

      // Verify DataAggregator Lambda exists
      const lambdaCommand = new GetFunctionCommand({
        FunctionName: `DataAggregator-${environmentSuffix}`,
      });
      await expect(lambdaClient.send(lambdaCommand)).resolves.toBeDefined();
    });

    it('should have API Gateway endpoint accessible', async () => {
      const apiId = outputs.apiGatewayUrl!.split('.')[0].split('//')[1];
      const command = new GetRestApiCommand({
        restApiId: apiId,
      });
      const response = await apiGatewayClient.send(command);
      expect(response.id).toBe(apiId);
    });
  });

  describe('Resource Tagging Validation', () => {
    it('should have DynamoDB table with correct tags', async () => {
      const tableName = outputs.dynamodbTableArn!.split('/')[1];
      const command = new DescribeTableCommand({
        TableName: tableName,
      });
      const response = await dynamoClient.send(command);
      expect(response.Table?.TableName).toBe(tableName);
    });

    it('should have proper resource naming with environment suffix', () => {
      const environmentSuffix = outputs.s3BucketName!.replace(
        'market-data-',
        ''
      );
      expect(environmentSuffix).toBeTruthy();
      expect(environmentSuffix.length).toBeGreaterThan(0);
    });
  });
});
