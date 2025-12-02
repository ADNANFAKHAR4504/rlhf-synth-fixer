import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime to prevent actual resource creation during tests
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const outputs = args.inputs;

    // Add specific outputs for resources that need them
    if (args.type === 'aws:ecr/repository:Repository') {
      outputs.repositoryUrl = `342597974367.dkr.ecr.us-east-1.amazonaws.com/${args.name}`;
      outputs.arn = `arn:aws:ecr:us-east-1:342597974367:repository/${args.name}`;
    } else if (args.type === 'aws:s3/bucket:Bucket') {
      outputs.arn = `arn:aws:s3:::${args.name}`;
      outputs.bucket = args.name;
    } else if (args.type === 'aws:cloudwatch/logGroup:LogGroup') {
      outputs.arn = `arn:aws:logs:us-east-1:342597974367:log-group:${args.name}`;
    } else if (args.type === 'aws:iam/role:Role') {
      outputs.arn = `arn:aws:iam::342597974367:role/${args.name}`;
    } else if (args.type === 'aws:codebuild/project:Project') {
      outputs.arn = `arn:aws:codebuild:us-east-1:342597974367:project/${args.name}`;
    } else if (args.type === 'aws:codepipeline/pipeline:Pipeline') {
      outputs.arn = `arn:aws:codepipeline:us-east-1:342597974367:${args.name}`;
    }

    return {
      id: `${args.name}-id`,
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  beforeAll(async () => {
    // Create the stack with test parameters
    stack = new TapStack('test-tap-stack', {
      environmentSuffix: 'test123',
      githubOwner: 'test-owner',
      githubRepo: 'test-repo',
      githubBranch: 'main',
      githubToken: 'test-token',
      tags: {
        Environment: 'production',
        Project: 'nodejs-app',
      },
    });
  });

  describe('Stack Outputs', () => {
    it('should export pipelineArn output', async () => {
      const pipelineArn = await new Promise<string>((resolve) => {
        stack.pipelineArn.apply((arn) => {
          resolve(arn);
        });
      });

      expect(pipelineArn).toBeDefined();
      expect(pipelineArn).toContain('codepipeline');
    });

    it('should export ecrRepositoryUri output', async () => {
      const ecrUri = await new Promise<string>((resolve) => {
        stack.ecrRepositoryUri.apply((uri) => {
          resolve(uri);
        });
      });

      expect(ecrUri).toBeDefined();
      expect(ecrUri).toContain('ecr');
      expect(ecrUri).toContain('nodejs-app-test123');
    });
  });

  describe('Resource Naming', () => {
    it('should include environmentSuffix in resource names', async () => {
      const ecrUri = await new Promise<string>((resolve) => {
        stack.ecrRepositoryUri.apply((uri) => {
          resolve(uri);
        });
      });

      expect(ecrUri).toContain('test123');
    });

    it('should use proper naming convention for pipeline', async () => {
      const pipelineArn = await new Promise<string>((resolve) => {
        stack.pipelineArn.apply((arn) => {
          resolve(arn);
        });
      });

      expect(pipelineArn).toContain('nodejs-app-pipeline-test123');
    });
  });

  describe('Stack Configuration', () => {
    it('should create stack with custom tags', () => {
      expect(stack).toBeDefined();
    });

    it('should handle default environmentSuffix', () => {
      const defaultStack = new TapStack('default-stack', {});
      expect(defaultStack).toBeDefined();
    });

    it('should handle optional GitHub configuration', () => {
      const minimalStack = new TapStack('minimal-stack', {
        environmentSuffix: 'minimal',
      });
      expect(minimalStack).toBeDefined();
    });
  });

  describe('Resource Creation', () => {
    it('should create all required resources', () => {
      // Verify stack is created successfully
      expect(stack).toBeDefined();
      expect(stack.pipelineArn).toBeDefined();
      expect(stack.ecrRepositoryUri).toBeDefined();
    });

    it('should apply tags to resources', async () => {
      // Tags are applied during resource creation
      // This test verifies the stack accepts tag configuration
      const taggedStack = new TapStack('tagged-stack', {
        environmentSuffix: 'tagged',
        tags: {
          Environment: 'production',
          Project: 'nodejs-app',
          Owner: 'test-team',
        },
      });

      expect(taggedStack).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty environmentSuffix gracefully', () => {
      const emptyEnvStack = new TapStack('empty-env-stack', {
        environmentSuffix: '',
      });
      expect(emptyEnvStack).toBeDefined();
    });

    it('should handle long environmentSuffix', () => {
      const longEnvStack = new TapStack('long-env-stack', {
        environmentSuffix: 'very-long-environment-suffix-for-testing',
      });
      expect(longEnvStack).toBeDefined();
    });

    it('should handle special characters in GitHub configuration', () => {
      const specialCharStack = new TapStack('special-char-stack', {
        environmentSuffix: 'special',
        githubOwner: 'test-org',
        githubRepo: 'test.repo-with_special',
        githubBranch: 'feature/test-branch',
      });
      expect(specialCharStack).toBeDefined();
    });
  });

  describe('Output Validation', () => {
    it('should have valid ARN format for pipeline', async () => {
      const pipelineArn = await new Promise<string>((resolve) => {
        stack.pipelineArn.apply((arn) => {
          resolve(arn);
        });
      });

      expect(pipelineArn).toMatch(/^arn:aws:codepipeline:/);
    });

    it('should have valid ECR URI format', async () => {
      const ecrUri = await new Promise<string>((resolve) => {
        stack.ecrRepositoryUri.apply((uri) => {
          resolve(uri);
        });
      });

      expect(ecrUri).toMatch(/\.dkr\.ecr\./);
      expect(ecrUri).toMatch(/amazonaws\.com/);
    });
  });
});
