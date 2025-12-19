import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({});

const TABLE_NAME = process.env.TABLE_NAME!;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
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
    await docClient.send(
      new PutCommand({
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
      })
    );

    // Publish notification to SNS
    const message = {
      shipmentId,
      status,
      location: location || 'Unknown',
      timestamp,
      customerId: customerId || '',
      customerEmail: customerEmail || '',
    };

    await snsClient.send(
      new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Message: JSON.stringify(message),
        Subject: `Shipment ${shipmentId} Status Update`,
      })
    );

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
  } catch (error) {
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
