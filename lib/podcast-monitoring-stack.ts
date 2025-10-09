import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

interface PodcastMonitoringStackProps {
  environmentSuffix: string;
  distribution: cloudfront.IDistribution;
  subscriberTable: dynamodb.ITable;
  audioBucket: s3.IBucket;
}

export class PodcastMonitoringStack extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: PodcastMonitoringStackProps
  ) {
    super(scope, id);

    // SNS topic for alarms
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      displayName: `Podcast Platform Alarms ${props.environmentSuffix}`,
      topicName: `podcast-alarms-${props.environmentSuffix}`,
    });

    // CloudWatch dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'PodcastDashboard', {
      dashboardName: `podcast-streaming-metrics-${props.environmentSuffix}`,
    });

    // CloudFront metrics
    const requestsMetric = new cloudwatch.Metric({
      namespace: 'AWS/CloudFront',
      metricName: 'Requests',
      dimensionsMap: {
        DistributionId: props.distribution.distributionId,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const bytesDownloadedMetric = new cloudwatch.Metric({
      namespace: 'AWS/CloudFront',
      metricName: 'BytesDownloaded',
      dimensionsMap: {
        DistributionId: props.distribution.distributionId,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const errorRateMetric = new cloudwatch.Metric({
      namespace: 'AWS/CloudFront',
      metricName: '5xxErrorRate',
      dimensionsMap: {
        DistributionId: props.distribution.distributionId,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    const fourxxErrorRateMetric = new cloudwatch.Metric({
      namespace: 'AWS/CloudFront',
      metricName: '4xxErrorRate',
      dimensionsMap: {
        DistributionId: props.distribution.distributionId,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    // DynamoDB metrics
    const dynamoReadMetric = new cloudwatch.Metric({
      namespace: 'AWS/DynamoDB',
      metricName: 'ConsumedReadCapacityUnits',
      dimensionsMap: {
        TableName: props.subscriberTable.tableName,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    // S3 metrics
    const s3RequestsMetric = new cloudwatch.Metric({
      namespace: 'AWS/S3',
      metricName: 'AllRequests',
      dimensionsMap: {
        BucketName: props.audioBucket.bucketName,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    // Add widgets to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'CloudFront Requests',
        left: [requestsMetric],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Bandwidth Usage',
        left: [bytesDownloadedMetric],
        width: 12,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Error Rates',
        left: [errorRateMetric, fourxxErrorRateMetric],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Read Capacity',
        left: [dynamoReadMetric],
        width: 12,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'S3 Requests',
        left: [s3RequestsMetric],
        width: 12,
      })
    );

    // CloudWatch alarms for high error rates
    const highErrorAlarm = new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
      metric: errorRateMetric,
      threshold: 5,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'Alert when 5xx error rate exceeds 5%',
      alarmName: `podcast-high-error-rate-${props.environmentSuffix}`,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    highErrorAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Alarm for high 4xx error rate (authorization issues)
    const high4xxAlarm = new cloudwatch.Alarm(this, 'High4xxErrorRateAlarm', {
      metric: fourxxErrorRateMetric,
      threshold: 10,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'Alert when 4xx error rate exceeds 10%',
      alarmName: `podcast-high-4xx-rate-${props.environmentSuffix}`,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    high4xxAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    new cdk.CfnOutput(this, 'DashboardURL', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${cdk.Stack.of(this).region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch dashboard URL',
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'SNS topic ARN for alarms',
    });
  }
}
