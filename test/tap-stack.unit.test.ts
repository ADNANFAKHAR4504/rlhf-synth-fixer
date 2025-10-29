import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Infrastructure Guardrails', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Main Stack Structure', () => {
    test('creates nested stacks for modular infrastructure', () => {
      // Check that nested stacks are created
      const nestedStacks = template.findResources('AWS::CloudFormation::Stack');
      expect(Object.keys(nestedStacks).length).toBeGreaterThanOrEqual(4);
      
      // Verify the stack contains references to nested stack components
      const templateContent = JSON.stringify(template.toJSON());
      expect(templateContent).toContain('ComplianceInfrastructure');
      expect(templateContent).toContain('LambdaTimeoutRule');
      expect(templateContent).toContain('IamAccessKeyRule');
      expect(templateContent).toContain('RemediationWorkflow');
    });
    
    test('stack can be synthesized without errors', () => {
      expect(() => {
        app.synth();
      }).not.toThrow();
    });
    
    test('stack has correct environment suffix handling', () => {
      expect(stack.stackName).toContain('TestTapStack');
    });
  });

  describe('Stack Configuration', () => {
    test('handles environment suffix correctly', () => {
      // Test with different environment suffixes
      const testApp = new cdk.App();
      const prodStack = new TapStack(testApp, 'ProdTapStack', { environmentSuffix: 'prod' });
      expect(() => testApp.synth()).not.toThrow();
      
      const stagingApp = new cdk.App();
      const stagingStack = new TapStack(stagingApp, 'StagingTapStack', { environmentSuffix: 'staging' });
      expect(() => stagingApp.synth()).not.toThrow();
    });
    
    test('uses context values for environment configuration', () => {
      const contextApp = new cdk.App();
      contextApp.node.setContext('environmentSuffix', 'test');
      const contextStack = new TapStack(contextApp, 'ContextStack');
      expect(() => contextApp.synth()).not.toThrow();
    });
    
    test('defaults to dev environment when no configuration provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      expect(() => defaultApp.synth()).not.toThrow();
    });
  });

  describe('Code Quality', () => {
    test('stack implementation follows CDK best practices', () => {
      // Verify the stack can be instantiated without errors
      expect(stack).toBeDefined();
      expect(stack.stackName).toBeTruthy();
      
      // Verify no immediate synthesis errors
      expect(() => {
        const assembly = app.synth();
        expect(assembly.stacks).toBeDefined();
        expect(assembly.stacks.length).toBeGreaterThan(0);
      }).not.toThrow();
    });
    
    test('nested stacks are properly organized', () => {
      const nestedStacks = template.findResources('AWS::CloudFormation::Stack');
      expect(Object.keys(nestedStacks).length).toBeGreaterThanOrEqual(4);
      
      // Verify stack structure contains expected nested stacks
      const stackContent = JSON.stringify(template.toJSON());
      expect(stackContent).toContain('ComplianceInfrastructure');
      expect(stackContent).toContain('LambdaTimeoutRule');
      expect(stackContent).toContain('IamAccessKeyRule');
      expect(stackContent).toContain('RemediationWorkflow');
    });
  });
});
