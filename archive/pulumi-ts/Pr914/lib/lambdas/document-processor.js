/**
 * document-processor.js
 *
 * AWS Lambda function for processing document requests and storing them securely in S3.
 * Uses AWS SDK v3 for all AWS service interactions.
 */
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

/**
 * Secure Document Processing Lambda Function
 *
 * This function processes document uploads and stores them securely in S3
 * using AWS managed encryption (AES-256) for simplicity and cost efficiency.
 */

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

exports.handler = async event => {
  const requestId = event.requestContext?.requestId || 'unknown';
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] Processing request ${requestId}`);

  try {
    // Validate environment variables
    const bucketName = process.env.BUCKET_NAME;

    if (!bucketName) {
      throw new Error('Missing required environment variable: BUCKET_NAME');
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'x-request-id': requestId,
        },
        body: JSON.stringify({
          error: 'Invalid JSON in request body',
          requestId,
        }),
      };
    }

    // Validate required fields
    const { documentName, documentContent, documentType } = requestBody;

    if (!documentName || !documentContent || !documentType) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'x-request-id': requestId,
        },
        body: JSON.stringify({
          error:
            'Missing required fields: documentName, documentContent, documentType',
          requestId,
        }),
      };
    }

    // Generate unique filename
    const filename = `${timestamp}-${requestId}-${documentName}`;

    console.log(`[${timestamp}] Storing document: ${filename}`);

    // Store document in S3 with AWS managed encryption
    const putObjectCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: `documents/${filename}`,
      Body: documentContent,
      ContentType: documentType,
      Metadata: {
        'request-id': requestId,
        'upload-timestamp': timestamp,
        'original-filename': documentName,
      },
      // AWS managed encryption (AES-256) is applied automatically
      // No need to specify ServerSideEncryption or SSEKMSKeyId
    });

    const s3Result = await s3Client.send(putObjectCommand);

    console.log(`[${timestamp}] Document stored successfully:`, {
      filename,
      etag: s3Result.ETag,
      requestId,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': requestId,
      },
      body: JSON.stringify({
        message: 'Document processed and stored successfully',
        filename,
        etag: s3Result.ETag,
        requestId,
        timestamp,
      }),
    };
  } catch (error) {
    console.error(
      `[${timestamp}] Error processing request ${requestId}:`,
      error
    );

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': requestId,
      },
      body: JSON.stringify({
        error: 'Internal server error',
        requestId,
        timestamp,
      }),
    };
  }
};
