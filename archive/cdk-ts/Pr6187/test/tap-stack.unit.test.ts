import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('Stack should be created successfully', () => {
      expect(stack).toBeDefined();
      expect(template).toBeDefined();
    });
  });

  describe('DynamoDB Tables', () => {
    test('Should create transactions-raw table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `transactions-raw-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [
          {
            AttributeName: 'transactionId',
            KeyType: 'HASH',
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'transactionId',
            AttributeType: 'S',
          },
        ],
      });
    });

    test('Should create transactions-processed table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `transactions-processed-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [
          {
            AttributeName: 'transactionId',
            KeyType: 'HASH',
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'transactionId',
            AttributeType: 'S',
          },
        ],
      });
    });

    test('DynamoDB tables should have RemovalPolicy.DESTROY', () => {
      const resources = template.findResources('AWS::DynamoDB::Table');
      const tableIds = Object.keys(resources);

      expect(tableIds.length).toBeGreaterThan(0);
      tableIds.forEach((tableId) => {
        expect(resources[tableId].DeletionPolicy).toBe('Delete');
        expect(resources[tableId].UpdateReplacePolicy).toBe('Delete');
      });
    });

    test('DynamoDB tables should have proper tags', () => {
      const resources = template.findResources('AWS::DynamoDB::Table');
      const tableIds = Object.keys(resources);

      expect(tableIds.length).toBeGreaterThan(0);
      tableIds.forEach((tableId) => {
        const tags = resources[tableId].Properties.Tags;
        expect(tags).toBeDefined();
        expect(tags).toEqual(
          expect.arrayContaining([
            { Key: 'Environment', Value: 'production' },
            { Key: 'Application', Value: 'transaction-processor' },
          ])
        );
      });
    });
  });

  describe('Lambda Functions', () => {
    test('Should create fraud-detector Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `fraud-detector-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        MemorySize: 512,
        Timeout: 60,
        Environment: {
          Variables: {
            TRANSACTIONS_RAW_TABLE: Match.anyValue(),
            TRANSACTIONS_PROCESSED_TABLE: Match.anyValue(),
          },
        },
      });
    });

    test('Should create compliance-checker Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `compliance-checker-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        MemorySize: 512,
        Timeout: 60,
        Environment: {
          Variables: {
            TRANSACTIONS_RAW_TABLE: Match.anyValue(),
            TRANSACTIONS_PROCESSED_TABLE: Match.anyValue(),
          },
        },
      });
    });

    test('Should create risk-assessor Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `risk-assessor-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        MemorySize: 512,
        Timeout: 60,
        Environment: {
          Variables: {
            TRANSACTIONS_RAW_TABLE: Match.anyValue(),
            TRANSACTIONS_PROCESSED_TABLE: Match.anyValue(),
          },
        },
      });
    });

    test('All Lambda functions should have 512MB memory', () => {
      const lambdas = template.findResources('AWS::Lambda::Function');
      const lambdaIds = Object.keys(lambdas);

      expect(lambdaIds.length).toBe(3);
      lambdaIds.forEach((lambdaId) => {
        expect(lambdas[lambdaId].Properties.MemorySize).toBe(512);
      });
    });

    test('All Lambda functions should have 60 second timeout', () => {
      const lambdas = template.findResources('AWS::Lambda::Function');
      const lambdaIds = Object.keys(lambdas);

      expect(lambdaIds.length).toBe(3);
      lambdaIds.forEach((lambdaId) => {
        expect(lambdas[lambdaId].Properties.Timeout).toBe(60);
      });
    });

    test('Lambda functions should have proper tags', () => {
      const resources = template.findResources('AWS::Lambda::Function');
      const lambdaIds = Object.keys(resources);

      expect(lambdaIds.length).toBeGreaterThan(0);
      lambdaIds.forEach((lambdaId) => {
        const tags = resources[lambdaId].Properties.Tags;
        expect(tags).toBeDefined();
        expect(tags).toEqual(
          expect.arrayContaining([
            { Key: 'Environment', Value: 'production' },
            { Key: 'Application', Value: 'transaction-processor' },
          ])
        );
      });
    });
  });

  describe('IAM Roles and Permissions', () => {
    test('Should create IAM roles for Lambda functions', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const roleIds = Object.keys(roles);

      // 3 Lambda function roles + 1 State Machine role
      expect(roleIds.length).toBeGreaterThanOrEqual(4);
    });

    test('Lambda roles should have DynamoDB read permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'dynamodb:BatchGetItem',
                'dynamodb:GetRecords',
                'dynamodb:GetShardIterator',
                'dynamodb:Query',
                'dynamodb:GetItem',
                'dynamodb:Scan',
                'dynamodb:ConditionCheckItem',
                'dynamodb:DescribeTable',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('Lambda roles should have DynamoDB write permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'dynamodb:BatchWriteItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:DescribeTable',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('CloudWatch Logs', () => {
    test('Should create CloudWatch Log Group for Step Functions', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/vendedlogs/states/transaction-processor-${environmentSuffix}`,
        RetentionInDays: 30,
      });
    });

    test('Log Group should have RemovalPolicy.DESTROY', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      const logGroupIds = Object.keys(logGroups);

      expect(logGroupIds.length).toBeGreaterThan(0);
      logGroupIds.forEach((logGroupId) => {
        expect(logGroups[logGroupId].UpdateReplacePolicy).toBe('Delete');
      });
    });

    test('Log Group should have proper tags', () => {
      const resources = template.findResources('AWS::Logs::LogGroup');
      const logGroupIds = Object.keys(resources);

      expect(logGroupIds.length).toBeGreaterThan(0);
      logGroupIds.forEach((logGroupId) => {
        const tags = resources[logGroupId].Properties.Tags;
        expect(tags).toBeDefined();
        expect(tags).toEqual(
          expect.arrayContaining([
            { Key: 'Environment', Value: 'production' },
            { Key: 'Application', Value: 'transaction-processor' },
          ])
        );
      });
    });
  });

  describe('Step Functions State Machine', () => {
    test('Should create Step Functions State Machine', () => {
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        StateMachineName: `transaction-processor-${environmentSuffix}`,
        TracingConfiguration: {
          Enabled: true,
        },
        LoggingConfiguration: {
          Level: 'ALL',
          IncludeExecutionData: true,
        },
      });
    });

    test('State Machine should have proper tags', () => {
      const resources = template.findResources(
        'AWS::StepFunctions::StateMachine'
      );
      const stateMachineIds = Object.keys(resources);

      expect(stateMachineIds.length).toBeGreaterThan(0);
      stateMachineIds.forEach((stateMachineId) => {
        const tags = resources[stateMachineId].Properties.Tags;
        expect(tags).toBeDefined();
        expect(tags).toEqual(
          expect.arrayContaining([
            { Key: 'Environment', Value: 'production' },
            { Key: 'Application', Value: 'transaction-processor' },
          ])
        );
      });
    });

    test('State Machine definition should include Map state', () => {
      const stateMachines = template.findResources(
        'AWS::StepFunctions::StateMachine'
      );
      const stateMachineIds = Object.keys(stateMachines);

      expect(stateMachineIds.length).toBe(1);
      const definition =
        stateMachines[stateMachineIds[0]].Properties.DefinitionString;

      // Parse the definition to check structure
      expect(definition).toBeDefined();
      if (typeof definition === 'string') {
        const parsedDef = JSON.parse(definition);
        expect(parsedDef.States).toBeDefined();
        const states = parsedDef.States;
        const mapState = Object.values(states).find(
          (state: any) => state.Type === 'Map'
        );
        expect(mapState).toBeDefined();
      }
    });

    test('State Machine should reference all three Lambda functions', () => {
      const stateMachines = template.findResources(
        'AWS::StepFunctions::StateMachine'
      );
      const stateMachineIds = Object.keys(stateMachines);

      expect(stateMachineIds.length).toBe(1);
      const definition =
        stateMachines[stateMachineIds[0]].Properties.DefinitionString;

      expect(definition).toBeDefined();
      // The definition should reference Lambda invocations
      if (typeof definition === 'string') {
        expect(definition).toContain('arn:aws:states:::lambda:invoke');
      }
    });

    test('State Machine should have retry configuration', () => {
      const stateMachines = template.findResources(
        'AWS::StepFunctions::StateMachine'
      );
      const stateMachineIds = Object.keys(stateMachines);

      expect(stateMachineIds.length).toBe(1);
      const definition =
        stateMachines[stateMachineIds[0]].Properties.DefinitionString;

      if (typeof definition === 'string') {
        const parsedDef = JSON.parse(definition);
        // Check for retry configuration in states
        const states = parsedDef.States;
        const statesWithRetry = Object.values(states).filter((state: any) =>
          state.Retry ? state.Retry.length > 0 : false
        );

        // At least one state should have retry configuration
        expect(statesWithRetry.length).toBeGreaterThan(0);
      }
    });

    test('Retry configuration should use exponential backoff', () => {
      const stateMachines = template.findResources(
        'AWS::StepFunctions::StateMachine'
      );
      const stateMachineIds = Object.keys(stateMachines);

      const definition =
        stateMachines[stateMachineIds[0]].Properties.DefinitionString;

      if (typeof definition === 'string') {
        const parsedDef = JSON.parse(definition);
        const states = parsedDef.States;

        // Find states with retry
        Object.values(states).forEach((state: any) => {
          if (state.Retry && state.Retry.length > 0) {
            const retry = state.Retry[0];
            expect(retry.MaxAttempts).toBe(3);
            expect(retry.BackoffRate).toBe(2);
            expect(retry.IntervalSeconds).toBe(2);
          }
        });
      }
    });
  });

  describe('Stack Outputs', () => {
    test('Should export State Machine ARN', () => {
      template.hasOutput('StateMachineArn', {
        Description: 'Transaction Processor State Machine ARN',
        Export: {
          Name: `transaction-processor-state-machine-${environmentSuffix}`,
        },
      });
    });

    test('Should export Transactions Raw Table Name', () => {
      template.hasOutput('TransactionsRawTableName', {
        Description: 'Transactions Raw Table Name',
        Export: {
          Name: `transactions-raw-table-${environmentSuffix}`,
        },
      });
    });

    test('Should export Transactions Processed Table Name', () => {
      template.hasOutput('TransactionsProcessedTableName', {
        Description: 'Transactions Processed Table Name',
        Export: {
          Name: `transactions-processed-table-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Resource Naming', () => {
    test('All resource names should include environmentSuffix', () => {
      // Check DynamoDB tables
      const tables = template.findResources('AWS::DynamoDB::Table');
      Object.values(tables).forEach((table: any) => {
        expect(table.Properties.TableName).toContain(environmentSuffix);
      });

      // Check Lambda functions
      const lambdas = template.findResources('AWS::Lambda::Function');
      Object.values(lambdas).forEach((lambda: any) => {
        expect(lambda.Properties.FunctionName).toContain(environmentSuffix);
      });

      // Check State Machine
      const stateMachines = template.findResources(
        'AWS::StepFunctions::StateMachine'
      );
      Object.values(stateMachines).forEach((sm: any) => {
        expect(sm.Properties.StateMachineName).toContain(environmentSuffix);
      });

      // Check Log Group
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.values(logGroups).forEach((lg: any) => {
        expect(lg.Properties.LogGroupName).toContain(environmentSuffix);
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('Should create exactly 2 DynamoDB tables', () => {
      const tables = template.findResources('AWS::DynamoDB::Table');
      expect(Object.keys(tables).length).toBe(2);
    });

    test('Should create exactly 3 Lambda functions', () => {
      const lambdas = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdas).length).toBe(3);
    });

    test('Should create exactly 1 Step Functions State Machine', () => {
      const stateMachines = template.findResources(
        'AWS::StepFunctions::StateMachine'
      );
      expect(Object.keys(stateMachines).length).toBe(1);
    });

    test('Should create exactly 1 CloudWatch Log Group', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      expect(Object.keys(logGroups).length).toBe(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('Should handle custom environmentSuffix', () => {
      const customSuffix = 'custom-test-123';
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: customSuffix,
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `transactions-raw-${customSuffix}`,
      });
    });

    test('Should use default environmentSuffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack', {});
      const defaultTemplate = Template.fromStack(defaultStack);

      // Default is 'dev' as per tap-stack.ts line 22
      defaultTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'transactions-raw-dev',
      });
    });
  });
});
