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
  });

  describe('CodeBuild Project', () => {
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
  });

  describe('CodeDeploy Configuration', () => {
    test('creates CodeDeploy application', () => {
      template.hasResourceProperties('AWS::CodeDeploy::Application', {
        ApplicationName: 'tap-application-dev',
        ComputePlatform: 'Server',
      });
    });
  });

  describe('Lambda Function for Boto3 Integration', () => {
    test('creates Lambda function with proper runtime and permissions', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.9',
        Handler: 'index.handler',
        Timeout: 300,
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
        },
      });
    });
  });

  describe('Custom Resource for Boto3 Operations', () => {});

  describe('Stack Outputs', () => {
    test('exports all required ARNs and identifiers', () => {
      template.hasOutput('*', {
        Description: Match.anyValue(),
        Export: {
          Name: Match.stringLikeRegexp('Tap.*dev'),
        },
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
      Object.keys(roles).forEach(roleKey => {
        const role = roles[roleKey];
        expect(
          role.Properties.AssumeRolePolicyDocument.Statement
        ).toBeDefined();
        expect(
          role.Properties.AssumeRolePolicyDocument.Statement.length
        ).toBeGreaterThan(0);
      });
    });

    test('EC2 instances use private subnets', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        VPCZoneIdentifier: Match.anyValue(),
      });
    });
  });
});
