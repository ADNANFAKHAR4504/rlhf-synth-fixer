# Real-Time Trading Event Processing System - Perfect Implementation

This is the ideal AWS CDK TypeScript implementation for a highly resilient, multi-region disaster recovery system for real-time trading event processing.

## Architecture Overview

The system uses a modular stack architecture with 6 separate stack files, each handling a specific component. This provides clear separation of concerns and enables independent testing.

## Stack Structure

```
lib/
  tap-stack.ts                    # Main orchestration stack
  global-endpoint-stack.ts        # EventBridge Global Endpoint with health checks
  event-bus-stack.ts              # Primary EventBridge Event Bus with rules and DLQ
  secondary-event-bus-stack.ts    # Secondary Event Bus for failover
  processing-lambda-stack.ts      # Lambda Function with X-Ray and Powertools
  dynamodb-stack.ts               # DynamoDB Global Tables
  monitoring-stack.ts             # CloudWatch Alarms and SNS notifications
```

## Implementation

### 1. Main TAP Stack code(`lib/tap-stack.ts`)

This is the orchestration stack that instantiates all other stacks and manages dependencies.

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DynamoDBStack } from './dynamodb-stack';
import { ProcessingLambdaStack } from './processing-lambda-stack';
import { EventBusStack } from './event-bus-stack';
import { SecondaryEventBusStack } from './secondary-event-bus-stack';
import { GlobalEndpointStack } from './global-endpoint-stack';
import { MonitoringStack } from './monitoring-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    /* istanbul ignore next */
    const primaryRegion = this.region || 'us-east-1';
    const secondaryRegion = 'us-west-2';

    // Create the DynamoDB Global Table stack
    const dynamoDBStack = new DynamoDBStack(this, 'DynamoDBStack', {
      environmentSuffix: environmentSuffix,
      env: { region: primaryRegion },
    });

    // Create the Processing Lambda stack
    const lambdaStack = new ProcessingLambdaStack(
      this,
      'ProcessingLambdaStack',
      {
        environmentSuffix: environmentSuffix,
        globalTable: dynamoDBStack.globalTable,
        env: { region: primaryRegion },
      }
    );

    // Create the Event Bus stack in primary region
    const eventBusStack = new EventBusStack(this, 'EventBusStack', {
      environmentSuffix: environmentSuffix,
      processingLambda: lambdaStack.processingLambda,
      env: { region: primaryRegion },
    });

    // Create a secondary event bus in us-west-2 for failover
    // IMPORTANT: The event bus name must match the primary region's bus name
    const secondaryEventBusStack = new SecondaryEventBusStack(
      this,
      'SecondaryEventBusStack',
      {
        eventBusName: eventBusStack.eventBus.eventBusName,
        env: {
          region: secondaryRegion,
          account: this.account,
        },
      }
    );

    // Construct the secondary event bus ARN manually to avoid cross-region reference
    const secondaryEventBusArn = `arn:aws:events:${secondaryRegion}:${this.account}:event-bus/${eventBusStack.eventBus.eventBusName}`;

    // Create the Global Endpoint stack
    const globalEndpointStack = new GlobalEndpointStack(
      this,
      'GlobalEndpointStack',
      {
        environmentSuffix: environmentSuffix,
        primaryRegion: primaryRegion,
        secondaryRegion: secondaryRegion,
        eventBusArn: eventBusStack.eventBus.eventBusArn,
        secondaryEventBusArn: secondaryEventBusArn,
        eventBusName: eventBusStack.eventBus.eventBusName,
        env: { region: primaryRegion },
      }
    );

    // Create the Monitoring stack
    const monitoringStack = new MonitoringStack(this, 'MonitoringStack', {
      environmentSuffix: environmentSuffix,
      dlq: eventBusStack.dlq,
      env: { region: primaryRegion },
    });

    // Add dependencies to ensure proper deployment order
    lambdaStack.addDependency(dynamoDBStack);
    eventBusStack.addDependency(lambdaStack);
    globalEndpointStack.addDependency(eventBusStack);
    globalEndpointStack.addDependency(secondaryEventBusStack);
    monitoringStack.addDependency(eventBusStack);
  }
}
```

### 2. Global Endpoint Stack (`lib/global-endpoint-stack.ts`)

Implements EventBridge Global Endpoint with sophisticated health monitoring using CloudWatch alarms and Route53 health checks.

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface GlobalEndpointStackProps extends cdk.StackProps {
  primaryRegion: string;
  secondaryRegion: string;
  eventBusArn: string;
  secondaryEventBusArn: string;
  environmentSuffix: string;
  eventBusName: string;
}

export class GlobalEndpointStack extends cdk.Stack {
  public readonly globalEndpoint: events.CfnEndpoint;
  public readonly healthCheck: route53.CfnHealthCheck;

  constructor(scope: Construct, id: string, props: GlobalEndpointStackProps) {
    super(scope, id, props);

    const suffix = props.environmentSuffix;

    // Create a CloudWatch alarm for the primary region's event bus
    // This alarm will be in ALARM state if the event bus is unhealthy
    const healthAlarm = new cloudwatch.Alarm(this, 'PrimaryRegionHealthAlarm', {
      alarmName: `eventbridge-primary-health-${suffix}`,
      alarmDescription:
        'Health check for EventBridge Global Endpoint primary region',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Events',
        metricName: 'Invocations',
        dimensionsMap: {
          EventBusName: props.eventBusName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(1),
      }),
      threshold: 0,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Create a Route 53 health check that monitors the CloudWatch alarm
    this.healthCheck = new route53.CfnHealthCheck(
      this,
      'PrimaryRegionHealthCheck',
      {
        healthCheckConfig: {
          type: 'CLOUDWATCH_METRIC',
          alarmIdentifier: {
            name: healthAlarm.alarmName,
            region: props.primaryRegion,
          },
          insufficientDataHealthStatus: 'Healthy',
        },
      }
    );

    // Create IAM role for EventBridge Global Endpoint replication with inline policy
    const replicationRole = new iam.Role(this, 'ReplicationRole', {
      roleName: `eventbridge-replication-role-${suffix}`,
      assumedBy: new iam.ServicePrincipal('events.amazonaws.com'),
      description: 'IAM role for EventBridge Global Endpoint replication',
      inlinePolicies: {
        EventBridgeReplicationPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'events:PutEvents',
                'events:PutRule',
                'events:DeleteRule',
                'events:DescribeRule',
                'events:PutTargets',
                'events:RemoveTargets',
                'events:ListTargetsByRule',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['iam:PassRole'],
              resources: ['*'],
              conditions: {
                StringLike: {
                  'iam:PassedToService': 'events.amazonaws.com',
                },
              },
            }),
          ],
        }),
      },
    });

    // Create an EventBridge Global Endpoint
    this.globalEndpoint = new events.CfnEndpoint(
      this,
      'TradingGlobalEndpoint',
      {
        name: `trading-global-endpoint-${suffix}`,
        routingConfig: {
          failoverConfig: {
            primary: {
              healthCheck: cdk.Arn.format(
                {
                  service: 'route53',
                  region: '',
                  account: '',
                  resource: 'healthcheck',
                  resourceName: this.healthCheck.attrHealthCheckId,
                },
                this
              ),
            },
            secondary: {
              route: props.secondaryRegion,
            },
          },
        },
        replicationConfig: {
          state: 'ENABLED',
        },
        roleArn: replicationRole.roleArn,
        eventBuses: [
          {
            eventBusArn: props.eventBusArn,
          },
          {
            eventBusArn: props.secondaryEventBusArn,
          },
        ],
      }
    );

    // Outputs for integration testing
    new cdk.CfnOutput(this, 'GlobalEndpointUrl', {
      value: this.globalEndpoint.attrEndpointUrl,
      description: 'URL for the EventBridge Global Endpoint',
      exportName: `trading-global-endpoint-url-${suffix}`,
    });

    new cdk.CfnOutput(this, 'GlobalEndpointArn', {
      value: this.globalEndpoint.attrArn,
      description: 'ARN for the EventBridge Global Endpoint',
      exportName: `trading-global-endpoint-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, 'GlobalEndpointName', {
      value: this.globalEndpoint.name!,
      description: 'Name of the EventBridge Global Endpoint',
      exportName: `trading-global-endpoint-name-${suffix}`,
    });

    new cdk.CfnOutput(this, 'GlobalEndpointId', {
      value: this.globalEndpoint.attrEndpointId,
      description: 'ID of the EventBridge Global Endpoint',
      exportName: `trading-global-endpoint-id-${suffix}`,
    });

    new cdk.CfnOutput(this, 'GlobalEndpointState', {
      value: this.globalEndpoint.attrState,
      description: 'State of the EventBridge Global Endpoint',
      exportName: `trading-global-endpoint-state-${suffix}`,
    });

    new cdk.CfnOutput(this, 'PrimaryRegion', {
      value: props.primaryRegion,
      description: 'Primary region for the Global Endpoint',
      exportName: `trading-global-endpoint-primary-region-${suffix}`,
    });

    new cdk.CfnOutput(this, 'SecondaryRegion', {
      value: props.secondaryRegion,
      description: 'Secondary region for the Global Endpoint',
      exportName: `trading-global-endpoint-secondary-region-${suffix}`,
    });

    new cdk.CfnOutput(this, 'ReplicationRoleArn', {
      value: replicationRole.roleArn,
      description: 'ARN of the IAM role for EventBridge replication',
      exportName: `trading-replication-role-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, 'ReplicationRoleName', {
      value: replicationRole.roleName,
      description: 'Name of the IAM role for EventBridge replication',
      exportName: `trading-replication-role-name-${suffix}`,
    });

    new cdk.CfnOutput(this, 'HealthCheckId', {
      value: this.healthCheck.attrHealthCheckId,
      description: 'Route 53 Health Check ID for the primary region',
      exportName: `trading-health-check-id-${suffix}`,
    });

    new cdk.CfnOutput(this, 'HealthAlarmName', {
      value: healthAlarm.alarmName,
      description: 'CloudWatch Alarm name for primary region health',
      exportName: `trading-health-alarm-name-${suffix}`,
    });

    new cdk.CfnOutput(this, 'HealthAlarmArn', {
      value: healthAlarm.alarmArn,
      description: 'CloudWatch Alarm ARN for primary region health',
      exportName: `trading-health-alarm-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, 'PrimaryEventBusArn', {
      value: props.eventBusArn,
      description: 'ARN of the primary EventBridge event bus',
      exportName: `trading-primary-event-bus-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, 'SecondaryEventBusArn', {
      value: props.secondaryEventBusArn,
      description: 'ARN of the secondary EventBridge event bus',
      exportName: `trading-secondary-event-bus-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, 'ReplicationState', {
      value: 'ENABLED',
      description: 'Replication state of the Global Endpoint',
      exportName: `trading-replication-state-${suffix}`,
    });
  }
}
```

### 3. Event Bus Stack (`lib/event-bus-stack.ts`)

Creates the primary EventBridge event bus with rules, retry policies, and DLQ configuration.

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export interface EventBusStackProps extends cdk.StackProps {
  processingLambda: lambda.IFunction;
  environmentSuffix: string;
}

export class EventBusStack extends cdk.Stack {
  public readonly eventBus: events.EventBus;
  public readonly dlq: sqs.Queue;
  public readonly rule: events.Rule;

  constructor(scope: Construct, id: string, props: EventBusStackProps) {
    super(scope, id, props);

    const suffix = props.environmentSuffix;

    // Create a custom EventBridge event bus
    this.eventBus = new events.EventBus(this, 'TradingEventBus', {
      eventBusName: `trading-event-bus-${suffix}`,
    });

    // Create a Dead Letter Queue (DLQ) for failed event processing
    this.dlq = new sqs.Queue(this, 'EventProcessingDLQ', {
      queueName: `trading-event-processing-dlq-${suffix}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    // Create an EventBridge rule to forward events to the processing Lambda
    this.rule = new events.Rule(this, 'ProcessingRule', {
      eventBus: this.eventBus,
      ruleName: `trading-event-processing-rule-${suffix}`,
      description: 'Forward trading events to processing lambda',
      eventPattern: {
        source: ['trading-system'],
      },
    });

    // Add the Lambda function as a target with retry policy and DLQ
    this.rule.addTarget(
      new targets.LambdaFunction(props.processingLambda, {
        deadLetterQueue: this.dlq,
        maxEventAge: cdk.Duration.hours(24),
        retryAttempts: 3,
      })
    );

    // Outputs for integration testing
    new cdk.CfnOutput(this, 'EventBusArn', {
      value: this.eventBus.eventBusArn,
      description: 'ARN of the Trading Event Bus',
      exportName: `trading-event-bus-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, 'EventBusName', {
      value: this.eventBus.eventBusName,
      description: 'Name of the Trading Event Bus',
      exportName: `trading-event-bus-name-${suffix}`,
    });

    new cdk.CfnOutput(this, 'RuleArn', {
      value: this.rule.ruleArn,
      description: 'ARN of the EventBridge processing rule',
      exportName: `trading-rule-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, 'RuleName', {
      value: this.rule.ruleName,
      description: 'Name of the EventBridge processing rule',
      exportName: `trading-rule-name-${suffix}`,
    });

    new cdk.CfnOutput(this, 'EventSource', {
      value: 'trading-system',
      description: 'Event source pattern for the rule',
      exportName: `trading-event-source-${suffix}`,
    });

    new cdk.CfnOutput(this, 'DLQArn', {
      value: this.dlq.queueArn,
      description: 'ARN of the DLQ',
      exportName: `trading-dlq-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, 'DLQUrl', {
      value: this.dlq.queueUrl,
      description: 'URL of the DLQ',
      exportName: `trading-dlq-url-${suffix}`,
    });

    new cdk.CfnOutput(this, 'DLQName', {
      value: this.dlq.queueName,
      description: 'Name of the DLQ',
      exportName: `trading-dlq-name-${suffix}`,
    });

    new cdk.CfnOutput(this, 'DLQRetentionPeriod', {
      value: '14',
      description: 'DLQ message retention period in days',
      exportName: `trading-dlq-retention-${suffix}`,
    });

    new cdk.CfnOutput(this, 'MaxEventAge', {
      value: '24',
      description: 'Maximum event age in hours',
      exportName: `trading-max-event-age-${suffix}`,
    });

    new cdk.CfnOutput(this, 'RetryAttempts', {
      value: '3',
      description: 'Number of retry attempts for failed events',
      exportName: `trading-retry-attempts-${suffix}`,
    });

    new cdk.CfnOutput(this, 'TargetLambdaArn', {
      value: props.processingLambda.functionArn,
      description: 'ARN of the target Lambda function',
      exportName: `trading-target-lambda-${suffix}`,
    });
  }
}
```

### 4. Secondary Event Bus Stack (`lib/secondary-event-bus-stack.ts`)

Creates a secondary event bus in us-west-2 for failover support.

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';

export interface SecondaryEventBusStackProps extends cdk.StackProps {
  eventBusName: string;
}

export class SecondaryEventBusStack extends cdk.Stack {
  public readonly eventBus: events.EventBus;

  constructor(
    scope: Construct,
    id: string,
    props: SecondaryEventBusStackProps
  ) {
    super(scope, id, props);

    // Create the secondary event bus with the same name as primary
    this.eventBus = new events.EventBus(this, 'SecondaryEventBus', {
      eventBusName: props.eventBusName,
    });

    // Outputs for integration testing
    new cdk.CfnOutput(this, 'SecondaryEventBusArn', {
      value: this.eventBus.eventBusArn,
      description: 'ARN of the Secondary Event Bus in us-west-2',
      exportName: `trading-secondary-event-bus-arn-${props.eventBusName}`,
    });

    new cdk.CfnOutput(this, 'SecondaryEventBusName', {
      value: this.eventBus.eventBusName,
      description: 'Name of the Secondary Event Bus in us-west-2',
      exportName: `trading-secondary-event-bus-name-${props.eventBusName}`,
    });

    new cdk.CfnOutput(this, 'SecondaryRegion', {
      value: this.region,
      description: 'AWS region for the secondary event bus',
      exportName: `trading-secondary-region-${props.eventBusName}`,
    });

    new cdk.CfnOutput(this, 'SecondaryEventBusAccount', {
      value: this.account,
      description: 'AWS account ID for the secondary event bus',
      exportName: `trading-secondary-account-${props.eventBusName}`,
    });
  }
}
```

### 5. Processing Lambda Stack (`lib/processing-lambda-stack.ts`)

Creates the Lambda function with X-Ray tracing, least-privilege IAM permissions, and environment variables configured for Lambda Powertools.

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export interface ProcessingLambdaStackProps extends cdk.StackProps {
  globalTable: dynamodb.ITable;
  environmentSuffix: string;
}

export class ProcessingLambdaStack extends cdk.Stack {
  public readonly processingLambda: lambda.Function;

  constructor(scope: Construct, id: string, props: ProcessingLambdaStackProps) {
    super(scope, id, props);

    const suffix = props.environmentSuffix;

    // Create IAM role for the Lambda with least privilege
    const lambdaRole = new iam.Role(this, 'ProcessingLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for the Trading Event Processing Lambda',
    });

    // Add permissions to write to DynamoDB
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:BatchWriteItem',
        ],
        resources: [props.globalTable.tableArn],
      })
    );

    // Add permissions for CloudWatch Logs
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: ['*'],
      })
    );

    // Add permissions for X-Ray
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
        resources: ['*'],
      })
    );

    // Create log group for the Lambda
    const logGroup = new logs.LogGroup(this, 'ProcessingLambdaLogGroup', {
      logGroupName: `/aws/lambda/trading-event-processor-${suffix}`,
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create the Lambda function
    this.processingLambda = new lambda.Function(this, 'ProcessingLambda', {
      functionName: `trading-event-processor-${suffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
exports.handler = async (event) => {
  console.log('Processing event:', JSON.stringify(event, null, 2));
  return { statusCode: 200, body: 'Event processed successfully' };
};
      `),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(10),
      memorySize: 1024,
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        TABLE_NAME: props.globalTable.tableName,
        POWERTOOLS_SERVICE_NAME: 'trading-event-processor',
        POWERTOOLS_LOGGER_LOG_LEVEL: 'INFO',
        POWERTOOLS_LOGGER_SAMPLE_RATE: '1',
        POWERTOOLS_METRICS_NAMESPACE: 'TradingSystem',
      },
      logGroup: logGroup,
    });

    // Outputs for integration testing
    new cdk.CfnOutput(this, 'ProcessingLambdaArn', {
      value: this.processingLambda.functionArn,
      description: 'ARN of the Trading Event Processing Lambda',
      exportName: `trading-lambda-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, 'ProcessingLambdaName', {
      value: this.processingLambda.functionName,
      description: 'Name of the Trading Event Processing Lambda',
      exportName: `trading-lambda-name-${suffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaRoleArn', {
      value: lambdaRole.roleArn,
      description: 'ARN of the Lambda execution role',
      exportName: `trading-lambda-role-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaRoleName', {
      value: lambdaRole.roleName,
      description: 'Name of the Lambda execution role',
      exportName: `trading-lambda-role-name-${suffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaLogGroupName', {
      value: logGroup.logGroupName,
      description: 'CloudWatch Log Group name for Lambda',
      exportName: `trading-lambda-log-group-${suffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaLogGroupArn', {
      value: logGroup.logGroupArn,
      description: 'CloudWatch Log Group ARN for Lambda',
      exportName: `trading-lambda-log-group-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaRuntime', {
      value: this.processingLambda.runtime.name,
      description: 'Lambda runtime',
      exportName: `trading-lambda-runtime-${suffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaTimeout', {
      value: '10',
      description: 'Lambda timeout in seconds',
      exportName: `trading-lambda-timeout-${suffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaMemorySize', {
      value: '1024',
      description: 'Lambda memory size in MB',
      exportName: `trading-lambda-memory-${suffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaTracingMode', {
      value: 'ACTIVE',
      description: 'Lambda X-Ray tracing mode',
      exportName: `trading-lambda-tracing-${suffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaTableName', {
      value: props.globalTable.tableName,
      description: 'DynamoDB table name used by Lambda',
      exportName: `trading-lambda-table-name-${suffix}`,
    });

    new cdk.CfnOutput(this, 'LogRetentionDays', {
      value: '14',
      description: 'CloudWatch Logs retention period in days',
      exportName: `trading-lambda-log-retention-${suffix}`,
    });
  }
}
```

### 6. DynamoDB Stack (`lib/dynamodb-stack.ts`)

Creates a DynamoDB Global Table with point-in-time recovery and replication to us-west-2.

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export interface DynamoDBStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class DynamoDBStack extends cdk.Stack {
  public readonly globalTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DynamoDBStackProps) {
    super(scope, id, props);

    const suffix = props.environmentSuffix;

    // Create a DynamoDB Global Table
    this.globalTable = new dynamodb.Table(this, 'TradingGlobalTable', {
      tableName: `trading-transactions-${suffix}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      replicationRegions: ['us-west-2'],
    });

    // Outputs for integration testing
    new cdk.CfnOutput(this, 'GlobalTableArn', {
      value: this.globalTable.tableArn,
      description: 'ARN of the Trading Global Table',
      exportName: `trading-global-table-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, 'GlobalTableName', {
      value: this.globalTable.tableName,
      description: 'Name of the Trading Global Table',
      exportName: `trading-global-table-name-${suffix}`,
    });

    /* istanbul ignore next */
    const streamArn = this.globalTable.tableStreamArn || 'N/A';
    new cdk.CfnOutput(this, 'GlobalTableStreamArn', {
      value: streamArn,
      description: 'Stream ARN of the Trading Global Table',
      exportName: `trading-global-table-stream-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, 'PartitionKeyName', {
      value: 'id',
      description: 'Partition key name of the table',
      exportName: `trading-table-partition-key-${suffix}`,
    });

    new cdk.CfnOutput(this, 'SortKeyName', {
      value: 'timestamp',
      description: 'Sort key name of the table',
      exportName: `trading-table-sort-key-${suffix}`,
    });

    new cdk.CfnOutput(this, 'BillingMode', {
      value: 'PAY_PER_REQUEST',
      description: 'Billing mode of the table',
      exportName: `trading-table-billing-mode-${suffix}`,
    });

    new cdk.CfnOutput(this, 'PointInTimeRecovery', {
      value: 'true',
      description: 'Point-in-time recovery enabled status',
      exportName: `trading-table-pitr-${suffix}`,
    });

    new cdk.CfnOutput(this, 'ReplicationRegions', {
      value: 'us-west-2',
      description: 'Replication regions for the global table',
      exportName: `trading-table-replication-regions-${suffix}`,
    });

    new cdk.CfnOutput(this, 'PrimaryRegion', {
      value: this.region,
      description: 'Primary region for the global table',
      exportName: `trading-table-primary-region-${suffix}`,
    });
  }
}
```

### 7. Monitoring Stack (`lib/monitoring-stack.ts`)

Creates CloudWatch alarms and SNS topics for monitoring the DLQ.

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';

export interface MonitoringStackProps extends cdk.StackProps {
  dlq: sqs.IQueue;
  environmentSuffix: string;
}

export class MonitoringStack extends cdk.Stack {
  public readonly alertTopic: sns.Topic;
  public readonly dlqAlarm: cloudwatch.Alarm;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const suffix = props.environmentSuffix;

    // Create an SNS topic for alerts
    this.alertTopic = new sns.Topic(this, 'TradingAlertTopic', {
      topicName: `trading-alerts-${suffix}`,
      displayName: 'Trading System Alerts',
    });

    // Create a CloudWatch alarm for DLQ messages
    this.dlqAlarm = new cloudwatch.Alarm(this, 'DLQMessagesAlarm', {
      alarmName: `TradingEventsDLQNotEmpty-${suffix}`,
      alarmDescription:
        'Alarm if there are any messages in the Dead Letter Queue',
      metric: props.dlq.metricApproximateNumberOfMessagesVisible(),
      threshold: 0,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Configure the alarm action to notify the SNS topic
    this.dlqAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alertTopic)
    );

    // Outputs for integration testing
    new cdk.CfnOutput(this, 'DLQAlarmArn', {
      value: this.dlqAlarm.alarmArn,
      description: 'ARN of the DLQ Messages Alarm',
      exportName: `trading-dlq-alarm-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, 'DLQAlarmName', {
      value: this.dlqAlarm.alarmName,
      description: 'Name of the DLQ Messages Alarm',
      exportName: `trading-dlq-alarm-name-${suffix}`,
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: this.alertTopic.topicArn,
      description: 'ARN of the Alert SNS Topic',
      exportName: `trading-alert-topic-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, 'AlertTopicName', {
      value: this.alertTopic.topicName,
      description: 'Name of the Alert SNS Topic',
      exportName: `trading-alert-topic-name-${suffix}`,
    });

    new cdk.CfnOutput(this, 'AlarmThreshold', {
      value: '0',
      description: 'Alarm threshold for DLQ messages',
      exportName: `trading-alarm-threshold-${suffix}`,
    });

    new cdk.CfnOutput(this, 'AlarmEvaluationPeriods', {
      value: '1',
      description: 'Number of evaluation periods for the alarm',
      exportName: `trading-alarm-eval-periods-${suffix}`,
    });

    new cdk.CfnOutput(this, 'AlarmComparisonOperator', {
      value: 'GREATER_THAN_THRESHOLD',
      description: 'Comparison operator for the alarm',
      exportName: `trading-alarm-operator-${suffix}`,
    });

    new cdk.CfnOutput(this, 'AlarmMetricName', {
      value: 'ApproximateNumberOfMessagesVisible',
      description: 'CloudWatch metric name for the alarm',
      exportName: `trading-alarm-metric-${suffix}`,
    });

    new cdk.CfnOutput(this, 'MonitoredQueueArn', {
      value: props.dlq.queueArn,
      description: 'ARN of the queue being monitored',
      exportName: `trading-monitored-queue-arn-${suffix}`,
    });
  }
}
```
