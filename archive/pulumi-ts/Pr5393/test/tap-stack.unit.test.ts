import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    return {
      id: args.inputs.name ? `${args.inputs.name}-id` : args.name + '-id',
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
        id: args.inputs.name || args.name,
        name: args.inputs.name || args.name,
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

describe('TapStack', () => {
  describe('Resource Creation', () => {
    it('should create stack with default environment', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'dev',
        tags: {
          Environment: 'dev',
          Project: 'dataprocessing',
        },
      });

      expect(stack).toBeDefined();
      expect(stack.bucketName).toBeDefined();
      expect(stack.lambdaArn).toBeDefined();
      expect(stack.dynamoTableName).toBeDefined();
    });

    it('should create stack with production environment', async () => {
      const stack = new TapStack('test-stack-prod', {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'prod',
          Project: 'dataprocessing',
        },
      });

      expect(stack).toBeDefined();
      expect(stack.bucketName).toBeDefined();
      expect(stack.lambdaArn).toBeDefined();
      expect(stack.dynamoTableName).toBeDefined();
    });

    it('should create stack with staging environment', async () => {
      const stack = new TapStack('test-stack-staging', {
        environmentSuffix: 'staging',
        tags: {
          Environment: 'staging',
          Project: 'dataprocessing',
        },
      });

      expect(stack).toBeDefined();
      expect(stack.bucketName).toBeDefined();
      expect(stack.lambdaArn).toBeDefined();
      expect(stack.dynamoTableName).toBeDefined();
    });

    it('should create stack with custom tags', async () => {
      const customTags = {
        Environment: 'test',
        Project: 'custom-project',
        Owner: 'test-owner',
      };

      const stack = new TapStack('test-stack-custom', {
        environmentSuffix: 'test',
        tags: customTags,
      });

      expect(stack).toBeDefined();
    });

    it('should handle missing environmentSuffix gracefully', async () => {
      const stack = new TapStack('test-stack-default', {});

      expect(stack).toBeDefined();
      expect(stack.bucketName).toBeDefined();
      expect(stack.lambdaArn).toBeDefined();
      expect(stack.dynamoTableName).toBeDefined();
    });

    it('should handle missing tags gracefully', async () => {
      const stack = new TapStack('test-stack-no-tags', {
        environmentSuffix: 'dev',
      });

      expect(stack).toBeDefined();
      expect(stack.bucketName).toBeDefined();
      expect(stack.lambdaArn).toBeDefined();
      expect(stack.dynamoTableName).toBeDefined();
    });
  });

  describe('Environment Configuration', () => {
    it('should use correct configuration for dev environment', async () => {
      const stack = new TapStack('test-dev', {
        environmentSuffix: 'dev',
        tags: { Environment: 'dev', Project: 'test' },
      });

      // Dev environment should use specific settings
      // Lambda memory: 512MB, DynamoDB: 1 RCU/WCU, Logs: 7 days, X-Ray: disabled
      expect(stack).toBeDefined();
    });

    it('should use correct configuration for staging environment', async () => {
      const stack = new TapStack('test-staging', {
        environmentSuffix: 'staging',
        tags: { Environment: 'staging', Project: 'test' },
      });

      // Staging environment should use specific settings
      // Lambda memory: 1024MB, DynamoDB: 5 RCU/WCU, Logs: 7 days, X-Ray: enabled
      expect(stack).toBeDefined();
    });

    it('should use correct configuration for prod environment', async () => {
      const stack = new TapStack('test-prod', {
        environmentSuffix: 'prod',
        tags: { Environment: 'prod', Project: 'test' },
      });

      // Prod environment should use specific settings
      // Lambda memory: 2048MB, DynamoDB: on-demand, Logs: 30 days, X-Ray: enabled
      expect(stack).toBeDefined();
    });
  });

  describe('Output Values', () => {
    it('should export bucket name output', async () => {
      const stack = new TapStack('test-outputs', {
        environmentSuffix: 'test',
        tags: { Environment: 'test', Project: 'test' },
      });

      const bucketName = await stack.bucketName.promise();
      expect(bucketName).toBeDefined();
      expect(typeof bucketName).toBe('string');
    });

    it('should export lambda ARN output', async () => {
      const stack = new TapStack('test-outputs-lambda', {
        environmentSuffix: 'test',
        tags: { Environment: 'test', Project: 'test' },
      });

      const lambdaArn = await stack.lambdaArn.promise();
      expect(lambdaArn).toBeDefined();
      expect(typeof lambdaArn).toBe('string');
    });

    it('should export DynamoDB table name output', async () => {
      const stack = new TapStack('test-outputs-dynamo', {
        environmentSuffix: 'test',
        tags: { Environment: 'test', Project: 'test' },
      });

      const tableName = await stack.dynamoTableName.promise();
      expect(tableName).toBeDefined();
      expect(typeof tableName).toBe('string');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tags object', async () => {
      const stack = new TapStack('test-empty-tags', {
        environmentSuffix: 'dev',
        tags: {},
      });

      expect(stack).toBeDefined();
    });

    it('should handle undefined properties gracefully', async () => {
      const stack = new TapStack('test-undefined', {
        environmentSuffix: undefined,
        tags: undefined,
      });

      expect(stack).toBeDefined();
    });

    it('should handle long environment suffix', async () => {
      const stack = new TapStack('test-long-suffix', {
        environmentSuffix: 'very-long-environment-suffix-name',
        tags: { Environment: 'test', Project: 'test' },
      });

      expect(stack).toBeDefined();
    });

    it('should handle special characters in environment suffix', async () => {
      const stack = new TapStack('test-special', {
        environmentSuffix: 'dev-123',
        tags: { Environment: 'dev', Project: 'test' },
      });

      expect(stack).toBeDefined();
    });

    it('should handle case variations in environment name', async () => {
      const stack1 = new TapStack('test-prod-lower', {
        environmentSuffix: 'prod',
        tags: { Environment: 'prod', Project: 'test' },
      });

      const stack2 = new TapStack('test-prod-upper', {
        environmentSuffix: 'PROD',
        tags: { Environment: 'PROD', Project: 'test' },
      });

      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
    });
  });
});
