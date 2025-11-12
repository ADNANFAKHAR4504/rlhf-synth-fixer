/**
 * payment-processor Lambda function
 *
 * Processes payment transactions, stores them in DynamoDB,
 * and creates audit logs in S3.
 */
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const dynamoClient = new DynamoDBClient({ region: 'ap-southeast-1' });
const s3Client = new S3Client({ region: 'ap-southeast-1' });

const tableName = process.env.DYNAMO_TABLE_NAME;
const bucketName = process.env.AUDIT_BUCKET_NAME;

/**
 * Process payment transaction
 */
async function processPayment(payment) {
  const timestamp = Date.now();

  // Store transaction in DynamoDB
  const putCommand = new PutItemCommand({
    TableName: tableName,
    Item: {
      transactionId: { S: payment.transactionId },
      timestamp: { N: timestamp.toString() },
      amount: { N: payment.amount.toString() },
      currency: { S: payment.currency },
      customerEmail: { S: payment.customerEmail },
      status: { S: 'PROCESSED' },
      processedAt: { S: new Date(timestamp).toISOString() },
    },
  });

  await dynamoClient.send(putCommand);

  // Create audit log in S3
  const auditLog = {
    transactionId: payment.transactionId,
    timestamp,
    amount: payment.amount,
    currency: payment.currency,
    customerEmail: payment.customerEmail,
    status: 'PROCESSED',
    processedAt: new Date(timestamp).toISOString(),
  };

  const s3Key = `audit-logs/${new Date(timestamp).toISOString().split('T')[0]}/${payment.transactionId}.json`;

  const putObjectCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
    Body: JSON.stringify(auditLog, null, 2),
    ContentType: 'application/json',
    ServerSideEncryption: 'AES256',
  });

  await s3Client.send(putObjectCommand);

  return {
    transactionId: payment.transactionId,
    timestamp,
    status: 'PROCESSED',
    auditLogLocation: `s3://${bucketName}/${s3Key}`,
  };
}

/**
 * Lambda handler
 */
exports.handler = async (event) => {
  console.log('Received payment processing request:', JSON.stringify(event, null, 2));

  try {
    // Parse payment data
    const payment = typeof event === 'string' ? JSON.parse(event) : event;

    // Process the payment
    const result = await processPayment(payment);

    console.log('Payment processed successfully:', result);

    return {
      success: true,
      message: 'Payment processed successfully',
      ...result,
    };

  } catch (error) {
    console.error('Error processing payment:', error);

    return {
      success: false,
      message: 'Payment processing failed',
      error: error.message,
    };
  }
};
