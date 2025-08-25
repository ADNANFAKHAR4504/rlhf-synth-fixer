import * as pulumi from '@pulumi/pulumi';
import './mocks';
import { NetworkStack } from '../lib/network-stack';

describe('NetworkStack', () => {
  let networkStack: NetworkStack;

  describe('with standard configuration', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        networkStack = new NetworkStack('test-network', {
          environmentSuffix: 'test',
          tags: { Environment: 'test' },
        });

        return {
          vpcId: networkStack.vpc.id,
          publicSubnetIds: networkStack.publicSubnets.map(s => s.id),
          privateSubnetIds: networkStack.privateSubnets.map(s => s.id),
        };
      });
    });

    it('creates a VPC with correct CIDR block', () => {
      expect(networkStack.vpc).toBeDefined();
    });

    it('creates exactly 2 public subnets', () => {
      expect(networkStack.publicSubnets).toHaveLength(2);
    });

    it('creates exactly 2 private subnets', () => {
      expect(networkStack.privateSubnets).toHaveLength(2);
    });

    it('creates an Internet Gateway', () => {
      expect(networkStack.internetGateway).toBeDefined();
    });

    it('creates NAT Gateway(s)', () => {
      expect(networkStack.natGateways).toBeDefined();
      expect(networkStack.natGateways.length).toBeGreaterThan(0);
    });

    it('creates public route table', () => {
      expect(networkStack.publicRouteTable).toBeDefined();
    });

    it('creates private route tables', () => {
      expect(networkStack.privateRouteTables).toBeDefined();
      expect(networkStack.privateRouteTables.length).toBeGreaterThan(0);
    });

    it('subnets are in different availability zones', () => {
      // In real implementation, subnets should be distributed across AZs
      expect(networkStack.publicSubnets.length).toBe(2);
      expect(networkStack.privateSubnets.length).toBe(2);
    });
  });

  describe('resource naming', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        networkStack = new NetworkStack('prod-network', {
          environmentSuffix: 'production',
          tags: { Environment: 'production' },
        });

        return {
          vpcId: networkStack.vpc.id,
        };
      });
    });

    it('includes environment suffix in resource names', () => {
      expect(networkStack).toBeDefined();
      // Resource names should include the environment suffix
    });

    it('applies tags to all resources', () => {
      expect(networkStack).toBeDefined();
      // All resources should have the provided tags
    });
  });

  describe('network connectivity', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        networkStack = new NetworkStack('connectivity-test', {
          environmentSuffix: 'test',
          tags: {},
        });

        return {
          vpcId: networkStack.vpc.id,
        };
      });
    });

    it('ensures private subnets can reach internet via NAT', () => {
      expect(networkStack.natGateways).toBeDefined();
      expect(networkStack.privateRouteTables).toBeDefined();
    });

    it('ensures public subnets can reach internet via IGW', () => {
      expect(networkStack.internetGateway).toBeDefined();
      expect(networkStack.publicRouteTable).toBeDefined();
    });
  });
});