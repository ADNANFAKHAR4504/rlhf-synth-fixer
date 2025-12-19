/**
 * Rule evaluation Lambda function
 * Evaluates user alert rules against incoming price data and sends notifications
 */
const { DynamoDBClient, ScanCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoClient = new DynamoDBClient({});
const snsClient = new SNSClient({});

const ALERT_RULES_TABLE = process.env.ALERT_RULES_TABLE;
const PRICE_HISTORY_TABLE = process.env.PRICE_HISTORY_TABLE;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

exports.handler = async (event) => {
  console.log('Processing evaluation event:', JSON.stringify(event));

  try {
    const alertsTriggered = [];

    // Process SQS messages if present
    if (event.Records) {
      for (const record of event.Records) {
        const message = JSON.parse(record.body);
        const { symbol, price } = message;

        console.log(`Evaluating price alert for ${symbol}: ${price}`);

        // Query alert rules
        const scanCommand = new ScanCommand({
          TableName: ALERT_RULES_TABLE,
        });

        const alertRules = await dynamoClient.send(scanCommand);

        if (alertRules.Items) {
          for (const item of alertRules.Items) {
            const rule = unmarshall(item);

            // Check if rule matches the symbol and threshold
            if (rule.symbol === symbol) {
              let triggered = false;

              if (rule.condition === 'above' && price >= rule.threshold) {
                triggered = true;
              } else if (rule.condition === 'below' && price <= rule.threshold) {
                triggered = true;
              }

              if (triggered) {
                console.log(`Alert triggered for user ${rule.userId}: ${symbol} ${rule.condition} ${rule.threshold}`);

                // Send SNS notification
                const publishCommand = new PublishCommand({
                  TopicArn: SNS_TOPIC_ARN,
                  Subject: `Price Alert: ${symbol}`,
                  Message: JSON.stringify({
                    userId: rule.userId,
                    alertId: rule.alertId,
                    symbol,
                    currentPrice: price,
                    threshold: rule.threshold,
                    condition: rule.condition,
                  }),
                });

                await snsClient.send(publishCommand);
                alertsTriggered.push(rule.alertId);
              }
            }
          }
        }
      }
    } else {
      // Scheduled execution - batch processing
      console.log('Running scheduled batch evaluation');

      // Get all alert rules
      const scanCommand = new ScanCommand({
        TableName: ALERT_RULES_TABLE,
      });

      const alertRules = await dynamoClient.send(scanCommand);

      if (alertRules.Items && alertRules.Items.length > 0) {
        // Get unique symbols from rules
        const symbols = [...new Set(alertRules.Items.map((item) => unmarshall(item).symbol))];

        for (const symbol of symbols) {
          // Get latest price for each symbol
          const queryCommand = new QueryCommand({
            TableName: PRICE_HISTORY_TABLE,
            KeyConditionExpression: 'symbol = :symbol',
            ExpressionAttributeValues: {
              ':symbol': { S: symbol },
            },
            ScanIndexForward: false,
            Limit: 1,
          });

          const priceData = await dynamoClient.send(queryCommand);

          if (priceData.Items && priceData.Items.length > 0) {
            const latestPrice = unmarshall(priceData.Items[0]);

            // Evaluate rules for this symbol
            for (const item of alertRules.Items) {
              const rule = unmarshall(item);

              if (rule.symbol === symbol) {
                let triggered = false;

                if (rule.condition === 'above' && latestPrice.price >= rule.threshold) {
                  triggered = true;
                } else if (rule.condition === 'below' && latestPrice.price <= rule.threshold) {
                  triggered = true;
                }

                if (triggered) {
                  console.log(
                    `Scheduled alert triggered for user ${rule.userId}: ${symbol} ${rule.condition} ${rule.threshold}`
                  );

                  // Send SNS notification
                  const publishCommand = new PublishCommand({
                    TopicArn: SNS_TOPIC_ARN,
                    Subject: `Price Alert: ${symbol}`,
                    Message: JSON.stringify({
                      userId: rule.userId,
                      alertId: rule.alertId,
                      symbol,
                      currentPrice: latestPrice.price,
                      threshold: rule.threshold,
                      condition: rule.condition,
                      evaluationType: 'scheduled',
                    }),
                  });

                  await snsClient.send(publishCommand);
                  alertsTriggered.push(rule.alertId);
                }
              }
            }
          }
        }
      }
    }

    console.log(`Evaluation complete. Alerts triggered: ${alertsTriggered.length}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Evaluation complete',
        alertsTriggered: alertsTriggered.length,
      }),
    };
  } catch (error) {
    console.error('Error during evaluation:', error);
    throw error;
  }
};
