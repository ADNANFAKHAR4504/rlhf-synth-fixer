const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const TRANSACTIONS_TABLE = process.env.TRANSACTIONS_TABLE;
const LOGS_BUCKET = process.env.LOGS_BUCKET;
const RECEIPTS_BUCKET = process.env.RECEIPTS_BUCKET;
const ENVIRONMENT = process.env.ENVIRONMENT;

exports.handler = async (event) => {
  console.log('Payment processing request received:', JSON.stringify(event));

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { customerId, amount, currency, paymentMethod } = body;

    // Validate required fields
    if (!customerId || !amount || !currency || !paymentMethod) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required fields: customerId, amount, currency, paymentMethod',
        }),
      };
    }

    // Generate transaction ID and timestamp
    const transactionId = `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();
    const transactionDate = new Date(timestamp).toISOString().split('T')[0];

    // Create transaction record
    const transaction = {
      transactionId,
      timestamp,
      customerId,
      transactionDate,
      amount,
      currency,
      paymentMethod,
      status: 'completed',
      environment: ENVIRONMENT,
      processedAt: new Date(timestamp).toISOString(),
    };

    // Store transaction in DynamoDB
    await dynamodb
      .put({
        TableName: TRANSACTIONS_TABLE,
        Item: transaction,
      })
      .promise();

    console.log('Transaction stored in DynamoDB:', transactionId);

    // Store transaction log in S3
    const logKey = `${transactionDate}/${transactionId}.json`;
    await s3
      .putObject({
        Bucket: LOGS_BUCKET,
        Key: logKey,
        Body: JSON.stringify(transaction, null, 2),
        ContentType: 'application/json',
      })
      .promise();

    console.log('Transaction log stored in S3:', logKey);

    // Generate and store receipt
    const receipt = {
      transactionId,
      customerId,
      amount,
      currency,
      timestamp: new Date(timestamp).toISOString(),
      status: 'completed',
      receiptNumber: `REC-${transactionId}`,
    };

    const receiptKey = `receipts/${customerId}/${transactionId}.json`;
    await s3
      .putObject({
        Bucket: RECEIPTS_BUCKET,
        Key: receiptKey,
        Body: JSON.stringify(receipt, null, 2),
        ContentType: 'application/json',
      })
      .promise();

    console.log('Receipt stored in S3:', receiptKey);

    // Return success response
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        transactionId,
        receiptNumber: receipt.receiptNumber,
        status: 'completed',
        message: 'Payment processed successfully',
      }),
    };
  } catch (error) {
    console.error('Error processing payment:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};
