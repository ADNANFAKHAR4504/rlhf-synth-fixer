const {DynamoDBClient, PutItemCommand} = require('@aws-sdk/client-dynamodb');
const {SQSClient, SendMessageCommand} = require('@aws-sdk/client-sqs');
const {SNSClient, PublishCommand} = require('@aws-sdk/client-sns');
const {SSMClient, GetParameterCommand} = require('@aws-sdk/client-ssm');
const {marshall} = require('@aws-sdk/util-dynamodb');

const dynamodb = new DynamoDBClient({});
const sqs = new SQSClient({});
const sns = new SNSClient({});
const ssm = new SSMClient({});

// Cache for SSM parameters
let cachedParams = {};

async function getParameter(name) {
  if (cachedParams[name]) {
    return cachedParams[name];
  }

  const command = new GetParameterCommand({Name: name});
  const response = await ssm.send(command);
  cachedParams[name] = response.Parameter.Value;
  return cachedParams[name];
}

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const {amount, currency, card_token} = body;

    // Get configuration from Parameter Store
    const maxAmount = parseFloat(await getParameter(process.env.MAX_AMOUNT_PARAM));
    const supportedCurrencies = (await getParameter(process.env.SUPPORTED_CURRENCIES_PARAM)).split(',');
    const highValueThreshold = parseFloat(await getParameter(process.env.HIGH_VALUE_THRESHOLD_PARAM));

    // Validate transaction
    const isValid = amount < maxAmount && supportedCurrencies.includes(currency);

    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    if (isValid) {
      // Store valid transaction in DynamoDB
      await dynamodb.send(
        new PutItemCommand({
          TableName: process.env.TRANSACTIONS_TABLE,
          Item: marshall({
            transaction_id: transactionId,
            timestamp,
            amount,
            currency,
            card_token,
            status: 'valid',
          }),
        })
      );

      // Send SNS notification for high-value transactions
      if (amount > highValueThreshold) {
        await sns.send(
          new PublishCommand({
            TopicArn: process.env.COMPLIANCE_TOPIC_ARN,
            Subject: 'High-Value Transaction Alert',
            Message: `Transaction ${transactionId} of ${amount} ${currency} exceeds threshold of ${highValueThreshold}`,
          })
        );
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Transaction validated successfully',
          transactionId,
        }),
      };
    } else {
      // Queue invalid transaction for review
      await sqs.send(
        new SendMessageCommand({
          QueueUrl: process.env.INVALID_QUEUE_URL,
          MessageBody: JSON.stringify({
            transactionId,
            timestamp,
            amount,
            currency,
            card_token,
            reason: amount >= maxAmount ? 'Amount exceeds limit' : 'Unsupported currency',
          }),
        })
      );

      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Transaction validation failed',
          transactionId,
        }),
      };
    }
  } catch (error) {
    console.error('Error processing transaction:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({message: 'Internal server error'}),
    };
  }
};
