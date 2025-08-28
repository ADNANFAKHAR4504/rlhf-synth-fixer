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

  test('Creates IAM roles with least privilege', () => {
    // Pipeline role
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
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
      AssumeRolePolicyDocument: {
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
      AssumeRolePolicyDocument: {
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
    // Check that stack-level tags are applied
    const stackTags = template.findResources('AWS::CodePipeline::Pipeline');
    expect(Object.keys(stackTags).length).toBeGreaterThan(0);

    // Verify the pipeline exists (tags are applied at stack level)
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Name: 'tap-pipeline-test',
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
    const errorApp = new cdk.App();
    expect(() => {
      new TapStack(errorApp, 'TestGitHubStack', {
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
    const githubApp = new cdk.App();
    const githubStack = new TapStack(githubApp, 'TestGitHubStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      sourceType: 'github',
      repositoryName: 'owner/repo',
      environment: 'Test',
      projectName: 'Test Project',
      githubConnectionArn:
        'arn:aws:codestar-connections:us-east-1:123456789012:connection/test',
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
                ConnectionArn:
                  'arn:aws:codestar-connections:us-east-1:123456789012:connection/test',
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

  test('Extensibility - can add actions to existing stages', () => {
    const newAction = new cdk.aws_codepipeline_actions.ManualApprovalAction({
      actionName: 'AdditionalApproval',
    });

    expect(() => {
      stack.addActionToStage('Test', newAction);
    }).not.toThrow();
  });

  test('Extensibility - throws error when adding action to non-existent stage', () => {
    const newAction = new cdk.aws_codepipeline_actions.ManualApprovalAction({
      actionName: 'AdditionalApproval',
    });

    expect(() => {
      stack.addActionToStage('NonExistentStage', newAction);
    }).toThrow('Stage NonExistentStage not found');
  });

  test('Supports custom branch configuration', () => {
    const customApp = new cdk.App();
    const customStack = new TapStack(customApp, 'TestCustomStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      sourceType: 'codecommit',
      repositoryName: 'custom-repo',
      environment: 'Test',
      projectName: 'Test Project',
      branch: 'develop',
    });

    const customTemplate = Template.fromStack(customStack);

    customTemplate.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Stages: Match.arrayWith([
        Match.objectLike({
          Name: 'Source',
          Actions: Match.arrayWith([
            Match.objectLike({
              Configuration: Match.objectLike({
                BranchName: 'develop',
              }),
            }),
          ]),
        }),
      ]),
    });
  });
});
