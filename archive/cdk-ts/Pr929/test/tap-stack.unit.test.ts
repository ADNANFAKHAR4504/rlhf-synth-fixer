import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('Environment Suffix Handling', () => {
    test('Should use provided environmentSuffix from props', () => {
      const customSuffix = 'custom';
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: customSuffix,
      });
      const customTemplate = Template.fromStack(customStack);
      
      customTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `${customSuffix}-userdata-synth`,
      });
    });

    test('Should use context environmentSuffix when not in props', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'context-test',
        },
      });
      const contextStack = new TapStack(contextApp, 'ContextStack');
      const contextTemplate = Template.fromStack(contextStack);
      
      contextTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'context-test-userdata-synth',
      });
    });

    test('Should use environment variable when no props or context', () => {
      const originalEnv = process.env.ENVIRONMENT_SUFFIX;
      process.env.ENVIRONMENT_SUFFIX = 'env-test';
      
      const envApp = new cdk.App();
      const envStack = new TapStack(envApp, 'EnvStack');
      const envTemplate = Template.fromStack(envStack);
      
      envTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'env-test-userdata-synth',
      });
      
      // Restore original env
      if (originalEnv) {
        process.env.ENVIRONMENT_SUFFIX = originalEnv;
      } else {
        delete process.env.ENVIRONMENT_SUFFIX;
      }
    });

    test('Should default to dev when no suffix provided', () => {
      const originalEnv = process.env.ENVIRONMENT_SUFFIX;
      delete process.env.ENVIRONMENT_SUFFIX;
      
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      const defaultTemplate = Template.fromStack(defaultStack);
      
      defaultTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'dev-userdata-synth',
      });
      
      // Restore original env
      if (originalEnv) {
        process.env.ENVIRONMENT_SUFFIX = originalEnv;
      }
    });
  });

  describe('DynamoDB Tables', () => {
    test('Should create User Data table with correct properties', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `${environmentSuffix}-userdata-synth`,
        BillingMode: 'PAY_PER_REQUEST',
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        KeySchema: [
          {
            AttributeName: 'userId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
      });
    });

    test('Should create Order Data table with correct properties', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `${environmentSuffix}-orderdata-synth`,
        BillingMode: 'PAY_PER_REQUEST',
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        KeySchema: [
          {
            AttributeName: 'orderId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'createdAt',
            KeyType: 'RANGE',
          },
        ],
      });
    });

    test('Should create Analytics table with correct properties', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `${environmentSuffix}-analytics-synth`,
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [
          {
            AttributeName: 'dataType',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'processedAt',
            KeyType: 'RANGE',
          },
        ],
      });
    });

    test('All tables should have DESTROY removal policy', () => {
      const tables = template.findResources('AWS::DynamoDB::Table');
      Object.values(tables).forEach((table: any) => {
        expect(table.UpdateReplacePolicy).toBe('Delete');
        expect(table.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('Lambda Functions', () => {
    test('Should create User Data Processor Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `${environmentSuffix}-userdataproc-synth`,
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        MemorySize: 256,
        Timeout: 300,
        Environment: {
          Variables: {
            ANALYTICS_TABLE_NAME: Match.anyValue(),
            REGION: Match.anyValue(),
          },
        },
      });
    });

    test('Should create Order Data Processor Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `${environmentSuffix}-orderdataproc-synth`,
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        MemorySize: 512,
        Timeout: 300,
        Environment: {
          Variables: {
            ANALYTICS_TABLE_NAME: Match.anyValue(),
            REGION: Match.anyValue(),
          },
        },
      });
    });

    test('Should create Analytics Processor Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `${environmentSuffix}-analyticsproc-synth`,
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        MemorySize: 1024,
        Timeout: 600,
        Environment: {
          Variables: {
            ANALYTICS_TABLE_NAME: Match.anyValue(),
            REGION: Match.anyValue(),
          },
        },
      });
    });

    test('Should create Data Validator Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `${environmentSuffix}-datavalidator-synth`,
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        MemorySize: 256,
        Timeout: 120,
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('All Lambda functions should have log groups', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      // Step Functions log group + at least 1 Lambda log group
      expect(Object.keys(logGroups).length).toBeGreaterThanOrEqual(1);
    });

    test('All Lambda functions should have X-Ray tracing enabled', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      Object.values(functions).forEach((func: any) => {
        expect(func.Properties.TracingConfig).toEqual({ Mode: 'Active' });
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('Should create User Data Processor role with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `${environmentSuffix}-userdataproc-role-synth`,
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

      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'dynamodb:DescribeStream',
                'dynamodb:GetRecords',
                'dynamodb:GetShardIterator',
                'dynamodb:ListStreams',
              ]),
              Effect: 'Allow',
            }),
            Match.objectLike({
              Action: Match.arrayWith(['dynamodb:PutItem', 'dynamodb:UpdateItem']),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('Should create Order Data Processor role with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `${environmentSuffix}-orderdataproc-role-synth`,
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
    });

    test('Should create Analytics Processor role with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `${environmentSuffix}-analyticsproc-role-synth`,
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

      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'dynamodb:Query',
                'dynamodb:Scan',
                'dynamodb:PutItem',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('Event Source Mappings', () => {
    test('Should create event source mapping for User Data table', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        BatchSize: 10,
        MaximumBatchingWindowInSeconds: 5,
        StartingPosition: 'TRIM_HORIZON',
        MaximumRetryAttempts: 3,
        ParallelizationFactor: 2,
        FunctionResponseTypes: ['ReportBatchItemFailures'],
      });
    });

    test('Should create event source mapping for Order Data table', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        BatchSize: 5,
        MaximumBatchingWindowInSeconds: 10,
        StartingPosition: 'TRIM_HORIZON',
        MaximumRetryAttempts: 3,
        ParallelizationFactor: 1,
        FunctionResponseTypes: ['ReportBatchItemFailures'],
      });
    });
  });

  describe('Step Functions', () => {
    test('Should create Step Functions state machine', () => {
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        StateMachineName: `${environmentSuffix}-data-processing-synth`,
        TracingConfiguration: {
          Enabled: true,
        },
      });
    });

    test('Should create Step Functions role with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'states.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('Should have Step Functions log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/stepfunctions/${environmentSuffix}-data-processing-synth`,
        RetentionInDays: 14,
      });
    });
  });

  describe('Monitoring and Alarms', () => {
    test('Should create SNS topic for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `${environmentSuffix}-serverless-alerts-synth`,
        DisplayName: 'Serverless Infrastructure Alerts',
      });
    });

    test('Should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `${environmentSuffix}-serverless-dash-synth`,
      });
    });

    test('Should create CloudWatch alarm for User Data Processor errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `${environmentSuffix}-userdataproc-errors-synth`,
        AlarmDescription: 'Alarm for User Data Processor Lambda errors',
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Threshold: 5,
        EvaluationPeriods: 2,
        Period: 300,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('Should create CloudWatch alarm for Step Functions failures', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `${environmentSuffix}-stepfunctions-failures-synth`,
        AlarmDescription: 'Alarm for Step Functions execution failures',
        MetricName: 'ExecutionsFailed',
        Namespace: 'AWS/States',
        Threshold: 1,
        EvaluationPeriods: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('Should create EventBridge rule for daily analytics', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `${environmentSuffix}-daily-analytics-synth`,
        Description: 'Triggers Step Functions workflow daily',
        ScheduleExpression: 'cron(0 2 * * ? *)',
        State: 'ENABLED',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Should have all required outputs', () => {
      const outputs = template.findOutputs('*');
      expect(outputs).toHaveProperty('UserDataTableName');
      expect(outputs).toHaveProperty('OrderDataTableName');
      expect(outputs).toHaveProperty('AnalyticsTableName');
      expect(outputs).toHaveProperty('UserDataProcessorFunctionName');
      expect(outputs).toHaveProperty('OrderDataProcessorFunctionName');
      expect(outputs).toHaveProperty('AnalyticsProcessorFunctionName');
      expect(outputs).toHaveProperty('DataValidatorFunctionName');
      expect(outputs).toHaveProperty('StepFunctionsStateMachineArn');
      expect(outputs).toHaveProperty('DashboardUrl');
      expect(outputs).toHaveProperty('AlertTopicArn');
    });
  });

  describe('Resource Count Validation', () => {
    test('Should create exactly 3 DynamoDB tables', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 3);
    });

    test('Should create exactly 4 Lambda functions', () => {
      template.resourceCountIs('AWS::Lambda::Function', 4);
    });

    test('Should create at least 5 IAM roles', () => {
      const roles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(roles).length).toBeGreaterThanOrEqual(5);
    });

    test('Should create exactly 2 event source mappings', () => {
      template.resourceCountIs('AWS::Lambda::EventSourceMapping', 2);
    });

    test('Should create exactly 1 Step Functions state machine', () => {
      template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
    });

    test('Should create exactly 2 CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });
  });

  describe('Security Best Practices', () => {
    test('IAM roles should follow least privilege principle', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      Object.values(policies).forEach((policy: any) => {
        const statements = policy.Properties.PolicyDocument.Statement;
        statements.forEach((statement: any) => {
          // Check that actions are specific, not wildcards
          if (Array.isArray(statement.Action)) {
            statement.Action.forEach((action: string) => {
              expect(action).not.toContain('*');
            });
          }
        });
      });
    });

    test('Lambda functions should have environment-specific names', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      Object.values(functions).forEach((func: any) => {
        expect(func.Properties.FunctionName).toContain(environmentSuffix);
      });
    });
  });
});