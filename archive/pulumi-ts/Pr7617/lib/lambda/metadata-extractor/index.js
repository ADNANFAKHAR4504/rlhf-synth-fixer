/**
 * Metadata Extractor Lambda Function
 *
 * Extracts metadata from images in S3.
 * Optimized for ARM64 architecture with Node.js 20.x runtime.
 */

const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

exports.handler = async (event) => {
  console.log('Metadata Extractor - Event received:', JSON.stringify(event, null, 2));

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

    console.log(`Extracting metadata for: ${sourceKey}`);
    console.log(`Input bucket: ${inputBucket}, Output bucket: ${outputBucket}`);

    // In a real implementation, this would:
    // 1. Get the image from S3
    // 2. Extract EXIF and other metadata
    // 3. Store metadata in output bucket or database

    // Placeholder metadata extraction
    const metadata = {
      sourceKey: sourceKey,
      format: 'jpeg',
      width: 1920,
      height: 1080,
      size: 524288,
      created: new Date().toISOString(),
      camera: 'Placeholder Camera',
      location: 'Unknown',
    };

    const metadataKey = `metadata/${sourceKey}.json`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Metadata extracted successfully',
        sourceKey: sourceKey,
        metadataKey: metadataKey,
        metadata: metadata,
        inputBucket: inputBucket,
        outputBucket: outputBucket,
        architecture: 'arm64',
        memorySize: '256MB',
      }),
    };
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to extract metadata', details: error.message }),
    };
  }
};
