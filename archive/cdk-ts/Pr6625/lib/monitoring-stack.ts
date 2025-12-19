import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

export interface MonitoringStackProps extends cdk.StackProps {
  environmentSuffix: string;
  api: apigateway.RestApi;
  patternDetectorFunction: lambda.Function;
  alertProcessorFunction: lambda.Function;
  thresholdCheckerFunction: lambda.Function;
  kinesisConsumerFunction: lambda.Function;
  approvalProcessorFunction: lambda.Function;
  tradingPatternsTable: dynamodb.Table;
  alertQueue: sqs.Queue;
  patternAnalysisWorkflow: sfn.StateMachine;
  marketDataStream: kinesis.Stream;
  webAclArn: string;
}

export class MonitoringStack extends cdk.Stack {
  public readonly dashboard: cloudwatch.Dashboard;
  public readonly dashboardUrl: string;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const {
      environmentSuffix,
      api,
      patternDetectorFunction,
      alertProcessorFunction,
      thresholdCheckerFunction,
      kinesisConsumerFunction,
      approvalProcessorFunction,
      tradingPatternsTable,
      alertQueue,
      patternAnalysisWorkflow,
      marketDataStream,
    } = props;

    // Create custom metrics namespace
    const customNamespace = 'StockPatternDetection';

    // Define custom metrics
    const patternDetectionDurationMetric = new cloudwatch.Metric({
      namespace: customNamespace,
      metricName: 'PatternDetectionDuration',
      dimensionsMap: {
        PatternType: 'head-and-shoulders',
        Confidence: 'high',
      },
      statistic: 'avg',
      period: cdk.Duration.minutes(5),
    });

    const confidenceScoreMetric = new cloudwatch.Metric({
      namespace: customNamespace,
      metricName: 'ConfidenceScore',
      dimensionsMap: {
        PatternType: 'double-top',
        Symbol: 'AAPL',
      },
      statistic: 'avg',
      period: cdk.Duration.minutes(5),
    });

    const alertPriorityMetric = new cloudwatch.Metric({
      namespace: customNamespace,
      metricName: 'AlertPriority',
      dimensionsMap: {
        Severity: 'CRITICAL',
      },
      statistic: 'sum',
      period: cdk.Duration.minutes(5),
    });

    // Create anomaly detection on PatternDetectionDuration
    new cloudwatch.CfnAnomalyDetector(this, 'PatternDurationAnomalyDetector', {
      namespace: customNamespace,
      metricName: 'PatternDetectionDuration',
      stat: 'Average',
      dimensions: [
        {
          name: 'PatternType',
          value: 'head-and-shoulders',
        },
      ],
    });

    // Create CloudWatch Dashboard with 12+ widgets
    this.dashboard = new cloudwatch.Dashboard(
      this,
      'PatternDetectionDashboard',
      {
        dashboardName: `PatternDetectionDashboard-${environmentSuffix}`,
      }
    );

    // Widget 1: API Gateway latency percentiles (p50, p90, p99) - line graph
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Latency Percentiles',
        left: [
          api.metricLatency({ statistic: 'p50' }),
          api.metricLatency({ statistic: 'p90' }),
          api.metricLatency({ statistic: 'p99' }),
        ],
        width: 12,
        height: 6,
      })
    );

    // Widget 2: Lambda concurrent executions - stacked area chart
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Concurrent Executions',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'ConcurrentExecutions',
            dimensionsMap: {
              FunctionName: patternDetectorFunction.functionName,
            },
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'ConcurrentExecutions',
            dimensionsMap: {
              FunctionName: alertProcessorFunction.functionName,
            },
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'ConcurrentExecutions',
            dimensionsMap: {
              FunctionName: thresholdCheckerFunction.functionName,
            },
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'ConcurrentExecutions',
            dimensionsMap: {
              FunctionName: kinesisConsumerFunction.functionName,
            },
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'ConcurrentExecutions',
            dimensionsMap: {
              FunctionName: approvalProcessorFunction.functionName,
            },
          }),
        ],
        width: 12,
        height: 6,
        stacked: true,
      })
    );

    // Widget 3: DynamoDB consumed capacity - line graph
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Consumed Capacity Units',
        left: [
          tradingPatternsTable.metricConsumedReadCapacityUnits(),
          tradingPatternsTable.metricConsumedWriteCapacityUnits(),
        ],
        width: 12,
        height: 6,
      })
    );

    // Widget 4: SQS queue depth - number widget
    this.dashboard.addWidgets(
      new cloudwatch.SingleValueWidget({
        title: 'SQS Queue Depth',
        metrics: [alertQueue.metricApproximateNumberOfMessagesVisible()],
        width: 6,
        height: 6,
      })
    );

    // Widget 5: SQS message age - number widget
    this.dashboard.addWidgets(
      new cloudwatch.SingleValueWidget({
        title: 'SQS Message Age (seconds)',
        metrics: [alertQueue.metricApproximateAgeOfOldestMessage()],
        width: 6,
        height: 6,
      })
    );

    // Widget 6: Step Functions execution status - pie chart
    const sfnSuccessMetric = patternAnalysisWorkflow.metricSucceeded({
      statistic: 'sum',
      period: cdk.Duration.hours(1),
    });
    const sfnFailedMetric = patternAnalysisWorkflow.metricFailed({
      statistic: 'sum',
      period: cdk.Duration.hours(1),
    });
    const sfnAbortedMetric = patternAnalysisWorkflow.metricAborted({
      statistic: 'sum',
      period: cdk.Duration.hours(1),
    });

    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Step Functions Execution Status',
        left: [sfnSuccessMetric, sfnFailedMetric, sfnAbortedMetric],
        width: 8,
        height: 6,
        view: cloudwatch.GraphWidgetView.PIE,
      })
    );

    // Widget 7: Custom metrics - average confidence score by pattern type - bar chart
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Average Confidence Score by Pattern Type',
        left: [confidenceScoreMetric],
        width: 8,
        height: 6,
        view: cloudwatch.GraphWidgetView.BAR,
      })
    );

    // Widget 8: WAF blocked requests - number widget
    const wafBlockedMetric = new cloudwatch.Metric({
      namespace: 'AWS/WAFV2',
      metricName: 'BlockedRequests',
      dimensionsMap: {
        Region: this.region,
        Rule: 'ALL',
        WebACL: `PatternDetectionWAF-${environmentSuffix}`,
      },
      statistic: 'sum',
      period: cdk.Duration.minutes(5),
    });

    this.dashboard.addWidgets(
      new cloudwatch.SingleValueWidget({
        title: 'WAF Blocked Requests',
        metrics: [wafBlockedMetric],
        width: 8,
        height: 6,
      })
    );

    // Widget 9: Kinesis stream incoming records - line graph
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Kinesis Incoming Records',
        left: [marketDataStream.metricIncomingRecords()],
        width: 12,
        height: 6,
      })
    );

    // Widget 10: Lambda error rates
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Error Rates',
        left: [
          patternDetectorFunction.metricErrors(),
          alertProcessorFunction.metricErrors(),
          thresholdCheckerFunction.metricErrors(),
        ],
        width: 12,
        height: 6,
      })
    );

    // Widget 11: Custom metric - Pattern Detection Duration
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Pattern Detection Duration',
        left: [patternDetectionDurationMetric],
        width: 12,
        height: 6,
      })
    );

    // Widget 12: Custom metric - Alert Priority Count
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Alert Priority Count (CRITICAL)',
        left: [alertPriorityMetric],
        width: 12,
        height: 6,
      })
    );

    // Widget 13: API Gateway request count
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Request Count',
        left: [api.metricCount()],
        width: 12,
        height: 6,
      })
    );

    // Widget 14: Lambda Duration
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration (ms)',
        left: [
          patternDetectorFunction.metricDuration(),
          alertProcessorFunction.metricDuration(),
        ],
        width: 12,
        height: 6,
      })
    );

    // Create SNS topic for billing alarms
    const billingAlarmTopic = new sns.Topic(this, 'BillingAlarmTopic', {
      topicName: `billing-alarm-${environmentSuffix}`,
      displayName: 'Billing Alarm Notifications',
    });

    // Create billing alarm for $100/month threshold
    const billingAlarm = new cloudwatch.Alarm(this, 'BillingAlarm', {
      alarmName: `billing-threshold-${environmentSuffix}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Billing',
        metricName: 'EstimatedCharges',
        dimensionsMap: {
          Currency: 'USD',
        },
        statistic: 'Maximum',
        period: cdk.Duration.hours(6),
      }),
      threshold: 100,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    billingAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(billingAlarmTopic)
    );

    // Generate dashboard URL
    this.dashboardUrl = `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${this.dashboard.dashboardName}`;

    // Outputs
    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: this.dashboardUrl,
      description: 'CloudWatch Dashboard URL',
      exportName: `DashboardUrl-${environmentSuffix}`,
    });

    // Add tags
    cdk.Tags.of(this).add('Project', 'StockPatternDetection');
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('CostCenter', 'Trading');
  }
}
