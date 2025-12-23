/**
 * Unit tests for CI/CD Pipeline Stack
 * Tests infrastructure resource creation and configuration
 */

import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime before any imports
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {id: string; state: any} => {
    const defaultState: any = {
      arn: `arn:aws:service::123456789012:resource/${args.name}`,
      id: `${args.name}-id`,
      name: args.name,
      ...args.inputs,
    };

    // Specific resource state overrides
    if (args.type === 'aws:s3/bucket:Bucket') {
      return {id: args.name, state: {...defaultState, bucket: args.inputs.bucket || args.name}};
    }
    if (args.type === 'aws:ecr/repository:Repository') {
      return {
        id: args.name,
        state: {
          ...defaultState,
          repositoryUrl: `123456789012.dkr.ecr.us-east-1.amazonaws.com/${args.name}`,
        },
      };
    }
    if (args.type === 'aws:ecs/cluster:Cluster') {
      return {
        id: args.name,
        state: {...defaultState, arn: `arn:aws:ecs:us-east-1:123456789012:cluster/${args.name}`},
      };
    }
    if (args.type === 'aws:iam/role:Role') {
      return {
        id: args.name,
        state: {...defaultState, arn: `arn:aws:iam::123456789012:role/${args.name}`},
      };
    }
    if (args.type === 'aws:codepipeline/pipeline:Pipeline') {
      return {id: args.name, state: {...defaultState, name: args.inputs.name}};
    }
    if (args.type === 'aws:cloudfront/distribution:Distribution') {
      return {
        id: args.name,
        state: {...defaultState, domainName: `${args.name}.cloudfront.net`},
      };
    }
    if (args.type === 'aws:ecs/taskDefinition:TaskDefinition') {
      return {
        id: args.name,
        state: {
          ...defaultState,
          arn: `arn:aws:ecs:us-east-1:123456789012:task-definition/${args.inputs.family}:1`,
        },
      };
    }
    if (args.type === 'aws:sns/topic:Topic') {
      return {
        id: args.name,
        state: {...defaultState, arn: `arn:aws:sns:us-east-1:123456789012:${args.name}`},
      };
    }

    return {id: `${args.name}-id`, state: defaultState};
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:index/getRegion:getRegion') {
      return {name: 'us-east-1', id: 'us-east-1'};
    }
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {accountId: '123456789012', arn: 'arn:aws:iam::123456789012:user/test'};
    }
    return args.inputs;
  },
});

// Set test configuration
process.env.PULUMI_CONFIG = JSON.stringify({
  'project:githubToken': {secret: 'test-token-value'},
  'project:environmentSuffix': 'test',
});

import {CicdPipelineStack} from '../lib/cicd-pipeline-stack';

describe('CI/CD Pipeline Stack Unit Tests', () => {
  let stack: CicdPipelineStack;

  beforeAll(() => {
    stack = new CicdPipelineStack('test-stack', {
      environmentSuffix: 'test',
      githubToken: pulumi.output('test-gh-token'),
    });
  });

  describe('Stack Outputs', () => {
    it('should export pipelineUrl', (done) => {
      pulumi.all([stack.pipelineUrl]).apply(([url]) => {
        expect(url).toContain('console.aws.amazon.com');
        expect(url).toContain('codepipeline');
        done();
      });
    });

    it('should export ecrRepositoryUri', (done) => {
      pulumi.all([stack.ecrRepositoryUri]).apply(([uri]) => {
        expect(uri).toContain('.dkr.ecr.');
        expect(uri).toContain('.amazonaws.com');
        done();
      });
    });

    it('should export artifactBucketName', (done) => {
      pulumi.all([stack.artifactBucketName]).apply(([name]) => {
        expect(name).toContain('pipeline-artifacts');
        expect(name).toContain('test');
        done();
      });
    });

    it('should export cloudFrontUrl', (done) => {
      pulumi.all([stack.cloudFrontUrl]).apply(([url]) => {
        expect(url).toContain('https://');
        expect(url).toContain('cloudfront.net');
        done();
      });
    });

    it('should export snsTopicArn', (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([arn]) => {
        expect(arn).toContain('arn:aws:sns');
        expect(arn).toContain('pipeline-failures');
        done();
      });
    });

    it('should export taskDefinitionArn', (done) => {
      pulumi.all([stack.taskDefinitionArn]).apply(([arn]) => {
        expect(arn).toContain('arn:aws:ecs');
        expect(arn).toContain('task-definition');
        done();
      });
    });
  });

  describe('Resource Naming', () => {
    it('should include environmentSuffix in all resource names', (done) => {
      pulumi.all([stack.artifactBucketName]).apply(([bucketName]) => {
        expect(bucketName).toContain('test');
        done();
      });
    });

    it('should use consistent naming pattern', (done) => {
      pulumi.all([stack.artifactBucketName]).apply(([bucketName]) => {
        expect(bucketName).toMatch(/^[a-z0-9-]+$/);
        done();
      });
    });
  });

  describe('Stack Type', () => {
    it('should be a ComponentResource', () => {
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have registered outputs', () => {
      expect(stack.pipelineUrl).toBeDefined();
      expect(stack.ecrRepositoryUri).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.cloudFrontUrl).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
      expect(stack.taskDefinitionArn).toBeDefined();
    });
  });
});

describe('CI/CD Pipeline Stack Configuration Tests', () => {
  it('should accept optional GitHub parameters', () => {
    const customStack = new CicdPipelineStack('custom-stack', {
      environmentSuffix: 'custom',
      githubToken: pulumi.output('custom-token'),
      githubOwner: 'test-owner',
      githubRepo: 'test-repo',
      githubBranch: 'develop',
    });

    expect(customStack).toBeDefined();
    expect(customStack.pipelineUrl).toBeDefined();
  });

  it('should accept custom tags', () => {
    const taggedStack = new CicdPipelineStack('tagged-stack', {
      environmentSuffix: 'tagged',
      githubToken: pulumi.output('tagged-token'),
      tags: {
        Owner: 'test-team',
        CostCenter: 'engineering',
      },
    });

    expect(taggedStack).toBeDefined();
  });

  it('should handle minimal configuration with githubToken', () => {
    const minimalStack = new CicdPipelineStack('minimal-stack', {
      environmentSuffix: 'minimal',
      githubToken: pulumi.output('minimal-token'),
    });

    expect(minimalStack).toBeDefined();
    expect(minimalStack.pipelineUrl).toBeDefined();
  });

  it('should create stack with different environmentSuffix values', () => {
    const prodStack = new CicdPipelineStack('prod-stack', {
      environmentSuffix: 'prod',
      githubToken: pulumi.output('prod-token'),
    });

    expect(prodStack).toBeDefined();
  });

  it('should handle environmentSuffix with special characters', () => {
    const specialStack = new CicdPipelineStack('special-stack', {
      environmentSuffix: 'dev-123-test',
      githubToken: pulumi.output('special-token'),
    });

    expect(specialStack).toBeDefined();
  });
});

describe('CI/CD Pipeline Stack Interface Tests', () => {
  it('should validate CicdPipelineStackArgs interface', () => {
    const args = {
      environmentSuffix: 'interface-test',
      githubToken: pulumi.output('test-token'),
      githubOwner: 'test-owner',
      githubRepo: 'test-repo',
      githubBranch: 'main',
      tags: {
        Environment: 'test',
        Project: 'interface-test',
      },
    };

    const stack = new CicdPipelineStack('interface-stack', args);
    expect(stack).toBeDefined();
  });

  it('should accept pulumi.Input types for tags', () => {
    const stack = new CicdPipelineStack('input-stack', {
      environmentSuffix: 'input-test',
      githubToken: pulumi.output('input-token'),
      tags: pulumi.output({
        Environment: 'test',
        Owner: 'team',
      }),
    });

    expect(stack).toBeDefined();
  });

  it('should validate all required outputs are present', (done) => {
    const validationStack = new CicdPipelineStack('validation-stack', {
      environmentSuffix: 'validation',
      githubToken: pulumi.output('validation-token'),
    });

    pulumi
      .all([
        validationStack.pipelineUrl,
        validationStack.ecrRepositoryUri,
        validationStack.artifactBucketName,
        validationStack.cloudFrontUrl,
        validationStack.snsTopicArn,
        validationStack.taskDefinitionArn,
      ])
      .apply(([pipelineUrl, ecrUri, bucketName, cloudFrontUrl, snsArn, taskDefArn]) => {
        expect(pipelineUrl).toBeTruthy();
        expect(ecrUri).toBeTruthy();
        expect(bucketName).toBeTruthy();
        expect(cloudFrontUrl).toBeTruthy();
        expect(snsArn).toBeTruthy();
        expect(taskDefArn).toBeTruthy();
        done();
      });
  });

  it('should validate resource naming conventions', (done) => {
    const namingStack = new CicdPipelineStack('naming-stack', {
      environmentSuffix: 'naming123',
      githubToken: pulumi.output('naming-token'),
    });

    pulumi.all([namingStack.artifactBucketName]).apply(([bucketName]) => {
      // Bucket names should only contain lowercase letters, numbers, and hyphens
      expect(bucketName).toMatch(/^[a-z0-9-]+$/);
      // Should include environment suffix
      expect(bucketName).toContain('naming123');
      done();
    });
  });
});

describe('CI/CD Pipeline Stack Edge Cases', () => {
  it('should handle empty tags object', () => {
    const emptyTagsStack = new CicdPipelineStack('empty-tags-stack', {
      environmentSuffix: 'empty',
      githubToken: pulumi.output('empty-token'),
      tags: {},
    });

    expect(emptyTagsStack).toBeDefined();
  });

  it('should handle default GitHub values', () => {
    const defaultsStack = new CicdPipelineStack('defaults-stack', {
      environmentSuffix: 'defaults',
      githubToken: pulumi.output('defaults-token'),
    });

    expect(defaultsStack).toBeDefined();
  });

  it('should handle environmentSuffix with numbers', () => {
    const numericStack = new CicdPipelineStack('numeric-stack', {
      environmentSuffix: 'env123456',
      githubToken: pulumi.output('numeric-token'),
    });

    expect(numericStack).toBeDefined();
  });

  it('should handle environmentSuffix with dashes', () => {
    const dashedStack = new CicdPipelineStack('dashed-stack', {
      environmentSuffix: 'env-test-123',
      githubToken: pulumi.output('dashed-token'),
    });

    expect(dashedStack).toBeDefined();
  });

  it('should handle all optional GitHub parameters', () => {
    const fullGitHubStack = new CicdPipelineStack('full-github-stack', {
      environmentSuffix: 'full',
      githubToken: pulumi.output('full-token'),
      githubOwner: 'custom-owner',
      githubRepo: 'custom-repo',
      githubBranch: 'feature-branch',
    });

    expect(fullGitHubStack).toBeDefined();
  });
});
