// Integration tests for CloudFormation stack - dynamically discovers stack and resources
import fs from 'fs';
import path from 'path';
import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListStacksCommand,
  ListStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import { LambdaClient, InvokeCommand, GetFunctionCommand } from '@aws-sdk/client-lambda';
import { SNSClient, ListSubscriptionsByTopicCommand } from '@aws-sdk/client-sns';
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';

// Read region from lib/AWS_REGION file, fallback to environment variable, then default
function getAwsRegion(): string {
  // First priority: environment variable
  if (process.env.AWS_REGION) {
    return process.env.AWS_REGION;
  }

  // Second priority: read from lib/AWS_REGION file
  const awsRegionFile = path.join(__dirname, '../lib/AWS_REGION');
  if (fs.existsSync(awsRegionFile)) {
    try {
      const regionFromFile = fs.readFileSync(awsRegionFile, 'utf-8').trim();
      if (regionFromFile) {
        return regionFromFile;
      }
    } catch (error) {
      // Ignore file read errors and continue to next fallback
    }
  }

  // Default fallback
  return 'us-east-2';
}

const region = getAwsRegion();

// Discover stack name dynamically
async function discoverStackName(): Promise<string> {
  const cfnClient = new CloudFormationClient({ region });

  // First, try environment variable or constructed name
  if (process.env.STACK_NAME) {
    const stackName = process.env.STACK_NAME;
    try {
      const response = await cfnClient.send(
        new DescribeStacksCommand({ StackName: stackName })
      );
      if (response.Stacks && response.Stacks.length > 0) {
        const status = response.Stacks[0].StackStatus;
        if (status === 'CREATE_COMPLETE' || status === 'UPDATE_COMPLETE') {
          return stackName;
        }
      }
    } catch (error) {
      // Stack not found, continue to discovery
    }
  }

  // Try ENVIRONMENT_SUFFIX
  if (process.env.ENVIRONMENT_SUFFIX) {
    const stackName = `TapStack${process.env.ENVIRONMENT_SUFFIX}`;
    try {
      const response = await cfnClient.send(
        new DescribeStacksCommand({ StackName: stackName })
      );
      if (response.Stacks && response.Stacks.length > 0) {
        const status = response.Stacks[0].StackStatus;
        if (status === 'CREATE_COMPLETE' || status === 'UPDATE_COMPLETE') {
          return stackName;
        }
      }
    } catch (error) {
      // Stack not found, continue to discovery
    }
  }

  // Fallback: Find all TapStack* stacks and use the most recent one
  const listResponse = await cfnClient.send(
    new ListStacksCommand({
      StackStatusFilter: ['CREATE_COMPLETE', 'UPDATE_COMPLETE'],
    })
  );

  const tapStacks = (listResponse.StackSummaries || [])
    .filter((stack) => stack.StackName?.startsWith('TapStack'))
    .sort((a, b) => {
      const aTime = a.CreationTime?.getTime() || 0;
      const bTime = b.CreationTime?.getTime() || 0;
      return bTime - aTime; // Newest first
    });

  if (tapStacks.length === 0) {
    throw new Error(
      'No TapStack found. Please deploy the stack first using: ./scripts/deploy.sh'
    );
  }

  const stackName = tapStacks[0].StackName;
  if (!stackName) {
    throw new Error('Could not determine stack name');
  }

  return stackName;
}

// Get stack outputs dynamically from CloudFormation
async function getStackOutputs(
  stackName: string
): Promise<Record<string, string>> {
  const cfnClient = new CloudFormationClient({ region });
  const response = await cfnClient.send(
    new DescribeStacksCommand({ StackName: stackName })
  );

  if (!response.Stacks || response.Stacks.length === 0) {
    throw new Error(`Stack ${stackName} not found`);
  }

  const stack = response.Stacks[0];
  const outputs: Record<string, string> = {};

  if (stack.Outputs) {
    for (const output of stack.Outputs) {
      if (output.OutputKey && output.OutputValue) {
        outputs[output.OutputKey] = output.OutputValue;
      }
    }
  }

  return outputs;
}

// Discover stack resources dynamically
async function getStackResources(stackName: string) {
  const cfnClient = new CloudFormationClient({ region });
  const response = await cfnClient.send(
    new ListStackResourcesCommand({ StackName: stackName })
  );

  const resources: Record<string, any> = {};
  if (response.StackResourceSummaries) {
    for (const resource of response.StackResourceSummaries) {
      if (resource.LogicalResourceId && resource.PhysicalResourceId) {
        resources[resource.LogicalResourceId] = {
          type: resource.ResourceType,
          physicalId: resource.PhysicalResourceId,
          status: resource.ResourceStatus,
        };
      }
    }
  }

  return resources;
}

describe('Serverless Cryptocurrency Alert System - Integration Tests', () => {
  let stackName: string;
  let outputs: Record<string, string>;
  let resources: Record<string, any>;
  let dynamoDBClient: DynamoDBClient;
  let lambdaClient: LambdaClient;
  let snsClient: SNSClient;
  let sqsClient: SQSClient;
  let logsClient: CloudWatchLogsClient;

  beforeAll(async () => {
    // Discover stack name dynamically
    stackName = await discoverStackName();
    console.log(`Discovered stack: ${stackName} in region: ${region}`);

    // Get stack outputs dynamically
    outputs = await getStackOutputs(stackName);
    console.log(`Discovered ${Object.keys(outputs).length} stack outputs:`, Object.keys(outputs));

    // Discover stack resources
    resources = await getStackResources(stackName);
    console.log(`Discovered ${Object.keys(resources).length} stack resources`);

    // Initialize AWS clients
    dynamoDBClient = new DynamoDBClient({ region });
    lambdaClient = new LambdaClient({ region });
    snsClient = new SNSClient({ region });
    sqsClient = new SQSClient({ region });
    logsClient = new CloudWatchLogsClient({ region });

    // Verify required outputs exist
    const requiredOutputs = [
      'AlertIngestionFunctionArn',
      'AlertProcessingFunctionArn',
      'AlertsTableName',
      'CriticalAlertsTopicArn',
      'IngestionDLQUrl',
      'ProcessingDLQUrl',
    ];

    for (const key of requiredOutputs) {
      if (!outputs[key]) {
        throw new Error(`Required output ${key} not found in stack outputs`);
      }
    }
  }, 60000);

  describe('Stack Discovery and Outputs', () => {
    test('Stack name is discovered dynamically', () => {
      expect(stackName).toBeTruthy();
      expect(stackName).toMatch(/^TapStack/);
    });

    test('Stack outputs are loaded dynamically', () => {
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('should have all required outputs', () => {
      expect(outputs.AlertIngestionFunctionArn).toBeDefined();
      expect(outputs.AlertProcessingFunctionArn).toBeDefined();
      expect(outputs.AlertsTableName).toBeDefined();
      expect(outputs.CriticalAlertsTopicArn).toBeDefined();
      expect(outputs.IngestionDLQUrl).toBeDefined();
      expect(outputs.ProcessingDLQUrl).toBeDefined();
    });

    test('Lambda function ARNs should be valid', () => {
      expect(outputs.AlertIngestionFunctionArn).toMatch(/^arn:aws:lambda:[a-z0-9-]+:\d+:function:alert-ingestion-.+$/);
      expect(outputs.AlertProcessingFunctionArn).toMatch(/^arn:aws:lambda:[a-z0-9-]+:\d+:function:alert-processing-.+$/);
    });

    test('SNS topic ARN should be valid', () => {
      expect(outputs.CriticalAlertsTopicArn).toMatch(/^arn:aws:sns:[a-z0-9-]+:\d+:critical-alerts-.+$/);
    });

    test('DLQ URLs should be valid', () => {
      expect(outputs.IngestionDLQUrl).toMatch(/^https:\/\/sqs\.[a-z0-9-]+\.amazonaws\.com\/\d+\/alert-ingestion-dlq-.+$/);
      expect(outputs.ProcessingDLQUrl).toMatch(/^https:\/\/sqs\.[a-z0-9-]+\.amazonaws\.com\/\d+\/alert-processing-dlq-.+$/);
    });
  });

  describe('Stack Resources Discovery', () => {
    test('Stack resources are discovered dynamically', () => {
      expect(resources).toBeDefined();
      expect(Object.keys(resources).length).toBeGreaterThan(0);
    });

    test('Should have DynamoDB table resource', () => {
      expect(resources.AlertsTable).toBeDefined();
      expect(resources.AlertsTable.type).toBe('AWS::DynamoDB::Table');
      expect(resources.AlertsTable.physicalId).toBe(outputs.AlertsTableName);
    });

    test('Should have Lambda function resources', () => {
      expect(resources.AlertIngestionFunction).toBeDefined();
      expect(resources.AlertIngestionFunction.type).toBe('AWS::Lambda::Function');
      expect(resources.AlertProcessingFunction).toBeDefined();
      expect(resources.AlertProcessingFunction.type).toBe('AWS::Lambda::Function');
    });

    test('Should have SNS topic resource', () => {
      expect(resources.CriticalAlertsTopic).toBeDefined();
      expect(resources.CriticalAlertsTopic.type).toBe('AWS::SNS::Topic');
    });

    test('Should have SQS queue resources', () => {
      expect(resources.IngestionDLQ).toBeDefined();
      expect(resources.IngestionDLQ.type).toBe('AWS::SQS::Queue');
      expect(resources.ProcessingDLQ).toBeDefined();
      expect(resources.ProcessingDLQ.type).toBe('AWS::SQS::Queue');
    });
  });

  describe('DynamoDB Table', () => {
    test('should be able to write and read alert data', async () => {
      const alertId = `test-alert-${Date.now()}`;
      const timestamp = Date.now();

      await dynamoDBClient.send(
        new PutItemCommand({
          TableName: outputs.AlertsTableName,
          Item: {
            AlertId: { S: alertId },
            Timestamp: { N: timestamp.toString() },
            cryptocurrency: { S: 'BTC' },
            price: { N: '50000' },
            status: { S: 'test' },
          },
        })
      );

      const result = await dynamoDBClient.send(
        new GetItemCommand({
          TableName: outputs.AlertsTableName,
          Key: {
            AlertId: { S: alertId },
            Timestamp: { N: timestamp.toString() },
          },
        })
      );

      expect(result.Item).toBeDefined();
      expect(result.Item?.AlertId.S).toBe(alertId);
      expect(result.Item?.cryptocurrency.S).toBe('BTC');
    }, 30000);

    test('should be able to query alerts by AlertId', async () => {
      const alertId = `query-test-${Date.now()}`;
      const timestamp = Date.now();

      await dynamoDBClient.send(
        new PutItemCommand({
          TableName: outputs.AlertsTableName,
          Item: {
            AlertId: { S: alertId },
            Timestamp: { N: timestamp.toString() },
            cryptocurrency: { S: 'ETH' },
            price: { N: '3000' },
            status: { S: 'test' },
          },
        })
      );

      const queryResult = await dynamoDBClient.send(
        new QueryCommand({
          TableName: outputs.AlertsTableName,
          KeyConditionExpression: 'AlertId = :alertId',
          ExpressionAttributeValues: {
            ':alertId': { S: alertId },
          },
        })
      );

      expect(queryResult.Items).toBeDefined();
      expect(queryResult.Items?.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Lambda Functions', () => {
    test('AlertIngestionFunction should have correct configuration', async () => {
      const functionName = outputs.AlertIngestionFunctionArn.split(':').pop();
      const result = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName!,
        })
      );

      expect(result.Configuration?.Runtime).toBe('python3.11');
      expect(result.Configuration?.Architectures).toContain('arm64');
      expect(result.Concurrency?.ReservedConcurrentExecutions).toBeUndefined();
      expect(result.Configuration?.Environment?.Variables?.TABLE_NAME).toBe(outputs.AlertsTableName);
      expect(result.Configuration?.DeadLetterConfig?.TargetArn).toBeDefined();
    }, 30000);

    test('AlertProcessingFunction should have correct configuration', async () => {
      const functionName = outputs.AlertProcessingFunctionArn.split(':').pop();
      const result = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName!,
        })
      );

      expect(result.Configuration?.Runtime).toBe('python3.11');
      expect(result.Configuration?.Architectures).toContain('arm64');
      expect(result.Concurrency?.ReservedConcurrentExecutions).toBeUndefined();
      expect(result.Configuration?.Environment?.Variables?.TABLE_NAME).toBe(outputs.AlertsTableName);
      expect(result.Configuration?.Environment?.Variables?.SNS_TOPIC_ARN).toBe(outputs.CriticalAlertsTopicArn);
      expect(result.Configuration?.DeadLetterConfig?.TargetArn).toBeDefined();
    }, 30000);

    test('AlertIngestionFunction should successfully ingest alerts', async () => {
      const testAlert = {
        body: JSON.stringify({
          alertId: `lambda-test-${Date.now()}`,
          cryptocurrency: 'BTC',
          price: 45000,
          threshold: 40000,
        }),
      };

      const result = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: outputs.AlertIngestionFunctionArn,
          Payload: JSON.stringify(testAlert),
        })
      );

      const response = JSON.parse(new TextDecoder().decode(result.Payload));
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).message).toContain('ingested successfully');
    }, 30000);

    test('AlertProcessingFunction should process alerts below $1000', async () => {
      const testAlert = {
        alertId: `process-test-low-${Date.now()}`,
        cryptocurrency: 'ETH',
        price: 500,
        timestamp: Date.now(),
      };

      const result = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: outputs.AlertProcessingFunctionArn,
          Payload: JSON.stringify(testAlert),
        })
      );

      const response = JSON.parse(new TextDecoder().decode(result.Payload));
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).message).toContain('processed successfully');
    }, 30000);

    test('AlertProcessingFunction should process high-value alerts above $1000', async () => {
      const testAlert = {
        alertId: `process-test-high-${Date.now()}`,
        cryptocurrency: 'BTC',
        price: 55000,
        timestamp: Date.now(),
      };

      const result = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: outputs.AlertProcessingFunctionArn,
          Payload: JSON.stringify(testAlert),
        })
      );

      const response = JSON.parse(new TextDecoder().decode(result.Payload));
      expect(response.statusCode).toBe(200);
    }, 30000);
  });

  describe('SNS Topic', () => {
    test('should have email subscription', async () => {
      const result = await snsClient.send(
        new ListSubscriptionsByTopicCommand({
          TopicArn: outputs.CriticalAlertsTopicArn,
        })
      );

      expect(result.Subscriptions).toBeDefined();
      expect(result.Subscriptions?.length).toBeGreaterThan(0);
      expect(result.Subscriptions?.[0].Protocol).toBe('email');
    }, 30000);
  });

  describe('Dead Letter Queues', () => {
    test('IngestionDLQ should have correct retention period', async () => {
      const result = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: outputs.IngestionDLQUrl,
          AttributeNames: ['MessageRetentionPeriod'],
        })
      );

      expect(result.Attributes?.MessageRetentionPeriod).toBe('1209600');
    }, 30000);

    test('ProcessingDLQ should have correct retention period', async () => {
      const result = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: outputs.ProcessingDLQUrl,
          AttributeNames: ['MessageRetentionPeriod'],
        })
      );

      expect(result.Attributes?.MessageRetentionPeriod).toBe('1209600');
    }, 30000);
  });

  describe('CloudWatch Log Groups', () => {
    test('should have log groups for both Lambda functions', async () => {
      // Extract environment suffix from function ARN
      const functionName = outputs.AlertIngestionFunctionArn.split(':').pop() || '';
      const environmentSuffix = functionName.split('-').pop() || 'dev';
      const ingestionLogGroupName = `/aws/lambda/alert-ingestion-${environmentSuffix}`;
      const processingLogGroupName = `/aws/lambda/alert-processing-${environmentSuffix}`;

      const result = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: '/aws/lambda/alert-',
        })
      );

      const logGroupNames = result.logGroups?.map((lg) => lg.logGroupName) || [];
      expect(logGroupNames).toContain(ingestionLogGroupName);
      expect(logGroupNames).toContain(processingLogGroupName);

      const ingestionLogGroup = result.logGroups?.find(
        (lg) => lg.logGroupName === ingestionLogGroupName
      );
      const processingLogGroup = result.logGroups?.find(
        (lg) => lg.logGroupName === processingLogGroupName
      );

      expect(ingestionLogGroup?.retentionInDays).toBe(3);
      expect(processingLogGroup?.retentionInDays).toBe(3);
    }, 30000);
  });

  describe('End-to-End Alert Processing Flow', () => {
    test('should process alert from ingestion to storage', async () => {
      const alertId = `e2e-test-${Date.now()}`;
      const testAlert = {
        body: JSON.stringify({
          alertId: alertId,
          cryptocurrency: 'BTC',
          price: 48000,
          threshold: 45000,
        }),
      };

      const ingestionResult = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: outputs.AlertIngestionFunctionArn,
          Payload: JSON.stringify(testAlert),
        })
      );

      const ingestionResponse = JSON.parse(new TextDecoder().decode(ingestionResult.Payload));
      expect(ingestionResponse.statusCode).toBe(200);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const queryResult = await dynamoDBClient.send(
        new QueryCommand({
          TableName: outputs.AlertsTableName,
          KeyConditionExpression: 'AlertId = :alertId',
          ExpressionAttributeValues: {
            ':alertId': { S: alertId },
          },
        })
      );

      expect(queryResult.Items?.length).toBeGreaterThan(0);
      expect(queryResult.Items?.[0].AlertId.S).toBe(alertId);
    }, 30000);

    test('should handle complete workflow for high-value alerts', async () => {
      const alertId = `e2e-high-value-${Date.now()}`;
      const timestamp = Date.now();

      await dynamoDBClient.send(
        new PutItemCommand({
          TableName: outputs.AlertsTableName,
          Item: {
            AlertId: { S: alertId },
            Timestamp: { N: timestamp.toString() },
            cryptocurrency: { S: 'BTC' },
            price: { N: '60000' },
            status: { S: 'ingested' },
          },
        })
      );

      const processingAlert = {
        alertId: alertId,
        AlertId: alertId,
        timestamp: timestamp,
        Timestamp: timestamp,
        cryptocurrency: 'BTC',
        price: 60000,
      };

      const processingResult = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: outputs.AlertProcessingFunctionArn,
          Payload: JSON.stringify(processingAlert),
        })
      );

      const processingResponse = JSON.parse(new TextDecoder().decode(processingResult.Payload));
      expect(processingResponse.statusCode).toBe(200);
    }, 30000);
  });

  describe('Resource Isolation and Naming', () => {
    test('all resources should use unique environment suffix', () => {
      const extractSuffix = (arn: string) => {
        const parts = arn.split(/[-:]/);
        return parts[parts.length - 1];
      };

      const ingestionSuffix = extractSuffix(outputs.AlertIngestionFunctionArn);
      const processingSuffix = extractSuffix(outputs.AlertProcessingFunctionArn);

      expect(ingestionSuffix).toBeTruthy();
      expect(processingSuffix).toBeTruthy();
      expect(outputs.AlertsTableName).toContain(ingestionSuffix);
      expect(outputs.CriticalAlertsTopicArn).toContain(ingestionSuffix);
    });
  });
});
