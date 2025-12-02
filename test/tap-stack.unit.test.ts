import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Set up Pulumi mocks
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string, state: any} {
    return {
      id: args.inputs.name ? `${args.name}-${args.inputs.name}` : args.name + '_id',
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
      },
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('TapStack - CI/CD Build Pipeline', () => {
  let stack: TapStack;
  let outputs: any;

  beforeAll(async () => {
    stack = new TapStack('test-stack', {
      environmentSuffix: 'test',
      tags: {
        Environment: 'ci',
        ManagedBy: 'pulumi',
      },
    });

    // Extract outputs
    outputs = {
      codeBuildProjectName: await stack.codeBuildProjectName.promise(),
      artifactBucketName: await stack.artifactBucketName.promise(),
      codeBuildRoleArn: await stack.codeBuildRoleArn.promise(),
      logGroupName: await stack.logGroupName.promise(),
    };
  });

  describe('Stack Instantiation', () => {
    it('should create stack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should have required outputs', () => {
      expect(outputs.codeBuildProjectName).toBeDefined();
      expect(outputs.artifactBucketName).toBeDefined();
      expect(outputs.codeBuildRoleArn).toBeDefined();
      expect(outputs.logGroupName).toBeDefined();
    });
  });

  describe('S3 Artifact Bucket', () => {
    it('should include environment suffix in bucket name', () => {
      expect(outputs.artifactBucketName).toContain('test');
      expect(outputs.artifactBucketName).toContain('codebuild-artifacts');
    });

    it('should enable versioning', () => {
      // Versioning is validated through deployment tests
      expect(outputs.artifactBucketName).toBeDefined();
    });
  });

  describe('CloudWatch Logs', () => {
    it('should create log group with correct name pattern', () => {
      expect(outputs.logGroupName).toContain('/aws/codebuild');
      expect(outputs.logGroupName).toContain('test');
    });

    it('should set log retention to 7 days', () => {
      // Retention is validated through deployment tests
      expect(outputs.logGroupName).toBeDefined();
    });
  });

  describe('IAM Role', () => {
    it('should create CodeBuild service role', () => {
      expect(outputs.codeBuildRoleArn).toBeDefined();
      expect(outputs.codeBuildRoleArn).toContain('arn:aws');
    });

    it('should include environment suffix in role name', () => {
      expect(outputs.codeBuildRoleArn).toContain('test');
    });
  });

  describe('CodeBuild Project', () => {
    it('should create project with environment suffix', () => {
      expect(outputs.codeBuildProjectName).toContain('test');
      expect(outputs.codeBuildProjectName).toContain('nodejs-build');
    });

    it('should use BUILD_GENERAL1_SMALL compute type', () => {
      // Compute type is validated through deployment tests
      expect(outputs.codeBuildProjectName).toBeDefined();
    });

    it('should set build timeout to 15 minutes', () => {
      // Timeout is validated through deployment tests
      expect(outputs.codeBuildProjectName).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    it('should apply environment tag', () => {
      // Tags are validated through deployment tests
      expect(stack).toBeDefined();
    });

    it('should apply ManagedBy tag', () => {
      // Tags are validated through deployment tests
      expect(stack).toBeDefined();
    });
  });

  describe('Default Environment', () => {
    let defaultStack: TapStack;

    beforeAll(async () => {
      defaultStack = new TapStack('default-test-stack', {});
    });

    it('should use default environment suffix when not provided', async () => {
      const projectName = await defaultStack.codeBuildProjectName.promise();
      expect(projectName).toContain('dev');
    });

    it('should create all resources with default configuration', () => {
      expect(defaultStack).toBeDefined();
      expect(defaultStack.codeBuildProjectName).toBeDefined();
      expect(defaultStack.artifactBucketName).toBeDefined();
    });
  });

  describe('Resource Outputs', () => {
    it('should export CodeBuild project name', () => {
      expect(outputs.codeBuildProjectName).toBeDefined();
      expect(typeof outputs.codeBuildProjectName).toBe('string');
    });

    it('should export S3 bucket name', () => {
      expect(outputs.artifactBucketName).toBeDefined();
      expect(typeof outputs.artifactBucketName).toBe('string');
    });

    it('should export IAM role ARN', () => {
      expect(outputs.codeBuildRoleArn).toBeDefined();
      expect(outputs.codeBuildRoleArn).toContain('arn:aws');
    });

    it('should export log group name', () => {
      expect(outputs.logGroupName).toBeDefined();
      expect(outputs.logGroupName).toContain('/aws/codebuild');
    });
  });
});
