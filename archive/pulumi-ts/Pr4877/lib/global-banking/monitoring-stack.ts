/**
 * monitoring-stack.ts
 *
 * CloudWatch dashboards, alarms, X-Ray tracing, SNS notifications
 * Comprehensive observability for the banking platform
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MonitoringStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  regions: {
    primary: string;
    replicas: string[];
  };
  enableXRay: boolean;
  enableCrossRegionDashboards: boolean;
  resourceArns: {
    ecsCluster: pulumi.Input<string>;
    apiGateway: pulumi.Input<string>;
    loadBalancer: pulumi.Input<string>;
    auroraCluster: pulumi.Input<string>;
    dynamoDbTable: pulumi.Input<string>;
    kinesisStream: pulumi.Input<string>;
  };
}

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly dashboardUrl: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly xrayGroupName: pulumi.Output<string>;
  public readonly sloDashboardUrl: pulumi.Output<string>;
  public readonly crossRegionDashboardUrl?: pulumi.Output<string>;

  constructor(
    name: string,
    args: MonitoringStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:monitoring:MonitoringStack', name, args, opts);

    const {
      environmentSuffix,
      tags,
      regions,
      enableXRay,
      enableCrossRegionDashboards,
      resourceArns,
    } = args;

    //  SNS Topic for Alerts
    const alertTopic = new aws.sns.Topic(
      `${name}-alert-topic`,
      {
        name: `banking-alerts-${environmentSuffix}`,
        displayName: `Banking Platform Alerts - ${environmentSuffix}`,
        kmsMasterKeyId: 'alias/aws/sns',
        deliveryPolicy: JSON.stringify({
          http: {
            defaultHealthyRetryPolicy: {
              minDelayTarget: 20,
              maxDelayTarget: 20,
              numRetries: 3,
              numMaxDelayRetries: 0,
              numNoDelayRetries: 0,
              numMinDelayRetries: 0,
              backoffFunction: 'linear',
            },
            disableSubscriptionOverrides: false,
          },
        }),
        tags: tags,
      },
      { parent: this }
    );

    //  Email Subscription
    new aws.sns.TopicSubscription(
      `${name}-email-subscription`,
      {
        topic: alertTopic.arn,
        protocol: 'email',
        endpoint: `banking-alerts-${environmentSuffix}@example.com`,
      },
      { parent: this }
    );

    //  SMS Subscription for Critical Alerts
    new aws.sns.TopicSubscription(
      `${name}-sms-subscription`,
      {
        topic: alertTopic.arn,
        protocol: 'sms',
        endpoint: '+1234567890',
      },
      { parent: this }
    );

    //  X-Ray Tracing Group
    let xrayGroup: aws.xray.Group | undefined;
    let xrayGroupName: pulumi.Output<string>;

    if (enableXRay) {
      xrayGroup = new aws.xray.Group(
        `${name}-xray-group`,
        {
          groupName: `banking-services-${environmentSuffix}`,
          filterExpression:
            'service("banking-*") OR annotation.component = "banking"',
          insightsConfiguration: {
            insightsEnabled: true,
            notificationsEnabled: true,
          },
          tags: tags,
        },
        { parent: this }
      );
      xrayGroupName = xrayGroup.groupName;

      // X-Ray Sampling Rule for Banking Services
      new aws.xray.SamplingRule(
        `${name}-sampling-rule`,
        {
          ruleName: `banking-sampling-${environmentSuffix}`,
          priority: 1000,
          version: 1,
          reservoirSize: 10,
          fixedRate: 0.1,
          urlPath: '*',
          host: '*',
          httpMethod: '*',
          serviceName: 'banking-*',
          serviceType: '*',
          resourceArn: '*',
          tags: tags,
        },
        { parent: this }
      );

      // X-Ray Sampling Rule for High-Value Transactions
      new aws.xray.SamplingRule(
        `${name}-high-value-sampling-rule`,
        {
          ruleName: `banking-high-value-${environmentSuffix}`,
          priority: 100,
          version: 1,
          reservoirSize: 1,
          fixedRate: 1.0,
          urlPath: '/api/v1/transactions/high-value*',
          host: '*',
          httpMethod: 'POST',
          serviceName: 'banking-*',
          serviceType: '*',
          resourceArn: '*',
          tags: tags,
        },
        { parent: this }
      );
    } else {
      xrayGroupName = pulumi.output('xray-disabled');
    }

    //  CloudWatch Log Groups

    new aws.cloudwatch.LogGroup(
      `${name}-ecs-logs`,
      {
        name: `/aws/ecs/banking-${environmentSuffix}`,
        retentionInDays: 30,
        tags: tags,
      },
      { parent: this }
    );

    new aws.cloudwatch.LogGroup(
      `${name}-lambda-logs`,
      {
        name: `/aws/lambda/banking-${environmentSuffix}`,
        retentionInDays: 14,
        tags: tags,
      },
      { parent: this }
    );

    const apiLogGroup = new aws.cloudwatch.LogGroup(
      `${name}-application-logs`,
      {
        name: `/banking/application-${environmentSuffix}`,
        retentionInDays: 90,
        tags: tags,
      },
      { parent: this }
    );

    // X-Ray Log Group
    if (enableXRay) {
      new aws.cloudwatch.LogGroup(
        `${name}-xray-logs`,
        {
          name: `/aws/xray/banking-${environmentSuffix}`,
          retentionInDays: 30,
          tags: tags,
        },
        { parent: this }
      );
    }

    // CloudWatch Metric Filters

    // Transaction Error Metric Filter
    new aws.cloudwatch.LogMetricFilter(
      `${name}-transaction-error-filter`,
      {
        name: `transaction-errors-${environmentSuffix}`,
        logGroupName: apiLogGroup.name,
        pattern: '[timestamp, request_id, level=ERROR, transaction_type, ...]',
        metricTransformation: {
          name: 'TransactionErrors',
          namespace: `Banking/${environmentSuffix}`,
          value: '1',
          defaultValue: '0',
          unit: 'Count',
        },
      },
      { parent: this }
    );

    // Transaction Error Alarm
    new aws.cloudwatch.MetricAlarm(
      `${name}-transaction-error-alarm`,
      {
        name: `transaction-errors-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'TransactionErrors',
        namespace: `Banking/${environmentSuffix}`,
        period: 300,
        statistic: 'Sum',
        threshold: 5,
        alarmDescription: 'Alert when transaction errors exceed 5',
        alarmActions: [alertTopic.arn],
        treatMissingData: 'notBreaching',
        tags: tags,
      },
      { parent: this }
    );

    // Failed Login Attempts Metric Filter
    new aws.cloudwatch.LogMetricFilter(
      `${name}-failed-login-filter`,
      {
        name: `failed-logins-${environmentSuffix}`,
        logGroupName: apiLogGroup.name,
        pattern: '[timestamp, request_id, level, event_type=LOGIN_FAILED, ...]',
        metricTransformation: {
          name: 'FailedLoginAttempts',
          namespace: `Banking/${environmentSuffix}`,
          value: '1',
          defaultValue: '0',
          unit: 'Count',
        },
      },
      { parent: this }
    );

    // Failed Login Alarm
    new aws.cloudwatch.MetricAlarm(
      `${name}-failed-login-alarm`,
      {
        name: `failed-logins-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'FailedLoginAttempts',
        namespace: `Banking/${environmentSuffix}`,
        period: 300,
        statistic: 'Sum',
        threshold: 10,
        alarmDescription:
          'Alert when failed login attempts exceed 10 in 5 minutes',
        alarmActions: [alertTopic.arn],
        treatMissingData: 'notBreaching',
        tags: tags,
      },
      { parent: this }
    );

    // High-Value Transaction Metric Filter
    new aws.cloudwatch.LogMetricFilter(
      `${name}-high-value-txn-filter`,
      {
        name: `high-value-transactions-${environmentSuffix}`,
        logGroupName: apiLogGroup.name,
        pattern:
          '[timestamp, request_id, level, event_type=TRANSACTION, amount>10000, ...]',
        metricTransformation: {
          name: 'HighValueTransactions',
          namespace: `Banking/${environmentSuffix}`,
          value: '$amount',
          defaultValue: '0',
          unit: 'None',
        },
      },
      { parent: this }
    );

    // High-Value Transaction Alarm
    new aws.cloudwatch.MetricAlarm(
      `${name}-high-value-txn-alarm`,
      {
        name: `high-value-transactions-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'HighValueTransactions',
        namespace: `Banking/${environmentSuffix}`,
        period: 300,
        statistic: 'Sum',
        threshold: 100000, // Alert if total high-value transactions exceed $100k in 5 min
        alarmDescription: 'Alert on high-value transaction volume',
        alarmActions: [alertTopic.arn],
        treatMissingData: 'notBreaching',
        tags: tags,
      },
      { parent: this }
    );

    // Fraud Detection Event Filter
    new aws.cloudwatch.LogMetricFilter(
      `${name}-fraud-detection-filter`,
      {
        name: `fraud-detected-${environmentSuffix}`,
        logGroupName: apiLogGroup.name,
        pattern:
          '[timestamp, request_id, level, event_type=FRAUD_DETECTED, fraud_score>75, ...]',
        metricTransformation: {
          name: 'FraudDetected',
          namespace: `Banking/${environmentSuffix}`,
          value: '1',
          defaultValue: '0',
          unit: 'Count',
        },
      },
      { parent: this }
    );

    // Fraud Detection Alarm (critical alert)
    new aws.cloudwatch.MetricAlarm(
      `${name}-fraud-detection-alarm`,
      {
        name: `fraud-detected-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'FraudDetected',
        namespace: `Banking/${environmentSuffix}`,
        period: 60, // 1 minute for faster response
        statistic: 'Sum',
        threshold: 0, // Alert on any fraud detection
        alarmDescription: 'Critical: Fraud detected in transaction processing',
        alarmActions: [alertTopic.arn],
        treatMissingData: 'notBreaching',
        tags: tags,
      },
      { parent: this }
    );

    //  CloudWatch Dashboard
    const dashboard = new aws.cloudwatch.Dashboard(
      `${name}-dashboard`,
      {
        dashboardName: `banking-platform-${environmentSuffix}`,
        dashboardBody: pulumi
          .all([
            resourceArns.ecsCluster,
            resourceArns.apiGateway,
            resourceArns.loadBalancer,
            resourceArns.auroraCluster,
            resourceArns.dynamoDbTable,
            resourceArns.kinesisStream,
          ])
          .apply(
            ([
              _ecsCluster,
              _apiGateway,
              _loadBalancer,
              _auroraCluster,
              _dynamoDbTable,
              _kinesisStream,
            ]) =>
              JSON.stringify({
                widgets: [
                  // API Gateway Metrics
                  {
                    type: 'metric',
                    properties: {
                      metrics: [
                        [
                          'AWS/ApiGateway',
                          'Count',
                          { stat: 'Sum', label: 'Total Requests' },
                        ],
                        ['.', '4XXError', { stat: 'Sum', label: '4XX Errors' }],
                        ['.', '5XXError', { stat: 'Sum', label: '5XX Errors' }],
                        [
                          '.',
                          'Latency',
                          { stat: 'Average', label: 'Avg Latency' },
                        ],
                      ],
                      period: 300,
                      stat: 'Sum',
                      region: regions.primary,
                      title: 'API Gateway Metrics',
                      yAxis: {
                        left: {
                          label: 'Count',
                        },
                      },
                    },
                    width: 12,
                    height: 6,
                    x: 0,
                    y: 0,
                  },
                  // ECS Metrics
                  {
                    type: 'metric',
                    properties: {
                      metrics: [
                        [
                          'AWS/ECS',
                          'CPUUtilization',
                          { stat: 'Average', label: 'CPU Utilization' },
                        ],
                        [
                          '.',
                          'MemoryUtilization',
                          { stat: 'Average', label: 'Memory Utilization' },
                        ],
                      ],
                      period: 300,
                      stat: 'Average',
                      region: regions.primary,
                      title: 'ECS Cluster Metrics',
                      yAxis: {
                        left: {
                          label: 'Percent',
                          min: 0,
                          max: 100,
                        },
                      },
                    },
                    width: 12,
                    height: 6,
                    x: 12,
                    y: 0,
                  },
                  // ALB Metrics
                  {
                    type: 'metric',
                    properties: {
                      metrics: [
                        [
                          'AWS/ApplicationELB',
                          'RequestCount',
                          { stat: 'Sum', label: 'Requests' },
                        ],
                        [
                          '.',
                          'TargetResponseTime',
                          { stat: 'Average', label: 'Response Time' },
                        ],
                        [
                          '.',
                          'HTTPCode_Target_4XX_Count',
                          { stat: 'Sum', label: '4XX' },
                        ],
                        [
                          '.',
                          'HTTPCode_Target_5XX_Count',
                          { stat: 'Sum', label: '5XX' },
                        ],
                      ],
                      period: 300,
                      stat: 'Sum',
                      region: regions.primary,
                      title: 'Load Balancer Metrics',
                    },
                    width: 12,
                    height: 6,
                    x: 0,
                    y: 6,
                  },
                  // RDS Aurora Metrics
                  {
                    type: 'metric',
                    properties: {
                      metrics: [
                        [
                          'AWS/RDS',
                          'CPUUtilization',
                          { stat: 'Average', label: 'CPU' },
                        ],
                        [
                          '.',
                          'DatabaseConnections',
                          { stat: 'Average', label: 'Connections' },
                        ],
                        [
                          '.',
                          'ReadLatency',
                          { stat: 'Average', label: 'Read Latency' },
                        ],
                        [
                          '.',
                          'WriteLatency',
                          { stat: 'Average', label: 'Write Latency' },
                        ],
                      ],
                      period: 300,
                      stat: 'Average',
                      region: regions.primary,
                      title: 'Aurora Database Metrics',
                    },
                    width: 12,
                    height: 6,
                    x: 12,
                    y: 6,
                  },
                  // DynamoDB Metrics
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
                        [
                          '.',
                          'UserErrors',
                          { stat: 'Sum', label: 'User Errors' },
                        ],
                        [
                          '.',
                          'SystemErrors',
                          { stat: 'Sum', label: 'System Errors' },
                        ],
                      ],
                      period: 300,
                      stat: 'Sum',
                      region: regions.primary,
                      title: 'DynamoDB Metrics',
                    },
                    width: 12,
                    height: 6,
                    x: 0,
                    y: 12,
                  },
                  // Kinesis Metrics
                  {
                    type: 'metric',
                    properties: {
                      metrics: [
                        [
                          'AWS/Kinesis',
                          'IncomingRecords',
                          { stat: 'Sum', label: 'Incoming Records' },
                        ],
                        [
                          '.',
                          'IncomingBytes',
                          { stat: 'Sum', label: 'Incoming Bytes' },
                        ],
                        [
                          '.',
                          'GetRecords.Success',
                          { stat: 'Sum', label: 'Successful Gets' },
                        ],
                        [
                          '.',
                          'PutRecord.Success',
                          { stat: 'Sum', label: 'Successful Puts' },
                        ],
                      ],
                      period: 300,
                      stat: 'Sum',
                      region: regions.primary,
                      title: 'Kinesis Stream Metrics',
                    },
                    width: 12,
                    height: 6,
                    x: 12,
                    y: 12,
                  },
                  // Lambda Metrics
                  {
                    type: 'metric',
                    properties: {
                      metrics: [
                        [
                          'AWS/Lambda',
                          'Invocations',
                          { stat: 'Sum', label: 'Invocations' },
                        ],
                        ['.', 'Errors', { stat: 'Sum', label: 'Errors' }],
                        [
                          '.',
                          'Duration',
                          { stat: 'Average', label: 'Duration' },
                        ],
                        ['.', 'Throttles', { stat: 'Sum', label: 'Throttles' }],
                        [
                          '.',
                          'ConcurrentExecutions',
                          { stat: 'Maximum', label: 'Concurrent Executions' },
                        ],
                      ],
                      period: 300,
                      stat: 'Sum',
                      region: regions.primary,
                      title: 'Lambda Function Metrics',
                    },
                    width: 24,
                    height: 6,
                    x: 0,
                    y: 18,
                  },
                  // Custom Banking Metrics
                  {
                    type: 'metric',
                    properties: {
                      metrics: [
                        [
                          `Banking/${environmentSuffix}`,
                          'TransactionErrors',
                          { stat: 'Sum', label: 'Transaction Errors' },
                        ],
                        [
                          '.',
                          'FailedLoginAttempts',
                          { stat: 'Sum', label: 'Failed Logins' },
                        ],
                        [
                          '.',
                          'FraudDetected',
                          { stat: 'Sum', label: 'Fraud Detected' },
                        ],
                        [
                          '.',
                          'HighValueTransactions',
                          { stat: 'Sum', label: 'High-Value Txns' },
                        ],
                      ],
                      period: 300,
                      stat: 'Sum',
                      region: regions.primary,
                      title: 'Banking Application Metrics',
                    },
                    width: 24,
                    height: 6,
                    x: 0,
                    y: 24,
                  },
                ],
              })
          ),
      },
      { parent: this }
    );

    // CloudWatch Alarms

    // API Gateway 5XX Error Alarm
    const api5xxAlarm = new aws.cloudwatch.MetricAlarm(
      `${name}-api-5xx-alarm`,
      {
        name: `api-5xx-errors-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: '5XXError',
        namespace: 'AWS/ApiGateway',
        period: 300,
        statistic: 'Sum',
        threshold: 10,
        alarmDescription: 'Alert when API Gateway has more than 10 5XX errors',
        alarmActions: [alertTopic.arn],
        treatMissingData: 'notBreaching',
        tags: tags,
      },
      { parent: this }
    );

    // API Gateway Latency Alarm
    const apiLatencyAlarm = new aws.cloudwatch.MetricAlarm(
      `${name}-api-latency-alarm`,
      {
        name: `api-high-latency-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 3,
        metricName: 'Latency',
        namespace: 'AWS/ApiGateway',
        period: 300,
        statistic: 'Average',
        threshold: 1000, // 1000ms threshold
        alarmDescription: 'Alert when API Gateway latency exceeds 1000ms',
        alarmActions: [alertTopic.arn],
        treatMissingData: 'notBreaching',
        tags: tags,
      },
      { parent: this }
    );

    // ECS CPU Utilization Alarm
    const ecsCpuAlarm = new aws.cloudwatch.MetricAlarm(
      `${name}-ecs-cpu-alarm`,
      {
        name: `ecs-high-cpu-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/ECS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'Alert when ECS CPU utilization exceeds 80%',
        alarmActions: [alertTopic.arn],
        tags: tags,
      },
      { parent: this }
    );

    // ECS Memory Utilization Alarm
    const ecsMemoryAlarm = new aws.cloudwatch.MetricAlarm(
      `${name}-ecs-memory-alarm`,
      {
        name: `ecs-high-memory-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'MemoryUtilization',
        namespace: 'AWS/ECS',
        period: 300,
        statistic: 'Average',
        threshold: 85,
        alarmDescription: 'Alert when ECS memory utilization exceeds 85%',
        alarmActions: [alertTopic.arn],
        tags: tags,
      },
      { parent: this }
    );

    // ALB Target 5XX Errors
    const alb5xxAlarm = new aws.cloudwatch.MetricAlarm(
      `${name}-alb-5xx-alarm`,
      {
        name: `alb-target-5xx-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'HTTPCode_Target_5XX_Count',
        namespace: 'AWS/ApplicationELB',
        period: 300,
        statistic: 'Sum',
        threshold: 20,
        alarmDescription: 'Alert when ALB target 5XX errors exceed 20',
        alarmActions: [alertTopic.arn],
        treatMissingData: 'notBreaching',
        tags: tags,
      },
      { parent: this }
    );

    // ALB Target Response Time
    new aws.cloudwatch.MetricAlarm(
      `${name}-alb-response-time-alarm`,
      {
        name: `alb-high-response-time-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 3,
        metricName: 'TargetResponseTime',
        namespace: 'AWS/ApplicationELB',
        period: 300,
        statistic: 'Average',
        threshold: 2, // 2 seconds
        alarmDescription:
          'Alert when ALB target response time exceeds 2 seconds',
        alarmActions: [alertTopic.arn],
        treatMissingData: 'notBreaching',
        tags: tags,
      },
      { parent: this }
    );

    // ALB Unhealthy Host Count
    new aws.cloudwatch.MetricAlarm(
      `${name}-alb-unhealthy-hosts-alarm`,
      {
        name: `alb-unhealthy-hosts-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'UnHealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 300,
        statistic: 'Average',
        threshold: 0,
        alarmDescription:
          'Alert when there are unhealthy targets behind the ALB',
        alarmActions: [alertTopic.arn],
        treatMissingData: 'notBreaching',
        tags: tags,
      },
      { parent: this }
    );

    // RDS Aurora CPU Utilization
    const rdsAuroraCpuAlarm = new aws.cloudwatch.MetricAlarm(
      `${name}-aurora-cpu-alarm`,
      {
        name: `aurora-high-cpu-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'Alert when Aurora CPU utilization exceeds 80%',
        alarmActions: [alertTopic.arn],
        tags: tags,
      },
      { parent: this }
    );

    // RDS Aurora Database Connections
    new aws.cloudwatch.MetricAlarm(
      `${name}-aurora-connections-alarm`,
      {
        name: `aurora-high-connections-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'DatabaseConnections',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'Alert when Aurora database connections exceed 80',
        alarmActions: [alertTopic.arn],
        tags: tags,
      },
      { parent: this }
    );

    // RDS Aurora Read Latency
    new aws.cloudwatch.MetricAlarm(
      `${name}-aurora-read-latency-alarm`,
      {
        name: `aurora-high-read-latency-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 3,
        metricName: 'ReadLatency',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 0.1, // 100ms
        alarmDescription: 'Alert when Aurora read latency exceeds 100ms',
        alarmActions: [alertTopic.arn],
        treatMissingData: 'notBreaching',
        tags: tags,
      },
      { parent: this }
    );

    // RDS Aurora Write Latency
    new aws.cloudwatch.MetricAlarm(
      `${name}-aurora-write-latency-alarm`,
      {
        name: `aurora-high-write-latency-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 3,
        metricName: 'WriteLatency',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 0.1, // 100ms
        alarmDescription: 'Alert when Aurora write latency exceeds 100ms',
        alarmActions: [alertTopic.arn],
        treatMissingData: 'notBreaching',
        tags: tags,
      },
      { parent: this }
    );

    // RDS Aurora Free Storage Space
    new aws.cloudwatch.MetricAlarm(
      `${name}-aurora-storage-alarm`,
      {
        name: `aurora-low-storage-${environmentSuffix}`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 1,
        metricName: 'FreeLocalStorage',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 10737418240, // 10GB in bytes
        alarmDescription:
          'Alert when Aurora free storage space falls below 10GB',
        alarmActions: [alertTopic.arn],
        tags: tags,
      },
      { parent: this }
    );

    // DynamoDB Read Throttle Events
    new aws.cloudwatch.MetricAlarm(
      `${name}-dynamodb-read-throttle-alarm`,
      {
        name: `dynamodb-read-throttles-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'ReadThrottleEvents',
        namespace: 'AWS/DynamoDB',
        period: 300,
        statistic: 'Sum',
        threshold: 10,
        alarmDescription: 'Alert when DynamoDB read throttle events exceed 10',
        alarmActions: [alertTopic.arn],
        treatMissingData: 'notBreaching',
        tags: tags,
      },
      { parent: this }
    );

    // DynamoDB Write Throttle Events
    new aws.cloudwatch.MetricAlarm(
      `${name}-dynamodb-write-throttle-alarm`,
      {
        name: `dynamodb-write-throttles-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'WriteThrottleEvents',
        namespace: 'AWS/DynamoDB',
        period: 300,
        statistic: 'Sum',
        threshold: 10,
        alarmDescription: 'Alert when DynamoDB write throttle events exceed 10',
        alarmActions: [alertTopic.arn],
        treatMissingData: 'notBreaching',
        tags: tags,
      },
      { parent: this }
    );

    // DynamoDB System Errors
    const dynamoSystemErrorsAlarm = new aws.cloudwatch.MetricAlarm(
      `${name}-dynamodb-system-errors-alarm`,
      {
        name: `dynamodb-system-errors-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'SystemErrors',
        namespace: 'AWS/DynamoDB',
        period: 300,
        statistic: 'Sum',
        threshold: 0,
        alarmDescription: 'Alert on any DynamoDB system errors',
        alarmActions: [alertTopic.arn],
        treatMissingData: 'notBreaching',
        tags: tags,
      },
      { parent: this }
    );

    // Kinesis Iterator Age
    new aws.cloudwatch.MetricAlarm(
      `${name}-kinesis-iterator-age-alarm`,
      {
        name: `kinesis-high-iterator-age-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'GetRecords.IteratorAgeMilliseconds',
        namespace: 'AWS/Kinesis',
        period: 300,
        statistic: 'Maximum',
        threshold: 60000, // 60 seconds
        alarmDescription: 'Alert when Kinesis iterator age exceeds 60 seconds',
        alarmActions: [alertTopic.arn],
        treatMissingData: 'notBreaching',
        tags: tags,
      },
      { parent: this }
    );

    // Kinesis Put Records Failed
    new aws.cloudwatch.MetricAlarm(
      `${name}-kinesis-put-failed-alarm`,
      {
        name: `kinesis-put-failed-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'PutRecords.FailedRecords',
        namespace: 'AWS/Kinesis',
        period: 300,
        statistic: 'Sum',
        threshold: 10,
        alarmDescription: 'Alert when Kinesis failed put records exceed 10',
        alarmActions: [alertTopic.arn],
        treatMissingData: 'notBreaching',
        tags: tags,
      },
      { parent: this }
    );

    // Lambda Errors
    new aws.cloudwatch.MetricAlarm(
      `${name}-lambda-errors-alarm`,
      {
        name: `lambda-errors-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Sum',
        threshold: 10,
        alarmDescription: 'Alert when Lambda errors exceed 10',
        alarmActions: [alertTopic.arn],
        treatMissingData: 'notBreaching',
        tags: tags,
      },
      { parent: this }
    );

    // Lambda Throttles
    new aws.cloudwatch.MetricAlarm(
      `${name}-lambda-throttles-alarm`,
      {
        name: `lambda-throttles-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'Throttles',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Sum',
        threshold: 5,
        alarmDescription: 'Alert when Lambda throttles exceed 5',
        alarmActions: [alertTopic.arn],
        treatMissingData: 'notBreaching',
        tags: tags,
      },
      { parent: this }
    );

    // Lambda Duration
    new aws.cloudwatch.MetricAlarm(
      `${name}-lambda-duration-alarm`,
      {
        name: `lambda-high-duration-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 3,
        metricName: 'Duration',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Average',
        threshold: 10000, // 10 seconds
        alarmDescription: 'Alert when Lambda duration exceeds 10 seconds',
        alarmActions: [alertTopic.arn],
        treatMissingData: 'notBreaching',
        tags: tags,
      },
      { parent: this }
    );

    // Composite Alarm for Critical System Health
    new aws.cloudwatch.CompositeAlarm(
      `${name}-critical-system-health`,
      {
        alarmName: `critical-system-health-${environmentSuffix}`,
        alarmDescription: 'Composite alarm for critical system health issues',
        alarmActions: [alertTopic.arn],
        alarmRule: pulumi.interpolate`ALARM(${api5xxAlarm.name}) OR ALARM(${alb5xxAlarm.name}) OR ALARM(${rdsAuroraCpuAlarm.name}) OR ALARM(${dynamoSystemErrorsAlarm.name})`,
        tags: tags,
      },
      { parent: this }
    );

    // Composite Alarm for Performance Degradation
    new aws.cloudwatch.CompositeAlarm(
      `${name}-performance-degradation`,
      {
        alarmName: `performance-degradation-${environmentSuffix}`,
        alarmDescription: 'Composite alarm for performance degradation',
        alarmActions: [alertTopic.arn],
        alarmRule: pulumi.interpolate`ALARM(${apiLatencyAlarm.name}) OR ALARM(${ecsCpuAlarm.name}) OR ALARM(${ecsMemoryAlarm.name})`,
        tags: tags,
      },
      { parent: this }
    );

    //  CloudWatch Anomaly Detection
    new aws.cloudwatch.MetricAlarm(
      `${name}-api-anomaly-alarm`,
      {
        name: `api-request-anomaly-${environmentSuffix}`,
        comparisonOperator: 'LessThanLowerOrGreaterThanUpperThreshold',
        evaluationPeriods: 2,
        thresholdMetricId: 'anomaly',
        alarmDescription: 'Alert on anomalous API request patterns',
        alarmActions: [alertTopic.arn],
        treatMissingData: 'notBreaching',
        metricQueries: [
          {
            id: 'requests',
            returnData: true,
            metric: {
              metricName: 'Count',
              namespace: 'AWS/ApiGateway',
              period: 300,
              stat: 'Sum',
            },
          },
          {
            id: 'anomaly',
            returnData: true,
            expression: 'ANOMALY_DETECTION_BAND(requests, 2)',
          },
        ],
        tags: tags,
      },
      { parent: this }
    );

    //  CloudWatch Events for Automated Response
    const eventBridgeRole = new aws.iam.Role(
      `${name}-eventbridge-role`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'events.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: tags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `${name}-eventbridge-policy`,
      {
        role: eventBridgeRole.id,
        policy: pulumi.output(alertTopic.arn).apply(topicArn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['sns:Publish'],
                Resource: [topicArn],
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // EventBridge Rule for ECS Task Failures
    const ecsFailureRule = new aws.cloudwatch.EventRule(
      `${name}-ecs-task-failure-rule`,
      {
        name: `ecs-task-failures-${environmentSuffix}`,
        description: 'Trigger on ECS task state changes to STOPPED',
        eventPattern: JSON.stringify({
          source: ['aws.ecs'],
          'detail-type': ['ECS Task State Change'],
          detail: {
            lastStatus: ['STOPPED'],
            stoppedReason: [{ prefix: '' }],
          },
        }),
        tags: tags,
      },
      { parent: this }
    );

    new aws.cloudwatch.EventTarget(
      `${name}-ecs-failure-target`,
      {
        rule: ecsFailureRule.name,
        arn: alertTopic.arn,
        roleArn: eventBridgeRole.arn,
      },
      { parent: this }
    );

    // EventBridge Rule for RDS Events
    const rdsEventRule = new aws.cloudwatch.EventRule(
      `${name}-rds-event-rule`,
      {
        name: `rds-events-${environmentSuffix}`,
        description: 'Trigger on RDS maintenance and failure events',
        eventPattern: JSON.stringify({
          source: ['aws.rds'],
          'detail-type': ['RDS DB Instance Event', 'RDS DB Cluster Event'],
          detail: {
            EventCategories: ['maintenance', 'failure', 'failover'],
          },
        }),
        tags: tags,
      },
      { parent: this }
    );

    new aws.cloudwatch.EventTarget(
      `${name}-rds-event-target`,
      {
        rule: rdsEventRule.name,
        arn: alertTopic.arn,
        roleArn: eventBridgeRole.arn,
      },
      { parent: this }
    );

    //  CloudWatch Log Insights Queries
    new aws.cloudwatch.QueryDefinition(
      `${name}-error-analysis-query`,
      {
        name: `error-analysis-${environmentSuffix}`,
        queryString: `fields @timestamp, @message, @logStream
| filter @message like /ERROR/ or @message like /Exception/
| sort @timestamp desc
| limit 100`,
      },
      { parent: this }
    );

    new aws.cloudwatch.QueryDefinition(
      `${name}-latency-analysis-query`,
      {
        name: `latency-analysis-${environmentSuffix}`,
        queryString: `fields @timestamp, @message, responseTime
| filter responseTime > 1000
| stats avg(responseTime), max(responseTime), count(*) by bin(5m)
| sort @timestamp desc`,
      },
      { parent: this }
    );

    new aws.cloudwatch.QueryDefinition(
      `${name}-transaction-volume-query`,
      {
        name: `transaction-volume-${environmentSuffix}`,
        queryString: `fields @timestamp, transactionId, amount, status
| filter status = "COMPLETED"
| stats count(*), sum(amount) by bin(1h)
| sort @timestamp desc`,
      },
      { parent: this }
    );

    new aws.cloudwatch.QueryDefinition(
      `${name}-security-events-query`,
      {
        name: `security-events-${environmentSuffix}`,
        queryString: `fields @timestamp, eventType, userId, ipAddress, status
| filter eventType in ["LOGIN_FAILED", "FRAUD_DETECTED", "UNAUTHORIZED_ACCESS"]
| stats count(*) by eventType, bin(1h)
| sort @timestamp desc`,
      },
      { parent: this }
    );

    // Create a Resource Group first

    const resourceGroup = new aws.resourcegroups.Group(
      `${name}-resource-group`,
      {
        name: `banking-${environmentSuffix}`,
        resourceQuery: {
          type: 'TAG_FILTERS_1_0',
          query: JSON.stringify({
            ResourceTypeFilters: ['AWS::AllSupported'],
            TagFilters: [
              {
                Key: 'Environment',
                Values: [environmentSuffix],
              },
            ],
          }),
        },
        tags: tags,
      },
      { parent: this }
    );

    new aws.applicationinsights.Application(
      `${name}-app-insights`,
      {
        resourceGroupName: resourceGroup.name,
        autoConfigEnabled: true,
        autoCreate: true,
        cweMonitorEnabled: true,
        opsCenterEnabled: true,
        opsItemSnsTopicArn: alertTopic.arn,
        tags: tags,
      },
      { parent: this }
    );

    //  Service Level Objectives (SLO) Dashboard
    const sloDashboard = new aws.cloudwatch.Dashboard(
      `${name}-slo-dashboard`,
      {
        dashboardName: `banking-slo-${environmentSuffix}`,
        dashboardBody: JSON.stringify({
          widgets: [
            {
              type: 'metric',
              properties: {
                metrics: [
                  [
                    {
                      expression: '(m1-m2)/m1*100',
                      label: 'API Success Rate',
                      id: 'e1',
                    },
                  ],
                  ['AWS/ApiGateway', 'Count', { id: 'm1', visible: false }],
                  ['.', '5XXError', { id: 'm2', visible: false }],
                ],
                period: 300,
                stat: 'Sum',
                region: regions.primary,
                title: 'API Success Rate SLO (Target: 99.9%)',
                yAxis: {
                  left: {
                    min: 99,
                    max: 100,
                  },
                },
                annotations: {
                  horizontal: [
                    {
                      value: 99.9,
                      label: 'SLO Target',
                      color: '#d62728',
                    },
                  ],
                },
              },
              width: 12,
              height: 6,
              x: 0,
              y: 0,
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  [
                    'AWS/ApiGateway',
                    'Latency',
                    { stat: 'p99', label: 'P99 Latency' },
                  ],
                ],
                period: 300,
                stat: 'Average',
                region: regions.primary,
                title: 'API Latency SLO (P99 Target: <100ms)',
                yAxis: {
                  left: {
                    min: 0,
                  },
                },
                annotations: {
                  horizontal: [
                    {
                      value: 100,
                      label: 'SLO Target',
                      color: '#d62728',
                    },
                  ],
                },
              },
              width: 12,
              height: 6,
              x: 12,
              y: 0,
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  [
                    {
                      expression: '(m1/(m1+m2))*100',
                      label: 'Database Availability',
                      id: 'e1',
                    },
                  ],
                  [
                    'AWS/RDS',
                    'DatabaseConnections',
                    { id: 'm1', stat: 'SampleCount', visible: false },
                  ],
                  [
                    '.',
                    'FailedSQLServerAgentJobsCount',
                    { id: 'm2', visible: false },
                  ],
                ],
                period: 300,
                region: regions.primary,
                title: 'Database Availability SLO (Target: 99.95%)',
                yAxis: {
                  left: {
                    min: 99,
                    max: 100,
                  },
                },
                annotations: {
                  horizontal: [
                    {
                      value: 99.95,
                      label: 'SLO Target',
                      color: '#d62728',
                    },
                  ],
                },
              },
              width: 24,
              height: 6,
              x: 0,
              y: 6,
            },
          ],
        }),
      },
      { parent: this }
    );

    //  Cross-Region Dashboard (if enabled)
    let crossRegionDashboard: aws.cloudwatch.Dashboard | undefined;
    if (enableCrossRegionDashboards && regions.replicas.length > 0) {
      crossRegionDashboard = new aws.cloudwatch.Dashboard(
        `${name}-cross-region-dashboard`,
        {
          dashboardName: `banking-cross-region-${environmentSuffix}`,
          dashboardBody: JSON.stringify({
            widgets: regions.replicas.map((region, index) => ({
              type: 'metric',
              properties: {
                metrics: [
                  [
                    'AWS/ApiGateway',
                    'Count',
                    { stat: 'Sum', region, label: 'API Requests' },
                  ],
                  [
                    '.',
                    '5XXError',
                    { stat: 'Sum', region, label: '5XX Errors' },
                  ],
                  [
                    'AWS/RDS',
                    'CPUUtilization',
                    { stat: 'Average', region, label: 'RDS CPU' },
                  ],
                  [
                    'AWS/DynamoDB',
                    'UserErrors',
                    { stat: 'Sum', region, label: 'DynamoDB Errors' },
                  ],
                ],
                period: 300,
                stat: 'Sum',
                region: region,
                title: `Region ${region} - Overview`,
              },
              width: 12,
              height: 6,
              x: (index % 2) * 12,
              y: Math.floor(index / 2) * 6,
            })),
          }),
        },
        { parent: this }
      );
    }

    // Outputs
    this.dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=${regions.primary}#dashboards:name=${dashboard.dashboardName}`;
    this.snsTopicArn = alertTopic.arn;
    this.xrayGroupName = xrayGroupName;
    this.sloDashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=${regions.primary}#dashboards:name=${sloDashboard.dashboardName}`;

    if (crossRegionDashboard) {
      this.crossRegionDashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=${regions.primary}#dashboards:name=${crossRegionDashboard.dashboardName}`;
    }

    this.registerOutputs({
      dashboardUrl: this.dashboardUrl,
      snsTopicArn: this.snsTopicArn,
      xrayGroupName: this.xrayGroupName,
      sloDashboardUrl: this.sloDashboardUrl,
      crossRegionDashboardUrl: this.crossRegionDashboardUrl,
    });
  }
}
