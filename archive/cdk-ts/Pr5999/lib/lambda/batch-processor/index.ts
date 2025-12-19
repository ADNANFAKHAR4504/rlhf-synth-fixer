import { ScheduledEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({});

const TRANSACTION_TABLE_NAME = process.env.TRANSACTION_TABLE_NAME!;
const FRAUD_ALERT_TOPIC_ARN = process.env.FRAUD_ALERT_TOPIC_ARN!;

interface TransactionRecord {
  transactionId: string;
  timestamp: number;
  amount: number;
  currency: string;
  merchantId: string;
  cardNumber: string;
}

/**
 * Batch processor Lambda function
 * Runs hourly to analyze transaction patterns and detect fraud
 */
export async function handler(event: ScheduledEvent): Promise<void> {
  console.log('Starting batch processing for fraud pattern analysis');
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Calculate time window (last hour)
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    // Scan transactions from the last hour
    const scanResult = await docClient.send(
      new ScanCommand({
        TableName: TRANSACTION_TABLE_NAME,
        FilterExpression: '#ts > :oneHourAgo',
        ExpressionAttributeNames: {
          '#ts': 'timestamp',
        },
        ExpressionAttributeValues: {
          ':oneHourAgo': oneHourAgo,
        },
      })
    );

    const transactions = (scanResult.Items || []) as TransactionRecord[];

    console.log(`Found ${transactions.length} transactions in the last hour`);

    if (transactions.length === 0) {
      console.log('No transactions to analyze');
      return;
    }

    // Analyze transaction patterns
    const analysis = analyzeTransactionPatterns(transactions);

    console.log(
      'Transaction pattern analysis:',
      JSON.stringify(analysis, null, 2)
    );

    // Send summary report if suspicious patterns detected
    if (analysis.suspiciousPatterns.length > 0) {
      await snsClient.send(
        new PublishCommand({
          TopicArn: FRAUD_ALERT_TOPIC_ARN,
          Subject: 'Batch Analysis - Suspicious Patterns Detected',
          Message: JSON.stringify({
            timestamp: now,
            period: 'Last hour',
            totalTransactions: transactions.length,
            analysis: analysis,
          }),
        })
      );

      console.log('Suspicious pattern alert sent');
    }

    console.log('Batch processing completed successfully');
  } catch (error) {
    console.error('Error in batch processing:', error);
    throw error;
  }
}

interface AnalysisResult {
  totalTransactions: number;
  totalAmount: number;
  averageAmount: number;
  maxAmount: number;
  uniqueMerchants: number;
  uniqueCards: number;
  suspiciousPatterns: string[];
}

/**
 * Analyzes transaction patterns to detect fraud indicators
 */
function analyzeTransactionPatterns(
  transactions: TransactionRecord[]
): AnalysisResult {
  const suspiciousPatterns: string[] = [];

  // Calculate basic statistics
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  const averageAmount = totalAmount / transactions.length;
  const maxAmount = Math.max(...transactions.map(t => t.amount));

  const uniqueMerchants = new Set(transactions.map(t => t.merchantId)).size;
  const uniqueCards = new Set(transactions.map(t => t.cardNumber)).size;

  // Detect suspicious patterns
  if (averageAmount > 5000) {
    suspiciousPatterns.push('High average transaction amount detected');
  }

  if (maxAmount > 10000) {
    suspiciousPatterns.push(
      `Exceptionally high transaction detected: ${maxAmount}`
    );
  }

  // Check for card velocity (same card used multiple times in short period)
  const cardFrequency = new Map<string, number>();
  transactions.forEach(t => {
    const count = cardFrequency.get(t.cardNumber) || 0;
    cardFrequency.set(t.cardNumber, count + 1);
  });

  for (const [card, count] of cardFrequency.entries()) {
    if (count > 10) {
      suspiciousPatterns.push(
        `High card velocity detected: ${card} used ${count} times in one hour`
      );
    }
  }

  // Check for merchant concentration
  const merchantFrequency = new Map<string, number>();
  transactions.forEach(t => {
    const count = merchantFrequency.get(t.merchantId) || 0;
    merchantFrequency.set(t.merchantId, count + 1);
  });

  for (const [merchant, count] of merchantFrequency.entries()) {
    if (count > transactions.length * 0.5) {
      suspiciousPatterns.push(
        `Unusual merchant concentration: ${merchant} represents ${((count / transactions.length) * 100).toFixed(1)}% of transactions`
      );
    }
  }

  return {
    totalTransactions: transactions.length,
    totalAmount,
    averageAmount,
    maxAmount,
    uniqueMerchants,
    uniqueCards,
    suspiciousPatterns,
  };
}
