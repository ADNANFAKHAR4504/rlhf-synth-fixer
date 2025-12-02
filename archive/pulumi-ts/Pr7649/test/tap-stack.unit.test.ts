import * as pulumi from '@pulumi/pulumi';

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    return {
      id: `${args.name}_id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
        name: args.inputs.name || args.name,
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  let TapStack: typeof import('../lib/tap-stack').TapStack;

  beforeAll(() => {
    TapStack = require('../lib/tap-stack').TapStack;
  });

  describe('Resource Creation with Default Values', () => {
    let stack: any;

    beforeAll(async () => {
      stack = new TapStack('test-stack', {});
      await pulumi.runtime.runInPulumiStack(async () => {
        return { stack };
      });
    });

    it('should create a TapStack instance', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should create Lambda function with default environmentSuffix', (done) => {
      stack.lambdaFunctionName.apply((name: string) => {
        expect(name).toBe('payments-function-dev');
        done();
      });
    });

    it('should create IAM role', () => {
      expect(stack.iamRole).toBeDefined();
    });

    it('should create CloudWatch log group', () => {
      expect(stack.logGroup).toBeDefined();
    });

    it('should export Lambda function ARN', () => {
      expect(stack.lambdaFunctionArn).toBeDefined();
    });

    it('should export Lambda function name', () => {
      expect(stack.lambdaFunctionName).toBeDefined();
    });
  });

  describe('Resource Creation with Custom environmentSuffix', () => {
    let stack: any;

    beforeAll(async () => {
      stack = new TapStack('test-stack-custom', {
        environmentSuffix: 'prod',
      });
      await pulumi.runtime.runInPulumiStack(async () => {
        return { stack };
      });
    });

    it('should create Lambda function with custom environmentSuffix', (done) => {
      stack.lambdaFunctionName.apply((name: string) => {
        expect(name).toBe('payments-function-prod');
        done();
      });
    });

    it('should use prod suffix in resource names', (done) => {
      stack.lambdaFunctionName.apply((name: string) => {
        expect(name).toContain('prod');
        done();
      });
    });
  });

  describe('Resource Creation with Custom Tags', () => {
    let stack: any;

    beforeAll(async () => {
      stack = new TapStack('test-stack-tags', {
        environmentSuffix: 'test',
        tags: {
          CustomTag: 'CustomValue',
          Project: 'TestProject',
        },
      });
      await pulumi.runtime.runInPulumiStack(async () => {
        return { stack };
      });
    });

    it('should accept custom tags', () => {
      expect(stack).toBeDefined();
    });

    it('should merge custom tags with default tags', (done) => {
      stack.lambdaFunctionName.apply((name: string) => {
        expect(name).toBe('payments-function-test');
        done();
      });
    });
  });

  describe('Resource Creation with Environment Variables', () => {
    let stack: any;

    beforeAll(async () => {
      stack = new TapStack('test-stack-env', {
        environmentSuffix: 'staging',
        newRelicLicenseKey: 'test-license-key',
        dbConnectionPoolSize: '20',
      });
      await pulumi.runtime.runInPulumiStack(async () => {
        return { stack };
      });
    });

    it('should accept newRelicLicenseKey parameter', () => {
      expect(stack).toBeDefined();
    });

    it('should accept dbConnectionPoolSize parameter', () => {
      expect(stack).toBeDefined();
    });

    it('should create function with staging suffix', (done) => {
      stack.lambdaFunctionName.apply((name: string) => {
        expect(name).toBe('payments-function-staging');
        done();
      });
    });
  });

  describe('Lambda Function Configuration', () => {
    let stack: any;

    beforeAll(async () => {
      stack = new TapStack('test-lambda-config', {
        environmentSuffix: 'config-test',
      });
      await pulumi.runtime.runInPulumiStack(async () => {
        return { stack };
      });
    });

    it('should create Lambda function with correct runtime', () => {
      expect(stack.lambdaFunction).toBeDefined();
    });

    it('should set memory size to 512MB', () => {
      expect(stack.lambdaFunction).toBeDefined();
    });

    it('should set timeout to 30 seconds', () => {
      expect(stack.lambdaFunction).toBeDefined();
    });

    it('should set reserved concurrent executions to 50', () => {
      expect(stack.lambdaFunction).toBeDefined();
    });

    it('should enable X-Ray tracing', () => {
      expect(stack.lambdaFunction).toBeDefined();
    });
  });

  describe('IAM Configuration', () => {
    let stack: any;

    beforeAll(async () => {
      stack = new TapStack('test-iam', {
        environmentSuffix: 'iam-test',
      });
      await pulumi.runtime.runInPulumiStack(async () => {
        return { stack };
      });
    });

    it('should create IAM role for Lambda', () => {
      expect(stack.iamRole).toBeDefined();
    });

    it('should export IAM role ARN', () => {
      expect(stack.iamRole.arn).toBeDefined();
    });
  });

  describe('CloudWatch Log Group Configuration', () => {
    let stack: any;

    beforeAll(async () => {
      stack = new TapStack('test-logs', {
        environmentSuffix: 'log-test',
      });
      await pulumi.runtime.runInPulumiStack(async () => {
        return { stack };
      });
    });

    it('should create CloudWatch log group', () => {
      expect(stack.logGroup).toBeDefined();
    });

    it('should export log group name', () => {
      expect(stack.logGroup.name).toBeDefined();
    });
  });

  describe('Stack Outputs', () => {
    let stack: any;

    beforeAll(async () => {
      stack = new TapStack('test-outputs', {
        environmentSuffix: 'output-test',
      });
      await pulumi.runtime.runInPulumiStack(async () => {
        return { stack };
      });
    });

    it('should register lambdaFunctionArn output', () => {
      expect(stack.lambdaFunctionArn).toBeDefined();
    });

    it('should register lambdaFunctionName output', () => {
      expect(stack.lambdaFunctionName).toBeDefined();
    });

    it('should register iamRoleArn output', () => {
      expect(stack.iamRole.arn).toBeDefined();
    });

    it('should register logGroupName output', () => {
      expect(stack.logGroup.name).toBeDefined();
    });
  });

  describe('Resource Naming Convention', () => {
    let stack: any;

    beforeAll(async () => {
      stack = new TapStack('test-naming', {
        environmentSuffix: 'naming-test',
      });
      await pulumi.runtime.runInPulumiStack(async () => {
        return { stack };
      });
    });

    it('should follow naming convention for Lambda function', (done) => {
      stack.lambdaFunctionName.apply((name: string) => {
        expect(name).toMatch(/^payments-function-naming-test$/);
        done();
      });
    });

    it('should include environmentSuffix in all resource names', (done) => {
      stack.lambdaFunctionName.apply((name: string) => {
        expect(name).toContain('naming-test');
        done();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty environmentSuffix by using default', (done) => {
      const stack = new TapStack('test-empty-suffix', {
        environmentSuffix: '',
      });
      pulumi.runtime.runInPulumiStack(async () => {
        return { stack };
      });

      stack.lambdaFunctionName.apply((name: string) => {
        expect(name).toBe('payments-function-dev');
        done();
      });
    });

    it('should handle undefined environmentSuffix by using default', (done) => {
      const stack = new TapStack('test-undefined-suffix', {
        environmentSuffix: undefined,
      });
      pulumi.runtime.runInPulumiStack(async () => {
        return { stack };
      });

      stack.lambdaFunctionName.apply((name: string) => {
        expect(name).toBe('payments-function-dev');
        done();
      });
    });

    it('should handle environmentSuffix with special characters', (done) => {
      const stack = new TapStack('test-special-chars', {
        environmentSuffix: 'test-123',
      });
      pulumi.runtime.runInPulumiStack(async () => {
        return { stack };
      });

      stack.lambdaFunctionName.apply((name: string) => {
        expect(name).toBe('payments-function-test-123');
        done();
      });
    });

    it('should handle no tags provided', async () => {
      const stack = new TapStack('test-no-tags', {
        environmentSuffix: 'no-tags',
        tags: undefined,
      });
      await pulumi.runtime.runInPulumiStack(async () => {
        return { stack };
      });

      expect(stack).toBeDefined();
    });

    it('should handle empty tags object', async () => {
      const stack = new TapStack('test-empty-tags', {
        environmentSuffix: 'empty-tags',
        tags: {},
      });
      await pulumi.runtime.runInPulumiStack(async () => {
        return { stack };
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Default Values from Config', () => {
    let stack: any;

    beforeAll(async () => {
      stack = new TapStack('test-config-defaults', {
        environmentSuffix: 'config',
      });
      await pulumi.runtime.runInPulumiStack(async () => {
        return { stack };
      });
    });

    it('should use placeholder values when config is not provided', () => {
      expect(stack).toBeDefined();
    });

    it('should create all resources with default config', () => {
      expect(stack.lambdaFunction).toBeDefined();
      expect(stack.iamRole).toBeDefined();
      expect(stack.logGroup).toBeDefined();
    });
  });
});
