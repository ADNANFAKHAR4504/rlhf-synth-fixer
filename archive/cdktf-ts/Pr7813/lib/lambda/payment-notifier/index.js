const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);
const sns = new SNSClient({});

const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;
const ENVIRONMENT = process.env.ENVIRONMENT;

exports.handler = async (event) => {
  console.log('Payment Notifier - Event received:', JSON.stringify(event, null, 2));

  try {
    // Parse event records (from DynamoDB Stream or direct invocation)
    const records = event.Records || [event];

    for (const record of records) {
      let notificationData;

      // Handle DynamoDB Stream events
      if (record.dynamodb) {
        console.log('Processing DynamoDB Stream record');
        notificationData = unmarshall(record.dynamodb.NewImage || {});
      } else {
        // Handle direct invocation
        notificationData = typeof record.body === 'string' ? JSON.parse(record.body) : record;
      }

      console.log('Notification data:', JSON.stringify(notificationData, null, 2));

      // Retrieve full transaction details if only ID is provided
      let transactionDetails = notificationData;

      if (notificationData.transactionId && !notificationData.amount) {
        console.log('Fetching transaction details from DynamoDB:', notificationData.transactionId);

        const result = await dynamodb.send(new QueryCommand({
          TableName: DYNAMODB_TABLE,
          KeyConditionExpression: 'transactionId = :tid',
          ExpressionAttributeValues: {
            ':tid': notificationData.transactionId,
          },
          Limit: 1,
          ScanIndexForward: false,
        }));

        if (result.Items && result.Items.length > 0) {
          transactionDetails = result.Items[0];
          console.log('Transaction details retrieved:', JSON.stringify(transactionDetails, null, 2));
        }
      }

      // Generate notification message
      const notificationMessage = generateNotificationMessage(transactionDetails);

      // Send notification via SNS
      await sns.send(new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Subject: notificationMessage.subject,
        Message: notificationMessage.body,
        MessageAttributes: {
          transactionId: {
            DataType: 'String',
            StringValue: transactionDetails.transactionId || 'unknown',
          },
          status: {
            DataType: 'String',
            StringValue: transactionDetails.status || 'unknown',
          },
          environment: {
            DataType: 'String',
            StringValue: ENVIRONMENT,
          },
        },
      }));

      console.log('Notification sent successfully for transaction:', transactionDetails.transactionId);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Notifications sent successfully',
        recordsProcessed: records.length,
      }),
    };

  } catch (error) {
    console.error('Error in payment notifier:', error);
    console.error('Error stack:', error.stack);

    // Send error notification
    try {
      await sns.send(new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Subject: 'Payment Notification Error',
        Message: `Error occurred while sending payment notifications: ${error.message}\n\nEnvironment: ${ENVIRONMENT}\nTimestamp: ${new Date().toISOString()}`,
      }));
    } catch (snsError) {
      console.error('Failed to send error notification:', snsError);
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Notification sending failed',
        error: error.message,
      }),
    };
  }
};

function generateNotificationMessage(transaction) {
  const transactionId = transaction.transactionId || 'Unknown';
  const status = transaction.status || 'unknown';
  const amount = transaction.amount || 0;
  const currency = transaction.currency || 'USD';
  const timestamp = transaction.timestamp ? new Date(transaction.timestamp).toISOString() : new Date().toISOString();

  let subject = '';
  let body = '';

  switch (status) {
    case 'validated':
      subject = `Payment Validation Successful - ${transactionId}`;
      body = `Payment Validation Notification\n\n` +
        `Transaction ID: ${transactionId}\n` +
        `Status: Validated\n` +
        `Amount: ${amount} ${currency}\n` +
        `Timestamp: ${timestamp}\n\n` +
        `The payment has been validated and is ready for processing.`;
      break;

    case 'processed':
      subject = `Payment Processed Successfully - ${transactionId}`;
      body = `Payment Processing Notification\n\n` +
        `Transaction ID: ${transactionId}\n` +
        `Status: Processed\n` +
        `Amount: ${amount} ${currency}\n` +
        `Timestamp: ${timestamp}\n\n` +
        `The payment has been processed successfully.`;
      break;

    case 'failed':
      subject = `Payment Processing Failed - ${transactionId}`;
      body = `Payment Failure Notification\n\n` +
        `Transaction ID: ${transactionId}\n` +
        `Status: Failed\n` +
        `Amount: ${amount} ${currency}\n` +
        `Timestamp: ${timestamp}\n\n` +
        `The payment processing has failed. Please review the transaction details.`;
      break;

    default:
      subject = `Payment Status Update - ${transactionId}`;
      body = `Payment Notification\n\n` +
        `Transaction ID: ${transactionId}\n` +
        `Status: ${status}\n` +
        `Amount: ${amount} ${currency}\n` +
        `Timestamp: ${timestamp}\n\n` +
        `A status update has been recorded for this transaction.`;
  }

  return { subject, body };
}
