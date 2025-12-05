import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { CicdPipelineStack } from '../lib/cicd-pipeline-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
  });

  test('Stack creates without errors', () => {
    expect(stack).toBeDefined();
  });

  test('CI/CD Pipeline Stack is created', () => {
    expect(stack.cicdPipeline).toBeDefined();
    expect(stack.cicdPipeline).toBeInstanceOf(CicdPipelineStack);
  });

  test('Environment suffix is passed to nested stack', () => {
    const cicdStack = stack.cicdPipeline;
    expect(cicdStack.stackName).toContain(environmentSuffix);
  });

  test('Stack uses default environment suffix when not provided', () => {
    const newApp = new cdk.App();
    const defaultStack = new TapStack(newApp, 'DefaultStack', {});
    expect(defaultStack.cicdPipeline).toBeDefined();
  });

  test('Stack uses environment variables for team and cost center', () => {
    const newApp = new cdk.App();
    process.env.TEAM = 'TestEnvTeam';
    process.env.COST_CENTER = 'TestEnvCostCenter';
    const envStack = new TapStack(newApp, 'EnvStack', { environmentSuffix: 'env-test' });
    expect(envStack.cicdPipeline).toBeDefined();
    delete process.env.TEAM;
    delete process.env.COST_CENTER;
  });
});

describe('CicdPipelineStack', () => {
  let app: cdk.App;
  let stack: CicdPipelineStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new CicdPipelineStack(app, 'TestCicdStack', {
      environmentSuffix: 'test',
      team: 'TestTeam',
      costCenter: 'TestCostCenter',
    });
    template = Template.fromStack(stack);
  });

  describe('Requirement 1: CodePipeline with Multi-Stage Deployment', () => {
    test('Pipeline is created', () => {
      template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
    });

    test('Pipeline has all 5 required stages', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({ Name: 'Source' }),
          Match.objectLike({ Name: 'Build' }),
          Match.objectLike({ Name: 'DeployToStaging' }),
          Match.objectLike({ Name: 'ApproveProduction' }),
          Match.objectLike({ Name: 'DeployToProduction' }),
        ]),
      });
    });

    test('Pipeline has correct name', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'microservices-pipeline-test',
      });
    });
  });

  describe('Requirement 2: Docker Image Build and ECR Integration', () => {
    test('ECR repository is created', () => {
      template.resourceCountIs('AWS::ECR::Repository', 1);
    });

    test('ECR repository has image scanning enabled', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        ImageScanningConfiguration: {
          ScanOnPush: true,
        },
      });
    });

    test('ECR repository has lifecycle policy', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        LifecyclePolicy: Match.objectLike({
          LifecyclePolicyText: Match.anyValue(),
        }),
      });
    });

    test('CodeBuild project has privileged mode for Docker', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Environment: Match.objectLike({
          PrivilegedMode: true,
        }),
      });
    });
  });

  describe('Requirement 3: Automated Unit Test Execution', () => {
    test('CodeBuild project has test report configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Source: Match.objectLike({
          BuildSpec: Match.stringLikeRegexp('test-reports'),
        }),
      });
    });

    test('BuildSpec includes npm test command', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Source: Match.objectLike({
          BuildSpec: Match.stringLikeRegexp('npm test'),
        }),
      });
    });
  });

  describe('Requirement 4: Manual Approval Actions', () => {
    test('Manual approval stage exists', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'ApproveProduction',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: Match.objectLike({
                  Category: 'Approval',
                  Provider: 'Manual',
                }),
              }),
            ]),
          }),
        ]),
      });
    });
  });

  describe('Requirement 5: Blue/Green Deployment to ECS', () => {
    test('ECS deploy actions exist for staging and production', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'DeployToStaging',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: Match.objectLike({
                  Category: 'Deploy',
                  Provider: 'ECS',
                }),
              }),
            ]),
          }),
          Match.objectLike({
            Name: 'DeployToProduction',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: Match.objectLike({
                  Category: 'Deploy',
                  Provider: 'ECS',
                }),
              }),
            ]),
          }),
        ]),
      });
    });
  });

  describe('Requirement 6: S3 Artifact Storage with Security', () => {
    test('S3 bucket is created', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('S3 bucket has KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            },
          ],
        },
      });
    });

    test('S3 bucket has versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('S3 bucket blocks public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('S3 bucket has lifecycle policy for 30-day retention', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              ExpirationInDays: 30,
              Status: 'Enabled',
            }),
          ]),
        },
      });
    });

    test('KMS key is created with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });
  });

  describe('Requirement 7: SNS Notifications for Pipeline Events', () => {
    test('SNS topic is created', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });

    test('SNS topic has correct name', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'pipeline-notifications-test',
      });
    });

    test('EventBridge rule for pipeline state changes exists', () => {
      const rules = template.findResources('AWS::Events::Rule');
      expect(Object.keys(rules).length).toBeGreaterThanOrEqual(1);
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

  describe('Requirement 8: IAM Roles with Least Privilege', () => {
    test('CodeBuild role is created', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'codebuild-role-test',
        AssumedByPrincipalArn: Match.absent(),
      });
    });

    test('CodePipeline role is created', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'codepipeline-role-test',
        AssumedByPrincipalArn: Match.absent(),
      });
    });

    test('CodeBuild role has CloudWatch Logs permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('CodeBuild role has CodeBuild report permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'codebuild:CreateReportGroup',
                'codebuild:CreateReport',
                'codebuild:UpdateReport',
                'codebuild:BatchPutTestCases',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('CodePipeline role has minimal ECS permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'ecs:DescribeServices',
                'ecs:DescribeTaskDefinition',
                'ecs:UpdateService',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('IAM PassRole has conditions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'iam:PassRole',
              Condition: Match.objectLike({
                StringEqualsIfExists: {
                  'iam:PassedToService': ['ecs-tasks.amazonaws.com'],
                },
              }),
            }),
          ]),
        },
      });
    });
  });

  describe('Requirement 9: Resource Tagging for Tracking', () => {
    test('S3 bucket has all required tags', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'test' },
          { Key: 'Team', Value: 'TestTeam' },
        ]),
      });
    });

    test('ECR repository has all required tags', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'test' },
          { Key: 'Team', Value: 'TestTeam' },
        ]),
      });
    });

    test('Pipeline has all required tags', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'test' },
          { Key: 'Team', Value: 'TestTeam' },
        ]),
      });
    });

    test('SNS topic has all required tags', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'test' },
          { Key: 'Team', Value: 'TestTeam' },
        ]),
      });
    });

    test('CodeBuild project has all required tags', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'test' },
          { Key: 'Team', Value: 'TestTeam' },
        ]),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Pipeline name is exported', () => {
      template.hasOutput('PipelineName', {
        Value: Match.objectLike({
          Ref: Match.stringLikeRegexp('Pipeline'),
        }),
        Export: {
          Name: 'test-pipeline-name',
        },
      });
    });

    test('ECR repository URI is exported', () => {
      template.hasOutput('ECRRepositoryURI', {
        Export: {
          Name: 'test-ecr-uri',
        },
      });
    });

    test('Artifact bucket name is exported', () => {
      template.hasOutput('ArtifactBucketName', {
        Export: {
          Name: 'test-artifact-bucket',
        },
      });
    });

    test('Notification topic ARN is exported', () => {
      template.hasOutput('NotificationTopicArn', {
        Export: {
          Name: 'test-notification-topic',
        },
      });
    });
  });

  describe('Resource Counts', () => {
    test('Has expected IAM roles including custom resource roles', () => {
      // Main roles: CodeBuild, CodePipeline + custom resource lambda roles
      const roles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(roles).length).toBeGreaterThanOrEqual(2);
    });

    test('Has CodeCommit repository', () => {
      template.resourceCountIs('AWS::CodeCommit::Repository', 1);
    });

    test('Has single KMS key', () => {
      template.resourceCountIs('AWS::KMS::Key', 1);
    });

    test('Has single CodeBuild project', () => {
      template.resourceCountIs('AWS::CodeBuild::Project', 1);
    });
  });

  describe('Security Configurations', () => {
    test('CodeBuild project uses STANDARD_7_0 image', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Environment: Match.objectLike({
          Image: 'aws/codebuild/standard:7.0',
        }),
      });
    });

    test('CodeBuild project has environment variables for ECR', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Environment: Match.objectLike({
          EnvironmentVariables: Match.arrayWith([
            Match.objectLike({
              Name: 'ECR_REPOSITORY_URI',
            }),
            Match.objectLike({
              Name: 'AWS_DEFAULT_REGION',
            }),
            Match.objectLike({
              Name: 'AWS_ACCOUNT_ID',
            }),
          ]),
        }),
      });
    });
  });

  describe('Stack with default parameters', () => {
    test('Creates successfully without optional parameters', () => {
      const newApp = new cdk.App();
      const defaultStack = new CicdPipelineStack(newApp, 'DefaultStack', {
        environmentSuffix: 'default',
      });
      const defaultTemplate = Template.fromStack(defaultStack);
      expect(defaultStack).toBeDefined();
      defaultTemplate.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
    });
  });
});
