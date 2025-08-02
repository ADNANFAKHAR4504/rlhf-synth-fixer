import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: { region: 'us-west-2' },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Infrastructure', () => {
    test('creates VPC with correct configuration', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates public and private subnets across 2 AZs', () => {
      // 2 public + 2 private subnets = 4 total
      template.resourceCountIs('AWS::EC2::Subnet', 4);

      // Check for public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });

      // Check for private subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('creates NAT Gateway for private subnet egress', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
      template.resourceCountIs('AWS::EC2::EIP', 1);
    });

    test('creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
    });
  });

  describe('Security Groups', () => {
    test('creates ALB security group with HTTP access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Allow HTTP traffic to ALB',
        SecurityGroupIngress: [
          {
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTP from anywhere',
            FromPort: 80,
            ToPort: 80,
            IpProtocol: 'tcp',
          },
        ],
      });
    });

    test('creates EC2 security group with SSH access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Allow HTTP from ALB and SSH',
        SecurityGroupIngress: [
          {
            CidrIp: '0.0.0.0/0',
            Description:
              'Allow SSH access from anywhere (Not recommended for production)',
            FromPort: 22,
            ToPort: 22,
            IpProtocol: 'tcp',
          },
        ],
      });
    });

    test('creates separate security group ingress rule for HTTP from ALB', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        Description: 'Allow HTTP traffic from ALB',
        FromPort: 80,
        ToPort: 80,
        IpProtocol: 'tcp',
        SourceSecurityGroupId: {
          'Fn::GetAtt': [Match.stringLikeRegexp('ALBSecurityGroup'), 'GroupId'],
        },
      });
    });
  });

  describe('IAM Configuration', () => {
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

    test('creates IAM instance profiles', () => {
      // CDK creates 2 instance profiles: one explicit and one for ASG
      template.resourceCountIs('AWS::IAM::InstanceProfile', 2);

      // Check that our explicit instance profile exists
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        Roles: [
          {
            Ref: Match.stringLikeRegexp('EC2InstanceRole'),
          },
        ],
      });
    });
  });

  describe('Auto Scaling Group', () => {
    test('creates Auto Scaling Group with correct capacity', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '5',
        VPCZoneIdentifier: Match.anyValue(),
      });
    });

    test('creates Launch Configuration with correct specifications', () => {
      template.hasResourceProperties('AWS::AutoScaling::LaunchConfiguration', {
        ImageId: 'ami-054b7fc3c333ac6d2',
        InstanceType: 't2.micro',
        IamInstanceProfile: {
          Ref: Match.stringLikeRegexp('WebAppASGInstanceProfile'),
        },
        SecurityGroups: [
          {
            'Fn::GetAtt': [
              Match.stringLikeRegexp('EC2SecurityGroup'),
              'GroupId',
            ],
          },
        ],
      });
    });

    test('Auto Scaling Group uses Launch Configuration', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        LaunchConfigurationName: {
          Ref: Match.stringLikeRegexp('WebAppASGLaunchConfig'),
        },
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('creates internet-facing Application Load Balancer', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Scheme: 'internet-facing',
          Type: 'application',
        }
      );
    });

    test('creates HTTP listener on port 80', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
        DefaultActions: [
          {
            Type: 'forward',
            TargetGroupArn: {
              Ref: Match.stringLikeRegexp('ASGTargetsGroup'),
            },
          },
        ],
      });
    });

    test('creates target group with health check configuration', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          Port: 80,
          Protocol: 'HTTP',
          TargetType: 'instance',
          HealthCheckPath: '/',
          HealthCheckIntervalSeconds: 60,
          VpcId: {
            Ref: Match.stringLikeRegexp('WebAppVpc'),
          },
        }
      );
    });
  });

  describe('Stack Outputs', () => {
    test('exports Load Balancer DNS name', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'Public DNS of the Application Load Balancer',
        Value: {
          'Fn::GetAtt': [Match.stringLikeRegexp('WebAppALB'), 'DNSName'],
        },
      });
    });
  });

  describe('Resource Tagging', () => {
    test('applies required tags to VPC', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Application',
            Value: 'WebApp',
          },
          {
            Key: 'Environment',
            Value: 'Production',
          },
        ]),
      });
    });

    test('applies required tags to Auto Scaling Group', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        Tags: Match.arrayWith([
          {
            Key: 'Application',
            Value: 'WebApp',
            PropagateAtLaunch: true,
          },
          {
            Key: 'Environment',
            Value: 'Production',
            PropagateAtLaunch: true,
          },
        ]),
      });
    });

    test('applies required tags to Load Balancer', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Tags: Match.arrayWith([
            {
              Key: 'Application',
              Value: 'WebApp',
            },
            {
              Key: 'Environment',
              Value: 'Production',
            },
          ]),
        }
      );
    });
  });

  describe('Network Architecture', () => {
    test('ensures Auto Scaling Group uses private subnets', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        VPCZoneIdentifier: [
          {
            Ref: Match.stringLikeRegexp('PrivateSubnetSubnet1'),
          },
          {
            Ref: Match.stringLikeRegexp('PrivateSubnetSubnet2'),
          },
        ],
      });
    });

    test('ensures Load Balancer uses public subnets', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Subnets: [
            {
              Ref: Match.stringLikeRegexp('PublicSubnetSubnet1'),
            },
            {
              Ref: Match.stringLikeRegexp('PublicSubnetSubnet2'),
            },
          ],
        }
      );
    });
  });

  describe('Resource Count Validation', () => {
    test('creates expected number of each resource type', () => {
      // Core infrastructure
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::Subnet', 4);
      template.resourceCountIs('AWS::EC2::SecurityGroup', 2);
      template.resourceCountIs('AWS::EC2::SecurityGroupIngress', 1); // Separate ALB->EC2 rule
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);

      // Compute and scaling - Using Launch Configuration
      template.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 1);
      template.resourceCountIs('AWS::AutoScaling::LaunchConfiguration', 1);

      // Load balancing
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 1);
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 1);

      // IAM - CDK creates 2 instance profiles (explicit + ASG generated)
      template.resourceCountIs('AWS::IAM::Role', 1);
      template.resourceCountIs('AWS::IAM::InstanceProfile', 2);
    });
  });
});
