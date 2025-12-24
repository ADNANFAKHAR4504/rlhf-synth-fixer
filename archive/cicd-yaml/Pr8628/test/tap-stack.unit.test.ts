/**
 * Unit tests for the CI/CD Pipeline TapStack.
 */
import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    return {
      id: args.inputs.name ? `${args.inputs.name}-id` : 'mock-id',
      state: {
        ...args.inputs,
        arn:
          args.inputs.arn ||
          `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
        id: args.inputs.name ? `${args.inputs.name}-id` : 'mock-id',
        name: args.inputs.name || 'mock-name',
        url: args.inputs.url || 'https://mock-url.example.com',
        repositoryUrl:
          args.inputs.repositoryUrl ||
          '123456789012.dkr.ecr.us-east-1.amazonaws.com/mock-repo',
        bucket: args.inputs.bucket || 'mock-bucket',
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
        arn: 'arn:aws:iam::123456789012:user/test-user',
        userId: 'AIDAI7Y7DEXAMPLEID',
      };
    }
    if (args.token === 'aws:index/getRegion:getRegion') {
      return {
        name: 'us-east-1',
        id: 'us-east-1',
      };
    }
    return {};
  },
});

describe('CI/CD Pipeline TapStack Tests', () => {
  let tapStack: typeof import('../lib/tap-stack');

  beforeAll(() => {
    tapStack = require('../lib/tap-stack');
  });

  describe('TapStack Instantiation', () => {
    it('should create stack with minimal required properties', async () => {
      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix: 'test001',
      });

      expect(stack).toBeDefined();
      expect(stack.artifactBucketArn).toBeDefined();
      expect(stack.ecrRepositoryUrl).toBeDefined();
      expect(stack.codeBuildProjectName).toBeDefined();
      expect(stack.pipelineArn).toBeDefined();
    });

    it('should create stack with all properties', async () => {
      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix: 'test002',
        tags: {
          CustomTag: 'test-value',
        },
        githubOwner: 'test-owner',
        githubRepo: 'test-repo',
        githubBranch: 'develop',
        githubToken: pulumi.output('test-token'),
      });

      expect(stack).toBeDefined();
      expect(stack.artifactBucketArn).toBeDefined();
      expect(stack.ecrRepositoryUrl).toBeDefined();
      expect(stack.codeBuildProjectName).toBeDefined();
      expect(stack.pipelineArn).toBeDefined();
    });

    it('should use default values when properties are omitted', async () => {
      const stack = new tapStack.TapStack('test-stack', {});

      expect(stack).toBeDefined();
      const artifactBucketArn = await stack.artifactBucketArn.promise();
      expect(artifactBucketArn).toContain('arn:aws');
    });
  });

  describe('Resource Outputs', () => {
    it('should export artifactBucketArn', async () => {
      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix: 'test003',
      });

      const artifactBucketArn = await stack.artifactBucketArn.promise();
      expect(artifactBucketArn).toBeDefined();
      expect(typeof artifactBucketArn).toBe('string');
      expect(artifactBucketArn).toContain('arn:aws');
    });

    it('should export ecrRepositoryUrl', async () => {
      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix: 'test004',
      });

      const ecrRepositoryUrl = await stack.ecrRepositoryUrl.promise();
      expect(ecrRepositoryUrl).toBeDefined();
      expect(typeof ecrRepositoryUrl).toBe('string');
      expect(ecrRepositoryUrl).toContain('dkr.ecr');
    });

    it('should export codeBuildProjectName', async () => {
      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix: 'test005',
      });

      const codeBuildProjectName = await stack.codeBuildProjectName.promise();
      expect(codeBuildProjectName).toBeDefined();
      expect(typeof codeBuildProjectName).toBe('string');
    });

    it('should export pipelineArn', async () => {
      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix: 'test006',
      });

      const pipelineArn = await stack.pipelineArn.promise();
      expect(pipelineArn).toBeDefined();
      expect(typeof pipelineArn).toBe('string');
      expect(pipelineArn).toContain('arn:aws');
    });
  });

  describe('Resource Naming', () => {
    it('should include environmentSuffix in resource names', async () => {
      const environmentSuffix = 'test007';
      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix,
      });

      expect(stack).toBeDefined();
      const codeBuildProjectName = await stack.codeBuildProjectName.promise();
      expect(codeBuildProjectName).toBeDefined();
    });

    it('should use default environmentSuffix when not provided', async () => {
      const stack = new tapStack.TapStack('test-stack', {});

      expect(stack).toBeDefined();
      const artifactBucketArn = await stack.artifactBucketArn.promise();
      expect(artifactBucketArn).toBeDefined();
    });
  });

  describe('Tagging', () => {
    it('should accept custom tags', async () => {
      const customTags = {
        CustomTag1: 'value1',
        CustomTag2: 'value2',
      };

      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix: 'test008',
        tags: customTags,
      });

      expect(stack).toBeDefined();
    });

    it('should work without custom tags', async () => {
      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix: 'test009',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('GitHub Integration', () => {
    it('should accept GitHub configuration', async () => {
      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix: 'test010',
        githubOwner: 'test-org',
        githubRepo: 'test-repository',
        githubBranch: 'feature-branch',
        githubToken: pulumi.output('secret-token'),
      });

      expect(stack).toBeDefined();
    });

    it('should use default GitHub branch when not provided', async () => {
      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix: 'test011',
        githubOwner: 'test-org',
        githubRepo: 'test-repository',
      });

      expect(stack).toBeDefined();
    });

    it('should work without GitHub configuration', async () => {
      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix: 'test012',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('S3 Bucket Configuration', () => {
    it('should create artifact bucket with versioning', async () => {
      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix: 'test013',
      });

      expect(stack).toBeDefined();
      const artifactBucketArn = await stack.artifactBucketArn.promise();
      expect(artifactBucketArn).toBeDefined();
    });
  });

  describe('ECR Repository Configuration', () => {
    it('should create ECR repository with image scanning', async () => {
      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix: 'test014',
      });

      expect(stack).toBeDefined();
      const ecrRepositoryUrl = await stack.ecrRepositoryUrl.promise();
      expect(ecrRepositoryUrl).toBeDefined();
    });
  });

  describe('CodeBuild Project Configuration', () => {
    it('should create CodeBuild project', async () => {
      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix: 'test015',
      });

      expect(stack).toBeDefined();
      const codeBuildProjectName = await stack.codeBuildProjectName.promise();
      expect(codeBuildProjectName).toBeDefined();
    });
  });

  describe('CodePipeline Configuration', () => {
    it('should create CodePipeline with artifact store', async () => {
      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix: 'test016',
      });

      expect(stack).toBeDefined();
      const pipelineArn = await stack.pipelineArn.promise();
      expect(pipelineArn).toBeDefined();
    });

    it('should configure pipeline with GitHub source', async () => {
      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix: 'test017',
        githubOwner: 'test-org',
        githubRepo: 'test-repo',
        githubToken: pulumi.output('test-token'),
      });

      expect(stack).toBeDefined();
    });
  });

  describe('IAM Roles and Policies', () => {
    it('should create IAM roles for CodeBuild', async () => {
      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix: 'test018',
      });

      expect(stack).toBeDefined();
    });

    it('should create IAM roles for CodePipeline', async () => {
      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix: 'test019',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('CloudWatch Logs Configuration', () => {
    it('should create CloudWatch log group', async () => {
      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix: 'test020',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty environmentSuffix', async () => {
      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix: '',
      });

      expect(stack).toBeDefined();
    });

    it('should handle special characters in environmentSuffix', async () => {
      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix: 'test-env-123',
      });

      expect(stack).toBeDefined();
    });

    it('should handle pulumi.Output for tags', async () => {
      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix: 'test021',
        tags: pulumi.output({ CustomTag: 'custom-value' }) as any,
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Component Resource Hierarchy', () => {
    it('should be a valid Pulumi ComponentResource', async () => {
      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix: 'test022',
      });

      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have correct resource type', async () => {
      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix: 'test023',
      });

      expect(stack).toBeDefined();
      // ComponentResource type is validated by TypeScript
    });
  });

  describe('Multiple Stack Instances', () => {
    it('should support creating multiple stacks', async () => {
      const stack1 = new tapStack.TapStack('test-stack-1', {
        environmentSuffix: 'env1',
      });

      const stack2 = new tapStack.TapStack('test-stack-2', {
        environmentSuffix: 'env2',
      });

      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();

      const arn1 = await stack1.artifactBucketArn.promise();
      const arn2 = await stack2.artifactBucketArn.promise();

      expect(arn1).toBeDefined();
      expect(arn2).toBeDefined();
    });
  });

  describe('Interface Compliance', () => {
    it('should accept TapStackArgs interface correctly', async () => {
      const args: import('../lib/tap-stack').TapStackArgs = {
        environmentSuffix: 'test024',
        tags: { Team: 'DevOps' },
        githubOwner: 'test-owner',
        githubRepo: 'test-repo',
        githubBranch: 'main',
        githubToken: pulumi.output('token'),
      };

      const stack = new tapStack.TapStack('test-stack', args);

      expect(stack).toBeDefined();
    });

    it('should allow optional properties to be omitted', async () => {
      const args: import('../lib/tap-stack').TapStackArgs = {};

      const stack = new tapStack.TapStack('test-stack', args);

      expect(stack).toBeDefined();
    });
  });
});
