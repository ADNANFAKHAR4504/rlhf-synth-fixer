import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { StepFunctionsOrchestrationStack } from '../lib/stepfunctions-orchestration-stack';

describe('StepFunctionsOrchestrationStack', () => {
  let app: cdk.App;
  let stack: StepFunctionsOrchestrationStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();

    // Create a mock validator function
    const mockStack = new cdk.Stack(app, 'MockStack');
    const mockValidatorFunction = new lambda.Function(mockStack, 'MockValidator', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline('exports.handler = async () => {}'),
    });

    stack = new StepFunctionsOrchestrationStack(app, 'TestStepFunctionsStack', {
      environmentSuffix,
      configValidatorFunction: mockValidatorFunction,
      backupBucket: 'test-backup-bucket',
      configTable: 'test-config-table',
    });

    template = Template.fromStack(stack);
  });

  describe('Lambda Functions', () => {
    test('Creates PreDeploymentValidation Lambda function with correct properties', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `pre-deployment-validation-${environmentSuffix}`,
        Runtime: 'nodejs20.x',
        TracingConfig: {
          Mode: 'Active'
        },
        Timeout: 30,
        Environment: {
          Variables: {
            CONFIG_TABLE: 'test-config-table'
          }
        }
      });
    });

    test('Creates PostDeploymentMonitoring Lambda function with correct properties', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `post-deployment-monitoring-${environmentSuffix}`,
        Runtime: 'nodejs20.x',
        TracingConfig: {
          Mode: 'Active'
        },
        Timeout: 30,
        Environment: {
          Variables: {
            ENVIRONMENT: environmentSuffix
          }
        }
      });
    });

    test('Lambda functions have X-Ray permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: [
                'xray:PutTraceSegments',
                'xray:PutTelemetryRecords'
              ],
              Resource: '*'
            })
          ])
        }
      });
    });

    test('Lambda functions have CloudWatch permissions for monitoring', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: 'cloudwatch:PutMetricData',
              Resource: '*'
            })
          ])
        }
      });
    });
  });

  describe('Step Functions State Machine', () => {
    test('Creates Express State Machine with correct properties', () => {
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        StateMachineName: `config-deployment-${environmentSuffix}`,
        StateMachineType: 'EXPRESS',
        TracingConfiguration: {
          Enabled: true
        }
      });
    });

    test('State Machine has CloudWatch logging enabled', () => {
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        LoggingConfiguration: {
          Level: 'ALL',
          IncludeExecutionData: true
        }
      });
    });

    test('State Machine IAM role has correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Principal: {
              Service: 'states.amazonaws.com'
            },
            Action: 'sts:AssumeRole'
          }]
        }
      });
    });

    test('State Machine can invoke Lambda functions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: 'lambda:InvokeFunction'
            })
          ])
        }
      });
    });
  });

  describe('CloudWatch Resources', () => {
    test('Creates CloudWatch Log Group for State Machine', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/vendedlogs/states/config-deployment-${environmentSuffix}`,
        RetentionInDays: 7
      });
    });

    test('State Machine has logging configured', () => {
      // Verify State Machine has logging configuration
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        LoggingConfiguration: {
          Level: 'ALL',
          IncludeExecutionData: true
        }
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Outputs State Machine ARN', () => {
      template.hasOutput('StateMachineArn', {
        Description: 'ARN of the configuration deployment state machine'
      });
    });

    test('Stack has required outputs', () => {
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs)).toContain('StateMachineArn');
      expect(outputs['StateMachineArn'].Description).toBe('ARN of the configuration deployment state machine');
    });
  });

  describe('X-Ray Integration', () => {
    test('Lambda functions have X-Ray tracing enabled', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      Object.values(functions).forEach(func => {
        if (func.Properties.FunctionName?.includes(environmentSuffix)) {
          expect(func.Properties.TracingConfig).toEqual({ Mode: 'Active' });
        }
      });
    });

    test('State Machine has X-Ray tracing enabled', () => {
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        TracingConfiguration: {
          Enabled: true
        }
      });
    });
  });

  describe('Error Handling', () => {
    test('Uses default environment suffix when not provided', () => {
      const newApp = new cdk.App();
      const mockStack2 = new cdk.Stack(newApp, 'MockStack2');
      const mockValidator = new lambda.Function(mockStack2, 'MockValidator2', {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline('exports.handler = async () => {}'),
      });

      const stackWithoutSuffix = new StepFunctionsOrchestrationStack(
        newApp,
        'TestDefaultStack',
        {
          configValidatorFunction: mockValidator,
          backupBucket: 'test-bucket',
          configTable: 'test-table'
        }
      );

      const templateWithoutSuffix = Template.fromStack(stackWithoutSuffix);
      templateWithoutSuffix.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        StateMachineName: 'config-deployment-dev'
      });
    });
  });
});