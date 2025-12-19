import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // ========================================
    // VPC Configuration
    // ========================================
    const vpc = new ec2.Vpc(this, `PaymentProcessingVPC-${environmentSuffix}`, {
      vpcName: `payment-processing-vpc-${environmentSuffix}`,
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // VPC Endpoints for AWS services (to reduce data transfer costs)
    vpc.addGatewayEndpoint('DynamoDBEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    });

    vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    // ========================================
    // Systems Manager Parameter Store
    // ========================================
    const apiKeyParameter = new ssm.StringParameter(
      this,
      `ApiKey-${environmentSuffix}`,
      {
        parameterName: `/payment-processing/${environmentSuffix}/api-key`,
        stringValue: 'PLACEHOLDER_API_KEY', // This should be set manually after deployment
        description: 'API key for payment validation',
        tier: ssm.ParameterTier.STANDARD,
      }
    );

    const highValueThreshold = new ssm.StringParameter(
      this,
      `HighValueThreshold-${environmentSuffix}`,
      {
        parameterName: `/payment-processing/${environmentSuffix}/high-value-threshold`,
        stringValue: '10000',
        description: 'Threshold for high-value transaction notifications',
        tier: ssm.ParameterTier.STANDARD,
      }
    );

    // ========================================
    // DynamoDB Table
    // ========================================
    const paymentsTable = new dynamodb.Table(
      this,
      `PaymentsTable-${environmentSuffix}`,
      {
        tableName: `payments-${environmentSuffix}`,
        partitionKey: {
          name: 'payment_id',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'timestamp',
          type: dynamodb.AttributeType.NUMBER,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        pointInTimeRecovery: true,
        encryption: dynamodb.TableEncryption.AWS_MANAGED,
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
      }
    );

    // ========================================
    // Dead Letter Queues
    // ========================================
    const mainDLQ = new sqs.Queue(this, `MainDLQ-${environmentSuffix}`, {
      queueName: `payment-processing-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    const eventBridgeDLQ = new sqs.Queue(
      this,
      `EventBridgeDLQ-${environmentSuffix}`,
      {
        queueName: `eventbridge-dlq-${environmentSuffix}`,
        retentionPeriod: cdk.Duration.days(14),
        encryption: sqs.QueueEncryption.KMS_MANAGED,
      }
    );

    // ========================================
    // SNS Topic for Notifications
    // ========================================
    const notificationTopic = new sns.Topic(
      this,
      `NotificationTopic-${environmentSuffix}`,
      {
        topicName: `high-value-payments-${environmentSuffix}`,
        displayName: 'High Value Payment Notifications',
      }
    );

    // Add email subscription (replace with your email)
    // notificationTopic.addSubscription(
    //   new snsSubscriptions.EmailSubscription('your-email@example.com')
    // );

    // ========================================
    // Lambda Layer for AWS Lambda Powertools
    // ========================================
    const powertoolsLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      `PowertoolsLayer-${environmentSuffix}`,
      `arn:aws:lambda:${this.region}:017000801446:layer:AWSLambdaPowertoolsPythonV2:46`
    );

    // ========================================
    // Payment Validation Lambda
    // ========================================
    const validationLambdaRole = new iam.Role(
      this,
      `ValidationLambdaRole-${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        roleName: `payment-validation-role-${environmentSuffix}`,
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaVPCAccessExecutionRole'
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AWSXRayDaemonWriteAccess'
          ),
        ],
      }
    );

    const validationLambda = new lambda.Function(
      this,
      `ValidationLambda-${environmentSuffix}`,
      {
        functionName: `payment-validation-${environmentSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: 'validation.handler',
        code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
        memorySize: 512,
        timeout: cdk.Duration.seconds(60),
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        role: validationLambdaRole,
        layers: [powertoolsLayer],
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          DYNAMODB_TABLE_NAME: paymentsTable.tableName,
          API_KEY_PARAMETER: apiKeyParameter.parameterName,
          HIGH_VALUE_THRESHOLD_PARAMETER: highValueThreshold.parameterName,
          ENVIRONMENT: environmentSuffix,
          POWERTOOLS_SERVICE_NAME: 'payment-validation',
          POWERTOOLS_METRICS_NAMESPACE: 'PaymentProcessing',
          LOG_LEVEL: 'INFO',
        },
        deadLetterQueue: mainDLQ,
        deadLetterQueueEnabled: true,
        retryAttempts: 2,
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );
    cdk.Tags.of(validationLambda).add('iac-rlhf-amazon', 'true');

    // Grant permissions to validation lambda
    paymentsTable.grantWriteData(validationLambda);
    apiKeyParameter.grantRead(validationLambda);
    highValueThreshold.grantRead(validationLambda);
    mainDLQ.grantSendMessages(validationLambda);

    // ========================================
    // Notification Lambda
    // ========================================
    const notificationLambdaRole = new iam.Role(
      this,
      `NotificationLambdaRole-${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        roleName: `payment-notification-role-${environmentSuffix}`,
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaVPCAccessExecutionRole'
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AWSXRayDaemonWriteAccess'
          ),
        ],
      }
    );

    const notificationLambda = new lambda.Function(
      this,
      `NotificationLambda-${environmentSuffix}`,
      {
        functionName: `payment-notification-${environmentSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: 'notification.handler',
        code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
        memorySize: 512,
        timeout: cdk.Duration.seconds(60),
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        role: notificationLambdaRole,
        layers: [powertoolsLayer],
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          SNS_TOPIC_ARN: notificationTopic.topicArn,
          ENVIRONMENT: environmentSuffix,
          POWERTOOLS_SERVICE_NAME: 'payment-notification',
          POWERTOOLS_METRICS_NAMESPACE: 'PaymentProcessing',
          LOG_LEVEL: 'INFO',
        },
        retryAttempts: 2,
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );
    cdk.Tags.of(notificationLambda).add('iac-rlhf-amazon', 'true');

    // Grant permissions to notification lambda
    notificationTopic.grantPublish(notificationLambda);

    // ========================================
    // EventBridge for High-Value Transactions
    // ========================================
    const eventBus = new events.EventBus(
      this,
      `PaymentEventBus-${environmentSuffix}`,
      {
        eventBusName: `payment-events-${environmentSuffix}`,
      }
    );

    const highValueRule = new events.Rule(
      this,
      `HighValueRule-${environmentSuffix}`,
      {
        ruleName: `high-value-payments-${environmentSuffix}`,
        eventBus: eventBus,
        eventPattern: {
          source: ['payment.processing'],
          detailType: ['High Value Payment'],
          detail: {
            amount: [
              {
                numeric: ['>', 10000],
              },
            ],
          },
        },
      }
    );

    // Add Lambda target with DLQ
    highValueRule.addTarget(
      new targets.LambdaFunction(notificationLambda, {
        deadLetterQueue: eventBridgeDLQ,
        maxEventAge: cdk.Duration.hours(2),
        retryAttempts: 3,
      })
    );

    // Grant EventBridge permission to put events
    eventBus.grantPutEventsTo(validationLambda);

    // Add EventBridge permissions to validation lambda
    validationLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['events:PutEvents'],
        resources: [eventBus.eventBusArn],
      })
    );

    // Add environment variable for EventBridge
    validationLambda.addEnvironment('EVENT_BUS_NAME', eventBus.eventBusName);

    // ========================================
    // API Gateway
    // ========================================
    const api = new apigateway.RestApi(
      this,
      `PaymentAPI-${environmentSuffix}`,
      {
        restApiName: `payment-processing-api-${environmentSuffix}`,
        description: 'Payment Processing Webhook API',
        deployOptions: {
          stageName: environmentSuffix,
          tracingEnabled: true,
          loggingLevel: apigateway.MethodLoggingLevel.INFO,
          dataTraceEnabled: true,
          metricsEnabled: true,
          throttlingBurstLimit: 1000,
          throttlingRateLimit: 1000,
        },
        defaultCorsPreflightOptions: {
          allowOrigins: apigateway.Cors.ALL_ORIGINS,
          allowMethods: apigateway.Cors.ALL_METHODS,
        },
      }
    );

    // Request Validator
    const requestValidator = new apigateway.RequestValidator(
      this,
      `RequestValidator-${environmentSuffix}`,
      {
        restApi: api,
        requestValidatorName: 'payment-validator',
        validateRequestBody: true,
        validateRequestParameters: false,
      }
    );

    // Request Model for validation
    const paymentModel = new apigateway.Model(
      this,
      `PaymentModel-${environmentSuffix}`,
      {
        restApi: api,
        contentType: 'application/json',
        modelName: 'PaymentModel',
        schema: {
          type: apigateway.JsonSchemaType.OBJECT,
          required: ['payment_id', 'amount', 'currency', 'customer_id'],
          properties: {
            payment_id: { type: apigateway.JsonSchemaType.STRING },
            amount: { type: apigateway.JsonSchemaType.NUMBER },
            currency: { type: apigateway.JsonSchemaType.STRING },
            customer_id: { type: apigateway.JsonSchemaType.STRING },
            description: { type: apigateway.JsonSchemaType.STRING },
            metadata: { type: apigateway.JsonSchemaType.OBJECT },
          },
        },
      }
    );

    // Create webhook endpoint
    const paymentsResource = api.root.addResource('payments');
    const webhookResource = paymentsResource.addResource('webhook');

    const lambdaIntegration = new apigateway.LambdaIntegration(
      validationLambda,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }
    );

    webhookResource.addMethod('POST', lambdaIntegration, {
      requestValidator,
      requestModels: {
        'application/json': paymentModel,
      },
    });

    // ========================================
    // CloudWatch Alarms (optional but recommended)
    // ========================================
    new cdk.CfnOutput(this, `ApiEndpoint-${environmentSuffix}`, {
      value: api.url,
      description: 'API Gateway endpoint URL',
      exportName: `payment-api-url-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `DynamoDBTableName-${environmentSuffix}`, {
      value: paymentsTable.tableName,
      description: 'DynamoDB table name for payments',
      exportName: `payments-table-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `SNSTopicArn-${environmentSuffix}`, {
      value: notificationTopic.topicArn,
      description: 'SNS topic ARN for high-value notifications',
      exportName: `notification-topic-${environmentSuffix}`,
    });

    // ========================================
    // Add iac-rlhf-amazon tags to all resources
    // ========================================
    cdk.Tags.of(vpc).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(apiKeyParameter).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(highValueThreshold).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(paymentsTable).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(mainDLQ).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(eventBridgeDLQ).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(notificationTopic).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(validationLambdaRole).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(notificationLambdaRole).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(eventBus).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(highValueRule).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(api).add('iac-rlhf-amazon', 'true');
  }
}
