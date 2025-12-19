/**
 * Unit tests for TapStack
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    return {
      id: `${args.name}-id`,
      state: args.inputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getRegion:getRegion') {
      return { name: 'us-east-1' };
    }
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return { accountId: '123456789012' };
    }
    return args.inputs;
  },
});

describe('TapStack', () => {
  let stack: TapStack;

  beforeEach(() => {
    // Reset for each test
  });

  describe('Constructor', () => {
    it('should create TapStack with default environment suffix', async () => {
      stack = new TapStack('test-stack', {});

      const outputs = await Promise.all([
        stack.artifactBucketName,
        stack.ecrRepositoryUrl,
        stack.pipelineName,
        stack.snsTopicArn,
      ]);

      expect(outputs[0]).toBeDefined();
      expect(outputs[1]).toBeDefined();
      expect(outputs[2]).toBeDefined();
      expect(outputs[3]).toBeDefined();
    });

    it('should create TapStack with custom environment suffix', async () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'prod',
      });

      const outputs = await Promise.all([
        stack.artifactBucketName,
        stack.ecrRepositoryUrl,
        stack.pipelineName,
        stack.snsTopicArn,
      ]);

      expect(outputs[0]).toBeDefined();
      expect(outputs[1]).toBeDefined();
      expect(outputs[2]).toBeDefined();
      expect(outputs[3]).toBeDefined();
    });

    it('should create TapStack with custom tags', async () => {
      stack = new TapStack('test-stack', {
        tags: {
          Project: 'TestProject',
          Owner: 'TestOwner',
        },
      });

      const outputs = await Promise.all([
        stack.artifactBucketName,
        stack.ecrRepositoryUrl,
        stack.pipelineName,
        stack.snsTopicArn,
      ]);

      expect(outputs[0]).toBeDefined();
      expect(outputs[1]).toBeDefined();
      expect(outputs[2]).toBeDefined();
      expect(outputs[3]).toBeDefined();
    });

    it('should create TapStack with GitHub configuration', async () => {
      stack = new TapStack('test-stack', {
        githubToken: 'test-token',
        githubRepo: 'owner/repo',
        githubBranch: 'main',
      });

      const outputs = await Promise.all([
        stack.artifactBucketName,
        stack.ecrRepositoryUrl,
        stack.pipelineName,
        stack.snsTopicArn,
      ]);

      expect(outputs[0]).toBeDefined();
      expect(outputs[1]).toBeDefined();
      expect(outputs[2]).toBeDefined();
      expect(outputs[3]).toBeDefined();
    });

    it('should create TapStack with ECS configuration', async () => {
      stack = new TapStack('test-stack', {
        ecsClusterName: 'test-cluster',
        ecsServiceName: 'test-service',
      });

      const outputs = await Promise.all([
        stack.artifactBucketName,
        stack.ecrRepositoryUrl,
        stack.pipelineName,
        stack.snsTopicArn,
      ]);

      expect(outputs[0]).toBeDefined();
      expect(outputs[1]).toBeDefined();
      expect(outputs[2]).toBeDefined();
      expect(outputs[3]).toBeDefined();
    });

    it('should create TapStack with all configuration options', async () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'staging',
        tags: {
          Project: 'TestProject',
          Owner: 'TestOwner',
        },
        githubToken: 'test-token',
        githubRepo: 'owner/repo',
        githubBranch: 'develop',
        ecsClusterName: 'staging-cluster',
        ecsServiceName: 'staging-service',
      });

      const outputs = await Promise.all([
        stack.artifactBucketName,
        stack.ecrRepositoryUrl,
        stack.pipelineName,
        stack.snsTopicArn,
      ]);

      expect(outputs[0]).toBeDefined();
      expect(outputs[1]).toBeDefined();
      expect(outputs[2]).toBeDefined();
      expect(outputs[3]).toBeDefined();
    });
  });

  describe('Outputs', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
    });

    it('should expose artifactBucketName output', async () => {
      const bucketName = await stack.artifactBucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toBeTruthy();
    });

    it('should expose ecrRepositoryUrl output', async () => {
      const repoUrl = await stack.ecrRepositoryUrl;
      expect(repoUrl).toBeDefined();
      expect(repoUrl).toBeTruthy();
    });

    it('should expose pipelineName output', async () => {
      const pipelineName = await stack.pipelineName;
      expect(pipelineName).toBeDefined();
      expect(pipelineName).toBeTruthy();
    });

    it('should expose snsTopicArn output', async () => {
      const topicArn = await stack.snsTopicArn;
      expect(topicArn).toBeDefined();
      expect(topicArn).toBeTruthy();
    });
  });
});
