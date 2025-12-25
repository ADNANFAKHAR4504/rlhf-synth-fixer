import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
// import * as logs from 'aws-cdk-lib/aws-logs';  // Commented out - log group creation handled elsewhere
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.StackProps {
  autoScalingGroup: autoscaling.IAutoScalingGroup;
  database: rds.IDatabaseInstance;
  applicationLoadBalancer: elbv2.IApplicationLoadBalancer;
  vpc: ec2.IVpc;
  environmentSuffix: string;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // SNS topic for alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      displayName: 'Infrastructure Alerts',
    });

    // Add email subscription (replace with actual email)
    alertTopic.addSubscription(
      new subscriptions.EmailSubscription('admin@example.com')
    );

    // CloudWatch dashboard
    const dashboard = new cloudwatch.Dashboard(
      this,
      'InfrastructureDashboard',
      {
        dashboardName: `tap-${props.environmentSuffix}-dashboard`,
      }
    );

    // EC2/ASG metrics
    const cpuMetric = new cloudwatch.Metric({
      namespace: 'AWS/EC2',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        AutoScalingGroupName: props.autoScalingGroup.autoScalingGroupName,
      },
      statistic: 'Average',
    });

    const memoryMetric = new cloudwatch.Metric({
      namespace: 'CWAgent',
      metricName: 'mem_used_percent',
      dimensionsMap: {
        AutoScalingGroupName: props.autoScalingGroup.autoScalingGroupName,
      },
      statistic: 'Average',
    });

    // RDS metrics
    const dbCpuMetric = new cloudwatch.Metric({
      namespace: 'AWS/RDS',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        DBInstanceIdentifier: props.database.instanceIdentifier,
      },
      statistic: 'Average',
    });

    const dbConnectionsMetric = new cloudwatch.Metric({
      namespace: 'AWS/RDS',
      metricName: 'DatabaseConnections',
      dimensionsMap: {
        DBInstanceIdentifier: props.database.instanceIdentifier,
      },
      statistic: 'Average',
    });

    // ALB metrics
    const albTargetResponseTime = new cloudwatch.Metric({
      namespace: 'AWS/ApplicationELB',
      metricName: 'TargetResponseTime',
      statistic: 'Average',
    });

    // Add widgets to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'EC2 CPU Utilization',
        left: [cpuMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'EC2 Memory Utilization',
        left: [memoryMetric],
        width: 12,
        height: 6,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'RDS CPU Utilization',
        left: [dbCpuMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'RDS Connections',
        left: [dbConnectionsMetric],
        width: 12,
        height: 6,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ALB Response Time',
        left: [albTargetResponseTime],
        width: 24,
        height: 6,
      })
    );

    // Alarms
    new cloudwatch.Alarm(this, 'HighCpuAlarm', {
      metric: cpuMetric,
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    new cloudwatch.Alarm(this, 'DatabaseCpuAlarm', {
      metric: dbCpuMetric,
      threshold: 75,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    new cloudwatch.Alarm(this, 'HighResponseTimeAlarm', {
      metric: albTargetResponseTime,
      threshold: 1, // 1 second
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // VPC Flow Logs disabled for LocalStack compatibility
    // CloudWatch Logs integration can be problematic in LocalStack
  }
}
