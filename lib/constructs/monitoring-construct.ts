import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { KmsConstruct } from './kms-construct';

export interface MonitoringConstructProps {
  environmentSuffix: string;
  lambdaFunction: lambda.Function;
  apiGateway: apigateway.RestApi;
  deadLetterQueue: sqs.Queue;
  kmsKey: KmsConstruct;
}

export class MonitoringConstruct extends Construct {
  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    // Create SNS topic for alerts with KMS encryption
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `serverless-alerts-${props.environmentSuffix}`,
      displayName: 'Serverless Infrastructure Alerts',
      masterKey: props.kmsKey.key,
    });

    // Lambda error metric
    const lambdaErrorMetric = new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Errors',
      dimensionsMap: {
        FunctionName: props.lambdaFunction.functionName,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    // Lambda error alarm
    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `lambda-errors-${props.environmentSuffix}`,
      alarmDescription: 'Alert when Lambda function has errors',
      metric: lambdaErrorMetric,
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    lambdaErrorAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    // Lambda duration metric
    const lambdaDurationAlarm = new cloudwatch.Alarm(
      this,
      'LambdaDurationAlarm',
      {
        alarmName: `lambda-duration-${props.environmentSuffix}`,
        alarmDescription: 'Alert when Lambda function duration is high',
        metric: props.lambdaFunction.metricDuration({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 5000, // 5 seconds
        evaluationPeriods: 2,
      }
    );

    lambdaDurationAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    // Lambda throttles alarm
    const lambdaThrottleAlarm = new cloudwatch.Alarm(
      this,
      'LambdaThrottleAlarm',
      {
        alarmName: `lambda-throttles-${props.environmentSuffix}`,
        alarmDescription: 'Alert when Lambda function is throttled',
        metric: props.lambdaFunction.metricThrottles({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
      }
    );

    lambdaThrottleAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    // DLQ message alarm
    const dlqAlarm = new cloudwatch.Alarm(this, 'DLQAlarm', {
      alarmName: `dlq-messages-${props.environmentSuffix}`,
      alarmDescription: 'Alert when messages are sent to DLQ',
      metric: props.deadLetterQueue.metricApproximateNumberOfMessagesVisible({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
    });

    dlqAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // API Gateway 4xx errors
    const api4xxAlarm = new cloudwatch.Alarm(this, 'Api4xxAlarm', {
      alarmName: `api-4xx-errors-${props.environmentSuffix}`,
      alarmDescription: 'Alert on high 4xx error rate',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '4XXError',
        dimensionsMap: {
          ApiName: props.apiGateway.restApiName,
          Stage: props.environmentSuffix,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 2,
    });

    api4xxAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // API Gateway 5xx errors
    const api5xxAlarm = new cloudwatch.Alarm(this, 'Api5xxAlarm', {
      alarmName: `api-5xx-errors-${props.environmentSuffix}`,
      alarmDescription: 'Alert on 5xx errors',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5XXError',
        dimensionsMap: {
          ApiName: props.apiGateway.restApiName,
          Stage: props.environmentSuffix,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
    });

    api5xxAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // Create CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `serverless-dashboard-${props.environmentSuffix}`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Lambda Function Metrics',
            left: [
              props.lambdaFunction.metricInvocations(),
              props.lambdaFunction.metricErrors(),
              props.lambdaFunction.metricThrottles(),
            ],
            right: [props.lambdaFunction.metricDuration()],
            width: 12,
          }),
          new cloudwatch.GraphWidget({
            title: 'API Gateway Metrics',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: 'Count',
                dimensionsMap: {
                  ApiName: props.apiGateway.restApiName,
                  Stage: props.environmentSuffix,
                },
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: '4XXError',
                dimensionsMap: {
                  ApiName: props.apiGateway.restApiName,
                  Stage: props.environmentSuffix,
                },
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: '5XXError',
                dimensionsMap: {
                  ApiName: props.apiGateway.restApiName,
                  Stage: props.environmentSuffix,
                },
              }),
            ],
            width: 12,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'Dead Letter Queue',
            left: [
              props.deadLetterQueue.metricApproximateNumberOfMessagesVisible(),
              props.deadLetterQueue.metricApproximateNumberOfMessagesNotVisible(),
            ],
            width: 12,
          }),
          new cloudwatch.SingleValueWidget({
            title: 'Lambda Concurrent Executions',
            metrics: [
              new cloudwatch.Metric({
                namespace: 'AWS/Lambda',
                metricName: 'ConcurrentExecutions',
                dimensionsMap: {
                  FunctionName: props.lambdaFunction.functionName,
                },
                statistic: 'Maximum',
              }),
            ],
            width: 6,
          }),
          new cloudwatch.SingleValueWidget({
            title: 'API Gateway Latency',
            metrics: [
              new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: 'Latency',
                dimensionsMap: {
                  ApiName: props.apiGateway.restApiName,
                  Stage: props.environmentSuffix,
                },
                statistic: 'Average',
              }),
            ],
            width: 6,
          }),
        ],
      ],
    });

    // Add tags
    cdk.Tags.of(alertTopic).add('Project', 'ServerlessInfra');
    cdk.Tags.of(dashboard).add('Project', 'ServerlessInfra');
  }
}
