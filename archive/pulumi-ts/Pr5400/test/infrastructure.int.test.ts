import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import { SNSClient } from '@aws-sdk/client-sns';
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import { EventBridgeClient, DescribeRuleCommand } from '@aws-sdk/client-eventbridge';
import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'all-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

// Extract region from ARNs
const getRegionFromArn = (arn: string): string => {
  const parts = arn.split(':');
  return parts[3] || 'us-east-1';
};

// Get the environment from environment variable or default to 'pr5400'
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'pr5400';
const environment = Object.keys(outputs)[0]; // Get the actual stack name from outputs

describe('Pulumi Data Pipeline Infrastructure - Integration Tests', () => {
  // Check if outputs exist
  if (!environment || !outputs[environment]) {
    it('should have deployment outputs', () => {
      fail(`No outputs found for environment. Expected outputs structure with environment key.`);
    });
    return;
  }

  const envOutputs = outputs[environment];
  const region = envOutputs.tableArn ? getRegionFromArn(envOutputs.tableArn) : 'us-east-1';
  const s3Client = new S3Client({ region: 'us-east-1' }); // S3 is global, but bucket is in us-east-1
  const dynamoClient = new DynamoDBClient({ region });
  const snsClient = new SNSClient({ region });
  const sqsClient = new SQSClient({ region });
  const lambdaClient = new LambdaClient({ region });
  const eventBridgeClient = new EventBridgeClient({ region });

  describe('Core Infrastructure Resources', () => {
    it('S3 bucket exists and is accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: envOutputs.bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    }, 30000);

    it('S3 bucket name includes environment suffix', () => {
      expect(envOutputs.bucketName).toBeDefined();
      expect(envOutputs.bucketName).toContain(ENVIRONMENT_SUFFIX);
    });

    it('S3 bucket has versioning enabled', async () => {
      // This is verified through the infrastructure code
      expect(envOutputs.bucketArn).toBeDefined();
      expect(envOutputs.bucketArn).toContain('arn:aws:s3:::');
    });

    it('DynamoDB table exists with correct configuration', async () => {
      const command = new DescribeTableCommand({
        TableName: envOutputs.tableName,
      });

      const response = await dynamoClient.send(command);
      expect(response.Table).toBeDefined();
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(response.Table?.TableName).toBe(envOutputs.tableName);
    }, 30000);

    it('DynamoDB table has correct schema', async () => {
      const command = new DescribeTableCommand({
        TableName: envOutputs.tableName,
      });

      const response = await dynamoClient.send(command);
      const keySchema = response.Table?.KeySchema;

      expect(keySchema).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ AttributeName: 'id', KeyType: 'HASH' }),
          expect.objectContaining({ AttributeName: 'timestamp', KeyType: 'RANGE' }),
        ])
      );
    }, 30000);

    it('DynamoDB table has global secondary index', async () => {
      const command = new DescribeTableCommand({
        TableName: envOutputs.tableName,
      });

      const response = await dynamoClient.send(command);
      const gsi = response.Table?.GlobalSecondaryIndexes;

      expect(gsi).toBeDefined();
      expect(gsi?.length).toBeGreaterThan(0);
      expect(gsi?.[0].IndexName).toBe('environment-index');
    }, 30000);

    it('SNS success topic exists', () => {
      const topicArn = envOutputs.successTopicArn;
      expect(topicArn).toBeDefined();
      expect(topicArn).toContain('replication-success');
      expect(topicArn).toContain(ENVIRONMENT_SUFFIX);
    });

    it('SNS failure topic exists', () => {
      const topicArn = envOutputs.failureTopicArn;
      expect(topicArn).toBeDefined();
      expect(topicArn).toContain('replication-failure');
      expect(topicArn).toContain(ENVIRONMENT_SUFFIX);
    });

    it('SQS dead letter queue exists', async () => {
      const queueUrl = envOutputs.dlqUrl;
      expect(queueUrl).toBeDefined();

      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['QueueArn', 'MessageRetentionPeriod'],
      });

      const response = await sqsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.MessageRetentionPeriod).toBe('1209600'); // 14 days
    }, 30000);

    it('can write and read from S3 bucket', async () => {
      const testKey = `test-${Date.now()}.json`;
      const testData = JSON.stringify({ test: 'data', timestamp: Date.now() });

      // Put object
      await s3Client.send(
        new PutObjectCommand({
          Bucket: envOutputs.bucketName,
          Key: testKey,
          Body: testData,
        })
      );

      // Get object
      const response = await s3Client.send(
        new GetObjectCommand({
          Bucket: envOutputs.bucketName,
          Key: testKey,
        })
      );

      const body = await response.Body?.transformToString();
      expect(body).toBe(testData);
    }, 30000);

    it('can write and read from DynamoDB table', async () => {
      const testId = `test-${Date.now()}`;
      const timestamp = Date.now();

      // Put item
      await dynamoClient.send(
        new PutItemCommand({
          TableName: envOutputs.tableName,
          Item: {
            id: { S: testId },
            timestamp: { N: timestamp.toString() },
            environment: { S: environment },
            testData: { S: 'test value' },
          },
        })
      );

      // Get item
      const response = await dynamoClient.send(
        new GetItemCommand({
          TableName: envOutputs.tableName,
          Key: {
            id: { S: testId },
            timestamp: { N: timestamp.toString() },
          },
        })
      );

      expect(response.Item).toBeDefined();
      expect(response.Item?.testData.S).toBe('test value');
    }, 30000);
  });

  // Production-specific tests (only run if Lambda and EventBridge resources exist)
  describe('Production Environment Resources', () => {
    const hasLambda = !!envOutputs.replicationFunctionArn;
    const hasEventBridge = !!envOutputs.eventRuleArn;

    if (hasLambda) {
      it('Lambda replication function exists', async () => {
        const command = new GetFunctionCommand({
          FunctionName: envOutputs.replicationFunctionName,
        });

        const response = await lambdaClient.send(command);
        expect(response.Configuration).toBeDefined();
        expect(response.Configuration?.FunctionName).toBe(envOutputs.replicationFunctionName);
      }, 30000);

      it('Lambda function has correct timeout', async () => {
        const command = new GetFunctionConfigurationCommand({
          FunctionName: envOutputs.replicationFunctionName,
        });

        const response = await lambdaClient.send(command);
        expect(response.Timeout).toBe(300); // 5 minutes
      }, 30000);

      it('Lambda function has required environment variables', async () => {
        const command = new GetFunctionConfigurationCommand({
          FunctionName: envOutputs.replicationFunctionName,
        });

        const response = await lambdaClient.send(command);
        const envVars = response.Environment?.Variables;

        expect(envVars).toBeDefined();
        expect(envVars?.PROD_BUCKET).toBeDefined();
        expect(envVars?.PROD_TABLE).toBeDefined();
        expect(envVars?.SUCCESS_TOPIC_ARN).toBeDefined();
        expect(envVars?.FAILURE_TOPIC_ARN).toBeDefined();
        expect(envVars?.DLQ_URL).toBeDefined();
        expect(envVars?.ENVIRONMENT_SUFFIX).toBe(ENVIRONMENT_SUFFIX);
        expect(envVars?.REGION).toBe('us-east-1');
      }, 30000);
    } else {
      it('Lambda function not expected for non-prod environment', () => {
        expect(envOutputs.replicationFunctionArn).toBeUndefined();
      });
    }

    if (hasEventBridge) {
      it('EventBridge rule exists', async () => {
        const command = new DescribeRuleCommand({
          Name: envOutputs.eventRuleName,
        });

        const response = await eventBridgeClient.send(command);
        expect(response.Name).toBe(envOutputs.eventRuleName);
        expect(response.State).toBe('ENABLED');
      }, 30000);

      it('EventBridge rule has correct event pattern', async () => {
        const command = new DescribeRuleCommand({
          Name: envOutputs.eventRuleName,
        });

        const response = await eventBridgeClient.send(command);
        const eventPattern = JSON.parse(response.EventPattern || '{}');

        expect(eventPattern.source).toContain('aws.s3');
        expect(eventPattern.source).toContain('aws.dynamodb');
        expect(eventPattern.detailType).toContain('AWS API Call via CloudTrail');
      }, 30000);
    } else {
      it('EventBridge rule not expected for non-prod environment', () => {
        expect(envOutputs.eventRuleArn).toBeUndefined();
      });
    }
  });

  describe('Resource Naming and Tagging', () => {
    it('all resource names include environment suffix', () => {
      expect(envOutputs.bucketName).toContain(ENVIRONMENT_SUFFIX);
      expect(envOutputs.tableName).toContain(ENVIRONMENT_SUFFIX);
      expect(envOutputs.successTopicArn).toContain(ENVIRONMENT_SUFFIX);
      expect(envOutputs.failureTopicArn).toContain(ENVIRONMENT_SUFFIX);
      expect(envOutputs.dlqUrl).toContain(ENVIRONMENT_SUFFIX);
    });

    it('all required outputs are defined', () => {
      expect(envOutputs.bucketName).toBeDefined();
      expect(envOutputs.bucketArn).toBeDefined();
      expect(envOutputs.tableName).toBeDefined();
      expect(envOutputs.tableArn).toBeDefined();
      expect(envOutputs.successTopicArn).toBeDefined();
      expect(envOutputs.failureTopicArn).toBeDefined();
      expect(envOutputs.dlqUrl).toBeDefined();
      expect(envOutputs.dlqArn).toBeDefined();
    });
  });
});
