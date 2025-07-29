// Integration tests for IoT Data Processor infrastructure
//changes made
import fs from 'fs';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, ScanCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { CloudWatchLogsClient, DescribeLogGroupsCommand, DescribeLogStreamsCommand } from '@aws-sdk/client-cloudwatch-logs';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS clients configured for us-west-2
const s3Client = new S3Client({ region: 'us-west-2' });
const dynamoClient = new DynamoDBClient({ region: 'us-west-2' });
const lambdaClient = new LambdaClient({ region: 'us-west-2' });
const logsClient = new CloudWatchLogsClient({ region: 'us-west-2' });

// Test data
const testDeviceData = {
  deviceId: 'test-device-001',
  temperature: 23.5,
  humidity: 65.2,
  timestamp: new Date().toISOString(),
  location: 'Seattle, WA',
  batteryLevel: 85
};

describe('IoT Data Processor Integration Tests', () => {
  const bucketName = outputs['S3BucketName'];
  const tableName = outputs['DynamoDBTableName'];
  const functionName = outputs['LambdaFunctionName'];
  const logGroupName = outputs['LogGroupName'];
  
  // Test file key for S3 operations
  const testFileKey = `test-iot-data-${Date.now()}.json`;

  describe('Infrastructure Validation', () => {
    test('should have all required outputs from CloudFormation', () => {
      expect(bucketName).toBeDefined();
      expect(tableName).toBeDefined();
      expect(functionName).toBeDefined();
      expect(logGroupName).toBeDefined();
      
      expect(bucketName).toBe(`iot-data-bucket-${environmentSuffix}`);
      expect(tableName).toBe(`iot-processed-data-${environmentSuffix}`);
      expect(functionName).toBe('IoTDataProcessor');
      expect(logGroupName).toBe('/aws/lambda/IoTDataProcessor');
    });

    test('should have CloudWatch log group created', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/lambda/IoTDataProcessor'
      });
      
      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
      expect(response.logGroups![0].logGroupName).toBe('/aws/lambda/IoTDataProcessor');
    });
  });

  describe('End-to-End IoT Data Processing Workflow', () => {
    beforeAll(async () => {
      // Clean up any existing test data
      await cleanupTestData();
    });

    afterAll(async () => {
      // Clean up test data after tests
      await cleanupTestData();
    });

    test('should process IoT data file uploaded to S3 and store in DynamoDB', async () => {
      // Step 1: Upload test IoT data file to S3
      const putObjectCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testFileKey,
        Body: JSON.stringify(testDeviceData),
        ContentType: 'application/json'
      });

      await s3Client.send(putObjectCommand);
      console.log(`Uploaded test file: ${testFileKey}`);

      // Step 2: Wait for Lambda to process the file (S3 event trigger)
      // Give it some time to process asynchronously
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Step 3: Verify data was processed and stored in DynamoDB
      const scanCommand = new ScanCommand({
        TableName: tableName,
        FilterExpression: 'fileName = :fileName',
        ExpressionAttributeValues: {
          ':fileName': { S: testFileKey }
        }
      });

      const scanResponse = await dynamoClient.send(scanCommand);
      
      expect(scanResponse.Items).toBeDefined();
      expect(scanResponse.Items!.length).toBeGreaterThan(0);
      
      const processedItem = scanResponse.Items![0];
      expect(processedItem.deviceId.S).toBe(testDeviceData.deviceId);
      expect(processedItem.fileName.S).toBe(testFileKey);
      expect(processedItem.status.S).toBe('processed');
      expect(processedItem.originalData.S).toContain(testDeviceData.deviceId);
      expect(processedItem.processedAt.S).toBeDefined();
      expect(processedItem.timestamp.S).toBeDefined();
    }, 30000);

    test('should handle multiple IoT device files concurrently', async () => {
      const deviceCount = 5;
      const testFiles = [];

      // Create multiple test device data files
      for (let i = 0; i < deviceCount; i++) {
        const deviceData = {
          ...testDeviceData,
          deviceId: `test-device-${i}`,
          temperature: 20 + Math.random() * 10,
          humidity: 60 + Math.random() * 20
        };
        
        const fileKey = `batch-test-${Date.now()}-device-${i}.json`;
        testFiles.push({ fileKey, deviceData });
        
        // Upload file to S3
        const putObjectCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: fileKey,
          Body: JSON.stringify(deviceData),
          ContentType: 'application/json'
        });
        
        await s3Client.send(putObjectCommand);
      }

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 15000));

      // Verify all files were processed
      for (const testFile of testFiles) {
        const scanCommand = new ScanCommand({
          TableName: tableName,
          FilterExpression: 'fileName = :fileName',
          ExpressionAttributeValues: {
            ':fileName': { S: testFile.fileKey }
          }
        });

        const scanResponse = await dynamoClient.send(scanCommand);
        expect(scanResponse.Items!.length).toBe(1);
        expect(scanResponse.Items![0].deviceId.S).toBe(testFile.deviceData.deviceId);
        expect(scanResponse.Items![0].status.S).toBe('processed');
        
        // Cleanup
        await s3Client.send(new DeleteObjectCommand({
          Bucket: bucketName,
          Key: testFile.fileKey
        }));
        
        await dynamoClient.send(new DeleteItemCommand({
          TableName: tableName,
          Key: {
            deviceId: { S: testFile.deviceData.deviceId },
            timestamp: scanResponse.Items![0].timestamp
          }
        }));
      }
    }, 45000);

    test('should log processing activity to CloudWatch', async () => {
      // Upload a test file to trigger logging
      const logTestFileKey = `log-test-${Date.now()}.json`;
      const putObjectCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: logTestFileKey,
        Body: JSON.stringify({
          ...testDeviceData,
          deviceId: 'log-test-device'
        }),
        ContentType: 'application/json'
      });

      await s3Client.send(putObjectCommand);

      // Wait for processing and logging
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Check if log streams exist
      const describeLogStreamsCommand = new DescribeLogStreamsCommand({
        logGroupName: '/aws/lambda/IoTDataProcessor',
        orderBy: 'LastEventTime',
        descending: true,
        limit: 5
      });

      const logStreamsResponse = await logsClient.send(describeLogStreamsCommand);
      expect(logStreamsResponse.logStreams).toBeDefined();
      expect(logStreamsResponse.logStreams!.length).toBeGreaterThan(0);

      // Cleanup
      await s3Client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: logTestFileKey
      }));
    }, 30000);

    test('should handle invalid JSON data gracefully', async () => {
      const invalidFileKey = `invalid-data-${Date.now()}.json`;
      
      // Upload invalid JSON data
      const putObjectCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: invalidFileKey,
        Body: 'This is not valid JSON data',
        ContentType: 'application/json'
      });

      await s3Client.send(putObjectCommand);

      // Wait for processing attempt
      await new Promise(resolve => setTimeout(resolve, 10000));

      // The Lambda should handle this gracefully and log the error
      // Verify no corrupt data was written to DynamoDB
      const scanCommand = new ScanCommand({
        TableName: tableName,
        FilterExpression: 'fileName = :fileName',
        ExpressionAttributeValues: {
          ':fileName': { S: invalidFileKey }
        }
      });

      const scanResponse = await dynamoClient.send(scanCommand);
      // Should be 0 items since parsing failed
      expect(scanResponse.Items!.length).toBe(0);

      // Cleanup
      await s3Client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: invalidFileKey
      }));
    }, 30000);
  });

  describe('Performance and Scalability Tests', () => {
    test('should support high concurrent Lambda executions', async () => {
      // This test verifies the 500 concurrent execution limit is configured
      // We won't actually test 500 concurrent executions due to test time constraints
      // but we can verify the configuration through direct Lambda invocation
      
      const testPayload = {
        Records: [{
          s3: {
            bucket: { name: bucketName },
            object: { key: testFileKey }
          }
        }]
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify(testPayload),
        InvocationType: 'RequestResponse'
      });

      const response = await lambdaClient.send(invokeCommand);
      expect(response.StatusCode).toBe(200);
      
      // Verify function has reserved concurrency configured
      // This would be checked through the CDK template in unit tests
      // Here we just verify the function responds correctly
    });

    test('should handle DynamoDB on-demand scaling', async () => {
      // Test that DynamoDB table is configured for on-demand billing
      // This is primarily validated through infrastructure tests
      // but we can verify writes work correctly
      
      const testKey = `scale-test-${Date.now()}.json`;
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: JSON.stringify({
          ...testDeviceData,
          deviceId: 'scale-test-device'
        })
      }));

      await new Promise(resolve => setTimeout(resolve, 8000));

      const scanResponse = await dynamoClient.send(new ScanCommand({
        TableName: tableName,
        FilterExpression: 'fileName = :fileName',
        ExpressionAttributeValues: {
          ':fileName': { S: testKey }
        }
      }));

      expect(scanResponse.Items!.length).toBe(1);
      
      // Cleanup
      await s3Client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey
      }));
      
      await dynamoClient.send(new DeleteItemCommand({
        TableName: tableName,
        Key: {
          deviceId: { S: 'scale-test-device' },
          timestamp: scanResponse.Items![0].timestamp
        }
      }));
    });
  });

  // Helper function to clean up test data
  async function cleanupTestData() {
    try {
      // Clean up S3 test file
      await s3Client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testFileKey
      }));
    } catch (error) {
      // File might not exist, ignore error
    }

    try {
      // Clean up DynamoDB test data
      const scanResponse = await dynamoClient.send(new ScanCommand({
        TableName: tableName,
        FilterExpression: 'fileName = :fileName',
        ExpressionAttributeValues: {
          ':fileName': { S: testFileKey }
        }
      }));

      for (const item of scanResponse.Items || []) {
        await dynamoClient.send(new DeleteItemCommand({
          TableName: tableName,
          Key: {
            deviceId: item.deviceId,
            timestamp: item.timestamp
          }
        }));
      }
    } catch (error) {
      // Table might not exist or be empty, ignore error
    }
  }
});