/**
 * Unit tests for ComputeStack
 * Tests Lambda@Edge, ALBs, and target groups
 */
import * as pulumi from '@pulumi/pulumi';
import { ComputeStack } from '../lib/compute-stack';

describe('ComputeStack', () => {
  let computeStack: ComputeStack;
  const mockVpcId = pulumi.output('vpc-12345');
  const mockSubnetIds = pulumi.output(['subnet-1', 'subnet-2', 'subnet-3']);
  const mockSecurityGroupId = pulumi.output('sg-12345');
  const mockDbEndpoint = pulumi.output('db-endpoint.region.rds.amazonaws.com');

  beforeEach(() => {
    computeStack = new ComputeStack('test-compute', {
      environmentSuffix: 'test',
      primaryRegion: 'us-east-1',
      secondaryRegion: 'us-west-2',
      primaryVpcId: mockVpcId,
      secondaryVpcId: mockVpcId,
      primarySubnetIds: mockSubnetIds,
      secondarySubnetIds: mockSubnetIds,
      primaryAlbSecurityGroupId: mockSecurityGroupId,
      secondaryAlbSecurityGroupId: mockSecurityGroupId,
      primaryDbEndpoint: mockDbEndpoint,
      secondaryDbEndpoint: mockDbEndpoint,
      tags: { Environment: 'test' },
    });
  });

  describe('Resource Creation', () => {
    it('should create ComputeStack instance successfully', () => {
      expect(computeStack).toBeDefined();
      expect(computeStack).toBeInstanceOf(ComputeStack);
    });

    it('should expose primaryAlbDns output', () => {
      expect(computeStack.primaryAlbDns).toBeDefined();
    });

    it('should expose secondaryAlbDns output', () => {
      expect(computeStack.secondaryAlbDns).toBeDefined();
    });

    it('should expose lambdaEdgeArn output', () => {
      expect(computeStack.lambdaEdgeArn).toBeDefined();
    });
  });

  describe('Configuration Validation', () => {
    it('should handle different environment suffixes', () => {
      const stack = new ComputeStack('compute-prod', {
        environmentSuffix: 'prod',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
        primaryVpcId: mockVpcId,
        secondaryVpcId: mockVpcId,
        primarySubnetIds: mockSubnetIds,
        secondarySubnetIds: mockSubnetIds,
        primaryAlbSecurityGroupId: mockSecurityGroupId,
        secondaryAlbSecurityGroupId: mockSecurityGroupId,
        primaryDbEndpoint: mockDbEndpoint,
        secondaryDbEndpoint: mockDbEndpoint,
      });
      expect(stack).toBeDefined();
    });

    it('should accept custom tags', () => {
      const customTags = {
        Environment: 'production',
        LoadBalancer: 'public',
        Monitoring: 'enabled',
      };
      const stack = new ComputeStack('compute-tagged', {
        environmentSuffix: 'tagged',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
        primaryVpcId: mockVpcId,
        secondaryVpcId: mockVpcId,
        primarySubnetIds: mockSubnetIds,
        secondarySubnetIds: mockSubnetIds,
        primaryAlbSecurityGroupId: mockSecurityGroupId,
        secondaryAlbSecurityGroupId: mockSecurityGroupId,
        primaryDbEndpoint: mockDbEndpoint,
        secondaryDbEndpoint: mockDbEndpoint,
        tags: customTags,
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Multi-Region Load Balancing', () => {
    it('should create ALBs in both regions', () => {
      expect(computeStack.primaryAlbDns).toBeDefined();
      expect(computeStack.secondaryAlbDns).toBeDefined();
    });

    it('should support different region configurations', () => {
      const stack = new ComputeStack('compute-multiregion', {
        environmentSuffix: 'mr',
        primaryRegion: 'eu-west-1',
        secondaryRegion: 'ap-southeast-1',
        primaryVpcId: mockVpcId,
        secondaryVpcId: mockVpcId,
        primarySubnetIds: mockSubnetIds,
        secondarySubnetIds: mockSubnetIds,
        primaryAlbSecurityGroupId: mockSecurityGroupId,
        secondaryAlbSecurityGroupId: mockSecurityGroupId,
        primaryDbEndpoint: mockDbEndpoint,
        secondaryDbEndpoint: mockDbEndpoint,
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Lambda@Edge Integration', () => {
    it('should create Lambda@Edge function', () => {
      expect(computeStack.lambdaEdgeArn).toBeDefined();
    });

    it('should integrate with database endpoints', () => {
      const primaryEndpoint = pulumi.output('primary-db.us-east-1.rds.amazonaws.com');
      const secondaryEndpoint = pulumi.output('secondary-db.us-west-2.rds.amazonaws.com');

      const stack = new ComputeStack('compute-db-integrated', {
        environmentSuffix: 'dbint',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
        primaryVpcId: mockVpcId,
        secondaryVpcId: mockVpcId,
        primarySubnetIds: mockSubnetIds,
        secondarySubnetIds: mockSubnetIds,
        primaryAlbSecurityGroupId: mockSecurityGroupId,
        secondaryAlbSecurityGroupId: mockSecurityGroupId,
        primaryDbEndpoint: primaryEndpoint,
        secondaryDbEndpoint: secondaryEndpoint,
      });
      expect(stack).toBeDefined();
    });
  });

  describe('VPC and Security Configuration', () => {
    it('should accept separate VPC configurations for each region', () => {
      const primaryVpc = pulumi.output('vpc-primary');
      const secondaryVpc = pulumi.output('vpc-secondary');

      const stack = new ComputeStack('compute-custom-vpc', {
        environmentSuffix: 'cvpc',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
        primaryVpcId: primaryVpc,
        secondaryVpcId: secondaryVpc,
        primarySubnetIds: mockSubnetIds,
        secondarySubnetIds: mockSubnetIds,
        primaryAlbSecurityGroupId: mockSecurityGroupId,
        secondaryAlbSecurityGroupId: mockSecurityGroupId,
        primaryDbEndpoint: mockDbEndpoint,
        secondaryDbEndpoint: mockDbEndpoint,
      });
      expect(stack).toBeDefined();
    });

    it('should accept security group configurations', () => {
      const primarySg = pulumi.output('sg-primary');
      const secondarySg = pulumi.output('sg-secondary');

      const stack = new ComputeStack('compute-custom-sg', {
        environmentSuffix: 'csg',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
        primaryVpcId: mockVpcId,
        secondaryVpcId: mockVpcId,
        primarySubnetIds: mockSubnetIds,
        secondarySubnetIds: mockSubnetIds,
        primaryAlbSecurityGroupId: primarySg,
        secondaryAlbSecurityGroupId: secondarySg,
        primaryDbEndpoint: mockDbEndpoint,
        secondaryDbEndpoint: mockDbEndpoint,
      });
      expect(stack).toBeDefined();
    });
  });
});
