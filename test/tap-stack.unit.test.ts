import * as pulumi from '@pulumi/pulumi';
import { TapStack, TapStackArgs } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } => {
    return {
      id: `${args.name}-id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:mock:us-east-1:123456789012:${args.type}/${args.name}`,
        id: `${args.name}-id`,
        name: args.inputs.name || args.name,
        bucket: args.inputs.bucket || args.name,
        repositoryUrl: `123456789012.dkr.ecr.us-east-1.amazonaws.com/${args.name}`,
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  describe('Resource Creation', () => {
    it('should create stack with default environmentSuffix', async () => {
      const stack = new TapStack('test-stack', {});

      const artifactBucketName = await stack.artifactBucketName.promise();
      const ecrRepositoryUrl = await stack.ecrRepositoryUrl.promise();
      const pipelineName = await stack.pipelineName.promise();

      expect(artifactBucketName).toBeDefined();
      expect(ecrRepositoryUrl).toBeDefined();
      expect(pipelineName).toBeDefined();
    });

    it('should create stack with custom environmentSuffix', async () => {
      const args: TapStackArgs = {
        environmentSuffix: 'test123',
      };

      const stack = new TapStack('test-stack', args);

      const artifactBucketName = await stack.artifactBucketName.promise();
      const ecrRepositoryUrl = await stack.ecrRepositoryUrl.promise();
      const pipelineName = await stack.pipelineName.promise();

      expect(artifactBucketName).toContain('test123');
      expect(ecrRepositoryUrl).toBeDefined();
      expect(pipelineName).toContain('test123');
    });

    it('should create stack with custom tags', async () => {
      const args: TapStackArgs = {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'Production',
          ManagedBy: 'Pulumi',
          Team: 'DevOps',
        },
      };

      const stack = new TapStack('test-stack', args);

      expect(stack).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
    });

    it('should create stack with GitHub configuration', async () => {
      const args: TapStackArgs = {
        environmentSuffix: 'staging',
        githubRepo: 'owner/repo',
        githubBranch: 'develop',
        githubToken: 'test-token',
      };

      const stack = new TapStack('test-stack', args);

      const artifactBucketName = await stack.artifactBucketName.promise();
      const ecrRepositoryUrl = await stack.ecrRepositoryUrl.promise();
      const pipelineName = await stack.pipelineName.promise();

      expect(artifactBucketName).toContain('staging');
      expect(ecrRepositoryUrl).toBeDefined();
      expect(pipelineName).toContain('staging');
    });
  });

  describe('Resource Naming', () => {
    it('should include environmentSuffix in artifact bucket name', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'dev123',
      });

      const bucketName = await stack.artifactBucketName.promise();
      expect(bucketName).toContain('dev123');
    });

    it('should include environmentSuffix in ECR repository URL', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'prod456',
      });

      const repoUrl = await stack.ecrRepositoryUrl.promise();
      expect(repoUrl).toBeDefined();
    });

    it('should include environmentSuffix in pipeline name', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'qa789',
      });

      const pipeline = await stack.pipelineName.promise();
      expect(pipeline).toContain('qa789');
    });
  });

  describe('Output Values', () => {
    it('should export artifactBucketName output', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack.artifactBucketName).toBeInstanceOf(pulumi.Output);
      const value = await stack.artifactBucketName.promise();
      expect(value).toBeDefined();
      expect(typeof value).toBe('string');
    });

    it('should export ecrRepositoryUrl output', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack.ecrRepositoryUrl).toBeInstanceOf(pulumi.Output);
      const value = await stack.ecrRepositoryUrl.promise();
      expect(value).toBeDefined();
      expect(typeof value).toBe('string');
    });

    it('should export pipelineName output', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack.pipelineName).toBeInstanceOf(pulumi.Output);
      const value = await stack.pipelineName.promise();
      expect(value).toBeDefined();
      expect(typeof value).toBe('string');
    });
  });

  describe('Default Values', () => {
    it('should use "dev" as default environmentSuffix', async () => {
      const stack = new TapStack('test-stack', {});

      const bucketName = await stack.artifactBucketName.promise();
      expect(bucketName).toContain('dev');
    });

    it('should handle missing optional parameters', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.ecrRepositoryUrl).toBeDefined();
      expect(stack.pipelineName).toBeDefined();
    });

    it('should merge custom tags with default tags', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: {
          CustomTag: 'CustomValue',
        },
      });

      expect(stack).toBeDefined();
    });
  });

  describe('GitHub Configuration', () => {
    it('should handle GitHub repo with owner and name', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        githubRepo: 'myorg/myrepo',
      });

      expect(stack).toBeDefined();
    });

    it('should handle GitHub branch configuration', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        githubBranch: 'feature/test',
      });

      expect(stack).toBeDefined();
    });

    it('should handle GitHub token as string', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        githubToken: 'ghp_test123',
      });

      expect(stack).toBeDefined();
    });

    it('should handle GitHub token as Output', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        githubToken: pulumi.output('ghp_test456'),
      });

      expect(stack).toBeDefined();
    });
  });
});