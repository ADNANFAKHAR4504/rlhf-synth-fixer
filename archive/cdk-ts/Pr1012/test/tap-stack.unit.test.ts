import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test-env';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, `TapStack${environmentSuffix}`, {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create a VPC with correct name', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: `nodejs-cicd-vpc-${environmentSuffix}`,
          },
        ]),
      });
    });

    test('should create 2 public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:subnet-type',
            Value: 'Public',
          },
        ]),
      });
    });

    test('should create 2 private subnets with egress', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:subnet-type',
            Value: 'Private',
          },
        ]),
      });
    });

    test('should create NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('S3 Buckets', () => {
    test('should create source code bucket with versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `nodejs-app-source-${environmentSuffix}-123456789012-us-east-1`,
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should create artifacts bucket with versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `codepipeline-artifacts-${environmentSuffix}-123456789012-us-east-1`,
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should have deletion policy set to delete for both buckets', () => {
      template.hasResource('AWS::S3::Bucket', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });

    test('should enable EventBridge on source bucket', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const sourceCodeBucket = Object.entries(buckets).find(([_, bucket]) =>
        bucket.Properties?.BucketName?.includes('nodejs-app-source')
      );
      expect(sourceCodeBucket).toBeDefined();
    });
  });

  describe('IAM Roles', () => {
    test('should create EC2 instance role with correct name', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `nodejs-ec2-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('should create CodeDeploy service role with correct name', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `nodejs-codedeploy-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'codedeploy.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('should create CodeBuild service role with correct name', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `nodejs-codebuild-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('should create CodePipeline service role with correct name', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `nodejs-codepipeline-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'codepipeline.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('EC2 role should have CloudWatch and SSM policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `nodejs-ec2-role-${environmentSuffix}`,
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([Match.stringLikeRegexp('CloudWatchAgentServerPolicy')]),
            ]),
          }),
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([Match.stringLikeRegexp('AmazonSSMManagedInstanceCore')]),
            ]),
          }),
        ]),
      });
    });
  });

  describe('EC2 Configuration', () => {
    test('should create security group with correct name', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Node.js application EC2 instances',
        GroupName: `nodejs-ec2-sg-${environmentSuffix}`,
      });
    });

    test('should allow HTTP traffic on port 80', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('should allow HTTPS traffic on port 443', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('should allow Node.js application traffic on port 3000', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 3000,
            ToPort: 3000,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('should create launch template with correct name', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: `nodejs-app-lt-${environmentSuffix}`,
      });
    });

    test('should configure launch template with t3.micro instance', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't3.micro',
        }),
      });
    });

    test('should create Auto Scaling Group with correct name', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: `nodejs-app-asg-${environmentSuffix}`,
        MinSize: '1',
        MaxSize: '3',
        DesiredCapacity: '2',
      });
    });

    test('should tag Auto Scaling Group instances correctly', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            PropagateAtLaunch: true,
            Value: `NodejsApp-${environmentSuffix}`,
          },
        ]),
      });
      
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            PropagateAtLaunch: true,
            Value: environmentSuffix,
          },
        ]),
      });
    });
  });

  describe('CodeBuild Configuration', () => {
    test('should create CodeBuild project with correct name', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `nodejs-app-build-${environmentSuffix}`,
        Description: 'Build project for Node.js application',
      });
    });

    test('should use Node.js 18 build environment', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Environment: Match.objectLike({
          ComputeType: 'BUILD_GENERAL1_SMALL',
          Image: 'aws/codebuild/standard:7.0',
        }),
      });
    });

    test('should have proper build spec', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Source: Match.objectLike({
          BuildSpec: Match.serializedJson(
            Match.objectLike({
              version: '0.2',
              phases: Match.objectLike({
                pre_build: Match.objectLike({
                  commands: Match.arrayWith(['npm install']),
                }),
                build: Match.objectLike({
                  commands: Match.arrayWith(['npm test']),
                }),
              }),
              artifacts: Match.objectLike({
                files: ['**/*'],
              }),
            })
          ),
        }),
      });
    });
  });

  describe('CodeDeploy Configuration', () => {
    test('should create CodeDeploy application with correct name', () => {
      template.hasResourceProperties('AWS::CodeDeploy::Application', {
        ApplicationName: `nodejs-app-${environmentSuffix}`,
        ComputePlatform: 'Server',
      });
    });

    test('should create deployment group with correct name', () => {
      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        DeploymentGroupName: `nodejs-app-deployment-group-${environmentSuffix}`,
        DeploymentConfigName: 'CodeDeployDefault.HalfAtATime',
      });
    });

    test('should configure auto-rollback on failures', () => {
      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        AutoRollbackConfiguration: {
          Enabled: true,
          Events: Match.arrayWith(['DEPLOYMENT_FAILURE']),
        },
      });
    });
  });

  describe('CodePipeline Configuration', () => {
    test('should create pipeline with correct name', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: `nodejs-app-pipeline-${environmentSuffix}`,
      });
    });

    test('should have three stages: Source, Build, Deploy', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Source',
            Actions: Match.arrayWith([
              Match.objectLike({
                Name: 'S3Source',
                ActionTypeId: Match.objectLike({
                  Category: 'Source',
                  Provider: 'S3',
                }),
              }),
            ]),
          }),
          Match.objectLike({
            Name: 'Build',
            Actions: Match.arrayWith([
              Match.objectLike({
                Name: 'CodeBuild',
                ActionTypeId: Match.objectLike({
                  Category: 'Build',
                  Provider: 'CodeBuild',
                }),
              }),
            ]),
          }),
          Match.objectLike({
            Name: 'Deploy',
            Actions: Match.arrayWith([
              Match.objectLike({
                Name: 'CodeDeploy',
                ActionTypeId: Match.objectLike({
                  Category: 'Deploy',
                  Provider: 'CodeDeploy',
                }),
              }),
            ]),
          }),
        ]),
      });
    });

    test('should trigger on S3 events', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: Match.objectLike({
          source: ['aws.s3'],
          detail: Match.objectLike({
            requestParameters: Match.objectLike({
              key: ['nodejs-app.zip'],
            }),
          }),
        }),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should export source code bucket name', () => {
      template.hasOutput('SourceCodeBucketName', {
        Value: Match.anyValue(),
        Export: {
          Name: `SourceCodeBucketName-${environmentSuffix}`,
        },
      });
    });

    test('should export pipeline name', () => {
      template.hasOutput('PipelineName', {
        Value: Match.anyValue(),
        Export: {
          Name: `PipelineName-${environmentSuffix}`,
        },
      });
    });

    test('should export CodeDeploy application name', () => {
      template.hasOutput('CodeDeployApplicationName', {
        Value: Match.anyValue(),
        Export: {
          Name: `CodeDeployApplicationName-${environmentSuffix}`,
        },
      });
    });

    test('should export Auto Scaling Group name', () => {
      template.hasOutput('AutoScalingGroupName', {
        Value: Match.anyValue(),
        Export: {
          Name: `AutoScalingGroupName-${environmentSuffix}`,
        },
      });
    });

    test('should export VPC ID', () => {
      template.hasOutput('VpcId', {
        Value: Match.anyValue(),
        Export: {
          Name: `VpcId-${environmentSuffix}`,
        },
      });
    });

    test('should export artifacts bucket name', () => {
      template.hasOutput('ArtifactsBucketName', {
        Value: Match.anyValue(),
        Export: {
          Name: `ArtifactsBucketName-${environmentSuffix}`,
        },
      });
    });

    test('should export CodeBuild project name', () => {
      template.hasOutput('BuildProjectName', {
        Value: Match.anyValue(),
        Export: {
          Name: `BuildProjectName-${environmentSuffix}`,
        },
      });
    });

    test('should export deployment group name', () => {
      template.hasOutput('DeploymentGroupName', {
        Value: Match.anyValue(),
        Export: {
          Name: `DeploymentGroupName-${environmentSuffix}`,
        },
      });
    });
  });

  describe('IAM Permissions', () => {
    test('EC2 role should have S3 read permissions for artifacts', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith(['s3:GetObject', 's3:ListBucket']),
            }),
          ]),
        },
      });
    });

    test('CodeBuild should have permissions to read source and write artifacts', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith(['s3:GetObject*']),
            }),
          ]),
        },
      });
    });

    test('CodePipeline should have permissions for all services', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith(['codebuild:BatchGetBuilds', 'codebuild:StartBuild']),
            }),
          ]),
        },
      });

      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith(['codedeploy:CreateDeployment']),
            }),
          ]),
        },
      });
    });
  });

  describe('Resource Naming Conventions', () => {
    test('all resources should include environment suffix', () => {
      // Check S3 buckets
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket) => {
        const bucketName = bucket.Properties?.BucketName;
        if (typeof bucketName === 'string') {
          expect(bucketName).toContain(environmentSuffix);
        }
      });

      // Check IAM roles
      const roles = template.findResources('AWS::IAM::Role');
      Object.values(roles).forEach((role) => {
        const roleName = role.Properties?.RoleName;
        if (roleName && typeof roleName === 'string') {
          expect(roleName).toContain(environmentSuffix);
        }
      });

      // Check Security Groups
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      Object.values(securityGroups).forEach((sg) => {
        const sgName = sg.Properties?.GroupName || sg.Properties?.SecurityGroupName;
        if (sgName && typeof sgName === 'string') {
          expect(sgName).toContain(environmentSuffix);
        }
      });
    });
  });

  describe('Stack Properties', () => {
    test('should have proper stack configuration', () => {
      expect(stack.stackName).toBe(`TapStack${environmentSuffix}`);
      expect(stack.region).toBe('us-east-1');
      expect(stack.account).toBe('123456789012');
    });
  });
});