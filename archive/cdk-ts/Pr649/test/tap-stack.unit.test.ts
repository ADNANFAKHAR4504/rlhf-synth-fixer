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
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Environment Suffix Handling', () => {
    test('Uses provided environment suffix from props', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', { 
        environmentSuffix: 'custom' 
      });
      const customTemplate = Template.fromStack(customStack);
      
      customTemplate.hasResourceProperties('AWS::EC2::KeyPair', {
        KeyName: 'tap-key-custom',
      });
    });

    test('Uses environment suffix from context when not in props', () => {
      const contextApp = new cdk.App({
        context: { environmentSuffix: 'context' }
      });
      const contextStack = new TapStack(contextApp, 'ContextStack', {});
      const contextTemplate = Template.fromStack(contextStack);
      
      contextTemplate.hasResourceProperties('AWS::EC2::KeyPair', {
        KeyName: 'tap-key-context',
      });
    });

    test('Uses default dev suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack', {});
      const defaultTemplate = Template.fromStack(defaultStack);
      
      defaultTemplate.hasResourceProperties('AWS::EC2::KeyPair', {
        KeyName: 'tap-key-dev',
      });
    });
  });

  describe('VPC Configuration', () => {
    test('VPC created with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('VPC has Environment=Development tag', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Development',
          }),
        ]),
      });
    });
  });

  describe('Subnet Configuration', () => {
    test('Creates exactly 2 public subnets', () => {
      const publicSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: true,
        },
      });
      expect(Object.keys(publicSubnets).length).toBe(2);
    });

    test('Creates exactly 2 private subnets', () => {
      const privateSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: false,
        },
      });
      expect(Object.keys(privateSubnets).length).toBe(2);
    });

    test('Public subnets have correct CIDR blocks', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.0.0/24',
        MapPublicIpOnLaunch: true,
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.1.0/24',
        MapPublicIpOnLaunch: true,
      });
    });

    test('Private subnets have correct CIDR blocks', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.2.0/24',
        MapPublicIpOnLaunch: false,
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.3.0/24',
        MapPublicIpOnLaunch: false,
      });
    });

    test('Subnets are in different availability zones', () => {
      // AZs are selected dynamically, so we check they use Fn::Select
      template.hasResourceProperties('AWS::EC2::Subnet', {
        AvailabilityZone: Match.objectLike({
          'Fn::Select': Match.arrayWith([0]),
        }),
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        AvailabilityZone: Match.objectLike({
          'Fn::Select': Match.arrayWith([1]),
        }),
      });
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('Creates exactly 1 NAT Gateway', () => {
      const natGateways = template.findResources('AWS::EC2::NatGateway');
      expect(Object.keys(natGateways).length).toBe(1);
    });

    test('NAT Gateway is in public subnet', () => {
      template.hasResourceProperties('AWS::EC2::NatGateway', {
        SubnetId: {
          Ref: Match.stringLikeRegexp('.*PublicSubnet.*'),
        },
      });
    });

    test('Creates Elastic IP for NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::EIP', 1);
      template.hasResourceProperties('AWS::EC2::EIP', {
        Domain: 'vpc',
      });
    });
  });

  describe('Internet Gateway Configuration', () => {
    test('Creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('Internet Gateway is attached to VPC', () => {
      template.hasResourceProperties('AWS::EC2::VPCGatewayAttachment', {
        VpcId: {
          Ref: Match.stringLikeRegexp('TapVpc.*'),
        },
        InternetGatewayId: {
          Ref: Match.stringLikeRegexp('TapVpcIGW.*'),
        },
      });
    });
  });

  describe('Route Table Configuration', () => {
    test('Public subnets have routes to Internet Gateway', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
        GatewayId: {
          Ref: Match.stringLikeRegexp('TapVpcIGW.*'),
        },
      });
    });

    test('Private subnets have routes to NAT Gateway', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
        NatGatewayId: {
          Ref: Match.stringLikeRegexp('.*NATGateway.*'),
        },
      });
    });
  });

  describe('Security Group Configuration', () => {
    test('Creates SSH security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for SSH access from specific IP range',
        VpcId: {
          Ref: Match.stringLikeRegexp('TapVpc.*'),
        },
      });
    });

    test('SSH access restricted to 203.0.113.0/24', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '203.0.113.0/24',
            FromPort: 22,
            ToPort: 22,
            IpProtocol: 'tcp',
          }),
        ]),
      });
    });

    test('Security group allows all outbound traffic', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            IpProtocol: '-1',
          }),
        ]),
      });
    });
  });

  describe('EC2 Instance Configuration', () => {
    test('Creates exactly 2 EC2 instances', () => {
      template.resourceCountIs('AWS::EC2::Instance', 2);
    });

    test('All instances are t3.micro', () => {
      const instances = template.findResources('AWS::EC2::Instance');
      Object.values(instances).forEach((instance: any) => {
        expect(instance.Properties.InstanceType).toBe('t3.micro');
      });
    });

    test('Public instance is in public subnet', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        SubnetId: {
          Ref: Match.stringLikeRegexp('.*PublicSubnet.*'),
        },
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('.*public.*'),
          }),
        ]),
      });
    });

    test('Private instance is in private subnet', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        SubnetId: {
          Ref: Match.stringLikeRegexp('.*PrivateSubnet.*'),
        },
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('.*private.*'),
          }),
        ]),
      });
    });

    test('Instances use SSH security group', () => {
      const instances = template.findResources('AWS::EC2::Instance');
      Object.values(instances).forEach((instance: any) => {
        expect(instance.Properties.SecurityGroupIds).toEqual([
          {
            'Fn::GetAtt': ['SshSecurityGroup4CD4C749', 'GroupId'],
          },
        ]);
      });
    });

    test('Instances have IAM roles', () => {
      // Check that we have at least 2 IAM roles for EC2 instances
      const roles = template.findResources('AWS::IAM::Role', {
        Properties: {
          AssumeRolePolicyDocument: Match.objectLike({
            Statement: Match.arrayWith([
              Match.objectLike({
                Principal: Match.objectLike({
                  Service: 'ec2.amazonaws.com',
                }),
              }),
            ]),
          }),
        },
      });
      expect(Object.keys(roles).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Key Pair Configuration', () => {
    test('Creates EC2 key pair with environment suffix', () => {
      template.hasResourceProperties('AWS::EC2::KeyPair', {
        KeyName: `tap-key-${environmentSuffix}`,
        KeyType: 'rsa',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Outputs VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
      });
    });

    test('Outputs VPC CIDR', () => {
      template.hasOutput('VpcCidr', {
        Description: 'VPC CIDR Block',
      });
    });

    test('Outputs Public Subnet IDs', () => {
      template.hasOutput('PublicSubnetIds', {
        Description: 'Public Subnet IDs',
      });
    });

    test('Outputs Private Subnet IDs', () => {
      template.hasOutput('PrivateSubnetIds', {
        Description: 'Private Subnet IDs',
      });
    });

    test('Outputs NAT Gateway ID', () => {
      template.hasOutput('NatGatewayIds', {
        Description: 'NAT Gateway ID',
      });
    });

    test('Outputs Internet Gateway ID', () => {
      template.hasOutput('InternetGatewayId', {
        Description: 'Internet Gateway ID',
      });
    });

    test('Outputs EC2 Instance IDs', () => {
      template.hasOutput('PublicInstanceId', {
        Description: 'Public EC2 Instance ID',
      });
      template.hasOutput('PrivateInstanceId', {
        Description: 'Private EC2 Instance ID',
      });
    });

    test('Outputs Security Group ID', () => {
      template.hasOutput('SecurityGroupId', {
        Description: 'SSH Security Group ID',
      });
    });

    test('Outputs Key Pair information', () => {
      template.hasOutput('KeyPairName', {
        Description: 'EC2 Key Pair Name',
      });
      template.hasOutput('KeyPairId', {
        Description: 'EC2 Key Pair ID',
      });
    });

    test('Outputs Environment Suffix', () => {
      template.hasOutput('EnvironmentSuffix', {
        Description: 'Environment Suffix',
        Value: environmentSuffix,
      });
    });
  });

  describe('Tagging', () => {
    test('All resources have Environment=Development tag', () => {
      // Check VPC
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Development',
          }),
        ]),
      });

      // Check Subnets
      const subnets = template.findResources('AWS::EC2::Subnet');
      Object.values(subnets).forEach((subnet: any) => {
        expect(subnet.Properties.Tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              Key: 'Environment',
              Value: 'Development',
            }),
          ])
        );
      });

      // Check Security Group
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Development',
          }),
        ]),
      });

      // Check EC2 Instances
      const instances = template.findResources('AWS::EC2::Instance');
      Object.values(instances).forEach((instance: any) => {
        expect(instance.Properties.Tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              Key: 'Environment',
              Value: 'Development',
            }),
          ])
        );
      });
    });
  });

  describe('CDK Bootstrap Compatibility', () => {
    test('Stack uses CDK v2', () => {
      template.hasParameter('BootstrapVersion', {
        Type: 'AWS::SSM::Parameter::Value<String>',
        Default: '/cdk-bootstrap/hnb659fds/version',
      });
    });
  });
});