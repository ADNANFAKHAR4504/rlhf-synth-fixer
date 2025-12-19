/**
 * Unified Webhook Handler - OPTIMIZED VERSION
 *
 * This is the consolidated handler that replaces three separate Lambda functions:
 * - webhook-receiver
 * - webhook-validator
 * - webhook-processor
 *
 * Routes requests based on the path and handles all webhook operations.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sqsClient = new SQSClient({ region: process.env.AWS_REGION || 'us-east-1' });

const TABLE_NAME = process.env.TABLE_NAME;
const DLQ_URL = process.env.DLQ_URL;

/**
 * Main Lambda handler with routing logic
 */
exports.handler = async (event, context) => {
  console.log('Event received:', JSON.stringify(event, null, 2));

  try {
    // Extract route from API Gateway event
    const path = event.rawPath || event.path || '';
    const httpMethod = event.requestContext?.http?.method || event.httpMethod || 'POST';

    // Route to appropriate handler
    if (path.includes('/receive') || path.includes('/receiver')) {
      return await handleReceive(event);
    } else if (path.includes('/validate') || path.includes('/validator')) {
      return await handleValidate(event);
    } else if (path.includes('/process') || path.includes('/processor')) {
      return await handleProcess(event);
    } else {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Route not found' })
      };
    }
  } catch (error) {
    console.error('Error processing webhook:', error);

    // Send to DLQ if configured
    if (DLQ_URL) {
      try {
        await sqsClient.send(new SendMessageCommand({
          QueueUrl: DLQ_URL,
          MessageBody: JSON.stringify({
            error: error.message,
            event: event,
            timestamp: new Date().toISOString()
          })
        }));
      } catch (dlqError) {
        console.error('Failed to send to DLQ:', dlqError);
      }
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};

/**
 * Handle webhook reception
 */
async function handleReceive(event) {
  const body = JSON.parse(event.body || '{}');
  const webhookId = body.webhookId || `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = Date.now();

  // Store webhook data in DynamoDB
  const item = {
    webhookId,
    timestamp,
    status: 'received',
    payload: body,
    receivedAt: new Date().toISOString(),
    source: event.requestContext?.http?.sourceIp || 'unknown'
  };

  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: item
  }));

  console.log(`Webhook received and stored: ${webhookId}`);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Webhook received successfully',
      webhookId,
      timestamp
    })
  };
}

/**
 * Handle webhook validation
 */
async function handleValidate(event) {
  const body = JSON.parse(event.body || '{}');
  const webhookId = body.webhookId;

  if (!webhookId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'webhookId is required' })
    };
  }

  // Retrieve webhook from DynamoDB
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { webhookId, timestamp: body.timestamp }
  }));

  if (!result.Item) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Webhook not found', valid: false })
    };
  }

  // Perform validation
  const isValid = result.Item.payload &&
                  typeof result.Item.payload === 'object' &&
                  result.Item.status === 'received';

  // Update status
  if (isValid) {
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...result.Item,
        status: 'validated',
        validatedAt: new Date().toISOString()
      }
    }));
  }

  console.log(`Webhook validated: ${webhookId}, valid: ${isValid}`);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      webhookId,
      valid: isValid,
      status: isValid ? 'validated' : 'invalid'
    })
  };
}

/**
 * Handle webhook processing
 */
async function handleProcess(event) {
  const body = JSON.parse(event.body || '{}');
  const webhookId = body.webhookId;

  if (!webhookId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'webhookId is required' })
    };
  }

  // Retrieve webhook from DynamoDB
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { webhookId, timestamp: body.timestamp }
  }));

  if (!result.Item) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Webhook not found' })
    };
  }

  // Process the webhook
  const processed = {
    ...result.Item,
    status: 'processed',
    processedAt: new Date().toISOString(),
    processingResult: {
      success: true,
      actions: ['stored', 'validated', 'processed'],
      completedAt: new Date().toISOString()
    }
  };

  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: processed
  }));

  console.log(`Webhook processed: ${webhookId}`);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Webhook processed successfully',
      webhookId,
      status: 'processed',
      result: processed.processingResult
    })
  };
}
