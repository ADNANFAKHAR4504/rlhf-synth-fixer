import { Construct } from 'constructs';
import { CloudwatchDashboard } from '@cdktf/provider-aws/lib/cloudwatch-dashboard';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';

export interface CloudwatchStackProps {
  environmentSuffix: string;
  transactionProcessorName: string;
  statusCheckerName: string;
  dynamodbTableName: string;
  snsTopicArn: string;
}

export class CloudwatchStack extends Construct {
  constructor(scope: Construct, id: string, props: CloudwatchStackProps) {
    super(scope, id);

    const {
      environmentSuffix,
      transactionProcessorName,
      statusCheckerName,
      dynamodbTableName,
      snsTopicArn,
    } = props;

    // Get current AWS region dynamically for dashboard metrics
    const currentRegion = new DataAwsRegion(this, 'current_region', {});

    // Create CloudWatch Dashboard
    new CloudwatchDashboard(this, 'payment_dashboard', {
      dashboardName: `payment-dashboard-${environmentSuffix}`,
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: 'metric',
            properties: {
              metrics: [
                [
                  'AWS/Lambda',
                  'Invocations',
                  'FunctionName',
                  transactionProcessorName,
                  { stat: 'Sum', label: 'Transaction Processor Invocations' },
                ],
                [
                  '...',
                  'FunctionName',
                  statusCheckerName,
                  { stat: 'Sum', label: 'Status Checker Invocations' },
                ],
              ],
              period: 300,
              stat: 'Sum',
              region: currentRegion.name,
              title: 'Lambda Invocations',
            },
          },
          {
            type: 'metric',
            properties: {
              metrics: [
                [
                  'AWS/Lambda',
                  'Errors',
                  'FunctionName',
                  transactionProcessorName,
                  { stat: 'Sum', label: 'Transaction Processor Errors' },
                ],
                [
                  '...',
                  'FunctionName',
                  statusCheckerName,
                  { stat: 'Sum', label: 'Status Checker Errors' },
                ],
              ],
              period: 300,
              stat: 'Sum',
              region: currentRegion.name,
              title: 'Lambda Errors',
            },
          },
          {
            type: 'metric',
            properties: {
              metrics: [
                [
                  'AWS/DynamoDB',
                  'ConsumedReadCapacityUnits',
                  'TableName',
                  dynamodbTableName,
                  { stat: 'Sum' },
                ],
                [
                  '.',
                  'ConsumedWriteCapacityUnits',
                  'TableName',
                  dynamodbTableName,
                  { stat: 'Sum' },
                ],
              ],
              period: 300,
              stat: 'Sum',
              region: currentRegion.name,
              title: 'DynamoDB Capacity',
            },
          },
        ],
      }),
    });

    // CloudWatch Alarm for transaction processor errors
    new CloudwatchMetricAlarm(this, 'transaction_processor_error_alarm', {
      alarmName: `transaction-processor-errors-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      period: 300,
      statistic: 'Sum',
      threshold: 1,
      treatMissingData: 'notBreaching',
      dimensions: {
        FunctionName: transactionProcessorName,
      },
      alarmDescription:
        'Alert when transaction processor has more than 1 error',
      alarmActions: [snsTopicArn],
      tags: {
        Name: `transaction-processor-alarm-${environmentSuffix}`,
      },
    });

    // CloudWatch Alarm for status checker errors
    new CloudwatchMetricAlarm(this, 'status_checker_error_alarm', {
      alarmName: `status-checker-errors-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      period: 300,
      statistic: 'Sum',
      threshold: 1,
      treatMissingData: 'notBreaching',
      dimensions: {
        FunctionName: statusCheckerName,
      },
      alarmDescription: 'Alert when status checker has more than 1 error',
      alarmActions: [snsTopicArn],
      tags: {
        Name: `status-checker-alarm-${environmentSuffix}`,
      },
    });
  }
}
