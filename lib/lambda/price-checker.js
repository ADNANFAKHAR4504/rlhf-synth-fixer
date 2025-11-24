const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();
const AWSXRay = require('aws-xray-sdk-core');

exports.handler = async (event) => {
    console.log('Starting price check...');

    const segment = AWSXRay.getSegment();
    const subsegment = segment.addNewSubsegment('CheckPrices');

    try {
        // Scan all active alerts
        const scanParams = {
            TableName: process.env.ALERTS_TABLE_NAME,
            FilterExpression: '#status = :active',
            ExpressionAttributeNames: {
                '#status': 'status',
            },
            ExpressionAttributeValues: {
                ':active': 'active',
            },
        };

        const result = await dynamodb.scan(scanParams).promise();
        subsegment.addAnnotation('alertCount', result.Items.length);

        // Check each alert
        for (const alert of result.Items) {
            // Simulate price check (in production, would call real API)
            const currentPrice = Math.random() * 100000;

            if (currentPrice >= alert.targetPrice) {
                // Send SMS notification
                const message = `Alert: ${alert.cryptocurrency} has reached your target price of $${alert.targetPrice}. Current price: $${currentPrice.toFixed(2)}`;

                await sns.publish({
                    TopicArn: process.env.ALERT_TOPIC_ARN,
                    Message: message,
                    Subject: 'Crypto Price Alert Triggered',
                }).promise();

                console.log(`Alert triggered for user ${alert.userId}: ${alert.cryptocurrency}`);
            }
        }

        subsegment.close();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Checked ${result.Items.length} alerts` }),
        };
    } catch (error) {
        console.error('Error checking prices:', error);
        subsegment.addError(error);
        subsegment.close();
        throw error;
    }
};
