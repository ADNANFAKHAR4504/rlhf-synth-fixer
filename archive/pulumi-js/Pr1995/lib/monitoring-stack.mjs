/**
 * Monitoring Stack - Creates CloudWatch alarms and monitoring
 * for EC2 CPU utilization and RDS performance metrics.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export class MonitoringStack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:stack:MonitoringStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create SNS topic for alarm notifications
    const alarmTopic = new aws.sns.Topic(
      `SecureApp-alarm-topic-${environmentSuffix}`,
      {
        displayName: 'SecureApp Monitoring Alarms',
        tags: {
          ...tags,
          Name: `SecureApp-alarm-topic-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create CloudWatch alarms for EC2 CPU utilization
    args.ec2InstanceIds.forEach((instanceId, index) => {
      new aws.cloudwatch.MetricAlarm(
        `SecureApp-ec2-cpu-alarm-${index + 1}-${environmentSuffix}`,
        {
          name: `SecureApp-EC2-CPU-High-${index + 1}-${environmentSuffix}`,
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 2,
          metricName: 'CPUUtilization',
          namespace: 'AWS/EC2',
          period: 300,
          statistic: 'Average',
          threshold: 75,
          alarmDescription: 'This metric monitors ec2 cpu utilization',
          alarmActions: [alarmTopic.arn],
          dimensions: {
            InstanceId: instanceId,
          },
          tags: {
            ...tags,
            Name: `SecureApp-ec2-cpu-alarm-${index + 1}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );
    });

    // Create CloudWatch alarm for RDS CPU utilization
    new aws.cloudwatch.MetricAlarm(
      `SecureApp-rds-cpu-alarm-${environmentSuffix}`,
      {
        name: `SecureApp-RDS-CPU-High-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'This metric monitors RDS CPU utilization',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          DBInstanceIdentifier: args.rdsInstanceId,
        },
        tags: {
          ...tags,
          Name: `SecureApp-rds-cpu-alarm-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create CloudWatch alarm for RDS database connections
    new aws.cloudwatch.MetricAlarm(
      `SecureApp-rds-connections-alarm-${environmentSuffix}`,
      {
        name: `SecureApp-RDS-Connections-High-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'DatabaseConnections',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 50,
        alarmDescription: 'This metric monitors RDS database connections',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          DBInstanceIdentifier: args.rdsInstanceId,
        },
        tags: {
          ...tags,
          Name: `SecureApp-rds-connections-alarm-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create custom CloudWatch dashboard
    const dashboard = new aws.cloudwatch.Dashboard(
      `SecureApp-dashboard-${environmentSuffix}`,
      {
        dashboardName: `SecureApp-Dashboard-${environmentSuffix}`,
        dashboardBody: pulumi.interpolate`{
        "widgets": [
          {
            "type": "metric",
            "x": 0,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
              "metrics": ${pulumi
                .output(args.ec2InstanceIds)
                .apply(ids =>
                  JSON.stringify(
                    ids.map(id => [
                      'AWS/EC2',
                      'CPUUtilization',
                      'InstanceId',
                      id,
                    ])
                  )
                )},
              "view": "timeSeries",
              "stacked": false,
              "region": "us-east-1",
              "title": "EC2 Instance CPU Utilization",
              "period": 300
            }
          },
          {
            "type": "metric",
            "x": 12,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
              "metrics": [
                [ "AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "${args.rdsInstanceId}" ],
                [ ".", "DatabaseConnections", ".", "." ]
              ],
              "view": "timeSeries",
              "stacked": false,
              "region": "us-east-1",
              "title": "RDS Performance Metrics",
              "period": 300
            }
          },
          {
            "type": "metric",
            "x": 0,
            "y": 6,
            "width": 24,
            "height": 6,
            "properties": {
              "metrics": [
                [ "AWS/S3", "NumberOfObjects", "BucketName", "${args.s3BucketName}", "StorageType", "AllStorageTypes" ]
              ],
              "view": "timeSeries",
              "stacked": false,
              "region": "us-east-1",
              "title": "S3 Bucket Metrics",
              "period": 3600
            }
          }
        ]
      }`,
      },
      { parent: this }
    );

    // Export values
    this.alarmTopicArn = alarmTopic.arn;
    this.dashboardUrl = dashboard.dashboardUrl;

    this.registerOutputs({
      alarmTopicArn: this.alarmTopicArn,
      dashboardUrl: this.dashboardUrl,
    });
  }
}
