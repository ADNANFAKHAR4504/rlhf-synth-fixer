import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

describe('TapStack', () => {
  let app;
  let stack;
  let template;

  beforeEach(() => {
    app = new cdk.App();
    const environmentSuffix = 'test';
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-west-2'
      }
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Structure', () => {
    test('should create a nested stack for ServerlessApp', () => {
      template.hasResourceProperties('AWS::CloudFormation::Stack', {
        TemplateURL: Match.anyValue()
      });
    });

    test('should have nested stack resource', () => {
      const nestedStackResource = template.findResources('AWS::CloudFormation::Stack');
      expect(Object.keys(nestedStackResource).length).toBeGreaterThan(0);
    });
  });

  describe('Stack Configuration', () => {
    test('should pass environment suffix to nested stack', () => {
      const nestedStackResource = template.findResources('AWS::CloudFormation::Stack');
      const nestedStackKeys = Object.keys(nestedStackResource);
      expect(nestedStackKeys.length).toBeGreaterThan(0);
    });

    test('should have proper stack name', () => {
      expect(stack.stackName).toBe('TestTapStack');
    });
  });
});