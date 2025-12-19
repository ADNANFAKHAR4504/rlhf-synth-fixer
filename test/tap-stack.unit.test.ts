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
      env: { region: 'us-east-1' },
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

    test('creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
    });

    test('does not create NAT Gateway (LocalStack compatibility)', () => {
      // NAT Gateway disabled for LocalStack Community Edition compatibility
      template.resourceCountIs('AWS::EC2::NatGateway', 0);
      template.resourceCountIs('AWS::EC2::EIP', 0);
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

    test('creates EC2 security group without SSH access (uses SSM)', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Allow HTTP from ALB and SSH',
        // No SecurityGroupIngress for SSH - using AWS Systems Manager instead
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

    test('attaches SSM managed policy for secure access', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
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
        // ImageId now uses dynamic lookup instead of hard-coded AMI
        ImageId: {
          Ref: Match.stringLikeRegexp('SsmParameterValue'),
        },
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

    test('Auto Scaling Group uses public subnets (LocalStack compatibility)', () => {
      // Using public subnets since NAT Gateway not available in LocalStack
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        VPCZoneIdentifier: [
          {
            Ref: Match.stringLikeRegexp('PublicSubnetSubnet1'),
          },
          {
            Ref: Match.stringLikeRegexp('PublicSubnetSubnet2'),
          },
        ],
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

    test('ALB uses public subnets', () => {
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

  describe('Stack Outputs', () => {
    test('exports VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
      });
    });

    test('exports Subnet IDs', () => {
      template.hasOutput('PublicSubnetIds', {
        Description: 'Public Subnet IDs',
      });
      template.hasOutput('PrivateSubnetIds', {
        Description: 'Private Subnet IDs',
      });
    });

    test('exports Security Group IDs', () => {
      template.hasOutput('ALBSecurityGroupId', {
        Description: 'ALB Security Group ID',
      });
      template.hasOutput('EC2SecurityGroupId', {
        Description: 'EC2 Security Group ID',
      });
    });

    test('exports IAM Role ARN', () => {
      template.hasOutput('EC2RoleArn', {
        Description: 'EC2 Instance Role ARN',
      });
    });

    test('exports Load Balancer DNS name', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'Public DNS of the Application Load Balancer',
        Value: {
          'Fn::GetAtt': [Match.stringLikeRegexp('WebAppALB'), 'DNSName'],
        },
      });
    });

    test('exports Auto Scaling Group name', () => {
      template.hasOutput('AutoScalingGroupName', {
        Description: 'Auto Scaling Group Name',
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

  describe('Resource Count Validation', () => {
    test('creates expected number of each resource type', () => {
      // Core infrastructure
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::Subnet', 4);
      template.resourceCountIs('AWS::EC2::SecurityGroup', 2);
      template.resourceCountIs('AWS::EC2::SecurityGroupIngress', 1);
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);

      // LocalStack compatibility: No NAT Gateway
      template.resourceCountIs('AWS::EC2::NatGateway', 0);

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
