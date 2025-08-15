import { Construct } from 'constructs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as cdk from 'aws-cdk-lib';
import { StackConfig } from '../interfaces/stack-config';

/**
 * Monitoring Construct that sets up comprehensive CloudWatch monitoring,
 * alarms, and logging for the multi-region application
 */
export class MonitoringConstruct extends Construct {
  public readonly dashboard: cloudwatch.Dashboard;
  public readonly alertTopic: sns.Topic;

  constructor(
    scope: Construct,
    id: string,
    config: StackConfig,
    resources: {
      loadBalancer: elbv2.ApplicationLoadBalancer;
      autoScalingGroup: autoscaling.AutoScalingGroup;
      database: rds.DatabaseInstance;
    }
  ) {
    super(scope, id);

    // Create SNS topic for alerts
    this.alertTopic = new sns.Topic(this, 'AlertTopic', {
      displayName: `MultiRegionApp Alerts - ${config.region}`,
      topicName: `MultiRegionApp-Alerts-${config.region}`,
    });

    // Create log groups for application logs
    const applicationLogGroup = new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: `/aws/ec2/multiregionapp/${config.region}/application-${Date.now()}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow deletion during stack deletion
    });

    const httpdAccessLogGroup = new logs.LogGroup(this, 'HttpdAccessLogGroup', {
      logGroupName: `/aws/ec2/multiregionapp/${config.region}/httpd/access-${Date.now()}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow deletion during stack deletion
    });

    const httpdErrorLogGroup = new logs.LogGroup(this, 'HttpdErrorLogGroup', {
      logGroupName: `/aws/ec2/multiregionapp/${config.region}/httpd/error-${Date.now()}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow deletion during stack deletion
    });

    // Create CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'MonitoringDashboard', {
      dashboardName: `MultiRegionApp-${config.region}`,
      defaultInterval: cdk.Duration.hours(1),
    });

    // Add ALB metrics to dashboard
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ALB Request Count',
        left: [resources.loadBalancer.metricRequestCount()],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'ALB Response Time',
        left: [resources.loadBalancer.metricTargetResponseTime()],
        width: 12,
        height: 6,
      })
    );

    // Add Auto Scaling Group metrics to dashboard
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ASG Instance Count',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/AutoScaling',
            metricName: 'GroupDesiredCapacity',
            dimensionsMap: {
              AutoScalingGroupName:
                resources.autoScalingGroup.autoScalingGroupName,
            },
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/AutoScaling',
            metricName: 'GroupInServiceInstances',
            dimensionsMap: {
              AutoScalingGroupName:
                resources.autoScalingGroup.autoScalingGroupName,
            },
          }),
        ],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'EC2 CPU Utilization',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/EC2',
            metricName: 'CPUUtilization',
            dimensionsMap: {
              AutoScalingGroupName:
                resources.autoScalingGroup.autoScalingGroupName,
            },
            statistic: 'Average',
          }),
        ],
        width: 12,
        height: 6,
      })
    );

    // Add RDS metrics to dashboard
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'RDS CPU Utilization',
        left: [resources.database.metricCPUUtilization()],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'RDS Free Storage Space',
        left: [resources.database.metricFreeStorageSpace()],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'RDS Database Connections',
        left: [resources.database.metricDatabaseConnections()],
        width: 12,
        height: 6,
      })
    );

    // Apply comprehensive tagging
    Object.entries(config.tags).forEach(([key, value]) => {
      cdk.Tags.of(this.alertTopic).add(key, value);
      cdk.Tags.of(this.dashboard).add(key, value);
      cdk.Tags.of(applicationLogGroup).add(key, value);
      cdk.Tags.of(httpdAccessLogGroup).add(key, value);
      cdk.Tags.of(httpdErrorLogGroup).add(key, value);
    });

    // Add specific name tags
    cdk.Tags.of(this.alertTopic).add(
      'Name',
      `MultiRegionApp-Alerts-${config.region}`
    );
    cdk.Tags.of(this.dashboard).add(
      'Name',
      `MultiRegionApp-Dashboard-${config.region}`
    );
    cdk.Tags.of(applicationLogGroup).add(
      'Name',
      `MultiRegionApp-App-Logs-${config.region}`
    );
    cdk.Tags.of(httpdAccessLogGroup).add(
      'Name',
      `MultiRegionApp-Httpd-Access-${config.region}`
    );
    cdk.Tags.of(httpdErrorLogGroup).add(
      'Name',
      `MultiRegionApp-Httpd-Error-${config.region}`
    );
  }
}
