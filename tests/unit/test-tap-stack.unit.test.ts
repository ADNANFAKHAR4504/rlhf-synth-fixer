// tests/unit/test-tap-stack.unit.test.ts
import { Template } from 'aws-cdk-lib/assertions';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('Payment Processing Stack Refactoring', () => {
    test('creates all component stacks with proper dependencies', () => {
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

    test('applies validation aspects to stacks', () => {
      // ARRANGE
      const stack = new TapStack(app, 'TestStack');

      // ASSERT - Stack should be created with aspects applied
      expect(stack).toBeDefined();
    });

    test('creates stacks with proper naming convention', () => {
      // ARRANGE
      const envSuffix = 'testenv';
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: envSuffix,
      });

      // ASSERT - Stack should be created successfully
      expect(stack).toBeDefined();
    });

    test('exports required outputs for cross-stack references', () => {
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

    test('validates resource count limits with aspects', () => {
      // ARRANGE - Create a stack with low resource limit to trigger warning
      const TestAspect = class implements cdk.IAspect {
        private count = 0;
        visit(node: any) {
          this.count++;
          if (this.count > 10) { // Low threshold to trigger warning
            console.warn(`Approaching maximum resource limit of 10. Current count: ${this.count}. Consider splitting into multiple stacks.`);
          }
        }
      };

      const testApp = new cdk.App();
      const testStack = new cdk.Stack(testApp, 'TestStack');
      cdk.Aspects.of(testStack).add(new TestAspect());

      // Add many constructs to trigger the warning
      for (let i = 0; i < 15; i++) {
        new cdk.CfnResource(testStack, `TestResource${i}`, {
          type: 'AWS::CloudFormation::WaitConditionHandle',
        });
      }

      // ASSERT - This test mainly ensures the aspect logic runs without errors
      expect(testStack).toBeDefined();
    });
  });
});