const AWS = require('aws-sdk');
const redis = require('redis');

// Initialize AWS clients
const dynamodb = new AWS.DynamoDB.DocumentClient();
const eventBridge = new AWS.EventBridge();

// Redis client configuration
let redisClient = null;

// Initialize Redis connection
async function getRedisClient() {
  if (!redisClient) {
    const redisEndpoint = process.env.REDIS_ENDPOINT;
    const redisPort = process.env.REDIS_PORT || 6379;
    
    redisClient = redis.createClient({
      host: redisEndpoint,
      port: redisPort
    });
    
    await new Promise((resolve, reject) => {
      redisClient.on('ready', resolve);
      redisClient.on('error', reject);
    });
  }
  return redisClient;
}

// Main Lambda handler
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    const httpMethod = event.httpMethod;
    const path = event.path;
    
    // Handle GET /search - retrieve search results
    if (httpMethod === 'GET' && path === '/search') {
      return await handleSearchGet(event);
    }
    
    // Handle POST /search - create new search
    if (httpMethod === 'POST' && path === '/search') {
      return await handleSearchPost(event);
    }
    
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ message: 'Not Found' })
    };
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        message: 'Internal Server Error',
        error: error.message 
      })
    };
  }
};

// Handle GET request - retrieve search by query
async function handleSearchGet(event) {
  const query = event.queryStringParameters?.query;
  
  if (!query) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Query parameter is required' })
    };
  }
  
  // Try to get from cache first
  try {
    const client = await getRedisClient();
    const cachedResult = await new Promise((resolve, reject) => {
      client.get(`search:${query}`, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
    
    if (cachedResult) {
      console.log('Cache hit for query:', query);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'cache',
          data: JSON.parse(cachedResult)
        })
      };
    }
  } catch (cacheError) {
    console.warn('Cache error:', cacheError);
  }
  
  // Query DynamoDB
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    IndexName: 'QueryIndex',
    KeyConditionExpression: '#query = :query',
    ExpressionAttributeNames: {
      '#query': 'query'
    },
    ExpressionAttributeValues: {
      ':query': query
    }
  };
  
  const result = await dynamodb.query(params).promise();
  
  // Cache the result
  try {
    const client = await getRedisClient();
    await new Promise((resolve, reject) => {
      client.setex(`search:${query}`, 3600, JSON.stringify(result.Items), (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch (cacheError) {
    console.warn('Failed to cache result:', cacheError);
  }
  
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'database',
      data: result.Items
    })
  };
}

// Handle POST request - create new search entry
async function handleSearchPost(event) {
  const body = JSON.parse(event.body || '{}');
  const { query, results } = body;
  
  if (!query || !results) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Query and results are required' })
    };
  }
  
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Store in DynamoDB
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      id,
      query,
      results,
      timestamp: new Date().toISOString()
    }
  };
  
  await dynamodb.put(params).promise();
  
  // Invalidate cache for this query
  try {
    const client = await getRedisClient();
    await new Promise((resolve, reject) => {
      client.del(`search:${query}`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch (cacheError) {
    console.warn('Failed to invalidate cache:', cacheError);
  }
  
  // Send event to EventBridge
  try {
    await eventBridge.putEvents({
      Entries: [{
        Source: process.env.APP_NAME || 'search-api',
        DetailType: 'SearchPerformed',
        Detail: JSON.stringify({
          query,
          id,
          timestamp: new Date().toISOString()
        }),
        EventBusName: process.env.EVENT_BUS_NAME
      }]
    }).promise();
  } catch (eventError) {
    console.warn('Failed to send event:', eventError);
  }
  
  return {
    statusCode: 201,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Search created successfully',
      id,
      query
    })
  };
}
