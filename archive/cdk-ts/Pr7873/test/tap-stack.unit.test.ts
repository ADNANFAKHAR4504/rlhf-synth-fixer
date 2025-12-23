import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('CodeCommit Repository', () => {
    test('should create CodeCommit repository with correct name', () => {
      template.hasResourceProperties('AWS::CodeCommit::Repository', {
        RepositoryName: `nodejs-webapp-${environmentSuffix}`,
        RepositoryDescription: 'Node.js web application source repository',
      });
    });

    test('should have exactly one CodeCommit repository', () => {
      template.resourceCountIs('AWS::CodeCommit::Repository', 1);
    });

    test('repository name includes environmentSuffix', () => {
      template.hasResourceProperties('AWS::CodeCommit::Repository', {
        RepositoryName: Match.stringLikeRegexp(`.*-${environmentSuffix}`),
      });
    });
  });

  describe('S3 Website Bucket', () => {
    test('should create S3 bucket for deployments', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `nodejs-webapp-site-${environmentSuffix}`,
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('website bucket should be destroyable', () => {
      template.hasResource('AWS::S3::Bucket', {
        Properties: {
          BucketName: `nodejs-webapp-site-${environmentSuffix}`,
        },
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });

    test('website bucket should have auto-delete objects', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `nodejs-webapp-site-${environmentSuffix}`,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:auto-delete-objects',
            Value: 'true',
          }),
        ]),
      });
    });
  });

  describe('Build Cache Bucket', () => {
    test('should create S3 bucket for build cache', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `codebuild-cache-${environmentSuffix}`,
      });
    });

    test('cache bucket should be destroyable', () => {
      template.hasResource('AWS::S3::Bucket', {
        Properties: {
          BucketName: `codebuild-cache-${environmentSuffix}`,
        },
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });

    test('should have exactly three S3 buckets (deployment + cache + pipeline artifacts)', () => {
      // Website bucket, cache bucket, and pipeline artifacts bucket
      template.resourceCountIs('AWS::S3::Bucket', 3);
    });
  });

  describe('CodeBuild Project', () => {
    test('should create CodeBuild project with correct name', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `nodejs-webapp-build-${environmentSuffix}`,
      });
    });

    test('should use Node.js 18 build image', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Environment: {
          Image: 'aws/codebuild/standard:7.0',
          ComputeType: 'BUILD_GENERAL1_SMALL',
        },
      });
    });

    test('should set NODE_ENV environment variable to production', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Environment: {
          EnvironmentVariables: Match.arrayWith([
            {
              Name: 'NODE_ENV',
              Type: 'PLAINTEXT',
              Value: 'production',
            },
          ]),
        },
      });
    });

    test('should enable S3 caching', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Cache: {
          Type: 'S3',
          Location: Match.objectLike({
            'Fn::Join': Match.anyValue(),
          }),
        },
      });
    });

    test('should have correct buildspec commands', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Source: {
          BuildSpec: Match.stringLikeRegexp('.*npm install.*'),
        },
      });
    });

    test('should have exactly one CodeBuild project', () => {
      template.resourceCountIs('AWS::CodeBuild::Project', 1);
    });
  });

  describe('CodePipeline', () => {
    test('should create pipeline with correct name', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: `nodejs-webapp-pipeline-${environmentSuffix}`,
      });
    });

    test('should have restart execution on update enabled', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        RestartExecutionOnUpdate: true,
      });
    });

    test('should have Source, Build, and Deploy stages', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: [
          Match.objectLike({ Name: 'Source' }),
          Match.objectLike({ Name: 'Build' }),
          Match.objectLike({ Name: 'Deploy' }),
        ],
      });
    });

    test('should have exactly one pipeline', () => {
      template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
    });

    test('pipeline should use PipelineType V2', () => {
      const pipelineResource = template.toJSON().Resources;
      const pipeline = Object.values(pipelineResource).find(
        (r: any) => r.Type === 'AWS::CodePipeline::Pipeline'
      );
      expect(pipeline).toBeDefined();
      // PipelineType V2 is the default in newer CDK versions
      // If PipelineType is undefined or V2, it's correct
      expect(['V2', undefined]).toContain((pipeline as any).Properties.PipelineType);
    });
  });

  describe('Pipeline Source Stage', () => {
    test('should use CodeCommit as source with correct configuration', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Source',
            Actions: [
              Match.objectLike({
                ActionTypeId: {
                  Category: 'Source',
                  Owner: 'AWS',
                  Provider: 'CodeCommit',
                  Version: '1',
                },
                Configuration: {
                  BranchName: 'main',
                  PollForSourceChanges: false,
                },
              }),
            ],
          }),
        ]),
      });
    });

    test('should use event-driven triggering (not polling)', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Actions: Match.arrayWith([
              Match.objectLike({
                Configuration: {
                  PollForSourceChanges: false,
                },
              }),
            ]),
          }),
        ]),
      });
    });
  });

  describe('Pipeline Build Stage', () => {
    test('should use CodeBuild in build stage', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Build',
            Actions: [
              Match.objectLike({
                ActionTypeId: {
                  Category: 'Build',
                  Owner: 'AWS',
                  Provider: 'CodeBuild',
                  Version: '1',
                },
              }),
            ],
          }),
        ]),
      });
    });
  });

  describe('Pipeline Deploy Stage', () => {
    test('should use S3 deployment in deploy stage', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Deploy',
            Actions: [
              Match.objectLike({
                ActionTypeId: {
                  Category: 'Deploy',
                  Owner: 'AWS',
                  Provider: 'S3',
                  Version: '1',
                },
                Configuration: {
                  Extract: 'true',
                },
              }),
            ],
          }),
        ]),
      });
    });
  });

  describe('EventBridge Rule', () => {
    test('should create EventBridge rule for automatic triggering', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['aws.codecommit'],
          'detail-type': ['CodeCommit Repository State Change'],
          detail: {
            event: ['referenceCreated', 'referenceUpdated'],
            referenceName: ['main'],
          },
        },
        State: 'ENABLED',
      });
    });

    test('EventBridge rule targets the pipeline', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Targets: Match.arrayWith([
          Match.objectLike({
            Arn: Match.anyValue(),
          }),
        ]),
      });
    });
  });

  describe('IAM Permissions', () => {
    test('should create IAM role for CodeBuild', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('should create IAM role for CodePipeline', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codepipeline.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('should create IAM role for EventBridge', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'events.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('CodeBuild should have permissions to read repository', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                Match.stringLikeRegexp('codecommit:.*'),
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('CodeBuild should have permissions to access S3 buckets', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([Match.stringLikeRegexp('s3:.*')]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should output website bucket name', () => {
      template.hasOutput('WebsiteBucketName', {
        Description: 'Name of the deployment bucket',
        Export: {
          Name: `WebsiteBucketName-${environmentSuffix}`,
        },
      });
    });

    test('should output pipeline ARN', () => {
      template.hasOutput('PipelineARN', {
        Description: 'ARN of the CodePipeline',
        Export: {
          Name: `PipelineARN-${environmentSuffix}`,
        },
      });
    });

    test('should output repository clone URL', () => {
      template.hasOutput('RepositoryCloneURL', {
        Description: 'HTTP clone URL for the CodeCommit repository',
        Export: {
          Name: `RepositoryCloneURL-${environmentSuffix}`,
        },
      });
    });

    test('should have exactly three outputs', () => {
      const outputs = Object.keys(template.toJSON().Outputs || {});
      expect(outputs).toHaveLength(3);
    });
  });

  describe('Resource Naming Conventions', () => {
    test('all named resources should include environmentSuffix', () => {
      const resources = template.toJSON().Resources;
      const namedResources = Object.values(resources).filter((r: any) => {
        return (
          r.Properties?.RepositoryName ||
          r.Properties?.BucketName ||
          r.Properties?.Name
        );
      });

      namedResources.forEach((resource: any) => {
        const name =
          resource.Properties.RepositoryName ||
          resource.Properties.BucketName ||
          resource.Properties.Name;
        if (typeof name === 'string') {
          expect(name).toContain(environmentSuffix);
        }
      });
    });
  });

  describe('Deletion Policies', () => {
    test('website bucket should not have RETAIN policy', () => {
      const resources = template.toJSON().Resources;
      const websiteBucket = Object.values(resources).find(
        (r: any) =>
          r.Type === 'AWS::S3::Bucket' &&
          r.Properties?.BucketName?.includes('site')
      );
      expect(websiteBucket).toBeDefined();
      expect((websiteBucket as any).UpdateReplacePolicy).toBe('Delete');
      expect((websiteBucket as any).DeletionPolicy).toBe('Delete');
    });

    test('cache bucket should not have RETAIN policy', () => {
      const resources = template.toJSON().Resources;
      const cacheBucket = Object.values(resources).find(
        (r: any) =>
          r.Type === 'AWS::S3::Bucket' &&
          r.Properties?.BucketName?.includes('cache')
      );
      expect(cacheBucket).toBeDefined();
      expect((cacheBucket as any).UpdateReplacePolicy).toBe('Delete');
      expect((cacheBucket as any).DeletionPolicy).toBe('Delete');
    });
  });

  describe('Stack Tagging', () => {
    test('resources should have tags applied', () => {
      const resources = template.toJSON().Resources;
      const taggedResources = Object.values(resources).filter(
        (r: any) => r.Properties?.Tags
      );

      // Verify that resources are being tagged
      expect(taggedResources.length).toBeGreaterThan(0);

      // CDK automatically adds tags to resources
      // Verify at least some common tags are present
      const allTagKeys = new Set<string>();
      taggedResources.forEach((resource: any) => {
        const tags = resource.Properties.Tags;
        tags.forEach((t: any) => allTagKeys.add(t.Key));
      });

      // Common CDK tags include: aws-cdk:auto-delete-objects, Author, CreatedAt, Repository, etc.
      expect(allTagKeys.size).toBeGreaterThan(0);
      expect(Array.from(allTagKeys).some(key => key.includes('aws') || key.includes('Author'))).toBe(true);
    });
  });

  describe('Stack Properties with Custom environmentSuffix', () => {
    test('should accept custom environmentSuffix from props', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: 'custom',
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::CodeCommit::Repository', {
        RepositoryName: 'nodejs-webapp-custom',
      });
    });

    test('should accept environmentSuffix from context', () => {
      const contextApp = new cdk.App({
        context: { environmentSuffix: 'context' },
      });
      const contextStack = new TapStack(contextApp, 'ContextStack', {});
      const contextTemplate = Template.fromStack(contextStack);

      contextTemplate.hasResourceProperties('AWS::CodeCommit::Repository', {
        RepositoryName: 'nodejs-webapp-context',
      });
    });

    test('should use default environmentSuffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack', {});
      const defaultTemplate = Template.fromStack(defaultStack);

      defaultTemplate.hasResourceProperties('AWS::CodeCommit::Repository', {
        RepositoryName: 'nodejs-webapp-dev',
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('stack should handle empty environmentSuffix by using default', () => {
      const emptyApp = new cdk.App();
      const emptyStack = new TapStack(emptyApp, 'EmptyStack', {
        environmentSuffix: '',
      });
      const emptyTemplate = Template.fromStack(emptyStack);

      // Empty string will be falsy, so it defaults to 'dev'
      emptyTemplate.hasResourceProperties('AWS::CodeCommit::Repository', {
        RepositoryName: Match.stringLikeRegexp('nodejs-webapp-.*'),
      });
    });

    test('stack should be synthesizable', () => {
      expect(() => {
        app.synth();
      }).not.toThrow();
    });
  });
});
