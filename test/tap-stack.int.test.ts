// Configuration - These are coming from cfn-outputs after cdk deploy
//resolve conflicts
import fs from 'fs';
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  ScanCommand,
  GetItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  FilterLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Load outputs from deployment
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('cfn-outputs/flat-outputs.json not found - integration tests will be skipped');
}

// AWS clients configured for us-west-2
const s3Client = new S3Client({ region: 'us-west-2' });
const dynamoClient = new DynamoDBClient({ region: 'us-west-2' });
const lambdaClient = new LambdaClient({ region: 'us-west-2' });
const logsClient = new CloudWatchLogsClient({ region: 'us-west-2' });

describe('IoT Data Processor Integration Tests', () => {
  const testTimeout = 30000; // 30 seconds

  beforeAll(() => {
    if (Object.keys(outputs).length === 0) {
      console.warn('No deployment outputs available - skipping integration tests');
    }
  });

  describe('Infrastructure Validation', () => {
    test('should have all required stack outputs', () => {
      if (Object.keys(outputs).length === 0) {
        pending('Deployment outputs not available');
        return;
      }

      expect(outputs).toHaveProperty('S3BucketName');
      expect(outputs).toHaveProperty('DynamoDBTableName');
      expect(outputs).toHaveProperty('LambdaFunctionName');
      expect(outputs).toHaveProperty('LambdaFunctionArn');
      expect(outputs).toHaveProperty('LogGroupName');
    });

    test('should verify Lambda function exists and is configured correctly', async () => {
      if (!outputs.LambdaFunctionName) {
        pending('Lambda function name not available from deployment outputs');
        return;
      }

      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration?.FunctionName).toBe('IoTDataProcessor');
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.Handler).toBe('index.handler');
      expect(response.Configuration?.MemorySize).toBe(512);
      expect(response.Configuration?.Timeout).toBe(300);
      expect(response.Configuration?.ReservedConcurrencyConfig?.ReservedConcurrentExecutions).toBe(500);
      
      // Check environment variables
      expect(response.Configuration?.Environment?.Variables).toHaveProperty('DYNAMODB_TABLE_NAME');
      expect(response.Configuration?.Environment?.Variables).toHaveProperty('LOG_GROUP_NAME');
    }, testTimeout);

    test('should verify CloudWatch log group exists', async () => {
      if (!outputs.LogGroupName) {
        pending('Log group name not available from deployment outputs');
        return;
      }

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.LogGroupName,
      });

      const response = await logsClient.send(command);
      
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === outputs.LogGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.logGroupName).toBe('/aws/lambda/IoTDataProcessor');
      expect(logGroup?.retentionInDays).toBe(14);
    }, testTimeout);
  });

  describe('End-to-End Workflow Tests', () => {
    const testDeviceId = `test-device-${Date.now()}`;
    const testFileName = `${testDeviceId}/data-${Date.now()}.json`;
    let createdObjects: string[] = [];
    let createdDynamoItems: Array<{deviceId: string, timestamp: string}> = [];

    afterEach(async () => {
      // Cleanup S3 objects
      if (outputs.S3BucketName && createdObjects.length > 0) {
        for (const objectKey of createdObjects) {
          try {
            await s3Client.send(new DeleteObjectCommand({
              Bucket: outputs.S3BucketName,
              Key: objectKey,
            }));
          } catch (error) {
            console.warn(`Failed to delete S3 object ${objectKey}:`, error);
          }
        }
        createdObjects = [];
      }

      // Cleanup DynamoDB items
      if (outputs.DynamoDBTableName && createdDynamoItems.length > 0) {
        for (const item of createdDynamoItems) {
          try {
            await dynamoClient.send(new DeleteItemCommand({
              TableName: outputs.DynamoDBTableName,
              Key: {
                deviceId: { S: item.deviceId },
                timestamp: { S: item.timestamp },
              },
            }));
          } catch (error) {
            console.warn(`Failed to delete DynamoDB item:`, error);
          }
        }
        createdDynamoItems = [];
      }
    });

    test('should process JSON IoT data uploaded to S3 and store in DynamoDB', async () => {
      if (!outputs.S3BucketName || !outputs.DynamoDBTableName) {
        pending('S3 bucket or DynamoDB table not available from deployment outputs');
        return;
      }

      // Test data
      const testData = {
        deviceId: testDeviceId,
        timestamp: new Date().toISOString(),
        temperature: 23.5,
        humidity: 65.2,
        location: {
          lat: 37.7749,
          lng: -122.4194,
        },
        status: 'active',
      };

      // Upload test data to S3
      const putCommand = new PutObjectCommand({
        Bucket: outputs.S3BucketName,
        Key: testFileName,
        Body: JSON.stringify(testData),
        ContentType: 'application/json',
      });

      await s3Client.send(putCommand);
      createdObjects.push(testFileName);

      // Wait for Lambda processing (with polling)
      let processedData: any = null;
      let attempts = 0;
      const maxAttempts = 20; // 20 attempts with 1 second intervals
      
      while (!processedData && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        try {
          const getCommand = new GetItemCommand({
            TableName: outputs.DynamoDBTableName,
            Key: {
              deviceId: { S: testDeviceId },
              timestamp: { S: testData.timestamp },
            },
          });

          const result = await dynamoClient.send(getCommand);
          if (result.Item) {
            processedData = result.Item;
            createdDynamoItems.push({
              deviceId: testDeviceId,
              timestamp: testData.timestamp,
            });
          }
        } catch (error) {
          console.log(`Attempt ${attempts + 1}: Data not yet processed`);
        }
        
        attempts++;
      }

      // Verify data was processed and stored
      expect(processedData).toBeDefined();
      expect(processedData.deviceId.S).toBe(testDeviceId);
      expect(processedData.timestamp.S).toBe(testData.timestamp);
      expect(processedData.sourceFile.S).toBe(testFileName);
      expect(processedData.sourceBucket.S).toBe(outputs.S3BucketName);
      
      // Verify processed data contains original data
      const storedProcessedData = JSON.parse(processedData.processedData.S);
      expect(storedProcessedData.deviceId).toBe(testDeviceId);
      expect(storedProcessedData.temperature).toBe(23.5);
      expect(storedProcessedData.humidity).toBe(65.2);
      expect(storedProcessedData.status).toBe('active');
      expect(storedProcessedData.processedAt).toBeDefined();
    }, testTimeout);

    test('should process non-JSON data uploaded to S3', async () => {
      if (!outputs.S3BucketName || !outputs.DynamoDBTableName) {
        pending('S3 bucket or DynamoDB table not available from deployment outputs');
        return;
      }

      const textFileName = `${testDeviceId}/sensor-data-${Date.now()}.txt`;
      const textData = 'temperature:25.0,humidity:70.1,status:online';

      // Upload text data to S3
      const putCommand = new PutObjectCommand({
        Bucket: outputs.S3BucketName,
        Key: textFileName,
        Body: textData,
        ContentType: 'text/plain',
      });

      await s3Client.send(putCommand);
      createdObjects.push(textFileName);

      // Wait for Lambda processing
      let processedData: any = null;
      let attempts = 0;
      const maxAttempts = 20;
      const expectedTimestamp = new Date().toISOString().substring(0, 16); // Match to minute precision
      
      while (!processedData && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          // For non-JSON data, we need to scan since timestamp is generated by Lambda
          const scanCommand = new ScanCommand({
            TableName: outputs.DynamoDBTableName,
            FilterExpression: 'deviceId = :deviceId AND sourceFile = :sourceFile',
            ExpressionAttributeValues: {
              ':deviceId': { S: testDeviceId },
              ':sourceFile': { S: textFileName },
            },
          });

          const result = await dynamoClient.send(scanCommand);
          if (result.Items && result.Items.length > 0) {
            processedData = result.Items[0];
            createdDynamoItems.push({
              deviceId: testDeviceId,
              timestamp: processedData.timestamp.S,
            });
          }
        } catch (error) {
          console.log(`Attempt ${attempts + 1}: Text data not yet processed`);
        }
        
        attempts++;
      }

      // Verify data was processed and stored
      expect(processedData).toBeDefined();
      expect(processedData.deviceId.S).toBe(testDeviceId);
      expect(processedData.sourceFile.S).toBe(textFileName);
      expect(processedData.sourceBucket.S).toBe(outputs.S3BucketName);
      
      // Verify processed data contains raw text data
      const storedProcessedData = JSON.parse(processedData.processedData.S);
      expect(storedProcessedData.rawData).toBe(textData);
      expect(storedProcessedData.deviceId).toBe(testDeviceId);
      expect(storedProcessedData.processedAt).toBeDefined();
    }, testTimeout);

    test('should log processing activity to CloudWatch', async () => {
      if (!outputs.LogGroupName || !outputs.S3BucketName) {
        pending('Log group or S3 bucket not available from deployment outputs');
        return;
      }

      const logTestFileName = `${testDeviceId}/log-test-${Date.now()}.json`;
      const logTestData = {
        deviceId: testDeviceId,
        testType: 'logging',
        timestamp: new Date().toISOString(),
      };

      // Upload test data to trigger Lambda
      const putCommand = new PutObjectCommand({
        Bucket: outputs.S3BucketName,
        Key: logTestFileName,
        Body: JSON.stringify(logTestData),
        ContentType: 'application/json',
      });

      await s3Client.send(putCommand);
      createdObjects.push(logTestFileName);

      // Wait for logs to appear
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      // Query CloudWatch logs
      const filterCommand = new FilterLogEventsCommand({
        logGroupName: outputs.LogGroupName,
        startTime: Date.now() - (5 * 60 * 1000), // Last 5 minutes
        filterPattern: `"${logTestFileName}"`,
      });

      const logsResponse = await logsClient.send(filterCommand);
      
      expect(logsResponse.events).toBeDefined();
      expect(logsResponse.events?.length).toBeGreaterThan(0);
      
      // Verify log content contains our test file
      const logMessages = logsResponse.events?.map(event => event.message).join(' ');
      expect(logMessages).toContain(logTestFileName);
      expect(logMessages).toContain('Processing file:');
      
      // Add to cleanup list for DynamoDB
      createdDynamoItems.push({
        deviceId: testDeviceId,
        timestamp: logTestData.timestamp,
      });
    }, testTimeout);
  });

  describe('Performance and Scalability Tests', () => {
    test('should handle multiple concurrent file uploads', async () => {
      if (!outputs.S3BucketName || !outputs.DynamoDBTableName) {
        pending('S3 bucket or DynamoDB table not available from deployment outputs');
        return;
      }

      const concurrentUploads = 5;
      const uploadPromises: Promise<void>[] = [];
      const testFiles: string[] = [];
      const testItems: Array<{deviceId: string, timestamp: string}> = [];

      // Create multiple concurrent uploads
      for (let i = 0; i < concurrentUploads; i++) {
        const deviceId = `load-test-device-${i}-${Date.now()}`;
        const fileName = `${deviceId}/concurrent-test-${i}.json`;
        const timestamp = new Date().toISOString();
        
        testFiles.push(fileName);
        testItems.push({ deviceId, timestamp });

        const testData = {
          deviceId,
          timestamp,
          testIndex: i,
          batchId: Date.now(),
        };

        const uploadPromise = s3Client.send(new PutObjectCommand({
          Bucket: outputs.S3BucketName,
          Key: fileName,
          Body: JSON.stringify(testData),
          ContentType: 'application/json',
        }));

        uploadPromises.push(uploadPromise);
      }

      // Execute all uploads concurrently
      await Promise.all(uploadPromises);
      
      // Add to cleanup lists
      createdObjects.push(...testFiles);
      createdDynamoItems.push(...testItems);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

      // Verify all items were processed
      let processedCount = 0;
      for (const item of testItems) {
        try {
          const getCommand = new GetItemCommand({
            TableName: outputs.DynamoDBTableName,
            Key: {
              deviceId: { S: item.deviceId },
              timestamp: { S: item.timestamp },
            },
          });

          const result = await dynamoClient.send(getCommand);
          if (result.Item) {
            processedCount++;
          }
        } catch (error) {
          console.warn(`Failed to retrieve item for ${item.deviceId}:`, error);
        }
      }

      // Expect at least 80% success rate for concurrent processing
      expect(processedCount).toBeGreaterThanOrEqual(Math.floor(concurrentUploads * 0.8));
    }, testTimeout * 2); // Double timeout for performance test
  });
});
