import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
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

export interface SecondaryRegionStackProps extends cdk.StackProps {
  environmentSuffix: string;
  region: string;
  isPrimary: boolean;
  primaryRegion: string;
}

export class SecondaryRegionStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly replicaBucket: s3.Bucket;
  public readonly tradeQueue: sqs.Queue;
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: SecondaryRegionStackProps) {
    super(scope, id, props);

    const { environmentSuffix, region, isPrimary, primaryRegion } = props;

    // VPC with private subnets
    this.vpc = new ec2.Vpc(this, `VPC-${environmentSuffix}`, {
      vpcName: `trading-platform-vpc-${environmentSuffix}`,
      maxAzs: 3,
      natGateways: 0,
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

    // S3 bucket for replication (destination bucket for CRR)
    this.replicaBucket = new s3.Bucket(
      this,
      `ReplicaBucket-${environmentSuffix}`,
      {
        bucketName: `trading-config-${environmentSuffix}-${region}`,
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
        queueName: `trade-orders-dlq-${environmentSuffix}`,
        encryption: sqs.QueueEncryption.SQS_MANAGED,
        retentionPeriod: cdk.Duration.days(14),
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    this.tradeQueue = new sqs.Queue(this, `TradeQueue-${environmentSuffix}`, {
      queueName: `trade-orders-${environmentSuffix}`,
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(4),
      deadLetterQueue: {
        queue: deadLetterQueue,
        maxReceiveCount: 3,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Import global table name from primary region
    const globalTableName = `trading-sessions-${environmentSuffix}`;

    // Lambda function for processing trade orders
    const tradeProcessorFunction = new lambda.Function(
      this,
      `TradeProcessor-${environmentSuffix}`,
      {
        functionName: `trade-processor-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lib/lambda/trade-processor'),
        timeout: cdk.Duration.seconds(60),
        memorySize: 512,
        environment: {
          ENVIRONMENT_SUFFIX: environmentSuffix,
          REGION: region,
          IS_PRIMARY: isPrimary.toString(),
          SESSION_TABLE_NAME: globalTableName,
          CONFIG_BUCKET_NAME: this.replicaBucket.bucketName,
          PRIMARY_REGION: primaryRegion,
        },
        vpc: this.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        logRetention: logs.RetentionDays.ONE_MONTH,
      }
    );

    // Grant permissions to Lambda
    this.replicaBucket.grantRead(tradeProcessorFunction);

    // Add SQS trigger to Lambda
    tradeProcessorFunction.addEventSource(
      new SqsEventSource(this.tradeQueue, {
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(5),
      })
    );

    // API Gateway REST API
    this.api = new apigateway.RestApi(this, `TradingAPI-${environmentSuffix}`, {
      restApiName: `trading-api-${environmentSuffix}`,
      description: `Trading Platform API for ${environmentSuffix} (Secondary)`,
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
    const apiFunction = new lambda.Function(
      this,
      `APIFunction-${environmentSuffix}`,
      {
        functionName: `trading-api-handler-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lib/lambda/api-handler'),
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        environment: {
          ENVIRONMENT_SUFFIX: environmentSuffix,
          REGION: region,
          SESSION_TABLE_NAME: globalTableName,
          TRADE_QUEUE_URL: this.tradeQueue.queueUrl,
          IS_PRIMARY: 'false',
        },
        logRetention: logs.RetentionDays.ONE_MONTH,
      }
    );

    this.tradeQueue.grantSendMessages(apiFunction);

    // API Gateway integration
    const trades = this.api.root.addResource('trades');
    trades.addMethod('POST', new apigateway.LambdaIntegration(apiFunction));
    trades.addMethod('GET', new apigateway.LambdaIntegration(apiFunction));

    const health = this.api.root.addResource('health');
    health.addMethod('GET', new apigateway.LambdaIntegration(apiFunction));

    // Systems Manager Parameter Store
    new ssm.StringParameter(this, `RegionConfig-${environmentSuffix}`, {
      parameterName: `/trading-platform/${environmentSuffix}/region-config`,
      stringValue: JSON.stringify({
        region,
        isPrimary,
        apiEndpoint: this.api.url,
        queueUrl: this.tradeQueue.queueUrl,
        tableName: globalTableName,
      }),
      description: `Configuration for ${region} in ${environmentSuffix}`,
    });

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, `AlertTopic-${environmentSuffix}`, {
      topicName: `trading-platform-alerts-${environmentSuffix}`,
      displayName: `Trading Platform Alerts (${environmentSuffix})`,
    });

    // CloudWatch Alarms
    const lambdaErrorAlarm = new cloudwatch.Alarm(
      this,
      `LambdaErrorAlarm-${environmentSuffix}`,
      {
        alarmName: `lambda-errors-${environmentSuffix}`,
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
        alarmName: `api-latency-${environmentSuffix}`,
        metric: this.api.metricLatency({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1000,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    apiLatencyAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));

    // EventBridge for receiving events from primary region
    const eventBus = new events.EventBus(
      this,
      `EventBus-${environmentSuffix}`,
      {
        eventBusName: `trading-platform-${environmentSuffix}`,
      }
    );

    // Event handler Lambda
    const eventHandlerFunction = new lambda.Function(
      this,
      `EventHandler-${environmentSuffix}`,
      {
        functionName: `event-handler-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lib/lambda/event-handler'),
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        environment: {
          ENVIRONMENT_SUFFIX: environmentSuffix,
          REGION: region,
        },
        logRetention: logs.RetentionDays.ONE_MONTH,
      }
    );

    new events.Rule(this, `CrossRegionEventRule-${environmentSuffix}`, {
      eventBus,
      ruleName: `cross-region-events-${environmentSuffix}`,
      description: 'Handle events from primary region',
      eventPattern: {
        source: ['trading.platform'],
        detailType: ['Trade Executed', 'Failover Required'],
      },
      targets: [new targets.LambdaFunction(eventHandlerFunction)],
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      exportName: `VpcId-${environmentSuffix}-${region}`,
    });

    new cdk.CfnOutput(this, 'ReplicaBucketName', {
      value: this.replicaBucket.bucketName,
      exportName: `ReplicaBucketName-${environmentSuffix}-${region}`,
    });

    new cdk.CfnOutput(this, 'TradeQueueUrl', {
      value: this.tradeQueue.queueUrl,
      exportName: `TradeQueueUrl-${environmentSuffix}-${region}`,
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.api.url,
      exportName: `ApiEndpoint-${environmentSuffix}-${region}`,
    });

    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Region', region);
    cdk.Tags.of(this).add('Component', 'SecondaryRegion');
    cdk.Tags.of(this).add('Project', 'TradingPlatform');
  }
}
