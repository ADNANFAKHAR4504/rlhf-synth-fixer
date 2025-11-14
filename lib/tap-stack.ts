import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './config/environment-config';

export interface TapStackProps extends cdk.StackProps {
  environmentConfig: EnvironmentConfig;
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly tradeDataBucket: s3.Bucket;
  public readonly ordersTable: dynamodb.Table;
  public readonly orderProcessingQueue: sqs.Queue;
  public orderProcessingDlq: sqs.Queue;
  public readonly orderProcessingFunction: lambda.Function;
  public readonly api: apigateway.RestApi;
  public driftTopic: sns.Topic;
  public dashboard: cloudwatch.Dashboard;

  private readonly environmentConfig: EnvironmentConfig;
  private readonly environmentSuffix: string;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    this.environmentConfig = props.environmentConfig;
    this.environmentSuffix = props.environmentSuffix;

    // Create VPC
    this.vpc = this.createVpc();

    // Create S3 bucket
    this.tradeDataBucket = this.createS3Bucket();

    // Create DynamoDB table
    this.ordersTable = this.createDynamoDbTable();

    // Create SQS queues
    this.orderProcessingQueue = this.createSqsQueues();

    // Create Lambda function
    this.orderProcessingFunction = this.createLambdaFunction();

    // Create API Gateway
    this.api = this.createApiGateway();

    // Create monitoring resources
    this.createMonitoring();

    // Export all infrastructure outputs
    this.exportOutputs();
  }

  private exportOutputs(): void {
    // VPC Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `vpc-id-${this.environmentSuffix}`,
    });

    this.vpc.publicSubnets.forEach((subnet, index) => {
      new cdk.CfnOutput(this, `PublicSubnet${index + 1}Id`, {
        value: subnet.subnetId,
        description: `Public Subnet ${index + 1} ID`,
      });
    });

    this.vpc.privateSubnets.forEach((subnet, index) => {
      new cdk.CfnOutput(this, `PrivateSubnet${index + 1}Id`, {
        value: subnet.subnetId,
        description: `Private Subnet ${index + 1} ID`,
      });
    });

    // S3 Bucket Outputs
    new cdk.CfnOutput(this, 'TradeDataBucketName', {
      value: this.tradeDataBucket.bucketName,
      description: 'S3 bucket name for trade data',
      exportName: `trade-data-bucket-name-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TradeDataBucketArn', {
      value: this.tradeDataBucket.bucketArn,
      description: 'S3 bucket ARN for trade data',
    });

    // DynamoDB Table Outputs
    new cdk.CfnOutput(this, 'OrdersTableName', {
      value: this.ordersTable.tableName,
      description: 'DynamoDB table name for orders',
      exportName: `orders-table-name-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'OrdersTableArn', {
      value: this.ordersTable.tableArn,
      description: 'DynamoDB table ARN for orders',
    });

    new cdk.CfnOutput(this, 'OrdersTableStreamArn', {
      value: this.ordersTable.tableStreamArn || 'N/A',
      description: 'DynamoDB table stream ARN for orders',
    });

    // SQS Queue Outputs
    new cdk.CfnOutput(this, 'OrderProcessingQueueUrl', {
      value: this.orderProcessingQueue.queueUrl,
      description: 'SQS queue URL for order processing',
    });

    new cdk.CfnOutput(this, 'OrderProcessingQueueArn', {
      value: this.orderProcessingQueue.queueArn,
      description: 'SQS queue ARN for order processing',
      exportName: `order-processing-queue-arn-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'OrderProcessingDlqUrl', {
      value: this.orderProcessingDlq.queueUrl,
      description: 'SQS DLQ URL for order processing',
    });

    new cdk.CfnOutput(this, 'OrderProcessingDlqArn', {
      value: this.orderProcessingDlq.queueArn,
      description: 'SQS DLQ ARN for order processing',
    });

    // Lambda Function Outputs
    new cdk.CfnOutput(this, 'OrderProcessingFunctionArn', {
      value: this.orderProcessingFunction.functionArn,
      description: 'Lambda function ARN for order processing',
      exportName: `order-processing-function-arn-${this.environmentSuffix}`,
    });

    // API Gateway Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.api.url,
      description: 'API Gateway endpoint URL',
      exportName: `trading-api-endpoint-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: this.api.restApiId,
      description: 'API Gateway ID',
    });

    new cdk.CfnOutput(this, 'ApiStage', {
      value: this.api.deploymentStage.stageName,
      description: 'API Gateway stage name',
    });

    // Monitoring Outputs
    new cdk.CfnOutput(this, 'DashboardName', {
      value: this.dashboard.dashboardName,
      description: 'CloudWatch Dashboard name',
    });

    new cdk.CfnOutput(this, 'DriftTopicArn', {
      value: this.driftTopic.topicArn,
      description: 'SNS topic ARN for drift detection alerts',
      exportName: `drift-topic-arn-${this.environmentSuffix}`,
    });
  }

  private getResourceName(resourceName: string): string {
    return `${resourceName}-${this.environmentSuffix}`;
  }

  private exportToParameterStore(name: string, value: string): void {
    new ssm.StringParameter(this, `Param${name.replace(/-/g, '')}`, {
      parameterName: `/${this.environmentSuffix}/${name}`,
      stringValue: value,
      description: `${name} for ${this.environmentSuffix} environment`,
    });
  }

  private createVpc(): ec2.Vpc {
    const vpc = new ec2.Vpc(this, 'TradingVpc', {
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
          // Use PRIVATE_ISOLATED for dev (natGateways: 0) or PRIVATE_WITH_EGRESS for staging/prod
          subnetType:
            this.environmentConfig.vpcConfig.natGateways === 0
              ? ec2.SubnetType.PRIVATE_ISOLATED
              : ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Export VPC ID
    this.exportToParameterStore('vpc-id', vpc.vpcId);

    // Export subnet IDs
    vpc.privateSubnets.forEach((subnet, index) => {
      this.exportToParameterStore(
        `private-subnet-${index + 1}-id`,
        subnet.subnetId
      );
    });

    vpc.publicSubnets.forEach((subnet, index) => {
      this.exportToParameterStore(
        `public-subnet-${index + 1}-id`,
        subnet.subnetId
      );
    });

    return vpc;
  }

  private createS3Bucket(): s3.Bucket {
    const bucket = new s3.Bucket(this, 'TradeDataBucket', {
      bucketName: this.getResourceName('trade-data'),
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: this.environmentConfig.s3Config.versioning,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      enforceSSL: true,
      lifecycleRules: this.getS3LifecycleRules(),
    });

    // Export bucket details
    this.exportToParameterStore('trade-data-bucket-name', bucket.bucketName);
    this.exportToParameterStore('trade-data-bucket-arn', bucket.bucketArn);

    return bucket;
  }

  private getS3LifecycleRules(): s3.LifecycleRule[] {
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
        expiration: cdk.Duration.days(
          this.environmentConfig.s3Config.lifecycleDays
        ),
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

  private createDynamoDbTable(): dynamodb.Table {
    const table = new dynamodb.Table(this, 'OrdersTable', {
      tableName: this.getResourceName('orders'),
      partitionKey: {
        name: 'orderId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery:
        this.environmentConfig.dynamoConfig.pointInTimeRecovery,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Add GSI for status queries
    table.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: {
        name: 'status',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Export table details
    this.exportToParameterStore('orders-table-name', table.tableName);
    this.exportToParameterStore('orders-table-arn', table.tableArn);

    return table;
  }

  private createSqsQueues(): sqs.Queue {
    // Create DLQ
    this.orderProcessingDlq = new sqs.Queue(this, 'OrderProcessingDlq', {
      queueName: this.getResourceName('order-processing-dlq'),
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
    });

    this.exportToParameterStore(
      'order-processing-dlq-url',
      this.orderProcessingDlq.queueUrl
    );
    this.exportToParameterStore(
      'order-processing-dlq-arn',
      this.orderProcessingDlq.queueArn
    );

    // Create main queue
    const queue = new sqs.Queue(this, 'OrderProcessingQueue', {
      queueName: this.getResourceName('order-processing'),
      visibilityTimeout: cdk.Duration.seconds(
        this.environmentConfig.sqsConfig.visibilityTimeoutSeconds
      ),
      retentionPeriod: cdk.Duration.seconds(
        this.environmentConfig.sqsConfig.messageRetentionSeconds
      ),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      deadLetterQueue: {
        queue: this.orderProcessingDlq,
        maxReceiveCount: this.environmentConfig.sqsConfig.maxReceiveCount,
      },
    });

    this.exportToParameterStore('order-processing-queue-url', queue.queueUrl);
    this.exportToParameterStore('order-processing-queue-arn', queue.queueArn);

    return queue;
  }

  private createLambdaFunction(): lambda.Function {
    // Create execution role
    const executionRole = new iam.Role(this, 'OrderProcessingRole', {
      roleName: this.getResourceName('order-processing-role'),
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
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
        resources: [this.ordersTable.tableArn],
      })
    );

    executionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sqs:SendMessage', 'sqs:GetQueueUrl'],
        resources: [this.orderProcessingQueue.queueArn],
      })
    );

    executionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:PutObject', 's3:GetObject'],
        resources: [`${this.tradeDataBucket.bucketArn}/*`],
      })
    );

    // Create Lambda function (without VPC due to EIP limit)
    const lambdaFunction = new lambda.Function(
      this,
      'OrderProcessingFunction',
      {
        functionName: this.getResourceName('order-processing'),
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lib/lambda/order-processing'),
        memorySize: this.environmentConfig.lambdaConfig.memorySize,
        timeout: cdk.Duration.seconds(
          this.environmentConfig.lambdaConfig.timeout
        ),
        reservedConcurrentExecutions:
          this.environmentConfig.lambdaConfig.reservedConcurrentExecutions,
        role: executionRole,
        environment: {
          ENVIRONMENT: this.environmentSuffix,
          DYNAMODB_TABLE: this.ordersTable.tableName,
          SQS_QUEUE: this.orderProcessingQueue.queueName,
          S3_BUCKET: this.tradeDataBucket.bucketName,
        },
        logRetention: logs.RetentionDays.ONE_MONTH,
        tracing: lambda.Tracing.ACTIVE,
      }
    );

    // Export Lambda function ARN
    this.exportToParameterStore(
      'order-processing-function-arn',
      lambdaFunction.functionArn
    );

    return lambdaFunction;
  }

  private createApiGateway(): apigateway.RestApi {
    // Create CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'ApiGatewayLogGroup', {
      logGroupName: `/aws/apigateway/${this.getResourceName('trading-api')}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create REST API
    const api = new apigateway.RestApi(this, 'TradingApi', {
      restApiName: this.getResourceName('trading-api'),
      description: `Trading Platform API for ${this.environmentSuffix} environment`,
      deployOptions: {
        stageName: this.environmentSuffix,
        throttlingRateLimit:
          this.environmentConfig.apiGatewayConfig.throttleRateLimit,
        throttlingBurstLimit:
          this.environmentConfig.apiGatewayConfig.throttleBurstLimit,
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
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
      },
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
    });

    // Create Lambda integration
    const integration = new apigateway.LambdaIntegration(
      this.orderProcessingFunction,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
        proxy: true,
      }
    );

    // Create /orders resource
    const orders = api.root.addResource('orders');

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

    // Create usage plan
    const plan = api.addUsagePlan('UsagePlan', {
      name: this.getResourceName('usage-plan'),
      throttle: {
        rateLimit: this.environmentConfig.apiGatewayConfig.throttleRateLimit,
        burstLimit: this.environmentConfig.apiGatewayConfig.throttleBurstLimit,
      },
      quota: {
        limit:
          this.environmentConfig.apiGatewayConfig.throttleRateLimit * 86400,
        period: apigateway.Period.DAY,
      },
    });

    plan.addApiStage({
      stage: api.deploymentStage,
    });

    // Export API details
    this.exportToParameterStore('api-endpoint', api.url);
    this.exportToParameterStore('api-id', api.restApiId);

    return api;
  }

  private createMonitoring(): void {
    // Create SNS topic for drift detection
    this.driftTopic = new sns.Topic(this, 'DriftDetectionTopic', {
      topicName: this.getResourceName('drift-detection'),
      displayName: 'CloudFormation Drift Detection Alerts',
    });

    // Add email subscription
    this.driftTopic.addSubscription(
      new subscriptions.EmailSubscription(
        `ops-${this.environmentSuffix}@example.com`
      )
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
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    driftAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.driftTopic)
    );

    // Create dashboard
    this.dashboard = new cloudwatch.Dashboard(
      this,
      'TradingPlatformDashboard',
      {
        dashboardName: this.getResourceName('trading-platform'),
      }
    );

    // Add widgets
    this.dashboard.addWidgets(
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

    this.dashboard.addWidgets(
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

    this.dashboard.addWidgets(
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
    this.exportToParameterStore('drift-topic-arn', this.driftTopic.topicArn);
    this.exportToParameterStore('dashboard-name', this.dashboard.dashboardName);
  }
}
