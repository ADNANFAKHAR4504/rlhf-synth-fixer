import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

export interface MonitoringConstructProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  database: rds.DatabaseCluster;
  lambda: lambda.Function;
  apiGateway: apigateway.RestApi;
  bucket: s3.Bucket;
  queue: sqs.Queue;
  alarmThresholds: {
    lambdaErrorRate: number;
    apiLatency: number;
    queueAgeSeconds: number;
  };
}

export class MonitoringConstruct extends Construct {
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    const {
      environmentSuffix,
      database,
      lambda: lambdaFunction,
      apiGateway,
      bucket,
      queue,
      alarmThresholds,
    } = props;

    // Create CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'PaymentDashboard', {
      dashboardName: `payment-dashboard-${environmentSuffix}`,
    });

    // Lambda metrics
    const lambdaErrorWidget = new cloudwatch.GraphWidget({
      title: 'Lambda Errors',
      left: [
        lambdaFunction.metricErrors({
          statistic: 'sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    const lambdaDurationWidget = new cloudwatch.GraphWidget({
      title: 'Lambda Duration',
      left: [
        lambdaFunction.metricDuration({
          statistic: 'avg',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    const lambdaInvocationsWidget = new cloudwatch.GraphWidget({
      title: 'Lambda Invocations',
      left: [
        lambdaFunction.metricInvocations({
          statistic: 'sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    // API Gateway metrics
    const apiLatencyWidget = new cloudwatch.GraphWidget({
      title: 'API Gateway Latency',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          dimensionsMap: {
            ApiName: apiGateway.restApiName,
          },
          statistic: 'avg',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    const api4xxWidget = new cloudwatch.GraphWidget({
      title: 'API 4xx Errors',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '4XXError',
          dimensionsMap: {
            ApiName: apiGateway.restApiName,
          },
          statistic: 'sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    const api5xxWidget = new cloudwatch.GraphWidget({
      title: 'API 5xx Errors',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '5XXError',
          dimensionsMap: {
            ApiName: apiGateway.restApiName,
          },
          statistic: 'sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    // Database metrics
    const dbCpuWidget = new cloudwatch.GraphWidget({
      title: 'Database CPU Utilization',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            DBClusterIdentifier: database.clusterIdentifier,
          },
          statistic: 'avg',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    const dbConnectionsWidget = new cloudwatch.GraphWidget({
      title: 'Database Connections',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'DatabaseConnections',
          dimensionsMap: {
            DBClusterIdentifier: database.clusterIdentifier,
          },
          statistic: 'avg',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    // SQS metrics
    const queueDepthWidget = new cloudwatch.GraphWidget({
      title: 'Queue Depth',
      left: [
        queue.metricApproximateNumberOfMessagesVisible({
          statistic: 'avg',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    const queueAgeWidget = new cloudwatch.GraphWidget({
      title: 'Message Age',
      left: [
        queue.metricApproximateAgeOfOldestMessage({
          statistic: 'max',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    // S3 metrics
    const bucketSizeWidget = new cloudwatch.GraphWidget({
      title: 'S3 Bucket Size',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/S3',
          metricName: 'BucketSizeBytes',
          dimensionsMap: {
            BucketName: bucket.bucketName,
            StorageType: 'StandardStorage',
          },
          statistic: 'avg',
          period: cdk.Duration.days(1),
        }),
      ],
    });

    // Add widgets to dashboard
    this.dashboard.addWidgets(
      lambdaErrorWidget,
      lambdaDurationWidget,
      lambdaInvocationsWidget
    );
    this.dashboard.addWidgets(apiLatencyWidget, api4xxWidget, api5xxWidget);
    this.dashboard.addWidgets(dbCpuWidget, dbConnectionsWidget);
    this.dashboard.addWidgets(
      queueDepthWidget,
      queueAgeWidget,
      bucketSizeWidget
    );

    // Create SNS topic for alarms
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `payment-alarms-${environmentSuffix}`,
      displayName: `Payment Processing Alarms - ${environmentSuffix}`,
    });

    // Create CloudWatch Alarms
    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `payment-lambda-errors-${environmentSuffix}`,
      metric: lambdaFunction.metricErrors({
        statistic: 'sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: alarmThresholds.lambdaErrorRate,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    lambdaErrorAlarm.addAlarmAction(new actions.SnsAction(alarmTopic));

    const apiLatencyAlarm = new cloudwatch.Alarm(this, 'ApiLatencyAlarm', {
      alarmName: `payment-api-latency-${environmentSuffix}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: 'Latency',
        dimensionsMap: {
          ApiName: apiGateway.restApiName,
        },
        statistic: 'avg',
        period: cdk.Duration.minutes(5),
      }),
      threshold: alarmThresholds.apiLatency,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    apiLatencyAlarm.addAlarmAction(new actions.SnsAction(alarmTopic));

    const queueAgeAlarm = new cloudwatch.Alarm(this, 'QueueAgeAlarm', {
      alarmName: `payment-queue-age-${environmentSuffix}`,
      metric: queue.metricApproximateAgeOfOldestMessage({
        statistic: 'max',
        period: cdk.Duration.minutes(5),
      }),
      threshold: alarmThresholds.queueAgeSeconds,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    queueAgeAlarm.addAlarmAction(new actions.SnsAction(alarmTopic));

    const dbCpuAlarm = new cloudwatch.Alarm(this, 'DatabaseCpuAlarm', {
      alarmName: `payment-db-cpu-${environmentSuffix}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          DBClusterIdentifier: database.clusterIdentifier,
        },
        statistic: 'avg',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    dbCpuAlarm.addAlarmAction(new actions.SnsAction(alarmTopic));

    // Tags
    cdk.Tags.of(this.dashboard).add(
      'Name',
      `payment-dashboard-${environmentSuffix}`
    );
    cdk.Tags.of(this.dashboard).add('Environment', environmentSuffix);
  }
}
