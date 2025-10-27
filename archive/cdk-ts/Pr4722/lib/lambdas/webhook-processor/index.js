const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);
const cloudwatchClient = new CloudWatchClient({});

exports.handler = async (event) => {
  const tableName = process.env.TRANSACTIONS_TABLE;

  for (const record of event.Records) {
    try {
      const messageBody = JSON.parse(record.body);

      // Parse webhook payload
      // This is a simplified example - real implementation would handle Stripe/PayPal specifics
      const transactionId = messageBody.id || `txn-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const vendorId = messageBody.vendor_id || messageBody.metadata?.vendor_id || 'unknown';
      const amount = messageBody.amount || 0;
      const currency = messageBody.currency || 'USD';
      const timestamp = Date.now();
      const provider = messageBody.provider || 'unknown';

      // Store transaction in DynamoDB
      const putCommand = new PutCommand({
        TableName: tableName,
        Item: {
          transactionId,
          vendorId,
          amount,
          currency,
          timestamp,
          provider,
          status: 'completed',
          rawWebhook: JSON.stringify(messageBody),
          processedAt: new Date().toISOString(),
        },
      });

      await docClient.send(putCommand);

      // Emit custom metric for successful transaction
      const metricCommand = new PutMetricDataCommand({
        Namespace: 'MarketGrid',
        MetricData: [
          {
            MetricName: 'SuccessfulTransactions',
            Value: 1,
            Unit: 'Count',
            Timestamp: new Date(),
            Dimensions: [
              {
                Name: 'Stage',
                Value: process.env.STAGE_NAME || 'dev',
              },
            ],
          },
        ],
      });

      await cloudwatchClient.send(metricCommand);

      console.log(`Successfully processed transaction: ${transactionId}`);
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error; // This will send the message to DLQ after retries
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Webhooks processed successfully' }),
  };
};
