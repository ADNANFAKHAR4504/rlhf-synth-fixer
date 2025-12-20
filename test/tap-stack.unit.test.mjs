import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

describe('TapStack Unit Tests', () => {
  let app;
  let stack;
  let template;

  beforeAll(() => {
    app = new App({
      context: {
        environmentSuffix: 'test'
      }
    });
    stack = new TapStack(app, 'TestStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    template = Template.fromStack(stack);
  });

  test('Stack is created successfully', () => {
    expect(stack).toBeDefined();
    expect(stack instanceof Stack).toBe(true);
  });

  test('Template is valid', () => {
    expect(template).toBeDefined();
  });

  // Add more specific tests based on the resources in your stack
  test('Stack has expected resources', () => {
    const resources = template.toJSON().Resources || {};
    expect(Object.keys(resources).length).toBeGreaterThan(0);
  });
});
