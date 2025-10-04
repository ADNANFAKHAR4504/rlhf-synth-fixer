import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('VPC Infrastructure', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public and private subnets', () => {
      // Check for public subnets
      template.resourceCountIs('AWS::EC2::Subnet', 4);

      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });

      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('should create Internet Gateway and NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
      template.resourceCountIs('AWS::EC2::EIP', 1);
    });

    test('should create security group for EC2 instances', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for TAP EC2 instances',
        SecurityGroupIngress: [
          {
            CidrIp: {
              'Fn::GetAtt': [Match.anyValue(), 'CidrBlock'],
            },
            Description: 'Allow HTTP from VPC',
            FromPort: 80,
            IpProtocol: 'tcp',
            ToPort: 80,
          },
          {
            CidrIp: {
              'Fn::GetAtt': [Match.anyValue(), 'CidrBlock'],
            },
            Description: 'Allow HTTPS from VPC',
            FromPort: 443,
            IpProtocol: 'tcp',
            ToPort: 443,
          },
        ],
      });
    });
  });

  describe('S3 Storage', () => {
    test('should create source S3 bucket with versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': [
            '',
            [
              Match.stringLikeRegexp(`tap-source-${environmentSuffix}-`),
              Match.anyValue(),
            ],
          ],
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
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

    test('should create artifacts S3 bucket with lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': [
            '',
            [
              Match.stringLikeRegexp(`tap-artifacts-${environmentSuffix}-`),
              Match.anyValue(),
            ],
          ],
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteOldVersions',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30,
              },
              Status: 'Enabled',
            },
          ],
        },
      });
    });
  });

  describe('Secrets Management', () => {
    test('should create build secrets in Secrets Manager', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `tap-build-secrets-${environmentSuffix}`,
        Description: 'Build secrets for TAP application',
        GenerateSecretString: {
          SecretStringTemplate:
            '{"API_KEY":"","DATABASE_URL":"","JWT_SECRET":""}',
          GenerateStringKey: 'password',
          ExcludeCharacters: '"@/\\',
        },
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create CodeBuild service role with proper permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-codebuild-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/AWSCodeBuildDeveloperAccess',
              ],
            ],
          },
        ],
      });
    });

    test('should create CodeDeploy service role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-codedeploy-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codedeploy.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
      });
    });

    test('should create EC2 instance role with required policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-ec2-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/AmazonSSMManagedInstanceCore',
              ],
            ],
          },
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/CloudWatchAgentServerPolicy',
              ],
            ],
          },
        ],
      });
    });

    test('should create pipeline service role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-pipeline-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codepipeline.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
      });
    });
  });

  describe('CodeBuild Project', () => {
    test('should create CodeBuild project with correct configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `tap-build-${environmentSuffix}`,
        Source: {
          Location: Match.anyValue(),
          Type: 'S3',
        },
        Environment: {
          ComputeType: 'BUILD_GENERAL1_SMALL',
          Image: 'aws/codebuild/standard:7.0',
          Type: 'LINUX_CONTAINER',
          EnvironmentVariables: [
            {
              Name: 'ENVIRONMENT_SUFFIX',
              Value: environmentSuffix,
            },
            {
              Name: 'SECRETS_ARN',
              Value: Match.anyValue(),
            },
          ],
        },
      });
    });

    test('should have proper build spec configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Source: {
          BuildSpec: Match.serializedJson({
            version: '0.2',
            phases: Match.objectLike({
              pre_build: Match.objectLike({
                commands: Match.arrayWith([
                  'echo Logging in to Amazon ECR...',
                  'echo Build started on `date`',
                ]),
              }),
              build: Match.objectLike({
                commands: Match.arrayWith([
                  'npm ci',
                  'npm run test',
                  'npm run build',
                ]),
              }),
              post_build: Match.objectLike({
                commands: ['echo Build completed on `date`'],
              }),
            }),
            artifacts: Match.objectLike({
              files: ['**/*'],
              'base-directory': 'deploy',
            }),
          }),
        },
      });
    });
  });

  describe('EC2 Auto Scaling', () => {
    test('should create launch template for EC2 instances', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: `tap-launch-template-${environmentSuffix}`,
        LaunchTemplateData: {
          ImageId: Match.anyValue(),
          InstanceType: 't3.micro',
          SecurityGroupIds: [Match.anyValue()],
          IamInstanceProfile: {
            Arn: Match.anyValue(),
          },
          UserData: Match.anyValue(),
        },
      });
    });

    test('should create auto scaling group with proper configuration', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: `tap-asg-${environmentSuffix}`,
        MinSize: '1',
        MaxSize: '3',
        DesiredCapacity: '2',
        LaunchTemplate: {
          LaunchTemplateId: Match.anyValue(),
          Version: Match.anyValue(),
        },
      });

      // Check that tags are present (structure may vary)
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        Tags: Match.anyValue(),
      });
    });
  });

  describe('CodeDeploy Configuration', () => {
    test('should create CodeDeploy application', () => {
      template.hasResourceProperties('AWS::CodeDeploy::Application', {
        ApplicationName: `tap-app-${environmentSuffix}`,
        ComputePlatform: 'Server',
      });
    });

    test('should create deployment group with auto scaling integration', () => {
      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        ApplicationName: Match.anyValue(),
        DeploymentGroupName: `tap-deployment-group-${environmentSuffix}`,
        ServiceRoleArn: Match.anyValue(),
        Ec2TagSet: {
          Ec2TagSetList: [
            {
              Ec2TagGroup: [
                {
                  Key: 'Environment',
                  Type: 'KEY_AND_VALUE',
                  Value: environmentSuffix,
                },
                {
                  Key: 'Application',
                  Type: 'KEY_AND_VALUE',
                  Value: 'tap',
                },
              ],
            },
          ],
        },
        AutoScalingGroups: [Match.anyValue()],
        DeploymentConfigName: 'CodeDeployDefault.AllAtOnce',
        AutoRollbackConfiguration: {
          Enabled: true,
          Events: ['DEPLOYMENT_FAILURE', 'DEPLOYMENT_STOP_ON_REQUEST'],
        },
      });
    });
  });

  describe('Monitoring and Notifications', () => {
    test('should create SNS topic for pipeline notifications', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'TAP Pipeline Notifications',
        TopicName: `tap-pipeline-notifications-${environmentSuffix}`,
      });
    });

    test('should create CloudWatch alarm for build failures', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-build-failure-${environmentSuffix}`,
        MetricName: 'FailedBuilds',
        Namespace: 'AWS/CodeBuild',
        Statistic: 'Sum',
        Threshold: 1,
        EvaluationPeriods: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        TreatMissingData: 'notBreaching',
      });
    });

    test('should create chatbot role for future Slack integration', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-chatbot-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'chatbot.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/CloudWatchReadOnlyAccess',
              ],
            ],
          },
        ],
      });
    });
  });

  describe('CI/CD Pipeline', () => {
    test('should create CodePipeline with all required stages', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: `tap-pipeline-${environmentSuffix}`,
        Stages: [
          {
            Name: 'Source',
            Actions: [
              {
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
                  PollForSourceChanges: true,
                },
                OutputArtifacts: [{ Name: 'source' }],
              },
            ],
          },
          {
            Name: 'Build',
            Actions: [
              {
                Name: 'Build',
                ActionTypeId: {
                  Category: 'Build',
                  Owner: 'AWS',
                  Provider: 'CodeBuild',
                  Version: '1',
                },
                Configuration: {
                  ProjectName: Match.anyValue(),
                },
                InputArtifacts: [{ Name: 'source' }],
                OutputArtifacts: [{ Name: 'build' }],
              },
            ],
          },
          {
            Name: 'ApproveStaging',
            Actions: [
              {
                Name: 'ApproveStaging',
                ActionTypeId: {
                  Category: 'Approval',
                  Owner: 'AWS',
                  Provider: 'Manual',
                  Version: '1',
                },
                Configuration: {
                  NotificationArn: Match.anyValue(),
                  CustomData: Match.stringLikeRegexp(
                    `Please review and approve deployment to ${environmentSuffix} environment`
                  ),
                },
              },
            ],
          },
          {
            Name: 'Deploy',
            Actions: [
              {
                Name: 'Deploy',
                ActionTypeId: {
                  Category: 'Deploy',
                  Owner: 'AWS',
                  Provider: 'CodeDeploy',
                  Version: '1',
                },
                Configuration: {
                  ApplicationName: Match.anyValue(),
                  DeploymentGroupName: Match.anyValue(),
                },
                InputArtifacts: [{ Name: 'build' }],
              },
            ],
          },
        ],
      });
    });

    test('should create CloudWatch event rule for pipeline state changes', () => {
      // Check for pipeline state change event rule existence
      template.resourceCountIs('AWS::Events::Rule', 1);

      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: Match.objectLike({
          source: ['aws.codepipeline'],
        }),
        State: 'ENABLED',
      });
    });
  });

  describe('CloudWatch Logging', () => {
    test('should create log group for CodeBuild', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/codebuild/tap-build-${environmentSuffix}`,
        RetentionInDays: 30,
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should create outputs for pipeline and source bucket', () => {
      template.hasOutput(`TapPipelineOutput${environmentSuffix}`, {
        Description: 'TAP Pipeline ARN',
        Export: {
          Name: `tap-pipeline-arn-${environmentSuffix}`,
        },
      });

      template.hasOutput(`TapSourceBucketOutput${environmentSuffix}`, {
        Description: 'TAP Source S3 Bucket Name',
        Export: {
          Name: `tap-source-bucket-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Environment Suffix Configuration', () => {
    test('should use environment suffix in resource names', () => {
      // Create separate app for this test to avoid synthesis conflicts
      const testApp = new cdk.App();
      const stackWithCustomSuffix = new TapStack(
        testApp,
        'TestTapStackCustom',
        {
          environmentSuffix: 'staging',
        }
      );
      const customTemplate = Template.fromStack(stackWithCustomSuffix);

      // Check that staging suffix is used in pipeline name
      customTemplate.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'tap-pipeline-staging',
      });

      // Check that staging suffix is used in role name
      customTemplate.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'tap-codebuild-role-staging',
      });
    });

    test('should use context environment suffix when props not provided', () => {
      // Create app with context
      const testApp = new cdk.App({
        context: { environmentSuffix: 'prod' },
      });
      const stackWithContext = new TapStack(testApp, 'TestTapStackContext');
      const contextTemplate = Template.fromStack(stackWithContext);

      // Check that prod suffix is used in pipeline name
      contextTemplate.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'tap-pipeline-prod',
      });

      // Check that prod suffix is used in role name
      contextTemplate.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'tap-codebuild-role-prod',
      });
    });

    test('should use default dev suffix when neither props nor context provided', () => {
      // Create app without context or props
      const testApp = new cdk.App();
      const stackWithDefaults = new TapStack(testApp, 'TestTapStackDefaults');
      const defaultTemplate = Template.fromStack(stackWithDefaults);

      // Check that dev suffix is used in pipeline name
      defaultTemplate.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'tap-pipeline-dev',
      });

      // Check that dev suffix is used in role name
      defaultTemplate.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'tap-codebuild-role-dev',
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have expected number of major resources', () => {
      // VPC and networking
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
      template.resourceCountIs('AWS::EC2::SecurityGroup', 1);

      // S3 buckets
      template.resourceCountIs('AWS::S3::Bucket', 2); // source + artifacts

      // IAM roles (minimum expected - there are additional CDK-created roles)
      // Just check that we have the main roles
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-codebuild-role-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-codedeploy-role-${environmentSuffix}`,
      });

      // CodeBuild and CodeDeploy
      template.resourceCountIs('AWS::CodeBuild::Project', 1);
      template.resourceCountIs('AWS::CodeDeploy::Application', 1);
      template.resourceCountIs('AWS::CodeDeploy::DeploymentGroup', 1);

      // Pipeline
      template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);

      // Auto Scaling
      template.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 1);
      template.resourceCountIs('AWS::EC2::LaunchTemplate', 1);

      // Monitoring
      template.resourceCountIs('AWS::SNS::Topic', 1);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 1);

      // Secrets
      template.resourceCountIs('AWS::SecretsManager::Secret', 1);
    });
  });

  describe('Bucket Policies', () => {
    test('should create bucket policies for S3 buckets', () => {
      template.resourceCountIs('AWS::S3::BucketPolicy', 2);
    });
  });

  describe('Route Tables and Associations', () => {
    test('should create route tables for all subnets', () => {
      template.resourceCountIs('AWS::EC2::RouteTable', 4); // 2 public + 2 private
    });

    test('should create subnet route table associations', () => {
      template.resourceCountIs('AWS::EC2::SubnetRouteTableAssociation', 4);
    });

    test('should create default routes for subnets', () => {
      // Check for routes
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
      });
    });
  });

  describe('IAM Instance Profile', () => {
    test('should create IAM instance profile for EC2 instances', () => {
      template.resourceCountIs('AWS::IAM::InstanceProfile', 1);
    });
  });

  describe('Pipeline Policies', () => {
    test('should have proper IAM policy for pipeline role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.anyValue(),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('Tags', () => {
    test('should apply tags to auto scaling group', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: environmentSuffix,
            PropagateAtLaunch: true,
          }),
          Match.objectLike({
            Key: 'Name',
            PropagateAtLaunch: true,
          }),
        ]),
      });
    });
  });

  describe('VPC Gateway Attachment', () => {
    test('should attach internet gateway to VPC', () => {
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
    });
  });
});
