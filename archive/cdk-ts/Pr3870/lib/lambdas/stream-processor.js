"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_apigatewaymanagementapi_1 = require("@aws-sdk/client-apigatewaymanagementapi");
const util_dynamodb_1 = require("@aws-sdk/util-dynamodb");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
const WEBSOCKET_API_ENDPOINT = process.env.WEBSOCKET_API_ENDPOINT;
const CONNECTIONS_TABLE_NAME = process.env.CONNECTIONS_TABLE_NAME;
const handler = async (event) => {
    console.log('Processing DynamoDB stream event:', JSON.stringify(event, null, 2));
    const apiGwClient = new client_apigatewaymanagementapi_1.ApiGatewayManagementApiClient({
        endpoint: `https://${WEBSOCKET_API_ENDPOINT}`,
    });
    for (const record of event.Records) {
        try {
            await processRecord(record, apiGwClient);
        }
        catch (error) {
            console.error('Error processing record:', error);
            throw error; // Throw to trigger retry or failure destination
        }
    }
};
exports.handler = handler;
async function processRecord(record, apiGwClient) {
    if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
        if (!record.dynamodb?.NewImage) {
            console.log('No new image in record, skipping');
            return;
        }
        const newImage = (0, util_dynamodb_1.unmarshall)(record.dynamodb.NewImage);
        const shipmentId = newImage.shipmentId;
        console.log('Processing shipment update:', shipmentId);
        // Query all active WebSocket connections
        const connections = await getActiveConnections();
        console.log(`Found ${connections.length} active connections`);
        // Send update to all connected clients
        const postPromises = connections.map(async (connection) => {
            try {
                await apiGwClient.send(new client_apigatewaymanagementapi_1.PostToConnectionCommand({
                    ConnectionId: connection.connectionId,
                    Data: Buffer.from(JSON.stringify({
                        type: 'shipment-update',
                        data: newImage,
                    })),
                }));
                console.log(`Sent update to connection: ${connection.connectionId}`);
            }
            catch (error) {
                if (error.statusCode === 410) {
                    console.log(`Stale connection: ${connection.connectionId}`);
                    // Could delete stale connection here
                }
                else {
                    console.error(`Error sending to connection ${connection.connectionId}:`, error);
                }
            }
        });
        await Promise.all(postPromises);
    }
}
async function getActiveConnections() {
    try {
        const result = await docClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: CONNECTIONS_TABLE_NAME,
            IndexName: undefined, // Scan all connections
            Limit: 100,
        }));
        return result.Items || [];
    }
    catch (error) {
        console.error('Error querying connections:', error);
        return [];
    }
}
