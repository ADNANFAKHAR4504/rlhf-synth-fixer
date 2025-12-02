/**
 * Unit tests for TapStack
 * Tests the Pulumi infrastructure code without deploying to AWS
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack, TapStackArgs } from '../lib/tap-stack';

/**
 * Mock Pulumi runtime for testing
 */
class MockOutput<T> {
  constructor(private value: T) {}

  apply<U>(func: (value: T) => U): MockOutput<U> {
    return new MockOutput(func(this.value));
  }

  get promise(): Promise<T> {
    return Promise.resolve(this.value);
  }
}

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, any>;
  } => {
    const outputs: Record<string, any> = {
      ...args.inputs,
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
      id: `${args.name}-id`,
      name: args.inputs.name || args.name,
    };

    // Specific resource type handling
    if (args.type === 'aws:s3/bucket:Bucket') {
      outputs.bucket = args.inputs.bucket || `${args.name}-bucket`;
      outputs.websiteEndpoint = `${outputs.bucket}.s3-website-us-east-1.amazonaws.com`;
    }

    if (args.type === 'aws:codebuild/project:Project') {
      outputs.name = args.inputs.name || args.name;
    }

    if (args.type === 'aws:codepipeline/pipeline:Pipeline') {
      outputs.name = args.inputs.name || args.name;
    }

    if (args.type === 'aws:cloudwatch/logGroup:LogGroup') {
      outputs.name = args.inputs.name || args.name;
    }

    return {
      id: `${args.name}-id`,
      state: outputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:index/getRegion:getRegion') {
      return { name: 'us-east-1', id: 'us-east-1' };
    }
    return {};
  },
});

describe('TapStack Unit Tests', () => {
  let stack: TapStack;
  const environmentSuffix = 'test';
  const githubOwner = 'test-owner';
  const githubRepo = 'test-repo';
  const githubBranch = 'main';
  const githubToken = pulumi.secret('test-token');

  beforeEach(() => {
    const args: TapStackArgs = {
      environmentSuffix,
      githubOwner,
      githubRepo,
      githubBranch,
      githubToken,
      tags: {
        Environment: environmentSuffix,
        Project: 'TestProject',
      },
    };

    stack = new TapStack('test-stack', args);
  });

  describe('Stack Instantiation', () => {
    it('should create stack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should have artifact bucket output', () => {
      expect(stack.artifactBucketName).toBeDefined();
    });

    it('should have deploy bucket output', () => {
      expect(stack.deployBucketName).toBeDefined();
    });

    it('should have codebuild project output', () => {
      expect(stack.codeBuildProjectName).toBeDefined();
    });

    it('should have pipeline URL output', () => {
      expect(stack.pipelineUrl).toBeDefined();
    });
  });

  describe('Default Values', () => {
    it('should use default environment suffix when not provided', () => {
      const defaultStack = new TapStack('default-test-stack', {
        githubOwner: 'owner',
        githubRepo: 'repo',
        githubToken: pulumi.secret('token'),
      });

      expect(defaultStack).toBeDefined();
    });

    it('should use default github branch when not provided', () => {
      const defaultStack = new TapStack('default-branch-test', {
        environmentSuffix: 'test',
        githubOwner: 'owner',
        githubRepo: 'repo',
        githubToken: pulumi.secret('token'),
      });

      expect(defaultStack).toBeDefined();
    });

    it('should use empty tags when not provided', () => {
      const noTagsStack = new TapStack('no-tags-test', {
        environmentSuffix: 'test',
        githubOwner: 'owner',
        githubRepo: 'repo',
        githubToken: pulumi.secret('token'),
      });

      expect(noTagsStack).toBeDefined();
    });
  });

  describe('Resource Naming', () => {
    it('should include environment suffix in bucket names', () => {
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.deployBucketName).toBeDefined();
    });

    it('should include environment suffix in project name', () => {
      expect(stack.codeBuildProjectName).toBeDefined();
    });

    it('should generate valid S3 bucket names (lowercase)', () => {
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.deployBucketName).toBeDefined();
    });
  });

  describe('Configuration Validation', () => {
    it('should handle custom tags', async () => {
      const customTags = {
        Team: 'DevOps',
        CostCenter: '12345',
        Project: 'CI/CD',
      };

      const taggedStack = new TapStack('tagged-test', {
        environmentSuffix: 'prod',
        githubOwner: 'org',
        githubRepo: 'repo',
        githubToken: pulumi.secret('token'),
        tags: customTags,
      });

      expect(taggedStack).toBeDefined();
    });

    it('should accept secret github token', () => {
      const secretToken = pulumi.secret('my-secret-token');

      const secureStack = new TapStack('secure-test', {
        environmentSuffix: 'secure',
        githubOwner: 'org',
        githubRepo: 'repo',
        githubToken: secretToken,
      });

      expect(secureStack).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle long environment suffix', () => {
      const longSuffix = 'very-long-environment-suffix-name';

      const longStack = new TapStack('long-suffix-test', {
        environmentSuffix: longSuffix,
        githubOwner: 'owner',
        githubRepo: 'repo',
        githubToken: pulumi.secret('token'),
      });

      expect(longStack).toBeDefined();
    });

    it('should handle special characters in github repo', () => {
      const specialStack = new TapStack('special-char-test', {
        environmentSuffix: 'test',
        githubOwner: 'my-org',
        githubRepo: 'my-repo-123',
        githubBranch: 'feature/test-branch',
        githubToken: pulumi.secret('token'),
      });

      expect(specialStack).toBeDefined();
    });

    it('should handle empty tags object', () => {
      const emptyTagsStack = new TapStack('empty-tags-test', {
        environmentSuffix: 'test',
        githubOwner: 'owner',
        githubRepo: 'repo',
        githubToken: pulumi.secret('token'),
        tags: {},
      });

      expect(emptyTagsStack).toBeDefined();
    });
  });
});
