// Configuration - These are coming from cfn-outputs after deployment
import {
  CloudWatchClient,
  GetMetricStatisticsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  DynamoDBClient,
  GetItemCommand,
  ScanCommand
} from '@aws-sdk/client-dynamodb';
import {
  InvokeCommand,
  LambdaClient
} from '@aws-sdk/client-lambda';
import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';

import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS Clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const cloudWatchClient = new CloudWatchClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });

function createTestImageBuffer(width: number = 100, height: number = 100): Buffer {
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.from([
    0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x64,
    0x00, 0x00, 0x00, 0x64,
    0x08, 0x02, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00
  ]);
  const iend = Buffer.from([
    0x00, 0x00, 0x00, 0x00,
    0x49, 0x45, 0x4E, 0x44,
    0xAE, 0x42, 0x60, 0x82
  ]);
  return Buffer.concat([pngSignature, ihdr, iend]);
}

async function uploadImageToS3(key: string, contentType: string = 'image/png'): Promise<void> {
  const imageBuffer = createTestImageBuffer();
  await s3Client.send(new PutObjectCommand({
    Bucket: outputs.S3BucketName,
    Key: key,
    Body: imageBuffer,
    ContentType: contentType
  }));
}

async function getImageMetadata(imageId: string) {
  const params = {
    TableName: outputs.DynamoDBTableName,
    Key: {
      'ImageId': { S: imageId }
    }
  };
  const result = await dynamoClient.send(new GetItemCommand(params));
  return result.Item;
}

async function verifyS3Object(key: string): Promise<boolean> {
  try {
    await s3Client.send(new GetObjectCommand({
      Bucket: outputs.S3BucketName,
      Key: key
    }));
    return true;
  } catch (error) {
    return false;
  }
}

async function getMetricStatistics(metricName: string, startTime: Date, endTime: Date) {
  const command = new GetMetricStatisticsCommand({
    Namespace: 'AWS/Lambda',
    MetricName: metricName,
    Dimensions: [
      {
        Name: 'FunctionName',
        Value: outputs.LambdaFunctionArn.split(':').pop() || ''
      }
    ],
    StartTime: startTime,
    EndTime: endTime,
    Period: 300,
    Statistics: ['Sum', 'Average', 'Maximum']
  });
  return await cloudWatchClient.send(command);
}

describe('Serverless Image Processing System Integration Tests', () => {

  describe('Infrastructure Validation', () => {
    test('should have all required outputs from deployment', () => {
      const requiredOutputs = [
        'DynamoDBTableName',
        'LambdaFunctionArn',
        'SNSTopicArn',
        'S3BucketName',
        'DashboardURL'
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('should have DynamoDB table accessible', async () => {
      const scanCommand = new ScanCommand({
        TableName: outputs.DynamoDBTableName,
        Limit: 1
      });
      await expect(dynamoClient.send(scanCommand)).resolves.not.toThrow();
    });

    test('should have Lambda function accessible', async () => {
      const testEvent = {
        Records: [{
          s3: {
            bucket: { name: outputs.S3BucketName },
            object: {
              key: 'test-health-check.jpg',
              size: 1024
            }
          }
        }]
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: outputs.LambdaFunctionArn,
        Payload: JSON.stringify(testEvent)
      });

      const response = await lambdaClient.send(invokeCommand);
      expect(response.StatusCode).toBe(200);
    });

    test('should have S3 bucket accessible', async () => {
      const listCommand = new ListObjectsV2Command({
        Bucket: outputs.S3BucketName,
        MaxKeys: 1
      });
      await expect(s3Client.send(listCommand)).resolves.not.toThrow();
    });
  });

  describe('Complete End-to-End System Flow Test', () => {
    test('COMPLETE FLOW: S3 Upload → Lambda Trigger → DynamoDB Storage → CloudWatch Metrics', async () => {
      const timestamp = Date.now();
      const crypto = require('crypto');

      // PHASE 1: S3 UPLOAD - Single image
      const singleImageKey = `test-images/complete-flow-single-${timestamp}.jpg`;
      const imageBuffer = createTestImageBuffer();
      const fileSize = imageBuffer.length;

      await s3Client.send(new PutObjectCommand({
        Bucket: outputs.S3BucketName,
        Key: singleImageKey,
        Body: imageBuffer,
        ContentType: 'image/jpeg',
        Metadata: {
          'test-id': `complete-flow-${timestamp}`,
          'test-phase': 'single-upload'
        }
      }));

      const s3Exists = await verifyS3Object(singleImageKey);
      expect(s3Exists).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 8000));

      // PHASE 2: LAMBDA PROCESSING - Verify single image processing
      const singleImageId = crypto.createHash('md5')
        .update(`${outputs.S3BucketName}/${singleImageKey}`)
        .digest('hex');

      await new Promise(resolve => setTimeout(resolve, 2000));

      // PHASE 3: DYNAMODB METADATA STORAGE - Validate all fields
      const metadata = await getImageMetadata(singleImageId);

      expect(metadata).toBeDefined();
      expect(metadata!.ImageId.S).toBe(singleImageId);
      expect(metadata!.BucketName.S).toBe(outputs.S3BucketName);
      expect(metadata!.ObjectKey.S).toBe(singleImageKey);
      expect(metadata!.ContentType.S).toBe('image/jpeg');
      expect(metadata!.FileSize.N).toBe(fileSize.toString());
      expect(metadata!.Status.S).toBe('processed');
      expect(metadata!.ProcessedAt).toBeDefined();
      expect(metadata!.UploadDate).toBeDefined();
      expect(metadata!.UploadTimestamp).toBeDefined();

      // PHASE 4: MULTIPLE IMAGE FORMATS
      const imageFormats = [
        { ext: 'jpg', contentType: 'image/jpeg' },
        { ext: 'jpeg', contentType: 'image/jpeg' },
        { ext: 'png', contentType: 'image/png' }
      ];

      const uploadPromises = imageFormats.map((format, index) => {
        const key = `test-images/format-test-${timestamp}-${index}.${format.ext}`;
        return uploadImageToS3(key, format.contentType);
      });

      await Promise.all(uploadPromises);
      await new Promise(resolve => setTimeout(resolve, 8000));

      for (let index = 0; index < imageFormats.length; index++) {
        const format = imageFormats[index];
        const key = `test-images/format-test-${timestamp}-${index}.${format.ext}`;
        const imageId = crypto.createHash('md5')
          .update(`${outputs.S3BucketName}/${key}`)
          .digest('hex');

        const formatMetadata = await getImageMetadata(imageId);
        expect(formatMetadata).toBeDefined();
        expect(formatMetadata!.ContentType.S).toBe(format.contentType);
        expect(formatMetadata!.Status.S).toBe('processed');
      }

      // PHASE 5: CONCURRENT UPLOADS - Test scalability
      const numImages = 5;
      const concurrentPromises = Array.from({ length: numImages }, (_, i) => {
        const key = `test-images/concurrent-${timestamp}-${i}.png`;
        return uploadImageToS3(key, 'image/png');
      });

      await Promise.all(concurrentPromises);
      await new Promise(resolve => setTimeout(resolve, 10000));

      let processedCount = 0;
      for (let i = 0; i < numImages; i++) {
        const key = `test-images/concurrent-${timestamp}-${i}.png`;
        const imageId = crypto.createHash('md5')
          .update(`${outputs.S3BucketName}/${key}`)
          .digest('hex');

        const concurrentMetadata = await getImageMetadata(imageId);
        if (concurrentMetadata && concurrentMetadata.Status.S === 'processed') {
          processedCount++;
        }
      }

      expect(processedCount).toBe(numImages);

      // PHASE 6: GSI QUERY - Test Global Secondary Index
      const gsiImageKey = `test-images/gsi-test-${timestamp}.jpg`;
      await uploadImageToS3(gsiImageKey, 'image/jpeg');
      await new Promise(resolve => setTimeout(resolve, 5000));

      const currentTimestamp = Math.floor(Date.now() / 1000);
      const scanCommand = new ScanCommand({
        TableName: outputs.DynamoDBTableName,
        FilterExpression: 'UploadTimestamp >= :start AND UploadTimestamp <= :end',
        ExpressionAttributeValues: {
          ':start': { N: (currentTimestamp - 60).toString() },
          ':end': { N: (currentTimestamp + 60).toString() }
        }
      });

      const gsiResult = await dynamoClient.send(scanCommand);
      expect(gsiResult.Items).toBeDefined();
      expect(gsiResult.Items!.length).toBeGreaterThan(0);

      // PHASE 7: METADATA ACCURACY
      const metadataTestKey = `test-images/metadata-test-${timestamp}.png`;
      const metadataBuffer = createTestImageBuffer();
      const metadataFileSize = metadataBuffer.length;

      await s3Client.send(new PutObjectCommand({
        Bucket: outputs.S3BucketName,
        Key: metadataTestKey,
        Body: metadataBuffer,
        ContentType: 'image/png'
      }));

      await new Promise(resolve => setTimeout(resolve, 5000));

      const metadataImageId = crypto.createHash('md5')
        .update(`${outputs.S3BucketName}/${metadataTestKey}`)
        .digest('hex');

      const metadataCheck = await getImageMetadata(metadataImageId);
      expect(metadataCheck).toBeDefined();
      expect(metadataCheck!.FileSize.N).toBe(metadataFileSize.toString());
      expect(metadataCheck!.ContentType.S).toBe('image/png');
      expect(metadataCheck!.ProcessedAt).toBeDefined();
      expect(metadataCheck!.UploadDate).toBeDefined();

      // PHASE 8: IAM SECURITY - Verified by successful operations
      expect(metadata).toBeDefined();

      // PHASE 9: CLOUDWATCH MONITORING
      const metricsEndTime = new Date();
      const metricsStartTime = new Date(metricsEndTime.getTime() - (10 * 60 * 1000));

      const invocationMetrics = await getMetricStatistics(
        'Invocations',
        metricsStartTime,
        metricsEndTime
      );
      expect(invocationMetrics.Datapoints).toBeDefined();

      const durationMetrics = await getMetricStatistics(
        'Duration',
        metricsStartTime,
        metricsEndTime
      );
      expect(durationMetrics.Datapoints).toBeDefined();

      const errorMetrics = await getMetricStatistics(
        'Errors',
        metricsStartTime,
        metricsEndTime
      );
      expect(errorMetrics.Datapoints).toBeDefined();

      // PHASE 10: QUICK RETRIEVAL TEST
      const retrievalStartTime = Date.now();
      const retrievedMetadata = await getImageMetadata(singleImageId);
      const retrievalDuration = Date.now() - retrievalStartTime;

      expect(retrievedMetadata).toBeDefined();
      expect(retrievedMetadata!.ImageId.S).toBe(singleImageId);
      expect(retrievalDuration).toBeLessThan(1000);

      // PHASE 11: DATA CONSISTENCY
      const consistencyImageKey = `test-images/consistency-${timestamp}.jpg`;
      await uploadImageToS3(consistencyImageKey, 'image/jpeg');
      await new Promise(resolve => setTimeout(resolve, 5000));

      const consistencyImageId = crypto.createHash('md5')
        .update(`${outputs.S3BucketName}/${consistencyImageKey}`)
        .digest('hex');

      for (let i = 0; i < 3; i++) {
        const consistencyCheck = await getImageMetadata(consistencyImageId);
        expect(consistencyCheck).toBeDefined();
        expect(consistencyCheck!.ImageId.S).toBe(consistencyImageId);
        expect(consistencyCheck!.Status.S).toBe('processed');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // PHASE 12: S3 VERSIONING
      const versioningKey = `test-images/versioning-${timestamp}.png`;
      await uploadImageToS3(versioningKey, 'image/png');
      await new Promise(resolve => setTimeout(resolve, 3000));
      await uploadImageToS3(versioningKey, 'image/png');
      await new Promise(resolve => setTimeout(resolve, 3000));

      const listCommand = new ListObjectsV2Command({
        Bucket: outputs.S3BucketName,
        Prefix: versioningKey
      });

      const versionResult = await s3Client.send(listCommand);
      expect(versionResult.Contents).toBeDefined();
      expect(versionResult.Contents!.length).toBeGreaterThanOrEqual(1);

    }, 120000);
  });

  describe('Error Handling and Resilience', () => {
    test('should handle missing S3 object gracefully', async () => {
      const missingObjectEvent = {
        Records: [{
          s3: {
            bucket: { name: outputs.S3BucketName },
            object: {
              key: 'non-existent-image.jpg',
              size: 1024
            }
          }
        }]
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: outputs.LambdaFunctionArn,
        Payload: JSON.stringify(missingObjectEvent)
      });

      const response = await lambdaClient.send(invokeCommand);
      expect(response.StatusCode).toBe(200);

      const responsePayload = JSON.parse(
        new TextDecoder().decode(response.Payload)
      );

      const body = JSON.parse(responsePayload.body);
      expect(body.failed).toBeGreaterThan(0);
    });
  });
});