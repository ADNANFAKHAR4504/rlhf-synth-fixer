const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();
const s3 = new AWS.S3();
const sqs = new AWS.SQS();

exports.handler = async (event) => {
  console.log('Processing API request:', JSON.stringify(event, null, 2));

  try {
    // Validate input
    if (!event.body) {
      throw new Error('Request body is required');
    }

    const requestData = JSON.parse(event.body);
    if (!requestData.orderId || !requestData.customerId) {
      throw new Error('orderId and customerId are required');
    }

    // Retrieve database secret for potential future DB operations
    const secretName = process.env.DATABASE_SECRET_NAME;
    const secret = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
    console.log('Successfully retrieved database credentials for order processing');

    // Store order data in S3 for persistence
    const s3Key = `orders/${requestData.orderId}.json`;
    await s3.putObject({
      Bucket: process.env.S3_BUCKET,
      Key: s3Key,
      Body: JSON.stringify(requestData),
      ContentType: 'application/json'
    }).promise();
    console.log('Order data stored in S3:', s3Key);

    // Send order to SQS for asynchronous processing (e.g., payment, fulfillment)
    const queueUrl = process.env.SQS_QUEUE_URL;
    await sqs.sendMessage({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify({
        orderId: requestData.orderId,
        customerId: requestData.customerId,
        timestamp: new Date().toISOString(),
        action: 'process_order'
      }),
    }).promise();
    console.log('Order queued for processing');

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Order received and queued for processing',
        orderId: requestData.orderId,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Error processing order:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Failed to process order',
        details: error.message,
      }),
    };
  }
};
