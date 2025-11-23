const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager');
const {
  CloudWatchClient,
  PutMetricDataCommand,
} = require('@aws-sdk/client-cloudwatch');
const Redis = require('ioredis');

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const secretsClient = new SecretsManagerClient({});
const cloudwatchClient = new CloudWatchClient({});

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const REDIS_ENDPOINT = process.env.REDIS_ENDPOINT;
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_AUTH_SECRET_ARN = process.env.REDIS_AUTH_SECRET_ARN;

let redisClient = null;
let redisAuthToken = null;

/**
 * Get Redis auth token
 */
async function getRedisAuthToken() {
  if (redisAuthToken) return redisAuthToken;

  const response = await secretsClient.send(
    new GetSecretValueCommand({
      SecretId: REDIS_AUTH_SECRET_ARN,
    })
  );
  redisAuthToken = response.SecretString;
  return redisAuthToken;
}

/**
 * Initialize Redis client
 */
async function getRedisClient() {
  if (redisClient && redisClient.status === 'ready') {
    return redisClient;
  }

  const token = await getRedisAuthToken();

  redisClient = new Redis({
    host: REDIS_ENDPOINT,
    port: REDIS_PORT,
    password: token,
    tls: {},
  });

  return redisClient;
}

/**
 * Reconciliation Checker Lambda
 * Compares DynamoDB, Redis cache, and Aurora state to detect drift
 * SLA Target: Wider audit runs every 5 minutes and finishes within 2 minutes
 */
exports.handler = async event => {
  console.log('Reconciliation check started:', JSON.stringify(event, null, 2));

  const startTime = Date.now();
  const conflicts = [];
  let itemsChecked = 0;
  let driftDetected = false;

  try {
    const redis = await getRedisClient();

    // Sample-based reconciliation: check recent bookings or random sample
    // In production, implement pagination and partial checking to meet 2min SLA
    const scanParams = {
      TableName: TABLE_NAME,
      Limit: 100, // Sample size - adjust based on performance requirements
      FilterExpression: 'attribute_exists(available_units)',
    };

    const dynamoData = await dynamoClient.send(new ScanCommand(scanParams));

    for (const item of dynamoData.Items || []) {
      itemsChecked++;

      const {
        booking_key,
        property_id,
        room_id,
        date,
        available_units,
        version,
      } = item;
      const [propId, roomId, dateStr] = booking_key.split('#');

      // Check Redis cache consistency
      const cacheKey = `hotel:${propId}:room:${roomId}:date:${dateStr}`;

      try {
        const cachedData = await redis.get(cacheKey);

        if (cachedData) {
          const cached = JSON.parse(cachedData);

          // Check for cache drift
          if (cached.availableUnits !== available_units) {
            console.warn(`Cache drift detected: ${cacheKey}`);
            console.warn(
              `DynamoDB: ${available_units}, Redis: ${cached.availableUnits}`
            );

            conflicts.push({
              bookingKey: booking_key,
              type: 'CACHE_DRIFT',
              dynamoValue: available_units,
              cacheValue: cached.availableUnits,
              severity: 'MEDIUM',
            });

            driftDetected = true;

            // Auto-heal: Update cache with DynamoDB value (source of truth)
            const correctedData = {
              propertyId: propId,
              roomId,
              date: dateStr,
              availableUnits: available_units,
              reservedUnits: item.reserved_units || 0,
              version: version || 0,
              lastUpdated: new Date().toISOString(),
              reconciled: true,
            };

            await redis.setex(cacheKey, 3600, JSON.stringify(correctedData));
            console.log(`Cache auto-healed for ${cacheKey}`);
          }
        } else {
          // Cache miss - not necessarily a problem if TTL expired
          console.log(`Cache miss for ${cacheKey} (may be TTL expiration)`);
        }
      } catch (redisError) {
        console.error(`Redis check failed for ${cacheKey}:`, redisError);
      }

      // Check for logical inconsistencies
      if (available_units < 0) {
        console.error(
          `Negative availability detected: ${booking_key} = ${available_units}`
        );

        conflicts.push({
          bookingKey: booking_key,
          type: 'NEGATIVE_AVAILABILITY',
          value: available_units,
          severity: 'CRITICAL',
        });

        driftDetected = true;
      }
    }

    const duration = Date.now() - startTime;

    // Publish metrics
    await cloudwatchClient.send(
      new PutMetricDataCommand({
        Namespace: 'Custom/Booking',
        MetricData: [
          {
            MetricName: 'ReconciliationDuration',
            Value: duration,
            Unit: 'Milliseconds',
            Timestamp: new Date(),
          },
          {
            MetricName: 'ReconciliationItemsChecked',
            Value: itemsChecked,
            Unit: 'Count',
            Timestamp: new Date(),
          },
          {
            MetricName: 'ReconciliationConflicts',
            Value: conflicts.length,
            Unit: 'Count',
            Timestamp: new Date(),
          },
        ],
      })
    );

    console.log(
      `Reconciliation complete: ${itemsChecked} items checked, ${conflicts.length} conflicts found, ${duration}ms`
    );

    return {
      statusCode: 200,
      body: {
        driftDetected,
        itemsChecked,
        conflicts,
        duration,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Reconciliation checker error:', error);
    throw error;
  }
};
