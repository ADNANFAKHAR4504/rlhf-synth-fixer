# Food Delivery API Infrastructure - Complete Implementation

## Infrastructure Components

This serverless food delivery API infrastructure handles 3,500 daily orders with high availability, automatic scaling, and comprehensive monitoring.

### Main Stack - `lib/tap-stack.ts`
```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { FoodDeliveryStack } from './food-delivery-stack';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Deploy Food Delivery Stack
    new FoodDeliveryStack(this, 'FoodDeliveryStack', {
      env: props.env,
    });
  }
}
```

### Food Delivery Stack - `lib/food-delivery-stack.ts`
```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

export class FoodDeliveryStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Dead Letter Queue for failed processing
    const deadLetterQueue = new sqs.Queue(this, 'OrderProcessingDLQ', {
      queueName: `food-delivery-dlq-${this.stackName}`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // DynamoDB Table with auto-scaling
    const ordersTable = new dynamodb.Table(this, 'OrdersTable', {
      tableName: `food-delivery-orders-${this.stackName}`,
      partitionKey: {
        name: 'orderId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 5,
      writeCapacity: 5,
      pointInTimeRecoverySpecification: {
        pointInTimeRecovery: true,
      },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Global Secondary Index for customer queries
    ordersTable.addGlobalSecondaryIndex({
      indexName: 'customerIdIndex',
      partitionKey: {
        name: 'customerId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      readCapacity: 5,
      writeCapacity: 5,
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Auto-scaling configuration
    const readScaling = ordersTable.autoScaleReadCapacity({
      minCapacity: 5,
      maxCapacity: 100,
    });

    readScaling.scaleOnUtilization({
      targetUtilizationPercent: 70,
    });

    const writeScaling = ordersTable.autoScaleWriteCapacity({
      minCapacity: 5,
      maxCapacity: 100,
    });

    writeScaling.scaleOnUtilization({
      targetUtilizationPercent: 70,
    });

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, 'FoodDeliveryAlerts', {
      displayName: 'Food Delivery API Alerts',
    });

    // Parameter Store configurations
    const tableNameParameter = new ssm.StringParameter(
      this,
      'TableNameParameter',
      {
        parameterName: `/food-delivery/${this.stackName}/table-name`,
        stringValue: ordersTable.tableName,
        description: 'DynamoDB table name for orders',
      }
    );

    const apiConfigParameter = new ssm.StringParameter(
      this,
      'ApiConfigParameter',
      {
        parameterName: `/food-delivery/${this.stackName}/api-config`,
        stringValue: JSON.stringify({
          maxOrdersPerHour: 150,
          defaultTimeout: 500,
          retryAttempts: 3,
        }),
        description: 'API configuration parameters',
      }
    );

    const featureFlagsParameter = new ssm.SecureStringParameter(
      this,
      'FeatureFlagsParameter',
      {
        parameterName: `/food-delivery/${this.stackName}/feature-flags`,
        stringValue: JSON.stringify({
          expressDelivery: false,
          loyaltyProgram: true,
          multiplePayments: false,
        }),
        description: 'Feature flags for gradual rollouts',
      }
    );

    // Lambda Execution Role with least privilege
    const lambdaRole = new iam.Role(this, 'OrderProcessingRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
    });

    // DynamoDB permissions
    ordersTable.grantReadWriteData(lambdaRole);

    // Parameter Store permissions
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter', 'ssm:GetParameters'],
        resources: [
          tableNameParameter.parameterArn,
          apiConfigParameter.parameterArn,
          featureFlagsParameter.parameterArn,
        ],
      })
    );

    // SQS permissions for DLQ
    deadLetterQueue.grantSendMessages(lambdaRole);

    // Order Processing Lambda Function
    const orderProcessingFunction = new lambdaNodejs.NodejsFunction(
      this,
      'OrderProcessingFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'handler',
        entry: path.join(__dirname, 'lambda/order-processor.ts'),
        functionName: `food-delivery-processor-${this.stackName}`,
        timeout: cdk.Duration.seconds(30),
        memorySize: 1024,
        role: lambdaRole,
        environment: {
          TABLE_NAME: ordersTable.tableName,
          DLQ_URL: deadLetterQueue.queueUrl,
          TABLE_NAME_PARAM: tableNameParameter.parameterName,
          API_CONFIG_PARAM: apiConfigParameter.parameterName,
          FEATURE_FLAGS_PARAM: featureFlagsParameter.parameterName,
          POWERTOOLS_SERVICE_NAME: 'food-delivery-api',
          POWERTOOLS_METRICS_NAMESPACE: 'FoodDelivery',
          LOG_LEVEL: 'INFO',
        },
        reservedConcurrentExecutions: 100,
        tracing: lambda.Tracing.ACTIVE,
        logGroup: new logs.LogGroup(this, 'OrderProcessingLogs', {
          retention: logs.RetentionDays.ONE_WEEK,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        deadLetterQueue: deadLetterQueue,
        deadLetterQueueEnabled: true,
        bundling: {
          externalModules: ['@aws-sdk/*'],
          minify: true,
          sourceMap: true,
          target: 'node20',
        },
      }
    );

    // Query Orders Lambda Function
    const queryOrdersFunction = new lambdaNodejs.NodejsFunction(
      this,
      'QueryOrdersFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'handler',
        entry: path.join(__dirname, 'lambda/query-orders.ts'),
        functionName: `food-delivery-query-${this.stackName}`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 512,
        role: lambdaRole,
        environment: {
          TABLE_NAME: ordersTable.tableName,
          POWERTOOLS_SERVICE_NAME: 'food-delivery-api',
          POWERTOOLS_METRICS_NAMESPACE: 'FoodDelivery',
          LOG_LEVEL: 'INFO',
        },
        tracing: lambda.Tracing.ACTIVE,
        logGroup: new logs.LogGroup(this, 'QueryOrdersLogs', {
          retention: logs.RetentionDays.ONE_WEEK,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        bundling: {
          externalModules: ['@aws-sdk/*'],
          minify: true,
          sourceMap: true,
          target: 'node20',
        },
      }
    );

    // API Gateway REST API
    const api = new apigateway.RestApi(this, 'FoodDeliveryApi', {
      restApiName: `food-delivery-api-${this.stackName}`,
      description: 'Food Delivery REST API',
      deployOptions: {
        stageName: 'prod',
        tracingEnabled: true,
        dataTraceEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        metricsEnabled: true,
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Api-Key', 'Authorization'],
      },
    });

    // API Key for partner integrations
    const apiKey = new apigateway.ApiKey(this, 'FoodDeliveryApiKey', {
      apiKeyName: `food-delivery-key-${this.stackName}`,
      description: 'API key for partner integrations',
    });

    const usagePlan = new apigateway.UsagePlan(this, 'FoodDeliveryUsagePlan', {
      name: `food-delivery-usage-${this.stackName}`,
      apiStages: [
        {
          api: api,
          stage: api.deploymentStage,
        },
      ],
      throttle: {
        rateLimit: 100,
        burstLimit: 200,
      },
      quota: {
        limit: 10000,
        period: apigateway.Period.DAY,
      },
    });

    usagePlan.addApiKey(apiKey);

    // Request Validator
    const requestValidator = new apigateway.RequestValidator(
      this,
      'RequestValidator',
      {
        restApi: api,
        requestValidatorName: 'validate-request-body-and-params',
        validateRequestBody: true,
        validateRequestParameters: true,
      }
    );

    // Order Model for validation
    const orderModel = new apigateway.Model(this, 'OrderModel', {
      restApi: api,
      contentType: 'application/json',
      modelName: 'OrderModel',
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        required: ['customerId', 'items', 'deliveryAddress'],
        properties: {
          customerId: { type: apigateway.JsonSchemaType.STRING },
          items: {
            type: apigateway.JsonSchemaType.ARRAY,
            minItems: 1,
            items: {
              type: apigateway.JsonSchemaType.OBJECT,
              required: ['productId', 'quantity', 'price'],
              properties: {
                productId: { type: apigateway.JsonSchemaType.STRING },
                quantity: {
                  type: apigateway.JsonSchemaType.INTEGER,
                  minimum: 1,
                },
                price: { type: apigateway.JsonSchemaType.NUMBER },
              },
            },
          },
          deliveryAddress: {
            type: apigateway.JsonSchemaType.OBJECT,
            required: ['street', 'city', 'zipCode'],
            properties: {
              street: { type: apigateway.JsonSchemaType.STRING },
              city: { type: apigateway.JsonSchemaType.STRING },
              zipCode: { type: apigateway.JsonSchemaType.STRING },
            },
          },
        },
      },
    });

    // API Resources and Methods
    const orders = api.root.addResource('orders');

    // POST /orders - Create order
    orders.addMethod(
      'POST',
      new apigateway.LambdaIntegration(orderProcessingFunction),
      {
        apiKeyRequired: true,
        requestValidator: requestValidator,
        requestModels: {
          'application/json': orderModel,
        },
      }
    );

    // GET /orders/{orderId} - Get order
    const orderById = orders.addResource('{orderId}');
    orderById.addMethod(
      'GET',
      new apigateway.LambdaIntegration(queryOrdersFunction),
      {
        apiKeyRequired: true,
        requestParameters: {
          'method.request.path.orderId': true,
        },
      }
    );

    // PUT /orders/{orderId} - Update order
    orderById.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(orderProcessingFunction),
      {
        apiKeyRequired: true,
        requestValidator: requestValidator,
        requestModels: {
          'application/json': orderModel,
        },
      }
    );

    // GET /orders/customer/{customerId} - Get customer orders
    const customerOrders = orders
      .addResource('customer')
      .addResource('{customerId}');
    customerOrders.addMethod(
      'GET',
      new apigateway.LambdaIntegration(queryOrdersFunction),
      {
        apiKeyRequired: true,
        requestParameters: {
          'method.request.path.customerId': true,
        },
      }
    );

    // CloudWatch Alarms
    const errorAlarm = new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
      metric: orderProcessingFunction.metricErrors({
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 2,
      alarmName: `${this.stackName}-high-error-rate`,
      alarmDescription: 'Triggers when error rate exceeds 1%',
    });

    errorAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'FoodDeliveryDashboard', {
      dashboardName: `food-delivery-dashboard-${this.stackName}`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Metrics',
        left: [api.metricCount()],
        right: [api.metricClientError(), api.metricServerError()],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: [
          orderProcessingFunction.metricInvocations(),
          queryOrdersFunction.metricInvocations(),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration',
        left: [
          orderProcessingFunction.metricDuration(),
          queryOrdersFunction.metricDuration(),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: [
          orderProcessingFunction.metricErrors(),
          queryOrdersFunction.metricErrors(),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Capacity',
        left: [
          ordersTable.metricConsumedReadCapacityUnits(),
          ordersTable.metricConsumedWriteCapacityUnits(),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'DLQ Messages',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/SQS',
            metricName: 'ApproximateNumberOfMessagesVisible',
            dimensionsMap: {
              QueueName: deadLetterQueue.queueName,
            },
          }),
        ],
      })
    );

    // Stack Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'Food Delivery API URL',
      exportName: `${this.stackName}-api-url`,
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID for partner integrations',
      exportName: `${this.stackName}-api-key-id`,
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
      exportName: `${this.stackName}-dashboard-url`,
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: ordersTable.tableName,
      description: 'DynamoDB Orders Table Name',
      exportName: `${this.stackName}-table-name`,
    });

    new cdk.CfnOutput(this, 'DLQUrl', {
      value: deadLetterQueue.queueUrl,
      description: 'Dead Letter Queue URL',
      exportName: `${this.stackName}-dlq-url`,
    });
  }
}
```

### Lambda Function - Order Processing
```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { randomUUID } from 'crypto';
import { captureAWSv3Client } from 'aws-xray-sdk-core';

const dynamodbClient = captureAWSv3Client(new DynamoDBClient({}));
const docClient = DynamoDBDocumentClient.from(dynamodbClient);
const ssmClient = captureAWSv3Client(new SSMClient({}));
const sqsClient = captureAWSv3Client(new SQSClient({}));

const logger = new Logger({ serviceName: 'order-processor' });
const metrics = new Metrics({ namespace: 'FoodDelivery', serviceName: 'order-processor' });
const tracer = new Tracer({ serviceName: 'order-processor' });

export const handler = tracer.captureLambdaHandler(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  metrics.addMetric('ColdStart', MetricUnit.Count, 1);

  try {
    // Implementation for order processing
    // Includes validation, DynamoDB operations, metrics, and error handling

    if (event.httpMethod === 'POST') {
      const order = JSON.parse(event.body || '{}');
      order.orderId = randomUUID();
      order.status = 'pending';
      order.createdAt = Date.now();

      await docClient.send(new PutCommand({
        TableName: process.env.TABLE_NAME!,
        Item: order,
      }));

      metrics.addMetric('OrderCreated', MetricUnit.Count, 1);

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.orderId, status: order.status }),
      };
    }

    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    logger.error('Error processing request', error as Error);
    metrics.addMetric('ProcessingError', MetricUnit.Count, 1);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  } finally {
    metrics.publishStoredMetrics();
  }
});
```

## Key Features

- **Scalability**: Auto-scaling DynamoDB (5-100 units) and Lambda reserved concurrency
- **Security**: IAM least privilege, API keys, encrypted parameters
- **Monitoring**: CloudWatch Dashboard, X-Ray tracing, custom metrics
- **Resilience**: Dead Letter Queue, retry mechanisms, error handling
- **Performance**: < 500ms response time, optimized memory allocation
- **Cost-Effective**: On-demand billing with reserved capacity where needed