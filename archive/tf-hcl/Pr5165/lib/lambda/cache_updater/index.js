const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager');
const Redis = require('ioredis');

const secretsClient = new SecretsManagerClient({});
const REDIS_ENDPOINT = process.env.REDIS_ENDPOINT;
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_AUTH_SECRET_ARN = process.env.REDIS_AUTH_SECRET_ARN;
const REDIS_TTL = parseInt(process.env.REDIS_TTL || '3600', 10);

let redisClient = null;
let authToken = null;

/**
 * Get Redis auth token from Secrets Manager
 */
async function getAuthToken() {
  if (authToken) return authToken;

  try {
    const response = await secretsClient.send(
      new GetSecretValueCommand({
        SecretId: REDIS_AUTH_SECRET_ARN,
      })
    );
    authToken = response.SecretString;
    return authToken;
  } catch (error) {
    console.error('Failed to get Redis auth token:', error);
    throw error;
  }
}

/**
 * Initialize Redis client
 */
async function getRedisClient() {
  if (redisClient && redisClient.status === 'ready') {
    return redisClient;
  }

  const token = await getAuthToken();

  redisClient = new Redis({
    host: REDIS_ENDPOINT,
    port: REDIS_PORT,
    password: token,
    tls: {},
    retryStrategy: times => {
      if (times > 3) return null;
      return Math.min(times * 200, 1000);
    },
  });

  return redisClient;
}

/**
 * Cache Updater Lambda
 * Updates Redis cache when DynamoDB inventory changes
 * SLA Target: Cache updated in <1s P95 after DynamoDB change
 */
exports.handler = async event => {
  console.log(
    'DynamoDB Stream event received:',
    JSON.stringify(event, null, 2)
  );

  const redis = await getRedisClient();
  const cacheUpdates = [];

  try {
    for (const record of event.Records) {
      const { eventName, dynamodb } = record;

      // Process INSERT and MODIFY events
      if (eventName === 'INSERT' || eventName === 'MODIFY') {
        const newImage = dynamodb.NewImage;

        if (!newImage || !newImage.booking_key || !newImage.booking_key.S) {
          console.log('Skipping record without booking_key');
          continue;
        }

        const bookingKey = newImage.booking_key.S;
        const [propertyId, roomId, date] = bookingKey.split('#');

        // Build cache object
        const cacheData = {
          propertyId,
          roomId,
          date,
          availableUnits: newImage.available_units
            ? parseInt(newImage.available_units.N, 10)
            : 0,
          reservedUnits: newImage.reserved_units
            ? parseInt(newImage.reserved_units.N, 10)
            : 0,
          version: newImage.version ? parseInt(newImage.version.N, 10) : 0,
          lastUpdated: new Date().toISOString(),
        };

        // Cache key format: hotel:{propertyId}:room:{roomId}:date:{date}
        const cacheKey = `hotel:${propertyId}:room:${roomId}:date:${date}`;

        // Update Redis cache with TTL
        await redis.setex(cacheKey, REDIS_TTL, JSON.stringify(cacheData));

        cacheUpdates.push({ cacheKey, action: 'updated' });
        console.log(`Cache updated: ${cacheKey}`);

        // Also update property-level availability index
        const propertyKey = `property:${propertyId}:availability:${date}`;
        await redis.zadd(
          propertyKey,
          cacheData.availableUnits,
          `${roomId}:${cacheData.availableUnits}`
        );
        await redis.expire(propertyKey, REDIS_TTL);
      } else if (eventName === 'REMOVE') {
        // Handle deletions (TTL expiration, etc.)
        const oldImage = dynamodb.OldImage;
        if (oldImage && oldImage.booking_key && oldImage.booking_key.S) {
          const bookingKey = oldImage.booking_key.S;
          const [propertyId, roomId, date] = bookingKey.split('#');
          const cacheKey = `hotel:${propertyId}:room:${roomId}:date:${date}`;

          await redis.del(cacheKey);
          cacheUpdates.push({ cacheKey, action: 'deleted' });
          console.log(`Cache deleted: ${cacheKey}`);
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        recordsProcessed: event.Records.length,
        cacheUpdates,
      }),
    };
  } catch (error) {
    console.error('Cache updater error:', error);
    throw error; // Let Lambda retry
  }
};
