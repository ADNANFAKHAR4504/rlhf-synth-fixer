import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const sqsClient = new SQSClient({});
const snsClient = new SNSClient({});
const ssmClient = new SSMClient({});

const TRANSACTION_QUEUE_URL = process.env.TRANSACTION_QUEUE_URL!;
const FRAUD_ALERT_TOPIC_ARN = process.env.FRAUD_ALERT_TOPIC_ARN!;
const FRAUD_THRESHOLD_PARAM = process.env.FRAUD_THRESHOLD_PARAM!;

interface TransactionRequest {
  transactionId: string;
  amount: number;
  currency: string;
  cardNumber: string;
  merchantId: string;
  timestamp?: number;
}

/**
 * Transaction validator Lambda function
 * Validates incoming credit card transactions and checks for fraud patterns
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  console.log(
    'Received transaction validation request:',
    JSON.stringify(event, null, 2)
  );

  try {
    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const transaction: TransactionRequest = JSON.parse(event.body);

    // Validate required fields
    if (
      !transaction.transactionId ||
      !transaction.amount ||
      !transaction.currency ||
      !transaction.cardNumber ||
      !transaction.merchantId
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error:
            'Missing required fields: transactionId, amount, currency, cardNumber, merchantId',
        }),
      };
    }

    // Add timestamp if not provided
    if (!transaction.timestamp) {
      transaction.timestamp = Date.now();
    }

    // Get fraud threshold from Parameter Store
    const paramResponse = await ssmClient.send(
      new GetParameterCommand({
        Name: FRAUD_THRESHOLD_PARAM,
      })
    );

    const fraudThreshold = parseFloat(paramResponse.Parameter?.Value || '1000');

    // Check for suspicious patterns (simple fraud detection logic)
    const isSuspicious = transaction.amount > fraudThreshold;

    if (isSuspicious) {
      console.log(
        `Suspicious transaction detected: ${transaction.transactionId}, amount: ${transaction.amount}`
      );

      // Publish fraud alert to SNS
      await snsClient.send(
        new PublishCommand({
          TopicArn: FRAUD_ALERT_TOPIC_ARN,
          Subject: 'Fraud Alert - Suspicious Transaction Detected',
          Message: JSON.stringify({
            transactionId: transaction.transactionId,
            amount: transaction.amount,
            currency: transaction.currency,
            merchantId: transaction.merchantId,
            timestamp: transaction.timestamp,
            reason: 'Amount exceeds fraud threshold',
          }),
        })
      );
    }

    // Send transaction to FIFO queue for processing
    const messageGroupId = transaction.cardNumber.slice(-4); // Use last 4 digits as group ID
    const deduplicationId = `${transaction.transactionId}-${transaction.timestamp}`;

    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: TRANSACTION_QUEUE_URL,
        MessageBody: JSON.stringify(transaction),
        MessageGroupId: messageGroupId,
        MessageDeduplicationId: deduplicationId,
      })
    );

    console.log(
      `Transaction ${transaction.transactionId} validated and queued for processing`
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Transaction validated successfully',
        transactionId: transaction.transactionId,
        suspicious: isSuspicious,
      }),
    };
  } catch (error) {
    console.error('Error validating transaction:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}
