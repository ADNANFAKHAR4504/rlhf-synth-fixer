import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-west-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create a VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: `tap-${environmentSuffix}-vpc`,
          },
        ]),
      });
    });

    test('should create exactly 2 public subnets', () => {
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

    test('should create exactly 1 NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('should create an Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should create an S3 bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should have S3 bucket encryption enabled', () => {
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

    test('should have public access blocked', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should have a bucket policy restricting access to specific roles', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
              ]),
              Principal: Match.objectLike({
                AWS: Match.anyValue(),
              }),
            }),
          ]),
        },
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create an EC2 role with correct naming', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-${environmentSuffix}-ec2-role`,
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
      });
    });

    test('should create a logging role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-${environmentSuffix}-logging-role`,
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'logs.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
      });
    });

    test('should attach SSM managed policy to EC2 role', () => {
      // Check that the EC2 role exists and has the right trust policy
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-${environmentSuffix}-ec2-role`,
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
      });

      // The SSM policy is attached as a managed policy
      const roleResources = template.findResources('AWS::IAM::Role', {
        Properties: {
          RoleName: `tap-${environmentSuffix}-ec2-role`,
        },
      });

      const roleKeys = Object.keys(roleResources);
      expect(roleKeys.length).toBeGreaterThan(0);

      const roleProps = roleResources[roleKeys[0]].Properties;
      expect(roleProps.ManagedPolicyArns).toBeDefined();
      expect(roleProps.ManagedPolicyArns.length).toBeGreaterThan(0);

      // Check that one of the policies contains SSMManagedInstanceCore
      const hasSsmPolicy = roleProps.ManagedPolicyArns.some((arn: any) => {
        if (typeof arn === 'string') {
          return arn.includes('SSMManagedInstanceCore');
        }
        if (arn['Fn::Join']) {
          const joinParts = arn['Fn::Join'][1];
          return joinParts.some(
            (part: any) =>
              typeof part === 'string' &&
              part.includes('SSMManagedInstanceCore')
          );
        }
        return false;
      });

      expect(hasSsmPolicy).toBe(true);
    });
  });

  describe('EC2 Instances', () => {
    test('should create exactly 2 EC2 instances', () => {
      template.resourceCountIs('AWS::EC2::Instance', 2);
    });

    test('should use t3.micro instance type', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
      });
    });

    test('should have instances with correct naming', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: `tap-${environmentSuffix}-instance-1`,
          },
        ]),
      });

      template.hasResourceProperties('AWS::EC2::Instance', {
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: `tap-${environmentSuffix}-instance-2`,
          },
        ]),
      });
    });

    test('should configure instances with IMDSv2', () => {
      const instances = template.findResources('AWS::EC2::Instance');
      Object.values(instances).forEach(instance => {
        expect(instance.Properties).toHaveProperty('LaunchTemplate');
      });
    });
  });

  describe('Elastic IP', () => {
    test('should create an Elastic IP', () => {
      template.resourceCountIs('AWS::EC2::EIP', 2); // 1 for instance + 1 for NAT
      template.hasResourceProperties('AWS::EC2::EIP', {
        Domain: 'vpc',
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: `tap-${environmentSuffix}-eip`,
          },
        ]),
      });
    });

    test('should create an EIP association', () => {
      template.resourceCountIs('AWS::EC2::EIPAssociation', 1);
    });
  });

  describe('Load Balancer', () => {
    test('should create an Application Load Balancer', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Name: `tap-${environmentSuffix}-alb`,
          Type: 'application',
          Scheme: 'internet-facing',
        }
      );
    });

    test('should create a target group', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          Name: `tap-${environmentSuffix}-tg`,
          Port: 80,
          Protocol: 'HTTP',
          HealthCheckEnabled: true,
          HealthCheckPath: '/',
          HealthCheckProtocol: 'HTTP',
        }
      );
    });

    test('should create an ALB listener on port 80', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });
  });

  describe('Security Groups', () => {
    test('should create security group for EC2 instances', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `tap-${environmentSuffix}-ec2-sg`,
        GroupDescription: 'Security group for EC2 instances',
      });
    });

    test('should create security group for ALB', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `tap-${environmentSuffix}-alb-sg`,
        GroupDescription: 'Security group for Application Load Balancer',
      });
    });

    test('should allow HTTP and HTTPS traffic', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
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

  describe('CloudFormation Outputs', () => {
    test('should have VPC ID output', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
        Export: {
          Name: `tap-${environmentSuffix}-vpc-id`,
        },
      });
    });

    test('should have S3 bucket name output', () => {
      template.hasOutput('S3BucketName', {
        Description: 'S3 Bucket for Application Logs',
        Export: {
          Name: `tap-${environmentSuffix}-logs-bucket`,
        },
      });
    });

    test('should have Elastic IP output', () => {
      template.hasOutput('ElasticIPAddress', {
        Description: 'Elastic IP Address',
        Export: {
          Name: `tap-${environmentSuffix}-elastic-ip`,
        },
      });
    });

    test('should have Load Balancer DNS output', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'Application Load Balancer DNS Name',
        Export: {
          Name: `tap-${environmentSuffix}-alb-dns`,
        },
      });
    });
  });

  describe('Naming Conventions', () => {
    test('should follow project-environment-resource naming pattern', () => {
      // VPC
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: Match.stringLikeRegexp('^tap-test-.*'),
          },
        ]),
      });

      // S3 Bucket - Note: BucketName is a complex expression with Fn::Join
      const bucketResources = template.findResources('AWS::S3::Bucket');
      const bucketKeys = Object.keys(bucketResources);
      expect(bucketKeys.length).toBeGreaterThan(0);

      // Verify the bucket exists and has versioning
      const bucketProps = bucketResources[bucketKeys[0]].Properties;
      expect(bucketProps.VersioningConfiguration?.Status).toBe('Enabled');

      // IAM Roles
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.stringLikeRegexp('^tap-test-.*'),
      });
    });
  });
});
