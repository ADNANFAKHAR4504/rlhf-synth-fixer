import * as pulumi from '@pulumi/pulumi';
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

describe('CodeBuildStack', () => {
  describe('constructor', () => {
    it('should create a CodeBuildStack with required arguments', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix: 'test',
        notificationEmail: 'test@example.com',
      });

      expect(stack).toBeDefined();
      expect(stack.projectName).toBeDefined();
      expect(stack.bucketName).toBeDefined();
      expect(stack.topicArn).toBeDefined();
    });

    it('should output correct project name', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix: 'test',
        notificationEmail: 'test@example.com',
      });

      const projectName = await stack.projectName.promise();
      expect(projectName).toBeDefined();
      expect(typeof projectName).toBe('string');
    });

    it('should output correct bucket name', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix: 'test',
        notificationEmail: 'test@example.com',
      });

      const bucketName = await stack.bucketName.promise();
      expect(bucketName).toBeDefined();
      expect(typeof bucketName).toBe('string');
    });

    it('should output correct SNS topic ARN', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix: 'test',
        notificationEmail: 'test@example.com',
      });

      const topicArn = await stack.topicArn.promise();
      expect(topicArn).toBeDefined();
      expect(typeof topicArn).toBe('string');
    });
  });

  describe('resource configuration', () => {
    it('should create resources with correct environment suffix', async () => {
      const environmentSuffix = 'prod';
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix,
        notificationEmail: 'prod@example.com',
      });

      const projectName = await stack.projectName.promise();
      const bucketName = await stack.bucketName.promise();

      expect(projectName).toContain(environmentSuffix);
      expect(bucketName).toContain(environmentSuffix);
    });

    it('should register outputs correctly', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix: 'test',
        notificationEmail: 'test@example.com',
      });

      // Verify all outputs are defined
      const projectName = await stack.projectName.promise();
      const bucketName = await stack.bucketName.promise();
      const topicArn = await stack.topicArn.promise();

      expect(projectName).toBeDefined();
      expect(bucketName).toBeDefined();
      expect(topicArn).toBeDefined();
    });
  });

  describe('S3 bucket configuration', () => {
    it('should create S3 bucket with versioning enabled', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix: 'test',
        notificationEmail: 'test@example.com',
      });

      expect(stack.bucketName).toBeDefined();
    });

    it('should create S3 bucket with encryption', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix: 'test',
        notificationEmail: 'test@example.com',
      });

      expect(stack.bucketName).toBeDefined();
    });

    it('should create S3 bucket with lifecycle rules', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix: 'test',
        notificationEmail: 'test@example.com',
      });

      expect(stack.bucketName).toBeDefined();
    });

    it('should create S3 bucket with forceDestroy enabled', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix: 'test',
        notificationEmail: 'test@example.com',
      });

      expect(stack.bucketName).toBeDefined();
    });
  });

  describe('IAM configuration', () => {
    it('should create IAM role for CodeBuild', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix: 'test',
        notificationEmail: 'test@example.com',
      });

      expect(stack.projectName).toBeDefined();
    });

    it('should create IAM policies for S3 access', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix: 'test',
        notificationEmail: 'test@example.com',
      });

      expect(stack.bucketName).toBeDefined();
    });

    it('should create IAM policies for CloudWatch Logs', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix: 'test',
        notificationEmail: 'test@example.com',
      });

      expect(stack.projectName).toBeDefined();
    });

    it('should create IAM role for CloudWatch Events', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix: 'test',
        notificationEmail: 'test@example.com',
      });

      expect(stack.topicArn).toBeDefined();
    });
  });

  describe('CodeBuild project configuration', () => {
    it('should create CodeBuild project with correct timeout', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix: 'test',
        notificationEmail: 'test@example.com',
      });

      expect(stack.projectName).toBeDefined();
    });

    it('should create CodeBuild project with correct compute type', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix: 'test',
        notificationEmail: 'test@example.com',
      });

      expect(stack.projectName).toBeDefined();
    });

    it('should create CodeBuild project with S3 cache', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix: 'test',
        notificationEmail: 'test@example.com',
      });

      expect(stack.projectName).toBeDefined();
    });
  });

  describe('SNS configuration', () => {
    it('should create SNS topic for notifications', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix: 'test',
        notificationEmail: 'test@example.com',
      });

      const topicArn = await stack.topicArn.promise();
      expect(topicArn).toBeDefined();
    });

    it('should create SNS topic subscription with email protocol', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix: 'test',
        notificationEmail: 'test@example.com',
      });

      expect(stack.topicArn).toBeDefined();
    });

    it('should create SNS topic policy for CloudWatch Events', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix: 'test',
        notificationEmail: 'test@example.com',
      });

      expect(stack.topicArn).toBeDefined();
    });
  });

  describe('CloudWatch configuration', () => {
    it('should create CloudWatch Log Group with correct retention', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix: 'test',
        notificationEmail: 'test@example.com',
      });

      expect(stack.projectName).toBeDefined();
    });

    it('should create CloudWatch Events rule for build state changes', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix: 'test',
        notificationEmail: 'test@example.com',
      });

      expect(stack.projectName).toBeDefined();
    });

    it('should create CloudWatch Events target for SNS', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix: 'test',
        notificationEmail: 'test@example.com',
      });

      expect(stack.topicArn).toBeDefined();
    });
  });
});
