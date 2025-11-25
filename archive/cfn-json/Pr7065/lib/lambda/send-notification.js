const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const snsClient = new SNSClient({});

exports.handler = async (event) => {
  console.log('Processing SNS notification:', JSON.stringify(event, null, 2));

  try {
    for (const record of event.Records) {
      const message = JSON.parse(record.Sns.Message);
      const { userId, symbol, price, threshold, condition } = message;

      const smsMessage = `CRYPTO ALERT: ${symbol} is now $${price.toFixed(2)}, which is ${condition} your threshold of $${threshold}`;

      console.log(`Would send SMS to user ${userId}: ${smsMessage}`);

      // In production, you would send SMS here using SNS Publish with phone number
      // const params = {
      //   Message: smsMessage,
      //   PhoneNumber: userPhoneNumber
      // };
      // await snsClient.send(new PublishCommand(params));
    }

    return { statusCode: 200 };
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};
