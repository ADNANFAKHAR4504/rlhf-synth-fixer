import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { VpcConstruct } from '../../lib/constructs/vpc-construct';

describe('VpcConstruct Unit Tests', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let vpcConstruct: VpcConstruct;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    vpcConstruct = new VpcConstruct(stack, 'TestVpcConstruct', {
      environment: 'test',
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Creation', () => {
    test('should create VPC with correct CIDR block', () => {
      template.hasResource('AWS::EC2::VPC', {
        Properties: {
          CidrBlock: '10.0.0.0/16',
          EnableDnsHostnames: true,
          EnableDnsSupport: true,
        },
      });
    });

    test('should create VPC with correct tags', () => {
      template.hasResource('AWS::EC2::VPC', {
        Properties: {
          Tags: Match.arrayWith([
            {
              Key: 'Name',
              Value: 'VPC-test',
            },
          ]),
        },
      });
    });
  });

  describe('Subnet Configuration', () => {
    test('should create public subnets', () => {
      template.hasResource('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: true,
        },
      });
    });

    test('should create private subnets', () => {
      template.hasResource('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: false,
        },
      });
    });

    test('should create subnets with correct CIDR ranges', () => {
      template.hasResource('AWS::EC2::Subnet', {
        Properties: {
          CidrBlock: Match.stringLikeRegexp('10\\.0\\.[0-9]+\\.0/24'),
        },
      });
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('should create NAT Gateways', () => {
      template.hasResource('AWS::EC2::NatGateway', {});
    });

    test('should create Elastic IPs for NAT Gateways', () => {
      template.hasResource('AWS::EC2::EIP', {
        Properties: {
          Domain: 'vpc',
        },
      });
    });

    test('should create NAT Gateway routes', () => {
      template.hasResource('AWS::EC2::Route', {
        Properties: {
          DestinationCidrBlock: '0.0.0.0/0',
          NatGatewayId: Match.anyValue(),
        },
      });
    });
  });

  describe('Network ACL Configuration', () => {
    test('should create Network ACLs', () => {
      template.hasResource('AWS::EC2::NetworkAcl', {});
    });

    test('should create Network ACL entries', () => {
      template.hasResource('AWS::EC2::NetworkAclEntry', {
        Properties: {
          RuleAction: 'allow',
        },
      });
    });

    test('should create HTTPS outbound rule', () => {
      template.hasResource('AWS::EC2::NetworkAclEntry', {
        Properties: {
          PortRange: {
            From: 443,
            To: 443,
          },
          Protocol: 6, // TCP
          RuleAction: 'allow',
          Egress: true,
        },
      });
    });

    test('should create HTTP outbound rule', () => {
      template.hasResource('AWS::EC2::NetworkAclEntry', {
        Properties: {
          PortRange: {
            From: 80,
            To: 80,
          },
          Protocol: 6, // TCP
          RuleAction: 'allow',
          Egress: true,
        },
      });
    });
  });

  describe('Internet Gateway Configuration', () => {
    test('should create Internet Gateway', () => {
      template.hasResource('AWS::EC2::InternetGateway', {});
    });

    test('should attach Internet Gateway to VPC', () => {
      template.hasResource('AWS::EC2::VPCGatewayAttachment', {
        Properties: {
          VpcId: Match.anyValue(),
          InternetGatewayId: Match.anyValue(),
        },
      });
    });
  });

  describe('Route Table Configuration', () => {
    test('should create route tables', () => {
      template.hasResource('AWS::EC2::RouteTable', {});
    });

    test('should create public route table with internet gateway route', () => {
      template.hasResource('AWS::EC2::Route', {
        Properties: {
          DestinationCidrBlock: '0.0.0.0/0',
          GatewayId: Match.anyValue(),
        },
      });
    });
  });

  describe('VPC Properties', () => {
    test('should expose VPC property', () => {
      expect(vpcConstruct.vpc).toBeDefined();
      expect(vpcConstruct.vpc.vpcId).toBeDefined();
    });

    test('should have correct VPC configuration', () => {
      expect(vpcConstruct.vpc.isolatedSubnets.length).toBe(0);
      expect(vpcConstruct.vpc.privateSubnets.length).toBeGreaterThan(0);
      expect(vpcConstruct.vpc.publicSubnets.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Counts', () => {
    test('should create expected number of resources', () => {
      // Should have at least one VPC
      template.hasResource('AWS::EC2::VPC', {});

      // Should have subnets
      template.hasResource('AWS::EC2::Subnet', {});

      // Should have NAT gateways
      template.hasResource('AWS::EC2::NatGateway', {});
    });
  });
});
