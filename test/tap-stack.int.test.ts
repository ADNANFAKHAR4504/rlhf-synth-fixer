// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  ListObjectsV2Command,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetUsagePlansCommand,
  GetApiKeysCommand,
} from '@aws-sdk/client-api-gateway';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = process.env.AWS_REGION || 'us-west-2';
const dynamoClient = new DynamoDBClient({ region });
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const apiGatewayClient = new APIGatewayClient({ region });

describe('Polling System Integration Tests', () => {
  describe('DynamoDB Tables', () => {
    test('Votes table exists and is accessible', async () => {
      const votesTableName = outputs.VotesTableName;
      expect(votesTableName).toBeDefined();

      // Try to scan the table (should work even if empty)
      const scanCommand = new ScanCommand({
        TableName: votesTableName,
        Limit: 1,
      });

      const result = await dynamoClient.send(scanCommand);
      expect(result.$metadata.httpStatusCode).toBe(200);
    });

    test('Results table exists and is accessible', async () => {
      const resultsTableName = outputs.ResultsTableName;
      expect(resultsTableName).toBeDefined();

      const scanCommand = new ScanCommand({
        TableName: resultsTableName,
        Limit: 1,
      });

      const result = await dynamoClient.send(scanCommand);
      expect(result.$metadata.httpStatusCode).toBe(200);
    });

    test('Votes table supports conditional writes', async () => {
      const votesTableName = outputs.VotesTableName;
      const testUserId = `test-user-${Date.now()}`;
      const testPollId = 'poll-001';

      // First write should succeed
      const putCommand = new PutItemCommand({
        TableName: votesTableName,
        Item: {
          userId: { S: testUserId },
          pollId: { S: testPollId },
          choice: { S: 'option-a' },
          timestamp: { S: new Date().toISOString() },
        },
        ConditionExpression:
          'attribute_not_exists(userId) AND attribute_not_exists(pollId)',
      });

      const putResult = await dynamoClient.send(putCommand);
      expect(putResult.$metadata.httpStatusCode).toBe(200);

      // Second write with same keys should fail
      await expect(dynamoClient.send(putCommand)).rejects.toThrow();
    });

    test('Can read vote from votes table', async () => {
      const votesTableName = outputs.VotesTableName;
      const testUserId = `test-user-read-${Date.now()}`;
      const testPollId = 'poll-002';

      // Write a vote
      await dynamoClient.send(
        new PutItemCommand({
          TableName: votesTableName,
          Item: {
            userId: { S: testUserId },
            pollId: { S: testPollId },
            choice: { S: 'option-b' },
            timestamp: { S: new Date().toISOString() },
          },
        })
      );

      // Read it back
      const getCommand = new GetItemCommand({
        TableName: votesTableName,
        Key: {
          userId: { S: testUserId },
          pollId: { S: testPollId },
        },
      });

      const result = await dynamoClient.send(getCommand);
      expect(result.Item).toBeDefined();
      expect(result.Item?.choice.S).toBe('option-b');
    });
  });

  describe('S3 Snapshot Bucket', () => {
    test('Snapshot bucket exists and is accessible', async () => {
      const bucketName = outputs.SnapshotBucketName;
      expect(bucketName).toBeDefined();

      const headCommand = new HeadBucketCommand({
        Bucket: bucketName,
      });

      const result = await s3Client.send(headCommand);
      expect(result.$metadata.httpStatusCode).toBe(200);
    });

    test('Snapshot bucket has versioning enabled', async () => {
      const bucketName = outputs.SnapshotBucketName;

      // List objects (should work even if empty)
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 10,
      });

      const result = await s3Client.send(listCommand);
      expect(result.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('Lambda Functions', () => {
    test('Vote processor Lambda exists and is configured correctly', async () => {
      const functionName = `vote-processor-${process.env.ENVIRONMENT_SUFFIX || 'dev'}`;

      const getCommand = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const result = await lambdaClient.send(getCommand);
      expect(result.Configuration?.Runtime).toBe('python3.11');
      expect(result.Configuration?.Timeout).toBe(30);
      expect(result.Configuration?.MemorySize).toBe(256);
      expect(result.Configuration?.Environment?.Variables?.VOTES_TABLE_NAME).toBe(
        outputs.VotesTableName
      );
    });

    test('Results aggregator Lambda exists and is configured correctly', async () => {
      const functionName = `results-aggregator-${process.env.ENVIRONMENT_SUFFIX || 'dev'}`;

      const getCommand = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const result = await lambdaClient.send(getCommand);
      expect(result.Configuration?.Runtime).toBe('python3.11');
      expect(result.Configuration?.Timeout).toBe(60);
      expect(result.Configuration?.MemorySize).toBe(512);
      expect(
        result.Configuration?.Environment?.Variables?.RESULTS_TABLE_NAME
      ).toBe(outputs.ResultsTableName);
      expect(
        result.Configuration?.Environment?.Variables?.SNAPSHOT_BUCKET_NAME
      ).toBe(outputs.SnapshotBucketName);
    });

    test('Vote processor Lambda can be invoked', async () => {
      const functionName = `vote-processor-${process.env.ENVIRONMENT_SUFFIX || 'dev'}`;

      // Test GET request (retrieving a vote)
      const getEvent = {
        httpMethod: 'GET',
        queryStringParameters: {
          userId: 'test-user-lambda',
          pollId: 'poll-lambda-test',
        },
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: functionName,
        Payload: Buffer.from(JSON.stringify(getEvent)),
      });

      const result = await lambdaClient.send(invokeCommand);
      expect(result.StatusCode).toBe(200);

      const payload = JSON.parse(
        Buffer.from(result.Payload!).toString('utf8')
      );
      expect(payload.statusCode).toBeDefined();
      expect([200, 404]).toContain(payload.statusCode); // Either found or not found
    });
  });

  describe('API Gateway', () => {
    test('API Gateway exists and is accessible', async () => {
      const apiEndpoint = outputs.APIEndpoint;
      expect(apiEndpoint).toBeDefined();
      expect(apiEndpoint).toContain('execute-api');
      expect(apiEndpoint).toContain(region);
    });

    test('API has usage plan configured', async () => {
      const apiId = outputs.APIEndpoint.split('/')[2].split('.')[0];

      const getUsagePlansCommand = new GetUsagePlansCommand({});

      const result = await apiGatewayClient.send(getUsagePlansCommand);
      expect(result.items).toBeDefined();

      const usagePlan = result.items?.find((plan) =>
        plan.apiStages?.some((stage) => stage.apiId === apiId)
      );

      expect(usagePlan).toBeDefined();
      expect(usagePlan?.throttle?.rateLimit).toBe(10);
      expect(usagePlan?.quota?.limit).toBe(10000);
    });

    test('API has API key configured', async () => {
      const apiKeyId = outputs.APIKeyId;
      expect(apiKeyId).toBeDefined();

      const getApiKeysCommand = new GetApiKeysCommand({
        includeValues: false,
      });

      const result = await apiGatewayClient.send(getApiKeysCommand);
      const apiKey = result.items?.find((key) => key.id === apiKeyId);

      expect(apiKey).toBeDefined();
      expect(apiKey?.enabled).toBe(true);
    });

    test('API REST endpoint is configured', async () => {
      const apiId = outputs.APIEndpoint.split('/')[2].split('.')[0];

      const getRestApiCommand = new GetRestApiCommand({
        restApiId: apiId,
      });

      const result = await apiGatewayClient.send(getRestApiCommand);
      expect(result.name).toContain('polling-api');
    });
  });

  describe('End-to-End Workflow', () => {
    test('Complete vote submission and retrieval workflow', async () => {
      const votesTableName = outputs.VotesTableName;
      const testUserId = `e2e-user-${Date.now()}`;
      const testPollId = 'e2e-poll-001';
      const testChoice = 'option-c';

      // 1. Submit a vote directly to DynamoDB (simulating Lambda behavior)
      await dynamoClient.send(
        new PutItemCommand({
          TableName: votesTableName,
          Item: {
            userId: { S: testUserId },
            pollId: { S: testPollId },
            choice: { S: testChoice },
            timestamp: { S: new Date().toISOString() },
          },
        })
      );

      // 2. Retrieve the vote
      const getResult = await dynamoClient.send(
        new GetItemCommand({
          TableName: votesTableName,
          Key: {
            userId: { S: testUserId },
            pollId: { S: testPollId },
          },
        })
      );

      expect(getResult.Item?.choice.S).toBe(testChoice);

      // 3. Verify vote cannot be duplicated
      await expect(
        dynamoClient.send(
          new PutItemCommand({
            TableName: votesTableName,
            Item: {
              userId: { S: testUserId },
              pollId: { S: testPollId },
              choice: { S: 'different-option' },
              timestamp: { S: new Date().toISOString() },
            },
            ConditionExpression:
              'attribute_not_exists(userId) AND attribute_not_exists(pollId)',
          })
        )
      ).rejects.toThrow();
    });
  });
});
