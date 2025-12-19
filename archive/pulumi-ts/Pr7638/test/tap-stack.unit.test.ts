import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    return {
      id: `${args.name}_id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:mock:${args.name}`,
        id: `${args.name}_id`,
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  let stack: typeof import('../lib/tap-stack');

  beforeAll(() => {
    // Import the stack module after mocks are configured
    stack = require('../lib/tap-stack');
  });

  describe('TapStack with default environmentSuffix', () => {
    it('should create stack with default dev environmentSuffix', async () => {
      const tapStack = new stack.TapStack('test-stack-default', {});

      const bucketName = await tapStack.complianceReportBucket.promise();
      const snsArn = await tapStack.complianceSnsTopicArn.promise();
      const lambdaArn = await tapStack.complianceLambdaArn.promise();

      expect(bucketName).toBe('compliance-reports-dev');
      expect(snsArn).toContain('arn:aws:mock:compliance-alerts-dev');
      expect(lambdaArn).toContain('arn:aws:mock:compliance-scanner-dev');
    });
  });

  describe('TapStack with custom environmentSuffix', () => {
    it('should create stack with custom environmentSuffix', async () => {
      const tapStack = new stack.TapStack('test-stack-custom', {
        environmentSuffix: 'prod123',
      });

      const bucketName = await tapStack.complianceReportBucket.promise();
      const snsArn = await tapStack.complianceSnsTopicArn.promise();
      const lambdaArn = await tapStack.complianceLambdaArn.promise();

      expect(bucketName).toBe('compliance-reports-prod123');
      expect(snsArn).toContain('arn:aws:mock:compliance-alerts-prod123');
      expect(lambdaArn).toContain('arn:aws:mock:compliance-scanner-prod123');
    });
  });

  describe('TapStack with custom tags', () => {
    it('should accept custom tags', async () => {
      const customTags = {
        Environment: 'test',
        Team: 'devops',
        Project: 'compliance',
      };

      const tapStack = new stack.TapStack('test-stack-tags', {
        environmentSuffix: 'test123',
        tags: customTags,
      });

      const bucketName = await tapStack.complianceReportBucket.promise();
      expect(bucketName).toBe('compliance-reports-test123');
    });
  });

  describe('TapStack resource outputs', () => {
    it('should expose all required outputs', async () => {
      const tapStack = new stack.TapStack('test-stack', {
        environmentSuffix: 'output-test',
      });

      expect(tapStack.complianceReportBucket).toBeDefined();
      expect(tapStack.complianceSnsTopicArn).toBeDefined();
      expect(tapStack.complianceLambdaArn).toBeDefined();
    });
  });

  describe('TapStack resource naming', () => {
    it('should include environmentSuffix in all resource names', async () => {
      const envSuffix = 'naming123';
      const tapStack = new stack.TapStack('test-stack-naming', {
        environmentSuffix: envSuffix,
      });

      const bucketName = await tapStack.complianceReportBucket.promise();
      const snsArn = await tapStack.complianceSnsTopicArn.promise();
      const lambdaArn = await tapStack.complianceLambdaArn.promise();

      expect(bucketName).toContain(envSuffix);
      expect(snsArn).toContain(envSuffix);
      expect(lambdaArn).toContain(envSuffix);
    });
  });

  describe('TapStack without tags', () => {
    it('should work without providing tags', async () => {
      const tapStack = new stack.TapStack('test-stack-no-tags', {
        environmentSuffix: 'no-tags',
      });

      const bucketName = await tapStack.complianceReportBucket.promise();
      expect(bucketName).toBe('compliance-reports-no-tags');
    });
  });

  describe('TapStack resource types', () => {
    it('should create S3 bucket resource', async () => {
      const tapStack = new stack.TapStack('test-stack-bucket-type', {
        environmentSuffix: 'types-test',
      });

      const bucketName = await tapStack.complianceReportBucket.promise();
      expect(typeof bucketName).toBe('string');
      expect(bucketName.length).toBeGreaterThan(0);
    });

    it('should create SNS topic resource', async () => {
      const tapStack = new stack.TapStack('test-stack-sns-type', {
        environmentSuffix: 'types-test',
      });

      const snsArn = await tapStack.complianceSnsTopicArn.promise();
      expect(typeof snsArn).toBe('string');
      expect(snsArn).toContain('arn:aws:');
    });

    it('should create Lambda function resource', async () => {
      const tapStack = new stack.TapStack('test-stack-lambda-type', {
        environmentSuffix: 'types-test',
      });

      const lambdaArn = await tapStack.complianceLambdaArn.promise();
      expect(typeof lambdaArn).toBe('string');
      expect(lambdaArn).toContain('arn:aws:');
    });
  });

  describe('TapStack with empty environmentSuffix', () => {
    it('should handle empty string environmentSuffix by using default', async () => {
      const tapStack = new stack.TapStack('test-stack-empty-suffix', {
        environmentSuffix: '',
      });

      const bucketName = await tapStack.complianceReportBucket.promise();
      // Empty string is falsy, so it should default to 'dev'
      expect(bucketName).toBe('compliance-reports-dev');
    });
  });

  describe('TapStack component resource type', () => {
    it('should be a Pulumi ComponentResource', () => {
      const tapStack = new stack.TapStack('test-stack', {
        environmentSuffix: 'component-test',
      });

      expect(tapStack).toBeInstanceOf(pulumi.ComponentResource);
    });
  });

  describe('TapStack with special characters in environmentSuffix', () => {
    it('should handle environmentSuffix with hyphens', async () => {
      const tapStack = new stack.TapStack('test-stack-special', {
        environmentSuffix: 'test-env-123',
      });

      const bucketName = await tapStack.complianceReportBucket.promise();
      expect(bucketName).toBe('compliance-reports-test-env-123');
    });
  });

  describe('TapStack multiple instances', () => {
    it('should allow creating multiple stack instances', async () => {
      const stack1 = new stack.TapStack('test-stack-multi-1', {
        environmentSuffix: 'multi1',
      });

      const stack2 = new stack.TapStack('test-stack-multi-2', {
        environmentSuffix: 'multi2',
      });

      const bucket1 = await stack1.complianceReportBucket.promise();
      const bucket2 = await stack2.complianceReportBucket.promise();

      expect(bucket1).toBe('compliance-reports-multi1');
      expect(bucket2).toBe('compliance-reports-multi2');
      expect(bucket1).not.toBe(bucket2);
    });
  });

  describe('TapStack with parent resource options', () => {
    it('should accept parent in resource options', async () => {
      const tapStack = new stack.TapStack(
        'test-stack-parent',
        {
          environmentSuffix: 'parent-test',
        },
        { parent: undefined }
      );

      const bucketName = await tapStack.complianceReportBucket.promise();
      expect(bucketName).toBe('compliance-reports-parent-test');
    });
  });

  describe('TapStack output registration', () => {
    it('should register all outputs', async () => {
      const tapStack = new stack.TapStack('test-stack', {
        environmentSuffix: 'outputs',
      });

      // All outputs should be accessible
      expect(tapStack.complianceReportBucket).toBeDefined();
      expect(tapStack.complianceSnsTopicArn).toBeDefined();
      expect(tapStack.complianceLambdaArn).toBeDefined();

      // Verify outputs are Pulumi Outputs
      expect(tapStack.complianceReportBucket).toHaveProperty('apply');
      expect(tapStack.complianceSnsTopicArn).toHaveProperty('apply');
      expect(tapStack.complianceLambdaArn).toHaveProperty('apply');
    });
  });

  describe('TapStack with undefined tags', () => {
    it('should handle undefined tags gracefully', async () => {
      const tapStack = new stack.TapStack('test-stack-undef-tags', {
        environmentSuffix: 'undefined-tags',
        tags: undefined,
      });

      const bucketName = await tapStack.complianceReportBucket.promise();
      expect(bucketName).toBe('compliance-reports-undefined-tags');
    });
  });
});
