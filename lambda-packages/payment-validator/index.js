/**
 * payment-validator Lambda function
 *
 * Validates incoming payment requests and performs preliminary checks
 * before passing to the payment processor.
 */
const { DynamoDBClient, GetItemCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');

const dynamoClient = new DynamoDBClient({ region: 'ap-southeast-1' });
const tableName = process.env.DYNAMO_TABLE_NAME;

/**
 * Validates payment request structure
 */
function validatePaymentRequest(body) {
  const errors = [];

  if (!body.transactionId) {
    errors.push('Missing transactionId');
  }

  if (!body.amount || body.amount <= 0) {
    errors.push('Invalid amount');
  }

  if (!body.currency) {
    errors.push('Missing currency');
  }

  if (!body.customerEmail) {
    errors.push('Missing customerEmail');
  }

  return errors;
}

/**
 * Check for duplicate transactions
 */
async function checkDuplicateTransaction(transactionId) {
  try {
    const command = new GetItemCommand({
      TableName: tableName,
      Key: {
        transactionId: { S: transactionId },
      },
    });

    const result = await dynamoClient.send(command);
    return !!result.Item;
  } catch (error) {
    console.error('Error checking duplicate transaction:', error);
    throw error;
  }
}

/**
 * Lambda handler
 */
exports.handler = async (event) => {
  console.log('Received payment validation request:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');

    // Validate request structure
    const validationErrors = validatePaymentRequest(body);
    if (validationErrors.length > 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          message: 'Validation failed',
          errors: validationErrors,
        }),
      };
    }

    // Check for duplicate transaction
    const isDuplicate = await checkDuplicateTransaction(body.transactionId);
    if (isDuplicate) {
      return {
        statusCode: 409,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          message: 'Duplicate transaction',
          transactionId: body.transactionId,
        }),
      };
    }

    // Validation passed
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        message: 'Payment validation successful',
        transactionId: body.transactionId,
        amount: body.amount,
        currency: body.currency,
      }),
    };

  } catch (error) {
    console.error('Error processing payment validation:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error.message,
      }),
    };
  }
};
