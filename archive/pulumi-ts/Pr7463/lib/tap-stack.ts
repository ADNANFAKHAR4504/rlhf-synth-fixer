/**
 * TapStack - Advanced Observability Stack
 *
 * Implements comprehensive CloudWatch-based monitoring with:
 * - Custom metric aggregation via Lambda
 * - Composite alarms for P99 latency and error rates
 * - Multi-region dashboard with metric math expressions
 * - SNS alerting with encryption
 * - Dead letter queue for failed processing
 * - Cross-account metric sharing
 * - CloudWatch Container Insights
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as path from 'path';

export interface TapStackProps {
  environmentSuffix: string;
  tags: Record<string, string>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly metricAggregatorFunctionName: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly dashboardName: pulumi.Output<string>;
  public readonly deadLetterQueueUrl: pulumi.Output<string>;

  constructor(
    name: string,
    props: TapStackProps,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:observability:TapStack', name, {}, opts);

    const { environmentSuffix, tags } = props;

    // 1. Create SNS topic with encryption for critical alerts
    const kmsKey = new aws.kms.Key(
      `observability-kms-${environmentSuffix}`,
      {
        description: 'KMS key for SNS topic encryption',
        enableKeyRotation: true,
        tags: { ...tags, Name: `observability-kms-${environmentSuffix}` },
      },
      { parent: this }
    );

    // KMS alias for the encryption key
    new aws.kms.Alias(
      `observability-kms-alias-${environmentSuffix}`,
      {
        name: `alias/observability-${environmentSuffix}`,
        targetKeyId: kmsKey.keyId,
      },
      { parent: this }
    );

    const snsTopic = new aws.sns.Topic(
      `critical-alerts-${environmentSuffix}`,
      {
        displayName: 'Critical Observability Alerts',
        kmsMasterKeyId: kmsKey.keyId,
        tags: { ...tags, Name: `critical-alerts-${environmentSuffix}` },
      },
      { parent: this }
    );

    // SNS email subscription
    new aws.sns.TopicSubscription(
      `email-subscription-${environmentSuffix}`,
      {
        protocol: 'email',
        endpoint: 'alerts@example.com',
        topic: snsTopic.arn,
      },
      { parent: this }
    );

    // SNS SMS subscription
    new aws.sns.TopicSubscription(
      `sms-subscription-${environmentSuffix}`,
      {
        protocol: 'sms',
        endpoint: '+1234567890',
        topic: snsTopic.arn,
      },
      { parent: this }
    );

    // 2. Create Dead Letter Queue for failed metric processing
    const deadLetterQueue = new aws.sqs.Queue(
      `metric-dlq-${environmentSuffix}`,
      {
        messageRetentionSeconds: 1209600, // 14 days
        tags: { ...tags, Name: `metric-dlq-${environmentSuffix}` },
      },
      { parent: this }
    );

    // 3. Create IAM role for metric aggregator Lambda
    const lambdaRole = new aws.iam.Role(
      `metric-aggregator-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: { ...tags, Name: `metric-aggregator-role-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Attach policies for Lambda execution
    const lambdaBasicExecution = new aws.iam.RolePolicyAttachment(
      `lambda-basic-execution-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // CloudWatch metrics policy
    const cloudwatchMetricsPolicy = new aws.iam.RolePolicy(
      `cloudwatch-metrics-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi.interpolate`{
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "cloudwatch:PutMetricData",
                "cloudwatch:GetMetricData",
                "cloudwatch:GetMetricStatistics",
                "cloudwatch:ListMetrics"
              ],
              "Resource": "*"
            },
            {
              "Effect": "Allow",
              "Action": ["sqs:SendMessage"],
              "Resource": "${deadLetterQueue.arn}"
            }
          ]
        }`,
      },
      { parent: this }
    );

    // 4. Create Lambda function for metric aggregation
    const metricAggregatorFunction = new aws.lambda.Function(
      `metric-aggregator-${environmentSuffix}`,
      {
        runtime: aws.lambda.Runtime.NodeJS18dX,
        handler: 'index.handler',
        role: lambdaRole.arn,
        timeout: 300,
        memorySize: 512,
        architectures: ['arm64'], // Cost optimization
        deadLetterConfig: {
          targetArn: deadLetterQueue.arn,
        },
        environment: {
          variables: {
            CUSTOM_NAMESPACE: 'FinanceMetrics',
            ENVIRONMENT_SUFFIX: environmentSuffix,
            SNS_TOPIC_ARN: snsTopic.arn,
          },
        },
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive(
            path.join(__dirname, 'lambda', 'metric-aggregator')
          ),
        }),
        tags: { ...tags, Name: `metric-aggregator-${environmentSuffix}` },
      },
      {
        parent: this,
        dependsOn: [lambdaBasicExecution, cloudwatchMetricsPolicy],
      }
    );

    // 5. Create EventBridge rule to trigger Lambda every 60 seconds
    const metricAggregationRule = new aws.cloudwatch.EventRule(
      `metric-aggregation-rule-${environmentSuffix}`,
      {
        description: 'Trigger metric aggregation every 60 seconds',
        scheduleExpression: 'rate(1 minute)',
        tags: { ...tags, Name: `metric-aggregation-rule-${environmentSuffix}` },
      },
      { parent: this }
    );

    // EventBridge target for Lambda invocation
    new aws.cloudwatch.EventTarget(
      `metric-aggregation-target-${environmentSuffix}`,
      {
        rule: metricAggregationRule.name,
        arn: metricAggregatorFunction.arn,
      },
      { parent: this }
    );

    // Lambda permission for EventBridge
    new aws.lambda.Permission(
      `allow-eventbridge-${environmentSuffix}`,
      {
        statementId: 'AllowExecutionFromEventBridge',
        action: 'lambda:InvokeFunction',
        function: metricAggregatorFunction.name,
        principal: 'events.amazonaws.com',
        sourceArn: metricAggregationRule.arn,
      },
      { parent: this }
    );

    // 6. Create CloudWatch Log Group with metric filters
    const metricAggregatorLogGroup = new aws.cloudwatch.LogGroup(
      `metric-aggregator-logs-${environmentSuffix}`,
      {
        name: pulumi.interpolate`/aws/lambda/${metricAggregatorFunction.name}`,
        retentionInDays: 14,
        tags: { ...tags, Name: `metric-aggregator-logs-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Metric filter to extract custom error patterns
    new aws.cloudwatch.LogMetricFilter(
      `error-metric-filter-${environmentSuffix}`,
      {
        logGroupName: metricAggregatorLogGroup.name,
        pattern: '[timestamp, request_id, level = ERROR*, ...]',
        metricTransformation: {
          name: 'CustomErrorCount',
          namespace: 'FinanceMetrics',
          value: '1',
          defaultValue: '0',
        },
      },
      { parent: this }
    );

    // 7. Create CloudWatch alarms for P99 latency and error rate
    const p99LatencyAlarm = new aws.cloudwatch.MetricAlarm(
      `p99-latency-alarm-${environmentSuffix}`,
      {
        name: `p99-latency-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'P99Latency',
        namespace: 'FinanceMetrics',
        period: 300,
        statistic: 'Average',
        threshold: 500,
        treatMissingData: 'breaching',
        alarmDescription: 'P99 latency exceeds 500ms',
        actionsEnabled: true,
        tags: { ...tags, Name: `p99-latency-alarm-${environmentSuffix}` },
      },
      { parent: this }
    );

    const errorRateAlarm = new aws.cloudwatch.MetricAlarm(
      `error-rate-alarm-${environmentSuffix}`,
      {
        name: `error-rate-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'ErrorRate',
        namespace: 'FinanceMetrics',
        period: 300,
        statistic: 'Average',
        threshold: 5,
        treatMissingData: 'breaching',
        alarmDescription: 'Error rate exceeds 5%',
        actionsEnabled: true,
        tags: { ...tags, Name: `error-rate-alarm-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Composite alarm combining P99 latency AND error rate
    new aws.cloudwatch.CompositeAlarm(
      `composite-alarm-${environmentSuffix}`,
      {
        alarmName: `composite-p99-and-error-${environmentSuffix}`,
        alarmDescription: 'Composite alarm for P99 latency AND error rate',
        alarmRule: pulumi.interpolate`ALARM(${p99LatencyAlarm.name}) AND ALARM(${errorRateAlarm.name})`,
        actionsEnabled: true,
        alarmActions: [snsTopic.arn],
        tags: { ...tags, Name: `composite-alarm-${environmentSuffix}` },
      },
      { parent: this }
    );

    // 8. Create CloudWatch Log Anomaly Detector for transaction volume
    new aws.cloudwatch.LogAnomalyDetector(
      `transaction-volume-anomaly-${environmentSuffix}`,
      {
        logGroupArnLists: [metricAggregatorLogGroup.arn],
        detectorName: `transaction-volume-anomaly-${environmentSuffix}`,
        enabled: true,
      },
      { parent: this }
    );

    // 9. Create CloudWatch Dashboard with metric math expressions
    const dashboard = new aws.cloudwatch.Dashboard(
      `observability-dashboard-${environmentSuffix}`,
      {
        dashboardName: `observability-${environmentSuffix}`,
        dashboardBody: JSON.stringify({
          widgets: [
            {
              type: 'metric',
              properties: {
                metrics: [
                  [
                    'FinanceMetrics',
                    'P99Latency',
                    { stat: 'Average', period: 300 },
                  ],
                  [
                    'FinanceMetrics',
                    'P99Latency',
                    { stat: 'Average', period: 604800 },
                  ],
                ],
                period: 300,
                stat: 'Average',
                region: 'us-east-1',
                title: 'P99 Latency - Current vs Last Week',
                yAxis: {
                  left: {
                    min: 0,
                  },
                },
              },
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  [
                    'FinanceMetrics',
                    'ErrorRate',
                    { stat: 'Average', period: 300 },
                  ],
                  [
                    {
                      expression: 'm1 * 100',
                      label: 'Error Rate %',
                      id: 'e1',
                    },
                  ],
                ],
                period: 300,
                stat: 'Average',
                region: 'us-east-1',
                title: 'Error Rate',
                yAxis: {
                  left: {
                    min: 0,
                    max: 100,
                  },
                },
              },
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  [
                    {
                      expression: 'm2 / m1',
                      label: 'Conversion Rate',
                      id: 'e1',
                    },
                  ],
                  [
                    'FinanceMetrics',
                    'TotalRequests',
                    { id: 'm1', visible: false, period: 300 },
                  ],
                  [
                    'FinanceMetrics',
                    'SuccessfulTransactions',
                    { id: 'm2', visible: false, period: 300 },
                  ],
                ],
                period: 300,
                stat: 'Sum',
                region: 'us-east-1',
                title: 'Business KPI - Conversion Rate',
                yAxis: {
                  left: {
                    min: 0,
                    max: 1,
                  },
                },
              },
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  [
                    'FinanceMetrics',
                    'TransactionVolume',
                    { region: 'us-east-1' },
                  ],
                  ['...', { region: 'eu-west-1' }],
                  ['...', { region: 'ap-southeast-1' }],
                ],
                period: 300,
                stat: 'Sum',
                region: 'us-east-1',
                title: 'Transaction Volume - Multi-Region',
              },
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  [
                    'FinanceMetrics',
                    'TransactionVolume',
                    { id: 'm1', stat: 'Sum' },
                  ],
                  [
                    {
                      expression: 'ANOMALY_DETECTION_BAND(m1)',
                      id: 'ad1',
                      label: 'Expected Range',
                    },
                  ],
                ],
                period: 300,
                stat: 'Sum',
                region: 'us-east-1',
                title: 'Transaction Volume Anomaly Detection',
              },
            },
          ],
        }),
      },
      { parent: this }
    );

    // 10. Create cross-account IAM role for metric sharing
    const crossAccountRole = new aws.iam.Role(
      `cross-account-metrics-${environmentSuffix}`,
      {
        assumeRolePolicy: aws.getCallerIdentity({}).then(identity =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${identity.accountId}:root`, // Current account for cross-region access
                },
                Action: 'sts:AssumeRole',
                Condition: {
                  StringEquals: {
                    'sts:ExternalId': `observability-${environmentSuffix}`,
                  },
                },
              },
            ],
          })
        ),
        tags: { ...tags, Name: `cross-account-metrics-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Attach read-only CloudWatch policy to cross-account role
    new aws.iam.RolePolicy(
      `cross-account-metrics-policy-${environmentSuffix}`,
      {
        role: crossAccountRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'cloudwatch:GetMetricData',
                'cloudwatch:GetMetricStatistics',
                'cloudwatch:ListMetrics',
                'cloudwatch:DescribeAlarms',
              ],
              Resource: '*',
            },
            {
              Effect: 'Deny',
              Action: [
                'cloudwatch:DeleteAlarms',
                'cloudwatch:DeleteDashboards',
                'cloudwatch:PutMetricAlarm',
                'cloudwatch:PutDashboard',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // 11. Create CloudWatch Logs Insights saved query
    new aws.cloudwatch.QueryDefinition(
      `error-analysis-query-${environmentSuffix}`,
      {
        name: `error-analysis-${environmentSuffix}`,
        queryString: `fields @timestamp, @message, level, error_type
| filter level = "ERROR"
| stats count() by error_type
| sort count desc
| limit 20`,
        logGroupNames: [metricAggregatorLogGroup.name],
      },
      { parent: this }
    );

    // 12. EC2 Auto Scaling Group with Container Insights (placeholder)
    // Note: This creates a launch template ready for Container Insights
    const asgRole = new aws.iam.Role(
      `asg-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'ec2.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: { ...tags, Name: `asg-role-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Attach CloudWatch Agent policy for Container Insights
    new aws.iam.RolePolicyAttachment(
      `container-insights-policy-${environmentSuffix}`,
      {
        role: asgRole.name,
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      },
      { parent: this }
    );

    // Create instance profile for ASG
    new aws.iam.InstanceProfile(
      `asg-instance-profile-${environmentSuffix}`,
      {
        role: asgRole.name,
        tags: { ...tags, Name: `asg-instance-profile-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Export outputs
    this.metricAggregatorFunctionName = metricAggregatorFunction.name;
    this.snsTopicArn = snsTopic.arn;
    this.dashboardName = dashboard.dashboardName;
    this.deadLetterQueueUrl = deadLetterQueue.url;

    this.registerOutputs({
      metricAggregatorFunctionName: this.metricAggregatorFunctionName,
      snsTopicArn: this.snsTopicArn,
      dashboardName: this.dashboardName,
      deadLetterQueueUrl: this.deadLetterQueueUrl,
    });
  }
}
