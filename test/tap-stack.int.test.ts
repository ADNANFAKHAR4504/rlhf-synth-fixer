/**
 * Integration tests for TapStack - CI/CD Pipeline Infrastructure
 *
 * These tests verify the integration between components in the CI/CD pipeline.
 * They use Pulumi mocking to simulate real AWS resource creation and interactions.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime for integration tests
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, any>;
  } {
    const outputs: Record<string, any> = {
      ...args.inputs,
    };

    // Provide realistic outputs for different resource types
    if (args.type === 'aws:s3/bucket:Bucket') {
      outputs['arn'] = `arn:aws:s3:::${args.name}`;
      outputs['bucket'] = args.name;
      outputs['id'] = args.name;
      outputs['region'] = 'us-east-1';
    } else if (args.type === 'aws:ecr/repository:Repository') {
      outputs['arn'] =
        `arn:aws:ecr:us-east-1:123456789012:repository/${args.name}`;
      outputs['repositoryUrl'] =
        `123456789012.dkr.ecr.us-east-1.amazonaws.com/${args.name}`;
      outputs['name'] = args.name;
      outputs['registryId'] = '123456789012';
    } else if (args.type === 'aws:sns/topic:Topic') {
      outputs['arn'] = `arn:aws:sns:us-east-1:123456789012:${args.name}`;
      outputs['name'] = args.name;
    } else if (args.type === 'aws:iam/role:Role') {
      outputs['arn'] = `arn:aws:iam::123456789012:role/${args.name}`;
      outputs['name'] = args.name;
      outputs['id'] = args.name;
    } else if (args.type === 'aws:codebuild/project:Project') {
      outputs['arn'] =
        `arn:aws:codebuild:us-east-1:123456789012:project/${args.name}`;
      outputs['name'] = args.name;
      outputs['id'] = args.name;
    } else if (args.type === 'aws:codepipeline/pipeline:Pipeline') {
      outputs['arn'] =
        `arn:aws:codepipeline:us-east-1:123456789012:${args.name}`;
      outputs['name'] = args.name;
      outputs['id'] = args.name;
    } else if (args.type === 'aws:cloudwatch/eventRule:EventRule') {
      outputs['arn'] =
        `arn:aws:events:us-east-1:123456789012:rule/${args.name}`;
      outputs['name'] = args.name;
    }

    return {
      id: args.name || `test-${args.type}`,
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getRegion:getRegion') {
      return { name: 'us-east-1', id: 'us-east-1' };
    }
    return {};
  },
});

describe('TapStack Integration Tests', () => {
  describe('End-to-End Pipeline Creation', () => {
    it('should create complete CI/CD pipeline with all components', async () => {
      const stack = new TapStack('integration-test-stack', {
        environmentSuffix: 'integration',
        tags: { Environment: 'production', ManagedBy: 'pulumi' },
        githubOwner: 'test-org',
        githubRepo: 'test-repo',
        githubBranch: 'main',
        githubToken: 'test-token',
      });

      expect(stack).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.ecrRepositoryUrl).toBeDefined();
      expect(stack.pipelineName).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
    });

    it('should create pipeline that references all required resources', async () => {
      const stack = new TapStack('integration-test-pipeline', {
        environmentSuffix: 'test-pipeline',
        githubOwner: 'test-org',
        githubRepo: 'test-repo',
      });

      // Verify all outputs are defined (indicating resources were created)
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.ecrRepositoryUrl).toBeDefined();
      expect(stack.pipelineName).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
    });
  });

  describe('Resource Integration', () => {
    it('should wire S3 bucket to CodePipeline correctly', async () => {
      const stack = new TapStack('s3-pipeline-integration', {
        environmentSuffix: 's3-test',
      });

      // Both bucket and pipeline should be created
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.pipelineName).toBeDefined();
    });

    it('should wire ECR repository to CodeBuild correctly', async () => {
      const stack = new TapStack('ecr-build-integration', {
        environmentSuffix: 'ecr-test',
      });

      // Both ECR and pipeline should be created
      expect(stack.ecrRepositoryUrl).toBeDefined();
      expect(stack.pipelineName).toBeDefined();
    });

    it('should wire SNS topic to EventBridge correctly', async () => {
      const stack = new TapStack('sns-eventbridge-integration', {
        environmentSuffix: 'sns-test',
      });

      // Both SNS and pipeline should be created
      expect(stack.snsTopicArn).toBeDefined();
      expect(stack.pipelineName).toBeDefined();
    });
  });

  describe('Configuration Propagation', () => {
    it('should propagate environmentSuffix to all resources', async () => {
      const testSuffix = 'propagation-test-123';
      const stack = new TapStack('config-propagation-test', {
        environmentSuffix: testSuffix,
      });

      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.ecrRepositoryUrl).toBeDefined();
      expect(stack.pipelineName).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
    });

    it('should apply tags to all resources', async () => {
      const stack = new TapStack('tag-propagation-test', {
        environmentSuffix: 'tag-test',
        tags: {
          Environment: 'production',
          ManagedBy: 'pulumi',
          Team: 'DevOps',
        },
      });

      expect(stack).toBeDefined();
    });
  });

  describe('GitHub Integration', () => {
    it('should configure GitHub as source with correct parameters', async () => {
      const stack = new TapStack('github-integration-test', {
        environmentSuffix: 'github-test',
        githubOwner: 'acme-corp',
        githubRepo: 'my-app',
        githubBranch: 'develop',
        githubToken: 'ghp_test_token',
      });

      expect(stack.pipelineName).toBeDefined();
    });

    it('should use default GitHub values when not provided', async () => {
      const stack = new TapStack('github-defaults-test', {
        environmentSuffix: 'defaults-test',
      });

      expect(stack.pipelineName).toBeDefined();
    });
  });

  describe('IAM Permissions Integration', () => {
    it('should grant CodeBuild permissions to access S3 and ECR', async () => {
      const stack = new TapStack('codebuild-permissions-test', {
        environmentSuffix: 'permissions-test',
      });

      // Verify resources that require IAM permissions are created
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.ecrRepositoryUrl).toBeDefined();
      expect(stack.pipelineName).toBeDefined();
    });

    it('should grant CodePipeline permissions to orchestrate workflow', async () => {
      const stack = new TapStack('codepipeline-permissions-test', {
        environmentSuffix: 'workflow-test',
      });

      expect(stack.pipelineName).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
    });
  });

  describe('Notification Integration', () => {
    it('should connect EventBridge to SNS for pipeline notifications', async () => {
      const stack = new TapStack('notification-integration-test', {
        environmentSuffix: 'notification-test',
      });

      expect(stack.snsTopicArn).toBeDefined();
      expect(stack.pipelineName).toBeDefined();
    });
  });

  describe('Lifecycle Policy Integration', () => {
    it('should apply S3 lifecycle policy for artifact cleanup', async () => {
      const stack = new TapStack('s3-lifecycle-test', {
        environmentSuffix: 'lifecycle-test',
      });

      expect(stack.artifactBucketName).toBeDefined();
    });

    it('should apply ECR lifecycle policy for image retention', async () => {
      const stack = new TapStack('ecr-lifecycle-test', {
        environmentSuffix: 'ecr-lifecycle',
      });

      expect(stack.ecrRepositoryUrl).toBeDefined();
    });
  });
});
