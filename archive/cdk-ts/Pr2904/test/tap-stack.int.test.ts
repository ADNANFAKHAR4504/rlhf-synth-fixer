// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import path from 'path';
import { 
  DynamoDBClient, 
  DescribeTableCommand, 
  ScanCommand,
  PutItemCommand,
  DeleteItemCommand,
  DescribeContinuousBackupsCommand
} from '@aws-sdk/client-dynamodb';
import { 
  S3Client, 
  HeadBucketCommand, 
  PutObjectCommand,
  DeleteObjectCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  GetBucketNotificationConfigurationCommand
} from '@aws-sdk/client-s3';
import { 
  LambdaClient, 
  GetFunctionCommand, 
  InvokeCommand 
} from '@aws-sdk/client-lambda';
import { 
  APIGatewayClient, 
  GetRestApisCommand,
  GetResourcesCommand,
  TestInvokeMethodCommand
} from '@aws-sdk/client-api-gateway';
import { 
  CloudWatchClient, 
  ListDashboardsCommand,
  GetDashboardCommand
} from '@aws-sdk/client-cloudwatch';
import { 
  CloudWatchLogsClient, 
  DescribeLogGroupsCommand 
} from '@aws-sdk/client-cloudwatch-logs';

// Get environment suffix and AWS region from environment variables (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const awsRegion = process.env.AWS_REGION || 'ap-northeast-1';

// Initialize AWS clients
const dynamodbClient = new DynamoDBClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const lambdaClient = new LambdaClient({ region: awsRegion });
const apiGatewayClient = new APIGatewayClient({ region: awsRegion });
const cloudwatchClient = new CloudWatchClient({ region: awsRegion });
const cloudwatchLogsClient = new CloudWatchLogsClient({ region: awsRegion });

// Read outputs from flat-outputs.json (generated after deployment)
let outputs: any = {};
const flatOutputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');

try {
  if (fs.existsSync(flatOutputsPath)) {
    outputs = JSON.parse(fs.readFileSync(flatOutputsPath, 'utf8'));
  } else {
    console.warn('flat-outputs.json not found, some tests may fail');
  }
} catch (error) {
  console.warn('Error reading flat-outputs.json:', error);
}

// Extract stack name prefix for resource identification
const stackNamePrefix = `TapStack${environmentSuffix}`;

describe('Serverless Application Integration Tests', () => {
  
  describe('DynamoDB Table Tests', () => {
    const tableName = `serverless-data-table-${environmentSuffix}`;

    test('should exist and have correct configuration', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table!.TableName).toBe(tableName);
      expect(response.Table!.TableStatus).toBe('ACTIVE');
      expect(response.Table!.KeySchema).toContainEqual({
        AttributeName: 'id',
        KeyType: 'HASH'
      });
      expect(response.Table!.ProvisionedThroughput!.ReadCapacityUnits).toBe(5);
      expect(response.Table!.ProvisionedThroughput!.WriteCapacityUnits).toBe(5);
      
      // Check point-in-time recovery using the correct API
      const backupCommand = new DescribeContinuousBackupsCommand({ TableName: tableName });
      const backupResponse = await dynamodbClient.send(backupCommand);
      expect(backupResponse.ContinuousBackupsDescription!.PointInTimeRecoveryDescription!.PointInTimeRecoveryStatus).toBe('ENABLED');
    });

    test('should support read and write operations', async () => {
      const testId = `integration-test-${Date.now()}`;
      
      // Put test item
      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: testId },
          testData: { S: 'integration test data' },
          timestamp: { S: new Date().toISOString() }
        }
      });
      await dynamodbClient.send(putCommand);

      // Verify item exists
      const scanCommand = new ScanCommand({
        TableName: tableName,
        FilterExpression: 'id = :id',
        ExpressionAttributeValues: {
          ':id': { S: testId }
        }
      });
      const scanResponse = await dynamodbClient.send(scanCommand);
      
      expect(scanResponse.Items).toBeDefined();
      expect(scanResponse.Items!.length).toBe(1);
      expect(scanResponse.Items![0].id.S).toBe(testId);

      // Clean up test item
      const deleteCommand = new DeleteItemCommand({
        TableName: tableName,
        Key: {
          id: { S: testId }
        }
      });
      await dynamodbClient.send(deleteCommand);
    });
  });

  describe('S3 Bucket Tests', () => {
    let bucketName: string;

    beforeAll(() => {
      // Extract bucket name from outputs or construct it
      bucketName = outputs.S3BucketName || `prod-${process.env.AWS_ACCOUNT_ID || '546574183988'}-data-storage`;
    });

    test('should exist and be accessible', async () => {
      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('should have encryption configured', async () => {
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules).toHaveLength(1);
      expect(response.ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('AES256');
    });

    test('should block public access', async () => {
      const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      
      expect(response.PublicAccessBlockConfiguration).toEqual({
        BlockPublicAcls: true,
        IgnorePublicAcls: true,
        BlockPublicPolicy: true,
        RestrictPublicBuckets: true
      });
    });

    test('should have Lambda notification configured', async () => {
      const command = new GetBucketNotificationConfigurationCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      
      
      expect(response.LambdaFunctionConfigurations).toBeDefined();
      expect(response.LambdaFunctionConfigurations!.length).toBeGreaterThan(0);
      
      const lambdaConfig = response.LambdaFunctionConfigurations![0];
      expect(lambdaConfig.Events).toContain('s3:ObjectCreated:*');
      expect(lambdaConfig.Filter?.Key?.FilterRules).toContainEqual({
        Name: 'Prefix',
        Value: 'uploads/'
      });
    });

    test('should trigger Lambda on object upload', async () => {
      const testKey = `uploads/integration-test-${Date.now()}.txt`;
      const testContent = 'Integration test content';

      // Upload test file
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain'
      });
      await s3Client.send(putCommand);

      // Wait a bit for Lambda to process
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verify Lambda was triggered by checking DynamoDB for S3 event record
      const tableName = `serverless-data-table-${environmentSuffix}`;
      const scanCommand = new ScanCommand({
        TableName: tableName,
        FilterExpression: 'contains(#key, :key)',
        ExpressionAttributeNames: {
          '#key': 'key'
        },
        ExpressionAttributeValues: {
          ':key': { S: testKey }
        }
      });
      
      const scanResponse = await dynamodbClient.send(scanCommand);
      expect(scanResponse.Items!.length).toBeGreaterThan(0);

      // Clean up test file
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey
      });
      await s3Client.send(deleteCommand);
    });
  });

  describe('Lambda Function Tests', () => {
    const functionName = `serverless-processor-${environmentSuffix}`;

    test('should exist and be active', async () => {
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.FunctionName).toBe(functionName);
      expect(response.Configuration!.State).toBe('Active');
      expect(response.Configuration!.Runtime).toBe('nodejs18.x');
      expect(response.Configuration!.Handler).toBe('index.handler');
      expect(response.Configuration!.Timeout).toBe(10);
    });

    test('should have correct environment variables', async () => {
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration!.Environment!.Variables).toEqual(
        expect.objectContaining({
          STAGE: 'production',
          REGION: awsRegion,
          DYNAMODB_TABLE_NAME: `serverless-data-table-${environmentSuffix}`
        })
      );
    });

    test('should handle direct invocation', async () => {
      const testEvent = {
        httpMethod: 'GET',
        path: '/test'
      };

      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify(testEvent),
        InvocationType: 'RequestResponse'
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);
      
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      expect(payload.statusCode).toBe(200);
      expect(JSON.parse(payload.body).message).toBe('Hello from Serverless API!');
      expect(JSON.parse(payload.body).stage).toBe('production');
    });
  });

  describe('API Gateway Tests', () => {
    let apiId: string;

    beforeAll(async () => {
      // Find API Gateway by name
      const command = new GetRestApisCommand({});
      const response = await apiGatewayClient.send(command);
      
      const api = response.items?.find(api => 
        api.name === `serverless-api-${environmentSuffix}`
      );
      expect(api).toBeDefined();
      apiId = api!.id!;
    });

    test('should exist with correct configuration', async () => {
      const command = new GetRestApisCommand({});
      const response = await apiGatewayClient.send(command);
      
      const api = response.items?.find(api => api.id === apiId);
      expect(api).toBeDefined();
      expect(api!.name).toBe(`serverless-api-${environmentSuffix}`);
      expect(api!.description).toBe('Serverless application API');
      expect(api!.endpointConfiguration?.types).toContain('REGIONAL');
    });

    test('should have correct resources and methods', async () => {
      const command = new GetResourcesCommand({ restApiId: apiId });
      const response = await apiGatewayClient.send(command);

      const resources = response.items || [];
      const dataResource = resources.find(r => r.pathPart === 'data');
      const healthResource = resources.find(r => r.pathPart === 'health');

      expect(dataResource).toBeDefined();
      expect(healthResource).toBeDefined();

      // Check methods
      expect(dataResource!.resourceMethods).toEqual(
        expect.objectContaining({
          GET: expect.anything(),
          POST: expect.anything()
        })
      );
      expect(healthResource!.resourceMethods).toEqual(
        expect.objectContaining({
          GET: expect.anything()
        })
      );
    });

    test('should handle test invocation of health endpoint', async () => {
      const resourcesCommand = new GetResourcesCommand({ restApiId: apiId });
      const resourcesResponse = await apiGatewayClient.send(resourcesCommand);
      const healthResource = resourcesResponse.items?.find(r => r.pathPart === 'health');

      const testCommand = new TestInvokeMethodCommand({
        restApiId: apiId,
        resourceId: healthResource!.id!,
        httpMethod: 'GET'
      });

      const response = await apiGatewayClient.send(testCommand);
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      
      const body = JSON.parse(response.body!);
      expect(body.message).toBe('Hello from Serverless API!');
      expect(body.stage).toBe('production');
    });
  });

  describe('CloudWatch Tests', () => {
    test('should have dashboard created', async () => {
      const command = new ListDashboardsCommand({
        DashboardNamePrefix: `serverless-dashboard-${environmentSuffix}`
      });
      const response = await cloudwatchClient.send(command);

      expect(response.DashboardEntries).toBeDefined();
      expect(response.DashboardEntries!.length).toBeGreaterThan(0);
      
      const dashboard = response.DashboardEntries![0];
      expect(dashboard.DashboardName).toBe(`serverless-dashboard-${environmentSuffix}`);
    });

    test('should have dashboard with widgets', async () => {
      const command = new GetDashboardCommand({
        DashboardName: `serverless-dashboard-${environmentSuffix}`
      });
      const response = await cloudwatchClient.send(command);

      expect(response.DashboardBody).toBeDefined();
      const dashboardBody = JSON.parse(response.DashboardBody!);
      expect(dashboardBody.widgets).toBeDefined();
      expect(dashboardBody.widgets.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Logs Tests', () => {
    test('should have Lambda log group with correct retention', async () => {
      const logGroupName = `/aws/lambda/serverless-processor-${environmentSuffix}`;
      
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      });
      const response = await cloudwatchLogsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
      
      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toBe(logGroupName);
      expect(logGroup.retentionInDays).toBe(14);
    });
  });

  describe('End-to-End Workflow Tests', () => {
    test('should complete full workflow: S3 upload -> Lambda trigger -> DynamoDB record', async () => {
      const bucketName = outputs.S3BucketName || `prod-${process.env.AWS_ACCOUNT_ID || '546574183988'}-data-storage`;
      const tableName = `serverless-data-table-${environmentSuffix}`;
      const testKey = `uploads/e2e-test-${Date.now()}.json`;
      const testData = { message: 'End-to-end test', timestamp: new Date().toISOString() };

      // Step 1: Upload file to S3
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: JSON.stringify(testData),
        ContentType: 'application/json'
      });
      await s3Client.send(putCommand);

      // Step 2: Wait for Lambda processing
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Step 3: Verify DynamoDB record was created
      const scanCommand = new ScanCommand({
        TableName: tableName,
        FilterExpression: 'contains(#key, :key)',
        ExpressionAttributeNames: {
          '#key': 'key'
        },
        ExpressionAttributeValues: {
          ':key': { S: testKey }
        }
      });
      
      const scanResponse = await dynamodbClient.send(scanCommand);
      expect(scanResponse.Items!.length).toBeGreaterThan(0);
      
      const record = scanResponse.Items![0];
      expect(record.bucket.S).toBe(bucketName);
      expect(record.key.S).toBe(testKey);
      expect(record.eventName.S).toBe('ObjectCreated:Put');

      // Clean up
      const deleteS3Command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey
      });
      await s3Client.send(deleteS3Command);

      const deleteDynamoCommand = new DeleteItemCommand({
        TableName: tableName,
        Key: {
          id: record.id
        }
      });
      await dynamodbClient.send(deleteDynamoCommand);
    });

    test('should handle API Gateway -> Lambda -> DynamoDB workflow', async () => {
      const functionName = `serverless-processor-${environmentSuffix}`;
      
      // Simulate API Gateway event
      const apiEvent = {
        httpMethod: 'POST',
        path: '/data',
        body: JSON.stringify({ test: 'api integration' }),
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify(apiEvent),
        InvocationType: 'RequestResponse'
      });

      const response = await lambdaClient.send(invokeCommand);
      expect(response.StatusCode).toBe(200);
      
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      expect(payload.statusCode).toBe(200);
      expect(JSON.parse(payload.body).message).toBe('Hello from Serverless API!');
    });
  });
});
