import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as xray from 'aws-cdk-lib/aws-xray';

interface MonitoringStackProps extends cdk.StackProps {
  environmentSuffix: string;
  apiGateway: apigateway.RestApi;
  paymentValidationFunction: lambda.Function;
  paymentProcessingFunction: lambda.Function;
  databaseCluster: rds.DatabaseCluster;
  paymentQueue: sqs.Queue;
  paymentDlq: sqs.Queue;
}

export class MonitoringStack extends cdk.Stack {
  public readonly alarmTopic: sns.Topic;
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const {
      environmentSuffix,
      apiGateway,
      paymentValidationFunction,
      paymentProcessingFunction,
      databaseCluster,
      paymentQueue,
      paymentDlq,
    } = props;

    // SNS topics for alerts
    this.alarmTopic = new sns.Topic(
      this,
      `PaymentAlertsTopic${environmentSuffix}`,
      {
        topicName: `payment-processing-alerts-${environmentSuffix}`,
        displayName: 'Payment Processing Alerts',
      }
    );

    // Email subscriptions
    this.alarmTopic.addSubscription(
      new subscriptions.EmailSubscription('alerts@paymentcompany.com')
    );

    // X-Ray configuration
    new xray.CfnGroup(this, `XRayGroup${environmentSuffix}`, {
      groupName: `payment-processing-${environmentSuffix}`,
      filterExpression:
        'service("payment-validation") OR service("payment-processing")',
      insightsConfiguration: {
        insightsEnabled: true,
        notificationsEnabled: true,
      },
    });

    // CloudWatch Alarms

    // API Gateway alarms
    const apiErrorsAlarm = new cloudwatch.Alarm(
      this,
      `ApiGatewayErrors${environmentSuffix}`,
      {
        alarmName: `api-gateway-errors-${environmentSuffix}`,
        alarmDescription: 'API Gateway 5xx errors above threshold',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '5XXError',
          dimensionsMap: {
            ApiName: apiGateway.restApiName,
          },
          statistic: 'Sum',
        }),
        threshold: 5,
        evaluationPeriods: 3,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );
    apiErrorsAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    const apiLatencyAlarm = new cloudwatch.Alarm(
      this,
      `ApiGatewayLatency${environmentSuffix}`,
      {
        alarmName: `api-gateway-latency-${environmentSuffix}`,
        alarmDescription: 'API Gateway latency above 2 seconds',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          dimensionsMap: {
            ApiName: apiGateway.restApiName,
          },
          statistic: 'Average',
        }),
        threshold: 2000,
        evaluationPeriods: 3,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );
    apiLatencyAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // Lambda function alarms
    const validationFunctionErrors = new cloudwatch.Alarm(
      this,
      `ValidationFunctionErrors${environmentSuffix}`,
      {
        alarmName: `payment-validation-errors-${environmentSuffix}`,
        alarmDescription: 'Payment validation function errors',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Errors',
          dimensionsMap: {
            FunctionName: paymentValidationFunction.functionName,
          },
          statistic: 'Sum',
        }),
        threshold: 3,
        evaluationPeriods: 5,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );
    validationFunctionErrors.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    const processingFunctionErrors = new cloudwatch.Alarm(
      this,
      `ProcessingFunctionErrors${environmentSuffix}`,
      {
        alarmName: `payment-processing-errors-${environmentSuffix}`,
        alarmDescription: 'Payment processing function errors',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Errors',
          dimensionsMap: {
            FunctionName: paymentProcessingFunction.functionName,
          },
          statistic: 'Sum',
        }),
        threshold: 3,
        evaluationPeriods: 5,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );
    processingFunctionErrors.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // Lambda duration alarms
    const validationFunctionDuration = new cloudwatch.Alarm(
      this,
      `ValidationFunctionDuration${environmentSuffix}`,
      {
        alarmName: `payment-validation-duration-${environmentSuffix}`,
        alarmDescription:
          'Payment validation function duration above threshold',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Duration',
          dimensionsMap: {
            FunctionName: paymentValidationFunction.functionName,
          },
          statistic: 'Average',
        }),
        threshold: 30000, // 30 seconds
        evaluationPeriods: 3,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );
    validationFunctionDuration.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // Database alarms
    const databaseCpuAlarm = new cloudwatch.Alarm(
      this,
      `DatabaseCpuAlarm${environmentSuffix}`,
      {
        alarmName: `payment-db-cpu-${environmentSuffix}`,
        alarmDescription: 'Database CPU utilization above 80%',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            DBClusterIdentifier: databaseCluster.clusterIdentifier,
          },
          statistic: 'Average',
        }),
        threshold: 80,
        evaluationPeriods: 3,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );
    databaseCpuAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    const databaseConnectionAlarm = new cloudwatch.Alarm(
      this,
      `DatabaseConnectionAlarm${environmentSuffix}`,
      {
        alarmName: `payment-db-connections-${environmentSuffix}`,
        alarmDescription: 'Database connections above threshold',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'DatabaseConnections',
          dimensionsMap: {
            DBClusterIdentifier: databaseCluster.clusterIdentifier,
          },
          statistic: 'Maximum',
        }),
        threshold: 100,
        evaluationPeriods: 3,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );
    databaseConnectionAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // SQS alarms
    const queueDepthAlarm = new cloudwatch.Alarm(
      this,
      `PaymentQueueDepth${environmentSuffix}`,
      {
        alarmName: `payment-queue-depth-${environmentSuffix}`,
        alarmDescription: 'Payment queue depth above threshold',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/SQS',
          metricName: 'ApproximateNumberOfMessagesVisible',
          dimensionsMap: {
            QueueName: paymentQueue.queueName,
          },
          statistic: 'Maximum',
        }),
        threshold: 1000,
        evaluationPeriods: 3,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );
    queueDepthAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    const dlqDepthAlarm = new cloudwatch.Alarm(
      this,
      `PaymentDlqDepth${environmentSuffix}`,
      {
        alarmName: `payment-dlq-depth-${environmentSuffix}`,
        alarmDescription: 'Payment DLQ has messages (processing failures)',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/SQS',
          metricName: 'ApproximateNumberOfMessagesVisible',
          dimensionsMap: {
            QueueName: paymentDlq.queueName,
          },
          statistic: 'Maximum',
        }),
        threshold: 0,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );
    dlqDepthAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(
      this,
      `PaymentProcessingDashboard${environmentSuffix}`,
      {
        dashboardName: `payment-processing-dashboard-${environmentSuffix}`,
      }
    );

    // Add widgets to dashboard
    this.dashboard.addWidgets(
      // API Gateway metrics
      new cloudwatch.GraphWidget({
        title: 'API Gateway Performance',
        width: 12,
        height: 6,
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Count',
            dimensionsMap: { ApiName: apiGateway.restApiName },
            statistic: 'Sum',
            label: 'Total Requests',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '5XXError',
            dimensionsMap: { ApiName: apiGateway.restApiName },
            statistic: 'Sum',
            label: '5XX Errors',
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Latency',
            dimensionsMap: { ApiName: apiGateway.restApiName },
            statistic: 'Average',
            label: 'Average Latency (ms)',
          }),
        ],
      }),

      // Lambda metrics
      new cloudwatch.GraphWidget({
        title: 'Lambda Function Performance',
        width: 12,
        height: 6,
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Invocations',
            dimensionsMap: {
              FunctionName: paymentValidationFunction.functionName,
            },
            statistic: 'Sum',
            label: 'Validation Invocations',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Invocations',
            dimensionsMap: {
              FunctionName: paymentProcessingFunction.functionName,
            },
            statistic: 'Sum',
            label: 'Processing Invocations',
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Duration',
            dimensionsMap: {
              FunctionName: paymentValidationFunction.functionName,
            },
            statistic: 'Average',
            label: 'Validation Duration (ms)',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Duration',
            dimensionsMap: {
              FunctionName: paymentProcessingFunction.functionName,
            },
            statistic: 'Average',
            label: 'Processing Duration (ms)',
          }),
        ],
      }),

      // Database metrics
      new cloudwatch.GraphWidget({
        title: 'Database Performance',
        width: 12,
        height: 6,
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'CPUUtilization',
            dimensionsMap: {
              DBClusterIdentifier: databaseCluster.clusterIdentifier,
            },
            statistic: 'Average',
            label: 'CPU Utilization (%)',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'DatabaseConnections',
            dimensionsMap: {
              DBClusterIdentifier: databaseCluster.clusterIdentifier,
            },
            statistic: 'Average',
            label: 'Active Connections',
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'ReadLatency',
            dimensionsMap: {
              DBClusterIdentifier: databaseCluster.clusterIdentifier,
            },
            statistic: 'Average',
            label: 'Read Latency (ms)',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'WriteLatency',
            dimensionsMap: {
              DBClusterIdentifier: databaseCluster.clusterIdentifier,
            },
            statistic: 'Average',
            label: 'Write Latency (ms)',
          }),
        ],
      }),

      // Queue metrics
      new cloudwatch.GraphWidget({
        title: 'Queue Performance',
        width: 12,
        height: 6,
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/SQS',
            metricName: 'ApproximateNumberOfMessagesVisible',
            dimensionsMap: { QueueName: paymentQueue.queueName },
            statistic: 'Maximum',
            label: 'Queue Depth',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/SQS',
            metricName: 'ApproximateNumberOfMessagesVisible',
            dimensionsMap: { QueueName: paymentDlq.queueName },
            statistic: 'Maximum',
            label: 'DLQ Depth',
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/SQS',
            metricName: 'NumberOfMessagesReceived',
            dimensionsMap: { QueueName: paymentQueue.queueName },
            statistic: 'Sum',
            label: 'Messages Received',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/SQS',
            metricName: 'NumberOfMessagesDeleted',
            dimensionsMap: { QueueName: paymentQueue.queueName },
            statistic: 'Sum',
            label: 'Messages Processed',
          }),
        ],
      }),

      // Alarm status
      new cloudwatch.AlarmStatusWidget({
        title: 'Alarm Status',
        width: 24,
        height: 6,
        alarms: [
          apiErrorsAlarm,
          apiLatencyAlarm,
          validationFunctionErrors,
          processingFunctionErrors,
          validationFunctionDuration,
          databaseCpuAlarm,
          databaseConnectionAlarm,
          queueDepthAlarm,
          dlqDepthAlarm,
        ],
      })
    );

    // Custom metrics for payment processing
    const paymentProcessedMetric = new cloudwatch.Metric({
      namespace: 'PaymentProcessing',
      metricName: 'PaymentsProcessed',
      dimensionsMap: { Environment: environmentSuffix },
      statistic: 'Sum',
    });

    const paymentFailedMetric = new cloudwatch.Metric({
      namespace: 'PaymentProcessing',
      metricName: 'PaymentsFailed',
      dimensionsMap: { Environment: environmentSuffix },
      statistic: 'Sum',
    });

    // Custom metric alarms
    const paymentFailureRateAlarm = new cloudwatch.Alarm(
      this,
      `PaymentFailureRate${environmentSuffix}`,
      {
        alarmName: `payment-failure-rate-${environmentSuffix}`,
        alarmDescription: 'Payment failure rate above 5%',
        metric: new cloudwatch.MathExpression({
          expression:
            'SEARCH(\'{PaymentProcessing,Environment} MetricName="PaymentsFailed" / SEARCH(\'{PaymentProcessing,Environment} MetricName="PaymentsProcessed" + SEARCH(\'{PaymentProcessing,Environment} MetricName="PaymentsFailed"', // Simplified expression
          usingMetrics: {
            processed: paymentProcessedMetric,
            failed: paymentFailedMetric,
          },
          label: 'Failure Rate (%)',
        }),
        threshold: 5,
        evaluationPeriods: 5,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );
    paymentFailureRateAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // Outputs
    new cdk.CfnOutput(this, `AlarmTopicArn${environmentSuffix}`, {
      value: this.alarmTopic.topicArn,
      exportName: `PaymentAlarmTopic-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `DashboardUrl${environmentSuffix}`, {
      value: `https://${cdk.Stack.of(this).region}.console.aws.amazon.com/cloudwatch/home?region=${cdk.Stack.of(this).region}#dashboards:name=${this.dashboard.dashboardName}`,
      exportName: `PaymentDashboardUrl-${environmentSuffix}`,
    });
  }
}
