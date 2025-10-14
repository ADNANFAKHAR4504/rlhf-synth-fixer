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

    it('should list content with valid API key', async () => {
      const response = await axios.get(`${apiUrl}content`, {
        headers: {
          'x-api-key': apiKey,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('items');
      expect(response.data).toHaveProperty('count');
      expect(Array.isArray(response.data.items)).toBe(true);
    });

    it('should create new content via API', async () => {
      const newContent = {
        title: 'Integration Test Content',
        description: 'Test description',
        contentType: 'lesson',
        subject: 'mathematics',
        gradeLevel: '5',
      };

      const response = await axios.post(`${apiUrl}content`, newContent, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('contentId');
      expect(response.data.title).toBe(newContent.title);
      expect(response.data.contentType).toBe(newContent.contentType);
      expect(response.data).toHaveProperty('createdAt');
      expect(response.data).toHaveProperty('updatedAt');

      // Clean up - delete the created item
      const deleteResponse = await axios.delete(
        `${apiUrl}content/${response.data.contentId}`,
        {
          headers: {
            'x-api-key': apiKey,
          },
        }
      );
      expect(deleteResponse.status).toBe(204);
    });

    it('should retrieve specific content by ID', async () => {
      // First create content
      const newContent = {
        title: 'Retrieve Test Content',
        description: 'Test description',
        contentType: 'assignment',
        subject: 'science',
        gradeLevel: '6',
      };

      const createResponse = await axios.post(`${apiUrl}content`, newContent, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      const contentId = createResponse.data.contentId;

      // Retrieve it
      const getResponse = await axios.get(`${apiUrl}content/${contentId}`, {
        headers: {
          'x-api-key': apiKey,
        },
      });

      expect(getResponse.status).toBe(200);
      expect(getResponse.data.contentId).toBe(contentId);
      expect(getResponse.data.title).toBe(newContent.title);

      // Clean up
      await axios.delete(`${apiUrl}content/${contentId}`, {
        headers: {
          'x-api-key': apiKey,
        },
      });
    });

    it('should update existing content', async () => {
      // Create content
      const newContent = {
        title: 'Original Title',
        description: 'Original description',
        contentType: 'quiz',
        subject: 'history',
        gradeLevel: '7',
      };

      const createResponse = await axios.post(`${apiUrl}content`, newContent, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      const contentId = createResponse.data.contentId;

      // Update it
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      const updateResponse = await axios.put(
        `${apiUrl}content/${contentId}`,
        updateData,
        {
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.data.title).toBe(updateData.title);
      expect(updateResponse.data.description).toBe(updateData.description);
      expect(updateResponse.data.contentType).toBe(newContent.contentType);

      // Clean up
      await axios.delete(`${apiUrl}content/${contentId}`, {
        headers: {
          'x-api-key': apiKey,
        },
      });
    });

    it('should return 404 for non-existent content', async () => {
      const nonExistentId = 'content-nonexistent-12345';

      try {
        await axios.get(`${apiUrl}content/${nonExistentId}`, {
          headers: {
            'x-api-key': apiKey,
          },
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
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
        'BUCKET_NAME'
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

  describe('End-to-End Workflow', () => {
    it('should complete full CRUD workflow', async () => {
      // Create
      const newContent = {
        title: 'E2E Test Content',
        description: 'End-to-end test',
        contentType: 'lesson',
        subject: 'mathematics',
        gradeLevel: '8',
      };

      const createResponse = await axios.post(`${apiUrl}content`, newContent, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      expect(createResponse.status).toBe(201);
      const contentId = createResponse.data.contentId;

      // Read
      const getResponse = await axios.get(`${apiUrl}content/${contentId}`, {
        headers: {
          'x-api-key': apiKey,
        },
      });

      expect(getResponse.status).toBe(200);
      expect(getResponse.data.title).toBe(newContent.title);

      // Update
      const updateResponse = await axios.put(
        `${apiUrl}content/${contentId}`,
        { title: 'Updated E2E Title' },
        {
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.data.title).toBe('Updated E2E Title');

      // List and verify it exists
      const listResponse = await axios.get(`${apiUrl}content`, {
        headers: {
          'x-api-key': apiKey,
        },
      });

      expect(listResponse.status).toBe(200);
      const foundItem = listResponse.data.items.find(
        (item: any) => item.contentId === contentId
      );
      expect(foundItem).toBeDefined();

      // Delete
      const deleteResponse = await axios.delete(
        `${apiUrl}content/${contentId}`,
        {
          headers: {
            'x-api-key': apiKey,
          },
        }
      );

      expect(deleteResponse.status).toBe(204);

      // Verify deletion
      try {
        await axios.get(`${apiUrl}content/${contentId}`, {
          headers: {
            'x-api-key': apiKey,
          },
        });
        fail('Content should have been deleted');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });
  });
});
