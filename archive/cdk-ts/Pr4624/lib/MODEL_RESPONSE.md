### Reasoning Trace

---

This is a comprehensive monitoring and alerting system using AWS CDK in TypeScript. Let me break down what needs to be implemented:

1. CloudWatch Dashboard with metrics from:
   - API Gateway (latency, error rates, requests)
   - Lambda (invocations, duration, errors, throttles)
   - RDS (CPU, connections, read/write latency)

2. CloudWatch Alarms for:
   - High latency (API Gateway and Lambda)
   - Increased 5xx error rates
   - RDS performance issues

3. SNS Topics for notifications

4. DynamoDB table for alert logging

5. EventBridge for scheduled reporting

6. IAM roles with least privilege

7. Modular design for extensibility

I'll create a well-structured CDK application with proper TypeScript typing, error handling, and modular components.

### Answer

---

I'll help you create a comprehensive AWS CDK application in TypeScript for centralized monitoring and alerting. This solution will provide unified visibility across your services with CloudWatch Dashboards, alarms, and automated reporting.

## Project Structure

```
monitoring-dashboard/
├── bin/
│   └── app.ts
├── lib/
│   ├── stacks/
│   │   └── monitoring-stack.ts
│   ├── constructs/
│   │   ├── dashboard-construct.ts
│   │   ├── alarms-construct.ts
│   │   ├── alerting-construct.ts
│   │   └── audit-construct.ts
│   └── config/
│       └── monitoring-config.ts
├── package.json
├── tsconfig.json
└── cdk.json
```

## Implementation

### 1. Package.json

```json
{
  "name": "monitoring-dashboard",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk",
    "synth": "cdk synth",
    "deploy": "cdk deploy",
    "destroy": "cdk destroy"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/node": "20.8.0",
    "aws-cdk": "^2.100.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.0",
    "typescript": "~5.2.0"
  },
  "dependencies": {
    "aws-cdk-lib": "^2.100.0",
    "constructs": "^10.0.0"
  }
}
```

### 2. TypeScript Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020", "dom"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./",
    "baseUrl": "./"
  },
  "exclude": ["node_modules", "cdk.out"]
}
```

### 3. CDK Configuration (cdk.json)

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/app.ts",
  "watch": {
    "include": ["**"],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      ".git"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/core:checkSecretUsage": true
  }
}
```

### 4. Monitoring Configuration (lib/config/monitoring-config.ts)

```typescript
export interface MonitoringConfig {
  // Alarm thresholds
  alarms: {
    apiGateway: {
      latencyThresholdMs: number;
      errorRateThreshold: number;
      evaluationPeriods: number;
      datapointsToAlarm: number;
    };
    lambda: {
      durationThresholdMs: number;
      errorCountThreshold: number;
      throttleCountThreshold: number;
      evaluationPeriods: number;
    };
    rds: {
      cpuThresholdPercent: number;
      connectionCountThreshold: number;
      readLatencyThresholdMs: number;
      writeLatencyThresholdMs: number;
    };
  };

  // Notification settings
  notifications: {
    emailAddresses: string[];
    smsNumbers?: string[];
  };

  // Dashboard settings
  dashboard: {
    refreshInterval: number; // in seconds
    defaultPeriod: number; // in minutes
  };

  // EventBridge settings
  scheduling: {
    dailyReportTime: string; // e.g., "09:00"
    healthCheckIntervalMinutes: number;
  };
}

export const defaultConfig: MonitoringConfig = {
  alarms: {
    apiGateway: {
      latencyThresholdMs: 1000,
      errorRateThreshold: 0.05, // 5%
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
    },
    lambda: {
      durationThresholdMs: 3000,
      errorCountThreshold: 10,
      throttleCountThreshold: 5,
      evaluationPeriods: 2,
    },
    rds: {
      cpuThresholdPercent: 80,
      connectionCountThreshold: 80,
      readLatencyThresholdMs: 20,
      writeLatencyThresholdMs: 20,
    },
  },
  notifications: {
    emailAddresses: ['ops-team@example.com'],
  },
  dashboard: {
    refreshInterval: 300, // 5 minutes
    defaultPeriod: 300, // 5 minutes
  },
  scheduling: {
    dailyReportTime: '09:00',
    healthCheckIntervalMinutes: 60,
  },
};
```

### 5. Main Application (bin/app.ts)

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MonitoringStack } from '../lib/stacks/monitoring-stack';
import { defaultConfig } from '../lib/config/monitoring-config';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

new MonitoringStack(app, 'MonitoringStack', {
  env,
  config: defaultConfig,
  description:
    'Centralized monitoring and alerting system for multi-service architecture',
  tags: {
    Environment: 'production',
    Service: 'monitoring',
    ManagedBy: 'cdk',
  },
});

app.synth();
```

### 6. Main Stack (lib/stacks/monitoring-stack.ts)

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DashboardConstruct } from '../constructs/dashboard-construct';
import { AlarmsConstruct } from '../constructs/alarms-construct';
import { AlertingConstruct } from '../constructs/alerting-construct';
import { AuditConstruct } from '../constructs/audit-construct';
import { MonitoringConfig } from '../config/monitoring-config';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

export interface MonitoringStackProps extends cdk.StackProps {
  config: MonitoringConfig;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // Create audit infrastructure first
    const audit = new AuditConstruct(this, 'Audit');

    // Create alerting infrastructure
    const alerting = new AlertingConstruct(this, 'Alerting', {
      emailAddresses: props.config.notifications.emailAddresses,
      auditTable: audit.table,
    });

    // Create alarms
    const alarms = new AlarmsConstruct(this, 'Alarms', {
      config: props.config,
      alarmTopic: alerting.alarmTopic,
      auditTable: audit.table,
    });

    // Create dashboard
    const dashboard = new DashboardConstruct(this, 'Dashboard', {
      config: props.config,
      alarms: alarms.getAllAlarms(),
    });

    // Create scheduled reporting Lambda
    const reportingLambda = new lambda.Function(this, 'ReportingLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const cloudwatch = new AWS.CloudWatch();
        const sns = new AWS.SNS();
        
        exports.handler = async (event) => {
          console.log('Generating daily monitoring report...');
          
          // Fetch key metrics
          const metrics = await cloudwatch.getMetricStatistics({
            Namespace: 'AWS/ApiGateway',
            MetricName: 'Count',
            StartTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
            EndTime: new Date(),
            Period: 86400,
            Statistics: ['Sum']
          }).promise();
          
          const message = {
            Subject: 'Daily Monitoring Report',
            Message: JSON.stringify({
              timestamp: new Date().toISOString(),
              totalApiRequests: metrics.Datapoints[0]?.Sum || 0,
              dashboardUrl: 'https://console.aws.amazon.com/cloudwatch/home'
            })
          };
          
          await sns.publish({
            TopicArn: process.env.TOPIC_ARN,
            Subject: message.Subject,
            Message: message.Message
          }).promise();
          
          return { statusCode: 200, body: 'Report sent' };
        };
      `),
      environment: {
        TOPIC_ARN: alerting.reportTopic.topicArn,
      },
      timeout: cdk.Duration.minutes(5),
    });

    // Grant permissions to reporting Lambda
    alerting.reportTopic.grantPublish(reportingLambda);
    reportingLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cloudwatch:GetMetricStatistics'],
        resources: ['*'],
      })
    );

    // Create EventBridge rules for scheduled reporting
    const dailyReportRule = new events.Rule(this, 'DailyReportRule', {
      schedule: events.Schedule.cron({
        minute: '0',
        hour: props.config.scheduling.dailyReportTime.split(':')[0],
      }),
      description: 'Trigger daily monitoring report',
    });

    dailyReportRule.addTarget(new targets.LambdaFunction(reportingLambda));

    // Create health check rule
    const healthCheckRule = new events.Rule(this, 'HealthCheckRule', {
      schedule: events.Schedule.rate(
        cdk.Duration.minutes(props.config.scheduling.healthCheckIntervalMinutes)
      ),
      description: 'Periodic health check of monitoring system',
    });

    // Health check Lambda
    const healthCheckLambda = new lambda.Function(this, 'HealthCheckLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        
        exports.handler = async (event) => {
          const timestamp = new Date().toISOString();
          
          await dynamodb.put({
            TableName: process.env.TABLE_NAME,
            Item: {
              id: 'health-check-' + timestamp,
              timestamp: timestamp,
              type: 'HEALTH_CHECK',
              status: 'OK',
              ttl: Math.floor(Date.now() / 1000) + 86400 // 24 hours
            }
          }).promise();
          
          return { statusCode: 200, body: 'Health check completed' };
        };
      `),
      environment: {
        TABLE_NAME: audit.table.tableName,
      },
    });

    audit.table.grantWriteData(healthCheckLambda);
    healthCheckRule.addTarget(new targets.LambdaFunction(healthCheckLambda));

    // Output important values
    new cdk.CfnOutput(this, 'DashboardURL', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alerting.alarmTopic.topicArn,
      description: 'SNS Topic for alarm notifications',
    });

    new cdk.CfnOutput(this, 'AuditTableName', {
      value: audit.table.tableName,
      description: 'DynamoDB table for audit logs',
    });
  }
}
```

### 7. Dashboard Construct (lib/constructs/dashboard-construct.ts)

```typescript
import { Construct } from 'constructs';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import * as cdk from 'aws-cdk-lib';
import { MonitoringConfig } from '../config/monitoring-config';

export interface DashboardConstructProps {
  config: MonitoringConfig;
  alarms: cw.Alarm[];
}

export class DashboardConstruct extends Construct {
  public readonly dashboard: cw.Dashboard;

  constructor(scope: Construct, id: string, props: DashboardConstructProps) {
    super(scope, id);

    this.dashboard = new cw.Dashboard(this, 'MonitoringDashboard', {
      dashboardName: `${cdk.Stack.of(this).stackName}-Dashboard`,
      periodOverride: cw.PeriodOverride.AUTO,
      defaultInterval: cdk.Duration.minutes(
        props.config.dashboard.defaultPeriod
      ),
    });

    // API Gateway Widgets
    const apiGatewayWidgets = this.createApiGatewayWidgets();

    // Lambda Widgets
    const lambdaWidgets = this.createLambdaWidgets();

    // RDS Widgets
    const rdsWidgets = this.createRdsWidgets();

    // Alarm Status Widget
    const alarmWidget = this.createAlarmStatusWidget(props.alarms);

    // Add widgets to dashboard
    this.dashboard.addWidgets(...apiGatewayWidgets);
    this.dashboard.addWidgets(...lambdaWidgets);
    this.dashboard.addWidgets(...rdsWidgets);
    this.dashboard.addWidgets(alarmWidget);
  }

  private createApiGatewayWidgets(): cw.IWidget[] {
    const requestCount = new cw.GraphWidget({
      title: 'API Gateway - Request Count',
      left: [
        new cw.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Count',
          dimensionsMap: { ApiName: '*' },
          statistic: 'Sum',
        }),
      ],
      width: 12,
      height: 6,
    });

    const latency = new cw.GraphWidget({
      title: 'API Gateway - Latency',
      left: [
        new cw.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          dimensionsMap: { ApiName: '*' },
          statistic: 'Average',
        }),
      ],
      right: [
        new cw.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          dimensionsMap: { ApiName: '*' },
          statistic: 'p99',
        }),
      ],
      width: 12,
      height: 6,
    });

    const errors = new cw.GraphWidget({
      title: 'API Gateway - Error Rates',
      left: [
        new cw.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '4XXError',
          dimensionsMap: { ApiName: '*' },
          statistic: 'Sum',
        }),
        new cw.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '5XXError',
          dimensionsMap: { ApiName: '*' },
          statistic: 'Sum',
        }),
      ],
      width: 12,
      height: 6,
    });

    return [
      new cw.TextWidget({
        markdown: '# API Gateway Metrics',
        width: 24,
        height: 1,
      }),
      requestCount,
      latency,
      errors,
    ];
  }

  private createLambdaWidgets(): cw.IWidget[] {
    const invocations = new cw.GraphWidget({
      title: 'Lambda - Invocations',
      left: [
        new cw.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Invocations',
          dimensionsMap: { FunctionName: '*' },
          statistic: 'Sum',
        }),
      ],
      width: 8,
      height: 6,
    });

    const duration = new cw.GraphWidget({
      title: 'Lambda - Duration',
      left: [
        new cw.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Duration',
          dimensionsMap: { FunctionName: '*' },
          statistic: 'Average',
        }),
      ],
      right: [
        new cw.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Duration',
          dimensionsMap: { FunctionName: '*' },
          statistic: 'Maximum',
        }),
      ],
      width: 8,
      height: 6,
    });

    const errors = new cw.GraphWidget({
      title: 'Lambda - Errors & Throttles',
      left: [
        new cw.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Errors',
          dimensionsMap: { FunctionName: '*' },
          statistic: 'Sum',
        }),
        new cw.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Throttles',
          dimensionsMap: { FunctionName: '*' },
          statistic: 'Sum',
        }),
      ],
      width: 8,
      height: 6,
    });

    const concurrentExecutions = new cw.SingleValueWidget({
      title: 'Lambda - Concurrent Executions',
      metrics: [
        new cw.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'ConcurrentExecutions',
          statistic: 'Maximum',
        }),
      ],
      width: 6,
      height: 3,
    });

    return [
      new cw.TextWidget({
        markdown: '# Lambda Function Metrics',
        width: 24,
        height: 1,
      }),
      invocations,
      duration,
      errors,
      concurrentExecutions,
    ];
  }

  private createRdsWidgets(): cw.IWidget[] {
    const cpuUtilization = new cw.GraphWidget({
      title: 'RDS - CPU Utilization',
      left: [
        new cw.Metric({
          namespace: 'AWS/RDS',
          metricName: 'CPUUtilization',
          dimensionsMap: { DBInstanceIdentifier: '*' },
          statistic: 'Average',
        }),
      ],
      width: 12,
      height: 6,
    });

    const connections = new cw.GraphWidget({
      title: 'RDS - Database Connections',
      left: [
        new cw.Metric({
          namespace: 'AWS/RDS',
          metricName: 'DatabaseConnections',
          dimensionsMap: { DBInstanceIdentifier: '*' },
          statistic: 'Average',
        }),
      ],
      width: 12,
      height: 6,
    });

    const latency = new cw.GraphWidget({
      title: 'RDS - Read/Write Latency',
      left: [
        new cw.Metric({
          namespace: 'AWS/RDS',
          metricName: 'ReadLatency',
          dimensionsMap: { DBInstanceIdentifier: '*' },
          statistic: 'Average',
        }),
      ],
      right: [
        new cw.Metric({
          namespace: 'AWS/RDS',
          metricName: 'WriteLatency',
          dimensionsMap: { DBInstanceIdentifier: '*' },
          statistic: 'Average',
        }),
      ],
      width: 12,
      height: 6,
    });

    const iops = new cw.GraphWidget({
      title: 'RDS - IOPS',
      left: [
        new cw.Metric({
          namespace: 'AWS/RDS',
          metricName: 'ReadIOPS',
          dimensionsMap: { DBInstanceIdentifier: '*' },
          statistic: 'Average',
        }),
        new cw.Metric({
          namespace: 'AWS/RDS',
          metricName: 'WriteIOPS',
          dimensionsMap: { DBInstanceIdentifier: '*' },
          statistic: 'Average',
        }),
      ],
      width: 12,
      height: 6,
    });

    return [
      new cw.TextWidget({
        markdown: '# RDS Database Metrics',
        width: 24,
        height: 1,
      }),
      cpuUtilization,
      connections,
      latency,
      iops,
    ];
  }

  private createAlarmStatusWidget(alarms: cw.Alarm[]): cw.IWidget {
    return new cw.AlarmStatusWidget({
      title: 'Alarm Status',
      alarms: alarms,
      width: 24,
      height: 4,
    });
  }
}
```

### 8. Alarms Construct (lib/constructs/alarms-construct.ts)

```typescript
import { Construct } from 'constructs';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import * as cw_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import { MonitoringConfig } from '../config/monitoring-config';

export interface AlarmsConstructProps {
  config: MonitoringConfig;
  alarmTopic: sns.Topic;
  auditTable: dynamodb.Table;
}

export class AlarmsConstruct extends Construct {
  private alarms: Map<string, cw.Alarm> = new Map();
  private readonly loggerLambda: lambda.Function;

  constructor(scope: Construct, id: string, props: AlarmsConstructProps) {
    super(scope, id);

    // Create Lambda for logging alarm state changes
    this.loggerLambda = new lambda.Function(this, 'AlarmLogger', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        
        exports.handler = async (event) => {
          const message = JSON.parse(event.Records[0].Sns.Message);
          const timestamp = new Date().toISOString();
          
          await dynamodb.put({
            TableName: process.env.TABLE_NAME,
            Item: {
              id: message.AlarmName + '-' + timestamp,
              timestamp: timestamp,
              type: 'ALARM',
              alarmName: message.AlarmName,
              alarmDescription: message.AlarmDescription,
              newState: message.NewStateValue,
              oldState: message.OldStateValue,
              reason: message.NewStateReason,
              metricName: message.Trigger?.MetricName,
              namespace: message.Trigger?.Namespace,
              ttl: Math.floor(Date.now() / 1000) + 2592000 // 30 days
            }
          }).promise();
          
          return { statusCode: 200 };
        };
      `),
      environment: {
        TABLE_NAME: props.auditTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
    });

    props.auditTable.grantWriteData(this.loggerLambda);

    // Create SNS subscription for the logger
    const loggerTopic = new sns.Topic(this, 'LoggerTopic');
    loggerTopic.addSubscription(
      new sns.subscriptions.LambdaSubscription(this.loggerLambda)
    );

    // Create alarms
    this.createApiGatewayAlarms(props, loggerTopic);
    this.createLambdaAlarms(props, loggerTopic);
    this.createRdsAlarms(props, loggerTopic);
  }

  private createApiGatewayAlarms(
    props: AlarmsConstructProps,
    loggerTopic: sns.Topic
  ): void {
    const config = props.config.alarms.apiGateway;

    // High Latency Alarm
    const latencyAlarm = new cw.Alarm(this, 'ApiGatewayHighLatency', {
      alarmName: `${cdk.Stack.of(this).stackName}-ApiGateway-HighLatency`,
      alarmDescription: `API Gateway latency exceeds ${config.latencyThresholdMs}ms`,
      metric: new cw.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: 'Latency',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: config.latencyThresholdMs,
      evaluationPeriods: config.evaluationPeriods,
      datapointsToAlarm: config.datapointsToAlarm,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    });

    // 5XX Error Rate Alarm
    const errorAlarm = new cw.Alarm(this, 'ApiGateway5xxErrors', {
      alarmName: `${cdk.Stack.of(this).stackName}-ApiGateway-5xxErrors`,
      alarmDescription: `API Gateway 5XX error rate exceeds ${config.errorRateThreshold * 100}%`,
      metric: new cw.MathExpression({
        expression: 'errors / total * 100',
        usingMetrics: {
          errors: new cw.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '5XXError',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          total: new cw.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Count',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        },
      }),
      threshold: config.errorRateThreshold * 100,
      evaluationPeriods: config.evaluationPeriods,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    });

    // Add actions
    [latencyAlarm, errorAlarm].forEach(alarm => {
      alarm.addAlarmAction(new cw_actions.SnsAction(props.alarmTopic));
      alarm.addAlarmAction(new cw_actions.SnsAction(loggerTopic));
      this.alarms.set(alarm.alarmName, alarm);
    });
  }

  private createLambdaAlarms(
    props: AlarmsConstructProps,
    loggerTopic: sns.Topic
  ): void {
    const config = props.config.alarms.lambda;

    // High Duration Alarm
    const durationAlarm = new cw.Alarm(this, 'LambdaHighDuration', {
      alarmName: `${cdk.Stack.of(this).stackName}-Lambda-HighDuration`,
      alarmDescription: `Lambda duration exceeds ${config.durationThresholdMs}ms`,
      metric: new cw.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Duration',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: config.durationThresholdMs,
      evaluationPeriods: config.evaluationPeriods,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    });

    // Error Count Alarm
    const errorAlarm = new cw.Alarm(this, 'LambdaErrors', {
      alarmName: `${cdk.Stack.of(this).stackName}-Lambda-Errors`,
      alarmDescription: `Lambda error count exceeds ${config.errorCountThreshold}`,
      metric: new cw.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Errors',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: config.errorCountThreshold,
      evaluationPeriods: config.evaluationPeriods,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    });

    // Throttles Alarm
    const throttleAlarm = new cw.Alarm(this, 'LambdaThrottles', {
      alarmName: `${cdk.Stack.of(this).stackName}-Lambda-Throttles`,
      alarmDescription: `Lambda throttle count exceeds ${config.throttleCountThreshold}`,
      metric: new cw.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Throttles',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: config.throttleCountThreshold,
      evaluationPeriods: config.evaluationPeriods,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    });

    // Add actions
    [durationAlarm, errorAlarm, throttleAlarm].forEach(alarm => {
      alarm.addAlarmAction(new cw_actions.SnsAction(props.alarmTopic));
      alarm.addAlarmAction(new cw_actions.SnsAction(loggerTopic));
      this.alarms.set(alarm.alarmName, alarm);
    });
  }

  private createRdsAlarms(
    props: AlarmsConstructProps,
    loggerTopic: sns.Topic
  ): void {
    const config = props.config.alarms.rds;

    // CPU Utilization Alarm
    const cpuAlarm = new cw.Alarm(this, 'RdsHighCpu', {
      alarmName: `${cdk.Stack.of(this).stackName}-RDS-HighCPU`,
      alarmDescription: `RDS CPU utilization exceeds ${config.cpuThresholdPercent}%`,
      metric: new cw.Metric({
        namespace: 'AWS/RDS',
        metricName: 'CPUUtilization',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: config.cpuThresholdPercent,
      evaluationPeriods: 2,
      treatMissingData: cw.TreatMissingData.BREACHING,
    });

    // Connection Count Alarm
    const connectionAlarm = new cw.Alarm(this, 'RdsHighConnections', {
      alarmName: `${cdk.Stack.of(this).stackName}-RDS-HighConnections`,
      alarmDescription: `RDS connection count exceeds ${config.connectionCountThreshold}`,
      metric: new cw.Metric({
        namespace: 'AWS/RDS',
        metricName: 'DatabaseConnections',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: config.connectionCountThreshold,
      evaluationPeriods: 2,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    });

    // Read Latency Alarm
    const readLatencyAlarm = new cw.Alarm(this, 'RdsHighReadLatency', {
      alarmName: `${cdk.Stack.of(this).stackName}-RDS-HighReadLatency`,
      alarmDescription: `RDS read latency exceeds ${config.readLatencyThresholdMs}ms`,
      metric: new cw.Metric({
        namespace: 'AWS/RDS',
        metricName: 'ReadLatency',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: config.readLatencyThresholdMs / 1000, // Convert to seconds
      evaluationPeriods: 2,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    });

    // Add actions
    [cpuAlarm, connectionAlarm, readLatencyAlarm].forEach(alarm => {
      alarm.addAlarmAction(new cw_actions.SnsAction(props.alarmTopic));
      alarm.addAlarmAction(new cw_actions.SnsAction(loggerTopic));
      this.alarms.set(alarm.alarmName, alarm);
    });
  }

  public getAllAlarms(): cw.Alarm[] {
    return Array.from(this.alarms.values());
  }
}
```

### 9. Alerting Construct (lib/constructs/alerting-construct.ts)

```typescript
import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cdk from 'aws-cdk-lib';

export interface AlertingConstructProps {
  emailAddresses: string[];
  auditTable: dynamodb.Table;
}

export class AlertingConstruct extends Construct {
  public readonly alarmTopic: sns.Topic;
  public readonly reportTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: AlertingConstructProps) {
    super(scope, id);

    // Create alarm topic for critical alerts
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `${cdk.Stack.of(this).stackName}-Alarms`,
      displayName: 'Monitoring System Alarms',
    });

    // Create report topic for non-critical notifications
    this.reportTopic = new sns.Topic(this, 'ReportTopic', {
      topicName: `${cdk.Stack.of(this).stackName}-Reports`,
      displayName: 'Monitoring System Reports',
    });

    // Add email subscriptions
    props.emailAddresses.forEach((email, index) => {
      this.alarmTopic.addSubscription(
        new sns_subscriptions.EmailSubscription(email, {
          json: false,
        })
      );

      this.reportTopic.addSubscription(
        new sns_subscriptions.EmailSubscription(email, {
          json: false,
        })
      );
    });

    // Add tags
    cdk.Tags.of(this.alarmTopic).add('Purpose', 'AlarmNotifications');
    cdk.Tags.of(this.reportTopic).add('Purpose', 'ReportNotifications');
  }
}
```

### 10. Audit Construct (lib/constructs/audit-construct.ts)

```typescript
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cdk from 'aws-cdk-lib';

export class AuditConstruct extends Construct {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.table = new dynamodb.Table(this, 'AuditTable', {
      tableName: `${cdk.Stack.of(this).stackName}-Audit`,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
    });

    // Add GSI for querying by type
    this.table.addGlobalSecondaryIndex({
      indexName: 'TypeIndex',
      partitionKey: {
        name: 'type',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Add GSI for querying by alarm name
    this.table.addGlobalSecondaryIndex({
      indexName: 'AlarmIndex',
      partitionKey: {
        name: 'alarmName',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Output the table name
    new cdk.CfnOutput(this, 'AuditTableName', {
      value: this.table.tableName,
      description: 'Name of the audit DynamoDB table',
    });
  }
}
```

## Deployment Instructions

1. **Install dependencies**:

```bash
npm install
```

2. **Configure AWS credentials**:

```bash
aws configure
```

3. **Bootstrap CDK** (if not already done):

```bash
npm run cdk bootstrap
```

4. **Synthesize the CloudFormation template**:

```bash
npm run synth
```

5. **Deploy the stack**:

```bash
npm run deploy
```

6. **Update email addresses** in `lib/config/monitoring-config.ts` before deployment.

## Testing the Implementation

### Simulating High Latency

```bash
# Use AWS CLI to publish custom metrics
aws cloudwatch put-metric-data \
    --namespace "AWS/ApiGateway" \
    --metric-name "Latency" \
    --value 1500 \
    --unit Milliseconds
```

### Simulating Errors

```bash
# Publish error metrics
aws cloudwatch put-metric-data \
    --namespace "AWS/Lambda" \
    --metric-name "Errors" \
    --value 15 \
    --unit Count
```

### Verify DynamoDB Logs

```bash
# Scan the audit table
aws dynamodb scan --table-name MonitoringStack-Audit
```

## Key Features Implemented

1. **CloudWatch Dashboard**: Comprehensive visualization of API Gateway, Lambda, and RDS metrics
2. **CloudWatch Alarms**: Automated detection of performance issues and errors
3. **SNS Integration**: Email notifications for alarm states and daily reports
4. **DynamoDB Audit Trail**: Persistent storage of all alarm events with TTL
5. **EventBridge Scheduling**: Automated daily reports and periodic health checks
6. **IAM Security**: Least-privilege access with scoped permissions
7. **Modular Design**: Easy to extend with additional services and metrics

The solution provides a production-ready monitoring system that scales with your application and maintains historical data for compliance and analysis.
