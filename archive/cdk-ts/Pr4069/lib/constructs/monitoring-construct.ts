import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import { IMonitoringConfig } from '../config/environment-config';

export interface MonitoringConstructProps {
  environment: string;
  lambdaFunctions: { [key: string]: lambda.Function };
  apiGateway: apigateway.RestApi;
  tables: { [key: string]: dynamodb.Table };
  config: IMonitoringConfig;
}

export class MonitoringConstruct extends Construct {
  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `${props.environment}-alarms`,
      displayName: `${props.environment} CloudWatch Alarms`,
    });

    alarmTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(props.config.alarmEmail)
    );

    Object.entries(props.lambdaFunctions).forEach(([name, fn]) => {
      new cloudwatch.Alarm(this, `${name}ErrorAlarm`, {
        alarmName: `${props.environment}-${name}-errors`,
        metric: fn.metricErrors(),
        threshold: props.config.lambdaErrorThreshold,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

      new cloudwatch.Alarm(this, `${name}DurationAlarm`, {
        alarmName: `${props.environment}-${name}-duration`,
        metric: fn.metricDuration(),
        threshold: props.config.lambdaDurationThreshold,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

      new cloudwatch.Alarm(this, `${name}ThrottlesAlarm`, {
        alarmName: `${props.environment}-${name}-throttles`,
        metric: fn.metricThrottles(),
        threshold: 5,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));
    });

    new cloudwatch.Alarm(this, 'Api4XXAlarm', {
      alarmName: `${props.environment}-api-4xx`,
      metric: props.apiGateway.metricClientError(),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    new cloudwatch.Alarm(this, 'Api5XXAlarm', {
      alarmName: `${props.environment}-api-5xx`,
      metric: props.apiGateway.metricServerError(),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    Object.entries(props.tables).forEach(([name, table]) => {
      new cloudwatch.Alarm(this, `${name}ReadThrottleAlarm`, {
        alarmName: `${props.environment}-${name}-read-throttles`,
        metric: table.metricUserErrors({
          statistic: 'Sum',
        }),
        threshold: 10,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));
    });

    const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `${props.environment}-dashboard`,
      defaultInterval: cdk.Duration.hours(6),
    });

    Object.entries(props.lambdaFunctions).forEach(([name, fn]) => {
      dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: `${name} Metrics`,
          left: [fn.metricInvocations()],
          right: [fn.metricErrors()],
          width: 12,
        }),
        new cloudwatch.GraphWidget({
          title: `${name} Duration`,
          left: [fn.metricDuration()],
          width: 12,
        })
      );
    });
  }
}
