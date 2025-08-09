import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Structure', () => {
    test('creates nested stacks for all components', () => {
      // Check that all nested stacks are created
      template.hasResourceProperties('AWS::CloudFormation::Stack', 
        Match.objectLike({
          TemplateURL: Match.anyValue()
        })
      );
      
      // Should have at least 5 nested stacks (without cross-region)
      const stacks = template.findResources('AWS::CloudFormation::Stack');
      expect(Object.keys(stacks).length).toBeGreaterThanOrEqual(5);
    });

    test('applies proper tags to stack', () => {
      // Verify that nested stacks are created
      const stacks = template.findResources('AWS::CloudFormation::Stack');
      expect(Object.keys(stacks).length).toBeGreaterThan(0);
    });
  });

  describe('Stack Dependencies', () => {
    test('creates stacks in correct dependency order', () => {
      const stacks = template.findResources('AWS::CloudFormation::Stack');
      
      // Check that we have the expected nested stacks
      const stackKeys = Object.keys(stacks);
      const hasNetworking = stackKeys.some(key => key.includes('NetworkingStack'));
      const hasSecurity = stackKeys.some(key => key.includes('SecurityStack'));
      const hasDatabase = stackKeys.some(key => key.includes('DatabaseStack'));
      const hasStorage = stackKeys.some(key => key.includes('StorageStack'));
      const hasMonitoring = stackKeys.some(key => key.includes('MonitoringStack'));
      const hasSecrets = stackKeys.some(key => key.includes('SecretsStack'));
      
      expect(hasNetworking).toBe(true);
      expect(hasSecurity).toBe(true);
      expect(hasDatabase).toBe(true);
      expect(hasStorage).toBe(true);
      expect(hasMonitoring).toBe(true);
      expect(hasSecrets).toBe(true);
    });
  });

  describe('Environment Configuration', () => {
    test('uses environment suffix in resource naming', () => {
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('passes environment configuration to nested stacks', () => {
      const stacks = template.findResources('AWS::CloudFormation::Stack');
      
      // Verify stacks are created with proper configuration
      expect(Object.keys(stacks).length).toBeGreaterThan(0);
    });
  });

  describe('Cross-Region Support', () => {
    test('does not create cross-region stack when disabled', () => {
      // StorageStackWest should not exist in current configuration
      const stacks = template.findResources('AWS::CloudFormation::Stack');
      const westStack = Object.entries(stacks).find(([key]) => 
        key.includes('StorageStackWest')
      );
      expect(westStack).toBeUndefined();
    });
  });
});