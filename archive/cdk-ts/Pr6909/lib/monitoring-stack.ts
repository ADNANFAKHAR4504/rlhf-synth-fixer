/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface MonitoringStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  database: rds.DatabaseInstance;
}

export class MonitoringStack extends cdk.NestedStack {
  public readonly alarmTopic: sns.Topic;
  public readonly compositeAlarm: cloudwatch.CompositeAlarm;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const { environmentSuffix, database } = props;
    const region = cdk.Stack.of(this).region;

    // SNS Topic for alarms
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `postgres-alarms-${environmentSuffix}`,
      displayName: `PostgreSQL Alarms for ${region}`,
    });

    // CloudWatch Alarms for database
    // CPU Utilization
    const cpuAlarm = new cloudwatch.Alarm(this, 'DatabaseCPUAlarm', {
      alarmName: `postgres-cpu-${environmentSuffix}`,
      metric: database.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    cpuAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // Free Storage Space
    const storageAlarm = new cloudwatch.Alarm(this, 'DatabaseStorageAlarm', {
      alarmName: `postgres-storage-${environmentSuffix}`,
      metric: database.metricFreeStorageSpace(),
      threshold: 10 * 1024 * 1024 * 1024, // 10 GB
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    storageAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // Database Connections
    const connectionsAlarm = new cloudwatch.Alarm(
      this,
      'DatabaseConnectionsAlarm',
      {
        alarmName: `postgres-connections-${environmentSuffix}`,
        metric: database.metricDatabaseConnections(),
        threshold: 80,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    connectionsAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // Read Latency
    const readLatencyAlarm = new cloudwatch.Alarm(
      this,
      'DatabaseReadLatencyAlarm',
      {
        alarmName: `postgres-read-latency-${environmentSuffix}`,
        metric: database.metric('ReadLatency', {
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 0.1, // 100ms
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    readLatencyAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));

    // Write Latency
    const writeLatencyAlarm = new cloudwatch.Alarm(
      this,
      'DatabaseWriteLatencyAlarm',
      {
        alarmName: `postgres-write-latency-${environmentSuffix}`,
        metric: database.metric('WriteLatency', {
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 0.1, // 100ms
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    writeLatencyAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));

    // Composite Alarm - Critical database issues
    this.compositeAlarm = new cloudwatch.CompositeAlarm(
      this,
      'DatabaseCompositeAlarm',
      {
        compositeAlarmName: `postgres-composite-${environmentSuffix}`,
        alarmDescription: 'Composite alarm for critical database issues',
        alarmRule: cloudwatch.AlarmRule.anyOf(
          cloudwatch.AlarmRule.fromAlarm(cpuAlarm, cloudwatch.AlarmState.ALARM),
          cloudwatch.AlarmRule.fromAlarm(
            storageAlarm,
            cloudwatch.AlarmState.ALARM
          ),
          cloudwatch.AlarmRule.allOf(
            cloudwatch.AlarmRule.fromAlarm(
              readLatencyAlarm,
              cloudwatch.AlarmState.ALARM
            ),
            cloudwatch.AlarmRule.fromAlarm(
              writeLatencyAlarm,
              cloudwatch.AlarmState.ALARM
            )
          )
        ),
      }
    );
    this.compositeAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));

    // Outputs
    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: this.alarmTopic.topicArn,
      description: `Alarm topic ARN for ${region}`,
    });

    new cdk.CfnOutput(this, 'CompositeAlarmName', {
      value: this.compositeAlarm.alarmName,
      description: `Composite alarm name for ${region}`,
    });

    // Tags
    cdk.Tags.of(this.alarmTopic).add(
      'Name',
      `postgres-alarms-${environmentSuffix}`
    );
    cdk.Tags.of(this.alarmTopic).add('Region', region);
    cdk.Tags.of(this.alarmTopic).add('Purpose', 'PostgreSQL-Monitoring');
  }
}
