const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const sqsClient = new SQSClient({});
const dynamoClient = new DynamoDBClient({});

exports.handler = async (event) => {
  console.log('Validator received event:', JSON.stringify(event));

  const results = [];

  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.Sns.Message);
      console.log('Validating transaction:', message);

      // Validate transaction
      const validationResult = validateTransaction(message);

      if (validationResult.valid) {
        // Store in DynamoDB
        const ttl = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days

        await dynamoClient.send(new PutItemCommand({
          TableName: process.env.TRANSACTION_TABLE,
          Item: {
            transactionId: { S: message.transactionId },
            status: { S: 'validated' },
            transaction: { S: JSON.stringify(message) },
            validatedAt: { S: new Date().toISOString() },
            ttl: { N: ttl.toString() },
          },
        }));

        // Send to validation queue
        await sqsClient.send(new SendMessageCommand({
          QueueUrl: process.env.VALIDATION_QUEUE_URL,
          MessageBody: JSON.stringify({
            ...message,
            validationStatus: 'valid',
            validatedAt: new Date().toISOString(),
          }),
        }));

        results.push({ transactionId: message.transactionId, status: 'validated' });
      } else {
        console.error('Invalid transaction:', validationResult.errors);
        results.push({ transactionId: message.transactionId, status: 'invalid', errors: validationResult.errors });
      }
    } catch (error) {
      console.error('Error validating transaction:', error);
      throw error; // Let Lambda retry mechanism handle it
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ results }),
  };
};

function validateTransaction(transaction) {
  const errors = [];

  if (!transaction.transactionId) {
    errors.push('Missing transactionId');
  }

  if (!transaction.amount || typeof transaction.amount !== 'number') {
    errors.push('Invalid or missing amount');
  }

  if (!transaction.currency) {
    errors.push('Missing currency');
  }

  if (!transaction.customerId) {
    errors.push('Missing customerId');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
