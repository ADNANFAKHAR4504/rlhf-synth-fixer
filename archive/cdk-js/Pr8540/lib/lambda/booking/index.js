const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const { createClient } = require('redis');

const dynamodb = new DynamoDBClient({});
const eventbridge = new EventBridgeClient({});
const cloudwatch = new CloudWatchClient({});

let redisClient = null;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      socket: {
        host: process.env.REDIS_ENDPOINT,
        port: parseInt(process.env.REDIS_PORT)
      }
    });
    await redisClient.connect();
  }
  return redisClient;
}

exports.handler = async (event) => {
  const startTime = Date.now();
  try {
    const body = JSON.parse(event.body || '{}');
    const bookingId = `booking-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const timestamp = Date.now();
    
    const item = {
      id: { S: bookingId },
      searchKey: { S: body.searchKey || 'default' },
      timestamp: { N: timestamp.toString() },
      data: { S: JSON.stringify(body) }
    };
    
    await dynamodb.send(new PutItemCommand({
      TableName: process.env.BOOKING_TABLE,
      Item: item
    }));
    
    const redis = await getRedisClient();
    const cacheKey = `search:${body.searchKey || 'default'}`;
    await redis.del(cacheKey);
    
    await eventbridge.send(new PutEventsCommand({
      Entries: [{
        Source: 'booking.platform',
        DetailType: 'booking.requested',
        Detail: JSON.stringify({ bookingId, searchKey: body.searchKey }),
        EventBusName: process.env.EVENT_BUS_NAME
      }]
    }));
    
    const latency = Date.now() - startTime;
    await cloudwatch.send(new PutMetricDataCommand({
      Namespace: 'BookingPlatform',
      MetricData: [{ MetricName: 'Latency', Value: latency, Unit: 'Milliseconds' }]
    }));
    
    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, message: 'Booking created successfully' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
