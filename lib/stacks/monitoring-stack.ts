import * as cdk from 'aws-cdk-lib';
import { Duration } from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

export interface MonitoringStackProps extends cdk.StackProps {
  alb: elbv2.ApplicationLoadBalancer;
  asg: autoscaling.AutoScalingGroup;
  dbInstance: rds.DatabaseInstance;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // ALB 5XX surge alarm
    const alb5xxMetric = props.alb.metrics.httpCodeTarget(
      elbv2.HttpCodeTarget.TARGET_5XX_COUNT,
      { period: Duration.minutes(1) }
    );

    new cw.Alarm(this, 'Alb5xxAlarm', {
      metric: alb5xxMetric,
      threshold: 5,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    });

    // ASG CPU high
    const asgCpu = new cw.Metric({
      namespace: 'AWS/AutoScaling',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        AutoScalingGroupName: props.asg.autoScalingGroupName,
      },
      statistic: 'Average',
      period: Duration.minutes(1),
    });

    new cw.Alarm(this, 'AsgHighCpu', {
      metric: asgCpu,
      threshold: 80,
      evaluationPeriods: 3,
    });

    // RDS free storage low
    const freeStorage = props.dbInstance.metricFreeStorageSpace({
      period: Duration.minutes(5),
    });

    new cw.Alarm(this, 'DbFreeStorageLow', {
      metric: freeStorage,
      threshold: 10 * 1024 * 1024 * 1024, // 10 GiB
      evaluationPeriods: 1,
      comparisonOperator: cw.ComparisonOperator.LESS_THAN_THRESHOLD,
    });
  }
}
