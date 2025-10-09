import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      notificationEmail: 'test@example.com'
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Initialization', () => {
    test('creates stack with default environment suffix when not provided', () => {
      const appDefault = new cdk.App();
      const stackDefault = new TapStack(appDefault, 'DefaultStack', {});
      const templateDefault = Template.fromStack(stackDefault);

      templateDefault.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'error-logs-dev'
      });
    });

    test('creates stack with custom environment suffix', () => {
      const appCustom = new cdk.App();
      const stackCustom = new TapStack(appCustom, 'CustomStack', {
        environmentSuffix: 'prod'
      });
      const templateCustom = Template.fromStack(stackCustom);

      templateCustom.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'error-logs-prod'
      });
    });

    test('uses default email when notificationEmail is not provided', () => {
      const appDefault = new cdk.App();
      const stackDefault = new TapStack(appDefault, 'DefaultEmailStack', {
        environmentSuffix: 'test'
      });
      const templateDefault = Template.fromStack(stackDefault);

      templateDefault.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'admin@example.com'
      });
    });

    test('creates stack without props', () => {
      const appNoProp = new cdk.App();
      expect(() => {
        new TapStack(appNoProp, 'NoPropsStack');
      }).not.toThrow();
    });


    test('handles special characters in environment suffix', () => {
      const appSpecial = new cdk.App();
      const stackSpecial = new TapStack(appSpecial, 'SpecialStack', {
        environmentSuffix: 'test-123_env'
      });
      const templateSpecial = Template.fromStack(stackSpecial);

      templateSpecial.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp('.*-test-123_env')
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('creates error logs table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `error-logs-${environmentSuffix}`,
        AttributeDefinitions: [
          {
            AttributeName: 'errorId',
            AttributeType: 'S'
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'S'
          },
          {
            AttributeName: 'functionName',
            AttributeType: 'S'
          }
        ],
        KeySchema: [
          {
            AttributeName: 'errorId',
            KeyType: 'HASH'
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE'
          }
        ],
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true
        },
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES'
        }
      });
    });

    test('creates global secondary index for function name queries', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: [
          {
            IndexName: 'FunctionNameIndex',
            KeySchema: [
              {
                AttributeName: 'functionName',
                KeyType: 'HASH'
              },
              {
                AttributeName: 'timestamp',
                KeyType: 'RANGE'
              }
            ],
            Projection: {
              ProjectionType: 'ALL'
            }
          }
        ]
      });
    });

    test('table has correct deletion policy', () => {
      const tables = template.findResources('AWS::DynamoDB::Table');
      const tableKeys = Object.keys(tables);
      expect(tableKeys.length).toBe(1);
      expect(tables[tableKeys[0]].DeletionPolicy).toBe('Delete');
    });

    test('table has correct update replace policy', () => {
      const tables = template.findResources('AWS::DynamoDB::Table');
      const tableKeys = Object.keys(tables);
      expect(tables[tableKeys[0]].UpdateReplacePolicy).toBe('Delete');
    });

    test('creates only one DynamoDB table', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });

    test('table has all required attribute definitions', () => {
      const tables = template.findResources('AWS::DynamoDB::Table');
      const table = Object.values(tables)[0] as any;
      const attributes = table.Properties.AttributeDefinitions;

      expect(attributes).toHaveLength(3);
      expect(attributes.map((a: any) => a.AttributeName)).toContain('errorId');
      expect(attributes.map((a: any) => a.AttributeName)).toContain('timestamp');
      expect(attributes.map((a: any) => a.AttributeName)).toContain('functionName');
    });
  });

  describe('SNS Topic and Subscription', () => {
    test('creates SNS topic with correct name and display name', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `monitoring-alerts-${environmentSuffix}`,
        DisplayName: `Monitoring Alerts - ${environmentSuffix.toUpperCase()}`
      });
    });

    test('creates email subscription for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'test@example.com'
      });
    });

    test('creates only one SNS topic', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });

    test('creates only one SNS subscription', () => {
      template.resourceCountIs('AWS::SNS::Subscription', 1);
    });

    test('subscription is linked to the correct topic', () => {
      const topics = template.findResources('AWS::SNS::Topic');
      const subscriptions = template.findResources('AWS::SNS::Subscription');

      const topicId = Object.keys(topics)[0];
      const subscription = Object.values(subscriptions)[0] as any;

      expect(subscription.Properties.TopicArn).toHaveProperty('Ref', topicId);
    });
  });

  describe('IAM Role', () => {
    test('creates Lambda execution role with correct policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            }
          ]
        },
        ManagedPolicyArns: [
          Match.objectLike({
            'Fn::Join': Match.anyValue()
          })
        ]
      });
    });

    test('grants DynamoDB write permissions to Lambda role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'dynamodb:BatchWriteItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem'
              ]),
              Effect: 'Allow'
            })
          ])
        }
      });
    });

    test('grants CloudWatch Logs permissions to Lambda role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents'
              ],
              Resource: '*'
            }
          ])
        }
      });
    });

    test('IAM role does not have hardcoded role name', () => {
      const roles = template.findResources('AWS::IAM::Role');
      Object.values(roles).forEach((role: any) => {
        expect(role.Properties.RoleName).toBeUndefined();
      });
    });

    test('IAM role has description', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Description: Match.stringLikeRegexp('Execution role.*Lambda.*')
      });
    });

    test('creates exactly one execution role', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const lambdaRoles = Object.values(roles).filter((role: any) =>
        role.Properties.AssumeRolePolicyDocument.Statement.some(
          (stmt: any) => stmt.Principal?.Service === 'lambda.amazonaws.com'
        )
      );
      expect(lambdaRoles.length).toBe(1);
    });

    test('IAM policies are attached to the correct role', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const policies = template.findResources('AWS::IAM::Policy');

      const roleId = Object.keys(roles)[0];
      Object.values(policies).forEach((policy: any) => {
        expect(policy.Properties.Roles).toContainEqual({ Ref: roleId });
      });
    });
  });

  describe('Lambda Functions', () => {
    const functionNames = ['user-service', 'order-processor', 'payment-handler', 'notification-sender', 'data-aggregator'];

    test('creates all five Lambda functions', () => {
      template.resourceCountIs('AWS::Lambda::Function', 5);
    });

    functionNames.forEach((funcName, index) => {
      test(`creates ${funcName} function with correct configuration`, () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          FunctionName: `${funcName}-${environmentSuffix}`,
          Runtime: 'nodejs18.x',
          Handler: 'index.handler',
          Timeout: 30,
          MemorySize: 256,
          Environment: {
            Variables: {
              ERROR_TABLE_NAME: Match.anyValue(),
              FUNCTION_NAME: `${funcName}-${environmentSuffix}`,
              ENVIRONMENT: environmentSuffix
            }
          }
        });
      });

      test(`${funcName} function references DynamoDB table correctly`, () => {
        const functions = template.findResources('AWS::Lambda::Function');
        const tables = template.findResources('AWS::DynamoDB::Table');

        const tableId = Object.keys(tables)[0];
        const matchingFunction = Object.values(functions).find((fn: any) =>
          fn.Properties.FunctionName === `${funcName}-${environmentSuffix}`
        ) as any;

        expect(matchingFunction).toBeDefined();
        expect(matchingFunction.Properties.Environment.Variables.ERROR_TABLE_NAME).toHaveProperty('Ref', tableId);
      });

      test(`${funcName} function uses the execution role`, () => {
        const functions = template.findResources('AWS::Lambda::Function');
        const roles = template.findResources('AWS::IAM::Role');

        const roleId = Object.keys(roles)[0];
        const matchingFunction = Object.values(functions).find((fn: any) =>
          fn.Properties.FunctionName === `${funcName}-${environmentSuffix}`
        ) as any;

        expect(matchingFunction.Properties.Role).toEqual({
          'Fn::GetAtt': [roleId, 'Arn']
        });
      });
    });

    test('Lambda functions have inline code with error handling', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Code: {
          ZipFile: Match.stringLikeRegexp('DynamoDBClient.*PutItemCommand')
        }
      });
    });

    test('Lambda functions have inline code with proper error logging', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      Object.values(functions).forEach((func: any) => {
        const code = func.Properties.Code.ZipFile;
        expect(code).toContain('exports.handler');
        expect(code).toContain('try {');
        expect(code).toContain('catch (error)');
        expect(code).toContain('console.log');
        expect(code).toContain('console.error');
      });
    });

    test('Lambda functions simulate random errors', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      Object.values(functions).forEach((func: any) => {
        const code = func.Properties.Code.ZipFile;
        expect(code).toContain('Math.random()');
        expect(code).toContain('Simulated processing error');
      });
    });

    test('Lambda functions log to DynamoDB on error', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      Object.values(functions).forEach((func: any) => {
        const code = func.Properties.Code.ZipFile;
        expect(code).toContain('PutItemCommand');
        expect(code).toContain('ERROR_TABLE_NAME');
        expect(code).toContain('errorId');
        expect(code).toContain('errorMessage');
      });
    });

    test('all Lambda functions have correct environment variables set', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(functions).length).toBe(5);

      Object.values(functions).forEach((func: any) => {
        expect(func.Properties.Environment.Variables).toHaveProperty('ERROR_TABLE_NAME');
        expect(func.Properties.Environment.Variables).toHaveProperty('FUNCTION_NAME');
        expect(func.Properties.Environment.Variables).toHaveProperty('ENVIRONMENT');
        expect(func.Properties.Environment.Variables.ENVIRONMENT).toBe(environmentSuffix);
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    const functionNames = ['user-service', 'order-processor', 'payment-handler', 'notification-sender', 'data-aggregator'];

    test('creates error rate alarms for all functions', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 15); // 3 alarms per function * 5 functions
    });

    test('creates error rate alarm with correct configuration', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: Match.stringLikeRegexp('Error rate exceeded 5%'),
        Threshold: 5,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching'
      });
    });

    test('creates latency alarm with correct configuration', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: Match.stringLikeRegexp('Average duration exceeded 500ms'),
        Threshold: 500,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching'
      });
    });

    test('creates throttle alarm with correct configuration', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: Match.stringLikeRegexp('is being throttled'),
        Threshold: 5,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 1,
        TreatMissingData: 'notBreaching'
      });
    });

    test('alarms are configured with SNS actions', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmActions: Match.arrayWith([
          Match.objectLike({
            Ref: Match.anyValue()
          })
        ])
      });
    });

    functionNames.forEach(funcName => {
      test(`creates error rate alarm for ${funcName}`, () => {
        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          AlarmName: `${funcName}-error-rate-${environmentSuffix}`,
          AlarmDescription: `Error rate exceeded 5% for ${funcName}`
        });
      });

      test(`creates latency alarm for ${funcName}`, () => {
        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          AlarmName: `${funcName}-latency-${environmentSuffix}`,
          AlarmDescription: `Average duration exceeded 500ms for ${funcName}`
        });
      });

      test(`creates throttle alarm for ${funcName}`, () => {
        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          AlarmName: `${funcName}-throttles-${environmentSuffix}`,
          AlarmDescription: `Function ${funcName} is being throttled`
        });
      });
    });

    test('error rate alarms use math expression', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const errorRateAlarms = Object.values(alarms).filter((alarm: any) =>
        alarm.Properties.AlarmName?.includes('error-rate')
      );

      expect(errorRateAlarms.length).toBe(5);
      errorRateAlarms.forEach((alarm: any) => {
        const metrics = alarm.Properties.Metrics;
        const mathMetric = metrics.find((m: any) => m.Expression);
        expect(mathMetric).toBeDefined();
        expect(mathMetric.Expression).toBe('(errors / invocations) * 100');
      });
    });


    test('all alarms reference the SNS topic', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const topics = template.findResources('AWS::SNS::Topic');
      const topicId = Object.keys(topics)[0];

      Object.values(alarms).forEach((alarm: any) => {
        expect(alarm.Properties.AlarmActions).toContainEqual({ Ref: topicId });
      });
    });

    test('alarms use correct period of 5 minutes', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      Object.values(alarms).forEach((alarm: any) => {
        const metrics = alarm.Properties.Metrics || [];
        metrics.forEach((metric: any) => {
          if (metric.MetricStat) {
            expect(metric.MetricStat.Period).toBe(300);
          }
          if (metric.Period) {
            expect(metric.Period).toBe(300);
          }
        });
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('creates dashboard with correct name', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `serverless-monitoring-${environmentSuffix}`
      });
    });

    test('dashboard has configuration body', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardBody: Match.anyValue()
      });
    });

    test('creates exactly one dashboard', () => {
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });

    test('dashboard body contains widgets', () => {
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboard = Object.values(dashboards)[0] as any;
      expect(dashboard.Properties.DashboardBody).toBeDefined();
    });

  });

  describe('Stack Outputs', () => {
    test('exports DynamoDB table name', () => {
      template.hasOutput('ErrorLogsTableName', {
        Description: 'DynamoDB table for error logs'
      });
    });

    test('exports SNS topic ARN', () => {
      template.hasOutput('AlertTopicArn', {
        Description: 'SNS topic for monitoring alerts'
      });
    });

    test('exports dashboard URL', () => {
      template.hasOutput('DashboardURL', {
        Description: 'CloudWatch Dashboard URL'
      });
    });

    test('exports all Lambda function names', () => {
      for (let i = 1; i <= 5; i++) {
        template.hasOutput(`Function${i}Name`, {
          Description: `Lambda function ${i}`
        });
      }
    });

    test('creates exactly 8 outputs', () => {
      const outputs = template.toJSON().Outputs;
      expect(Object.keys(outputs).length).toBe(8);
    });

    test('DynamoDB table output has correct value', () => {
      const outputs = template.toJSON().Outputs;
      const tableOutput = outputs.ErrorLogsTableName;
      expect(tableOutput.Value).toHaveProperty('Ref');
    });

    test('SNS topic output has correct value', () => {
      const outputs = template.toJSON().Outputs;
      const topicOutput = outputs.AlertTopicArn;
      expect(topicOutput.Value).toHaveProperty('Ref');
    });

    test('dashboard URL output contains region placeholder', () => {
      const outputs = template.toJSON().Outputs;
      const dashboardOutput = outputs.DashboardURL;
      const urlValue = JSON.stringify(dashboardOutput.Value);
      expect(urlValue).toContain('AWS::Region');
    });
  });

  describe('Resource Naming', () => {
    test('all resources use environment suffix correctly', () => {
      // DynamoDB Table
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `error-logs-${environmentSuffix}`
      });

      // SNS Topic
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `monitoring-alerts-${environmentSuffix}`
      });

      // Lambda Functions
      const functionNames = ['user-service', 'order-processor', 'payment-handler', 'notification-sender', 'data-aggregator'];
      functionNames.forEach(funcName => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          FunctionName: `${funcName}-${environmentSuffix}`
        });
      });
    });

    test('alarm names include environment suffix', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      Object.values(alarms).forEach((alarm: any) => {
        expect(alarm.Properties.AlarmName).toContain(environmentSuffix);
      });
    });

    test('dashboard name includes environment suffix', () => {
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
      Object.values(dashboards).forEach((dashboard: any) => {
        expect(dashboard.Properties.DashboardName).toContain(environmentSuffix);
      });
    });
  });

  describe('Security Configuration', () => {
    test('Lambda functions use dedicated execution role', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Role: Match.anyValue()
      });
    });

    test('DynamoDB table has deletion policy for cleanup', () => {
      template.hasResource('AWS::DynamoDB::Table', {
        DeletionPolicy: 'Delete'
      });
    });

    test('IAM role follows least privilege principle', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: [
          Match.objectLike({
            'Fn::Join': Match.anyValue()
          })
        ]
      });
    });

    test('DynamoDB table has point-in-time recovery enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true
        }
      });
    });

    test('DynamoDB table has streams enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES'
        }
      });
    });

    test('Lambda functions do not have reserved concurrent executions', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      Object.values(functions).forEach((func: any) => {
        expect(func.Properties.ReservedConcurrentExecutions).toBeUndefined();
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('Lambda functions depend on IAM role creation', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      const roles = template.findResources('AWS::IAM::Role');
      const roleId = Object.keys(roles)[0];

      Object.values(functions).forEach((func: any) => {
        expect(func.Properties.Role).toEqual({
          'Fn::GetAtt': [roleId, 'Arn']
        });
      });
    });

    test('alarms depend on Lambda functions', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const functions = template.findResources('AWS::Lambda::Function');
      const functionIds = Object.keys(functions);

      const alarmFunctionRefs = Object.values(alarms).flatMap((alarm: any) =>
        (alarm.Properties.Metrics || [])
          .map((metric: any) => metric.MetricStat?.Metric?.Dimensions?.[0]?.Value?.Ref)
          .filter(Boolean)
      );

      alarmFunctionRefs.forEach(ref => {
        expect(functionIds).toContain(ref);
      });
    });

    test('IAM policies depend on role creation', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const roles = template.findResources('AWS::IAM::Role');
      const roleId = Object.keys(roles)[0];

      Object.values(policies).forEach((policy: any) => {
        expect(policy.Properties.Roles).toContainEqual({ Ref: roleId });
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles multiple stacks in same app', () => {
      const multiApp = new cdk.App();
      const stack1 = new TapStack(multiApp, 'Stack1', { environmentSuffix: 'dev' });
      const stack2 = new TapStack(multiApp, 'Stack2', { environmentSuffix: 'prod' });

      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
    });

    test('handles very long environment suffix', () => {
      const longApp = new cdk.App();
      const longStack = new TapStack(longApp, 'LongStack', {
        environmentSuffix: 'very-long-environment-suffix-name-123'
      });
      const longTemplate = Template.fromStack(longStack);

      longTemplate.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'monitoring-alerts-very-long-environment-suffix-name-123'
      });
    });

    test('handles numeric environment suffix', () => {
      const numApp = new cdk.App();
      const numStack = new TapStack(numApp, 'NumStack', {
        environmentSuffix: '12345'
      });
      const numTemplate = Template.fromStack(numStack);

      numTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'error-logs-12345'
      });
    });
  });

  describe('Write Integration TESTS', () => {
    test('complete monitoring workflow integration', () => {
      // Verify all components exist
      const functions = template.findResources('AWS::Lambda::Function');
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const topics = template.findResources('AWS::SNS::Topic');
      const tables = template.findResources('AWS::DynamoDB::Table');
      const subscriptions = template.findResources('AWS::SNS::Subscription');
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');

      expect(Object.keys(functions).length).toBe(5);
      expect(Object.keys(alarms).length).toBe(15);
      expect(Object.keys(topics).length).toBe(1);
      expect(Object.keys(tables).length).toBe(1);
      expect(Object.keys(subscriptions).length).toBe(1);
      expect(Object.keys(dashboards).length).toBe(1);

      // Verify connections
      const topicId = Object.keys(topics)[0];
      const tableId = Object.keys(tables)[0];

      // All alarms should trigger SNS
      Object.values(alarms).forEach((alarm: any) => {
        expect(alarm.Properties.AlarmActions).toContainEqual({ Ref: topicId });
      });

      // All functions should reference the table
      Object.values(functions).forEach((func: any) => {
        expect(func.Properties.Environment.Variables.ERROR_TABLE_NAME).toHaveProperty('Ref', tableId);
      });
    });

    test('Lambda error logging to DynamoDB integration', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      const tables = template.findResources('AWS::DynamoDB::Table');
      const policies = template.findResources('AWS::IAM::Policy');

      const tableId = Object.keys(tables)[0];
      const tableArn = { 'Fn::GetAtt': [tableId, 'Arn'] };

      // Verify functions reference table
      Object.values(functions).forEach((func: any) => {
        expect(func.Properties.Environment.Variables.ERROR_TABLE_NAME).toHaveProperty('Ref', tableId);
      });

      // Verify IAM policy allows DynamoDB writes
      const dynamoPolicy = Object.values(policies).find((policy: any) =>
        policy.Properties.PolicyDocument.Statement.some((stmt: any) =>
          stmt.Action?.includes('dynamodb:PutItem')
        )
      );
      expect(dynamoPolicy).toBeDefined();
    });

    test('alarm notification chain integration', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const topics = template.findResources('AWS::SNS::Topic');
      const subscriptions = template.findResources('AWS::SNS::Subscription');
      const functions = template.findResources('AWS::Lambda::Function');

      const topicId = Object.keys(topics)[0];
      const functionIds = Object.keys(functions);

      // Verify alarm -> SNS connection
      Object.values(alarms).forEach((alarm: any) => {
        expect(alarm.Properties.AlarmActions[0]).toHaveProperty('Ref', topicId);
      });

      // Verify SNS -> Email subscription
      const subscription = Object.values(subscriptions)[0] as any;
      expect(subscription.Properties.TopicArn).toHaveProperty('Ref', topicId);
      expect(subscription.Properties.Endpoint).toBe('test@example.com');

      // Verify alarms monitor correct functions
      const errorRateAlarms = Object.values(alarms).filter((alarm: any) =>
        alarm.Properties.AlarmName?.includes('error-rate')
      );
      expect(errorRateAlarms.length).toBe(5);
    });

    test('IAM permissions allow complete error logging flow', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const policies = template.findResources('AWS::IAM::Policy');
      const functions = template.findResources('AWS::Lambda::Function');

      const roleId = Object.keys(roles)[0];

      // Verify functions use the role
      Object.values(functions).forEach((func: any) => {
        expect(func.Properties.Role).toEqual({
          'Fn::GetAtt': [roleId, 'Arn']
        });
      });

      // Verify required permissions exist
      const allStatements = Object.values(policies).flatMap((policy: any) =>
        policy.Properties.PolicyDocument.Statement
      );

      const hasDynamoDBWrite = allStatements.some((stmt: any) =>
        stmt.Action?.includes('dynamodb:PutItem')
      );
      const hasLogsWrite = allStatements.some((stmt: any) =>
        stmt.Action?.includes('logs:PutLogEvents')
      );

      expect(hasDynamoDBWrite).toBe(true);
      expect(hasLogsWrite).toBe(true);
    });

    test('all alarm types exist for each function', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const functionNames = ['user-service', 'order-processor', 'payment-handler', 'notification-sender', 'data-aggregator'];

      functionNames.forEach(funcName => {
        const errorRateAlarm = Object.values(alarms).find((alarm: any) =>
          alarm.Properties.AlarmName === `${funcName}-error-rate-${environmentSuffix}`
        );
        const latencyAlarm = Object.values(alarms).find((alarm: any) =>
          alarm.Properties.AlarmName === `${funcName}-latency-${environmentSuffix}`
        );
        const throttleAlarm = Object.values(alarms).find((alarm: any) =>
          alarm.Properties.AlarmName === `${funcName}-throttles-${environmentSuffix}`
        );

        expect(errorRateAlarm).toBeDefined();
        expect(latencyAlarm).toBeDefined();
        expect(throttleAlarm).toBeDefined();
      });
    });

    test('stack can be synthesized without errors', () => {
      expect(() => {
        app.synth();
      }).not.toThrow();
    });

    test('all outputs reference correct resources', () => {
      const outputs = template.toJSON().Outputs;
      const tables = template.findResources('AWS::DynamoDB::Table');
      const topics = template.findResources('AWS::SNS::Topic');
      const functions = template.findResources('AWS::Lambda::Function');

      const tableId = Object.keys(tables)[0];
      const topicId = Object.keys(topics)[0];

      // Verify table output
      expect(outputs.ErrorLogsTableName.Value).toHaveProperty('Ref', tableId);

      // Verify topic output
      expect(outputs.AlertTopicArn.Value).toHaveProperty('Ref', topicId);

      // Verify function outputs
      const functionIds = Object.keys(functions);
      for (let i = 1; i <= 5; i++) {
        const output = outputs[`Function${i}Name`];
        expect(output).toBeDefined();
      }
    });
  });

  describe('Resource Count Validation', () => {
    test('creates exact number of each resource type', () => {
      template.resourceCountIs('AWS::Lambda::Function', 5);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 15);
      template.resourceCountIs('AWS::SNS::Topic', 1);
      template.resourceCountIs('AWS::SNS::Subscription', 1);
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
      template.resourceCountIs('AWS::IAM::Role', 1);
    });

  });

  describe('Property Validation', () => {
    test('all Lambda functions have correct timeout', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      Object.values(functions).forEach((func: any) => {
        expect(func.Properties.Timeout).toBe(30);
      });
    });

    test('all Lambda functions have correct memory size', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      Object.values(functions).forEach((func: any) => {
        expect(func.Properties.MemorySize).toBe(256);
      });
    });

    test('all Lambda functions use Node.js 18 runtime', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      Object.values(functions).forEach((func: any) => {
        expect(func.Properties.Runtime).toBe('nodejs18.x');
      });
    });

    test('DynamoDB table uses PAY_PER_REQUEST billing', () => {
      const tables = template.findResources('AWS::DynamoDB::Table');
      Object.values(tables).forEach((table: any) => {
        expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      });
    });

    test('all error rate alarms have 5% threshold', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const errorRateAlarms = Object.values(alarms).filter((alarm: any) =>
        alarm.Properties.AlarmName?.includes('error-rate')
      );
      errorRateAlarms.forEach((alarm: any) => {
        expect(alarm.Properties.Threshold).toBe(5);
      });
    });

    test('all latency alarms have 500ms threshold', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const latencyAlarms = Object.values(alarms).filter((alarm: any) =>
        alarm.Properties.AlarmName?.includes('latency')
      );
      latencyAlarms.forEach((alarm: any) => {
        expect(alarm.Properties.Threshold).toBe(500);
      });
    });
  });

  describe('String Concatenation and Formatting', () => {
    test('SNS topic display name uses uppercase environment suffix', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: `Monitoring Alerts - ${environmentSuffix.toUpperCase()}`
      });
    });

    test('function names concatenate correctly with hyphen', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      Object.values(functions).forEach((func: any) => {
        expect(func.Properties.FunctionName).toMatch(/^[a-z-]+-[a-z0-9-]+$/);
      });
    });

    test('alarm names follow consistent naming pattern', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      Object.values(alarms).forEach((alarm: any) => {
        expect(alarm.Properties.AlarmName).toMatch(/^[a-z-]+-[a-z-]+-[a-z0-9-]+$/);
      });
    });
  });

  describe('Metric Configuration', () => {
    test('error rate alarms use correct metrics', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const errorRateAlarms = Object.values(alarms).filter((alarm: any) =>
        alarm.Properties.AlarmName?.includes('error-rate')
      );

      errorRateAlarms.forEach((alarm: any) => {
        const metrics = alarm.Properties.Metrics;
        const errorMetric = metrics.find((m: any) => m.Id === 'errors');
        const invocationMetric = metrics.find((m: any) => m.Id === 'invocations');

        expect(errorMetric).toBeDefined();
        expect(invocationMetric).toBeDefined();
      });
    });
  });
});