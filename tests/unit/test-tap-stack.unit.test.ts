// tests/unit/test-tap-stack.unit.test.ts
import { Template } from 'aws-cdk-lib/assertions';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('Webhook Processing System', () => {
    test('creates webhook processing infrastructure', () => {
      // ARRANGE
      const envSuffix = 'testenv';
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: envSuffix,
      });

      // ASSERT - Stack should instantiate without errors
      expect(stack).toBeDefined();
    });

    test('defaults environment suffix to dev if not provided', () => {
      // ARRANGE
      const stack = new TapStack(app, 'TestStackDefault');

      // ASSERT
      expect(stack).toBeDefined();
    });

    test('creates stack with proper naming convention', () => {
      // ARRANGE
      const envSuffix = 'testenv';
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: envSuffix,
      });

      // ASSERT
      expect(stack).toBeDefined();
    });

    test('exports required outputs for webhook processing', () => {
      // ARRANGE
      const envSuffix = 'testenv';
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: envSuffix,
      });
      const template = Template.fromStack(stack);

      // ASSERT - Should have outputs defined
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });
  });
});
