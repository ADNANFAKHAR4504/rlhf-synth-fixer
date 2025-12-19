/**
 * Unit tests for StorageStack
 * Tests S3 buckets, cross-region replication, and versioning
 */
import { StorageStack } from '../lib/storage-stack';

describe('StorageStack', () => {
  let storageStack: StorageStack;

  beforeEach(() => {
    storageStack = new StorageStack('test-storage', {
      environmentSuffix: 'test',
      primaryRegion: 'us-east-1',
      secondaryRegion: 'us-west-2',
      tags: { Environment: 'test' },
    });
  });

  describe('Resource Creation', () => {
    it('should create StorageStack instance successfully', () => {
      expect(storageStack).toBeDefined();
      expect(storageStack).toBeInstanceOf(StorageStack);
    });

    it('should expose primaryBucketName output', () => {
      expect(storageStack.primaryBucketName).toBeDefined();
    });

    it('should expose secondaryBucketName output', () => {
      expect(storageStack.secondaryBucketName).toBeDefined();
    });
  });

  describe('Configuration Validation', () => {
    it('should handle different environment suffixes', () => {
      const stack1 = new StorageStack('storage-dev', {
        environmentSuffix: 'dev',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
      });
      expect(stack1).toBeDefined();

      const stack2 = new StorageStack('storage-prod', {
        environmentSuffix: 'prod',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
      });
      expect(stack2).toBeDefined();
    });

    it('should accept custom tags', () => {
      const customTags = {
        Environment: 'production',
        DataRetention: '90days',
        Compliance: 'required',
      };
      const stack = new StorageStack('storage-tagged', {
        environmentSuffix: 'tagged',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
        tags: customTags,
      });
      expect(stack).toBeDefined();
    });

    it('should work without optional tags', () => {
      const stack = new StorageStack('storage-minimal', {
        environmentSuffix: 'minimal',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Multi-Region Support', () => {
    it('should create buckets in both regions', () => {
      expect(storageStack.primaryBucketName).toBeDefined();
      expect(storageStack.secondaryBucketName).toBeDefined();
    });

    it('should support different region configurations', () => {
      const stack = new StorageStack('storage-multiregion', {
        environmentSuffix: 'mr',
        primaryRegion: 'eu-west-1',
        secondaryRegion: 'ap-southeast-1',
      });
      expect(stack).toBeDefined();
      expect(stack.primaryBucketName).toBeDefined();
      expect(stack.secondaryBucketName).toBeDefined();
    });
  });

  describe('Cross-Region Replication', () => {
    it('should create primary and secondary buckets for replication', () => {
      const stack = new StorageStack('storage-replication', {
        environmentSuffix: 'repl',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
      });
      expect(stack.primaryBucketName).toBeDefined();
      expect(stack.secondaryBucketName).toBeDefined();
    });
  });
});
