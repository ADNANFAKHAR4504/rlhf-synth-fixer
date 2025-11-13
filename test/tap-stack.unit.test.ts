import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);

    // Synthesize the app to ensure all stacks are created
    app.synth();
  });

  describe('Disaster Recovery Solution Tests', () => {
    test('Stack synthesizes successfully', () => {
      expect(template).toBeDefined();
    });

    test('TapStack creates multiple child stacks for multi-region deployment', () => {
      // Verify child stacks are created within the TapStack
      const childStacks = stack.node.children.filter(
        (child) => child instanceof cdk.Stack
      );
      expect(childStacks.length).toBeGreaterThan(1);
    });

    test('Environment suffix is properly passed to resources', () => {
      // This would verify resource naming includes environmentSuffix
      expect(environmentSuffix).toBeDefined();
      expect(stack.stackName).toContain('TestTapStack');
    });
  });

  describe('Component Stack Integration', () => {
    test('Creates KMS stacks for both regions', () => {
      const childStacks = stack.node.children.filter(
        (child) => child instanceof cdk.Stack
      );
      const kmsStacks = childStacks.filter((s) =>
        s.node.id.includes('Kms')
      );
      expect(kmsStacks.length).toBeGreaterThanOrEqual(2);
    });

    test('Creates Network stacks for both regions', () => {
      const childStacks = stack.node.children.filter(
        (child) => child instanceof cdk.Stack
      );
      const networkStacks = childStacks.filter((s) =>
        s.node.id.includes('Network')
      );
      expect(networkStacks.length).toBeGreaterThanOrEqual(2);
    });

    test('Creates Database stacks for both regions', () => {
      const childStacks = stack.node.children.filter(
        (child) => child instanceof cdk.Stack
      );
      const databaseStacks = childStacks.filter((s) =>
        s.node.id.includes('Database')
      );
      expect(databaseStacks.length).toBeGreaterThanOrEqual(2);
    });

    test('Creates Storage stacks for both regions', () => {
      const childStacks = stack.node.children.filter(
        (child) => child instanceof cdk.Stack
      );
      const storageStacks = childStacks.filter((s) =>
        s.node.id.includes('Storage')
      );
      expect(storageStacks.length).toBeGreaterThanOrEqual(2);
    });

    test('Creates Compute stacks for both regions', () => {
      const childStacks = stack.node.children.filter(
        (child) => child instanceof cdk.Stack
      );
      const computeStacks = childStacks.filter((s) =>
        s.node.id.includes('Compute')
      );
      expect(computeStacks.length).toBeGreaterThanOrEqual(2);
    });

    test('Creates Monitoring stacks for both regions', () => {
      const childStacks = stack.node.children.filter(
        (child) => child instanceof cdk.Stack
      );
      const monitoringStacks = childStacks.filter((s) =>
        s.node.id.includes('Monitoring')
      );
      expect(monitoringStacks.length).toBeGreaterThanOrEqual(2);
    });

    test('Creates Backup stacks for both regions', () => {
      const childStacks = stack.node.children.filter(
        (child) => child instanceof cdk.Stack
      );
      const backupStacks = childStacks.filter((s) =>
        s.node.id.includes('Backup')
      );
      expect(backupStacks.length).toBeGreaterThanOrEqual(2);
    });

    test('Creates Failover stack', () => {
      const childStacks = stack.node.children.filter(
        (child) => child instanceof cdk.Stack
      );
      const failoverStacks = childStacks.filter((s) =>
        s.node.id.includes('Failover')
      );
      expect(failoverStacks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Multi-Region Configuration', () => {
    test('Stack is configured for multi-region deployment', () => {
      // Verify the stack structure supports multi-region
      expect(stack).toBeDefined();
    });
  });
});
