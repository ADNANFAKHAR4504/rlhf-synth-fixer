import { CloudWatchClient, GetMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { DeleteObjectCommand, GetObjectTaggingCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ListSubscriptionsByTopicCommand, SNSClient } from '@aws-sdk/client-sns';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS clients
const s3Client = new S3Client({});
const snsClient = new SNSClient({});
const lambdaClient = new LambdaClient({});
const cloudWatchClient = new CloudWatchClient({});

// Test utilities
const generateVideoContent = (sizeKB: number = 750): Buffer => {
  const content = Buffer.alloc(sizeKB * 1024);
  for (let i = 0; i < content.length; i++) {
    content[i] = Math.floor(Math.random() * 256);
  }
  return content;
};

const waitForProcessing = async (
  bucketName: string,
  key: string,
  maxRetries: number = 20,
  pollInterval: number = 5000
): Promise<any[]> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await s3Client.send(new GetObjectTaggingCommand({
        Bucket: bucketName,
        Key: key
      }));

      const statusTag = response.TagSet?.find(tag => tag.Key === 'ProcessingStatus');
      if (statusTag?.Value === 'Completed') {
        return response.TagSet || [];
      }
    } catch (error) {
      // Tags might not exist yet
    }
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  throw new Error(`Processing timeout for ${key}`);
};

const cleanupS3Object = async (bucketName: string, key: string): Promise<void> => {
  try {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key
    }));
  } catch (error) {
    // Ignore if object doesn't exist
  }
};

describe('Video Processing System - Comprehensive Integration Tests', () => {
  let bucketName: string;
  let lambdaFunctionArn: string;
  let snsTopicArn: string;

  beforeAll(async () => {
    bucketName = outputs.S3BucketName || outputs.BucketName;
    lambdaFunctionArn = outputs.LambdaFunctionArn || outputs.FunctionArn;
    snsTopicArn = outputs.SNSTopicArn || outputs.TopicArn;

    expect(bucketName).toBeDefined();
    expect(lambdaFunctionArn).toBeDefined();
    expect(snsTopicArn).toBeDefined();
  }, 30000);

  describe('Complete End-to-End Workflow with Multi-Format Support', () => {
    test('should process multiple video formats, verify Lambda invocation, S3 tags, CloudWatch metrics, and SNS configuration', async () => {
      const testFiles: { key: string; format: string; content: Buffer }[] = [];
      const formats = [
        { ext: '.mp4', contentType: 'video/mp4' },
        { ext: '.mov', contentType: 'video/quicktime' },
        { ext: '.avi', contentType: 'video/x-msvideo' }
      ];

      try {
        // Phase 1: Upload multiple video formats and test direct Lambda invocation
        for (const format of formats) {
          const key = `test-videos/multi-format-${Date.now()}-${format.ext.substring(1)}${format.ext}`;
          const content = generateVideoContent(750);

          await s3Client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: content,
            ContentType: format.contentType
          }));

          testFiles.push({ key, format: format.ext, content });

          // Test direct Lambda invocation for the first file
          if (format.ext === '.mp4') {
            const testEvent = {
              Records: [{
                eventVersion: '2.1',
                eventSource: 'aws:s3',
                eventName: 's3:ObjectCreated:Put',
                eventTime: new Date().toISOString(),
                s3: {
                  bucket: { name: bucketName },
                  object: { key: key, size: content.length }
                }
              }]
            };

            const invokeResponse = await lambdaClient.send(new InvokeCommand({
              FunctionName: lambdaFunctionArn,
              Payload: JSON.stringify(testEvent),
              InvocationType: 'RequestResponse'
            }));

            expect(invokeResponse.StatusCode).toBe(200);

            const payload = JSON.parse(new TextDecoder().decode(invokeResponse.Payload));
            expect(payload.statusCode).toBe(200);
            expect(JSON.parse(payload.body).message).toBe('Video processing completed');
          }
        }

        // Phase 2: Wait and verify processing for all formats
        const processingResults = await Promise.all(
          testFiles.map(file => waitForProcessing(bucketName, file.key))
        );

        // Phase 3: Validate tags for each processed file
        for (let i = 0; i < testFiles.length; i++) {
          const tags = processingResults[i];
          const file = testFiles[i];

          // Verify required tags exist
          const statusTag = tags.find(t => t.Key === 'ProcessingStatus');
          const processedAtTag = tags.find(t => t.Key === 'ProcessedAt');

          expect(statusTag).toBeDefined();
          expect(statusTag?.Value).toBe('Completed');
          expect(processedAtTag).toBeDefined();

          // Verify timestamp is recent (within last 2 minutes)
          const processedTime = new Date(processedAtTag!.Value!);
          const timeDiff = Date.now() - processedTime.getTime();
          expect(timeDiff).toBeLessThan(120000);

          // Verify object integrity
          const finalTags = await s3Client.send(new GetObjectTaggingCommand({
            Bucket: bucketName,
            Key: file.key
          }));
          expect(finalTags.TagSet!.length).toBeGreaterThanOrEqual(2);
        }

        // Phase 4: Verify CloudWatch metrics
        await new Promise(resolve => setTimeout(resolve, 10000));

        const metricsEndTime = new Date();
        const metricsStartTime = new Date(metricsEndTime.getTime() - 300000);

        const metricsToValidate = [
          { name: 'VideosProcessed', id: 'videos_processed', stat: 'Sum' },
          { name: 'ProcessingDuration', id: 'processing_duration', stat: 'Average' },
          { name: 'SuccessfulProcessing', id: 'successful_processing', stat: 'Sum' }
        ];

        for (const metric of metricsToValidate) {
          const metricsResponse = await cloudWatchClient.send(new GetMetricDataCommand({
            MetricDataQueries: [{
              Id: metric.id,
              MetricStat: {
                Metric: {
                  Namespace: 'VideoProcessing',
                  MetricName: metric.name,
                  Dimensions: [{ Name: 'Environment', Value: environmentSuffix }]
                },
                Period: 300,
                Stat: metric.stat
              }
            }],
            StartTime: metricsStartTime,
            EndTime: metricsEndTime
          }));

          expect(metricsResponse.MetricDataResults).toBeDefined();
          expect(metricsResponse.MetricDataResults![0].Id).toBe(metric.id);
        }

        // Phase 5: Verify SNS topic configuration
        const subscriptionsResponse = await snsClient.send(
          new ListSubscriptionsByTopicCommand({ TopicArn: snsTopicArn })
        );

        expect(subscriptionsResponse.Subscriptions).toBeDefined();
        expect(subscriptionsResponse.Subscriptions!.length).toBeGreaterThan(0);

        const emailSubscription = subscriptionsResponse.Subscriptions?.find(
          sub => sub.Protocol === 'email'
        );
        expect(emailSubscription).toBeDefined();

      } finally {
        // Cleanup all test files
        await Promise.all(
          testFiles.map(file => cleanupS3Object(bucketName, file.key))
        );
      }
    }, 180000);
  });

  describe('Lambda Direct Invocation and Error Handling', () => {
    test('should handle direct Lambda invocation, process valid files, and gracefully handle errors', async () => {
      const testKeys = {
        direct: `direct-test-${Date.now()}.mp4`,
        invalid: `invalid-test-${Date.now()}.mp4`,
        recovery: `recovery-test-${Date.now()}.mp4`
      };

      try {
        // Phase 1: Direct Lambda invocation with valid file
        const validContent = generateVideoContent(1);

        await s3Client.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: testKeys.direct,
          Body: validContent,
          ContentType: 'video/mp4'
        }));

        const testEvent = {
          Records: [{
            eventVersion: '2.1',
            eventSource: 'aws:s3',
            eventName: 's3:ObjectCreated:Put',
            eventTime: new Date().toISOString(),
            s3: {
              bucket: { name: bucketName },
              object: { key: testKeys.direct, size: validContent.length }
            }
          }]
        };

        const invokeResponse = await lambdaClient.send(new InvokeCommand({
          FunctionName: lambdaFunctionArn,
          Payload: JSON.stringify(testEvent),
          InvocationType: 'RequestResponse'
        }));

        expect(invokeResponse.StatusCode).toBe(200);
        const payload = JSON.parse(new TextDecoder().decode(invokeResponse.Payload));
        expect(payload.statusCode).toBe(200);
        expect(JSON.parse(payload.body).message).toBe('Video processing completed');

        // Phase 2: Error handling - upload invalid file
        await s3Client.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: testKeys.invalid,
          Body: Buffer.from(''), // Empty file
          ContentType: 'video/mp4'
        }));

        await new Promise(resolve => setTimeout(resolve, 8000));

        // Phase 3: System resilience - verify system still processes valid files after error
        await s3Client.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: testKeys.recovery,
          Body: validContent,
          ContentType: 'video/mp4'
        }));

        const recoveryTags = await waitForProcessing(bucketName, testKeys.recovery);

        expect(recoveryTags).toContainEqual(
          expect.objectContaining({
            Key: 'ProcessingStatus',
            Value: 'Completed'
          })
        );

      } finally {
        // Cleanup
        await Promise.all([
          cleanupS3Object(bucketName, testKeys.direct),
          cleanupS3Object(bucketName, testKeys.invalid),
          cleanupS3Object(bucketName, testKeys.recovery)
        ]);
      }
    }, 60000);
  });

  describe('Performance and Concurrent Processing', () => {
    test('should handle concurrent uploads and process all files successfully', async () => {
      const concurrentCount = 5;
      const testFiles: string[] = [];
      const uploadPromises: Promise<any>[] = [];

      try {
        // Phase 1: Concurrent uploads
        for (let i = 0; i < concurrentCount; i++) {
          const key = `concurrent-${i}-${Date.now()}.mp4`;
          testFiles.push(key);

          uploadPromises.push(
            s3Client.send(new PutObjectCommand({
              Bucket: bucketName,
              Key: key,
              Body: generateVideoContent(500),
              ContentType: 'video/mp4'
            }))
          );
        }

        await Promise.all(uploadPromises);

        // Phase 2: Wait for all files to process
        await new Promise(resolve => setTimeout(resolve, 15000));

        // Phase 3: Verify all files processed successfully
        const verificationPromises = testFiles.map(async (key) => {
          const tags = await s3Client.send(new GetObjectTaggingCommand({
            Bucket: bucketName,
            Key: key
          }));

          expect(tags.TagSet).toContainEqual(
            expect.objectContaining({
              Key: 'ProcessingStatus',
              Value: 'Completed'
            })
          );
        });

        await Promise.all(verificationPromises);

      } finally {
        // Cleanup
        await Promise.all(
          testFiles.map(key => cleanupS3Object(bucketName, key))
        );
      }
    }, 60000);
  });
});