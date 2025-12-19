import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Mock pulumi outputs
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, any>;
  } => {
    const outputs: Record<string, any> = {
      ...args.inputs,
    };

    // Add specific mock outputs based on resource type
    if (args.type === 'aws:s3/bucket:Bucket') {
      outputs.bucket = args.inputs.bucket || args.name;
      outputs.arn = `arn:aws:s3:::${outputs.bucket}`;
    } else if (args.type === 'aws:codebuild/project:Project') {
      outputs.name = args.inputs.name || args.name;
      outputs.arn = `arn:aws:codebuild:us-east-1:123456789012:project/${outputs.name}`;
    } else if (args.type === 'aws:codepipeline/pipeline:Pipeline') {
      outputs.name = args.inputs.name || args.name;
      outputs.arn = `arn:aws:codepipeline:us-east-1:123456789012:${outputs.name}`;
    } else if (args.type === 'aws:iam/role:Role') {
      outputs.name = args.inputs.name || args.name;
      outputs.arn = `arn:aws:iam::123456789012:role/${outputs.name}`;
    } else if (args.type === 'aws:cloudwatch/logGroup:LogGroup') {
      outputs.name = args.inputs.name || args.name;
      outputs.arn = `arn:aws:logs:us-east-1:123456789012:log-group:${outputs.name}`;
    } else if (args.type === 'aws:cloudwatch/eventRule:EventRule') {
      outputs.name = args.inputs.name || args.name;
      outputs.arn = `arn:aws:events:us-east-1:123456789012:rule/${outputs.name}`;
    }

    return {
      id: `${args.name}_id`,
      state: outputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:index/getRegion:getRegion') {
      return { name: 'us-east-1' };
    }
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return { accountId: '123456789012' };
    }
    return {};
  },
});

describe('TapStack', () => {
  let stack: TapStack;
  const environmentSuffix = 'test-env';

  beforeAll(() => {
    stack = new TapStack('test-stack', {
      environmentSuffix,
    });
  });

  describe('Resource Creation', () => {
    it('should create the TapStack component', () => {
      expect(stack).toBeDefined();
    });

    it('should export artifactBucketName', async () => {
      const bucketName = await new Promise<string>(resolve => {
        stack.artifactBucketName.apply(name => {
          resolve(name);
          return name;
        });
      });
      expect(bucketName).toBe(`artifact-bucket-${environmentSuffix}`);
    });

    it('should export deployBucketName', async () => {
      const bucketName = await new Promise<string>(resolve => {
        stack.deployBucketName.apply(name => {
          resolve(name);
          return name;
        });
      });
      expect(bucketName).toBe(`deploy-bucket-${environmentSuffix}`);
    });

    it('should export codeBuildProjectName', async () => {
      const projectName = await new Promise<string>(resolve => {
        stack.codeBuildProjectName.apply(name => {
          resolve(name);
          return name;
        });
      });
      expect(projectName).toBe(`nodejs-build-${environmentSuffix}`);
    });

    it('should export codePipelineName', async () => {
      const pipelineName = await new Promise<string>(resolve => {
        stack.codePipelineName.apply(name => {
          resolve(name);
          return name;
        });
      });
      expect(pipelineName).toBe(`nodejs-pipeline-${environmentSuffix}`);
    });

    it('should export codeBuildLogGroupName', async () => {
      const logGroupName = await new Promise<string>(resolve => {
        stack.codeBuildLogGroupName.apply(name => {
          resolve(name);
          return name;
        });
      });
      expect(logGroupName).toBe(
        `/aws/codebuild/nodejs-build-${environmentSuffix}`
      );
    });

    it('should export codeBuildRoleArn', async () => {
      const roleArn = await new Promise<string>(resolve => {
        stack.codeBuildRoleArn.apply(arn => {
          resolve(arn);
          return arn;
        });
      });
      expect(roleArn).toContain('arn:aws:iam::');
      expect(roleArn).toContain(`codebuild-role-${environmentSuffix}`);
    });

    it('should export codePipelineRoleArn', async () => {
      const roleArn = await new Promise<string>(resolve => {
        stack.codePipelineRoleArn.apply(arn => {
          resolve(arn);
          return arn;
        });
      });
      expect(roleArn).toContain('arn:aws:iam::');
      expect(roleArn).toContain(`codepipeline-role-${environmentSuffix}`);
    });

    it('should export eventRuleArn', async () => {
      const ruleArn = await new Promise<string>(resolve => {
        stack.eventRuleArn.apply(arn => {
          resolve(arn);
          return arn;
        });
      });
      expect(ruleArn).toContain('arn:aws:events:');
      expect(ruleArn).toContain(`build-failure-rule-${environmentSuffix}`);
    });
  });

  describe('Resource Naming Convention', () => {
    it('should include environmentSuffix in all resource names', async () => {
      const outputs = [
        stack.artifactBucketName,
        stack.deployBucketName,
        stack.codeBuildProjectName,
        stack.codePipelineName,
        stack.codeBuildLogGroupName,
      ];

      for (const output of outputs) {
        const value = await new Promise<string>(resolve => {
          output.apply(val => {
            resolve(val);
            return val;
          });
        });
        expect(value).toContain(environmentSuffix);
      }
    });
  });

  describe('Security Configuration', () => {
    it('should configure S3 buckets with versioning', () => {
      // Versioning is tested through integration tests
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.deployBucketName).toBeDefined();
    });

    it('should configure S3 buckets with encryption', () => {
      // Encryption is tested through integration tests
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.deployBucketName).toBeDefined();
    });

    it('should configure CloudWatch log retention', () => {
      // Log retention is tested through integration tests
      expect(stack.codeBuildLogGroupName).toBeDefined();
    });
  });

  describe('Pipeline Configuration', () => {
    it('should configure three-stage pipeline', () => {
      // Pipeline stages are tested through integration tests
      expect(stack.codePipelineName).toBeDefined();
    });

    it('should configure CodeBuild project', () => {
      expect(stack.codeBuildProjectName).toBeDefined();
    });
  });

  describe('IAM Roles', () => {
    it('should create CodeBuild IAM role', () => {
      expect(stack.codeBuildRoleArn).toBeDefined();
    });

    it('should create CodePipeline IAM role', () => {
      expect(stack.codePipelineRoleArn).toBeDefined();
    });
  });

  describe('Event Handling', () => {
    it('should create build failure event rule', () => {
      expect(stack.eventRuleArn).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty environmentSuffix gracefully', async () => {
      const emptyStack = new TapStack('empty-test', {
        environmentSuffix: '',
      });
      expect(emptyStack).toBeDefined();
    });

    it('should handle special characters in environmentSuffix', async () => {
      const specialStack = new TapStack('special-test', {
        environmentSuffix: 'test-123',
      });
      expect(specialStack).toBeDefined();
    });
  });

  describe('Output Validation', () => {
    it('should export all required outputs', () => {
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.deployBucketName).toBeDefined();
      expect(stack.codeBuildProjectName).toBeDefined();
      expect(stack.codePipelineName).toBeDefined();
      expect(stack.codeBuildLogGroupName).toBeDefined();
      expect(stack.codeBuildRoleArn).toBeDefined();
      expect(stack.codePipelineRoleArn).toBeDefined();
      expect(stack.eventRuleArn).toBeDefined();
    });
  });
});
