const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const dynamodbClient = new DynamoDBClient({ region: 'us-east-1' });
const sqsClient = new SQSClient({ region: 'us-east-1' });
const snsClient = new SNSClient({ region: 'us-east-1' });

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

exports.handler = async (event) => {
  console.log('Processing transaction:', JSON.stringify(event));

  try {
    const body = JSON.parse(event.body);
    const transactionId = body.transaction_id || generateTransactionId();
    const timestamp = Date.now();

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
