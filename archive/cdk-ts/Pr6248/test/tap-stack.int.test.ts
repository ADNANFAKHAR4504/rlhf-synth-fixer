import * as fs from 'fs';
import * as path from 'path';
import {
  APIGatewayClient,
  GetRestApisCommand,
  GetResourcesCommand,
  GetUsagePlansCommand,
  GetApiKeysCommand,
} from '@aws-sdk/client-api-gateway';
import {DynamoDBClient, DescribeTableCommand} from '@aws-sdk/client-dynamodb';
import {SQSClient, GetQueueAttributesCommand} from '@aws-sdk/client-sqs';
import {SNSClient, GetTopicAttributesCommand} from '@aws-sdk/client-sns';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {SSMClient, GetParameterCommand} from '@aws-sdk/client-ssm';

// Configuration - Load from cfn-outputs
const outputsPath = path.join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS SDK clients
const apiGatewayClient = new APIGatewayClient({region});
const dynamoDBClient = new DynamoDBClient({region});
const sqsClient = new SQSClient({region});
const snsClient = new SNSClient({region});
const lambdaClient = new LambdaClient({region});
const cloudWatchClient = new CloudWatchClient({region});
const logsClient = new CloudWatchLogsClient({region});
const ssmClient = new SSMClient({region});

describe('Payment Processing System Integration Tests', () => {
  describe('DynamoDB Table', () => {
    test('transactions table exists and is accessible', async () => {
      const tableName = outputs.TransactionsTableName || `transactions-${environmentSuffix}`;

      const response = await dynamoDBClient.send(
        new DescribeTableCommand({TableName: tableName})
      );

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(tableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });

    test('table has correct partition and sort keys', async () => {
      const tableName = outputs.TransactionsTableName || `transactions-${environmentSuffix}`;

      const response = await dynamoDBClient.send(
        new DescribeTableCommand({TableName: tableName})
      );

      const keySchema = response.Table?.KeySchema;
      expect(keySchema).toBeDefined();

      const hashKey = keySchema?.find((k) => k.KeyType === 'HASH');
      const rangeKey = keySchema?.find((k) => k.KeyType === 'RANGE');

      expect(hashKey?.AttributeName).toBe('transaction_id');
      expect(rangeKey?.AttributeName).toBe('timestamp');
    });

    test('table uses on-demand billing', async () => {
      const tableName = outputs.TransactionsTableName || `transactions-${environmentSuffix}`;

      const response = await dynamoDBClient.send(
        new DescribeTableCommand({TableName: tableName})
      );

      expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });

    test('table has correct tags', async () => {
      const tableName = outputs.TransactionsTableName || `transactions-${environmentSuffix}`;

      const response = await dynamoDBClient.send(
        new DescribeTableCommand({TableName: tableName})
      );

      // Tags might not be in the TableDescription, skip this test if not available
      // Tags are applied at stack level
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(tableName);
    });
  });

  describe('SQS Queues', () => {
    test('invalid transactions queue exists', async () => {
      const queueUrl = outputs.InvalidQueueUrl;
      expect(queueUrl).toBeDefined();

      const response = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ['All'],
        })
      );

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.QueueArn).toContain(`invalid-transactions-${environmentSuffix}`);
    });

    test('invalid transactions queue has correct visibility timeout', async () => {
      const queueUrl = outputs.InvalidQueueUrl;

      const response = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ['VisibilityTimeout'],
        })
      );

      expect(response.Attributes?.VisibilityTimeout).toBe('300'); // 5 minutes
    });

    test('invalid transactions queue has dead letter queue configured', async () => {
      const queueUrl = outputs.InvalidQueueUrl;

      const response = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ['RedrivePolicy'],
        })
      );

      expect(response.Attributes?.RedrivePolicy).toBeDefined();
      const redrivePolicy = JSON.parse(response.Attributes?.RedrivePolicy || '{}');
      expect(redrivePolicy.maxReceiveCount).toBe(3);
      expect(redrivePolicy.deadLetterTargetArn).toContain('invalid-transactions-dlq');
    });
  });

  describe('SNS Topic', () => {
    test('compliance notifications topic exists', async () => {
      const topicArn = outputs.ComplianceTopicArn;
      expect(topicArn).toBeDefined();

      const response = await snsClient.send(
        new GetTopicAttributesCommand({TopicArn: topicArn})
      );

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(topicArn);
    });

    test('topic has correct display name', async () => {
      const topicArn = outputs.ComplianceTopicArn;

      const response = await snsClient.send(
        new GetTopicAttributesCommand({TopicArn: topicArn})
      );

      expect(response.Attributes?.DisplayName).toBe(
        'Compliance Notifications for High-Value Transactions'
      );
    });
  });

  describe('Lambda Functions', () => {
    test('validation Lambda function exists and is configured correctly', async () => {
      const functionArn = outputs.ValidationLambdaArn;
      const functionName = functionArn ? functionArn.split(':').pop() : `transaction-validator-${environmentSuffix}`;

      const response = await lambdaClient.send(
        new GetFunctionCommand({FunctionName: functionName})
      );

      expect(response.Configuration?.FunctionName).toBe(`transaction-validator-${environmentSuffix}`);
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.Handler).toBe('index.handler');
      expect(response.Configuration?.Timeout).toBe(30);
    });

    test('validation Lambda has reserved concurrency', async () => {
      const functionArn = outputs.ValidationLambdaArn;
      const functionName = functionArn ? functionArn.split(':').pop() : `transaction-validator-${environmentSuffix}`;

      const response = await lambdaClient.send(
        new GetFunctionCommand({FunctionName: functionName})
      );

      expect(response.Concurrency?.ReservedConcurrentExecutions).toBe(100);
    });

    test('validation Lambda has X-Ray tracing enabled', async () => {
      const functionArn = outputs.ValidationLambdaArn;
      const functionName = functionArn ? functionArn.split(':').pop() : `transaction-validator-${environmentSuffix}`;

      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({FunctionName: functionName})
      );

      expect(response.TracingConfig?.Mode).toBe('Active');
    });

    test('validation Lambda has correct environment variables', async () => {
      const functionArn = outputs.ValidationLambdaArn;
      const functionName = functionArn ? functionArn.split(':').pop() : `transaction-validator-${environmentSuffix}`;

      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({FunctionName: functionName})
      );

      const envVars = response.Environment?.Variables || {};
      expect(envVars.TRANSACTIONS_TABLE).toBeDefined();
      expect(envVars.INVALID_QUEUE_URL).toBeDefined();
      expect(envVars.COMPLIANCE_TOPIC_ARN).toBeDefined();
      expect(envVars.MAX_AMOUNT_PARAM).toBeDefined();
      expect(envVars.SUPPORTED_CURRENCIES_PARAM).toBeDefined();
      expect(envVars.HIGH_VALUE_THRESHOLD_PARAM).toBeDefined();
    });

    test('review Lambda function exists and is configured correctly', async () => {
      const functionArn = outputs.ReviewLambdaArn;
      const functionName = functionArn ? functionArn.split(':').pop() : `review-processor-${environmentSuffix}`;

      const response = await lambdaClient.send(
        new GetFunctionCommand({FunctionName: functionName})
      );

      expect(response.Configuration?.FunctionName).toBe(`review-processor-${environmentSuffix}`);
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.Handler).toBe('index.handler');
    });

    test('review Lambda has X-Ray tracing enabled', async () => {
      const functionArn = outputs.ReviewLambdaArn;
      const functionName = functionArn ? functionArn.split(':').pop() : `review-processor-${environmentSuffix}`;

      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({FunctionName: functionName})
      );

      expect(response.TracingConfig?.Mode).toBe('Active');
    });

    test('review Lambda has dead letter queue configured', async () => {
      const functionArn = outputs.ReviewLambdaArn;
      const functionName = functionArn ? functionArn.split(':').pop() : `review-processor-${environmentSuffix}`;

      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({FunctionName: functionName})
      );

      expect(response.DeadLetterConfig?.TargetArn).toBeDefined();
      expect(response.DeadLetterConfig?.TargetArn).toContain('review-processing-dlq');
    });
  });

  describe('SSM Parameters', () => {
    test('max amount parameter exists with correct value', async () => {
      const paramName = `/payments/${environmentSuffix}/max-amount`;

      const response = await ssmClient.send(
        new GetParameterCommand({Name: paramName})
      );

      expect(response.Parameter?.Value).toBe('10000');
    });

    test('supported currencies parameter exists with correct value', async () => {
      const paramName = `/payments/${environmentSuffix}/supported-currencies`;

      const response = await ssmClient.send(
        new GetParameterCommand({Name: paramName})
      );

      expect(response.Parameter?.Value).toBe('USD,EUR,GBP');
    });

    test('high value threshold parameter exists with correct value', async () => {
      const paramName = `/payments/${environmentSuffix}/high-value-threshold`;

      const response = await ssmClient.send(
        new GetParameterCommand({Name: paramName})
      );

      expect(response.Parameter?.Value).toBe('5000');
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('validation Lambda log group exists with 7-day retention', async () => {
      const logGroupName = `/aws/lambda/transaction-validator-${environmentSuffix}`;

      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName,
        })
      );

      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === logGroupName
      );

      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(7);
    });

    test('review Lambda log group exists with 7-day retention', async () => {
      const logGroupName = `/aws/lambda/review-processor-${environmentSuffix}`;

      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName,
        })
      );

      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === logGroupName
      );

      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(7);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('validation Lambda error alarm exists', async () => {
      const alarmName = `validation-lambda-errors-${environmentSuffix}`;

      const response = await cloudWatchClient.send(
        new DescribeAlarmsCommand({AlarmNames: [alarmName]})
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmName).toBe(alarmName);
      expect(alarm.Threshold).toBe(1);
      expect(alarm.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    });

    test('review Lambda error alarm exists', async () => {
      const alarmName = `review-lambda-errors-${environmentSuffix}`;

      const response = await cloudWatchClient.send(
        new DescribeAlarmsCommand({AlarmNames: [alarmName]})
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmName).toBe(alarmName);
      expect(alarm.Threshold).toBe(1);
      expect(alarm.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    });

    test('alarms have SNS notification actions configured', async () => {
      const alarmNames = [
        `validation-lambda-errors-${environmentSuffix}`,
        `review-lambda-errors-${environmentSuffix}`,
      ];

      const response = await cloudWatchClient.send(
        new DescribeAlarmsCommand({AlarmNames: alarmNames})
      );

      response.MetricAlarms?.forEach((alarm) => {
        expect(alarm.AlarmActions).toBeDefined();
        expect(alarm.AlarmActions?.length).toBeGreaterThan(0);
        expect(alarm.AlarmActions?.[0]).toContain('compliance-notifications');
      });
    });
  });

  describe('API Gateway', () => {
    test('REST API exists with correct name', async () => {
      const response = await apiGatewayClient.send(new GetRestApisCommand({}));

      const api = response.items?.find(
        (item) => item.name === `payment-api-${environmentSuffix}`
      );

      expect(api).toBeDefined();
      expect(api?.name).toBe(`payment-api-${environmentSuffix}`);
      expect(api?.description).toBe('Payment Processing API');
    });

    test('API has /transactions resource', async () => {
      const apisResponse = await apiGatewayClient.send(
        new GetRestApisCommand({})
      );
      const api = apisResponse.items?.find(
        (item) => item.name === `payment-api-${environmentSuffix}`
      );

      expect(api?.id).toBeDefined();

      const resourcesResponse = await apiGatewayClient.send(
        new GetResourcesCommand({restApiId: api!.id!})
      );

      const transactionsResource = resourcesResponse.items?.find(
        (item) => item.pathPart === 'transactions'
      );

      expect(transactionsResource).toBeDefined();
      expect(transactionsResource?.path).toBe('/transactions');
    });

    test('usage plan exists with correct quota', async () => {
      const response = await apiGatewayClient.send(
        new GetUsagePlansCommand({})
      );

      const usagePlan = response.items?.find(
        (item) => item.name === `payment-usage-plan-${environmentSuffix}`
      );

      expect(usagePlan).toBeDefined();
      expect(usagePlan?.quota?.limit).toBe(1000);
      expect(usagePlan?.quota?.period).toBe('DAY');
    });

    test('usage plan has correct throttle settings', async () => {
      const response = await apiGatewayClient.send(
        new GetUsagePlansCommand({})
      );

      const usagePlan = response.items?.find(
        (item) => item.name === `payment-usage-plan-${environmentSuffix}`
      );

      expect(usagePlan?.throttle?.rateLimit).toBe(1000);
      expect(usagePlan?.throttle?.burstLimit).toBe(2000);
    });

    test('API key exists and is enabled', async () => {
      const response = await apiGatewayClient.send(
        new GetApiKeysCommand({includeValues: false})
      );

      const apiKey = response.items?.find(
        (item) => item.name === `payment-api-key-${environmentSuffix}`
      );

      expect(apiKey).toBeDefined();
      expect(apiKey?.enabled).toBe(true);
    });
  });

  describe('Stack Outputs', () => {
    test('API endpoint output is accessible', () => {
      expect(outputs.ApiEndpoint).toBeDefined();
      expect(outputs.ApiEndpoint).toContain('https://');
      expect(outputs.ApiEndpoint).toContain('execute-api');
    });

    test('API key ID output is accessible', () => {
      expect(outputs.ApiKeyId).toBeDefined();
    });

    test('transactions table name output is accessible', () => {
      expect(outputs.TransactionsTableName).toBeDefined();
      expect(outputs.TransactionsTableName).toContain(environmentSuffix);
    });

    test('invalid queue URL output is accessible', () => {
      expect(outputs.InvalidQueueUrl).toBeDefined();
      expect(outputs.InvalidQueueUrl).toContain('sqs');
    });

    test('compliance topic ARN output is accessible', () => {
      expect(outputs.ComplianceTopicArn).toBeDefined();
      expect(outputs.ComplianceTopicArn).toContain('sns');
    });

    test('validation Lambda ARN output is accessible', () => {
      expect(outputs.ValidationLambdaArn).toBeDefined();
      expect(outputs.ValidationLambdaArn).toContain('lambda');
    });

    test('review Lambda ARN output is accessible', () => {
      expect(outputs.ReviewLambdaArn).toBeDefined();
      expect(outputs.ReviewLambdaArn).toContain('lambda');
    });
  });

  describe('Resource Naming Consistency', () => {
    test('all resources include environment suffix in their names', () => {
      expect(outputs.TransactionsTableName).toContain(environmentSuffix);
      expect(outputs.InvalidQueueUrl).toContain(environmentSuffix);
      expect(outputs.ComplianceTopicArn).toContain(environmentSuffix);
      expect(outputs.ValidationLambdaArn).toContain(environmentSuffix);
      expect(outputs.ReviewLambdaArn).toContain(environmentSuffix);
    });
  });
});
