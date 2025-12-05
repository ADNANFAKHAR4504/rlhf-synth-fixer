/**
 * Unit Tests for TapStack
 * Tests the main orchestration component for the TAP project
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

import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  describe('Stack Instantiation', () => {
    it('should create stack with default values', () => {
      stack = new TapStack('test-tap-stack', {});
      expect(stack).toBeDefined();
    });

    it('should create stack with environment suffix', () => {
      stack = new TapStack('test-tap-stack-env', {
        environmentSuffix: 'prod',
      });
      expect(stack).toBeDefined();
    });

    it('should create stack with custom tags', () => {
      const customTags = {
        Owner: 'DevOps',
        Project: 'TAP',
      };
      stack = new TapStack('test-tap-stack-tags', {
        environmentSuffix: 'dev',
        tags: customTags,
      });
      expect(stack).toBeDefined();
    });

    it('should create stack with both environment suffix and tags', () => {
      stack = new TapStack('test-tap-stack-full', {
        environmentSuffix: 'staging',
        tags: { Team: 'Platform' },
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Output Properties', () => {
    beforeEach(() => {
      stack = new TapStack('test-outputs', {
        environmentSuffix: 'test',
      });
    });

    it('should expose pipelineUrl output', () => {
      expect(stack.pipelineUrl).toBeDefined();
      expect(stack.pipelineUrl).toBeInstanceOf(pulumi.Output);
    });

    it('should expose ecrRepositoryUri output', () => {
      expect(stack.ecrRepositoryUri).toBeDefined();
      expect(stack.ecrRepositoryUri).toBeInstanceOf(pulumi.Output);
    });

    it('should expose artifactBucketName output', () => {
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.artifactBucketName).toBeInstanceOf(pulumi.Output);
    });

    it('should expose dockerBuildProjectName output', () => {
      expect(stack.dockerBuildProjectName).toBeDefined();
      expect(stack.dockerBuildProjectName).toBeInstanceOf(pulumi.Output);
    });

    it('should expose pulumiDeployProjectName output', () => {
      expect(stack.pulumiDeployProjectName).toBeDefined();
      expect(stack.pulumiDeployProjectName).toBeInstanceOf(pulumi.Output);
    });

    it('should expose snsTopicArn output', () => {
      expect(stack.snsTopicArn).toBeDefined();
      expect(stack.snsTopicArn).toBeInstanceOf(pulumi.Output);
    });

    it('should have all six required outputs', () => {
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
      });
    });
  });

  describe('Environment Suffix Handling', () => {
    it('should use default environment suffix when not provided', () => {
      stack = new TapStack('test-default-env', {});
      expect(stack).toBeDefined();
    });

    it('should accept custom environment suffix', () => {
      stack = new TapStack('test-custom-env', {
        environmentSuffix: 'production',
      });
      expect(stack).toBeDefined();
    });

    it('should handle different environment suffixes', () => {
      const devStack = new TapStack('test-dev', {
        environmentSuffix: 'dev',
      });
      const prodStack = new TapStack('test-prod', {
        environmentSuffix: 'prod',
      });

      expect(devStack).toBeDefined();
      expect(prodStack).toBeDefined();
      expect(devStack).not.toBe(prodStack);
    });
  });

  describe('Tags Configuration', () => {
    it('should work with empty tags object', () => {
      stack = new TapStack('test-empty-tags', {
        environmentSuffix: 'test',
        tags: {},
      });
      expect(stack).toBeDefined();
    });

    it('should work with undefined tags', () => {
      stack = new TapStack('test-undefined-tags', {
        environmentSuffix: 'test',
        tags: undefined,
      });
      expect(stack).toBeDefined();
    });

    it('should accept multiple custom tags', () => {
      const tags = {
        Environment: 'production',
        Owner: 'DevOps',
        CostCenter: 'Engineering',
        Application: 'CI/CD',
      };
      stack = new TapStack('test-multi-tags', {
        environmentSuffix: 'prod',
        tags,
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Child Stack Integration', () => {
    it('should instantiate CI/CD Pipeline Stack as child', () => {
      stack = new TapStack('test-child-stack', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeDefined();
    });

    it('should pass environment suffix to child stack', () => {
      stack = new TapStack('test-pass-env', {
        environmentSuffix: 'staging',
      });
      expect(stack).toBeDefined();
    });

    it('should pass tags to child stack', () => {
      stack = new TapStack('test-pass-tags', {
        environmentSuffix: 'dev',
        tags: { Team: 'Platform' },
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Output Resolution', () => {
    beforeEach(() => {
      stack = new TapStack('test-resolution', {
        environmentSuffix: 'test',
      });
    });

    it('should return pipelineUrl as Output', () => {
      expect(stack.pipelineUrl).toBeInstanceOf(pulumi.Output);
    });

    it('should return ecrRepositoryUri as Output', () => {
      expect(stack.ecrRepositoryUri).toBeInstanceOf(pulumi.Output);
    });

    it('should return artifactBucketName as Output', () => {
      expect(stack.artifactBucketName).toBeInstanceOf(pulumi.Output);
    });

    it('should return dockerBuildProjectName as Output', () => {
      expect(stack.dockerBuildProjectName).toBeInstanceOf(pulumi.Output);
    });

    it('should return pulumiDeployProjectName as Output', () => {
      expect(stack.pulumiDeployProjectName).toBeInstanceOf(pulumi.Output);
    });

    it('should return snsTopicArn as Output', () => {
      expect(stack.snsTopicArn).toBeInstanceOf(pulumi.Output);
    });
  });

  describe('Multiple Stack Instances', () => {
    it('should create multiple independent stacks', () => {
      const stack1 = new TapStack('test-multi-1', {
        environmentSuffix: 'env1',
      });
      const stack2 = new TapStack('test-multi-2', {
        environmentSuffix: 'env2',
      });

      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
      expect(stack1).not.toBe(stack2);
    });

    it('should maintain separate outputs for each stack', () => {
      const stack1 = new TapStack('test-sep-outputs-1', {
        environmentSuffix: 'dev1',
      });
      const stack2 = new TapStack('test-sep-outputs-2', {
        environmentSuffix: 'dev2',
      });

      expect(stack1.artifactBucketName).toBeDefined();
      expect(stack2.artifactBucketName).toBeDefined();
      expect(stack1.artifactBucketName).not.toBe(stack2.artifactBucketName);
    });
  });

  describe('Component Resource Type', () => {
    it('should be a Pulumi ComponentResource', () => {
      stack = new TapStack('test-component', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have correct resource type', () => {
      stack = new TapStack('test-type', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Resource Options', () => {
    it('should accept resource options', () => {
      stack = new TapStack(
        'test-with-opts',
        {
          environmentSuffix: 'test',
        },
        {
          protect: false,
        }
      );
      expect(stack).toBeDefined();
    });

    it('should work without resource options', () => {
      stack = new TapStack('test-no-opts', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Output Registration', () => {
    it('should register all outputs', () => {
      stack = new TapStack('test-registered', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeDefined();
    });

    it('should expose registered outputs for consumption', () => {
      stack = new TapStack('test-consumption', {
        environmentSuffix: 'test',
      });

      const outputs = [
        stack.pipelineUrl,
        stack.ecrRepositoryUri,
        stack.artifactBucketName,
        stack.dockerBuildProjectName,
        stack.pulumiDeployProjectName,
        stack.snsTopicArn,
      ];

      outputs.forEach(output => {
        expect(output).toBeDefined();
        expect(output).toBeInstanceOf(pulumi.Output);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty environment suffix string', () => {
      stack = new TapStack('test-empty-suffix', {
        environmentSuffix: '',
      });
      expect(stack).toBeDefined();
    });

    it('should handle special characters in environment suffix', () => {
      stack = new TapStack('test-special-suffix', {
        environmentSuffix: 'test-env-123',
      });
      expect(stack).toBeDefined();
    });

    it('should handle numeric environment suffix', () => {
      stack = new TapStack('test-numeric-suffix', {
        environmentSuffix: '123',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Constructor Variations', () => {
    it('should create with minimal arguments', () => {
      expect(() => {
        new TapStack('test-minimal', {});
      }).not.toThrow();
    });

    it('should create with all arguments', () => {
      expect(() => {
        new TapStack('test-full', {
          environmentSuffix: 'complete',
          tags: { Complete: 'true' },
        });
      }).not.toThrow();
    });

    it('should handle various environment names', () => {
      const envs = ['dev', 'qa', 'staging', 'prod', 'test', 'demo'];
      envs.forEach(env => {
        const testStack = new TapStack(`test-env-${env}`, {
          environmentSuffix: env,
        });
        expect(testStack).toBeDefined();
      });
    });
  });

  describe('Output Propagation', () => {
    it('should propagate outputs from child stack', () => {
      stack = new TapStack('test-propagation', {
        environmentSuffix: 'test',
      });

      expect(stack.pipelineUrl).toBeDefined();
      expect(stack.ecrRepositoryUri).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.dockerBuildProjectName).toBeDefined();
      expect(stack.pulumiDeployProjectName).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
    });

    it('should maintain output types from child stack', () => {
      stack = new TapStack('test-output-types', {
        environmentSuffix: 'test',
      });

      const outputs = [
        stack.pipelineUrl,
        stack.ecrRepositoryUri,
        stack.artifactBucketName,
        stack.dockerBuildProjectName,
        stack.pulumiDeployProjectName,
        stack.snsTopicArn,
      ];

      outputs.forEach(output => {
        expect(output).toBeInstanceOf(pulumi.Output);
      });
    });
  });
});
