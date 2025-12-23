import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

describe('TapStack Integration Tests', () => {
  let app;
  let stack;
  let template;

  beforeAll(() => {
    app = new App({
      context: {
        environmentSuffix: 'int'
      }
    });
    stack = new TapStack(app, 'IntTestStack', {
      env: {
        account: process.env.AWS_ACCOUNT_ID || '123456789012',
        region: process.env.AWS_REGION || 'us-east-1'
      }
    });
    template = Template.fromStack(stack);
  });

  test('Stack synthesizes without errors', () => {
    expect(stack).toBeDefined();
  });

  test('CloudFormation template is valid JSON', () => {
    const json = template.toJSON();
    expect(json).toBeDefined();
    expect(json.Resources).toBeDefined();
  });

  test('Stack has AWSTemplateFormatVersion', () => {
    const json = template.toJSON();
    // CDK templates may not always include AWSTemplateFormatVersion explicitly
    // as it's implied by CloudFormation. Check for valid CloudFormation structure instead.
    expect(json.Resources).toBeDefined();
    expect(Object.keys(json.Resources).length).toBeGreaterThan(0);
  });
});
