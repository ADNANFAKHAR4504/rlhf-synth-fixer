const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const dynamoClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);
const sns = new SNSClient({});

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const ENVIRONMENT = process.env.ENVIRONMENT;

exports.handler = async (event) => {
  console.log('Payment Validator - Event received:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    console.log('Parsed request body:', JSON.stringify(body, null, 2));

    // Validate payment data
    const validationResult = validatePayment(body);

    if (!validationResult.isValid) {
      console.error('Payment validation failed:', validationResult.errors);
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'Payment validation failed',
          errors: validationResult.errors,
        }),
      };
    }

    // Generate transaction ID
    const transactionId = generateTransactionId();
    const timestamp = Date.now();

    console.log(`Payment validated successfully. Transaction ID: ${transactionId}`);

    // Store initial transaction record
    const transactionItem = {
      transactionId,
      timestamp,
      status: 'validated',
      amount: body.amount,
      currency: body.currency || 'USD',
      paymentMethod: body.paymentMethod,
      environment: ENVIRONMENT,
      createdAt: new Date().toISOString(),
    };

    await dynamodb.send(new PutCommand({
      TableName: DYNAMODB_TABLE,
      Item: transactionItem,
    }));

    console.log('Transaction record created in DynamoDB:', transactionId);

    // Send validation notification
    await sns.send(new PublishCommand({
      TopicArn: SNS_TOPIC_ARN,
      Subject: 'Payment Validated',
      Message: `Payment validation successful for transaction ${transactionId}\nAmount: ${body.amount} ${body.currency || 'USD'}`,
    }));

    console.log('SNS notification sent for transaction:', transactionId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Payment validated successfully',
        transactionId,
        timestamp,
        status: 'validated',
      }),
    };

  } catch (error) {
    console.error('Error in payment validator:', error);

    // Log error to CloudWatch
    console.error('Error stack:', error.stack);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Internal server error',
        error: error.message,
      }),
    };
  }
};

function validatePayment(payment) {
  const errors = [];

  if (!payment) {
    errors.push('Payment data is required');
    return { isValid: false, errors };
  }

  if (!payment.amount || typeof payment.amount !== 'number' || payment.amount <= 0) {
    errors.push('Valid payment amount is required (must be a positive number)');
  }

  if (payment.amount && payment.amount > 1000000) {
    errors.push('Payment amount exceeds maximum limit (1,000,000)');
  }

  if (!payment.paymentMethod) {
    errors.push('Payment method is required');
  }

  const validPaymentMethods = ['credit_card', 'debit_card', 'bank_transfer', 'digital_wallet'];
  if (payment.paymentMethod && !validPaymentMethods.includes(payment.paymentMethod)) {
    errors.push(`Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}`);
  }

  if (payment.currency) {
    const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD'];
    if (!validCurrencies.includes(payment.currency)) {
      errors.push(`Invalid currency. Must be one of: ${validCurrencies.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function generateTransactionId() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `TXN-${timestamp}-${randomStr}`.toUpperCase();
}
