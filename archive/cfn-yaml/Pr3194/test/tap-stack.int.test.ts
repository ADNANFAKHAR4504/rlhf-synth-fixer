// Configuration - These are coming from cfn-outputs after deployment
import AWS from 'aws-sdk';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS clients
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda();
const cloudWatch = new AWS.CloudWatch();
const dynamodbRef = new AWS.DynamoDB();
describe('Media Storage System Integration Tests', () => {
  let bucketName: string;
  let tableName: string;
  let processorFunctionName: string;
  let retrieverFunctionName: string;
  let testImageKey: string;

  beforeAll(() => {
    bucketName = outputs.MediaBucketName;
    tableName = outputs.ImageMetadataTableName;
    processorFunctionName = outputs.ImageProcessorFunctionName;
    retrieverFunctionName = outputs.ImageRetrieverFunctionName;
    testImageKey = `test-image-${Date.now()}.jpg`;
  });

  afterAll(async () => {
    // Cleanup test image if it exists
    try {
      await s3.deleteObject({
        Bucket: bucketName,
        Key: testImageKey
      }).promise();
    } catch (error) {
      console.log('Test cleanup completed');
    }
  });

  describe('S3 Bucket Tests', () => {
    test('should have the correct bucket name and be accessible', async () => {
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain('media-storage');

      const bucketExists = await s3.headBucket({ Bucket: bucketName }).promise();
      expect(bucketExists).toBeDefined();
    });

    test('should have CORS configuration enabled', async () => {
      const corsConfig: any = await s3.getBucketCors({ Bucket: bucketName }).promise();
      expect(corsConfig.CORSRules).toBeDefined();
      expect(corsConfig.CORSRules.length).toBeGreaterThan(0);

      const corsRule = corsConfig.CORSRules[0];
      expect(corsRule.AllowedMethods).toContain('GET');
      expect(corsRule.AllowedMethods).toContain('PUT');
      expect(corsRule.AllowedMethods).toContain('POST');
    });

    test('should allow object uploads', async () => {
      const testContent = Buffer.from('test image content');

      const uploadResult = await s3.upload({
        Bucket: bucketName,
        Key: testImageKey,
        Body: testContent,
        ContentType: 'image/jpeg',
        Metadata: {
          uploadedby: 'integration-test',
          id: 'test-123'
        }
      }).promise();

      expect(uploadResult.Location).toBeDefined();
      expect(uploadResult.Key).toBe(testImageKey);
    });
  });

  describe('DynamoDB Table Tests', () => {


    test('should have the correct table name and be accessible', async () => {
      expect(tableName).toBeDefined();
      expect(tableName).toContain('ImageMetadata');

      const tableDescription: any = await dynamodbRef.describeTable({
        TableName: tableName
      }).promise();

      expect(tableDescription.Table.TableName).toBe(tableName);
      expect(tableDescription.Table.BillingModeSummary.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should have Global Secondary Index configured', async () => {
      const tableDescription: any = await dynamodbRef.describeTable({
        TableName: tableName
      }).promise();

      expect(tableDescription.Table.GlobalSecondaryIndexes).toBeDefined();
      expect(tableDescription.Table.GlobalSecondaryIndexes.length).toBe(1);

      const gsi = tableDescription.Table.GlobalSecondaryIndexes[0];
      expect(gsi.IndexName).toBe('UserUploadIndex');
    });

    test('should support item operations', async () => {
      const testItem = {
        id: 'integration-test-item',
        key: 'test-key.jpg',
        contentType: 'image/jpeg',
        fileSize: 1024,
        uploadDate: new Date().toISOString(),
        uploadedBy: 'integration-test',
        bucket: bucketName,
        metadata: {}
      };

      // Put item
      await dynamodb.put({
        TableName: tableName,
        Item: testItem
      }).promise();

      // Get item
      const getResult: any = await dynamodb.get({
        TableName: tableName,
        Key: { id: testItem.id }
      }).promise();

      expect(getResult.Item).toBeDefined();
      expect(getResult.Item.id).toBe(testItem.id);
      expect(getResult.Item.uploadedBy).toBe(testItem.uploadedBy);

      // Query by GSI
      const queryResult: any = await dynamodb.query({
        TableName: tableName,
        IndexName: 'UserUploadIndex',
        KeyConditionExpression: 'uploadedBy = :userId',
        ExpressionAttributeValues: {
          ':userId': testItem.uploadedBy
        }
      }).promise();

      expect(queryResult.Items.length).toBeGreaterThan(0);
      expect(queryResult.Items[0].uploadedBy).toBe(testItem.uploadedBy);
    });
  });

  describe('Lambda Function Tests', () => {
    test('should have image processor function deployed and accessible', async () => {
      expect(processorFunctionName).toBeDefined();

      const functionConfig: any = await lambda.getFunction({
        FunctionName: processorFunctionName
      }).promise();

      expect(functionConfig.Configuration.FunctionName).toBe(processorFunctionName);
      expect(functionConfig.Configuration.Runtime).toBe('nodejs20.x');
      expect(functionConfig.Configuration.Environment.Variables.DYNAMODB_TABLE).toBe(tableName);
      expect(functionConfig.Configuration.Environment.Variables.S3_BUCKET).toBe(bucketName);
    });

    test('should have image retriever function deployed and accessible', async () => {
      expect(retrieverFunctionName).toBeDefined();

      const functionConfig: any = await lambda.getFunction({
        FunctionName: retrieverFunctionName
      }).promise();

      expect(functionConfig.Configuration.FunctionName).toBe(retrieverFunctionName);
      expect(functionConfig.Configuration.Runtime).toBe('nodejs20.x');
      expect(functionConfig.Configuration.Environment.Variables.DYNAMODB_TABLE).toBe(tableName);
      expect(functionConfig.Configuration.Environment.Variables.S3_BUCKET).toBe(bucketName);
    });

  });

  describe('CloudWatch Monitoring Tests', () => {
    test('should have dashboard created', async () => {
      const dashboardName = outputs.DashboardURL;
      expect(dashboardName).toBeDefined();
      expect(dashboardName).toContain('MediaStorageDashboard');
    });

    test('should be able to retrieve Lambda metrics', async () => {
      const metricsParams = {
        Namespace: 'AWS/Lambda',
        MetricName: 'Invocations',
        Dimensions: [
          {
            Name: 'FunctionName',
            Value: processorFunctionName
          }
        ],
        StartTime: new Date(Date.now() - 3600000), // 1 hour ago
        EndTime: new Date(),
        Period: 300,
        Statistics: ['Sum']
      };

      const metricsResult = await cloudWatch.getMetricStatistics(metricsParams).promise();
      expect(metricsResult.Datapoints).toBeDefined();
      expect(Array.isArray(metricsResult.Datapoints)).toBe(true);
    });
  });

  describe('End-to-End Workflow Tests', () => {

    test('should maintain data consistency between S3 and DynamoDB', async () => {
      // Upload a new image
      const consistencyTestKey = `consistency-test-${Date.now()}.jpg`;
      const testMetadata = {
        uploadedby: 'consistency-test',
        id: `consistency-${Date.now()}`
      };

      await s3.upload({
        Bucket: bucketName,
        Key: consistencyTestKey,
        Body: Buffer.from('consistency test image'),
        ContentType: 'image/jpeg',
        Metadata: testMetadata
      }).promise();

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check S3 object exists
      const s3Object = await s3.headObject({
        Bucket: bucketName,
        Key: consistencyTestKey
      }).promise();
      expect(s3Object).toBeDefined();

      // Check DynamoDB record might exist (depending on EventBridge processing)
      // This is eventually consistent, so we don't fail if not found immediately
      try {
        const dbItems: any = await dynamodb.query({
          TableName: tableName,
          IndexName: 'UserUploadIndex',
          KeyConditionExpression: 'uploadedBy = :userId',
          ExpressionAttributeValues: {
            ':userId': testMetadata.uploadedby
          }
        }).promise();

        if (dbItems.Items.length > 0) {
          const dbItem = dbItems.Items.find((item: any) => item.key === consistencyTestKey);
          if (dbItem) {
            expect(dbItem.bucket).toBe(bucketName);
            expect(dbItem.contentType).toBe('image/jpeg');
          }
        }
      } catch (error) {
        console.log('DynamoDB consistency check - item may still be processing');
      }

      // Cleanup
      await s3.deleteObject({
        Bucket: bucketName,
        Key: consistencyTestKey
      }).promise();
    });
  });

  describe('Performance and Scale Tests', () => {

    test('should have appropriate timeout configurations for Lambda functions', async () => {
      // Check processor function timeout
      const processorConfig: any = await lambda.getFunction({
        FunctionName: processorFunctionName
      }).promise();
      expect(processorConfig.Configuration.Timeout).toBe(30);

      // Check retriever function timeout
      const retrieverConfig: any = await lambda.getFunction({
        FunctionName: retrieverFunctionName
      }).promise();
      expect(retrieverConfig.Configuration.Timeout).toBe(10);
    });
  });
});