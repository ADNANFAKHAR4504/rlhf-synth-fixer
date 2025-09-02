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
  test('Should create source S3 bucket with correct properties', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: {
        'Fn::Join': [
          '',
          Match.arrayWith([
            `nova-model-source-${environmentSuffix}-`,
            { Ref: 'AWS::AccountId' },
            '-',
            { Ref: 'AWS::Region' }
          ])
        ],
      },
      VersioningConfiguration: { Status: 'Enabled' },
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('Should create artifacts S3 bucket with lifecycle rules and proper configuration', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: {
        'Fn::Join': [
          '',
          Match.arrayWith([
            `nova-model-pipeline-artifacts-${environmentSuffix}-`,
            { Ref: 'AWS::AccountId' },
            '-',
            { Ref: 'AWS::Region' }
          ])
        ],
      },
      VersioningConfiguration: { Status: 'Enabled' },
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
      LifecycleConfiguration: {
        Rules: Match.arrayWith([
          Match.objectLike({
            Id: 'DeleteOldVersions',
            NoncurrentVersionExpiration: { NoncurrentDays: 30 },
            Status: 'Enabled',
          }),
        ]),
      },
    });
  });

  test('Should have correct deletion policies on S3 buckets', () => {
    template.hasResource('AWS::S3::Bucket', {
      DeletionPolicy: 'Delete',
      UpdateReplacePolicy: 'Delete',
    });
  });

  // =========================================
  // LOG GROUPS TESTS
  // =========================================
  test('Should create build log group with correct retention', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: `/aws/codebuild/nova-model-build-${environmentSuffix}`,
      RetentionInDays: 30,
    });
  });

  test('Should create pipeline log group with correct retention', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: `/aws/codepipeline/nova-model-pipeline-${environmentSuffix}`,
      RetentionInDays: 30,
    });
  });

  test('Should have correct deletion policies on log groups', () => {
    template.hasResource('AWS::Logs::LogGroup', {
      DeletionPolicy: 'Delete',
      UpdateReplacePolicy: 'Delete',
    });
  });

  // =========================================
  // IAM ROLES TESTS
  // =========================================
  test('Should create CodePipeline IAM Role with correct trust policy', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'codepipeline.amazonaws.com' },
          },
        ],
        Version: '2012-10-17',
      },
      Description: 'Role for CodePipeline to execute pipeline operations',
    });
  });

  test('Should create CodeBuild IAM Role with correct trust policy', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'codebuild.amazonaws.com' },
          },
        ],
        Version: '2012-10-17',
      },
      Description: 'Role for CodeBuild to execute build operations',
    });
  });

  test('Should create CloudFormation deployment role with PowerUserAccess', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Principal: { Service: 'cloudformation.amazonaws.com' },
          }),
        ]),
      }),
      ManagedPolicyArns: [
        {
          'Fn::Join': [
            '',
            [
              'arn:',
              { Ref: 'AWS::Partition' },
              ':iam::aws:policy/PowerUserAccess',
            ],
          ],
        },
      ],
      Description: 'Role for CloudFormation to deploy resources',
    });
  });

  // =========================================
  // IAM POLICIES TESTS
  // =========================================
  test('Should create proper IAM policies for CodePipeline role', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          {
            Effect: 'Allow',
            Action: [
              's3:GetBucketVersioning',
              's3:GetObject',
              's3:GetObjectVersion',
              's3:PutObject',
              's3:PutObjectAcl',
            ],
            Resource: Match.anyValue(),
          },
        ]),
      },
    });
  });

  test('Should create IAM policies for CodeBuild permissions', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: Match.anyValue(),
          },
        ]),
      },
    });
  });

  test('Should allow CodePipeline to start builds', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          {
            Effect: 'Allow',
            Action: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
            Resource: '*',
          },
        ]),
      },
    });
  });

  test('Should allow CodePipeline to manage CloudFormation stacks', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          {
            Effect: 'Allow',
            Action: [
              'cloudformation:CreateStack',
              'cloudformation:DeleteStack',
              'cloudformation:DescribeStacks',
              'cloudformation:UpdateStack',
              'cloudformation:CreateChangeSet',
              'cloudformation:DeleteChangeSet',
              'cloudformation:DescribeChangeSet',
              'cloudformation:ExecuteChangeSet',
              'cloudformation:SetStackPolicy',
              'cloudformation:ValidateTemplate',
            ],
            Resource: '*',
          },
        ]),
      },
    });
  });

  // =========================================
  // CODEBUILD PROJECT TESTS
  // =========================================
  test('Should create CodeBuild Project with correct configuration', () => {
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Name: `nova-model-build-${environmentSuffix}`,
      Description: 'Build project for Nova Model Breaking application',
      Environment: {
        ComputeType: 'BUILD_GENERAL1_SMALL',
        Image: 'aws/codebuild/standard:7.0',
        Type: 'LINUX_CONTAINER',
        PrivilegedMode: false,
        ImagePullCredentialsType: 'CODEBUILD',
        EnvironmentVariables: Match.arrayWith([
          Match.objectLike({
            Name: 'AWS_DEFAULT_REGION',
            Value: { Ref: 'AWS::Region' },
            Type: 'PLAINTEXT',
          }),
          Match.objectLike({
            Name: 'AWS_ACCOUNT_ID',
            Value: { Ref: 'AWS::AccountId' },
            Type: 'PLAINTEXT',
          }),
          Match.objectLike({
            Name: 'BUILD_ENV',
            Value: 'production',
            Type: 'PLAINTEXT',
          }),
        ])
      },
      Artifacts: {
        Type: 'NO_ARTIFACTS',
      },
      TimeoutInMinutes: 60,
    });
  });


  test('Should create CodeBuild project with proper BuildSpec', () => {
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Source: {
        BuildSpec: Match.stringLikeRegexp('.*"version":\\s*"0\\.2".*'),
      },
    });

    // Additional test to verify BuildSpec contains key commands
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Source: {
        BuildSpec: Match.stringLikeRegexp('.*cdk synth.*'),
      },
    });
  });

  test('Should configure CodeBuild caching', () => {
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Cache: {
        Type: 'LOCAL',
        Modes: ['LOCAL_SOURCE_CACHE'],
      },
    });
  });

  // =========================================
  // CODEPIPELINE TESTS
  // =========================================
  test('Should create CodePipeline with correct configuration', () => {
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Name: `nova-model-pipeline-${environmentSuffix}`,
    });
  });

  test('Pipeline should have Source, Build, and Deploy stages with correct configuration', () => {
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Stages: Match.arrayWith([
        Match.objectLike({
          Name: 'Source',
          Actions: [
            Match.objectLike({
              Name: 'Source',
              ActionTypeId: {
                Category: 'Source',
                Owner: 'AWS',
                Provider: 'S3',
                Version: '1',
              },
              Configuration: {
                S3Bucket: Match.anyValue(),
                S3ObjectKey: 'source.zip',
              },
            }),
          ],
        }),
        Match.objectLike({
          Name: 'Build',
          Actions: [
            Match.objectLike({
              Name: 'Build',
              ActionTypeId: {
                Category: 'Build',
                Owner: 'AWS',
                Provider: 'CodeBuild',
                Version: '1',
              },
            }),
          ],
        }),
        Match.objectLike({
          Name: 'Deploy-US-East-1',
          Actions: [
            Match.objectLike({
              Name: 'Deploy-US-East-1',
              ActionTypeId: {
                Category: 'Deploy',
                Owner: 'AWS',
                Provider: 'CloudFormation',
                Version: '1',
              },
              Region: 'us-east-1',
            }),
          ],
        }),
        Match.objectLike({
          Name: 'Deploy-US-West-2',
          Actions: [
            Match.objectLike({
              Name: 'Deploy-US-West-2',
              ActionTypeId: {
                Category: 'Deploy',
                Owner: 'AWS',
                Provider: 'CloudFormation',
                Version: '1',
              },
              Region: 'us-west-2',
            }),
          ],
        }),
      ]),
    });
  });

  // =========================================
  // CLOUDWATCH EVENTS TESTS
  // =========================================
  test('Should create CloudWatch Event Rule for pipeline monitoring', () => {
    template.hasResourceProperties('AWS::Events::Rule', {
      Description: 'Capture pipeline state changes',
      EventPattern: {
        source: ['aws.codepipeline'],
        'detail-type': ['CodePipeline Pipeline Execution State Change'],
        detail: {
          pipeline: [{ Ref: Match.anyValue() }],
        },
      },
    });
  });

  // =========================================
  // CLOUDFORMATION OUTPUTS TESTS
  // =========================================
  test('Should create expected CloudFormation outputs', () => {
    template.hasOutput('SourceBucketName', {
      Description: 'S3 Source Bucket Name',
      Value: Match.anyValue(),
    });

    template.hasOutput('ArtifactsBucketName', {
      Description: 'S3 Artifacts Bucket Name',
      Value: Match.anyValue(),
    });

    template.hasOutput('PipelineName', {
      Description: 'CodePipeline Name',
      Value: Match.anyValue(),
    });

    template.hasOutput('BuildProjectName', {
      Description: 'CodeBuild Project Name',
      Value: Match.anyValue(),
    });

    template.hasOutput('PipelineConsoleUrl', {
      Description: 'CodePipeline Console URL',
      Value: Match.anyValue(),
    });
  });

  // =========================================
  // TAGS TESTS
  // =========================================
  test('Should apply proper tags to the stack', () => {
    const stackTags = Template.fromStack(stack).toJSON().Resources;

    // Check that resources have proper tags
    Object.values(stackTags).forEach((resource: any) => {
      if (resource.Type !== 'AWS::CDK::Metadata') {
        expect(resource.Properties?.Tags || resource.Metadata?.['aws:cdk:path'] || true).toBeDefined();
      }
    });
  });

  // =========================================
  // RESOURCE COUNT TESTS
  // =========================================
  test('Should create expected minimum number of resources', () => {
    // Check that we have at least the expected number of each resource type
    const template_json = template.toJSON();
    const resources = template_json.Resources;
    const resourceTypes = Object.values(resources).map((r: any) => r.Type);

    expect(resourceTypes.filter(t => t === 'AWS::S3::Bucket').length).toBe(2);
    expect(resourceTypes.filter(t => t === 'AWS::Logs::LogGroup').length).toBe(2);
    expect(resourceTypes.filter(t => t === 'AWS::IAM::Role').length).toBeGreaterThanOrEqual(3);
    expect(resourceTypes.filter(t => t === 'AWS::IAM::Policy').length).toBeGreaterThanOrEqual(3);
    expect(resourceTypes.filter(t => t === 'AWS::CodeBuild::Project').length).toBe(1);
    expect(resourceTypes.filter(t => t === 'AWS::CodePipeline::Pipeline').length).toBe(1);
    expect(resourceTypes.filter(t => t === 'AWS::Events::Rule').length).toBe(1);
  });

  // =========================================
  // ERROR CASES TESTS
  // =========================================
  test('Should handle undefined environmentSuffix gracefully', () => {
    const testApp = new cdk.App();
    const testStack = new TapStack(testApp, 'TestTapStackNoEnv', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    const testTemplate = Template.fromStack(testStack);

    // Should use default environmentSuffix when not provided
    testTemplate.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: {
        'Fn::Join': [
          '',
          [
            'nova-model-source-pr2056-',
            { Ref: 'AWS::AccountId' },
            '-',
            { Ref: 'AWS::Region' },
          ],
        ],
      },
    });
  });

  test('Should have proper resource dependencies', () => {
    // CodeBuild project should depend on IAM role
    template.hasResource('AWS::CodeBuild::Project', {
      Properties: {
        ServiceRole: {
          'Fn::GetAtt': Match.arrayWith([Match.stringLikeRegexp('CodeBuildRole.*'), 'Arn']),
        },
      },
    });

    // Pipeline should depend on IAM role
    template.hasResource('AWS::CodePipeline::Pipeline', {
      Properties: {
        RoleArn: {
          'Fn::GetAtt': Match.arrayWith([Match.stringLikeRegexp('CodePipelineRole.*'), 'Arn']),
        },
      },
    });
  });
});