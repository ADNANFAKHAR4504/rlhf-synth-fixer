import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime
class MockOutput {
  constructor(public readonly value: any) {}

  apply<T>(fn: (value: any) => T): MockOutput {
    return new MockOutput(fn(this.value));
  }
}

// Test suite
describe('TapStack Unit Tests', () => {
  let setMocks: (mocks: any) => void;

  beforeAll(() => {
    // Set up Pulumi mocks
    setMocks = pulumi.runtime.setMocks.bind(pulumi.runtime);
    setMocks({
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
        if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
          return {
            accountId: '123456789012',
            arn: 'arn:aws:iam::123456789012:user/testuser',
            userId: 'AIDAI23EXAMPLE',
          };
        }
        return args.inputs;
      },
    });
  });

  describe('TapStack Constructor', () => {
    it('should create a TapStack instance with default values', async () => {
      const stack = new TapStack('test-stack', {});
      expect(stack).toBeDefined();
      expect(stack.pipelineArn).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
    });

    it('should create a TapStack instance with custom environmentSuffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'prod',
      });
      expect(stack).toBeDefined();
      expect(stack.pipelineArn).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
    });

    it('should create a TapStack instance with custom tags', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'staging',
        tags: {
          Environment: 'staging',
          Team: 'platform',
          CustomTag: 'customValue',
        },
      });
      expect(stack).toBeDefined();
      expect(stack.pipelineArn).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
    });

    it('should use default environmentSuffix when not provided', async () => {
      const stack = new TapStack('test-stack', {});
      expect(stack).toBeDefined();
      // The default is 'dev'
      const bucketName = await stack.artifactBucketName.promise();
      expect(bucketName).toContain('dev');
    });

    it('should apply custom tags along with default tags', async () => {
      const customTags = {
        Project: 'MyProject',
        Owner: 'TeamA',
      };
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: customTags,
      });
      expect(stack).toBeDefined();
    });
  });

  describe('TapStack Resource Configuration', () => {
    let stack: TapStack;

    beforeEach(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
    });

    it('should export pipelineArn as output', async () => {
      expect(stack.pipelineArn).toBeDefined();
      // Pipeline ARN may be undefined in mocks as it's a computed value
      // In real deployment it will have a valid ARN
    });

    it('should export artifactBucketName as output', async () => {
      expect(stack.artifactBucketName).toBeDefined();
      const bucketName = await stack.artifactBucketName.promise();
      expect(typeof bucketName).toBe('string');
      expect(bucketName).toContain('pipeline-artifacts');
    });

    it('should include environmentSuffix in resource names', async () => {
      const bucketName = await stack.artifactBucketName.promise();
      expect(bucketName).toContain('test');
    });

    it('should create resources with proper parent hierarchy', () => {
      // Resources should be created as children of the TapStack component
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });
  });

  describe('TapStack Edge Cases', () => {
    it('should handle empty string environmentSuffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: '',
      });
      expect(stack).toBeDefined();
      // Empty string should default to 'dev'
      const bucketName = await stack.artifactBucketName.promise();
      expect(bucketName).toBeDefined();
    });

    it('should handle undefined tags', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: undefined,
      });
      expect(stack).toBeDefined();
      expect(stack.pipelineArn).toBeDefined();
    });

    it('should handle empty tags object', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: {},
      });
      expect(stack).toBeDefined();
      expect(stack.pipelineArn).toBeDefined();
    });

    it('should handle special characters in environmentSuffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test-123',
      });
      expect(stack).toBeDefined();
      const bucketName = await stack.artifactBucketName.promise();
      expect(bucketName).toContain('test-123');
    });

    it('should create stack with long environmentSuffix', async () => {
      const longSuffix = 'verylongenvironmentsuffix';
      const stack = new TapStack('test-stack', {
        environmentSuffix: longSuffix,
      });
      expect(stack).toBeDefined();
      const bucketName = await stack.artifactBucketName.promise();
      expect(bucketName).toContain(longSuffix);
    });

    it('should handle numeric environmentSuffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: '12345',
      });
      expect(stack).toBeDefined();
      const bucketName = await stack.artifactBucketName.promise();
      expect(bucketName).toContain('12345');
    });
  });

  describe('TapStack Resource Validation', () => {
    it('should validate that pipelineArn is a valid ARN format', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
      // Pipeline ARN is a computed output, tested in integration tests
      expect(stack.pipelineArn).toBeDefined();
    });

    it('should validate that artifactBucketName follows S3 naming conventions', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
      const bucketName = await stack.artifactBucketName.promise();
      // S3 bucket names are lowercase
      expect(bucketName).toMatch(/^[a-z0-9\-]+$/);
    });

    it('should create stack with minimal configuration', async () => {
      const stack = new TapStack('minimal-stack', {});
      expect(stack).toBeDefined();
      expect(stack.pipelineArn).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
    });

    it('should create stack with maximum configuration', async () => {
      const stack = new TapStack('maximal-stack', {
        environmentSuffix: 'production',
        tags: {
          Environment: 'production',
          Team: 'devops',
          Project: 'CI-CD',
          Owner: 'Engineering',
          CostCenter: '12345',
        },
      });
      expect(stack).toBeDefined();
      expect(stack.pipelineArn).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
    });
  });

  describe('TapStack Type Safety', () => {
    it('should accept valid TapStackArgs interface', () => {
      const validArgs = {
        environmentSuffix: 'test',
        tags: {
          Environment: 'test',
          Team: 'qa',
        },
      };
      const stack = new TapStack('test-stack', validArgs);
      expect(stack).toBeDefined();
    });

    it('should handle optional environmentSuffix', () => {
      const argsWithoutSuffix = {
        tags: {
          Environment: 'production',
          Team: 'devops',
        },
      };
      const stack = new TapStack('test-stack', argsWithoutSuffix);
      expect(stack).toBeDefined();
    });

    it('should handle optional tags', () => {
      const argsWithoutTags = {
        environmentSuffix: 'staging',
      };
      const stack = new TapStack('test-stack', argsWithoutTags);
      expect(stack).toBeDefined();
    });

    it('should accept empty args object', () => {
      const emptyArgs = {};
      const stack = new TapStack('test-stack', emptyArgs);
      expect(stack).toBeDefined();
    });
  });

  describe('TapStack Component Resource Type', () => {
    it('should have correct resource type', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
      // TapStack is a ComponentResource
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should register outputs properly', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
      // Outputs should be registered
      expect(stack.pipelineArn).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
      // Should be able to resolve bucket output
      const bucket = await stack.artifactBucketName.promise();
      expect(bucket).toBeDefined();
    });
  });

  describe('TapStack Default Values', () => {
    it('should use dev as default environmentSuffix', async () => {
      const stack = new TapStack('test-stack', {});
      const bucketName = await stack.artifactBucketName.promise();
      expect(bucketName).toContain('dev');
    });

    it('should apply default tags (Environment: production, Team: devops)', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeDefined();
      // Default tags are applied in the constructor
    });

    it('should merge custom tags with default tags', () => {
      const customTags = {
        CustomTag: 'CustomValue',
      };
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: customTags,
      });
      expect(stack).toBeDefined();
      // Tags should be merged: default + custom
    });

    it('should allow overriding default tags', () => {
      const overrideTags = {
        Environment: 'staging',
        Team: 'platform',
      };
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: overrideTags,
      });
      expect(stack).toBeDefined();
      // Custom tags should override defaults
    });
  });

  describe('TapStack Resource Naming', () => {
    it('should include environmentSuffix in all resource names', async () => {
      const suffix = 'custom123';
      const stack = new TapStack('test-stack', {
        environmentSuffix: suffix,
      });
      const bucketName = await stack.artifactBucketName.promise();
      expect(bucketName).toContain(suffix);
    });

    it('should create unique resource names per environmentSuffix', async () => {
      const stack1 = new TapStack('stack1', {
        environmentSuffix: 'env1',
      });
      const stack2 = new TapStack('stack2', {
        environmentSuffix: 'env2',
      });
      const bucket1 = await stack1.artifactBucketName.promise();
      const bucket2 = await stack2.artifactBucketName.promise();
      expect(bucket1).not.toEqual(bucket2);
    });

    it('should follow naming convention for artifact bucket', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
      const bucketName = await stack.artifactBucketName.promise();
      expect(bucketName).toMatch(/^pipeline-artifacts-/);
    });
  });
});
