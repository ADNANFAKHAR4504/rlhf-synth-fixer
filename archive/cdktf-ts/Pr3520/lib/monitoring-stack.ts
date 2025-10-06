import { Construct } from 'constructs';
import { CloudwatchDashboard } from '@cdktf/provider-aws/lib/cloudwatch-dashboard';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';

interface MonitoringStackProps {
  environmentSuffix: string;
  artifactBucket: S3Bucket;
  cleanupFunction: LambdaFunction;
  metadataTable: DynamodbTable;
}

export class MonitoringStack extends Construct {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id);

    const {
      environmentSuffix,
      artifactBucket,
      cleanupFunction,
      metadataTable,
    } = props;

    const dashboardBody = JSON.stringify({
      widgets: [
        {
          type: 'metric',
          properties: {
            metrics: [
              [
                'AWS/S3',
                'BucketSizeBytes',
                { stat: 'Average', label: 'Bucket Size' },
              ],
              [
                '.',
                'NumberOfObjects',
                { stat: 'Average', label: 'Number of Objects' },
              ],
            ],
            period: 300,
            stat: 'Average',
            region: 'us-west-2',
            title: 'S3 Artifact Storage Metrics',
            dimensions: {
              BucketName: artifactBucket.id,
              StorageType: 'StandardStorage',
            },
          },
        },
        {
          type: 'metric',
          properties: {
            metrics: [
              [
                'AWS/Lambda',
                'Duration',
                { stat: 'Average', label: 'Average Duration' },
              ],
              ['.', '.', { stat: 'Maximum', label: 'Max Duration' }],
              ['.', 'Errors', { stat: 'Sum', label: 'Errors' }],
              ['.', 'Invocations', { stat: 'Sum', label: 'Invocations' }],
            ],
            period: 300,
            stat: 'Average',
            region: 'us-west-2',
            title: 'Lambda Cleanup Function Metrics',
            dimensions: {
              FunctionName: cleanupFunction.functionName,
            },
          },
        },
        {
          type: 'metric',
          properties: {
            metrics: [
              [
                'AWS/DynamoDB',
                'ConsumedReadCapacityUnits',
                { stat: 'Sum', label: 'Read Capacity' },
              ],
              [
                '.',
                'ConsumedWriteCapacityUnits',
                { stat: 'Sum', label: 'Write Capacity' },
              ],
              ['.', 'UserErrors', { stat: 'Sum', label: 'User Errors' }],
              ['.', 'SystemErrors', { stat: 'Sum', label: 'System Errors' }],
            ],
            period: 300,
            stat: 'Sum',
            region: 'us-west-2',
            title: 'DynamoDB Metadata Table Metrics',
            dimensions: {
              TableName: metadataTable.name,
            },
          },
        },
      ],
    });

    new CloudwatchDashboard(this, 'artifact-dashboard', {
      dashboardName: `artifact-management-${environmentSuffix}`,
      dashboardBody: dashboardBody,
    });

    new CloudwatchMetricAlarm(this, 's3-storage-alarm', {
      alarmName: `s3-storage-threshold-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'BucketSizeBytes',
      namespace: 'AWS/S3',
      period: 86400,
      statistic: 'Average',
      threshold: 4000000000000,
      alarmDescription:
        'Alert when S3 bucket size exceeds 4TB (80% of 5TB quota)',
      treatMissingData: 'notBreaching',
      dimensions: {
        BucketName: artifactBucket.id,
        StorageType: 'StandardStorage',
      },
    });

    new CloudwatchMetricAlarm(this, 'lambda-errors-alarm', {
      alarmName: `lambda-cleanup-errors-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      period: 300,
      statistic: 'Sum',
      threshold: 0,
      alarmDescription: 'Alert on Lambda cleanup function errors',
      treatMissingData: 'notBreaching',
      dimensions: {
        FunctionName: cleanupFunction.functionName,
      },
    });

    new CloudwatchMetricAlarm(this, 'lambda-duration-alarm', {
      alarmName: `lambda-cleanup-duration-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'Duration',
      namespace: 'AWS/Lambda',
      period: 300,
      statistic: 'Average',
      threshold: 240000,
      alarmDescription: 'Alert when Lambda cleanup duration exceeds 4 minutes',
      treatMissingData: 'notBreaching',
      dimensions: {
        FunctionName: cleanupFunction.functionName,
      },
    });
  }
}
