import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as logs from 'aws-cdk-lib/aws-logs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
  region: string;
}

export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly auroraCluster: rds.DatabaseCluster;
  public readonly globalTable: dynamodb.Table;
  public readonly configBucket: s3.Bucket;
  public readonly tradeQueue: sqs.Queue;
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix, region } = props;

    // VPC with private subnets
    this.vpc = new ec2.Vpc(this, `VPC-${environmentSuffix}`, {
      vpcName: `tapstack-vpc-${environmentSuffix}`,
      maxAzs: 3,
      natGateways: 0, // Cost optimization - using VPC endpoints instead
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `private-subnet-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        {
          cidrMask: 24,
          name: `public-subnet-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // Security Group for Aurora
    const auroraSecurityGroup = new ec2.SecurityGroup(
      this,
      `AuroraSecurityGroup-${environmentSuffix}`,
      {
        vpc: this.vpc,
        description: `Security group for Aurora cluster ${environmentSuffix}`,
        allowAllOutbound: true,
      }
    );

    auroraSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from VPC'
    );

    // Aurora PostgreSQL Global Database Cluster
    this.auroraCluster = new rds.DatabaseCluster(
      this,
      `AuroraCluster-${environmentSuffix}`,
      {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_15_12,
        }),
        writer: rds.ClusterInstance.serverlessV2(
          `Writer-${environmentSuffix}`,
          {
            autoMinorVersionUpgrade: true,
          }
        ),
        readers: [
          rds.ClusterInstance.serverlessV2(`Reader-${environmentSuffix}`, {
            scaleWithWriter: true,
          }),
        ],
        serverlessV2MinCapacity: 0.5,
        serverlessV2MaxCapacity: 2,
        vpc: this.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [auroraSecurityGroup],
        storageEncrypted: true,
        backup: {
          retention: cdk.Duration.days(7),
          preferredWindow: '03:00-04:00',
        },
        cloudwatchLogsExports: ['postgresql'],
        cloudwatchLogsRetention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // DynamoDB Table for session data
    this.globalTable = new dynamodb.Table(
      this,
      `SessionTable-${environmentSuffix}`,
      {
        tableName: `tapstack-sessions-${environmentSuffix}`,
        partitionKey: {
          name: 'sessionId',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'timestamp',
          type: dynamodb.AttributeType.NUMBER,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        encryption: dynamodb.TableEncryption.AWS_MANAGED,
        pointInTimeRecovery: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      }
    );

    // S3 bucket for configuration and audit logs
    this.configBucket = new s3.Bucket(
      this,
      `ConfigBucket-${environmentSuffix}`,
      {
        bucketName: `tapstack-config-${environmentSuffix}-${region}`,
        versioned: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        lifecycleRules: [
          {
            id: 'DeleteOldVersions',
            noncurrentVersionExpiration: cdk.Duration.days(30),
          },
        ],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    // SQS Queue for trade orders
    const deadLetterQueue = new sqs.Queue(
      this,
      `TradeQueueDLQ-${environmentSuffix}`,
      {
        queueName: `tapstack-orders-dlq-${environmentSuffix}`,
        encryption: sqs.QueueEncryption.SQS_MANAGED,
        retentionPeriod: cdk.Duration.days(14),
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    this.tradeQueue = new sqs.Queue(this, `TradeQueue-${environmentSuffix}`, {
      queueName: `tapstack-orders-${environmentSuffix}`,
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(4),
      deadLetterQueue: {
        queue: deadLetterQueue,
        maxReceiveCount: 3,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda function for processing trade orders
    const tradeProcessorFunction = new NodejsFunction(
      this,
      `TradeProcessor-${environmentSuffix}`,
      {
        functionName: `tapstack-processor-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: 'lib/lambda/trade-processor/index.ts',
        handler: 'handler',
        bundling: {
          minify: true,
          sourceMap: true,
        },
        timeout: cdk.Duration.seconds(60),
        memorySize: 512,
        environment: {
          ENVIRONMENT_SUFFIX: environmentSuffix,
          REGION: region,
          AURORA_CLUSTER_ARN: this.auroraCluster.clusterArn,
          SESSION_TABLE_NAME: this.globalTable.tableName,
          CONFIG_BUCKET_NAME: this.configBucket.bucketName,
        },
        vpc: this.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        logRetention: logs.RetentionDays.ONE_MONTH,
      }
    );

    // Grant permissions to Lambda
    this.auroraCluster.grantDataApiAccess(tradeProcessorFunction);
    this.globalTable.grantReadWriteData(tradeProcessorFunction);
    this.configBucket.grantRead(tradeProcessorFunction);

    // Add SQS trigger to Lambda
    tradeProcessorFunction.addEventSource(
      new SqsEventSource(this.tradeQueue, {
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(5),
      })
    );

    // API Gateway REST API
    this.api = new apigateway.RestApi(this, `TradingAPI-${environmentSuffix}`, {
      restApiName: `tapstack-api-${environmentSuffix}`,
      description: `Trading Platform API for ${environmentSuffix}`,
      deployOptions: {
        stageName: 'prod',
        throttlingBurstLimit: 5000,
        throttlingRateLimit: 2000,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
    });

    // API Lambda function
    const apiFunction = new NodejsFunction(
      this,
      `APIFunction-${environmentSuffix}`,
      {
        functionName: `tapstack-api-handler-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: 'lib/lambda/api-handler/index.ts',
        handler: 'handler',
        bundling: {
          minify: true,
          sourceMap: true,
        },
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        environment: {
          ENVIRONMENT_SUFFIX: environmentSuffix,
          REGION: region,
          SESSION_TABLE_NAME: this.globalTable.tableName,
          TRADE_QUEUE_URL: this.tradeQueue.queueUrl,
        },
        logRetention: logs.RetentionDays.ONE_MONTH,
      }
    );

    this.globalTable.grantReadWriteData(apiFunction);
    this.tradeQueue.grantSendMessages(apiFunction);

    // API Gateway integration
    const trades = this.api.root.addResource('trades');
    trades.addMethod('POST', new apigateway.LambdaIntegration(apiFunction));
    trades.addMethod('GET', new apigateway.LambdaIntegration(apiFunction));

    const health = this.api.root.addResource('health');
    health.addMethod('GET', new apigateway.LambdaIntegration(apiFunction));

    // Systems Manager Parameter Store
    new ssm.StringParameter(this, `RegionConfig-${environmentSuffix}`, {
      parameterName: `/tapstack/${environmentSuffix}/config`,
      stringValue: JSON.stringify({
        region,
        apiEndpoint: this.api.url,
        queueUrl: this.tradeQueue.queueUrl,
        tableName: this.globalTable.tableName,
        auroraEndpoint: this.auroraCluster.clusterEndpoint.hostname,
      }),
      description: `Configuration for trading platform in ${environmentSuffix}`,
    });

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, `AlertTopic-${environmentSuffix}`, {
      topicName: `tapstack-alerts-${environmentSuffix}`,
      displayName: `TapStack Alerts (${environmentSuffix})`,
    });

    // CloudWatch Alarms
    const auroraReplicationAlarm = new cloudwatch.Alarm(
      this,
      `AuroraReplicationAlarm-${environmentSuffix}`,
      {
        alarmName: `tapstack-aurora-lag-${environmentSuffix}`,
        metric: this.auroraCluster.metricServerlessDatabaseCapacity({
          statistic: 'Average',
        }),
        threshold: 1000,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    auroraReplicationAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alertTopic)
    );

    const lambdaErrorAlarm = new cloudwatch.Alarm(
      this,
      `LambdaErrorAlarm-${environmentSuffix}`,
      {
        alarmName: `tapstack-lambda-errors-${environmentSuffix}`,
        metric: tradeProcessorFunction.metricErrors({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 5,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    lambdaErrorAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alertTopic)
    );

    const apiLatencyAlarm = new cloudwatch.Alarm(
      this,
      `APILatencyAlarm-${environmentSuffix}`,
      {
        alarmName: `tapstack-api-latency-${environmentSuffix}`,
        metric: this.api.metricLatency({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1000,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    apiLatencyAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alertTopic)
    );

    // EventBridge for platform events
    const eventBus = new events.EventBus(
      this,
      `EventBus-${environmentSuffix}`,
      {
        eventBusName: `tapstack-events-${environmentSuffix}`,
      }
    );

    // Event handler Lambda for platform events
    const eventHandlerFunction = new NodejsFunction(
      this,
      `EventHandler-${environmentSuffix}`,
      {
        functionName: `tapstack-event-handler-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: 'lib/lambda/event-handler/index.ts',
        handler: 'handler',
        bundling: {
          minify: true,
          sourceMap: true,
        },
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        environment: {
          ENVIRONMENT_SUFFIX: environmentSuffix,
          REGION: region,
        },
        logRetention: logs.RetentionDays.ONE_MONTH,
      }
    );

    // Rule to handle platform events
    new events.Rule(this, `PlatformEventRule-${environmentSuffix}`, {
      eventBus,
      ruleName: `tapstack-events-rule-${environmentSuffix}`,
      description: 'Handle critical platform events',
      eventPattern: {
        source: ['trading.platform'],
        detailType: ['Trade Executed', 'System Alert'],
      },
      targets: [new targets.LambdaFunction(eventHandlerFunction)],
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      exportName: `VpcId-${environmentSuffix}-${region}`,
    });

    new cdk.CfnOutput(this, 'AuroraClusterEndpoint', {
      value: this.auroraCluster.clusterEndpoint.hostname,
      exportName: `AuroraClusterEndpoint-${environmentSuffix}-${region}`,
    });

    new cdk.CfnOutput(this, 'GlobalTableName', {
      value: this.globalTable.tableName,
      exportName: `GlobalTableName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ConfigBucketName', {
      value: this.configBucket.bucketName,
      exportName: `ConfigBucketName-${environmentSuffix}-${region}`,
    });

    new cdk.CfnOutput(this, 'TradeQueueUrl', {
      value: this.tradeQueue.queueUrl,
      exportName: `TradeQueueUrl-${environmentSuffix}-${region}`,
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.api.url,
      exportName: `ApiEndpoint-${environmentSuffix}-${region}`,
    });

    new cdk.CfnOutput(this, 'EventBusArn', {
      value: eventBus.eventBusArn,
      exportName: `EventBusArn-${environmentSuffix}`,
    });

    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Region', region);
    cdk.Tags.of(this).add('Component', 'TradingPlatform');
    cdk.Tags.of(this).add('Project', 'TradingPlatform');
  }
}
