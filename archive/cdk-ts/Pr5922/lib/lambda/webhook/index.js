const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const snsClient = new SNSClient({});

exports.handler = async (event) => {
  console.log('Received webhook event:', JSON.stringify(event));

  try {
    // Parse the incoming transaction
    const transaction = JSON.parse(event.body || '{}');

    // Add timestamp
    transaction.receivedAt = new Date().toISOString();
    transaction.transactionId = transaction.transactionId || `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Publish to SNS topic
    const command = new PublishCommand({
      TopicArn: process.env.TOPIC_ARN,
      Message: JSON.stringify(transaction),
      Subject: 'New Transaction',
    });

    const response = await snsClient.send(command);
    console.log('Published to SNS:', response.MessageId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Transaction received',
        transactionId: transaction.transactionId,
        messageId: response.MessageId,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process transaction',
        message: error.message,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }
};
