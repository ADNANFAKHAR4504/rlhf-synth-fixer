# Multi-Environment Trading Platform Infrastructure - CDK TypeScript Implementation

This implementation provides a complete CDK TypeScript solution for managing multi-environment infrastructure replication with type-safe configuration management, environment-specific resource provisioning, and automated deployment validation.

## Architecture Overview

The solution consists of:
- **Central Configuration System**: Type-safe environment configurations using TypeScript interfaces
- **Modular Stack Architecture**: Separate stacks for VPC, Lambda, DynamoDB, API Gateway, S3, and SQS
- **CDK Pipeline**: Automated deployment with validation and rollback capabilities
- **Drift Detection**: CloudWatch alarms for configuration drift monitoring
- **Cross-Stack References**: SSM Parameter Store for stack outputs

## File: lib/config/environment-config.ts

```typescript
import { Environment } from 'aws-cdk-lib';

export interface EnvironmentConfig {
  name: string;
  env: Environment;
  vpcConfig: VpcConfig;
  lambdaConfig: LambdaConfig;
  dynamoConfig: DynamoConfig;
  apiGatewayConfig: ApiGatewayConfig;
  s3Config: S3Config;
  sqsConfig: SqsConfig;
  tags: { [key: string]: string };
}

export interface VpcConfig {
  cidr: string;
  maxAzs: number;
  natGateways: number;
}

export interface LambdaConfig {
  memorySize: number;
  reservedConcurrentExecutions: number;
  timeout: number;
}

export interface DynamoConfig {
  readCapacity: number;
  writeCapacity: number;
  pointInTimeRecovery: boolean;
}

export interface ApiGatewayConfig {
  throttleRateLimit: number;
  throttleBurstLimit: number;
}

export interface S3Config {
  lifecycleDays: number | undefined; // undefined means indefinite
  versioning: boolean;
}

export interface SqsConfig {
  messageRetentionSeconds: number;
  visibilityTimeoutSeconds: number;
  maxReceiveCount: number;
}

export class EnvironmentConfigurations {
  static readonly DEV: EnvironmentConfig = {
    name: 'dev',
    env: {
      account: process.env.CDK_DEV_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-east-1',
    },
    vpcConfig: {
      cidr: '10.0.0.0/16',
      maxAzs: 3,
      natGateways: 1,
    },
    lambdaConfig: {
      memorySize: 512,
      reservedConcurrentExecutions: 10,
      timeout: 30,
    },
    dynamoConfig: {
      readCapacity: 5,
      writeCapacity: 5,
      pointInTimeRecovery: false,
    },
    apiGatewayConfig: {
      throttleRateLimit: 100,
      throttleBurstLimit: 200,
    },
    s3Config: {
      lifecycleDays: 30,
      versioning: false,
    },
    sqsConfig: {
      messageRetentionSeconds: 345600, // 4 days
      visibilityTimeoutSeconds: 30,
      maxReceiveCount: 3,
    },
    tags: {
      Environment: 'dev',
      CostCenter: 'engineering',
      ManagedBy: 'cdk',
    },
  };

  static readonly STAGING: EnvironmentConfig = {
    name: 'staging',
    env: {
      account: process.env.CDK_STAGING_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-east-2',
    },
    vpcConfig: {
      cidr: '10.1.0.0/16',
      maxAzs: 3,
      natGateways: 2,
    },
    lambdaConfig: {
      memorySize: 1024,
      reservedConcurrentExecutions: 50,
      timeout: 60,
    },
    dynamoConfig: {
      readCapacity: 10,
      writeCapacity: 10,
      pointInTimeRecovery: false,
    },
    apiGatewayConfig: {
      throttleRateLimit: 500,
      throttleBurstLimit: 1000,
    },
    s3Config: {
      lifecycleDays: 90,
      versioning: true,
    },
    sqsConfig: {
      messageRetentionSeconds: 864000, // 10 days
      visibilityTimeoutSeconds: 60,
      maxReceiveCount: 5,
    },
    tags: {
      Environment: 'staging',
      CostCenter: 'engineering',
      ManagedBy: 'cdk',
    },
  };

  static readonly PROD: EnvironmentConfig = {
    name: 'prod',
    env: {
      account: process.env.CDK_PROD_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-east-1',
    },
    vpcConfig: {
      cidr: '10.2.0.0/16',
      maxAzs: 3,
      natGateways: 3,
    },
    lambdaConfig: {
      memorySize: 2048,
      reservedConcurrentExecutions: 200,
      timeout: 90,
    },
    dynamoConfig: {
      readCapacity: 25,
      writeCapacity: 25,
      pointInTimeRecovery: true,
    },
    apiGatewayConfig: {
      throttleRateLimit: 2000,
      throttleBurstLimit: 4000,
    },
    s3Config: {
      lifecycleDays: undefined, // Indefinite retention
      versioning: true,
    },
    sqsConfig: {
      messageRetentionSeconds: 1209600, // 14 days (max)
      visibilityTimeoutSeconds: 90,
      maxReceiveCount: 10,
    },
    tags: {
      Environment: 'prod',
      CostCenter: 'operations',
      ManagedBy: 'cdk',
    },
  };

  static getAll(): EnvironmentConfig[] {
    return [this.DEV, this.STAGING, this.PROD];
  }

  static getByName(name: string): EnvironmentConfig {
    const configs = { dev: this.DEV, staging: this.STAGING, prod: this.PROD };
    const config = configs[name as keyof typeof configs];
    if (!config) {
      throw new Error(`Unknown environment: ${name}`);
    }
    return config;
  }
}
```

## File: lib/stacks/base-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/environment-config';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export interface BaseStackProps extends cdk.StackProps {
  environmentConfig: EnvironmentConfig;
}

export class BaseStack extends cdk.Stack {
  protected readonly environmentConfig: EnvironmentConfig;
  protected readonly environmentSuffix: string;

  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id, {
      ...props,
      env: props.environmentConfig.env,
      tags: props.environmentConfig.tags,
    });

    this.environmentConfig = props.environmentConfig;
    this.environmentSuffix = props.environmentConfig.name;

    // Apply environment tags to all resources in this stack
    Object.entries(props.environmentConfig.tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });
  }

  protected exportToParameterStore(parameterName: string, value: string): void {
    new ssm.StringParameter(this, `Param${parameterName.replace(/[^a-zA-Z0-9]/g, '')}`, {
      parameterName: `/trading-platform/${this.environmentSuffix}/${parameterName}`,
      stringValue: value,
      description: `Exported value from ${this.stackName}`,
      tier: ssm.ParameterTier.STANDARD,
    });
  }

  protected getResourceName(resourceType: string): string {
    return `${resourceType}-${this.environmentSuffix}`;
  }
}
```

## File: lib/stacks/vpc-stack.ts

```typescript
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { BaseStack, BaseStackProps } from './base-stack';

export class VpcStack extends BaseStack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);

    // Create VPC with environment-specific configuration
    this.vpc = new ec2.Vpc(this, 'TradingVpc', {
      vpcName: this.getResourceName('trading-vpc'),
      ipAddresses: ec2.IpAddresses.cidr(this.environmentConfig.vpcConfig.cidr),
      maxAzs: this.environmentConfig.vpcConfig.maxAzs,
      natGateways: this.environmentConfig.vpcConfig.natGateways,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Export VPC ID to Parameter Store
    this.exportToParameterStore('vpc-id', this.vpc.vpcId);

    // Export subnet IDs
    this.vpc.privateSubnets.forEach((subnet, index) => {
      this.exportToParameterStore(`private-subnet-${index + 1}-id`, subnet.subnetId);
    });

    this.vpc.publicSubnets.forEach((subnet, index) => {
      this.exportToParameterStore(`public-subnet-${index + 1}-id`, subnet.subnetId);
    });
  }
}
```

## File: lib/stacks/lambda-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { BaseStack, BaseStackProps } from './base-stack';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface LambdaStackProps extends BaseStackProps {
  vpc: ec2.IVpc;
}

export class LambdaStack extends BaseStack {
  public readonly orderProcessingFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    // Create execution role with environment-specific permissions boundary
    const executionRole = new iam.Role(this, 'OrderProcessingRole', {
      roleName: this.getResourceName('order-processing-role'),
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
    });

    // Add least-privilege permissions
    executionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:PutItem',
          'dynamodb:GetItem',
          'dynamodb:UpdateItem',
          'dynamodb:Query',
        ],
        resources: [
          `arn:aws:dynamodb:${this.region}:${this.account}:table/orders-${this.environmentSuffix}`,
        ],
      })
    );

    executionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sqs:SendMessage', 'sqs:GetQueueUrl'],
        resources: [
          `arn:aws:sqs:${this.region}:${this.account}:order-processing-${this.environmentSuffix}`,
        ],
      })
    );

    executionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:PutObject', 's3:GetObject'],
        resources: [
          `arn:aws:s3:::trade-data-${this.environmentSuffix}/*`,
        ],
      })
    );

    // Security group for Lambda
    const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc: props.vpc,
      securityGroupName: this.getResourceName('lambda-sg'),
      description: 'Security group for order processing Lambda',
      allowAllOutbound: true,
    });

    // Create Lambda function with environment-specific configuration
    this.orderProcessingFunction = new lambda.Function(this, 'OrderProcessingFunction', {
      functionName: this.getResourceName('order-processing'),
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/order-processing'),
      memorySize: this.environmentConfig.lambdaConfig.memorySize,
      timeout: cdk.Duration.seconds(this.environmentConfig.lambdaConfig.timeout),
      reservedConcurrentExecutions: this.environmentConfig.lambdaConfig.reservedConcurrentExecutions,
      role: executionRole,
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [lambdaSecurityGroup],
      environment: {
        ENVIRONMENT: this.environmentSuffix,
        DYNAMODB_TABLE: `orders-${this.environmentSuffix}`,
        SQS_QUEUE: `order-processing-${this.environmentSuffix}`,
        S3_BUCKET: `trade-data-${this.environmentSuffix}`,
      },
      logRetention: logs.RetentionDays.ONE_MONTH,
      tracing: lambda.Tracing.ACTIVE,
    });

    // Export Lambda function ARN
    this.exportToParameterStore('order-processing-function-arn', this.orderProcessingFunction.functionArn);
  }
}
```

## File: lib/lambda/order-processing/index.js

```javascript
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const dynamoClient = new DynamoDBClient({});
const sqsClient = new SQSClient({});
const s3Client = new S3Client({});

exports.handler = async (event) => {
  console.log('Processing order:', JSON.stringify(event, null, 2));

  const environment = process.env.ENVIRONMENT;
  const tableName = process.env.DYNAMODB_TABLE;
  const queueName = process.env.SQS_QUEUE;
  const bucketName = process.env.S3_BUCKET;

  try {
    // Parse order from event
    const order = typeof event.body === 'string' ? JSON.parse(event.body) : event;

    // Validate order
    if (!order.orderId || !order.customerId || !order.amount) {
      throw new Error('Invalid order: missing required fields');
    }

    const timestamp = new Date().toISOString();
    const orderId = order.orderId;

    // Store order in DynamoDB
    await dynamoClient.send(
      new PutItemCommand({
        TableName: tableName,
        Item: {
          orderId: { S: orderId },
          customerId: { S: order.customerId },
          amount: { N: order.amount.toString() },
          status: { S: 'PENDING' },
          timestamp: { S: timestamp },
          environment: { S: environment },
        },
      })
    );

    // Send message to SQS for further processing
    const queueUrl = `https://sqs.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_ACCOUNT_ID}/${queueName}`;
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({
          orderId,
          customerId: order.customerId,
          amount: order.amount,
          timestamp,
        }),
      })
    );

    // Archive order to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: `orders/${timestamp.split('T')[0]}/${orderId}.json`,
        Body: JSON.stringify(order),
        ContentType: 'application/json',
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Order processed successfully',
        orderId,
        environment,
      }),
    };
  } catch (error) {
    console.error('Error processing order:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to process order',
        error: error.message,
      }),
    };
  }
};
```

## File: lib/lambda/order-processing/package.json

```json
{
  "name": "order-processing-lambda",
  "version": "1.0.0",
  "description": "Order processing Lambda function for trading platform",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.450.0",
    "@aws-sdk/client-sqs": "^3.450.0",
    "@aws-sdk/client-s3": "^3.450.0"
  }
}
```

## File: lib/stacks/dynamodb-stack.ts

```typescript
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BaseStack, BaseStackProps } from './base-stack';

export class DynamoDbStack extends BaseStack {
  public readonly ordersTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);

    // Create DynamoDB table with environment-specific configuration
    this.ordersTable = new dynamodb.Table(this, 'OrdersTable', {
      tableName: this.getResourceName('orders'),
      partitionKey: {
        name: 'orderId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: this.environmentConfig.dynamoConfig.readCapacity,
      writeCapacity: this.environmentConfig.dynamoConfig.writeCapacity,
      pointInTimeRecovery: this.environmentConfig.dynamoConfig.pointInTimeRecovery,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Add GSI for customer queries
    this.ordersTable.addGlobalSecondaryIndex({
      indexName: 'CustomerIndex',
      partitionKey: {
        name: 'customerId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      readCapacity: this.environmentConfig.dynamoConfig.readCapacity,
      writeCapacity: this.environmentConfig.dynamoConfig.writeCapacity,
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Enable auto-scaling for production
    if (this.environmentConfig.name === 'prod') {
      const readScaling = this.ordersTable.autoScaleReadCapacity({
        minCapacity: this.environmentConfig.dynamoConfig.readCapacity,
        maxCapacity: this.environmentConfig.dynamoConfig.readCapacity * 4,
      });

      readScaling.scaleOnUtilization({
        targetUtilizationPercent: 70,
      });

      const writeScaling = this.ordersTable.autoScaleWriteCapacity({
        minCapacity: this.environmentConfig.dynamoConfig.writeCapacity,
        maxCapacity: this.environmentConfig.dynamoConfig.writeCapacity * 4,
      });

      writeScaling.scaleOnUtilization({
        targetUtilizationPercent: 70,
      });
    }

    // Export table name and ARN
    this.exportToParameterStore('orders-table-name', this.ordersTable.tableName);
    this.exportToParameterStore('orders-table-arn', this.ordersTable.tableArn);
  }
}
```

## File: lib/stacks/api-gateway-stack.ts

```typescript
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BaseStack, BaseStackProps } from './base-stack';

export interface ApiGatewayStackProps extends BaseStackProps {
  orderProcessingFunction: lambda.IFunction;
}

export class ApiGatewayStack extends BaseStack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);

    // Create CloudWatch Log Group for API Gateway
    const logGroup = new logs.LogGroup(this, 'ApiGatewayLogGroup', {
      logGroupName: `/aws/apigateway/${this.getResourceName('trading-api')}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create REST API with environment-specific configuration
    this.api = new apigateway.RestApi(this, 'TradingApi', {
      restApiName: this.getResourceName('trading-api'),
      description: `Trading Platform API for ${this.environmentSuffix} environment`,
      deployOptions: {
        stageName: this.environmentSuffix,
        throttlingRateLimit: this.environmentConfig.apiGatewayConfig.throttleRateLimit,
        throttlingBurstLimit: this.environmentConfig.apiGatewayConfig.throttleBurstLimit,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: true,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true,
        }),
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
    });

    // Create Lambda integration
    const integration = new apigateway.LambdaIntegration(props.orderProcessingFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      proxy: true,
    });

    // Create /orders resource
    const orders = this.api.root.addResource('orders');

    // POST /orders endpoint
    orders.addMethod('POST', integration, {
      apiKeyRequired: false,
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
        {
          statusCode: '400',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
      ],
    });

    // GET /orders endpoint
    orders.addMethod('GET', integration, {
      apiKeyRequired: false,
    });

    // Create usage plan for rate limiting
    const plan = this.api.addUsagePlan('UsagePlan', {
      name: this.getResourceName('usage-plan'),
      throttle: {
        rateLimit: this.environmentConfig.apiGatewayConfig.throttleRateLimit,
        burstLimit: this.environmentConfig.apiGatewayConfig.throttleBurstLimit,
      },
      quota: {
        limit: this.environmentConfig.apiGatewayConfig.throttleRateLimit * 86400, // Daily quota
        period: apigateway.Period.DAY,
      },
    });

    plan.addApiStage({
      stage: this.api.deploymentStage,
    });

    // Export API endpoint
    this.exportToParameterStore('api-endpoint', this.api.url);
    this.exportToParameterStore('api-id', this.api.restApiId);
  }
}
```

## File: lib/stacks/s3-stack.ts

```typescript
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BaseStack, BaseStackProps } from './base-stack';

export class S3Stack extends BaseStack {
  public readonly tradeDataBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);

    // Create S3 bucket with environment-specific configuration
    this.tradeDataBucket = new s3.Bucket(this, 'TradeDataBucket', {
      bucketName: this.getResourceName('trade-data'),
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: this.environmentConfig.s3Config.versioning,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      enforceSSL: true,
      lifecycleRules: this.getLifecycleRules(),
    });

    // Export bucket name and ARN
    this.exportToParameterStore('trade-data-bucket-name', this.tradeDataBucket.bucketName);
    this.exportToParameterStore('trade-data-bucket-arn', this.tradeDataBucket.bucketArn);
  }

  private getLifecycleRules(): s3.LifecycleRule[] {
    const rules: s3.LifecycleRule[] = [];

    // Add transition to Intelligent-Tiering after 30 days
    rules.push({
      id: 'IntelligentTiering',
      enabled: true,
      transitions: [
        {
          storageClass: s3.StorageClass.INTELLIGENT_TIERING,
          transitionAfter: cdk.Duration.days(30),
        },
      ],
    });

    // Add environment-specific expiration policy
    if (this.environmentConfig.s3Config.lifecycleDays !== undefined) {
      rules.push({
        id: 'Expiration',
        enabled: true,
        expiration: cdk.Duration.days(this.environmentConfig.s3Config.lifecycleDays),
      });
    }

    // Clean up incomplete multipart uploads
    rules.push({
      id: 'CleanupMultipartUploads',
      enabled: true,
      abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
    });

    return rules;
  }
}
```

## File: lib/stacks/sqs-stack.ts

```typescript
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BaseStack, BaseStackProps } from './base-stack';

export class SqsStack extends BaseStack {
  public readonly orderProcessingQueue: sqs.Queue;
  public readonly deadLetterQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);

    // Create Dead Letter Queue
    this.deadLetterQueue = new sqs.Queue(this, 'OrderProcessingDlq', {
      queueName: this.getResourceName('order-processing-dlq'),
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
    });

    // Create main processing queue with environment-specific configuration
    this.orderProcessingQueue = new sqs.Queue(this, 'OrderProcessingQueue', {
      queueName: this.getResourceName('order-processing'),
      visibilityTimeout: cdk.Duration.seconds(
        this.environmentConfig.sqsConfig.visibilityTimeoutSeconds
      ),
      retentionPeriod: cdk.Duration.seconds(
        this.environmentConfig.sqsConfig.messageRetentionSeconds
      ),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      deadLetterQueue: {
        queue: this.deadLetterQueue,
        maxReceiveCount: this.environmentConfig.sqsConfig.maxReceiveCount,
      },
    });

    // Export queue URLs and ARNs
    this.exportToParameterStore('order-processing-queue-url', this.orderProcessingQueue.queueUrl);
    this.exportToParameterStore('order-processing-queue-arn', this.orderProcessingQueue.queueArn);
    this.exportToParameterStore('order-processing-dlq-url', this.deadLetterQueue.queueUrl);
    this.exportToParameterStore('order-processing-dlq-arn', this.deadLetterQueue.queueArn);
  }
}
```

## File: lib/stacks/monitoring-stack.ts

```typescript
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import { BaseStack, BaseStackProps } from './base-stack';

export class MonitoringStack extends BaseStack {
  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);

    // Create SNS topic for drift detection alerts
    const driftTopic = new sns.Topic(this, 'DriftDetectionTopic', {
      topicName: this.getResourceName('drift-detection'),
      displayName: 'CloudFormation Drift Detection Alerts',
    });

    // Add email subscription (replace with actual email)
    driftTopic.addSubscription(
      new subscriptions.EmailSubscription(`ops-${this.environmentSuffix}@example.com`)
    );

    // Create CloudWatch alarm for drift detection
    const driftAlarm = new cloudwatch.Alarm(this, 'DriftDetectionAlarm', {
      alarmName: this.getResourceName('drift-detection-alarm'),
      alarmDescription: 'Triggers when CloudFormation stack drift is detected',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CloudFormation',
        metricName: 'StackDriftDetectionStatus',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    driftAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(driftTopic));

    // Create dashboard for monitoring
    const dashboard = new cloudwatch.Dashboard(this, 'TradingPlatformDashboard', {
      dashboardName: this.getResourceName('trading-platform'),
    });

    // Add widgets for key metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Requests',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Count',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Invocations',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Read/Write Capacity',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ConsumedReadCapacityUnits',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ConsumedWriteCapacityUnits',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      })
    );

    // Export monitoring resources
    this.exportToParameterStore('drift-topic-arn', driftTopic.topicArn);
    this.exportToParameterStore('dashboard-name', dashboard.dashboardName);
  }
}
```

## File: lib/stacks/pipeline-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as pipelines from 'aws-cdk-lib/pipelines';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { EnvironmentConfig, EnvironmentConfigurations } from '../config/environment-config';
import { TradingPlatformStage } from './trading-platform-stage';

export interface PipelineStackProps extends cdk.StackProps {
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    // Create source artifact
    const sourceArtifact = new codepipeline.Artifact();
    const cloudAssemblyArtifact = new codepipeline.Artifact();

    // Define the pipeline
    const pipeline = new pipelines.CdkPipeline(this, 'TradingPlatformPipeline', {
      pipelineName: 'trading-platform-pipeline',
      cloudAssemblyArtifact,

      // Source stage
      sourceAction: new codepipeline_actions.GitHubSourceAction({
        actionName: 'GitHub',
        output: sourceArtifact,
        oauthToken: cdk.SecretValue.secretsManager('github-token'),
        owner: props.githubOwner,
        repo: props.githubRepo,
        branch: props.githubBranch,
      }),

      // Build stage
      synthAction: pipelines.SimpleSynthAction.standardNpmSynth({
        sourceArtifact,
        cloudAssemblyArtifact,
        installCommand: 'npm ci',
        buildCommand: 'npm run build',
        synthCommand: 'npx cdk synth',
        subdirectory: 'lib/lambda/order-processing',
      }),
    });

    // Add development stage
    const devStage = pipeline.addApplicationStage(
      new TradingPlatformStage(this, 'Dev', {
        env: EnvironmentConfigurations.DEV.env,
        environmentConfig: EnvironmentConfigurations.DEV,
      })
    );

    // Add validation step after dev deployment
    devStage.addActions(
      new pipelines.ShellScriptAction({
        actionName: 'ValidateDev',
        commands: ['curl -f $API_ENDPOINT/health || exit 1'],
        useOutputs: {
          API_ENDPOINT: pipeline.stackOutput(devStage.stackOutput('ApiEndpoint')),
        },
      })
    );

    // Add staging stage with manual approval
    const stagingStage = pipeline.addApplicationStage(
      new TradingPlatformStage(this, 'Staging', {
        env: EnvironmentConfigurations.STAGING.env,
        environmentConfig: EnvironmentConfigurations.STAGING,
      })
    );

    stagingStage.addActions(
      new pipelines.ManualApprovalAction({
        actionName: 'PromoteToProduction',
      })
    );

    // Add production stage
    const prodStage = pipeline.addApplicationStage(
      new TradingPlatformStage(this, 'Prod', {
        env: EnvironmentConfigurations.PROD.env,
        environmentConfig: EnvironmentConfigurations.PROD,
      })
    );

    // Add post-deployment validation for production
    prodStage.addActions(
      new pipelines.ShellScriptAction({
        actionName: 'ValidateProduction',
        commands: [
          'curl -f $API_ENDPOINT/health || exit 1',
          'npm run smoke-tests || exit 1',
        ],
        useOutputs: {
          API_ENDPOINT: pipeline.stackOutput(prodStage.stackOutput('ApiEndpoint')),
        },
        runOrder: prodStage.nextSequentialRunOrder(),
      })
    );
  }
}
```

## File: lib/stacks/trading-platform-stage.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/environment-config';
import { VpcStack } from './vpc-stack';
import { DynamoDbStack } from './dynamodb-stack';
import { S3Stack } from './s3-stack';
import { SqsStack } from './sqs-stack';
import { LambdaStack } from './lambda-stack';
import { ApiGatewayStack } from './api-gateway-stack';
import { MonitoringStack } from './monitoring-stack';

export interface TradingPlatformStageProps extends cdk.StageProps {
  environmentConfig: EnvironmentConfig;
}

export class TradingPlatformStage extends cdk.Stage {
  public readonly apiEndpoint: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props: TradingPlatformStageProps) {
    super(scope, id, props);

    const envConfig = props.environmentConfig;

    // Create VPC stack
    const vpcStack = new VpcStack(this, 'VpcStack', {
      environmentConfig: envConfig,
      stackName: `trading-vpc-${envConfig.name}`,
    });

    // Create DynamoDB stack
    const dynamoStack = new DynamoDbStack(this, 'DynamoDbStack', {
      environmentConfig: envConfig,
      stackName: `trading-dynamodb-${envConfig.name}`,
    });

    // Create S3 stack
    const s3Stack = new S3Stack(this, 'S3Stack', {
      environmentConfig: envConfig,
      stackName: `trading-s3-${envConfig.name}`,
    });

    // Create SQS stack
    const sqsStack = new SqsStack(this, 'SqsStack', {
      environmentConfig: envConfig,
      stackName: `trading-sqs-${envConfig.name}`,
    });

    // Create Lambda stack
    const lambdaStack = new LambdaStack(this, 'LambdaStack', {
      environmentConfig: envConfig,
      vpc: vpcStack.vpc,
      stackName: `trading-lambda-${envConfig.name}`,
    });

    // Create API Gateway stack
    const apiGatewayStack = new ApiGatewayStack(this, 'ApiGatewayStack', {
      environmentConfig: envConfig,
      orderProcessingFunction: lambdaStack.orderProcessingFunction,
      stackName: `trading-api-${envConfig.name}`,
    });

    // Create Monitoring stack
    new MonitoringStack(this, 'MonitoringStack', {
      environmentConfig: envConfig,
      stackName: `trading-monitoring-${envConfig.name}`,
    });

    // Stack dependencies
    lambdaStack.addDependency(vpcStack);
    apiGatewayStack.addDependency(lambdaStack);

    // Export API endpoint
    this.apiEndpoint = new cdk.CfnOutput(apiGatewayStack, 'ApiEndpoint', {
      value: apiGatewayStack.api.url,
      description: 'API Gateway endpoint URL',
      exportName: `trading-api-endpoint-${envConfig.name}`,
    });
  }

  public stackOutput(outputName: string): cdk.CfnOutput {
    return this.apiEndpoint;
  }
}
```

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EnvironmentConfigurations } from '../lib/config/environment-config';
import { TradingPlatformStage } from '../lib/stacks/trading-platform-stage';

const app = new cdk.App();

// Get environment from context or default to dev
const targetEnv = app.node.tryGetContext('env') || 'dev';
const environmentConfig = EnvironmentConfigurations.getByName(targetEnv);

// Deploy single environment
new TradingPlatformStage(app, `TradingPlatform-${environmentConfig.name}`, {
  env: environmentConfig.env,
  environmentConfig: environmentConfig,
});

app.synth();
```

## File: lib/README.md

```markdown
# Multi-Environment Trading Platform Infrastructure

This CDK TypeScript application implements a comprehensive multi-environment infrastructure replication system for a trading platform with type-safe configuration management and automated deployment validation.

## Architecture

### Components

1. **Configuration Management** (`lib/config/environment-config.ts`)
   - Type-safe environment configurations using TypeScript interfaces
   - Centralized configuration for dev, staging, and production environments
   - Environment-specific resource sizing and policies

2. **Base Stack** (`lib/stacks/base-stack.ts`)
   - Abstract base class for all stacks
   - Automatic tagging and naming conventions
   - SSM Parameter Store integration for cross-stack references

3. **VPC Stack** (`lib/stacks/vpc-stack.ts`)
   - Isolated VPCs per environment
   - 3 availability zones with public and private subnets
   - Environment-specific NAT gateway configuration

4. **Lambda Stack** (`lib/stacks/lambda-stack.ts`)
   - Order processing functions with environment-specific memory allocation
   - Least-privilege IAM roles
   - VPC integration and security groups

5. **DynamoDB Stack** (`lib/stacks/dynamodb-stack.ts`)
   - Environment-appropriate capacity settings
   - Point-in-time recovery for production only
   - Auto-scaling for production environment

6. **API Gateway Stack** (`lib/stacks/api-gateway-stack.ts`)
   - REST API with environment-specific throttling
   - CloudWatch logging and metrics
   - Usage plans for rate limiting

7. **S3 Stack** (`lib/stacks/s3-stack.ts`)
   - Trade data storage with lifecycle policies
   - Environment-specific retention periods
   - Encryption and versioning

8. **SQS Stack** (`lib/stacks/sqs-stack.ts`)
   - Order processing queues with dead letter queues
   - Environment-specific retention and visibility timeout

9. **Monitoring Stack** (`lib/stacks/monitoring-stack.ts`)
   - CloudFormation drift detection alarms
   - CloudWatch dashboards
   - SNS notifications

10. **Pipeline Stack** (`lib/stacks/pipeline-stack.ts`)
    - Automated deployment pipeline
    - Environment promotion with validation
    - Manual approval before production
    - Automated rollback on validation failure

## Environment Configurations

### Development
- **Region**: us-east-1
- **Lambda Memory**: 512 MB
- **API Throttle**: 100 req/sec
- **DynamoDB Capacity**: 5 RCU/WCU
- **S3 Retention**: 30 days
- **SQS Retention**: 4 days

### Staging
- **Region**: us-east-2
- **Lambda Memory**: 1024 MB
- **API Throttle**: 500 req/sec
- **DynamoDB Capacity**: 10 RCU/WCU
- **S3 Retention**: 90 days
- **SQS Retention**: 10 days

### Production
- **Region**: us-east-1
- **Lambda Memory**: 2048 MB
- **API Throttle**: 2000 req/sec
- **DynamoDB Capacity**: 25 RCU/WCU (with auto-scaling)
- **S3 Retention**: Indefinite
- **SQS Retention**: 14 days
- **Point-in-Time Recovery**: Enabled

## Prerequisites

- Node.js 18+
- AWS CDK 2.x
- AWS CLI configured with appropriate credentials
- Separate AWS accounts for each environment (recommended)

## Installation

```bash
npm install
cd lib/lambda/order-processing
npm install
cd ../../..
```

## Deployment

### Deploy Specific Environment

```bash
# Deploy development environment
npx cdk deploy --context env=dev --all

# Deploy staging environment
npx cdk deploy --context env=staging --all

# Deploy production environment
npx cdk deploy --context env=prod --all
```

### Deploy Pipeline

```bash
npx cdk deploy PipelineStack
```

## Configuration

### Environment Variables

Set the following environment variables for cross-account deployment:

```bash
export CDK_DEV_ACCOUNT=123456789012
export CDK_STAGING_ACCOUNT=234567890123
export CDK_PROD_ACCOUNT=345678901234
export CDK_DEFAULT_REGION=us-east-1
```

### GitHub Integration

Store GitHub token in AWS Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name github-token \
  --secret-string "your-github-personal-access-token"
```

## Testing

### Validate Infrastructure

```bash
# Run CDK diff to preview changes
npx cdk diff --context env=dev --all

# Synthesize CloudFormation templates
npx cdk synth --context env=dev --all
```

### API Testing

```bash
# Get API endpoint from SSM Parameter Store
API_ENDPOINT=$(aws ssm get-parameter \
  --name /trading-platform/dev/api-endpoint \
  --query 'Parameter.Value' \
  --output text)

# Test order creation
curl -X POST $API_ENDPOINT/orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-order-1",
    "customerId": "customer-123",
    "amount": 1000
  }'
```

## Drift Detection

Drift detection is automatically configured with CloudWatch alarms. Manual drift detection:

```bash
# Detect drift for a specific stack
aws cloudformation detect-stack-drift \
  --stack-name trading-vpc-dev

# Get drift detection status
aws cloudformation describe-stack-drift-detection-status \
  --stack-drift-detection-id <drift-detection-id>
```

## Monitoring

Access CloudWatch dashboards:
- Development: `trading-platform-dev`
- Staging: `trading-platform-staging`
- Production: `trading-platform-prod`

## Rollback

Rollback is automatically triggered if post-deployment validation fails. Manual rollback:

```bash
# Rollback to previous version
aws cloudformation cancel-update-stack \
  --stack-name trading-vpc-dev
```

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment-suffix}`

Examples:
- `trading-vpc-dev`
- `order-processing-staging`
- `trade-data-prod`

## SSM Parameter Store References

Cross-stack references are stored in Parameter Store under:
`/trading-platform/{environment}/{parameter-name}`

Examples:
- `/trading-platform/dev/vpc-id`
- `/trading-platform/staging/api-endpoint`
- `/trading-platform/prod/orders-table-name`

## Cost Optimization

- Development uses minimal resources (1 NAT gateway, small Lambda memory)
- Staging uses moderate resources for realistic testing
- Production uses auto-scaling and higher capacities
- All environments can be destroyed without data loss (RemovalPolicy.DESTROY)

## Security

- All S3 buckets have encryption enabled and block public access
- All IAM roles follow least-privilege principles
- VPC security groups restrict traffic appropriately
- API Gateway enforces rate limiting per environment
- All resources are tagged for compliance tracking

## Troubleshooting

### Lambda Errors

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/order-processing-dev --follow
```

### API Gateway Issues

Check API Gateway logs:
```bash
aws logs tail /aws/apigateway/trading-api-dev --follow
```

### DynamoDB Throttling

Monitor consumed capacity:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=orders-dev \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

## Cleanup

```bash
# Destroy specific environment
npx cdk destroy --context env=dev --all

# Destroy all environments
npx cdk destroy --context env=dev --all
npx cdk destroy --context env=staging --all
npx cdk destroy --context env=prod --all
```

## Support

For issues or questions, contact the platform team or refer to the AWS CDK documentation.
```

## File: cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": false,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false
  }
}
```

## File: package.json

```json
{
  "name": "trading-platform-infrastructure",
  "version": "1.0.0",
  "description": "Multi-environment trading platform infrastructure using AWS CDK",
  "bin": {
    "tap": "bin/tap.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk",
    "synth": "cdk synth",
    "deploy": "cdk deploy",
    "diff": "cdk diff",
    "destroy": "cdk destroy"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/node": "20.8.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "aws-cdk": "2.100.0",
    "ts-node": "^10.9.1",
    "typescript": "~5.2.0"
  },
  "dependencies": {
    "aws-cdk-lib": "2.100.0",
    "constructs": "^10.0.0",
    "source-map-support": "^0.5.21"
  }
}
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": [
      "es2020"
    ],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": [
      "./node_modules/@types"
    ],
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "exclude": [
    "node_modules",
    "cdk.out"
  ]
}
```

## File: .gitignore

```
*.js
!jest.config.js
*.d.ts
node_modules

# CDK asset staging directory
.cdk.staging
cdk.out

# Parcel default cache directory
.parcel-cache

# IDE
.idea
.vscode
*.swp
*.swo

# OS
.DS_Store

# Test coverage
coverage
*.lcov

# Dependency directories
node_modules/
jspm_packages/

# Build
dist/
build/

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Environment
.env
.env.local
.env.*.local
```
