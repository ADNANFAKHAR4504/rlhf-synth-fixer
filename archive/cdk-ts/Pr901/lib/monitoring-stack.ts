import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  ec2Instance: ec2.Instance;
  s3Bucket: s3.Bucket;
  dynamoTable: dynamodb.Table;
}

export class MonitoringStack extends cdk.NestedStack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // CloudWatch Dashboard for observability
    const dashboard = new cloudwatch.Dashboard(this, 'SecurityDashboard', {
      dashboardName: `security-dashboard-${environmentSuffix}`,
    });

    // EC2 CPU utilization metric
    const ec2CpuMetric = new cloudwatch.Metric({
      namespace: 'AWS/EC2',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        InstanceId: props.ec2Instance.instanceId,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    // S3 bucket size metric
    const s3SizeMetric = new cloudwatch.Metric({
      namespace: 'AWS/S3',
      metricName: 'BucketSizeBytes',
      dimensionsMap: {
        BucketName: props.s3Bucket.bucketName,
        StorageType: 'StandardStorage',
      },
      statistic: 'Average',
      period: cdk.Duration.hours(24),
    });

    // DynamoDB read capacity metric
    const dynamoReadMetric = new cloudwatch.Metric({
      namespace: 'AWS/DynamoDB',
      metricName: 'ConsumedReadCapacityUnits',
      dimensionsMap: {
        TableName: props.dynamoTable.tableName,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    // Add widgets to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'EC2 CPU Utilization',
        left: [ec2CpuMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'S3 Bucket Size',
        left: [s3SizeMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Read Capacity',
        left: [dynamoReadMetric],
        width: 12,
        height: 6,
      })
    );

    // CloudWatch alarms for critical metrics
    new cloudwatch.Alarm(this, 'HighCPUAlarm', {
      metric: ec2CpuMetric,
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alarm when EC2 CPU exceeds 80%',
    });

    // CloudWatch Insights for enhanced observability
    new logs.LogGroup(this, 'InsightsLogGroup', {
      logGroupName: `/aws/insights/observability-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Apply tags
    cdk.Tags.of(this).add('Project', 'IaCChallenge');
  }
}
