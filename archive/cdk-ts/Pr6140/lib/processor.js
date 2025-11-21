const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const { marshall } = require('@aws-sdk/util-dynamodb');
const crypto = require('crypto');

const dynamodbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const eventbridgeClient = new EventBridgeClient({ region: process.env.AWS_REGION });

/**
 * Webhook processor Lambda function
 * Processes webhooks from SQS queues, stores in DynamoDB, and publishes to EventBridge
 */
exports.handler = async (event) => {
  console.log('Processing webhook batch:', JSON.stringify(event, null, 2));

  const results = {
    processed: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Process each message in the batch
    for (const record of event.Records) {
      try {
        const messageBody = JSON.parse(record.body);

        // Store in DynamoDB
        await storeWebhookTransaction(messageBody);

        // Publish to EventBridge
        await publishEvent(messageBody);

        results.processed++;
        console.log(`Successfully processed webhook: ${messageBody.provider}-${messageBody.timestamp}`);

      } catch (error) {
        console.error('Error processing individual webhook:', error);
        results.failed++;
        results.errors.push({
          messageId: record.messageId,
          error: error.message,
        });
      }
    }

    console.log(`Batch processing complete. Processed: ${results.processed}, Failed: ${results.failed}`);

    // Return success even if some messages failed (SQS will retry failed messages)
    return {
      statusCode: 200,
      body: JSON.stringify(results),
    };

  } catch (error) {
    console.error('Critical error in webhook processor:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Critical processing error',
        details: error.message,
      }),
    };
  }
};

/**
 * Store webhook transaction in DynamoDB
 */
async function storeWebhookTransaction(messageBody) {
  const webhookId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const item = {
    webhook_id: webhookId,
    timestamp: timestamp,
    provider: messageBody.provider,
    event_type: messageBody.event_type,
    data: messageBody.data,
    processed_at: timestamp,
    ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60), // 90 days TTL
  };

  const command = new PutItemCommand({
    TableName: process.env.TABLE_NAME,
    Item: marshall(item, {
      removeUndefinedValues: true,
    }),
  });

  await dynamodbClient.send(command);
  console.log(`Stored webhook in DynamoDB: ${webhookId}`);
}

/**
 * Publish webhook event to EventBridge
 */
async function publishEvent(messageBody) {
  const eventDetail = {
    webhook_id: crypto.randomUUID(),
    provider: messageBody.provider,
    event_type: messageBody.event_type,
    timestamp: messageBody.timestamp,
    data: messageBody.data,
  };

  // Map provider-specific event types to standardized events
  const eventType = mapEventType(messageBody.provider, messageBody.event_type);

  const command = new PutEventsCommand({
    Entries: [{
      EventBusName: process.env.EVENT_BUS_NAME,
      Source: 'webhook.processor',
      DetailType: eventType,
      Detail: JSON.stringify(eventDetail),
    }],
  });

  await eventbridgeClient.send(command);
  console.log(`Published event to EventBridge: ${eventType}`);
}

/**
 * Map provider-specific event types to standardized event types
 */
function mapEventType(provider, originalEventType) {
  const eventMappings = {
    stripe: {
      'payment_intent.succeeded': 'Payment Succeeded',
      'payment_intent.payment_failed': 'Payment Failed',
      'customer.subscription.created': 'Subscription Created',
      'customer.subscription.updated': 'Subscription Updated',
      'customer.subscription.deleted': 'Subscription Cancelled',
    },
    paypal: {
      'PAYMENT.SALE.COMPLETED': 'Payment Succeeded',
      'PAYMENT.SALE.DENIED': 'Payment Failed',
      'BILLING.SUBSCRIPTION.CREATED': 'Subscription Created',
      'BILLING.SUBSCRIPTION.UPDATED': 'Subscription Updated',
      'BILLING.SUBSCRIPTION.CANCELLED': 'Subscription Cancelled',
    },
    square: {
      'payment.created': 'Payment Succeeded',
      'payment.failed': 'Payment Failed',
      'subscription.created': 'Subscription Created',
      'subscription.updated': 'Subscription Updated',
      'subscription.canceled': 'Subscription Cancelled',
    },
  };

  const providerMappings = eventMappings[provider] || {};
  return providerMappings[originalEventType] || 'Webhook Event';
}
