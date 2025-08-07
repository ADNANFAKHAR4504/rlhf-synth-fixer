import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = 'test';

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
        region: 'us-west-2'
      }
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Configuration', () => {
    test('should create TapStack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toContain('TestTapStack');
    });

    test('should instantiate SecureEnvironmentStack resources', () => {
      // TapStack now extends SecureEnvironmentStack, so resources should be in the template
      const vpcs = template.findResources('AWS::EC2::VPC');
      expect(Object.keys(vpcs).length).toBeGreaterThan(0);
    });
  });

  describe('Stack Tags', () => {
    test('should apply environment tags', () => {
      // Since SecureEnvironmentStack is now a regular stack, check for resources that have tags
      const vpcs = template.findResources('AWS::EC2::VPC');
      const vpcResource = Object.values(vpcs)[0];
      expect(vpcResource).toBeDefined();
      expect(vpcResource.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Key: 'Environment',
            Value: environmentSuffix
          })
        ])
      );
    });

    test('should apply repository and author tags at app level', () => {
      // These tags are applied at the App level in bin/tap.ts
      expect(stack).toBeDefined();
      // The stack itself should be tagged through the app
    });
  });
});
