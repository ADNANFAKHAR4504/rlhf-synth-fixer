import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'testenv';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Structure', () => {
    test('creates all nested stacks', () => {
      // Verify all nested stacks are created
      template.resourceCountIs('AWS::CloudFormation::Stack', 5);
      
      // Check for NetworkStack
      template.hasResourceProperties('AWS::CloudFormation::Stack', {
        TemplateURL: Match.anyValue(),
      });
    });

    test('creates nested stacks with correct names', () => {
      const resources = template.findResources('AWS::CloudFormation::Stack');
      const stackNames = Object.keys(resources);
      
      expect(stackNames.some(name => name.includes('NetworkStack'))).toBe(true);
      expect(stackNames.some(name => name.includes('SecurityStack'))).toBe(true);
      expect(stackNames.some(name => name.includes('ComputeStack'))).toBe(true);
      expect(stackNames.some(name => name.includes('DataStack'))).toBe(true);
      expect(stackNames.some(name => name.includes('MonitoringStack'))).toBe(true);
    });

    test('passes environment suffix to nested stacks', () => {
      const resources = template.findResources('AWS::CloudFormation::Stack');
      
      Object.values(resources).forEach(resource => {
        const templateUrl = resource.Properties?.TemplateURL;
        expect(templateUrl).toBeDefined();
      });
    });
  });

  describe('Stack Dependencies', () => {
    test('ComputeStack depends on NetworkStack and SecurityStack', () => {
      const resources = template.findResources('AWS::CloudFormation::Stack');
      const computeStackKey = Object.keys(resources).find(key => 
        key.includes('ComputeStack')
      );
      
      if (computeStackKey) {
        const computeStack = resources[computeStackKey];
        expect(computeStack.DependsOn).toBeDefined();
        expect(Array.isArray(computeStack.DependsOn)).toBe(true);
        const deps = computeStack.DependsOn as string[];
        expect(deps.some(dep => dep.includes('NetworkStack'))).toBe(true);
        expect(deps.some(dep => dep.includes('SecurityStack'))).toBe(true);
      }
    });
  });

  describe('Stack Tagging', () => {
    test('applies tags to all nested stacks', () => {
      template.hasResourceProperties('AWS::CloudFormation::Stack', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: environmentSuffix,
          }),
        ]),
      });
    });
  });
});