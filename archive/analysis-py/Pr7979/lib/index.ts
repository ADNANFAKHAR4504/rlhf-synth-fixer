import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Configuration
const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');
const region = aws.config.region || 'us-east-1';

// Email for alarm notifications (optional, can be configured per environment)
const alertEmail = config.get('alertEmail') || 'ops@example.com';

// S3 Bucket for metric streams and canary artifacts
const metricsBucket = new aws.s3.Bucket(`metrics-bucket-${environmentSuffix}`, {
  bucket: `payment-metrics-${environmentSuffix}`,
  forceDestroy: true,
  tags: {
    Environment: environmentSuffix,
    Purpose: 'MetricStorage',
  },
});

const canaryBucket = new aws.s3.Bucket(`canary-bucket-${environmentSuffix}`, {
  bucket: `payment-canary-${environmentSuffix}`,
  forceDestroy: true,
  tags: {
    Environment: environmentSuffix,
    Purpose: 'CanaryArtifacts',
  },
});

// CloudWatch Log Groups
const paymentLogGroup = new aws.cloudwatch.LogGroup(
  `payment-logs-${environmentSuffix}`,
  {
    name: `/aws/ecs/payment-service-${environmentSuffix}`,
    retentionInDays: 30,
    tags: {
      Environment: environmentSuffix,
      Service: 'PaymentProcessing',
    },
  }
);

const apiLogGroup = new aws.cloudwatch.LogGroup(
  `api-logs-${environmentSuffix}`,
  {
    name: `/aws/ecs/api-service-${environmentSuffix}`,
    retentionInDays: 30,
    tags: {
      Environment: environmentSuffix,
      Service: 'API',
    },
  }
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const metricProcessorLogGroup = new aws.cloudwatch.LogGroup(
  `metric-processor-logs-${environmentSuffix}`,
  {
    name: `/aws/lambda/metric-processor-${environmentSuffix}`,
    retentionInDays: 7,
    tags: {
      Environment: environmentSuffix,
      Service: 'MetricProcessor',
    },
  }
);

// IAM Role for Lambda functions
const lambdaRole = new aws.iam.Role(`lambda-role-${environmentSuffix}`, {
  name: `metric-processor-role-${environmentSuffix}`,
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: {
          Service: 'lambda.amazonaws.com',
        },
      },
    ],
  }),
  tags: {
    Environment: environmentSuffix,
  },
});

// Attach basic Lambda execution policy
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const lambdaBasicExecution = new aws.iam.RolePolicyAttachment(
  `lambda-basic-${environmentSuffix}`,
  {
    role: lambdaRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
  }
);

// Custom policy for CloudWatch metrics and logs
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const lambdaCloudWatchPolicy = new aws.iam.RolePolicy(
  `lambda-cloudwatch-policy-${environmentSuffix}`,
  {
    role: lambdaRole.id,
    policy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            'cloudwatch:PutMetricData',
            'logs:FilterLogEvents',
            'logs:GetLogEvents',
          ],
          Resource: '*',
        },
      ],
    }),
  }
);

// Lambda function for log analysis and metric calculation
const metricProcessorFunction = new aws.lambda.Function(
  `metric-processor-${environmentSuffix}`,
  {
    name: `metric-processor-${environmentSuffix}`,
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: 'index.handler',
    role: lambdaRole.arn,
    timeout: 60,
    memorySize: 256,
    environment: {
      variables: {
        ENVIRONMENT_SUFFIX: environmentSuffix,
        PAYMENT_LOG_GROUP: paymentLogGroup.name,
        API_LOG_GROUP: apiLogGroup.name,
      },
    },
    code: new pulumi.asset.AssetArchive({
      'index.js': new pulumi.asset.StringAsset(`
const { CloudWatchClient, PutMetricDataCommand } = require("@aws-sdk/client-cloudwatch");
const { CloudWatchLogsClient, FilterLogEventsCommand } = require("@aws-sdk/client-cloudwatch-logs");

const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION });
const logs = new CloudWatchLogsClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    console.log('Processing metrics for environment:', process.env.ENVIRONMENT_SUFFIX);

    const endTime = Date.now();
    const startTime = endTime - (5 * 60 * 1000); // Last 5 minutes

    try {
        // Analyze payment logs for transactions and failures
        const paymentMetrics = await analyzePaymentLogs(startTime, endTime);

        // Put custom metrics to CloudWatch
        await putMetrics(paymentMetrics);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Metrics processed successfully',
                metrics: paymentMetrics,
            }),
        };
    } catch (error) {
        console.error('Error processing metrics:', error);
        throw error;
    }
};

async function analyzePaymentLogs(startTime, endTime) {
    const params = {
        logGroupName: process.env.PAYMENT_LOG_GROUP,
        startTime: startTime,
        endTime: endTime,
        filterPattern: '{ $.eventType = "payment_*" }',
    };

    try {
        const response = await logs.send(new FilterLogEventsCommand(params));
        const events = response.events || [];

        let totalTransactions = 0;
        let failedTransactions = 0;

        events.forEach(event => {
            const message = JSON.parse(event.message || '{}');
            if (message.eventType === 'payment_attempt') {
                totalTransactions++;
            }
            if (message.eventType === 'payment_failed') {
                failedTransactions++;
            }
        });

        const transactionsPerMinute = totalTransactions / 5;
        const failureRate = totalTransactions > 0 ? (failedTransactions / totalTransactions) * 100 : 0;

        return {
            transactionsPerMinute,
            failureRate,
            totalTransactions,
            failedTransactions,
        };
    } catch (error) {
        console.error('Error analyzing logs:', error);
        return {
            transactionsPerMinute: 0,
            failureRate: 0,
            totalTransactions: 0,
            failedTransactions: 0,
        };
    }
}

async function putMetrics(metrics) {
    const metricData = [
        {
            MetricName: 'TransactionsPerMinute',
            Value: metrics.transactionsPerMinute,
            Unit: 'Count',
            Timestamp: new Date(),
            Dimensions: [
                {
                    Name: 'Environment',
                    Value: process.env.ENVIRONMENT_SUFFIX,
                },
            ],
        },
        {
            MetricName: 'PaymentFailureRate',
            Value: metrics.failureRate,
            Unit: 'Percent',
            Timestamp: new Date(),
            Dimensions: [
                {
                    Name: 'Environment',
                    Value: process.env.ENVIRONMENT_SUFFIX,
                },
            ],
        },
    ];

    const params = {
        Namespace: 'PaymentProcessing',
        MetricData: metricData,
    };

    await cloudwatch.send(new PutMetricDataCommand(params));
}
`),
    }),
    tags: {
      Environment: environmentSuffix,
      Purpose: 'MetricCalculation',
    },
  }
);

// EventBridge rule to trigger metric processor every 5 minutes
const metricProcessorRule = new aws.cloudwatch.EventRule(
  `metric-processor-rule-${environmentSuffix}`,
  {
    name: `metric-processor-schedule-${environmentSuffix}`,
    description: 'Trigger metric processor every 5 minutes',
    scheduleExpression: 'rate(5 minutes)',
    tags: {
      Environment: environmentSuffix,
    },
  }
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const metricProcessorTarget = new aws.cloudwatch.EventTarget(
  `metric-processor-target-${environmentSuffix}`,
  {
    rule: metricProcessorRule.name,
    arn: metricProcessorFunction.arn,
  }
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const metricProcessorPermission = new aws.lambda.Permission(
  `metric-processor-permission-${environmentSuffix}`,
  {
    action: 'lambda:InvokeFunction',
    function: metricProcessorFunction.name,
    principal: 'events.amazonaws.com',
    sourceArn: metricProcessorRule.arn,
  }
);

// IAM Role for CloudWatch Synthetics Canary
const canaryRole = new aws.iam.Role(`canary-role-${environmentSuffix}`, {
  name: `synthetics-canary-role-${environmentSuffix}`,
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: {
          Service: 'lambda.amazonaws.com',
        },
      },
    ],
  }),
  tags: {
    Environment: environmentSuffix,
  },
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const canaryPolicy = new aws.iam.RolePolicy(
  `canary-policy-${environmentSuffix}`,
  {
    role: canaryRole.id,
    policy: pulumi.interpolate`{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": ["s3:PutObject", "s3:GetBucketLocation"],
          "Resource": ["${canaryBucket.arn}/*"]
        },
        {
          "Effect": "Allow",
          "Action": [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ],
          "Resource": "arn:aws:logs:*:*:*"
        },
        {
          "Effect": "Allow",
          "Action": ["cloudwatch:PutMetricData"],
          "Resource": "*",
          "Condition": {
            "StringEquals": {
              "cloudwatch:namespace": "CloudWatchSynthetics"
            }
          }
        }
      ]
    }`,
  }
);

// CloudWatch Synthetics Canary for API monitoring
// Using a zip file with canary code
const apiCanary = new aws.synthetics.Canary(`api-canary-${environmentSuffix}`, {
  name: `api-monitor-${environmentSuffix}`,
  artifactS3Location: pulumi.interpolate`s3://${canaryBucket.bucket}/canary`,
  executionRoleArn: canaryRole.arn,
  handler: 'canary/apiCanaryBlueprint.handler',
  zipFile: 'lib/canary.zip',
  runtimeVersion: 'syn-nodejs-puppeteer-6.2',
  schedule: {
    expression: 'rate(2 minutes)',
  },
  runConfig: {
    timeoutInSeconds: 60,
    environmentVariables: {
      ENVIRONMENT: environmentSuffix,
    },
  },
  tags: {
    Environment: environmentSuffix,
    Purpose: 'APIMonitoring',
  },
});

// SNS Topics for different alert severities
const criticalTopic = new aws.sns.Topic(
  `critical-alerts-${environmentSuffix}`,
  {
    name: `critical-alerts-${environmentSuffix}`,
    displayName: 'Critical Alerts',
    tags: {
      Environment: environmentSuffix,
      Severity: 'Critical',
    },
  }
);

const warningTopic = new aws.sns.Topic(`warning-alerts-${environmentSuffix}`, {
  name: `warning-alerts-${environmentSuffix}`,
  displayName: 'Warning Alerts',
  tags: {
    Environment: environmentSuffix,
    Severity: 'Warning',
  },
});

const emergencyTopic = new aws.sns.Topic(
  `emergency-alerts-${environmentSuffix}`,
  {
    name: `emergency-alerts-${environmentSuffix}`,
    displayName: 'Emergency Alerts',
    tags: {
      Environment: environmentSuffix,
      Severity: 'Emergency',
    },
  }
);

// Email subscriptions
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const criticalEmailSubscription = new aws.sns.TopicSubscription(
  `critical-email-${environmentSuffix}`,
  {
    topic: criticalTopic.arn,
    protocol: 'email',
    endpoint: alertEmail,
  }
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const warningEmailSubscription = new aws.sns.TopicSubscription(
  `warning-email-${environmentSuffix}`,
  {
    topic: warningTopic.arn,
    protocol: 'email',
    endpoint: alertEmail,
  }
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const emergencyEmailSubscription = new aws.sns.TopicSubscription(
  `emergency-email-${environmentSuffix}`,
  {
    topic: emergencyTopic.arn,
    protocol: 'email',
    endpoint: alertEmail,
  }
);

// CloudWatch Alarms
const cpuAlarm = new aws.cloudwatch.MetricAlarm(
  `cpu-alarm-${environmentSuffix}`,
  {
    name: `high-cpu-usage-${environmentSuffix}`,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    metricName: 'CPUUtilization',
    namespace: 'AWS/ECS',
    period: 300,
    statistic: 'Average',
    threshold: 80,
    alarmDescription: 'Triggers when CPU usage exceeds 80%',
    alarmActions: [criticalTopic.arn],
    dimensions: {
      ClusterName: `payment-cluster-${environmentSuffix}`,
    },
    tags: {
      Environment: environmentSuffix,
      Severity: 'Critical',
    },
  }
);

const memoryAlarm = new aws.cloudwatch.MetricAlarm(
  `memory-alarm-${environmentSuffix}`,
  {
    name: `high-memory-usage-${environmentSuffix}`,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    metricName: 'MemoryUtilization',
    namespace: 'AWS/ECS',
    period: 300,
    statistic: 'Average',
    threshold: 85,
    alarmDescription: 'Triggers when memory usage exceeds 85%',
    alarmActions: [criticalTopic.arn],
    dimensions: {
      ClusterName: `payment-cluster-${environmentSuffix}`,
    },
    tags: {
      Environment: environmentSuffix,
      Severity: 'Critical',
    },
  }
);

// API Latency Alarm using metric math
const apiLatencyAlarm = new aws.cloudwatch.MetricAlarm(
  `api-latency-alarm-${environmentSuffix}`,
  {
    name: `high-api-latency-${environmentSuffix}`,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    threshold: 500,
    alarmDescription: 'Triggers when API latency exceeds 500ms',
    alarmActions: [warningTopic.arn],
    metricQueries: [
      {
        id: 'm1',
        metric: {
          metricName: 'Duration',
          namespace: 'CloudWatchSynthetics',
          period: 120,
          stat: 'Average',
          dimensions: {
            CanaryName: apiCanary.name,
          },
        },
        returnData: true,
      },
    ],
    tags: {
      Environment: environmentSuffix,
      Severity: 'Warning',
    },
  }
);

// Payment failure rate alarm
const paymentFailureAlarm = new aws.cloudwatch.MetricAlarm(
  `payment-failure-alarm-${environmentSuffix}`,
  {
    name: `high-payment-failure-rate-${environmentSuffix}`,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    metricName: 'PaymentFailureRate',
    namespace: 'PaymentProcessing',
    period: 300,
    statistic: 'Average',
    threshold: 5,
    alarmDescription: 'Triggers when payment failure rate exceeds 5%',
    alarmActions: [emergencyTopic.arn],
    dimensions: {
      Environment: environmentSuffix,
    },
    tags: {
      Environment: environmentSuffix,
      Severity: 'Emergency',
    },
  }
);

// Composite Alarm - triggers only when both CPU and Memory are high
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const compositeAlarm = new aws.cloudwatch.CompositeAlarm(
  `resource-exhaustion-alarm-${environmentSuffix}`,
  {
    alarmName: `resource-exhaustion-${environmentSuffix}`,
    alarmDescription:
      'Triggers when both CPU and Memory usage are critically high',
    alarmActions: [emergencyTopic.arn],
    alarmRule: pulumi.interpolate`ALARM(${cpuAlarm.arn}) AND ALARM(${memoryAlarm.arn})`,
    tags: {
      Environment: environmentSuffix,
      Severity: 'Emergency',
    },
  }
);

// CloudWatch Dashboard
const dashboard = new aws.cloudwatch.Dashboard(
  `monitoring-dashboard-${environmentSuffix}`,
  {
    dashboardName: `payment-monitoring-${environmentSuffix}`,
    dashboardBody: pulumi
      .all([
        cpuAlarm.arn,
        memoryAlarm.arn,
        apiLatencyAlarm.arn,
        paymentFailureAlarm.arn,
        apiCanary.name,
      ])
      .apply(([cpuArn, memoryArn, latencyArn, failureArn, canaryName]) =>
        JSON.stringify({
          widgets: [
            {
              type: 'metric',
              x: 0,
              y: 0,
              width: 12,
              height: 6,
              properties: {
                metrics: [
                  [
                    'AWS/ECS',
                    'CPUUtilization',
                    'ClusterName',
                    `payment-cluster-${environmentSuffix}`,
                    { stat: 'Average', label: 'CPU Usage' },
                  ],
                  [
                    '.',
                    'MemoryUtilization',
                    '.',
                    '.',
                    { stat: 'Average', label: 'Memory Usage' },
                  ],
                ],
                period: 300,
                stat: 'Average',
                region: region,
                title: 'Infrastructure Metrics',
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
              x: 12,
              y: 0,
              width: 12,
              height: 6,
              properties: {
                metrics: [
                  [
                    'PaymentProcessing',
                    'TransactionsPerMinute',
                    'Environment',
                    environmentSuffix,
                    { stat: 'Average' },
                  ],
                  [
                    '.',
                    'PaymentFailureRate',
                    '.',
                    '.',
                    { stat: 'Average', yAxis: 'right' },
                  ],
                ],
                period: 300,
                stat: 'Average',
                region: region,
                title: 'Business Metrics',
                yAxis: {
                  right: {
                    min: 0,
                    max: 100,
                    label: 'Failure Rate (%)',
                  },
                },
              },
            },
            {
              type: 'metric',
              x: 0,
              y: 6,
              width: 12,
              height: 6,
              properties: {
                metrics: [
                  [
                    'CloudWatchSynthetics',
                    'Duration',
                    'CanaryName',
                    canaryName,
                    { stat: 'Average' },
                  ],
                  ['...', { stat: 'p99', label: 'P99 Latency' }],
                ],
                period: 120,
                stat: 'Average',
                region: region,
                title: 'API Performance',
                yAxis: {
                  left: {
                    min: 0,
                  },
                },
              },
            },
            {
              type: 'metric',
              x: 12,
              y: 6,
              width: 12,
              height: 6,
              properties: {
                metrics: [
                  [
                    {
                      expression: 'm1 / m2 * 100',
                      label: 'Error Rate',
                      id: 'e1',
                    },
                  ],
                  [
                    'PaymentProcessing',
                    'PaymentFailureRate',
                    'Environment',
                    environmentSuffix,
                    { id: 'm1', visible: false },
                  ],
                  [
                    '.',
                    'TransactionsPerMinute',
                    '.',
                    '.',
                    { id: 'm2', visible: false },
                  ],
                ],
                period: 300,
                stat: 'Average',
                region: region,
                title: 'Calculated Error Rate (Metric Math)',
                yAxis: {
                  left: {
                    min: 0,
                  },
                },
              },
            },
            {
              type: 'alarm',
              x: 0,
              y: 12,
              width: 24,
              height: 3,
              properties: {
                title: 'Alarm Status',
                alarms: [cpuArn, memoryArn, latencyArn, failureArn],
              },
            },
          ],
        })
      ),
  }
);

// IAM Role for CloudWatch Metric Streams
const metricStreamRole = new aws.iam.Role(
  `metric-stream-role-${environmentSuffix}`,
  {
    name: `metric-stream-role-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'streams.metrics.cloudwatch.amazonaws.com',
          },
        },
      ],
    }),
    tags: {
      Environment: environmentSuffix,
    },
  }
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const metricStreamPolicy = new aws.iam.RolePolicy(
  `metric-stream-policy-${environmentSuffix}`,
  {
    role: metricStreamRole.id,
    policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "firehose:PutRecord",
                    "firehose:PutRecordBatch"
                ],
                "Resource": "*"
            }
        ]
    }`,
  }
);

// Kinesis Firehose for metric stream delivery
const firehoseRole = new aws.iam.Role(`firehose-role-${environmentSuffix}`, {
  name: `metric-firehose-role-${environmentSuffix}`,
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: {
          Service: 'firehose.amazonaws.com',
        },
      },
    ],
  }),
  tags: {
    Environment: environmentSuffix,
  },
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const firehosePolicy = new aws.iam.RolePolicy(
  `firehose-policy-${environmentSuffix}`,
  {
    role: firehoseRole.id,
    policy: pulumi.interpolate`{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": ["s3:PutObject", "s3:GetObject", "s3:ListBucket"],
          "Resource": ["${metricsBucket.arn}", "${metricsBucket.arn}/*"]
        }
      ]
    }`,
  }
);

const metricFirehose = new aws.kinesis.FirehoseDeliveryStream(
  `metric-stream-firehose-${environmentSuffix}`,
  {
    name: `metric-stream-${environmentSuffix}`,
    destination: 'extended_s3',
    extendedS3Configuration: {
      roleArn: firehoseRole.arn,
      bucketArn: metricsBucket.arn,
      prefix: 'metrics/',
      bufferingSize: 5,
      bufferingInterval: 300,
      compressionFormat: 'GZIP',
    },
    tags: {
      Environment: environmentSuffix,
    },
  }
);

// CloudWatch Metric Stream
const metricStream = new aws.cloudwatch.MetricStream(
  `metric-stream-${environmentSuffix}`,
  {
    name: `payment-metrics-stream-${environmentSuffix}`,
    roleArn: metricStreamRole.arn,
    firehoseArn: metricFirehose.arn,
    outputFormat: 'json',
    includeFilters: [
      {
        namespace: 'PaymentProcessing',
      },
      {
        namespace: 'AWS/ECS',
      },
      {
        namespace: 'CloudWatchSynthetics',
      },
    ],
    tags: {
      Environment: environmentSuffix,
    },
  }
);

// Exports
export const metricsBucketName = metricsBucket.id;
export const canaryBucketName = canaryBucket.id;
export const paymentLogGroupName = paymentLogGroup.name;
export const apiLogGroupName = apiLogGroup.name;
export const metricProcessorFunctionName = metricProcessorFunction.name;
export const apiCanaryName = apiCanary.name;
export const dashboardName = dashboard.dashboardName;
export const criticalTopicArn = criticalTopic.arn;
export const warningTopicArn = warningTopic.arn;
export const emergencyTopicArn = emergencyTopic.arn;
export const metricStreamName = metricStream.name;
