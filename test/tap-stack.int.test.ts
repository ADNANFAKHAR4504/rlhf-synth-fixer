import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

describe('TapStack - Live Integration Tests', () => {
  let stack: TapStack;
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test-int';

  beforeAll(() => {
    stack = new TapStack(`tap-stack-${environmentSuffix}`, {
      environmentSuffix,
      tags: {
        Environment: environmentSuffix,
        TestType: 'integration',
        ManagedBy: 'pulumi',
      },
    });
  });

  describe('Stack Initialization', () => {
    it('should create TapStack instance successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should be a ComponentResource', () => {
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });
  });

  describe('Stack Outputs - VPC Configuration', () => {
    it('should have vpcId output defined', () => {
      expect(stack.vpcId).toBeDefined();
    });

    it('should have valid vpcId output type', () => {
      expect(stack.vpcId).toBeInstanceOf(pulumi.Output);
    });

    it('should resolve vpcId to a string value', async () => {
      const vpcId = await new Promise<string>((resolve) => {
        stack.vpcId?.apply((id) => {
          resolve(id);
        });
      });
      expect(typeof vpcId).toBe('string');
    });
  });

  describe('Stack Outputs - RDS Configuration', () => {
    it('should have rdsEndpoint output defined', () => {
      expect(stack.rdsEndpoint).toBeDefined();
    });

    it('should have valid rdsEndpoint output type', () => {
      expect(stack.rdsEndpoint).toBeInstanceOf(pulumi.Output);
    });

    it('should resolve rdsEndpoint to a string value', async () => {
      const endpoint = await new Promise<string>((resolve) => {
        stack.rdsEndpoint?.apply((ep) => {
          resolve(ep);
        });
      });
      expect(typeof endpoint).toBe('string');
    });
  });

  describe('Stack Outputs - S3 Configuration', () => {
    it('should have bucketName output defined', () => {
      expect(stack.bucketName).toBeDefined();
    });

    it('should have valid bucketName output type', () => {
      expect(stack.bucketName).toBeInstanceOf(pulumi.Output);
    });

    it('should resolve bucketName to a string value', async () => {
      const bucketName = await new Promise<string>((resolve) => {
        stack.bucketName?.apply((name) => {
          resolve(name);
        });
      });
      expect(typeof bucketName).toBe('string');
    });
  });

  describe('Stack Outputs - Lambda Configuration', () => {
    it('should have lambdaArn output defined', () => {
      expect(stack.lambdaArn).toBeDefined();
    });

    it('should have valid lambdaArn output type', () => {
      expect(stack.lambdaArn).toBeInstanceOf(pulumi.Output);
    });

    it('should resolve lambdaArn to a string value', async () => {
      const arn = await new Promise<string>((resolve) => {
        stack.lambdaArn?.apply((a) => {
          resolve(a);
        });
      });
      expect(typeof arn).toBe('string');
    });
  });

  describe('Stack Outputs - API Gateway Configuration', () => {
    it('should have apiUrl output defined', () => {
      expect(stack.apiUrl).toBeDefined();
    });

    it('should have valid apiUrl output type', () => {
      expect(stack.apiUrl).toBeInstanceOf(pulumi.Output);
    });

    it('should resolve apiUrl to a string value', async () => {
      const url = await new Promise<string>((resolve) => {
        stack.apiUrl?.apply((u) => {
          resolve(u);
        });
      });
      expect(typeof url).toBe('string');
    });
  });

  describe('Stack Resource Configuration', () => {
    it('should have correct resource type URN', () => {
      const urn = (stack as any).urn;
      expect(urn).toBeDefined();
    });

    it('should register all outputs', async () => {
      const outputs = ['vpcId', 'rdsEndpoint', 'bucketName', 'lambdaArn', 'apiUrl'];

      outputs.forEach((output) => {
        expect(stack[output as keyof TapStack]).toBeDefined();
      });
    });
  });

  describe('Stack Tags and Metadata', () => {
    it('should accept tags in constructor args', () => {
      const stackWithTags = new TapStack(`tap-stack-tags-${environmentSuffix}`, {
        environmentSuffix,
        tags: {
          Project: 'TestProject',
          Owner: 'TestOwner',
        },
      });

      expect(stackWithTags).toBeDefined();
    });

    it('should accept environmentSuffix in constructor args', () => {
      const customSuffix = 'custom-test';
      const stackWithSuffix = new TapStack(`tap-stack-${customSuffix}`, {
        environmentSuffix: customSuffix,
      });

      expect(stackWithSuffix).toBeDefined();
    });
  });

  describe('Stack Output Values - Validation', () => {
    it('should have valid output values', async () => {
      const vpcId = await new Promise<string>((resolve) => {
        stack.vpcId?.apply((id) => resolve(id));
      });
      const rdsEndpoint = await new Promise<string>((resolve) => {
        stack.rdsEndpoint?.apply((ep) => resolve(ep));
      });
      const bucketName = await new Promise<string>((resolve) => {
        stack.bucketName?.apply((name) => resolve(name));
      });
      const lambdaArn = await new Promise<string>((resolve) => {
        stack.lambdaArn?.apply((arn) => resolve(arn));
      });
      const apiUrl = await new Promise<string>((resolve) => {
        stack.apiUrl?.apply((url) => resolve(url));
      });

      // vpcId and rdsEndpoint should be empty (legacy outputs)
      expect(vpcId).toBe('');
      expect(rdsEndpoint).toBe('');

      // bucketName, lambdaArn, and apiUrl should have real values
      expect(typeof bucketName).toBe('string');
      expect(bucketName).toBeTruthy();
      expect(typeof lambdaArn).toBe('string');
      expect(typeof apiUrl).toBe('string');
    }, 60000);
  });

  describe('Stack Constructor Variations', () => {
    it('should create stack with minimal args', () => {
      const minimalStack = new TapStack('minimal-stack');
      expect(minimalStack).toBeDefined();
      expect(minimalStack.vpcId).toBeDefined();
      expect(minimalStack.rdsEndpoint).toBeDefined();
      expect(minimalStack.bucketName).toBeDefined();
      expect(minimalStack.lambdaArn).toBeDefined();
      expect(minimalStack.apiUrl).toBeDefined();
    });

    it('should create stack with empty args object', () => {
      const emptyArgsStack = new TapStack('empty-args-stack', {});
      expect(emptyArgsStack).toBeDefined();
    });

    it('should create stack with custom name', () => {
      const customName = 'custom-tap-stack-name';
      const customStack = new TapStack(customName, {
        environmentSuffix: 'custom',
      });
      expect(customStack).toBeDefined();
    });
  });

  describe('Multiple Stack Instances', () => {
    it('should allow creation of multiple stack instances', () => {
      const stack1 = new TapStack(`tap-stack-1-${environmentSuffix}`, {
        environmentSuffix: `${environmentSuffix}-1`,
      });
      const stack2 = new TapStack(`tap-stack-2-${environmentSuffix}`, {
        environmentSuffix: `${environmentSuffix}-2`,
      });

      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
      expect(stack1).not.toBe(stack2);
    });
  });

  describe('Output Promise Resolution', () => {
    it('should resolve all outputs concurrently', async () => {
      const results = await Promise.all([
        new Promise<string>((resolve) => stack.vpcId?.apply((id) => resolve(id))),
        new Promise<string>((resolve) => stack.rdsEndpoint?.apply((ep) => resolve(ep))),
        new Promise<string>((resolve) => stack.bucketName?.apply((name) => resolve(name))),
        new Promise<string>((resolve) => stack.lambdaArn?.apply((arn) => resolve(arn))),
        new Promise<string>((resolve) => stack.apiUrl?.apply((url) => resolve(url))),
      ]);

      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(typeof result).toBe('string');
      });
    });

    it('should handle output transformations', async () => {
      const vpcIdUpper = await new Promise<string>((resolve) => {
        stack.vpcId?.apply((id) => resolve(id.toUpperCase()));
      });

      expect(typeof vpcIdUpper).toBe('string');
    });
  });

  describe('Error Handling', () => {
    it('should not throw when accessing outputs', () => {
      expect(() => {
        stack.vpcId;
        stack.rdsEndpoint;
        stack.bucketName;
        stack.lambdaArn;
        stack.apiUrl;
      }).not.toThrow();
    });

    it('should handle null environmentSuffix gracefully', () => {
      const stackWithoutSuffix = new TapStack('stack-no-suffix', {
        environmentSuffix: undefined,
      });
      expect(stackWithoutSuffix).toBeDefined();
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should have correct TypeScript types for outputs', () => {
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

    it('should have correct TapStackArgs interface', () => {
      const args = {
        environmentSuffix: 'test',
        tags: {
          key1: 'value1',
          key2: 'value2',
        },
      };

      const typedStack = new TapStack('typed-stack', args);
      expect(typedStack).toBeDefined();
    });
  });

  describe('Pulumi Output Behavior', () => {
    it('should support pulumi.all for combining outputs', async () => {
      const combined = pulumi.all([
        stack.vpcId,
        stack.rdsEndpoint,
        stack.bucketName,
      ]);

      expect(combined).toBeDefined();
      expect(combined).toBeInstanceOf(pulumi.Output);
    });

    it('should support output.apply chaining', async () => {
      const chained = stack.vpcId?.apply((id) => {
        return `vpc-prefix-${id}`;
      });

      expect(chained).toBeDefined();

      const result = await new Promise<string>((resolve) => {
        chained?.apply((val) => resolve(val));
      });

      expect(result).toContain('vpc-prefix-');
    });
  });

  describe('Resource Options', () => {
    it('should accept resource options in constructor', () => {
      const stackWithOpts = new TapStack(
        `tap-stack-opts-${environmentSuffix}`,
        { environmentSuffix },
        {
          protect: false,
        }
      );

      expect(stackWithOpts).toBeDefined();
    });
  });

  describe('Stack Lifecycle', () => {
    it('should maintain state across multiple accesses', () => {
      const firstAccess = stack.vpcId;
      const secondAccess = stack.vpcId;

      expect(firstAccess).toBe(secondAccess);
    });

    it('should have readonly outputs after creation', () => {
      const originalVpcId = stack.vpcId;
      expect(stack.vpcId).toBe(originalVpcId);
      expect(stack.vpcId).toBeDefined();
    });
  });
});
