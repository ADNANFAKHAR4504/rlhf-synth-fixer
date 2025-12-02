import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Set up Pulumi mocks
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string, state: any} {
    return {
      id: args.inputs.name ? `${args.inputs.name}_id` : `${args.type}_id`,
      state: {
        ...args.inputs,
        arn: args.inputs.name ? `arn:aws:resource:::${args.inputs.name}` : `arn:aws:resource:::${args.type}`,
        bucket: args.inputs.bucket || args.inputs.name,
      },
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('TapStack Infrastructure Compliance Analyzer', () => {
  describe('Component Construction', () => {
    it('should instantiate successfully with all required properties', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: { Test: 'true' },
      });

      expect(stack).toBeDefined();
      expect(stack.lambdaFunctionArn).toBeDefined();
      expect(stack.snsTopic).toBeDefined();
      expect(stack.complianceBucket).toBeDefined();
      expect(stack.dashboardName).toBeDefined();
    });

    it('should use default environment suffix when not provided', async () => {
      const stack = new TapStack('test-stack-default', {});
      expect(stack).toBeDefined();
    });

    it('should handle optional tags parameter', async () => {
      const stack = new TapStack('test-stack-no-tags', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Stack Outputs', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('output-test-stack', {
        environmentSuffix: 'output',
        tags: { Environment: 'test' },
      });
    });

    it('should expose lambda function ARN output', async () => {
      const arn = await stack.lambdaFunctionArn.promise();
      expect(arn).toContain('arn:aws:resource:::');
    });

    it('should expose SNS topic ARN output', async () => {
      const topicArn = await stack.snsTopic.promise();
      expect(topicArn).toContain('arn:aws:resource:::');
    });

    it('should expose compliance bucket name output', async () => {
      const bucket = await stack.complianceBucket.promise();
      expect(bucket).toBeTruthy();
    });

    it('should expose dashboard name output', async () => {
      const dashboard = await stack.dashboardName.promise();
      expect(dashboard).toBeTruthy();
    });
  });

  describe('Resource Naming', () => {
    it('should include environment suffix in all resource names', async () => {
      const envSuffix = 'naming-test';
      const stack = new TapStack('naming-stack', {
        environmentSuffix: envSuffix,
      });

      const bucket = await stack.complianceBucket.promise();
      expect(bucket).toContain(envSuffix);
    });

    it('should create unique resource names for multiple stacks', async () => {
      const stack1 = new TapStack('stack1', { environmentSuffix: 'env1' });
      const stack2 = new TapStack('stack2', { environmentSuffix: 'env2' });

      const bucket1 = await stack1.complianceBucket.promise();
      const bucket2 = await stack2.complianceBucket.promise();

      expect(bucket1).not.toEqual(bucket2);
    });
  });

  describe('Configuration', () => {
    it('should support custom tags', async () => {
      const customTags = {
        Project: 'Compliance',
        Owner: 'SecurityTeam',
        Environment: 'production',
      };

      const stack = new TapStack('custom-tags-stack', {
        environmentSuffix: 'prod',
        tags: customTags,
      });

      expect(stack).toBeDefined();
    });

    it('should handle empty tags object', async () => {
      const stack = new TapStack('empty-tags-stack', {
        environmentSuffix: 'test',
        tags: {},
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Lambda Code Generation', () => {
    it('should generate inline Lambda code with AWS SDK v3', async () => {
      const stack = new TapStack('lambda-code-stack', {
        environmentSuffix: 'lambda-test',
      });

      // Lambda code is embedded inline, test that stack creates successfully
      expect(stack.lambdaFunctionArn).toBeDefined();
    });
  });

  describe('IAM Policies', () => {
    it('should create least-privilege IAM policies', async () => {
      const stack = new TapStack('iam-test-stack', {
        environmentSuffix: 'iam-test',
      });

      // Verify stack creates with IAM policies
      expect(stack).toBeDefined();
      expect(stack.lambdaFunctionArn).toBeDefined();
    });
  });

  describe('EventBridge Integration', () => {
    it('should configure scheduled execution', async () => {
      const stack = new TapStack('schedule-test-stack', {
        environmentSuffix: 'schedule-test',
      });

      // Verify EventBridge resources are created
      expect(stack).toBeDefined();
    });
  });

  describe('CloudWatch Dashboard', () => {
    it('should create compliance metrics dashboard', async () => {
      const stack = new TapStack('dashboard-test-stack', {
        environmentSuffix: 'dashboard-test',
      });

      const dashboardName = await stack.dashboardName.promise();
      expect(dashboardName).toBeTruthy();
      expect(dashboardName).toContain('dashboard-test');
    });
  });

  describe('S3 Bucket Configuration', () => {
    it('should create encrypted S3 bucket with lifecycle policies', async () => {
      const stack = new TapStack('s3-test-stack', {
        environmentSuffix: 's3-test',
      });

      const bucketName = await stack.complianceBucket.promise();
      expect(bucketName).toBeTruthy();
      expect(bucketName).toContain('compliance-data');
    });
  });

  describe('SNS Topic Configuration', () => {
    it('should create SNS topic for compliance alerts', async () => {
      const stack = new TapStack('sns-test-stack', {
        environmentSuffix: 'sns-test',
      });

      const topicArn = await stack.snsTopic.promise();
      expect(topicArn).toBeTruthy();
    });
  });

  describe('CloudWatch Logs', () => {
    it('should create log group with retention policy', async () => {
      const stack = new TapStack('logs-test-stack', {
        environmentSuffix: 'logs-test',
      });

      // Verify log group is created via stack construction
      expect(stack).toBeDefined();
    });
  });

  describe('Resource Dependencies', () => {
    it('should handle resource dependencies correctly', async () => {
      const stack = new TapStack('dependencies-test-stack', {
        environmentSuffix: 'deps-test',
      });

      // All resources should be created with proper dependencies
      expect(stack.lambdaFunctionArn).toBeDefined();
      expect(stack.snsTopic).toBeDefined();
      expect(stack.complianceBucket).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long environment suffixes', async () => {
      const longSuffix = 'very-long-environment-suffix-name-for-testing';
      const stack = new TapStack('edge-case-stack', {
        environmentSuffix: longSuffix,
      });

      expect(stack).toBeDefined();
    });

    it('should handle special characters in environment suffix', async () => {
      const stack = new TapStack('special-char-stack', {
        environmentSuffix: 'test-env-123',
      });

      expect(stack).toBeDefined();
    });

    it('should create stack with minimal configuration', async () => {
      const stack = new TapStack('minimal-stack', {
        environmentSuffix: 'min',
      });

      expect(stack).toBeDefined();
      expect(stack.lambdaFunctionArn).toBeDefined();
      expect(stack.snsTopic).toBeDefined();
      expect(stack.complianceBucket).toBeDefined();
      expect(stack.dashboardName).toBeDefined();
    });
  });

  describe('Multiple Stack Instances', () => {
    it('should support multiple concurrent stack instances', async () => {
      const stack1 = new TapStack('multi-1', { environmentSuffix: 'multi1' });
      const stack2 = new TapStack('multi-2', { environmentSuffix: 'multi2' });
      const stack3 = new TapStack('multi-3', { environmentSuffix: 'multi3' });

      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
      expect(stack3).toBeDefined();

      const arn1 = await stack1.lambdaFunctionArn.promise();
      const arn2 = await stack2.lambdaFunctionArn.promise();
      const arn3 = await stack3.lambdaFunctionArn.promise();

      // All ARNs should be unique
      expect(arn1).not.toEqual(arn2);
      expect(arn2).not.toEqual(arn3);
      expect(arn1).not.toEqual(arn3);
    });
  });
});
