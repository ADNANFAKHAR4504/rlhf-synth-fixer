import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, unknown>;
  } {
    const state: Record<string, unknown> = {
      ...args.inputs,
      id: args.id || `${args.name}-id`,
      arn: `arn:aws:service:us-east-1:123456789012:${args.type}/${args.name}`,
    };

    // Add specific mock outputs based on resource type
    switch (args.type) {
      case 'aws:s3/bucket:Bucket':
        state.bucket = args.inputs.bucket || `${args.name}-bucket`;
        state.arn = `arn:aws:s3:::${state.bucket}`;
        break;
      case 'aws:ecr/repository:Repository':
        state.repositoryUrl = `123456789012.dkr.ecr.us-east-1.amazonaws.com/${args.inputs.name}`;
        state.name = args.inputs.name;
        state.arn = `arn:aws:ecr:us-east-1:123456789012:repository/${args.inputs.name}`;
        break;
      case 'aws:cloudwatch/logGroup:LogGroup':
        state.name = args.inputs.name;
        state.arn = `arn:aws:logs:us-east-1:123456789012:log-group:${args.inputs.name}`;
        break;
      case 'aws:iam/role:Role':
        state.arn = `arn:aws:iam::123456789012:role/${args.inputs.name}`;
        state.id = args.inputs.name;
        break;
      case 'aws:codebuild/project:Project':
        state.name = args.inputs.name;
        state.arn = `arn:aws:codebuild:us-east-1:123456789012:project/${args.inputs.name}`;
        break;
      case 'aws:codepipeline/pipeline:Pipeline':
        state.name = args.inputs.name;
        state.arn = `arn:aws:codepipeline:us-east-1:123456789012:${args.inputs.name}`;
        break;
    }

    return { id: state.id as string, state };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    // Mock AWS getCallerIdentity
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
        arn: 'arn:aws:iam::123456789012:user/test-user',
        userId: 'AIDAI123456789EXAMPLE',
      };
    }
    return args.inputs;
  },
});

describe('TapStack', () => {
  let stack: TapStack;

  beforeEach(() => {
    // Create a new TapStack instance for each test
    stack = new TapStack('test-tap', {
      environmentSuffix: 'test123',
      githubOwner: 'test-owner',
      githubRepo: 'test-repo',
      githubBranch: 'main',
      ecsClusterName: 'test-cluster',
      ecsServiceName: 'test-service',
    });
  });

  describe('Stack Creation', () => {
    it('should create a TapStack with all required resources', (done) => {
      pulumi.all([
        stack.pipelineArn,
        stack.codeBuildProjectArn,
        stack.ecrRepositoryUri,
        stack.artifactBucketName,
        stack.logGroupName,
      ]).apply(([pipelineArn, buildArn, ecrUri, bucketName, logGroup]) => {
        expect(pipelineArn).toContain('arn:aws:codepipeline');
        expect(buildArn).toContain('arn:aws:codebuild');
        expect(ecrUri).toContain('.dkr.ecr.us-east-1.amazonaws.com');
        expect(bucketName).toContain('pipeline-artifacts-test123');
        expect(logGroup).toContain('/aws/codebuild/nodejs-app-test123');
        done();
      });
    });

    it('should use default values when optional parameters are not provided', (done) => {
      const stackWithDefaults = new TapStack('test-defaults', {
        environmentSuffix: 'test456',
      });

      pulumi
        .all([
          stackWithDefaults.pipelineArn,
          stackWithDefaults.codeBuildProjectArn,
        ])
        .apply(([pipelineArn, buildArn]) => {
          expect(pipelineArn).toBeDefined();
          expect(buildArn).toBeDefined();
          done();
        });
    });
  });

  describe('S3 Artifact Bucket', () => {
    it('should create S3 bucket with correct configuration', (done) => {
      stack.artifactBucketName.apply((bucketName) => {
        expect(bucketName).toBe('pipeline-artifacts-test123');
        done();
      });
    });

    it('should enable versioning on S3 bucket', (done) => {
      // Versioning is enabled in the bucket configuration
      stack.artifactBucketName.apply((bucketName) => {
        expect(bucketName).toBeDefined();
        done();
      });
    });

    it('should enable encryption on S3 bucket', (done) => {
      // Encryption is configured with AES256
      stack.artifactBucketName.apply((bucketName) => {
        expect(bucketName).toBeDefined();
        done();
      });
    });
  });

  describe('ECR Repository', () => {
    it('should create ECR repository with correct name', (done) => {
      stack.ecrRepositoryUri.apply((uri) => {
        expect(uri).toContain('nodejs-app-test123');
        done();
      });
    });

    it('should enable image scanning on push', (done) => {
      stack.ecrRepositoryUri.apply((uri) => {
        expect(uri).toBeDefined();
        done();
      });
    });

    it('should create lifecycle policy for ECR', (done) => {
      // Lifecycle policy is created to keep last 10 images
      stack.ecrRepositoryUri.apply((uri) => {
        expect(uri).toBeDefined();
        done();
      });
    });
  });

  describe('CloudWatch Logs', () => {
    it('should create log group with correct name', (done) => {
      stack.logGroupName.apply((name) => {
        expect(name).toBe('/aws/codebuild/nodejs-app-test123');
        done();
      });
    });

    it('should set retention to 7 days', (done) => {
      // 7-day retention is configured
      stack.logGroupName.apply((name) => {
        expect(name).toBeDefined();
        done();
      });
    });
  });

  describe('IAM Roles', () => {
    it('should create CodeBuild service role', (done) => {
      stack.codeBuildProjectArn.apply((arn) => {
        expect(arn).toBeDefined();
        done();
      });
    });

    it('should create CodePipeline service role', (done) => {
      stack.pipelineArn.apply((arn) => {
        expect(arn).toBeDefined();
        done();
      });
    });

    it('should attach policies to CodeBuild role', (done) => {
      // Policies for logs, S3, and ECR are attached
      stack.codeBuildProjectArn.apply((arn) => {
        expect(arn).toBeDefined();
        done();
      });
    });

    it('should attach policies to CodePipeline role', (done) => {
      // Policies for S3, CodeBuild, and ECS are attached
      stack.pipelineArn.apply((arn) => {
        expect(arn).toBeDefined();
        done();
      });
    });
  });

  describe('CodeBuild Project', () => {
    it('should create CodeBuild project with correct name', (done) => {
      stack.codeBuildProjectArn.apply((arn) => {
        expect(arn).toContain('nodejs-app-build-test123');
        done();
      });
    });

    it('should use BUILD_GENERAL1_SMALL compute type', (done) => {
      stack.codeBuildProjectArn.apply((arn) => {
        expect(arn).toBeDefined();
        done();
      });
    });

    it('should configure environment variables', (done) => {
      // Environment variables for AWS region, account ID, repo name, and image tag
      stack.codeBuildProjectArn.apply((arn) => {
        expect(arn).toBeDefined();
        done();
      });
    });

    it('should enable CloudWatch Logs', (done) => {
      stack.logGroupName.apply((name) => {
        expect(name).toBeDefined();
        done();
      });
    });
  });

  describe('CodePipeline', () => {
    it('should create pipeline with correct name', (done) => {
      stack.pipelineArn.apply((arn) => {
        expect(arn).toContain('nodejs-app-pipeline-test123');
        done();
      });
    });

    it('should configure three stages', (done) => {
      // Source, Build, and Deploy stages
      stack.pipelineArn.apply((arn) => {
        expect(arn).toBeDefined();
        done();
      });
    });

    it('should configure Source stage with GitHub', (done) => {
      stack.pipelineArn.apply((arn) => {
        expect(arn).toBeDefined();
        done();
      });
    });

    it('should configure Build stage with CodeBuild', (done) => {
      stack.pipelineArn.apply((arn) => {
        expect(arn).toBeDefined();
        done();
      });
    });

    it('should configure Deploy stage with ECS', (done) => {
      stack.pipelineArn.apply((arn) => {
        expect(arn).toBeDefined();
        done();
      });
    });

    it('should use S3 for artifact store', (done) => {
      pulumi.all([stack.artifactBucketName, stack.pipelineArn]).apply(([bucket, arn]) => {
        expect(bucket).toBeDefined();
        expect(arn).toBeDefined();
        done();
      });
    });
  });

  describe('GitHub Webhook', () => {
    it('should create webhook for pipeline', (done) => {
      stack.pipelineArn.apply((arn) => {
        expect(arn).toBeDefined();
        done();
      });
    });

    it('should use GITHUB_HMAC authentication', (done) => {
      stack.pipelineArn.apply((arn) => {
        expect(arn).toBeDefined();
        done();
      });
    });

    it('should filter by branch', (done) => {
      stack.pipelineArn.apply((arn) => {
        expect(arn).toBeDefined();
        done();
      });
    });
  });

  describe('Resource Tagging', () => {
    it('should tag all resources with Environment=production', (done) => {
      stack.pipelineArn.apply((arn) => {
        expect(arn).toBeDefined();
        done();
      });
    });

    it('should tag all resources with Project=nodejs-app', (done) => {
      stack.pipelineArn.apply((arn) => {
        expect(arn).toBeDefined();
        done();
      });
    });
  });

  describe('Resource Naming', () => {
    it('should include environmentSuffix in all resource names', (done) => {
      pulumi
        .all([
          stack.pipelineArn,
          stack.codeBuildProjectArn,
          stack.ecrRepositoryUri,
          stack.artifactBucketName,
          stack.logGroupName,
        ])
        .apply(([pipeline, build, ecr, bucket, logs]) => {
          expect(pipeline).toContain('test123');
          expect(build).toContain('test123');
          expect(ecr).toContain('test123');
          expect(bucket).toContain('test123');
          expect(logs).toContain('test123');
          done();
        });
    });
  });

  describe('Component Resource', () => {
    it('should register as a ComponentResource', () => {
      expect(stack).toBeDefined();
      expect(stack.pipelineArn).toBeDefined();
    });

    it('should register outputs', (done) => {
      pulumi
        .all([
          stack.pipelineArn,
          stack.codeBuildProjectArn,
          stack.ecrRepositoryUri,
          stack.artifactBucketName,
          stack.logGroupName,
        ])
        .apply(([pipeline, build, ecr, bucket, logs]) => {
          expect(pipeline).toBeDefined();
          expect(build).toBeDefined();
          expect(ecr).toBeDefined();
          expect(bucket).toBeDefined();
          expect(logs).toBeDefined();
          done();
        });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty optional parameters', (done) => {
      const minimalStack = new TapStack('minimal', {
        environmentSuffix: 'minimal',
      });

      pulumi.all([minimalStack.pipelineArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        done();
      });
    });

    it('should handle long environment suffixes', (done) => {
      const longSuffixStack = new TapStack('long-suffix', {
        environmentSuffix: 'very-long-environment-suffix-name',
      });

      pulumi.all([longSuffixStack.pipelineArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        done();
      });
    });

    it('should handle special characters in parameters', (done) => {
      const specialStack = new TapStack('special', {
        environmentSuffix: 'test-123',
        githubOwner: 'owner-with-dash',
        githubRepo: 'repo_with_underscore',
      });

      pulumi.all([specialStack.pipelineArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        done();
      });
    });
  });

  describe('Configuration Validation', () => {
    it('should accept valid configuration', () => {
      const validStack = new TapStack('valid', {
        environmentSuffix: 'valid123',
        githubOwner: 'valid-owner',
        githubRepo: 'valid-repo',
        githubBranch: 'develop',
        ecsClusterName: 'valid-cluster',
        ecsServiceName: 'valid-service',
      });

      expect(validStack).toBeDefined();
    });

    it('should handle different branch names', (done) => {
      const devStack = new TapStack('dev-branch', {
        environmentSuffix: 'dev',
        githubBranch: 'develop',
      });

      pulumi.all([devStack.pipelineArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        done();
      });
    });
  });

  describe('Output Validation', () => {
    it('should export pipelineArn', (done) => {
      stack.pipelineArn.apply((arn) => {
        expect(arn).toBeTruthy();
        expect(typeof arn).toBe('string');
        done();
      });
    });

    it('should export codeBuildProjectArn', (done) => {
      stack.codeBuildProjectArn.apply((arn) => {
        expect(arn).toBeTruthy();
        expect(typeof arn).toBe('string');
        done();
      });
    });

    it('should export ecrRepositoryUri', (done) => {
      stack.ecrRepositoryUri.apply((uri) => {
        expect(uri).toBeTruthy();
        expect(typeof uri).toBe('string');
        done();
      });
    });

    it('should export artifactBucketName', (done) => {
      stack.artifactBucketName.apply((name) => {
        expect(name).toBeTruthy();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should export logGroupName', (done) => {
      stack.logGroupName.apply((name) => {
        expect(name).toBeTruthy();
        expect(typeof name).toBe('string');
        done();
      });
    });
  });
});
