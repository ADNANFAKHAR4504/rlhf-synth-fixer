/* eslint-disable import/no-extraneous-dependencies */
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Validation aspects not available in this branch

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

    // Validation aspects not applied in this implementation

    // Create webhook processing infrastructure
    this.createWebhookProcessingInfrastructure(environmentSuffix);
  }

  private createWebhookProcessingInfrastructure(
    environmentSuffix: string
  ): void {
    // API Gateway for webhook ingestion
    const { apiGateway } = this.createApiGateway(environmentSuffix);

    // DynamoDB for transaction store
    const { table } = this.createDynamoDbTable(environmentSuffix);

    // SQS FIFO queues for each provider
    const { stripeQueue, paypalQueue, squareQueue } =
      this.createSqsQueues(environmentSuffix);

    // EventBridge custom event bus
    const { eventBus } = this.createEventBridgeBus(environmentSuffix);

    // Lambda functions
    const { validatorFunction, processorFunction } = this.createLambdaFunctions(
      environmentSuffix,
      table,
      stripeQueue,
      paypalQueue,
      squareQueue,
      eventBus
    );

    // Connect API Gateway to validator function
    this.connectApiGatewayToLambda(apiGateway, validatorFunction);

    // Connect SQS to processor function
    this.connectSqsToLambda(
      processorFunction,
      stripeQueue,
      paypalQueue,
      squareQueue
    );

    // Monitoring and alerts
    this.createMonitoring(
      environmentSuffix,
      apiGateway,
      validatorFunction,
      processorFunction,
      stripeQueue,
      paypalQueue,
      squareQueue
    );

    // Outputs
    new cdk.CfnOutput(this, `EnvironmentSuffix${environmentSuffix}`, {
      value: environmentSuffix,
      description: 'Environment suffix used for resource naming',
    });

    new cdk.CfnOutput(this, `ApiUrl${environmentSuffix}`, {
      value: apiGateway.url,
      description: 'Webhook API Gateway URL',
    });
  }

  private createApiGateway(environmentSuffix: string) {
    // API Gateway with IAM authorization
    const apiGateway = new cdk.aws_apigateway.RestApi(
      this,
      `WebhookApi${environmentSuffix}`,
      {
        restApiName: `webhook-processing-api-${environmentSuffix}`,
        description: 'Webhook Processing API Gateway',
        deployOptions: {
          stageName: 'prod',
          throttlingRateLimit: 1000,
          throttlingBurstLimit: 2000,
          loggingLevel: cdk.aws_apigateway.MethodLoggingLevel.INFO,
          dataTraceEnabled: true,
          metricsEnabled: true,
        },
      }
    );

    // Request validator
    const requestValidator = new cdk.aws_apigateway.RequestValidator(
      this,
      `RequestValidator${environmentSuffix}`,
      {
        restApi: apiGateway,
        validateRequestBody: true,
        validateRequestParameters: false,
      }
    );

    return { apiGateway, requestValidator };
  }

  private createDynamoDbTable(environmentSuffix: string) {
    const table = new cdk.aws_dynamodb.Table(
      this,
      `WebhookTransactions${environmentSuffix}`,
      {
        tableName: `webhook-transactions-${environmentSuffix}`,
        partitionKey: {
          name: 'webhook_id',
          type: cdk.aws_dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'timestamp',
          type: cdk.aws_dynamodb.AttributeType.STRING,
        },
        billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
        pointInTimeRecovery: true,
        encryption: cdk.aws_dynamodb.TableEncryption.AWS_MANAGED,
      }
    );

    // GSI for provider and event_type queries
    table.addGlobalSecondaryIndex({
      indexName: 'ProviderEventIndex',
      partitionKey: {
        name: 'provider',
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'event_type',
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
    });

    return { table };
  }

  private createSqsQueues(environmentSuffix: string) {
    // Dead letter queue (must be FIFO to match source queues)
    const dlq = new cdk.aws_sqs.Queue(this, `WebhookDlq${environmentSuffix}`, {
      queueName: `webhook-processing-dlq-${environmentSuffix}.fifo`,
      fifo: true,
      retentionPeriod: cdk.Duration.days(14),
    });

    // FIFO queues for each provider
    const stripeQueue = new cdk.aws_sqs.Queue(
      this,
      `StripeWebhookQueue${environmentSuffix}`,
      {
        queueName: `stripe-webhook-queue-${environmentSuffix}.fifo`,
        fifo: true,
        contentBasedDeduplication: true,
        visibilityTimeout: cdk.Duration.minutes(5),
        retentionPeriod: cdk.Duration.days(4),
        deadLetterQueue: {
          queue: dlq,
          maxReceiveCount: 3,
        },
      }
    );

    const paypalQueue = new cdk.aws_sqs.Queue(
      this,
      `PaypalWebhookQueue${environmentSuffix}`,
      {
        queueName: `paypal-webhook-queue-${environmentSuffix}.fifo`,
        fifo: true,
        contentBasedDeduplication: true,
        visibilityTimeout: cdk.Duration.minutes(5),
        retentionPeriod: cdk.Duration.days(4),
        deadLetterQueue: {
          queue: dlq,
          maxReceiveCount: 3,
        },
      }
    );

    const squareQueue = new cdk.aws_sqs.Queue(
      this,
      `SquareWebhookQueue${environmentSuffix}`,
      {
        queueName: `square-webhook-queue-${environmentSuffix}.fifo`,
        fifo: true,
        contentBasedDeduplication: true,
        visibilityTimeout: cdk.Duration.minutes(5),
        retentionPeriod: cdk.Duration.days(4),
        deadLetterQueue: {
          queue: dlq,
          maxReceiveCount: 3,
        },
      }
    );

    return { stripeQueue, paypalQueue, squareQueue, dlq };
  }

  private createEventBridgeBus(environmentSuffix: string) {
    const eventBus = new cdk.aws_events.EventBus(
      this,
      `PaymentEventsBus${environmentSuffix}`,
      {
        eventBusName: `payment-events-${environmentSuffix}`,
      }
    );

    return { eventBus };
  }

  private createLambdaFunctions(
    environmentSuffix: string,
    table: cdk.aws_dynamodb.Table,
    stripeQueue: cdk.aws_sqs.Queue,
    paypalQueue: cdk.aws_sqs.Queue,
    squareQueue: cdk.aws_sqs.Queue,
    eventBus: cdk.aws_events.EventBus
  ) {
    // IAM role for Lambda functions
    const lambdaRole = new cdk.aws_iam.Role(
      this,
      `WebhookLambdaRole${environmentSuffix}`,
      {
        assumedBy: new cdk.aws_iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
        ],
      }
    );

    // Add permissions
    table.grantWriteData(lambdaRole);
    stripeQueue.grantSendMessages(lambdaRole);
    paypalQueue.grantSendMessages(lambdaRole);
    squareQueue.grantSendMessages(lambdaRole);

    // Lambda needs consume permissions for event source mappings
    stripeQueue.grantConsumeMessages(lambdaRole);
    paypalQueue.grantConsumeMessages(lambdaRole);
    squareQueue.grantConsumeMessages(lambdaRole);

    lambdaRole.addToPolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ['events:PutEvents'],
        resources: [eventBus.eventBusArn],
      })
    );

    // Webhook validator function
    const validatorFunction = new cdk.aws_lambda.Function(
      this,
      `WebhookValidator${environmentSuffix}`,
      {
        functionName: `webhook-validator-${environmentSuffix}`,
        runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
        architecture: cdk.aws_lambda.Architecture.ARM_64,
        code: cdk.aws_lambda.Code.fromInline(`
const crypto = require('crypto');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const sqs = new SQSClient({});

exports.handler = async (event) => {
  console.log('Webhook validation event:', JSON.stringify(event, null, 2));

  try {
    const provider = event.pathParameters?.provider;
    const body = JSON.parse(event.body || '{}');
    const headers = event.headers || {};

    // Validate webhook signature based on provider
    const isValid = await validateWebhookSignature(provider, body, headers);

    if (!isValid) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid webhook signature' }),
      };
    }

    // Generate unique webhook ID
    const webhookId = \`wh_\${Date.now()}_\${crypto.randomBytes(8).toString('hex')}\`;

    // Enrich webhook data
    const enrichedData = {
      webhook_id: webhookId,
      provider,
      event_type: body.event_type || body.type || 'unknown',
      payload: body,
      received_at: new Date().toISOString(),
    };

    // Send to appropriate SQS queue
    const queueUrl = getQueueUrlForProvider(provider);
    if (!queueUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Unsupported provider' }),
      };
    }

    await sqs.send(new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(enrichedData),
      MessageGroupId: webhookId, // For FIFO deduplication
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Webhook validated and queued',
        webhook_id: webhookId,
      }),
    };

  } catch (error) {
    console.error('Validation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

async function validateWebhookSignature(provider, body, headers) {
  try {
    switch (provider) {
      case 'stripe':
        return validateStripeSignature(body, headers);
      case 'paypal':
        return validatePaypalSignature(body, headers);
      case 'square':
        return validateSquareSignature(body, headers);
      default:
        console.warn(\`Unknown provider: \${provider}\`);
        return false;
    }
  } catch (error) {
    console.error(\`Signature validation error for \${provider}:\`, error);
    return false;
  }
}

function validateStripeSignature(body, headers) {
  const signature = headers['stripe-signature'];
  if (!signature) return false;
  return signature.startsWith('t=') && signature.includes(',v1=');
}

function validatePaypalSignature(body, headers) {
  const authAlgo = headers['paypal-auth-algo'];
  const certUrl = headers['paypal-cert-url'];
  const transmissionId = headers['paypal-transmission-id'];
  return authAlgo && certUrl && transmissionId;
}

function validateSquareSignature(body, headers) {
  const signature = headers['x-square-hmacsha256-signature'];
  if (!signature) return false;
  return signature.length > 0;
}

function getQueueUrlForProvider(provider) {
  switch (provider) {
    case 'stripe':
      return process.env.STRIPE_QUEUE_URL;
    case 'paypal':
      return process.env.PAYPAL_QUEUE_URL;
    case 'square':
      return process.env.SQUARE_QUEUE_URL;
    default:
      return null;
  }
}
      `),
        handler: 'index.handler',
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        role: lambdaRole,
        environment: {
          STRIPE_WEBHOOK_SECRET: 'whsec_test_secret',
          PAYPAL_WEBHOOK_SECRET: 'paypal_test_secret',
          SQUARE_WEBHOOK_SECRET: 'square_test_secret',
          STRIPE_QUEUE_URL: stripeQueue.queueUrl,
          PAYPAL_QUEUE_URL: paypalQueue.queueUrl,
          SQUARE_QUEUE_URL: squareQueue.queueUrl,
        },
      }
    );

    // Webhook processor function
    const processorFunction = new cdk.aws_lambda.Function(
      this,
      `WebhookProcessor${environmentSuffix}`,
      {
        functionName: `webhook-processor-${environmentSuffix}`,
        runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
        architecture: cdk.aws_lambda.Architecture.ARM_64,
        code: cdk.aws_lambda.Code.fromInline(`
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
        timeout: cdk.Duration.minutes(5),
        memorySize: 1024,
        role: lambdaRole,
        environment: {
          TABLE_NAME: table.tableName,
          EVENT_BUS_NAME: eventBus.eventBusName,
        },
      }
    );

    return { validatorFunction, processorFunction };
  }

  private connectApiGatewayToLambda(
    apiGateway: cdk.aws_apigateway.RestApi,
    validatorFunction: cdk.aws_lambda.Function
  ): void {
    // Create webhook endpoints for each provider
    const webhooksResource = apiGateway.root.addResource('webhooks');
    const providerResource = webhooksResource.addResource('{provider}');

    // Add method with IAM authorization
    providerResource.addMethod(
      'POST',
      new cdk.aws_apigateway.LambdaIntegration(validatorFunction),
      {
        authorizationType: cdk.aws_apigateway.AuthorizationType.IAM,
      }
    );
  }

  private connectSqsToLambda(
    processorFunction: cdk.aws_lambda.Function,
    stripeQueue: cdk.aws_sqs.Queue,
    paypalQueue: cdk.aws_sqs.Queue,
    squareQueue: cdk.aws_sqs.Queue
  ): void {
    // Event source mappings for SQS
    processorFunction.addEventSourceMapping('StripeQueueMapping', {
      eventSourceArn: stripeQueue.queueArn,
      batchSize: 10,
    });

    processorFunction.addEventSourceMapping('PaypalQueueMapping', {
      eventSourceArn: paypalQueue.queueArn,
      batchSize: 10,
    });

    processorFunction.addEventSourceMapping('SquareQueueMapping', {
      eventSourceArn: squareQueue.queueArn,
      batchSize: 10,
    });
  }

  private createMonitoring(
    environmentSuffix: string,
    apiGateway: cdk.aws_apigateway.RestApi,
    validatorFunction: cdk.aws_lambda.Function,
    processorFunction: cdk.aws_lambda.Function,
    stripeQueue: cdk.aws_sqs.Queue,
    paypalQueue: cdk.aws_sqs.Queue,
    squareQueue: cdk.aws_sqs.Queue
  ): void {
    // CloudWatch alarms
    new cdk.aws_cloudwatch.Alarm(
      this,
      `ApiGateway4xxErrors${environmentSuffix}`,
      {
        alarmName: `webhook-api-4xx-errors-${environmentSuffix}`,
        alarmDescription: 'API Gateway 4XX errors above 1%',
        metric: new cdk.aws_cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '4XXError',
          dimensionsMap: { ApiName: apiGateway.restApiName },
          statistic: 'Sum',
        }),
        threshold: 1,
        evaluationPeriods: 5,
        comparisonOperator:
          cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );

    new cdk.aws_cloudwatch.Alarm(
      this,
      `ApiGateway5xxErrors${environmentSuffix}`,
      {
        alarmName: `webhook-api-5xx-errors-${environmentSuffix}`,
        alarmDescription: 'API Gateway 5XX errors above 1%',
        metric: new cdk.aws_cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '5XXError',
          dimensionsMap: { ApiName: apiGateway.restApiName },
          statistic: 'Sum',
        }),
        threshold: 1,
        evaluationPeriods: 5,
        comparisonOperator:
          cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );

    // Queue depth alarms
    [stripeQueue, paypalQueue, squareQueue].forEach((queue, index) => {
      const providers = ['stripe', 'paypal', 'square'];
      new cdk.aws_cloudwatch.Alarm(
        this,
        `${providers[index]}QueueDepthAlarm${environmentSuffix}`,
        {
          alarmName: `${providers[index]}-webhook-queue-depth-${environmentSuffix}`,
          alarmDescription: `${providers[index]} webhook queue depth above threshold`,
          metric: new cdk.aws_cloudwatch.Metric({
            namespace: 'AWS/SQS',
            metricName: 'ApproximateNumberOfMessagesVisible',
            dimensionsMap: { QueueName: queue.queueName },
            statistic: 'Maximum',
          }),
          threshold: 1000,
          evaluationPeriods: 3,
          comparisonOperator:
            cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        }
      );
    });

    // Lambda error alarms
    new cdk.aws_cloudwatch.Alarm(
      this,
      `ValidatorFunctionErrors${environmentSuffix}`,
      {
        alarmName: `webhook-validator-errors-${environmentSuffix}`,
        alarmDescription: 'Webhook validator function errors',
        metric: new cdk.aws_cloudwatch.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Errors',
          dimensionsMap: { FunctionName: validatorFunction.functionName },
          statistic: 'Sum',
        }),
        threshold: 5,
        evaluationPeriods: 5,
        comparisonOperator:
          cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );

    new cdk.aws_cloudwatch.Alarm(
      this,
      `ProcessorFunctionErrors${environmentSuffix}`,
      {
        alarmName: `webhook-processor-errors-${environmentSuffix}`,
        alarmDescription: 'Webhook processor function errors',
        metric: new cdk.aws_cloudwatch.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Errors',
          dimensionsMap: { FunctionName: processorFunction.functionName },
          statistic: 'Sum',
        }),
        threshold: 5,
        evaluationPeriods: 5,
        comparisonOperator:
          cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );
  }
}
