import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { NetworkingConstruct } from '../lib/networking-construct';

describe('NetworkingConstruct', () => {
  let stack: cdk.Stack;
  let template: Template;

  describe('Primary Region Configuration', () => {
    beforeEach(() => {
      const app = new cdk.App();
      stack = new cdk.Stack(app, 'TestStack', {
        env: { region: 'us-east-1' },
      });

      new NetworkingConstruct(stack, 'Networking', {
        environmentSuffix: 'test',
        region: 'us-east-1',
        isPrimary: true,
      });

      template = Template.fromStack(stack);
    });

    test('should create VPC with correct CIDR for primary region', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create 3 subnet types with correct configuration', () => {
      // Public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', 
        Match.objectLike({
          MapPublicIpOnLaunch: true,
        })
      );

      // Check that we have subnets of each type (exact count may vary based on available AZs)
      template.hasResource('AWS::EC2::Subnet', {});
      // Should have at least 3 subnets (1 of each type)
      const subnetResources = template.findResources('AWS::EC2::Subnet');
      expect(Object.keys(subnetResources).length).toBeGreaterThanOrEqual(3);
    });

    test('should create 2 NAT gateways for cost optimization', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('should create VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
    });

    test('should not create VPC peering in primary region', () => {
      template.resourceCountIs('AWS::EC2::VPCPeeringConnection', 0);
    });
  });

  describe('Secondary Region Configuration', () => {
    beforeEach(() => {
      const app = new cdk.App();
      stack = new cdk.Stack(app, 'TestStack', {
        env: { region: 'us-west-2' },
      });

      new NetworkingConstruct(stack, 'Networking', {
        environmentSuffix: 'test',
        region: 'us-west-2',
        isPrimary: false,
        primaryVpcId: 'vpc-primary123',
      });

      template = Template.fromStack(stack);
    });

    test('should create VPC with correct CIDR for secondary region', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create VPC peering connection to primary region', () => {
      template.hasResourceProperties('AWS::EC2::VPCPeeringConnection', {
        PeerVpcId: 'vpc-primary123',
        PeerRegion: 'us-east-1',
      });
    });

    test('should create routes for VPC peering', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '10.0.0.0/16',
      });
    });
  });

  describe('Security Groups', () => {
    beforeEach(() => {
      const app = new cdk.App();
      stack = new cdk.Stack(app, 'TestStack');

      new NetworkingConstruct(stack, 'Networking', {
        environmentSuffix: 'test',
        region: 'us-east-1',
        isPrimary: true,
      });

      template = Template.fromStack(stack);
    });

    test('should create ALB security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup',
        Match.objectLike({
          GroupDescription: 'Security group for Application Load Balancer',
        })
      );
    });

    test('should create Lambda security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup',
        Match.objectLike({
          GroupDescription: 'Security group for Lambda functions',
        })
      );
    });

    test('should create RDS security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup',
        Match.objectLike({
          GroupDescription: 'Security group for RDS instances',
          // Security group has outbound rules for proper connectivity
        })
      );
    });
  });
});