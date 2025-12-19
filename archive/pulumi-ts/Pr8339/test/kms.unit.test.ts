import * as pulumi from '@pulumi/pulumi';
import { KmsStack } from '../lib/kms';

// Set up Pulumi runtime mocks
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    const { type, name, inputs } = args;
    return {
      id: `${name}-id`,
      state: {
        ...inputs,
        name: inputs.name || name,
        arn: `arn:aws:${type}:us-east-1:123456789012:${name}`,
        id: `${name}-id`,
        keyId: `key-${name}`,
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return { accountId: '123456789012' };
    }
    return args.inputs;
  },
});

describe('KmsStack Unit Tests', () => {
  describe('Constructor Validation', () => {
    it('should throw error for missing args', () => {
      expect(() => {
        new KmsStack('TestKmsStackNoArgs', undefined as any);
      }).toThrow('Environment must be a non-empty string');
    });

    it('should throw error for missing environment', () => {
      expect(() => {
        new KmsStack('TestKmsStackNoEnv', {
          environment: '',
          tags: {},
        });
      }).toThrow('Environment must be a non-empty string');
    });

    it('should throw error for null environment', () => {
      expect(() => {
        new KmsStack('TestKmsStackNullEnv', {
          environment: null as any,
          tags: {},
        });
      }).toThrow('Environment must be a non-empty string');
    });

    it('should throw error for whitespace-only environment', () => {
      expect(() => {
        new KmsStack('TestKmsStackWhitespace', {
          environment: '   ',
          tags: {},
        });
      }).toThrow('Environment must be a non-empty string');
    });

    it('should throw error for invalid tags', () => {
      expect(() => {
        new KmsStack('TestKmsStackInvalidTags', {
          environment: 'test',
          tags: null as any,
        });
      }).toThrow('Tags must be a valid object');
    });

    it('should throw error for undefined tags', () => {
      expect(() => {
        new KmsStack('TestKmsStackUndefinedTags', {
          environment: 'test',
          tags: undefined as any,
        });
      }).toThrow('Tags must be a valid object');
    });

    it('should create successfully with valid args', () => {
      const stack = new KmsStack('TestKmsStackValid', {
        environment: 'test',
        tags: { Environment: 'test' },
      });
      expect(stack).toBeDefined();
      expect(stack.primaryKmsKey).toBeDefined();
      expect(stack.secondaryKmsKey).toBeDefined();
    });
  });
});