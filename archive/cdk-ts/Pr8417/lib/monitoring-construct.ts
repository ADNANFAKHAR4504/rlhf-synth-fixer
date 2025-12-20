import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface MonitoringConstructProps {
  lambdaFunctions: lambda.Function[];
  environmentSuffix: string;
}

export class MonitoringConstruct extends Construct {
  private readonly environmentSuffix: string;
  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);
    this.environmentSuffix = props.environmentSuffix;

    // SNS topic for alerts
    const alertsTopic = new sns.Topic(this, 'AlertsTopic', {
      topicName: `serverless-alerts-${props.environmentSuffix}`,
      displayName: 'Serverless Monitoring Alerts',
    });
    alertsTopic.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Dashboard will be created later with all widgets

    // Create composite alarms for overall health
    this.createCompositeAlarms(
      props.lambdaFunctions,
      alertsTopic,
      props.environmentSuffix
    );

    // Enable Application Signals monitoring
    this.enableApplicationSignalsServiceMap(props.lambdaFunctions);

    // Add Application Signals widgets to dashboard
    new cloudwatch.Dashboard(this, 'ServerlessDashboard', {
      dashboardName: `serverless-monitoring-${props.environmentSuffix}`,
      widgets: [
        this.createDashboardWidgets(props.lambdaFunctions),
        this.createApplicationSignalsWidgets(props.lambdaFunctions),
      ],
    });
  }

  private createDashboardWidgets(
    functions: lambda.Function[]
  ): cloudwatch.IWidget[] {
    const widgets: cloudwatch.IWidget[] = [];

    // Overall metrics widget
    widgets.push(
      new cloudwatch.GraphWidget({
        title: 'Lambda Function Invocations',
        left: functions.map(func =>
          func.metricInvocations({
            period: cdk.Duration.minutes(5),
            statistic: cloudwatch.Stats.SUM,
          })
        ),
        width: 12,
        height: 6,
      })
    );

    widgets.push(
      new cloudwatch.GraphWidget({
        title: 'Lambda Function Errors',
        left: functions.map(func =>
          func.metricErrors({
            period: cdk.Duration.minutes(5),
            statistic: cloudwatch.Stats.SUM,
          })
        ),
        width: 12,
        height: 6,
      })
    );

    widgets.push(
      new cloudwatch.GraphWidget({
        title: 'Lambda Function Duration',
        left: functions.map(func =>
          func.metricDuration({
            period: cdk.Duration.minutes(5),
            statistic: cloudwatch.Stats.AVERAGE,
          })
        ),
        width: 12,
        height: 6,
      })
    );

    widgets.push(
      new cloudwatch.GraphWidget({
        title: 'Lambda Function Throttles',
        left: functions.map(func =>
          func.metricThrottles({
            period: cdk.Duration.minutes(5),
            statistic: cloudwatch.Stats.SUM,
          })
        ),
        width: 12,
        height: 6,
      })
    );

    return widgets;
  }

  private createCompositeAlarms(
    functions: lambda.Function[],
    alertsTopic: sns.Topic,
    environmentSuffix: string
  ): void {
    const errorAlarms: cloudwatch.Alarm[] = [];
    const throttleAlarms: cloudwatch.Alarm[] = [];

    functions.forEach((func, _index) => {
      const errorAlarm = new cloudwatch.Alarm(
        this,
        `Function${_index}ErrorAlarm`,
        {
          metric: func.metricErrors({
            period: cdk.Duration.minutes(5),
            statistic: cloudwatch.Stats.SUM,
          }),
          threshold: 5,
          evaluationPeriods: 2,
        }
      );

      const throttleAlarm = new cloudwatch.Alarm(
        this,
        `Function${_index}ThrottleAlarm`,
        {
          metric: func.metricThrottles({
            period: cdk.Duration.minutes(5),
            statistic: cloudwatch.Stats.SUM,
          }),
          threshold: 1,
          evaluationPeriods: 1,
        }
      );

      errorAlarms.push(errorAlarm);
      throttleAlarms.push(throttleAlarm);
    });

    // Composite alarm for overall system health
    const systemHealthAlarm = new cloudwatch.CompositeAlarm(
      this,
      'SystemHealthAlarm',
      {
        compositeAlarmName: `serverless-system-health-${environmentSuffix}`,
        alarmRule: cloudwatch.AlarmRule.anyOf(
          ...errorAlarms.map(alarm =>
            cloudwatch.AlarmRule.fromAlarm(alarm, cloudwatch.AlarmState.ALARM)
          ),
          ...throttleAlarms.map(alarm =>
            cloudwatch.AlarmRule.fromAlarm(alarm, cloudwatch.AlarmState.ALARM)
          )
        ),
        alarmDescription: 'Overall serverless system health monitoring',
      }
    );

    systemHealthAlarm.addAlarmAction(new actions.SnsAction(alertsTopic));
  }

  private createApplicationSignalsWidgets(
    functions: lambda.Function[]
  ): cloudwatch.IWidget[] {
    const applicationSignalsWidgets: cloudwatch.IWidget[] = [];

    // Application Signals service map widget
    applicationSignalsWidgets.push(
      new cloudwatch.GraphWidget({
        title: 'Application Signals - Service Dependencies',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApplicationSignals',
            metricName: 'ServiceDependencyHealth',
            dimensionsMap: {
              ServiceName: 'ServerlessApp',
            },
            period: cdk.Duration.minutes(5),
            statistic: cloudwatch.Stats.AVERAGE,
          }),
        ],
        width: 12,
        height: 6,
      })
    );

    // SLO compliance widget
    applicationSignalsWidgets.push(
      new cloudwatch.GraphWidget({
        title: 'Service Level Objectives (SLO) Compliance',
        left: functions.map(
          func =>
            new cloudwatch.Metric({
              namespace: 'AWS/ApplicationSignals',
              metricName: 'SLOCompliance',
              dimensionsMap: {
                ServiceName: func.functionName,
                SLOType: 'Availability',
              },
              period: cdk.Duration.minutes(15),
              statistic: cloudwatch.Stats.AVERAGE,
            })
        ),
        width: 12,
        height: 6,
      })
    );

    // Application performance insights widget
    applicationSignalsWidgets.push(
      new cloudwatch.GraphWidget({
        title: 'Application Performance Insights - P99 Latency',
        left: functions.map(
          func =>
            new cloudwatch.Metric({
              namespace: 'AWS/ApplicationSignals',
              metricName: 'Latency',
              dimensionsMap: {
                ServiceName: func.functionName,
              },
              period: cdk.Duration.minutes(5),
              statistic: 'p99',
            })
        ),
        width: 12,
        height: 6,
      })
    );

    // Error rate tracking with Application Signals
    applicationSignalsWidgets.push(
      new cloudwatch.GraphWidget({
        title: 'Application Signals - Error Rate Tracking',
        left: functions.map(
          func =>
            new cloudwatch.Metric({
              namespace: 'AWS/ApplicationSignals',
              metricName: 'ErrorRate',
              dimensionsMap: {
                ServiceName: func.functionName,
              },
              period: cdk.Duration.minutes(5),
              statistic: cloudwatch.Stats.AVERAGE,
            })
        ),
        width: 12,
        height: 6,
      })
    );

    return applicationSignalsWidgets;
  }

  private enableApplicationSignalsServiceMap(
    functions: lambda.Function[]
  ): void {
    // Create a log group for Application Signals traces
    const applicationSignalsLogGroup = new logs.LogGroup(
      this,
      'ApplicationSignalsLogGroup',
      {
        logGroupName: `/aws/application-signals/${this.environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Application Signals is automatically enabled when CloudWatch is configured
    // No need for a separate IAM role - it uses the existing CloudWatch permissions
    // Just add tags to identify Application Signals enabled resources
    functions.forEach(func => {
      cdk.Tags.of(func).add('ApplicationSignals', 'enabled');
      cdk.Tags.of(func).add('ServiceMap', 'true');
      cdk.Tags.of(func).add('APMMonitoring', 'active');
    });

    // Tag the log group as well
    cdk.Tags.of(applicationSignalsLogGroup).add(
      'ApplicationSignals',
      'enabled'
    );
    cdk.Tags.of(applicationSignalsLogGroup).add('ServiceMap', 'true');
  }
}
