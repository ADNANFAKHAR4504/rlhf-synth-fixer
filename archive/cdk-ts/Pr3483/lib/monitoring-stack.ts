import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

interface MonitoringStackProps {
  alb: elbv2.ApplicationLoadBalancer;
  autoScalingGroup: autoscaling.AutoScalingGroup;
  environmentSuffix: string;
}

export class MonitoringStack extends Construct {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id);

    // SNS Topic for Alerts
    const alertTopic = new sns.Topic(this, 'WikiAlertTopic', {
      displayName: `Wiki Platform Alerts - ${props.environmentSuffix}`,
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'WikiDashboard', {
      dashboardName: `wiki-platform-${props.environmentSuffix}`,
    });

    // Edit Activity Metric
    const editActivityMetric = new cloudwatch.Metric({
      namespace: 'WikiPlatform',
      metricName: 'EditActivity',
      dimensionsMap: {
        Environment: props.environmentSuffix,
      },
      statistic: cloudwatch.Stats.SUM,
      period: cdk.Duration.minutes(5),
    });

    // ALB Metrics
    const targetResponseTimeMetric = new cloudwatch.Metric({
      namespace: 'AWS/ELB',
      metricName: 'TargetResponseTime',
      dimensionsMap: {
        LoadBalancer: props.alb.loadBalancerFullName,
      },
      statistic: cloudwatch.Stats.AVERAGE,
      period: cdk.Duration.minutes(5),
    });

    const requestCountMetric = new cloudwatch.Metric({
      namespace: 'AWS/ELB',
      metricName: 'RequestCount',
      dimensionsMap: {
        LoadBalancer: props.alb.loadBalancerFullName,
      },
      statistic: cloudwatch.Stats.SUM,
      period: cdk.Duration.minutes(5),
    });

    const healthyHostCountMetric = new cloudwatch.Metric({
      namespace: 'AWS/ELB',
      metricName: 'HealthyHostCount',
      dimensionsMap: {
        LoadBalancer: props.alb.loadBalancerFullName,
      },
      statistic: cloudwatch.Stats.MINIMUM,
      period: cdk.Duration.minutes(5),
    });

    // Auto Scaling Metrics
    const cpuUtilizationMetric = new cloudwatch.Metric({
      namespace: 'AWS/EC2',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        AutoScalingGroupName: props.autoScalingGroup.autoScalingGroupName,
      },
      statistic: cloudwatch.Stats.AVERAGE,
      period: cdk.Duration.minutes(5),
    });

    const groupInServiceInstancesMetric = new cloudwatch.Metric({
      namespace: 'AWS/AutoScaling',
      metricName: 'GroupInServiceInstances',
      dimensionsMap: {
        AutoScalingGroupName: props.autoScalingGroup.autoScalingGroupName,
      },
      statistic: cloudwatch.Stats.AVERAGE,
      period: cdk.Duration.minutes(5),
    });

    // Dashboard Widgets
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Edit Activity',
        left: [editActivityMetric],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Request Count',
        left: [requestCountMetric],
        width: 12,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Target Response Time',
        left: [targetResponseTimeMetric],
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'Healthy Hosts',
        left: [healthyHostCountMetric],
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'CPU Utilization',
        left: [cpuUtilizationMetric],
        width: 8,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.SingleValueWidget({
        title: 'In Service Instances',
        metrics: [groupInServiceInstancesMetric],
        width: 6,
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Average Response Time',
        metrics: [targetResponseTimeMetric],
        width: 6,
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Total Requests',
        metrics: [requestCountMetric],
        width: 6,
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Daily Edit Activity',
        metrics: [editActivityMetric],
        width: 6,
      })
    );

    // CloudWatch Alarms
    new cloudwatch.Alarm(this, 'HighResponseTimeAlarm', {
      metric: targetResponseTimeMetric,
      threshold: 1000,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when response time is above 1 second',
    }).addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));

    new cloudwatch.Alarm(this, 'LowHealthyHostsAlarm', {
      metric: healthyHostCountMetric,
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'Alert when healthy hosts drop below 1',
    }).addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));

    new cloudwatch.Alarm(this, 'HighCpuAlarm', {
      metric: cpuUtilizationMetric,
      threshold: 85,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when CPU utilization is above 85%',
    }).addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));

    // Custom Metric for Edit Activity
    new cloudwatch.Alarm(this, 'HighEditActivityAlarm', {
      metric: editActivityMetric,
      threshold: 10000,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription:
        'Alert when edit activity exceeds 10,000 edits in 5 minutes',
    }).addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));

    // Tags
    cdk.Tags.of(dashboard).add(
      'Name',
      `WikiDashboard-${props.environmentSuffix}`
    );
    cdk.Tags.of(dashboard).add('Environment', props.environmentSuffix);
    cdk.Tags.of(alertTopic).add(
      'Name',
      `WikiAlerts-${props.environmentSuffix}`
    );
    cdk.Tags.of(alertTopic).add('Environment', props.environmentSuffix);
  }
}
