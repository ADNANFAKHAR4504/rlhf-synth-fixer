# Payment Monitoring Infrastructure - CDK TypeScript

## Project Structure

```
payment-monitoring/
├── lib/
│   ├── tap-stack.ts                 # Orchestrator stack
│   ├── payment-monitoring-stack.ts  # Main monitoring stack
│   ├── constructs/                  # Reusable constructs
│   │   ├── notifications.ts         # SNS topics and subscriptions
│   │   ├── alarms.ts                # CloudWatch alarms
│   │   ├── dashboards.ts            # CloudWatch dashboards
│   │   ├── log-processing.ts        # Lambda log processor
│   │   └── log-retention.ts         # S3 log retention
│   ├── lambda/                      # Lambda functions
│   │   └── log-processor/
│   │       └── index.ts             # CloudWatch logs processor
│   └── index.ts                     # Module exports
├── test/                            # Test files
│   ├── tap-stack.unit.test.ts       # Unit tests
│   └── tap-stack.int.test.ts        # Integration tests
└── metadata.json                    # Project metadata
```

## Infrastructure Code

### Main Stack Files

#### lib/tap-stack.ts
```typescript
// lib/tap-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Import your stacks here
import { PaymentMonitoringStack } from './payment-monitoring-stack';

export interface TapStackProps extends cdk.StackProps {
  /**
   * Optional suffix used to differentiate environments (e.g., "dev", "stg", "prod").
   * Resolved from props, then context "environmentSuffix", falling back to "dev".
   */
  environmentSuffix?: string;

  /**
   * Optional project/app name used in stack naming and tagging.
   * Resolved from context "projectName", falling back to "payment".
   */
  projectName?: string;
}

/**
 * Orchestrator stack: only instantiates other stacks.
 * Do NOT create resources directly in this stack.
 */
export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Resolve environment-specific values
    const environmentSuffix =
      props?.environmentSuffix ??
      this.node.tryGetContext('environmentSuffix') ??
      'dev';

    const projectName: string =
      props?.projectName ??
      this.node.tryGetContext('projectName') ??
      'payment';

    // Helpful, consistent naming
    const stackName = `${projectName}-monitoring-${environmentSuffix}`;

    // Global tags (apply to all child constructs/stacks under this scope)
    cdk.Tags.of(this).add('Project', projectName);
    cdk.Tags.of(this).add('Environment', environmentSuffix);

    // Instantiate your stacks here (no resources directly in TapStack)
    // Payment Monitoring (composes constructs: dashboards, alarms, notifications, log-processing, log-retention)
    new PaymentMonitoringStack(this, `PaymentMonitoringStack-${environmentSuffix}`, {
      ...props,
      stackName,
      description: `Payment monitoring infrastructure for ${projectName} (${environmentSuffix}).`,
    });

    // If you later split stacks by concern, instantiate them here instead, e.g.:
    // new DashboardsStack(this, `Dashboards-${environmentSuffix}`, { ...props, stackName: `${projectName}-dashboards-${environmentSuffix}` });
    // new AlarmsStack(this, `Alarms-${environmentSuffix}`, { ...props, stackName: `${projectName}-alarms-${environmentSuffix}` });
    // new NotificationsStack(this, `Notifications-${environmentSuffix}`, { ...props, stackName: `${projectName}-notifications-${environmentSuffix}` });
    // new LogProcessingStack(this, `LogProcessing-${environmentSuffix}`, { ...props, stackName: `${projectName}-logproc-${environmentSuffix}` });
    // new LogRetentionStack(this, `LogRetention-${environmentSuffix}`, { ...props, stackName: `${projectName}-logret-${environmentSuffix}` });
  }
}
```

#### lib/payment-monitoring-stack.ts
```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DashboardsConstruct } from './constructs/dashboards';
import { AlarmsConstruct } from './constructs/alarms';
import { NotificationsConstruct } from './constructs/notifications';
import { LogProcessingConstruct } from './constructs/log-processing';
import { LogRetentionConstruct } from './constructs/log-retention';

export class PaymentMonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // SNS Topics for notifications
    const notifications = new NotificationsConstruct(this, 'Notifications');

    // Log processing Lambda and metric filters
    const logProcessing = new LogProcessingConstruct(this, 'LogProcessing');

    // CloudWatch Alarms
    const alarms = new AlarmsConstruct(this, 'Alarms', {
      operationalTopic: notifications.operationalTopic,
      securityTopic: notifications.securityTopic,
    });

    // CloudWatch Dashboards
    new DashboardsConstruct(this, 'Dashboards', {
      alarms: alarms.alarms,
    });

    // Log retention and S3 export
    new LogRetentionConstruct(this, 'LogRetention');

    // Stack outputs
    new cdk.CfnOutput(this, 'OperationalTopicArn', {
      value: notifications.operationalTopic.topicArn,
      description: 'SNS Topic ARN for operational alerts',
    });

    new cdk.CfnOutput(this, 'SecurityTopicArn', {
      value: notifications.securityTopic.topicArn,
      description: 'SNS Topic ARN for security alerts',
    });

    new cdk.CfnOutput(this, 'LogProcessorFunctionName', {
      value: logProcessing.logProcessor.functionName,
      description: 'Log processor Lambda function name',
    });
  }
}
```

#### lib/index.ts
```typescript
// Main exports for the payment monitoring infrastructure
export { TapStack } from './tap-stack';
export { PaymentMonitoringStack } from './payment-monitoring-stack';

// Construct exports
export { NotificationsConstruct } from './constructs/notifications';
export { AlarmsConstruct } from './constructs/alarms';
export { DashboardsConstruct } from './constructs/dashboards';
export { LogProcessingConstruct } from './constructs/log-processing';
export { LogRetentionConstruct } from './constructs/log-retention';

// Types
export type { TapStackProps } from './tap-stack';
```

### Construct Files

#### lib/constructs/notifications.ts
```typescript
import * as cdk from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export class NotificationsConstruct extends Construct {
  public readonly operationalTopic: sns.Topic;
  public readonly securityTopic: sns.Topic;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Operational alerts topic
    this.operationalTopic = new sns.Topic(this, 'OperationalAlerts', {
      displayName: 'Payment Platform - Operational Alerts',
      topicName: 'payment-platform-operational-alerts',
    });

    // Security alerts topic
    this.securityTopic = new sns.Topic(this, 'SecurityAlerts', {
      displayName: 'Payment Platform - Security Alerts',
      topicName: 'payment-platform-security-alerts',
    });

    // Add email subscriptions (replace with actual email addresses)
    const operationsEmail = process.env.OPERATIONS_EMAIL || 'ops@example.com';
    const securityEmail = process.env.SECURITY_EMAIL || 'security@example.com';
    const smsNumber = process.env.ALERT_SMS || '+1234567890';

    // Operational subscriptions
    this.operationalTopic.addSubscription(
      new subscriptions.EmailSubscription(operationsEmail)
    );
    this.operationalTopic.addSubscription(
      new subscriptions.SmsSubscription(smsNumber)
    );

    // Security subscriptions
    this.securityTopic.addSubscription(
      new subscriptions.EmailSubscription(securityEmail)
    );
    this.securityTopic.addSubscription(
      new subscriptions.SmsSubscription(smsNumber)
    );
  }
}
```

#### lib/constructs/alarms.ts
```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface AlarmsConstructProps {
  operationalTopic: sns.Topic;
  securityTopic: sns.Topic;
}

export class AlarmsConstruct extends Construct {
  public readonly alarms: Map<string, cloudwatch.Alarm> = new Map();

  constructor(scope: Construct, id: string, props: AlarmsConstructProps) {
    super(scope, id);

    // Payment failure rate alarm
    const paymentFailureAlarm = new cloudwatch.Alarm(this, 'PaymentFailureRate', {
      alarmName: 'payment-failure-rate-high',
      alarmDescription: 'Payment failure rate exceeds 1%',
      metric: new cloudwatch.Metric({
        namespace: 'PaymentPlatform',
        metricName: 'PaymentFailureRate',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    paymentFailureAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(props.operationalTopic)
    );
    this.alarms.set('paymentFailure', paymentFailureAlarm);

    // API Gateway latency alarm
    const apiLatencyAlarm = new cloudwatch.Alarm(this, 'APILatency', {
      alarmName: 'api-gateway-latency-high',
      alarmDescription: 'API Gateway response time exceeds 500ms',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: 'Latency',
        dimensionsMap: {
          ApiName: 'PaymentAPI',
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 500,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    apiLatencyAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(props.operationalTopic)
    );
    this.alarms.set('apiLatency', apiLatencyAlarm);

    // RDS connection pool exhaustion alarm
    const dbConnectionAlarm = new cloudwatch.Alarm(this, 'DBConnections', {
      alarmName: 'rds-connection-pool-exhausted',
      alarmDescription: 'RDS connection pool utilization exceeds 90%',
      metric: new cloudwatch.MathExpression({
        expression: '(m1 / 100) * 100',
        usingMetrics: {
          m1: new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'DatabaseConnections',
            dimensionsMap: {
              DBClusterIdentifier: 'payment-db-cluster',
            },
            statistic: 'Maximum',
            period: cdk.Duration.minutes(5),
          }),
        },
      }),
      threshold: 90,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    dbConnectionAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(props.operationalTopic)
    );
    this.alarms.set('dbConnection', dbConnectionAlarm);

    // ECS task failure alarm
    const ecsTaskFailureAlarm = new cloudwatch.Alarm(this, 'ECSTaskFailures', {
      alarmName: 'ecs-task-failures-high',
      alarmDescription: 'ECS task failures detected',
      metric: new cloudwatch.Metric({
        namespace: 'ECS/ContainerInsights',
        metricName: 'TaskCount',
        dimensionsMap: {
          ServiceName: 'payment-service',
          TaskStatus: 'STOPPED',
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    ecsTaskFailureAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(props.operationalTopic)
    );
    this.alarms.set('ecsTaskFailure', ecsTaskFailureAlarm);

    // Security - failed authentication attempts
    const authFailureAlarm = new cloudwatch.Alarm(this, 'AuthFailures', {
      alarmName: 'authentication-failures-high',
      alarmDescription: 'High number of authentication failures detected',
      metric: new cloudwatch.Metric({
        namespace: 'PaymentPlatform/Security',
        metricName: 'AuthenticationFailures',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    authFailureAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(props.securityTopic)
    );
    this.alarms.set('authFailure', authFailureAlarm);

    // Composite alarm - High error rate AND high latency
    const criticalPerformanceAlarm = new cloudwatch.CompositeAlarm(this, 'CriticalPerformance', {
      compositeAlarmName: 'critical-performance-degradation',
      alarmDescription: 'Both high error rate and high latency detected',
      alarmRule: cloudwatch.AlarmRule.allOf(
        cloudwatch.AlarmRule.fromAlarm(paymentFailureAlarm, cloudwatch.AlarmState.ALARM),
        cloudwatch.AlarmRule.fromAlarm(apiLatencyAlarm, cloudwatch.AlarmState.ALARM),
      ),
    });
    criticalPerformanceAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(props.operationalTopic)
    );
  }
}
```

#### lib/constructs/log-processing.ts
```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as logsDestinations from 'aws-cdk-lib/aws-logs-destinations';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { Construct } from 'constructs';

export class LogProcessingConstruct extends Construct {
  public readonly logProcessor: lambda.Function;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create Lambda function for log processing
    this.logProcessor = new lambda.Function(this, 'LogProcessor', {
      functionName: 'payment-log-processor',
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/log-processor')),
      timeout: cdk.Duration.seconds(60),
      memorySize: 512,
      environment: {
        METRICS_NAMESPACE: 'PaymentPlatform',
      },
    });

    // Grant permissions for CloudWatch metrics
    this.logProcessor.addToRolePolicy(new iam.PolicyStatement({
      actions: ['cloudwatch:PutMetricData'],
      resources: ['*'],
    }));

    // Application Log Group
    const appLogGroup = new logs.LogGroup(this, 'ApplicationLogs', {
      logGroupName: '/aws/application/payment-platform',
      retention: logs.RetentionDays.ONE_MONTH,
    });

    // Subscribe Lambda to log group
    new logs.SubscriptionFilter(this, 'LogSubscription', {
      logGroup: appLogGroup,
      destination: new logsDestinations.LambdaDestination(this.logProcessor),
      filterPattern: logs.FilterPattern.allEvents(),
    });

    // Metric filters for error patterns
    new logs.MetricFilter(this, 'PaymentErrorFilter', {
      logGroup: appLogGroup,
      filterPattern: logs.FilterPattern.literal('[ERROR] Payment processing failed'),
      metricNamespace: 'PaymentPlatform',
      metricName: 'PaymentProcessingErrors',
      defaultValue: 0,
    });

    new logs.MetricFilter(this, 'SecurityEventFilter', {
      logGroup: appLogGroup,
      filterPattern: logs.FilterPattern.literal('[SECURITY] Authentication failed'),
      metricNamespace: 'PaymentPlatform/Security',
      metricName: 'AuthenticationFailures',
      defaultValue: 0,
    });

    new logs.MetricFilter(this, 'DatabaseErrorFilter', {
      logGroup: appLogGroup,
      filterPattern: logs.FilterPattern.anyTerm('database', 'connection', 'timeout'),
      metricNamespace: 'PaymentPlatform',
      metricName: 'DatabaseErrors',
      defaultValue: 0,
    });

    // API Gateway access logs
    const apiLogGroup = new logs.LogGroup(this, 'APIGatewayLogs', {
      logGroupName: '/aws/apigateway/payment-api',
      retention: logs.RetentionDays.ONE_MONTH,
    });

    // Metric filter for API 4xx/5xx errors
    new logs.MetricFilter(this, 'API4xxFilter', {
      logGroup: apiLogGroup,
      filterPattern: logs.FilterPattern.literal('[4**]'),
      metricNamespace: 'PaymentPlatform/API',
      metricName: 'ClientErrors',
      defaultValue: 0,
    });

    new logs.MetricFilter(this, 'API5xxFilter', {
      logGroup: apiLogGroup,
      filterPattern: logs.FilterPattern.literal('[5**]'),
      metricNamespace: 'PaymentPlatform/API',
      metricName: 'ServerErrors',
      defaultValue: 0,
    });
  }
}
```

#### lib/constructs/dashboards.ts
```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

export interface DashboardsConstructProps {
  alarms: Map<string, cloudwatch.Alarm>;
}

export class DashboardsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: DashboardsConstructProps) {
    super(scope, id);

    // Create CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'PaymentMonitoringDashboard', {
      dashboardName: 'payment-platform-monitoring',
    });

    // Add widgets to the dashboard
    dashboard.addWidgets(
      // Payment metrics
      new cloudwatch.GraphWidget({
        title: 'Payment Success Rate',
        left: [
          new cloudwatch.Metric({
            namespace: 'PaymentPlatform',
            metricName: 'PaymentSuccess',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: 'PaymentPlatform',
            metricName: 'PaymentAttempts',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
        height: 6,
      }),

      // Error metrics
      new cloudwatch.GraphWidget({
        title: 'Error Rates',
        left: [
          new cloudwatch.Metric({
            namespace: 'PaymentPlatform',
            metricName: 'PaymentProcessingErrors',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: 'PaymentPlatform/API',
            metricName: 'ServerErrors',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
        height: 6,
      }),

      // API performance
      new cloudwatch.GraphWidget({
        title: 'API Performance',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Latency',
            dimensionsMap: {
              ApiName: 'PaymentAPI',
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
        height: 6,
      }),

      // Database connections
      new cloudwatch.GraphWidget({
        title: 'Database Connections',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'DatabaseConnections',
            dimensionsMap: {
              DBClusterIdentifier: 'payment-db-cluster',
            },
            statistic: 'Maximum',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
        height: 6,
      }),

      // ECS metrics
      new cloudwatch.GraphWidget({
        title: 'ECS Task Health',
        left: [
          new cloudwatch.Metric({
            namespace: 'ECS/ContainerInsights',
            metricName: 'RunningTaskCount',
            dimensionsMap: {
              ServiceName: 'payment-service',
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
        height: 6,
      }),

      // Security metrics
      new cloudwatch.GraphWidget({
        title: 'Security Events',
        left: [
          new cloudwatch.Metric({
            namespace: 'PaymentPlatform/Security',
            metricName: 'AuthenticationFailures',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
        height: 6,
      }),
    );

    // Add alarm status widget
    dashboard.addWidgets(
      new cloudwatch.AlarmStatusWidget({
        title: 'Alarm Status',
        alarms: Array.from(props.alarms.values()),
        width: 24,
        height: 6,
      }),
    );
  }
}
```

#### lib/constructs/log-retention.ts
```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as logsDestinations from 'aws-cdk-lib/aws-logs-destinations';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class LogRetentionConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // S3 bucket for log archival
    const logArchiveBucket = new s3.Bucket(this, 'LogArchiveBucket', {
      bucketName: `payment-logs-archive-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'log-retention',
          expiration: cdk.Duration.days(365), // Keep logs for 1 year
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create IAM role for CloudWatch Logs to write to S3
    const logExportRole = new iam.Role(this, 'LogExportRole', {
      assumedBy: new iam.ServicePrincipal('logs.amazonaws.com'),
    });

    logExportRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          's3:GetBucketAcl',
          's3:PutObject',
        ],
        resources: [
          logArchiveBucket.bucketArn,
          `${logArchiveBucket.bucketArn}/*`,
        ],
      })
    );

    // Export application logs to S3
    const appLogGroup = logs.LogGroup.fromLogGroupName(
      this,
      'AppLogGroupRef',
      '/aws/application/payment-platform'
    );

    new logs.SubscriptionFilter(this, 'AppLogExport', {
      logGroup: appLogGroup,
      destination: new logsDestinations.S3Destination(logArchiveBucket, {
        role: logExportRole,
      }),
      filterPattern: logs.FilterPattern.allEvents(),
    });

    // Export API Gateway logs to S3
    const apiLogGroup = logs.LogGroup.fromLogGroupName(
      this,
      'ApiLogGroupRef',
      '/aws/apigateway/payment-api'
    );

    new logs.SubscriptionFilter(this, 'ApiLogExport', {
      logGroup: apiLogGroup,
      destination: new logsDestinations.S3Destination(logArchiveBucket, {
        role: logExportRole,
      }),
      filterPattern: logs.FilterPattern.allEvents(),
    });

    // Output the bucket name
    new cdk.CfnOutput(this, 'LogArchiveBucketName', {
      value: logArchiveBucket.bucketName,
      description: 'S3 bucket for log archival',
    });
  }
}
```

### Lambda Function

#### lib/lambda/log-processor/index.ts
```typescript
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { Logger } from '@aws-lambda-powertools/logger';
import { CloudWatchLogsEvent, CloudWatchLogsHandler } from 'aws-lambda';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gunzip = promisify(zlib.gunzip);
const metrics = new Metrics({ namespace: 'PaymentPlatform/Business' });
const logger = new Logger();

interface PaymentLog {
  timestamp: string;
  level: string;
  message: string;
  merchantId?: string;
  merchantTier?: string;
  paymentMethod?: string;
  amount?: number;
  currency?: string;
  status?: string;
  responseTime?: number;
  errorCode?: string;
}

export const handler: CloudWatchLogsHandler = async (event: CloudWatchLogsEvent) => {
  const payload = Buffer.from(event.awslogs.data, 'base64');
  const result = await gunzip(payload);
  const logData = JSON.parse(result.toString());

  logger.info('Processing log batch', {
    logGroup: logData.logGroup,
    messageCount: logData.logEvents.length
  });

  for (const logEvent of logData.logEvents) {
    try {
      const log: PaymentLog = JSON.parse(logEvent.message);

      // Emit custom business metrics using EMF
      if (log.merchantId && log.amount) {
        metrics.addMetric('MerchantTransactionVolume', MetricUnit.Count, 1);
        metrics.addMetadata('merchantId', log.merchantId);
        metrics.addMetadata('merchantTier', log.merchantTier || 'Standard');
        metrics.addDimension('MerchantTier', log.merchantTier || 'Standard');

        metrics.addMetric('TransactionAmount', MetricUnit.NoUnit, log.amount);
        metrics.addDimension('Currency', log.currency || 'USD');
        metrics.addDimension('PaymentMethod', log.paymentMethod || 'Unknown');
      }

      // Track payment success/failure rates by merchant
      if (log.status) {
        if (log.status === 'success') {
          metrics.addMetric('PaymentSuccess', MetricUnit.Count, 1);
        } else if (log.status === 'failed') {
          metrics.addMetric('PaymentFailure', MetricUnit.Count, 1);
          if (log.errorCode) {
            metrics.addDimension('ErrorCode', log.errorCode);
          }
        }
        metrics.addMetric('PaymentAttempts', MetricUnit.Count, 1);
      }

      // Track API response times
      if (log.responseTime) {
        metrics.addMetric('APIResponseTime', MetricUnit.Milliseconds, log.responseTime);
      }

      // Calculate and emit payment failure rate
      if (log.status === 'failed') {
        metrics.addMetric('PaymentFailureRate', MetricUnit.Percent, 1);
      } else if (log.status === 'success') {
        metrics.addMetric('PaymentFailureRate', MetricUnit.Percent, 0);
      }

    } catch (error) {
      logger.error('Failed to parse log event', { error, message: logEvent.message });
    }
  }

  // Publish all collected metrics
  metrics.publishStoredMetrics();

  return;
};
```

### Test Files

#### test/tap-stack.unit.test.ts
```typescript
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let tapTemplate: Template;

  beforeAll(() => {
    const app = new cdk.App();
    const tapStack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
      projectName: 'payment',
    });

    tapTemplate = Template.fromStack(tapStack);
  });

  describe('Stack Properties', () => {
    test('should create stack with correct naming', () => {
      const stackName = tapTemplate.toJSON().Description;
      expect(stackName).toContain('Payment monitoring infrastructure for payment (test)');
    });

    test('should apply correct tags', () => {
      expect(tapTemplate.findResources('AWS::SNS::Topic')).toMatchObject({
        Properties: {
          Tags: Match.arrayWith([
            Match.objectLike({
              Key: 'Project',
              Value: 'payment',
            }),
            Match.objectLike({
              Key: 'Environment',
              Value: 'test',
            }),
          ]),
        },
      });
    });
  });

  describe('Child Stack Creation', () => {
    test('should create PaymentMonitoringStack as nested stack', () => {
      const nestedStacks = tapTemplate.findResources('AWS::CloudFormation::Stack');
      expect(Object.keys(nestedStacks).length).toBeGreaterThan(0);

      const nestedStack = Object.values(nestedStacks)[0] as any;
      expect(nestedStack.Properties.TemplateURL).toBeDefined();
      expect(nestedStack.Properties.StackName).toContain('payment-monitoring-test');
    });
  });

  describe('Environment Configuration', () => {
    test('should use environmentSuffix from props', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack1', {
        environmentSuffix: 'staging',
        projectName: 'payment',
      });
      const template = Template.fromStack(stack);
      const nestedStacks = template.findResources('AWS::CloudFormation::Stack');
      const nestedStack = Object.values(nestedStacks)[0] as any;
      expect(nestedStack.Properties.StackName).toContain('payment-monitoring-staging');
    });

    test('should use projectName from props', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack2', {
        environmentSuffix: 'dev',
        projectName: 'custom-payment',
      });
      const template = Template.fromStack(stack);
      const nestedStacks = template.findResources('AWS::CloudFormation::Stack');
      const nestedStack = Object.values(nestedStacks)[0] as any;
      expect(nestedStack.Properties.StackName).toContain('custom-payment-monitoring-dev');
    });

    test('should fall back to context values', () => {
      const app = new cdk.App({
        context: {
          environmentSuffix: 'context-env',
          projectName: 'context-project',
        },
      });
      const stack = new TapStack(app, 'TestStack3');
      const template = Template.fromStack(stack);
      const nestedStacks = template.findResources('AWS::CloudFormation::Stack');
      const nestedStack = Object.values(nestedStacks)[0] as any;
      expect(nestedStack.Properties.StackName).toContain('context-project-monitoring-context-env');
    });

    test('should use default values when no props or context provided', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack4');
      const template = Template.fromStack(stack);
      const nestedStacks = template.findResources('AWS::CloudFormation::Stack');
      const nestedStack = Object.values(nestedStacks)[0] as any;
      expect(nestedStack.Properties.StackName).toContain('payment-monitoring-dev');
    });
  });

  describe('Stack Outputs', () => {
    test('should define all required outputs', () => {
      const outputs = tapTemplate.toJSON().Outputs || {};

      expect(outputs.OperationalTopicArn).toBeDefined();
      expect(outputs.SecurityTopicArn).toBeDefined();
      expect(outputs.LogProcessorFunctionName).toBeDefined();
    });

    test('should have correct output descriptions', () => {
      const outputs = tapTemplate.toJSON().Outputs || {};

      expect(outputs.OperationalTopicArn.Description).toContain('operational alerts');
      expect(outputs.SecurityTopicArn.Description).toContain('security alerts');
      expect(outputs.LogProcessorFunctionName.Description).toContain('Log processor Lambda');
    });
  });
});
```

#### test/tap-stack.int.test.ts
```typescript
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack, TapStackProps } from '../lib/tap-stack';
import { PaymentMonitoringStack } from '../lib/payment-monitoring-stack';
import { ApiGatewayMonitoringStack } from '../lib/api-gateway-monitoring-stack';
import { RdsEcsMonitoringStack } from '../lib/rds-ecs-monitoring-stack';

function build(ctx?: Record<string, any>, props?: TapStackProps) {
  const app = new cdk.App(ctx ? { context: ctx } : undefined);
  const tap = new TapStack(app, 'TestTapStack', props as any);

  const childStacks = tap.node.children.filter((c) => {
    // include only constructs that look like Stack instances (have stackName)
    return (c as any).stackName !== undefined;
  }) as cdk.Stack[];

  const templates = childStacks.map((s) => ({
    stack: s,
    id: s.node.id,
    template: Template.fromStack(s),
  }));

  return { app, tap, childStacks, templates };
}

function countResources(template: Template, type: string) {
  return Object.keys(template.findResources(type)).length;
}

function dashboardBodies(template: Template): string[] {
  const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
  return Object.values(dashboards).map((d: any) => {
    const body = d.Properties?.DashboardBody;
    if (!body) return '';
    try {
      return typeof body === 'string' ? body : JSON.stringify(body);
    } catch {
      return String(body);
    }
  });
}

function anyAlarmWithNamespace(template: Template, namespace: string) {
  const alarms = template.findResources('AWS::CloudWatch::Alarm');
  return Object.values(alarms).some((a: any) => {
    const props = a.Properties ?? {};
    if (props.Namespace && typeof props.Namespace === 'string') {
      return props.Namespace === namespace;
    }
    if (props.MetricName && typeof props.MetricName === 'string') {
      return false;
    }
    if (Array.isArray(props.Metrics)) {
      return props.Metrics.some((m: any) => m.Namespace === namespace);
    }
    return false;
  });
}

describe('TapStack Integration Tests', () => {
  test('orchestration: creates TapStack and monitoring child stacks', () => {
    const { tap, childStacks } = build(undefined, { environmentSuffix: 'int' });
    expect(tap).toBeDefined();
    expect(childStacks.length).toBeGreaterThanOrEqual(3);
  });

  test('core monitoring: at least one alarm and one dashboard exist across monitoring stacks', () => {
    const { templates } = build(undefined, { environmentSuffix: 'int' });
    let totalAlarms = 0;
    let totalDashboards = 0;
    for (const { template } of templates) {
      totalAlarms += countResources(template, 'AWS::CloudWatch::Alarm');
      totalDashboards += countResources(template, 'AWS::CloudWatch::Dashboard');
    }
    expect(totalAlarms).toBeGreaterThan(0);
    expect(totalDashboards).toBeGreaterThan(0);
  });

  test('service coverage: API Gateway monitoring is present', () => {
    const { templates } = build(undefined, { environmentSuffix: 'int' });
    let found = false;
    for (const { template } of templates) {
      const bodies = dashboardBodies(template);
      if (bodies.some(b => /AWS\/ApiGateway|ApiGateway|Api Gateway|ApiGateway/.test(b))) {
        found = true;
        break;
      }
      if (anyAlarmWithNamespace(template, 'AWS/ApiGateway')) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  test('service coverage: RDS or ECS monitoring is present', () => {
    const { templates } = build(undefined, { environmentSuffix: 'int' });
    let found = false;
    for (const { template } of templates) {
      const bodies = dashboardBodies(template);
      if (bodies.some(b => /AWS\/RDS|AWS\/ECS|RDS|ECS/.test(b))) {
        found = true;
        break;
      }
      if (anyAlarmWithNamespace(template, 'AWS/RDS') || anyAlarmWithNamespace(template, 'AWS/ECS')) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  test('aggregated lambdas, iam roles, s3 buckets, and outputs exist across stacks', () => {
    const { templates } = build(undefined, { environmentSuffix: 'int' });
    let lambdas = 0;
    let roles = 0;
    let buckets = 0;
    let outputs = 0;
    for (const { template } of templates) {
      lambdas += countResources(template, 'AWS::Lambda::Function');
      roles += countResources(template, 'AWS::IAM::Role');
      buckets += countResources(template, 'AWS::S3::Bucket');
      outputs += Object.keys(template.toJSON().Outputs || {}).length;
    }
    expect(lambdas).toBeGreaterThanOrEqual(1);
    expect(roles).toBeGreaterThanOrEqual(1);
    expect(buckets).toBeGreaterThanOrEqual(1);
    expect(outputs).toBeGreaterThanOrEqual(1);
  });

  test('logs and metric filters: at least one metric filter or log group exists', () => {
    const { templates } = build(undefined, { environmentSuffix: 'int' });
    let metricFilters = 0;
    let logGroups = 0;
    for (const { template } of templates) {
      metricFilters += countResources(template, 'AWS::Logs::MetricFilter');
      logGroups += countResources(template, 'AWS::Logs::LogGroup');
    }
    expect(metricFilters + logGroups).toBeGreaterThanOrEqual(1);
  });

  test('tag compliance: resources include Project and Environment tags', () => {
    const { templates } = build(undefined, {
      environmentSuffix: 'int',
      projectName: 'payment',
    });
    let anyTagged = false;
    for (const { template } of templates) {
      const resources = template.toJSON().Resources || {};
      for (const res of Object.values(resources) as any[]) {
        const tags = res?.Properties?.Tags;
        if (!Array.isArray(tags)) continue;
        const hasProject = tags.some((t: any) => t.Key === 'Project' && typeof t.Value === 'string');
        const hasEnv = tags.some((t: any) => t.Key === 'Environment' && typeof t.Value === 'string');
        if (hasProject && hasEnv) {
          anyTagged = true;
          break;
        }
      }
      if (anyTagged) break;
    }
    expect(anyTagged).toBe(true);
  });
});
```

## Deployment

1. **Prerequisites**:
   - AWS CLI configured with appropriate credentials
   - CDK CLI installed (`npm install -g aws-cdk`)

2. **Deploy to test environment**:
   ```bash
   npm run build
   cdk bootstrap
   cdk deploy --context environmentSuffix=test
   ```

3. **Monitor the infrastructure**:
   - CloudWatch Dashboard: `payment-platform-monitoring`
   - SNS Topics: `payment-platform-operational-alerts`, `payment-platform-security-alerts`
   - Lambda Function: `payment-log-processor`

## AWS Services Used

- **CloudWatch**: Alarms, Dashboards, Metrics, Logs
- **SNS**: Notifications and alerting
- **Lambda**: Log processing and metric generation
- **IAM**: Least-privilege access control
- **S3**: Log archival and retention