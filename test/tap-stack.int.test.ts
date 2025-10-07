import { CloudFormationClient, CreateStackCommand, DeleteStackCommand, DescribeStacksCommand, StackStatus } from '@aws-sdk/client-cloudformation';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { SNSClient, ListSubscriptionsByTopicCommand, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { LambdaClient, InvokeCommand, GetFunctionCommand } from '@aws-sdk/client-lambda';
import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Serverless Image Processing System - E2E Integration Tests', () => {
  const region = process.env.AWS_REGION || 'us-east-1';
  const accountId = process.env.AWS_ACCOUNT_ID || '123456789012';
  const environmentSuffix = 'test';
  const stackName = `image-processing-e2e-test-${Date.now()}`;
  const testEmail = process.env.TEST_EMAIL || 'test@example.com';
  
  let cfnClient: CloudFormationClient;
  let s3Client: S3Client;
  let snsClient: SNSClient;
  let lambdaClient: LambdaClient;
  let cloudWatchClient: CloudWatchClient;
  
  let stackResources: {
    uploadBucket: string;
    processedBucket: string;
    lambdaArn: string;
    lambdaName: string;
    snsTopicArn: string;
  };

  beforeAll(async () => {
    cfnClient = new CloudFormationClient({ region });
    s3Client = new S3Client({ region });
    snsClient = new SNSClient({ region });
    lambdaClient = new LambdaClient({ region });
    cloudWatchClient = new CloudWatchClient({ region });
    
    // Deploy the CloudFormation stack
    const templateBody = readFileSync(join(__dirname, '../lib/TapStack.json'), 'utf-8');
    
    const createStackCommand = new CreateStackCommand({
      StackName: stackName,
      TemplateBody: templateBody,
      Parameters: [
        { ParameterKey: 'EnvironmentSuffix', ParameterValue: environmentSuffix },
        { ParameterKey: 'NotificationEmail', ParameterValue: testEmail }
      ],
      Capabilities: ['CAPABILITY_IAM'],
      TimeoutInMinutes: 30,
      Tags: [
        { Key: 'TestStack', Value: 'true' },
        { Key: 'Environment', Value: 'integration-test' }
      ]
    });

    await cfnClient.send(createStackCommand);
    
    // Wait for stack creation to complete
    await waitForStackStatus(stackName, 'CREATE_COMPLETE');
    
    // Get stack outputs
    const describeCommand = new DescribeStacksCommand({ StackName: stackName });
    const response = await cfnClient.send(describeCommand);
    const outputs = response.Stacks?.[0]?.Outputs || [];
    
    stackResources = {
      uploadBucket: outputs.find(o => o.OutputKey === 'UploadBucketName')?.OutputValue || '',
      processedBucket: outputs.find(o => o.OutputKey === 'ProcessedBucketName')?.OutputValue || '',
      lambdaArn: outputs.find(o => o.OutputKey === 'LambdaFunctionArn')?.OutputValue || '',
      lambdaName: `image-processor-${environmentSuffix}`,
      snsTopicArn: outputs.find(o => o.OutputKey === 'SNSTopicArn')?.OutputValue || ''
    };

    // Verify all resources are available
    expect(stackResources.uploadBucket).toBeTruthy();
    expect(stackResources.processedBucket).toBeTruthy();
    expect(stackResources.lambdaArn).toBeTruthy();
    expect(stackResources.snsTopicArn).toBeTruthy();
  }, 600000); // 10 minute timeout

  afterAll(async () => {
    // Clean up test objects before deleting stack
    try {
      await cleanupTestObjects();
    } catch (error) {
      console.warn('Error cleaning up test objects:', error);
    }

    // Clean up: delete the stack
    try {
      const deleteStackCommand = new DeleteStackCommand({ StackName: stackName });
      await cfnClient.send(deleteStackCommand);
      await waitForStackStatus(stackName, 'DELETE_COMPLETE');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }, 300000); // 5 minute timeout

  describe('Stack Deployment and Resource Validation', () => {
    test('should create all required resources with correct naming conventions', () => {
      expect(stackResources.uploadBucket).toContain(`image-upload-bucket-${environmentSuffix}-${accountId}`);
      expect(stackResources.processedBucket).toContain(`processed-images-bucket-${environmentSuffix}-${accountId}`);
      expect(stackResources.lambdaArn).toContain(`image-processor-${environmentSuffix}`);
      expect(stackResources.snsTopicArn).toContain(`image-processing-notifications-${environmentSuffix}`);
    });

    test('should configure SNS topic with email subscription', async () => {
      const listSubscriptionsCommand = new ListSubscriptionsByTopicCommand({
        TopicArn: stackResources.snsTopicArn
      });
      
      const response = await snsClient.send(listSubscriptionsCommand);
      const emailSubscription = response.Subscriptions?.find(sub => 
        sub.Protocol === 'email' && sub.Endpoint === testEmail
      );
      
      expect(emailSubscription).toBeTruthy();
      expect(emailSubscription?.SubscriptionArn).toBeTruthy();
    });

    test('should configure Lambda function with correct runtime and environment', async () => {
      const getFunctionCommand = new GetFunctionCommand({
        FunctionName: stackResources.lambdaName
      });
      
      const response = await lambdaClient.send(getFunctionCommand);
      
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
      expect(response.Configuration?.MemorySize).toBe(512);
      expect(response.Configuration?.Timeout).toBe(60);
      expect(response.Configuration?.Environment?.Variables?.PROCESSED_BUCKET).toBe(stackResources.processedBucket);
      expect(response.Configuration?.Environment?.Variables?.SNS_TOPIC_ARN).toBe(stackResources.snsTopicArn);
      expect(response.Configuration?.Environment?.Variables?.ENVIRONMENT).toBe(environmentSuffix);
    });

    test('should verify SNS topic configuration and permissions', async () => {
      const getTopicAttributesCommand = new GetTopicAttributesCommand({
        TopicArn: stackResources.snsTopicArn
      });
      
      const response = await snsClient.send(getTopicAttributesCommand);
      
      expect(response.Attributes?.DisplayName).toBe('Image Processing Notifications');
      expect(response.Attributes?.TopicArn).toBe(stackResources.snsTopicArn);
    });
  });

  describe('End-to-End Image Processing Flow', () => {
    const testImages = [
      { key: 'uploads/e2e-test-image.jpg', contentType: 'image/jpeg', expectedProcessed: 'processed/e2e-test-image.jpg' },
      { key: 'uploads/e2e-test-image.png', contentType: 'image/png', expectedProcessed: 'processed/e2e-test-image.png' },
      { key: 'uploads/e2e-test-image.jpeg', contentType: 'image/jpeg', expectedProcessed: 'processed/e2e-test-image.jpeg' }
    ];

    test('should process single image through complete pipeline', async () => {
      const testImage = testImages[0];
      const testImageBuffer = createMockImageBuffer('jpeg');
      
      // Step 1: Upload test image to S3
      const putObjectCommand = new PutObjectCommand({
        Bucket: stackResources.uploadBucket,
        Key: testImage.key,
        Body: testImageBuffer,
        ContentType: testImage.contentType,
        Metadata: {
          'test-run': 'e2e-single-image',
          'timestamp': Date.now().toString()
        }
      });
      
      await s3Client.send(putObjectCommand);
      console.log(`Uploaded test image: ${testImage.key}`);
      
      // Step 2: Wait for Lambda processing (S3 event trigger)
      const processedObject = await waitForProcessedImage(testImage.expectedProcessed);
      
      // Step 3: Verify processed image properties
      expect(processedObject).toBeTruthy();
      expect(processedObject?.ContentType).toBe(testImage.contentType);
      expect(processedObject?.Metadata?.['original-bucket']).toBe(stackResources.uploadBucket);
      expect(processedObject?.Metadata?.['original-key']).toBe(testImage.key);
      expect(processedObject?.Metadata?.['environment']).toBe(environmentSuffix);
      expect(processedObject?.Metadata?.['processed-at']).toBeTruthy();
      
      // Step 4: Verify processed image content
      const processedBody = await streamToBuffer(processedObject?.Body);
      expect(processedBody.length).toBeGreaterThan(0);
      expect(processedBody.length).toBe(testImageBuffer.length); // Should be same size for mock processing
    }, 180000); // 3 minute timeout

    test('should handle multiple image formats concurrently', async () => {
      const uploadPromises = testImages.map(async (testImage) => {
        const testImageBuffer = createMockImageBuffer(testImage.contentType.split('/')[1]);
        
        const putObjectCommand = new PutObjectCommand({
          Bucket: stackResources.uploadBucket,
          Key: testImage.key,
          Body: testImageBuffer,
          ContentType: testImage.contentType,
          Metadata: {
            'test-run': 'e2e-multiple-formats',
            'format': testImage.contentType.split('/')[1]
          }
        });
        
        await s3Client.send(putObjectCommand);
        console.log(`Uploaded ${testImage.contentType}: ${testImage.key}`);
        return testImage;
      });

      await Promise.all(uploadPromises);
      
      // Wait for all images to be processed
      const verificationPromises = testImages.map(async (testImage) => {
        const processedObject = await waitForProcessedImage(testImage.expectedProcessed);
        
        expect(processedObject).toBeTruthy();
        expect(processedObject?.ContentType).toBe(testImage.contentType);
        expect(processedObject?.Metadata?.['original-key']).toBe(testImage.key);
        
        return processedObject;
      });

      const processedResults = await Promise.all(verificationPromises);
      expect(processedResults).toHaveLength(testImages.length);
      
      // Verify all images were processed successfully
      processedResults.forEach((result) => {
        expect(result?.Metadata?.['environment']).toBe(environmentSuffix);
        expect(result?.Metadata?.['processed-at']).toBeTruthy();
      });
    }, 300000); // 5 minute timeout

    test('should handle large image uploads efficiently', async () => {
      const largeImageKey = 'uploads/large-test-image.jpg';
      const expectedProcessedKey = 'processed/large-test-image.jpg';
      const largeImageBuffer = createMockImageBuffer('jpeg', 1024 * 1024); // 1MB mock image
      
      const uploadStart = Date.now();
      
      const putObjectCommand = new PutObjectCommand({
        Bucket: stackResources.uploadBucket,
        Key: largeImageKey,
        Body: largeImageBuffer,
        ContentType: 'image/jpeg',
        Metadata: {
          'test-run': 'e2e-large-image',
          'size': largeImageBuffer.length.toString()
        }
      });
      
      await s3Client.send(putObjectCommand);
      const uploadDuration = Date.now() - uploadStart;
      console.log(`Large image upload completed in ${uploadDuration}ms`);
      
      const processingStart = Date.now();
      const processedObject = await waitForProcessedImage(expectedProcessedKey);
      const processingDuration = Date.now() - processingStart;
      
      console.log(`Large image processing completed in ${processingDuration}ms`);
      
      expect(processedObject).toBeTruthy();
      expect(processedObject?.ContentType).toBe('image/jpeg');
      expect(processedObject?.Metadata?.['original-key']).toBe(largeImageKey);
      
      // Verify processing was completed within reasonable time (under 60 seconds)
      expect(processingDuration).toBeLessThan(60000);
    }, 120000); // 2 minute timeout
  });

  describe('Lambda Function Direct Invocation', () => {
    test('should invoke Lambda function directly with S3 event', async () => {
      const directTestKey = 'uploads/direct-invocation-test.jpg';
      const expectedProcessedKey = 'processed/direct-invocation-test.jpg';
      
      // Upload test image first
      const testImageBuffer = createMockImageBuffer('jpeg');
      const putObjectCommand = new PutObjectCommand({
        Bucket: stackResources.uploadBucket,
        Key: directTestKey,
        Body: testImageBuffer,
        ContentType: 'image/jpeg',
        Metadata: {
          'test-run': 'direct-invocation'
        }
      });
      
      await s3Client.send(putObjectCommand);
      
      const mockS3Event = {
        Records: [{
          s3: {
            bucket: { name: stackResources.uploadBucket },
            object: { key: directTestKey }
          },
          eventName: 's3:ObjectCreated:Put',
          eventTime: new Date().toISOString()
        }]
      };
      
      // Invoke Lambda directly
      const invokeCommand = new InvokeCommand({
        FunctionName: stackResources.lambdaArn,
        Payload: JSON.stringify(mockS3Event),
        InvocationType: 'RequestResponse'
      });
      
      const response = await lambdaClient.send(invokeCommand);
      expect(response.StatusCode).toBe(200);
      
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      expect(payload.statusCode).toBe(200);
      
      const body = JSON.parse(payload.body);
      expect(body.message).toBe('Image processing completed');
      expect(body.results).toHaveLength(1);
      expect(body.results[0].status).toBe('success');
      expect(body.results[0].sourceKey).toBe(directTestKey);
      expect(body.results[0].processedKey).toBe(expectedProcessedKey);
    }, 60000); // 1 minute timeout

    test('should handle batch processing with multiple records', async () => {
      const batchKeys = [
        'uploads/batch-test-1.jpg',
        'uploads/batch-test-2.png',
        'uploads/batch-test-3.jpeg'
      ];
      
      // Upload all test images
      const uploadPromises = batchKeys.map(async (key, index) => {
        const format = key.split('.').pop();
        const testImageBuffer = createMockImageBuffer(format === 'png' ? 'png' : 'jpeg');
        
        const putObjectCommand = new PutObjectCommand({
          Bucket: stackResources.uploadBucket,
          Key: key,
          Body: testImageBuffer,
          ContentType: `image/${format === 'jpg' ? 'jpeg' : format}`,
          Metadata: {
            'test-run': 'batch-processing',
            'batch-index': index.toString()
          }
        });
        
        await s3Client.send(putObjectCommand);
        return key;
      });

      await Promise.all(uploadPromises);
      
      const mockS3Event = {
        Records: batchKeys.map(key => ({
          s3: {
            bucket: { name: stackResources.uploadBucket },
            object: { key }
          },
          eventName: 's3:ObjectCreated:Put',
          eventTime: new Date().toISOString()
        }))
      };
      
      // Invoke Lambda with batch event
      const invokeCommand = new InvokeCommand({
        FunctionName: stackResources.lambdaArn,
        Payload: JSON.stringify(mockS3Event),
        InvocationType: 'RequestResponse'
      });
      
      const response = await lambdaClient.send(invokeCommand);
      expect(response.StatusCode).toBe(200);
      
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      expect(payload.statusCode).toBe(200);
      
      const body = JSON.parse(payload.body);
      expect(body.results).toHaveLength(batchKeys.length);
      
      // Verify all batch items were processed successfully
      body.results.forEach((result: any, index: number) => {
        expect(result.status).toBe('success');
        expect(result.sourceKey).toBe(batchKeys[index]);
        expect(result.processedKey).toBe(batchKeys[index].replace('uploads/', 'processed/'));
      });
    }, 90000); // 1.5 minute timeout
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle non-existent object gracefully', async () => {
      const nonExistentKey = 'uploads/non-existent-file.jpg';
      
      const mockS3Event = {
        Records: [{
          s3: {
            bucket: { name: stackResources.uploadBucket },
            object: { key: nonExistentKey }
          },
          eventName: 's3:ObjectCreated:Put'
        }]
      };
      
      const invokeCommand = new InvokeCommand({
        FunctionName: stackResources.lambdaArn,
        Payload: JSON.stringify(mockS3Event),
        InvocationType: 'RequestResponse'
      });
      
      const response = await lambdaClient.send(invokeCommand);
      expect(response.StatusCode).toBe(200);
      
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      expect(payload.statusCode).toBe(200);
      
      const body = JSON.parse(payload.body);
      expect(body.results[0].status).toBe('error');
      expect(body.results[0].error).toContain('NoSuchKey');
    }, 30000);

    test('should handle malformed S3 events gracefully', async () => {
      const malformedEvent = {
        Records: [{
          s3: {
            // Missing bucket name
            object: { key: 'test.jpg' }
          }
        }]
      };
      
      const invokeCommand = new InvokeCommand({
        FunctionName: stackResources.lambdaArn,
        Payload: JSON.stringify(malformedEvent),
        InvocationType: 'RequestResponse'
      });
      
      const response = await lambdaClient.send(invokeCommand);
      expect(response.StatusCode).toBe(200);
      
      // Function should handle the error gracefully
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      expect(payload.statusCode).toBe(200);
      
      const body = JSON.parse(payload.body);
      expect(body.results[0].status).toBe('error');
    }, 30000);

    test('should handle empty file uploads', async () => {
      const emptyFileKey = 'uploads/empty-file.jpg';
      const emptyBuffer = Buffer.alloc(0);
      
      const putObjectCommand = new PutObjectCommand({
        Bucket: stackResources.uploadBucket,
        Key: emptyFileKey,
        Body: emptyBuffer,
        ContentType: 'image/jpeg',
        Metadata: {
          'test-run': 'empty-file-test'
        }
      });
      
      await s3Client.send(putObjectCommand);
      
      const mockS3Event = {
        Records: [{
          s3: {
            bucket: { name: stackResources.uploadBucket },
            object: { key: emptyFileKey }
          },
          eventName: 's3:ObjectCreated:Put'
        }]
      };
      
      const invokeCommand = new InvokeCommand({
        FunctionName: stackResources.lambdaArn,
        Payload: JSON.stringify(mockS3Event),
        InvocationType: 'RequestResponse'
      });
      
      const response = await lambdaClient.send(invokeCommand);
      expect(response.StatusCode).toBe(200);
      
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      const body = JSON.parse(payload.body);
      
      // Should process empty file successfully (business logic dependent)
      expect(body.results[0]).toBeDefined();
      expect(['success', 'error']).toContain(body.results[0].status);
    }, 45000);
  });

  describe('Performance and Monitoring Validation', () => {
    test('should complete processing within performance thresholds', async () => {
      const performanceTestKey = 'uploads/performance-test.jpg';
      const testImageBuffer = createMockImageBuffer('jpeg', 500 * 1024); // 500KB
      
      const startTime = Date.now();
      
      const putObjectCommand = new PutObjectCommand({
        Bucket: stackResources.uploadBucket,
        Key: performanceTestKey,
        Body: testImageBuffer,
        ContentType: 'image/jpeg',
        Metadata: {
          'test-run': 'performance-validation',
          'start-time': startTime.toString()
        }
      });
      
      await s3Client.send(putObjectCommand);
      
      const processedObject = await waitForProcessedImage('processed/performance-test.jpg');
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      
      console.log(`End-to-end processing completed in ${totalDuration}ms`);
      
      expect(processedObject).toBeTruthy();
      expect(totalDuration).toBeLessThan(120000); // Should complete within 2 minutes
    }, 150000);

    test('should generate CloudWatch metrics', async () => {
      // Wait a bit to ensure metrics are available
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const getMetricsCommand = new GetMetricStatisticsCommand({
        Namespace: 'AWS/Lambda',
        MetricName: 'Invocations',
        Dimensions: [
          {
            Name: 'FunctionName',
            Value: stackResources.lambdaName
          }
        ],
        StartTime: new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
        EndTime: new Date(),
        Period: 300, // 5 minutes
        Statistics: ['Sum']
      });
      
      const response = await cloudWatchClient.send(getMetricsCommand);
      
      // Should have some datapoints if tests ran
      expect(response.Datapoints).toBeDefined();
      console.log(`CloudWatch Lambda invocations: ${JSON.stringify(response.Datapoints)}`);
    }, 30000);
  });

  // Helper functions
  async function waitForStackStatus(stackName: string, desiredStatus: string): Promise<void> {
    const maxAttempts = 60; // 10 minutes with 10 second intervals
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const describeCommand = new DescribeStacksCommand({ StackName: stackName });
      
      try {
        const response = await cfnClient.send(describeCommand);
        const currentStatus = response.Stacks?.[0]?.StackStatus;
        
        if (currentStatus === desiredStatus) {
          console.log(`Stack ${stackName} reached status: ${desiredStatus}`);
          return;
        }
        
        if (currentStatus?.includes('FAILED') || currentStatus?.includes('ROLLBACK')) {
          throw new Error(`Stack operation failed with status: ${currentStatus}`);
        }
        
        console.log(`Stack ${stackName} status: ${currentStatus}, waiting for ${desiredStatus}...`);
        
      } catch (error: any) {
        if (desiredStatus === 'DELETE_COMPLETE' && error.name === 'ValidationError') {
          // Stack has been deleted successfully
          console.log(`Stack ${stackName} deleted successfully`);
          return;
        }
        throw error;
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    }
    
    throw new Error(`Timeout waiting for stack status: ${desiredStatus}`);
  }

  async function waitForProcessedImage(processedKey: string, maxAttempts: number = 12): Promise<any> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const getProcessedCommand = new GetObjectCommand({
          Bucket: stackResources.processedBucket,
          Key: processedKey
        });
        
        const processedObject = await s3Client.send(getProcessedCommand);
        console.log(`Processed image found: ${processedKey}`);
        return processedObject;
      } catch (error: any) {
        if (error.name === 'NoSuchKey') {
          attempts++;
          if (attempts === maxAttempts) {
            throw new Error(`Processed image not found after ${maxAttempts} attempts: ${processedKey}`);
          }
          console.log(`Waiting for processed image (attempt ${attempts}/${maxAttempts}): ${processedKey}`);
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds before retry
        } else {
          throw error;
        }
      }
    }
  }

  async function cleanupTestObjects(): Promise<void> {
    const buckets = [stackResources.uploadBucket, stackResources.processedBucket];
    
    for (const bucket of buckets) {
      try {
        const listCommand = new ListObjectsV2Command({ Bucket: bucket });
        const response = await s3Client.send(listCommand);
        
        if (response.Contents && response.Contents.length > 0) {
          const deletePromises = response.Contents.map(object => {
            if (object.Key) {
              return s3Client.send(new DeleteObjectCommand({
                Bucket: bucket,
                Key: object.Key
              }));
            }
          });
          
          await Promise.all(deletePromises);
          console.log(`Cleaned up ${response.Contents.length} objects from ${bucket}`);
        }
      } catch (error) {
        console.warn(`Error cleaning up bucket ${bucket}:`, error);
      }
    }
  }

  function createMockImageBuffer(format: string, size: number = 1024): Buffer {
    // Create a mock image buffer with some varied content based on format
    const buffer = Buffer.alloc(size);
    
    // Add some format-specific headers/markers
    if (format === 'jpeg' || format === 'jpg') {
      buffer.write('\xFF\xD8\xFF', 0); // JPEG SOI marker
    } else if (format === 'png') {
      buffer.write('\x89PNG\r\n\x1a\n', 0); // PNG signature
    }
    
    // Fill rest with random-ish data
    for (let i = 10; i < size; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
    
    return buffer;
  }

  async function streamToBuffer(stream: any): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
});