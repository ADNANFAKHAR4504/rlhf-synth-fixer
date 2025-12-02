import * as pulumi from '@pulumi/pulumi';

// Pulumi mocking setup for testing
pulumi.runtime.setMocks({
  newResource: (
    args: pulumi.runtime.MockResourceArgs
  ): { id: string; state: any } => {
    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
        arn: 'arn:aws:iam::123456789012:user/test',
        userId: 'AIDACKCEVSQ6C2EXAMPLE',
      };
    }
    return args.inputs;
  },
});

import { TapStack } from '../lib/tap-stack';

describe('TapStack CI/CD Pipeline', () => {
  let stack: TapStack;

  describe('with default configuration', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack', {});
    });

    it('should create the stack successfully', () => {
      expect(stack).toBeDefined();
    });

    it('should expose pipeline name output', done => {
      stack.pipelineName.apply(name => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should expose ECR repository URI output', done => {
      stack.ecrRepositoryUri.apply(uri => {
        expect(uri).toBeDefined();
        expect(typeof uri).toBe('string');
        done();
      });
    });

    it('should expose artifact bucket name output', done => {
      stack.artifactBucketName.apply(bucketName => {
        expect(bucketName).toBeDefined();
        expect(typeof bucketName).toBe('string');
        done();
      });
    });

    it('should expose build project name output', done => {
      stack.buildProjectName.apply(projectName => {
        expect(projectName).toBeDefined();
        expect(typeof projectName).toBe('string');
        done();
      });
    });

    it('should expose SNS topic ARN output', done => {
      stack.snsTopicArn.apply(arn => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        done();
      });
    });

    it('should expose validation Lambda ARN output', done => {
      stack.validationLambdaArn.apply(arn => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        done();
      });
    });

    it('should expose state table name output', done => {
      stack.stateTableName.apply(tableName => {
        expect(tableName).toBeDefined();
        expect(typeof tableName).toBe('string');
        done();
      });
    });

    it('should expose KMS key ID output', done => {
      stack.kmsKeyId.apply(keyId => {
        expect(keyId).toBeDefined();
        expect(typeof keyId).toBe('string');
        done();
      });
    });
  });

  describe('with custom configuration', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack-custom', {
        environmentSuffix: 'prod',
        tags: { Team: 'DevOps', CostCenter: '12345' },
        githubRepo: 'https://github.com/myorg/myapp',
        githubTokenParameter: '/custom/github/token',
        ecsClusterName: 'my-ecs-cluster',
      });
    });

    it('should create the stack with custom config', () => {
      expect(stack).toBeDefined();
    });

    it('should use custom environment suffix in resource names', done => {
      stack.pipelineName.apply(name => {
        expect(name).toContain('prod');
        done();
      });
    });

    it('should expose all required outputs', done => {
      Promise.all([
        stack.pipelineName.promise(),
        stack.ecrRepositoryUri.promise(),
        stack.artifactBucketName.promise(),
        stack.buildProjectName.promise(),
        stack.snsTopicArn.promise(),
        stack.validationLambdaArn.promise(),
        stack.stateTableName.promise(),
        stack.kmsKeyId.promise(),
      ]).then(
        ([
          pipelineName,
          ecrUri,
          bucketName,
          projectName,
          snsArn,
          lambdaArn,
          tableName,
          kmsKey,
        ]) => {
          expect(pipelineName).toBeDefined();
          expect(ecrUri).toBeDefined();
          expect(bucketName).toBeDefined();
          expect(projectName).toBeDefined();
          expect(snsArn).toBeDefined();
          expect(lambdaArn).toBeDefined();
          expect(tableName).toBeDefined();
          expect(kmsKey).toBeDefined();
          done();
        }
      );
    });
  });

  describe('with minimal configuration', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack-minimal', {
        environmentSuffix: 'dev',
      });
    });

    it('should create stack with minimal config', () => {
      expect(stack).toBeDefined();
    });

    it('should use dev environment suffix', done => {
      stack.buildProjectName.apply(name => {
        expect(name).toContain('dev');
        done();
      });
    });
  });

  describe('resource configuration validation', () => {
    beforeAll(() => {
      stack = new TapStack('test-validation', {
        environmentSuffix: 'test',
      });
    });

    it('should validate all outputs are present', async () => {
      const outputs = await Promise.all([
        stack.pipelineName.promise(),
        stack.ecrRepositoryUri.promise(),
        stack.artifactBucketName.promise(),
        stack.buildProjectName.promise(),
        stack.snsTopicArn.promise(),
        stack.validationLambdaArn.promise(),
        stack.stateTableName.promise(),
        stack.kmsKeyId.promise(),
      ]);

      outputs.forEach(output => {
        expect(output).toBeTruthy();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty tags gracefully', () => {
      const stackWithEmptyTags = new TapStack('test-empty-tags', {
        tags: {},
      });
      expect(stackWithEmptyTags).toBeDefined();
    });

    it('should handle undefined optional parameters', () => {
      const stackWithUndefined = new TapStack('test-undefined', {
        environmentSuffix: undefined,
        tags: undefined,
        githubRepo: undefined,
        githubTokenParameter: undefined,
        ecsClusterName: undefined,
      });
      expect(stackWithUndefined).toBeDefined();
    });

    it('should create stack with only environment suffix', () => {
      const minimalStack = new TapStack('test-minimal-env', {
        environmentSuffix: 'staging',
      });
      expect(minimalStack).toBeDefined();
    });
  });

  describe('output types', () => {
    beforeAll(() => {
      stack = new TapStack('test-output-types', {
        environmentSuffix: 'test',
      });
    });

    it('should have pipelineName as Output<string>', () => {
      expect(stack.pipelineName).toBeInstanceOf(pulumi.Output);
    });

    it('should have ecrRepositoryUri as Output<string>', () => {
      expect(stack.ecrRepositoryUri).toBeInstanceOf(pulumi.Output);
    });

    it('should have artifactBucketName as Output<string>', () => {
      expect(stack.artifactBucketName).toBeInstanceOf(pulumi.Output);
    });

    it('should have buildProjectName as Output<string>', () => {
      expect(stack.buildProjectName).toBeInstanceOf(pulumi.Output);
    });

    it('should have snsTopicArn as Output<string>', () => {
      expect(stack.snsTopicArn).toBeInstanceOf(pulumi.Output);
    });

    it('should have validationLambdaArn as Output<string>', () => {
      expect(stack.validationLambdaArn).toBeInstanceOf(pulumi.Output);
    });

    it('should have stateTableName as Output<string>', () => {
      expect(stack.stateTableName).toBeInstanceOf(pulumi.Output);
    });

    it('should have kmsKeyId as Output<string>', () => {
      expect(stack.kmsKeyId).toBeInstanceOf(pulumi.Output);
    });
  });
});
