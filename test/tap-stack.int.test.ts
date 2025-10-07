import fs from 'fs';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectTaggingCommand } from '@aws-sdk/client-s3';
import { SNSClient, ListSubscriptionsByTopicCommand } from '@aws-sdk/client-sns';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { CloudWatchClient, GetMetricDataCommand } from '@aws-sdk/client-cloudwatch';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS clients
const s3Client = new S3Client({});
const snsClient = new SNSClient({});
const lambdaClient = new LambdaClient({});
const cloudWatchClient = new CloudWatchClient({});

// Test configuration
const testVideoContent = Buffer.from('fake video content for testing');
const testFileName = `test-video-${Date.now()}.mp4`;

describe('Video Processing System Integration Tests', () => {
  let bucketName: string;
  let lambdaFunctionArn: string;
  let snsTopicArn: string;

  beforeAll(async () => {
    // Extract resource identifiers from CloudFormation outputs
    bucketName = outputs.S3BucketName || outputs.BucketName;
    lambdaFunctionArn = outputs.LambdaFunctionArn || outputs.FunctionArn;
    snsTopicArn = outputs.SNSTopicArn || outputs.TopicArn;

    expect(bucketName).toBeDefined();
    expect(lambdaFunctionArn).toBeDefined();
    expect(snsTopicArn).toBeDefined();
  }, 30000);

  afterEach(async () => {
    // Clean up test files
    try {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testFileName
      }));
    } catch (error) {
      // Ignore if file doesn't exist
    }
  });

  describe('End-to-End Video Processing Workflow', () => {
    test('should process video upload end-to-end', async () => {
      // Step 1: Upload a video file to S3
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: testFileName,
        Body: testVideoContent,
        ContentType: 'video/mp4'
      }));

      // Step 2: Wait for Lambda processing (S3 events are asynchronous)
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Step 3: Verify object has been tagged as processed
      const taggingResponse = await s3Client.send(new GetObjectTaggingCommand({
        Bucket: bucketName,
        Key: testFileName
      }));

      expect(taggingResponse.TagSet).toContainEqual(
        expect.objectContaining({
          Key: 'ProcessingStatus',
          Value: 'Completed'
        })
      );

      expect(taggingResponse.TagSet).toContainEqual(
        expect.objectContaining({
          Key: 'ProcessedAt'
        })
      );
    }, 30000);

    test('should handle different video formats', async () => {
      const formats = ['.mp4', '.mov', '.avi'];
      
      for (const format of formats) {
        const fileName = `test-video-${Date.now()}${format}`;
        
        await s3Client.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: fileName,
          Body: testVideoContent,
          ContentType: `video/${format.substring(1)}`
        }));

        // Wait for processing
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Verify processing
        const taggingResponse = await s3Client.send(new GetObjectTaggingCommand({
          Bucket: bucketName,
          Key: fileName
        }));

        expect(taggingResponse.TagSet).toContainEqual(
          expect.objectContaining({
            Key: 'ProcessingStatus',
            Value: 'Completed'
          })
        );

        // Clean up
        await s3Client.send(new DeleteObjectCommand({
          Bucket: bucketName,
          Key: fileName
        }));
      }
    }, 60000);

    test('should publish custom CloudWatch metrics', async () => {
      // Upload a test file to trigger metric publishing
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: testFileName,
        Body: testVideoContent,
        ContentType: 'video/mp4'
      }));

      // Wait for processing and metric publishing
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Check for custom metrics
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 15 * 60 * 1000); // 15 minutes ago

      const metricsResponse = await cloudWatchClient.send(new GetMetricDataCommand({
        MetricDataQueries: [
          {
            Id: 'videos_processed',
            MetricStat: {
              Metric: {
                Namespace: 'VideoProcessing',
                MetricName: 'VideosProcessed',
                Dimensions: [
                  {
                    Name: 'Environment',
                    Value: environmentSuffix
                  }
                ]
              },
              Period: 300,
              Stat: 'Sum'
            }
          }
        ],
        StartTime: startTime,
        EndTime: endTime
      }));

      expect(metricsResponse.MetricDataResults).toBeDefined();
      expect(metricsResponse.MetricDataResults?.[0]?.Values?.length).toBeGreaterThan(0);
    }, 45000);
  });

  describe('Lambda Function Direct Testing', () => {
    test('should invoke Lambda function directly', async () => {
      const testEvent = {
        Records: [
          {
            eventVersion: '2.1',
            eventSource: 'aws:s3',
            eventName: 's3:ObjectCreated:Put',
            eventTime: new Date().toISOString(),
            s3: {
              bucket: { name: bucketName },
              object: { 
                key: 'direct-test-video.mp4',
                size: 1024
              }
            }
          }
        ]
      };

      // First upload the test file
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: 'direct-test-video.mp4',
        Body: testVideoContent,
        ContentType: 'video/mp4'
      }));

      const response = await lambdaClient.send(new InvokeCommand({
        FunctionName: lambdaFunctionArn,
        Payload: JSON.stringify(testEvent),
        InvocationType: 'RequestResponse'
      }));

      expect(response.StatusCode).toBe(200);
      
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      expect(payload.statusCode).toBe(200);
      expect(JSON.parse(payload.body).message).toBe('Video processing completed');

      // Clean up
      await s3Client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: 'direct-test-video.mp4'
      }));
    }, 30000);
  });

  describe('SNS Notification System', () => {
    test('should have SNS topic configured with subscriptions', async () => {
      const subscriptionsResponse = await snsClient.send(
        new ListSubscriptionsByTopicCommand({
          TopicArn: snsTopicArn
        })
      );

      expect(subscriptionsResponse.Subscriptions).toBeDefined();
      expect(subscriptionsResponse.Subscriptions?.length).toBeGreaterThan(0);
      
      // Verify email subscription exists
      const emailSubscription = subscriptionsResponse.Subscriptions?.find(
        sub => sub.Protocol === 'email'
      );
      expect(emailSubscription).toBeDefined();
    }, 15000);
  });

  describe('Error Handling and Resilience', () => {
    test('should handle processing errors gracefully', async () => {
      // Create an invalid/corrupted file that should cause processing errors
      const invalidFileName = `invalid-file-${Date.now()}.mp4`;
      
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: invalidFileName,
        Body: Buffer.from(''), // Empty file should cause processing issues
        ContentType: 'video/mp4'
      }));

      // Wait for processing attempt
      await new Promise(resolve => setTimeout(resolve, 8000));

      // The system should still be functional even if this file failed
      // Test by uploading a valid file afterward
      const validFileName = `recovery-test-${Date.now()}.mp4`;
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: validFileName,
        Body: testVideoContent,
        ContentType: 'video/mp4'
      }));

      await new Promise(resolve => setTimeout(resolve, 5000));

      const taggingResponse = await s3Client.send(new GetObjectTaggingCommand({
        Bucket: bucketName,
        Key: validFileName
      }));

      expect(taggingResponse.TagSet).toContainEqual(
        expect.objectContaining({
          Key: 'ProcessingStatus',
          Value: 'Completed'
        })
      );

      // Clean up
      await s3Client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: invalidFileName
      }));
      await s3Client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: validFileName
      }));
    }, 45000);
  });

  describe('Performance and Scale Testing', () => {
    test('should handle concurrent uploads', async () => {
      const concurrentUploads = 5;
      const uploadPromises = [];
      const fileNames = [];

      for (let i = 0; i < concurrentUploads; i++) {
        const fileName = `concurrent-test-${i}-${Date.now()}.mp4`;
        fileNames.push(fileName);
        
        uploadPromises.push(
          s3Client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            Body: testVideoContent,
            ContentType: 'video/mp4'
          }))
        );
      }

      // Upload all files concurrently
      await Promise.all(uploadPromises);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 15000));

      // Verify all files were processed
      for (const fileName of fileNames) {
        const taggingResponse = await s3Client.send(new GetObjectTaggingCommand({
          Bucket: bucketName,
          Key: fileName
        }));

        expect(taggingResponse.TagSet).toContainEqual(
          expect.objectContaining({
            Key: 'ProcessingStatus',
            Value: 'Completed'
          })
        );

        // Clean up
        await s3Client.send(new DeleteObjectCommand({
          Bucket: bucketName,
          Key: fileName
        }));
      }
    }, 60000);
  });
});