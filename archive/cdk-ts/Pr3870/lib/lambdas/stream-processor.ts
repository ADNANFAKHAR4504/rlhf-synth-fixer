import { DynamoDBStreamEvent, DynamoDBRecord } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { AttributeValue } from '@aws-sdk/client-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const WEBSOCKET_API_ENDPOINT = process.env.WEBSOCKET_API_ENDPOINT!;
const CONNECTIONS_TABLE_NAME = process.env.CONNECTIONS_TABLE_NAME!;

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  console.log(
    'Processing DynamoDB stream event:',
    JSON.stringify(event, null, 2)
  );

  const apiGwClient = new ApiGatewayManagementApiClient({
    endpoint: `https://${WEBSOCKET_API_ENDPOINT}`,
  });

  for (const record of event.Records) {
    try {
      await processRecord(record, apiGwClient);
    } catch (error) {
      console.error('Error processing record:', error);
      throw error; // Throw to trigger retry or failure destination
    }
  }
};

async function processRecord(
  record: DynamoDBRecord,
  apiGwClient: ApiGatewayManagementApiClient
): Promise<void> {
  if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
    if (!record.dynamodb?.NewImage) {
      console.log('No new image in record, skipping');
      return;
    }

    const newImage = unmarshall(
      record.dynamodb.NewImage as Record<string, AttributeValue>
    );
    const shipmentId = newImage.shipmentId;

    console.log('Processing shipment update:', shipmentId);

    // Query all active WebSocket connections
    const connections = await getActiveConnections();

    console.log(`Found ${connections.length} active connections`);

    // Send update to all connected clients
    const postPromises = connections.map(async connection => {
      try {
        await apiGwClient.send(
          new PostToConnectionCommand({
            ConnectionId: connection.connectionId,
            Data: Buffer.from(
              JSON.stringify({
                type: 'shipment-update',
                data: newImage,
              })
            ),
          })
        );
        console.log(`Sent update to connection: ${connection.connectionId}`);
      } catch (error: any) {
        if (error.statusCode === 410) {
          console.log(`Stale connection: ${connection.connectionId}`);
          // Could delete stale connection here
        } else {
          console.error(
            `Error sending to connection ${connection.connectionId}:`,
            error
          );
        }
      }
    });

    await Promise.all(postPromises);
  }
}

async function getActiveConnections(): Promise<any[]> {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: CONNECTIONS_TABLE_NAME,
        IndexName: undefined, // Scan all connections
        Limit: 100,
      })
    );

    return result.Items || [];
  } catch (error) {
    console.error('Error querying connections:', error);
    return [];
  }
}
