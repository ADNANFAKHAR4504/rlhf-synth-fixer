import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface AlarmsConstructProps {
  operationalTopic: sns.Topic;
  securityTopic: sns.Topic;
  excludeApiGatewayAlarms?: boolean;
}

export class AlarmsConstruct extends Construct {
  public readonly alarms: Map<string, cloudwatch.Alarm> = new Map();

  constructor(scope: Construct, id: string, props: AlarmsConstructProps) {
    super(scope, id);

    const stack = cdk.Stack.of(this);
    let envSuffix =
      stack.node.tryGetContext('environmentSuffix') ||
      process.env.ENVIRONMENT_SUFFIX ||
      'dev';

    // Sanitize envSuffix to handle bash syntax and invalid characters, then convert to lowercase
    // Handle bash variable syntax ${VAR:-default} by extracting the default value
    envSuffix = envSuffix
      .replace(/\$\{[^:]+:-(.+?)\}/g, '$1') // Extract default value from ${VAR:-default}
      .replace(/\$\{[^}]+\}/g, '') // Remove any remaining ${VAR} patterns without defaults
      .replace(/:/g, '') // Remove colons
      .replace(/[^a-zA-Z0-9-]/g, '') // Remove other invalid chars, keep hyphens
      .toLowerCase();

    // Ensure we have a valid suffix
    if (!envSuffix || envSuffix.trim() === '') {
      envSuffix = 'dev';
    }

    // Get unique resource suffix to prevent conflicts
    const uniqueResourceSuffix =
      stack.node.tryGetContext('uniqueResourceSuffix') || 'default';

    const stackName = `tapstack-${envSuffix}-${uniqueResourceSuffix}`;

    // Payment failure rate alarm
    const paymentFailureAlarm = new cloudwatch.Alarm(
      this,
      'PaymentFailureRate',
      {
        alarmName: `payment-failure-rate-high-${stackName}`,
        alarmDescription: 'Payment failure rate exceeds 1%',
        metric: new cloudwatch.Metric({
          namespace: 'PaymentPlatform',
          metricName: 'PaymentFailureRate',
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    paymentFailureAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(props.operationalTopic)
    );
    this.alarms.set('paymentFailure', paymentFailureAlarm);

    // API Gateway latency alarm (conditionally created)
    let apiLatencyAlarm: cloudwatch.Alarm | undefined;
    if (!props.excludeApiGatewayAlarms) {
      apiLatencyAlarm = new cloudwatch.Alarm(this, 'APILatency', {
        alarmName: `api-gateway-latency-high-${stackName}`,
        alarmDescription: 'API Gateway response time exceeds 500ms',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          dimensionsMap: {
            ApiName: 'PaymentAPI',
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 500,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      apiLatencyAlarm.addAlarmAction(
        new cloudwatchActions.SnsAction(props.operationalTopic)
      );
      this.alarms.set('apiLatency', apiLatencyAlarm);
    }

    // RDS connection pool exhaustion alarm
    const dbConnectionAlarm = new cloudwatch.Alarm(this, 'DBConnections', {
      alarmName: `rds-connection-pool-exhausted-${stackName}`,
      alarmDescription: 'RDS connection pool utilization exceeds 90%',
      metric: new cloudwatch.MathExpression({
        expression: '(m1 / 100) * 100',
        usingMetrics: {
          m1: new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'DatabaseConnections',
            dimensionsMap: {
              DBClusterIdentifier: 'payment-db-cluster',
            },
            statistic: 'Maximum',
            period: cdk.Duration.minutes(5),
          }),
        },
      }),
      threshold: 90,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    dbConnectionAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(props.operationalTopic)
    );
    this.alarms.set('dbConnection', dbConnectionAlarm);

    // ECS task failure alarm
    const ecsTaskFailureAlarm = new cloudwatch.Alarm(this, 'ECSTaskFailures', {
      alarmName: `ecs-task-failures-high-${stackName}`,
      alarmDescription: 'ECS task failures detected',
      metric: new cloudwatch.Metric({
        namespace: 'ECS/ContainerInsights',
        metricName: 'TaskCount',
        dimensionsMap: {
          ServiceName: 'payment-service',
          TaskStatus: 'STOPPED',
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    ecsTaskFailureAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(props.operationalTopic)
    );
    this.alarms.set('ecsTaskFailure', ecsTaskFailureAlarm);

    // Security - failed authentication attempts
    const authFailureAlarm = new cloudwatch.Alarm(this, 'AuthFailures', {
      alarmName: `authentication-failures-high-${stackName}`,
      alarmDescription: 'High number of authentication failures detected',
      metric: new cloudwatch.Metric({
        namespace: 'PaymentPlatform/Security',
        metricName: 'AuthenticationFailures',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    authFailureAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(props.securityTopic)
    );
    this.alarms.set('authFailure', authFailureAlarm);

    // Composite alarm - conditionally includes API latency alarm
    const alarmRules = [
      cloudwatch.AlarmRule.fromAlarm(
        paymentFailureAlarm,
        cloudwatch.AlarmState.ALARM
      ),
    ];

    if (apiLatencyAlarm) {
      alarmRules.push(
        cloudwatch.AlarmRule.fromAlarm(
          apiLatencyAlarm,
          cloudwatch.AlarmState.ALARM
        )
      );
    }

    const criticalPerformanceAlarm = new cloudwatch.CompositeAlarm(
      this,
      'CriticalPerformance',
      {
        compositeAlarmName: `critical-performance-degradation-${stackName}`,
        alarmDescription: apiLatencyAlarm
          ? 'Both high error rate and high latency detected'
          : 'High error rate detected',
        alarmRule: cloudwatch.AlarmRule.allOf(...alarmRules),
      }
    );
    criticalPerformanceAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(props.operationalTopic)
    );
  }
}
