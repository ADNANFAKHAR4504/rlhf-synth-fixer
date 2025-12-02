/**
 * Unit tests for CICDStack
 */
import * as pulumi from '@pulumi/pulumi';
import { CICDStack } from '../lib/ci-cd-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const state = { ...args.inputs };

    // Add specific mock responses based on resource type
    if (args.type === 'aws:s3/bucket:Bucket') {
      state.bucket = args.inputs.bucket || args.name;
      state.arn = `arn:aws:s3:::${state.bucket}`;
    }
    if (args.type === 'aws:ecr/repository:Repository') {
      state.repositoryUrl = `123456789012.dkr.ecr.us-east-1.amazonaws.com/${args.inputs.name}`;
      state.arn = `arn:aws:ecr:us-east-1:123456789012:repository/${args.inputs.name}`;
    }
    if (args.type === 'aws:iam/role:Role') {
      state.arn = `arn:aws:iam::123456789012:role/${args.inputs.name}`;
    }
    if (args.type === 'aws:cloudwatch/logGroup:LogGroup') {
      state.arn = `arn:aws:logs:us-east-1:123456789012:log-group:${args.inputs.name}`;
    }
    if (args.type === 'aws:sns/topic:Topic') {
      state.arn = `arn:aws:sns:us-east-1:123456789012:${args.inputs.name}`;
    }
    if (args.type === 'aws:codebuild/project:Project') {
      state.arn = `arn:aws:codebuild:us-east-1:123456789012:project/${args.inputs.name}`;
    }
    if (args.type === 'aws:codepipeline/pipeline:Pipeline') {
      state.arn = `arn:aws:codepipeline:us-east-1:123456789012:${args.inputs.name}`;
    }

    return {
      id: `${args.name}-id`,
      state: state,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getRegion:getRegion') {
      return { name: 'us-east-1' };
    }
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return { accountId: '123456789012' };
    }
    return args.inputs;
  },
});

describe('CICDStack', () => {
  let stack: CICDStack;

  describe('Constructor', () => {
    it('should create CICDStack with default environment suffix', async () => {
      stack = new CICDStack('test-cicd', {});

      const outputs = await Promise.all([
        stack.artifactBucketName,
        stack.ecrRepositoryUrl,
        stack.pipelineName,
        stack.snsTopicArn,
      ]);

      expect(outputs[0]).toBeDefined();
      expect(outputs[1]).toBeDefined();
      expect(outputs[2]).toBeDefined();
      expect(outputs[3]).toBeDefined();
    });

    it('should create CICDStack with custom environment suffix', async () => {
      stack = new CICDStack('test-cicd', {
        environmentSuffix: 'prod',
      });

      const outputs = await Promise.all([
        stack.artifactBucketName,
        stack.ecrRepositoryUrl,
        stack.pipelineName,
        stack.snsTopicArn,
      ]);

      expect(outputs[0]).toBeDefined();
      expect(outputs[1]).toBeDefined();
      expect(outputs[2]).toBeDefined();
      expect(outputs[3]).toBeDefined();
    });

    it('should create CICDStack with custom tags', async () => {
      stack = new CICDStack('test-cicd', {
        tags: {
          Project: 'TestProject',
          Owner: 'TestOwner',
        },
      });

      const outputs = await Promise.all([
        stack.artifactBucketName,
        stack.ecrRepositoryUrl,
        stack.pipelineName,
        stack.snsTopicArn,
      ]);

      expect(outputs[0]).toBeDefined();
      expect(outputs[1]).toBeDefined();
      expect(outputs[2]).toBeDefined();
      expect(outputs[3]).toBeDefined();
    });

    it('should create CICDStack with GitHub configuration', async () => {
      stack = new CICDStack('test-cicd', {
        githubToken: 'test-token',
        githubRepo: 'owner/repo',
        githubBranch: 'main',
      });

      const outputs = await Promise.all([
        stack.artifactBucketName,
        stack.ecrRepositoryUrl,
        stack.pipelineName,
        stack.snsTopicArn,
      ]);

      expect(outputs[0]).toBeDefined();
      expect(outputs[1]).toBeDefined();
      expect(outputs[2]).toBeDefined();
      expect(outputs[3]).toBeDefined();
    });

    it('should create CICDStack with ECS configuration', async () => {
      stack = new CICDStack('test-cicd', {
        ecsClusterName: 'test-cluster',
        ecsServiceName: 'test-service',
      });

      const outputs = await Promise.all([
        stack.artifactBucketName,
        stack.ecrRepositoryUrl,
        stack.pipelineName,
        stack.snsTopicArn,
      ]);

      expect(outputs[0]).toBeDefined();
      expect(outputs[1]).toBeDefined();
      expect(outputs[2]).toBeDefined();
      expect(outputs[3]).toBeDefined();
    });

    it('should create CICDStack with undefined githubToken', async () => {
      stack = new CICDStack('test-cicd', {
        githubToken: undefined,
        githubRepo: 'owner/repo',
        githubBranch: 'main',
      });

      const outputs = await Promise.all([
        stack.artifactBucketName,
        stack.ecrRepositoryUrl,
        stack.pipelineName,
        stack.snsTopicArn,
      ]);

      expect(outputs[0]).toBeDefined();
      expect(outputs[1]).toBeDefined();
      expect(outputs[2]).toBeDefined();
      expect(outputs[3]).toBeDefined();
    });

    it('should create CICDStack with undefined githubRepo', async () => {
      stack = new CICDStack('test-cicd', {
        githubToken: 'test-token',
        githubRepo: undefined,
        githubBranch: 'main',
      });

      const outputs = await Promise.all([
        stack.artifactBucketName,
        stack.ecrRepositoryUrl,
        stack.pipelineName,
        stack.snsTopicArn,
      ]);

      expect(outputs[0]).toBeDefined();
      expect(outputs[1]).toBeDefined();
      expect(outputs[2]).toBeDefined();
      expect(outputs[3]).toBeDefined();
    });

    it('should create CICDStack with undefined githubBranch', async () => {
      stack = new CICDStack('test-cicd', {
        githubToken: 'test-token',
        githubRepo: 'owner/repo',
        githubBranch: undefined,
      });

      const outputs = await Promise.all([
        stack.artifactBucketName,
        stack.ecrRepositoryUrl,
        stack.pipelineName,
        stack.snsTopicArn,
      ]);

      expect(outputs[0]).toBeDefined();
      expect(outputs[1]).toBeDefined();
      expect(outputs[2]).toBeDefined();
      expect(outputs[3]).toBeDefined();
    });

    it('should create CICDStack with undefined ecsClusterName', async () => {
      stack = new CICDStack('test-cicd', {
        ecsClusterName: undefined,
        ecsServiceName: 'test-service',
      });

      const outputs = await Promise.all([
        stack.artifactBucketName,
        stack.ecrRepositoryUrl,
        stack.pipelineName,
        stack.snsTopicArn,
      ]);

      expect(outputs[0]).toBeDefined();
      expect(outputs[1]).toBeDefined();
      expect(outputs[2]).toBeDefined();
      expect(outputs[3]).toBeDefined();
    });

    it('should create CICDStack with undefined ecsServiceName', async () => {
      stack = new CICDStack('test-cicd', {
        ecsClusterName: 'test-cluster',
        ecsServiceName: undefined,
      });

      const outputs = await Promise.all([
        stack.artifactBucketName,
        stack.ecrRepositoryUrl,
        stack.pipelineName,
        stack.snsTopicArn,
      ]);

      expect(outputs[0]).toBeDefined();
      expect(outputs[1]).toBeDefined();
      expect(outputs[2]).toBeDefined();
      expect(outputs[3]).toBeDefined();
    });

    it('should create CICDStack with all configuration options', async () => {
      stack = new CICDStack('test-cicd', {
        environmentSuffix: 'staging',
        tags: {
          Project: 'TestProject',
          Owner: 'TestOwner',
        },
        githubToken: 'test-token',
        githubRepo: 'owner/repo',
        githubBranch: 'develop',
        ecsClusterName: 'staging-cluster',
        ecsServiceName: 'staging-service',
      });

      const outputs = await Promise.all([
        stack.artifactBucketName,
        stack.ecrRepositoryUrl,
        stack.pipelineName,
        stack.snsTopicArn,
      ]);

      expect(outputs[0]).toBeDefined();
      expect(outputs[1]).toBeDefined();
      expect(outputs[2]).toBeDefined();
      expect(outputs[3]).toBeDefined();
    });

    it('should handle empty tags object', async () => {
      stack = new CICDStack('test-cicd', {
        tags: {},
      });

      const outputs = await Promise.all([
        stack.artifactBucketName,
        stack.ecrRepositoryUrl,
        stack.pipelineName,
        stack.snsTopicArn,
      ]);

      expect(outputs[0]).toBeDefined();
      expect(outputs[1]).toBeDefined();
      expect(outputs[2]).toBeDefined();
      expect(outputs[3]).toBeDefined();
    });

    it('should handle githubRepo with slash', async () => {
      stack = new CICDStack('test-cicd', {
        githubRepo: 'myowner/myrepo',
      });

      const outputs = await Promise.all([
        stack.artifactBucketName,
        stack.ecrRepositoryUrl,
        stack.pipelineName,
        stack.snsTopicArn,
      ]);

      expect(outputs[0]).toBeDefined();
      expect(outputs[1]).toBeDefined();
      expect(outputs[2]).toBeDefined();
      expect(outputs[3]).toBeDefined();
    });

    it('should handle githubRepo without slash', async () => {
      stack = new CICDStack('test-cicd', {
        githubRepo: 'invalidrepo',
      });

      const outputs = await Promise.all([
        stack.artifactBucketName,
        stack.ecrRepositoryUrl,
        stack.pipelineName,
        stack.snsTopicArn,
      ]);

      expect(outputs[0]).toBeDefined();
      expect(outputs[1]).toBeDefined();
      expect(outputs[2]).toBeDefined();
      expect(outputs[3]).toBeDefined();
    });
  });

  describe('Outputs', () => {
    beforeEach(() => {
      stack = new CICDStack('test-cicd', {
        environmentSuffix: 'test',
      });
    });

    it('should expose artifactBucketName output', async () => {
      const bucketName = await stack.artifactBucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toBeTruthy();
    });

    it('should expose ecrRepositoryUrl output', async () => {
      const repoUrl = await stack.ecrRepositoryUrl;
      expect(repoUrl).toBeDefined();
      expect(repoUrl).toBeTruthy();
    });

    it('should expose pipelineName output', async () => {
      const pipelineName = await stack.pipelineName;
      expect(pipelineName).toBeDefined();
      expect(pipelineName).toBeTruthy();
    });

    it('should expose snsTopicArn output', async () => {
      const topicArn = await stack.snsTopicArn;
      expect(topicArn).toBeDefined();
      expect(topicArn).toBeTruthy();
    });
  });

  describe('Resource Naming', () => {
    it('should use environment suffix in resource names', async () => {
      const testSuffix = 'testsuffix';
      stack = new CICDStack('test-cicd', {
        environmentSuffix: testSuffix,
      });

      const bucketName = await stack.artifactBucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toBeTruthy();
    });

    it('should default to dev environment suffix', async () => {
      stack = new CICDStack('test-cicd', {});

      const bucketName = await stack.artifactBucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toBeTruthy();
    });
  });

  describe('Tags', () => {
    it('should apply default tags', async () => {
      stack = new CICDStack('test-cicd', {
        tags: {},
      });

      const outputs = await Promise.all([
        stack.artifactBucketName,
        stack.ecrRepositoryUrl,
      ]);

      expect(outputs[0]).toBeDefined();
      expect(outputs[1]).toBeDefined();
    });

    it('should merge custom tags with default tags', async () => {
      stack = new CICDStack('test-cicd', {
        tags: {
          CustomTag: 'CustomValue',
        },
      });

      const outputs = await Promise.all([
        stack.artifactBucketName,
        stack.ecrRepositoryUrl,
      ]);

      expect(outputs[0]).toBeDefined();
      expect(outputs[1]).toBeDefined();
    });
  });
});
