import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface MonitoringStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  lambdaFunctions: lambda.Function[];
  restApi: apigateway.RestApi;
  detectionTable: dynamodb.Table;
  imageBucket: s3.Bucket;
}

export class MonitoringStack extends cdk.NestedStack {
  public readonly dashboard: cloudwatch.Dashboard;
  public readonly alarmTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const {
      environmentSuffix,
      lambdaFunctions,
      restApi,
      detectionTable,
      imageBucket,
    } = props;

    // SNS Topic for CloudWatch Alarms
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `serverlessapp-alarms-${environmentSuffix}`,
      displayName: 'CloudWatch Alarms for Image Detector',
    });

    // CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `serverlessapp-image-detector-${environmentSuffix}`,
      defaultInterval: cdk.Duration.hours(1),
    });

    // Lambda Functions Monitoring
    const lambdaWidgets: cloudwatch.IWidget[] = [];

    lambdaFunctions.forEach(func => {
      // Duration metrics
      const durationWidget = new cloudwatch.GraphWidget({
        title: `${func.functionName} - Duration`,
        left: [
          func.metricDuration({
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
        height: 6,
      });

      // Error rate metrics
      const errorWidget = new cloudwatch.GraphWidget({
        title: `${func.functionName} - Errors`,
        left: [
          func.metricErrors({
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          func.metricThrottles({
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
        height: 6,
      });

      // Invocation metrics
      const invocationWidget = new cloudwatch.GraphWidget({
        title: `${func.functionName} - Invocations`,
        left: [
          func.metricInvocations({
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
        height: 6,
      });

      lambdaWidgets.push(durationWidget, errorWidget, invocationWidget);

      // Create alarms for each Lambda function
      const errorAlarm = new cloudwatch.Alarm(
        this,
        `${func.node.id}ErrorAlarm`,
        {
          alarmName: `${func.functionName}-errors-${environmentSuffix}`,
          alarmDescription: `High error rate for ${func.functionName}`,
          metric: func.metricErrors({
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          threshold: environmentSuffix === 'prod' ? 10 : 5,
          evaluationPeriods: 2,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        }
      );

      const durationAlarm = new cloudwatch.Alarm(
        this,
        `${func.node.id}DurationAlarm`,
        {
          alarmName: `${func.functionName}-duration-${environmentSuffix}`,
          alarmDescription: `High duration for ${func.functionName}`,
          metric: func.metricDuration({
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
          threshold: 30000, // 30 seconds
          evaluationPeriods: 3,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        }
      );

      errorAlarm.addAlarmAction(
        new cloudwatchActions.SnsAction(this.alarmTopic)
      );
      durationAlarm.addAlarmAction(
        new cloudwatchActions.SnsAction(this.alarmTopic)
      );
    });

    // API Gateway Monitoring
    const apiLatencyWidget = new cloudwatch.GraphWidget({
      title: 'API Gateway - Latency',
      left: [
        restApi.metricLatency({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 12,
      height: 6,
    });

    const apiErrorWidget = new cloudwatch.GraphWidget({
      title: 'API Gateway - Errors',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '4XXError',
          dimensionsMap: {
            ApiName: restApi.restApiName,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '5XXError',
          dimensionsMap: {
            ApiName: restApi.restApiName,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 12,
      height: 6,
    });

    const apiCountWidget = new cloudwatch.GraphWidget({
      title: 'API Gateway - Request Count',
      left: [
        restApi.metricCount({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 12,
      height: 6,
    });

    // DynamoDB Monitoring
    const dynamoReadWidget = new cloudwatch.GraphWidget({
      title: 'DynamoDB - Read Metrics',
      left: [
        detectionTable.metricConsumedReadCapacityUnits({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        detectionTable.metricSuccessfulRequestLatency({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
          dimensionsMap: {
            Operation: 'GetItem',
          },
        }),
      ],
      width: 12,
      height: 6,
    });

    const dynamoWriteWidget = new cloudwatch.GraphWidget({
      title: 'DynamoDB - Write Metrics',
      left: [
        detectionTable.metricConsumedWriteCapacityUnits({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        detectionTable.metricSuccessfulRequestLatency({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
          dimensionsMap: {
            Operation: 'PutItem',
          },
        }),
      ],
      width: 12,
      height: 6,
    });

    // S3 Monitoring
    const s3RequestsWidget = new cloudwatch.GraphWidget({
      title: 'S3 - Request Metrics',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/S3',
          metricName: 'NumberOfObjects',
          dimensionsMap: {
            BucketName: imageBucket.bucketName,
            StorageType: 'AllStorageTypes',
          },
          statistic: 'Average',
          period: cdk.Duration.hours(1),
        }),
      ],
      width: 12,
      height: 6,
    });

    // Business Metrics Widget
    const businessMetricsWidget = new cloudwatch.GraphWidget({
      title: 'Business Metrics - Detection Results',
      left: [
        new cloudwatch.Metric({
          namespace: 'ServerlessImageDetector',
          metricName: 'CatsDetected',
          statistic: 'Sum',
          period: cdk.Duration.hours(1),
        }),
        new cloudwatch.Metric({
          namespace: 'ServerlessImageDetector',
          metricName: 'DogsDetected',
          statistic: 'Sum',
          period: cdk.Duration.hours(1),
        }),
        new cloudwatch.Metric({
          namespace: 'ServerlessImageDetector',
          metricName: 'OthersDetected',
          statistic: 'Sum',
          period: cdk.Duration.hours(1),
        }),
      ],
      width: 12,
      height: 6,
    });

    // Add all widgets to dashboard
    this.dashboard.addWidgets(
      // Lambda section
      new cloudwatch.TextWidget({
        markdown: '# Lambda Functions Monitoring',
        width: 24,
        height: 1,
      }),
      ...lambdaWidgets,

      // API Gateway section
      new cloudwatch.TextWidget({
        markdown: '# API Gateway Monitoring',
        width: 24,
        height: 1,
      }),
      apiLatencyWidget,
      apiErrorWidget,
      apiCountWidget,

      // DynamoDB section
      new cloudwatch.TextWidget({
        markdown: '# DynamoDB Monitoring',
        width: 24,
        height: 1,
      }),
      dynamoReadWidget,
      dynamoWriteWidget,

      // S3 section
      new cloudwatch.TextWidget({
        markdown: '# S3 Storage Monitoring',
        width: 24,
        height: 1,
      }),
      s3RequestsWidget,

      // Business metrics section
      new cloudwatch.TextWidget({
        markdown: '# Business Metrics',
        width: 24,
        height: 1,
      }),
      businessMetricsWidget
    );

    // API Gateway Alarms
    const apiErrorAlarm = new cloudwatch.Alarm(this, 'ApiErrorAlarm', {
      alarmName: `api-gateway-errors-${environmentSuffix}`,
      alarmDescription: 'High error rate in API Gateway',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5XXError',
        dimensionsMap: {
          ApiName: restApi.restApiName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: environmentSuffix === 'prod' ? 50 : 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    apiErrorAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alarmTopic)
    );

    // DynamoDB Alarms
    const dynamoThrottleAlarm = new cloudwatch.Alarm(
      this,
      'DynamoThrottleAlarm',
      {
        alarmName: `dynamodb-throttles-${environmentSuffix}`,
        alarmDescription: 'DynamoDB throttling detected',
        metric: detectionTable.metricThrottledRequestsForOperation('GetItem', {
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 0,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    dynamoThrottleAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alarmTopic)
    );

    // Add resource tags
    cdk.Tags.of(this).add('Component', 'Monitoring');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
