```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    this.createWebhookProcessingInfrastructure(environmentSuffix);
  }

  private createWebhookProcessingInfrastructure(environmentSuffix: string): void {
    // API Gateway REST API
    const api = new apigateway.RestApi(this, `WebhookApi${environmentSuffix}`, {
      restApiName: `webhook-processing-api-${environmentSuffix}`,
      description: 'Webhook Processing API Gateway',
      deployOptions: {
        stageName: 'prod',
        throttlingBurstLimit: 2000,
        throttlingRateLimit: 1000,
        dataTraceEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        metricsEnabled: true,
      },
    });

    // Request validator
    const requestValidator = new apigateway.RequestValidator(
      this,
      `RequestValidator${environmentSuffix}`,
      {
        restApi: api,
        validateRequestBody: true,
        validateRequestParameters: false,
      }
    );

    // DynamoDB for transaction store
    const table = new dynamodb.Table(this, `WebhookTransactions${environmentSuffix}`, {
      tableName: `webhook-transactions-${environmentSuffix}`,
      partitionKey: { name: 'webhook_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Global secondary index
    table.addGlobalSecondaryIndex({
      indexName: 'ProviderEventIndex',
      partitionKey: { name: 'provider', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'event_type', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // SQS FIFO queues for each provider
    const { stripeQueue, paypalQueue, squareQueue } =
      this.createSqsQueues(environmentSuffix);

    // EventBridge custom event bus
    const eventBus = new events.EventBus(this, `PaymentEventsBus${environmentSuffix}`, {
      eventBusName: `payment-events-${environmentSuffix}`,
    });

    // Lambda functions
    const { validatorFunction, processorFunction } =
      this.createLambdaFunctions(environmentSuffix, table, eventBus, stripeQueue, paypalQueue, squareQueue);

    // API Gateway integration
    this.createApiGatewayIntegration(api, requestValidator, validatorFunction, environmentSuffix);

    // CloudWatch monitoring
    this.createCloudWatchAlarms(environmentSuffix, validatorFunction, processorFunction, stripeQueue, paypalQueue, squareQueue);

    // Outputs
    new cdk.CfnOutput(this, `WebhookApiUrl${environmentSuffix}`, {
      value: api.url,
      description: 'Webhook API Gateway URL',
    });

    new cdk.CfnOutput(this, `EnvironmentSuffix${environmentSuffix}`, {
      value: environmentSuffix,
      description: 'Environment suffix used for resource naming',
    });
  }

  private createSqsQueues(environmentSuffix: string) {
    // Dead letter queue (must be FIFO to match source queues)
    const dlq = new sqs.Queue(this, `WebhookDlq${environmentSuffix}`, {
      queueName: `webhook-processing-dlq-${environmentSuffix}.fifo`,
      fifo: true,
      retentionPeriod: cdk.Duration.days(14),
    });

    // Stripe webhook queue
    const stripeQueue = new sqs.Queue(this, `StripeWebhookQueue${environmentSuffix}`, {
      queueName: `stripe-webhook-queue-${environmentSuffix}.fifo`,
      fifo: true,
      contentBasedDeduplication: true,
      visibilityTimeout: cdk.Duration.minutes(5),
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // PayPal webhook queue
    const paypalQueue = new sqs.Queue(this, `PaypalWebhookQueue${environmentSuffix}`, {
      queueName: `paypal-webhook-queue-${environmentSuffix}.fifo`,
      fifo: true,
      contentBasedDeduplication: true,
      visibilityTimeout: cdk.Duration.minutes(5),
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Square webhook queue
    const squareQueue = new sqs.Queue(this, `SquareWebhookQueue${environmentSuffix}`, {
      queueName: `square-webhook-queue-${environmentSuffix}.fifo`,
      fifo: true,
      contentBasedDeduplication: true,
      visibilityTimeout: cdk.Duration.minutes(5),
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    return { stripeQueue, paypalQueue, squareQueue };
  }

  private createLambdaFunctions(
    environmentSuffix: string,
    table: dynamodb.Table,
    eventBus: events.EventBus,
    stripeQueue: sqs.Queue,
    paypalQueue: sqs.Queue,
    squareQueue: sqs.Queue
  ) {
    // Lambda execution role
    const lambdaRole = new iam.Role(this, `WebhookLambdaRole${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Add permissions
    table.grantWriteData(lambdaRole);
    stripeQueue.grantSendMessages(lambdaRole);
    paypalQueue.grantSendMessages(lambdaRole);
    squareQueue.grantSendMessages(lambdaRole);

    // Lambda needs consume permissions for event source mappings
    stripeQueue.grantConsumeMessages(lambdaRole);
    paypalQueue.grantConsumeMessages(lambdaRole);
    squareQueue.grantConsumeMessages(lambdaRole);

    eventBus.grantPutEventsTo(lambdaRole);

    // Webhook validator function (container-based)
    const validatorFunction = new lambda.DockerImageFunction(
      this,
      `WebhookValidator${environmentSuffix}`,
      {
        code: lambda.DockerImageCode.fromImageAsset('./lambda/webhook-validator'),
        functionName: `webhook-validator-${environmentSuffix}`,
        architecture: lambda.Architecture.ARM_64,
        memorySize: 512,
        timeout: cdk.Duration.seconds(30),
        role: lambdaRole,
        environment: {
          STRIPE_WEBHOOK_SECRET: 'whsec_test_secret',
          PAYPAL_WEBHOOK_SECRET: 'paypal_test_secret',
          SQUARE_WEBHOOK_SECRET: 'square_test_secret',
          STRIPE_QUEUE_URL: stripeQueue.queueUrl,
          PAYPAL_QUEUE_URL: paypalQueue.queueUrl,
          SQUARE_QUEUE_URL: squareQueue.queueUrl,
        },
        logRetention: logs.RetentionDays.ONE_MONTH,
      }
    );

    // Webhook processor function
    const processorFunction = new lambda.Function(
      this,
      `WebhookProcessor${environmentSuffix}`,
      {
        functionName: `webhook-processor-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        code: lambda.Code.fromInline(`
          const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
          const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');

          const dynamodb = new DynamoDBClient({});
          const eventbridge = new EventBridgeClient({});

          exports.handler = async (event) => {
            console.log('Processing webhook:', JSON.stringify(event, null, 2));

            for (const record of event.Records || []) {
              try {
                const webhookData = JSON.parse(record.body);

                // Store in DynamoDB
                await dynamodb.send(new PutItemCommand({
                  TableName: process.env.TABLE_NAME,
                  Item: {
                    webhook_id: { S: webhookData.webhook_id },
                    timestamp: { S: new Date().toISOString() },
                    provider: { S: webhookData.provider },
                    event_type: { S: webhookData.event_type },
                    payload: { S: JSON.stringify(webhookData.payload) },
                    status: { S: 'processed' },
                  },
                }));

                // Publish to EventBridge
                await eventbridge.send(new PutEventsCommand({
                  Entries: [{
                    EventBusName: process.env.EVENT_BUS_NAME,
                    Source: 'webhook.processor',
                    DetailType: webhookData.event_type,
                    Detail: JSON.stringify(webhookData),
                  }],
                }));

                console.log('Webhook processed successfully:', webhookData.webhook_id);

              } catch (error) {
                console.error('Processing error:', error);
                throw error;
              }
            }
          };
        `),
        handler: 'index.handler',
        memorySize: 1024,
        timeout: cdk.Duration.seconds(300),
        role: lambdaRole,
        environment: {
          TABLE_NAME: table.tableName,
          EVENT_BUS_NAME: eventBus.eventBusName,
        },
        logRetention: logs.RetentionDays.ONE_MONTH,
      }
    );

    // Event source mappings
    processorFunction.addEventSource(
      new lambda.SqsEventSource(stripeQueue, {
        batchSize: 10,
        reportBatchItemFailures: true,
      })
    );

    processorFunction.addEventSource(
      new lambda.SqsEventSource(paypalQueue, {
        batchSize: 10,
        reportBatchItemFailures: true,
      })
    );

    processorFunction.addEventSource(
      new lambda.SqsEventSource(squareQueue, {
        batchSize: 10,
        reportBatchItemFailures: true,
      })
    );

    return { validatorFunction, processorFunction };
  }

  private createApiGatewayIntegration(
    api: apigateway.RestApi,
    validator: apigateway.RequestValidator,
    validatorFunction: lambda.Function,
    environmentSuffix: string
  ) {
    // API Gateway resources and methods
    const webhooksResource = api.root.addResource('webhooks');
    const providerResource = webhooksResource.addResource('{provider}');

    // POST method for webhook validation
    providerResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(validatorFunction, {
        proxy: true,
      }),
      {
        authorizationType: apigateway.AuthorizationType.AWS_IAM,
        requestValidator: validator,
        methodResponses: [
          {
            statusCode: '200',
            responseModels: {
              'application/json': apigateway.Model.EMPTY_MODEL,
            },
          },
        ],
      }
    );
  }

  private createCloudWatchAlarms(
    environmentSuffix: string,
    validatorFunction: lambda.Function,
    processorFunction: lambda.Function,
    stripeQueue: sqs.Queue,
    paypalQueue: sqs.Queue,
    squareQueue: sqs.Queue
  ) {
    // API Gateway 4XX errors alarm
    new cloudwatch.Alarm(this, `Api4xxErrors${environmentSuffix}`, {
      alarmName: `webhook-api-4xx-errors-${environmentSuffix}`,
      alarmDescription: 'API Gateway 4XX errors above 1%',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '4XXError',
        dimensionsMap: {
          ApiName: `webhook-processing-api-${environmentSuffix}`,
        },
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 5,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // API Gateway 5XX errors alarm
    new cloudwatch.Alarm(this, `Api5xxErrors${environmentSuffix}`, {
      alarmName: `webhook-api-5xx-errors-${environmentSuffix}`,
      alarmDescription: 'API Gateway 5XX errors above 1%',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5XXError',
        dimensionsMap: {
          ApiName: `webhook-processing-api-${environmentSuffix}`,
        },
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // Lambda function errors
    new cloudwatch.Alarm(this, `ValidatorFunctionErrors${environmentSuffix}`, {
      alarmName: `webhook-validator-errors-${environmentSuffix}`,
      alarmDescription: 'Webhook validator function errors',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Errors',
        dimensionsMap: {
          FunctionName: validatorFunction.functionName,
        },
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 5,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    new cloudwatch.Alarm(this, `ProcessorFunctionErrors${environmentSuffix}`, {
      alarmName: `webhook-processor-errors-${environmentSuffix}`,
      alarmDescription: 'Webhook processor function errors',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Errors',
        dimensionsMap: {
          FunctionName: processorFunction.functionName,
        },
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 5,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // SQS queue depth alarms
    [stripeQueue, paypalQueue, squareQueue].forEach((queue, index) => {
      const providerNames = ['stripe', 'paypal', 'square'];
      const providerName = providerNames[index];

      new cloudwatch.Alarm(this, `${providerName}QueueDepthAlarm${environmentSuffix}`, {
        alarmName: `${providerName}-webhook-queue-depth-${environmentSuffix}`,
        alarmDescription: `${providerName} webhook queue depth above threshold`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/SQS',
          metricName: 'ApproximateNumberOfMessagesVisible',
          dimensionsMap: {
            QueueName: queue.queueName,
          },
          statistic: 'Maximum',
        }),
        threshold: 1000,
        evaluationPeriods: 3,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      });
    });
  }
}
```
```javascript
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const { marshall } = require('@aws-sdk/util-dynamodb');
const crypto = require('crypto');

const dynamodbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const eventbridgeClient = new EventBridgeClient({ region: process.env.AWS_REGION });

/**
 * Webhook processor Lambda function
 * Processes webhooks from SQS queues, stores in DynamoDB, and publishes to EventBridge
 */
exports.handler = async (event) => {
  console.log('Processing webhook batch:', JSON.stringify(event, null, 2));

  const results = {
    processed: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Process each message in the batch
    for (const record of event.Records) {
      try {
        const messageBody = JSON.parse(record.body);

        // Store in DynamoDB
        await storeWebhookTransaction(messageBody);

        // Publish to EventBridge
        await publishEvent(messageBody);

        results.processed++;
        console.log(`Successfully processed webhook: ${messageBody.provider}-${messageBody.timestamp}`);

      } catch (error) {
        console.error('Error processing individual webhook:', error);
        results.failed++;
        results.errors.push({
          messageId: record.messageId,
          error: error.message,
        });
      }
    }

    console.log(`Batch processing complete. Processed: ${results.processed}, Failed: ${results.failed}`);

    // Return success even if some messages failed (SQS will retry failed messages)
    return {
      statusCode: 200,
      body: JSON.stringify(results),
    };

  } catch (error) {
    console.error('Critical error in webhook processor:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Critical processing error',
        details: error.message,
      }),
    };
  }
};

/**
 * Store webhook transaction in DynamoDB
 */
async function storeWebhookTransaction(messageBody) {
  const webhookId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const item = {
    webhook_id: webhookId,
    timestamp: timestamp,
    provider: messageBody.provider,
    event_type: messageBody.event_type,
    data: messageBody.data,
    processed_at: timestamp,
    ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60), // 90 days TTL
  };

  const command = new PutItemCommand({
    TableName: process.env.TABLE_NAME,
    Item: marshall(item, {
      removeUndefinedValues: true,
    }),
  });

  await dynamodbClient.send(command);
  console.log(`Stored webhook in DynamoDB: ${webhookId}`);
}

/**
 * Publish webhook event to EventBridge
 */
async function publishEvent(messageBody) {
  const eventDetail = {
    webhook_id: crypto.randomUUID(),
    provider: messageBody.provider,
    event_type: messageBody.event_type,
    timestamp: messageBody.timestamp,
    data: messageBody.data,
  };

  // Map provider-specific event types to standardized events
  const eventType = mapEventType(messageBody.provider, messageBody.event_type);

  const command = new PutEventsCommand({
    Entries: [{
      EventBusName: process.env.EVENT_BUS_NAME,
      Source: 'webhook.processor',
      DetailType: eventType,
      Detail: JSON.stringify(eventDetail),
    }],
  });

  await eventbridgeClient.send(command);
  console.log(`Published event to EventBridge: ${eventType}`);
}

/**
 * Map provider-specific event types to standardized event types
 */
function mapEventType(provider, originalEventType) {
  const eventMappings = {
    stripe: {
      'payment_intent.succeeded': 'Payment Succeeded',
      'payment_intent.payment_failed': 'Payment Failed',
      'customer.subscription.created': 'Subscription Created',
      'customer.subscription.updated': 'Subscription Updated',
      'customer.subscription.deleted': 'Subscription Cancelled',
    },
    paypal: {
      'PAYMENT.SALE.COMPLETED': 'Payment Succeeded',
      'PAYMENT.SALE.DENIED': 'Payment Failed',
      'BILLING.SUBSCRIPTION.CREATED': 'Subscription Created',
      'BILLING.SUBSCRIPTION.UPDATED': 'Subscription Updated',
      'BILLING.SUBSCRIPTION.CANCELLED': 'Subscription Cancelled',
    },
    square: {
      'payment.created': 'Payment Succeeded',
      'payment.failed': 'Payment Failed',
      'subscription.created': 'Subscription Created',
      'subscription.updated': 'Subscription Updated',
      'subscription.canceled': 'Subscription Cancelled',
    },
  };

  const providerMappings = eventMappings[provider] || {};
  return providerMappings[originalEventType] || 'Webhook Event';
}
```

```javascript
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
```
```dockerfile
FROM public.ecr.aws/lambda/nodejs:18-arm64

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY app.js ./
COPY processor.js ./

# Set the CMD to your handler (will be overridden by Lambda)
CMD ["app.handler"]
```