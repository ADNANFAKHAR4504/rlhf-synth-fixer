import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct CIDR and configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates subnets across availability zones', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 public + 2 private + 2 database
    });

    test('creates NAT gateways for high availability', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('creates S3 bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: { Status: 'Enabled' },
      });
    });

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

    test('S3 bucket has lifecycle rules configured', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            Match.objectLike({
              Id: 'LogsLifecycle',
              Status: 'Enabled',
              Transitions: Match.arrayWith([
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                },
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90,
                },
              ]),
              ExpirationInDays: 365,
            }),
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

    test('S3 bucket has destroy removal policy for testing', () => {
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('S3 bucket has proper tagging', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          { Key: 'Project', Value: 'ScalableCloudEnvironment' },
        ]),
      });
    });
  });

  describe('IAM Role Configuration', () => {
    test('creates IAM role for EC2 instances', () => {
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
      });
    });

    test('IAM role has CloudWatch and SSM policies attached', () => {
      template.hasResourceProperties('AWS::IAM::Role', Match.objectLike({
        RoleName: `ec2-instance-role-${environmentSuffix}`,
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([Match.stringLikeRegexp('.*CloudWatchAgentServerPolicy')]),
            ]),
          }),
        ]),
      }));
    });

    test('IAM role has CloudWatch metrics permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', Match.objectLike({
        RoleName: `ec2-instance-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
        }),
      }));
    });

    test('IAM role has S3 bucket permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', Match.objectLike({
        RoleName: `ec2-instance-role-${environmentSuffix}`,
        Description: 'IAM role for EC2 instances with least privilege access',
      }));
    });
  });

  describe('Security Groups Configuration', () => {
    test('ASG security group allows HTTP and HTTPS traffic', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Auto Scaling Group instances',
        SecurityGroupIngress: Match.arrayWith([
          {
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTP traffic',
            FromPort: 80,
            IpProtocol: 'tcp',
            ToPort: 80,
          },
          {
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTPS traffic',
            FromPort: 443,
            IpProtocol: 'tcp',
            ToPort: 443,
          },
        ]),
      });
    });

    test('Database security group is properly configured', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
        GroupName: `db-security-group-${environmentSuffix}`,
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '255.255.255.255/32',
            Description: 'Disallow all traffic',
            IpProtocol: 'icmp',
          }),
        ]),
      });
    });
  });

  describe('Resource Tagging', () => {
    test('VPC has proper tags', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Project', Value: 'ScalableCloudEnvironment' },
        ]),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports VPC ID', () => {
      template.hasOutput('VpcId', {
        Export: { Name: `${stack.stackName}-VpcId` },
      });
    });

    test('exports S3 bucket name', () => {
      template.hasOutput('S3BucketName', {
        Export: { Name: `${stack.stackName}-LogsBucket` },
      });
    });

    test('exports RDS database endpoint', () => {
      template.hasOutput('DatabaseEndpoint', {
        Export: { Name: `${stack.stackName}-DatabaseEndpoint` },
      });
    });

    test('exports Auto Scaling Group name', () => {
      template.hasOutput('AutoScalingGroupName', {
        Export: { Name: `${stack.stackName}-ASGName` },
      });
    });

    test('exports IAM role ARN', () => {
      template.hasOutput('IAMRoleArn', {
        Export: { Name: `${stack.stackName}-EC2Role` },
      });
    });
  });

  describe('High Availability', () => {
    test('resources span multiple availability zones', () => {
      // Check NAT Gateways
      template.resourceCountIs('AWS::EC2::NatGateway', 2);

      // Check subnets (2 public + 2 private + 2 database)
      template.resourceCountIs('AWS::EC2::Subnet', 6);

      // Check RDS subnet group
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database',
        DBSubnetGroupName: `db-subnet-group-${environmentSuffix}`,
      });
    });
  });

  describe('Environment Suffix Resolution', () => {
    test('uses default suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      const defaultTemplate = Template.fromStack(defaultStack);
      defaultTemplate.hasOutput('VpcId', {
        Export: { Name: 'DefaultStack-VpcId' },
      });
    });

    test('uses context suffix when provided', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'context-test',
        },
      });
      const contextStack = new TapStack(contextApp, 'ContextStack');
      const contextTemplate = Template.fromStack(contextStack);
      contextTemplate.hasOutput('VpcId', {
        Export: { Name: 'ContextStack-VpcId' },
      });
    });

    test('uses props suffix when provided', () => {
      const propsApp = new cdk.App();
      const propsStack = new TapStack(propsApp, 'PropsStack', {
        environmentSuffix: 'props-test',
      });
      const propsTemplate = Template.fromStack(propsStack);
      propsTemplate.hasOutput('VpcId', {
        Export: { Name: 'PropsStack-VpcId' },
      });
    });
  });
});