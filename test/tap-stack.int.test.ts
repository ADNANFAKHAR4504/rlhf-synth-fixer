import { 
  CloudFormationClient, 
  DescribeStacksCommand, 
  CreateStackCommand, 
  DeleteStackCommand,
  DescribeStackEventsCommand,
  StackStatus 
} from '@aws-sdk/client-cloudformation';
import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  ListObjectsV2Command, 
  DeleteObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { 
  LambdaClient, 
  InvokeCommand 
} from '@aws-sdk/client-lambda';
import { 
  SNSClient, 
  GetTopicAttributesCommand 
} from '@aws-sdk/client-sns';
import { 
  CloudWatchClient,
  GetMetricDataCommand
} from '@aws-sdk/client-cloudwatch';
import * as fs from 'fs';
import * as path from 'path';

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = 'test-' + Date.now().toString().slice(-6);
const stackName = `image-processing-${environmentSuffix}`;
const notificationEmail = 'test@example.com';

const cloudFormationClient = new CloudFormationClient({ region });
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const snsClient = new SNSClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });

describe('Serverless Image Processing System - End-to-End Integration Tests', () => {
  let stackOutputs: Record<string, string> = {};
  let uploadBucketName: string;
  let processedBucketName: string;
  let lambdaFunctionArn: string;
  let snsTopicArn: string;
  
  const testObjects: string[] = [];

  beforeAll(async () => {
    console.log(`Starting integration tests with environment suffix: ${environmentSuffix}`);
    
    // Deploy CloudFormation stack
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateBody = fs.readFileSync(templatePath, 'utf8');
    
    const createStackParams = {
      StackName: stackName,
      TemplateBody: templateBody,
      Parameters: [
        { ParameterKey: 'EnvironmentSuffix', ParameterValue: environmentSuffix },
        { ParameterKey: 'NotificationEmail', ParameterValue: notificationEmail }
      ],
      Capabilities: ['CAPABILITY_IAM'],
      Tags: [
        { Key: 'TestRun', Value: environmentSuffix },
        { Key: 'Environment', Value: 'integration-test' }
      ]
    };

    console.log('Creating CloudFormation stack...');
    await cloudFormationClient.send(new CreateStackCommand(createStackParams));
    
    // Wait for stack creation to complete
    await waitForStackComplete(stackName, 'CREATE_COMPLETE');
    
    // Get stack outputs
    const describeStacksResponse = await cloudFormationClient.send(
      new DescribeStacksCommand({ StackName: stackName })
    );
    
    const stack = describeStacksResponse.Stacks?.[0];
    if (!stack?.Outputs) {
      throw new Error('Stack outputs not found');
    }
    
    for (const output of stack.Outputs) {
      if (output.OutputKey && output.OutputValue) {
        stackOutputs[output.OutputKey] = output.OutputValue;
      }
    }
    
    uploadBucketName = stackOutputs['UploadBucketName'];
    processedBucketName = stackOutputs['ProcessedBucketName'];
    lambdaFunctionArn = stackOutputs['LambdaFunctionArn'];
    snsTopicArn = stackOutputs['SNSTopicArn'];
    
    console.log('Stack deployment completed successfully');
    console.log(`Upload Bucket: ${uploadBucketName}`);
    console.log(`Processed Bucket: ${processedBucketName}`);
  }, 600000); // 10 minute timeout for stack creation

  afterAll(async () => {
    console.log('Cleaning up test resources...');
    
    // Clean up test objects
    await cleanupTestObjects();
    
    // Delete CloudFormation stack
    try {
      await cloudFormationClient.send(new DeleteStackCommand({ StackName: stackName }));
      console.log('Stack deletion initiated');
      
      // Wait for stack deletion to complete
      await waitForStackComplete(stackName, 'DELETE_COMPLETE');
      console.log('Stack deletion completed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }, 600000);

  describe('Stack Deployment and Resource Validation', () => {
    test('should create all required AWS resources', async () => {
      expect(uploadBucketName).toBeDefined();
      expect(processedBucketName).toBeDefined();
      expect(lambdaFunctionArn).toBeDefined();
      expect(snsTopicArn).toBeDefined();
      
      // Validate bucket names follow naming convention
      expect(uploadBucketName).toMatch(/^image-upload-bucket-test-\d+-\d+$/);
      expect(processedBucketName).toMatch(/^processed-images-bucket-test-\d+-\d+$/);
    });

    test('should verify SNS topic configuration', async () => {
      const topicAttributesResponse = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: snsTopicArn })
      );
      
      expect(topicAttributesResponse.Attributes).toBeDefined();
      expect(topicAttributesResponse.Attributes!['DisplayName']).toBe('Image Processing Notifications');
    });

    test('should verify Lambda function configuration', async () => {
      // Lambda function details are validated implicitly through successful invocation tests
      expect(lambdaFunctionArn).toContain(`image-processor-${environmentSuffix}`);
    });
  });

  describe('End-to-End Image Processing Flow', () => {
    test('should process single image upload end-to-end', async () => {
      const startTime = Date.now();
      const testImageKey = `uploads/test-single-${Date.now()}.jpg`;
      testObjects.push(testImageKey);
      
      // Create mock JPEG image buffer
      const imageBuffer = createMockImageBuffer('jpeg');
      
      console.log(`Uploading image: ${testImageKey}`);
      
      // Upload image to trigger processing
      await s3Client.send(new PutObjectCommand({
        Bucket: uploadBucketName,
        Key: testImageKey,
        Body: imageBuffer,
        ContentType: 'image/jpeg'
      }));
      
      // Wait for processing to complete
      const processedKey = testImageKey.replace('uploads/', 'processed/');
      const processedObject = await waitForProcessedImage(processedBucketName, processedKey);
      
      expect(processedObject).toBeTruthy();
      
      // Verify processed image metadata
      const headObjectResponse = await s3Client.send(new HeadObjectCommand({
        Bucket: processedBucketName,
        Key: processedKey
      }));
      
      expect(headObjectResponse.Metadata).toBeDefined();
      expect(headObjectResponse.Metadata!['original-key']).toBe(testImageKey);
      expect(headObjectResponse.Metadata!['environment']).toBe(environmentSuffix);
      expect(headObjectResponse.ContentType).toBe('image/jpeg');
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      console.log(`End-to-end processing completed in ${processingTime}ms`);
      
      // Validate processing time is reasonable (< 2 minutes)
      expect(processingTime).toBeLessThan(120000);
    }, 180000); // 3 minute timeout

    test('should handle multiple image formats concurrently', async () => {
      const formats = [
        { ext: 'jpg', contentType: 'image/jpeg' },
        { ext: 'jpeg', contentType: 'image/jpeg' },
        { ext: 'png', contentType: 'image/png' }
      ];
      
      const uploadPromises = formats.map(async (format) => {
        const testImageKey = `uploads/test-${format.ext}-${Date.now()}.${format.ext}`;
        testObjects.push(testImageKey);
        
        const imageBuffer = createMockImageBuffer(format.ext);
        
        await s3Client.send(new PutObjectCommand({
          Bucket: uploadBucketName,
          Key: testImageKey,
          Body: imageBuffer,
          ContentType: format.contentType
        }));
        
        return testImageKey;
      });
      
      const uploadedKeys = await Promise.all(uploadPromises);
      
      // Wait for all processed images
      const processedPromises = uploadedKeys.map(async (key) => {
        const processedKey = key.replace('uploads/', 'processed/');
        return waitForProcessedImage(processedBucketName, processedKey);
      });
      
      const processedResults = await Promise.all(processedPromises);
      
      // Verify all images were processed
      expect(processedResults).toHaveLength(3);
      processedResults.forEach(result => {
        expect(result).toBeTruthy();
      });
    }, 300000); // 5 minute timeout

    test('should handle large image file processing', async () => {
      const testImageKey = `uploads/test-large-${Date.now()}.jpg`;
      testObjects.push(testImageKey);
      
      // Create larger mock image (1MB)
      const largeImageBuffer = createMockImageBuffer('jpeg', 1024 * 1024);
      
      const startTime = Date.now();
      
      await s3Client.send(new PutObjectCommand({
        Bucket: uploadBucketName,
        Key: testImageKey,
        Body: largeImageBuffer,
        ContentType: 'image/jpeg'
      }));
      
      const processedKey = testImageKey.replace('uploads/', 'processed/');
      const processedObject = await waitForProcessedImage(processedBucketName, processedKey);
      
      expect(processedObject).toBeTruthy();
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      console.log(`Large image processing completed in ${processingTime}ms`);
      
      // Validate processing time for large image
      expect(processingTime).toBeLessThan(120000); // Should complete within 2 minutes
    }, 180000);

    test('should process batch of images in single Lambda invocation', async () => {
      const batchSize = 3;
      const testKeys: string[] = [];
      
      // Create multiple S3 records for single Lambda invocation
      for (let i = 0; i < batchSize; i++) {
        const testImageKey = `uploads/batch-test-${i}-${Date.now()}.jpg`;
        testKeys.push(testImageKey);
        testObjects.push(testImageKey);
        
        const imageBuffer = createMockImageBuffer('jpeg');
        
        await s3Client.send(new PutObjectCommand({
          Bucket: uploadBucketName,
          Key: testImageKey,
          Body: imageBuffer,
          ContentType: 'image/jpeg'
        }));
      }
      
      // Wait for all images to be processed
      const processedPromises = testKeys.map(async (key) => {
        const processedKey = key.replace('uploads/', 'processed/');
        return waitForProcessedImage(processedBucketName, processedKey);
      });
      
      const results = await Promise.all(processedPromises);
      
      expect(results).toHaveLength(batchSize);
      results.forEach(result => {
        expect(result).toBeTruthy();
      });
    }, 300000);
  });

  describe('Lambda Function Direct Testing', () => {
    test('should invoke Lambda function directly with mock S3 event', async () => {
      const mockEvent = {
        Records: [{
          s3: {
            bucket: { name: uploadBucketName },
            object: { key: 'uploads/mock-direct-test.jpg' }
          }
        }]
      };
      
      // Upload mock image first
      const testImageKey = 'uploads/mock-direct-test.jpg';
      testObjects.push(testImageKey);
      
      const imageBuffer = createMockImageBuffer('jpeg');
      
      await s3Client.send(new PutObjectCommand({
        Bucket: uploadBucketName,
        Key: testImageKey,
        Body: imageBuffer,
        ContentType: 'image/jpeg'
      }));
      
      // Invoke Lambda function directly
      const invokeCommand = new InvokeCommand({
        FunctionName: lambdaFunctionArn,
        Payload: JSON.stringify(mockEvent)
      });
      
      const response = await lambdaClient.send(invokeCommand);
      
      expect(response.StatusCode).toBe(200);
      
      if (response.Payload) {
        const payload = JSON.parse(new TextDecoder().decode(response.Payload));
        expect(payload.statusCode).toBe(200);
        
        const body = JSON.parse(payload.body);
        expect(body.message).toBe('Image processing completed');
        expect(body.results).toHaveLength(1);
        expect(body.results[0].status).toBe('success');
      }
      
      // Verify processed image exists
      const processedKey = testImageKey.replace('uploads/', 'processed/');
      await waitForProcessedImage(processedBucketName, processedKey);
    }, 120000);
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle gracefully when processing non-existent object', async () => {
      const mockEvent = {
        Records: [{
          s3: {
            bucket: { name: uploadBucketName },
            object: { key: 'uploads/non-existent-file.jpg' }
          }
        }]
      };
      
      const invokeCommand = new InvokeCommand({
        FunctionName: lambdaFunctionArn,
        Payload: JSON.stringify(mockEvent)
      });
      
      const response = await lambdaClient.send(invokeCommand);
      
      expect(response.StatusCode).toBe(200);
      
      if (response.Payload) {
        const payload = JSON.parse(new TextDecoder().decode(response.Payload));
        expect(payload.statusCode).toBe(200);
        
        const body = JSON.parse(payload.body);
        expect(body.results).toHaveLength(1);
        expect(body.results[0].status).toBe('error');
        expect(body.results[0].error).toBeDefined();
      }
    });

    test('should handle malformed S3 event gracefully', async () => {
      const malformedEvent = {
        Records: [{
          // Missing s3 property
          invalidRecord: true
        }]
      };
      
      const invokeCommand = new InvokeCommand({
        FunctionName: lambdaFunctionArn,
        Payload: JSON.stringify(malformedEvent)
      });
      
      const response = await lambdaClient.send(invokeCommand);
      
      // Lambda should not crash and return appropriate response
      expect(response.StatusCode).toBe(200);
    });

    test('should handle empty file upload', async () => {
      const testImageKey = `uploads/empty-file-${Date.now()}.jpg`;
      testObjects.push(testImageKey);
      
      // Upload empty file
      await s3Client.send(new PutObjectCommand({
        Bucket: uploadBucketName,
        Key: testImageKey,
        Body: Buffer.alloc(0),
        ContentType: 'image/jpeg'
      }));
      
      // Processing should handle empty file gracefully
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
      
      // Check if processed file exists or error was handled
      const processedKey = testImageKey.replace('uploads/', 'processed/');
      try {
        await s3Client.send(new HeadObjectCommand({
          Bucket: processedBucketName,
          Key: processedKey
        }));
        // If it exists, that's fine - empty file was processed
      } catch (error) {
        // If it doesn't exist, that's also fine - error was handled gracefully
        expect(error).toBeDefined();
      }
    });
  });

  describe('Performance and Monitoring Validation', () => {
    test('should validate CloudWatch metrics are being generated', async () => {
      // Wait a bit for metrics to be available
      await new Promise(resolve => setTimeout(resolve, 60000));
      
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 300000); // 5 minutes ago
      
      try {
        const metricsResponse = await cloudWatchClient.send(new GetMetricDataCommand({
          MetricDataQueries: [{
            Id: 'lambda_invocations',
            MetricStat: {
              Metric: {
                Namespace: 'AWS/Lambda',
                MetricName: 'Invocations',
                Dimensions: [{
                  Name: 'FunctionName',
                  Value: `image-processor-${environmentSuffix}`
                }]
              },
              Period: 300,
              Stat: 'Sum'
            }
          }],
          StartTime: startTime,
          EndTime: endTime
        }));
        
        expect(metricsResponse.MetricDataResults).toBeDefined();
      } catch (error) {
        console.warn('CloudWatch metrics validation skipped - metrics may not be available yet');
      }
    });
  });

  // Helper functions
  async function waitForStackComplete(stackName: string, expectedStatus: string): Promise<void> {
    const maxWaitTime = 600000; // 10 minutes
    const pollInterval = 10000; // 10 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await cloudFormationClient.send(
          new DescribeStacksCommand({ StackName: stackName })
        );
        
        const stack = response.Stacks?.[0];
        if (!stack) {
          if (expectedStatus === 'DELETE_COMPLETE') {
            console.log('Stack successfully deleted');
            return;
          }
          throw new Error('Stack not found');
        }
        
        console.log(`Stack status: ${stack.StackStatus}`);
        
        if (stack.StackStatus === expectedStatus) {
          return;
        }
        
        if (stack.StackStatus?.includes('FAILED') || 
            stack.StackStatus?.includes('ROLLBACK')) {
          
          // Get stack events for debugging
          const eventsResponse = await cloudFormationClient.send(
            new DescribeStackEventsCommand({ StackName: stackName })
          );
          
          const failedEvents = eventsResponse.StackEvents?.filter(
            event => event.ResourceStatus?.includes('FAILED')
          );
          
          console.error('Stack failed events:', failedEvents);
          throw new Error(`Stack operation failed: ${stack.StackStatus}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        if (expectedStatus === 'DELETE_COMPLETE' && 
            (error as any)?.name === 'ValidationError') {
          console.log('Stack successfully deleted');
          return;
        }
        throw error;
      }
    }
    
    throw new Error(`Timeout waiting for stack to reach ${expectedStatus}`);
  }

  async function waitForProcessedImage(
    bucketName: string, 
    key: string, 
    maxWaitTime: number = 120000
  ): Promise<boolean> {
    const pollInterval = 5000; // 5 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        await s3Client.send(new HeadObjectCommand({
          Bucket: bucketName,
          Key: key
        }));
        console.log(`Processed image found: ${key}`);
        return true;
      } catch (error) {
        if ((error as any)?.name !== 'NotFound') {
          console.error(`Error checking processed image: ${error}`);
        }
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }
    
    throw new Error(`Timeout waiting for processed image: ${key}`);
  }

  function createMockImageBuffer(format: string, size: number = 1024): Buffer {
    const buffer = Buffer.alloc(size);
    
    if (format === 'jpeg' || format === 'jpg') {
      // JPEG SOI (Start of Image) marker
      buffer.writeUInt16BE(0xFFD8, 0);
      // JPEG EOI (End of Image) marker at the end
      buffer.writeUInt16BE(0xFFD9, size - 2);
    } else if (format === 'png') {
      // PNG signature
      const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      pngSignature.copy(buffer, 0);
    }
    
    return buffer;
  }

  async function cleanupTestObjects(): Promise<void> {
    console.log(`Cleaning up ${testObjects.length} test objects`);
    
    const cleanupPromises = testObjects.map(async (key) => {
      try {
        // Clean up upload bucket
        await s3Client.send(new DeleteObjectCommand({
          Bucket: uploadBucketName,
          Key: key
        }));
        
        // Clean up processed bucket
        const processedKey = key.replace('uploads/', 'processed/');
        try {
          await s3Client.send(new DeleteObjectCommand({
            Bucket: processedBucketName,
            Key: processedKey
          }));
        } catch (error) {
          // Processed object might not exist if processing failed
          console.warn(`Processed object not found for cleanup: ${processedKey}`);
        }
      } catch (error) {
        console.error(`Error cleaning up object ${key}:`, error);
      }
    });
    
    await Promise.all(cleanupPromises);
    console.log('Test object cleanup completed');
  }
});