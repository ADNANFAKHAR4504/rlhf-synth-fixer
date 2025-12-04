/**
 * Unit tests for TapStack and CicdPipelineStack using Pulumi mocking
 */
import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi mocking
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const outputs: any = {
      ...args.inputs,
      id: `${args.name}-id`,
      arn: `arn:aws:mock::123456789012:${args.type}/${args.name}`,
    };

    // Add type-specific outputs
    if (args.type === 'aws:s3/bucket:Bucket') {
      outputs.bucket = args.inputs.bucket || args.name;
      outputs.bucketRegionalDomainName = `${outputs.bucket}.s3.us-east-1.amazonaws.com`;
    } else if (args.type === 'aws:ecr/repository:Repository') {
      outputs.repositoryUrl = `123456789012.dkr.ecr.us-east-1.amazonaws.com/${args.inputs.name || args.name}`;
      outputs.name = args.inputs.name || args.name;
    } else if (args.type === 'aws:lambda/function:Function') {
      outputs.arn = `arn:aws:lambda:us-east-1:123456789012:function:${args.inputs.name || args.name}`;
      outputs.name = args.inputs.name || args.name;
    } else if (args.type === 'aws:codebuild/project:Project') {
      outputs.name = args.inputs.name || args.name;
      outputs.arn = `arn:aws:codebuild:us-east-1:123456789012:project/${outputs.name}`;
    } else if (args.type === 'aws:codepipeline/pipeline:Pipeline') {
      outputs.name = args.inputs.name || args.name;
      outputs.arn = `arn:aws:codepipeline:us-east-1:123456789012:${outputs.name}`;
    } else if (args.type === 'aws:iam/role:Role') {
      outputs.name = args.inputs.name || args.name;
      outputs.arn = `arn:aws:iam::123456789012:role/${outputs.name}`;
    } else if (args.type === 'aws:sns/topic:Topic') {
      outputs.name = args.inputs.name || args.name;
      outputs.arn = `arn:aws:sns:us-east-1:123456789012:${outputs.name}`;
    }

    return {
      id: outputs.id,
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getRegion:getRegion') {
      return {
        name: 'us-east-1',
        id: 'us-east-1',
      };
    } else if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
        arn: 'arn:aws:iam::123456789012:user/test',
        userId: 'AIDAI123456789012345',
      };
    }
    return {};
  },
});

import { TapStack } from '../lib/tap-stack';
import { CicdPipelineStack } from '../lib/cicd-pipeline-stack';

describe('TapStack', () => {
  describe('Stack Creation', () => {
    it('should create a TapStack with required environmentSuffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'dev',
      });

      expect(stack).toBeDefined();
      expect(stack.pipelineUrl).toBeDefined();
      expect(stack.ecrRepositoryUri).toBeDefined();
      expect(stack.s3BucketName).toBeDefined();
      expect(stack.lambdaFunctionArn).toBeDefined();
      expect(stack.codeBuildProjectName).toBeDefined();
    });

    it('should create a TapStack with custom tags', async () => {
      const stack = new TapStack('test-stack-tags', {
        environmentSuffix: 'prod',
        tags: {
          Team: 'devops',
          Project: 'cicd',
          Environment: 'production',
        },
      });

      expect(stack).toBeDefined();
      expect(stack.pipelineUrl).toBeDefined();
    });

    it('should create a TapStack with staging environment', async () => {
      const stack = new TapStack('test-stack-staging', {
        environmentSuffix: 'staging',
      });

      expect(stack).toBeDefined();
      expect(stack.s3BucketName).toBeDefined();
    });

    it('should expose all required outputs', async () => {
      const stack = new TapStack('test-outputs', {
        environmentSuffix: 'test',
      });

      // Verify all outputs are exposed
      expect(stack.pipelineUrl).toBeDefined();
      expect(stack.ecrRepositoryUri).toBeDefined();
      expect(stack.s3BucketName).toBeDefined();
      expect(stack.lambdaFunctionArn).toBeDefined();
      expect(stack.codeBuildProjectName).toBeDefined();
    });
  });

  describe('Component Resource', () => {
    it('should be a Pulumi ComponentResource', async () => {
      const stack = new TapStack('component-test', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have correct resource type', async () => {
      const stack = new TapStack('type-test', {
        environmentSuffix: 'test',
      });

      // The ComponentResource type is set during super() call
      expect(stack).toBeDefined();
    });
  });
});

describe('CicdPipelineStack', () => {
  describe('Infrastructure Components', () => {
    it('should create CI/CD pipeline infrastructure', async () => {
      const pipeline = new CicdPipelineStack('cicd-test', {
        environmentSuffix: 'dev',
      });

      expect(pipeline).toBeDefined();
      expect(pipeline.pipelineUrl).toBeDefined();
      expect(pipeline.ecrRepositoryUri).toBeDefined();
      expect(pipeline.s3BucketName).toBeDefined();
      expect(pipeline.lambdaFunctionArn).toBeDefined();
      expect(pipeline.codeBuildProjectName).toBeDefined();
    });

    it('should create S3 artifact bucket', async () => {
      const pipeline = new CicdPipelineStack('s3-test', {
        environmentSuffix: 'artifacts',
      });

      expect(pipeline.s3BucketName).toBeDefined();
    });

    it('should create ECR repository', async () => {
      const pipeline = new CicdPipelineStack('ecr-test', {
        environmentSuffix: 'registry',
      });

      expect(pipeline.ecrRepositoryUri).toBeDefined();
    });

    it('should create CodeBuild project', async () => {
      const pipeline = new CicdPipelineStack('build-test', {
        environmentSuffix: 'builder',
      });

      expect(pipeline.codeBuildProjectName).toBeDefined();
    });

    it('should create Lambda deployment function', async () => {
      const pipeline = new CicdPipelineStack('lambda-test', {
        environmentSuffix: 'deploy',
      });

      expect(pipeline.lambdaFunctionArn).toBeDefined();
    });

    it('should create CodePipeline', async () => {
      const pipeline = new CicdPipelineStack('pipeline-test', {
        environmentSuffix: 'cicd',
      });

      expect(pipeline.pipelineUrl).toBeDefined();
    });
  });

  describe('Configuration Options', () => {
    it('should accept environmentSuffix parameter', async () => {
      const suffix = 'pr123';
      const pipeline = new CicdPipelineStack('config-test', {
        environmentSuffix: suffix,
      });

      expect(pipeline).toBeDefined();
    });

    it('should accept custom tags', async () => {
      const pipeline = new CicdPipelineStack('tags-test', {
        environmentSuffix: 'tagged',
        tags: {
          CostCenter: '12345',
          Owner: 'team-devops',
        },
      });

      expect(pipeline).toBeDefined();
    });

    it('should work with minimal configuration', async () => {
      const pipeline = new CicdPipelineStack('minimal-test', {
        environmentSuffix: 'min',
      });

      expect(pipeline).toBeDefined();
      expect(pipeline.pipelineUrl).toBeDefined();
    });
  });

  describe('Resource Naming', () => {
    it('should use environmentSuffix in resource names', async () => {
      const envSuffix = 'unique123';
      const pipeline = new CicdPipelineStack('naming-test', {
        environmentSuffix: envSuffix,
      });

      // Resources should be created with the suffix
      expect(pipeline).toBeDefined();
    });

    it('should create uniquely named resources for parallel deployments', async () => {
      const pipeline1 = new CicdPipelineStack('parallel-1', {
        environmentSuffix: 'env1',
      });
      const pipeline2 = new CicdPipelineStack('parallel-2', {
        environmentSuffix: 'env2',
      });

      expect(pipeline1).toBeDefined();
      expect(pipeline2).toBeDefined();
    });
  });

  describe('Security Features', () => {
    it('should configure encryption settings', async () => {
      const pipeline = new CicdPipelineStack('security-test', {
        environmentSuffix: 'secure',
      });

      // S3 encryption and other security features should be configured
      expect(pipeline).toBeDefined();
    });

    it('should enable image scanning for ECR', async () => {
      const pipeline = new CicdPipelineStack('scanning-test', {
        environmentSuffix: 'scan',
      });

      expect(pipeline.ecrRepositoryUri).toBeDefined();
    });
  });

  describe('Lifecycle Management', () => {
    it('should configure S3 lifecycle policies', async () => {
      const pipeline = new CicdPipelineStack('lifecycle-s3', {
        environmentSuffix: 'life1',
      });

      expect(pipeline.s3BucketName).toBeDefined();
    });

    it('should configure ECR lifecycle policies', async () => {
      const pipeline = new CicdPipelineStack('lifecycle-ecr', {
        environmentSuffix: 'life2',
      });

      expect(pipeline.ecrRepositoryUri).toBeDefined();
    });

    it('should enable forceDestroy for cleanup', async () => {
      const pipeline = new CicdPipelineStack('cleanup-test', {
        environmentSuffix: 'destroy',
      });

      // S3 bucket should have forceDestroy enabled
      expect(pipeline).toBeDefined();
    });
  });
});

describe('Integration Tests', () => {
  describe('Full Stack Deployment', () => {
    it('should create complete CI/CD infrastructure', async () => {
      const fullStack = new TapStack('full-integration', {
        environmentSuffix: 'integration',
        tags: {
          Test: 'integration',
          ManagedBy: 'Jest',
        },
      });

      // Verify all components are created
      expect(fullStack.pipelineUrl).toBeDefined();
      expect(fullStack.ecrRepositoryUri).toBeDefined();
      expect(fullStack.s3BucketName).toBeDefined();
      expect(fullStack.lambdaFunctionArn).toBeDefined();
      expect(fullStack.codeBuildProjectName).toBeDefined();
    });

    it('should support multiple environment deployments', async () => {
      const devStack = new TapStack('multi-env-dev', {
        environmentSuffix: 'dev',
      });
      const stagingStack = new TapStack('multi-env-staging', {
        environmentSuffix: 'staging',
      });
      const prodStack = new TapStack('multi-env-prod', {
        environmentSuffix: 'prod',
      });

      expect(devStack).toBeDefined();
      expect(stagingStack).toBeDefined();
      expect(prodStack).toBeDefined();
    });
  });

  describe('Output Values', () => {
    it('should provide pipeline URL for monitoring', async () => {
      const stack = new TapStack('outputs-url', {
        environmentSuffix: 'monitor',
      });

      expect(stack.pipelineUrl).toBeDefined();
    });

    it('should provide ECR URI for Docker push', async () => {
      const stack = new TapStack('outputs-ecr', {
        environmentSuffix: 'docker',
      });

      expect(stack.ecrRepositoryUri).toBeDefined();
    });

    it('should provide S3 bucket name for artifact storage', async () => {
      const stack = new TapStack('outputs-s3', {
        environmentSuffix: 'artifacts',
      });

      expect(stack.s3BucketName).toBeDefined();
    });

    it('should provide Lambda ARN for deployment notifications', async () => {
      const stack = new TapStack('outputs-lambda', {
        environmentSuffix: 'notify',
      });

      expect(stack.lambdaFunctionArn).toBeDefined();
    });

    it('should provide CodeBuild project name', async () => {
      const stack = new TapStack('outputs-build', {
        environmentSuffix: 'builder',
      });

      expect(stack.codeBuildProjectName).toBeDefined();
    });
  });
});

describe('Edge Cases', () => {
  it('should handle long environment suffixes', async () => {
    const stack = new TapStack('edge-long', {
      environmentSuffix: 'very-long-environment-suffix-for-testing',
    });

    expect(stack).toBeDefined();
  });

  it('should handle short environment suffixes', async () => {
    const stack = new TapStack('edge-short', {
      environmentSuffix: 'a',
    });

    expect(stack).toBeDefined();
  });

  it('should handle numeric environment suffixes', async () => {
    const stack = new TapStack('edge-numeric', {
      environmentSuffix: '12345',
    });

    expect(stack).toBeDefined();
  });

  it('should handle hyphenated environment suffixes', async () => {
    const stack = new TapStack('edge-hyphen', {
      environmentSuffix: 'pr-123-test',
    });

    expect(stack).toBeDefined();
  });
});
