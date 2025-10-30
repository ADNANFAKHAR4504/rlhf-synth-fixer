import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import { getRemovalPolicy, PipelineConfig } from '../config/pipeline-config';

export interface MonitoringInfrastructureProps {
  config: PipelineConfig;
  kmsKey: kms.Key;
  alarmTopic: sns.Topic; // Required - topics should be created earlier
  pipelineTopic: sns.Topic; // Required - topics should be created earlier
  lambdaFunctionArn: string;
  apiGatewayId: string;
  pipelineName: string;
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

    const { config, kmsKey, alarmTopic, pipelineTopic } = props;

    // Store provided topics (should be created earlier)
    this.alarmTopic = alarmTopic;
    this.pipelineTopic = pipelineTopic;

    // Create CloudWatch Dashboard
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

    // Application log group with lifecycle policy for cost optimization
    const isProduction = config.environmentSuffix
      .toLowerCase()
      .includes('prod');
    const applicationLogGroup = new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: `/aws/application/${config.prefix}`,
      retention: isProduction
        ? logs.RetentionDays.ONE_MONTH
        : logs.RetentionDays.ONE_WEEK, // Shorter retention for dev/test
      encryptionKey: kmsKey,
      removalPolicy: getRemovalPolicy(config.environmentSuffix),
    });

    // Log metric filters for custom metrics
    const errorLogMetricFilter = new logs.MetricFilter(this, 'ErrorLogMetric', {
      logGroup: applicationLogGroup,
      metricName: 'ApplicationErrors',
      metricNamespace: config.prefix,
      filterPattern: logs.FilterPattern.literal('[ERROR]'),
      metricValue: '1',
    });

    // Custom alarm for application errors
    const applicationErrorAlarm = new cloudwatch.Alarm(
      this,
      'ApplicationErrorAlarm',
      {
        alarmName: `${config.prefix}-application-errors`,
        metric: errorLogMetricFilter.metric(),
        threshold: 5,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: 'Application error rate is too high',
      }
    );
    applicationErrorAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alarmTopic)
    );

    // Lambda metrics and alarms
    // Lambda duration alarm
    const lambdaDurationMetric = new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Duration',
      dimensionsMap: {
        FunctionName: `${config.prefix}-function`,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    const lambdaDurationAlarm = new cloudwatch.Alarm(
      this,
      'LambdaDurationAlarm',
      {
        alarmName: `${config.prefix}-lambda-duration`,
        metric: lambdaDurationMetric,
        threshold: 25000, // 25 seconds
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: 'Lambda function duration exceeds threshold',
      }
    );
    lambdaDurationAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alarmTopic)
    );

    // Lambda throttle alarm
    const lambdaThrottleMetric = new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Throttles',
      dimensionsMap: {
        FunctionName: `${config.prefix}-function`,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const lambdaThrottleAlarm = new cloudwatch.Alarm(
      this,
      'LambdaThrottleAlarm',
      {
        alarmName: `${config.prefix}-lambda-throttles`,
        metric: lambdaThrottleMetric,
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: 'Lambda function throttles detected',
      }
    );
    lambdaThrottleAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alarmTopic)
    );

    // API Gateway alarms
    // API Gateway latency alarm
    const apiLatencyMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Latency',
      dimensionsMap: {
        ApiName: `${config.prefix}-api`,
        Stage: config.environmentSuffix,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    const apiLatencyAlarm = new cloudwatch.Alarm(this, 'ApiLatencyAlarm', {
      alarmName: `${config.prefix}-api-latency`,
      metric: apiLatencyMetric,
      threshold: 2000, // 2 seconds
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'API Gateway latency exceeds threshold',
    });
    apiLatencyAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alarmTopic)
    );

    // Pipeline-specific alarms
    // Pipeline failure alarm
    const pipelineFailureMetric = new cloudwatch.Metric({
      namespace: 'AWS/CodePipeline',
      metricName: 'PipelineExecutionFailure',
      dimensionsMap: {
        PipelineName: props.pipelineName,
      },
      statistic: 'Sum',
      period: cdk.Duration.hours(1),
    });

    const pipelineFailureAlarm = new cloudwatch.Alarm(
      this,
      'PipelineFailureAlarm',
      {
        alarmName: `${config.prefix}-pipeline-failures`,
        metric: pipelineFailureMetric,
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: 'Pipeline execution failures detected',
      }
    );
    pipelineFailureAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alarmTopic)
    );
    pipelineFailureAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.pipelineTopic)
    );
  }
}

/**
 * Helper function to create SNS topics for monitoring.
 * These should be created early as they're needed by application and pipeline infrastructure.
 */
export function createMonitoringTopics(
  scope: Construct,
  id: string,
  config: PipelineConfig,
  kmsKey: kms.Key
): { alarmTopic: sns.Topic; pipelineTopic: sns.Topic } {
  const alarmTopic = new sns.Topic(scope, `${id}AlarmTopic`, {
    topicName: `${config.prefix}-alarms`,
    displayName: `${config.prefix} Alarms`,
    masterKey: kmsKey,
  });

  const pipelineTopic = new sns.Topic(scope, `${id}PipelineTopic`, {
    topicName: `${config.prefix}-pipeline-notifications`,
    displayName: `${config.prefix} Pipeline Notifications`,
    masterKey: kmsKey,
  });

  // Add email subscriptions if configured
  if (config.notificationEmail) {
    alarmTopic.addSubscription(
      new sns_subscriptions.EmailSubscription(config.notificationEmail)
    );
    pipelineTopic.addSubscription(
      new sns_subscriptions.EmailSubscription(config.notificationEmail)
    );
  }

  return { alarmTopic, pipelineTopic };
}
