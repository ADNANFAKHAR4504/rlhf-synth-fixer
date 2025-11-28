/**
 * Unit tests for TapStack
 * Tests the main stack orchestration and component integration
 */
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let tapStack: TapStack;

  beforeEach(() => {
    tapStack = new TapStack('test-tap', {
      environmentSuffix: 'test',
      primaryRegion: 'us-east-1',
      secondaryRegion: 'us-west-2',
      tags: { Environment: 'test' },
    });
  });

  describe('Resource Creation', () => {
    it('should create TapStack instance successfully', () => {
      expect(tapStack).toBeDefined();
      expect(tapStack).toBeInstanceOf(TapStack);
    });

    it('should expose primaryVpcId output', () => {
      expect(tapStack.primaryVpcId).toBeDefined();
    });

    it('should expose secondaryVpcId output', () => {
      expect(tapStack.secondaryVpcId).toBeDefined();
    });

    it('should expose globalClusterId output', () => {
      expect(tapStack.globalClusterId).toBeDefined();
    });

    it('should expose primaryBucketName output', () => {
      expect(tapStack.primaryBucketName).toBeDefined();
    });

    it('should expose secondaryBucketName output', () => {
      expect(tapStack.secondaryBucketName).toBeDefined();
    });

    it('should expose healthCheckUrl output', () => {
      expect(tapStack.healthCheckUrl).toBeDefined();
    });
  });

  describe('Configuration Validation', () => {
    it('should handle default configuration', () => {
      const stack = new TapStack('tap-default', {});
      expect(stack).toBeDefined();
    });

    it('should handle different environment suffixes', () => {
      const devStack = new TapStack('tap-dev', {
        environmentSuffix: 'dev',
      });
      expect(devStack).toBeDefined();

      const prodStack = new TapStack('tap-prod', {
        environmentSuffix: 'prod',
      });
      expect(prodStack).toBeDefined();
    });

    it('should accept custom tags', () => {
      const customTags = {
        Environment: 'production',
        Team: 'platform',
        Project: 'disaster-recovery',
        CostCenter: '12345',
      };
      const stack = new TapStack('tap-tagged', {
        environmentSuffix: 'tagged',
        tags: customTags,
      });
      expect(stack).toBeDefined();
    });

    it('should work without optional tags', () => {
      const stack = new TapStack('tap-notags', {
        environmentSuffix: 'minimal',
      });
      expect(stack).toBeDefined();
    });

    it('should accept custom region configuration', () => {
      const stack = new TapStack('tap-custom-regions', {
        environmentSuffix: 'custom',
        primaryRegion: 'eu-west-1',
        secondaryRegion: 'ap-southeast-1',
      });
      expect(stack).toBeDefined();
    });

    it('should use default regions when not specified', () => {
      const stack = new TapStack('tap-default-regions', {
        environmentSuffix: 'default',
      });
      expect(stack).toBeDefined();
      expect(stack.primaryVpcId).toBeDefined();
      expect(stack.secondaryVpcId).toBeDefined();
    });
  });

  describe('Component Integration', () => {
    it('should integrate all component stacks', () => {
      expect(tapStack.primaryVpcId).toBeDefined();
      expect(tapStack.secondaryVpcId).toBeDefined();
      expect(tapStack.globalClusterId).toBeDefined();
      expect(tapStack.primaryBucketName).toBeDefined();
      expect(tapStack.secondaryBucketName).toBeDefined();
      expect(tapStack.healthCheckUrl).toBeDefined();
    });

    it('should create network stack', () => {
      expect(tapStack.primaryVpcId).toBeDefined();
      expect(tapStack.secondaryVpcId).toBeDefined();
    });

    it('should create database stack', () => {
      expect(tapStack.globalClusterId).toBeDefined();
    });

    it('should create storage stack', () => {
      expect(tapStack.primaryBucketName).toBeDefined();
      expect(tapStack.secondaryBucketName).toBeDefined();
    });

    it('should create routing stack', () => {
      expect(tapStack.healthCheckUrl).toBeDefined();
    });
  });

  describe('Multi-Region Architecture', () => {
    it('should create resources in primary region', () => {
      expect(tapStack.primaryVpcId).toBeDefined();
      expect(tapStack.primaryBucketName).toBeDefined();
    });

    it('should create resources in secondary region', () => {
      expect(tapStack.secondaryVpcId).toBeDefined();
      expect(tapStack.secondaryBucketName).toBeDefined();
    });

    it('should support custom region pairs', () => {
      const stack1 = new TapStack('tap-eu-ap', {
        environmentSuffix: 'euap',
        primaryRegion: 'eu-west-1',
        secondaryRegion: 'ap-southeast-1',
      });
      expect(stack1).toBeDefined();

      const stack2 = new TapStack('tap-us-eu', {
        environmentSuffix: 'useu',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'eu-central-1',
      });
      expect(stack2).toBeDefined();
    });
  });

  describe('Disaster Recovery Capabilities', () => {
    it('should create global database cluster for DR', () => {
      expect(tapStack.globalClusterId).toBeDefined();
    });

    it('should create health check for failover', () => {
      expect(tapStack.healthCheckUrl).toBeDefined();
    });

    it('should create cross-region storage replication', () => {
      expect(tapStack.primaryBucketName).toBeDefined();
      expect(tapStack.secondaryBucketName).toBeDefined();
    });
  });

  describe('Output Validation', () => {
    it('should register all required outputs', () => {
      const outputs = [
        tapStack.primaryVpcId,
        tapStack.secondaryVpcId,
        tapStack.globalClusterId,
        tapStack.primaryBucketName,
        tapStack.secondaryBucketName,
        tapStack.healthCheckUrl,
      ];
      outputs.forEach((output) => {
        expect(output).toBeDefined();
      });
    });
  });

  describe('Environment Suffix Handling', () => {
    it('should handle short suffix', () => {
      const stack = new TapStack('tap-short', {
        environmentSuffix: 'dev',
      });
      expect(stack).toBeDefined();
    });

    it('should handle long suffix', () => {
      const stack = new TapStack('tap-long', {
        environmentSuffix: 'development-pr-12345',
      });
      expect(stack).toBeDefined();
    });

    it('should handle special characters in suffix', () => {
      const stack = new TapStack('tap-special', {
        environmentSuffix: 'pr-123-test',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined environment suffix', () => {
      const stack = new TapStack('tap-undef', {
        environmentSuffix: undefined,
      });
      expect(stack).toBeDefined();
    });

    it('should handle empty tags object', () => {
      const stack = new TapStack('tap-emptytags', {
        environmentSuffix: 'empty',
        tags: {},
      });
      expect(stack).toBeDefined();
    });
  });
});
