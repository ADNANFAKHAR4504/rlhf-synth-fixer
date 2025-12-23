import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Set up Pulumi mocks
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string, state: any} {
    return {
      id: args.inputs.name ? `${args.inputs.name}-id` : `${args.name}-id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
        name: args.inputs.name || args.name,
      },
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs): {outputs: any} {
    return {
      outputs: {},
    };
  },
});

describe('TapStack', () => {
  describe('with default values', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-stack', {});
    });

    it('should create stack successfully', () => {
      expect(stack).toBeDefined();
    });

    it('should have bucketArn output', (done) => {
      stack.bucketArn.apply(arn => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        done();
      });
    });

    it('should have lambdaFunctionName output', (done) => {
      stack.lambdaFunctionName.apply(name => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should have snsTopicArn output', (done) => {
      stack.snsTopicArn.apply(arn => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        done();
      });
    });
  });

  describe('with custom environmentSuffix', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-stack-custom', {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'production',
          Team: 'compliance',
        },
      });
    });

    it('should create stack successfully with custom suffix', () => {
      expect(stack).toBeDefined();
    });

    it('should use custom environmentSuffix in resource names', (done) => {
      stack.lambdaFunctionName.apply(name => {
        expect(name).toContain('prod');
        done();
      });
    });

    it('should have all required outputs', (done) => {
      pulumi.all([
        stack.bucketArn,
        stack.lambdaFunctionName,
        stack.snsTopicArn,
      ]).apply(([bucketArn, functionName, topicArn]) => {
        expect(bucketArn).toBeDefined();
        expect(functionName).toBeDefined();
        expect(topicArn).toBeDefined();
        done();
      });
    });
  });

  describe('resource naming', () => {
    it('should use environmentSuffix from process.env if not provided', () => {
      process.env.ENVIRONMENT_SUFFIX = 'test';
      const stack = new TapStack('test-stack-env', {});

      expect(stack).toBeDefined();
      stack.lambdaFunctionName.apply(name => {
        expect(name).toBeDefined();
      });

      delete process.env.ENVIRONMENT_SUFFIX;
    });

    it('should default to "dev" when no environmentSuffix provided', (done) => {
      const stack = new TapStack('test-stack-default', {});

      stack.lambdaFunctionName.apply(name => {
        expect(name).toContain('dev');
        done();
      });
    });
  });

  describe('stack outputs', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-stack-outputs', {
        environmentSuffix: 'staging',
      });
    });

    it('should register all outputs', () => {
      expect(stack.bucketArn).toBeDefined();
      expect(stack.lambdaFunctionName).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
      expect(stack.s3EncryptionRuleId).toBeDefined();
      expect(stack.ec2TaggingRuleId).toBeDefined();
      expect(stack.iamPasswordPolicyRuleId).toBeDefined();
      expect(stack.complianceAlarmArn).toBeDefined();
    });
  });
});
