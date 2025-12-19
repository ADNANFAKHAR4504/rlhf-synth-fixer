import { SQSEvent, SQSRecord } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TRANSACTION_TABLE_NAME = process.env.TRANSACTION_TABLE_NAME!;

interface Transaction {
  transactionId: string;
  amount: number;
  currency: string;
  cardNumber: string;
  merchantId: string;
  timestamp: number;
}

/**
 * FIFO queue processor Lambda function
 * Processes transactions from SQS FIFO queue and stores them in DynamoDB
 */
export async function handler(event: SQSEvent): Promise<void> {
  console.log(
    `Processing ${event.Records.length} transactions from FIFO queue`
  );

  const promises = event.Records.map((record: SQSRecord) =>
    processTransaction(record)
  );

  try {
    await Promise.all(promises);
    console.log('All transactions processed successfully');
  } catch (error) {
    console.error('Error processing transactions:', error);
    throw error; // Let Lambda retry failed messages
  }
}

async function processTransaction(record: SQSRecord): Promise<void> {
  try {
    const transaction: Transaction = JSON.parse(record.body);

    console.log(`Processing transaction: ${transaction.transactionId}`);

    // Store transaction in DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: TRANSACTION_TABLE_NAME,
        Item: {
          transactionId: transaction.transactionId,
          timestamp: transaction.timestamp,
          amount: transaction.amount,
          currency: transaction.currency,
          cardNumber: maskCardNumber(transaction.cardNumber),
          merchantId: transaction.merchantId,
          processedAt: Date.now(),
          messageId: record.messageId,
        },
      })
    );

    console.log(`Transaction ${transaction.transactionId} stored in DynamoDB`);
  } catch (error) {
    console.error(
      `Error processing transaction from record ${record.messageId}:`,
      error
    );
    throw error;
  }
}

/**
 * Masks credit card number for PCI DSS compliance
 * Only stores last 4 digits
 */
function maskCardNumber(cardNumber: string): string {
  const lastFour = cardNumber.slice(-4);
  return `****-****-****-${lastFour}`;
}
