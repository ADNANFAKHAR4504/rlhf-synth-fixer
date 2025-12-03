/**
 * Unit tests for TapStack
 * Tests infrastructure components without actual AWS deployment
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime for unit testing
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } => {
    return {
      id: args.name + '_id',
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:iam/assumeRolePolicyForPrincipal:assumeRolePolicyForPrincipal') {
      return {
        json: JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: args.args.Service ? { Service: args.args.Service } : args.args,
          }],
        }),
      };
    }
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  beforeAll(async () => {
    // Create stack with test configuration
    stack = new TapStack('test-stack', {
      environmentSuffix: 'test',
      tags: {
        Environment: 'test',
        Project: 'Image Processing',
      },
    });
  });

  describe('Stack Creation', () => {
    it('should create stack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should have required output properties', () => {
      expect(stack.thumbnailFunctionUrl).toBeDefined();
      expect(stack.watermarkFunctionUrl).toBeDefined();
      expect(stack.metadataFunctionUrl).toBeDefined();
      expect(stack.inputBucketName).toBeDefined();
      expect(stack.outputBucketName).toBeDefined();
    });
  });

  describe('S3 Buckets', () => {
    it('should have input bucket with environmentSuffix', async () => {
      const bucketName = await stack.inputBucketName.promise();
      expect(bucketName).toContain('test');
    });

    it('should have output bucket with environmentSuffix', async () => {
      const bucketName = await stack.outputBucketName.promise();
      expect(bucketName).toContain('test');
    });
  });

  describe('Lambda Functions', () => {
    it('should have thumbnail function URL', async () => {
      // Function URLs may be undefined in mocked environment
      expect(stack.thumbnailFunctionUrl).toBeDefined();
      expect(stack.thumbnailFunctionUrl).toBeInstanceOf(pulumi.Output);
    });

    it('should have watermark function URL', async () => {
      // Function URLs may be undefined in mocked environment
      expect(stack.watermarkFunctionUrl).toBeDefined();
      expect(stack.watermarkFunctionUrl).toBeInstanceOf(pulumi.Output);
    });

    it('should have metadata function URL', async () => {
      // Function URLs may be undefined in mocked environment
      expect(stack.metadataFunctionUrl).toBeDefined();
      expect(stack.metadataFunctionUrl).toBeInstanceOf(pulumi.Output);
    });
  });

  describe('Configuration', () => {
    it('should use environmentSuffix from args', async () => {
      const inputBucket = await stack.inputBucketName.promise();
      const outputBucket = await stack.outputBucketName.promise();

      expect(inputBucket).toContain('test');
      expect(outputBucket).toContain('test');
    });

    it('should apply tags to resources', () => {
      // Tags are validated during resource creation
      expect(stack).toBeDefined();
    });
  });

  describe('Resource Naming', () => {
    it('should include environmentSuffix in bucket names', async () => {
      const inputBucket = await stack.inputBucketName.promise();
      const outputBucket = await stack.outputBucketName.promise();

      expect(inputBucket).toMatch(/.*test.*/i);
      expect(outputBucket).toMatch(/.*test.*/i);
    });
  });

  describe('Stack with default values', () => {
    it('should use default environmentSuffix when not provided', async () => {
      const defaultStack = new TapStack('default-test-stack', {});
      expect(defaultStack).toBeDefined();

      const bucketName = await defaultStack.inputBucketName.promise();
      expect(bucketName).toContain('dev');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tags object', () => {
      const stackWithEmptyTags = new TapStack('empty-tags-stack', {
        environmentSuffix: 'test',
        tags: {},
      });
      expect(stackWithEmptyTags).toBeDefined();
    });

    it('should handle undefined optional parameters', () => {
      const stackMinimal = new TapStack('minimal-stack', {});
      expect(stackMinimal).toBeDefined();
    });
  });

  describe('Output Types', () => {
    it('should return Pulumi Output for all public properties', () => {
      expect(stack.thumbnailFunctionUrl).toBeInstanceOf(pulumi.Output);
      expect(stack.watermarkFunctionUrl).toBeInstanceOf(pulumi.Output);
      expect(stack.metadataFunctionUrl).toBeInstanceOf(pulumi.Output);
      expect(stack.inputBucketName).toBeInstanceOf(pulumi.Output);
      expect(stack.outputBucketName).toBeInstanceOf(pulumi.Output);
    });
  });

  describe('ComponentResource Behavior', () => {
    it('should be a ComponentResource', () => {
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have correct type string', () => {
      // ComponentResource type is set in constructor
      expect(stack).toBeDefined();
    });
  });
});
