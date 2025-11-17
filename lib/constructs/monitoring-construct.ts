import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

export interface MonitoringConstructProps {
  environmentSuffix: string;
  region: string;
  latencyThreshold: number;
  lambdaFunction: lambda.Function;
  database: rds.DatabaseInstance;
  alb: elbv2.ApplicationLoadBalancer;
}

export class MonitoringConstruct extends Construct {
  public readonly alarmTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    this.alarmTopic = new sns.Topic(
      this,
      `AlarmTopic-${props.environmentSuffix}`,
      {
        topicName: `fintech-alarms-${props.environmentSuffix}`,
        displayName: `Fintech Alarms for ${props.region}`,
      }
    );

    const albLatencyAlarm = new cloudwatch.Alarm(
      this,
      `AlbLatencyAlarm-${props.environmentSuffix}`,
      {
        alarmName: `alb-latency-${props.environmentSuffix}`,
        metric: props.alb.metricTargetResponseTime(),
        threshold: props.latencyThreshold,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    albLatencyAlarm.addAlarmAction(new actions.SnsAction(this.alarmTopic));

    const lambdaErrorAlarm = new cloudwatch.Alarm(
      this,
      `LambdaErrorAlarm-${props.environmentSuffix}`,
      {
        alarmName: `lambda-errors-${props.environmentSuffix}`,
        metric: props.lambdaFunction.metricErrors(),
        threshold: 5,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );

    lambdaErrorAlarm.addAlarmAction(new actions.SnsAction(this.alarmTopic));

    const dbCpuAlarm = new cloudwatch.Alarm(
      this,
      `DbCpuAlarm-${props.environmentSuffix}`,
      {
        alarmName: `rds-cpu-${props.environmentSuffix}`,
        metric: props.database.metricCPUUtilization(),
        threshold: 80,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );

    dbCpuAlarm.addAlarmAction(new actions.SnsAction(this.alarmTopic));

    cdk.Tags.of(this.alarmTopic).add('Region', props.region);
  }
}
