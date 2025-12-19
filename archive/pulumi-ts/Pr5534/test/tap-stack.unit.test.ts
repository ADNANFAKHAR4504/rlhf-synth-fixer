import * as pulumi from '@pulumi/pulumi';

// Set AWS region for testing
process.env.AWS_REGION = 'ca-central-1';

// Set up Pulumi testing environment
pulumi.runtime.setMocks(
  {
    newResource: function (args: pulumi.runtime.MockResourceArgs): {
      id: string;
      state: any;
    } {
      return {
        id: args.inputs.name
          ? `${args.name}-${args.inputs.name}-id`
          : `${args.name}-id`,
        state: {
          ...args.inputs,
          arn:
            args.type === 'aws:iam/role:Role' ||
            args.type === 'aws:iam/instanceProfile:InstanceProfile' ||
            args.type === 'aws:autoscaling/policy:Policy' ||
            args.type === 'aws:lb/loadBalancer:LoadBalancer' ||
            args.type === 'aws:lb/targetGroup:TargetGroup'
              ? `arn:aws:${args.type}:ca-central-1:123456789012:${args.name}`
              : undefined,
          id: args.inputs.name
            ? `${args.name}-${args.inputs.name}-id`
            : `${args.name}-id`,
          name: args.inputs.name || args.name,
          dnsName:
            args.type === 'aws:lb/loadBalancer:LoadBalancer'
              ? 'test-alb-123.ca-central-1.elb.amazonaws.com'
              : undefined,
          arnSuffix:
            args.type === 'aws:lb/targetGroup:TargetGroup'
              ? 'targetgroup/test/abc123'
              : args.type === 'aws:lb/loadBalancer:LoadBalancer'
                ? 'app/test/xyz789'
                : undefined,
        },
      };
    },
    call: function (args: pulumi.runtime.MockCallArgs) {
      if (args.token === 'aws:ec2/getAmi:getAmi') {
        return {
          id: 'ami-12345678',
          architecture: 'x86_64',
          imageId: 'ami-12345678',
        };
      }
      if (args.token === 'aws:index/getRegion:getRegion') {
        return {
          id: 'ca-central-1',
          name: 'ca-central-1',
        };
      }
      return args.inputs;
    },
  },
  'test-project',
  'test-stack',
  true // Set project and stack for config
);

import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  describe('Stack Creation with Custom Environment Suffix', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test123',
        tags: {
          Project: 'Testing',
        },
      });
    });

    it('should create stack successfully', () => {
      expect(stack).toBeDefined();
    });

    it('should export vpcId', async () => {
      const vpcId = await stack.vpcId.promise();
      expect(vpcId).toBeDefined();
      expect(typeof vpcId).toBe('string');
    });

    it('should export albDnsName', async () => {
      const albDnsName = await stack.albDnsName.promise();
      expect(albDnsName).toBeDefined();
      expect(typeof albDnsName).toBe('string');
      expect(albDnsName).toContain('.elb.amazonaws.com');
    });

    it('should export asgName', async () => {
      const asgName = await stack.asgName.promise();
      expect(asgName).toBeDefined();
      expect(typeof asgName).toBe('string');
    });

    it('should use custom environment suffix in resource names', async () => {
      const vpcId = await stack.vpcId.promise();
      expect(vpcId).toContain('test123');
    });
  });

  describe('Stack Creation with Default Environment Suffix', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-stack-default', {});
    });

    it('should create stack with default suffix', () => {
      expect(stack).toBeDefined();
    });

    it('should use default environment suffix (dev)', async () => {
      const vpcId = await stack.vpcId.promise();
      expect(vpcId).toBeDefined();
      // Default suffix is 'dev'
      expect(vpcId).toContain('dev');
    });

    it('should have all required outputs', async () => {
      const vpcId = await stack.vpcId.promise();
      const albDnsName = await stack.albDnsName.promise();
      const asgName = await stack.asgName.promise();

      expect(vpcId).toBeDefined();
      expect(albDnsName).toBeDefined();
      expect(asgName).toBeDefined();
    });
  });

  describe('Stack Resources with Specific Suffix', () => {
    let stack: TapStack;
    const testSuffix = 'prod';

    beforeAll(() => {
      stack = new TapStack('test-stack-prod', {
        environmentSuffix: testSuffix,
        tags: {
          Environment: 'production',
          Team: 'DevOps',
        },
      });
    });

    it('should create VPC with environment suffix', async () => {
      const vpcId = await stack.vpcId.promise();
      expect(vpcId).toBeDefined();
      expect(vpcId).toContain(testSuffix);
    });

    it('should create ALB with DNS name', async () => {
      const albDnsName = await stack.albDnsName.promise();
      expect(albDnsName).toBeDefined();
      expect(albDnsName).toMatch(/\.elb\.amazonaws\.com$/);
    });

    it('should create ASG with proper naming', async () => {
      const asgName = await stack.asgName.promise();
      expect(asgName).toBeDefined();
      expect(typeof asgName).toBe('string');
      expect(asgName.length).toBeGreaterThan(0);
    });
  });

  describe('Stack Resource Naming Conventions', () => {
    it('should include environmentSuffix in VPC name', async () => {
      const stack = new TapStack('naming-test', {
        environmentSuffix: 'staging',
      });
      const vpcId = await stack.vpcId.promise();
      expect(vpcId).toContain('staging');
    });

    it('should create unique resource names for different suffixes', async () => {
      const stack1 = new TapStack('stack-1', {
        environmentSuffix: 'env1',
      });
      const stack2 = new TapStack('stack-2', {
        environmentSuffix: 'env2',
      });

      const vpc1 = await stack1.vpcId.promise();
      const vpc2 = await stack2.vpcId.promise();

      expect(vpc1).not.toEqual(vpc2);
      expect(vpc1).toContain('env1');
      expect(vpc2).toContain('env2');
    });
  });

  describe('Stack with Custom Tags', () => {
    it('should accept custom tags', () => {
      const stack = new TapStack('tagged-stack', {
        environmentSuffix: 'qa',
        tags: {
          Project: 'TestProject',
          Owner: 'QATeam',
          CostCenter: '12345',
        },
      });

      expect(stack).toBeDefined();
      expect(stack.vpcId).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.asgName).toBeDefined();
    });

    it('should work with minimal configuration', () => {
      const stack = new TapStack('minimal-stack', {
        environmentSuffix: 'min',
      });

      expect(stack).toBeDefined();
    });

    it('should work with empty tags object', () => {
      const stack = new TapStack('empty-tags-stack', {
        environmentSuffix: 'empty',
        tags: {},
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Stack Output Types', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('output-test', {
        environmentSuffix: 'output',
      });
    });

    it('should return vpcId as Pulumi Output', () => {
      expect(stack.vpcId).toBeInstanceOf(Object);
      expect(typeof stack.vpcId.promise).toBe('function');
    });

    it('should return albDnsName as Pulumi Output', () => {
      expect(stack.albDnsName).toBeInstanceOf(Object);
      expect(typeof stack.albDnsName.promise).toBe('function');
    });

    it('should return asgName as Pulumi Output', () => {
      expect(stack.asgName).toBeInstanceOf(Object);
      expect(typeof stack.asgName.promise).toBe('function');
    });

    it('should resolve all outputs to strings', async () => {
      const vpcId = await stack.vpcId.promise();
      const albDnsName = await stack.albDnsName.promise();
      const asgName = await stack.asgName.promise();

      expect(typeof vpcId).toBe('string');
      expect(typeof albDnsName).toBe('string');
      expect(typeof asgName).toBe('string');
    });
  });

  describe('Stack with Different Environment Suffixes', () => {
    const testCases = [
      { suffix: 'dev', description: 'development environment' },
      { suffix: 'staging', description: 'staging environment' },
      { suffix: 'prod', description: 'production environment' },
      { suffix: 'test123', description: 'custom test environment' },
    ];

    testCases.forEach(({ suffix, description }) => {
      it(`should create stack for ${description}`, async () => {
        const stack = new TapStack(`stack-${suffix}`, {
          environmentSuffix: suffix,
        });

        expect(stack).toBeDefined();
        const vpcId = await stack.vpcId.promise();
        expect(vpcId).toContain(suffix);
      });
    });
  });

  describe('Stack Resource Validation', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('validation-test', {
        environmentSuffix: 'validate',
        tags: {
          Validation: 'true',
        },
      });
    });

    it('should have valid VPC ID format', async () => {
      const vpcId = await stack.vpcId.promise();
      expect(vpcId).toBeDefined();
      expect(vpcId.length).toBeGreaterThan(0);
    });

    it('should have valid ALB DNS name format', async () => {
      const albDnsName = await stack.albDnsName.promise();
      expect(albDnsName).toBeDefined();
      expect(albDnsName).toMatch(
        /^[a-z0-9-]+\.ca-central-1\.elb\.amazonaws\.com$/
      );
    });

    it('should have valid ASG name', async () => {
      const asgName = await stack.asgName.promise();
      expect(asgName).toBeDefined();
      expect(asgName.length).toBeGreaterThan(0);
      expect(asgName).toMatch(/^[a-zA-Z0-9-]+$/);
    });

    it('should export all required properties', () => {
      expect(stack).toHaveProperty('vpcId');
      expect(stack).toHaveProperty('albDnsName');
      expect(stack).toHaveProperty('asgName');
    });
  });

  describe('Stack Error Handling', () => {
    it('should handle undefined tags gracefully', () => {
      const stack = new TapStack('no-tags-stack', {
        environmentSuffix: 'notags',
      });

      expect(stack).toBeDefined();
    });

    it('should handle empty environment suffix', () => {
      const stack = new TapStack('empty-suffix-stack', {
        environmentSuffix: '',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Stack Component Resource', () => {
    it('should be a Pulumi ComponentResource', () => {
      const stack = new TapStack('component-test', {
        environmentSuffix: 'comp',
      });

      expect(stack).toBeDefined();
      expect(stack.constructor.name).toBe('TapStack');
    });

    it('should register outputs correctly', async () => {
      const stack = new TapStack('outputs-test', {
        environmentSuffix: 'outputs',
      });

      // Verify all outputs can be resolved
      await expect(stack.vpcId.promise()).resolves.toBeDefined();
      await expect(stack.albDnsName.promise()).resolves.toBeDefined();
      await expect(stack.asgName.promise()).resolves.toBeDefined();
    });
  });
});
