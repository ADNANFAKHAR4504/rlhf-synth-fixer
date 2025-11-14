const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const sqs = new SQSClient({ region: process.env.REGION });
const queueUrl = process.env.QUEUE_URL;

exports.handler = async (event) => {
    console.log('Received DynamoDB Stream event:', JSON.stringify(event, null, 2));

    try {
        for (const record of event.Records) {
            if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
                const newImage = record.dynamodb.NewImage;

                const transactionId = newImage.transactionId.S;
                const amount = parseFloat(newImage.amount.N);
                const merchantId = newImage.merchantId.S;

                // Simple fraud detection logic
                let fraudScore = 0;
                let fraudReason = [];

                // Check for high-value transactions
                if (amount > 10000) {
                    fraudScore += 50;
                    fraudReason.push('High value transaction');
                }

                // Check for suspicious amounts (e.g., round numbers)
                if (amount % 1000 === 0 && amount > 1000) {
                    fraudScore += 30;
                    fraudReason.push('Suspicious round amount');
                }

                const fraudStatus = fraudScore > 50 ? 'flagged' : 'approved';

                // Send to SQS FIFO queue
                const messageParams = {
                    QueueUrl: queueUrl,
                    MessageBody: JSON.stringify({
                        transactionId: transactionId,
                        fraudStatus: fraudStatus,
                        fraudScore: fraudScore,
                        fraudReason: fraudReason,
                        amount: amount,
                        merchantId: merchantId,
                        timestamp: Date.now(),
                    }),
                    MessageGroupId: merchantId,
                    MessageDeduplicationId: `${transactionId}-${Date.now()}`,
                };

                await sqs.send(new SendMessageCommand(messageParams));

                console.log(`Fraud detection completed for transaction ${transactionId}:`, {
                    status: fraudStatus,
                    score: fraudScore,
                });
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Fraud detection completed' }),
        };
    } catch (error) {
        console.error('Error in fraud detection:', error);
        throw error;
    }
};