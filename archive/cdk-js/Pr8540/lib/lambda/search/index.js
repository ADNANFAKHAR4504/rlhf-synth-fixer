const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
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
    const queryParams = event.queryStringParameters || {};
    const searchKey = queryParams.searchKey || 'default';
    const cacheKey = `search:${searchKey}`;
    
    const redis = await getRedisClient();
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      await cloudwatch.send(new PutMetricDataCommand({
        Namespace: 'BookingPlatform',
        MetricData: [{ MetricName: 'CacheHit', Value: 1, Unit: 'Count' }]
      }));
      
      await eventbridge.send(new PutEventsCommand({
        Entries: [{
          Source: 'booking.platform',
          DetailType: 'search.completed',
          Detail: JSON.stringify({ searchKey, cached: true }),
          EventBusName: process.env.EVENT_BUS_NAME
        }]
      }));
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: JSON.parse(cached), cached: true })
      };
    }
    
    await cloudwatch.send(new PutMetricDataCommand({
      Namespace: 'BookingPlatform',
      MetricData: [{ MetricName: 'CacheMiss', Value: 1, Unit: 'Count' }]
    }));
    
    const result = await dynamodb.send(new QueryCommand({
      TableName: process.env.BOOKING_TABLE,
      IndexName: 'searchIndex',
      KeyConditionExpression: 'searchKey = :sk',
      ExpressionAttributeValues: { ':sk': { S: searchKey } },
      Limit: 50
    }));
    
    const rawItems = result.Items || [];
    const results = rawItems.map(item => unmarshall(item));
    await redis.setEx(cacheKey, parseInt(process.env.CACHE_TTL), JSON.stringify(results));
    
    const latency = Date.now() - startTime;
    await cloudwatch.send(new PutMetricDataCommand({
      Namespace: 'BookingPlatform',
      MetricData: [{ MetricName: 'Latency', Value: latency, Unit: 'Milliseconds' }]
    }));
    
    await eventbridge.send(new PutEventsCommand({
      Entries: [{
        Source: 'booking.platform',
        DetailType: 'search.completed',
        Detail: JSON.stringify({ searchKey, cached: false, count: results.length }),
        EventBusName: process.env.EVENT_BUS_NAME
      }]
    }));
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results, cached: false })
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
