const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const sns = new SNSClient({ region: process.env.REGION });
const snsTopicArn = process.env.SNS_TOPIC_ARN;

exports.handler = async (event) => {
    console.log('Received SQS event:', JSON.stringify(event, null, 2));

    try {
        for (const record of event.Records) {
            const message = JSON.parse(record.body);

            const notificationMessage = {
                transactionId: message.transactionId,
                fraudStatus: message.fraudStatus,
                fraudScore: message.fraudScore,
                fraudReason: message.fraudReason || [],
                amount: message.amount,
                merchantId: message.merchantId,
                timestamp: message.timestamp,
            };

            const params = {
                TopicArn: snsTopicArn,
                Subject: `Transaction ${message.fraudStatus.toUpperCase()}: ${message.transactionId}`,
                Message: JSON.stringify(notificationMessage, null, 2),
                MessageAttributes: {
                    transactionId: {
                        DataType: 'String',
                        StringValue: message.transactionId,
                    },
                    fraudStatus: {
                        DataType: 'String',
                        StringValue: message.fraudStatus,
                    },
                },
            };

            await sns.send(new PublishCommand(params));

            console.log(`Notification sent for transaction ${message.transactionId}`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Notifications sent' }),
        };
    } catch (error) {
        console.error('Error sending notification:', error);
        throw error;
    }
};