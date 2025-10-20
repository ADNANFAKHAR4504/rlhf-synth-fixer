import * as cdk from 'aws-cdk-lib';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import * as cw_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface AlarmsConstructProps {
  environmentSuffix: string;
  alarmTopic: sns.Topic;
}

export class AlarmsConstruct extends Construct {
  private alarms: Map<string, cw.Alarm> = new Map();

  constructor(scope: Construct, id: string, props: AlarmsConstructProps) {
    super(scope, id);

    // Create alarms for different services
    this.createApiGatewayAlarms(props);
    this.createLambdaAlarms(props);
    this.createRdsAlarms(props);
  }

  private createApiGatewayAlarms(props: AlarmsConstructProps): void {
    // High Latency Alarm
    const latencyAlarm = new cw.Alarm(this, 'ApiGatewayHighLatency', {
      alarmName: `${cdk.Stack.of(this).stackName}-ApiGateway-HighLatency-${props.environmentSuffix}`,
      alarmDescription: 'API Gateway latency exceeds 1000ms',
      metric: new cw.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: 'Latency',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1000,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    });

    // 5XX Error Rate Alarm
    const errorAlarm = new cw.Alarm(this, 'ApiGateway5xxErrors', {
      alarmName: `${cdk.Stack.of(this).stackName}-ApiGateway-5xxErrors-${props.environmentSuffix}`,
      alarmDescription: 'API Gateway 5XX error rate exceeds 5%',
      metric: new cw.MathExpression({
        expression: 'IF(total > 0, errors / total * 100, 0)',
        usingMetrics: {
          errors: new cw.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '5XXError',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          total: new cw.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Count',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        },
      }),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    });

    // Add actions
    [latencyAlarm, errorAlarm].forEach(alarm => {
      alarm.addAlarmAction(new cw_actions.SnsAction(props.alarmTopic));
      this.alarms.set(alarm.alarmName, alarm);
    });
  }

  private createLambdaAlarms(props: AlarmsConstructProps): void {
    // High Duration Alarm
    const durationAlarm = new cw.Alarm(this, 'LambdaHighDuration', {
      alarmName: `${cdk.Stack.of(this).stackName}-Lambda-HighDuration-${props.environmentSuffix}`,
      alarmDescription: 'Lambda duration exceeds 3000ms',
      metric: new cw.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Duration',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 3000,
      evaluationPeriods: 2,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    });

    // Error Count Alarm
    const errorAlarm = new cw.Alarm(this, 'LambdaErrors', {
      alarmName: `${cdk.Stack.of(this).stackName}-Lambda-Errors-${props.environmentSuffix}`,
      alarmDescription: 'Lambda error count exceeds 10',
      metric: new cw.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Errors',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    });

    // Throttles Alarm
    const throttleAlarm = new cw.Alarm(this, 'LambdaThrottles', {
      alarmName: `${cdk.Stack.of(this).stackName}-Lambda-Throttles-${props.environmentSuffix}`,
      alarmDescription: 'Lambda throttle count exceeds 5',
      metric: new cw.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Throttles',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    });

    // Add actions
    [durationAlarm, errorAlarm, throttleAlarm].forEach(alarm => {
      alarm.addAlarmAction(new cw_actions.SnsAction(props.alarmTopic));
      this.alarms.set(alarm.alarmName, alarm);
    });
  }

  private createRdsAlarms(props: AlarmsConstructProps): void {
    // CPU Utilization Alarm
    const cpuAlarm = new cw.Alarm(this, 'RdsHighCpu', {
      alarmName: `${cdk.Stack.of(this).stackName}-RDS-HighCPU-${props.environmentSuffix}`,
      alarmDescription: 'RDS CPU utilization exceeds 80%',
      metric: new cw.Metric({
        namespace: 'AWS/RDS',
        metricName: 'CPUUtilization',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    });

    // Connection Count Alarm
    const connectionAlarm = new cw.Alarm(this, 'RdsHighConnections', {
      alarmName: `${cdk.Stack.of(this).stackName}-RDS-HighConnections-${props.environmentSuffix}`,
      alarmDescription: 'RDS connection count exceeds 80',
      metric: new cw.Metric({
        namespace: 'AWS/RDS',
        metricName: 'DatabaseConnections',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    });

    // Read Latency Alarm
    const readLatencyAlarm = new cw.Alarm(this, 'RdsHighReadLatency', {
      alarmName: `${cdk.Stack.of(this).stackName}-RDS-HighReadLatency-${props.environmentSuffix}`,
      alarmDescription: 'RDS read latency exceeds 0.02s',
      metric: new cw.Metric({
        namespace: 'AWS/RDS',
        metricName: 'ReadLatency',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 0.02, // 20ms in seconds
      evaluationPeriods: 2,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    });

    // Add actions
    [cpuAlarm, connectionAlarm, readLatencyAlarm].forEach(alarm => {
      alarm.addAlarmAction(new cw_actions.SnsAction(props.alarmTopic));
      this.alarms.set(alarm.alarmName, alarm);
    });
  }

  public getAllAlarms(): cw.Alarm[] {
    return Array.from(this.alarms.values());
  }

  public getAlarmNames(): string[] {
    return Array.from(this.alarms.keys());
  }
}
