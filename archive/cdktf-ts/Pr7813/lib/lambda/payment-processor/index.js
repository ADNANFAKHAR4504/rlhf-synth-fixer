const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const dynamoClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);
const s3 = new S3Client({});
const sns = new SNSClient({});

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;
const S3_BUCKET = process.env.S3_BUCKET;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const ENVIRONMENT = process.env.ENVIRONMENT;

exports.handler = async (event) => {
  console.log('Payment Processor - Event received:', JSON.stringify(event, null, 2));

  try {
    // Parse event data
    const records = event.Records || [event];

    for (const record of records) {
      const transactionData = typeof record.body === 'string' ? JSON.parse(record.body) : record;

      console.log('Processing transaction:', JSON.stringify(transactionData, null, 2));

      const transactionId = transactionData.transactionId || generateTransactionId();
      const timestamp = Date.now();

      // Simulate payment processing
      const processingResult = await processPayment(transactionData);

      console.log(`Payment processing ${processingResult.success ? 'succeeded' : 'failed'} for transaction: ${transactionId}`);

      // Update transaction in DynamoDB
      await dynamodb.send(new PutCommand({
        TableName: DYNAMODB_TABLE,
        Item: {
          transactionId,
          timestamp,
          status: processingResult.success ? 'processed' : 'failed',
          amount: transactionData.amount,
          currency: transactionData.currency || 'USD',
          paymentMethod: transactionData.paymentMethod,
          processingResult: processingResult.message,
          environment: ENVIRONMENT,
          processedAt: new Date().toISOString(),
        },
      }));

      console.log('Transaction record updated in DynamoDB:', transactionId);

      // Create audit log in S3
      const auditLog = {
        transactionId,
        timestamp,
        event: 'payment_processed',
        status: processingResult.success ? 'success' : 'failure',
        details: processingResult,
        environment: ENVIRONMENT,
        processedAt: new Date().toISOString(),
      };

      const s3Key = `audit-logs/${new Date().toISOString().split('T')[0]}/${transactionId}.json`;

      await s3.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
        Body: JSON.stringify(auditLog, null, 2),
        ContentType: 'application/json',
        ServerSideEncryption: 'AES256',
      }));

      console.log('Audit log written to S3:', s3Key);

      // Send processing notification
      await sns.send(new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Subject: `Payment ${processingResult.success ? 'Processed' : 'Failed'}`,
        Message: `Transaction ${transactionId} has been ${processingResult.success ? 'processed successfully' : 'failed'}\nAmount: ${transactionData.amount} ${transactionData.currency || 'USD'}\nStatus: ${processingResult.message}`,
      }));

      console.log('SNS notification sent for transaction:', transactionId);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Payment processing completed',
        recordsProcessed: records.length,
      }),
    };

  } catch (error) {
    console.error('Error in payment processor:', error);
    console.error('Error stack:', error.stack);

    // Send error notification
    try {
      await sns.send(new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Subject: 'Payment Processing Error',
        Message: `Error occurred during payment processing: ${error.message}`,
      }));
    } catch (snsError) {
      console.error('Failed to send error notification:', snsError);
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Payment processing failed',
        error: error.message,
      }),
    };
  }
};

async function processPayment(transaction) {
  // Simulate payment processing logic
  console.log('Simulating payment processing for:', transaction.transactionId || 'new transaction');

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Simulate 95% success rate
  const isSuccessful = Math.random() > 0.05;

  if (!isSuccessful) {
    return {
      success: false,
      message: 'Payment gateway declined the transaction',
      errorCode: 'DECLINED',
    };
  }

  // Simulate different processing outcomes
  const outcomes = [
    { success: true, message: 'Payment processed successfully', code: 'SUCCESS' },
    { success: true, message: 'Payment authorized and captured', code: 'CAPTURED' },
    { success: true, message: 'Payment pending bank confirmation', code: 'PENDING' },
  ];

  return outcomes[Math.floor(Math.random() * outcomes.length)];
}

function generateTransactionId() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `TXN-${timestamp}-${randomStr}`.toUpperCase();
}
