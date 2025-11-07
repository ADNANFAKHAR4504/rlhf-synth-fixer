const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const secretsManager = new SecretsManagerClient();
const s3Client = new S3Client();
const sqsClient = new SQSClient();

exports.handler = async (event) => {
  console.log('Payment validation request:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { amount, currency, customerId, description } = body;

    // Validate payment data
    if (!amount || amount <= 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Invalid amount',
          message: 'Amount must be greater than 0',
        }),
      };
    }

    if (!currency || !/^[A-Z]{3}$/.test(currency)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Invalid currency',
          message: 'Currency must be a 3-letter ISO code',
        }),
      };
    }

    if (!customerId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Invalid customer',
          message: 'Customer ID is required',
        }),
      };
    }

    // Generate payment ID
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const timestamp = new Date().toISOString();

    // Create transaction record
    const transaction = {
      paymentId,
      amount,
      currency,
      customerId,
      description: description || 'Payment processing',
      status: 'validated',
      timestamp,
      environment: process.env.ENVIRONMENT,
    };

    // Store transaction in S3
    const s3Key = `transactions/${timestamp.split('T')[0]}/${paymentId}.json`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.TRANSACTION_BUCKET,
        Key: s3Key,
        Body: JSON.stringify(transaction, null, 2),
        ContentType: 'application/json',
      })
    );

    console.log(`Transaction stored in S3: ${s3Key}`);

    // Send message to SQS for async processing
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: process.env.PAYMENT_QUEUE_URL,
        MessageBody: JSON.stringify(transaction),
        MessageAttributes: {
          PaymentId: {
            DataType: 'String',
            StringValue: paymentId,
          },
          CustomerId: {
            DataType: 'String',
            StringValue: customerId,
          },
        },
      })
    );

    console.log(`Payment message sent to queue: ${paymentId}`);

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        paymentId,
        status: 'validated',
        message: 'Payment validation successful',
        transaction,
      }),
    };
  } catch (error) {
    console.error('Payment validation error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'Payment validation failed',
        details: error.message,
      }),
    };
  }
};
