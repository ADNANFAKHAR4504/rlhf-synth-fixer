import { SNSEvent, SNSEventRecord } from 'aws-lambda';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const ssmClient = new SSMClient({});

const ALERT_EMAIL_PARAM = process.env.ALERT_EMAIL_PARAM!;

interface FraudAlert {
  transactionId: string;
  amount: number;
  currency: string;
  merchantId: string;
  timestamp: number;
  reason: string;
}

/**
 * Fraud alert handler Lambda function
 * Processes fraud alerts from SNS topic and sends notifications to security team
 */
export async function handler(event: SNSEvent): Promise<void> {
  console.log(`Processing ${event.Records.length} fraud alerts`);

  // Get alert email from Parameter Store
  const paramResponse = await ssmClient.send(
    new GetParameterCommand({
      Name: ALERT_EMAIL_PARAM,
    })
  );

  const alertEmail = paramResponse.Parameter?.Value || 'security@example.com';

  const promises = event.Records.map((record: SNSEventRecord) =>
    processAlert(record, alertEmail)
  );

  try {
    await Promise.all(promises);
    console.log('All fraud alerts processed successfully');
  } catch (error) {
    console.error('Error processing fraud alerts:', error);
    throw error;
  }
}

async function processAlert(
  record: SNSEventRecord,
  alertEmail: string
): Promise<void> {
  try {
    const alert: FraudAlert = JSON.parse(record.Sns.Message);

    console.log(
      `Processing fraud alert for transaction: ${alert.transactionId}`
    );

    // In a real implementation, this would send an email via SES or trigger other notification mechanisms
    // For now, we'll just log the alert
    console.log('Fraud Alert Details:', {
      transactionId: alert.transactionId,
      amount: alert.amount,
      currency: alert.currency,
      merchantId: alert.merchantId,
      timestamp: new Date(alert.timestamp).toISOString(),
      reason: alert.reason,
      alertEmail: alertEmail,
    });

    // Simulate sending alert to security team
    console.log(`Alert sent to security team at ${alertEmail}`);

    // In production, you would use AWS SES to send actual emails:
    // await sesClient.send(new SendEmailCommand({
    //   Source: 'fraud-alerts@example.com',
    //   Destination: { ToAddresses: [alertEmail] },
    //   Message: {
    //     Subject: { Data: `Fraud Alert - Transaction ${alert.transactionId}` },
    //     Body: { Text: { Data: JSON.stringify(alert, null, 2) } }
    //   }
    // }));
  } catch (error) {
    console.error(
      `Error processing fraud alert from record ${record.Sns.MessageId}:`,
      error
    );
    throw error;
  }
}
