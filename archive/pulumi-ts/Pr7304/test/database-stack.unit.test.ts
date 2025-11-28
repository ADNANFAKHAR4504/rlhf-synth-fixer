/**
 * Unit tests for DatabaseStack
 * Tests Aurora Global Database, cluster parameter groups, and instances
 */
import * as pulumi from '@pulumi/pulumi';
import { DatabaseStack } from '../lib/database-stack';

describe('DatabaseStack', () => {
  let databaseStack: DatabaseStack;
  const mockVpcId = pulumi.output('vpc-12345');
  const mockSubnetIds = pulumi.output(['subnet-1', 'subnet-2', 'subnet-3']);
  const mockSecurityGroupId = pulumi.output('sg-12345');

  beforeEach(() => {
    databaseStack = new DatabaseStack('test-database', {
      environmentSuffix: 'test',
      primaryRegion: 'us-east-1',
      secondaryRegion: 'us-west-2',
      primaryVpcId: mockVpcId,
      secondaryVpcId: mockVpcId,
      primarySubnetIds: mockSubnetIds,
      secondarySubnetIds: mockSubnetIds,
      primarySecurityGroupId: mockSecurityGroupId,
      secondarySecurityGroupId: mockSecurityGroupId,
      tags: { Environment: 'test' },
    });
  });

  describe('Resource Creation', () => {
    it('should create DatabaseStack instance successfully', () => {
      expect(databaseStack).toBeDefined();
      expect(databaseStack).toBeInstanceOf(DatabaseStack);
    });

    it('should expose globalClusterId output', () => {
      expect(databaseStack.globalClusterId).toBeDefined();
    });

    it('should expose primaryClusterId output', () => {
      expect(databaseStack.primaryClusterId).toBeDefined();
    });

    it('should expose secondaryClusterId output', () => {
      expect(databaseStack.secondaryClusterId).toBeDefined();
    });

    it('should expose primaryClusterEndpoint output', () => {
      expect(databaseStack.primaryClusterEndpoint).toBeDefined();
    });

    it('should expose secondaryClusterEndpoint output', () => {
      expect(databaseStack.secondaryClusterEndpoint).toBeDefined();
    });
  });

  describe('Configuration Validation', () => {
    it('should handle different environment suffixes', () => {
      const stack = new DatabaseStack('db-prod', {
        environmentSuffix: 'prod',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
        primaryVpcId: mockVpcId,
        secondaryVpcId: mockVpcId,
        primarySubnetIds: mockSubnetIds,
        secondarySubnetIds: mockSubnetIds,
        primarySecurityGroupId: mockSecurityGroupId,
        secondarySecurityGroupId: mockSecurityGroupId,
      });
      expect(stack).toBeDefined();
    });

    it('should accept custom tags', () => {
      const customTags = {
        Environment: 'production',
        DataClassification: 'sensitive',
        BackupPolicy: 'required',
      };
      const stack = new DatabaseStack('db-tagged', {
        environmentSuffix: 'prod',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
        primaryVpcId: mockVpcId,
        secondaryVpcId: mockVpcId,
        primarySubnetIds: mockSubnetIds,
        secondarySubnetIds: mockSubnetIds,
        primarySecurityGroupId: mockSecurityGroupId,
        secondarySecurityGroupId: mockSecurityGroupId,
        tags: customTags,
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Global Database Support', () => {
    it('should create global cluster with primary and secondary', () => {
      expect(databaseStack.globalClusterId).toBeDefined();
      expect(databaseStack.primaryClusterId).toBeDefined();
      expect(databaseStack.secondaryClusterId).toBeDefined();
    });

    it('should provide separate endpoints for primary and secondary', () => {
      expect(databaseStack.primaryClusterEndpoint).toBeDefined();
      expect(databaseStack.secondaryClusterEndpoint).toBeDefined();
    });
  });

  describe('Multi-Region Configuration', () => {
    it('should support different regions for primary and secondary', () => {
      const stack = new DatabaseStack('db-multiregion', {
        environmentSuffix: 'mr',
        primaryRegion: 'eu-west-1',
        secondaryRegion: 'ap-southeast-1',
        primaryVpcId: mockVpcId,
        secondaryVpcId: mockVpcId,
        primarySubnetIds: mockSubnetIds,
        secondarySubnetIds: mockSubnetIds,
        primarySecurityGroupId: mockSecurityGroupId,
        secondarySecurityGroupId: mockSecurityGroupId,
      });
      expect(stack).toBeDefined();
    });
  });

  describe('VPC and Subnet Configuration', () => {
    it('should accept VPC and subnet configuration for both regions', () => {
      const primaryVpc = pulumi.output('vpc-primary');
      const secondaryVpc = pulumi.output('vpc-secondary');
      const primarySubnets = pulumi.output(['subnet-p1', 'subnet-p2']);
      const secondarySubnets = pulumi.output(['subnet-s1', 'subnet-s2']);

      const stack = new DatabaseStack('db-custom-vpc', {
        environmentSuffix: 'custom',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
        primaryVpcId: primaryVpc,
        secondaryVpcId: secondaryVpc,
        primarySubnetIds: primarySubnets,
        secondarySubnetIds: secondarySubnets,
        primarySecurityGroupId: mockSecurityGroupId,
        secondarySecurityGroupId: mockSecurityGroupId,
      });
      expect(stack).toBeDefined();
    });

    it('should accept security group configuration', () => {
      const primarySg = pulumi.output('sg-primary');
      const secondarySg = pulumi.output('sg-secondary');

      const stack = new DatabaseStack('db-custom-sg', {
        environmentSuffix: 'sg',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
        primaryVpcId: mockVpcId,
        secondaryVpcId: mockVpcId,
        primarySubnetIds: mockSubnetIds,
        secondarySubnetIds: mockSubnetIds,
        primarySecurityGroupId: primarySg,
        secondarySecurityGroupId: secondarySg,
      });
      expect(stack).toBeDefined();
    });
  });
});
