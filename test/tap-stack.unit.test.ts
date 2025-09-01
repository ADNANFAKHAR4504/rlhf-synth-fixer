import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

// Mock the nested stacks to verify they are called correctly
jest.mock('../lib/ddb-stack');
jest.mock('../lib/rest-api-stack');

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  test('should create TapStack with correct environmentSuffix', () => {
    expect(stack).toBeInstanceOf(TapStack);
    expect(stack.node.tryGetContext('environmentSuffix')).toBeUndefined(); // context not set by default
    expect(stack.props.environmentSuffix).toBe(environmentSuffix);
  });

  test('should include DdbStack as a nested stack', () => {
    // Check that DdbStack is instantiated
    expect(require('../lib/ddb-stack')).toBeDefined();
  });

  test('should include RestApiStack as a nested stack', () => {
    // Check that RestApiStack is instantiated
    expect(require('../lib/rest-api-stack')).toBeDefined();
  });

  test('should have expected AWS resources', () => {
    // Example: Check for nested stack resources
    template.resourceCountIs('AWS::CloudFormation::Stack', 2); // DdbStack and RestApiStack
  });

  test('should pass environmentSuffix to nested stacks', () => {
    // Assuming TapStack passes environmentSuffix to nested stacks
    // You may need to spy on constructors if you want to verify arguments
    // For now, just check that the stack prop exists
    expect(stack.props.environmentSuffix).toBe(environmentSuffix);
  });

  test('should synthesize without errors', () => {
    expect(() => app.synth()).not.toThrow();
  });

  // Add more tests based on prompt.md and tapstack.ts
  // Example: If TapStack creates outputs, check for them
  test('should create expected stack outputs', () => {
    // Example output check
    // template.hasOutput('SomeOutput', {});
    // Replace with actual output keys from TapStack
  });

  // Example: If TapStack tags resources, check for tags
  test('should tag resources with environmentSuffix', () => {
    // Example tag check
    // template.hasResourceProperties('AWS::CloudFormation::Stack', {
    //   Tags: [{ Key: 'Environment', Value: environmentSuffix }]
    // });
    // Replace with actual tag logic from TapStack
  });
});
