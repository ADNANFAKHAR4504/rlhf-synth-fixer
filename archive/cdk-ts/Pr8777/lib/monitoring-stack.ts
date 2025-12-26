import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface MonitoringConstructProps {
  environmentSuffix: string;
  commonTags: Record<string, string>;
  vpc: ec2.Vpc;
}

export class MonitoringConstruct extends Construct {
  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    // CloudWatch Log Group for application logs
    const applicationLogGroup = new logs.LogGroup(
      this,
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-app-logs`,
      {
        logGroupName: `/aws/${props.commonTags.ProjectName}/${props.environmentSuffix}/application`,
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // CloudWatch Log Group for VPC Flow Logs (organization-wide feature)
    const vpcFlowLogGroup = new logs.LogGroup(
      this,
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-vpc-flow-logs`,
      {
        logGroupName: `/aws/${props.commonTags.ProjectName}/${props.environmentSuffix}/vpc-flow-logs`,
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(
      this,
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-dashboard`,
      {
        dashboardName: `${props.commonTags.ProjectName}-${props.environmentSuffix}-monitoring`,
      }
    );

    // EC2 Instance metrics widget
    const ec2Widget = new cloudwatch.GraphWidget({
      title: 'EC2 Instance Metrics',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/EC2',
          metricName: 'CPUUtilization',
          statistic: 'Average',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/EC2',
          metricName: 'NetworkIn',
          statistic: 'Sum',
        }),
      ],
    });

    // RDS metrics widget
    const rdsWidget = new cloudwatch.GraphWidget({
      title: 'RDS Database Metrics',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'CPUUtilization',
          statistic: 'Average',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'DatabaseConnections',
          statistic: 'Average',
        }),
      ],
    });

    dashboard.addWidgets(ec2Widget, rdsWidget);

    // CloudWatch Alarms for critical metrics
    new cloudwatch.Alarm(
      this,
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-high-cpu-alarm`,
      {
        alarmName: `${props.commonTags.ProjectName}-${props.environmentSuffix}-high-cpu`,
        alarmDescription: 'High CPU utilization alarm',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/EC2',
          metricName: 'CPUUtilization',
          statistic: 'Average',
        }),
        threshold: 80,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    // Custom metric for application performance
    const customMetricFilter = new logs.MetricFilter(
      this,
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-error-metric`,
      {
        logGroup: applicationLogGroup,
        metricNamespace: `${props.commonTags.ProjectName}/${props.environmentSuffix}`,
        metricName: 'ApplicationErrors',
        filterPattern: logs.FilterPattern.literal(
          '[timestamp, request, ERROR]'
        ),
        metricValue: '1',
      }
    );

    // Alarm for application errors
    new cloudwatch.Alarm(
      this,
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-app-error-alarm`,
      {
        alarmName: `${props.commonTags.ProjectName}-${props.environmentSuffix}-app-errors`,
        alarmDescription: 'Application error rate alarm',
        metric: customMetricFilter.metric(),
        threshold: 5,
        evaluationPeriods: 1,
      }
    );

    // Note: Organization-wide VPC Flow Logs configuration is already handled via VPC flowLogs property
    // Additional organization-wide configuration would require AWS Organizations setup

    // Apply tags
    Object.entries(props.commonTags).forEach(([key, value]) => {
      cdk.Tags.of(applicationLogGroup).add(key, value);
      cdk.Tags.of(vpcFlowLogGroup).add(key, value);
      cdk.Tags.of(dashboard).add(key, value);
    });
  }
}
