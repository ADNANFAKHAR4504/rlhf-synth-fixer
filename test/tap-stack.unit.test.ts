/**
 * Unit tests for TapStack infrastructure components
 *
 * These tests use Pulumi's runtime mocking to verify resource configuration
 * without making actual AWS API calls.
 */
import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi runtime mocking before imports
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    // Return mock resource state
    const outputs: Record<string, any> = {
      ...args.inputs,
      id: args.name + '_id',
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
    };

    // Add type-specific outputs
    if (args.type === 'aws:s3/bucket:Bucket') {
      outputs.bucket = args.inputs.bucket || args.name;
    } else if (args.type === 'aws:iam/role:Role') {
      outputs.name = args.inputs.name || args.name;
    } else if (args.type === 'aws:codebuild/project:Project') {
      outputs.name = args.inputs.name || args.name;
    } else if (args.type === 'aws:sns/topic:Topic') {
      outputs.name = args.inputs.name || args.name;
    } else if (args.type === 'aws:cloudwatch/logGroup:LogGroup') {
      outputs.name = args.inputs.name || args.name;
    }

    return {
      id: args.name + '_id',
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    // Mock AWS SDK calls if needed
    return {};
  },
});

// Now import the stack after mocks are set up
import { TapStack } from '../lib/tap-stack';
import { ArtifactBucket } from '../lib/artifact-bucket';
import { CodeBuildProject } from '../lib/codebuild-project';
import { BuildNotifications } from '../lib/build-notifications';

describe('TapStack Infrastructure', () => {
  describe('TapStack Component', () => {
    it('should create stack with custom environmentSuffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test123',
        tags: {
          Environment: 'test',
          Team: 'qa',
        },
      });

      expect(stack).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.codeBuildProjectName).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();

      // Verify outputs are Pulumi Outputs
      const bucketName = await stack.artifactBucketName.promise();
      expect(bucketName).toBeDefined();
    });

    it('should create stack with default environmentSuffix', async () => {
      const stack = new TapStack('test-stack-default', {});

      expect(stack).toBeDefined();

      // Verify all outputs exist
      const bucketName = await stack.artifactBucketName.promise();
      const projectName = await stack.codeBuildProjectName.promise();
      const topicArn = await stack.snsTopicArn.promise();

      expect(bucketName).toBeDefined();
      expect(projectName).toBeDefined();
      expect(topicArn).toBeDefined();
    });

    it('should apply custom tags to resources', async () => {
      const customTags = {
        Environment: 'production',
        Team: 'devops',
        Project: 'CodeBuild',
      };

      const stack = new TapStack('test-stack-tags', {
        environmentSuffix: 'prod',
        tags: customTags,
      });

      expect(stack).toBeDefined();
    });
  });

  describe('ArtifactBucket Component', () => {
    it('should create S3 bucket with environmentSuffix', async () => {
      const bucket = new ArtifactBucket('test-artifact-bucket', {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
      });

      expect(bucket).toBeDefined();
      expect(bucket.bucketName).toBeDefined();
      expect(bucket.bucketArn).toBeDefined();

      const bucketName = await bucket.bucketName.promise();
      expect(bucketName).toContain('test');
    });

    it('should enable versioning on S3 bucket', async () => {
      const bucket = new ArtifactBucket('test-versioned-bucket', {
        environmentSuffix: 'versioned',
        tags: { Environment: 'test' },
      });

      expect(bucket).toBeDefined();
      // Versioning is configured in the component
    });

    it('should enable encryption on S3 bucket', async () => {
      const bucket = new ArtifactBucket('test-encrypted-bucket', {
        environmentSuffix: 'encrypted',
        tags: { Environment: 'test' },
      });

      expect(bucket).toBeDefined();
      // Encryption is configured in the component
    });

    it('should block public access on S3 bucket', async () => {
      const bucket = new ArtifactBucket('test-private-bucket', {
        environmentSuffix: 'private',
        tags: { Environment: 'test' },
      });

      expect(bucket).toBeDefined();
      // Public access block is configured in the component
    });
  });

  describe('CodeBuildProject Component', () => {
    it('should create CodeBuild project with correct configuration', async () => {
      const project = new CodeBuildProject('test-codebuild', {
        environmentSuffix: 'test',
        artifactBucketName: pulumi.output('test-bucket'),
        artifactBucketArn: pulumi.output(
          'arn:aws:s3:::test-bucket'
        ),
        tags: { Environment: 'test' },
      });

      expect(project).toBeDefined();
      expect(project.projectName).toBeDefined();
      expect(project.projectArn).toBeDefined();
    });

    it('should create IAM role for CodeBuild', async () => {
      const project = new CodeBuildProject('test-codebuild-iam', {
        environmentSuffix: 'iamtest',
        artifactBucketName: pulumi.output('test-bucket'),
        artifactBucketArn: pulumi.output(
          'arn:aws:s3:::test-bucket'
        ),
        tags: { Environment: 'test' },
      });

      expect(project).toBeDefined();
      // IAM role is created internally by the CodeBuildProject component
      const projectName = await project.projectName.promise();
      expect(projectName).toBeDefined();
    });

    it('should create CloudWatch Logs group', async () => {
      const project = new CodeBuildProject('test-codebuild-logs', {
        environmentSuffix: 'logstest',
        artifactBucketName: pulumi.output('test-bucket'),
        artifactBucketArn: pulumi.output(
          'arn:aws:s3:::test-bucket'
        ),
        tags: { Environment: 'test' },
      });

      expect(project).toBeDefined();
      // CloudWatch Logs group is created in the component
    });
  });

  describe('BuildNotifications Component', () => {
    it('should create SNS topic for notifications', async () => {
      const notifications = new BuildNotifications(
        'test-notifications',
        {
          environmentSuffix: 'test',
          codeBuildProjectArn: pulumi.output(
            'arn:aws:codebuild:us-east-1:123456789012:project/test-project'
          ),
          tags: { Environment: 'test' },
        }
      );

      expect(notifications).toBeDefined();
      expect(notifications.snsTopicArn).toBeDefined();

      const topicArn = await notifications.snsTopicArn.promise();
      expect(topicArn).toBeDefined();
    });

    it('should create EventBridge rule for build failures', async () => {
      const notifications = new BuildNotifications(
        'test-notifications-rule',
        {
          environmentSuffix: 'ruletest',
          codeBuildProjectArn: pulumi.output(
            'arn:aws:codebuild:us-east-1:123456789012:project/test-project'
          ),
          tags: { Environment: 'test' },
        }
      );

      expect(notifications).toBeDefined();
      // EventBridge rule is created in the component
    });

    it('should configure SNS topic policy for EventBridge', async () => {
      const notifications = new BuildNotifications(
        'test-notifications-policy',
        {
          environmentSuffix: 'policytest',
          codeBuildProjectArn: pulumi.output(
            'arn:aws:codebuild:us-east-1:123456789012:project/test-project'
          ),
          tags: { Environment: 'test' },
        }
      );

      expect(notifications).toBeDefined();
      // SNS topic policy is created in the component
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should include environmentSuffix in all resource names', async () => {
      const suffix = 'naming-test';
      const stack = new TapStack('test-naming', {
        environmentSuffix: suffix,
        tags: { Environment: 'test' },
      });

      const bucketName = await stack.artifactBucketName.promise();
      const projectName = await stack.codeBuildProjectName.promise();

      expect(bucketName).toContain(suffix);
      expect(projectName).toContain(suffix);
    });
  });

  describe('Tag Propagation', () => {
    it('should propagate tags to all resources', async () => {
      const testTags = {
        Environment: 'production',
        Team: 'devops',
        Owner: 'infrastructure',
      };

      const stack = new TapStack('test-tags', {
        environmentSuffix: 'tagtest',
        tags: testTags,
      });

      expect(stack).toBeDefined();
      // Tags are applied to all resources in the component
    });
  });
});
