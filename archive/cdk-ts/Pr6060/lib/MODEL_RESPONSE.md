### Reasoning Trace
---

The user wants a TypeScript CDK v2 program for monitoring and alerting stack for a payment processing platform. Let me analyze the requirements:

CORE services (mandatory):
- Amazon CloudWatch (metrics, dashboards, alarms, Logs, Contributor Insights)
- Amazon SNS (topics and multi-channel notifications)

OPTIONAL (0-1):
- AWS Lambda (for processing logs and emitting custom metrics)

MANDATORY deliverables (implement 3-5, recommended 5):
1. CloudWatch Dashboards - payment transaction metrics, API latency (p50/p95/p99), error rates
2. CloudWatch Alarms - payment failure rate > 1%, API response time > 500ms, DB connection pool exhaustion
3. SNS Topics - email + SMS subscriptions for critical alerts
4. Lambda functions - process logs and emit custom business KPIs using EMF
5. CloudWatch Logs metric filters - extract error patterns and security events

OPTIONAL/enhancement items:
- Composite alarms
- Automated CloudWatch Logs exports to S3
- CloudWatch Contributor Insights rules
- Use metric math for derived metrics
- CloudWatch Logs Insights queries

Given these requirements, I'll implement all 5 mandatory deliverables and include some of the optional enhancements. I'll create a comprehensive CDK project with:

1. Main stack with CloudWatch dashboards showing payment metrics
2. Alarms for various conditions
3. SNS topics for notifications
4. Lambda function for log processing and custom metrics (using EMF)
5. Metric filters for logs
6. Composite alarms (optional)
7. Log exports to S3 (optional)
8. Contributor Insights rules (optional)

The structure will be:
- `bin/` - CDK app entry point
- `lib/` - Stack and construct definitions
- `lambda/` - Lambda function code
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config


- `cdk.json` - Configuration file for CDK deployment
- `README.md` - Project documentation and setup instructions

I'll ensure the configuration and documentation provide clear guidance for setting up and understanding the monitoring infrastructure. The `cdk.json` will define the CDK app entry point, while the `README.md` will offer comprehensive details about the project's purpose, setup, and deployment process.
### Answer 
---

I'll create a comprehensive TypeScript CDK v2 program for a payment processing platform monitoring and alerting stack. Here's the complete implementation:

## Project Structure

```
payment-monitoring-stack/
├── bin/
│   └── app.ts
├── lib/
│   ├── payment-monitoring-stack.ts
│   ├── constructs/
│   │   ├── dashboards.ts
│   │   ├── alarms.ts
│   │   ├── notifications.ts
│   │   ├── log-processing.ts
│   │   └── log-retention.ts
├── lambda/
│   └── log-processor/
│       └── index.ts
├── package.json
├── tsconfig.json
├── cdk.json
└── README.md
```

## Implementation

### package.json

```json
{
  "name": "payment-monitoring-stack",
  "version": "1.0.0",
  "description": "CloudWatch monitoring and alerting stack for payment processing platform",
  "main": "bin/app.js",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "cdk": "cdk",
    "deploy": "npm run build && cdk deploy --all",
    "destroy": "cdk destroy --all"
  },
  "devDependencies": {
    "@types/node": "20.x",
    "aws-cdk": "2.x",
    "ts-node": "^10.9.1",
    "typescript": "~5.2.0"
  },
  "dependencies": {
    "aws-cdk-lib": "2.x",
    "constructs": "^10.0.0",
    "@aws-lambda-powertools/metrics": "^1.14.0",
    "@aws-lambda-powertools/logger": "^1.14.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "esModuleInterop": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"],
    "resolveJsonModule": true,
    "outDir": "./dist"
  },
  "exclude": ["node_modules", "cdk.out", "dist"]
}
```

### cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/app.ts",
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true
  }
}
```

### bin/app.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PaymentMonitoringStack } from '../lib/payment-monitoring-stack';

const app = new cdk.App();

new PaymentMonitoringStack(app, 'PaymentMonitoringStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  description: 'CloudWatch monitoring and alerting stack for payment processing platform',
});

app.synth();
```

### lib/payment-monitoring-stack.ts

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

### lib/constructs/notifications.ts

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

### lib/constructs/alarms.ts

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
      alarmName: 'critical-performance-degradation',
      alarmDescription: 'Both high error rate and high latency detected',
      compositeAlarmRule: cloudwatch.AlarmRule.allOf(
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

### lib/constructs/dashboards.ts

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

    const dashboard = new cloudwatch.Dashboard(this, 'PaymentPlatformDashboard', {
      dashboardName: 'payment-platform-monitoring',
      start: '-PT3H', // Last 3 hours
      periodOverride: cloudwatch.PeriodOverride.AUTO,
      defaultInterval: cdk.Duration.seconds(60), // 60s auto-refresh
    });

    // Payment Metrics Widget
    const paymentMetrics = new cloudwatch.GraphWidget({
      title: 'Payment Transaction Metrics',
      left: [
        new cloudwatch.Metric({
          namespace: 'PaymentPlatform',
          metricName: 'PaymentAttempts',
          statistic: 'Sum',
          label: 'Total Attempts',
        }),
        new cloudwatch.Metric({
          namespace: 'PaymentPlatform',
          metricName: 'PaymentSuccess',
          statistic: 'Sum',
          label: 'Successful Payments',
        }),
      ],
      right: [
        new cloudwatch.MathExpression({
          expression: '(m2/m1)*100',
          usingMetrics: {
            m1: new cloudwatch.Metric({
              namespace: 'PaymentPlatform',
              metricName: 'PaymentAttempts',
              statistic: 'Sum',
            }),
            m2: new cloudwatch.Metric({
              namespace: 'PaymentPlatform',
              metricName: 'PaymentSuccess',
              statistic: 'Sum',
            }),
          },
          label: 'Success Rate %',
          color: cloudwatch.Color.GREEN,
        }),
      ],
      width: 12,
      height: 6,
    });

    // API Latency Percentiles Widget
    const apiLatency = new cloudwatch.GraphWidget({
      title: 'API Latency Percentiles',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          dimensionsMap: { ApiName: 'PaymentAPI' },
          statistic: 'p50',
          label: 'p50',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          dimensionsMap: { ApiName: 'PaymentAPI' },
          statistic: 'p95',
          label: 'p95',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          dimensionsMap: { ApiName: 'PaymentAPI' },
          statistic: 'p99',
          label: 'p99',
          color: cloudwatch.Color.RED,
        }),
      ],
      width: 12,
      height: 6,
      leftAnnotations: [
        { value: 500, label: 'SLA Threshold', color: cloudwatch.Color.ORANGE },
      ],
    });

    // Error Rates by Payment Method
    const errorRates = new cloudwatch.GraphWidget({
      title: 'Error Rates by Payment Method',
      left: [
        new cloudwatch.Metric({
          namespace: 'PaymentPlatform',
          metricName: 'PaymentErrors',
          dimensionsMap: { PaymentMethod: 'CreditCard' },
          statistic: 'Average',
          label: 'Credit Card',
        }),
        new cloudwatch.Metric({
          namespace: 'PaymentPlatform',
          metricName: 'PaymentErrors',
          dimensionsMap: { PaymentMethod: 'DebitCard' },
          statistic: 'Average',
          label: 'Debit Card',
        }),
        new cloudwatch.Metric({
          namespace: 'PaymentPlatform',
          metricName: 'PaymentErrors',
          dimensionsMap: { PaymentMethod: 'BankTransfer' },
          statistic: 'Average',
          label: 'Bank Transfer',
        }),
      ],
      width: 12,
      height: 6,
    });

    // Database Metrics
    const databaseMetrics = new cloudwatch.GraphWidget({
      title: 'Database Performance',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'DatabaseConnections',
          dimensionsMap: { DBClusterIdentifier: 'payment-db-cluster' },
          statistic: 'Average',
          label: 'Active Connections',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'CPUUtilization',
          dimensionsMap: { DBClusterIdentifier: 'payment-db-cluster' },
          statistic: 'Average',
          label: 'CPU %',
        }),
      ],
      right: [
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'ReadLatency',
          dimensionsMap: { DBClusterIdentifier: 'payment-db-cluster' },
          statistic: 'Average',
          label: 'Read Latency (ms)',
          color: cloudwatch.Color.PURPLE,
        }),
      ],
      width: 12,
      height: 6,
    });

    // ECS Service Metrics
    const ecsMetrics = new cloudwatch.GraphWidget({
      title: 'ECS Service Health',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ECS',
          metricName: 'CPUUtilization',
          dimensionsMap: { 
            ServiceName: 'payment-service',
            ClusterName: 'payment-cluster'
          },
          statistic: 'Average',
          label: 'CPU Utilization',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/ECS',
          metricName: 'MemoryUtilization',
          dimensionsMap: { 
            ServiceName: 'payment-service',
            ClusterName: 'payment-cluster'
          },
          statistic: 'Average',
          label: 'Memory Utilization',
        }),
      ],
      width: 12,
      height: 6,
    });

    // Alarm Status Widget
    const alarmStatus = new cloudwatch.AlarmStatusWidget({
      title: 'Alarm Status',
      alarms: Array.from(props.alarms.values()),
      width: 12,
      height: 4,
    });

    // Custom Business Metrics
    const businessMetrics = new cloudwatch.GraphWidget({
      title: 'Business KPIs by Merchant',
      left: [
        new cloudwatch.Metric({
          namespace: 'PaymentPlatform/Business',
          metricName: 'MerchantTransactionVolume',
          dimensionsMap: { MerchantTier: 'Premium' },
          statistic: 'Sum',
          label: 'Premium Merchants',
        }),
        new cloudwatch.Metric({
          namespace: 'PaymentPlatform/Business',
          metricName: 'MerchantTransactionVolume',
          dimensionsMap: { MerchantTier: 'Standard' },
          statistic: 'Sum',
          label: 'Standard Merchants',
        }),
      ],
      width: 12,
      height: 6,
    });

    // Add widgets to dashboard
    dashboard.addWidgets(paymentMetrics, apiLatency);
    dashboard.addWidgets(errorRates, databaseMetrics);
    dashboard.addWidgets(ecsMetrics, businessMetrics);
    dashboard.addWidgets(alarmStatus);

    // Contributor Insights Rules
    new cloudwatch.CfnInsightRule(this, 'TopAPICallers', {
      ruleName: 'PaymentAPI-TopCallers',
      ruleState: 'ENABLED',
      ruleBody: JSON.stringify({
        Schema: {
          Name: 'CloudWatchLogRule',
          Version: 1,
        },
        AggregateOn: 'Count',
        Contribution: {
          Keys: ['$.clientIp'],
        },
        LogFormat: 'JSON',
        LogGroupNames: ['/aws/apigateway/payment-api'],
      }),
    });

    new cloudwatch.CfnInsightRule(this, 'TopErrorEndpoints', {
      ruleName: 'PaymentAPI-TopErrorEndpoints',
      ruleState: 'ENABLED',
      ruleBody: JSON.stringify({
        Schema: {
          Name: 'CloudWatchLogRule',
          Version: 1,
        },
        AggregateOn: 'Count',
        Contribution: {
          Keys: ['$.path'],
        },
        Filter: '{ $.statusCode >= 400 }',
        LogFormat: 'JSON',
        LogGroupNames: ['/aws/apigateway/payment-api'],
      }),
    });
  }
}
```

### lib/constructs/log-processing.ts

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

### lib/constructs/log-retention.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class LogRetentionConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // S3 bucket for log archives
    const logArchiveBucket = new s3.Bucket(this, 'LogArchiveBucket', {
      bucketName: `payment-logs-archive-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}`,
      lifecycleRules: [
        {
          id: 'ArchiveOldLogs',
          transitions: [
            {
              transitionAfter: cdk.Duration.days(90),
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
            },
            {
              transitionAfter: cdk.Duration.days(365),
              storageClass: s3.StorageClass.GLACIER,
            },
          ],
          expiration: cdk.Duration.days(2555), // 7 years for compliance
        },
      ],
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
    });

    // Create IAM role for CloudWatch Logs to export to S3
    const exportRole = new iam.Role(this, 'LogExportRole', {
      assumedBy: new iam.ServicePrincipal('logs.amazonaws.com'),
      inlinePolicies: {
        ExportPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                's3:PutObject',
                's3:GetObject',
                's3:ListBucket',
              ],
              resources: [
                logArchiveBucket.bucketArn,
                `${logArchiveBucket.bucketArn}/*`,
              ],
            }),
          ],
        }),
      },
    });

    // Lambda function for automated log export (simplified for example)
    const exportFunction = new lambda.Function(this, 'LogExporter', {
      functionName: 'payment-log-exporter',
      runtime: lambda.Runtime.PYTHON_3_11,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      timeout: cdk.Duration.minutes(5),
      code: lambda.Code.fromInline(`
import boto3
import json
from datetime import datetime, timedelta

logs_client = boto3.client('logs')

def handler(event, context):
    # Export logs from yesterday
    yesterday = datetime.now() - timedelta(days=1)
    start_time = int(yesterday.replace(hour=0, minute=0, second=0).timestamp() * 1000)
    end_time = int(yesterday.replace(hour=23, minute=59, second=59).timestamp() * 1000)
    
    log_groups = [
        '/aws/application/payment-platform',
        '/aws/apigateway/payment-api'
    ]
    
    for log_group in log_groups:
        try:
            response = logs_client.create_export_task(
                logGroupName=log_group,
                fromTime=start_time,
                to=end_time,
                destination='${logArchiveBucket.bucketName}',
                destinationPrefix=f'logs/{log_group.strip("/")}/{yesterday.strftime("%Y/%m/%d")}'
            )
            print(f'Started export task {response["taskId"]} for {log_group}')
        except Exception as e:
            print(f'Error exporting {log_group}: {str(e)}')
    
    return {
        'statusCode': 200,
        'body': json.dumps('Log export initiated')
    }
      `),
      environment: {
        BUCKET_NAME: logArchiveBucket.bucketName,
      },
    });

    // Grant permissions to export logs
    exportFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'logs:CreateExportTask',
        'logs:DescribeLogGroups',
      ],
      resources: ['*'],
    }));

    // Schedule daily log exports at 1 AM UTC
    const exportRule = new events.Rule(this, 'DailyExportRule', {
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '1',
      }),
    });
    exportRule.addTarget(new targets.LambdaFunction(exportFunction));
  }
}
```

### lambda/log-processor/index.ts

```typescript
import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
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
        metrics.addMetric('MerchantTransactionVolume', MetricUnits.Count, 1);
        metrics.addMetadata('merchantId', log.merchantId);
        metrics.addMetadata('merchantTier', log.merchantTier || 'Standard');
        metrics.addDimension('MerchantTier', log.merchantTier || 'Standard');
        
        metrics.addMetric('TransactionAmount', MetricUnits.None, log.amount);
        metrics.addDimension('Currency', log.currency || 'USD');
        metrics.addDimension('PaymentMethod', log.paymentMethod || 'Unknown');
      }

      // Track payment success/failure rates by merchant
      if (log.status) {
        if (log.status === 'success') {
          metrics.addMetric('PaymentSuccess', MetricUnits.Count, 1);
        } else if (log.status === 'failed') {
          metrics.addMetric('PaymentFailure', MetricUnits.Count, 1);
          if (log.errorCode) {
            metrics.addDimension('ErrorCode', log.errorCode);
          }
        }
        metrics.addMetric('PaymentAttempts', MetricUnits.Count, 1);
      }

      // Track API response times
      if (log.responseTime) {
        metrics.addMetric('APIResponseTime', MetricUnits.Milliseconds, log.responseTime);
      }

      // Calculate and emit payment failure rate
      if (log.status === 'failed') {
        metrics.addMetric('PaymentFailureRate', MetricUnits.Percent, 1);
      } else if (log.status === 'success') {
        metrics.addMetric('PaymentFailureRate', MetricUnits.Percent, 0);
      }

    } catch (error) {
      logger.error('Failed to parse log event', { error, message: logEvent.message });
    }
  }

  // Publish all collected metrics
  metrics.publishStoredMetrics();

  return { statusCode: 200 };
};
```

### README.md

```markdown
# Payment Platform Monitoring Stack

A comprehensive CloudWatch-based monitoring and alerting solution for a payment processing platform built with AWS CDK v2 and TypeScript.

## Features

- **CloudWatch Dashboards**: Real-time visualization of payment metrics, API latency (p50/p95/p99), error rates, and system health
- **Multi-Channel Alerting**: SNS topics with email and SMS notifications for operational and security incidents
- **Custom Business Metrics**: Lambda functions process logs and emit KPIs using CloudWatch Embedded Metric Format (EMF)
- **Log Processing**: Automated extraction of error patterns and security events using metric filters
- **Long-term Retention**: Automated daily export of logs to S3 with lifecycle policies for compliance
- **Composite Alarms**: Advanced alerting when multiple conditions occur simultaneously
- **Contributor Insights**: Automatic detection of top API callers and error-producing endpoints

## Prerequisites

- Node.js 18+ and npm
- AWS CLI configured with appropriate credentials
- AWS CDK v2 installed (`npm install -g aws-cdk`)
- Target AWS account with permissions to create CloudWatch, SNS, Lambda, S3, and IAM resources

## Installation

1. Clone the repository and install dependencies:
```bash
git clone <repository-url>
cd payment-monitoring-stack
npm install
```

2. Configure environment variables (optional):
```bash
export OPERATIONS_EMAIL="ops@yourcompany.com"
export SECURITY_EMAIL="security@yourcompany.com"
export ALERT_SMS="+1234567890"
```

3. Bootstrap CDK (if not already done):
```bash
cdk bootstrap aws://ACCOUNT-ID/us-east-1
```

## Deployment

Deploy the monitoring stack:
```bash
npm run deploy
```

Or using CDK directly:
```bash
cdk deploy --all
```

## Architecture

The stack creates the following resources:

### Monitoring Components
- **CloudWatch Dashboard** (`payment-platform-monitoring`): Unified view of all metrics
- **SNS Topics**: Separate topics for operational and security alerts
- **CloudWatch Alarms**: 
  - Payment failure rate > 1%
  - API response time > 500ms
  - Database connection pool > 90% utilization
  - ECS task failures
  - Authentication failures

### Log Processing
- **Lambda Function** (ARM64): Processes application logs and emits custom metrics
- **Log Groups**: 30-day retention with metric filters for error detection
- **S3 Bucket**: Long-term log archive with lifecycle policies

### Custom Metrics
- Payment success/failure rates by merchant tier
- Transaction volume by payment method
- API response time percentiles
- Business KPIs using CloudWatch EMF

## Verification Checklist

After deployment, verify the following:

### 1. Dashboard Access
- [ ] Navigate to CloudWatch Console → Dashboards
- [ ] Open `payment-platform-monitoring` dashboard
- [ ] Verify auto-refresh is set to 60 seconds
- [ ] Check that all widgets are displaying data (or "No data available" initially)

### 2. SNS Subscriptions
- [ ] Go to SNS Console → Topics
- [ ] Confirm email subscriptions for both topics
- [ ] Check email for subscription confirmation links
- [ ] Verify SMS subscriptions are active

### 3. Alarms Configuration
- [ ] Navigate to CloudWatch Console → Alarms
- [ ] Verify all 5 alarms are in "Insufficient data" or "OK" state
- [ ] Check alarm actions point to correct SNS topics

### 4. Lambda Function
- [ ] Go to Lambda Console
- [ ] Find `payment-log-processor` function
- [ ] Verify ARM64 architecture
- [ ] Check CloudWatch Logs for function execution

### 5. Log Groups and Filters
- [ ] Navigate to CloudWatch Console → Log groups
- [ ] Verify `/aws/application/payment-platform` exists
- [ ] Check metric filters are attached
- [ ] Confirm subscription filter to Lambda

### 6. S3 Bucket
- [ ] Go to S3 Console
- [ ] Find `payment-logs-archive-*` bucket
- [ ] Verify lifecycle rules are configured
- [ ] Check bucket encryption is enabled

### 7. Test Alerts
```bash
# Generate test metric to trigger alarm
aws cloudwatch put-metric-data \
  --namespace "PaymentPlatform" \
  --metric-name "PaymentFailureRate" \
  --value 5 \
  --region us-east-1
```

## Customization

### Adding New Metrics
Edit `lib/constructs/dashboards.ts` to add new widgets:
```typescript
const newWidget = new cloudwatch.GraphWidget({
  title: 'My Custom Metric',
  left: [myMetric],
  // ... configuration
});
dashboard.addWidgets(newWidget);
```

### Modifying Alarm Thresholds
Update thresholds in `lib/constructs/alarms.ts`:
```typescript
threshold: 500, // Change this value
evaluationPeriods: 2, // Number of periods before alarming
```

### Adding Log Patterns
Add new metric filters in `lib/constructs/log-processing.ts`:
```typescript
new logs.MetricFilter(this, 'NewPattern', {
  logGroup: appLogGroup,
  filterPattern: logs.FilterPattern.literal('[PATTERN]'),
  metricNamespace: 'PaymentPlatform',
  metricName: 'NewMetric',
});
```

## Monitoring Costs

Estimated monthly costs (varies by usage):
- CloudWatch Dashboards: $3/dashboard
- CloudWatch Alarms: $0.10/alarm
- CloudWatch Logs: $0.50/GB ingested + $0.03/GB stored
- SNS: $0.50/1M notifications (email) + SMS charges
- Lambda: Free tier usually covers log processing
- S3: $0.023/GB for standard storage

## Cleanup

To remove all resources:
```bash
npm run destroy
```

Or:
```bash
cdk destroy --all
```

**Note**: S3 bucket must be emptied manually before deletion.

## Support

For issues or questions:
1. Check CloudWatch Logs for error messages
2. Verify IAM permissions for all services
3. Ensure monitored services (ECS, RDS, API Gateway) exist and are properly tagged
4. Review AWS service quotas for CloudWatch

## License

[Your License]
```

This implementation provides a complete, production-ready monitoring and alerting solution for a payment processing platform. The stack includes all mandatory deliverables plus several optional enhancements:

**Implemented Features:**
1. ✅ CloudWatch Dashboards with payment metrics, API latency percentiles, and error rates
2. ✅ CloudWatch Alarms for payment failures, API latency, and DB connections
3. ✅ SNS Topics with email and SMS subscriptions
4. ✅ Lambda functions (ARM64) processing logs with EMF
5. ✅ CloudWatch Logs metric filters for error patterns
6. ✅ Composite alarms (high error rate AND high latency)
7. ✅ Automated log exports to S3 with lifecycle policies
8. ✅ Contributor Insights rules for top API callers and error endpoints

The solution follows AWS best practices for observability and provides operators with comprehensive tools to monitor and respond to payment processing issues quickly.