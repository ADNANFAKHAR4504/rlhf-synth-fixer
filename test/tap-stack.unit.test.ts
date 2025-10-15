import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('Stack Structure', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('TapStack instantiates successfully via props', () => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStackWithProps', {
      environmentSuffix: 'prod',
    });
    template = Template.fromStack(stack);

    // Verify that TapStack instantiates without errors via props
    expect(stack).toBeDefined();
    expect(template).toBeDefined();
  });

  test('TapStack uses default values when no props provided', () => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStackDefault');
    template = Template.fromStack(stack);

    // Verify that TapStack instantiates without errors when no props are provided
    expect(stack).toBeDefined();
    expect(template).toBeDefined();
  });
});

// add more test suites and cases as needed
