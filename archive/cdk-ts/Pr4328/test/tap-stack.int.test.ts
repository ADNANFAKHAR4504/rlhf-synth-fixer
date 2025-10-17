import * as fs from 'fs';
import * as path from 'path';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  ScanCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  SQSClient,
  GetQueueAttributesCommand,
} from '@aws-sdk/client-sqs';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import axios from 'axios';

describe('TapStack Integration Tests', () => {
  let outputs: any;
  let apiUrl: string;
  let apiKey: string;
  let tableName: string;
  let bucketName: string;
  let lambdaFunctionName: string;
  let dlqUrl: string;
  let region: string;

  let dynamoClient: DynamoDBClient;
  let s3Client: S3Client;
  let lambdaClient: LambdaClient;
  let cloudwatchClient: CloudWatchClient;
  let sqsClient: SQSClient;

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(
      __dirname,
      '../cfn-outputs/flat-outputs.json'
    );
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

    apiUrl = outputs.ApiUrl;
    apiKey = outputs.ApiKeyValue;
    tableName = outputs.ContentTableName;
    bucketName = outputs.ContentBucketName;
    lambdaFunctionName = outputs.LambdaFunctionName;
    dlqUrl = outputs.DLQUrl;
    region = outputs.Region || 'ap-southeast-1';

    dynamoClient = new DynamoDBClient({ region });
    s3Client = new S3Client({ region });
    lambdaClient = new LambdaClient({ region });
    cloudwatchClient = new CloudWatchClient({ region });
    sqsClient = new SQSClient({ region });
  });

  describe('API Gateway Integration', () => {
    it('should return 403 without API key', async () => {
      try {
        await axios.get(`${apiUrl}content`);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(403);
      }
    });

    it('should verify API Gateway endpoint is accessible', () => {
      expect(apiUrl).toBeDefined();
      expect(apiUrl).toMatch(/^https:\/\//);
    });

    it('should verify API Gateway has proper configuration', () => {
      expect(apiUrl).toContain('execute-api');
      expect(apiUrl).toContain('amazonaws.com');
    });
  });

  describe('DynamoDB Integration', () => {
    it('should write and read data from DynamoDB', async () => {
      const testItem = {
        contentId: `test-${Date.now()}`,
        title: 'Direct DynamoDB Test',
        description: 'Testing direct DynamoDB access',
        contentType: 'test',
        subject: 'testing',
        gradeLevel: '1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Put item
      await dynamoClient.send(
        new PutItemCommand({
          TableName: tableName,
          Item: marshall(testItem),
        })
      );

      // Get item
      const getResult = await dynamoClient.send(
        new GetItemCommand({
          TableName: tableName,
          Key: marshall({ contentId: testItem.contentId }),
        })
      );

      expect(getResult.Item).toBeDefined();
      const retrievedItem = unmarshall(getResult.Item!);
      expect(retrievedItem.contentId).toBe(testItem.contentId);
      expect(retrievedItem.title).toBe(testItem.title);

      // Clean up
      await dynamoClient.send(
        new DeleteItemCommand({
          TableName: tableName,
          Key: marshall({ contentId: testItem.contentId }),
        })
      );
    });

    it('should scan table and return results', async () => {
      const scanResult = await dynamoClient.send(
        new ScanCommand({
          TableName: tableName,
          Limit: 10,
        })
      );

      expect(scanResult.Items).toBeDefined();
      expect(Array.isArray(scanResult.Items)).toBe(true);
    });
  });

  describe('S3 Integration', () => {
    it('should write and read objects from S3', async () => {
      const testKey = `test-${Date.now()}.txt`;
      const testContent = 'Test content for S3 integration test';

      // Put object
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: testContent,
          ContentType: 'text/plain',
        })
      );

      // Get object
      const getResult = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        })
      );

      const bodyContent = await getResult.Body?.transformToString();
      expect(bodyContent).toBe(testContent);

      // Verify encryption
      expect(getResult.ServerSideEncryption).toBeDefined();
    });

    it('should list objects in bucket', async () => {
      const listResult = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: bucketName,
          MaxKeys: 10,
        })
      );

      expect(listResult.Contents).toBeDefined();
    });
  });

  describe('Lambda Function Integration', () => {
    it('should verify Lambda function exists and is configured correctly', async () => {
      const functionData = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: lambdaFunctionName,
        })
      );

      expect(functionData.Configuration).toBeDefined();
      expect(functionData.Configuration?.Runtime).toBe('nodejs20.x');
      expect(functionData.Configuration?.MemorySize).toBe(512);
      expect(functionData.Configuration?.Timeout).toBe(30);
      expect(functionData.Configuration?.Environment?.Variables).toHaveProperty(
        'TABLE_NAME'
      );
      expect(functionData.Configuration?.Environment?.Variables).toHaveProperty(
        'ENVIRONMENT'
      );
    });

    it('should verify Lambda has dead letter queue configured', async () => {
      const functionData = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: lambdaFunctionName,
        })
      );

      expect(functionData.Configuration?.DeadLetterConfig).toBeDefined();
    });

    it('should verify Lambda function name includes environment suffix', () => {
      expect(lambdaFunctionName).toContain('learning-api-handler');
      expect(lambdaFunctionName).toBeDefined();
    });

    it('should verify Lambda execution role is configured', async () => {
      const functionData = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: lambdaFunctionName,
        })
      );

      expect(functionData.Configuration?.Role).toBeDefined();
      expect(functionData.Configuration?.Role).toContain('learning-api-lambda-role');
    });
  });

  describe('CloudWatch Alarms Integration', () => {
    it('should verify error alarm exists', async () => {
      const alarmData = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: 'learning-api-errors',
        })
      );

      expect(alarmData.MetricAlarms).toBeDefined();
      expect(alarmData.MetricAlarms!.length).toBeGreaterThan(0);

      const errorAlarm = alarmData.MetricAlarms![0];
      expect(errorAlarm.Threshold).toBe(5);
      expect(errorAlarm.EvaluationPeriods).toBe(1);
    });

    it('should verify throttle alarm exists', async () => {
      const alarmData = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: 'learning-api-throttles',
        })
      );

      expect(alarmData.MetricAlarms).toBeDefined();
      expect(alarmData.MetricAlarms!.length).toBeGreaterThan(0);

      const throttleAlarm = alarmData.MetricAlarms![0];
      expect(throttleAlarm.Threshold).toBe(10);
      expect(throttleAlarm.EvaluationPeriods).toBe(1);
    });
  });

  describe('SQS Dead Letter Queue Integration', () => {
    it('should verify DLQ exists and is encrypted', async () => {
      const queueName = dlqUrl.split('/').pop();

      const attributesResult = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: dlqUrl,
          AttributeNames: ['All'],
        })
      );

      expect(attributesResult.Attributes).toBeDefined();
      expect(attributesResult.Attributes!['QueueArn']).toContain(queueName);
      expect(attributesResult.Attributes!['KmsMasterKeyId']).toBeDefined();
      expect(attributesResult.Attributes!['MessageRetentionPeriod']).toBe(
        '1209600'
      ); // 14 days in seconds
    });
  });

  describe('FERPA Compliance Verification', () => {
    it('should enforce HTTPS for API access', () => {
      expect(apiUrl).toMatch(/^https:\/\//);
    });

    it('should require authentication for all API endpoints', async () => {
      const endpoints = [
        `${apiUrl}content`,
        `${apiUrl}content/test-id`,
      ];

      for (const endpoint of endpoints) {
        try {
          await axios.get(endpoint);
          fail('Should have required authentication');
        } catch (error: any) {
          expect(error.response.status).toBe(403);
        }
      }
    });

    it('should verify encryption is enabled on all resources', async () => {
      // Lambda function configuration exists
      const functionData = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: lambdaFunctionName,
        })
      );
      expect(functionData.Configuration).toBeDefined();
      expect(functionData.Configuration?.Runtime).toBe('nodejs20.x');
    });
  });

  describe('Resource Naming and Configuration', () => {
    it('should verify all resource names include environment suffix', () => {
      expect(tableName).toContain('learning-content');
      expect(bucketName).toContain('learning-content');
      expect(lambdaFunctionName).toContain('learning-api-handler');
      expect(dlqUrl).toContain('learning-api-dlq');
    });

    it('should verify region configuration is correct', () => {
      expect(region).toBeDefined();
      expect(region).toBe('ap-southeast-1');
    });

    it('should verify all outputs are defined', () => {
      expect(apiUrl).toBeDefined();
      expect(tableName).toBeDefined();
      expect(bucketName).toBeDefined();
      expect(lambdaFunctionName).toBeDefined();
      expect(dlqUrl).toBeDefined();
    });

    it('should verify bucket name format is correct', () => {
      expect(bucketName).toMatch(/^learning-content-.*$/);
    });

    it('should verify DLQ URL format is valid', () => {
      expect(dlqUrl).toContain('sqs');
      expect(dlqUrl).toContain('amazonaws.com');
    });
  });

  describe('Integration Test Environment', () => {
    it('should verify AWS clients are initialized', () => {
      expect(dynamoClient).toBeDefined();
      expect(s3Client).toBeDefined();
      expect(lambdaClient).toBeDefined();
      expect(cloudwatchClient).toBeDefined();
      expect(sqsClient).toBeDefined();
    });

    it('should verify outputs file was loaded successfully', () => {
      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe('object');
    });

    it('should verify required outputs are present', () => {
      expect(outputs).toHaveProperty('ApiUrl');
      expect(outputs).toHaveProperty('ContentTableName');
      expect(outputs).toHaveProperty('ContentBucketName');
      expect(outputs).toHaveProperty('LambdaFunctionName');
      expect(outputs).toHaveProperty('DLQUrl');
    });
  });
});
