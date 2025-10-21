const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const snsClient = new SNSClient({});

exports.handler = async (event) => {
  const topicArn = process.env.SNS_TOPIC_ARN;

  for (const record of event.Records) {
    try {
      if (record.eventName === 'INSERT' && record.dynamodb && record.dynamodb.NewImage) {
        const newImage = unmarshall(record.dynamodb.NewImage);

        const transactionId = newImage.transactionId;
        const vendorId = newImage.vendorId;
        const amount = newImage.amount;
        const currency = newImage.currency;
        const timestamp = newImage.timestamp;

        // Publish notification to SNS
        const message = {
          transactionId,
          vendorId,
          amount,
          currency,
          timestamp,
          message: `New sale for vendor ${vendorId}: ${amount} ${currency}`,
          notificationTime: new Date().toISOString(),
        };

        const publishCommand = new PublishCommand({
          TopicArn: topicArn,
          Message: JSON.stringify(message, null, 2),
          Subject: `New Sale Notification - Transaction ${transactionId}`,
          MessageAttributes: {
            vendorId: {
              DataType: 'String',
              StringValue: vendorId || 'unknown',
            },
            transactionId: {
              DataType: 'String',
              StringValue: transactionId,
            },
            amount: {
              DataType: 'Number',
              StringValue: amount?.toString() || '0',
            },
          },
        });

        await snsClient.send(publishCommand);
        console.log(`Successfully sent notification for transaction ${transactionId} to vendor ${vendorId}`);
      }
    } catch (error) {
      console.error('Error sending vendor notification:', error);
      throw error;
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Vendor notifications sent successfully' }),
  };
};
