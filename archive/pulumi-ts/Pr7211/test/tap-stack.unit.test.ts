import * as pulumi from '@pulumi/pulumi';
import { TapStack, TapStackArgs } from '../lib/tap-stack';

describe('TapStack - Unit Tests', () => {
  describe('TapStack Class Definition', () => {
    it('should be a class', () => {
      expect(typeof TapStack).toBe('function');
      expect(TapStack.prototype.constructor).toBe(TapStack);
    });

    it('should extend pulumi.ComponentResource', () => {
      const stack = new TapStack('test-stack');
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should be exported from the module', () => {
      expect(TapStack).toBeDefined();
      expect(TapStack.name).toBe('TapStack');
    });
  });

  describe('Constructor - Name Parameter', () => {
    it('should accept a name parameter', () => {
      expect(() => new TapStack('my-stack')).not.toThrow();
    });

    it('should work with different name formats', () => {
      expect(() => new TapStack('simple-name')).not.toThrow();
      expect(() => new TapStack('name-with-numbers-123')).not.toThrow();
      expect(() => new TapStack('name_with_underscores')).not.toThrow();
    });

    it('should create unique instances with different names', () => {
      const stack1 = new TapStack('stack-1');
      const stack2 = new TapStack('stack-2');
      expect(stack1).not.toBe(stack2);
    });
  });

  describe('Constructor - Args Parameter', () => {
    it('should accept no args parameter', () => {
      expect(() => new TapStack('test')).not.toThrow();
    });

    it('should accept empty args object', () => {
      expect(() => new TapStack('test', {})).not.toThrow();
    });

    it('should accept args with environmentSuffix', () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      expect(() => new TapStack('test', args)).not.toThrow();
    });

    it('should accept args with tags', () => {
      const args: TapStackArgs = {
        tags: {
          Environment: 'production',
          Owner: 'team',
        },
      };
      expect(() => new TapStack('test', args)).not.toThrow();
    });

    it('should accept args with both environmentSuffix and tags', () => {
      const args: TapStackArgs = {
        environmentSuffix: 'staging',
        tags: {
          Environment: 'staging',
          Project: 'test-project',
        },
      };
      expect(() => new TapStack('test', args)).not.toThrow();
    });

    it('should handle undefined environmentSuffix', () => {
      const args: TapStackArgs = { environmentSuffix: undefined };
      expect(() => new TapStack('test', args)).not.toThrow();
    });

    it('should handle pulumi.Input tags', () => {
      const args: TapStackArgs = {
        tags: pulumi.output({
          Environment: 'prod',
          Version: '1.0.0',
        }),
      };
      expect(() => new TapStack('test', args)).not.toThrow();
    });
  });

  describe('Constructor - Resource Options', () => {
    it('should accept resource options', () => {
      const opts = { protect: false };
      expect(() => new TapStack('test', {}, opts)).not.toThrow();
    });

    it('should accept resource options with parent', () => {
      const parentStack = new TapStack('parent');
      const opts = { parent: parentStack };
      expect(() => new TapStack('child', {}, opts)).not.toThrow();
    });

    it('should accept resource options with dependsOn', () => {
      const dependency = new TapStack('dependency');
      const opts = { dependsOn: [dependency] };
      expect(() => new TapStack('test', {}, opts)).not.toThrow();
    });

    it('should accept resource options with providers', () => {
      const opts = { protect: true };
      expect(() => new TapStack('test', {}, opts)).not.toThrow();
    });
  });

  describe('Output Properties - Existence', () => {
    let stack: TapStack;

    beforeEach(() => {
      stack = new TapStack('test-output-stack');
    });

    it('should have vpcId property', () => {
      expect(stack).toHaveProperty('vpcId');
    });

    it('should have rdsEndpoint property', () => {
      expect(stack).toHaveProperty('rdsEndpoint');
    });

    it('should have bucketName property', () => {
      expect(stack).toHaveProperty('bucketName');
    });

    it('should have lambdaArn property', () => {
      expect(stack).toHaveProperty('lambdaArn');
    });

    it('should have apiUrl property', () => {
      expect(stack).toHaveProperty('apiUrl');
    });
  });

  describe('Output Properties - Types', () => {
    let stack: TapStack;

    beforeEach(() => {
      stack = new TapStack('test-types-stack');
    });

    it('should have vpcId as pulumi.Output', () => {
      expect(stack.vpcId).toBeInstanceOf(pulumi.Output);
    });

    it('should have rdsEndpoint as pulumi.Output', () => {
      expect(stack.rdsEndpoint).toBeInstanceOf(pulumi.Output);
    });

    it('should have bucketName as pulumi.Output', () => {
      expect(stack.bucketName).toBeInstanceOf(pulumi.Output);
    });

    it('should have lambdaArn as pulumi.Output', () => {
      expect(stack.lambdaArn).toBeInstanceOf(pulumi.Output);
    });

    it('should have apiUrl as pulumi.Output', () => {
      expect(stack.apiUrl).toBeInstanceOf(pulumi.Output);
    });
  });

  describe('Output Properties - Values', () => {
    let stack: TapStack;

    beforeEach(() => {
      stack = new TapStack('test-values-stack');
    });

    it('should resolve vpcId to empty string', async () => {
      const value = await new Promise<string>((resolve) => {
        stack.vpcId?.apply((v) => resolve(v));
      });
      expect(value).toBe('');
    });

    it('should resolve rdsEndpoint to empty string', async () => {
      const value = await new Promise<string>((resolve) => {
        stack.rdsEndpoint?.apply((v) => resolve(v));
      });
      expect(value).toBe('');
    });

    it('should resolve bucketName to a string value', async () => {
      const value = await new Promise<string>((resolve) => {
        stack.bucketName?.apply((v) => resolve(v));
      });
      expect(typeof value).toBe('string');
      expect(value).toBeTruthy();
    });

    it('should have lambdaArn defined', () => {
      expect(stack.lambdaArn).toBeDefined();
      expect(stack.lambdaArn).toBeInstanceOf(pulumi.Output);
    });

    it('should have apiUrl defined', () => {
      expect(stack.apiUrl).toBeDefined();
      expect(stack.apiUrl).toBeInstanceOf(pulumi.Output);
    });
  });

  describe('Output Registration', () => {
    it('should register all outputs', () => {
      const stack = new TapStack('test-registration-stack');
      expect(stack.vpcId).toBeDefined();
      expect(stack.rdsEndpoint).toBeDefined();
      expect(stack.bucketName).toBeDefined();
      expect(stack.lambdaArn).toBeDefined();
      expect(stack.apiUrl).toBeDefined();
    });

    it('should have consistent outputs across accesses', () => {
      const stack = new TapStack('test-consistency-stack');
      const firstVpcId = stack.vpcId;
      const secondVpcId = stack.vpcId;
      expect(firstVpcId).toBe(secondVpcId);
    });
  });

  describe('TapStackArgs Interface', () => {
    it('should accept environmentSuffix as optional string', () => {
      const args1: TapStackArgs = {};
      const args2: TapStackArgs = { environmentSuffix: 'dev' };
      expect(() => new TapStack('test1', args1)).not.toThrow();
      expect(() => new TapStack('test2', args2)).not.toThrow();
    });

    it('should accept tags as optional object', () => {
      const args1: TapStackArgs = {};
      const args2: TapStackArgs = { tags: { key: 'value' } };
      expect(() => new TapStack('test1', args1)).not.toThrow();
      expect(() => new TapStack('test2', args2)).not.toThrow();
    });

    it('should accept tags as pulumi.Input', () => {
      const args: TapStackArgs = {
        tags: pulumi.output({ Env: 'test' }),
      };
      expect(() => new TapStack('test', args)).not.toThrow();
    });
  });

  describe('Resource URN', () => {
    it('should have a URN property', () => {
      const stack = new TapStack('test-urn-stack');
      expect((stack as any).urn).toBeDefined();
    });

    it('should have correct resource type in URN', async () => {
      const stack = new TapStack('test-type-stack');
      const urn = await new Promise<string>((resolve) => {
        (stack as any).urn.apply((u: string) => resolve(u));
      });
      expect(urn).toContain('tap:stack:TapStack');
    });
  });

  describe('Multiple Instances', () => {
    it('should allow creating multiple instances', () => {
      const stack1 = new TapStack('stack-1');
      const stack2 = new TapStack('stack-2');
      const stack3 = new TapStack('stack-3');

      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
      expect(stack3).toBeDefined();
    });

    it('should maintain separate state for each instance', () => {
      const stack1 = new TapStack('stack-1', { environmentSuffix: 'env1' });
      const stack2 = new TapStack('stack-2', { environmentSuffix: 'env2' });

      expect(stack1.vpcId).not.toBe(stack2.vpcId);
      expect(stack1.rdsEndpoint).not.toBe(stack2.rdsEndpoint);
    });
  });

  describe('Inheritance and Prototype', () => {
    it('should have ComponentResource in prototype chain', () => {
      const stack = new TapStack('test-proto-stack');
      let proto = Object.getPrototypeOf(stack);
      let foundComponentResource = false;

      while (proto) {
        if (proto.constructor.name === 'ComponentResource') {
          foundComponentResource = true;
          break;
        }
        proto = Object.getPrototypeOf(proto);
      }

      expect(foundComponentResource).toBe(true);
    });

    it('should have TapStack as immediate constructor', () => {
      const stack = new TapStack('test-constructor-stack');
      expect(stack.constructor.name).toBe('TapStack');
    });
  });

  describe('Property Descriptors', () => {
    it('should have output properties', () => {
      const stack = new TapStack('test-readonly-stack');
      const descriptor = Object.getOwnPropertyDescriptor(stack, 'vpcId');
      expect(descriptor).toBeDefined();
    });

    it('should have output properties defined', () => {
      const stack = new TapStack('test-delete-stack');
      expect(stack.vpcId).toBeDefined();
      expect(stack.rdsEndpoint).toBeDefined();
      expect(stack.bucketName).toBeDefined();
      expect(stack.lambdaArn).toBeDefined();
      expect(stack.apiUrl).toBeDefined();
    });
  });

  describe('Output Operations', () => {
    let stack: TapStack;

    beforeEach(() => {
      stack = new TapStack('test-operations-stack');
    });

    it('should support apply method on outputs', () => {
      expect(typeof stack.vpcId?.apply).toBe('function');
      expect(typeof stack.rdsEndpoint?.apply).toBe('function');
    });

    it('should support transforming outputs with apply', async () => {
      const transformed = stack.vpcId?.apply((id) => `prefix-${id}`);
      expect(transformed).toBeInstanceOf(pulumi.Output);

      const value = await new Promise<string>((resolve) => {
        transformed?.apply((v) => resolve(v));
      });
      expect(value).toBe('prefix-');
    });

    it('should support combining outputs with pulumi.all', () => {
      const combined = pulumi.all([stack.vpcId, stack.bucketName]);
      expect(combined).toBeInstanceOf(pulumi.Output);
    });

    it('should support chaining apply calls', async () => {
      const chained = stack.vpcId?.apply((id) => `step1-${id}`).apply((id) => `step2-${id}`);

      const value = await new Promise<string>((resolve) => {
        chained?.apply((v) => resolve(v));
      });
      expect(value).toBe('step2-step1-');
    });
  });

  describe('Error Handling', () => {
    it('should not throw on valid construction', () => {
      expect(() => new TapStack('valid-stack')).not.toThrow();
    });

    it('should handle special characters in name', () => {
      expect(() => new TapStack('stack-with-dashes')).not.toThrow();
      expect(() => new TapStack('stack_with_underscores')).not.toThrow();
    });

    it('should handle empty tags object', () => {
      expect(() => new TapStack('test', { tags: {} })).not.toThrow();
    });

    it('should handle empty environmentSuffix string', () => {
      expect(() => new TapStack('test', { environmentSuffix: '' })).not.toThrow();
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should enforce correct types for constructor parameters', () => {
      const validArgs: TapStackArgs = {
        environmentSuffix: 'test',
        tags: { key: 'value' },
      };
      expect(() => new TapStack('test', validArgs)).not.toThrow();
    });

    it('should have correct return types for outputs', () => {
      const stack = new TapStack('test-return-types');

      const vpcId: pulumi.Output<string> | undefined = stack.vpcId;
      const rdsEndpoint: pulumi.Output<string> | undefined = stack.rdsEndpoint;
      const bucketName: pulumi.Output<string> | undefined = stack.bucketName;
      const lambdaArn: pulumi.Output<string> | undefined = stack.lambdaArn;
      const apiUrl: pulumi.Output<string> | undefined = stack.apiUrl;

      expect(vpcId).toBeDefined();
      expect(rdsEndpoint).toBeDefined();
      expect(bucketName).toBeDefined();
      expect(lambdaArn).toBeDefined();
      expect(apiUrl).toBeDefined();
    });
  });

  describe('ComponentResource Behavior', () => {
    it('should register as a component resource', () => {
      const stack = new TapStack('test-component');
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should accept provider options', () => {
      expect(() => {
        new TapStack('test', {}, { protect: false });
      }).not.toThrow();
    });

    it('should accept parent resource', () => {
      const parent = new TapStack('parent');
      expect(() => {
        new TapStack('child', {}, { parent });
      }).not.toThrow();
    });
  });

  describe('Default Values', () => {
    it('should have valid output values', async () => {
      const stack = new TapStack('test-defaults');

      const vpcId = await new Promise<string>((resolve) => stack.vpcId?.apply((v) => resolve(v)));
      const rdsEndpoint = await new Promise<string>((resolve) => stack.rdsEndpoint?.apply((v) => resolve(v)));

      // vpcId and rdsEndpoint should be empty strings (legacy outputs)
      expect(vpcId).toBe('');
      expect(rdsEndpoint).toBe('');

      // bucketName, lambdaArn, and apiUrl should have real values now
      expect(stack.bucketName).toBeDefined();
      expect(stack.lambdaArn).toBeDefined();
      expect(stack.apiUrl).toBeDefined();
    }, 60000);
  });

  describe('Stack Naming Patterns', () => {
    it('should work with environment-specific names', () => {
      expect(() => new TapStack('tap-stack-dev')).not.toThrow();
      expect(() => new TapStack('tap-stack-staging')).not.toThrow();
      expect(() => new TapStack('tap-stack-prod')).not.toThrow();
    });

    it('should work with PR-specific names', () => {
      expect(() => new TapStack('tap-stack-pr123')).not.toThrow();
      expect(() => new TapStack('tap-stack-pr-7139')).not.toThrow();
    });

    it('should work with custom naming conventions', () => {
      expect(() => new TapStack('my-custom-stack-name')).not.toThrow();
      expect(() => new TapStack('organization-team-stack')).not.toThrow();
    });
  });

  describe('Memory and Resource Management', () => {
    it('should not leak references between instances', () => {
      const stack1 = new TapStack('stack-1');
      const stack2 = new TapStack('stack-2');

      expect(stack1).not.toBe(stack2);
      expect(stack1.vpcId).not.toBe(stack2.vpcId);
    });

    it('should maintain separate output values per instance', async () => {
      const stack1 = new TapStack('stack-1');
      const stack2 = new TapStack('stack-2');

      const value1 = await new Promise<string>((resolve) => {
        stack1.vpcId?.apply((v) => resolve(v));
      });
      const value2 = await new Promise<string>((resolve) => {
        stack2.vpcId?.apply((v) => resolve(v));
      });

      expect(typeof value1).toBe('string');
      expect(typeof value2).toBe('string');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long names', () => {
      const longName = 'very-long-stack-name-'.repeat(10);
      expect(() => new TapStack(longName)).not.toThrow();
    });

    it('should handle numeric names', () => {
      expect(() => new TapStack('123-numeric-stack')).not.toThrow();
    });

    it('should handle many tags', () => {
      const manyTags: { [key: string]: string } = {};
      for (let i = 0; i < 50; i++) {
        manyTags[`tag${i}`] = `value${i}`;
      }
      expect(() => new TapStack('test', { tags: manyTags })).not.toThrow();
    });

    it('should handle nested output operations', async () => {
      const stack = new TapStack('nested-ops-stack');
      const nested = stack.vpcId?.apply((id) =>
        stack.bucketName?.apply((bucket) => `${id}-${bucket}`)
      );
      expect(nested).toBeDefined();
    });
  });
});
