const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');
const {
  CloudWatchClient,
  PutMetricDataCommand,
} = require('@aws-sdk/client-cloudwatch');

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const cloudwatchClient = new CloudWatchClient({});

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3', 10);
const BACKOFF_RATE = parseFloat(process.env.BACKOFF_RATE || '2');
const INITIAL_BACKOFF_SECONDS = parseInt(
  process.env.INITIAL_BACKOFF_SECONDS || '1',
  10
);

/**
 * Sleep utility
 */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Simulate PMS API call with retry logic
 * In production, replace with actual PMS integration (Opera, Sabre, etc.)
 */
async function syncToPMS(propertyId, bookingData, retryCount = 0) {
  try {
    console.log(
      `Syncing to PMS for property ${propertyId}, attempt ${retryCount + 1}`
    );

    // Simulated PMS API call
    // In production: await axios.post(`https://pms-api.example.com/${propertyId}/bookings`, bookingData)

    // Simulate occasional failures for testing
    if (Math.random() < 0.1 && retryCount === 0) {
      throw new Error('Simulated PMS API timeout');
    }

    return {
      success: true,
      pmsConfirmationId: `PMS-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`PMS sync failed for property ${propertyId}:`, error.message);

    if (retryCount < MAX_RETRIES) {
      const backoffMs =
        INITIAL_BACKOFF_SECONDS * 1000 * Math.pow(BACKOFF_RATE, retryCount);
      console.log(`Retrying after ${backoffMs}ms...`);
      await sleep(backoffMs);
      return syncToPMS(propertyId, bookingData, retryCount + 1);
    }

    throw error;
  }
}

/**
 * PMS Sync Worker Lambda
 * Processes SQS messages and syncs booking changes to Property Management Systems
 * SLA Target: SNS → SQS → PMS sync delivered in <60 seconds
 */
exports.handler = async event => {
  console.log('PMS sync worker invoked:', JSON.stringify(event, null, 2));

  const results = {
    successful: 0,
    failed: 0,
    errors: [],
  };

  try {
    for (const record of event.Records) {
      try {
        const message = JSON.parse(record.body);

        // Handle SNS wrapping
        const eventData = message.Message
          ? JSON.parse(message.Message)
          : message;

        const {
          eventType,
          propertyId,
          roomId,
          date,
          bookingId,
          units,
          timestamp,
        } = eventData;

        console.log(
          `Processing ${eventType} for property ${propertyId}, booking ${bookingId}`
        );

        // Get current booking state from DynamoDB
        const bookingKey = `${propertyId}#${roomId}#${date}`;
        const currentState = await dynamoClient.send(
          new GetCommand({
            TableName: TABLE_NAME,
            Key: { booking_key: bookingKey },
          })
        );

        if (!currentState.Item) {
          console.warn(`Booking ${bookingKey} not found in DynamoDB`);
          results.failed++;
          continue;
        }

        // Sync to PMS
        const pmsResponse = await syncToPMS(propertyId, {
          eventType,
          bookingId,
          roomId,
          date,
          units,
          availableUnits: currentState.Item.available_units,
          timestamp,
        });

        // Update DynamoDB with PMS confirmation
        await dynamoClient.send(
          new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { booking_key: bookingKey },
            UpdateExpression:
              'SET pms_sync_status = :status, pms_confirmation_id = :confirmationId, pms_sync_time = :syncTime',
            ExpressionAttributeValues: {
              ':status': 'SYNCED',
              ':confirmationId': pmsResponse.pmsConfirmationId,
              ':syncTime': pmsResponse.timestamp,
            },
          })
        );

        // Publish success metric
        await cloudwatchClient.send(
          new PutMetricDataCommand({
            Namespace: 'Custom/Booking',
            MetricData: [
              {
                MetricName: 'PMSSyncSuccess',
                Value: 1,
                Unit: 'Count',
                Timestamp: new Date(),
                Dimensions: [
                  { Name: 'PropertyId', Value: propertyId },
                  { Name: 'EventType', Value: eventType },
                ],
              },
            ],
          })
        );

        results.successful++;
        console.log(`Successfully synced booking ${bookingId} to PMS`);
      } catch (error) {
        console.error('Failed to process SQS message:', error);
        results.failed++;
        results.errors.push({
          messageId: record.messageId,
          error: error.message,
        });

        // Publish failure metric
        await cloudwatchClient.send(
          new PutMetricDataCommand({
            Namespace: 'Custom/Booking',
            MetricData: [
              {
                MetricName: 'PMSSyncFailure',
                Value: 1,
                Unit: 'Count',
                Timestamp: new Date(),
              },
            ],
          })
        );

        // Message will be retried or sent to DLQ
        throw error;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        results,
      }),
    };
  } catch (error) {
    console.error('PMS sync worker error:', error);
    throw error;
  }
};
