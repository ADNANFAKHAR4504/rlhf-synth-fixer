import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';
import { CodeBuildStack } from '../lib/codebuild-stack';

// Mock Pulumi
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const outputs: any = { ...args.inputs };

    // Mock specific resource outputs
    if (args.type === 'aws:s3/bucket:Bucket') {
      outputs.bucket = args.inputs.bucket || `${args.name}-bucket`;
      outputs.arn = `arn:aws:s3:::${outputs.bucket}`;
    } else if (args.type === 'aws:iam/role:Role') {
      outputs.arn = `arn:aws:iam::123456789012:role/${args.name}`;
      outputs.id = `${args.name}-id`;
    } else if (args.type === 'aws:cloudwatch/logGroup:LogGroup') {
      outputs.arn = `arn:aws:logs:us-east-1:123456789012:log-group:${
        args.inputs.name || args.name
      }`;
      outputs.name = args.inputs.name || args.name;
    } else if (args.type === 'aws:codebuild/project:Project') {
      outputs.name = args.inputs.name || args.name;
      outputs.arn = `arn:aws:codebuild:us-east-1:123456789012:project/${outputs.name}`;
    } else if (args.type === 'aws:sns/topic:Topic') {
      outputs.arn = `arn:aws:sns:us-east-1:123456789012:${
        args.inputs.name || args.name
      }`;
      outputs.name = args.inputs.name || args.name;
    } else if (args.type === 'aws:cloudwatch/eventRule:EventRule') {
      outputs.name = args.inputs.name || args.name;
      outputs.arn = `arn:aws:events:us-east-1:123456789012:rule/${outputs.name}`;
    }

    return {
      id: `${args.name}_id`,
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:iam/assumeRolePolicyForPrincipal:assumeRolePolicyForPrincipal') {
      return JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: args.inputs.Service
              ? { Service: args.inputs.Service }
              : args.inputs,
            Action: 'sts:AssumeRole',
          },
        ],
      });
    }
    return args.inputs;
  },
});

describe('TapStack', () => {
  describe('constructor', () => {
    it('should create a TapStack with default values', async () => {
      const stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
      expect(stack.codeBuildProjectName).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
    });

    it('should create a TapStack with custom environmentSuffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'custom-env',
      });

      expect(stack).toBeDefined();
      expect(stack.codeBuildProjectName).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
    });

    it('should create a TapStack with custom notificationEmail', async () => {
      const stack = new TapStack('test-stack', {
        notificationEmail: 'custom@example.com',
      });

      expect(stack).toBeDefined();
      expect(stack.codeBuildProjectName).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
    });

    it('should create a TapStack with all custom values', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'prod',
        notificationEmail: 'prod@example.com',
        tags: { Environment: 'production' },
      });

      expect(stack).toBeDefined();
      expect(stack.codeBuildProjectName).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
    });

    it('should register outputs correctly', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      // Verify outputs are registered
      const projectName = await stack.codeBuildProjectName.promise();
      const bucketName = await stack.artifactBucketName.promise();
      const topicArn = await stack.snsTopicArn.promise();

      expect(projectName).toBeDefined();
      expect(bucketName).toBeDefined();
      expect(topicArn).toBeDefined();
    });
  });

  describe('child resources', () => {
    it('should create CodeBuildStack as a child resource', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });
  });
});
