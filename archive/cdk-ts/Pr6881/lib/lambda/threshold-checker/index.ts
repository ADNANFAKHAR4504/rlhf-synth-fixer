import { ScheduledEvent } from 'aws-lambda';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { unmarshall } from '@aws-sdk/util-dynamodb';
// eslint-disable-next-line import/no-extraneous-dependencies
import * as AWSXRay from 'aws-xray-sdk-core';

const dynamoClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({}));
const sqsClient = AWSXRay.captureAWSv3Client(new SQSClient({}));

const TABLE_NAME = process.env.TABLE_NAME!;
const QUEUE_URL = process.env.QUEUE_URL!;
const THRESHOLD_PERCENTAGE = parseFloat(
  process.env.THRESHOLD_PERCENTAGE || '5'
);
const THRESHOLD_VOLUME = parseInt(process.env.THRESHOLD_VOLUME || '10000');
const THRESHOLD_PRICE = parseFloat(process.env.THRESHOLD_PRICE || '100');

interface PatternRecord {
  patternId: string;
  timestamp: number;
  symbol: string;
  price: number;
  volume: number;
  pattern: string;
}

export const handler = async (event: ScheduledEvent): Promise<void> => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('ThresholdCheckerLogic');

  try {
    console.log('Starting threshold check', {
      event,
      thresholds: {
        percentage: THRESHOLD_PERCENTAGE,
        volume: THRESHOLD_VOLUME,
        price: THRESHOLD_PRICE,
      },
    });

    // Scan recent patterns (last 10 minutes)
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: '#ts > :timeThreshold',
      ExpressionAttributeNames: {
        '#ts': 'timestamp',
      },
      ExpressionAttributeValues: {
        ':timeThreshold': { N: tenMinutesAgo.toString() },
      },
    });

    const result = await dynamoClient.send(scanCommand);

    if (!result.Items || result.Items.length === 0) {
      console.log('No recent patterns found');
      subsegment?.close();
      return;
    }

    const patterns: PatternRecord[] = result.Items.map(
      item => unmarshall(item) as PatternRecord
    );
    console.log('Found patterns', { count: patterns.length });

    // Check thresholds and send alerts
    const alertPromises = patterns
      .filter(pattern => exceedsThresholds(pattern))
      .map(pattern => sendThresholdAlert(pattern));

    await Promise.all(alertPromises);

    console.log('Threshold check completed', {
      alertsSent: alertPromises.length,
    });
    subsegment?.close();
  } catch (error) {
    console.error('Error checking thresholds', { error });
    subsegment?.addError(error as Error);
    subsegment?.close();
    throw error;
  }
};

function exceedsThresholds(pattern: PatternRecord): boolean {
  const volumeExceeded = pattern.volume > THRESHOLD_VOLUME;
  const priceExceeded = pattern.price > THRESHOLD_PRICE;

  // Check if price change percentage is significant (simple check)
  const priceSignificant =
    pattern.price > THRESHOLD_PRICE * (1 + THRESHOLD_PERCENTAGE / 100);

  return volumeExceeded || priceExceeded || priceSignificant;
}

async function sendThresholdAlert(pattern: PatternRecord): Promise<void> {
  const thresholdType =
    pattern.volume > THRESHOLD_VOLUME
      ? 'volume'
      : pattern.price > THRESHOLD_PRICE
        ? 'price'
        : 'percentage';

  const messageCommand = new SendMessageCommand({
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify({
      patternId: pattern.patternId,
      symbol: pattern.symbol,
      pattern: pattern.pattern,
      price: pattern.price,
      volume: pattern.volume,
      alertType: 'threshold',
      threshold: `${thresholdType} exceeded`,
    }),
  });

  await sqsClient.send(messageCommand);
  console.log('Threshold alert sent', {
    patternId: pattern.patternId,
    thresholdType,
  });
}
