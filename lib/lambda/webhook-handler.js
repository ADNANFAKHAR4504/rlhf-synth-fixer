const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize clients with region configuration
const client = new DynamoDBClient({ 
    region: process.env.AWS_REGION || 'us-east-1' 
});
const dynamodb = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
    console.log('Received webhook event:', JSON.stringify(event));

    try {
        // Parse webhook payload
        const body = JSON.parse(event.body || '{}');
        const { userId, alertId, cryptocurrency, targetPrice, currentPrice } = body;

        // Validate required fields
        if (!userId || !alertId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields' }),
            };
        }

        // Store or update alert in DynamoDB
        const params = {
            TableName: process.env.ALERTS_TABLE_NAME,
            Item: {
                userId,
                alertId,
                cryptocurrency: cryptocurrency || 'UNKNOWN',
                targetPrice: targetPrice || 0,
                currentPrice: currentPrice || 0,
                timestamp: new Date().toISOString(),
                status: 'active',
            },
        };

        await dynamodb.send(new PutCommand(params));

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Webhook processed successfully' }),
        };
    } catch (error) {
        console.error('Error processing webhook:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
};