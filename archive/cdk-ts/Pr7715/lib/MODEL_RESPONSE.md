### Reasoning Trace
---

The user is asking for a complete, production-grade AWS CDK TypeScript stack file that includes all the typical services in a modern cloud application. They want everything in a single file, with dynamic configuration, and following best practices.

Let me create a comprehensive TapStack that includes:
1. Multiple Lambda functions
2. API Gateway (REST API)
3. CloudFront + S3 for frontend hosting
4. KMS keys for encryption
5. DynamoDB tables
6. SNS topics and SQS queues
7. CloudWatch logs, dashboards, and alarms
8. VPC configuration
9. IAM roles and policies
10. All properly interconnected

The stack should be parameterized for different environments (dev/staging/prod) and include production-grade features like:
- Dead letter queues
- Log retention
- Monitoring and alerting
- Encryption everywhere
- Least privilege IAM
- Proper tagging
- Cost safety settings
### Answer 
---

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

interface TapStackConfig {
  environmentSuffix: string;
  serviceName: string;
  stage: 'dev' | 'staging' | 'prod';
  ownerEmail: string;
  region: string;
  logRetentionDays: number;
  lambdaMemorySize: number;
  lambdaTimeout: number;
  lambdaConcurrency: number;
  apiThrottleRate: number;
  apiThrottleBurst: number;
  dynamoReadCapacity: number;
  dynamoWriteCapacity: number;
  alarmEvaluationPeriods: number;
  alarmDatapointsToAlarm: number;
  metricPeriodSeconds: number;
  s3LifecycleExpirationDays: number;
  dlqMaxReceiveCount: number;
  sqsVisibilityTimeout: number;
  cloudfrontPriceClass: cloudfront.PriceClass;
  vpcMaxAzs: number;
  natGateways: number;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, config: TapStackConfig, props?: cdk.StackProps) {
    super(scope, id, props);

    const resourcePrefix = `${config.serviceName}-${config.stage}-${config.environmentSuffix}`;
    
    const commonTags = {
      Service: config.serviceName,
      Environment: config.stage,
      Owner: config.ownerEmail,
      ManagedBy: 'CDK',
      Stack: this.stackName,
    };

    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // VPC Configuration
    const vpc = new ec2.Vpc(this, `${resourcePrefix}-vpc`, {
      vpcName: `${resourcePrefix}-vpc`,
      maxAzs: config.vpcMaxAzs,
      natGateways: config.natGateways,
      subnetConfiguration: [
        {
          name: `${resourcePrefix}-public`,
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: `${resourcePrefix}-private`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: `${resourcePrefix}-isolated`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    const vpcFlowLogGroup = new logs.LogGroup(this, `${resourcePrefix}-vpc-flow-logs`, {
      logGroupName: `/aws/vpc/${resourcePrefix}`,
      retention: logs.RetentionDays[`DAYS_${config.logRetentionDays}` as keyof typeof logs.RetentionDays],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    vpc.addFlowLog(`${resourcePrefix}-vpc-flow-log`, {
      destination: ec2.FlowLogDestination.toCloudWatchLogs(vpcFlowLogGroup),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // KMS Keys
    const dataKmsKey = new kms.Key(this, `${resourcePrefix}-data-kms-key`, {
      description: `KMS key for ${config.serviceName} data encryption`,
      alias: `alias/${resourcePrefix}-data`,
      enableKeyRotation: true,
      removalPolicy: config.stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    const logsKmsKey = new kms.Key(this, `${resourcePrefix}-logs-kms-key`, {
      description: `KMS key for ${config.serviceName} logs encryption`,
      alias: `alias/${resourcePrefix}-logs`,
      enableKeyRotation: true,
      removalPolicy: config.stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // SNS Topic for Alarms
    const alarmTopic = new sns.Topic(this, `${resourcePrefix}-alarm-topic`, {
      topicName: `${resourcePrefix}-alarms`,
      masterKey: dataKmsKey,
    });

    alarmTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(config.ownerEmail)
    );

    // S3 Buckets
    const accessLogsBucket = new s3.Bucket(this, `${resourcePrefix}-access-logs-bucket`, {
      bucketName: `${resourcePrefix}-access-logs`.toLowerCase(),
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: logsKmsKey,
      lifecycleRules: [{
        id: 'delete-old-logs',
        enabled: true,
        expiration: cdk.Duration.days(config.s3LifecycleExpirationDays),
      }],
      removalPolicy: config.stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: config.stage !== 'prod',
      versioned: true,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const frontendBucket = new s3.Bucket(this, `${resourcePrefix}-frontend-bucket`, {
      bucketName: `${resourcePrefix}-frontend`.toLowerCase(),
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      encryption: s3.BucketEncryption.S3_MANAGED,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      serverAccessLogsBucket: accessLogsBucket,
      serverAccessLogsPrefix: 'frontend-access/',
      versioned: true,
      removalPolicy: config.stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: config.stage !== 'prod',
      lifecycleRules: [{
        id: 'delete-old-versions',
        enabled: true,
        noncurrentVersionExpiration: cdk.Duration.days(30),
      }],
    });

    const artifactsBucket = new s3.Bucket(this, `${resourcePrefix}-artifacts-bucket`, {
      bucketName: `${resourcePrefix}-artifacts`.toLowerCase(),
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: dataKmsKey,
      versioned: true,
      serverAccessLogsBucket: accessLogsBucket,
      serverAccessLogsPrefix: 'artifacts-access/',
      removalPolicy: config.stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: config.stage !== 'prod',
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
    });

    // CloudFront OAI
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, `${resourcePrefix}-oai`, {
      comment: `OAI for ${resourcePrefix} CloudFront`,
    });

    frontendBucket.grantRead(originAccessIdentity);

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, `${resourcePrefix}-distribution`, {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(300),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(300),
        },
      ],
      priceClass: config.cloudfrontPriceClass,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      enableLogging: true,
      logBucket: accessLogsBucket,
      logFilePrefix: 'cloudfront/',
      comment: `${config.serviceName} ${config.stage} distribution`,
    });

    // DynamoDB Tables
    const mainTable = new dynamodb.Table(this, `${resourcePrefix}-main-table`, {
      tableName: `${resourcePrefix}-main`,
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: config.stage === 'prod' 
        ? dynamodb.BillingMode.PAY_PER_REQUEST
        : dynamodb.BillingMode.PROVISIONED,
      readCapacity: config.stage !== 'prod' ? config.dynamoReadCapacity : undefined,
      writeCapacity: config.stage !== 'prod' ? config.dynamoWriteCapacity : undefined,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: dataKmsKey,
      pointInTimeRecovery: config.stage === 'prod',
      removalPolicy: config.stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    mainTable.addGlobalSecondaryIndex({
      indexName: 'gsi1',
      partitionKey: { name: 'gsi1pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'gsi1sk', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const sessionsTable = new dynamodb.Table(this, `${resourcePrefix}-sessions-table`, {
      tableName: `${resourcePrefix}-sessions`,
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: dataKmsKey,
      timeToLiveAttribute: 'ttl',
      removalPolicy: config.stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // SQS Queues
    const processingDLQ = new sqs.Queue(this, `${resourcePrefix}-processing-dlq`, {
      queueName: `${resourcePrefix}-processing-dlq`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: dataKmsKey,
    });

    const processingQueue = new sqs.Queue(this, `${resourcePrefix}-processing-queue`, {
      queueName: `${resourcePrefix}-processing`,
      visibilityTimeout: cdk.Duration.seconds(config.sqsVisibilityTimeout),
      deadLetterQueue: {
        queue: processingDLQ,
        maxReceiveCount: config.dlqMaxReceiveCount,
      },
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: dataKmsKey,
    });

    const notificationQueue = new sqs.Queue(this, `${resourcePrefix}-notification-queue`, {
      queueName: `${resourcePrefix}-notifications`,
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: dataKmsKey,
    });

    // SNS Topics
    const eventTopic = new sns.Topic(this, `${resourcePrefix}-event-topic`, {
      topicName: `${resourcePrefix}-events`,
      masterKey: dataKmsKey,
    });

    eventTopic.addSubscription(
      new snsSubscriptions.SqsSubscription(processingQueue)
    );

    // Lambda Layer
    const sharedLayer = new lambda.LayerVersion(this, `${resourcePrefix}-shared-layer`, {
      code: lambda.Code.fromAsset('lambda-layer'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      description: `Shared layer for ${config.serviceName}`,
    });

    // Lambda Execution Role
    const lambdaRole = new iam.Role(this, `${resourcePrefix}-lambda-role`, {
      roleName: `${resourcePrefix}-lambda-execution`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
    });

    // API Handler Lambda
    const apiHandlerLogGroup = new logs.LogGroup(this, `${resourcePrefix}-api-handler-logs`, {
      logGroupName: `/aws/lambda/${resourcePrefix}-api-handler`,
      retention: logs.RetentionDays[`DAYS_${config.logRetentionDays}` as keyof typeof logs.RetentionDays],
      encryptionKey: logsKmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const apiHandler = new NodejsFunction(this, `${resourcePrefix}-api-handler`, {
      functionName: `${resourcePrefix}-api-handler`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      entry: 'src/api-handler.ts',
      memorySize: config.lambdaMemorySize,
      timeout: cdk.Duration.seconds(config.lambdaTimeout),
      reservedConcurrentExecutions: config.lambdaConcurrency,
      role: lambdaRole,
      vpc: vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [new ec2.SecurityGroup(this, `${resourcePrefix}-api-sg`, {
        vpc,
        allowAllOutbound: true,
      })],
      environment: {
        NODE_ENV: config.stage,
        SERVICE_NAME: config.serviceName,
        MAIN_TABLE: mainTable.tableName,
        SESSIONS_TABLE: sessionsTable.tableName,
        EVENT_TOPIC_ARN: eventTopic.topicArn,
        ARTIFACTS_BUCKET: artifactsBucket.bucketName,
        KMS_KEY_ID: dataKmsKey.keyId,
      },
      tracing: lambda.Tracing.ACTIVE,
      logGroup: apiHandlerLogGroup,
      layers: [sharedLayer],
      deadLetterQueueEnabled: true,
      deadLetterQueue: processingDLQ,
    });

    // Event Processor Lambda
    const eventProcessorLogGroup = new logs.LogGroup(this, `${resourcePrefix}-event-processor-logs`, {
      logGroupName: `/aws/lambda/${resourcePrefix}-event-processor`,
      retention: logs.RetentionDays[`DAYS_${config.logRetentionDays}` as keyof typeof logs.RetentionDays],
      encryptionKey: logsKmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const eventProcessor = new NodejsFunction(this, `${resourcePrefix}-event-processor`, {
      functionName: `${resourcePrefix}-event-processor`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      entry: 'src/event-processor.ts',
      memorySize: config.lambdaMemorySize,
      timeout: cdk.Duration.seconds(config.lambdaTimeout * 2),
      reservedConcurrentExecutions: Math.floor(config.lambdaConcurrency / 2),
      role: lambdaRole,
      vpc: vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      environment: {
        NODE_ENV: config.stage,
        MAIN_TABLE: mainTable.tableName,
        NOTIFICATION_QUEUE_URL: notificationQueue.queueUrl,
      },
      tracing: lambda.Tracing.ACTIVE,
      logGroup: eventProcessorLogGroup,
      layers: [sharedLayer],
    });

    eventProcessor.addEventSource(
      new lambdaEventSources.SqsEventSource(processingQueue, {
        batchSize: 10,
        maxBatchingWindowInSeconds: 5,
        reportBatchItemFailures: true,
      })
    );

    // Stream Processor Lambda
    const streamProcessorLogGroup = new logs.LogGroup(this, `${resourcePrefix}-stream-processor-logs`, {
      logGroupName: `/aws/lambda/${resourcePrefix}-stream-processor`,
      retention: logs.RetentionDays[`DAYS_${config.logRetentionDays}` as keyof typeof logs.RetentionDays],
      encryptionKey: logsKmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const streamProcessor = new lambda.Function(this, `${resourcePrefix}-stream-processor`, {
      functionName: `${resourcePrefix}-stream-processor`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      memorySize: config.lambdaMemorySize,
      timeout: cdk.Duration.seconds(config.lambdaTimeout),
      role: lambdaRole,
      vpc: vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      environment: {
        NODE_ENV: config.stage,
        ARTIFACTS_BUCKET: artifactsBucket.bucketName,
      },
      tracing: lambda.Tracing.ACTIVE,
      logGroup: streamProcessorLogGroup,
    });

    streamProcessor.addEventSource(
      new lambdaEventSources.DynamoEventSource(mainTable, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 100,
        maxBatchingWindowInSeconds: 10,
        bisectBatchOnError: true,
        reportBatchItemFailures: true,
        retryAttempts: 3,
      })
    );

    // Notification Handler Lambda
    const notificationHandlerLogGroup = new logs.LogGroup(this, `${resourcePrefix}-notification-handler-logs`, {
      logGroupName: `/aws/lambda/${resourcePrefix}-notification-handler`,
      retention: logs.RetentionDays[`DAYS_${config.logRetentionDays}` as keyof typeof logs.RetentionDays],
      encryptionKey: logsKmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const notificationHandler = new lambda.Function(this, `${resourcePrefix}-notification-handler`, {
      functionName: `${resourcePrefix}-notification-handler`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      role: lambdaRole,
      environment: {
        NODE_ENV: config.stage,
        ALARM_TOPIC_ARN: alarmTopic.topicArn,
      },
      tracing: lambda.Tracing.ACTIVE,
      logGroup: notificationHandlerLogGroup,
    });

    notificationHandler.addEventSource(
      new lambdaEventSources.SqsEventSource(notificationQueue, {
        batchSize: 25,
        reportBatchItemFailures: true,
      })
    );

    // Grant permissions
    mainTable.grantReadWriteData(apiHandler);
    mainTable.grantReadWriteData(eventProcessor);
    mainTable.grantStreamRead(streamProcessor);
    sessionsTable.grantReadWriteData(apiHandler);
    artifactsBucket.grantReadWrite(apiHandler);
    artifactsBucket.grantReadWrite(streamProcessor);
    eventTopic.grantPublish(apiHandler);
    processingQueue.grantConsumeMessages(eventProcessor);
    notificationQueue.grantSendMessages(eventProcessor);
    notificationQueue.grantConsumeMessages(notificationHandler);
    alarmTopic.grantPublish(notificationHandler);
    dataKmsKey.grantEncryptDecrypt(lambdaRole);
    logsKmsKey.grantEncryptDecrypt(lambdaRole);

    // API Gateway
    const api = new apigateway.RestApi(this, `${resourcePrefix}-api`, {
      restApiName: `${resourcePrefix}-api`,
      description: `${config.serviceName} API Gateway`,
      deployOptions: {
        stageName: config.stage,
        tracingEnabled: true,
        dataTraceEnabled: config.stage !== 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        metricsEnabled: true,
        throttlingRateLimit: config.apiThrottleRate,
        throttlingBurstLimit: config.apiThrottleBurst,
      },
      cloudWatchRole: true,
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
    });

    const apiIntegration = new apigateway.LambdaIntegration(apiHandler, {
      requestTemplates: { 'application/json': '{ "statusCode": 200 }' },
    });

    const itemsResource = api.root.addResource('items');
    itemsResource.addMethod('GET', apiIntegration);
    itemsResource.addMethod('POST', apiIntegration);

    const itemResource = itemsResource.addResource('{id}');
    itemResource.addMethod('GET', apiIntegration);
    itemResource.addMethod('PUT', apiIntegration);
    itemResource.addMethod('DELETE', apiIntegration);

    const healthResource = api.root.addResource('health');
    healthResource.addMethod('GET', apiIntegration);

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, `${resourcePrefix}-dashboard`, {
      dashboardName: `${resourcePrefix}-dashboard`,
      defaultInterval: cdk.Duration.hours(1),
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'API Gateway Requests',
            left: [
              api.metricCount({
                period: cdk.Duration.seconds(config.metricPeriodSeconds),
                statistic: 'Sum',
              }),
            ],
            right: [
              api.metric4XXError({
                period: cdk.Duration.seconds(config.metricPeriodSeconds),
                statistic: 'Sum',
                color: cloudwatch.Color.ORANGE,
              }),
              api.metric5XXError({
                period: cdk.Duration.seconds(config.metricPeriodSeconds),
                statistic: 'Sum',
                color: cloudwatch.Color.RED,
              }),
            ],
            width: 12,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'API Gateway Latency',
            left: [
              api.metricLatency({
                period: cdk.Duration.seconds(config.metricPeriodSeconds),
                statistic: 'Average',
              }),
              api.metricLatency({
                period: cdk.Duration.seconds(config.metricPeriodSeconds),
                statistic: 'p99',
                color: cloudwatch.Color.ORANGE,
              }),
            ],
            width: 12,
            height: 6,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'Lambda Invocations',
            left: [
              apiHandler.metricInvocations({
                period: cdk.Duration.seconds(config.metricPeriodSeconds),
                statistic: 'Sum',
              }),
              eventProcessor.metricInvocations({
                period: cdk.Duration.seconds(config.metricPeriodSeconds),
                statistic: 'Sum',
                color: cloudwatch.Color.GREEN,
              }),
            ],
            width: 8,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'Lambda Errors',
            left: [
              apiHandler.metricErrors({
                period: cdk.Duration.seconds(config.metricPeriodSeconds),
                statistic: 'Sum',
              }),
              eventProcessor.metricErrors({
                period: cdk.Duration.seconds(config.metricPeriodSeconds),
                statistic: 'Sum',
                color: cloudwatch.Color.RED,
              }),
            ],
            width: 8,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'Lambda Duration',
            left: [
              apiHandler.metricDuration({
                period: cdk.Duration.seconds(config.metricPeriodSeconds),
                statistic: 'Average',
              }),
              eventProcessor.metricDuration({
                period: cdk.Duration.seconds(config.metricPeriodSeconds),
                statistic: 'Average',
                color: cloudwatch.Color.BLUE,
              }),
            ],
            width: 8,
            height: 6,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'DynamoDB Read/Write',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/DynamoDB',
                metricName: 'ConsumedReadCapacityUnits',
                dimensionsMap: {
                  TableName: mainTable.tableName,
                },
                period: cdk.Duration.seconds(config.metricPeriodSeconds),
                statistic: 'Sum',
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/DynamoDB',
                metricName: 'ConsumedWriteCapacityUnits',
                dimensionsMap: {
                  TableName: mainTable.tableName,
                },
                period: cdk.Duration.seconds(config.metricPeriodSeconds),
                statistic: 'Sum',
                color: cloudwatch.Color.GREEN,
              }),
            ],
            width: 12,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'SQS Messages',
            left: [
              processingQueue.metricApproximateNumberOfMessagesVisible({
                period: cdk.Duration.seconds(config.metricPeriodSeconds),
                statistic: 'Average',
              }),
              processingDLQ.metricApproximateNumberOfMessagesVisible({
                period: cdk.Duration.seconds(config.metricPeriodSeconds),
                statistic: 'Average',
                color: cloudwatch.Color.RED,
              }),
            ],
            width: 12,
            height: 6,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'CloudFront Requests',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/CloudFront',
                metricName: 'Requests',
                dimensionsMap: {
                  DistributionId: distribution.distributionId,
                  Region: 'Global',
                },
                period: cdk.Duration.seconds(config.metricPeriodSeconds),
                statistic: 'Sum',
              }),
            ],
            right: [
              new cloudwatch.Metric({
                namespace: 'AWS/CloudFront',
                metricName: 'BytesDownloaded',
                dimensionsMap: {
                  DistributionId: distribution.distributionId,
                  Region: 'Global',
                },
                period: cdk.Duration.seconds(config.metricPeriodSeconds),
                statistic: 'Sum',
                color: cloudwatch.Color.BLUE,
              }),
            ],
            width: 24,
            height: 6,
          }),
        ],
      ],
    });

    // CloudWatch Alarms
    const apiGateway5xxAlarm = new cloudwatch.Alarm(this, `${resourcePrefix}-api-5xx-alarm`, {
      alarmName: `${resourcePrefix}-api-5xx`,
      metric: api.metric5XXError({
        period: cdk.Duration.seconds(config.metricPeriodSeconds),
        statistic: 'Sum',
      }),
      threshold: 10,
      evaluationPeriods: config.alarmEvaluationPeriods,
      datapointsToAlarm: config.alarmDatapointsToAlarm,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    apiGateway5xxAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    const apiGateway4xxAlarm = new cloudwatch.Alarm(this, `${resourcePrefix}-api-4xx-alarm`, {
      alarmName: `${resourcePrefix}-api-4xx`,
      metric: api.metric4XXError({
        period: cdk.Duration.seconds(config.metricPeriodSeconds),
        statistic: 'Sum',
      }),
      threshold: 100,
      evaluationPeriods: config.alarmEvaluationPeriods,
      datapointsToAlarm: config.alarmDatapointsToAlarm,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    apiGateway4xxAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    const apiHandlerErrorAlarm = new cloudwatch.Alarm(this, `${resourcePrefix}-api-handler-error-alarm`, {
      alarmName: `${resourcePrefix}-api-handler-errors`,
      metric: apiHandler.metricErrors({
        period: cdk.Duration.seconds(config.metricPeriodSeconds),
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: config.alarmEvaluationPeriods,
      datapointsToAlarm: config.alarmDatapointsToAlarm,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    apiHandlerErrorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    const apiHandlerThrottleAlarm = new cloudwatch.Alarm(this, `${resourcePrefix}-api-handler-throttle-alarm`, {
      alarmName: `${resourcePrefix}-api-handler-throttles`,
      metric: apiHandler.metricThrottles({
        period: cdk.Duration.seconds(config.metricPeriodSeconds),
        statistic: 'Sum',
      }),
      threshold: 10,
      evaluationPeriods: config.alarmEvaluationPeriods,
      datapointsToAlarm: config.alarmDatapointsToAlarm,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    apiHandlerThrottleAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    const eventProcessorErrorAlarm = new cloudwatch.Alarm(this, `${resourcePrefix}-event-processor-error-alarm`, {
      alarmName: `${resourcePrefix}-event-processor-errors`,
      metric: eventProcessor.metricErrors({
        period: cdk.Duration.seconds(config.metricPeriodSeconds),
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: config.alarmEvaluationPeriods,
      datapointsToAlarm: config.alarmDatapointsToAlarm,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    eventProcessorErrorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    const dlqMessageAlarm = new cloudwatch.Alarm(this, `${resourcePrefix}-dlq-message-alarm`, {
      alarmName: `${resourcePrefix}-dlq-messages`,
      metric: processingDLQ.metricApproximateNumberOfMessagesVisible({
        period: cdk.Duration.seconds(config.metricPeriodSeconds),
        statistic: 'Maximum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    dlqMessageAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    const dynamoThrottleAlarm = new cloudwatch.Alarm(this, `${resourcePrefix}-dynamo-throttle-alarm`, {
      alarmName: `${resourcePrefix}-dynamo-throttles`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/DynamoDB',
        metricName: 'UserErrors',
        dimensionsMap: {
          TableName: mainTable.tableName,
        },
        period: cdk.Duration.seconds(config.metricPeriodSeconds),
        statistic: 'Sum',
      }),
      threshold: 10,
      evaluationPeriods: config.alarmEvaluationPeriods,
      datapointsToAlarm: config.alarmDatapointsToAlarm,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    dynamoThrottleAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // Log Subscription Filter for Error Detection
    const errorLogMetricFilter = new logs.MetricFilter(this, `${resourcePrefix}-error-log-filter`, {
      logGroup: apiHandlerLogGroup,
      metricNamespace: config.serviceName,
      metricName: 'ApplicationErrors',
      filterPattern: logs.FilterPattern.literal('[ERROR]'),
      metricValue: '1',
    });

    const errorLogAlarm = new cloudwatch.Alarm(this, `${resourcePrefix}-error-log-alarm`, {
      alarmName: `${resourcePrefix}-application-errors`,
      metric: errorLogMetricFilter.metric({
        period: cdk.Duration.seconds(config.metricPeriodSeconds),
        statistic: 'Sum',
      }),
      threshold: 10,
      evaluationPeriods: config.alarmEvaluationPeriods,
      datapointsToAlarm: config.alarmDatapointsToAlarm,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    errorLogAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // S3 Static Website Deployment
    new s3deploy.BucketDeployment(this, `${resourcePrefix}-frontend-deployment`, {
      sources: [s3deploy.Source.asset('./frontend-build')],
      destinationBucket: frontendBucket,
      distribution,
      distributionPaths: ['/*'],
      prune: false,
      retainOnDelete: config.stage === 'prod',
    });

    // Outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${resourcePrefix}-vpc-id`,
    });

    new cdk.CfnOutput(this, 'APIGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
      exportName: `${resourcePrefix}-api-url`,
    });

    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
      exportName: `${resourcePrefix}-cloudfront-url`,
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: frontendBucket.bucketName,
      description: 'Frontend S3 Bucket Name',
      exportName: `${resourcePrefix}-frontend-bucket`,
    });

    new cdk.CfnOutput(this, 'MainTableName', {
      value: mainTable.tableName,
      description: 'Main DynamoDB Table Name',
      exportName: `${resourcePrefix}-main-table`,
    });

    new cdk.CfnOutput(this, 'ProcessingQueueUrl', {
      value: processingQueue.queueUrl,
      description: 'Processing Queue URL',
      exportName: `${resourcePrefix}-processing-queue-url`,
    });

    new cdk.CfnOutput(self, 'EventTopicArn', {
      value: eventTopic.topicArn,
      description: 'Event SNS Topic ARN',
      exportName: `${resourcePrefix}-event-topic-arn`,
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'Alarm SNS Topic ARN',
      exportName: `${resourcePrefix}-alarm-topic-arn`,
    });

    new cdk.CfnOutput(this, 'DataKmsKeyId', {
      value: dataKmsKey.keyId,
      description: 'Data KMS Key ID',
      exportName: `${resourcePrefix}-data-kms-key-id`,
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
      exportName: `${resourcePrefix}-dashboard-url`,
    });
  }
}
```