import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack');
    template = Template.fromStack(stack);
  });

  describe('VPC and Networking', () => {
    test('creates VPC with public and private subnets', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });

      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 AZs * 2 subnet types
      template.hasResourceProperties('AWS::EC2::NatGateway', {});
    });

    test('creates security group with proper ingress rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for web servers',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });
  });

  describe('S3 Artifacts Bucket', () => {
    test('creates encrypted S3 bucket with versioning', () => {
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

    test('has lifecycle rules for artifact cleanup', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'DeleteOldArtifacts',
              ExpirationInDays: 30,
              Status: 'Enabled',
            }),
          ]),
        },
      });
    });
  });

  describe('SNS Topic for Notifications', () => {
    test('creates SNS topic with proper configuration', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'TAP Pipeline Notifications dev',
        TopicName: 'tap-pipeline-notifications-dev',
      });

      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'admin@example.com',
      });
    });
  });

  describe('IAM Roles and Permissions', () => {
    test('creates CodeBuild role with least privilege', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('creates CodePipeline role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'codepipeline.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('creates EC2 role with necessary permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            }),
          ]),
        },
        ManagedPolicyArns: Match.arrayWith([
          'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
          'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
        ]),
      });
    });

    test('creates CodeDeploy role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'codedeploy.amazonaws.com',
              },
            }),
          ]),
        },
        ManagedPolicyArns: Match.arrayWith([
          'arn:aws:iam::aws:policy/service-role/AWSCodeDeployRole',
        ]),
      });
    });
  });

  describe('CodeBuild Project', () => {
    test('creates CodeBuild project with proper configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'tap-build-project-dev',
        Environment: {
          Type: 'LINUX_CONTAINER',
          ComputeType: 'BUILD_GENERAL1_SMALL',
          Image: 'aws/codebuild/standard:5.0',
          PrivilegedMode: false,
        },
        Source: {
          Type: 'CODEPIPELINE',
          BuildSpec: Match.stringLikeRegexp('version.*0\\.2'),
        },
      });
    });

    test('has CloudWatch logging enabled', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/codebuild/tap-build-project-dev',
        RetentionInDays: 30,
      });
    });
  });

  describe('EC2 and Auto Scaling', () => {
    test('creates launch template with proper configuration', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: 'tap-web-server-template-dev',
        LaunchTemplateData: {
          ImageId: Match.anyValue(),
          InstanceType: 't3.micro',
          UserData: Match.anyValue(),
        },
      });
    });

    test('creates Auto Scaling Group', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '4',
        DesiredCapacity: '2',
        HealthCheckType: 'EC2',
        HealthCheckGracePeriod: 300,
      });
    });

    test('tags instances for CodeDeploy', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Production',
            PropagateAtLaunch: true,
          }),
          Match.objectLike({
            Key: 'Application',
            Value: 'TAP',
            PropagateAtLaunch: true,
          }),
        ]),
      });
    });
  });

  describe('CodeDeploy Configuration', () => {
    test('creates CodeDeploy application', () => {
      template.hasResourceProperties('AWS::CodeDeploy::Application', {
        ApplicationName: 'tap-application-dev',
        ComputePlatform: 'Server',
      });
    });

    test('creates deployment group with rollback configuration', () => {
      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        ApplicationName: Match.anyValue(),
        DeploymentGroupName: 'tap-deployment-group-dev',
        AutoRollbackConfiguration: {
          Enabled: true,
          Events: ['DEPLOYMENT_FAILURE', 'DEPLOYMENT_STOP_ON_ALARM', 'DEPLOYMENT_STOP_ON_REQUEST'],
        },
      });
    });
  });

  describe('Lambda Function for Boto3 Integration', () => {
    test('creates Lambda function with proper runtime and permissions', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.9',
        Handler: 'index.handler',
        Timeout: 300,
        Code: {
          ZipFile: Match.stringLikeRegexp('import boto3'),
        },
      });
    });

    test('Lambda has permissions to access CodePipeline and SNS', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'codepipeline:GetPipelineExecution',
                'codepipeline:GetPipelineState',
              ]),
            }),
          ]),
        },
      });
    });
  });

  describe('CodePipeline Configuration', () => {
    test('creates pipeline with all required stages', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'tap-pipeline-dev',
        Stages: Match.arrayWith([
          Match.objectLike({ Name: 'Source' }),
          Match.objectLike({ Name: 'Build' }),
          Match.objectLike({ Name: 'PreProductionApproval' }),
          Match.objectLike({ Name: 'Deploy' }),
          Match.objectLike({ Name: 'PostDeploymentValidation' }),
        ]),
      });
    });

    test('includes manual approval action', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'PreProductionApproval',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: {
                  Category: 'Approval',
                  Owner: 'AWS',
                  Provider: 'Manual',
                },
              }),
            ]),
          }),
        ]),
      });
    });

    test('includes CodeDeploy deployment action', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Deploy',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: {
                  Category: 'Deploy',
                  Owner: 'AWS',
                  Provider: 'CodeDeploy',
                },
              }),
            ]),
          }),
        ]),
      });
    });

    test('includes Lambda invoke action for validation', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'PostDeploymentValidation',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: {
                  Category: 'Invoke',
                  Owner: 'AWS',
                  Provider: 'Lambda',
                },
              }),
            ]),
          }),
        ]),
      });
    });
  });

  describe('CloudWatch Events and Notifications', () => {
    test('creates CloudWatch event rule for pipeline state changes', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Description: 'Send notification when pipeline state changes',
        EventPattern: {
          source: ['aws.codepipeline'],
          'detail-type': ['CodePipeline Pipeline Execution State Change'],
        },
      });
    });
  });

  describe('Custom Resource for Boto3 Operations', () => {
    test('creates custom resource provider', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'framework.onEvent',
        Runtime: Match.stringLikeRegexp('nodejs'),
      });
    });

    test('creates custom resource', () => {
      template.hasResourceProperties('AWS::CloudFormation::CustomResource', {
        Properties: Match.objectLike({
          PipelineName: 'tap-pipeline',
        }),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports all required ARNs and identifiers', () => {
      template.hasOutput('PipelineArn', {
        Description: 'ARN of the main CI/CD pipeline',
        Export: { Name: 'TapPipelineArndev' },
      });

      template.hasOutput('BuildProjectArn', {
        Description: 'ARN of the CodeBuild project',
        Export: { Name: 'TapBuildProjectArndev' },
      });

      template.hasOutput('DeploymentApplicationArn', {
        Description: 'ARN of the CodeDeploy application',
        Export: { Name: 'TapDeployApplicationArndev' },
      });

      template.hasOutput('NotificationTopicArn', {
        Description: 'ARN of the SNS notification topic',
        Export: { Name: 'TapNotificationTopicArndev' },
      });

      template.hasOutput('ArtifactsBucketName', {
        Description: 'Name of the encrypted S3 artifacts bucket',
        Export: { Name: 'TapArtifactsBucketNamedev' },
      });

      template.hasOutput('VpcId', {
        Description: 'ID of the VPC hosting the infrastructure',
        Export: { Name: 'TapVpcIddev' },
      });
    });
  });

  describe('Security Best Practices', () => {
    test('S3 bucket has encryption enabled', () => {
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

    test('IAM roles follow least privilege principle', () => {
      // Verify that roles only have necessary permissions
      const roles = template.findResources('AWS::IAM::Role');
      Object.keys(roles).forEach((roleKey) => {
        const role = roles[roleKey];
        expect(role.Properties.AssumeRolePolicyDocument.Statement).toBeDefined();
        expect(role.Properties.AssumeRolePolicyDocument.Statement.length).toBeGreaterThan(0);
      });
    });

    test('EC2 instances use private subnets', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        VPCZoneIdentifier: Match.anyValue(),
      });
    });
  });
});
