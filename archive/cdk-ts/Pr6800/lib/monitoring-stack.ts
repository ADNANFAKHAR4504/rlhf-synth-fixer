import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sns from 'aws-cdk-lib/aws-sns';
// import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

interface MonitoringStackProps {
  vpc: ec2.Vpc;
  database: rds.DatabaseCluster;
  buckets: s3.Bucket[];
  lambdaFunctions: lambda.Function[];
  apiGateway: apigateway.RestApi;
  environmentSuffix: string;
}

export class MonitoringStack extends Construct {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id);

    // SNS topic for alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `trading-alerts-${props.environmentSuffix}`,
      displayName: 'Trading Platform Alerts',
    });

    // CloudWatch Log Groups for monitoring
    new logs.LogGroup(this, 'ApplicationLogs', {
      logGroupName: `/aws/application/trading-${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new logs.LogGroup(this, 'ErrorLogs', {
      logGroupName: `/aws/errors/trading-${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'TradingDashboard', {
      dashboardName: `trading-dashboard-${props.environmentSuffix}`,
    });

    // Database metrics
    const dbCpuWidget = new cloudwatch.GraphWidget({
      title: 'Database CPU Utilization',
      left: [
        props.database.metricCPUUtilization({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    const dbConnectionsWidget = new cloudwatch.GraphWidget({
      title: 'Database Connections',
      left: [
        props.database.metricDatabaseConnections({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    // Lambda metrics
    const lambdaErrorsWidget = new cloudwatch.GraphWidget({
      title: 'Lambda Errors',
      left: props.lambdaFunctions.map(fn =>
        fn.metricErrors({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        })
      ),
    });

    const lambdaDurationWidget = new cloudwatch.GraphWidget({
      title: 'Lambda Duration',
      left: props.lambdaFunctions.map(fn =>
        fn.metricDuration({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        })
      ),
    });

    // API Gateway metrics
    const apiRequestsWidget = new cloudwatch.GraphWidget({
      title: 'API Requests',
      left: [
        props.apiGateway.metricCount({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    const api4xxErrorsWidget = new cloudwatch.GraphWidget({
      title: 'API 4XX Errors',
      left: [
        props.apiGateway.metricClientError({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    const api5xxErrorsWidget = new cloudwatch.GraphWidget({
      title: 'API 5XX Errors',
      left: [
        props.apiGateway.metricServerError({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    // Add widgets to dashboard
    dashboard.addWidgets(
      dbCpuWidget,
      dbConnectionsWidget,
      lambdaErrorsWidget,
      lambdaDurationWidget
    );
    dashboard.addWidgets(
      apiRequestsWidget,
      api4xxErrorsWidget,
      api5xxErrorsWidget
    );

    // CloudWatch Alarms
    const dbCpuAlarm = new cloudwatch.Alarm(this, 'DbCpuAlarm', {
      alarmName: `trading-db-cpu-high-${props.environmentSuffix}`,
      metric: props.database.metricCPUUtilization({
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    dbCpuAlarm.addAlarmAction(new actions.SnsAction(alertTopic));

    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `trading-lambda-errors-${props.environmentSuffix}`,
      metric: props.lambdaFunctions[0].metricErrors({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    lambdaErrorAlarm.addAlarmAction(new actions.SnsAction(alertTopic));

    const api5xxAlarm = new cloudwatch.Alarm(this, 'Api5xxAlarm', {
      alarmName: `trading-api-5xx-errors-${props.environmentSuffix}`,
      metric: props.apiGateway.metricServerError({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 50,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    api5xxAlarm.addAlarmAction(new actions.SnsAction(alertTopic));
  }
}
