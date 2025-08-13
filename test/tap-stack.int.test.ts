import { S3Client, ListObjectsCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Lambda, InvokeCommand } from '@aws-sdk/client-lambda';
import * as fs from 'fs/promises';
import * as path from 'path';

// Initialize clients
const s3 = new S3Client({ region: 'us-east-1' });
const lambda = new Lambda({ region: 'us-east-1' });

describe('Image Processing Pipeline Integration Tests', () => {
  const sourceBucketName = 'teststackpr871-source-dev';
  const processedBucketName = 'teststackpr871-processed-dev';
  const functionName = 'teststackpr871-processor-dev';
  
  beforeAll(async () => {
    try {
      // Check if source bucket exists
      await s3.send(new ListObjectsCommand({
        Bucket: sourceBucketName,
        MaxKeys: 1,
      }));
      
      // Check if processed bucket exists
      await s3.send(new ListObjectsCommand({
        Bucket: processedBucketName,
        MaxKeys: 1,
      }));

      console.log('Found required buckets - proceeding with tests');
    } catch (error) {
      console.error('Failed to access required buckets. Error:', error);
      throw error;
    }
  });

  describe('Image Processing Tests', () => {
    let testImageKey: string;
    
    beforeEach(() => {
      testImageKey = `test-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    });

    afterEach(async () => {
      try {
        // Clean up source and processed images
        await s3.send(new DeleteObjectCommand({
          Bucket: sourceBucketName,
          Key: testImageKey,
        }));

        await s3.send(new DeleteObjectCommand({
          Bucket: processedBucketName,
          Key: testImageKey,
        }));
      } catch (error) {
        // Ignore delete errors in cleanup
      }
    });

    test('should upload image and trigger processing', async () => {
      // Create a test image buffer (1x1 black pixel)
      const testImage = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00,
        0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB,
        0x00, 0x43, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
        0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01,
        0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x03, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F,
        0x00, 0x37, 0xFF, 0xD9
      ]);

      // Upload test image to source bucket
      await s3.send(new PutObjectCommand({
        Bucket: sourceBucketName,
        Key: testImageKey,
        Body: testImage,
        ContentType: 'image/jpeg',
      }));

      // Wait for processing (up to 10 seconds)
      let retries = 10;
      let processedImage = null;
      while (retries > 0 && !processedImage) {
        try {
          const response = await s3.send(new GetObjectCommand({
            Bucket: processedBucketName,
            Key: testImageKey,
          }));
          processedImage = await response.Body?.transformToByteArray();
        } catch (error) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          retries--;
        }
      }

      expect(processedImage).toBeDefined();
      expect(processedImage?.length).toBeGreaterThan(0);
    }, 15000); // 15 second timeout

    test('should handle image processing errors gracefully', async () => {
      // Upload invalid image data
      await s3.send(new PutObjectCommand({
        Bucket: sourceBucketName,
        Key: testImageKey,
        Body: Buffer.from('not an image'),
        ContentType: 'image/jpeg',
      }));

      // Wait a few seconds for processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check CloudWatch logs via Lambda
      const response = await lambda.send(new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: Buffer.from(JSON.stringify({
          Records: [{
            s3: {
              bucket: { name: sourceBucketName },
              object: { key: testImageKey },
            },
          }],
        })),
      }));

      expect(response.FunctionError).toBeDefined();
    });
  });
});
