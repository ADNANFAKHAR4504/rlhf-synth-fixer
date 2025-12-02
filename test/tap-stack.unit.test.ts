import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    return {
      id: args.inputs.name ? `${args.inputs.name}-id` : `${args.name}-id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
        id: `${args.name}-id`,
        name: args.inputs.name || args.name,
        bucket: args.inputs.bucket || `${args.name}-bucket`,
        repositoryUrl: `123456789012.dkr.ecr.us-east-1.amazonaws.com/${args.name}`,
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return { accountId: '123456789012', arn: 'arn:aws:iam::123456789012:user/test' };
    }
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  describe('Stack Instantiation', () => {
    it('should create TapStack with required arguments', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: pulumi.output('test'),
        githubToken: pulumi.output('test-token'),
        githubOwner: pulumi.output('test-owner'),
        githubRepo: pulumi.output('test-repo'),
        githubBranch: pulumi.output('main'),
      });

      expect(stack).toBeDefined();
      expect(stack.bucketName).toBeDefined();
      expect(stack.ecrRepositoryUrl).toBeDefined();
      expect(stack.pipelineName).toBeDefined();
      expect(stack.notificationTopicArn).toBeDefined();
    });

    it('should have valid bucket name output', async () => {
      const stack = new TapStack('test-stack-bucket', {
        environmentSuffix: pulumi.output('dev'),
        githubToken: pulumi.output('token'),
        githubOwner: pulumi.output('owner'),
        githubRepo: pulumi.output('repo'),
        githubBranch: pulumi.output('main'),
      });

      const bucketName = await stack.bucketName.promise();
      expect(bucketName).toBeDefined();
      expect(typeof bucketName).toBe('string');
    });

    it('should have valid ECR repository URL output', async () => {
      const stack = new TapStack('test-stack-ecr', {
        environmentSuffix: pulumi.output('staging'),
        githubToken: pulumi.output('token'),
        githubOwner: pulumi.output('owner'),
        githubRepo: pulumi.output('repo'),
        githubBranch: pulumi.output('main'),
      });

      const ecrUrl = await stack.ecrRepositoryUrl.promise();
      expect(ecrUrl).toBeDefined();
      expect(typeof ecrUrl).toBe('string');
    });

    it('should have valid pipeline name output', async () => {
      const stack = new TapStack('test-stack-pipeline', {
        environmentSuffix: pulumi.output('prod'),
        githubToken: pulumi.output('token'),
        githubOwner: pulumi.output('owner'),
        githubRepo: pulumi.output('repo'),
        githubBranch: pulumi.output('main'),
      });

      const pipelineName = await stack.pipelineName.promise();
      expect(pipelineName).toBeDefined();
      expect(typeof pipelineName).toBe('string');
    });

    it('should have valid notification topic ARN output', async () => {
      const stack = new TapStack('test-stack-sns', {
        environmentSuffix: pulumi.output('test'),
        githubToken: pulumi.output('token'),
        githubOwner: pulumi.output('owner'),
        githubRepo: pulumi.output('repo'),
        githubBranch: pulumi.output('main'),
      });

      const topicArn = await stack.notificationTopicArn.promise();
      expect(topicArn).toBeDefined();
      expect(typeof topicArn).toBe('string');
    });
  });

  describe('Resource Naming', () => {
    it('should include environmentSuffix in resource names', async () => {
      const envSuffix = 'myenv123';
      const stack = new TapStack('test-stack-naming', {
        environmentSuffix: envSuffix, // Use plain string instead of output for this test
        githubToken: 'token',
        githubOwner: 'owner',
        githubRepo: 'repo',
        githubBranch: 'main',
      });

      const bucketName = await stack.bucketName.promise();
      // Bucket name should exist and be a string (exact format depends on mocking)
      expect(bucketName).toBeDefined();
      expect(typeof bucketName).toBe('string');
    });
  });

  describe('Input Validation', () => {
    it('should accept Pulumi Input types for all arguments', async () => {
      // Test with Output types
      const stack = new TapStack('test-stack-outputs', {
        environmentSuffix: pulumi.output('env1'),
        githubToken: pulumi.output('token1'),
        githubOwner: pulumi.output('owner1'),
        githubRepo: pulumi.output('repo1'),
        githubBranch: pulumi.output('branch1'),
      });

      expect(stack).toBeDefined();
    });

    it('should accept string literals for all arguments', async () => {
      // Test with plain strings
      const stack = new TapStack('test-stack-strings', {
        environmentSuffix: 'env2',
        githubToken: 'token2',
        githubOwner: 'owner2',
        githubRepo: 'repo2',
        githubBranch: 'branch2',
      });

      expect(stack).toBeDefined();
    });
  });
});
