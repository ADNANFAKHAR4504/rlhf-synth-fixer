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
      environmentSuffix: 'test',
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('S3 Bucket', () => {
    test('creates S3 bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('creates S3 bucket with encryption', () => {
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

    test('creates S3 bucket with public access blocked', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('creates S3 bucket with deletion policy', () => {
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('creates S3 bucket with proper naming', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([
              Match.stringLikeRegexp('cloud-env-data-test-'),
            ]),
          ]),
        },
      });
    });

    // Note: autoDeleteObjects custom resource removed for LocalStack compatibility
    // LocalStack doesn't support custom resource Lambda upload properly
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates public subnets in multiple AZs', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 2);
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('attaches Internet Gateway to VPC', () => {
      template.hasResourceProperties('AWS::EC2::VPCGatewayAttachment', {
        VpcId: {
          Ref: Match.anyValue(),
        },
        InternetGatewayId: {
          Ref: Match.anyValue(),
        },
      });
    });

    test('creates route tables for public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
        GatewayId: {
          Ref: Match.anyValue(),
        },
      });
    });

    test('does not create NAT gateways', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 0);
    });
  });

  describe('Security Group', () => {
    test('creates security group with SSH access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Allow SSH access',
        SecurityGroupIngress: [
          {
            CidrIp: '0.0.0.0/0',
            FromPort: 22,
            ToPort: 22,
            IpProtocol: 'tcp',
            Description: 'Allow SSH access',
          },
        ],
      });
    });

    test('allows all outbound traffic', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupEgress: [
          {
            CidrIp: '0.0.0.0/0',
            IpProtocol: '-1',
            Description: 'Allow all outbound traffic by default',
          },
        ],
      });
    });
  });

  describe('IAM Role', () => {
    test('creates IAM role for EC2', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
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
        },
        Description: 'IAM role for EC2 instance with S3 access',
      });
    });

    test('attaches SSM managed policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                {
                  Ref: 'AWS::Partition',
                },
                ':iam::aws:policy/AmazonSSMManagedInstanceCore',
              ],
            ],
          },
        ],
      });
    });

    test('creates IAM policy for S3 access', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: Match.arrayWith([
                's3:GetObject*',
                's3:PutObject',
              ]),
              Resource: Match.anyValue(),
            },
          ],
        },
      });
    });

    test('creates instance profile', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        Roles: [
          {
            Ref: Match.anyValue(),
          },
        ],
      });
    });
  });

  describe('EC2 Instance', () => {
    test('creates EC2 instance with t2.micro', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't2.micro',
      });
    });

    test('uses AMI from SSM parameter', () => {
      // SSM parameter lookup for AMI (LocalStack compatible)
      template.hasResourceProperties('AWS::EC2::Instance', {
        ImageId: {
          Ref: Match.stringLikeRegexp('.*SsmParameterValue.*'),
        },
      });
    });

    test('assigns instance to public subnet', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        SubnetId: {
          Ref: Match.anyValue(),
        },
      });
    });

    test('assigns security group to instance', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        SecurityGroupIds: [
          {
            'Fn::GetAtt': [Match.anyValue(), 'GroupId'],
          },
        ],
      });
    });

    test('assigns IAM role to instance', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        IamInstanceProfile: {
          Ref: Match.anyValue(),
        },
      });
    });

    test('includes user data script', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        UserData: {
          'Fn::Base64': Match.anyValue(),
        },
      });
    });
  });

  describe('Elastic IP', () => {
    test('creates Elastic IP for VPC', () => {
      template.hasResourceProperties('AWS::EC2::EIP', {
        Domain: 'vpc',
      });
    });

    test('associates Elastic IP with EC2 instance', () => {
      template.hasResourceProperties('AWS::EC2::EIP', {
        InstanceId: {
          Ref: Match.anyValue(),
        },
      });
    });
  });

  describe('Resource Tagging', () => {
    test('tags are applied to S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'test' },
          { Key: 'Project', Value: 'CloudEnvironmentSetup' },
        ]),
      });
    });

    test('tags are applied to VPC', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'test' },
          { Key: 'Project', Value: 'CloudEnvironmentSetup' },
        ]),
      });
    });

    test('tags are applied to EC2 instance', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'test' },
          { Key: 'Project', Value: 'CloudEnvironmentSetup' },
        ]),
      });
    });

    test('tags are applied to security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'test' },
          { Key: 'Project', Value: 'CloudEnvironmentSetup' },
        ]),
      });
    });

    test('tags are applied to IAM role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'test' },
          { Key: 'Project', Value: 'CloudEnvironmentSetup' },
        ]),
        Description: 'IAM role for EC2 instance with S3 access',
      });
    });

    test('tags are applied to Elastic IP', () => {
      template.hasResourceProperties('AWS::EC2::EIP', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'test' },
          { Key: 'Project', Value: 'CloudEnvironmentSetup' },
        ]),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports S3 bucket name', () => {
      template.hasOutput('BucketName', {
        Description: 'S3 Bucket Name',
        Value: {
          Ref: Match.anyValue(),
        },
      });
    });

    test('exports EC2 instance ID', () => {
      template.hasOutput('InstanceId', {
        Description: 'EC2 Instance ID',
        Value: {
          Ref: Match.anyValue(),
        },
      });
    });

    test('exports Elastic IP address', () => {
      template.hasOutput('ElasticIp', {
        Description: 'Elastic IP Address',
        Value: {
          Ref: Match.anyValue(),
        },
      });
    });

    test('exports IAM role ARN', () => {
      template.hasOutput('InstanceRole', {
        Description: 'EC2 Instance Role ARN',
        Value: {
          'Fn::GetAtt': [Match.anyValue(), 'Arn'],
        },
      });
    });
  });

  describe('Environment Suffix', () => {
    test('uses environment suffix in resource names', () => {
      const newApp = new cdk.App();
      const stackWithSuffix = new TapStack(newApp, 'TestStackWithSuffix', {
        environmentSuffix: 'prod',
      });
      const templateWithSuffix = Template.fromStack(stackWithSuffix);

      templateWithSuffix.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([
              Match.stringLikeRegexp('cloud-env-data-prod-'),
            ]),
          ]),
        },
      });
    });

    test('defaults to dev when no suffix provided', () => {
      const newApp2 = new cdk.App();
      const stackNoSuffix = new TapStack(newApp2, 'TestStackNoSuffix');
      const templateNoSuffix = Template.fromStack(stackNoSuffix);

      templateNoSuffix.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([
              Match.stringLikeRegexp('cloud-env-data-dev-'),
            ]),
          ]),
        },
      });
    });
  });

  describe('Resource Limits', () => {
    test('creates exactly one S3 bucket', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('creates exactly one EC2 instance', () => {
      template.resourceCountIs('AWS::EC2::Instance', 1);
    });

    test('creates exactly one Elastic IP', () => {
      template.resourceCountIs('AWS::EC2::EIP', 1);
    });

    test('creates exactly one security group', () => {
      template.resourceCountIs('AWS::EC2::SecurityGroup', 1);
    });

    test('creates exactly one VPC', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });
  });
});