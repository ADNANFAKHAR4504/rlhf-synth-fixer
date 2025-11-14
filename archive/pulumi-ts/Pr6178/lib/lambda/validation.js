/**
 * Validation Lambda Function
 *
 * This function receives webhook POST requests from API Gateway,
 * validates the transaction payload, and publishes valid transactions
 * to an SNS topic for further processing.
 */

const AWS = require('aws-sdk');
const sns = new AWS.SNS();

/**
 * Validates the transaction payload structure
 * @param {Object} transaction - The transaction object to validate
 * @returns {Object} Validation result with isValid boolean and errors array
 */
function validateTransaction(transaction) {
  const errors = [];

  if (!transaction) {
    errors.push('Transaction payload is required');
    return { isValid: false, errors };
  }

  if (!transaction.transactionId || typeof transaction.transactionId !== 'string') {
    errors.push('transactionId is required and must be a string');
  }

  if (!transaction.amount || typeof transaction.amount !== 'number') {
    errors.push('amount is required and must be a number');
  }

  if (transaction.amount && transaction.amount < 0) {
    errors.push('amount must be positive');
  }

  if (!transaction.userId || typeof transaction.userId !== 'string') {
    errors.push('userId is required and must be a string');
  }

  if (!transaction.timestamp) {
    errors.push('timestamp is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Lambda handler function
 * @param {Object} event - API Gateway event
 * @returns {Object} API Gateway response
 */
exports.handler = async (event) => {
  console.log('Received webhook request:', JSON.stringify(event, null, 2));

  try {
    // Parse the request body
    let transaction;
    try {
      transaction = typeof event.body === 'string'
        ? JSON.parse(event.body)
        : event.body;
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Invalid JSON in request body'
        })
      };
    }

    // Validate the transaction
    const validation = validateTransaction(transaction);

    if (!validation.isValid) {
      console.warn('Transaction validation failed:', validation.errors);
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Validation failed',
          details: validation.errors
        })
      };
    }

    // Add validation timestamp
    transaction.validatedAt = new Date().toISOString();

    // Publish to SNS topic
    const snsTopicArn = process.env.SNS_TOPIC_ARN;
    if (!snsTopicArn) {
      throw new Error('SNS_TOPIC_ARN environment variable not set');
    }

    const publishParams = {
      TopicArn: snsTopicArn,
      Message: JSON.stringify(transaction),
      MessageAttributes: {
        transactionId: {
          DataType: 'String',
          StringValue: transaction.transactionId
        },
        amount: {
          DataType: 'Number',
          StringValue: transaction.amount.toString()
        }
      }
    };

    const publishResult = await sns.publish(publishParams).promise();
    console.log('Successfully published to SNS:', publishResult.MessageId);

    return {
      statusCode: 202,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Transaction accepted for processing',
        transactionId: transaction.transactionId,
        messageId: publishResult.MessageId
      })
    };

  } catch (error) {
    console.error('Error processing webhook:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
