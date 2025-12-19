/**
 * Webhook Validator Lambda Function
 *
 * This function validates incoming webhook signatures and stores payment events in DynamoDB.
 * It uses X-Ray for distributed tracing and follows AWS best practices.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

// Initialize DynamoDB client
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME;

/**
 * Validates webhook signature using HMAC-SHA256
 * In production, this would use a real secret from AWS Secrets Manager
 */
function validateSignature(payload, signature, secret = 'webhook-secret-key') {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const calculatedSignature = hmac.digest('hex');
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(calculatedSignature)
    );
}

/**
 * Lambda handler function
 */
exports.handler = async (event) => {
    console.log('Received webhook event:', JSON.stringify(event, null, 2));

    try {
        // Parse request body
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

        // Extract signature from headers
        const signature = event.headers?.['X-Webhook-Signature'] || event.headers?.['x-webhook-signature'];

        if (!signature) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing webhook signature' }),
            };
        }

        // Validate signature
        const isValid = validateSignature(event.body, signature);

        if (!isValid) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Invalid webhook signature' }),
            };
        }

        // Extract payment data
        const { paymentId, amount, currency, status, provider } = body;

        if (!paymentId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required field: paymentId' }),
            };
        }

        // Store payment event in DynamoDB
        const timestamp = Date.now();
        const params = {
            TableName: TABLE_NAME,
            Item: {
                paymentId,
                timestamp,
                amount: amount || 0,
                currency: currency || 'USD',
                status: status || 'pending',
                provider: provider || 'unknown',
                receivedAt: new Date().toISOString(),
                rawPayload: JSON.stringify(body),
            },
        };

        await ddbDocClient.send(new PutCommand(params));

        console.log(`Successfully stored payment event: ${paymentId}`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Webhook processed successfully',
                paymentId,
                timestamp,
            }),
        };
    } catch (error) {
        console.error('Error processing webhook:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message,
            }),
        };
    }
};
