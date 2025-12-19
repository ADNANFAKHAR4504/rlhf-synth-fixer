const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

const sqsClient = new SQSClient({});
const dynamoClient = new DynamoDBClient({});

exports.handler = async (event) => {
  console.log('Routing received event:', JSON.stringify(event));

  for (const record of event.Records) {
    try {
      const transaction = JSON.parse(record.body);
      console.log('Routing transaction:', transaction);

      // Determine target queue based on amount
      let targetQueueUrl;
      let valueCategory;

      if (transaction.amount > 10000) {
        targetQueueUrl = process.env.HIGH_VALUE_QUEUE_URL;
        valueCategory = 'high';
      } else if (transaction.amount >= 1000) {
        targetQueueUrl = process.env.STANDARD_VALUE_QUEUE_URL;
        valueCategory = 'standard';
      } else {
        targetQueueUrl = process.env.LOW_VALUE_QUEUE_URL;
        valueCategory = 'low';
      }

      // Add routing metadata
      const routedTransaction = {
        ...transaction,
        valueCategory,
        routedAt: new Date().toISOString(),
      };

      // Update DynamoDB
      await dynamoClient.send(new UpdateItemCommand({
        TableName: process.env.TRANSACTION_TABLE,
        Key: {
          transactionId: { S: transaction.transactionId },
        },
        UpdateExpression: 'SET #status = :status, valueCategory = :category, routedAt = :routedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': { S: 'routed' },
          ':category': { S: valueCategory },
          ':routedAt': { S: new Date().toISOString() },
        },
      }));

      // Send to appropriate value queue
      await sqsClient.send(new SendMessageCommand({
        QueueUrl: targetQueueUrl,
        MessageBody: JSON.stringify(routedTransaction),
      }));

      console.log(`Transaction routed to ${valueCategory} queue:`, transaction.transactionId);
    } catch (error) {
      console.error('Error routing transaction:', error);
      throw error;
    }
  }

  return { statusCode: 200 };
};
