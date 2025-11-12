const AWS = require('@aws-sdk/client-s3');
const { S3Client, PutObjectCommand } = AWS;

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

exports.handler = async (event) => {
  console.log('Processing payment:', JSON.stringify(event));

  const transactionId = `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const bucket = process.env.S3_BUCKET;

  try {
    // Validate required environment variables
    if (!bucket) {
      throw new Error('S3_BUCKET environment variable not set');
    }

    // Log transaction to S3
    const logData = {
      transactionId,
      timestamp: new Date().toISOString(),
      event: event,
      status: 'processed',
    };

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: `transactions/${transactionId}.json`,
      Body: JSON.stringify(logData, null, 2),
      ContentType: 'application/json',
    });

    await s3Client.send(command);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Payment processed successfully',
        transactionId,
      }),
    };
  } catch (error) {
    console.error('Error processing payment:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Payment processing failed',
        error: error.message,
      }),
    };
  }
};
