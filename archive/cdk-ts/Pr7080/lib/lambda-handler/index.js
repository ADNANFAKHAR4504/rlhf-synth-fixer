// AWS SDK v3 clients are required lazily so unit tests can inject mocks
// via globalThis.__AWS_MOCKS__ without triggering dynamic imports that
// Jest may not support in this environment.

let ssmClient;
let dynamo;

function initAwsClientsIfNeeded() {
  if (ssmClient && dynamo) return;
  if (globalThis && globalThis.__AWS_MOCKS__) {
    // Tests may provide stubbed clients here
    ssmClient = globalThis.__AWS_MOCKS__.ssmClient;
    dynamo = globalThis.__AWS_MOCKS__.dynamo;
    // Allow tests to provide command constructors (or fall back to passthrough)
    initAwsClientsIfNeeded.PutCommand =
      globalThis.__AWS_MOCKS__.PutCommand ||
      function PutCommand(input) { this.input = input; };
    /* istanbul ignore next - maintained for potential future read flows */
    initAwsClientsIfNeeded.GetCommand =
      globalThis.__AWS_MOCKS__.GetCommand ||
      function GetCommand(input) { this.input = input; };
    initAwsClientsIfNeeded.GetParameterCommand =
      globalThis.__AWS_MOCKS__.GetParameterCommand ||
      function GetParameterCommand(input) { this.input = input; };
    return;
  }
  // Lazily require the AWS SDK v3 modules only when running for real
  const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
  const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
  const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

  ssmClient = new SSMClient({});
  const ddbClient = new DynamoDBClient({});
  dynamo = DynamoDBDocumentClient.from(ddbClient);
  // expose constructors for local use (not used in lambda flow)
  initAwsClientsIfNeeded.PutCommand = PutCommand;
  initAwsClientsIfNeeded.GetCommand = GetCommand;
  initAwsClientsIfNeeded.GetParameterCommand = GetParameterCommand;
}

// Simple event processor: on POST /items this function writes an item to DynamoDB
// and uses a configuration parameter from SSM to augment the item.
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event));

  const now = new Date().toISOString();

  // Read config parameter (non-blocking if missing)
  let config = {};
  try {
    initAwsClientsIfNeeded();
    const paramName = process.env.CONFIG_PARAMETER_NAME;
    if (paramName) {
      const cmd = new (initAwsClientsIfNeeded.GetParameterCommand)({ Name: paramName });
      const res = await ssmClient.send(cmd);
      config = JSON.parse((res.Parameter && res.Parameter.Value) || '{}');
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
  initAwsClientsIfNeeded();
  const tableName = process.env.TABLE_NAME || 'local-test-table';
  const put = new (initAwsClientsIfNeeded.PutCommand)({ TableName: tableName, Item: item });
  await dynamo.send(put);
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
