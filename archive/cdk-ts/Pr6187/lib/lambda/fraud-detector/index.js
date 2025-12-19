const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Fraud Detector - Processing transaction:', JSON.stringify(event, null, 2));

  const transactionId = event.transactionId || event.transaction?.transactionId;
  const amount = event.amount || event.transaction?.amount || 0;

  if (!transactionId) {
    throw new Error('Transaction ID is required');
  }

  // Fraud detection logic
  const isFraudulent = amount > 10000; // Simple rule: flag large transactions
  const fraudScore = isFraudulent ? 0.95 : 0.05;

  const result = {
    transactionId,
    amount,
    fraudDetection: {
      status: isFraudulent ? 'FLAGGED' : 'PASSED',
      fraudScore,
      timestamp: new Date().toISOString(),
    },
  };

  // Store intermediate result in processed table
  try {
    await docClient.send(
      new PutCommand({
        TableName: process.env.TRANSACTIONS_PROCESSED_TABLE,
        Item: {
          transactionId,
          step: 'fraud-detection',
          ...result,
          updatedAt: new Date().toISOString(),
        },
      })
    );
  } catch (error) {
    console.error('Error storing fraud detection result:', error);
    throw error;
  }

  console.log('Fraud detection complete:', result);
  return result;
};
