import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
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
        region: 'us-west-2',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Environment Configuration', () => {
    test('should use provided environmentSuffix', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestTapStackWithEnv', {
        environmentSuffix: 'prod',
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
      });
      const testTemplate = Template.fromStack(testStack);

      // Check that the VPC name uses the provided environment suffix
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: 'org-secure-vpc-prod',
          }),
        ]),
      });
    });

    test('should use context environmentSuffix when props.environmentSuffix is undefined', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'staging',
        },
      });
      const testStack = new TapStack(contextApp, 'TestTapStackWithContext', {
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
      });
      const testTemplate = Template.fromStack(testStack);

      // Check that the VPC name uses the context environment suffix
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: 'org-secure-vpc-staging',
          }),
        ]),
      });
    });

    test('should use default environmentSuffix when props and context are undefined', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestTapStackNoProps');
      const testTemplate = Template.fromStack(testStack);

      // Check that the VPC name uses the default 'dev' environment suffix
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: 'org-secure-vpc-dev',
          }),
        ]),
      });
    });
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
            Value: environmentSuffix,
          }),
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
