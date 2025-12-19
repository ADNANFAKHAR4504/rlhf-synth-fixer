import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import { CloudWatchClient, GetMetricStatisticsCommand, Statistic } from '@aws-sdk/client-cloudwatch';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { SNSClient } from '@aws-sdk/client-sns';
import fs from 'fs';
// Configuration - Read from cfn-outputs after deployment
let outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || "dev";

describe('Serverless Image Processing System - E2E Integration Tests', () => {
  const region = process.env.AWS_REGION || outputs.Region || 'us-east-1';

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

    // Read stack resources from outputs
    stackResources = {
      uploadBucket: outputs.UploadBucketName,
      processedBucket: outputs.ProcessedBucketName,
      lambdaArn: outputs.LambdaFunctionArn,
      lambdaName: `image-processor-${environmentSuffix}`,
      snsTopicArn: outputs.SNSTopicArn
    };

    // Verify all resources are available
    expect(stackResources.uploadBucket).toBeTruthy();
    expect(stackResources.processedBucket).toBeTruthy();
    expect(stackResources.lambdaArn).toBeTruthy();
    expect(stackResources.snsTopicArn).toBeTruthy();
  }, 60000);

  afterAll(async () => {
    // Clean up test objects after tests complete
    try {
      await cleanupTestObjects();
    } catch (error) {
      // Cleanup errors are non-critical
    }
  }, 300000);

  describe('End-to-End Image Processing Flow', () => {
    test('should complete full flow: S3 upload -> Lambda processing -> processed image verification', async () => {
      const testKey = 'uploads/e2e-flow-test.jpg';
      const expectedProcessedKey = 'processed/e2e-flow-test.jpg';
      const testImageBuffer = createMockImageBuffer('jpeg', 256 * 1024);

      const uploadStartTime = Date.now();

      const putObjectCommand = new PutObjectCommand({
        Bucket: stackResources.uploadBucket,
        Key: testKey,
        Body: testImageBuffer,
        ContentType: 'image/jpeg',
        Metadata: {
          'test-run': 'e2e-flow',
          'test-id': Date.now().toString(),
          'image-size': testImageBuffer.length.toString()
        }
      });

      const uploadResponse = await s3Client.send(putObjectCommand);
      expect(uploadResponse.$metadata.httpStatusCode).toBe(200);

      const processedObject = await waitForProcessedImage(expectedProcessedKey, 18);

      expect(processedObject).toBeTruthy();
      expect(processedObject.ContentType).toBe('image/jpeg');
      expect(processedObject.Metadata?.['original-bucket']).toBe(stackResources.uploadBucket);
      expect(processedObject.Metadata?.['original-key']).toBe(testKey);
      expect(processedObject.Metadata?.['environment']).toBe(environmentSuffix);
      expect(processedObject.Metadata?.['processed-at']).toBeTruthy();

      const processedBody = await streamToBuffer(processedObject.Body);
      expect(processedBody.length).toBeGreaterThan(0);

      const totalDuration = Date.now() - uploadStartTime;
      expect(totalDuration).toBeLessThan(180000);
    }, 180000);

    test('should handle multiple image formats concurrently', async () => {
      const testImages = [
        { key: 'uploads/e2e-test-image.jpg', contentType: 'image/jpeg' },
        { key: 'uploads/e2e-test-image.png', contentType: 'image/png' },
        { key: 'uploads/e2e-test-image.jpeg', contentType: 'image/jpeg' }
      ];

      const uploadPromises = testImages.map(async (testImage) => {
        const format = testImage.contentType.split('/')[1];
        const testImageBuffer = createMockImageBuffer(format);

        await s3Client.send(new PutObjectCommand({
          Bucket: stackResources.uploadBucket,
          Key: testImage.key,
          Body: testImageBuffer,
          ContentType: testImage.contentType,
          Metadata: {
            'test-run': 'e2e-multiple-formats',
            'format': format
          }
        }));

        return testImage;
      });

      await Promise.all(uploadPromises);

      const verificationPromises = testImages.map(async (testImage) => {
        const expectedProcessedKey = testImage.key.replace('uploads/', 'processed/');
        const processedObject = await waitForProcessedImage(expectedProcessedKey);

        expect(processedObject).toBeTruthy();
        expect(processedObject?.ContentType).toBe(testImage.contentType);
        expect(processedObject?.Metadata?.['original-key']).toBe(testImage.key);
        expect(processedObject?.Metadata?.['environment']).toBe(environmentSuffix);

        return processedObject;
      });

      const processedResults = await Promise.all(verificationPromises);
      expect(processedResults).toHaveLength(testImages.length);
    }, 300000);

    test('should handle large image uploads efficiently', async () => {
      const largeImageKey = 'uploads/large-test-image.jpg';
      const expectedProcessedKey = 'processed/large-test-image.jpg';
      const largeImageBuffer = createMockImageBuffer('jpeg', 1024 * 1024);

      const uploadStart = Date.now();
      await s3Client.send(new PutObjectCommand({
        Bucket: stackResources.uploadBucket,
        Key: largeImageKey,
        Body: largeImageBuffer,
        ContentType: 'image/jpeg',
        Metadata: {
          'test-run': 'e2e-large-image',
          'size': largeImageBuffer.length.toString()
        }
      }));

      const processingStart = Date.now();
      const processedObject = await waitForProcessedImage(expectedProcessedKey);
      const processingDuration = Date.now() - processingStart;

      expect(processedObject).toBeTruthy();
      expect(processedObject?.ContentType).toBe('image/jpeg');
      expect(processedObject?.Metadata?.['original-key']).toBe(largeImageKey);
      expect(processingDuration).toBeLessThan(60000);
    }, 120000);
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
    }, 60000);

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
    }, 90000);
  });

  describe('Error Handling and Edge Cases', () => {

    test('should handle malformed S3 events gracefully', async () => {
      const malformedEvent = {
        Records: [{
          s3: {
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

      expect(body.results[0]).toBeDefined();
      expect(['success', 'error']).toContain(body.results[0].status);
    }, 45000);
  });

  describe('Complete End-to-End Flow with CloudWatch Metrics', () => {
    test('should complete full flow: S3 upload -> Lambda processing -> CloudWatch metrics verification', async () => {
      const testKey = 'uploads/complete-flow-test.jpg';
      const expectedProcessedKey = 'processed/complete-flow-test.jpg';
      const testImageBuffer = createMockImageBuffer('jpeg', 256 * 1024);

      const baselineMetrics = await getLambdaMetrics();

      const uploadStartTime = Date.now();

      const putObjectCommand = new PutObjectCommand({
        Bucket: stackResources.uploadBucket,
        Key: testKey,
        Body: testImageBuffer,
        ContentType: 'image/jpeg',
        Metadata: {
          'test-run': 'complete-e2e-flow',
          'test-id': Date.now().toString(),
          'image-size': testImageBuffer.length.toString()
        }
      });

      const uploadResponse = await s3Client.send(putObjectCommand);
      expect(uploadResponse.$metadata.httpStatusCode).toBe(200);

      const processedObject = await waitForProcessedImage(expectedProcessedKey, 18);

      expect(processedObject).toBeTruthy();
      expect(processedObject.ContentType).toBe('image/jpeg');
      expect(processedObject.Metadata?.['original-bucket']).toBe(stackResources.uploadBucket);
      expect(processedObject.Metadata?.['original-key']).toBe(testKey);
      expect(processedObject.Metadata?.['environment']).toBe(environmentSuffix);
      expect(processedObject.Metadata?.['processed-at']).toBeTruthy();

      const processedBody = await streamToBuffer(processedObject.Body);
      expect(processedBody.length).toBeGreaterThan(0);

      await new Promise(resolve => setTimeout(resolve, 60000));

      const metricsAfterTest = await getLambdaMetrics();

      expect(metricsAfterTest.invocations).toBeGreaterThanOrEqual(baselineMetrics.invocations);
      expect(metricsAfterTest.errors).toBe(baselineMetrics.errors);
      expect(metricsAfterTest.throttles).toBe(0);

      if (metricsAfterTest.avgDuration > 0) {
        expect(metricsAfterTest.avgDuration).toBeLessThan(30000);
      }

      await getMetricValue('ConcurrentExecutions', Statistic.Maximum);
      const snsMetrics = await getSNSMetrics();
      expect(snsMetrics.messagesPublished).toBeGreaterThanOrEqual(0);

      const totalDuration = Date.now() - uploadStartTime;
      expect(totalDuration).toBeLessThan(240000);

    }, 300000);
  });

  // Helper functions
  async function waitForProcessedImage(processedKey: string, maxAttempts: number = 12): Promise<any> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const getProcessedCommand = new GetObjectCommand({
          Bucket: stackResources.processedBucket,
          Key: processedKey
        });

        const processedObject = await s3Client.send(getProcessedCommand);
        return processedObject;
      } catch (error: any) {
        if (error.name === 'NoSuchKey') {
          attempts++;
          if (attempts === maxAttempts) {
            throw new Error(`Processed image not found after ${maxAttempts} attempts: ${processedKey}`);
          }
          await new Promise(resolve => setTimeout(resolve, 10000));
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
          const deletePromises = response.Contents.map((object: any) => {
            if (object.Key) {
              return s3Client.send(new DeleteObjectCommand({
                Bucket: bucket,
                Key: object.Key
              }));
            } else {
              return Promise.resolve();
            }
          });

          await Promise.all(deletePromises);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  function createMockImageBuffer(format: string, size: number = 1024): Buffer {
    const buffer = Buffer.alloc(size);

    if (format === 'jpeg' || format === 'jpg') {
      buffer.write('\xFF\xD8\xFF', 0);
    } else if (format === 'png') {
      buffer.write('\x89PNG\r\n\x1a\n', 0);
    }

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

  async function getLambdaMetrics(): Promise<{
    invocations: number;
    errors: number;
    avgDuration: number;
    maxDuration: number;
    throttles: number;
  }> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 15 * 60 * 1000);

    const [invocations, errors, duration, throttles] = await Promise.all([
      getMetricValue('Invocations', Statistic.Sum, startTime, endTime),
      getMetricValue('Errors', Statistic.Sum, startTime, endTime),
      getMetricValue('Duration', Statistic.Average, startTime, endTime),
      getMetricValue('Throttles', Statistic.Sum, startTime, endTime)
    ]);

    const maxDuration = await getMetricValue('Duration', Statistic.Maximum, startTime, endTime);

    return {
      invocations: invocations || 0,
      errors: errors || 0,
      avgDuration: duration || 0,
      maxDuration: maxDuration || 0,
      throttles: throttles || 0
    };
  }

  async function getMetricValue(
    metricName: string,
    statistic: Statistic,
    startTime?: Date,
    endTime?: Date
  ): Promise<number> {
    const end = endTime || new Date();
    const start = startTime || new Date(end.getTime() - 15 * 60 * 1000);

    const command = new GetMetricStatisticsCommand({
      Namespace: 'AWS/Lambda',
      MetricName: metricName,
      Dimensions: [
        {
          Name: 'FunctionName',
          Value: stackResources.lambdaName
        }
      ],
      StartTime: start,
      EndTime: end,
      Period: 300,
      Statistics: [statistic]
    });

    const response = await cloudWatchClient.send(command);

    if (!response.Datapoints || response.Datapoints.length === 0) {
      return 0;
    }

    const sortedDatapoints = response.Datapoints.sort((a, b) =>
      (b.Timestamp?.getTime() || 0) - (a.Timestamp?.getTime() || 0)
    );

    const datapoint = sortedDatapoints[0];

    // Access the value based on the statistic type
    switch (statistic) {
      case Statistic.Sum:
        return datapoint.Sum || 0;
      case Statistic.Average:
        return datapoint.Average || 0;
      case Statistic.Maximum:
        return datapoint.Maximum || 0;
      case Statistic.Minimum:
        return datapoint.Minimum || 0;
      case Statistic.SampleCount:
        return datapoint.SampleCount || 0;
      default:
        return 0;
    }
  }

  async function getSNSMetrics(): Promise<{
    messagesPublished: number;
  }> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 15 * 60 * 1000);

    const topicName = stackResources.snsTopicArn.split(':').pop() || '';

    const command = new GetMetricStatisticsCommand({
      Namespace: 'AWS/SNS',
      MetricName: 'NumberOfMessagesPublished',
      Dimensions: [
        {
          Name: 'TopicName',
          Value: topicName
        }
      ],
      StartTime: startTime,
      EndTime: endTime,
      Period: 300,
      Statistics: [Statistic.Sum]
    });

    try {
      const response = await cloudWatchClient.send(command);

      if (!response.Datapoints || response.Datapoints.length === 0) {
        return { messagesPublished: 0 };
      }

      const sum = response.Datapoints.reduce((acc, dp) => acc + (dp.Sum || 0), 0);
      return { messagesPublished: sum };
    } catch (error) {
      return { messagesPublished: 0 };
    }
  }
});