import * as fs from 'fs';
import * as path from 'path';
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { RDSClient, DescribeDBClustersCommand } from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  APIGatewayClient,
  GetRestApiCommand,
} from '@aws-sdk/client-api-gateway';
import { EC2Client, DescribeVpcsCommand } from '@aws-sdk/client-ec2';

const outputsPath = path.join(
  process.cwd(),
  'cfn-outputs',
  'flat-outputs.json'
);
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

const dynamoDBClient = new DynamoDBClient({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const apiGatewayClient = new APIGatewayClient({ region });
const ec2Client = new EC2Client({ region });

describe('TapStack Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('VPC exists and is accessible', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-/);

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs.length).toBe(1);
      expect(response.Vpcs[0].VpcId).toBe(vpcId);
      expect(response.Vpcs[0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs[0].State).toBe('available');
    });
  });

  describe('Database Resources', () => {
    test('Aurora cluster is running and accessible', async () => {
      const dbEndpoint = outputs.DatabaseEndpoint;
      expect(dbEndpoint).toBeDefined();
      expect(dbEndpoint).toContain('.rds.amazonaws.com');

      const command = new DescribeDBClustersCommand({
        Filters: [
          {
            Name: 'engine',
            Values: ['aurora-postgresql'],
          },
        ],
      });
      const response = await rdsClient.send(command);

      expect(response.DBClusters).toBeDefined();
      const cluster = response.DBClusters.find(c => c.Endpoint === dbEndpoint);
      expect(cluster).toBeDefined();
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.EngineVersion).toBe('15.13');
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.BackupRetentionPeriod).toBe(7);
    });

    test('User sessions DynamoDB table exists and is active', async () => {
      const tableName = outputs.UserSessionsTableName;
      expect(tableName).toBeDefined();
      expect(tableName).toBe(`user-sessions-${environmentSuffix}`);

      const command = new DescribeTableCommand({
        TableName: tableName,
      });
      const response = await dynamoDBClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table.TableStatus).toBe('ACTIVE');
      expect(response.Table.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
      expect(response.Table.KeySchema).toEqual([
        {
          AttributeName: 'sessionId',
          KeyType: 'HASH',
        },
      ]);
      expect(response.Table.SSEDescription?.Status).toBe('ENABLED');
    });

    test('User sessions table supports CRUD operations', async () => {
      const tableName = outputs.UserSessionsTableName;
      const testSessionId = `test-session-${Date.now()}`;
      const testTtl = Math.floor(Date.now() / 1000) + 3600;

      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          sessionId: { S: testSessionId },
          userId: { S: 'test-user-123' },
          ttl: { N: testTtl.toString() },
          createdAt: { S: new Date().toISOString() },
        },
      });
      await dynamoDBClient.send(putCommand);

      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          sessionId: { S: testSessionId },
        },
      });
      const getResponse = await dynamoDBClient.send(getCommand);

      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item.sessionId.S).toBe(testSessionId);
      expect(getResponse.Item.userId.S).toBe('test-user-123');

      const deleteCommand = new DeleteItemCommand({
        TableName: tableName,
        Key: {
          sessionId: { S: testSessionId },
        },
      });
      await dynamoDBClient.send(deleteCommand);
    });

    test('API keys DynamoDB table exists and is active', async () => {
      const tableName = outputs.ApiKeysTableName;
      expect(tableName).toBeDefined();
      expect(tableName).toBe(`api-keys-${environmentSuffix}`);

      const command = new DescribeTableCommand({
        TableName: tableName,
      });
      const response = await dynamoDBClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table.TableStatus).toBe('ACTIVE');
      expect(response.Table.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
      expect(response.Table.KeySchema).toEqual([
        {
          AttributeName: 'apiKey',
          KeyType: 'HASH',
        },
      ]);
      expect(response.Table.GlobalSecondaryIndexes).toBeDefined();
      expect(response.Table.GlobalSecondaryIndexes[0].IndexName).toBe(
        'UserIdIndex'
      );
      expect(response.Table.SSEDescription?.Status).toBe('ENABLED');
    });

    test('API keys table supports CRUD operations', async () => {
      const tableName = outputs.ApiKeysTableName;
      const testApiKey = `test-api-key-${Date.now()}`;

      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          apiKey: { S: testApiKey },
          userId: { S: 'test-user-456' },
          createdAt: { S: new Date().toISOString() },
          active: { BOOL: true },
        },
      });
      await dynamoDBClient.send(putCommand);

      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          apiKey: { S: testApiKey },
        },
      });
      const getResponse = await dynamoDBClient.send(getCommand);

      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item.apiKey.S).toBe(testApiKey);
      expect(getResponse.Item.userId.S).toBe('test-user-456');
      expect(getResponse.Item.active.BOOL).toBe(true);

      const deleteCommand = new DeleteItemCommand({
        TableName: tableName,
        Key: {
          apiKey: { S: testApiKey },
        },
      });
      await dynamoDBClient.send(deleteCommand);
    });
  });

  describe('Storage Resources', () => {
    test('Raw data bucket exists and is accessible', async () => {
      const bucketName = outputs.RawDataBucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toBe(`trading-raw-data-${environmentSuffix}`);

      const command = new HeadBucketCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);

      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('Raw data bucket supports object operations', async () => {
      const bucketName = outputs.RawDataBucketName;
      const testKey = `test/test-file-${Date.now()}.txt`;
      const testContent = 'Test content for integration test';

      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
      });
      await s3Client.send(putCommand);

      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      });
      const getResponse = await s3Client.send(getCommand);

      expect(getResponse.Body).toBeDefined();
      const retrievedContent = await getResponse.Body.transformToString();
      expect(retrievedContent).toBe(testContent);

      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      });
      await s3Client.send(deleteCommand);
    });

    test('Processed data bucket exists and is accessible', async () => {
      const bucketName = outputs.ProcessedDataBucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toBe(`trading-processed-data-${environmentSuffix}`);

      const command = new HeadBucketCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);

      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('Processed data bucket supports object operations', async () => {
      const bucketName = outputs.ProcessedDataBucketName;
      const testKey = `processed/test-result-${Date.now()}.json`;
      const testContent = JSON.stringify({
        result: 'success',
        timestamp: Date.now(),
      });

      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
        ContentType: 'application/json',
      });
      await s3Client.send(putCommand);

      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      });
      const getResponse = await s3Client.send(getCommand);

      expect(getResponse.Body).toBeDefined();
      expect(getResponse.ContentType).toBe('application/json');
      const retrievedContent = await getResponse.Body.transformToString();
      expect(JSON.parse(retrievedContent)).toEqual(JSON.parse(testContent));

      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      });
      await s3Client.send(deleteCommand);
    });

    test('Archive bucket exists and is accessible', async () => {
      const bucketName = outputs.ArchiveBucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toBe(`trading-archive-${environmentSuffix}`);

      const command = new HeadBucketCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);

      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('Archive bucket supports object operations', async () => {
      const bucketName = outputs.ArchiveBucketName;
      const testKey = `archive/test-archive-${Date.now()}.dat`;
      const testContent = 'Archived data for long-term storage';

      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
      });
      await s3Client.send(putCommand);

      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      });
      const getResponse = await s3Client.send(getCommand);

      expect(getResponse.Body).toBeDefined();
      const retrievedContent = await getResponse.Body.transformToString();
      expect(retrievedContent).toBe(testContent);

      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      });
      await s3Client.send(deleteCommand);
    });
  });

  describe('Compute Resources', () => {
    test('Lambda data processor function exists and is active', async () => {
      const functionName = outputs.DataProcessorFunctionName;
      const functionArn = outputs.DataProcessorFunctionArn;
      expect(functionName).toBeDefined();
      expect(functionName).toBe(`data-processor-${environmentSuffix}`);
      expect(functionArn).toBeDefined();
      expect(functionArn).toContain(functionName);

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration.FunctionName).toBe(functionName);
      expect(response.Configuration.Runtime).toBe('nodejs18.x');
      expect(response.Configuration.State).toBe('Active');
      expect(response.Configuration.Timeout).toBe(300);
      expect(response.Configuration.MemorySize).toBe(1024);
      expect(response.Configuration.Architectures).toEqual(['arm64']);
      expect(response.Configuration.TracingConfig?.Mode).toBe('Active');
    });

    test('Lambda function has correct environment variables', async () => {
      const functionName = outputs.DataProcessorFunctionName;

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration.Environment?.Variables).toBeDefined();
      expect(response.Configuration.Environment.Variables.RAW_DATA_BUCKET).toBe(
        outputs.RawDataBucketName
      );
      expect(
        response.Configuration.Environment.Variables.PROCESSED_DATA_BUCKET
      ).toBe(outputs.ProcessedDataBucketName);
      expect(response.Configuration.Environment.Variables.ENVIRONMENT).toBe(
        environmentSuffix
      );
    });

    test('Lambda function can be invoked successfully', async () => {
      const functionName = outputs.DataProcessorFunctionName;

      const testEvent = {
        Records: [
          {
            s3: {
              bucket: {
                name: outputs.RawDataBucketName,
              },
              object: {
                key: 'ingest/test-file.txt',
              },
            },
          },
        ],
      };

      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify(testEvent),
      });
      const response = await lambdaClient.send(command);

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();

      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      expect(payload.statusCode).toBe(200);
      const body = JSON.parse(payload.body);
      expect(body.message).toBe('Data processed successfully');
      expect(body.bucket).toBe(outputs.RawDataBucketName);
      expect(body.key).toBe('ingest/test-file.txt');
    });
  });

  describe('API Gateway', () => {
    test('API Gateway REST API exists and is deployed', async () => {
      const apiUrl = outputs.ApiGatewayUrl;
      expect(apiUrl).toBeDefined();
      expect(apiUrl).toContain('.execute-api.');
      expect(apiUrl).toContain(region);
      expect(apiUrl).toContain('.amazonaws.com');

      const apiId = apiUrl.split('//')[1].split('.')[0];

      const command = new GetRestApiCommand({
        restApiId: apiId,
      });
      const response = await apiGatewayClient.send(command);

      expect(response.id).toBe(apiId);
      expect(response.name).toBe(`trading-api-${environmentSuffix}`);
      expect(response.description).toBe('Trading Analytics Platform API');
    });
  });

  describe('End-to-End Workflow', () => {
    test('Complete data processing workflow', async () => {
      const rawBucket = outputs.RawDataBucketName;
      const processedBucket = outputs.ProcessedDataBucketName;
      const sessionTable = outputs.UserSessionsTableName;
      const apiKeyTable = outputs.ApiKeysTableName;
      const timestamp = Date.now();

      const sessionId = `e2e-session-${timestamp}`;
      const apiKey = `e2e-api-key-${timestamp}`;
      const rawDataKey = `ingest/e2e-test-${timestamp}.json`;
      const testData = {
        userId: 'e2e-user',
        action: 'trade',
        amount: 1000,
        timestamp: new Date().toISOString(),
      };

      const putSessionCommand = new PutItemCommand({
        TableName: sessionTable,
        Item: {
          sessionId: { S: sessionId },
          userId: { S: 'e2e-user' },
          ttl: { N: (Math.floor(Date.now() / 1000) + 3600).toString() },
          createdAt: { S: new Date().toISOString() },
        },
      });
      await dynamoDBClient.send(putSessionCommand);

      const putApiKeyCommand = new PutItemCommand({
        TableName: apiKeyTable,
        Item: {
          apiKey: { S: apiKey },
          userId: { S: 'e2e-user' },
          createdAt: { S: new Date().toISOString() },
          active: { BOOL: true },
        },
      });
      await dynamoDBClient.send(putApiKeyCommand);

      const putS3Command = new PutObjectCommand({
        Bucket: rawBucket,
        Key: rawDataKey,
        Body: JSON.stringify(testData),
        ContentType: 'application/json',
      });
      await s3Client.send(putS3Command);

      const getS3Command = new GetObjectCommand({
        Bucket: rawBucket,
        Key: rawDataKey,
      });
      const s3Response = await s3Client.send(getS3Command);
      const retrievedData = await s3Response.Body.transformToString();
      expect(JSON.parse(retrievedData)).toEqual(testData);

      const deleteS3Command = new DeleteObjectCommand({
        Bucket: rawBucket,
        Key: rawDataKey,
      });
      await s3Client.send(deleteS3Command);

      const deleteSessionCommand = new DeleteItemCommand({
        TableName: sessionTable,
        Key: {
          sessionId: { S: sessionId },
        },
      });
      await dynamoDBClient.send(deleteSessionCommand);

      const deleteApiKeyCommand = new DeleteItemCommand({
        TableName: apiKeyTable,
        Key: {
          apiKey: { S: apiKey },
        },
      });
      await dynamoDBClient.send(deleteApiKeyCommand);
    });
  });
});
