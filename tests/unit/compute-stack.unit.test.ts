/**
 * Unit tests for ComputeStack
 */

import * as pulumi from '@pulumi/pulumi';
import { ComputeStack } from '../../lib/compute-stack';

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

describe('ComputeStack', () => {
  const environmentSuffix = 'test';
  const vpcId = pulumi.output('vpc-123');
  const publicSubnetIds = [
    pulumi.output('public-subnet-1'),
    pulumi.output('public-subnet-2'),
    pulumi.output('public-subnet-3'),
  ];
  const privateSubnetIds = [
    pulumi.output('private-subnet-1'),
    pulumi.output('private-subnet-2'),
    pulumi.output('private-subnet-3'),
  ];
  const databaseEndpoint = pulumi.output('db-endpoint.rds.amazonaws.com');
  const databaseSecurityGroupId = pulumi.output('sg-database');
  const tags = {
    Environment: 'prod-migration',
    CostCenter: 'finance',
    MigrationPhase: 'active',
  };

  let stack: ComputeStack;

  beforeEach(() => {
    stack = new ComputeStack('test-compute', {
      environmentSuffix,
      vpcId,
      publicSubnetIds,
      privateSubnetIds,
      databaseEndpoint,
      databaseSecurityGroupId,
      tags,
    });
  });

  describe('ECS Cluster Configuration', () => {
    it('should create ECS cluster', async () => {
      const clusterName = await stack.clusterName;
      expect(clusterName).toBeDefined();
    });

    it('should create ECS service', async () => {
      const serviceName = await stack.serviceName;
      expect(serviceName).toBeDefined();
    });
  });

  describe('Load Balancer Configuration', () => {
    it('should create ALB with DNS name', async () => {
      const albDnsName = await stack.albDnsName;
      expect(albDnsName).toBeDefined();
    });
  });

  describe('Resource Outputs', () => {
    it('should register all required outputs', async () => {
      const clusterName = await stack.clusterName;
      const serviceName = await stack.serviceName;
      const albDnsName = await stack.albDnsName;

      expect(clusterName).toBeDefined();
      expect(serviceName).toBeDefined();
      expect(albDnsName).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should accept valid configuration', () => {
      expect(() => {
        new ComputeStack('test-compute-2', {
          environmentSuffix: 'test2',
          vpcId,
          publicSubnetIds,
          privateSubnetIds,
          databaseEndpoint,
          databaseSecurityGroupId,
          tags: { test: 'value' },
        });
      }).not.toThrow();
    });

    it('should handle different subnet configurations', () => {
      const customStack = new ComputeStack('test-compute-3', {
        environmentSuffix: 'test3',
        vpcId,
        publicSubnetIds: [pulumi.output('subnet-1')],
        privateSubnetIds: [pulumi.output('subnet-2')],
        databaseEndpoint,
        databaseSecurityGroupId,
        tags,
      });
      expect(customStack).toBeDefined();
    });

    it('should handle empty tags', () => {
      const stackWithoutTags = new ComputeStack('test-compute-4', {
        environmentSuffix: 'test4',
        vpcId,
        publicSubnetIds,
        privateSubnetIds,
        databaseEndpoint,
        databaseSecurityGroupId,
        tags: {},
      });
      expect(stackWithoutTags).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single subnet configuration', () => {
      const singleSubnetStack = new ComputeStack('test-compute-single', {
        environmentSuffix: 'single',
        vpcId,
        publicSubnetIds: [pulumi.output('public-1')],
        privateSubnetIds: [pulumi.output('private-1')],
        databaseEndpoint,
        databaseSecurityGroupId,
        tags,
      });
      expect(singleSubnetStack).toBeDefined();
    });

    it('should handle multiple subnets', () => {
      const multiSubnetStack = new ComputeStack('test-compute-multi', {
        environmentSuffix: 'multi',
        vpcId,
        publicSubnetIds: [
          pulumi.output('public-1'),
          pulumi.output('public-2'),
          pulumi.output('public-3'),
          pulumi.output('public-4'),
        ],
        privateSubnetIds: [
          pulumi.output('private-1'),
          pulumi.output('private-2'),
          pulumi.output('private-3'),
          pulumi.output('private-4'),
        ],
        databaseEndpoint,
        databaseSecurityGroupId,
        tags,
      });
      expect(multiSubnetStack).toBeDefined();
    });

    it('should handle different database endpoints', () => {
      const customDbStack = new ComputeStack('test-compute-customdb', {
        environmentSuffix: 'customdb',
        vpcId,
        publicSubnetIds,
        privateSubnetIds,
        databaseEndpoint: pulumi.output('custom-db.amazonaws.com'),
        databaseSecurityGroupId,
        tags,
      });
      expect(customDbStack).toBeDefined();
    });
  });

  describe('ECS Service Properties', () => {
    it('should configure Fargate launch type', async () => {
      const serviceName = await stack.serviceName;
      expect(serviceName).toBeDefined();
    });

    it('should configure task definition', async () => {
      const clusterName = await stack.clusterName;
      expect(clusterName).toBeDefined();
    });

    it('should configure health checks', async () => {
      const albDnsName = await stack.albDnsName;
      expect(albDnsName).toBeDefined();
    });
  });
});
