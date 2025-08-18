import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

interface MonitoringStackProps {
  environment: string;
  isPrimary: boolean;
  region: string;
}

export class MonitoringStack extends Construct {
  public readonly alarmTopic: sns.Topic;
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id);

    const { environment, isPrimary } = props;
    const region = cdk.Stack.of(this).region;

    // Import existing resources from other stacks
    const dataProcessorFunction = lambda.Function.fromFunctionName(
      this,
      'ImportedDataProcessorFunction',
      `serverless-data-processor-${environment}-${region}`
    );

    const dataIngestionBucket = s3.Bucket.fromBucketName(
      this,
      'ImportedDataIngestionBucket',
      `serverless-data-ingestion-${environment}-${region}`
    );

    const processedDataTable = dynamodb.Table.fromTableName(
      this,
      'ImportedProcessedDataTable',
      `serverless-processed-data-${environment}`
    );

    // Create SNS topic for alarms
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `serverless-alarms-${environment}`,
      displayName: `Serverless Pipeline Alarms - ${environment}`,
    });

    // Add tags for cost allocation and governance
    cdk.Tags.of(this.alarmTopic).add('Environment', environment);
    cdk.Tags.of(this.alarmTopic).add('Service', 'Monitoring');
    cdk.Tags.of(this.alarmTopic).add('Region', region);
    cdk.Tags.of(this.alarmTopic).add('IsPrimary', isPrimary.toString());

    // Create CloudWatch alarms for Lambda function
    const lambdaErrorsAlarm = new cloudwatch.Alarm(this, 'LambdaErrorsAlarm', {
      metric: dataProcessorFunction.metricErrors({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 2,
      alarmDescription: 'Lambda function errors exceeded threshold',
      alarmName: `serverless-lambda-errors-${environment}`,
    });

    const lambdaDurationAlarm = new cloudwatch.Alarm(
      this,
      'LambdaDurationAlarm',
      {
        metric: dataProcessorFunction.metricDuration({
          period: cdk.Duration.minutes(5),
          statistic: 'Average',
        }),
        threshold: 240000, // 4 minutes in milliseconds
        evaluationPeriods: 2,
        alarmDescription: 'Lambda function duration exceeded threshold',
        alarmName: `serverless-lambda-duration-${environment}`,
      }
    );

    const lambdaThrottlesAlarm = new cloudwatch.Alarm(
      this,
      'LambdaThrottlesAlarm',
      {
        metric: dataProcessorFunction.metricThrottles({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 1,
        evaluationPeriods: 1,
        alarmDescription: 'Lambda function throttles detected',
        alarmName: `serverless-lambda-throttles-${environment}`,
      }
    );

    // Create CloudWatch alarms for S3
    const s3ErrorsAlarm = new cloudwatch.Alarm(this, 'S3ErrorsAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/S3',
        metricName: '5xxError',
        dimensionsMap: {
          BucketName: dataIngestionBucket.bucketName,
        },
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'S3 bucket 5xx errors detected',
      alarmName: `serverless-s3-errors-${environment}`,
    });

    // Create CloudWatch alarms for DynamoDB
    const dynamoDBErrorsAlarm = new cloudwatch.Alarm(
      this,
      'DynamoDBErrorsAlarm',
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'SystemErrors',
          dimensionsMap: {
            TableName: processedDataTable.tableName,
          },
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 1,
        evaluationPeriods: 1,
        alarmDescription: 'DynamoDB system errors detected',
        alarmName: `serverless-dynamodb-errors-${environment}`,
      }
    );

    const dynamoDBThrottlesAlarm = new cloudwatch.Alarm(
      this,
      'DynamoDBThrottlesAlarm',
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'ThrottledRequests',
          dimensionsMap: {
            TableName: processedDataTable.tableName,
          },
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 1,
        evaluationPeriods: 1,
        alarmDescription: 'DynamoDB throttled requests detected',
        alarmName: `serverless-dynamodb-throttles-${environment}`,
      }
    );

    // Create CloudWatch alarms for SQS
    const sqsMessagesAlarm = new cloudwatch.Alarm(this, 'SQSMessagesAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/SQS',
        metricName: 'ApproximateNumberOfVisibleMessages',
        dimensionsMap: {
          QueueName: `serverless-dlq-${environment}-${region}`,
        },
        period: cdk.Duration.minutes(5),
        statistic: 'Average',
      }),
      threshold: 10,
      evaluationPeriods: 2,
      alarmDescription: 'Dead letter queue has too many messages',
      alarmName: `serverless-sqs-messages-${environment}`,
    });

    // Add all alarms to SNS topic
    lambdaErrorsAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alarmTopic)
    );
    lambdaDurationAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alarmTopic)
    );
    lambdaThrottlesAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alarmTopic)
    );
    s3ErrorsAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alarmTopic)
    );
    dynamoDBErrorsAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alarmTopic)
    );
    dynamoDBThrottlesAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alarmTopic)
    );
    sqsMessagesAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alarmTopic)
    );

    // Create CloudWatch dashboard only in primary region
    if (isPrimary) {
      this.dashboard = new cloudwatch.Dashboard(
        this,
        'ServerlessPipelineDashboard',
        {
          dashboardName: `serverless-pipeline-${environment}-${region}`,
        }
      );
    } else {
      // In secondary region, create a minimal dashboard
      this.dashboard = new cloudwatch.Dashboard(
        this,
        'ServerlessPipelineDashboardSecondary',
        {
          dashboardName: `serverless-pipeline-${environment}-${region}`,
        }
      );
    }

    // Add widgets to dashboard
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Function Metrics',
        left: [
          dataProcessorFunction.metricInvocations(),
          dataProcessorFunction.metricErrors(),
          dataProcessorFunction.metricDuration(),
        ],
        right: [dataProcessorFunction.metricThrottles()],
      }),
      new cloudwatch.GraphWidget({
        title: 'S3 Bucket Metrics',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/S3',
            metricName: 'NumberOfObjects',
            dimensionsMap: {
              BucketName: dataIngestionBucket.bucketName,
            },
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/S3',
            metricName: 'BucketSizeBytes',
            dimensionsMap: {
              BucketName: dataIngestionBucket.bucketName,
            },
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Table Metrics',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ConsumedReadCapacityUnits',
            dimensionsMap: {
              TableName: processedDataTable.tableName,
            },
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ConsumedWriteCapacityUnits',
            dimensionsMap: {
              TableName: processedDataTable.tableName,
            },
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ThrottledRequests',
            dimensionsMap: {
              TableName: processedDataTable.tableName,
            },
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'SQS Queue Metrics',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/SQS',
            metricName: 'ApproximateNumberOfVisibleMessages',
            dimensionsMap: {
              QueueName: `serverless-dlq-${environment}-${region}`,
            },
          }),
        ],
      })
    );

    // Output the SNS topic ARN
    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: this.alarmTopic.topicArn,
      description: 'ARN of the SNS topic for alarms',
      exportName: `serverless-alarm-topic-arn-${region}`,
    });

    new cdk.CfnOutput(this, 'DashboardName', {
      value: this.dashboard.dashboardName,
      description: 'Name of the CloudWatch dashboard',
      exportName: `serverless-dashboard-name-${region}`,
    });
  }
}
