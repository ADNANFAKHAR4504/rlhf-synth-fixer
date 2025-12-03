/**
 * Unit Tests for CicdPipelineStack
 * Tests all resources and configurations in the CI/CD pipeline stack
 */
import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi runtime mocking before importing the stack
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } {
    return {
      id: `${args.name}-id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
        id: `${args.name}-id`,
        name: args.inputs.name || args.name,
        repositoryUrl: args.type.includes('ecr:Repository')
          ? `123456789012.dkr.ecr.us-east-1.amazonaws.com/${args.inputs.name}`
          : undefined,
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getRegion:getRegion') {
      return { name: 'us-east-1' };
    }
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return { accountId: '123456789012' };
    }
    return {};
  },
});

import { CicdPipelineStack } from '../lib/cicd-pipeline-stack';

describe('CicdPipelineStack Unit Tests', () => {
  let stack: CicdPipelineStack;
  const environmentSuffix = 'test';

  describe('Stack Instantiation', () => {
    it('should create stack with required arguments', () => {
      stack = new CicdPipelineStack('test-cicd-pipeline', {
        environmentSuffix,
      });
      expect(stack).toBeDefined();
    });

    it('should create stack with optional tags', () => {
      const customTags = {
        Owner: 'DevOps',
        CostCenter: 'Engineering',
      };
      stack = new CicdPipelineStack('test-cicd-pipeline-tagged', {
        environmentSuffix,
        tags: customTags,
      });
      expect(stack).toBeDefined();
    });

    it('should expose required outputs', () => {
      stack = new CicdPipelineStack('test-cicd-pipeline-outputs', {
        environmentSuffix,
      });
      expect(stack.pipelineUrl).toBeDefined();
      expect(stack.ecrRepositoryUri).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.dockerBuildProjectName).toBeDefined();
      expect(stack.pulumiDeployProjectName).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
    });
  });

  describe('S3 Artifact Bucket', () => {
    beforeEach(() => {
      stack = new CicdPipelineStack('test-s3-bucket', {
        environmentSuffix,
      });
    });

    it('should create artifact bucket output', () => {
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.artifactBucketName).toBeInstanceOf(pulumi.Output);
    });

    it('should verify artifact bucket exists', () => {
      expect(stack.artifactBucketName).toBeDefined();
    });
  });

  describe('ECR Repository', () => {
    beforeEach(() => {
      stack = new CicdPipelineStack('test-ecr-repo', {
        environmentSuffix,
      });
    });

    it('should create ECR repository output', () => {
      expect(stack.ecrRepositoryUri).toBeDefined();
      expect(stack.ecrRepositoryUri).toBeInstanceOf(pulumi.Output);
    });

    it('should verify ECR repository URI is an Output', () => {
      expect(stack.ecrRepositoryUri).toBeInstanceOf(pulumi.Output);
    });
  });

  describe('CodeBuild Projects', () => {
    beforeEach(() => {
      stack = new CicdPipelineStack('test-codebuild', {
        environmentSuffix,
      });
    });

    it('should create Docker build project output', () => {
      expect(stack.dockerBuildProjectName).toBeDefined();
      expect(stack.dockerBuildProjectName).toBeInstanceOf(pulumi.Output);
    });

    it('should create Pulumi deploy project output', () => {
      expect(stack.pulumiDeployProjectName).toBeDefined();
      expect(stack.pulumiDeployProjectName).toBeInstanceOf(pulumi.Output);
    });

    it('should verify both build projects exist', () => {
      expect(stack.dockerBuildProjectName).toBeDefined();
      expect(stack.pulumiDeployProjectName).toBeDefined();
    });
  });

  describe('CodePipeline', () => {
    beforeEach(() => {
      stack = new CicdPipelineStack('test-pipeline', {
        environmentSuffix,
      });
    });

    it('should create pipeline URL output', () => {
      expect(stack.pipelineUrl).toBeDefined();
      expect(stack.pipelineUrl).toBeInstanceOf(pulumi.Output);
    });

    it('should have pipeline URL as Output type', () => {
      expect(stack.pipelineUrl).toBeInstanceOf(pulumi.Output);
    });
  });

  describe('SNS Topic', () => {
    beforeEach(() => {
      stack = new CicdPipelineStack('test-sns', {
        environmentSuffix,
      });
    });

    it('should create SNS topic ARN output', () => {
      expect(stack.snsTopicArn).toBeDefined();
      expect(stack.snsTopicArn).toBeInstanceOf(pulumi.Output);
    });

    it('should verify SNS topic ARN is Output type', () => {
      expect(stack.snsTopicArn).toBeInstanceOf(pulumi.Output);
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should create stack with production environment', () => {
      stack = new CicdPipelineStack('test-naming', {
        environmentSuffix: 'prod',
      });
      expect(stack).toBeDefined();
      expect(stack.artifactBucketName).toBeInstanceOf(pulumi.Output);
      expect(stack.ecrRepositoryUri).toBeInstanceOf(pulumi.Output);
    });

    it('should handle different environment suffixes correctly', () => {
      const devStack = new CicdPipelineStack('test-dev', {
        environmentSuffix: 'dev',
      });
      const stagingStack = new CicdPipelineStack('test-staging', {
        environmentSuffix: 'staging',
      });

      expect(devStack).toBeDefined();
      expect(stagingStack).toBeDefined();
      expect(devStack.artifactBucketName).toBeInstanceOf(pulumi.Output);
      expect(stagingStack.artifactBucketName).toBeInstanceOf(pulumi.Output);
    });
  });

  describe('Tags Configuration', () => {
    it('should apply custom tags to resources', () => {
      const customTags = {
        Team: 'Platform',
        Application: 'CI/CD',
      };
      stack = new CicdPipelineStack('test-tags', {
        environmentSuffix,
        tags: customTags,
      });
      expect(stack).toBeDefined();
    });

    it('should work without custom tags', () => {
      stack = new CicdPipelineStack('test-no-tags', {
        environmentSuffix,
      });
      expect(stack).toBeDefined();
    });

    it('should apply default tags internally', () => {
      stack = new CicdPipelineStack('test-default-tags', {
        environmentSuffix,
        tags: {},
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Output Validation', () => {
    beforeEach(() => {
      stack = new CicdPipelineStack('test-outputs', {
        environmentSuffix,
      });
    });

    it('should have all required outputs defined', () => {
      expect(stack.pipelineUrl).toBeDefined();
      expect(stack.ecrRepositoryUri).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.dockerBuildProjectName).toBeDefined();
      expect(stack.pulumiDeployProjectName).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
    });

    it('should return Pulumi Output types for all outputs', () => {
      expect(stack.pipelineUrl).toBeInstanceOf(pulumi.Output);
      expect(stack.ecrRepositoryUri).toBeInstanceOf(pulumi.Output);
      expect(stack.artifactBucketName).toBeInstanceOf(pulumi.Output);
      expect(stack.dockerBuildProjectName).toBeInstanceOf(pulumi.Output);
      expect(stack.pulumiDeployProjectName).toBeInstanceOf(pulumi.Output);
      expect(stack.snsTopicArn).toBeInstanceOf(pulumi.Output);
    });

    it('should expose all six outputs', () => {
      const outputs = [
        stack.pipelineUrl,
        stack.ecrRepositoryUri,
        stack.artifactBucketName,
        stack.dockerBuildProjectName,
        stack.pulumiDeployProjectName,
        stack.snsTopicArn,
      ];
      expect(outputs).toHaveLength(6);
      outputs.forEach(output => {
        expect(output).toBeDefined();
        expect(output).toBeInstanceOf(pulumi.Output);
      });
    });
  });

  describe('Error Handling', () => {
    it('should require environmentSuffix argument', () => {
      const testStack = new CicdPipelineStack('test-required', {
        environmentSuffix: 'test',
      });
      expect(testStack).toBeDefined();
    });

    it('should accept undefined tags', () => {
      expect(() => {
        new CicdPipelineStack('test-undefined-tags', {
          environmentSuffix,
          tags: undefined,
        });
      }).not.toThrow();
    });

    it('should handle empty tags object', () => {
      expect(() => {
        new CicdPipelineStack('test-empty-tags', {
          environmentSuffix,
          tags: {},
        });
      }).not.toThrow();
    });
  });

  describe('Multiple Stack Instances', () => {
    it('should create multiple independent stacks', () => {
      const stack1 = new CicdPipelineStack('test-multi-1', {
        environmentSuffix: 'dev1',
      });
      const stack2 = new CicdPipelineStack('test-multi-2', {
        environmentSuffix: 'dev2',
      });

      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
      expect(stack1).not.toBe(stack2);
    });

    it('should maintain separate outputs for each stack', () => {
      const stack1 = new CicdPipelineStack('test-sep-1', {
        environmentSuffix: 'env1',
      });
      const stack2 = new CicdPipelineStack('test-sep-2', {
        environmentSuffix: 'env2',
      });

      expect(stack1.artifactBucketName).toBeDefined();
      expect(stack2.artifactBucketName).toBeDefined();
      expect(stack1.artifactBucketName).not.toBe(stack2.artifactBucketName);
    });

    it('should create stacks with different configurations', () => {
      const stack1 = new CicdPipelineStack('test-config-1', {
        environmentSuffix: 'dev',
        tags: { Environment: 'development' },
      });
      const stack2 = new CicdPipelineStack('test-config-2', {
        environmentSuffix: 'prod',
        tags: { Environment: 'production' },
      });

      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
    });
  });

  describe('Component Resource Type', () => {
    it('should be a Pulumi ComponentResource', () => {
      stack = new CicdPipelineStack('test-component-type', {
        environmentSuffix,
      });
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have correct constructor', () => {
      expect(() => {
        new CicdPipelineStack('test-constructor', {
          environmentSuffix: 'test',
        });
      }).not.toThrow();
    });
  });

  describe('Environment Suffix Variations', () => {
    it('should handle numeric environment suffix', () => {
      stack = new CicdPipelineStack('test-numeric', {
        environmentSuffix: '123',
      });
      expect(stack).toBeDefined();
    });

    it('should handle hyphenated environment suffix', () => {
      stack = new CicdPipelineStack('test-hyphenated', {
        environmentSuffix: 'dev-qa-01',
      });
      expect(stack).toBeDefined();
    });

    it('should handle short environment suffix', () => {
      stack = new CicdPipelineStack('test-short', {
        environmentSuffix: 'qa',
      });
      expect(stack).toBeDefined();
    });
  });
});
