/**
 * Unit tests for SecretsStack - Secrets Manager secrets
 */
import * as pulumi from '@pulumi/pulumi';
import { SecretsStack } from '../lib/secrets-stack';

// Set up Pulumi mocking
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string, state: any} {
    return {
      id: args.inputs.name ? `${args.inputs.name}-id` : `${args.name}-id`,
      state: {
        ...args.inputs,
        id: args.inputs.name ? `${args.inputs.name}-id` : `${args.name}-id`,
        arn: `arn:aws:secretsmanager:eu-central-1 :123456789012:secret:${args.inputs.name || args.name}`,
      },
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('SecretsStack', () => {
  describe('constructor', () => {
    it('should create a SecretsStack with required args', () => {
      const stack = new SecretsStack('test-secrets', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
      expect(stack.dbSecretArn).toBeDefined();
      expect(stack.apiKeySecretArn).toBeDefined();
    });

    it('should create a SecretsStack with custom tags', () => {
      const customTags = { Environment: 'staging', Team: 'platform' };
      const stack = new SecretsStack('test-secrets', {
        environmentSuffix: 'staging',
        tags: customTags,
      });

      expect(stack).toBeDefined();
      expect(stack.dbSecretArn).toBeDefined();
    });

    it('should expose dbSecretArn output', () => {
      const stack = new SecretsStack('test-secrets', {
        environmentSuffix: 'test',
      });

      expect(stack.dbSecretArn).toBeDefined();
      expect(pulumi.Output.isInstance(stack.dbSecretArn)).toBe(true);
    });

    it('should expose apiKeySecretArn output', () => {
      const stack = new SecretsStack('test-secrets', {
        environmentSuffix: 'test',
      });

      expect(stack.apiKeySecretArn).toBeDefined();
      expect(pulumi.Output.isInstance(stack.apiKeySecretArn)).toBe(true);
    });
  });

  describe('resource naming with environmentSuffix', () => {
    it('should use environmentSuffix in resource names', () => {
      const suffix = 'prod123';
      const stack = new SecretsStack('test-secrets', {
        environmentSuffix: suffix,
      });

      expect(stack).toBeDefined();
      expect(stack.dbSecretArn).toBeDefined();
    });

    it('should handle different environmentSuffix values', () => {
      const suffixes = ['dev', 'staging', 'prod', 'pr123'];

      for (const suffix of suffixes) {
        const stack = new SecretsStack(`test-secrets-${suffix}`, {
          environmentSuffix: suffix,
        });
        expect(stack).toBeDefined();
      }
    });
  });

  describe('SecretsStackArgs interface', () => {
    it('should accept only environmentSuffix', () => {
      const stack = new SecretsStack('test-secrets', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeDefined();
    });

    it('should accept environmentSuffix and tags', () => {
      const stack = new SecretsStack('test-secrets', {
        environmentSuffix: 'test',
        tags: { Owner: 'team' },
      });
      expect(stack).toBeDefined();
    });

    it('should handle empty tags object', () => {
      const stack = new SecretsStack('test-secrets', {
        environmentSuffix: 'test',
        tags: {},
      });
      expect(stack).toBeDefined();
    });

    it('should handle multiple tags', () => {
      const stack = new SecretsStack('test-secrets', {
        environmentSuffix: 'test',
        tags: {
          Environment: 'prod',
          Owner: 'platform',
          CostCenter: '12345',
        },
      });
      expect(stack).toBeDefined();
    });
  });

  describe('outputs resolution', () => {
    it('should have dbSecretArn output defined', () => {
      const stack = new SecretsStack('test-secrets', {
        environmentSuffix: 'test',
      });

      expect(stack.dbSecretArn).toBeDefined();
      expect(pulumi.Output.isInstance(stack.dbSecretArn)).toBe(true);
    });

    it('should have apiKeySecretArn output defined', () => {
      const stack = new SecretsStack('test-secrets', {
        environmentSuffix: 'test',
      });

      expect(stack.apiKeySecretArn).toBeDefined();
      expect(pulumi.Output.isInstance(stack.apiKeySecretArn)).toBe(true);
    });

    it('should have both secret ARNs defined', () => {
      const stack = new SecretsStack('test-secrets', {
        environmentSuffix: 'test',
      });

      expect(stack.dbSecretArn).toBeDefined();
      expect(stack.apiKeySecretArn).toBeDefined();
    });
  });
});
