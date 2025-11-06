import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface MonitoringStackProps {
  config: any;
  pipeline: codepipeline.Pipeline;
  notificationLambda?: cdk.aws_lambda_nodejs.NodejsFunction;
  removalPolicy: cdk.RemovalPolicy;
}

export class MonitoringStack extends Construct {
  public readonly alertTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id);

    const { config, pipeline, notificationLambda } = props;
    const resourceName = (resource: string) =>
      `${config.company}-${config.division}-${config.environmentSuffix}-${resource}`;

    // Create SNS topic for alerts
    this.alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: resourceName('pipeline-alerts'),
      displayName: 'Pipeline Alert Notifications',
    });

    if (notificationLambda) {
      this.alertTopic.grantPublish(notificationLambda);
      this.alertTopic.addSubscription(
        new subscriptions.LambdaSubscription(notificationLambda)
      );
    }

    // Pipeline failure alarm
    new cloudwatch.Alarm(this, 'PipelineFailureAlarm', {
      alarmName: resourceName('pipeline-failure'),
      alarmDescription: 'Pipeline execution failed',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CodePipeline',
        metricName: 'PipelineExecutionFailure',
        dimensionsMap: {
          PipelineName: pipeline.pipelineName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      actionsEnabled: true,
    }).addAlarmAction(new cloudwatch_actions.SnsAction(this.alertTopic));

    // Pipeline duration alarm (alert if pipeline takes too long)
    new cloudwatch.Alarm(this, 'PipelineDurationAlarm', {
      alarmName: resourceName('pipeline-duration'),
      alarmDescription: 'Pipeline execution taking too long',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CodePipeline',
        metricName: 'PipelineExecutionDuration',
        dimensionsMap: {
          PipelineName: pipeline.pipelineName,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 3600000, // 60 minutes in milliseconds
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      actionsEnabled: true,
    }).addAlarmAction(new cloudwatch_actions.SnsAction(this.alertTopic));

    // Create custom dashboard
    new cloudwatch.Dashboard(this, 'PipelineDashboard', {
      dashboardName: resourceName('pipeline-dashboard'),
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Pipeline Execution Status',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/CodePipeline',
                metricName: 'PipelineExecutionSuccess',
                dimensionsMap: {
                  PipelineName: pipeline.pipelineName,
                },
                statistic: 'Sum',
                period: cdk.Duration.hours(1),
                color: cloudwatch.Color.GREEN,
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/CodePipeline',
                metricName: 'PipelineExecutionFailure',
                dimensionsMap: {
                  PipelineName: pipeline.pipelineName,
                },
                statistic: 'Sum',
                period: cdk.Duration.hours(1),
                color: cloudwatch.Color.RED,
              }),
            ],
            width: 12,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'Pipeline Duration',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/CodePipeline',
                metricName: 'PipelineExecutionDuration',
                dimensionsMap: {
                  PipelineName: pipeline.pipelineName,
                },
                statistic: 'Average',
                period: cdk.Duration.hours(1),
                color: cloudwatch.Color.BLUE,
              }),
            ],
            width: 12,
            height: 6,
          }),
        ],
        [
          new cloudwatch.SingleValueWidget({
            title: 'Success Rate (24h)',
            metrics: [
              new cloudwatch.MathExpression({
                expression: '(m1 / (m1 + m2)) * 100',
                usingMetrics: {
                  m1: new cloudwatch.Metric({
                    namespace: 'AWS/CodePipeline',
                    metricName: 'PipelineExecutionSuccess',
                    dimensionsMap: {
                      PipelineName: pipeline.pipelineName,
                    },
                    statistic: 'Sum',
                    period: cdk.Duration.days(1),
                  }),
                  m2: new cloudwatch.Metric({
                    namespace: 'AWS/CodePipeline',
                    metricName: 'PipelineExecutionFailure',
                    dimensionsMap: {
                      PipelineName: pipeline.pipelineName,
                    },
                    statistic: 'Sum',
                    period: cdk.Duration.days(1),
                  }),
                },
              }),
            ],
            width: 6,
            height: 4,
          }),
          new cloudwatch.SingleValueWidget({
            title: 'Total Executions (24h)',
            metrics: [
              new cloudwatch.MathExpression({
                expression: 'm1 + m2',
                usingMetrics: {
                  m1: new cloudwatch.Metric({
                    namespace: 'AWS/CodePipeline',
                    metricName: 'PipelineExecutionSuccess',
                    dimensionsMap: {
                      PipelineName: pipeline.pipelineName,
                    },
                    statistic: 'Sum',
                    period: cdk.Duration.days(1),
                  }),
                  m2: new cloudwatch.Metric({
                    namespace: 'AWS/CodePipeline',
                    metricName: 'PipelineExecutionFailure',
                    dimensionsMap: {
                      PipelineName: pipeline.pipelineName,
                    },
                    statistic: 'Sum',
                    period: cdk.Duration.days(1),
                  }),
                },
              }),
            ],
            width: 6,
            height: 4,
          }),
        ],
      ],
    });
  }
}
