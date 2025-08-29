// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import AWS from 'aws-sdk';
import axios from 'axios';

// Read outputs from the deployment
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/all-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('cfn-outputs/all-outputs.json not found, tests will be skipped');
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;

// AWS clients
const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodbClient = new AWS.DynamoDB();
const s3 = new AWS.S3();

describe('TapStack Integration Tests', () => {
  // Skip tests if outputs file doesn't exist
  const skipTests = !outputs || Object.keys(outputs).length === 0;

  beforeAll(() => {
    if (skipTests) {
      console.log('Skipping integration tests - cfn-outputs/all-outputs.json not found');
    }
  });

  describe('API Gateway Endpoint', () => {
    test('should respond to HTTP requests with CORS headers', async () => {
      if (skipTests) return;
      
      const apiUrl = outputs[stackName]?.ApiUrl || outputs.ApiUrl;
      expect(apiUrl).toBeDefined();

      const response = await axios.get(apiUrl, {
        timeout: 30000,
        validateStatus: () => true // Accept any status code
      });

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.data).toHaveProperty('message');
      expect(response.data).toHaveProperty('timestamp');
    }, 45000);

    test('should handle OPTIONS requests for CORS preflight', async () => {
      if (skipTests) return;
      
      const apiUrl = outputs[stackName]?.ApiUrl || outputs.ApiUrl;
      expect(apiUrl).toBeDefined();

      const response = await axios.options(apiUrl, {
        timeout: 30000,
        validateStatus: () => true
      });

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
    }, 45000);
  });

  describe('DynamoDB Table', () => {
    test('should exist and be accessible', async () => {
      if (skipTests) return;
      
      const tableName = outputs[stackName]?.TableName || outputs.TableName;
      expect(tableName).toBeDefined();

      const result = await dynamodbClient.describeTable({
        TableName: tableName
      }).promise();

      expect(result.Table).toBeDefined();
      expect(result.Table?.TableStatus).toBe('ACTIVE');
      expect(result.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(result.Table?.KeySchema).toEqual([
        { AttributeName: 'id', KeyType: 'HASH' }
      ]);
    }, 30000);

    test('should allow write operations', async () => {
      if (skipTests) return;
      
      const tableName = outputs[stackName]?.TableName || outputs.TableName;
      expect(tableName).toBeDefined();

      const testItem = {
        id: `test-${Date.now()}`,
        message: 'Integration test item',
        timestamp: new Date().toISOString()
      };

      // Write test item
      await dynamodb.put({
        TableName: tableName,
        Item: testItem
      }).promise();

      // Read back the item to verify
      const result = await dynamodb.get({
        TableName: tableName,
        Key: { id: testItem.id }
      }).promise();

      expect(result.Item).toEqual(testItem);

      // Clean up test item
      await dynamodb.delete({
        TableName: tableName,
        Key: { id: testItem.id }
      }).promise();
    }, 30000);
  });

  describe('S3 Logs Bucket', () => {
    test('should exist and be accessible', async () => {
      if (skipTests) return;
      
      const bucketName = outputs[stackName]?.LogsBucketName || outputs.LogsBucketName;
      expect(bucketName).toBeDefined();

      const result = await s3.headBucket({
        Bucket: bucketName
      }).promise();

      expect(result).toBeDefined();
    }, 30000);

    test('should have versioning enabled', async () => {
      if (skipTests) return;
      
      const bucketName = outputs[stackName]?.LogsBucketName || outputs.LogsBucketName;
      expect(bucketName).toBeDefined();

      const result = await s3.getBucketVersioning({
        Bucket: bucketName
      }).promise();

      expect(result.Status).toBe('Enabled');
    }, 30000);

    test('should block public access', async () => {
      if (skipTests) return;
      
      const bucketName = outputs[stackName]?.LogsBucketName || outputs.LogsBucketName;
      expect(bucketName).toBeDefined();

      const result = await s3.getPublicAccessBlock({
        Bucket: bucketName
      }).promise();

      expect(result.PublicAccessBlockConfiguration).toEqual({
        BlockPublicAcls: true,
        IgnorePublicAcls: true,
        BlockPublicPolicy: true,
        RestrictPublicBuckets: true
      });
    }, 30000);

    test('should allow Lambda function to write logs', async () => {
      if (skipTests) return;
      
      const bucketName = outputs[stackName]?.LogsBucketName || outputs.LogsBucketName;
      const apiUrl = outputs[stackName]?.ApiUrl || outputs.ApiUrl;
      expect(bucketName).toBeDefined();
      expect(apiUrl).toBeDefined();

      // Trigger Lambda function to generate logs
      await axios.get(apiUrl, { timeout: 30000 });

      // Wait a moment for logs to be written
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check if logs directory exists and has content
      const result = await s3.listObjectsV2({
        Bucket: bucketName,
        Prefix: 'logs/'
      }).promise();

      expect(result.Contents).toBeDefined();
      expect(result.Contents!.length).toBeGreaterThan(0);
    }, 60000);
  });

  describe('Lambda Function Integration', () => {
    test('should process requests and write to S3 logs', async () => {
      if (skipTests) return;
      
      const apiUrl = outputs[stackName]?.ApiUrl || outputs.ApiUrl;
      const bucketName = outputs[stackName]?.LogsBucketName || outputs.LogsBucketName;
      expect(apiUrl).toBeDefined();
      expect(bucketName).toBeDefined();

      // Get initial log count
      const initialLogs = await s3.listObjectsV2({
        Bucket: bucketName,
        Prefix: 'logs/'
      }).promise();
      const initialCount = initialLogs.Contents?.length || 0;

      // Make API request
      const response = await axios.post(apiUrl, {
        test: 'integration-test',
        timestamp: new Date().toISOString()
      }, { timeout: 30000 });

      expect(response.status).toBe(200);

      // Wait for logs to be written
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check that new logs were created
      const finalLogs = await s3.listObjectsV2({
        Bucket: bucketName,
        Prefix: 'logs/'
      }).promise();
      const finalCount = finalLogs.Contents?.length || 0;

      expect(finalCount).toBeGreaterThan(initialCount);
    }, 60000);
  });

  describe('Security and Compliance', () => {
    test('should enforce HTTPS on S3 bucket', async () => {
      if (skipTests) return;
      
      const bucketName = outputs[stackName]?.LogsBucketName || outputs.LogsBucketName;
      expect(bucketName).toBeDefined();

      const result = await s3.getBucketPolicy({
        Bucket: bucketName
      }).promise();

      const policy = JSON.parse(result.Policy!);
      const sslStatement = policy.Statement.find((stmt: any) => 
        stmt.Effect === 'Deny' && 
        stmt.Condition?.Bool?.['aws:SecureTransport'] === 'false'
      );

      expect(sslStatement).toBeDefined();
    }, 30000);

    test('should have proper resource tagging', async () => {
      if (skipTests) return;
      
      const tableName = outputs[stackName]?.TableName || outputs.TableName;
      const bucketName = outputs[stackName]?.LogsBucketName || outputs.LogsBucketName;
      
      // Check DynamoDB table tags
      const tableResult = await dynamodbClient.listTagsOfResource({
        ResourceArn: `arn:aws:dynamodb:${process.env.AWS_DEFAULT_REGION}:${process.env.CDK_DEFAULT_ACCOUNT}:table/${tableName}`
      }).promise();

      const environmentTag = tableResult.Tags?.find((tag: any) => tag.Key === 'Environment');
      expect(environmentTag?.Value).toBe('Production');

      // Check S3 bucket tags
      const bucketResult = await s3.getBucketTagging({
        Bucket: bucketName
      }).promise();

      const bucketEnvTag = bucketResult.TagSet.find(tag => tag.Key === 'Environment');
      expect(bucketEnvTag?.Value).toBe('Production');
    }, 30000);
  });
});
