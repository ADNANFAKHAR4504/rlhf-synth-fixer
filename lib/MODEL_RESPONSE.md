# Food Delivery API Infrastructure Implementation

## Architecture Overview
This implementation creates a serverless food delivery API using AWS CDK with TypeScript. The solution includes API Gateway REST API, Lambda functions with TypeScript handlers, DynamoDB with auto-scaling, comprehensive monitoring with CloudWatch and X-Ray, and configuration management via Systems Manager Parameter Store.

## Infrastructure Code Files

### Main Stack - lib/food-delivery-stack.ts
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
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as xray from 'aws-cdk-lib/aws-xray';
import { Construct } from 'constructs';
import * as path from 'path';

export class FoodDeliveryStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Dead Letter Queue for failed order processing
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
      pointInTimeRecovery: true,
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
    const tableNameParameter = new ssm.StringParameter(this, 'TableNameParameter', {
      parameterName: `/food-delivery/${this.stackName}/table-name`,
      stringValue: ordersTable.tableName,
      description: 'DynamoDB table name for orders',
    });

    const apiConfigParameter = new ssm.StringParameter(this, 'ApiConfigParameter', {
      parameterName: `/food-delivery/${this.stackName}/api-config`,
      stringValue: JSON.stringify({
        maxOrdersPerHour: 150,
        defaultTimeout: 500,
        retryAttempts: 3,
      }),
      description: 'API configuration parameters',
    });

    const featureFlagsParameter = new ssm.StringParameter(this, 'FeatureFlagsParameter', {
      parameterName: `/food-delivery/${this.stackName}/feature-flags`,
      stringValue: JSON.stringify({
        expressDelivery: false,
        loyaltyProgram: true,
        multiplePayments: false,
      }),
      description: 'Feature flags for gradual rollouts',
      type: ssm.ParameterType.SECURE_STRING,
    });

    // Lambda Execution Role with least privilege
    const lambdaRole = new iam.Role(this, 'OrderProcessingRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
    });

    // DynamoDB permissions
    ordersTable.grantReadWriteData(lambdaRole);

    // Parameter Store permissions
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParameter', 'ssm:GetParameters'],
      resources: [
        tableNameParameter.parameterArn,
        apiConfigParameter.parameterArn,
        featureFlagsParameter.parameterArn,
      ],
    }));

    // SQS permissions for DLQ
    deadLetterQueue.grantSendMessages(lambdaRole);

    // Order Processing Lambda Function
    const orderProcessingFunction = new lambdaNodejs.NodejsFunction(this, 'OrderProcessingFunction', {
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
      logRetention: logs.RetentionDays.ONE_WEEK,
      deadLetterQueue: deadLetterQueue,
      deadLetterQueueEnabled: true,
      bundling: {
        externalModules: ['aws-sdk'],
        minify: true,
        sourceMap: true,
      },
    });

    // Query Orders Lambda Function
    const queryOrdersFunction = new lambdaNodejs.NodejsFunction(this, 'QueryOrdersFunction', {
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
      logRetention: logs.RetentionDays.ONE_WEEK,
      bundling: {
        externalModules: ['aws-sdk'],
        minify: true,
        sourceMap: true,
      },
    });

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
        throttlingBurstLimit: 200,
        throttlingRateLimit: 100,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Api-Key', 'Authorization'],
        maxAge: cdk.Duration.hours(1),
      },
    });

    // API Key for partner integrations
    const apiKey = new apigateway.ApiKey(this, 'FoodDeliveryApiKey', {
      apiKeyName: `food-delivery-key-${this.stackName}`,
      description: 'API key for partner integrations',
    });

    const usagePlan = new apigateway.UsagePlan(this, 'FoodDeliveryUsagePlan', {
      name: `food-delivery-usage-${this.stackName}`,
      apiStages: [{
        api: api,
        stage: api.deploymentStage,
      }],
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
    const requestValidator = new apigateway.RequestValidator(this, 'RequestValidator', {
      restApi: api,
      requestValidatorName: 'validate-request-body-and-params',
      validateRequestBody: true,
      validateRequestParameters: true,
    });

    // Order Model for validation
    const orderModel = new apigateway.Model(this, 'OrderModel', {
      restApi: api,
      contentType: 'application/json',
      modelName: 'OrderModel',
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        required: ['customerId', 'items', 'deliveryAddress'],
        properties: {
          customerId: {
            type: apigateway.JsonSchemaType.STRING,
            minLength: 1,
          },
          items: {
            type: apigateway.JsonSchemaType.ARRAY,
            minItems: 1,
            items: {
              type: apigateway.JsonSchemaType.OBJECT,
              required: ['productId', 'quantity', 'price'],
              properties: {
                productId: { type: apigateway.JsonSchemaType.STRING },
                quantity: { type: apigateway.JsonSchemaType.INTEGER, minimum: 1 },
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
    orders.addMethod('POST', new apigateway.LambdaIntegration(orderProcessingFunction), {
      apiKeyRequired: true,
      requestValidator: requestValidator,
      requestModels: {
        'application/json': orderModel,
      },
    });

    // GET /orders/{orderId} - Get order
    const orderById = orders.addResource('{orderId}');
    orderById.addMethod('GET', new apigateway.LambdaIntegration(queryOrdersFunction), {
      apiKeyRequired: true,
      requestParameters: {
        'method.request.path.orderId': true,
      },
    });

    // PUT /orders/{orderId} - Update order
    orderById.addMethod('PUT', new apigateway.LambdaIntegration(orderProcessingFunction), {
      apiKeyRequired: true,
      requestValidator: requestValidator,
      requestModels: {
        'application/json': orderModel,
      },
    });

    // GET /orders/customer/{customerId} - Get customer orders
    const customerOrders = orders.addResource('customer').addResource('{customerId}');
    customerOrders.addMethod('GET', new apigateway.LambdaIntegration(queryOrdersFunction), {
      apiKeyRequired: true,
      requestParameters: {
        'method.request.path.customerId': true,
      },
    });

    // CloudWatch Alarms
    const errorAlarm = new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
      metric: orderProcessingFunction.metricErrors({
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 2,
      alarmDescription: 'Alert when error rate exceeds 1%',
    });

    errorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    const latencyAlarm = new cloudwatch.Alarm(this, 'HighLatencyAlarm', {
      metric: orderProcessingFunction.metricDuration({
        statistic: 'p95',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 500,
      evaluationPeriods: 2,
      alarmDescription: 'Alert when 95th percentile latency exceeds 500ms',
    });

    latencyAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'FoodDeliveryDashboard', {
      dashboardName: `food-delivery-dashboard-${this.stackName}`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Requests',
        left: [api.metricCount()],
        right: [api.metric4XXError(), api.metric5XXError()],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: [orderProcessingFunction.metricInvocations(), queryOrdersFunction.metricInvocations()],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration',
        left: [orderProcessingFunction.metricDuration(), queryOrdersFunction.metricDuration()],
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Metrics',
        left: [ordersTable.metricConsumedReadCapacityUnits(), ordersTable.metricConsumedWriteCapacityUnits()],
      }),
    );

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'Food Delivery API URL',
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID for partner integrations',
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });
  }
}
```

### Order Processor Lambda - lib/lambda/order-processor.ts
```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Logger, Metrics, MetricUnits, Tracer } from '@aws-lambda-powertools/typescript';
import { randomUUID } from 'crypto';
import { captureAWSv3Client } from 'aws-xray-sdk-core';

// Initialize AWS SDK clients with X-Ray tracing
const dynamodbClient = captureAWSv3Client(new DynamoDBClient({}));
const docClient = DynamoDBDocumentClient.from(dynamodbClient);
const ssmClient = captureAWSv3Client(new SSMClient({}));
const sqsClient = captureAWSv3Client(new SQSClient({}));

// Initialize Powertools
const logger = new Logger({ serviceName: 'order-processor' });
const metrics = new Metrics({ namespace: 'FoodDelivery', serviceName: 'order-processor' });
const tracer = new Tracer({ serviceName: 'order-processor' });

interface Order {
  orderId?: string;
  customerId: string;
  items: OrderItem[];
  deliveryAddress: Address;
  status?: string;
  totalAmount?: number;
  createdAt?: number;
  updatedAt?: number;
}

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

interface Address {
  street: string;
  city: string;
  zipCode: string;
}

interface ApiConfig {
  maxOrdersPerHour: number;
  defaultTimeout: number;
  retryAttempts: number;
}

interface FeatureFlags {
  expressDelivery: boolean;
  loyaltyProgram: boolean;
  multiplePayments: boolean;
}

// Cache for SSM parameters
let apiConfig: ApiConfig | null = null;
let featureFlags: FeatureFlags | null = null;
let lastFetched = 0;
const CACHE_TTL = 300000; // 5 minutes

async function getApiConfig(): Promise<ApiConfig> {
  const now = Date.now();
  if (apiConfig && now - lastFetched < CACHE_TTL) {
    return apiConfig;
  }

  try {
    const response = await ssmClient.send(
      new GetParameterCommand({
        Name: process.env.API_CONFIG_PARAM!,
        WithDecryption: false,
      })
    );
    apiConfig = JSON.parse(response.Parameter?.Value || '{}');
    lastFetched = now;
    return apiConfig!;
  } catch (error) {
    logger.error('Failed to fetch API config', error as Error);
    throw error;
  }
}

async function getFeatureFlags(): Promise<FeatureFlags> {
  const now = Date.now();
  if (featureFlags && now - lastFetched < CACHE_TTL) {
    return featureFlags;
  }

  try {
    const response = await ssmClient.send(
      new GetParameterCommand({
        Name: process.env.FEATURE_FLAGS_PARAM!,
        WithDecryption: true,
      })
    );
    featureFlags = JSON.parse(response.Parameter?.Value || '{}');
    lastFetched = now;
    return featureFlags!;
  } catch (error) {
    logger.error('Failed to fetch feature flags', error as Error);
    throw error;
  }
}

async function calculateTotalAmount(items: OrderItem[]): Promise<number> {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
}

async function sendToDLQ(order: Order, error: Error): Promise<void> {
  try {
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: process.env.DLQ_URL!,
        MessageBody: JSON.stringify({
          order,
          error: error.message,
          timestamp: new Date().toISOString(),
        }),
      })
    );
  } catch (dlqError) {
    logger.error('Failed to send to DLQ', dlqError as Error);
  }
}

export const handler = tracer.captureLambdaHandler(async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Add cold start metric
  metrics.addMetric('ColdStart', MetricUnits.Count, 1);

  const segment = tracer.getSegment();

  try {
    // Log request
    logger.info('Processing request', {
      method: event.httpMethod,
      path: event.path,
      requestId: event.requestContext.requestId,
    });

    // Get configurations
    const [config, flags] = await Promise.all([
      getApiConfig(),
      getFeatureFlags(),
    ]);

    logger.info('Loaded configurations', { config, flags });

    if (event.httpMethod === 'POST') {
      // Create new order
      const order: Order = JSON.parse(event.body || '{}');
      order.orderId = randomUUID();
      order.status = 'pending';
      order.totalAmount = await calculateTotalAmount(order.items);
      order.createdAt = Date.now();
      order.updatedAt = Date.now();

      // Add custom metrics
      metrics.addMetric('OrderCreated', MetricUnits.Count, 1);
      metrics.addMetric('OrderValue', MetricUnits.None, order.totalAmount);
      metrics.addMetadata('order', {
        orderId: order.orderId,
        customerId: order.customerId,
        itemCount: order.items.length,
      });

      // Store in DynamoDB
      await docClient.send(
        new PutCommand({
          TableName: process.env.TABLE_NAME!,
          Item: {
            ...order,
            timestamp: order.createdAt,
          },
        })
      );

      logger.info('Order created successfully', { orderId: order.orderId });

      return {
        statusCode: 201,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': event.requestContext.requestId,
        },
        body: JSON.stringify({
          message: 'Order created successfully',
          orderId: order.orderId,
          status: order.status,
          totalAmount: order.totalAmount,
        }),
      };

    } else if (event.httpMethod === 'PUT') {
      // Update existing order
      const orderId = event.pathParameters?.orderId;
      const updates: Partial<Order> = JSON.parse(event.body || '{}');

      if (!orderId) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Order ID is required' }),
        };
      }

      // Build update expression
      const updateExpression = 'SET #status = :status, #updatedAt = :updatedAt';
      const expressionAttributeNames: any = {
        '#status': 'status',
        '#updatedAt': 'updatedAt',
      };
      const expressionAttributeValues: any = {
        ':status': updates.status || 'processing',
        ':updatedAt': Date.now(),
      };

      await docClient.send(
        new UpdateCommand({
          TableName: process.env.TABLE_NAME!,
          Key: {
            orderId: orderId,
            timestamp: Number(event.queryStringParameters?.timestamp),
          },
          UpdateExpression: updateExpression,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
        })
      );

      metrics.addMetric('OrderUpdated', MetricUnits.Count, 1);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': event.requestContext.requestId,
        },
        body: JSON.stringify({
          message: 'Order updated successfully',
          orderId: orderId,
        }),
      };
    }

    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };

  } catch (error) {
    logger.error('Error processing request', error as Error);
    metrics.addMetric('ProcessingError', MetricUnits.Count, 1);

    // Send failed orders to DLQ
    if (event.body) {
      await sendToDLQ(JSON.parse(event.body), error as Error);
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        requestId: event.requestContext.requestId,
      }),
    };
  } finally {
    metrics.publishStoredMetrics();
  }
});
```

### Query Orders Lambda - lib/lambda/query-orders.ts
```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Logger, Metrics, MetricUnits, Tracer } from '@aws-lambda-powertools/typescript';
import { captureAWSv3Client } from 'aws-xray-sdk-core';

// Initialize AWS SDK clients with X-Ray tracing
const dynamodbClient = captureAWSv3Client(new DynamoDBClient({}));
const docClient = DynamoDBDocumentClient.from(dynamodbClient);

// Initialize Powertools
const logger = new Logger({ serviceName: 'query-orders' });
const metrics = new Metrics({ namespace: 'FoodDelivery', serviceName: 'query-orders' });
const tracer = new Tracer({ serviceName: 'query-orders' });

export const handler = tracer.captureLambdaHandler(async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {

  try {
    logger.info('Processing query request', {
      method: event.httpMethod,
      path: event.path,
      pathParameters: event.pathParameters,
    });

    const orderId = event.pathParameters?.orderId;
    const customerId = event.pathParameters?.customerId;

    if (orderId) {
      // Get specific order
      const timestamp = event.queryStringParameters?.timestamp;

      if (!timestamp) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Timestamp is required for order lookup' }),
        };
      }

      const result = await docClient.send(
        new GetCommand({
          TableName: process.env.TABLE_NAME!,
          Key: {
            orderId: orderId,
            timestamp: Number(timestamp),
          },
        })
      );

      metrics.addMetric('OrderQueried', MetricUnits.Count, 1);

      if (!result.Item) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Order not found' }),
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': event.requestContext.requestId,
        },
        body: JSON.stringify(result.Item),
      };

    } else if (customerId) {
      // Query orders by customer
      const result = await docClient.send(
        new QueryCommand({
          TableName: process.env.TABLE_NAME!,
          IndexName: 'customerIdIndex',
          KeyConditionExpression: 'customerId = :customerId',
          ExpressionAttributeValues: {
            ':customerId': customerId,
          },
          ScanIndexForward: false,
          Limit: 50,
        })
      );

      metrics.addMetric('CustomerOrdersQueried', MetricUnits.Count, 1);
      metrics.addMetadata('query', {
        customerId: customerId,
        orderCount: result.Items?.length || 0,
      });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': event.requestContext.requestId,
        },
        body: JSON.stringify({
          orders: result.Items || [],
          count: result.Items?.length || 0,
        }),
      };
    }

    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid request parameters' }),
    };

  } catch (error) {
    logger.error('Error querying orders', error as Error);
    metrics.addMetric('QueryError', MetricUnits.Count, 1);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        requestId: event.requestContext.requestId,
      }),
    };
  } finally {
    metrics.publishStoredMetrics();
  }
});
```

### Updated Main Stack Integration - lib/tap-stack.ts
```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { FoodDeliveryStack } from './food-delivery-stack';

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

    // Instantiate the Food Delivery Stack
    new FoodDeliveryStack(this, 'FoodDeliveryStack', {
      stackName: `FoodDeliveryStack-${environmentSuffix}`,
      env: props?.env,
    });
  }
}
```

### Package Dependencies - package.json additions
```json
{
  "dependencies": {
    "@aws-lambda-powertools/logger": "^2.0.0",
    "@aws-lambda-powertools/metrics": "^2.0.0",
    "@aws-lambda-powertools/tracer": "^2.0.0",
    "@aws-sdk/client-dynamodb": "^3.500.0",
    "@aws-sdk/client-ssm": "^3.500.0",
    "@aws-sdk/client-sqs": "^3.500.0",
    "@aws-sdk/lib-dynamodb": "^3.500.0",
    "aws-xray-sdk-core": "^3.6.0"
  }
}
```

## Implementation Complete

The infrastructure code has been generated with all requested features including API Gateway REST API, Lambda functions with TypeScript handlers, DynamoDB with auto-scaling, IAM roles with least privilege, CloudWatch metrics and alarms, Systems Manager Parameter Store configurations, AWS X-Ray tracing, and SQS dead letter queue for failed processing. The solution follows AWS best practices and uses the latest AWS Lambda Powertools for TypeScript for enhanced observability.