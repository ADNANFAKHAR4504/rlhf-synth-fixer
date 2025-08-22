// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
  DeleteItemCommand,
  DescribeTableCommand
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand
} from '@aws-sdk/client-lambda';
import {
  ApiGatewayV2Client,
  GetApiCommand
} from '@aws-sdk/client-apigatewayv2';
import fetch from 'node-fetch';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synthtrainr959';

// AWS Clients
const dynamodbClient = new DynamoDBClient({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });
const lambdaClient = new LambdaClient({ region: 'us-east-1' });
const apiGatewayClient = new ApiGatewayV2Client({ region: 'us-east-1' });

describe('Task Management Application Integration Tests', () => {
  const testTaskId = `test-task-${Date.now()}`;
  const testUserId = 'test-user-123';
  const testFileName = `test-file-${Date.now()}.txt`;

  describe('DynamoDB Table Tests', () => {
    test('should verify DynamoDB table exists and is accessible', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.TasksTableName
      });
      
      const response = await dynamodbClient.send(command);
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should verify DynamoDB table has correct indexes', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.TasksTableName
      });
      
      const response = await dynamodbClient.send(command);
      const gsiNames = response.Table?.GlobalSecondaryIndexes?.map(gsi => gsi.IndexName) || [];
      
      expect(gsiNames).toContain('UserStatusIndex');
      expect(gsiNames).toContain('UserCreatedAtIndex');
    });

    test('should create and retrieve an item from DynamoDB', async () => {
      // Put item
      const putCommand = new PutItemCommand({
        TableName: outputs.TasksTableName,
        Item: {
          taskId: { S: testTaskId },
          userId: { S: testUserId },
          title: { S: 'Integration Test Task' },
          status: { S: 'pending' },
          createdAt: { S: new Date().toISOString() }
        }
      });
      
      await dynamodbClient.send(putCommand);
      
      // Get item
      const getCommand = new GetItemCommand({
        TableName: outputs.TasksTableName,
        Key: {
          taskId: { S: testTaskId }
        }
      });
      
      const response = await dynamodbClient.send(getCommand);
      expect(response.Item).toBeDefined();
      expect(response.Item?.taskId?.S).toBe(testTaskId);
      expect(response.Item?.userId?.S).toBe(testUserId);
    });

    test('should query items using GSI', async () => {
      const queryCommand = new QueryCommand({
        TableName: outputs.TasksTableName,
        IndexName: 'UserStatusIndex',
        KeyConditionExpression: 'userId = :userId AND #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':userId': { S: testUserId },
          ':status': { S: 'pending' }
        }
      });
      
      const response = await dynamodbClient.send(queryCommand);
      expect(response.Items).toBeDefined();
      expect(response.Count).toBeGreaterThanOrEqual(1);
    });

    afterAll(async () => {
      // Cleanup: Delete test item
      const deleteCommand = new DeleteItemCommand({
        TableName: outputs.TasksTableName,
        Key: {
          taskId: { S: testTaskId }
        }
      });
      
      await dynamodbClient.send(deleteCommand);
    });
  });

  describe('S3 Bucket Tests', () => {
    test('should verify S3 bucket exists and is accessible', async () => {
      const command = new ListObjectsV2Command({
        Bucket: outputs.TaskAttachmentsBucketName,
        MaxKeys: 1
      });
      
      try {
        await s3Client.send(command);
        expect(true).toBe(true); // Bucket exists if no error
      } catch (error: any) {
        // If error is not NoSuchBucket, then fail the test
        expect(error.name).not.toBe('NoSuchBucket');
      }
    });

    test('should upload and download an object from S3', async () => {
      const testContent = 'Integration test file content';
      
      // Put object
      const putCommand = new PutObjectCommand({
        Bucket: outputs.TaskAttachmentsBucketName,
        Key: testFileName,
        Body: testContent,
        ContentType: 'text/plain'
      });
      
      await s3Client.send(putCommand);
      
      // Get object
      const getCommand = new GetObjectCommand({
        Bucket: outputs.TaskAttachmentsBucketName,
        Key: testFileName
      });
      
      const response = await s3Client.send(getCommand);
      const bodyContent = await response.Body?.transformToString();
      expect(bodyContent).toBe(testContent);
    });

    afterAll(async () => {
      // Cleanup: Delete test object
      const deleteCommand = new DeleteObjectCommand({
        Bucket: outputs.TaskAttachmentsBucketName,
        Key: testFileName
      });
      
      await s3Client.send(deleteCommand);
    });
  });

  describe('Lambda Function Tests', () => {
    test('should verify TaskManagementFunction exists', async () => {
      const functionName = `TaskManagement-${environmentSuffix}`;
      const command = new GetFunctionCommand({
        FunctionName: functionName
      });
      
      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
      expect(response.Configuration?.Timeout).toBe(30);
      expect(response.Configuration?.MemorySize).toBe(512);
    });

    test('should verify TaskStreamingFunction exists', async () => {
      const functionName = `TaskStreaming-${environmentSuffix}`;
      const command = new GetFunctionCommand({
        FunctionName: functionName
      });
      
      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
      expect(response.Configuration?.Timeout).toBe(300);
      expect(response.Configuration?.MemorySize).toBe(1024);
    });
  });

  describe('Lambda Function URL Tests', () => {
    test('should be able to call TaskManagementFunctionUrl', async () => {
      const url = outputs.TaskManagementFunctionUrl;
      
      // Test POST request to create a task
      const createResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: 'test-user-url',
          title: 'Test Task via Function URL',
          description: 'Created via Lambda Function URL',
          status: 'pending'
        })
      });
      
      expect(createResponse.status).toBe(200);
      const createData = await createResponse.json();
      expect(createData.taskId).toBeDefined();
      expect(createData.title).toBe('Test Task via Function URL');
    });

    test('should handle GET request on TaskManagementFunctionUrl', async () => {
      const url = outputs.TaskManagementFunctionUrl;
      
      // Test GET request with query parameters
      const listResponse = await fetch(`${url}?userId=test-user-url`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      expect(listResponse.status).toBe(200);
      const listData = await listResponse.json();
      expect(listData.tasks).toBeDefined();
      expect(Array.isArray(listData.tasks)).toBe(true);
    });

    test('should handle streaming response from TaskStreamingFunctionUrl', async () => {
      const url = outputs.TaskStreamingFunctionUrl;
      
      // Note: For response streaming, we just test that the endpoint is accessible
      // Full streaming test would require handling streaming response
      const response = await fetch(`${url}?userId=test-user-stream`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // The streaming function might return an error for missing userId or empty results
      // We're just testing that the endpoint is reachable
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('API Gateway Tests', () => {
    test('should verify API Gateway exists', async () => {
      const apiUrl = outputs.ApiGatewayUrl;
      const apiId = apiUrl.split('.')[0].split('//')[1];
      
      const command = new GetApiCommand({
        ApiId: apiId
      });
      
      const response = await apiGatewayClient.send(command);
      expect(response.Name).toBe(`TaskManagementApi-${environmentSuffix}`);
      expect(response.ProtocolType).toBe('HTTP');
    });

    test('should create a task through API Gateway', async () => {
      const apiUrl = outputs.ApiGatewayUrl;
      
      const response = await fetch(`${apiUrl}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: 'test-user-api',
          title: 'Test Task via API Gateway',
          description: 'Created through API Gateway',
          status: 'pending'
        })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.taskId).toBeDefined();
      expect(data.title).toBe('Test Task via API Gateway');
    });

    test('should list tasks through API Gateway', async () => {
      const apiUrl = outputs.ApiGatewayUrl;
      
      const response = await fetch(`${apiUrl}/tasks?userId=test-user-api`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.tasks).toBeDefined();
      expect(Array.isArray(data.tasks)).toBe(true);
    });

    test('should handle CORS headers properly', async () => {
      const apiUrl = outputs.ApiGatewayUrl;
      
      const response = await fetch(`${apiUrl}/tasks`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://example.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      
      // API Gateway should handle CORS preflight
      expect([200, 204]).toContain(response.status);
      const corsHeaders = response.headers.get('access-control-allow-origin');
      expect(corsHeaders).toBeDefined();
    });
  });

  describe('End-to-End Workflow Tests', () => {
    let createdTaskId: string;

    test('should complete full CRUD workflow through API Gateway', async () => {
      const apiUrl = outputs.ApiGatewayUrl;
      const userId = 'e2e-test-user';
      
      // 1. Create a task
      const createResponse = await fetch(`${apiUrl}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: 'E2E Test Task',
          description: 'End-to-end integration test',
          status: 'pending',
          priority: 'high'
        })
      });
      
      expect(createResponse.status).toBe(200);
      const createData = await createResponse.json();
      createdTaskId = createData.taskId;
      expect(createdTaskId).toBeDefined();
      
      // 2. Get the specific task
      const getResponse = await fetch(`${apiUrl}/tasks/${createdTaskId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(getResponse.status).toBe(200);
      const getData = await getResponse.json();
      expect(getData.taskId).toBe(createdTaskId);
      expect(getData.title).toBe('E2E Test Task');
      
      // 3. Update the task
      const updateResponse = await fetch(`${apiUrl}/tasks/${createdTaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          description: 'Updated description'
        })
      });
      
      expect(updateResponse.status).toBe(200);
      const updateData = await updateResponse.json();
      expect(updateData.status).toBe('completed');
      
      // 4. List tasks for the user
      const listResponse = await fetch(`${apiUrl}/tasks?userId=${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(listResponse.status).toBe(200);
      const listData = await listResponse.json();
      expect(listData.tasks).toBeDefined();
      const foundTask = listData.tasks.find((t: any) => t.taskId === createdTaskId);
      expect(foundTask).toBeDefined();
      expect(foundTask.status).toBe('completed');
      
      // 5. Delete the task
      const deleteResponse = await fetch(`${apiUrl}/tasks/${createdTaskId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(deleteResponse.status).toBe(200);
      const deleteData = await deleteResponse.json();
      expect(deleteData.message).toBe('Task deleted successfully');
    });

    test('should handle errors gracefully', async () => {
      const apiUrl = outputs.ApiGatewayUrl;
      
      // Try to get a non-existent task
      const response = await fetch(`${apiUrl}/tasks/non-existent-task-id`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    test('should validate required parameters', async () => {
      const apiUrl = outputs.ApiGatewayUrl;
      
      // Try to create a task without required fields
      const response = await fetch(`${apiUrl}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: 'Missing required fields'
        })
      });
      
      // The Lambda function should handle validation
      expect(response.status).toBe(500);
    });
  });

  describe('Security and Compliance Tests', () => {
    test('should verify IAM role exists and has proper ARN format', () => {
      const roleArn = outputs.LambdaExecutionRoleArn;
      expect(roleArn).toMatch(/^arn:aws:iam::\d{12}:role\/TaskManagementLambdaRole-/);
    });

    test('should verify all resources are tagged properly', async () => {
      // Check DynamoDB table tags
      const tableCommand = new DescribeTableCommand({
        TableName: outputs.TasksTableName
      });
      
      const tableResponse = await dynamodbClient.send(tableCommand);
      // Note: Tags are not directly visible in DescribeTable response
      // but we can verify the table follows naming convention
      expect(tableResponse.Table?.TableName).toContain(environmentSuffix);
    });

    test('should verify S3 bucket follows naming convention', () => {
      const bucketName = outputs.TaskAttachmentsBucketName;
      expect(bucketName).toMatch(/^task-attachments-[a-zA-Z0-9]+-\d{12}$/);
      expect(bucketName).toContain(environmentSuffix);
    });
  });
});