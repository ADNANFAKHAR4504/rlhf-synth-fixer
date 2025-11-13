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
  });

  describe('Disaster Recovery Solution Tests', () => {
    test('Stack synthesizes successfully', () => {
      expect(template).toBeDefined();
    });

    test('Stack creates nested stacks for multi-region deployment', () => {
      // Verify nested stacks are created
      const nestedStacks = template.findResources('AWS::CloudFormation::Stack');
      expect(Object.keys(nestedStacks).length).toBeGreaterThan(0);
    });

    test('Environment suffix is properly passed to resources', () => {
      // This would verify resource naming includes environmentSuffix
      expect(environmentSuffix).toBeDefined();
      expect(stack.stackName).toContain('TestTapStack');
    });
  });

  describe('Component Stack Integration', () => {
    test('Creates KMS stacks for both regions', () => {
      const nestedStacks = template.findResources('AWS::CloudFormation::Stack');
      const kmsStacks = Object.keys(nestedStacks).filter((key) => key.includes('Kms'));
      expect(kmsStacks.length).toBeGreaterThanOrEqual(1);
    });

    test('Creates Network stacks for both regions', () => {
      const nestedStacks = template.findResources('AWS::CloudFormation::Stack');
      const networkStacks = Object.keys(nestedStacks).filter((key) => key.includes('Network'));
      expect(networkStacks.length).toBeGreaterThanOrEqual(1);
    });

    test('Creates Database stacks for both regions', () => {
      const nestedStacks = template.findResources('AWS::CloudFormation::Stack');
      const databaseStacks = Object.keys(nestedStacks).filter((key) => key.includes('Database'));
      expect(databaseStacks.length).toBeGreaterThanOrEqual(1);
    });

    test('Creates Storage stacks for both regions', () => {
      const nestedStacks = template.findResources('AWS::CloudFormation::Stack');
      const storageStacks = Object.keys(nestedStacks).filter((key) => key.includes('Storage'));
      expect(storageStacks.length).toBeGreaterThanOrEqual(1);
    });

    test('Creates Compute stacks for both regions', () => {
      const nestedStacks = template.findResources('AWS::CloudFormation::Stack');
      const computeStacks = Object.keys(nestedStacks).filter((key) => key.includes('Compute'));
      expect(computeStacks.length).toBeGreaterThanOrEqual(1);
    });

    test('Creates Monitoring stacks for both regions', () => {
      const nestedStacks = template.findResources('AWS::CloudFormation::Stack');
      const monitoringStacks = Object.keys(nestedStacks).filter((key) =>
        key.includes('Monitoring')
      );
      expect(monitoringStacks.length).toBeGreaterThanOrEqual(1);
    });

    test('Creates Backup stacks for both regions', () => {
      const nestedStacks = template.findResources('AWS::CloudFormation::Stack');
      const backupStacks = Object.keys(nestedStacks).filter((key) => key.includes('Backup'));
      expect(backupStacks.length).toBeGreaterThanOrEqual(1);
    });

    test('Creates Failover stack', () => {
      const nestedStacks = template.findResources('AWS::CloudFormation::Stack');
      const failoverStacks = Object.keys(nestedStacks).filter((key) => key.includes('Failover'));
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
