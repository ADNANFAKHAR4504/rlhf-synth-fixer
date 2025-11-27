import { ScheduledEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import * as AWSXRay from 'aws-xray-sdk-core';

// Wrap AWS SDK clients with X-Ray
const ddbClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({}));
const sqsClient = AWSXRay.captureAWSv3Client(new SQSClient({}));
const docClient = DynamoDBDocumentClient.from(ddbClient);

const PATTERNS_TABLE_NAME = process.env.PATTERNS_TABLE_NAME!;
const ALERT_QUEUE_URL = process.env.ALERT_QUEUE_URL!;
const PRICE_THRESHOLD = parseFloat(process.env.PRICE_THRESHOLD || '100');
const VOLUME_THRESHOLD = parseFloat(process.env.VOLUME_THRESHOLD || '10000');
const VOLATILITY_THRESHOLD = parseFloat(
  process.env.VOLATILITY_THRESHOLD || '0.05'
);

interface PatternRecord {
  patternId: string;
  timestamp: number;
  symbol: string;
  price: number;
  volume: number;
  patternType: string;
  confidence: number;
}

export const handler = async (event: ScheduledEvent): Promise<void> => {
  console.log('Threshold check triggered:', JSON.stringify(event, null, 2));

  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('threshold-check');

  try {
    // Scan recent patterns (last 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    const result = await docClient.send(
      new ScanCommand({
        TableName: PATTERNS_TABLE_NAME,
        FilterExpression: '#ts > :timestamp',
        ExpressionAttributeNames: {
          '#ts': 'timestamp',
        },
        ExpressionAttributeValues: {
          ':timestamp': fiveMinutesAgo,
        },
      })
    );

    const patterns = (result.Items || []) as PatternRecord[];

    subsegment?.addMetadata('patternsFound', patterns.length);

    // Check thresholds
    const violations = patterns.filter(pattern => {
      return (
        pattern.price > PRICE_THRESHOLD ||
        pattern.volume > VOLUME_THRESHOLD ||
        calculateVolatility(pattern) > VOLATILITY_THRESHOLD
      );
    });

    subsegment?.addMetadata('violations', violations.length);

    // Send alerts for threshold violations
    for (const violation of violations) {
      await sendThresholdAlert(violation, subsegment);
    }

    console.log(
      `Threshold check complete. Found ${violations.length} violations.`
    );

    subsegment?.close();
  } catch (error) {
    console.error('Error during threshold check:', error);
    subsegment?.addError(error as Error);
    subsegment?.close();
    throw error;
  }
};

async function sendThresholdAlert(
  pattern: PatternRecord,
  parentSubsegment: AWSXRay.Subsegment | undefined
): Promise<void> {
  const alertSubsegment = parentSubsegment?.addNewSubsegment(
    'send-threshold-alert'
  );

  try {
    const alertMessage = {
      alertType: 'threshold-violation',
      patternId: pattern.patternId,
      symbol: pattern.symbol,
      patternType: pattern.patternType,
      confidence: pattern.confidence,
      price: pattern.price,
      volume: pattern.volume,
      timestamp: pattern.timestamp,
      thresholds: {
        price: PRICE_THRESHOLD,
        volume: VOLUME_THRESHOLD,
        volatility: VOLATILITY_THRESHOLD,
      },
      violations: {
        priceExceeded: pattern.price > PRICE_THRESHOLD,
        volumeExceeded: pattern.volume > VOLUME_THRESHOLD,
        volatilityExceeded: calculateVolatility(pattern) > VOLATILITY_THRESHOLD,
      },
    };

    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: ALERT_QUEUE_URL,
        MessageBody: JSON.stringify(alertMessage),
      })
    );

    alertSubsegment?.addMetadata('alert', alertMessage);
    alertSubsegment?.close();

    console.log('Threshold alert sent for pattern', pattern.patternId);
  } catch (error) {
    console.error('Error sending threshold alert:', error);
    alertSubsegment?.addError(error as Error);
    alertSubsegment?.close();
    throw error;
  }
}

function calculateVolatility(pattern: PatternRecord): number {
  // Simplified volatility calculation
  // In a real system, this would analyze historical price data
  const basePrice = 100;
  const priceDiff = Math.abs(pattern.price - basePrice);
  return priceDiff / basePrice;
}
