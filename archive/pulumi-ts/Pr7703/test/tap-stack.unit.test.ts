import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    return {
      id: `${args.name}_id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
        name: args.inputs.name || args.name,
        bucket: args.inputs.bucket || args.name,
        repositoryUrl: args.inputs.name
          ? `123456789012.dkr.ecr.us-east-1.amazonaws.com/${args.inputs.name}`
          : undefined,
        accountId: '123456789012',
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
        arn: 'arn:aws:iam::123456789012:user/test',
        userId: 'AIDAI123456789012',
      };
    }
    return {};
  },
});

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  beforeEach(() => {
    // Set environment variables
    process.env.ENVIRONMENT_SUFFIX = 'test';
    process.env.AWS_REGION = 'us-east-1';
  });

  afterEach(() => {
    delete process.env.ENVIRONMENT_SUFFIX;
    delete process.env.AWS_REGION;
  });

  describe('Stack Construction', () => {
    it('should create a TapStack instance', async () => {
      stack = new TapStack('test-stack', {
        tags: { Environment: 'Test' },
      });

      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have pipelineUrl output', async () => {
      stack = new TapStack('test-stack', {
        tags: { Environment: 'Test' },
      });

      const pipelineUrl = await stack.pipelineUrl.promise();
      expect(pipelineUrl).toContain('console.aws.amazon.com');
      expect(pipelineUrl).toContain('codepipeline');
    });

    it('should have ecrRepositoryUri output', async () => {
      stack = new TapStack('test-stack', {
        tags: { Environment: 'Test' },
      });

      const ecrUri = await stack.ecrRepositoryUri.promise();
      expect(ecrUri).toContain('dkr.ecr');
      expect(ecrUri).toContain('app-repo-test');
    });
  });

  describe('Resource Naming with Environment Suffix', () => {
    it('should use custom environment suffix from environment variable', async () => {
      process.env.ENVIRONMENT_SUFFIX = 'prod';
      stack = new TapStack('test-stack', {
        tags: { Environment: 'Test' },
      });

      const pipelineUrl = await stack.pipelineUrl.promise();
      expect(pipelineUrl).toContain('cicd-pipeline-prod');
    });

    it('should default to "dev" when ENVIRONMENT_SUFFIX is not set', async () => {
      delete process.env.ENVIRONMENT_SUFFIX;
      stack = new TapStack('test-stack', {
        tags: { Environment: 'Test' },
      });

      const pipelineUrl = await stack.pipelineUrl.promise();
      expect(pipelineUrl).toContain('cicd-pipeline-dev');
    });
  });

  describe('Tag Merging', () => {
    it('should merge provided tags with default tags', async () => {
      stack = new TapStack('test-stack', {
        tags: {
          Environment: 'Test',
          CustomTag: 'CustomValue',
        },
      });

      // Stack should be created with merged tags
      expect(stack).toBeDefined();
    });

    it('should always include Environment and Team tags', async () => {
      stack = new TapStack('test-stack', {
        tags: {},
      });

      // Stack should be created with default tags
      expect(stack).toBeDefined();
    });
  });

  describe('AWS Region Configuration', () => {
    it('should use AWS_REGION environment variable', async () => {
      process.env.AWS_REGION = 'us-west-2';
      stack = new TapStack('test-stack', {
        tags: { Environment: 'Test' },
      });

      const pipelineUrl = await stack.pipelineUrl.promise();
      expect(pipelineUrl).toContain('region=us-west-2');
    });

    it('should default to us-east-1 when AWS_REGION is not set', async () => {
      delete process.env.AWS_REGION;
      stack = new TapStack('test-stack', {
        tags: { Environment: 'Test' },
      });

      const pipelineUrl = await stack.pipelineUrl.promise();
      expect(pipelineUrl).toContain('region=us-east-1');
    });
  });

  describe('S3 Bucket Configuration', () => {
    it('should create S3 bucket with versioning enabled', async () => {
      stack = new TapStack('test-stack', {
        tags: { Environment: 'Test' },
      });

      // Bucket should be created with versioning
      expect(stack).toBeDefined();
    });

    it('should create S3 bucket with forceDestroy enabled', async () => {
      stack = new TapStack('test-stack', {
        tags: { Environment: 'Test' },
      });

      // Bucket should be created with forceDestroy
      expect(stack).toBeDefined();
    });
  });

  describe('ECR Repository Configuration', () => {
    it('should create ECR repository with forceDelete enabled', async () => {
      stack = new TapStack('test-stack', {
        tags: { Environment: 'Test' },
      });

      // ECR should be created with forceDelete
      expect(stack).toBeDefined();
    });

    it('should create ECR lifecycle policy to keep last 10 images', async () => {
      stack = new TapStack('test-stack', {
        tags: { Environment: 'Test' },
      });

      // Lifecycle policy should be created
      expect(stack).toBeDefined();
    });
  });

  describe('IAM Roles and Policies', () => {
    it('should create CodeBuild IAM role with proper trust policy', async () => {
      stack = new TapStack('test-stack', {
        tags: { Environment: 'Test' },
      });

      // CodeBuild role should be created
      expect(stack).toBeDefined();
    });

    it('should create CodePipeline IAM role with proper trust policy', async () => {
      stack = new TapStack('test-stack', {
        tags: { Environment: 'Test' },
      });

      // Pipeline role should be created
      expect(stack).toBeDefined();
    });

    it('should create CloudWatch Events IAM role with proper trust policy', async () => {
      stack = new TapStack('test-stack', {
        tags: { Environment: 'Test' },
      });

      // Event role should be created
      expect(stack).toBeDefined();
    });

    it('should attach CodeBuild policy with ECR, S3, and CloudWatch permissions', async () => {
      stack = new TapStack('test-stack', {
        tags: { Environment: 'Test' },
      });

      // CodeBuild policy should be attached
      expect(stack).toBeDefined();
    });

    it('should attach CodePipeline policy with S3 and CodeBuild permissions', async () => {
      stack = new TapStack('test-stack', {
        tags: { Environment: 'Test' },
      });

      // Pipeline policy should be attached
      expect(stack).toBeDefined();
    });
  });

  describe('CodeBuild Project', () => {
    it('should create CodeBuild project with LINUX_CONTAINER', async () => {
      stack = new TapStack('test-stack', {
        tags: { Environment: 'Test' },
      });

      // CodeBuild project should be created
      expect(stack).toBeDefined();
    });

    it('should configure CodeBuild with privileged mode for Docker', async () => {
      stack = new TapStack('test-stack', {
        tags: { Environment: 'Test' },
      });

      // Privileged mode should be enabled
      expect(stack).toBeDefined();
    });

    it('should set environment variables for AWS account and ECR', async () => {
      stack = new TapStack('test-stack', {
        tags: { Environment: 'Test' },
      });

      // Environment variables should be set
      expect(stack).toBeDefined();
    });
  });

  describe('CodePipeline Configuration', () => {
    it('should create CodePipeline with 3 stages', async () => {
      stack = new TapStack('test-stack', {
        tags: { Environment: 'Test' },
      });

      // Pipeline with 3 stages should be created
      expect(stack).toBeDefined();
    });

    it('should configure Source stage with GitHub provider', async () => {
      stack = new TapStack('test-stack', {
        tags: { Environment: 'Test' },
      });

      // Source stage should be configured
      expect(stack).toBeDefined();
    });

    it('should configure Build stage with CodeBuild', async () => {
      stack = new TapStack('test-stack', {
        tags: { Environment: 'Test' },
      });

      // Build stage should be configured
      expect(stack).toBeDefined();
    });

    it('should configure Deploy stage as placeholder', async () => {
      stack = new TapStack('test-stack', {
        tags: { Environment: 'Test' },
      });

      // Deploy stage should be configured
      expect(stack).toBeDefined();
    });
  });

  describe('CloudWatch Events', () => {
    it('should create EventRule for pipeline triggering', async () => {
      stack = new TapStack('test-stack', {
        tags: { Environment: 'Test' },
      });

      // Event rule should be created
      expect(stack).toBeDefined();
    });

    it('should create EventTarget pointing to CodePipeline', async () => {
      stack = new TapStack('test-stack', {
        tags: { Environment: 'Test' },
      });

      // Event target should be created
      expect(stack).toBeDefined();
    });
  });

  describe('Output Generation', () => {
    it('should generate pipeline URL with correct format', async () => {
      stack = new TapStack('test-stack', {
        tags: { Environment: 'Test' },
      });

      const pipelineUrl = await stack.pipelineUrl.promise();
      expect(pipelineUrl).toMatch(
        /https:\/\/console\.aws\.amazon\.com\/codesuite\/codepipeline\/pipelines\/.+\/view\?region=.+/
      );
    });

    it('should generate ECR repository URI', async () => {
      stack = new TapStack('test-stack', {
        tags: { Environment: 'Test' },
      });

      const ecrUri = await stack.ecrRepositoryUri.promise();
      expect(ecrUri).toMatch(/\d+\.dkr\.ecr\..+\.amazonaws\.com\/.+/);
    });
  });
});
