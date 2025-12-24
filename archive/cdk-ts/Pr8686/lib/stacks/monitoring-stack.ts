import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface MonitoringStackProps extends cdk.StackProps {
  environmentSuffix: string;
  vpc: ec2.IVpc;
  webAppAutoScalingGroup: autoscaling.AutoScalingGroup;
}

export class MonitoringStack extends cdk.Stack {
  public readonly cloudTrail: cloudtrail.Trail;
  public readonly alertingTopic: sns.Topic;
  public readonly cloudWatchDashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const { environmentSuffix, vpc, webAppAutoScalingGroup } = props;

    // Create S3 bucket for CloudTrail logs
    const cloudTrailBucket = new s3.Bucket(
      this,
      `tf-cloudtrail-bucket-${environmentSuffix}`,
      {
        versioned: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        lifecycleRules: [
          {
            id: 'DeleteOldLogs',
            transitions: [
              {
                storageClass: s3.StorageClass.INFREQUENT_ACCESS,
                transitionAfter: cdk.Duration.days(30),
              },
              {
                storageClass: s3.StorageClass.GLACIER,
                transitionAfter: cdk.Duration.days(90),
              },
            ],
            expiration: cdk.Duration.days(365),
          },
        ],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Create CloudWatch Log Group for CloudTrail
    const cloudTrailLogGroup = new logs.LogGroup(
      this,
      `tf-cloudtrail-logs-${environmentSuffix}`,
      {
        logGroupName: `/aws/cloudtrail/${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // CloudTrail will automatically create the necessary IAM role for CloudWatch Logs

    // Create CloudTrail
    this.cloudTrail = new cloudtrail.Trail(
      this,
      `tf-cloudtrail-${environmentSuffix}`,
      {
        bucket: cloudTrailBucket,
        includeGlobalServiceEvents: true,
        isMultiRegionTrail: true,
        enableFileValidation: true,
        cloudWatchLogGroup: cloudTrailLogGroup,
      }
    );

    // Create SNS topic for alerts
    this.alertingTopic = new sns.Topic(
      this,
      `tf-alerts-topic-${environmentSuffix}`,
      {
        displayName: `TapStack Alerts - ${environmentSuffix}`,
      }
    );

    // Create CloudWatch Alarms for Web-App Tier
    const webAppCpuMetric = new cloudwatch.Metric({
      namespace: 'AWS/AutoScaling',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        AutoScalingGroupName: webAppAutoScalingGroup.autoScalingGroupName,
      },
      statistic: 'Average',
    });

    const webAppCpuAlarm = new cloudwatch.Alarm(
      this,
      `tf-web-app-cpu-alarm-${environmentSuffix}`,
      {
        alarmName: `tf-web-app-high-cpu-${environmentSuffix}`,
        alarmDescription: 'Web-App tier high CPU utilization',
        metric: webAppCpuMetric,
        threshold: 75,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );

    webAppCpuAlarm.addAlarmAction({
      bind: () => ({ alarmActionArn: this.alertingTopic.topicArn }),
    });

    // Create CloudWatch Dashboard
    const webAppInstanceCountMetric = new cloudwatch.Metric({
      namespace: 'AWS/AutoScaling',
      metricName: 'GroupDesiredCapacity',
      dimensionsMap: {
        AutoScalingGroupName: webAppAutoScalingGroup.autoScalingGroupName,
      },
      statistic: 'Average',
    });

    this.cloudWatchDashboard = new cloudwatch.Dashboard(
      this,
      `tf-dashboard-${environmentSuffix}`,
      {
        dashboardName: `TapStack-${environmentSuffix}`,
        widgets: [
          [
            new cloudwatch.GraphWidget({
              title: 'Web-App Tier CPU Utilization',
              left: [webAppCpuMetric],
              width: 12,
              height: 6,
            }),
            new cloudwatch.SingleValueWidget({
              title: 'Web-App Tier Instance Count',
              metrics: [webAppInstanceCountMetric],
              width: 12,
              height: 6,
            }),
          ],
          [
            new cloudwatch.GraphWidget({
              title: 'VPC Flow Logs',
              left: [
                new cloudwatch.Metric({
                  namespace: 'AWS/VPC',
                  metricName: 'PacketsDroppedBySecurityGroup',
                  dimensionsMap: {
                    VpcId: vpc.vpcId,
                  },
                  statistic: 'Sum',
                }),
              ],
              width: 12,
              height: 6,
            }),
          ],
        ],
      }
    );

    // Create custom metrics for security monitoring
    const securityMetricFilter = new logs.MetricFilter(
      this,
      `tf-security-metric-${environmentSuffix}`,
      {
        logGroup: cloudTrailLogGroup,
        metricNamespace: `TapStack/Security/${environmentSuffix}`,
        metricName: 'RootAccountUsage',
        filterPattern: logs.FilterPattern.literal(
          '[version, account, time, region, source, name="AssumeRole", ...]'
        ),
        metricValue: '1',
      }
    );

    const securityAlarm = new cloudwatch.Alarm(
      this,
      `tf-security-alarm-${environmentSuffix}`,
      {
        alarmName: `tf-root-account-usage-${environmentSuffix}`,
        alarmDescription: 'Root account usage detected',
        metric: securityMetricFilter.metric(),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    securityAlarm.addAlarmAction({
      bind: () => ({ alarmActionArn: this.alertingTopic.topicArn }),
    });

    // Add comprehensive tags
    const tags = {
      Environment: environmentSuffix,
      Project: 'TapStack',
      Component: 'Monitoring',
      CostCenter: 'Infrastructure',
      Compliance: 'SOC2',
    };

    Object.entries(tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Outputs
    new cdk.CfnOutput(this, `CloudTrailArn-${environmentSuffix}`, {
      value: this.cloudTrail.trailArn,
      description: 'CloudTrail ARN',
      exportName: `tf-cloudtrail-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `AlertingTopicArn-${environmentSuffix}`, {
      value: this.alertingTopic.topicArn,
      description: 'SNS topic ARN for alerts',
      exportName: `tf-alerts-topic-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `CloudWatchDashboardUrl-${environmentSuffix}`, {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${this.cloudWatchDashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
      exportName: `tf-dashboard-url-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `CloudWatchDashboardName-${environmentSuffix}`, {
      value: this.cloudWatchDashboard.dashboardName,
      description: 'CloudWatch Dashboard name',
      exportName: `tf-dashboard-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `CloudTrailLogGroupName-${environmentSuffix}`, {
      value: cloudTrailLogGroup.logGroupName,
      description: 'CloudTrail Log Group name',
      exportName: `tf-cloudtrail-logs-name-${environmentSuffix}`,
    });
  }
}
