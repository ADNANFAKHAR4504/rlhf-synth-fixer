import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface MonitoringConstructProps {
  environmentSuffix: string;
  lambdaFunction: lambda.Function;
  apiGateway: apigateway.RestApi;
  pipeline: codepipeline.Pipeline;
  notificationTopic: sns.Topic;
  tags: { [key: string]: string };
}

export class MonitoringConstruct extends Construct {
  public readonly dashboard: cloudwatch.Dashboard;
  public readonly alarms: cloudwatch.Alarm[];

  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    this.alarms = [];

    // Create CloudWatch Dashboard
    const account = cdk.Aws.ACCOUNT_ID;
    const region = cdk.Aws.REGION;

    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `financeapp-${props.environmentSuffix}-${account}-${region}`,
      defaultInterval: cdk.Duration.hours(1),
    });

    // Lambda metrics
    const lambdaErrors = props.lambdaFunction.metricErrors({
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const lambdaDuration = props.lambdaFunction.metricDuration({
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    const lambdaThrottles = props.lambdaFunction.metricThrottles({
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const lambdaInvocations = props.lambdaFunction.metricInvocations({
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    // API Gateway metrics
    const apiRequests = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Count',
      dimensionsMap: {
        ApiName: props.apiGateway.restApiName,
        Stage: props.environmentSuffix,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const api4xxErrors = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: '4XXError',
      dimensionsMap: {
        ApiName: props.apiGateway.restApiName,
        Stage: props.environmentSuffix,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const api5xxErrors = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: '5XXError',
      dimensionsMap: {
        ApiName: props.apiGateway.restApiName,
        Stage: props.environmentSuffix,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const apiLatency = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Latency',
      dimensionsMap: {
        ApiName: props.apiGateway.restApiName,
        Stage: props.environmentSuffix,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    // Create alarms
    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `financeapp-lambda-errors-${props.environmentSuffix}-${account}-${region}`,
      metric: lambdaErrors,
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Lambda function errors exceed threshold',
    });
    lambdaErrorAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(props.notificationTopic)
    );
    this.alarms.push(lambdaErrorAlarm);

    const lambdaDurationAlarm = new cloudwatch.Alarm(
      this,
      'LambdaDurationAlarm',
      {
        alarmName: `financeapp-lambda-duration-${props.environmentSuffix}-${account}-${region}`,
        metric: lambdaDuration,
        threshold: 10000, // 10 seconds
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: 'Lambda function duration exceeds threshold',
      }
    );
    lambdaDurationAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(props.notificationTopic)
    );
    this.alarms.push(lambdaDurationAlarm);

    const lambdaThrottleAlarm = new cloudwatch.Alarm(
      this,
      'LambdaThrottleAlarm',
      {
        alarmName: `financeapp-lambda-throttles-${props.environmentSuffix}-${account}-${region}`,
        metric: lambdaThrottles,
        threshold: 5,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: 'Lambda function throttles detected',
      }
    );
    lambdaThrottleAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(props.notificationTopic)
    );
    this.alarms.push(lambdaThrottleAlarm);

    const api5xxAlarm = new cloudwatch.Alarm(this, 'Api5xxAlarm', {
      alarmName: `financeapp-api-5xx-${props.environmentSuffix}-${account}-${region}`,
      metric: api5xxErrors,
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'API Gateway 5xx errors exceed threshold',
    });
    api5xxAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(props.notificationTopic)
    );
    this.alarms.push(api5xxAlarm);

    const apiLatencyAlarm = new cloudwatch.Alarm(this, 'ApiLatencyAlarm', {
      alarmName: `financeapp-api-latency-${props.environmentSuffix}-${account}-${region}`,
      metric: apiLatency,
      threshold: 1000, // 1 second
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'API Gateway latency exceeds threshold',
    });
    apiLatencyAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(props.notificationTopic)
    );
    this.alarms.push(apiLatencyAlarm);

    // Add widgets to dashboard
    this.dashboard.addWidgets(
      new cloudwatch.TextWidget({
        markdown: `# FinanceApp Dashboard - ${props.environmentSuffix}\n\nEnvironment: **${props.environmentSuffix}**\nRegion: **${cdk.Aws.REGION}**\nAccount: **${cdk.Aws.ACCOUNT_ID}**`,
        width: 24,
        height: 2,
      })
    );

    // Lambda metrics row
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: [lambdaInvocations],
        width: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: [lambdaErrors],
        width: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration',
        left: [lambdaDuration],
        width: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Throttles',
        left: [lambdaThrottles],
        width: 6,
      })
    );

    // API Gateway metrics row
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Requests',
        left: [apiRequests],
        width: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'API 4xx Errors',
        left: [api4xxErrors],
        width: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'API 5xx Errors',
        left: [api5xxErrors],
        width: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'API Latency',
        left: [apiLatency],
        width: 6,
      })
    );

    // Alarm status widget
    this.dashboard.addWidgets(
      new cloudwatch.AlarmStatusWidget({
        title: 'Alarm Status',
        alarms: this.alarms,
        width: 24,
        height: 4,
      })
    );

    // Pipeline metrics
    const pipelineSuccessRate = new cloudwatch.Metric({
      namespace: 'AWS/CodePipeline',
      metricName: 'PipelineExecutionSuccess',
      dimensionsMap: {
        PipelineName: props.pipeline.pipelineName,
      },
      statistic: 'Average',
      period: cdk.Duration.hours(1),
    });

    const pipelineFailureRate = new cloudwatch.Metric({
      namespace: 'AWS/CodePipeline',
      metricName: 'PipelineExecutionFailure',
      dimensionsMap: {
        PipelineName: props.pipeline.pipelineName,
      },
      statistic: 'Average',
      period: cdk.Duration.hours(1),
    });

    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Pipeline Success Rate',
        left: [pipelineSuccessRate],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Pipeline Failure Rate',
        left: [pipelineFailureRate],
        width: 12,
      })
    );

    // Apply tags
    Object.entries(props.tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });
  }
}
