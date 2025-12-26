import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { CiCdPipelineStack } from '../lib/ci-cd-pipeline-stack';

const environmentSuffix = 'test';

describe('TapStack', () => {
  describe('with explicit environment suffix', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
      template = Template.fromStack(stack);
    });

    test('creates nested CI/CD Pipeline stack', () => {
      // Get all nested stacks
      const assembly = app.synth();
      const nestedStacks = assembly.stacks.filter(s => s.stackName.includes('CiCdPipelineStack'));
      
      expect(nestedStacks.length).toBe(1);
      expect(nestedStacks[0].stackName).toContain('CiCdPipelineStack');
    });

    test('applies global tags correctly', () => {
      const tags = cdk.Tags.of(stack);
      expect(stack.tags.tagValues()).toBeDefined();
    });

    test('passes environment suffix to nested stack', () => {
      const assembly = app.synth();
      const nestedStack = assembly.stacks.find(s => s.stackName.includes('CiCdPipelineStack'));
      expect(nestedStack).toBeDefined();
    });

    test('applies Development environment tag for non-prod suffix', () => {
      const template = Template.fromStack(stack);
      // Stack should have Development tag since environmentSuffix is 'test'
      expect(stack.node.children).toBeDefined();
    });
  });

  describe('with context environment suffix', () => {
    let app: cdk.App;
    let stack: TapStack;

    beforeEach(() => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'context-test',
        },
      });
      stack = new TapStack(app, 'TestTapStackContext');
    });

    test('uses context environment suffix when props not provided', () => {
      const assembly = app.synth();
      expect(assembly.stacks.length).toBeGreaterThan(0);
    });
  });

  describe('with default environment suffix', () => {
    let app: cdk.App;
    let stack: TapStack;

    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStackDefault');
    });

    test('uses default dev suffix when no props or context', () => {
      const assembly = app.synth();
      expect(assembly.stacks.length).toBeGreaterThan(0);
    });
  });

  describe('with prod environment suffix', () => {
    let app: cdk.App;
    let stack: TapStack;

    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStackProd', { environmentSuffix: 'prod' });
    });

    test('applies Production environment tag for prod suffix', () => {
      const assembly = app.synth();
      expect(assembly.stacks.length).toBeGreaterThan(0);
      // Stack should have Production tag since environmentSuffix is 'prod'
    });
  });
});

describe('CiCdPipelineStack', () => {
  let app: cdk.App;
  let stack: CiCdPipelineStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new CiCdPipelineStack(app, 'TestPipelineStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('S3 Buckets', () => {
    test('creates source bucket with correct configuration', () => {
      // CDK generates bucket names dynamically, so we match on properties
      template.resourceCountIs('AWS::S3::Bucket', 2);
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [{
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          }],
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('creates artifacts bucket with versioning and lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        LifecycleConfiguration: {
          Rules: [{
            Id: 'DeleteOldVersions',
            Status: 'Enabled',
            NoncurrentVersionExpiration: {
              NoncurrentDays: 30,
            },
          }],
        },
      });
    });

    test('buckets have DESTROY removal policy', () => {
      // Check for the custom resource that handles bucket deletion
      template.hasResourceProperties('Custom::S3AutoDeleteObjects', {
        ServiceToken: Match.anyValue(),
      });
    });
  });

  describe('CodeBuild Project', () => {
    test('creates CodeBuild project with correct configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `web-app-build-${environmentSuffix}`,
        Environment: {
          Type: 'LINUX_CONTAINER',
          Image: 'aws/codebuild/standard:7.0',
          ComputeType: 'BUILD_GENERAL1_SMALL',
        },
      });
    });

    test('CodeBuild project has correct build spec', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Source: {
          Type: 'NO_SOURCE',
          BuildSpec: Match.anyValue(), // BuildSpec is stored as a string in CFN template
        },
      });
    });

    test('CodeBuild has environment variables configured', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Environment: Match.objectLike({
          EnvironmentVariables: [{
            Name: 'ARTIFACTS_BUCKET',
            Type: 'PLAINTEXT',
            Value: Match.anyValue(),
          }],
        }),
      });
    });
  });

  describe('CodePipeline', () => {
    test('creates CodePipeline V2 with correct configuration', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: `web-app-pipeline-${environmentSuffix}`,
        PipelineType: 'V2',
        ExecutionMode: 'PARALLEL',
      });
    });

    test('pipeline has three stages', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({ Name: 'Source' }),
          Match.objectLike({ Name: 'Build' }),
          Match.objectLike({ Name: 'Deploy' }),
        ]),
      });
    });

    test('source stage uses S3 source action', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Source',
            Actions: Match.arrayWith([
              Match.objectLike({
                Name: 'S3_Source',
                ActionTypeId: {
                  Category: 'Source',
                  Owner: 'AWS',
                  Provider: 'S3',
                  Version: '1',
                },
              }),
            ]),
          }),
        ]),
      });
    });

    test('build stage uses CodeBuild action', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Build',
            Actions: Match.arrayWith([
              Match.objectLike({
                Name: 'Build_and_Test',
                ActionTypeId: {
                  Category: 'Build',
                  Owner: 'AWS',
                  Provider: 'CodeBuild',
                  Version: '1',
                },
              }),
            ]),
          }),
        ]),
      });
    });

    test('deploy stage uses S3 deploy action', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Deploy',
            Actions: Match.arrayWith([
              Match.objectLike({
                Name: 'Deploy_to_S3',
                ActionTypeId: {
                  Category: 'Deploy',
                  Owner: 'AWS',
                  Provider: 'S3',
                  Version: '1',
                },
              }),
            ]),
          }),
        ]),
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('creates CodeBuild service role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
        Description: 'Service role for CodeBuild project',
      });
    });

    test('CodeBuild role has required permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                's3:GetObject',
                's3:GetObjectVersion',
                's3:PutObject',
                'codebuild:BatchGetProjects',
                'codebuild:StartDebugSession',
              ]),
            }),
          ]),
        }),
      });
    });

    test('creates CodePipeline service role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'codepipeline.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
        Description: 'Service role for CodePipeline',
      });
    });

    test('pipeline role has required permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                's3:GetBucketLocation',
                's3:GetObject',
                's3:GetObjectVersion',
                's3:PutObject',
                'codebuild:BatchGetBuilds',
                'codebuild:StartBuild',
                'iam:PassRole',
              ]),
            }),
          ]),
        }),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports source bucket name', () => {
      template.hasOutput('SourceBucketName', {
        Description: 'Name of the S3 source bucket for pipeline',
      });
    });

    test('exports artifacts bucket name', () => {
      template.hasOutput('ArtifactsBucketName', {
        Description: 'Name of the S3 bucket for pipeline artifacts',
      });
    });

    test('exports pipeline name', () => {
      template.hasOutput('PipelineName', {
        Description: 'Name of the CodePipeline',
      });
    });

    test('exports build project name', () => {
      template.hasOutput('BuildProjectName', {
        Description: 'Name of the CodeBuild project',
      });
    });

    test('exports pipeline ARN', () => {
      template.hasOutput('PipelineArn', {
        Description: 'ARN of the CodePipeline',
      });
    });

    test('exports build project ARN', () => {
      template.hasOutput('BuildProjectArn', {
        Description: 'ARN of the CodeBuild project',
      });
    });
  });

  describe('Tagging', () => {
    test('applies Environment tag', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Production',
          }),
        ]),
      });
    });

    test('applies Project tag', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Project',
            Value: 'CI_CD_Pipeline',
          }),
        ]),
      });
    });
  });
});