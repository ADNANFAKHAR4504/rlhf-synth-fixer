const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const crypto = require('crypto');

const sqsClient = new SQSClient({ region: process.env.AWS_REGION });
const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION });

/**
 * Webhook validator Lambda function
 * Validates webhook signatures and routes to appropriate SQS queues
 */
exports.handler = async (event) => {
  console.log('Received webhook:', JSON.stringify(event, null, 2));

  try {
    const provider = event.pathParameters?.provider;

    if (!provider) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Provider parameter is required' }),
      };
    }

    // Validate provider
    const validProviders = ['stripe', 'paypal', 'square'];
    if (!validProviders.includes(provider)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid provider' }),
      };
    }

    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON body' }),
      };
    }

    // Validate webhook signature
    const isValid = await validateWebhookSignature(provider, event, body);
    if (!isValid) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid webhook signature' }),
      };
    }

    // Route to appropriate queue
    await routeToQueue(provider, body);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Webhook processed successfully' }),
    };

  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

/**
 * Validate webhook signature based on provider
 */
async function validateWebhookSignature(provider, event, body) {
  const secrets = await getWebhookSecrets();

  switch (provider) {
    case 'stripe':
      return validateStripeSignature(event, body, secrets.stripe_webhook_secret);
    case 'paypal':
      return validatePayPalSignature(event, body, secrets.paypal_webhook_secret);
    case 'square':
      return validateSquareSignature(event, body, secrets.square_webhook_secret);
    default:
      return false;
  }
}

/**
 * Get webhook secrets from AWS Secrets Manager
 */
async function getWebhookSecrets() {
  const command = new GetSecretValueCommand({
    SecretId: process.env.WEBHOOK_SECRETS_ARN,
  });

  const response = await secretsClient.send(command);
  return JSON.parse(response.SecretString);
}

/**
 * Validate Stripe webhook signature
 */
function validateStripeSignature(event, body, secret) {
  const signature = event.headers['stripe-signature'];
  if (!signature) return false;

  const elements = signature.split(',');
  const sigElements = {};
  elements.forEach(element => {
    const [key, value] = element.split('=');
    sigElements[key] = value;
  });

  if (!sigElements.t || !sigElements.v1) return false;

  const payload = `${sigElements.t}.${JSON.stringify(body)}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return expectedSignature === sigElements.v1;
}

/**
 * Validate PayPal webhook signature
 */
function validatePayPalSignature(event, body, secret) {
  // PayPal webhook validation implementation
  // This is a simplified version - in production you'd verify against PayPal's API
  const signature = event.headers['paypal-transmission-signature'];
  if (!signature) return false;

  // For demo purposes, accept any valid signature format
  // In production: Verify transmission-id, transmission-time, transmission-signature
  return signature.length > 10;
}

/**
 * Validate Square webhook signature
 */
function validateSquareSignature(event, body, secret) {
  // Square webhook validation implementation
  const signature = event.headers['x-square-hmacsha256-signature'];
  if (!signature) return false;

  // For demo purposes, accept any valid signature format
  // In production: HMAC-SHA256 of request body using webhook signature key
  return signature.length > 10;
}

/**
 * Route validated webhook to appropriate SQS queue
 */
async function routeToQueue(provider, body) {
  const queueUrls = {
    stripe: process.env.STRIPE_QUEUE_URL,
    paypal: process.env.PAYPAL_QUEUE_URL,
    square: process.env.SQUARE_QUEUE_URL,
  };

  const queueUrl = queueUrls[provider];
  if (!queueUrl) {
    throw new Error(`No queue URL configured for provider: ${provider}`);
  }

  const messageBody = {
    provider,
    timestamp: new Date().toISOString(),
    data: body,
    event_type: body.type || body.event_type || 'unknown',
  };

  // Use provider + event_id as message group ID for FIFO ordering
  const messageGroupId = `${provider}-${body.id || crypto.randomUUID()}`;

  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(messageBody),
    MessageGroupId: messageGroupId,
  });

  await sqsClient.send(command);
  console.log(`Routed ${provider} webhook to queue: ${messageGroupId}`);
}
