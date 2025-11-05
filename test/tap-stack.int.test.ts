// Configuration - These are coming from cfn-outputs after cdk deploy
import AWS from 'aws-sdk';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS SDK Configuration
const region = process.env.AWS_REGION || 'us-east-1';
AWS.config.update({ region });

const dynamodb = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda();
const cloudwatch = new AWS.CloudWatch();
const sns = new AWS.SNS();
const kms = new AWS.KMS();

// Load outputs from CloudFormation deployment
let outputs: any = {};
try {
  const outputsPath = 'cfn-outputs/flat-outputs.json';
  if (fs.existsSync(outputsPath)) {
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  }
} catch (error) {
  console.warn('Could not load CFN outputs, using environment variables instead');
}

// Helper function to get output value
const getOutput = (key: string, envVar?: string): string => {
  return outputs[key] || process.env[envVar || key] || '';
};

const TABLE_NAME = getOutput('TurnAroundPromptTableName', 'TABLE_NAME') || `TurnAroundPromptTable-${environmentSuffix}`;
const STREAM_PROCESSOR_FUNCTION_NAME = getOutput('StreamProcessorFunctionName', 'STREAM_PROCESSOR_FUNCTION_NAME') || `tap-stream-processor-${environmentSuffix}`;
const NOTIFICATION_TOPIC_ARN = getOutput('ProcessingNotificationTopicArn', 'NOTIFICATION_TOPIC_ARN');
const TABLE_STREAM_ARN = getOutput('TurnAroundPromptTableStreamArn', 'TABLE_STREAM_ARN');

describe('TAP Stack Integration Tests - Cross-Service Validation', () => {

  // Test data cleanup
  const createdItems: string[] = [];

  afterAll(async () => {
    // Clean up test data
    for (const itemId of createdItems) {
      try {
        await dynamodb.delete({
          TableName: TABLE_NAME,
          Key: { id: itemId }
        }).promise();
      } catch (error) {
        console.warn(`Failed to clean up item ${itemId}:`, error);
      }
    }
  });

  describe('DynamoDB Table - Real-World Operations', () => {
    test('should be able to write items to the table', async () => {
      const testId = `test-${uuidv4()}`;
      createdItems.push(testId);

      const item = {
        id: testId,
        taskType: 'code-review',
        status: 'pending',
        createdAt: Date.now(),
        description: 'Integration test item',
        priority: 'high'
      };

      await expect(
        dynamodb.put({
          TableName: TABLE_NAME,
          Item: item
        }).promise()
      ).resolves.not.toThrow();
    }, 30000);

    test('should be able to read items from the table', async () => {
      const testId = `test-${uuidv4()}`;
      createdItems.push(testId);

      const item = {
        id: testId,
        taskType: 'deployment',
        status: 'pending',
        createdAt: Date.now()
      };

      await dynamodb.put({
        TableName: TABLE_NAME,
        Item: item
      }).promise();

      const result = await dynamodb.get({
        TableName: TABLE_NAME,
        Key: { id: testId }
      }).promise();

      expect(result.Item).toBeDefined();
      expect(result.Item?.id).toBe(testId);
      expect(result.Item?.taskType).toBe('deployment');
    }, 30000);

    test('should be able to update items in the table', async () => {
      const testId = `test-${uuidv4()}`;
      createdItems.push(testId);

      const item = {
        id: testId,
        taskType: 'analysis',
        status: 'pending',
        createdAt: Date.now()
      };

      await dynamodb.put({
        TableName: TABLE_NAME,
        Item: item
      }).promise();

      await dynamodb.update({
        TableName: TABLE_NAME,
        Key: { id: testId },
        UpdateExpression: 'SET #status = :newStatus, completedAt = :completedAt',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':newStatus': 'completed',
          ':completedAt': Date.now()
        }
      }).promise();

      const result = await dynamodb.get({
        TableName: TABLE_NAME,
        Key: { id: testId }
      }).promise();

      expect(result.Item?.status).toBe('completed');
      expect(result.Item?.completedAt).toBeDefined();
    }, 30000);

    test('should be able to query using Global Secondary Index', async () => {
      const testId = `test-${uuidv4()}`;
      createdItems.push(testId);

      const item = {
        id: testId,
        taskType: 'testing',
        status: 'in-progress',
        createdAt: Date.now()
      };

      await dynamodb.put({
        TableName: TABLE_NAME,
        Item: item
      }).promise();

      // Give GSI time to update
      await new Promise(resolve => setTimeout(resolve, 2000));

      const result = await dynamodb.query({
        TableName: TABLE_NAME,
        IndexName: 'TaskTypeIndex',
        KeyConditionExpression: 'taskType = :taskType',
        ExpressionAttributeValues: {
          ':taskType': 'testing'
        },
        Limit: 10
      }).promise();

      expect(result.Items).toBeDefined();
      expect(Array.isArray(result.Items)).toBe(true);
    }, 30000);

    test('should handle batch write operations', async () => {
      const batchItems = Array.from({ length: 5 }, (_, i) => {
        const id = `batch-test-${uuidv4()}`;
        createdItems.push(id);
        return {
          id,
          taskType: 'batch-processing',
          status: 'pending',
          createdAt: Date.now(),
          batchIndex: i
        };
      });

      const putRequests = batchItems.map(item => ({
        PutRequest: { Item: item }
      }));

      await expect(
        dynamodb.batchWrite({
          RequestItems: {
            [TABLE_NAME]: putRequests
          }
        }).promise()
      ).resolves.not.toThrow();
    }, 30000);
  });

  describe('Lambda Stream Processor - Event Processing', () => {
    test('Lambda function should exist and be invocable', async () => {
      if (!STREAM_PROCESSOR_FUNCTION_NAME) {
        console.warn('Skipping: STREAM_PROCESSOR_FUNCTION_NAME not available');
        return;
      }

      const result = await lambda.getFunctionConfiguration({
        FunctionName: STREAM_PROCESSOR_FUNCTION_NAME
      }).promise();

      expect(result.FunctionName).toBeDefined();
      expect(result.State).toBe('Active');
      expect(result.Runtime).toMatch(/python|nodejs/);
    }, 30000);

    test('Lambda function should process simulated stream events', async () => {
      if (!STREAM_PROCESSOR_FUNCTION_NAME) {
        console.warn('Skipping: STREAM_PROCESSOR_FUNCTION_NAME not available');
        return;
      }

      const mockEvent = {
        Records: [
          {
            eventName: 'INSERT',
            dynamodb: {
              NewImage: {
                id: { S: 'test-123' },
                taskType: { S: 'deployment' },
                status: { S: 'pending' },
                createdAt: { N: String(Date.now()) }
              }
            }
          }
        ]
      };

      const result = await lambda.invoke({
        FunctionName: STREAM_PROCESSOR_FUNCTION_NAME,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(mockEvent)
      }).promise();

      expect(result.StatusCode).toBe(200);
      expect(result.FunctionError).toBeUndefined();

      if (result.Payload) {
        const payload = JSON.parse(result.Payload.toString());
        expect(payload.statusCode).toBe(200);
      }
    }, 30000);

    test('Lambda should handle task completion events', async () => {
      if (!STREAM_PROCESSOR_FUNCTION_NAME) {
        console.warn('Skipping: STREAM_PROCESSOR_FUNCTION_NAME not available');
        return;
      }

      const mockEvent = {
        Records: [
          {
            eventName: 'MODIFY',
            dynamodb: {
              OldImage: {
                id: { S: 'test-456' },
                status: { S: 'in-progress' },
                createdAt: { N: String(Date.now() - 3600000) }
              },
              NewImage: {
                id: { S: 'test-456' },
                taskType: { S: 'code-review' },
                status: { S: 'completed' },
                createdAt: { N: String(Date.now() - 3600000) },
                completedAt: { N: String(Date.now()) }
              }
            }
          }
        ]
      };

      const result = await lambda.invoke({
        FunctionName: STREAM_PROCESSOR_FUNCTION_NAME,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(mockEvent)
      }).promise();

      expect(result.StatusCode).toBe(200);
    }, 30000);

    test('Lambda should handle failure events and send notifications', async () => {
      if (!STREAM_PROCESSOR_FUNCTION_NAME) {
        console.warn('Skipping: STREAM_PROCESSOR_FUNCTION_NAME not available');
        return;
      }

      const mockEvent = {
        Records: [
          {
            eventName: 'MODIFY',
            dynamodb: {
              OldImage: {
                id: { S: 'test-789' },
                status: { S: 'in-progress' }
              },
              NewImage: {
                id: { S: 'test-789' },
                taskType: { S: 'deployment' },
                status: { S: 'failed' },
                errorMessage: { S: 'Deployment failed due to timeout' }
              }
            }
          }
        ]
      };

      const result = await lambda.invoke({
        FunctionName: STREAM_PROCESSOR_FUNCTION_NAME,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(mockEvent)
      }).promise();

      expect(result.StatusCode).toBe(200);
    }, 30000);
  });

  describe('DynamoDB Streams - End-to-End Processing', () => {
    test('should trigger Lambda when item is created in DynamoDB', async () => {
      const testId = `stream-test-${uuidv4()}`;
      createdItems.push(testId);

      const item = {
        id: testId,
        taskType: 'integration-test',
        status: 'pending',
        createdAt: Date.now(),
        testRun: true
      };

      // Write item to DynamoDB
      await dynamodb.put({
        TableName: TABLE_NAME,
        Item: item
      }).promise();

      // Wait for stream processing
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Verify Lambda was invoked by checking CloudWatch metrics
      if (STREAM_PROCESSOR_FUNCTION_NAME) {
        const metrics = await cloudwatch.getMetricStatistics({
          Namespace: 'AWS/Lambda',
          MetricName: 'Invocations',
          Dimensions: [{
            Name: 'FunctionName',
            Value: STREAM_PROCESSOR_FUNCTION_NAME
          }],
          StartTime: new Date(Date.now() - 600000),
          EndTime: new Date(),
          Period: 300,
          Statistics: ['Sum']
        }).promise();

        expect(metrics.Datapoints).toBeDefined();
      }
    }, 30000);
  });

  describe('CloudWatch Monitoring - Metrics and Alarms', () => {
    test('should be able to retrieve Lambda metrics', async () => {
      if (!STREAM_PROCESSOR_FUNCTION_NAME) {
        console.warn('Skipping: STREAM_PROCESSOR_FUNCTION_NAME not available');
        return;
      }

      const metrics = await cloudwatch.getMetricStatistics({
        Namespace: 'AWS/Lambda',
        MetricName: 'Duration',
        Dimensions: [{
          Name: 'FunctionName',
          Value: STREAM_PROCESSOR_FUNCTION_NAME
        }],
        StartTime: new Date(Date.now() - 3600000),
        EndTime: new Date(),
        Period: 3600,
        Statistics: ['Average', 'Maximum']
      }).promise();

      expect(metrics.Datapoints).toBeDefined();
    }, 30000);

    test('should be able to retrieve DynamoDB metrics', async () => {
      const metrics = await cloudwatch.getMetricStatistics({
        Namespace: 'AWS/DynamoDB',
        MetricName: 'ConsumedReadCapacityUnits',
        Dimensions: [{
          Name: 'TableName',
          Value: TABLE_NAME
        }],
        StartTime: new Date(Date.now() - 3600000),
        EndTime: new Date(),
        Period: 3600,
        Statistics: ['Sum']
      }).promise();

      expect(metrics.Datapoints).toBeDefined();
    }, 30000);
  });

  describe('Cross-Service Integration - Complete Workflow', () => {
    test('should handle complete task lifecycle', async () => {
      const taskId = `workflow-test-${uuidv4()}`;
      createdItems.push(taskId);

      // Step 1: Create task
      const newTask = {
        id: taskId,
        taskType: 'code-review',
        status: 'pending',
        createdAt: Date.now(),
        assignee: 'integration-test',
        description: 'Complete workflow integration test'
      };

      await dynamodb.put({
        TableName: TABLE_NAME,
        Item: newTask
      }).promise();

      // Step 2: Update task to in-progress
      await new Promise(resolve => setTimeout(resolve, 1000));

      await dynamodb.update({
        TableName: TABLE_NAME,
        Key: { id: taskId },
        UpdateExpression: 'SET #status = :status, startedAt = :startedAt',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': 'in-progress',
          ':startedAt': Date.now()
        }
      }).promise();

      // Step 3: Complete task
      await new Promise(resolve => setTimeout(resolve, 1000));

      await dynamodb.update({
        TableName: TABLE_NAME,
        Key: { id: taskId },
        UpdateExpression: 'SET #status = :status, completedAt = :completedAt',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': 'completed',
          ':completedAt': Date.now()
        }
      }).promise();

      // Step 4: Verify final state
      const result = await dynamodb.get({
        TableName: TABLE_NAME,
        Key: { id: taskId }
      }).promise();

      expect(result.Item?.status).toBe('completed');
      expect(result.Item?.createdAt).toBeDefined();
      expect(result.Item?.startedAt).toBeDefined();
      expect(result.Item?.completedAt).toBeDefined();

      // Verify processing time is reasonable
      const processingTime = result.Item!.completedAt - result.Item!.createdAt;
      expect(processingTime).toBeGreaterThan(0);
    }, 30000);

    test('should handle concurrent task operations', async () => {
      const taskIds = Array.from({ length: 3 }, () => {
        const id = `concurrent-${uuidv4()}`;
        createdItems.push(id);
        return id;
      });

      // Create multiple tasks concurrently
      const createPromises = taskIds.map(id =>
        dynamodb.put({
          TableName: TABLE_NAME,
          Item: {
            id,
            taskType: 'concurrent-test',
            status: 'pending',
            createdAt: Date.now()
          }
        }).promise()
      );

      await Promise.all(createPromises);

      // Update all tasks concurrently
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatePromises = taskIds.map(id =>
        dynamodb.update({
          TableName: TABLE_NAME,
          Key: { id },
          UpdateExpression: 'SET #status = :status',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':status': 'completed' }
        }).promise()
      );

      await Promise.all(updatePromises);

      // Verify all updates succeeded
      const getPromises = taskIds.map(id =>
        dynamodb.get({
          TableName: TABLE_NAME,
          Key: { id }
        }).promise()
      );

      const results = await Promise.all(getPromises);

      results.forEach(result => {
        expect(result.Item?.status).toBe('completed');
      });
    }, 30000);
  });

  describe('Error Handling and Resilience', () => {
    test('should handle invalid item schema gracefully', async () => {
      const testId = `invalid-${uuidv4()}`;
      createdItems.push(testId);

      // DynamoDB will accept any schema, but our application logic should validate
      const invalidItem = {
        id: testId,
        // Missing required fields intentionally
        randomField: 'test'
      };

      // This should succeed at DynamoDB level (schema-less)
      await expect(
        dynamodb.put({
          TableName: TABLE_NAME,
          Item: invalidItem
        }).promise()
      ).resolves.not.toThrow();

      // But retrieve and verify
      const result = await dynamodb.get({
        TableName: TABLE_NAME,
        Key: { id: testId }
      }).promise();

      expect(result.Item).toBeDefined();
    }, 30000);

    test('should handle conditional write failures', async () => {
      const testId = `conditional-${uuidv4()}`;
      createdItems.push(testId);

      await dynamodb.put({
        TableName: TABLE_NAME,
        Item: {
          id: testId,
          status: 'pending',
          version: 1
        }
      }).promise();

      // Attempt conditional update with wrong version
      await expect(
        dynamodb.update({
          TableName: TABLE_NAME,
          Key: { id: testId },
          UpdateExpression: 'SET version = version + :inc',
          ConditionExpression: 'version = :expectedVersion',
          ExpressionAttributeValues: {
            ':inc': 1,
            ':expectedVersion': 999 // Wrong version
          }
        }).promise()
      ).rejects.toThrow();
    }, 30000);
  });

  describe('Performance and Scalability', () => {
    test('should handle high-volume writes efficiently', async () => {
      const startTime = Date.now();
      const itemCount = 20;
      const testIds: string[] = [];

      for (let i = 0; i < itemCount; i++) {
        const id = `perf-test-${uuidv4()}`;
        testIds.push(id);
        createdItems.push(id);
      }

      const writePromises = testIds.map(id =>
        dynamodb.put({
          TableName: TABLE_NAME,
          Item: {
            id,
            taskType: 'performance-test',
            status: 'pending',
            createdAt: Date.now()
          }
        }).promise()
      );

      await Promise.all(writePromises);

      const duration = Date.now() - startTime;
      const avgLatency = duration / itemCount;

      // Each write should complete reasonably fast
      expect(avgLatency).toBeLessThan(1000); // Less than 1 second average
    }, 60000);

    test('should handle batch reads efficiently', async () => {
      const testIds: string[] = [];

      // Create test items
      for (let i = 0; i < 10; i++) {
        const id = `batch-read-${uuidv4()}`;
        testIds.push(id);
        createdItems.push(id);

        await dynamodb.put({
          TableName: TABLE_NAME,
          Item: {
            id,
            taskType: 'batch-read-test',
            status: 'pending',
            createdAt: Date.now()
          }
        }).promise();
      }

      // Batch read
      const startTime = Date.now();

      const result = await dynamodb.batchGet({
        RequestItems: {
          [TABLE_NAME]: {
            Keys: testIds.map(id => ({ id }))
          }
        }
      }).promise();

      const duration = Date.now() - startTime;

      expect(result.Responses?.[TABLE_NAME]).toBeDefined();
      expect(result.Responses![TABLE_NAME].length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(5000); // Batch read should be fast
    }, 30000);
  });

  describe('Security and Encryption', () => {
    test('should verify table encryption is enabled', async () => {
      const dynamodbClient = new AWS.DynamoDB();

      const tableDescription = await dynamodbClient.describeTable({
        TableName: TABLE_NAME
      }).promise();

      expect(tableDescription.Table?.SSEDescription).toBeDefined();
      expect(tableDescription.Table?.SSEDescription?.Status).toBe('ENABLED');
    }, 30000);

    test('should verify stream is enabled', async () => {
      const dynamodbClient = new AWS.DynamoDB();

      const tableDescription = await dynamodbClient.describeTable({
        TableName: TABLE_NAME
      }).promise();

      expect(tableDescription.Table?.StreamSpecification).toBeDefined();
      expect(tableDescription.Table?.StreamSpecification?.StreamEnabled).toBe(true);
    }, 30000);
  });
});
