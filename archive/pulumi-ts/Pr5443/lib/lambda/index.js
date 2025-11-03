
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    console.log('Received webhook event:', JSON.stringify(event));

    try {
        // Parse the incoming webhook payload
        const body = JSON.parse(event.body);

        // Validate required fields
        if (!body.source || !body.data) {
            console.error('Missing required fields: source or data');
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: 'Invalid payload: missing required fields (source, data)'
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            };
        }

        // Generate eventId and timestamp
        const eventId = `${body.source}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const timestamp = Date.now();

        // Store in DynamoDB
        const putCommand = new PutItemCommand({
            TableName: process.env.DYNAMODB_TABLE,
            Item: {
                eventId: { S: eventId },
                timestamp: { N: timestamp.toString() },
                source: { S: body.source },
                data: { S: JSON.stringify(body.data) },
                receivedAt: { S: new Date().toISOString() },
                rawPayload: { S: event.body },
            },
        });

        await dynamoClient.send(putCommand);

        console.log(`Successfully stored webhook event: ${eventId}`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                eventId: eventId,
                timestamp: timestamp,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        };

    } catch (error) {
        console.error('Error processing webhook:', error);

        // Publish failure notification to SNS
        try {
            await snsClient.send(new PublishCommand({
                TopicArn: process.env.SNS_TOPIC_ARN,
                Subject: 'Webhook Processing Failure',
                Message: JSON.stringify({
                    error: error.message,
                    event: event,
                    timestamp: new Date().toISOString(),
                }),
            }));
        } catch (snsError) {
            console.error('Failed to send SNS notification:', snsError);
        }

        // Throw error to trigger DLQ
        throw error;
    }
};
