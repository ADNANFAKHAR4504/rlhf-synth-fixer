import { SQSEvent, SQSRecord } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import * as AWSXRay from 'aws-xray-sdk-core';

// Wrap AWS SDK clients with X-Ray
const snsClient = AWSXRay.captureAWSv3Client(new SNSClient({}));
const ddbClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({}));
const docClient = DynamoDBDocumentClient.from(ddbClient);

const ALERTS_TOPIC_ARN = process.env.ALERTS_TOPIC_ARN!;
const PATTERNS_TABLE_NAME = process.env.PATTERNS_TABLE_NAME!;

interface AlertMessage {
  patternId: string;
  symbol: string;
  patternType: string;
  confidence: number;
  price: number;
  volume: number;
  timestamp: number;
}

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log('Processing alerts:', JSON.stringify(event, null, 2));

  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('alert-processing');

  try {
    const promises = event.Records.map(record =>
      processAlert(record, subsegment)
    );
    await Promise.all(promises);

    subsegment?.close();
  } catch (error) {
    console.error('Error processing alerts:', error);
    subsegment?.addError(error as Error);
    subsegment?.close();
    throw error;
  }
};

async function processAlert(
  record: SQSRecord,
  parentSubsegment: AWSXRay.Subsegment | undefined
): Promise<void> {
  const processSubsegment = parentSubsegment?.addNewSubsegment(
    'process-single-alert'
  );

  try {
    const alertData: AlertMessage = JSON.parse(record.body);

    // Fetch additional pattern details from DynamoDB
    const patternDetails = await docClient.send(
      new GetCommand({
        TableName: PATTERNS_TABLE_NAME,
        Key: {
          patternId: alertData.patternId,
          timestamp: alertData.timestamp,
        },
      })
    );

    // Determine alert severity
    const severity = determineAlertSeverity(alertData);

    // Construct alert message
    const alertMessage = constructAlertMessage(
      alertData,
      patternDetails.Item,
      severity
    );

    // Publish to SNS topic
    await snsClient.send(
      new PublishCommand({
        TopicArn: ALERTS_TOPIC_ARN,
        Subject: `[${severity}] Trading Pattern Alert: ${alertData.symbol}`,
        Message: alertMessage,
        MessageAttributes: {
          severity: {
            DataType: 'String',
            StringValue: severity,
          },
          symbol: {
            DataType: 'String',
            StringValue: alertData.symbol,
          },
          patternType: {
            DataType: 'String',
            StringValue: alertData.patternType,
          },
        },
      })
    );

    processSubsegment?.addAnnotation('alertProcessed', 'success');
    processSubsegment?.addMetadata('alertData', alertData);

    console.log(
      `Alert processed successfully for pattern ${alertData.patternId}`
    );

    processSubsegment?.close();
  } catch (error) {
    console.error(
      `Error processing alert for record ${record.messageId}:`,
      error
    );
    processSubsegment?.addError(error as Error);
    processSubsegment?.close();
    throw error;
  }
}

function determineAlertSeverity(
  alertData: AlertMessage
): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  if (alertData.confidence >= 0.9) {
    return 'CRITICAL';
  } else if (alertData.confidence >= 0.75) {
    return 'HIGH';
  } else if (alertData.confidence >= 0.6) {
    return 'MEDIUM';
  }
  return 'LOW';
}

function constructAlertMessage(
  alertData: AlertMessage,
  patternDetails: Record<string, unknown> | undefined,
  severity: string
): string {
  return `
Trading Pattern Alert

Severity: ${severity}
Symbol: ${alertData.symbol}
Pattern Type: ${alertData.patternType}
Confidence: ${(alertData.confidence * 100).toFixed(2)}%

Market Data:
- Price: $${alertData.price.toFixed(2)}
- Volume: ${alertData.volume.toLocaleString()}
- Timestamp: ${new Date(alertData.timestamp).toISOString()}

Pattern Details:
${patternDetails ? JSON.stringify(patternDetails, null, 2) : 'No additional details available'}

Action Required:
Review this pattern and take appropriate action based on your trading strategy.
  `.trim();
}
