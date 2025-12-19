"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_sns_1 = require("@aws-sdk/client-sns");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new client_sns_1.SNSClient({});
const TABLE_NAME = process.env.TABLE_NAME;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    try {
        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing request body' }),
            };
        }
        const body = JSON.parse(event.body);
        const { shipmentId, status, location, customerId, customerEmail } = body;
        if (!shipmentId || !status) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'Missing required fields: shipmentId, status',
                }),
            };
        }
        const timestamp = new Date().toISOString();
        // Store shipment update in DynamoDB
        await docClient.send(new lib_dynamodb_1.PutCommand({
            TableName: TABLE_NAME,
            Item: {
                shipmentId,
                timestamp,
                status,
                location: location || 'Unknown',
                customerId: customerId || '',
                customerEmail: customerEmail || '',
                updatedAt: timestamp,
            },
        }));
        // Publish notification to SNS
        const message = {
            shipmentId,
            status,
            location: location || 'Unknown',
            timestamp,
            customerId: customerId || '',
            customerEmail: customerEmail || '',
        };
        await snsClient.send(new client_sns_1.PublishCommand({
            TopicArn: SNS_TOPIC_ARN,
            Message: JSON.stringify(message),
            Subject: `Shipment ${shipmentId} Status Update`,
        }));
        console.log('Successfully processed shipment update:', shipmentId);
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Shipment status updated successfully',
                shipmentId,
                status,
                timestamp,
            }),
        };
    }
    catch (error) {
        console.error('Error processing shipment update:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
            }),
        };
    }
};
exports.handler = handler;
