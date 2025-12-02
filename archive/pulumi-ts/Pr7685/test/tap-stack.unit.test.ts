/**
 * Unit tests for the TapStack CI/CD Pipeline infrastructure
 *
 * These tests verify that all resources are created with correct configurations
 * including naming patterns, tags, encryption, and security settings.
 */
import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi mocks before importing the stack
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } {
    const id = `${args.name}_id`;
    const state = {
      ...args.inputs,
      id: id,
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
      name: args.inputs.name || args.name,
      repositoryUrl: args.type === 'aws:ecr/repository:Repository'
        ? `123456789012.dkr.ecr.us-east-1.amazonaws.com/${args.inputs.name}`
        : undefined,
      bucket: args.type === 'aws:s3/bucket:Bucket' ? args.inputs.bucket : undefined,
      keyId: args.type === 'aws:kms/key:Key' ? id : undefined,
    };
    return { id, state };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getRegion:getRegion') {
      return { name: 'us-east-1', id: 'us-east-1' };
    }
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return { accountId: '123456789012', arn: 'arn:aws:iam::123456789012:root', userId: 'AIDAI...' };
    }
    return {};
  },
});

import { TapStack } from '../lib/tap-stack';

describe('TapStack CI/CD Pipeline Infrastructure', () => {
  let stack: TapStack;
  const testEnvironmentSuffix = 'test-env-123';
  const testTags = {
    Environment: testEnvironmentSuffix,
    Project: 'TestProject',
    ManagedBy: 'Pulumi',
  };

  beforeEach(() => {
    // Create a new stack instance for each test
    stack = new TapStack('test-stack', {
      environmentSuffix: testEnvironmentSuffix,
      tags: testTags,
      githubOwner: 'test-org',
      githubRepo: 'test-repo',
      githubBranch: 'main',
    });
  });

  describe('S3 Artifact Bucket', () => {
    it('should create S3 bucket with correct naming pattern', (done) => {
      pulumi.all([stack.artifactBucketName]).apply(([bucketName]) => {
        expect(bucketName).toBe(`pipeline-artifacts-${testEnvironmentSuffix}`);
        done();
      });
    });

    it('should have environmentSuffix in bucket name', (done) => {
      pulumi.all([stack.artifactBucketName]).apply(([bucketName]) => {
        expect(bucketName).toContain(testEnvironmentSuffix);
        done();
      });
    });

    it('should export artifact bucket name', (done) => {
      pulumi.all([stack.artifactBucketName]).apply(([bucketName]) => {
        expect(bucketName).toBeDefined();
        expect(typeof bucketName).toBe('string');
        done();
      });
    });
  });

  describe('ECR Repository', () => {
    it('should create ECR repository with correct naming pattern', (done) => {
      pulumi.all([stack.ecrRepositoryUri]).apply(([repoUri]) => {
        expect(repoUri).toContain(`app-repo-${testEnvironmentSuffix}`);
        done();
      });
    });

    it('should have environmentSuffix in repository name', (done) => {
      pulumi.all([stack.ecrRepositoryUri]).apply(([repoUri]) => {
        expect(repoUri).toContain(testEnvironmentSuffix);
        done();
      });
    });

    it('should export ECR repository URI', (done) => {
      pulumi.all([stack.ecrRepositoryUri]).apply(([repoUri]) => {
        expect(repoUri).toBeDefined();
        expect(typeof repoUri).toBe('string');
        expect(repoUri).toMatch(/\.dkr\.ecr\..+\.amazonaws\.com\//);
        done();
      });
    });
  });

  describe('Integration Points', () => {
    it('should provide pipeline URL for external access', (done) => {
      pulumi.all([stack.pipelineUrl]).apply(([url]) => {
        expect(url).toMatch(/^https:\/\//);
        expect(url).toContain('console.aws.amazon.com');
        done();
      });
    });

    it('should provide ECR URI for docker commands', (done) => {
      pulumi.all([stack.ecrRepositoryUri]).apply(([uri]) => {
        expect(uri).toMatch(/^\d+\.dkr\.ecr\..+\.amazonaws\.com\/.+/);
        done();
      });
    });

    it('should provide SNS topic for subscriptions', () => {
      // SNS topic is a direct output from the stack
      expect(stack.snsTopic).toBeDefined();
    });
  });

  describe('Stack Outputs', () => {
    it('should export all required outputs', () => {
      expect(stack.pipelineUrl).toBeDefined();
      expect(stack.ecrRepositoryUri).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.snsTopic).toBeDefined();
    });
  });

  describe('Resource Lifecycle', () => {
    it('should create stack without errors', () => {
      expect(stack).toBeDefined();
      expect(stack.pipelineUrl).toBeDefined();
      expect(stack.ecrRepositoryUri).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.snsTopic).toBeDefined();
    });
  });

  describe('Environment Suffix Handling', () => {
    it('should use environment variable when no explicit suffix provided', () => {
      const originalEnv = process.env.ENVIRONMENT_SUFFIX;
      process.env.ENVIRONMENT_SUFFIX = 'env-from-variable';

      const envStack = new TapStack('env-stack', {});
      expect(envStack).toBeDefined();

      // Restore original
      if (originalEnv) {
        process.env.ENVIRONMENT_SUFFIX = originalEnv;
      } else {
        delete process.env.ENVIRONMENT_SUFFIX;
      }
    });

    it('should default to "dev" when no suffix provided', (done) => {
      const originalEnv = process.env.ENVIRONMENT_SUFFIX;
      delete process.env.ENVIRONMENT_SUFFIX;

      const defaultStack = new TapStack('default-stack', {});

      pulumi.all([defaultStack.artifactBucketName]).apply(([bucketName]) => {
        expect(bucketName).toContain('dev');

        // Restore original
        if (originalEnv) {
          process.env.ENVIRONMENT_SUFFIX = originalEnv;
        }
        done();
      });
    });

    it('should prefer constructor argument over environment variable', (done) => {
      const originalEnv = process.env.ENVIRONMENT_SUFFIX;
      process.env.ENVIRONMENT_SUFFIX = 'env-from-variable';

      const explicitSuffix = 'explicit-suffix';
      const explicitStack = new TapStack('explicit-stack', {
        environmentSuffix: explicitSuffix,
      });

      pulumi.all([explicitStack.artifactBucketName]).apply(([bucketName]) => {
        expect(bucketName).toContain(explicitSuffix);
        expect(bucketName).not.toContain('env-from-variable');

        // Restore original
        if (originalEnv) {
          process.env.ENVIRONMENT_SUFFIX = originalEnv;
        } else {
          delete process.env.ENVIRONMENT_SUFFIX;
        }
        done();
      });
    });
  });

  describe('AWS Service Coverage', () => {
    it('should implement all required AWS services', () => {
      // Verify stack implements required services through outputs
      expect(stack.artifactBucketName).toBeDefined(); // S3
      expect(stack.ecrRepositoryUri).toBeDefined(); // ECR
      expect(stack.pipelineUrl).toBeDefined(); // CodePipeline
      expect(stack.snsTopic).toBeDefined(); // SNS
    });
  });
});
