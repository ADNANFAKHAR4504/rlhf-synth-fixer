import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackArgs {
  environment?: string;
  owner?: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly kmsKeyArn: pulumi.Output<string>;
  public readonly logGroupArns: pulumi.Output<string[]>;
  public readonly dashboardUrl: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly lambdaFunctionArn: pulumi.Output<string>;

  constructor(
    name: string,
    args?: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:monitoring:TapStack', name, {}, opts);

    const environment = args?.environment || 'production';
    const owner = args?.owner || 'monitoring-team';

    const defaultTags = {
      Environment: environment,
      Service: 'monitoring',
      Owner: owner,
    };

    // 1. KMS Key for log encryption
    const kmsKey = new aws.kms.Key(
      'monitoring-kms-key',
      {
        description: 'KMS key for CloudWatch Logs encryption',
        enableKeyRotation: true,
        tags: defaultTags,
      },
      { parent: this }
    );

    // Create KMS alias for easier key reference
    new aws.kms.Alias(
      'monitoring-kms-alias',
      {
        name: 'alias/monitoring-logs',
        targetKeyId: kmsKey.id,
      },
      { parent: this }
    );

    // KMS Key Policy for CloudWatch Logs
    const kmsKeyPolicy = new aws.kms.KeyPolicy(
      'monitoring-kms-policy',
      {
        keyId: kmsKey.id,
        policy: pulumi
          .all([kmsKey.arn, aws.getCallerIdentity({})])
          .apply(([_keyArn, caller]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'Enable IAM User Permissions',
                  Effect: 'Allow',
                  Principal: {
                    AWS: `arn:aws:iam::${caller.accountId}:root`,
                  },
                  Action: 'kms:*',
                  Resource: '*',
                },
                {
                  Sid: 'Allow CloudWatch Logs',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'logs.amazonaws.com',
                  },
                  Action: [
                    'kms:Encrypt',
                    'kms:Decrypt',
                    'kms:ReEncrypt*',
                    'kms:GenerateDataKey*',
                    'kms:CreateGrant',
                    'kms:DescribeKey',
                  ],
                  Resource: '*',
                  Condition: {
                    ArnLike: {
                      'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:us-east-1:${caller.accountId}:log-group:*`,
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // 2. CloudWatch Log Groups for microservices (30-day retention, KMS encrypted)
    const services = ['payment-api', 'fraud-detector', 'notification-service'];
    const logGroups: aws.cloudwatch.LogGroup[] = [];

    services.forEach(service => {
      const logGroup = new aws.cloudwatch.LogGroup(
        `${service}-log-group`,
        {
          name: `/aws/ecs/${service}`,
          retentionInDays: 30,
          kmsKeyId: kmsKey.arn,
          tags: {
            ...defaultTags,
            Service: service,
          },
        },
        { parent: this, dependsOn: [kmsKeyPolicy] }
      );

      logGroups.push(logGroup);

      // 3. Metric Filters for custom business metrics
      new aws.cloudwatch.LogMetricFilter(
        `${service}-metric-filter`,
        {
          logGroupName: logGroup.name,
          name: `${service}-success-rate`,
          pattern:
            service === 'payment-api'
              ? '[time, request_id, status=SUCCESS, ...]'
              : service === 'fraud-detector'
                ? '[time, request_id, detection=FRAUD_DETECTED, ...]'
                : '[time, request_id, delivery=DELIVERED, ...]',
          metricTransformation: {
            name: `${service}-success-count`,
            namespace: `CustomMetrics/${service}`,
            value: '1',
            defaultValue: '0',
          },
        },
        { parent: this }
      );
    });

    // 2. X-Ray Sampling Rules (100% errors, 10% success)
    new aws.xray.SamplingRule(
      'monitoring-sampling-rule',
      {
        ruleName: 'payment-processing-sampling',
        priority: 1000,
        version: 1,
        reservoirSize: 1,
        fixedRate: 0.1,
        urlPath: '*',
        host: '*',
        httpMethod: '*',
        serviceName: '*',
        serviceType: '*',
        resourceArn: '*',
        attributes: {},
        tags: defaultTags,
      },
      { parent: this }
    );

    // Additional rule for 100% error sampling
    new aws.xray.SamplingRule(
      'monitoring-error-sampling-rule',
      {
        ruleName: 'pay-processing-err-sample',
        priority: 100,
        version: 1,
        reservoirSize: 1,
        fixedRate: 1.0,
        urlPath: '*',
        host: '*',
        httpMethod: '*',
        serviceName: '*',
        serviceType: '*',
        resourceArn: '*',
        attributes: {
          error: 'true',
        },
        tags: defaultTags,
      },
      { parent: this }
    );

    // 4. Lambda function for metric aggregation (ARM-based)
    const lambdaRole = new aws.iam.Role(
      'metric-aggregation-lambda-role',
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Effect: 'Allow',
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      'lambda-basic-execution',
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    const lambdaPolicy = new aws.iam.RolePolicy(
      'metric-aggregation-policy',
      {
        role: lambdaRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'cloudwatch:PutMetricData',
                'cloudwatch:GetMetricStatistics',
                'cloudwatch:ListMetrics',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // Lambda function code
    const lambdaCode = `
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

exports.handler = async (event) => {
    console.log('Aggregating metrics across services...');
    
    const services = ['payment-api', 'fraud-detector', 'notification-service'];
    const timestamp = new Date();
    
    try {
        const metricData = [];
        
        for (const service of services) {
            // Get current metric value for this service
            const params = {
                Namespace: \`CustomMetrics/\${service}\`,
                MetricName: \`\${service}-success-count\`,
                StartTime: new Date(Date.now() - 5 * 60 * 1000),
                EndTime: timestamp,
                Period: 300,
                Statistics: ['Sum']
            };
            
            const data = await cloudwatch.getMetricStatistics(params).promise();
            const sum = data.Datapoints.length > 0 ? data.Datapoints[0].Sum : 0;
            
            metricData.push({
                MetricName: 'AggregatedSuccessCount',
                Value: sum,
                Unit: 'Count',
                Timestamp: timestamp,
                Dimensions: [
                    { Name: 'Service', Value: service },
                    { Name: 'AggregationType', Value: 'CrossService' }
                ]
            });
        }
        
        // Put aggregated metrics
        await cloudwatch.putMetricData({
            Namespace: 'CustomMetrics/Aggregated',
            MetricData: metricData
        }).promise();
        
        console.log(\`Successfully aggregated \${metricData.length} metrics\`);
        
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Metrics aggregated successfully', count: metricData.length })
        };
    } catch (error) {
        console.error('Error aggregating metrics:', error);
        throw error;
    }
};
`;

    const metricAggregationLambda = new aws.lambda.Function(
      'metric-aggregation-lambda',
      {
        runtime: 'nodejs18.x',
        role: lambdaRole.arn,
        handler: 'index.handler',
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(lambdaCode),
        }),
        architectures: ['arm64'], // ARM-based Graviton2
        timeout: 60,
        memorySize: 256,
        environment: {
          variables: {
            ENVIRONMENT: environment,
          },
        },
        tags: defaultTags,
      },
      { parent: this, dependsOn: [lambdaPolicy] }
    );

    // 10. EventBridge rule to trigger Lambda every 5 minutes
    const scheduledRule = new aws.cloudwatch.EventRule(
      'metric-aggregation-schedule',
      {
        description: 'Trigger metric aggregation every 5 minutes',
        scheduleExpression: 'rate(5 minutes)',
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.cloudwatch.EventTarget(
      'metric-aggregation-target',
      {
        rule: scheduledRule.name,
        arn: metricAggregationLambda.arn,
      },
      { parent: this }
    );

    new aws.lambda.Permission(
      'allow-eventbridge',
      {
        action: 'lambda:InvokeFunction',
        function: metricAggregationLambda.name,
        principal: 'events.amazonaws.com',
        sourceArn: scheduledRule.arn,
      },
      { parent: this }
    );

    // 6. SNS FIFO Topic for critical alerts
    const snsTopic = new aws.sns.Topic(
      'critical-alerts-topic',
      {
        name: 'critical-alerts.fifo',
        fifoTopic: true,
        contentBasedDeduplication: true,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 7. Composite CloudWatch Alarms
    const paymentFailureAlarm = new aws.cloudwatch.MetricAlarm(
      'payment-failure-alarm',
      {
        name: 'payment-api-high-failure-rate',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'payment-api-success-count',
        namespace: 'CustomMetrics/payment-api',
        period: 300,
        statistic: 'Sum',
        threshold: 10,
        treatMissingData: 'notBreaching',
        alarmDescription: 'Payment API failure rate is too high',
        tags: defaultTags,
      },
      { parent: this }
    );

    const fraudSpikeAlarm = new aws.cloudwatch.MetricAlarm(
      'fraud-spike-alarm',
      {
        name: 'fraud-detector-spike',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'fraud-detector-success-count',
        namespace: 'CustomMetrics/fraud-detector',
        period: 300,
        statistic: 'Sum',
        threshold: 50,
        treatMissingData: 'notBreaching',
        alarmDescription: 'Fraud detection spike detected',
        tags: defaultTags,
      },
      { parent: this }
    );

    // Composite alarm combining multiple conditions
    new aws.cloudwatch.CompositeAlarm(
      'service-degradation-alarm',
      {
        alarmName: 'service-degradation-composite',
        alarmDescription: 'Composite alarm for service degradation',
        alarmRule: pulumi.interpolate`ALARM(${paymentFailureAlarm.arn}) OR ALARM(${fraudSpikeAlarm.arn})`,
        alarmActions: [snsTopic.arn],
        tags: defaultTags,
      },
      { parent: this }
    );

    // 5 & 8. CloudWatch Dashboard with metric math
    const dashboard = new aws.cloudwatch.Dashboard(
      'monitoring-dashboard',
      {
        dashboardName: 'payment-processing-monitoring',
        dashboardBody: pulumi
          .all(logGroups.map(lg => lg.name))
          .apply(logGroupNames =>
            JSON.stringify({
              widgets: [
                {
                  type: 'metric',
                  properties: {
                    title: 'Payment Volume Trends',
                    metrics: services.map(service => [
                      `CustomMetrics/${service}`,
                      `${service}-success-count`,
                      { stat: 'Sum', period: 300 },
                    ]),
                    period: 300,
                    stat: 'Sum',
                    region: 'us-east-1',
                    yAxis: { left: { label: 'Count' } },
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    title: 'Payment Conversion Rate (Metric Math)',
                    metrics: [
                      [
                        'CustomMetrics/payment-api',
                        'payment-api-success-count',
                        { id: 'm1', visible: false },
                      ],
                      [
                        'CustomMetrics/Aggregated',
                        'AggregatedSuccessCount',
                        { id: 'm2', visible: false },
                      ],
                      [
                        {
                          expression: 'm1/m2*100',
                          label: 'Conversion Rate (%)',
                          id: 'e1',
                        },
                      ],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: 'us-east-1',
                    yAxis: { left: { label: 'Percentage' } },
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    title: 'Cross-Service Latency Percentiles',
                    metrics: services.flatMap(service => [
                      [
                        `CustomMetrics/${service}`,
                        `${service}-success-count`,
                        { stat: 'p50' },
                      ],
                      [
                        `CustomMetrics/${service}`,
                        `${service}-success-count`,
                        { stat: 'p95' },
                      ],
                      [
                        `CustomMetrics/${service}`,
                        `${service}-success-count`,
                        { stat: 'p99' },
                      ],
                    ]),
                    period: 300,
                    region: 'us-east-1',
                    yAxis: { left: { label: 'Milliseconds' } },
                  },
                },
                {
                  type: 'log',
                  properties: {
                    title: 'Service Health Logs',
                    query: `SOURCE '${logGroupNames[0]}' | fields @timestamp, @message | sort @timestamp desc | limit 20`,
                    region: 'us-east-1',
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // 9. CloudWatch Insights Saved Queries
    new aws.cloudwatch.QueryDefinition(
      'payment-errors-query',
      {
        name: 'PaymentErrors',
        queryString: `fields @timestamp, @message
| filter @message like /ERROR/
| filter @message like /payment/
| sort @timestamp desc
| limit 100`,
        logGroupNames: logGroups.map(lg => lg.name),
      },
      { parent: this }
    );

    new aws.cloudwatch.QueryDefinition(
      'fraud-investigation-query',
      {
        name: 'FraudInvestigation',
        queryString: `fields @timestamp, request_id, detection
| filter detection like /FRAUD_DETECTED/
| stats count() by bin(5m)`,
        logGroupNames: [logGroups[1].name], // fraud-detector log group
      },
      { parent: this }
    );

    // Exports
    this.kmsKeyArn = kmsKey.arn;
    this.logGroupArns = pulumi.output(logGroups.map(lg => lg.arn));
    this.dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=${dashboard.dashboardName}`;
    this.snsTopicArn = snsTopic.arn;
    this.lambdaFunctionArn = metricAggregationLambda.arn;

    this.registerOutputs({
      kmsKeyArn: this.kmsKeyArn,
      logGroupArns: this.logGroupArns,
      dashboardUrl: this.dashboardUrl,
      snsTopicArn: this.snsTopicArn,
      lambdaFunctionArn: this.lambdaFunctionArn,
    });
  }
}
