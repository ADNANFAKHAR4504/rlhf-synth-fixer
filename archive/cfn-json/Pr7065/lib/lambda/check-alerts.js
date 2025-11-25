const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const snsClient = new SNSClient({});

const PRICE_ALERTS_TABLE = process.env.PRICE_ALERTS_TABLE;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

exports.handler = async (event) => {
  console.log('Processing DynamoDB stream records:', JSON.stringify(event, null, 2));

  try {
    for (const record of event.Records) {
      if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
        const newImage = record.dynamodb.NewImage;
        const symbol = newImage.symbol.S;
        const price = parseFloat(newImage.price.N);

        const alerts = await getAlertsByCryptocurrency(symbol);

        for (const alert of alerts) {
          if (shouldTriggerAlert(alert, price)) {
            await publishNotification(alert, symbol, price);
          }
        }
      }
    }

    return { statusCode: 200 };
  } catch (error) {
    console.error('Error checking alerts:', error);
    throw error;
  }
};

async function getAlertsByCryptocurrency(symbol) {
  const params = {
    TableName: PRICE_ALERTS_TABLE,
    IndexName: 'CryptocurrencyIndex',
    KeyConditionExpression: 'cryptocurrency = :symbol',
    ExpressionAttributeValues: {
      ':symbol': symbol
    }
  };

  const result = await ddbDocClient.send(new QueryCommand(params));
  return result.Items || [];
}

function shouldTriggerAlert(alert, currentPrice) {
  const threshold = parseFloat(alert.threshold);
  const condition = alert.condition;

  if (condition === 'above' && currentPrice > threshold) {
    return true;
  }
  if (condition === 'below' && currentPrice < threshold) {
    return true;
  }

  return false;
}

async function publishNotification(alert, symbol, price) {
  const message = {
    userId: alert.userId,
    alertId: alert.alertId,
    symbol: symbol,
    price: price,
    threshold: alert.threshold,
    condition: alert.condition
  };

  const params = {
    TopicArn: SNS_TOPIC_ARN,
    Message: JSON.stringify(message),
    Subject: `Price Alert: ${symbol} ${alert.condition} $${alert.threshold}`
  };

  await snsClient.send(new PublishCommand(params));
  console.log(`Published notification for alert ${alert.alertId}`);
}
