import * as pulumi from '@pulumi/pulumi';
import { SecureStack } from '../lib/secure-stack';

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
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

describe('SecureStack Unit Tests', () => {
  describe('Constructor Validation', () => {
    it('should throw error for missing args', () => {
      expect(() => {
        new SecureStack('TestSecureStackNoArgs', undefined as any);
      }).toThrow('Environment must be a non-empty string');
    });

    it('should throw error for missing environment', () => {
      expect(() => {
        new SecureStack('TestSecureStackNoEnv', {
          environment: '',
          tags: {},
        });
      }).toThrow('Environment must be a non-empty string');
    });

    it('should throw error for null environment', () => {
      expect(() => {
        new SecureStack('TestSecureStackNullEnv', {
          environment: null as any,
          tags: {},
        });
      }).toThrow('Environment must be a non-empty string');
    });

    it('should throw error for whitespace-only environment', () => {
      expect(() => {
        new SecureStack('TestSecureStackWhitespace', {
          environment: '   ',
          tags: {},
        });
      }).toThrow('Environment must be a non-empty string');
    });

    it('should throw error for invalid tags', () => {
      expect(() => {
        new SecureStack('TestSecureStackInvalidTags', {
          environment: 'test',
          tags: null as any,
        });
      }).toThrow('Tags must be a valid object');
    });

    it('should throw error for undefined tags', () => {
      expect(() => {
        new SecureStack('TestSecureStackUndefinedTags', {
          environment: 'test',
          tags: undefined as any,
        });
      }).toThrow('Tags must be a valid object');
    });

    it('should create successfully with valid args', () => {
      const stack = new SecureStack('TestSecureStackValid', {
        environment: 'test',
        tags: { Environment: 'test' },
      });
      expect(stack).toBeDefined();
    });
  });
});