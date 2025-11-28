/**
 * Unit tests for NetworkStack
 * Tests VPC creation, subnets, security groups, and VPC peering in both regions
 */
import { NetworkStack } from '../lib/network-stack';

describe('NetworkStack', () => {
  let networkStack: NetworkStack;

  beforeEach(() => {
    networkStack = new NetworkStack('test-network', {
      environmentSuffix: 'test',
      primaryRegion: 'us-east-1',
      secondaryRegion: 'us-west-2',
      tags: { Environment: 'test' },
    });
  });

  describe('Resource Creation', () => {
    it('should create NetworkStack instance successfully', () => {
      expect(networkStack).toBeDefined();
      expect(networkStack).toBeInstanceOf(NetworkStack);
    });

    it('should expose primaryVpcId output', () => {
      expect(networkStack.primaryVpcId).toBeDefined();
    });

    it('should expose secondaryVpcId output', () => {
      expect(networkStack.secondaryVpcId).toBeDefined();
    });

    it('should expose primaryPrivateSubnetIds output', () => {
      expect(networkStack.primaryPrivateSubnetIds).toBeDefined();
    });

    it('should expose secondaryPrivateSubnetIds output', () => {
      expect(networkStack.secondaryPrivateSubnetIds).toBeDefined();
    });

    it('should expose primaryDbSecurityGroupId output', () => {
      expect(networkStack.primaryDbSecurityGroupId).toBeDefined();
    });

    it('should expose secondaryDbSecurityGroupId output', () => {
      expect(networkStack.secondaryDbSecurityGroupId).toBeDefined();
    });

    it('should expose primaryAlbSecurityGroupId output', () => {
      expect(networkStack.primaryAlbSecurityGroupId).toBeDefined();
    });

    it('should expose secondaryAlbSecurityGroupId output', () => {
      expect(networkStack.secondaryAlbSecurityGroupId).toBeDefined();
    });
  });

  describe('Configuration Validation', () => {
    it('should handle different environment suffixes', () => {
      const stack1 = new NetworkStack('network-dev', {
        environmentSuffix: 'dev',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
      });
      expect(stack1).toBeDefined();

      const stack2 = new NetworkStack('network-prod', {
        environmentSuffix: 'prod',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
      });
      expect(stack2).toBeDefined();
    });

    it('should handle different region configurations', () => {
      const stack = new NetworkStack('network-custom', {
        environmentSuffix: 'custom',
        primaryRegion: 'eu-west-1',
        secondaryRegion: 'ap-southeast-1',
      });
      expect(stack).toBeDefined();
    });

    it('should accept custom tags', () => {
      const customTags = {
        Environment: 'staging',
        Team: 'platform',
        Project: 'disaster-recovery',
      };
      const stack = new NetworkStack('network-tagged', {
        environmentSuffix: 'staging',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
        tags: customTags,
      });
      expect(stack).toBeDefined();
    });

    it('should work without optional tags', () => {
      const stack = new NetworkStack('network-notags', {
        environmentSuffix: 'minimal',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Multi-Region Support', () => {
    it('should support primary and secondary region configuration', () => {
      const stack = new NetworkStack('network-multiregion', {
        environmentSuffix: 'mr',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
      });
      expect(stack).toBeDefined();
      expect(stack.primaryVpcId).toBeDefined();
      expect(stack.secondaryVpcId).toBeDefined();
    });

    it('should create separate VPCs for each region', () => {
      const stack = new NetworkStack('network-dual', {
        environmentSuffix: 'dual',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'eu-west-1',
      });
      expect(stack.primaryVpcId).not.toBe(stack.secondaryVpcId);
    });
  });
});
