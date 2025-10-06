import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('creates TapStack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(cdk.Stack);
    });

    test('has correct stack name', () => {
      expect(stack.stackName).toBe('TestTapStack');
    });
  });

  describe('Nested Stack', () => {
    test('creates ServerlessStack nested stack', () => {
      template.resourceCountIs('AWS::CloudFormation::Stack', 1);
    });

    test('nested stack has correct type', () => {
      template.hasResourceProperties('AWS::CloudFormation::Stack', {
        Tags: Match.arrayWith([
          {
            Key: 'project',
            Value: 'serverless-app',
          },
        ]),
      });
    });

    test('nested stack deletion policy is Delete', () => {
      template.hasResource('AWS::CloudFormation::Stack', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });
  });

  describe('Environment Suffix', () => {
    test('uses provided environment suffix', () => {
      const customStack = new TapStack(app, 'CustomStack', {
        environmentSuffix: 'prod',
      });
      expect(customStack).toBeDefined();
    });

    test('uses default environment suffix when not provided', () => {
      const defaultStack = new TapStack(app, 'DefaultStack');
      expect(defaultStack).toBeDefined();
    });

    test('uses environment suffix from context', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'staging',
        },
      });
      const contextStack = new TapStack(contextApp, 'ContextStack');
      expect(contextStack).toBeDefined();
    });
  });

  describe('Stack Resources', () => {
    test('has nested stack resource', () => {
      const resources = template.toJSON().Resources;
      const nestedStackExists = Object.values(resources).some(
        (resource: any) => resource.Type === 'AWS::CloudFormation::Stack'
      );
      expect(nestedStackExists).toBe(true);
    });
  });

  describe('Bootstrap Version', () => {
    test('has bootstrap version parameter', () => {
      template.hasParameter('BootstrapVersion', {
        Type: 'AWS::SSM::Parameter::Value<String>',
        Default: '/cdk-bootstrap/hnb659fds/version',
      });
    });
  });
});
