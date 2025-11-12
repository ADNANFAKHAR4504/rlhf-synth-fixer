import {
  DynamoDBClient,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { SNSClient, ListSubscriptionsByTopicCommand } from '@aws-sdk/client-sns';
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Integration tests for deployed Webhook infrastructure
 * Uses real AWS resources and deployment outputs
 */
describe('Webhook Infrastructure Integration Tests', () => {
  let outputs: any;
  let region = process.env.AWS_REGION ?? 'us-east-1';
  let environmentSuffix = 'dev';

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Outputs file not found: ${outputsPath}`);
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
    console.log('Loaded deployment outputs:', Object.keys(outputs));

    if (typeof outputs.region === 'string' && outputs.region.trim().length > 0) {
      region = outputs.region;
    } else if (
      typeof outputs.region_output === 'string' &&
      outputs.region_output.trim().length > 0
    ) {
      region = outputs.region_output;
    }

    if (
      typeof outputs.environmentSuffix === 'string' &&
      outputs.environmentSuffix.trim().length > 0
    ) {
      environmentSuffix = outputs.environmentSuffix;
    }
  });

  const extractApiIdFromUrl = (url: string): string => {
    const match = url.match(
      /^https:\/\/([^.]+)\.execute-api\.[^.]+\.amazonaws\.com\/[a-zA-Z0-9_-]+/
    );
    if (!match) {
      throw new Error(`Unable to extract API ID from URL: ${url}`);
    }
    return match[1];
  };

  const escapeForRegex = (value: string): string =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  describe('DynamoDB Table Integration', () => {
    let dynamoClient: DynamoDBClient;

    beforeAll(() => {
      dynamoClient = new DynamoDBClient({ region });
    });

    afterAll(() => {
      dynamoClient.destroy();
    });

    it('should verify DynamoDB table is accessible', async () => {
      const tableName = outputs.dynamoTableName;
      expect(tableName).toBeDefined();
      expect(tableName).toContain('webhook-events');

      // Try to scan the table (even if empty)
      const scanCommand = new ScanCommand({
        TableName: tableName,
        Limit: 1,
      });

      await expect(dynamoClient.send(scanCommand)).resolves.toBeDefined();
    }, 30000);

    it('should allow querying by partition key', async () => {
      const tableName = outputs.dynamoTableName;

      // Query with a non-existent eventId (structure validation only)
      const queryCommand = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'eventId = :eventId',
        ExpressionAttributeValues: {
          ':eventId': { S: 'test-event-id' },
        },
        Limit: 1,
      });

      const result = await dynamoClient.send(queryCommand);
      expect(result).toBeDefined();
      expect(result.Items).toBeDefined();
    }, 30000);
  });

  describe('Lambda Function Integration', () => {
    let lambdaClient: LambdaClient;

    beforeAll(() => {
      lambdaClient = new LambdaClient({ region });
    });

    afterAll(() => {
      lambdaClient.destroy();
    });

    it('should verify Lambda function exists and is configured correctly', async () => {
      const functionName = outputs.lambdaFunctionName;
      expect(functionName).toBeDefined();
      expect(functionName).toContain('webhook-processor');

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.Runtime).toBe('nodejs18.x');
      expect(response.Configuration!.Timeout).toBe(30);
      expect(response.Configuration!.MemorySize).toBe(512);
      expect(response.Configuration!.TracingConfig?.Mode).toBe('Active');
    }, 30000);

    it('should have correct environment variables', async () => {
      const functionName = outputs.lambdaFunctionName;

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      const envVars = response.Configuration!.Environment!.Variables;

      expect(envVars).toBeDefined();
      expect(envVars!.DYNAMODB_TABLE).toBe(outputs.dynamoTableName);
      expect(envVars!.SNS_TOPIC_ARN).toBe(outputs.snsTopicArn);
      expect(envVars!.AWS_REGION).toBeUndefined(); // Should not be set explicitly
    }, 30000);

    it('should have dead letter queue configured', async () => {
      const functionName = outputs.lambdaFunctionName;

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration!.DeadLetterConfig).toBeDefined();
      expect(response.Configuration!.DeadLetterConfig!.TargetArn).toContain('webhook-dlq');
    }, 30000);

    it('should invoke Lambda with valid webhook payload', async () => {
      const functionName = outputs.lambdaFunctionName;

      const testPayload = {
        body: JSON.stringify({
          source: 'integration-test',
          data: {
            message: 'Test webhook event',
            timestamp: new Date().toISOString(),
          },
        }),
      };

      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: Buffer.from(JSON.stringify(testPayload)),
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);

      if (response.Payload) {
        const result = JSON.parse(Buffer.from(response.Payload).toString());
        expect(result.statusCode).toBe(200);

        const body = JSON.parse(result.body);
        expect(body.success).toBe(true);
        expect(body.eventId).toBeDefined();
        expect(body.timestamp).toBeDefined();
      }
    }, 30000);

    it('should return 400 for invalid payload', async () => {
      const functionName = outputs.lambdaFunctionName;

      const invalidPayload = {
        body: JSON.stringify({
          source: 'integration-test',
          // Missing 'data' field
        }),
      };

      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: Buffer.from(JSON.stringify(invalidPayload)),
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200); // Lambda invoked successfully

      if (response.Payload) {
        const result = JSON.parse(Buffer.from(response.Payload).toString());
        expect(result.statusCode).toBe(400);
      }
    }, 30000);
  });

  describe('API Gateway Integration', () => {
    let apiClient: APIGatewayClient;

    beforeAll(() => {
      apiClient = new APIGatewayClient({ region });
    });

    afterAll(() => {
      apiClient.destroy();
    });

    it('should verify API Gateway REST API exists', async () => {
      const apiUrl = outputs.apiUrl;
      expect(apiUrl).toBeDefined();

      const apiId = extractApiIdFromUrl(apiUrl);

      const command = new GetRestApiCommand({
        restApiId: apiId,
      });

      const response = await apiClient.send(command);
      expect(response.name).toContain('webhook-api');
      expect(response.endpointConfiguration?.types).toContain('EDGE');
    }, 30000);

    it('should verify API Gateway stage configuration', async () => {
      const apiUrl = outputs.apiUrl;
      const apiId = extractApiIdFromUrl(apiUrl);

      const command = new GetStageCommand({
        restApiId: apiId,
        stageName: 'prod',
      });

      const response = await apiClient.send(command);
      expect(response.stageName).toBe('prod');
      expect(response.tracingEnabled).toBe(true);
    }, 30000);
  });

  describe('CloudWatch Logs Integration', () => {
    let logsClient: CloudWatchLogsClient;

    beforeAll(() => {
      logsClient = new CloudWatchLogsClient({ region });
    });

    afterAll(() => {
      logsClient.destroy();
    });

    it('should verify CloudWatch Log Group exists with correct retention', async () => {
      const logGroupName = outputs.lambdaLogGroupName;
      expect(logGroupName).toBeDefined();
      expect(logGroupName).toContain('/aws/lambda/webhook-processor');

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
      expect(response.logGroups![0].retentionInDays).toBe(7);
    }, 30000);
  });

  describe('CloudWatch Alarms Integration', () => {
    let cloudwatchClient: CloudWatchClient;

    beforeAll(() => {
      cloudwatchClient = new CloudWatchClient({ region });
    });

    afterAll(() => {
      cloudwatchClient.destroy();
    });

    it('should verify CloudWatch alarm exists with correct configuration', async () => {
      const alarmName = outputs.lambdaErrorAlarmName;
      expect(alarmName).toBeDefined();
      expect(alarmName).toContain('webhook-error-alarm');

      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });

      const response = await cloudwatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('Errors');
      expect(alarm.Namespace).toBe('AWS/Lambda');
      expect(alarm.Period).toBe(300); // 5 minutes
      expect(alarm.Threshold).toBe(5);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    }, 30000);
  });

  describe('SNS Topic Integration', () => {
    let snsClient: SNSClient;

    beforeAll(() => {
      snsClient = new SNSClient({ region });
    });

    afterAll(() => {
      snsClient.destroy();
    });

    it('should verify SNS topic has email subscription', async () => {
      const topicArn = outputs.snsTopicArn;
      expect(topicArn).toBeDefined();
      expect(topicArn).toContain('webhook-failures');

      const command = new ListSubscriptionsByTopicCommand({
        TopicArn: topicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Subscriptions).toBeDefined();
      expect(response.Subscriptions!.length).toBeGreaterThan(0);
      expect(response.Subscriptions![0].Protocol).toBe('email');
    }, 30000);
  });

  describe('SQS Dead Letter Queue Integration', () => {
    let sqsClient: SQSClient;

    beforeAll(() => {
      sqsClient = new SQSClient({ region });
    });

    afterAll(() => {
      sqsClient.destroy();
    });

    it('should verify DLQ configuration', async () => {
      const dlqUrl = outputs.dlqUrl;
      expect(dlqUrl).toBeDefined();
      expect(dlqUrl).toContain('webhook-dlq');

      const command = new GetQueueAttributesCommand({
        QueueUrl: dlqUrl,
        AttributeNames: ['MessageRetentionPeriod', 'KmsMasterKeyId'],
      });

      const response = await sqsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.MessageRetentionPeriod).toBe('1209600'); // 14 days
      expect(response.Attributes!.KmsMasterKeyId).toBeDefined();
    }, 30000);
  });

  describe('End-to-End Webhook Flow', () => {
    let dynamoClient: DynamoDBClient;
    let lambdaClient: LambdaClient;

    beforeAll(() => {
      dynamoClient = new DynamoDBClient({ region });
      lambdaClient = new LambdaClient({ region });
    });

    afterAll(() => {
      dynamoClient.destroy();
      lambdaClient.destroy();
    });

    it('should process webhook end-to-end and store in DynamoDB', async () => {
      const functionName = outputs.lambdaFunctionName;
      const tableName = outputs.dynamoTableName;

      // 1. Invoke Lambda with valid payload
      const testSource = `e2e-test-${Date.now()}`;
      const testPayload = {
        body: JSON.stringify({
          source: testSource,
          data: {
            test: 'end-to-end integration test',
            timestamp: new Date().toISOString(),
          },
        }),
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: functionName,
        Payload: Buffer.from(JSON.stringify(testPayload)),
      });

      const invokeResponse = await lambdaClient.send(invokeCommand);
      expect(invokeResponse.StatusCode).toBe(200);

      // 2. Parse response to get eventId
      const result = JSON.parse(Buffer.from(invokeResponse.Payload!).toString());
      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.body);
      const eventId = body.eventId;
      expect(eventId).toBeDefined();
      expect(eventId).toContain(testSource);

      // 3. Wait a bit for DynamoDB write
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 4. Query DynamoDB to verify event was stored
      const queryCommand = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'eventId = :eventId',
        ExpressionAttributeValues: {
          ':eventId': { S: eventId },
        },
      });

      const queryResponse = await dynamoClient.send(queryCommand);
      expect(queryResponse.Items).toBeDefined();
      expect(queryResponse.Items!.length).toBe(1);

      const storedEvent = queryResponse.Items![0];
      expect(storedEvent.eventId.S).toBe(eventId);
      expect(storedEvent.source.S).toBe(testSource);
      expect(storedEvent.data.S).toBeDefined();
    }, 45000);
  });

  describe('API Gateway Live Endpoint', () => {
    it(
      'should accept webhook payloads via HTTPS endpoint',
      async () => {
        const apiEndpoint = outputs.apiEndpoint;
        expect(apiEndpoint).toBeDefined();

        const source = `http-e2e-${Date.now()}`;
        const response = await axios.post(
          apiEndpoint,
          {
            source,
            data: {
              action: 'live-int-test',
              at: new Date().toISOString(),
            },
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 20000,
          }
        );

        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
        expect(response.data.success).toBe(true);
        expect(response.data.eventId).toContain(source);
      },
      30000
    );
  });

  describe('Deployment Outputs Validation', () => {
    it('should have correct resource naming with environmentSuffix', () => {
      expect(environmentSuffix).toBeDefined();
      const suffixPattern = new RegExp(escapeForRegex(environmentSuffix));

      expect(outputs.dynamoTableName).toMatch(suffixPattern);
      expect(outputs.lambdaFunctionName).toMatch(suffixPattern);
      expect(outputs.dlqUrl).toMatch(suffixPattern);
      expect(outputs.snsTopicArn).toMatch(suffixPattern);
    });

    it('should have correct API endpoint format', () => {
      const endpointPattern = new RegExp(
        `^https://[a-z0-9]+\\.execute-api\\.${escapeForRegex(region)}\\.amazonaws\\.com/[^/]+/webhook$`
      );
      expect(outputs.apiEndpoint).toMatch(endpointPattern);
    });
  });
});
