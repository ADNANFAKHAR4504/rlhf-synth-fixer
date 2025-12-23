import { SQSEvent, SQSRecord } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
// eslint-disable-next-line import/no-extraneous-dependencies
import * as AWSXRay from 'aws-xray-sdk-core';

const snsClient = AWSXRay.captureAWSv3Client(new SNSClient({}));

const TOPIC_ARN = process.env.TOPIC_ARN!;

interface AlertMessage {
  patternId: string;
  symbol: string;
  pattern: string;
  price: number;
  volume: number;
  alertType: string;
  threshold?: string;
}

export const handler = async (event: SQSEvent): Promise<void> => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('AlertProcessorLogic');

  try {
    console.log('Processing alerts from SQS', {
      recordCount: event.Records.length,
    });

    const processPromises = event.Records.map((record: SQSRecord) =>
      processAlert(record)
    );
    await Promise.all(processPromises);

    console.log('All alerts processed successfully');
    subsegment?.close();
  } catch (error) {
    console.error('Error processing alerts', { error });
    subsegment?.addError(error as Error);
    subsegment?.close();
    throw error;
  }
};

async function processAlert(record: SQSRecord): Promise<void> {
  try {
    const alertData: AlertMessage = JSON.parse(record.body);
    console.log('Processing alert', { alertData });

    const message = formatAlertMessage(alertData);

    const publishCommand = new PublishCommand({
      TopicArn: TOPIC_ARN,
      Subject: `Trading Alert: ${alertData.symbol} - ${alertData.pattern}`,
      Message: message,
      MessageAttributes: {
        symbol: {
          DataType: 'String',
          StringValue: alertData.symbol,
        },
        alertType: {
          DataType: 'String',
          StringValue: alertData.alertType,
        },
      },
    });

    await snsClient.send(publishCommand);
    console.log('Alert published to SNS', { patternId: alertData.patternId });
  } catch (error) {
    console.error('Error processing individual alert', { error, record });
    throw error;
  }
}

function formatAlertMessage(alert: AlertMessage): string {
  return `
Trading Pattern Alert

Pattern ID: ${alert.patternId}
Symbol: ${alert.symbol}
Pattern: ${alert.pattern}
Price: $${alert.price.toFixed(2)}
Volume: ${alert.volume.toLocaleString()}
Alert Type: ${alert.alertType}
${alert.threshold ? `Threshold: ${alert.threshold}` : ''}

Time: ${new Date().toISOString()}

This is an automated alert from the Stock Pattern Detection System.
  `.trim();
}
