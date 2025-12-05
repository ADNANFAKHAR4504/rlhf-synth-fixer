import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test-env';

describe('TapStack - CI/CD Pipeline', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('S3 Artifact Bucket', () => {
    test('creates S3 bucket with correct name and versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([
              Match.stringLikeRegexp(`pipeline-artifacts-${environmentSuffix}`),
            ]),
          ]),
        }),
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('bucket has deletion policy DESTROY', () => {
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('bucket has encryption enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });
    });
  });

  describe('CodeCommit Repository', () => {
    test('creates repository with correct name', () => {
      template.hasResourceProperties('AWS::CodeCommit::Repository', {
        RepositoryName: `app-repo-${environmentSuffix}`,
        RepositoryDescription: 'Node.js application repository',
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('creates log group for test project with 7-day retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/codebuild/test-project-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });

    test('creates log group for staging project with 7-day retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/codebuild/staging-deploy-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });

    test('creates log group for production project with 7-day retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/codebuild/production-deploy-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });

    test('all log groups have deletion policy DESTROY', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      const logGroupKeys = Object.keys(logGroups);

      expect(logGroupKeys.length).toBe(3);

      logGroupKeys.forEach((key) => {
        expect(logGroups[key].DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('CodeBuild Projects', () => {
    test('creates test project with Node.js 18 runtime', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `test-project-${environmentSuffix}`,
        Description: 'Run unit tests for Node.js application',
        Environment: Match.objectLike({
          ComputeType: 'BUILD_GENERAL1_SMALL',
          Image: 'aws/codebuild/standard:7.0',
        }),
        Source: {
          Type: 'CODECOMMIT',
          BuildSpec: Match.stringLikeRegexp('nodejs.*18'),
        },
      });
    });

    test('creates staging deployment project with Node.js 18', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `staging-deploy-${environmentSuffix}`,
        Description: 'Deploy to staging environment',
        Environment: Match.objectLike({
          ComputeType: 'BUILD_GENERAL1_SMALL',
          Image: 'aws/codebuild/standard:7.0',
          EnvironmentVariables: Match.arrayWith([
            Match.objectLike({
              Name: 'ENVIRONMENT',
              Value: 'staging',
            }),
          ]),
        }),
      });
    });

    test('creates production deployment project with Node.js 18', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `production-deploy-${environmentSuffix}`,
        Description: 'Deploy to production environment',
        Environment: Match.objectLike({
          ComputeType: 'BUILD_GENERAL1_SMALL',
          Image: 'aws/codebuild/standard:7.0',
          EnvironmentVariables: Match.arrayWith([
            Match.objectLike({
              Name: 'ENVIRONMENT',
              Value: 'production',
            }),
          ]),
        }),
      });
    });

    test('all CodeBuild projects have CloudWatch logging configured', () => {
      const projects = template.findResources('AWS::CodeBuild::Project');
      const projectKeys = Object.keys(projects);

      expect(projectKeys.length).toBe(3);

      projectKeys.forEach((key) => {
        expect(projects[key].Properties.LogsConfig).toBeDefined();
        expect(projects[key].Properties.LogsConfig.CloudWatchLogs).toBeDefined();
        expect(projects[key].Properties.LogsConfig.CloudWatchLogs.Status).toBe('ENABLED');
      });
    });
  });

  describe('SNS Topic', () => {
    test('creates notification topic with correct name', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `pipeline-notifications-${environmentSuffix}`,
        DisplayName: 'CI/CD Pipeline Notifications',
      });
    });
  });

  describe('CodePipeline', () => {
    test('creates pipeline with correct name', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: `app-pipeline-${environmentSuffix}`,
      });
    });

    test('pipeline uses artifact bucket', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        ArtifactStore: Match.objectLike({
          Type: 'S3',
        }),
      });
    });

    test('pipeline has Source stage with CodeCommit', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Source',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: {
                  Category: 'Source',
                  Owner: 'AWS',
                  Provider: 'CodeCommit',
                  Version: '1',
                },
                Configuration: Match.objectLike({
                  BranchName: 'main',
                  PollForSourceChanges: true,
                }),
                Name: 'CodeCommit_Source',
              }),
            ]),
          }),
        ]),
      });
    });

    test('pipeline has Build stage with CodeBuild', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Build',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: {
                  Category: 'Build',
                  Owner: 'AWS',
                  Provider: 'CodeBuild',
                  Version: '1',
                },
                Name: 'Run_Unit_Tests',
              }),
            ]),
          }),
        ]),
      });
    });

    test('pipeline has Deploy_Staging stage', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Deploy_Staging',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: {
                  Category: 'Build',
                  Owner: 'AWS',
                  Provider: 'CodeBuild',
                  Version: '1',
                },
                Name: 'Deploy_to_Staging',
              }),
            ]),
          }),
        ]),
      });
    });

    test('pipeline has Manual Approval stage', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Approval',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: {
                  Category: 'Approval',
                  Owner: 'AWS',
                  Provider: 'Manual',
                  Version: '1',
                },
                Name: 'Manual_Approval',
                Configuration: Match.objectLike({
                  CustomData: 'Please review staging deployment before promoting to production',
                }),
              }),
            ]),
          }),
        ]),
      });
    });

    test('pipeline has Deploy_Production stage', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Deploy_Production',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: {
                  Category: 'Build',
                  Owner: 'AWS',
                  Provider: 'CodeBuild',
                  Version: '1',
                },
                Name: 'Deploy_to_Production',
              }),
            ]),
          }),
        ]),
      });
    });

    test('pipeline has exactly 5 stages in correct order', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: [
          Match.objectLike({ Name: 'Source' }),
          Match.objectLike({ Name: 'Build' }),
          Match.objectLike({ Name: 'Deploy_Staging' }),
          Match.objectLike({ Name: 'Approval' }),
          Match.objectLike({ Name: 'Deploy_Production' }),
        ],
      });
    });
  });

  describe('CloudWatch Events Rule', () => {
    test('creates EventBridge rule for pipeline failures', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `pipeline-failure-${environmentSuffix}`,
        Description: 'Notify on pipeline failures',
        EventPattern: Match.objectLike({
          source: ['aws.codepipeline'],
          'detail-type': ['CodePipeline Pipeline Execution State Change'],
          detail: {
            state: ['FAILED'],
          },
        }),
        State: 'ENABLED',
      });
    });

    test('EventBridge rule targets SNS topic', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Targets: Match.arrayWith([
          Match.objectLike({
            Arn: Match.anyValue(),
          }),
        ]),
      });
    });
  });

  describe('IAM Roles', () => {
    test('creates IAM role for CodePipeline', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'codepipeline.amazonaws.com',
              },
            }),
          ]),
        }),
      });
    });

    test('creates IAM roles for CodeBuild projects', () => {
      const roles = template.findResources('AWS::IAM::Role', {
        Properties: {
          AssumeRolePolicyDocument: Match.objectLike({
            Statement: Match.arrayWith([
              Match.objectLike({
                Effect: 'Allow',
                Principal: {
                  Service: 'codebuild.amazonaws.com',
                },
              }),
            ]),
          }),
        },
      });

      const roleKeys = Object.keys(roles);
      // Should have 3 CodeBuild roles (test, staging, production)
      expect(roleKeys.length).toBeGreaterThanOrEqual(3);
    });

    test('creates IAM role for EventBridge to publish to SNS', () => {
      template.hasResourceProperties('AWS::SNS::TopicPolicy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'events.amazonaws.com',
              },
              Action: 'sns:Publish',
            }),
          ]),
        }),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports repository clone URL', () => {
      template.hasOutput('RepositoryCloneUrlHttp', {
        Description: 'CodeCommit repository clone URL (HTTP)',
      });
    });

    test('exports pipeline name', () => {
      template.hasOutput('PipelineName', {
        Description: 'CodePipeline name',
      });
    });

    test('exports artifact bucket name', () => {
      template.hasOutput('ArtifactBucketName', {
        Description: 'S3 bucket for pipeline artifacts',
      });
    });

    test('exports notification topic ARN', () => {
      template.hasOutput('NotificationTopicArn', {
        Description: 'SNS topic for pipeline notifications',
      });
    });
  });

  describe('Resource Count', () => {
    test('creates expected number of resources', () => {
      const resources = template.toJSON().Resources;
      const resourceCount = Object.keys(resources).length;

      // Expected resources:
      // 1 S3 Bucket + Bucket Policy
      // 1 CodeCommit Repository
      // 3 CloudWatch Log Groups
      // 3 CodeBuild Projects + 3 Roles + Policies
      // 1 SNS Topic + Policy
      // 1 CodePipeline + Role + Policies
      // 1 EventBridge Rule
      // Total should be around 25-35 resources (including auto-generated policies)

      expect(resourceCount).toBeGreaterThan(20);
      expect(resourceCount).toBeLessThan(50);
    });
  });

  describe('Environment Suffix Integration', () => {
    test('all named resources include environment suffix', () => {
      const suffix = 'unique-test-123';
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {
        environmentSuffix: suffix,
      });
      const testTemplate = Template.fromStack(testStack);

      // Check bucket name
      testTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([
              Match.stringLikeRegexp(`pipeline-artifacts-${suffix}`),
            ]),
          ]),
        }),
      });

      // Check repository name
      testTemplate.hasResourceProperties('AWS::CodeCommit::Repository', {
        RepositoryName: `app-repo-${suffix}`,
      });

      // Check pipeline name
      testTemplate.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: `app-pipeline-${suffix}`,
      });

      // Check SNS topic name
      testTemplate.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `pipeline-notifications-${suffix}`,
      });
    });
  });

  describe('Destroyability', () => {
    test('S3 bucket is configured for complete removal', () => {
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('no resources have RETAIN policy', () => {
      const resources = template.toJSON().Resources;

      Object.keys(resources).forEach((key) => {
        const resource = resources[key];
        expect(resource.DeletionPolicy).not.toBe('Retain');
        expect(resource.UpdateReplacePolicy).not.toBe('Retain');
      });
    });
  });
});
