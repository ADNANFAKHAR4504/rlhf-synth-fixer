const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const AWSXRay = require('aws-xray-sdk-core');

exports.handler = async (event) => {
    console.log('Received webhook event:', JSON.stringify(event));

    // Create custom X-Ray subsegment
    const segment = AWSXRay.getSegment();
    const subsegment = segment.addNewSubsegment('ProcessWebhook');

    try {
        // Parse webhook payload
        const body = JSON.parse(event.body || '{}');
        const { userId, alertId, cryptocurrency, targetPrice, currentPrice } = body;

        subsegment.addAnnotation('userId', userId);
        subsegment.addAnnotation('cryptocurrency', cryptocurrency);

        // Store or update alert in DynamoDB
        const params = {
            TableName: process.env.ALERTS_TABLE_NAME,
            Item: {
                userId,
                alertId,
                cryptocurrency,
                targetPrice,
                currentPrice,
                timestamp: new Date().toISOString(),
                status: 'active',
            },
        };

        await dynamodb.put(params).promise();

        subsegment.close();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Webhook processed successfully' }),
        };
    } catch (error) {
        console.error('Error processing webhook:', error);
        subsegment.addError(error);
        subsegment.close();

        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
};
