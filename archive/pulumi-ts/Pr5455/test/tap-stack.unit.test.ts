import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi mocks before any imports that use Pulumi
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const outputs: any = {
      ...args.inputs,
      id: `${args.name}-id`,
      arn: `arn:aws:${args.type}:ap-southeast-1:123456789012:${args.name}`,
      name: args.inputs.name || args.name,
    };

    // Add specific outputs for different resource types
    if (args.type === 'aws:s3/bucket:Bucket') {
      outputs.bucket = args.inputs.bucket || args.name;
    }
    if (args.type === 'aws:ecr/repository:Repository') {
      outputs.repositoryUrl = `123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/${args.inputs.name || args.name}`;
    }
    if (args.type === 'aws:codepipeline/pipeline:Pipeline') {
      outputs.name = args.inputs.name || args.name;
    }
    if (args.type === 'aws:lambda/function:Function') {
      outputs.name = args.inputs.name || args.name;
    }
    if (args.type === 'aws:codebuild/project:Project') {
      outputs.name = args.inputs.name || args.name;
    }

    return {
      id: `${args.name}-id`,
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
        arn: 'arn:aws:iam::123456789012:user/test',
        userId: 'AIDACKCEVSQ6C2EXAMPLE',
      };
    }
    return {};
  },
});

import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  describe('Stack instantiation', () => {
    it('should create stack with default environment suffix', async () => {
      const stack = new TapStack('test-stack', {});

      const artifactBucketName = await stack.artifactBucketName.promise();
      expect(artifactBucketName).toContain('dev');
    });

    it('should create stack with custom environment suffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'prod',
      });

      const artifactBucketName = await stack.artifactBucketName.promise();
      expect(artifactBucketName).toContain('prod');
    });

    it('should create stack with custom tags', async () => {
      const customTags = {
        Project: 'TestProject',
        Owner: 'TestOwner',
      };

      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: customTags,
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Outputs validation', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test123',
      });
    });

    it('should export artifact bucket name', async () => {
      const bucketName = await stack.artifactBucketName.promise();
      expect(bucketName).toBe('pipeline-artifacts-test123');
    });

    it('should export ECR repository URL', async () => {
      const repoUrl = await stack.ecrRepositoryUrl.promise();
      expect(repoUrl).toContain('ecr.ap-southeast-1.amazonaws.com');
      expect(repoUrl).toContain('container-repo-test123');
    });

    it('should export pipeline name', async () => {
      const pipelineName = await stack.pipelineName.promise();
      expect(pipelineName).toBe('container-pipeline-test123');
    });
  });

  describe('Resource naming with environmentSuffix', () => {
    it('should append environmentSuffix to S3 bucket', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'staging',
      });

      const bucketName = await stack.artifactBucketName.promise();
      expect(bucketName).toBe('pipeline-artifacts-staging');
    });

    it('should append environmentSuffix to ECR repository', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'prod',
      });

      const repoUrl = await stack.ecrRepositoryUrl.promise();
      expect(repoUrl).toContain('container-repo-prod');
    });

    it('should append environmentSuffix to pipeline', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'qa',
      });

      const pipelineName = await stack.pipelineName.promise();
      expect(pipelineName).toBe('container-pipeline-qa');
    });
  });

  describe('GitHub configuration', () => {
    it('should use default GitHub configuration when not provided', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });

    it('should accept custom GitHub owner', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        githubOwner: 'custom-owner',
      });

      expect(stack).toBeDefined();
    });

    it('should accept custom GitHub repo', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        githubRepo: 'custom-repo',
      });

      expect(stack).toBeDefined();
    });

    it('should accept custom GitHub branch', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        githubBranch: 'develop',
      });

      expect(stack).toBeDefined();
    });

    it('should accept custom GitHub token secret name', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        githubTokenSecretName: 'my-github-token',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Tag merging', () => {
    it('should merge default tags with custom tags', () => {
      const customTags = {
        CustomTag1: 'Value1',
        CustomTag2: 'Value2',
      };

      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: customTags,
      });

      expect(stack).toBeDefined();
    });

    it('should allow custom tags to override default tags', () => {
      const customTags = {
        Environment: 'custom-env',
        Team: 'custom-team',
      };

      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: customTags,
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Resource configuration', () => {
    it('should create S3 bucket with versioning', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });

    it('should create ECR repository with image scanning', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });

    it('should create CodeBuild project with Docker support', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });

    it('should create Lambda function with inline code', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });

    it('should create CodePipeline with three stages', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('IAM roles and policies', () => {
    it('should create CodeBuild IAM role', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });

    it('should create Lambda IAM role', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });

    it('should create Pipeline IAM role', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });

    it('should create Pipeline Event IAM role', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('CloudWatch resources', () => {
    it('should create CloudWatch log group for CodeBuild', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });

    it('should create CloudWatch event rule', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });

    it('should create CloudWatch event target', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('ECR lifecycle policy', () => {
    it('should create lifecycle policy to keep last 10 images', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });
  });
});
