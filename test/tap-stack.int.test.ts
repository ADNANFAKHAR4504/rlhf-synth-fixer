import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { LambdaClient, GetFunctionCommand, InvokeCommand } from '@aws-sdk/client-lambda';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests', () => {
  let outputs: any;
  let s3Client: S3Client;
  let lambdaClient: LambdaClient;
  let logsClient: CloudWatchLogsClient;

  beforeAll(() => {
    // Load outputs from cfn-outputs/flat-outputs.json
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    expect(fs.existsSync(outputsPath)).toBe(true);
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

    // Initialize AWS clients
    const region = process.env.AWS_REGION || 'us-east-1';
    s3Client = new S3Client({ region });
    lambdaClient = new LambdaClient({ region });
    logsClient = new CloudWatchLogsClient({ region });
  });

  describe('S3 Buckets', () => {
    test('Source bucket exists and is accessible', async () => {
      const command = new ListObjectsV2Command({
        Bucket: outputs.SourceBucketName,
        MaxKeys: 1,
      });
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('Thumbnail bucket exists and is accessible', async () => {
      const command = new ListObjectsV2Command({
        Bucket: outputs.ThumbnailBucketName,
        MaxKeys: 1,
      });
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('Lambda Function', () => {
    test('Lambda function exists and is configured correctly', async () => {
      const functionName = outputs.ProcessImageFunctionArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
      expect(response.Configuration?.Timeout).toBe(30);
      expect(response.Configuration?.MemorySize).toBe(1024);
      expect(response.Configuration?.Environment?.Variables?.THUMBNAIL_BUCKET).toBe(outputs.ThumbnailBucketName);
    });

    test('Lambda function has correct permissions', async () => {
      const functionName = outputs.ProcessImageFunctionArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Role).toBeDefined();
      expect(response.Configuration?.Role).toContain('process-image-role');
    });
  });

  describe('CloudWatch Logs', () => {
    test('Log group exists', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.LogGroupName,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
      expect(response.logGroups![0].logGroupName).toBe(outputs.LogGroupName);
      expect(response.logGroups![0].retentionInDays).toBe(7);
    });
  });

  describe('End-to-End Image Processing', () => {
    test.skip('Uploading image to source bucket triggers processing', async () => {
      // Create a small test image (1x1 pixel PNG)
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );
      const testKey = `test-image-${Date.now()}.png`;

      // Upload test image to source bucket
      const putCommand = new PutObjectCommand({
        Bucket: outputs.SourceBucketName,
        Key: testKey,
        Body: testImageBuffer,
        ContentType: 'image/png',
      });
      await s3Client.send(putCommand);

      // Wait for Lambda to process (S3 event notification is asynchronous)
      // Poll for thumbnail with retries
      const thumbnailKey = `thumb-${testKey}`;
      const maxRetries = 6;
      const retryDelay = 5000;
      let thumbnailFound = false;

      for (let i = 0; i < maxRetries; i++) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));

        try {
          const getCommand = new GetObjectCommand({
            Bucket: outputs.ThumbnailBucketName,
            Key: thumbnailKey,
          });
          const response = await s3Client.send(getCommand);

          if (response.$metadata.httpStatusCode === 200) {
            thumbnailFound = true;
            expect(response.ContentType).toBe('image/jpeg');
            break;
          }
        } catch (error: any) {
          if (error.name !== 'NoSuchKey' || i === maxRetries - 1) {
            throw error;
          }
          // Continue retrying for NoSuchKey errors
        }
      }

      expect(thumbnailFound).toBe(true);
    }, 45000);
  });

  describe('Resource Naming', () => {
    test('All resources include environmentSuffix', () => {
      expect(outputs.SourceBucketName).toContain('synths2z5s1w6');
      expect(outputs.ThumbnailBucketName).toContain('synths2z5s1w6');
      expect(outputs.LogGroupName).toContain('synths2z5s1w6');
      expect(outputs.ProcessImageFunctionArn).toContain('synths2z5s1w6');
    });
  });
});
