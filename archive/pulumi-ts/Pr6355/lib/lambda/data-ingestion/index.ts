import {
  S3Event,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const sqs = new SQSClient({});
const dynamodb = new DynamoDBClient({});

const QUEUE_URL = process.env.QUEUE_URL!;
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (
  event: S3Event | APIGatewayProxyEvent
): Promise<APIGatewayProxyResult | void> => {
  console.log('[INFO] DataIngestion Lambda invoked', JSON.stringify(event));

  try {
    // Check if this is an S3 event or API Gateway event
    if ('Records' in event && event.Records[0]?.eventSource === 'aws:s3') {
      // S3 Event handling
      const s3Event = event as S3Event;

      for (const record of s3Event.Records) {
        const bucket = record.s3.bucket.name;
        const key = decodeURIComponent(
          record.s3.object.key.replace(/\+/g, ' ')
        );

        console.log(`[INFO] Processing S3 object: ${bucket}/${key}`);

        // Extract symbol from file key (assuming format: symbol/timestamp.json)
        const symbol = key.split('/')[0] || 'UNKNOWN';
        const timestamp = Date.now();

        // Store metadata in DynamoDB
        await dynamodb.send(
          new PutItemCommand({
            TableName: TABLE_NAME,
            Item: {
              symbol: { S: symbol },
              timestamp: { N: timestamp.toString() },
              s3Bucket: { S: bucket },
              s3Key: { S: key },
              status: { S: 'ingested' },
            },
          })
        );

        // Send message to SQS for processing
        await sqs.send(
          new SendMessageCommand({
            QueueUrl: QUEUE_URL,
            MessageBody: JSON.stringify({
              bucket,
              key,
              symbol,
              timestamp,
            }),
          })
        );

        console.log(`[INFO] Successfully processed S3 object: ${key}`);
      }

      return;
    } else {
      // API Gateway event handling
      const apiEvent = event as APIGatewayProxyEvent;

      if (!apiEvent.body) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Request body is required' }),
        };
      }

      const data = JSON.parse(apiEvent.body);
      const symbol = data.symbol || 'UNKNOWN';
      const timestamp = Date.now();

      console.log(`[INFO] Processing API request for symbol: ${symbol}`);

      // Store in DynamoDB
      await dynamodb.send(
        new PutItemCommand({
          TableName: TABLE_NAME,
          Item: {
            symbol: { S: symbol },
            timestamp: { N: timestamp.toString() },
            data: { S: JSON.stringify(data) },
            status: { S: 'ingested' },
          },
        })
      );

      // Send to SQS for processing
      await sqs.send(
        new SendMessageCommand({
          QueueUrl: QUEUE_URL,
          MessageBody: JSON.stringify({
            symbol,
            timestamp,
            data,
          }),
        })
      );

      console.log(
        `[INFO] Successfully processed API request for symbol: ${symbol}`
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Data ingested successfully',
          symbol,
          timestamp,
        }),
      };
    }
  } catch (error) {
    console.error('[ERROR] Error processing event:', error);

    if ('httpMethod' in event) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal server error' }),
      };
    }

    throw error;
  }
};
