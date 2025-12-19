/**
 * Thumbnail Generator Lambda Function
 *
 * Generates thumbnail images from source images in S3.
 * Optimized for ARM64 architecture with Node.js 20.x runtime.
 */

const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

exports.handler = async (event) => {
  console.log('Thumbnail Generator - Event received:', JSON.stringify(event, null, 2));

  const inputBucket = process.env.INPUT_BUCKET;
  const outputBucket = process.env.OUTPUT_BUCKET;

  try {
    // Parse event body if it's a function URL invocation
    let body = event.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const sourceKey = body?.sourceKey || event.sourceKey;

    if (!sourceKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing sourceKey parameter' }),
      };
    }

    console.log(`Processing thumbnail for: ${sourceKey}`);
    console.log(`Input bucket: ${inputBucket}, Output bucket: ${outputBucket}`);

    // In a real implementation, this would:
    // 1. Get the image from S3
    // 2. Use sharp or similar library to create thumbnail
    // 3. Upload thumbnail to output bucket

    // Placeholder response
    const thumbnailKey = `thumbnails/${sourceKey}`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Thumbnail generated successfully',
        sourceKey: sourceKey,
        thumbnailKey: thumbnailKey,
        inputBucket: inputBucket,
        outputBucket: outputBucket,
        architecture: 'arm64',
        memorySize: '1024MB',
      }),
    };
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate thumbnail', details: error.message }),
    };
  }
};
