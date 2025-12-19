import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    return {
      id: args.inputs.name
        ? `${args.inputs.name}-id`
        : `${args.name}-${args.type}-id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
        bucket: args.inputs.bucket || `bucket-${args.name}`,
        name: args.inputs.name || args.name,
        keyId: 'mock-key-id',
        id: 'mock-resource-id',
        websiteEndpoint: args.inputs.website
          ? `${args.inputs.bucket}.s3-website-us-east-1.amazonaws.com`
          : undefined,
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  beforeAll(() => {
    // Set required environment variables
    process.env.ENVIRONMENT_SUFFIX = 'test123';
    process.env.AWS_REGION = 'us-east-1';
  });

  afterAll(() => {
    delete process.env.ENVIRONMENT_SUFFIX;
    delete process.env.AWS_REGION;
  });

  describe('Stack Instantiation', () => {
    it('should create TapStack successfully', async () => {
      stack = new TapStack('test-stack', {
        tags: { Environment: 'test', Team: 'qa' },
      });

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should have pipelineArn output', async () => {
      stack = new TapStack('test-stack-2', { tags: {} });

      expect(stack.pipelineArn).toBeDefined();

      const arnValue = await new Promise((resolve) => {
        stack.pipelineArn.apply((arn) => {
          resolve(arn);
          return arn;
        });
      });

      expect(arnValue).toBeTruthy();
      expect(typeof arnValue).toBe('string');
    });

    it('should have artifactBucketName output', async () => {
      stack = new TapStack('test-stack-3', { tags: {} });

      expect(stack.artifactBucketName).toBeDefined();

      const bucketName = await new Promise((resolve) => {
        stack.artifactBucketName.apply((name) => {
          resolve(name);
          return name;
        });
      });

      expect(bucketName).toBeTruthy();
      expect(typeof bucketName).toBe('string');
    });
  });

  describe('Resource Naming', () => {
    beforeEach(() => {
      process.env.ENVIRONMENT_SUFFIX = 'testenv';
    });

    it('should include environmentSuffix in resource names', async () => {
      stack = new TapStack('naming-test', { tags: {} });

      const bucketName = await new Promise((resolve) => {
        stack.artifactBucketName.apply((name) => {
          resolve(name);
          return name;
        });
      });

      // Check that environment suffix is included
      expect(bucketName).toContain('testenv');
    });
  });

  describe('Stack Configuration', () => {
    it('should handle missing environment suffix gracefully', async () => {
      delete process.env.ENVIRONMENT_SUFFIX;

      stack = new TapStack('config-test', { tags: {} });

      expect(stack).toBeDefined();
      expect(stack.pipelineArn).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();

      // Restore for other tests
      process.env.ENVIRONMENT_SUFFIX = 'test123';
    });

    it('should accept custom tags', async () => {
      const customTags = {
        Environment: 'production',
        Team: 'devops',
        Application: 'cicd',
      };

      stack = new TapStack('tags-test', { tags: customTags });

      expect(stack).toBeDefined();
    });
  });

  describe('Output Validation', () => {
    it('should register all required outputs', async () => {
      stack = new TapStack('outputs-test', { tags: {} });

      // Verify outputs are defined
      expect(stack.pipelineArn).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
    });

    it('should return valid ARN format for pipelineArn', async () => {
      stack = new TapStack('arn-test', { tags: {} });

      const arnValue = await new Promise((resolve) => {
        stack.pipelineArn.apply((arn) => {
          resolve(arn);
          return arn;
        });
      });

      // Check ARN format (should start with arn:aws:)
      expect(typeof arnValue).toBe('string');
      if (typeof arnValue === 'string') {
        expect(arnValue.startsWith('arn:aws:')).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tags object', async () => {
      stack = new TapStack('empty-tags-test', { tags: {} });

      expect(stack).toBeDefined();
      expect(stack.pipelineArn).toBeDefined();
    });

    it('should handle undefined tags', async () => {
      stack = new TapStack('undefined-tags-test', {});

      expect(stack).toBeDefined();
      expect(stack.pipelineArn).toBeDefined();
    });

    it('should use default values when environment suffix not set', async () => {
      const originalEnv = process.env.ENVIRONMENT_SUFFIX;
      delete process.env.ENVIRONMENT_SUFFIX;

      stack = new TapStack('default-env-test', { tags: {} });

      expect(stack).toBeDefined();
      expect(stack.pipelineArn).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();

      process.env.ENVIRONMENT_SUFFIX = originalEnv;
    });
  });
});
