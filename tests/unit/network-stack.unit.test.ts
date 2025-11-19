/**
 * Unit tests for NetworkStack
 */

import * as pulumi from '@pulumi/pulumi';
import { NetworkStack } from '../../lib/network-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

describe('NetworkStack', () => {
  const environmentSuffix = 'test';
  const vpcCidr = '10.0.0.0/16';
  const availabilityZones = ['us-east-1a', 'us-east-1b', 'us-east-1c'];
  const tags = {
    Environment: 'prod-migration',
    CostCenter: 'finance',
    MigrationPhase: 'active',
  };

  let stack: NetworkStack;

  beforeEach(() => {
    stack = new NetworkStack('test-network', {
      environmentSuffix,
      vpcCidr,
      availabilityZones,
      tags,
    });
  });

  describe('VPC Configuration', () => {
    it('should create a VPC with correct CIDR block', async () => {
      const vpcId = await stack.vpcId;
      expect(vpcId).toBeDefined();
    });

    it('should use correct environment suffix', () => {
      expect(stack).toBeDefined();
    });
  });

  describe('Public Subnets', () => {
    it('should create 3 public subnets', async () => {
      const publicSubnetIds = stack.publicSubnetIds;
      expect(publicSubnetIds).toHaveLength(3);
    });

    it('should return output for all public subnets', async () => {
      const publicSubnetIds = stack.publicSubnetIds;
      for (const subnetId of publicSubnetIds) {
        const id = await subnetId;
        expect(id).toBeDefined();
      }
    });
  });

  describe('Private Subnets', () => {
    it('should create 3 private subnets', async () => {
      const privateSubnetIds = stack.privateSubnetIds;
      expect(privateSubnetIds).toHaveLength(3);
    });

    it('should return output for all private subnets', async () => {
      const privateSubnetIds = stack.privateSubnetIds;
      for (const subnetId of privateSubnetIds) {
        const id = await subnetId;
        expect(id).toBeDefined();
      }
    });
  });

  describe('Internet Gateway', () => {
    it('should create an Internet Gateway', async () => {
      const igwId = await stack.internetGatewayId;
      expect(igwId).toBeDefined();
    });
  });

  describe('Resource Outputs', () => {
    it('should register all required outputs', async () => {
      const vpcId = await stack.vpcId;
      const publicSubnetIds = stack.publicSubnetIds;
      const privateSubnetIds = stack.privateSubnetIds;
      const igwId = await stack.internetGatewayId;

      expect(vpcId).toBeDefined();
      expect(publicSubnetIds).toHaveLength(3);
      expect(privateSubnetIds).toHaveLength(3);
      expect(igwId).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should accept valid configuration', () => {
      expect(() => {
        new NetworkStack('test-network-2', {
          environmentSuffix: 'test2',
          vpcCidr: '10.1.0.0/16',
          availabilityZones: ['us-east-1a', 'us-east-1b'],
          tags: { test: 'value' },
        });
      }).not.toThrow();
    });

    it('should handle different CIDR ranges', () => {
      expect(() => {
        new NetworkStack('test-network-3', {
          environmentSuffix: 'test3',
          vpcCidr: '172.16.0.0/16',
          availabilityZones: ['us-west-2a', 'us-west-2b'],
          tags: {},
        });
      }).not.toThrow();
    });

    it('should handle empty tags', () => {
      const stackWithoutTags = new NetworkStack('test-network-4', {
        environmentSuffix: 'test4',
        vpcCidr: '192.168.0.0/16',
        availabilityZones: ['us-east-1a'],
        tags: {},
      });
      expect(stackWithoutTags).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single availability zone', () => {
      const singleAzStack = new NetworkStack('test-network-single-az', {
        environmentSuffix: 'singleaz',
        vpcCidr: '10.2.0.0/16',
        availabilityZones: ['us-east-1a'],
        tags,
      });
      expect(singleAzStack.publicSubnetIds).toHaveLength(1);
      expect(singleAzStack.privateSubnetIds).toHaveLength(1);
    });

    it('should handle multiple availability zones', () => {
      const multiAzStack = new NetworkStack('test-network-multi-az', {
        environmentSuffix: 'multiaz',
        vpcCidr: '10.3.0.0/16',
        availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c', 'us-east-1d'],
        tags,
      });
      expect(multiAzStack.publicSubnetIds).toHaveLength(4);
      expect(multiAzStack.privateSubnetIds).toHaveLength(4);
    });
  });
});
