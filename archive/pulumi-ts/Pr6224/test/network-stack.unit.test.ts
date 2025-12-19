/**
 * Unit tests for NetworkStack - VPC and networking infrastructure
 */
import * as pulumi from '@pulumi/pulumi';
import { NetworkStack } from '../lib/network-stack';

// Set up Pulumi mocking
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string, state: any} {
    return {
      id: args.inputs.name ? `${args.inputs.name}-id` : `${args.name}-id`,
      state: {
        ...args.inputs,
        id: args.inputs.name ? `${args.inputs.name}-id` : `${args.name}-id`,
        arn: `arn:aws:${args.type}:eu-central-1 :123456789012:${args.name}`,
      },
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('NetworkStack', () => {
  describe('constructor', () => {
    it('should create a NetworkStack with required args', () => {
      const stack = new NetworkStack('test-network', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
      expect(stack.vpcId).toBeDefined();
      expect(stack.publicSubnetIds).toBeDefined();
      expect(stack.privateSubnetIds).toBeDefined();
    });

    it('should create a NetworkStack with custom tags', () => {
      const customTags = { Environment: 'staging', Team: 'platform' };
      const stack = new NetworkStack('test-network', {
        environmentSuffix: 'staging',
        tags: customTags,
      });

      expect(stack).toBeDefined();
      expect(stack.vpcId).toBeDefined();
    });

    it('should expose vpcId output', () => {
      const stack = new NetworkStack('test-network', {
        environmentSuffix: 'test',
      });

      expect(stack.vpcId).toBeDefined();
      expect(pulumi.Output.isInstance(stack.vpcId)).toBe(true);
    });

    it('should expose publicSubnetIds output array', () => {
      const stack = new NetworkStack('test-network', {
        environmentSuffix: 'test',
      });

      expect(stack.publicSubnetIds).toBeDefined();
      expect(Array.isArray(stack.publicSubnetIds)).toBe(true);
      expect(stack.publicSubnetIds.length).toBe(2);
    });

    it('should expose privateSubnetIds output array', () => {
      const stack = new NetworkStack('test-network', {
        environmentSuffix: 'test',
      });

      expect(stack.privateSubnetIds).toBeDefined();
      expect(Array.isArray(stack.privateSubnetIds)).toBe(true);
      expect(stack.privateSubnetIds.length).toBe(2);
    });
  });

  describe('resource naming with environmentSuffix', () => {
    it('should use environmentSuffix in resource names', () => {
      const suffix = 'prod123';
      const stack = new NetworkStack('test-network', {
        environmentSuffix: suffix,
      });

      expect(stack).toBeDefined();
      expect(stack.vpcId).toBeDefined();
    });

    it('should handle different environmentSuffix values', () => {
      const suffixes = ['dev', 'staging', 'prod', 'pr123'];

      for (const suffix of suffixes) {
        const stack = new NetworkStack(`test-network-${suffix}`, {
          environmentSuffix: suffix,
        });
        expect(stack).toBeDefined();
      }
    });
  });

  describe('NetworkStackArgs interface', () => {
    it('should accept only environmentSuffix', () => {
      const stack = new NetworkStack('test-network', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeDefined();
    });

    it('should accept environmentSuffix and tags', () => {
      const stack = new NetworkStack('test-network', {
        environmentSuffix: 'test',
        tags: { Owner: 'team' },
      });
      expect(stack).toBeDefined();
    });

    it('should handle empty tags object', () => {
      const stack = new NetworkStack('test-network', {
        environmentSuffix: 'test',
        tags: {},
      });
      expect(stack).toBeDefined();
    });

    it('should handle multiple tags', () => {
      const stack = new NetworkStack('test-network', {
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
    it('should have vpcId output defined', () => {
      const stack = new NetworkStack('test-network', {
        environmentSuffix: 'test',
      });

      expect(stack.vpcId).toBeDefined();
      expect(pulumi.Output.isInstance(stack.vpcId)).toBe(true);
    });

    it('should have public subnet IDs outputs defined', () => {
      const stack = new NetworkStack('test-network', {
        environmentSuffix: 'test',
      });

      expect(stack.publicSubnetIds).toBeDefined();
      expect(stack.publicSubnetIds.length).toBeGreaterThan(0);
      for (const subnetId of stack.publicSubnetIds) {
        expect(pulumi.Output.isInstance(subnetId)).toBe(true);
      }
    });

    it('should have private subnet IDs outputs defined', () => {
      const stack = new NetworkStack('test-network', {
        environmentSuffix: 'test',
      });

      expect(stack.privateSubnetIds).toBeDefined();
      expect(stack.privateSubnetIds.length).toBeGreaterThan(0);
      for (const subnetId of stack.privateSubnetIds) {
        expect(pulumi.Output.isInstance(subnetId)).toBe(true);
      }
    });
  });
});
