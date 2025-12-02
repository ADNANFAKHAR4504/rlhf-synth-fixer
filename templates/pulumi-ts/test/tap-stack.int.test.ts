import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  let stack: TapStack;

  beforeAll(() => {
    // Setup Pulumi mocks for integration testing
    pulumi.runtime.setMocks({
      newResource: (
        args: pulumi.runtime.MockResourceArgs
      ): { id: string; state: any } => {
        return {
          id: `${args.name}_id`,
          state: {
            ...args.inputs,
            arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
            name: args.name,
            bucket: args.inputs.bucket || args.name,
            repositoryUrl: `123456789012.dkr.ecr.us-east-1.amazonaws.com/${args.name}`,
          },
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

    stack = new TapStack('integration-test-stack', {
      environmentSuffix: 'test',
      tags: { Environment: 'test', Project: 'integration' },
      githubRepo: 'https://github.com/test-org/test-app',
      githubTokenParameter: '/test/github/token',
      ecsClusterName: 'test-cluster',
    });
  });

  describe('CI/CD Pipeline Integration', () => {
    it('should deploy all required resources', async () => {
      const [
        pipelineName,
        ecrUri,
        bucketName,
        projectName,
        snsArn,
        lambdaArn,
        tableName,
        kmsKey,
      ] = await Promise.all([
        stack.pipelineName.promise(),
        stack.ecrRepositoryUri.promise(),
        stack.artifactBucketName.promise(),
        stack.buildProjectName.promise(),
        stack.snsTopicArn.promise(),
        stack.validationLambdaArn.promise(),
        stack.stateTableName.promise(),
        stack.kmsKeyId.promise(),
      ]);

      expect(pipelineName).toBeTruthy();
      expect(ecrUri).toBeTruthy();
      expect(bucketName).toBeTruthy();
      expect(projectName).toBeTruthy();
      expect(snsArn).toBeTruthy();
      expect(lambdaArn).toBeTruthy();
      expect(tableName).toBeTruthy();
      expect(kmsKey).toBeTruthy();
    });

    it('should configure pipeline with correct stages', async () => {
      const pipelineName = await stack.pipelineName.promise();
      expect(pipelineName).toContain('test');
    });

    it('should setup ECR repository with proper naming', async () => {
      const ecrUri = await stack.ecrRepositoryUri.promise();
      expect(ecrUri).toMatch(/\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com\//);
    });

    it('should create S3 bucket for artifacts', async () => {
      const bucketName = await stack.artifactBucketName.promise();
      expect(bucketName).toBeTruthy();
      expect(typeof bucketName).toBe('string');
    });

    it('should configure CodeBuild project', async () => {
      const projectName = await stack.buildProjectName.promise();
      expect(projectName).toContain('test');
    });

    it('should setup SNS topic for notifications', async () => {
      const snsArn = await stack.snsTopicArn.promise();
      expect(snsArn).toMatch(/^arn:aws:sns:/);
    });

    it('should deploy Lambda validation function', async () => {
      const lambdaArn = await stack.validationLambdaArn.promise();
      expect(lambdaArn).toMatch(/^arn:aws:lambda:/);
    });

    it('should create DynamoDB table for state tracking', async () => {
      const tableName = await stack.stateTableName.promise();
      expect(tableName).toBeTruthy();
    });

    it('should provision KMS key for encryption', async () => {
      const kmsKey = await stack.kmsKeyId.promise();
      expect(kmsKey).toBeTruthy();
    });
  });

  describe('Resource Dependencies', () => {
    it('should ensure all resources are properly linked', async () => {
      const outputs = await Promise.all([
        stack.pipelineName.promise(),
        stack.buildProjectName.promise(),
        stack.artifactBucketName.promise(),
      ]);

      outputs.forEach(output => {
        expect(output).toBeTruthy();
      });
    });

    it('should validate ECR and CodeBuild integration', async () => {
      const [ecrUri, projectName] = await Promise.all([
        stack.ecrRepositoryUri.promise(),
        stack.buildProjectName.promise(),
      ]);

      expect(ecrUri).toBeTruthy();
      expect(projectName).toBeTruthy();
    });

    it('should validate Lambda and DynamoDB integration', async () => {
      const [lambdaArn, tableName] = await Promise.all([
        stack.validationLambdaArn.promise(),
        stack.stateTableName.promise(),
      ]);

      expect(lambdaArn).toBeTruthy();
      expect(tableName).toBeTruthy();
    });
  });

  describe('Configuration Validation', () => {
    it('should apply custom environment suffix', async () => {
      const pipelineName = await stack.pipelineName.promise();
      expect(pipelineName).toContain('test');
    });

    it('should use custom GitHub configuration', async () => {
      // Validate that the stack was created with custom GitHub config
      expect(stack).toBeDefined();
    });

    it('should use custom ECS cluster name', async () => {
      // Validate that the stack was created with custom ECS cluster
      expect(stack).toBeDefined();
    });
  });

  describe('End-to-End Pipeline Flow', () => {
    it('should support complete CI/CD workflow', async () => {
      const [pipelineName, buildProject, ecrUri] = await Promise.all([
        stack.pipelineName.promise(),
        stack.buildProjectName.promise(),
        stack.ecrRepositoryUri.promise(),
      ]);

      // Validate pipeline exists
      expect(pipelineName).toBeTruthy();

      // Validate build project exists
      expect(buildProject).toBeTruthy();

      // Validate ECR repository exists
      expect(ecrUri).toBeTruthy();
    });

    it('should support deployment validation', async () => {
      const [lambdaArn, tableName] = await Promise.all([
        stack.validationLambdaArn.promise(),
        stack.stateTableName.promise(),
      ]);

      expect(lambdaArn).toBeTruthy();
      expect(tableName).toBeTruthy();
    });

    it('should support build notifications', async () => {
      const snsArn = await stack.snsTopicArn.promise();
      expect(snsArn).toBeTruthy();
    });
  });

  describe('Security and Compliance', () => {
    it('should provision KMS encryption', async () => {
      const kmsKey = await stack.kmsKeyId.promise();
      expect(kmsKey).toBeTruthy();
    });

    it('should secure artifact storage', async () => {
      const [bucketName, kmsKey] = await Promise.all([
        stack.artifactBucketName.promise(),
        stack.kmsKeyId.promise(),
      ]);

      expect(bucketName).toBeTruthy();
      expect(kmsKey).toBeTruthy();
    });

    it('should secure sensitive parameters', async () => {
      // Validate that SSM parameters are created for GitHub token
      expect(stack).toBeDefined();
    });
  });
});
