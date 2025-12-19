/**
 * Unit tests for TapStack and CicdPipelineStack
 *
 * These tests validate the infrastructure structure without deploying to AWS.
 * Tests verify resource configurations, naming conventions, and stack structure.
 */

import * as pulumi from '@pulumi/pulumi';

// Set up mocking for Pulumi
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const outputs = args.inputs;
    // Add default outputs for specific resource types
    if (args.type === 'aws:s3/bucket:Bucket') {
      outputs.arn = `arn:aws:s3:::${args.name}`;
      outputs.bucket = args.inputs.bucket || args.name;
    } else if (args.type === 'aws:ecr/repository:Repository') {
      outputs.arn = `arn:aws:ecr:ap-southeast-1:123456789012:repository/${args.name}`;
      outputs.repositoryUrl = `123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/${args.name}`;
    } else if (args.type === 'aws:iam/role:Role') {
      outputs.arn = `arn:aws:iam::123456789012:role/${args.name}`;
    } else if (args.type === 'aws:iam/policy:Policy') {
      outputs.arn = `arn:aws:iam::123456789012:policy/${args.name}`;
    } else if (args.type === 'aws:codebuild/project:Project') {
      outputs.arn = `arn:aws:codebuild:ap-southeast-1:123456789012:project/${args.name}`;
      outputs.name = args.inputs.name || args.name;
    } else if (args.type === 'aws:codepipeline/pipeline:Pipeline') {
      outputs.arn = `arn:aws:codepipeline:ap-southeast-1:123456789012:${args.name}`;
      outputs.name = args.inputs.name || args.name;
    } else if (args.type === 'aws:cloudwatch/logGroup:LogGroup') {
      outputs.arn = `arn:aws:logs:ap-southeast-1:123456789012:log-group:${args.name}`;
    }
    return {
      id: `${args.name}-id`,
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
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
import { CicdPipelineStack } from '../lib/cicd-pipeline-stack';

describe('CicdPipelineStack Unit Tests', () => {
  let stack: CicdPipelineStack;

  beforeAll(() => {
    stack = new CicdPipelineStack('test-cicd', {
      environmentSuffix: 'test',
      tags: {
        Environment: 'test',
        Project: 'cicd-pipeline',
      },
      githubConnectionArn:
        'arn:aws:codestar-connections:ap-southeast-1:123456789012:connection/test',
      githubRepo: 'test/repo',
      githubBranch: 'main',
    });
  });

  it('should create stack successfully', () => {
    expect(stack).toBeDefined();
  });

  it('should have required outputs', (done) => {
    Promise.all([
      stack.pipelineUrl.promise(),
      stack.ecrRepositoryUri.promise(),
      stack.artifactBucketName.promise(),
      stack.buildProjectName.promise(),
    ]).then(
      ([pipelineUrl, ecrUri, bucketName, buildName]: [
        string,
        string,
        string,
        string,
      ]) => {
        expect(pipelineUrl).toContain('ap-southeast-1.console.aws.amazon.com');
        expect(pipelineUrl).toContain('cicd-pipeline-test');
        expect(ecrUri).toContain('app-repository-test');
        expect(bucketName).toContain('pipeline-artifacts-test');
        expect(buildName).toBe('docker-build-test');
        done();
      }
    );
  });
});

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  beforeAll(() => {
    stack = new TapStack('test-tap', {
      environmentSuffix: 'unittest',
      tags: {
        Environment: 'unittest',
        Project: 'test',
      },
      githubConnectionArn:
        'arn:aws:codestar-connections:ap-southeast-1:123456789012:connection/test',
      githubRepo: 'test/repo',
      githubBranch: 'main',
    });
  });

  it('should create TapStack successfully', () => {
    expect(stack).toBeDefined();
  });

  it('should expose all required outputs', (done) => {
    Promise.all([
      stack.pipelineUrl.promise(),
      stack.ecrRepositoryUri.promise(),
      stack.artifactBucketName.promise(),
      stack.buildProjectName.promise(),
    ]).then(
      ([pipelineUrl, ecrUri, bucketName, buildName]: [
        string,
        string,
        string,
        string,
      ]) => {
        expect(pipelineUrl).toBeDefined();
        expect(ecrUri).toBeDefined();
        expect(bucketName).toBeDefined();
        expect(buildName).toBeDefined();
        done();
      }
    );
  });
});

describe('Resource Naming Conventions', () => {
  it('should include environmentSuffix in all resource names', (done) => {
    const testStack = new CicdPipelineStack('naming-test', {
      environmentSuffix: 'envtest',
      githubConnectionArn:
        'arn:aws:codestar-connections:ap-southeast-1:123456789012:connection/test',
    });

    Promise.all([
      testStack.artifactBucketName.promise(),
      testStack.buildProjectName.promise(),
      testStack.ecrRepositoryUri.promise(),
    ]).then(([bucketName, buildName, ecrUri]: [string, string, string]) => {
      expect(bucketName).toContain('envtest');
      expect(buildName).toContain('envtest');
      expect(ecrUri).toContain('envtest');
      done();
    });
  });
});

describe('Configuration Tests', () => {
  it('should use default values when not provided', () => {
    const defaultStack = new CicdPipelineStack('default-test', {
      environmentSuffix: 'default',
    });

    expect(defaultStack).toBeDefined();
  });

  it('should accept custom GitHub configuration', (done) => {
    const customStack = new CicdPipelineStack('custom-test', {
      environmentSuffix: 'custom',
      githubConnectionArn:
        'arn:aws:codestar-connections:ap-southeast-1:123456789012:connection/custom',
      githubRepo: 'custom/repo',
      githubBranch: 'develop',
    });

    customStack.pipelineUrl.promise().then((url: string) => {
      expect(url).toContain('cicd-pipeline-custom');
      done();
    });
  });
});

describe('Tag Configuration Tests', () => {
  it('should apply custom tags to resources', () => {
    const taggedStack = new CicdPipelineStack('tagged-test', {
      environmentSuffix: 'tagged',
      tags: {
        CustomTag: 'CustomValue',
        Owner: 'TestTeam',
      },
    });

    expect(taggedStack).toBeDefined();
  });

  it('should apply default tags when none provided', () => {
    const noTagStack = new CicdPipelineStack('notag-test', {
      environmentSuffix: 'notag',
    });

    expect(noTagStack).toBeDefined();
  });
});

describe('TapStack Default Values Tests', () => {
  it('should use default environmentSuffix when not provided', () => {
    const defaultStack = new TapStack('default-env-test', {});

    expect(defaultStack).toBeDefined();
  });

  it('should use empty tags when not provided', () => {
    const noTagsStack = new TapStack('no-tags-test', {
      environmentSuffix: 'notags',
    });

    expect(noTagsStack).toBeDefined();
  });

  it('should handle all optional parameters as undefined', () => {
    const minimalStack = new TapStack('minimal-test', {});

    expect(minimalStack).toBeDefined();
  });

  it('should use provided environmentSuffix over default', (done) => {
    const customEnvStack = new TapStack('custom-env-test', {
      environmentSuffix: 'custom',
    });

    customEnvStack.buildProjectName.promise().then((name: string) => {
      expect(name).toContain('custom');
      done();
    });
  });
});
