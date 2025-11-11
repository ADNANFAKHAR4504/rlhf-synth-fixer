const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { randomUUID } = require('crypto');

const sqs = new SQSClient({ region: process.env.AWS_REGION || 'us-east-1' });

exports.handler = async (event) => {
    try {
        const correlationId = randomUUID();
        const provider = event.pathParameters?.provider || 'unknown';
        
        let payload;
        try {
            payload = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        } catch (parseError) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Invalid JSON payload', correlationId })
            };
        }
        
        const message = {
            correlationId,
            provider,
            payload,
            timestamp: new Date().toISOString(),
            headers: event.headers || {}
        };
        
        await sqs.send(new SendMessageCommand({
            QueueUrl: process.env.QUEUE_URL,
            MessageBody: JSON.stringify(message),
            MessageAttributes: {
                'provider': { DataType: 'String', StringValue: provider },
                'correlationId': { DataType: 'String', StringValue: correlationId }
            }
        }));
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ message: 'Webhook received', correlationId })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error', correlationId: randomUUID() })
        };
    }
};
