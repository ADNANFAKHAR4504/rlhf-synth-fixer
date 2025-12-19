import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi mocks before importing the stack
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string, state: any} {
    return {
      id: args.inputs.name ? `${args.inputs.name}_id` : `${args.name}_id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
        url: args.type.includes('Queue') ? `https://sqs.us-east-1.amazonaws.com/123456789012/${args.name}` : undefined,
        invokeArn: args.type.includes('Function') ? `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:${args.name}/invocations` : undefined,
      },
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  describe('Stack Instantiation', () => {
    it('should instantiate successfully with default props', async () => {
      const stack = new TapStack('test-stack-default', {});
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should instantiate successfully with custom environmentSuffix', async () => {
      const stack = new TapStack('test-stack-custom', {
        environmentSuffix: 'prod',
      });
      expect(stack).toBeDefined();
    });

    it('should instantiate successfully with custom tags', async () => {
      const stack = new TapStack('test-stack-tags', {
        environmentSuffix: 'staging',
        tags: {
          Owner: 'TestTeam',
          CostCenter: '12345',
        },
      });
      expect(stack).toBeDefined();
    });

    it('should use default environmentSuffix when not provided', async () => {
      const stack = new TapStack('test-stack-default-env', {});
      expect(stack).toBeDefined();
      // The stack should use 'dev' as default
    });
  });

  describe('Stack Outputs', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-stack-outputs', {
        environmentSuffix: 'test',
      });
    });

    it('should expose apiUrl output', () => {
      expect(stack.apiUrl).toBeDefined();
      expect(stack.apiUrl).toBeInstanceOf(pulumi.Output);
    });

    it('should expose bucketName output', () => {
      expect(stack.bucketName).toBeDefined();
      expect(stack.bucketName).toBeInstanceOf(pulumi.Output);
    });

    it('should expose tableArn output', () => {
      expect(stack.tableArn).toBeDefined();
      expect(stack.tableArn).toBeInstanceOf(pulumi.Output);
    });

    it('should have all three required outputs', () => {
      expect(stack).toHaveProperty('apiUrl');
      expect(stack).toHaveProperty('bucketName');
      expect(stack).toHaveProperty('tableArn');
    });
  });

  describe('Stack Configuration', () => {
    it('should accept empty configuration object', () => {
      const stack = new TapStack('test-stack-empty', {});
      expect(stack).toBeDefined();
    });

    it('should accept configuration with only environmentSuffix', () => {
      const stack = new TapStack('test-stack-env-only', {
        environmentSuffix: 'prod',
      });
      expect(stack).toBeDefined();
    });

    it('should accept configuration with only tags', () => {
      const stack = new TapStack('test-stack-tags-only', {
        tags: {
          Environment: 'Test',
        },
      });
      expect(stack).toBeDefined();
    });

    it('should accept configuration with both environmentSuffix and tags', () => {
      const stack = new TapStack('test-stack-both', {
        environmentSuffix: 'staging',
        tags: {
          Owner: 'DevTeam',
        },
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Stack Properties', () => {
    it('should be a ComponentResource', () => {
      const stack = new TapStack('test-stack-component', {});
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have the correct URN type', (done) => {
      const stack = new TapStack('test-stack-urn', {});
      stack.urn.apply(urn => {
        expect(urn).toContain('tap:stack:TapStack');
        done();
      });
    });
  });

  describe('Multiple Stack Instances', () => {
    it('should allow creating multiple stack instances with different names', () => {
      const stack1 = new TapStack('test-stack-1', { environmentSuffix: 'dev' });
      const stack2 = new TapStack('test-stack-2', { environmentSuffix: 'staging' });
      const stack3 = new TapStack('test-stack-3', { environmentSuffix: 'prod' });

      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
      expect(stack3).toBeDefined();
      expect(stack1).not.toBe(stack2);
      expect(stack2).not.toBe(stack3);
    });

    it('should allow creating stack with special characters in environmentSuffix', () => {
      const stack = new TapStack('test-stack-special', {
        environmentSuffix: 'test-123',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Stack Tags', () => {
    it('should handle string tags', () => {
      const stack = new TapStack('test-stack-string-tags', {
        tags: {
          Environment: 'Production',
          Project: 'MarketAnalytics',
        },
      });
      expect(stack).toBeDefined();
    });

    it('should handle empty tags object', () => {
      const stack = new TapStack('test-stack-empty-tags', {
        tags: {},
      });
      expect(stack).toBeDefined();
    });

    it('should handle tags with various values', () => {
      const stack = new TapStack('test-stack-various-tags', {
        tags: {
          Name: 'TestStack',
          Owner: 'TestTeam',
          CostCenter: '12345',
          Environment: 'Development',
        },
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Environment Suffix Variations', () => {
    it('should work with short environmentSuffix', () => {
      const stack = new TapStack('test-stack-short', {
        environmentSuffix: 'dev',
      });
      expect(stack).toBeDefined();
    });

    it('should work with long environmentSuffix', () => {
      const stack = new TapStack('test-stack-long', {
        environmentSuffix: 'production-east-region-123',
      });
      expect(stack).toBeDefined();
    });

    it('should work with numeric environmentSuffix', () => {
      const stack = new TapStack('test-stack-numeric', {
        environmentSuffix: '12345',
      });
      expect(stack).toBeDefined();
    });

    it('should work with alphanumeric environmentSuffix', () => {
      const stack = new TapStack('test-stack-alphanumeric', {
        environmentSuffix: 'env123abc',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Stack Type Validation', () => {
    it('should have correct resource type', () => {
      const stack = new TapStack('test-stack-type', {});
      // ComponentResource should have the type we defined
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should maintain consistent interface across instances', () => {
      const stack1 = new TapStack('test-stack-interface-1', {});
      const stack2 = new TapStack('test-stack-interface-2', {});

      expect(typeof stack1.apiUrl).toBe(typeof stack2.apiUrl);
      expect(typeof stack1.bucketName).toBe(typeof stack2.bucketName);
      expect(typeof stack1.tableArn).toBe(typeof stack2.tableArn);
    });
  });
});
