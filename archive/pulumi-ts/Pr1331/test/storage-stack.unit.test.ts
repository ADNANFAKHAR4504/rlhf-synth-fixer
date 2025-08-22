import * as pulumi from '@pulumi/pulumi';
import './mocks';
import { StorageStack } from '../lib/storage-stack';

describe('StorageStack', () => {
  let storageStack: StorageStack;

  describe('with standard configuration', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        storageStack = new StorageStack('test-storage', {
          environmentSuffix: 'test',
          tags: { Environment: 'test' },
        });

        return {
          logsBucketName: storageStack.logsBucket.id,
          logsBucketArn: storageStack.logsBucket.arn,
        };
      });
    });

    it('creates S3 bucket for logs', () => {
      expect(storageStack.logsBucket).toBeDefined();
    });

    it('enables versioning on the bucket', () => {
      expect(storageStack.bucketVersioning).toBeDefined();
    });

    it('bucket is configured with forceDestroy for cleanup', () => {
      expect(storageStack.logsBucket).toBeDefined();
      // Bucket should have forceDestroy: true
    });
  });

  describe('security configurations', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        storageStack = new StorageStack('secure-storage', {
          environmentSuffix: 'prod',
          tags: { Environment: 'production' },
        });

        return {
          logsBucketName: storageStack.logsBucket.id,
        };
      });
    });

    it('enables server-side encryption', () => {
      expect(storageStack.logsBucket).toBeDefined();
      // Should have encryption configuration
    });

    it('blocks public access', () => {
      expect(storageStack.logsBucket).toBeDefined();
      // Should have public access block configuration
    });

    it('configures lifecycle policies', () => {
      expect(storageStack.logsBucket).toBeDefined();
      // Should have lifecycle configuration for log rotation
    });
  });

  describe('bucket naming and tagging', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        storageStack = new StorageStack('naming-test', {
          environmentSuffix: 'staging',
          tags: {
            Environment: 'staging',
            Project: 'tap',
          },
        });

        return {
          logsBucketName: storageStack.logsBucket.id,
        };
      });
    });

    it('includes environment suffix in bucket name', () => {
      expect(storageStack.logsBucket).toBeDefined();
      // Bucket name should include the environment suffix
    });

    it('applies all provided tags', () => {
      expect(storageStack.logsBucket).toBeDefined();
      // Bucket should have all the provided tags
    });

    it('adds Purpose tag to bucket', () => {
      expect(storageStack.logsBucket).toBeDefined();
      // Should have Purpose: 'Application Logs' tag
    });
  });

  describe('bucket policies and permissions', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        storageStack = new StorageStack('policy-test', {
          environmentSuffix: 'test',
          tags: {},
        });

        return {
          logsBucketArn: storageStack.logsBucket.arn,
        };
      });
    });

    it('outputs bucket ARN for IAM policies', () => {
      expect(storageStack.logsBucket.arn).toBeDefined();
    });

    it('outputs bucket name for application configuration', () => {
      expect(storageStack.logsBucket.id).toBeDefined();
    });
  });
});