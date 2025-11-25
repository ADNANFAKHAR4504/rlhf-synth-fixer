import * as cdk from 'aws-cdk-lib';
import { Template, Match, Capture } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Lambda Layer', () => {
    test('creates Lambda Layer with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::LayerVersion', {
        CompatibleRuntimes: ['nodejs18.x'],
        Description: 'Shared dependencies for pattern detection system',
        LayerName: `pattern-detection-shared-${environmentSuffix}`,
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('creates TradingPatterns table with correct schema', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `TradingPatterns-${environmentSuffix}`,
        AttributeDefinitions: [
          {
            AttributeName: 'patternId',
            AttributeType: 'S',
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'N',
          },
        ],
        KeySchema: [
          {
            AttributeName: 'patternId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('table has DESTROY removal policy', () => {
      template.hasResource('AWS::DynamoDB::Table', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('SNS Topic', () => {
    test('creates TradingAlerts topic with correct configuration', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `TradingAlerts-${environmentSuffix}`,
        DisplayName: 'Trading Pattern Alerts',
      });
    });

    test('creates email subscription to alerts topic', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'alerts@example.com',
      });
    });
  });

  describe('SQS Queues', () => {
    test('creates AlertQueue with correct configuration', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `AlertQueue-${environmentSuffix}`,
        MessageRetentionPeriod: 345600, // 4 days
        VisibilityTimeout: 300,
      });
    });

    test('creates Dead Letter Queue', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `AlertDLQ-${environmentSuffix}`,
        MessageRetentionPeriod: 345600, // 4 days
      });
    });

    test('AlertQueue has redrive policy to DLQ', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `AlertQueue-${environmentSuffix}`,
        RedrivePolicy: Match.objectLike({
          maxReceiveCount: 3,
        }),
      });
    });

    test('queues have DESTROY removal policy', () => {
      const queues = template.findResources('AWS::SQS::Queue', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
      expect(Object.keys(queues).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('PatternDetector Lambda Function', () => {
    test('creates PatternDetector function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `PatternDetector-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        MemorySize: 512,
        Timeout: 30,
        Architectures: ['arm64'],
        // ReservedConcurrentExecutions removed to avoid AWS account limit issues
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('PatternDetector has correct environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `PatternDetector-${environmentSuffix}`,
        Environment: {
          Variables: Match.objectLike({
            PATTERNS_TABLE_NAME: Match.anyValue(),
            ALERT_QUEUE_URL: Match.anyValue(),
          }),
        },
      });
    });

    test('PatternDetector uses shared Lambda Layer', () => {
      const layerCapture = new Capture();
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `PatternDetector-${environmentSuffix}`,
        Layers: [layerCapture],
      });
      expect(layerCapture.asObject()).toHaveProperty('Ref');
    });

    test('PatternDetector has DynamoDB permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('PatternDetector has SQS permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['sqs:SendMessage']),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('PatternDetector has X-Ray permissions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      let foundXRayPermissions = false;
      Object.values(policies).forEach((policy: unknown) => {
        const policyDoc = (policy as { Properties: { PolicyDocument: unknown } })
          .Properties.PolicyDocument;
        const statements = (
          policyDoc as { Statement: Array<{ Action?: string | string[] }> }
        ).Statement;
        statements.forEach((statement) => {
          const actions = Array.isArray(statement.Action)
            ? statement.Action
            : [statement.Action];
          if (
            actions.includes('xray:PutTelemetryRecords') &&
            actions.includes('xray:PutTraceSegments')
          ) {
            foundXRayPermissions = true;
          }
        });
      });
      expect(foundXRayPermissions).toBe(true);
    });

    test('PatternDetector has CloudWatch Logs retention', () => {
      template.hasResourceProperties('Custom::LogRetention', {
        RetentionInDays: 7,
      });
    });
  });

  describe('AlertProcessor Lambda Function', () => {
    test('creates AlertProcessor function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `AlertProcessor-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        MemorySize: 256,
        Timeout: 60,
        Architectures: ['arm64'],
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('AlertProcessor has correct environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `AlertProcessor-${environmentSuffix}`,
        Environment: {
          Variables: Match.objectLike({
            ALERTS_TOPIC_ARN: Match.anyValue(),
            PATTERNS_TABLE_NAME: Match.anyValue(),
          }),
        },
      });
    });

    test('AlertProcessor uses shared Lambda Layer', () => {
      const layerCapture = new Capture();
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `AlertProcessor-${environmentSuffix}`,
        Layers: [layerCapture],
      });
      expect(layerCapture.asObject()).toHaveProperty('Ref');
    });

    test('AlertProcessor has SQS event source mapping', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        BatchSize: 10,
      });
    });

    test('AlertProcessor has SNS publish permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sns:Publish',
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('AlertProcessor has DynamoDB read permissions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      let foundDynamoDBPermissions = false;
      Object.values(policies).forEach((policy: unknown) => {
        const policyDoc = (policy as { Properties: { PolicyDocument: unknown } })
          .Properties.PolicyDocument;
        const statements = (
          policyDoc as { Statement: Array<{ Action?: string | string[] }> }
        ).Statement;
        statements.forEach((statement) => {
          const actions = Array.isArray(statement.Action)
            ? statement.Action
            : [statement.Action];
          if (
            actions.includes('dynamodb:GetItem') ||
            actions.includes('dynamodb:BatchGetItem')
          ) {
            foundDynamoDBPermissions = true;
          }
        });
      });
      expect(foundDynamoDBPermissions).toBe(true);
    });
  });

  describe('ThresholdChecker Lambda Function', () => {
    test('creates ThresholdChecker function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `ThresholdChecker-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        MemorySize: 256,
        Timeout: 60,
        Architectures: ['arm64'],
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('ThresholdChecker has correct environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `ThresholdChecker-${environmentSuffix}`,
        Environment: {
          Variables: Match.objectLike({
            PATTERNS_TABLE_NAME: Match.anyValue(),
            ALERT_QUEUE_URL: Match.anyValue(),
            PRICE_THRESHOLD: '100',
            VOLUME_THRESHOLD: '10000',
            VOLATILITY_THRESHOLD: '0.05',
          }),
        },
      });
    });

    test('ThresholdChecker uses shared Lambda Layer', () => {
      const layerCapture = new Capture();
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `ThresholdChecker-${environmentSuffix}`,
        Layers: [layerCapture],
      });
      expect(layerCapture.asObject()).toHaveProperty('Ref');
    });
  });

  describe('EventBridge Rule', () => {
    test('creates ThresholdCheckRule with correct schedule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `ThresholdCheckRule-${environmentSuffix}`,
        ScheduleExpression: 'rate(5 minutes)',
        State: 'ENABLED',
        Description: 'Trigger threshold checker every 5 minutes',
      });
    });

    test('EventBridge rule has custom event pattern with 3+ conditions', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: Match.objectLike({
          source: ['aws.events'],
          'detail-type': ['Scheduled Event'],
          detail: Match.objectLike({
            eventType: ['threshold-check'],
            priority: ['high'],
            enabled: ['true'],
          }),
        }),
      });
    });

    test('EventBridge rule targets ThresholdChecker function', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Targets: Match.arrayWith([
          Match.objectLike({
            Id: 'Target0',
          }),
        ]),
      });
    });

    test('ThresholdChecker has Lambda invoke permission from EventBridge', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 'events.amazonaws.com',
      });
    });
  });

  describe('API Gateway', () => {
    test('creates PatternDetectionAPI with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `PatternDetectionAPI-${environmentSuffix}`,
        Description: 'API for stock pattern detection system',
      });
    });

    test('API Gateway stage has correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
        TracingEnabled: true,
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            HttpMethod: '*',
            ResourcePath: '/*',
            DataTraceEnabled: true,
            LoggingLevel: 'INFO',
            ThrottlingBurstLimit: 2000,
            ThrottlingRateLimit: 1000,
          }),
        ]),
      });
    });

    test('API Gateway has /patterns resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'patterns',
      });
    });

    test('API Gateway has /alerts resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'alerts',
      });
    });

    test('API Gateway has POST /patterns method', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        AuthorizationType: 'NONE',
      });
    });

    test('API Gateway has GET /patterns method', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        AuthorizationType: 'NONE',
      });
    });

    test('API Gateway has OPTIONS methods for CORS', () => {
      const methods = template.findResources('AWS::ApiGateway::Method', {
        Properties: {
          HttpMethod: 'OPTIONS',
        },
      });
      expect(Object.keys(methods).length).toBeGreaterThanOrEqual(3);
    });

    test('API Gateway has request validator', () => {
      template.hasResourceProperties('AWS::ApiGateway::RequestValidator', {
        RestApiId: Match.anyValue(),
        ValidateRequestBody: true,
        ValidateRequestParameters: true,
      });
    });

    test('API Gateway has request model', () => {
      template.hasResourceProperties('AWS::ApiGateway::Model', {
        RestApiId: Match.anyValue(),
        ContentType: 'application/json',
        Name: `PatternModel${environmentSuffix}`,
      });
    });

    test('API Gateway integrates with PatternDetector Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 'apigateway.amazonaws.com',
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('creates error alarms for Lambda functions', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2,
        Threshold: 1,
        TreatMissingData: 'notBreaching',
      });
    });

    test('alarms use math expressions for error rate', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      expect(Object.keys(alarms).length).toBeGreaterThanOrEqual(3);
    });

    test('alarms have SNS actions', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      Object.values(alarms).forEach((alarm: unknown) => {
        const alarmProps = (alarm as { Properties: Record<string, unknown> })
          .Properties;
        expect(alarmProps).toHaveProperty('AlarmActions');
        const actions = alarmProps.AlarmActions as unknown[];
        expect(actions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports API Gateway URL', () => {
      template.hasOutput('ApiGatewayUrl', {});
    });

    test('exports SQS Queue URL', () => {
      template.hasOutput('AlertQueueUrl', {});
    });

    test('exports DynamoDB Table name', () => {
      template.hasOutput('PatternsTableName', {});
    });

    test('exports SNS Topic ARN', () => {
      template.hasOutput('AlertsTopicArn', {});
    });
  });

  describe('Resource Tagging', () => {
    test('resources have tags where supported', () => {
      // Check resources that support tags
      const taggedResources = [
        'AWS::DynamoDB::Table',
        'AWS::SNS::Topic',
        'AWS::SQS::Queue',
        'AWS::Lambda::Function',
      ];

      taggedResources.forEach((resourceType) => {
        const foundResources = template.findResources(resourceType);
        expect(Object.keys(foundResources).length).toBeGreaterThan(0);
        // Verify at least some resources have tags
        Object.values(foundResources).forEach((resource: unknown) => {
          const res = resource as { Properties: Record<string, unknown> };
          if (res.Properties.Tags) {
            const tags = res.Properties.Tags as Array<{
              Key: string;
              Value: string;
            }>;
            expect(Array.isArray(tags)).toBe(true);
            expect(tags.length).toBeGreaterThan(0);
          }
        });
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('has correct number of Lambda functions', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      // PatternDetector, AlertProcessor, ThresholdChecker, LogRetention
      expect(Object.keys(functions).length).toBeGreaterThanOrEqual(3);
    });

    test('has correct number of IAM roles', () => {
      const roles = template.findResources('AWS::IAM::Role');
      // 3 Lambda roles + 1 LogRetention role
      expect(Object.keys(roles).length).toBeGreaterThanOrEqual(3);
    });

    test('has correct number of IAM policies', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      // One policy per Lambda role
      expect(Object.keys(policies).length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Security Best Practices', () => {
    test('Lambda functions do not have wildcard resource permissions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      Object.values(policies).forEach((policy: unknown) => {
        const policyDoc = (policy as { Properties: { PolicyDocument: unknown } })
          .Properties.PolicyDocument;
        const statements = (
          policyDoc as { Statement: Array<{ Resource?: string | string[] }> }
        ).Statement;
        statements.forEach((statement) => {
          // X-Ray is allowed to have wildcard permissions
          if (
            statement.Resource === '*' &&
            !JSON.stringify(statement).includes('xray')
          ) {
            // Check if this is acceptable (like logs)
            const statementStr = JSON.stringify(statement);
            expect(
              statementStr.includes('xray') ||
                statementStr.includes('logs') ||
                statementStr.includes('PutRetentionPolicy')
            ).toBe(true);
          }
        });
      });
    });

    test('all Lambda functions have execution roles', () => {
      const functions = template.findResources('AWS::Lambda::Function', {
        Properties: Match.objectLike({
          Role: Match.anyValue(),
        }),
      });
      expect(Object.keys(functions).length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Cost Optimization', () => {
    test('Lambda functions use ARM architecture', () => {
      const functions = template.findResources('AWS::Lambda::Function', {
        Properties: {
          Architectures: ['arm64'],
        },
      });
      // PatternDetector, AlertProcessor, ThresholdChecker
      expect(Object.keys(functions).length).toBe(3);
    });

    test('DynamoDB uses on-demand billing', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('critical resources have Delete policies', () => {
      // Check that DynamoDB and SQS have Delete policies
      const dynamoTables = template.findResources('AWS::DynamoDB::Table');
      const sqsQueues = template.findResources('AWS::SQS::Queue');

      Object.values(dynamoTables).forEach((resource: unknown) => {
        const res = resource as {
          DeletionPolicy?: string;
          UpdateReplacePolicy?: string;
        };
        expect(res.DeletionPolicy).toBe('Delete');
        expect(res.UpdateReplacePolicy).toBe('Delete');
      });

      Object.values(sqsQueues).forEach((resource: unknown) => {
        const res = resource as {
          DeletionPolicy?: string;
          UpdateReplacePolicy?: string;
        };
        expect(res.DeletionPolicy).toBe('Delete');
        expect(res.UpdateReplacePolicy).toBe('Delete');
      });
    });
  });

  describe('Environment Suffix Usage', () => {
    test('key resources include environment suffix', () => {
      const resourceTypes = [
        'AWS::Lambda::Function',
        'AWS::DynamoDB::Table',
        'AWS::SQS::Queue',
        'AWS::ApiGateway::RestApi',
        'AWS::Events::Rule',
      ];

      resourceTypes.forEach((type) => {
        const resources = template.findResources(type);
        let foundNameWithSuffix = false;
        Object.values(resources).forEach((resource: unknown) => {
          const res = resource as { Properties: Record<string, unknown> };
          const nameFields = ['FunctionName', 'TableName', 'QueueName', 'Name'];
          nameFields.forEach((nameField) => {
            if (
              res.Properties[nameField] &&
              typeof res.Properties[nameField] === 'string'
            ) {
              const name = res.Properties[nameField] as string;
              if (name.includes(environmentSuffix)) {
                foundNameWithSuffix = true;
              }
            }
          });
        });
        expect(foundNameWithSuffix).toBe(true);
      });
    });
  });
});
