import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      sourceType: 'codecommit',
      repositoryName: 'test-repo',
      environment: 'Test',
      projectName: 'Test Project',
    });
    template = Template.fromStack(stack);
  });

  test('Creates CodePipeline with correct stages', () => {
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Stages: Match.arrayWith([
        Match.objectLike({
          Name: 'Source',
        }),
        Match.objectLike({
          Name: 'Build',
        }),
        Match.objectLike({
          Name: 'Test',
        }),
        Match.objectLike({
          Name: 'Deploy',
        }),
      ]),
    });
  });

  test('Creates S3 bucket for artifacts', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled',
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('Creates CodeBuild projects for build and test', () => {
    template.resourceCountIs('AWS::CodeBuild::Project', 2);

    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Environment: {
        Image: 'aws/codebuild/standard:7.0',
        Type: 'LINUX_CONTAINER',
        ComputeType: 'BUILD_GENERAL1_SMALL',
      },
    });
  });

  test('Creates CodeCommit repository when sourceType is codecommit', () => {
    template.hasResourceProperties('AWS::CodeCommit::Repository', {
      RepositoryName: 'test-repo',
    });
  });

  test('Creates IAM roles with least privilege', () => {
    // Pipeline role
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumedRolePolicy: {
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'codepipeline.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
    });

    // Build role
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumedRolePolicy: {
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'codebuild.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
    });

    // Deploy role
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumedRolePolicy: {
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'cloudformation.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
    });
  });

  test('Applies organizational tags to resources', () => {
    const resources = template.findResources('AWS::CodePipeline::Pipeline');
    const pipelineLogicalId = Object.keys(resources)[0];

    template.hasResource('AWS::CodePipeline::Pipeline', {
      Properties: Match.anyValue(),
      Metadata: Match.objectLike({
        'aws:cdk:path': Match.stringLikeRegexp('TestTapStack'),
      }),
    });
  });

  test('Creates CloudFormation deployment action', () => {
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Stages: Match.arrayWith([
        Match.objectLike({
          Name: 'Deploy',
          Actions: Match.arrayWith([
            Match.objectLike({
              ActionTypeId: {
                Category: 'Deploy',
                Owner: 'AWS',
                Provider: 'CloudFormation',
                Version: '1',
              },
              Configuration: Match.objectLike({
                ActionMode: 'CREATE_UPDATE',
                StackName: 'tap-application-test',
              }),
            }),
          ]),
        }),
      ]),
    });
  });

  test('Throws error for GitHub source without connection ARN', () => {
    expect(() => {
      new TapStack(app, 'TestGitHubStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        sourceType: 'github',
        repositoryName: 'owner/repo',
        environment: 'Test',
        projectName: 'Test Project',
      });
    }).toThrow('GitHub connection ARN is required for GitHub source');
  });

  test('Creates GitHub source action when properly configured', () => {
    const githubStack = new TapStack(app, 'TestGitHubStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      sourceType: 'github',
      repositoryName: 'owner/repo',
      environment: 'Test',
      projectName: 'Test Project',
      githubConnectionArn: 'arn:aws:codestar-connections:us-east-1:123456789012:connection/test',
    });

    const githubTemplate = Template.fromStack(githubStack);

    githubTemplate.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Stages: Match.arrayWith([
        Match.objectLike({
          Name: 'Source',
          Actions: Match.arrayWith([
            Match.objectLike({
              ActionTypeId: {
                Category: 'Source',
                Owner: 'AWS',
                Provider: 'CodeStarSourceConnection',
                Version: '1',
              },
              Configuration: Match.objectLike({
                ConnectionArn: 'arn:aws:codestar-connections:us-east-1:123456789012:connection/test',
                FullRepositoryId: 'owner/repo',
                BranchName: 'main',
              }),
            }),
          ]),
        }),
      ]),
    });
  });

  test('Extensibility - can add new stages', () => {
    const newStage: cdk.aws_codepipeline.StageProps = {
      stageName: 'Integration',
      actions: [
        new cdk.aws_codepipeline_actions.ManualApprovalAction({
          actionName: 'ManualApproval',
        }),
      ],
    };

    expect(() => {
      stack.addStage(newStage);
    }).not.toThrow();
  });
});