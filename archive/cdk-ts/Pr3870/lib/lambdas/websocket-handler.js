"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
const CONNECTIONS_TABLE_NAME = process.env.CONNECTIONS_TABLE_NAME;
const handler = async (event) => {
    console.log('WebSocket event:', JSON.stringify(event, null, 2));
    const connectionId = event.requestContext.connectionId;
    const routeKey = event.requestContext.routeKey;
    try {
        switch (routeKey) {
            case '$connect':
                await handleConnect(connectionId);
                break;
            case '$disconnect':
                await handleDisconnect(connectionId);
                break;
            case '$default':
                await handleDefault(connectionId, event.body);
                break;
            default:
                console.log('Unknown route:', routeKey);
        }
        return {
            statusCode: 200,
            body: 'Success',
        };
    }
    catch (error) {
        console.error('Error handling WebSocket event:', error);
        return {
            statusCode: 500,
            body: 'Failed to process request',
        };
    }
};
exports.handler = handler;
async function handleConnect(connectionId) {
    console.log('Client connected:', connectionId);
    const ttl = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
    await docClient.send(new lib_dynamodb_1.PutCommand({
        TableName: CONNECTIONS_TABLE_NAME,
        Item: {
            connectionId,
            connectedAt: new Date().toISOString(),
            ttl,
        },
    }));
    console.log('Connection stored:', connectionId);
}
async function handleDisconnect(connectionId) {
    console.log('Client disconnected:', connectionId);
    await docClient.send(new lib_dynamodb_1.DeleteCommand({
        TableName: CONNECTIONS_TABLE_NAME,
        Key: {
            connectionId,
        },
    }));
    console.log('Connection removed:', connectionId);
}
async function handleDefault(connectionId, body) {
    console.log('Default route called:', connectionId, body);
    // Handle custom messages if needed
    if (body) {
        const message = JSON.parse(body);
        console.log('Received message:', message);
        // You can add custom logic here to handle different message types
    }
}
