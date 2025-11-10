const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Compliance Checker - Processing transaction:', JSON.stringify(event, null, 2));

  const transactionId = event.transactionId;
  const amount = event.amount || 0;
  const fraudDetection = event.fraudDetection || {};

  if (!transactionId) {
    throw new Error('Transaction ID is required');
  }

  // Compliance check logic
  const requiresReview = amount > 5000 || fraudDetection.status === 'FLAGGED';
  const complianceStatus = requiresReview ? 'REVIEW_REQUIRED' : 'COMPLIANT';

  const result = {
    ...event,
    complianceCheck: {
      status: complianceStatus,
      requiresReview,
      checkedAt: new Date().toISOString(),
    },
  };

  // Store intermediate result
  try {
    await docClient.send(
      new PutCommand({
        TableName: process.env.TRANSACTIONS_PROCESSED_TABLE,
        Item: {
          transactionId,
          step: 'compliance-check',
          ...result,
          updatedAt: new Date().toISOString(),
        },
      })
    );
  } catch (error) {
    console.error('Error storing compliance check result:', error);
    throw error;
  }

  console.log('Compliance check complete:', result);
  return result;
};
