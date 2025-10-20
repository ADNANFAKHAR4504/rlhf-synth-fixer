const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const ssm = new AWS.SSM();

// Simple event processor: on POST /items this function writes an item to DynamoDB
// and uses a configuration parameter from SSM to augment the item.
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event));

  const now = new Date().toISOString();

  // Read config parameter (non-blocking if missing)
  let config = {};
  try {
    const paramName = process.env.CONFIG_PARAMETER_NAME;
    if (paramName) {
      const res = await ssm.getParameter({ Name: paramName }).promise();
      config = JSON.parse(res.Parameter.Value || '{}');
    }
  } catch (err) {
    console.warn('Unable to read config parameter:', err.message || err);
  }

  // Parse body for API Gateway proxy integration
  let body = {};
  try {
    body = typeof event.body === 'string' ? JSON.parse(event.body) : (event.body || {});
  } catch (err) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  // Minimal validation
  if (!body || !body.id) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing required field: id' }),
    };
  }

  const item = {
    id: body.id,
    payload: body.payload || null,
    receivedAt: now,
    environment: process.env.ENV || 'dev',
    configVersion: config.apiVersion || 'unknown',
  };

  try {
    // Use a safe fallback table name in local/test environments so unit tests
    // that don't set the environment variable don't fail due to SDK param
    // validation. In real deployments TABLE_NAME must be set by the stack.
    const tableName = process.env.TABLE_NAME || 'local-test-table';
    await dynamo.put({ TableName: tableName, Item: item }).promise();
  } catch (err) {
    console.error('DynamoDB put error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }

  return {
    statusCode: 201,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Item stored', item }),
  };
};

