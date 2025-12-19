/**
 * Processing Lambda Function
 *
 * This function is triggered by SNS messages containing validated transactions.
 * It enriches the transaction data with additional information and stores it
 * in DynamoDB for persistence.
 */

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

/**
 * Enriches transaction data with additional metadata
 * @param {Object} transaction - The validated transaction
 * @returns {Object} Enriched transaction
 */
function enrichTransaction(transaction) {
  const enriched = {
    ...transaction,
    processedAt: new Date().toISOString(),
    status: 'processed',
    enrichmentData: {
      processingTimestamp: Date.now(),
      processingRegion: process.env.AWS_REGION || 'us-east-1',
      version: '1.0'
    }
  };

  // Add risk scoring based on amount
  if (transaction.amount > 10000) {
    enriched.riskLevel = 'high';
    enriched.requiresReview = true;
  } else if (transaction.amount > 1000) {
    enriched.riskLevel = 'medium';
    enriched.requiresReview = false;
  } else {
    enriched.riskLevel = 'low';
    enriched.requiresReview = false;
  }

  // Calculate processing delay
  if (transaction.timestamp && transaction.validatedAt) {
    const validationTime = new Date(transaction.validatedAt).getTime();
    const transactionTime = new Date(transaction.timestamp).getTime();
    enriched.validationDelayMs = validationTime - transactionTime;
  }

  return enriched;
}

/**
 * Stores enriched transaction in DynamoDB
 * @param {Object} transaction - The enriched transaction
 * @returns {Promise} DynamoDB put operation promise
 */
async function storeTransaction(transaction) {
  const tableName = process.env.DYNAMODB_TABLE_NAME;
  if (!tableName) {
    throw new Error('DYNAMODB_TABLE_NAME environment variable not set');
  }

  const params = {
    TableName: tableName,
    Item: transaction
  };

  return dynamodb.put(params).promise();
}

/**
 * Lambda handler function
 * @param {Object} event - SNS event containing transaction message
 */
exports.handler = async (event) => {
  console.log('Received SNS event:', JSON.stringify(event, null, 2));

  const results = {
    successful: 0,
    failed: 0,
    errors: []
  };

  // Process each SNS record
  for (const record of event.Records) {
    try {
      if (record.EventSource !== 'aws:sns') {
        console.warn('Skipping non-SNS record:', record.EventSource);
        continue;
      }

      // Parse the SNS message
      const transaction = JSON.parse(record.Sns.Message);
      console.log('Processing transaction:', transaction.transactionId);

      // Enrich the transaction
      const enrichedTransaction = enrichTransaction(transaction);
      console.log('Enriched transaction:', JSON.stringify(enrichedTransaction, null, 2));

      // Store in DynamoDB
      await storeTransaction(enrichedTransaction);
      console.log('Successfully stored transaction:', transaction.transactionId);

      results.successful++;

    } catch (error) {
      console.error('Error processing record:', error);
      results.failed++;
      results.errors.push({
        recordId: record.Sns?.MessageId || 'unknown',
        error: error.message
      });

      // Re-throw error to trigger DLQ for this message
      throw error;
    }
  }

  console.log('Processing complete:', results);

  // If any records failed, throw error to trigger DLQ
  if (results.failed > 0) {
    throw new Error(`Failed to process ${results.failed} record(s)`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(results)
  };
};
