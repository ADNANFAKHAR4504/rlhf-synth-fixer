# Serverless Monitoring System Implementation

## Architecture Overview

A serverless monitoring system built with AWS CDK (TypeScript) to monitor five Lambda functions handling 1,500+ daily requests. The system provides automated alerting, performance tracking, and operational overview.

## Key Components

### Lambda Functions (5)
- **user-service**: Handles user management operations
- **order-processor**: Processes customer orders
- **payment-handler**: Manages payment transactions
- **notification-sender**: Sends notifications to users
- **data-aggregator**: Aggregates business metrics

Each function runs on Node.js 18 runtime with:
- 256MB memory allocation
- 30-second timeout
- Built-in error simulation (7% error rate)
- DynamoDB error logging
- CloudWatch metrics integration

### Monitoring Infrastructure

#### CloudWatch Alarms
- **Error Rate Monitoring**: Triggers when error rate >5% over 2 evaluation periods
- **Latency Monitoring**: Alerts when average duration >500ms over 2 evaluation periods  
- **Throttle Detection**: Monitors function throttling with 1 evaluation period

#### DynamoDB Error Storage
- Table: `error-logs-{environmentSuffix}`
- Partition Key: `errorId` 
- Sort Key: `timestamp`
- GSI: `FunctionNameIndex` for querying by function name
- Pay-per-request billing mode
- Point-in-time recovery enabled

#### SNS Notifications
- Topic: `monitoring-alerts-{environmentSuffix}`
- Email subscription for admin notifications
- Integrated with all CloudWatch alarms

#### CloudWatch Dashboard
- Dashboard name: `serverless-monitoring-{environmentSuffix}`
- Summary widgets showing 24h metrics
- Individual function invocation/error graphs
- Duration tracking with average and P99 percentiles

### Security & IAM

#### Lambda Execution Role
- Basic execution permissions via AWS managed policy
- DynamoDB write permissions for error logging
- CloudWatch Logs permissions for function logging
- Least privilege access model

## Implementation

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  notificationEmail?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const envSuffix = props?.environmentSuffix || this.node.tryGetContext('environmentSuffix') || 'dev';
    const email = props?.notificationEmail || 'admin@example.com';

    // DynamoDB Table for Error Logs
    const errorLogsTable = new dynamodb.Table(this, 'ErrorLogsTable', {
      tableName: `error-logs-${envSuffix}`,
      partitionKey: {
        name: 'errorId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Global Secondary Index for querying by function name
    errorLogsTable.addGlobalSecondaryIndex({
      indexName: 'FunctionNameIndex',
      partitionKey: {
        name: 'functionName',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // SNS Topic for Alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `monitoring-alerts-${envSuffix}`,
      displayName: `Monitoring Alerts - ${envSuffix.toUpperCase()}`,
    });

    alertTopic.addSubscription(new sns_subscriptions.EmailSubscription(email));

    // IAM Role for Lambda Functions
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: `Execution role for monitored Lambda functions - ${envSuffix}`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    errorLogsTable.grantWriteData(lambdaExecutionRole);

    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: ['*'],
      })
    );

    // Lambda Functions
    const lambdaFunctions: lambda.Function[] = [];
    const functionNames = ['user-service', 'order-processor', 'payment-handler', 'notification-sender', 'data-aggregator'];

    functionNames.forEach(funcName => {
      const func = new lambda.Function(this, `${funcName}Function`, {
        functionName: `${funcName}-${envSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const dynamodb = new DynamoDBClient({});

exports.handler = async (event) => {
  const startTime = Date.now();
  
  try {
    console.log('Processing request:', JSON.stringify(event));
    
    const processingTime = Math.random() * 400 + 100;
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    if (Math.random() < 0.07) {
      throw new Error('Simulated processing error');
    }
    
    const duration = Date.now() - startTime;
    console.log(\`Request completed in \${duration}ms\`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Success',
        function: '${funcName}',
        duration: duration,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Error processing request:', error);
    
    try {
      const errorId = \`\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
      await dynamodb.send(new PutItemCommand({
        TableName: process.env.ERROR_TABLE_NAME,
        Item: {
          errorId: { S: errorId },
          timestamp: { S: new Date().toISOString() },
          functionName: { S: process.env.FUNCTION_NAME },
          errorMessage: { S: error.message },
          errorStack: { S: error.stack || 'No stack trace' },
          duration: { N: duration.toString() },
          eventData: { S: JSON.stringify(event) },
        },
      }));
    } catch (dbError) {
      console.error('Failed to log error to DynamoDB:', dbError);
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        function: '${funcName}',
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
        `),
        role: lambdaExecutionRole,
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        environment: {
          ERROR_TABLE_NAME: errorLogsTable.tableName,
          FUNCTION_NAME: `${funcName}-${envSuffix}`,
          ENVIRONMENT: envSuffix,
        },
      });

      lambdaFunctions.push(func);

      // CloudWatch Alarms for Each Function
      const errorMetric = func.metricErrors({
        statistic: cloudwatch.Stats.SUM,
        period: cdk.Duration.minutes(5),
      });

      const invocationMetric = func.metricInvocations({
        statistic: cloudwatch.Stats.SUM,
        period: cdk.Duration.minutes(5),
      });

      // Error Rate Alarm (>5%)
      const errorRateAlarm = new cloudwatch.Alarm(this, `${funcName}ErrorRateAlarm`, {
        alarmName: `${funcName}-error-rate-${envSuffix}`,
        alarmDescription: `Error rate exceeded 5% for ${funcName}`,
        metric: new cloudwatch.MathExpression({
          expression: '(errors / invocations) * 100',
          usingMetrics: {
            errors: errorMetric,
            invocations: invocationMetric,
          },
          period: cdk.Duration.minutes(5),
        }),
        threshold: 5,
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      errorRateAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));

      // Latency Alarm (>500ms)
      const latencyAlarm = new cloudwatch.Alarm(this, `${funcName}LatencyAlarm`, {
        alarmName: `${funcName}-latency-${envSuffix}`,
        alarmDescription: `Average duration exceeded 500ms for ${funcName}`,
        metric: func.metricDuration({
          statistic: cloudwatch.Stats.AVERAGE,
          period: cdk.Duration.minutes(5),
        }),
        threshold: 500,
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      latencyAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));

      // Throttle Alarm
      const throttleAlarm = new cloudwatch.Alarm(this, `${funcName}ThrottleAlarm`, {
        alarmName: `${funcName}-throttles-${envSuffix}`,
        alarmDescription: `Function ${funcName} is being throttled`,
        metric: func.metricThrottles({
          statistic: cloudwatch.Stats.SUM,
          period: cdk.Duration.minutes(5),
        }),
        threshold: 5,
        evaluationPeriods: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      throttleAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'MonitoringDashboard', {
      dashboardName: `serverless-monitoring-${envSuffix}`,
    });

    const invocationWidgets = lambdaFunctions.map(func =>
      new cloudwatch.GraphWidget({
        title: `${func.functionName} - Invocations & Errors`,
        left: [
          func.metricInvocations({
            statistic: cloudwatch.Stats.SUM,
            period: cdk.Duration.minutes(5),
          }),
        ],
        right: [
          func.metricErrors({
            statistic: cloudwatch.Stats.SUM,
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
        height: 6,
      })
    );

    const durationWidgets = lambdaFunctions.map(func =>
      new cloudwatch.GraphWidget({
        title: `${func.functionName} - Duration`,
        left: [
          func.metricDuration({
            statistic: cloudwatch.Stats.AVERAGE,
            period: cdk.Duration.minutes(5),
            label: 'Average',
          }),
          func.metricDuration({
            statistic: cloudwatch.Stats.p(99),
            period: cdk.Duration.minutes(5),
            label: 'P99',
          }),
        ],
        width: 12,
        height: 6,
      })
    );

    // Summary widgets
    dashboard.addWidgets(
      new cloudwatch.SingleValueWidget({
        title: 'Total Invocations (24h)',
        metrics: lambdaFunctions.map(func =>
          func.metricInvocations({
            statistic: cloudwatch.Stats.SUM,
            period: cdk.Duration.hours(24),
          })
        ),
        width: 8,
        height: 4,
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Total Errors (24h)',
        metrics: lambdaFunctions.map(func =>
          func.metricErrors({
            statistic: cloudwatch.Stats.SUM,
            period: cdk.Duration.hours(24),
          })
        ),
        width: 8,
        height: 4,
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Avg Duration (24h)',
        metrics: lambdaFunctions.map(func =>
          func.metricDuration({
            statistic: cloudwatch.Stats.AVERAGE,
            period: cdk.Duration.hours(24),
          })
        ),
        width: 8,
        height: 4,
      })
    );

    invocationWidgets.forEach((widget, index) => {
      dashboard.addWidgets(widget, durationWidgets[index]);
    });

    // Outputs
    new cdk.CfnOutput(this, 'ErrorLogsTableName', {
      value: errorLogsTable.tableName,
      description: 'DynamoDB table for error logs',
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: alertTopic.topicArn,
      description: 'SNS topic for monitoring alerts',
    });

    new cdk.CfnOutput(this, 'DashboardURL', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });

    lambdaFunctions.forEach((func, index) => {
      new cdk.CfnOutput(this, `Function${index + 1}Name`, {
        value: func.functionName!,
        description: `Lambda function ${index + 1}`,
      });
    });
  }
}
```

## Implementation Code

The complete implementation is available in `lib/tap-stack.ts` with proper CDK constructs for all components.

## Deployment Outputs

Stack provides essential outputs for integration testing:
- `ErrorLogsTableName`: DynamoDB table name
- `AlertTopicArn`: SNS topic for notifications  
- `DashboardURL`: CloudWatch dashboard link
- `Function1Name` through `Function5Name`: Lambda function names

## Monitoring Capabilities

### Real-time Alerting
- Email notifications via SNS
- Multiple alarm types per function
- Configurable thresholds and evaluation periods

### Error Tracking
- Structured error logging to DynamoDB
- Error metadata capture (stack traces, duration, event data)
- Queryable by function name and timestamp

### Performance Monitoring
- Duration metrics with percentiles
- Invocation and error rate tracking
- Visual dashboard for operational overview

This implementation provides a production-ready monitoring solution for serverless workloads with comprehensive alerting and error tracking capabilities.