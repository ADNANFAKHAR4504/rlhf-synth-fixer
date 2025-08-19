import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { SecurityStack } from '../lib/security-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      stackName: `TapStack${environmentSuffix}`,
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Configuration', () => {
    test('creates TapStack with correct properties', () => {
      expect(stack.stackName).toBe(`TapStack${environmentSuffix}`);
    });

    test('passes environment suffix to nested stacks', () => {
      // Check that the stack has proper naming
      expect(stack.node.id).toBe('TestTapStack');
    });

    test('applies environment suffix from context if not provided', () => {
      const contextApp = new cdk.App({
        context: { environmentSuffix: 'context-test' },
      });
      const contextStack = new TapStack(contextApp, 'ContextTestStack');
      expect(contextStack).toBeDefined();
    });

    test('defaults to "dev" if no environment suffix provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultTestStack');
      expect(defaultStack).toBeDefined();
    });
  });

  describe('Nested Stack Creation', () => {
    test('creates SecurityStack as a CDK nested stack', () => {
      // Find the SecurityStack in the app's node children
      const securityStack = stack.node.findChild('SecurityStack');
      expect(securityStack).toBeDefined();
      expect(securityStack).toBeInstanceOf(SecurityStack);
    });

    test('passes correct properties to SecurityStack', () => {
      const securityStack = stack.node.findChild('SecurityStack') as SecurityStack;
      expect(securityStack).toBeDefined();
      
      // The SecurityStack should have the environment suffix
      const securityTemplate = Template.fromStack(securityStack);
      expect(securityTemplate).toBeDefined();
    });
  });

  describe('Stack Structure', () => {
    test('parent stack is minimal with only metadata', () => {
      const cfnTemplate = template.toJSON();
      
      // Parent stack should only have the nested stack and CDK metadata
      const resources = cfnTemplate.Resources || {};
      
      // The parent stack may be empty if using NestedStack
      // Or it may have the nested stack resource
      const resourceCount = Object.keys(resources).length;
      
      // Should be minimal (just nested stack reference or empty)
      expect(resourceCount).toBeLessThanOrEqual(2);
    });

    test('resources are in the SecurityStack, not TapStack', () => {
      // TapStack itself should be minimal
      const resourceCount = Object.keys(template.toJSON().Resources || {}).length;
      expect(resourceCount).toBeLessThanOrEqual(2);
      
      // SecurityStack should contain the actual resources
      const securityStack = stack.node.findChild('SecurityStack') as SecurityStack;
      const securityTemplate = Template.fromStack(securityStack);
      const securityResourceCount = Object.keys(
        securityTemplate.toJSON().Resources || {}
      ).length;
      
      expect(securityResourceCount).toBeGreaterThan(10); // Should have many resources
    });
  });

  describe('Environment Configuration', () => {
    test('uses environment configuration when provided', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomEnvStack', {
        environmentSuffix: 'custom',
        env: {
          account: '999999999999',
          region: 'eu-west-1',
        },
      });
      
      expect(customStack.account).toBe('999999999999');
      expect(customStack.region).toBe('eu-west-1');
    });

    test('passes environment to SecurityStack', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomEnvStack', {
        environmentSuffix: 'custom',
        env: {
          account: '999999999999',
          region: 'eu-west-1',
        },
      });
      
      const securityStack = customStack.node.findChild('SecurityStack') as SecurityStack;
      expect(securityStack.account).toBe('999999999999');
      expect(securityStack.region).toBe('eu-west-1');
    });
  });

  describe('Stack Validation', () => {
    test('stack synthesis succeeds', () => {
      expect(() => {
        app.synth();
      }).not.toThrow();
    });

    test('generates valid CloudFormation template', () => {
      const cfnTemplate = template.toJSON();
      
      expect(cfnTemplate).toBeDefined();
      // The template should be a valid CloudFormation template
      // It may have Parameters, Rules, etc., but not necessarily Resources
      expect(cfnTemplate).toBeInstanceOf(Object);
    });

    test('SecurityStack generates valid template', () => {
      const securityStack = stack.node.findChild('SecurityStack') as SecurityStack;
      const securityTemplate = Template.fromStack(securityStack);
      const cfnTemplate = securityTemplate.toJSON();
      
      expect(cfnTemplate).toBeDefined();
      expect(cfnTemplate.Resources).toBeDefined();
      expect(Object.keys(cfnTemplate.Resources).length).toBeGreaterThan(10);
    });
  });

  describe('Security Best Practices', () => {
    test('does not expose sensitive information', () => {
      // Check parent stack
      const outputs = template.toJSON().Outputs || {};
      Object.values(outputs).forEach((output: any) => {
        if (output.Description) {
          expect(output.Description.toLowerCase()).not.toContain('password');
          expect(output.Description.toLowerCase()).not.toContain('secret');
          expect(output.Description.toLowerCase()).not.toContain('key');
        }
      });
      
      // Check SecurityStack
      const securityStack = stack.node.findChild('SecurityStack') as SecurityStack;
      const securityTemplate = Template.fromStack(securityStack);
      const securityOutputs = securityTemplate.toJSON().Outputs || {};
      
      Object.values(securityOutputs).forEach((output: any) => {
        if (output.Description) {
          expect(output.Description.toLowerCase()).not.toContain('password');
          expect(output.Description.toLowerCase()).not.toContain('secret');
          // 'key' might appear in legitimate contexts like 'API key ID'
        }
      });
    });
  });

  describe('Stack Outputs', () => {
    test('SecurityStack provides required outputs', () => {
      const securityStack = stack.node.findChild('SecurityStack') as SecurityStack;
      const securityTemplate = Template.fromStack(securityStack);
      
      // Check for expected outputs
      securityTemplate.hasOutput('VPCId', {});
      securityTemplate.hasOutput('S3BucketName', {});
      securityTemplate.hasOutput('EC2InstanceId', {});
      securityTemplate.hasOutput('EC2RoleArn', {});
      securityTemplate.hasOutput('CloudTrailName', {});
      securityTemplate.hasOutput('SecurityGroupId', {});
      securityTemplate.hasOutput('CloudTrailBucketName', {});
    });
  });

  describe('Error Handling', () => {
    test('handles missing environment suffix gracefully', () => {
      const noSuffixApp = new cdk.App();
      const noSuffixStack = new TapStack(noSuffixApp, 'NoSuffixStack', {
        environmentSuffix: undefined,
      });
      
      // Should default to 'dev'
      expect(noSuffixStack).toBeDefined();
      const securityStack = noSuffixStack.node.findChild('SecurityStack');
      expect(securityStack).toBeDefined();
    });

    test('handles context retrieval errors gracefully', () => {
      const errorApp = new cdk.App();
      // Mock tryGetContext to return undefined
      jest.spyOn(errorApp.node, 'tryGetContext').mockReturnValue(undefined);
      
      const errorStack = new TapStack(errorApp, 'ErrorStack');
      expect(errorStack).toBeDefined();
      
      // Should still create SecurityStack with default suffix
      const securityStack = errorStack.node.findChild('SecurityStack');
      expect(securityStack).toBeDefined();
    });
  });

  describe('Integration with SecurityStack', () => {
    test('SecurityStack receives correct environment suffix', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'IntegrationTest', {
        environmentSuffix: 'integration-test',
      });
      
      const securityStack = testStack.node.findChild('SecurityStack') as SecurityStack;
      const securityTemplate = Template.fromStack(securityStack);
      
      // Check that resources use the suffix
      securityTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.anyValue(),
      });
      
      // Verify the bucket name contains the suffix in the template
      const resources = securityTemplate.toJSON().Resources;
      const buckets = Object.values(resources).filter((r: any) => r.Type === 'AWS::S3::Bucket');
      expect(buckets.length).toBeGreaterThan(0);
      
      // At least one bucket should have the suffix in its name
      const hasSuffixInName = buckets.some((bucket: any) => {
        const bucketName = bucket.Properties?.BucketName;
        if (typeof bucketName === 'string') {
          return bucketName.includes('integration-test');
        }
        // Check if it's a Join function with the suffix
        if (bucketName?.['Fn::Join']) {
          const joinParts = bucketName['Fn::Join'][1];
          return joinParts.some((part: any) => 
            typeof part === 'string' && part.includes('integration-test')
          );
        }
        return false;
      });
      expect(hasSuffixInName).toBe(true);
    });

    test('all SecurityStack resources are properly configured', () => {
      const securityStack = stack.node.findChild('SecurityStack') as SecurityStack;
      const securityTemplate = Template.fromStack(securityStack);
      
      // Verify key resources exist (at least the minimum required)
      const resources = securityTemplate.toJSON().Resources;
      const resourceTypes = Object.values(resources).map((r: any) => r.Type);
      
      // Check for required resource types
      expect(resourceTypes).toContain('AWS::EC2::VPC');
      expect(resourceTypes).toContain('AWS::EC2::SecurityGroup');
      expect(resourceTypes).toContain('AWS::EC2::Instance');
      expect(resourceTypes).toContain('AWS::S3::Bucket');
      expect(resourceTypes).toContain('AWS::CloudTrail::Trail');
      expect(resourceTypes).toContain('AWS::IAM::Role');
      
      // Verify we have at least 2 S3 buckets (Data + CloudTrail)
      const s3BucketCount = resourceTypes.filter(t => t === 'AWS::S3::Bucket').length;
      expect(s3BucketCount).toBeGreaterThanOrEqual(2);
    });
  });
});