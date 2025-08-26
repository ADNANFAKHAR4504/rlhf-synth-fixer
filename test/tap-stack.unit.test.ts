import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  // =========================================
  // S3 BUCKET TESTS
  // =========================================
  test('Should create source S3 bucket', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: { Status: 'Enabled' },
    });
  });

  test('Should create artifacts S3 bucket with lifecycle rules', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: { Status: 'Enabled' },
      LifecycleConfiguration: {
        Rules: Match.arrayWith([
          Match.objectLike({
            NoncurrentVersionExpiration: { NoncurrentDays: 30 },
            Status: 'Enabled',
          }),
        ]),
      },
    });
  });

  // =========================================
  // LOG GROUPS TESTS
  // =========================================
  test('Should create build log group', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: `/aws/codebuild/nova-model-build-${environmentSuffix}`,
    });
  });

  test('Should create pipeline log group', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: `/aws/codepipeline/nova-model-pipeline-${environmentSuffix}`,
    });
  });

  // =========================================
  // IAM ROLES TESTS
  // =========================================
  test('Should create CodePipeline IAM Role', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Principal: { Service: 'codepipeline.amazonaws.com' },
          }),
        ]),
      }),
    });
  });

  test('Should create CodeBuild IAM Role', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Principal: { Service: 'codebuild.amazonaws.com' },
          }),
        ]),
      }),
    });
  });

  // =========================================
  // CODEBUILD PROJECT TESTS
  // =========================================
  test('Should create CodeBuild Project', () => {
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Name: `nova-model-build-${environmentSuffix}`,
      Environment: {
        ComputeType: 'BUILD_GENERAL1_SMALL',
        PrivilegedMode: false,
        EnvironmentVariables: Match.arrayWith([
          Match.objectLike({
            Name: 'BUILD_ENV',
            Value: 'production',
          }),
        ]),
      },
    });
  });

  // =========================================
  // CODEPIPELINE TESTS
  // =========================================
  test('Should create CodePipeline', () => {
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Name: `nova-model-pipeline-${environmentSuffix}`,
    });
  });

  test('Pipeline should have Source, Build, and Deploy stages', () => {
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Stages: Match.arrayWith([
        Match.objectLike({ Name: 'Source' }),
        Match.objectLike({ Name: 'Build' }),
        Match.objectLike({ Name: 'Deploy-US-East-1' }),
        Match.objectLike({ Name: 'Deploy-US-West-2' }),
      ]),
    });
  });

  // =========================================
  // CLOUDFORMATION DEPLOYMENT ROLES
  // =========================================
  test('Should create CloudFormation deployment role', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.anyValue(),
    });
  });

  // =========================================
  // CLOUDFORMATION OUTPUTS TESTS
  // =========================================
  test('Should create expected CloudFormation outputs', () => {
    template.hasOutput('SourceBucketName', Match.objectLike({
      Description: 'S3 Source Bucket Name',
    }));

    template.hasOutput('ArtifactsBucketName', Match.objectLike({
      Description: 'S3 Artifacts Bucket Name',
    }));

    template.hasOutput('PipelineName', Match.objectLike({
      Description: 'CodePipeline Name',
    }));

    template.hasOutput('BuildProjectName', Match.objectLike({
      Description: 'CodeBuild Project Name',
    }));

    template.hasOutput('PipelineConsoleUrl', Match.objectLike({
      Description: 'CodePipeline Console URL',
    }));
  });
});
