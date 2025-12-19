const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const dynamodbClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const sqsClient = new SQSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    // Validate required fields and input
    const validationError = validateTransactionInput(body);
    if (validationError) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'Invalid transaction input',
          error: validationError,
        }),
      };
    }

    const transactionId = body.transaction_id || generateTransactionId();
    const timestamp = Date.now();

    // Log only non-sensitive transaction details
    console.log('Processing transaction:', JSON.stringify({
      transaction_id: transactionId,
      amount: body.amount,
      merchant_id: body.merchant_id,
      // Do not log: full card numbers, CVV, cardholder names, etc.
    }));

    // Store transaction in DynamoDB
    const putItemParams = {
      TableName: DYNAMODB_TABLE,
      Item: {
        transaction_id: { S: transactionId },
        timestamp: { N: timestamp.toString() },
        amount: { N: body.amount?.toString() || '0' },
        status: { S: 'pending' },
        card_last_four: { S: body.card_last_four || 'XXXX' },
        merchant_id: { S: body.merchant_id || 'unknown' },
      },
    };

    await dynamodbClient.send(new PutItemCommand(putItemParams));
    console.log(`Transaction ${transactionId} stored in DynamoDB`);

    // Send message to SQS for async processing
    const sqsParams = {
      QueueUrl: SQS_QUEUE_URL,
      MessageBody: JSON.stringify({
        transaction_id: transactionId,
        timestamp: timestamp,
        amount: body.amount,
      }),
      MessageGroupId: 'payment-processing',
      MessageDeduplicationId: `${transactionId}-${timestamp}`,
    };

    await sqsClient.send(new SendMessageCommand(sqsParams));
    console.log(`Transaction ${transactionId} sent to SQS`);

    // Send notification via SNS
    const snsParams = {
      TopicArn: SNS_TOPIC_ARN,
      Subject: 'New Payment Transaction',
      Message: `Transaction ${transactionId} received for processing. Amount: $${body.amount}`,
    };

    await snsClient.send(new PublishCommand(snsParams));
    console.log(`Notification sent for transaction ${transactionId}`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
      },
      body: JSON.stringify({
        message: 'Transaction processed successfully',
        transaction_id: transactionId,
        status: 'pending',
      }),
    };
  } catch (error) {
    console.error('Error processing transaction:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Error processing transaction',
        error: error.message,
      }),
    };
  }
};

function generateTransactionId() {
  return `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function validateTransactionInput(body) {
  // Check required fields
  if (!body.amount) {
    return 'Missing required field: amount';
  }

  if (!body.merchant_id) {
    return 'Missing required field: merchant_id';
  }

  // Validate amount is a positive number
  const amount = parseFloat(body.amount);
  if (isNaN(amount) || amount <= 0) {
    return 'Invalid amount: must be a positive number';
  }

  // Validate amount is reasonable (not too large)
  if (amount > 1000000) {
    return 'Invalid amount: exceeds maximum transaction limit';
  }

  // Validate card_last_four if provided
  if (body.card_last_four) {
    const cardLastFour = body.card_last_four.toString();
    if (!/^\d{4}$/.test(cardLastFour)) {
      return 'Invalid card_last_four: must be exactly 4 digits';
    }
  }

  // Validate merchant_id format
  if (typeof body.merchant_id !== 'string' || body.merchant_id.trim().length === 0) {
    return 'Invalid merchant_id: must be a non-empty string';
  }

  // All validations passed
  return null;
}
