import { S3Event, S3Handler } from 'aws-lambda';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { Readable } from 'stream';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});
const THUMBNAIL_BUCKET = process.env.THUMBNAIL_BUCKET || '';
const THUMBNAIL_WIDTH = 200;
const THUMBNAIL_HEIGHT = 200;

/**
 * Converts a readable stream to a buffer
 */
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Lambda handler for processing S3 image uploads
 */
export const handler: S3Handler = async (event: S3Event): Promise<void> => {
  console.log('Event received:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const sourceBucket = record.s3.bucket.name;
    const sourceKey = decodeURIComponent(
      record.s3.object.key.replace(/\+/g, ' ')
    );

    console.log(`Processing image: ${sourceKey} from bucket: ${sourceBucket}`);

    try {
      // Validate thumbnail bucket configuration
      if (!THUMBNAIL_BUCKET) {
        throw new Error('THUMBNAIL_BUCKET environment variable is not set');
      }

      // Get the original image from S3
      const getObjectCommand = new GetObjectCommand({
        Bucket: sourceBucket,
        Key: sourceKey,
      });

      const response = await s3Client.send(getObjectCommand);

      if (!response.Body) {
        throw new Error('Empty response body from S3');
      }

      // Convert stream to buffer
      const imageBuffer = await streamToBuffer(response.Body as Readable);

      console.log(`Image size: ${imageBuffer.length} bytes`);

      // Validate image file
      if (imageBuffer.length === 0) {
        throw new Error('Image file is empty');
      }

      // Generate thumbnail using Sharp
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      console.log(`Thumbnail size: ${thumbnailBuffer.length} bytes`);

      // Generate thumbnail key (add 'thumb-' prefix)
      const thumbnailKey = `thumb-${sourceKey}`;

      // Upload thumbnail to destination bucket
      const putObjectCommand = new PutObjectCommand({
        Bucket: THUMBNAIL_BUCKET,
        Key: thumbnailKey,
        Body: thumbnailBuffer,
        ContentType: 'image/jpeg',
        Metadata: {
          'original-key': sourceKey,
          'original-bucket': sourceBucket,
          'processed-at': new Date().toISOString(),
        },
      });

      await s3Client.send(putObjectCommand);

      console.log(
        `Successfully created thumbnail: ${thumbnailKey} in bucket: ${THUMBNAIL_BUCKET}`
      );
    } catch (error) {
      console.error('Error processing image:', error);

      // Log detailed error information
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }

      // Re-throw to mark Lambda execution as failed
      throw error;
    }
  }

  console.log('All images processed successfully');
};
