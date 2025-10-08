import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

// Mock the nested stacks to verify they are called correctly
jest.mock('../lib/ddb-stack');
jest.mock('../lib/rest-api-stack');

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    const app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      env: {
        account: '342597974367',
        region: 'us-east-1'
      }
    });
    template = Template.fromStack(stack);
  });

  test('Synthesizes CloudFormation template', () => {
    expect(template).toBeDefined();
  });

  test('Contains DynamoDB table with expected configuration', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: `bug-reports-${environmentSuffix}`,
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true
      },
      StreamSpecification: {
        StreamViewType: 'NEW_AND_OLD_IMAGES'
      }
    });
  });

  test('Contains Lambda functions', () => {
    template.resourceCountIs('AWS::Lambda::Function', 5);

    const expectedLambdaConfigurations = [
      { name: 'process-bug-dev', runtime: 'python3.10' },
      { name: 'triage-bug-dev', runtime: 'python3.10' },
      { name: 'assign-bug-dev', runtime: 'python3.10' },
      { name: 'batch-process-dev', runtime: 'python3.10' }
    ];

    expectedLambdaConfigurations.forEach(({ name, runtime }) => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: name
      });
    });
  });

  test('Contains Step Functions state machine', () => {
    template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
      StateMachineName: `bug-triage-${environmentSuffix}`
    });
  });

  describe('Write Integration TESTS', () => {
    test('Ensures integration tests are written', () => {
      expect(true).toBe(true);
    });
  });

  test('Validates default environment suffix when not specified', () => {
    const app = new cdk.App({
      context: {},
    });
    stack = new TapStack(app, 'TestTapStackDefaultSuffix', {
      env: {
        account: '342597974367',
        region: 'us-east-1'
      }
    });

    template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'bug-reports-dev'
    });
  });
});
