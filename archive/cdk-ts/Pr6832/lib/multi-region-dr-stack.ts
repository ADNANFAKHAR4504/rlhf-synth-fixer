import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';

export interface MultiRegionDRStackProps {
  environmentSuffix: string;
}

export class MultiRegionDRStack extends Construct {
  constructor(scope: Construct, id: string, props: MultiRegionDRStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;
    const region = cdk.Stack.of(this).region;

    // VPC for single region deployment
    const vpc = new ec2.Vpc(this, `TradingPlatformVPC-${environmentSuffix}`, {
      maxAzs: 3,
      natGateways: 0, // Using VPC endpoints instead for cost optimization
      subnetConfiguration: [
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // VPC Endpoints for AWS services
    vpc.addInterfaceEndpoint(`RDSEndpoint-${environmentSuffix}`, {
      service: ec2.InterfaceVpcEndpointAwsService.RDS,
    });

    vpc.addInterfaceEndpoint(`LambdaEndpoint-${environmentSuffix}`, {
      service: ec2.InterfaceVpcEndpointAwsService.LAMBDA,
    });

    // DynamoDB Table for session state (single region)
    const sessionTable = new dynamodb.Table(
      this,
      `SessionTable-${environmentSuffix}`,
      {
        tableName: `trading-sessions-${environmentSuffix}`,
        partitionKey: {
          name: 'sessionId',
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        pointInTimeRecovery: true,
        stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      }
    );

    // S3 Buckets (single region)
    const configBucket = new s3.Bucket(
      this,
      `ConfigBucket-${environmentSuffix}`,
      {
        bucketName: `trading-config-${region}-${environmentSuffix}`,
        versioned: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    const auditLogsBucket = new s3.Bucket(
      this,
      `AuditLogsBucket-${environmentSuffix}`,
      {
        bucketName: `trading-audit-logs-${region}-${environmentSuffix}`,
        versioned: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    // Aurora PostgreSQL Database (single region)
    const dbCluster = new rds.DatabaseCluster(
      this,
      `TradingDBCluster-${environmentSuffix}`,
      {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_15_12,
        }),
        credentials: rds.Credentials.fromGeneratedSecret('dbadmin'),
        writer: rds.ClusterInstance.serverlessV2(`Writer-${environmentSuffix}`),
        readers: [
          rds.ClusterInstance.serverlessV2(`Reader-${environmentSuffix}`, {
            scaleWithWriter: true,
          }),
        ],
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        storageEncrypted: true,
        backup: {
          retention: cdk.Duration.days(7),
        },
      }
    );

    // SQS Queue for trade orders
    const tradeOrderQueue = new sqs.Queue(
      this,
      `TradeOrderQueue-${environmentSuffix}`,
      {
        queueName: `trade-orders-${region}-${environmentSuffix}`,
        visibilityTimeout: cdk.Duration.seconds(300),
        retentionPeriod: cdk.Duration.days(4),
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Lambda function for processing trade orders
    const tradeProcessorLambda = new lambda.Function(
      this,
      `TradeProcessor-${environmentSuffix}`,
      {
        functionName: `trade-processor-${region}-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lib/lambda/trade-processor'),
        timeout: cdk.Duration.seconds(30),
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        environment: {
          DB_CLUSTER_ARN: dbCluster.clusterArn,
          DB_SECRET_ARN: dbCluster.secret!.secretArn,
          SESSION_TABLE_NAME: sessionTable.tableName,
          REGION: region,
        },
      }
    );

    // Grant permissions
    sessionTable.grantReadWriteData(tradeProcessorLambda);
    dbCluster.grantDataApiAccess(tradeProcessorLambda);
    tradeOrderQueue.grantConsumeMessages(tradeProcessorLambda);

    // Add SQS event source
    tradeProcessorLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(tradeOrderQueue, {
        batchSize: 10,
      })
    );

    // Lambda function for health monitoring
    const healthMonitorLambda = new lambda.Function(
      this,
      `HealthMonitor-${environmentSuffix}`,
      {
        functionName: `health-monitor-${region}-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lib/lambda/failover-test'),
        timeout: cdk.Duration.minutes(5),
        environment: {
          REGION: region,
          DB_CLUSTER_ARN: dbCluster.clusterArn,
          SESSION_TABLE_NAME: sessionTable.tableName,
        },
      }
    );

    // Grant permissions for health monitoring
    sessionTable.grantReadData(healthMonitorLambda);
    dbCluster.grantDataApiAccess(healthMonitorLambda);

    // CloudWatch Events rule for hourly health checks
    const testRule = new events.Rule(
      this,
      `HealthMonitorRule-${environmentSuffix}`,
      {
        ruleName: `health-monitor-${region}-${environmentSuffix}`,
        schedule: events.Schedule.rate(cdk.Duration.hours(1)),
      }
    );

    testRule.addTarget(new targets.LambdaFunction(healthMonitorLambda));

    // API Gateway for REST API
    const api = new apigateway.RestApi(
      this,
      `TradingAPI-${environmentSuffix}`,
      {
        restApiName: `trading-api-${region}-${environmentSuffix}`,
        deployOptions: {
          stageName: 'prod',
          metricsEnabled: true,
          loggingLevel: apigateway.MethodLoggingLevel.INFO,
          dataTraceEnabled: true,
        },
      }
    );

    // API Gateway endpoints
    const tradesResource = api.root.addResource('trades');
    const integration = new apigateway.LambdaIntegration(tradeProcessorLambda);
    tradesResource.addMethod('POST', integration);
    tradesResource.addMethod('GET', integration);

    // Health check endpoint
    const healthResource = api.root.addResource('health');
    const healthLambda = new lambda.Function(
      this,
      `HealthCheck-${environmentSuffix}`,
      {
        functionName: `health-check-${region}-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
          exports.handler = async (event) => {
            return {
              statusCode: 200,
              body: JSON.stringify({
                status: 'healthy',
                region: '${region}',
                timestamp: new Date().toISOString()
              })
            };
          };
        `),
      }
    );

    healthResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(healthLambda)
    );

    // Route 53 Health Check
    new route53.CfnHealthCheck(this, `APIHealthCheck-${environmentSuffix}`, {
      healthCheckConfig: {
        type: 'HTTPS',
        resourcePath: '/prod/health',
        fullyQualifiedDomainName: `${api.restApiId}.execute-api.${region}.amazonaws.com`,
        requestInterval: 30,
        failureThreshold: 3,
      },
    });

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, `AlertTopic-${environmentSuffix}`, {
      topicName: `trading-alerts-${region}-${environmentSuffix}`,
      displayName: 'Trading Platform Alerts',
    });

    // CloudWatch Alarms
    const lambdaErrorAlarm = new cloudwatch.Alarm(
      this,
      `LambdaErrorAlarm-${environmentSuffix}`,
      {
        alarmName: `trade-processor-errors-${region}-${environmentSuffix}`,
        metric: tradeProcessorLambda.metricErrors(),
        threshold: 5,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      }
    );

    lambdaErrorAlarm.addAlarmAction(new actions.SnsAction(alertTopic));

    const apiLatencyAlarm = new cloudwatch.Alarm(
      this,
      `APILatencyAlarm-${environmentSuffix}`,
      {
        alarmName: `api-gateway-latency-${region}-${environmentSuffix}`,
        metric: api.metricLatency(),
        threshold: 1000,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      }
    );

    apiLatencyAlarm.addAlarmAction(new actions.SnsAction(alertTopic));

    // Database CPU utilization alarm
    const dbCpuAlarm = new cloudwatch.Alarm(
      this,
      `DBCpuAlarm-${environmentSuffix}`,
      {
        alarmName: `aurora-cpu-utilization-${region}-${environmentSuffix}`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            DBClusterIdentifier: dbCluster.clusterIdentifier,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 80,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      }
    );

    dbCpuAlarm.addAlarmAction(new actions.SnsAction(alertTopic));

    // EventBridge for event handling (single region)
    const eventBus = new events.EventBus(
      this,
      `TradingEventBus-${environmentSuffix}`,
      {
        eventBusName: `trading-events-${region}-${environmentSuffix}`,
      }
    );

    // Event rule for trade processing
    const tradeEventRule = new events.Rule(
      this,
      `TradeEventRule-${environmentSuffix}`,
      {
        eventBus,
        ruleName: `trade-events-${region}-${environmentSuffix}`,
        eventPattern: {
          source: ['trading.platform'],
          detailType: ['Trade Executed', 'Trade Failed'],
        },
      }
    );

    // Log events to CloudWatch
    tradeEventRule.addTarget(
      new targets.CloudWatchLogGroup(
        new logs.LogGroup(this, `TradeEventsLog-${environmentSuffix}`, {
          logGroupName: `/aws/events/trading-${region}-${environmentSuffix}`,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        })
      )
    );

    // Systems Manager Parameters for configuration
    new ssm.StringParameter(this, `RegionParam-${environmentSuffix}`, {
      parameterName: `/trading/${environmentSuffix}/region`,
      stringValue: region,
    });

    new ssm.StringParameter(this, `DBEndpointParam-${environmentSuffix}`, {
      parameterName: `/trading/${environmentSuffix}/db-endpoint`,
      stringValue: dbCluster.clusterEndpoint.hostname,
    });

    new ssm.StringParameter(this, `APIEndpointParam-${environmentSuffix}`, {
      parameterName: `/trading/${environmentSuffix}/api-endpoint`,
      stringValue: api.url,
    });

    // Outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'DBClusterEndpoint', {
      value: dbCluster.clusterEndpoint.hostname,
      description: 'Aurora DB Cluster Endpoint',
    });

    new cdk.CfnOutput(this, 'SessionTableName', {
      value: sessionTable.tableName,
      description: 'DynamoDB Session Table Name',
    });

    new cdk.CfnOutput(this, 'TradeQueueUrl', {
      value: tradeOrderQueue.queueUrl,
      description: 'SQS Trade Order Queue URL',
    });

    new cdk.CfnOutput(this, 'APIEndpoint', {
      value: api.url,
      description: 'API Gateway Endpoint',
    });

    new cdk.CfnOutput(this, 'ConfigBucketName', {
      value: configBucket.bucketName,
      description: 'S3 Config Bucket Name',
    });

    new cdk.CfnOutput(this, 'AuditLogsBucketName', {
      value: auditLogsBucket.bucketName,
      description: 'S3 Audit Logs Bucket Name',
    });
  }
}
