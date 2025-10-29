import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import { PipelineConfig } from '../config/pipeline-config';

export interface MonitoringInfrastructureProps {
  config: PipelineConfig;
  kmsKey: kms.Key;
}

export class MonitoringInfrastructure extends Construct {
  public readonly alarmTopic: sns.Topic;
  public readonly pipelineTopic: sns.Topic;
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(
    scope: Construct,
    id: string,
    props: MonitoringInfrastructureProps
  ) {
    super(scope, id);

    const { config, kmsKey } = props;

    // SNS topic for alarms
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `${config.prefix}-alarms`,
      displayName: `${config.prefix} Alarms`,
      masterKey: kmsKey,
    });

    // SNS topic for pipeline notifications
    this.pipelineTopic = new sns.Topic(this, 'PipelineTopic', {
      topicName: `${config.prefix}-pipeline-notifications`,
      displayName: `${config.prefix} Pipeline Notifications`,
      masterKey: kmsKey,
    });

    // Add email subscriptions if configured
    if (config.notificationEmail) {
      this.alarmTopic.addSubscription(
        new sns_subscriptions.EmailSubscription(config.notificationEmail)
      );
      this.pipelineTopic.addSubscription(
        new sns_subscriptions.EmailSubscription(config.notificationEmail)
      );
    }

    // CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `${config.prefix}-dashboard`,
      defaultInterval: cdk.Duration.hours(1),
    });

    // Lambda metrics widget
    const lambdaWidget = new cloudwatch.GraphWidget({
      title: 'Lambda Function Metrics',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Invocations',
          dimensionsMap: {
            FunctionName: `${config.prefix}-function`,
          },
          statistic: 'Sum',
        }),
      ],
      right: [
        new cloudwatch.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Errors',
          dimensionsMap: {
            FunctionName: `${config.prefix}-function`,
          },
          statistic: 'Sum',
          color: cloudwatch.Color.RED,
        }),
      ],
      width: 12,
      height: 6,
    });

    // API Gateway metrics widget
    const apiGatewayWidget = new cloudwatch.GraphWidget({
      title: 'API Gateway Metrics',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Count',
          dimensionsMap: {
            ApiName: `${config.prefix}-api`,
            Stage: config.environmentSuffix,
          },
          statistic: 'Sum',
        }),
      ],
      right: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          dimensionsMap: {
            ApiName: `${config.prefix}-api`,
            Stage: config.environmentSuffix,
          },
          statistic: 'Average',
          color: cloudwatch.Color.BLUE,
        }),
      ],
      width: 12,
      height: 6,
    });

    // Pipeline metrics widget
    const pipelineWidget = new cloudwatch.GraphWidget({
      title: 'Pipeline Execution Metrics',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/CodePipeline',
          metricName: 'PipelineExecutionSuccess',
          dimensionsMap: {
            PipelineName: `${config.prefix}-pipeline`,
          },
          statistic: 'Sum',
          color: cloudwatch.Color.GREEN,
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/CodePipeline',
          metricName: 'PipelineExecutionFailure',
          dimensionsMap: {
            PipelineName: `${config.prefix}-pipeline`,
          },
          statistic: 'Sum',
          color: cloudwatch.Color.RED,
        }),
      ],
      width: 12,
      height: 6,
    });

    // Add widgets to dashboard
    this.dashboard.addWidgets(lambdaWidget, apiGatewayWidget);
    this.dashboard.addWidgets(pipelineWidget);

    // Log metric filters for custom metrics
    const errorLogMetricFilter = new logs.MetricFilter(this, 'ErrorLogMetric', {
      logGroup: new logs.LogGroup(this, 'ApplicationLogGroup', {
        logGroupName: `/aws/application/${config.prefix}`,
        retention: logs.RetentionDays.ONE_MONTH,
        encryptionKey: kmsKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      metricName: 'ApplicationErrors',
      metricNamespace: config.prefix,
      filterPattern: logs.FilterPattern.literal('[ERROR]'),
      metricValue: '1',
    });

    // Custom alarm for application errors
    new cloudwatch.Alarm(this, 'ApplicationErrorAlarm', {
      alarmName: `${config.prefix}-application-errors`,
      metric: errorLogMetricFilter.metric(),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Application error rate is too high',
    }).addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(this.alarmTopic)
    );
  }
}
