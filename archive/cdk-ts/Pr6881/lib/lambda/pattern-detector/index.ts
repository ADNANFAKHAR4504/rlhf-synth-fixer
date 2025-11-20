import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { marshall } from '@aws-sdk/util-dynamodb';
// eslint-disable-next-line import/no-extraneous-dependencies
import * as AWSXRay from 'aws-xray-sdk-core';

const dynamoClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({}));
const sqsClient = AWSXRay.captureAWSv3Client(new SQSClient({}));

const TABLE_NAME = process.env.TABLE_NAME!;
const QUEUE_URL = process.env.QUEUE_URL!;

interface PatternData {
  symbol: string;
  price: number;
  volume: number;
  pattern: string;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('PatternDetectorLogic');

  try {
    console.log('Processing pattern detection request', { event });

    if (event.httpMethod === 'GET') {
      subsegment?.close();
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: 'Pattern detector is running' }),
      };
    }

    if (!event.body) {
      subsegment?.close();
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const patternData: PatternData = JSON.parse(event.body);
    const patternId = `${patternData.symbol}-${Date.now()}`;
    const timestamp = Date.now();

    // Store pattern in DynamoDB
    const putCommand = new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall({
        patternId,
        timestamp,
        symbol: patternData.symbol,
        price: patternData.price,
        volume: patternData.volume,
        pattern: patternData.pattern,
        detectedAt: new Date().toISOString(),
      }),
    });

    await dynamoClient.send(putCommand);
    console.log('Pattern stored in DynamoDB', { patternId });

    // Check if pattern requires immediate alert
    if (shouldTriggerAlert(patternData)) {
      const messageCommand = new SendMessageCommand({
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify({
          patternId,
          symbol: patternData.symbol,
          pattern: patternData.pattern,
          price: patternData.price,
          volume: patternData.volume,
          alertType: 'immediate',
        }),
      });

      await sqsClient.send(messageCommand);
      console.log('Alert sent to queue', { patternId });
    }

    subsegment?.close();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Pattern processed successfully',
        patternId,
        timestamp,
      }),
    };
  } catch (error) {
    console.error('Error processing pattern', { error });
    subsegment?.addError(error as Error);
    subsegment?.close();

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to process pattern',
        message: (error as Error).message,
      }),
    };
  }
};

function shouldTriggerAlert(data: PatternData): boolean {
  // Simple logic to determine if immediate alert is needed
  const highVolumeThreshold = 50000;
  const significantPatterns = [
    'head-and-shoulders',
    'double-top',
    'double-bottom',
  ];

  return (
    data.volume > highVolumeThreshold ||
    significantPatterns.includes(data.pattern.toLowerCase())
  );
}
