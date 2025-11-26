const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

// Initialize clients with region configuration
const dynamoClient = new DynamoDBClient({ 
    region: process.env.AWS_REGION || 'us-east-1' 
});
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);
const sns = new SNSClient({ 
    region: process.env.AWS_REGION || 'us-east-1' 
});

exports.handler = async (event) => {
    console.log('Starting price check...');

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

        const result = await dynamodb.send(new ScanCommand(scanParams));
        const items = result.Items || [];

        // Check each alert
        for (const alert of items) {
            // Simulate price check (in production, would call real API)
            const currentPrice = Math.random() * 100000;

            if (currentPrice >= alert.targetPrice) {
                // Send SMS notification
                const message = `Alert: ${alert.cryptocurrency} has reached your target price of $${alert.targetPrice}. Current price: $${currentPrice.toFixed(2)}`;

                await sns.send(new PublishCommand({
                    TopicArn: process.env.ALERT_TOPIC_ARN,
                    Message: message,
                    Subject: 'Crypto Price Alert Triggered',
                }));

                console.log(`Alert triggered for user ${alert.userId}: ${alert.cryptocurrency}`);
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Checked ${items.length} alerts` }),
        };
    } catch (error) {
        console.error('Error checking prices:', error);
        
        // Don't throw the error, return error response
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
};