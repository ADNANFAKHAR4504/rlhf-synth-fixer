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
    // AWS Secrets Manager for webhook secrets
    const { webhookSecrets } = this.createSecretsManager(environmentSuffix);

    // API Gateway for webhook ingestion
    const { apiGateway, requestValidator } =
      this.createApiGateway(environmentSuffix);

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
      eventBus,
      webhookSecrets
    );

    // Connect API Gateway to validator function
    this.connectApiGatewayToLambda(
      apiGateway,
      validatorFunction,
      requestValidator
    );

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

    new cdk.CfnOutput(this, `WebhookSecretsArn${environmentSuffix}`, {
      value: webhookSecrets.secretArn,
      description: 'ARN of the webhook secrets in AWS Secrets Manager',
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
        pointInTimeRecoverySpecification: {
          pointInTimeRecoveryEnabled: true,
        },
        encryption: cdk.aws_dynamodb.TableEncryption.AWS_MANAGED,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
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
      encryption: cdk.aws_sqs.QueueEncryption.SQS_MANAGED,
    });

    // FIFO queues for each provider with explicit encryption
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
        encryption: cdk.aws_sqs.QueueEncryption.SQS_MANAGED,
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
        encryption: cdk.aws_sqs.QueueEncryption.SQS_MANAGED,
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
        encryption: cdk.aws_sqs.QueueEncryption.SQS_MANAGED,
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

  private createSecretsManager(environmentSuffix: string) {
    // Create AWS Secrets Manager for webhook secrets
    const webhookSecrets = new cdk.aws_secretsmanager.Secret(
      this,
      `WebhookSecrets${environmentSuffix}`,
      {
        secretName: `webhook-secrets-${environmentSuffix}`,
        description: 'Webhook secrets for payment providers',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            stripe_webhook_secret: 'whsec_test_secret',
            paypal_webhook_secret: 'paypal_test_secret',
            square_webhook_secret: 'square_test_secret',
          }),
          generateStringKey: 'unused',
        },
      }
    );

    return { webhookSecrets };
  }

  private createLambdaFunctions(
    environmentSuffix: string,
    table: cdk.aws_dynamodb.Table,
    stripeQueue: cdk.aws_sqs.Queue,
    paypalQueue: cdk.aws_sqs.Queue,
    squareQueue: cdk.aws_sqs.Queue,
    eventBus: cdk.aws_events.EventBus,
    webhookSecrets: cdk.aws_secretsmanager.Secret
  ) {
    // Validator role - only needs Secrets Manager + SQS send
    const validatorRole = new cdk.aws_iam.Role(
      this,
      `WebhookValidatorRole${environmentSuffix}`,
      {
        assumedBy: new cdk.aws_iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
        ],
      }
    );

    // Add permissions for validator: Secrets Manager and SQS send
    webhookSecrets.grantRead(validatorRole);
    stripeQueue.grantSendMessages(validatorRole);
    paypalQueue.grantSendMessages(validatorRole);
    squareQueue.grantSendMessages(validatorRole);

    // Processor role - only needs SQS consume + DynamoDB + EventBridge
    const processorRole = new cdk.aws_iam.Role(
      this,
      `WebhookProcessorRole${environmentSuffix}`,
      {
        assumedBy: new cdk.aws_iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
        ],
      }
    );

    // Add permissions for processor: SQS consume + DynamoDB + EventBridge
    stripeQueue.grantConsumeMessages(processorRole);
    paypalQueue.grantConsumeMessages(processorRole);
    squareQueue.grantConsumeMessages(processorRole);
    table.grantWriteData(processorRole);

    processorRole.addToPolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ['events:PutEvents'],
        resources: [eventBus.eventBusArn],
      })
    );

    // Create Lambda log groups explicitly
    const validatorLogGroup = new cdk.aws_logs.LogGroup(
      this,
      `WebhookValidatorLogs${environmentSuffix}`,
      {
        logGroupName: `/aws/lambda/webhook-validator-${environmentSuffix}`,
        retention: cdk.aws_logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const processorLogGroup = new cdk.aws_logs.LogGroup(
      this,
      `WebhookProcessorLogs${environmentSuffix}`,
      {
        logGroupName: `/aws/lambda/webhook-processor-${environmentSuffix}`,
        retention: cdk.aws_logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Webhook validator function using container approach
    const validatorFunction = new cdk.aws_lambda.Function(
      this,
      `WebhookValidator${environmentSuffix}`,
      {
        functionName: `webhook-validator-${environmentSuffix}`,
        runtime: cdk.aws_lambda.Runtime.FROM_IMAGE,
        handler: cdk.aws_lambda.Handler.FROM_IMAGE,
        code: cdk.aws_lambda.Code.fromAssetImage('./lib', {
          cmd: ['app.handler'],
        }),
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        role: validatorRole,
        logGroup: validatorLogGroup,
        environment: {
          WEBHOOK_SECRETS_ARN: webhookSecrets.secretArn,
          STRIPE_QUEUE_URL: stripeQueue.queueUrl,
          PAYPAL_QUEUE_URL: paypalQueue.queueUrl,
          SQUARE_QUEUE_URL: squareQueue.queueUrl,
        },
      }
    );

    // Webhook processor function using container approach
    const processorFunction = new cdk.aws_lambda.Function(
      this,
      `WebhookProcessor${environmentSuffix}`,
      {
        functionName: `webhook-processor-${environmentSuffix}`,
        runtime: cdk.aws_lambda.Runtime.FROM_IMAGE,
        handler: cdk.aws_lambda.Handler.FROM_IMAGE,
        code: cdk.aws_lambda.Code.fromAssetImage('./lib', {
          cmd: ['processor.handler'],
        }),
        timeout: cdk.Duration.minutes(5),
        memorySize: 1024,
        role: processorRole,
        logGroup: processorLogGroup,
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
    validatorFunction: cdk.aws_lambda.Function,
    requestValidator: cdk.aws_apigateway.RequestValidator
  ): void {
    // Create request model with JSON schema
    const webhookModel = apiGateway.addModel('WebhookModel', {
      contentType: 'application/json',
      modelName: 'WebhookPayload',
      schema: {
        schema: cdk.aws_apigateway.JsonSchemaVersion.DRAFT4,
        title: 'webhookPayload',
        type: cdk.aws_apigateway.JsonSchemaType.OBJECT,
        properties: {
          provider: { type: cdk.aws_apigateway.JsonSchemaType.STRING },
          event_type: { type: cdk.aws_apigateway.JsonSchemaType.STRING },
          data: { type: cdk.aws_apigateway.JsonSchemaType.OBJECT },
          id: { type: cdk.aws_apigateway.JsonSchemaType.STRING },
          type: { type: cdk.aws_apigateway.JsonSchemaType.STRING },
        },
        required: ['provider', 'event_type', 'data'],
      },
    });

    // Create webhook endpoints for each provider
    const webhooksResource = apiGateway.root.addResource('webhooks');
    const providerResource = webhooksResource.addResource('{provider}');

    // Add method with IAM authorization and request validation
    providerResource.addMethod(
      'POST',
      new cdk.aws_apigateway.LambdaIntegration(validatorFunction),
      {
        authorizationType: cdk.aws_apigateway.AuthorizationType.IAM,
        requestValidator: requestValidator,
        requestModels: {
          'application/json': webhookModel,
        },
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
        alarmDescription: 'API Gateway 4XX errors above 1 per 5 minute period',
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
        alarmDescription: 'API Gateway 5XX errors above 1 per 5 minute period',
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
