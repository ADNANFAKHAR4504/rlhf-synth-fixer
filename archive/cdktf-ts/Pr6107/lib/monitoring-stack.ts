import { Construct } from 'constructs';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';

export interface MonitoringStackProps {
  environmentSuffix: string;
  primaryRegion: string;
  drRegion: string;
  primaryAlbArn: string;
  drAlbArn: string;
  primaryAsgName: string;
  drAsgName: string;
  primaryDbClusterId: string;
  drDbClusterId: string;
  primaryTargetGroupArn: string;
  drTargetGroupArn: string;
  primaryProvider?: AwsProvider;
  drProvider?: AwsProvider;
}

export interface MonitoringStackOutputs {
  primarySnsTopicArn: string;
  drSnsTopicArn: string;
}

export class MonitoringStack extends Construct {
  public readonly outputs: MonitoringStackOutputs;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id);

    const {
      environmentSuffix,
      primaryRegion,
      drRegion,
      primaryAlbArn,
      drAlbArn,
      primaryAsgName,
      drAsgName,
      primaryDbClusterId,
      drDbClusterId,
      primaryTargetGroupArn,
      drTargetGroupArn,
      primaryProvider,
      drProvider,
    } = props;

    const commonTags = {
      Environment: environmentSuffix,
      CostCenter: 'payment-processing',
      ManagedBy: 'cdktf',
    };

    // SNS Topics for alarms
    const primarySnsTopic = new SnsTopic(this, 'primary-sns-topic', {
      name: `payment-alarms-${environmentSuffix}-${primaryRegion}`,
      displayName: `Payment Processing Alarms - ${primaryRegion}`,
      tags: {
        ...commonTags,
        'DR-Role': 'primary',
      },
      provider: primaryProvider,
    });

    const drSnsTopic = new SnsTopic(this, 'dr-sns-topic', {
      name: `payment-alarms-${environmentSuffix}-${drRegion}`,
      displayName: `Payment Processing Alarms - ${drRegion}`,
      tags: {
        ...commonTags,
        'DR-Role': 'dr',
      },
      provider: drProvider,
    });

    // Email subscriptions (placeholder - requires confirmation)
    new SnsTopicSubscription(this, 'primary-email-subscription', {
      topicArn: primarySnsTopic.arn,
      protocol: 'email',
      endpoint: `ops-${environmentSuffix}@example.com`,
      provider: primaryProvider,
    });

    new SnsTopicSubscription(this, 'dr-email-subscription', {
      topicArn: drSnsTopic.arn,
      protocol: 'email',
      endpoint: `ops-${environmentSuffix}@example.com`,
      provider: drProvider,
    });

    // Primary Region Alarms

    // ALB Unhealthy Target Count - Primary
    new CloudwatchMetricAlarm(this, 'primary-alb-unhealthy-targets', {
      alarmName: `payment-alb-unhealthy-${environmentSuffix}-${primaryRegion}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'UnHealthyHostCount',
      namespace: 'AWS/ApplicationELB',
      period: 60,
      statistic: 'Average',
      threshold: 1,
      alarmDescription: 'Alert when ALB has unhealthy targets',
      alarmActions: [primarySnsTopic.arn],
      dimensions: {
        LoadBalancer: primaryAlbArn.split(':loadbalancer/')[1],
        TargetGroup: primaryTargetGroupArn.split(':')[5],
      },
      tags: {
        ...commonTags,
        'DR-Role': 'primary',
      },
      provider: primaryProvider,
    });

    // ASG Instance Health - Primary
    new CloudwatchMetricAlarm(this, 'primary-asg-instance-health', {
      alarmName: `payment-asg-health-${environmentSuffix}-${primaryRegion}`,
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 2,
      metricName: 'GroupInServiceInstances',
      namespace: 'AWS/AutoScaling',
      period: 60,
      statistic: 'Average',
      threshold: 2,
      alarmDescription: 'Alert when ASG has less than 2 healthy instances',
      alarmActions: [primarySnsTopic.arn],
      dimensions: {
        AutoScalingGroupName: primaryAsgName,
      },
      tags: {
        ...commonTags,
        'DR-Role': 'primary',
      },
      provider: primaryProvider,
    });

    // Database CPU - Primary
    new CloudwatchMetricAlarm(this, 'primary-db-cpu', {
      alarmName: `payment-db-cpu-${environmentSuffix}-${primaryRegion}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      alarmDescription: 'Alert when database CPU exceeds 80%',
      alarmActions: [primarySnsTopic.arn],
      dimensions: {
        DBClusterIdentifier: primaryDbClusterId,
      },
      tags: {
        ...commonTags,
        'DR-Role': 'primary',
      },
      provider: primaryProvider,
    });

    // Database Replication Lag - DR
    new CloudwatchMetricAlarm(this, 'db-replication-lag', {
      alarmName: `payment-db-replication-lag-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'AuroraGlobalDBReplicationLag',
      namespace: 'AWS/RDS',
      period: 60,
      statistic: 'Average',
      threshold: 1000,
      alarmDescription:
        'Alert when global database replication lag exceeds 1000ms',
      alarmActions: [drSnsTopic.arn],
      dimensions: {
        DBClusterIdentifier: drDbClusterId,
      },
      tags: {
        ...commonTags,
        'DR-Role': 'dr',
      },
      provider: drProvider,
    });

    // DR Region Alarms

    // ALB Unhealthy Target Count - DR
    new CloudwatchMetricAlarm(this, 'dr-alb-unhealthy-targets', {
      alarmName: `payment-alb-unhealthy-${environmentSuffix}-${drRegion}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'UnHealthyHostCount',
      namespace: 'AWS/ApplicationELB',
      period: 60,
      statistic: 'Average',
      threshold: 1,
      alarmDescription: 'Alert when ALB has unhealthy targets',
      alarmActions: [drSnsTopic.arn],
      dimensions: {
        LoadBalancer: drAlbArn.split(':loadbalancer/')[1],
        TargetGroup: drTargetGroupArn.split(':')[5],
      },
      tags: {
        ...commonTags,
        'DR-Role': 'dr',
      },
      provider: drProvider,
    });

    // ASG Instance Health - DR
    new CloudwatchMetricAlarm(this, 'dr-asg-instance-health', {
      alarmName: `payment-asg-health-${environmentSuffix}-${drRegion}`,
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 2,
      metricName: 'GroupInServiceInstances',
      namespace: 'AWS/AutoScaling',
      period: 60,
      statistic: 'Average',
      threshold: 2,
      alarmDescription: 'Alert when ASG has less than 2 healthy instances',
      alarmActions: [drSnsTopic.arn],
      dimensions: {
        AutoScalingGroupName: drAsgName,
      },
      tags: {
        ...commonTags,
        'DR-Role': 'dr',
      },
      provider: drProvider,
    });

    // Database CPU - DR
    new CloudwatchMetricAlarm(this, 'dr-db-cpu', {
      alarmName: `payment-db-cpu-${environmentSuffix}-${drRegion}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      alarmDescription: 'Alert when database CPU exceeds 80%',
      alarmActions: [drSnsTopic.arn],
      dimensions: {
        DBClusterIdentifier: drDbClusterId,
      },
      tags: {
        ...commonTags,
        'DR-Role': 'dr',
      },
      provider: drProvider,
    });

    this.outputs = {
      primarySnsTopicArn: primarySnsTopic.arn,
      drSnsTopicArn: drSnsTopic.arn,
    };
  }
}
