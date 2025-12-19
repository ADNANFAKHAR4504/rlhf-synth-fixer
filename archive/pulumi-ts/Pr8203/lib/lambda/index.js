// Lambda function for image processing
// Note: Node.js 18+ requires AWS SDK v3
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require('@aws-sdk/client-s3');
const { XRayClient } = require('@aws-sdk/client-xray');

// Initialize AWS SDK v3 clients
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Get environment variables (Optimization Point 6)
const IMAGE_BUCKET = process.env.IMAGE_BUCKET;
const IMAGE_QUALITY = parseInt(process.env.IMAGE_QUALITY || '80');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760');
const ENVIRONMENT = process.env.ENVIRONMENT || 'dev';

/**
 * Lambda handler for image processing
 * Addresses Optimization Point 3: Proper error handling for S3 bucket permissions
 */
exports.handler = async (event, context) => {
  console.log('Image processor invoked', {
    environment: ENVIRONMENT,
    imageQuality: IMAGE_QUALITY,
    maxFileSize: MAX_FILE_SIZE,
    eventRecords: event.Records?.length || 0,
  });

  // Optimization Point 3: Error handling for missing configuration
  if (!IMAGE_BUCKET) {
    console.error('ERROR: IMAGE_BUCKET environment variable not set');
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Configuration error: IMAGE_BUCKET not set',
      }),
    };
  }

  try {
    // Process each S3 event record
    const results = await Promise.all(
      event.Records.map(async record => {
        try {
          const bucket = record.s3.bucket.name;
          const key = decodeURIComponent(
            record.s3.object.key.replace(/\+/g, ' ')
          );
          const size = record.s3.object.size;

          console.log(`Processing image: ${key} (${size} bytes)`);

          // Optimization Point 6: Check file size against MAX_FILE_SIZE
          if (size > MAX_FILE_SIZE) {
            console.warn(
              `File ${key} exceeds maximum size (${size} > ${MAX_FILE_SIZE})`
            );
            return {
              key,
              status: 'skipped',
              reason: 'File size exceeds limit',
            };
          }

          // Optimization Point 3: Error handling for S3 GetObject with specific error messages
          let imageData;
          try {
            const getCommand = new GetObjectCommand({
              Bucket: bucket,
              Key: key,
            });
            const response = await s3Client.send(getCommand);
            imageData = await streamToBuffer(response.Body);
          } catch (error) {
            if (error.name === 'AccessDenied') {
              console.error(
                `AccessDenied error for ${key}: Check IAM permissions and bucket policy`
              );
              throw new Error(
                `S3 Access Denied: Insufficient permissions to read ${key}`
              );
            }
            throw error;
          }

          // Simulate image processing (in real implementation, use Sharp or similar library)
          console.log(`Processing image with quality: ${IMAGE_QUALITY}%`);
          const processedImage = await processImage(imageData, IMAGE_QUALITY);

          // Optimization Point 3: Error handling for S3 PutObject
          const outputKey = key.replace('uploads/', 'processed/');
          try {
            const putCommand = new PutObjectCommand({
              Bucket: bucket,
              Key: outputKey,
              Body: processedImage,
              ContentType: getContentType(key),
              Metadata: {
                'processed-at': new Date().toISOString(),
                environment: ENVIRONMENT,
                quality: IMAGE_QUALITY.toString(),
              },
            });
            await s3Client.send(putCommand);
          } catch (error) {
            if (error.name === 'AccessDenied') {
              console.error(
                `AccessDenied error writing ${outputKey}: Check IAM permissions`
              );
              throw new Error(
                `S3 Access Denied: Insufficient permissions to write ${outputKey}`
              );
            }
            throw error;
          }

          console.log(`Successfully processed ${key} -> ${outputKey}`);
          return {
            key,
            outputKey,
            status: 'success',
            originalSize: size,
            processedSize: processedImage.length,
          };
        } catch (error) {
          console.error(
            `Error processing image ${record.s3.object.key}:`,
            error
          );
          return {
            key: record.s3.object.key,
            status: 'error',
            error: error.message,
          };
        }
      })
    );

    console.log('Processing complete', { results });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Image processing complete',
        results,
      }),
    };
  } catch (error) {
    console.error('Lambda execution error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal processing error',
        message: error.message,
      }),
    };
  }
};

/**
 * Convert stream to buffer
 */
async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Simulate image processing
 * In a real implementation, use Sharp library for actual image processing
 */
async function processImage(imageBuffer, quality) {
  // Simulate processing delay (Optimization Point 2: 30 second timeout allows this)
  await new Promise(resolve => setTimeout(resolve, 100));

  // In production, use Sharp:
  // const sharp = require('sharp');
  // return await sharp(imageBuffer)
  //   .resize(800, 600, { fit: 'inside' })
  //   .jpeg({ quality })
  //   .toBuffer();

  return imageBuffer; // Return original for simulation
}

/**
 * Get content type from file extension
 */
function getContentType(key) {
  const ext = key.toLowerCase().split('.').pop();
  const contentTypes = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  return contentTypes[ext] || 'application/octet-stream';
}
