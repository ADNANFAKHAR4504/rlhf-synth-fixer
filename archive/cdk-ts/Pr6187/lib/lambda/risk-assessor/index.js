const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Risk Assessor - Processing transaction:', JSON.stringify(event, null, 2));

  const transactionId = event.transactionId;
  const amount = event.amount || 0;
  const fraudDetection = event.fraudDetection || {};
  const complianceCheck = event.complianceCheck || {};

  if (!transactionId) {
    throw new Error('Transaction ID is required');
  }

  // Risk assessment logic
  let riskLevel = 'LOW';
  let riskScore = 0.1;

  if (fraudDetection.status === 'FLAGGED') {
    riskLevel = 'HIGH';
    riskScore = 0.9;
  } else if (complianceCheck.status === 'REVIEW_REQUIRED') {
    riskLevel = 'MEDIUM';
    riskScore = 0.5;
  } else if (amount > 1000) {
    riskLevel = 'MEDIUM';
    riskScore = 0.4;
  }

  const finalResult = {
    ...event,
    riskAssessment: {
      riskLevel,
      riskScore,
      assessedAt: new Date().toISOString(),
    },
    processingComplete: true,
    finalTimestamp: new Date().toISOString(),
  };

  // Store final result in processed table
  try {
    await docClient.send(
      new PutCommand({
        TableName: process.env.TRANSACTIONS_PROCESSED_TABLE,
        Item: {
          transactionId,
          step: 'risk-assessment',
          ...finalResult,
          completedAt: new Date().toISOString(),
        },
      })
    );
  } catch (error) {
    console.error('Error storing risk assessment result:', error);
    throw error;
  }

  console.log('Risk assessment complete:', finalResult);
  return finalResult;
};
