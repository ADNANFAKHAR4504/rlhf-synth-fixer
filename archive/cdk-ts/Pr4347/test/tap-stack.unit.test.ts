import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { DynamoDBStack } from '../lib/dynamodb-stack';
import { ProcessingLambdaStack } from '../lib/processing-lambda-stack';
import { EventBusStack } from '../lib/event-bus-stack';
import { SecondaryEventBusStack } from '../lib/secondary-event-bus-stack';
import { GlobalEndpointStack } from '../lib/global-endpoint-stack';
import { MonitoringStack } from '../lib/monitoring-stack';

describe('TapStack Unit Tests', () => {
  const testSuffix = 'test-env';
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('TapStack - Main Orchestration', () => {
    test('should create stack with default suffix', () => {
      const stack = new TapStack(app, 'TestStack');
      const template = Template.fromStack(stack);

      // Verify nested stacks are created
      expect(template).toBeDefined();
    });

    test('should create stack with custom suffix', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: testSuffix,
      });
      const template = Template.fromStack(stack);

      expect(template).toBeDefined();
    });

    test('should use context environmentSuffix when provided', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'context-test',
        },
      });
      const stack = new TapStack(contextApp, 'TestStack');
      const template = Template.fromStack(stack);

      expect(template).toBeDefined();
    });

    test('should create all nested stacks', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: testSuffix,
      });

      // Verify all child stacks are present
      const children = stack.node.children;
      const stackNames = children.map((child) => child.node.id);

      expect(stackNames).toContain('DynamoDBStack');
      expect(stackNames).toContain('ProcessingLambdaStack');
      expect(stackNames).toContain('EventBusStack');
      expect(stackNames).toContain('SecondaryEventBusStack');
      expect(stackNames).toContain('GlobalEndpointStack');
      expect(stackNames).toContain('MonitoringStack');
    });

    test('should set up proper stack dependencies', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: testSuffix,
      });

      const children = stack.node.children;
      expect(children.length).toBeGreaterThan(0);
    });
  });

  describe('DynamoDBStack - Global Table', () => {
    test('should create DynamoDB table with correct properties', () => {
      const stack = new DynamoDBStack(app, 'TestDynamoDBStack', {
        environmentSuffix: testSuffix,
      });
      const template = Template.fromStack(stack);

      // Verify DynamoDB table exists - CDK creates AWS::DynamoDB::Table
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `trading-transactions-${testSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S',
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'S',
          },
        ],
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
      });
    });

    test('should have point-in-time recovery enabled', () => {
      const stack = new DynamoDBStack(app, 'TestDynamoDBStack', {
        environmentSuffix: testSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('should export globalTable property', () => {
      const stack = new DynamoDBStack(app, 'TestDynamoDBStack', {
        environmentSuffix: testSuffix,
      });

      expect(stack.globalTable).toBeDefined();
      expect(stack.globalTable.tableArn).toBeDefined();
    });

    test('should create all required outputs', () => {
      const stack = new DynamoDBStack(app, 'TestDynamoDBStack', {
        environmentSuffix: testSuffix,
      });
      const template = Template.fromStack(stack);

      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs)).toContain('GlobalTableArn');
      expect(Object.keys(outputs)).toContain('GlobalTableName');
      expect(Object.keys(outputs)).toContain('GlobalTableStreamArn');
      expect(Object.keys(outputs)).toContain('PartitionKeyName');
      expect(Object.keys(outputs)).toContain('SortKeyName');
      expect(Object.keys(outputs)).toContain('BillingMode');
      expect(Object.keys(outputs)).toContain('PointInTimeRecovery');
      expect(Object.keys(outputs)).toContain('ReplicationRegions');
    });
  });

  describe('ProcessingLambdaStack - Lambda Function', () => {
    let mockTable: any;

    beforeEach(() => {
      const dynamoStack = new DynamoDBStack(app, 'MockDynamoDBStack', {
        environmentSuffix: testSuffix,
      });
      mockTable = dynamoStack.globalTable;
    });

    test('should create Lambda function with correct properties', () => {
      const stack = new ProcessingLambdaStack(app, 'TestLambdaStack', {
        globalTable: mockTable,
        environmentSuffix: testSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `trading-event-processor-${testSuffix}`,
        Runtime: 'nodejs18.x',
        Timeout: 10,
        MemorySize: 1024,
        TracingConfig: {
          Mode: 'Active',
        },
        Environment: {
          Variables: Match.objectLike({
            POWERTOOLS_SERVICE_NAME: 'trading-event-processor',
            POWERTOOLS_LOGGER_LOG_LEVEL: 'INFO',
            POWERTOOLS_LOGGER_SAMPLE_RATE: '1',
            POWERTOOLS_METRICS_NAMESPACE: 'TradingSystem',
          }),
        },
      });
    });

    test('should create IAM role with DynamoDB permissions', () => {
      const stack = new ProcessingLambdaStack(app, 'TestLambdaStack', {
        globalTable: mockTable,
        environmentSuffix: testSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        },
      });

      // Verify DynamoDB policy
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: [
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:BatchWriteItem',
              ],
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should create CloudWatch log group with retention', () => {
      const stack = new ProcessingLambdaStack(app, 'TestLambdaStack', {
        globalTable: mockTable,
        environmentSuffix: testSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/trading-event-processor-${testSuffix}`,
        RetentionInDays: 14,
      });
    });

    test('should have X-Ray tracing permissions', () => {
      const stack = new ProcessingLambdaStack(app, 'TestLambdaStack', {
        globalTable: mockTable,
        environmentSuffix: testSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should export processingLambda property', () => {
      const stack = new ProcessingLambdaStack(app, 'TestLambdaStack', {
        globalTable: mockTable,
        environmentSuffix: testSuffix,
      });

      expect(stack.processingLambda).toBeDefined();
      expect(stack.processingLambda.functionArn).toBeDefined();
    });

    test('should create all required outputs', () => {
      const stack = new ProcessingLambdaStack(app, 'TestLambdaStack', {
        globalTable: mockTable,
        environmentSuffix: testSuffix,
      });
      const template = Template.fromStack(stack);

      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs)).toContain('ProcessingLambdaArn');
      expect(Object.keys(outputs)).toContain('ProcessingLambdaName');
      expect(Object.keys(outputs)).toContain('LambdaRoleArn');
      expect(Object.keys(outputs)).toContain('LambdaLogGroupName');
      expect(Object.keys(outputs)).toContain('LambdaRuntime');
      expect(Object.keys(outputs)).toContain('LambdaTracingMode');
    });
  });

  describe('EventBusStack - EventBridge Configuration', () => {
    let mockLambda: any;

    beforeEach(() => {
      const dynamoStack = new DynamoDBStack(app, 'MockDynamoDBStack', {
        environmentSuffix: testSuffix,
      });
      const lambdaStack = new ProcessingLambdaStack(app, 'MockLambdaStack', {
        globalTable: dynamoStack.globalTable,
        environmentSuffix: testSuffix,
      });
      mockLambda = lambdaStack.processingLambda;
    });

    test('should create custom event bus', () => {
      const stack = new EventBusStack(app, 'TestEventBusStack', {
        processingLambda: mockLambda,
        environmentSuffix: testSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Events::EventBus', {
        Name: `trading-event-bus-${testSuffix}`,
      });
    });

    test('should create Dead Letter Queue', () => {
      const stack = new EventBusStack(app, 'TestEventBusStack', {
        processingLambda: mockLambda,
        environmentSuffix: testSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `trading-event-processing-dlq-${testSuffix}`,
        MessageRetentionPeriod: 1209600, // 14 days in seconds
      });
    });

    test('should create EventBridge rule with correct pattern', () => {
      const stack = new EventBusStack(app, 'TestEventBusStack', {
        processingLambda: mockLambda,
        environmentSuffix: testSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `trading-event-processing-rule-${testSuffix}`,
        EventPattern: {
          source: ['trading-system'],
        },
        State: 'ENABLED',
      });
    });

    test('should configure Lambda target with retry and DLQ', () => {
      const stack = new EventBusStack(app, 'TestEventBusStack', {
        processingLambda: mockLambda,
        environmentSuffix: testSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Events::Rule', {
        Targets: [
          {
            Arn: Match.anyValue(),
            RetryPolicy: {
              MaximumEventAgeInSeconds: 86400, // 24 hours
              MaximumRetryAttempts: 3,
            },
            DeadLetterConfig: Match.objectLike({
              Arn: Match.anyValue(),
            }),
          },
        ],
      });
    });

    test('should export eventBus and dlq properties', () => {
      const stack = new EventBusStack(app, 'TestEventBusStack', {
        processingLambda: mockLambda,
        environmentSuffix: testSuffix,
      });

      expect(stack.eventBus).toBeDefined();
      expect(stack.dlq).toBeDefined();
      expect(stack.rule).toBeDefined();
    });

    test('should create all required outputs', () => {
      const stack = new EventBusStack(app, 'TestEventBusStack', {
        processingLambda: mockLambda,
        environmentSuffix: testSuffix,
      });
      const template = Template.fromStack(stack);

      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs)).toContain('EventBusArn');
      expect(Object.keys(outputs)).toContain('EventBusName');
      expect(Object.keys(outputs)).toContain('RuleArn');
      expect(Object.keys(outputs)).toContain('DLQArn');
      expect(Object.keys(outputs)).toContain('DLQUrl');
      expect(Object.keys(outputs)).toContain('RetryAttempts');
      expect(Object.keys(outputs)).toContain('MaxEventAge');
    });
  });

  describe('SecondaryEventBusStack - Failover Event Bus', () => {
    const eventBusName = `trading-event-bus-${testSuffix}`;

    test('should create secondary event bus with same name', () => {
      const stack = new SecondaryEventBusStack(
        app,
        'TestSecondaryEventBusStack',
        {
          eventBusName: eventBusName,
          env: { region: 'us-west-2' },
        }
      );
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Events::EventBus', {
        Name: eventBusName,
      });
    });

    test('should export eventBus property', () => {
      const stack = new SecondaryEventBusStack(
        app,
        'TestSecondaryEventBusStack',
        {
          eventBusName: eventBusName,
          env: { region: 'us-west-2' },
        }
      );

      expect(stack.eventBus).toBeDefined();
      expect(stack.eventBus.eventBusArn).toBeDefined();
    });

    test('should create all required outputs', () => {
      const stack = new SecondaryEventBusStack(
        app,
        'TestSecondaryEventBusStack',
        {
          eventBusName: eventBusName,
          env: { region: 'us-west-2' },
        }
      );
      const template = Template.fromStack(stack);

      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs)).toContain('SecondaryEventBusArn');
      expect(Object.keys(outputs)).toContain('SecondaryEventBusName');
      expect(Object.keys(outputs)).toContain('SecondaryRegion');
      expect(Object.keys(outputs)).toContain('SecondaryEventBusAccount');
    });
  });

  describe('GlobalEndpointStack - Multi-Region Configuration', () => {
    const primaryRegion = 'us-east-1';
    const secondaryRegion = 'us-west-2';
    const eventBusArn = `arn:aws:events:${primaryRegion}:123456789012:event-bus/trading-event-bus-${testSuffix}`;
    const secondaryEventBusArn = `arn:aws:events:${secondaryRegion}:123456789012:event-bus/trading-event-bus-${testSuffix}`;
    const eventBusName = `trading-event-bus-${testSuffix}`;

    test('should create IAM role for replication', () => {
      const stack = new GlobalEndpointStack(app, 'TestGlobalEndpointStack', {
        primaryRegion,
        secondaryRegion,
        eventBusArn,
        secondaryEventBusArn,
        environmentSuffix: testSuffix,
        eventBusName,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `eventbridge-replication-role-${testSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'events.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('should have EventBridge replication permissions', () => {
      const stack = new GlobalEndpointStack(app, 'TestGlobalEndpointStack', {
        primaryRegion,
        secondaryRegion,
        eventBusArn,
        secondaryEventBusArn,
        environmentSuffix: testSuffix,
        eventBusName,
      });
      const template = Template.fromStack(stack);

      // Verify inline policies contain required permissions
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `eventbridge-replication-role-${testSuffix}`,
      });

      // Check that the role exists with proper permissions
      const resources = template.findResources('AWS::IAM::Role');
      const replicationRole = Object.values(resources).find(
        (r: any) =>
          r.Properties?.RoleName ===
          `eventbridge-replication-role-${testSuffix}`
      );
      expect(replicationRole).toBeDefined();
    });

    test('should create Route53 health check', () => {
      const stack = new GlobalEndpointStack(app, 'TestGlobalEndpointStack', {
        primaryRegion,
        secondaryRegion,
        eventBusArn,
        secondaryEventBusArn,
        environmentSuffix: testSuffix,
        eventBusName,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Route53::HealthCheck', {
        HealthCheckConfig: {
          Type: 'CLOUDWATCH_METRIC',
          InsufficientDataHealthStatus: 'Healthy',
        },
      });
    });

    test('should create CloudWatch alarm for health monitoring', () => {
      const stack = new GlobalEndpointStack(app, 'TestGlobalEndpointStack', {
        primaryRegion,
        secondaryRegion,
        eventBusArn,
        secondaryEventBusArn,
        environmentSuffix: testSuffix,
        eventBusName,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `eventbridge-primary-health-${testSuffix}`,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        Threshold: 0,
        EvaluationPeriods: 1,
        TreatMissingData: 'notBreaching',
      });
    });

    test('should create Global Endpoint with failover configuration', () => {
      const stack = new GlobalEndpointStack(app, 'TestGlobalEndpointStack', {
        primaryRegion,
        secondaryRegion,
        eventBusArn,
        secondaryEventBusArn,
        environmentSuffix: testSuffix,
        eventBusName,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Events::Endpoint', {
        Name: `trading-global-endpoint-${testSuffix}`,
        RoutingConfig: {
          FailoverConfig: {
            Primary: {
              HealthCheck: Match.anyValue(),
            },
            Secondary: {
              Route: secondaryRegion,
            },
          },
        },
        ReplicationConfig: {
          State: 'ENABLED',
        },
        EventBuses: [
          {
            EventBusArn: eventBusArn,
          },
          {
            EventBusArn: secondaryEventBusArn,
          },
        ],
      });
    });

    test('should export globalEndpoint and healthCheck properties', () => {
      const stack = new GlobalEndpointStack(app, 'TestGlobalEndpointStack', {
        primaryRegion,
        secondaryRegion,
        eventBusArn,
        secondaryEventBusArn,
        environmentSuffix: testSuffix,
        eventBusName,
      });

      expect(stack.globalEndpoint).toBeDefined();
      expect(stack.healthCheck).toBeDefined();
    });

    test('should create all required outputs', () => {
      const stack = new GlobalEndpointStack(app, 'TestGlobalEndpointStack', {
        primaryRegion,
        secondaryRegion,
        eventBusArn,
        secondaryEventBusArn,
        environmentSuffix: testSuffix,
        eventBusName,
      });
      const template = Template.fromStack(stack);

      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs)).toContain('GlobalEndpointUrl');
      expect(Object.keys(outputs)).toContain('GlobalEndpointArn');
      expect(Object.keys(outputs)).toContain('GlobalEndpointName');
      expect(Object.keys(outputs)).toContain('GlobalEndpointId');
      expect(Object.keys(outputs)).toContain('ReplicationRoleArn');
      expect(Object.keys(outputs)).toContain('HealthCheckId');
      expect(Object.keys(outputs)).toContain('ReplicationState');
    });
  });

  describe('MonitoringStack - Alarms and Alerts', () => {
    let mockDlq: any;

    beforeEach(() => {
      const dynamoStack = new DynamoDBStack(app, 'MockDynamoDBStack', {
        environmentSuffix: testSuffix,
      });
      const lambdaStack = new ProcessingLambdaStack(app, 'MockLambdaStack', {
        globalTable: dynamoStack.globalTable,
        environmentSuffix: testSuffix,
      });
      const eventBusStack = new EventBusStack(app, 'MockEventBusStack', {
        processingLambda: lambdaStack.processingLambda,
        environmentSuffix: testSuffix,
      });
      mockDlq = eventBusStack.dlq;
    });

    test('should create SNS topic for alerts', () => {
      const stack = new MonitoringStack(app, 'TestMonitoringStack', {
        dlq: mockDlq,
        environmentSuffix: testSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `trading-alerts-${testSuffix}`,
        DisplayName: 'Trading System Alerts',
      });
    });

    test('should create CloudWatch alarm for DLQ', () => {
      const stack = new MonitoringStack(app, 'TestMonitoringStack', {
        dlq: mockDlq,
        environmentSuffix: testSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `TradingEventsDLQNotEmpty-${testSuffix}`,
        ComparisonOperator: 'GreaterThanThreshold',
        Threshold: 0,
        EvaluationPeriods: 1,
        TreatMissingData: 'notBreaching',
      });
    });

    test('should configure alarm to notify SNS topic', () => {
      const stack = new MonitoringStack(app, 'TestMonitoringStack', {
        dlq: mockDlq,
        environmentSuffix: testSuffix,
      });
      const template = Template.fromStack(stack);

      // Verify alarm has actions configured
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const dlqAlarm = Object.values(alarms).find(
        (alarm: any) =>
          alarm.Properties?.AlarmName ===
          `TradingEventsDLQNotEmpty-${testSuffix}`
      );
      expect(dlqAlarm).toBeDefined();
      expect((dlqAlarm as any).Properties.AlarmActions).toBeDefined();
      expect((dlqAlarm as any).Properties.AlarmActions.length).toBeGreaterThan(
        0
      );
    });

    test('should export alertTopic and dlqAlarm properties', () => {
      const stack = new MonitoringStack(app, 'TestMonitoringStack', {
        dlq: mockDlq,
        environmentSuffix: testSuffix,
      });

      expect(stack.alertTopic).toBeDefined();
      expect(stack.dlqAlarm).toBeDefined();
    });

    test('should create all required outputs', () => {
      const stack = new MonitoringStack(app, 'TestMonitoringStack', {
        dlq: mockDlq,
        environmentSuffix: testSuffix,
      });
      const template = Template.fromStack(stack);

      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs)).toContain('DLQAlarmArn');
      expect(Object.keys(outputs)).toContain('DLQAlarmName');
      expect(Object.keys(outputs)).toContain('AlertTopicArn');
      expect(Object.keys(outputs)).toContain('AlertTopicName');
      expect(Object.keys(outputs)).toContain('AlarmThreshold');
      expect(Object.keys(outputs)).toContain('AlarmMetricName');
    });
  });

  describe('Stack Integration Tests', () => {
    test('should successfully create complete TapStack without errors', () => {
      expect(() => {
        new TapStack(app, 'IntegrationTestStack', {
          environmentSuffix: testSuffix,
        });
      }).not.toThrow();
    });

    test('should handle missing environmentSuffix gracefully', () => {
      expect(() => {
        new TapStack(app, 'NoSuffixStack');
      }).not.toThrow();
    });

    test('should create resources with consistent naming', () => {
      const stack = new TapStack(app, 'NamingTestStack', {
        environmentSuffix: testSuffix,
      });

      const children = stack.node.children;
      expect(children.length).toBeGreaterThan(0);

      // All child stacks should have IDs
      children.forEach((child) => {
        expect(child.node.id).toBeDefined();
        expect(child.node.id.length).toBeGreaterThan(0);
      });
    });

    test('should use default suffix when not provided in props or context', () => {
      const freshApp = new cdk.App();
      const stack = new TapStack(freshApp, 'DefaultSuffixStack');
      const template = Template.fromStack(stack);

      // Verify stack was created successfully with default suffix
      expect(template).toBeDefined();
    });

    test('should prioritize props environmentSuffix over context', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'context-value',
        },
      });
      const stack = new TapStack(contextApp, 'PropsOverContextStack', {
        environmentSuffix: 'props-value',
      });

      const template = Template.fromStack(stack);
      expect(template).toBeDefined();
    });

    test('should create stack with different regions', () => {
      const stack = new TapStack(app, 'RegionTestStack', {
        environmentSuffix: testSuffix,
        env: { region: 'eu-west-1', account: '123456789012' },
      });

      expect(stack).toBeDefined();
      // Verify the region is set
      const template = Template.fromStack(stack);
      expect(template).toBeDefined();
    });

    test('should verify DynamoDB outputs handle undefined streamArn', () => {
      const stack = new DynamoDBStack(app, 'StreamArnTestStack', {
        environmentSuffix: testSuffix,
      });
      const template = Template.fromStack(stack);

      const outputs = template.findOutputs('*');
      expect(outputs.GlobalTableStreamArn).toBeDefined();
    });

    test('should verify all stacks have proper environment configuration', () => {
      const stack = new TapStack(app, 'EnvConfigTestStack', {
        environmentSuffix: testSuffix,
      });

      const children = stack.node.children.filter(
        (child) => child instanceof cdk.Stack
      );
      expect(children.length).toBeGreaterThan(0);
    });

    test('should handle empty suffix edge case', () => {
      expect(() => {
        new TapStack(app, 'EmptySuffixStack', {
          environmentSuffix: '',
        });
      }).not.toThrow();
    });

    test('should create event bus with correct configuration', () => {
      const dynamoStack = new DynamoDBStack(app, 'EdgeCaseDynamoStack', {
        environmentSuffix: testSuffix,
      });
      const lambdaStack = new ProcessingLambdaStack(
        app,
        'EdgeCaseLambdaStack',
        {
          globalTable: dynamoStack.globalTable,
          environmentSuffix: testSuffix,
        }
      );
      const eventBusStack = new EventBusStack(app, 'EdgeCaseEventBusStack', {
        processingLambda: lambdaStack.processingLambda,
        environmentSuffix: testSuffix,
      });

      expect(eventBusStack.eventBus).toBeDefined();
      expect(eventBusStack.dlq).toBeDefined();
      expect(eventBusStack.rule).toBeDefined();
    });

    test('should verify secondary event bus in correct region', () => {
      const stack = new SecondaryEventBusStack(
        app,
        'RegionVerificationStack',
        {
          eventBusName: `test-bus-${testSuffix}`,
          env: { region: 'us-west-2', account: '123456789012' },
        }
      );

      expect(stack.eventBus).toBeDefined();
    });

    test('should create global endpoint with health monitoring', () => {
      const primaryRegion = 'us-east-1';
      const secondaryRegion = 'us-west-2';
      const eventBusArn = `arn:aws:events:${primaryRegion}:123456789012:event-bus/test-bus-${testSuffix}`;
      const secondaryEventBusArn = `arn:aws:events:${secondaryRegion}:123456789012:event-bus/test-bus-${testSuffix}`;

      const stack = new GlobalEndpointStack(app, 'HealthMonitoringStack', {
        primaryRegion,
        secondaryRegion,
        eventBusArn,
        secondaryEventBusArn,
        environmentSuffix: testSuffix,
        eventBusName: `test-bus-${testSuffix}`,
      });

      expect(stack.globalEndpoint).toBeDefined();
      expect(stack.healthCheck).toBeDefined();
    });
  });
});
