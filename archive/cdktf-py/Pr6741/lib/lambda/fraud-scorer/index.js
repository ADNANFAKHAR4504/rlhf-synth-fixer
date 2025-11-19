const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const AWSXRay = require('aws-xray-sdk-core');

// Create clients with X-Ray tracing
const ddbClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({}));
const docClient = DynamoDBDocumentClient.from(ddbClient);
const snsClient = AWSXRay.captureAWSv3Client(new SNSClient({}));

exports.handler = async (event) => {
    console.log('Scoring transaction:', JSON.stringify(event, null, 2));

    const fraudScoresTable = process.env.FRAUD_SCORES_TABLE;
    const snsTopicArn = process.env.SNS_TOPIC_ARN;

    try {
        const { transaction_id, timestamp, amount, merchant } = event;

        // Simple fraud scoring logic (in real world, this would be ML-based)
        const fraudScore = calculateFraudScore(amount, merchant);

        // Store fraud score in DynamoDB
        const expiryTime = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days

        const putCommand = new PutCommand({
            TableName: fraudScoresTable,
            Item: {
                transaction_id: transaction_id,
                fraud_score: fraudScore,
                timestamp: parseInt(timestamp),
                merchant: merchant,
                amount: parseFloat(amount),
                expiry: expiryTime
            }
        });

        await docClient.send(putCommand);
        console.log(`Stored fraud score ${fraudScore} for transaction ${transaction_id}`);

        // Send alert if fraud score exceeds threshold
        if (fraudScore > 0.8) {
            const publishCommand = new PublishCommand({
                TopicArn: snsTopicArn,
                Subject: 'Fraud Alert',
                Message: JSON.stringify({
                    transaction_id: transaction_id,
                    fraud_score: fraudScore,
                    amount: amount,
                    merchant: merchant,
                    timestamp: timestamp
                }, null, 2)
            });

            await snsClient.send(publishCommand);
            console.log(`Sent fraud alert for transaction ${transaction_id}`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                transaction_id: transaction_id,
                fraud_score: fraudScore
            })
        };
    } catch (error) {
        console.error('Error scoring transaction:', error);
        throw error;
    }
};

function calculateFraudScore(amount, merchant) {
    // Simple heuristic for demo purposes
    let score = 0.0;

    // High amounts are suspicious
    const amountValue = parseFloat(amount);
    if (amountValue > 10000) {
        score += 0.5;
    } else if (amountValue > 5000) {
        score += 0.3;
    }

    // Certain merchants are higher risk
    const highRiskMerchants = ['unknown', 'offshore', 'crypto'];
    if (highRiskMerchants.some(term => merchant.toLowerCase().includes(term))) {
        score += 0.4;
    }

    return Math.min(score, 1.0);
}