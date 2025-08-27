import * as cdk from 'aws-cdk-lib';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.StackProps {
  ec2Instances: ec2.Instance[];
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // S3 bucket for CloudTrail logs
    const cloudTrailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
      bucketName: `cloudtrail-logs-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: false,
      lifecycleRules: [
        {
          id: 'DeleteOldCloudTrailLogs',
          enabled: true,
          expiration: cdk.Duration.days(365),
        },
      ],
      enforceSSL: true,
    });

    // CloudTrail for auditing
    const trail = new cloudtrail.Trail(this, 'SecurityAuditTrail', {
      bucket: cloudTrailBucket,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
      sendToCloudWatchLogs: true,
      cloudWatchLogsRetention: 90,
      trailName: 'security-audit-trail',
    });

    // Add data events for S3 buckets
    trail.addS3EventSelector(
      [
        {
          bucket: cloudTrailBucket,
          objectPrefix: '',
        },
      ],
      {
        readWriteType: cloudtrail.ReadWriteType.ALL,
        includeManagementEvents: true,
      }
    );

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: 'infrastructure-alerts',
      displayName: 'Infrastructure Alerts',
    });

    // Add email subscription (replace with actual email)
    alertTopic.addSubscription(
      new subscriptions.EmailSubscription('admin@example.com')
    );

    // CloudWatch Alarms for each EC2 instance
    props.ec2Instances.forEach((instance, index) => {
      // CPU Utilization Alarm
      const cpuAlarm = new cloudwatch.Alarm(this, `CPUAlarm${index + 1}`, {
        alarmName: `EC2-CPU-Utilization-${instance.instanceId}`,
        alarmDescription: `CPU utilization alarm for EC2 instance ${instance.instanceId}`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/EC2',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            InstanceId: instance.instanceId,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 80,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      });

      cpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

      // Status Check Failed Alarm
      const statusCheckAlarm = new cloudwatch.Alarm(
        this,
        `StatusCheckAlarm${index + 1}`,
        {
          alarmName: `EC2-StatusCheck-${instance.instanceId}`,
          alarmDescription: `Status check alarm for EC2 instance ${instance.instanceId}`,
          metric: new cloudwatch.Metric({
            namespace: 'AWS/EC2',
            metricName: 'StatusCheckFailed',
            dimensionsMap: {
              InstanceId: instance.instanceId,
            },
            statistic: 'Maximum',
            period: cdk.Duration.minutes(5),
          }),
          threshold: 1,
          evaluationPeriods: 2,
          comparisonOperator:
            cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
          treatMissingData: cloudwatch.TreatMissingData.BREACHING,
        }
      );

      statusCheckAlarm.addAlarmAction(
        new cloudwatchActions.SnsAction(alertTopic)
      );

      // Memory Utilization Alarm (using CloudWatch Agent metrics)
      const memoryAlarm = new cloudwatch.Alarm(
        this,
        `MemoryAlarm${index + 1}`,
        {
          alarmName: `EC2-Memory-Utilization-${instance.instanceId}`,
          alarmDescription: `Memory utilization alarm for EC2 instance ${instance.instanceId}`,
          metric: new cloudwatch.Metric({
            namespace: 'CWAgent',
            metricName: 'mem_used_percent',
            dimensionsMap: {
              InstanceId: instance.instanceId,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
          threshold: 85,
          evaluationPeriods: 2,
          comparisonOperator:
            cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        }
      );

      memoryAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
    });

    // CloudWatch Dashboard
    new cloudwatch.Dashboard(this, 'InfrastructureDashboard', {
      dashboardName: 'Infrastructure-Monitoring',
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'EC2 CPU Utilization',
            left: props.ec2Instances.map(
              instance =>
                new cloudwatch.Metric({
                  namespace: 'AWS/EC2',
                  metricName: 'CPUUtilization',
                  dimensionsMap: {
                    InstanceId: instance.instanceId,
                  },
                  statistic: 'Average',
                  period: cdk.Duration.minutes(5),
                })
            ),
            width: 12,
            height: 6,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'EC2 Memory Utilization',
            left: props.ec2Instances.map(
              instance =>
                new cloudwatch.Metric({
                  namespace: 'CWAgent',
                  metricName: 'mem_used_percent',
                  dimensionsMap: {
                    InstanceId: instance.instanceId,
                  },
                  statistic: 'Average',
                  period: cdk.Duration.minutes(5),
                })
            ),
            width: 12,
            height: 6,
          }),
        ],
      ],
    });

    // Output CloudTrail ARN
    new cdk.CfnOutput(this, 'CloudTrailArn', {
      value: trail.trailArn,
      description: 'CloudTrail ARN',
    });

    new cdk.CfnOutput(this, 'SNSTopicArn', {
      value: alertTopic.topicArn,
      description: 'SNS Topic ARN for alerts',
    });
  }
}
