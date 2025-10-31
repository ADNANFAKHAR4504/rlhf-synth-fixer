/**
 * Unit tests for TapStack Pulumi component
 * These tests validate the infrastructure configuration without deploying to AWS
 */

import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi to avoid actual resource creation during tests
pulumi.runtime.setMocks({
  newResource: (
    args: pulumi.runtime.MockResourceArgs
  ): { id: string; state: any } => {
    const state = { ...args.inputs };

    switch (args.type) {
      case 'aws:s3/bucket:Bucket': {
        const bucketName =
          state.bucket ?? `${args.name}-${state.environmentSuffix ?? 'dev'}`;
        state.bucket = bucketName;
        state.arn = `arn:aws:s3:::${bucketName}`;
        break;
      }
      case 'aws:ecr/repository:Repository': {
        const repositoryName = state.name ?? args.name;
        state.repositoryUrl = `123456789012.dkr.ecr.us-east-1.amazonaws.com/${repositoryName}`;
        state.arn = `arn:aws:ecr:us-east-1:123456789012:repository/${repositoryName}`;
        break;
      }
      case 'aws:codepipeline/pipeline:Pipeline': {
        state.name = args.name;
        break;
      }
      case 'aws:sns/topic:Topic': {
        state.arn = `arn:aws:sns:us-east-1:123456789012:${args.name}`;
        break;
      }
      default:
        break;
    }

    return {
      id: `${args.name}-id`,
      state,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return { accountId: '123456789012' };
    }
    if (args.token === 'aws:index/getRegion:getRegion') {
      return { name: 'eu-north-1' };
    }
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  describe('Stack with custom environmentSuffix', () => {
    beforeAll(async () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test123',
        tags: {
          Team: 'QA',
          Project: 'CI/CD',
        },
      });
    });

    it('should create stack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should export artifact bucket name output', done => {
      stack.artifactBucketName.apply(name => {
        expect(name).toContain('pipeline-artifacts-test123');
        done();
      });
    });

    it('should export ECR repository URL output', done => {
      stack.ecrRepositoryUrl.apply(url => {
        expect(url).toBeDefined();
        expect(typeof url).toBe('string');
        done();
      });
    });

    it('should export pipeline name output', done => {
      stack.pipelineName.apply(name => {
        expect(name).toContain('cicd-pipeline-test123');
        done();
      });
    });

    it('should export SNS topic ARN output', done => {
      stack.snsTopicArn.apply(arn => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        done();
      });
    });
  });

  describe('Stack with default environmentSuffix', () => {
    let defaultStack: TapStack;

    beforeAll(async () => {
      defaultStack = new TapStack('default-stack', {});
    });

    it('should use "dev" as default environmentSuffix', done => {
      defaultStack.artifactBucketName.apply(name => {
        expect(name).toContain('pipeline-artifacts-dev');
        done();
      });
    });

    it('should create pipeline with dev suffix', done => {
      defaultStack.pipelineName.apply(name => {
        expect(name).toContain('cicd-pipeline-dev');
        done();
      });
    });
  });

  describe('Resource naming validation', () => {
    let prodStack: TapStack;

    beforeAll(() => {
      prodStack = new TapStack('prod-stack', {
        environmentSuffix: 'prod',
      });
    });

    it('should include environmentSuffix in S3 bucket name', done => {
      prodStack.artifactBucketName.apply(name => {
        expect(name).toMatch(/pipeline-artifacts-prod/);
        done();
      });
    });

    it('should include environmentSuffix in pipeline name', done => {
      prodStack.pipelineName.apply(name => {
        expect(name).toMatch(/cicd-pipeline-prod/);
        done();
      });
    });

    it('should include environmentSuffix in SNS topic ARN', done => {
      prodStack.snsTopicArn.apply(arn => {
        expect(arn).toMatch(/pipeline-notifications-prod/);
        done();
      });
    });
  });

  describe('Tag propagation', () => {
    let taggedStack: TapStack;

    beforeAll(() => {
      taggedStack = new TapStack('tagged-stack', {
        environmentSuffix: 'staging',
        tags: {
          Owner: 'DevOps',
          CostCenter: '1234',
        },
      });
    });

    it('should create stack with custom tags', () => {
      expect(taggedStack).toBeDefined();
    });

    it('should export all required outputs', () => {
      expect(taggedStack.artifactBucketName).toBeDefined();
      expect(taggedStack.ecrRepositoryUrl).toBeDefined();
      expect(taggedStack.pipelineName).toBeDefined();
      expect(taggedStack.snsTopicArn).toBeDefined();
    });
  });

  describe('Output types validation', () => {
    let outputStack: TapStack;

    beforeAll(() => {
      outputStack = new TapStack('output-stack', {
        environmentSuffix: 'qa',
      });
    });

    it('should have Output type for artifactBucketName', () => {
      expect(outputStack.artifactBucketName).toHaveProperty('apply');
      expect(typeof outputStack.artifactBucketName.apply).toBe('function');
    });

    it('should have Output type for ecrRepositoryUrl', () => {
      expect(outputStack.ecrRepositoryUrl).toHaveProperty('apply');
      expect(typeof outputStack.ecrRepositoryUrl.apply).toBe('function');
    });

    it('should have Output type for pipelineName', () => {
      expect(outputStack.pipelineName).toHaveProperty('apply');
      expect(typeof outputStack.pipelineName.apply).toBe('function');
    });

    it('should have Output type for snsTopicArn', () => {
      expect(outputStack.snsTopicArn).toHaveProperty('apply');
      expect(typeof outputStack.snsTopicArn.apply).toBe('function');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string environmentSuffix', () => {
      const emptyStack = new TapStack('empty-stack', {
        environmentSuffix: '',
      });
      expect(emptyStack).toBeDefined();
    });

    it('should handle special characters in environmentSuffix', done => {
      const specialStack = new TapStack('special-stack', {
        environmentSuffix: 'env-123',
      });
      specialStack.artifactBucketName.apply(name => {
        expect(name).toContain('env-123');
        done();
      });
    });

    it('should handle undefined tags', () => {
      const noTagsStack = new TapStack('no-tags-stack', {
        environmentSuffix: 'notags',
      });
      expect(noTagsStack).toBeDefined();
    });
  });
});
