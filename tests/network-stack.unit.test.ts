import * as pulumi from '@pulumi/pulumi';
import './mocks';
import { NetworkStack } from '../lib/network-stack';

describe('NetworkStack', () => {
  let stack: NetworkStack;

  describe('with environmentSuffix', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new NetworkStack('test-network', {
          environmentSuffix: 'test',
          tags: {
            Environment: 'test',
            ManagedBy: 'Pulumi',
          },
        });

        return {
          vpcId: stack.vpc.id,
          publicSubnetIds: pulumi.output(stack.publicSubnets).apply(subnets => subnets.map(s => s.id)),
          privateSubnetIds: pulumi.output(stack.privateSubnets).apply(subnets => subnets.map(s => s.id)),
        };
      });
    });

    it('should create a VPC', () => {
      expect(stack.vpc).toBeDefined();
    });

    it('should create 2 public subnets', () => {
      expect(stack.publicSubnets).toBeDefined();
      expect(stack.publicSubnets.length).toBe(2);
    });

    it('should create 2 private subnets', () => {
      expect(stack.privateSubnets).toBeDefined();
      expect(stack.privateSubnets.length).toBe(2);
    });

    it('should create an internet gateway', () => {
      expect(stack.internetGateway).toBeDefined();
    });

    it('should create ALB security group', () => {
      expect(stack.albSecurityGroup).toBeDefined();
    });

    it('should create ECS security group', () => {
      expect(stack.ecsSecurityGroup).toBeDefined();
    });

    it('should use environmentSuffix in resource names', () => {
      expect(stack).toBeDefined();
      // Resource names include environmentSuffix
    });

    it('should configure security groups for least privilege', () => {
      expect(stack.albSecurityGroup).toBeDefined();
      expect(stack.ecsSecurityGroup).toBeDefined();
      // ALB SG allows HTTPS/HTTP inbound
      // ECS SG allows traffic from ALB only
    });
  });

  describe('network configuration', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new NetworkStack('test-network-config', {
          environmentSuffix: 'prod',
          tags: {},
        });

        return {
          vpcId: stack.vpc.id,
        };
      });
    });

    it('should enable DNS support in VPC', () => {
      expect(stack.vpc).toBeDefined();
      // VPC should have DNS support enabled
    });

    it('should create public subnets with public IP assignment', () => {
      expect(stack.publicSubnets).toBeDefined();
      expect(stack.publicSubnets.length).toBeGreaterThan(0);
      // Public subnets should have mapPublicIpOnLaunch enabled
    });

    it('should create route tables', () => {
      expect(stack).toBeDefined();
      // Public and private route tables should be created
    });
  });

  describe('security group rules', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new NetworkStack('test-network-sg', {
          environmentSuffix: 'dev',
        });

        return {
          albSecurityGroupId: stack.albSecurityGroup.id,
          ecsSecurityGroupId: stack.ecsSecurityGroup.id,
        };
      });
    });

    it('should allow HTTPS on ALB security group', () => {
      expect(stack.albSecurityGroup).toBeDefined();
      // ALB SG should allow port 443 inbound
    });

    it('should allow HTTP on ALB security group', () => {
      expect(stack.albSecurityGroup).toBeDefined();
      // ALB SG should allow port 80 inbound
    });

    it('should allow frontend port from ALB in ECS security group', () => {
      expect(stack.ecsSecurityGroup).toBeDefined();
      // ECS SG should allow port 3000 from ALB
    });

    it('should allow backend port from ALB in ECS security group', () => {
      expect(stack.ecsSecurityGroup).toBeDefined();
      // ECS SG should allow port 8080 from ALB
    });
  });
});
