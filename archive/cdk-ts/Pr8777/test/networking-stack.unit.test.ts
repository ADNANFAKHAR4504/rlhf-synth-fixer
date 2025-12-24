import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { NetworkingConstruct } from '../lib/networking-stack';

describe('NetworkingConstruct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let networkingConstruct: NetworkingConstruct;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');

    networkingConstruct = new NetworkingConstruct(stack, 'Networking', {
      environmentSuffix: 'test',
      commonTags: {
        Environment: 'test',
        ProjectName: 'test-project',
        CostCenter: 'test-center'
      }
    });

    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });

    test('creates public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', 
        Match.objectLike({
          MapPublicIpOnLaunch: true
        })
      );
    });

    test('creates private subnets with egress', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const privateSubnets = Object.values(subnets).filter((subnet: any) => 
        !subnet.Properties?.MapPublicIpOnLaunch
      );
      expect(privateSubnets.length).toBeGreaterThan(0);
    });

    test('creates isolated subnets', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const isolatedSubnets = Object.entries(subnets).filter(([key]) => 
        key.includes('isolated')
      );
      expect(isolatedSubnets.length).toBeGreaterThan(0);
    });
  });

  describe('NAT Gateway', () => {
    test('creates NAT gateway for private subnet egress', () => {
      template.hasResource('AWS::EC2::NatGateway', {});
    });

    test('creates Elastic IP for NAT gateway', () => {
      template.hasResourceProperties('AWS::EC2::EIP', {
        Domain: 'vpc'
      });
    });
  });

  describe('VPC Endpoints', () => {
    test('creates S3 gateway endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', 
        Match.objectLike({
          ServiceName: Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                Match.stringLikeRegexp('.*s3.*')
              ])
            ])
          }),
          VpcEndpointType: 'Gateway'
        })
      );
    });

    test('creates DynamoDB gateway endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', 
        Match.objectLike({
          ServiceName: Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                Match.stringLikeRegexp('.*dynamodb.*')
              ])
            ])
          }),
          VpcEndpointType: 'Gateway'
        })
      );
    });

    test('creates Secrets Manager interface endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', 
        Match.objectLike({
          ServiceName: Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                Match.stringLikeRegexp('.*secretsmanager.*')
              ])
            ])
          }),
          VpcEndpointType: 'Interface'
        })
      );
    });

    test('creates SSM interface endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', 
        Match.objectLike({
          ServiceName: Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                Match.stringLikeRegexp('.*ssm.*')
              ])
            ])
          }),
          VpcEndpointType: 'Interface'
        })
      );
    });
  });

  describe('Flow Logs', () => {
    test('enables VPC flow logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', 
        Match.objectLike({
          ResourceType: 'VPC',
          TrafficType: 'ALL'
        })
      );
    });

    test('creates CloudWatch log group for flow logs', () => {
      template.hasResource('AWS::Logs::LogGroup', {});
    });
  });

  describe('Internet Gateway', () => {
    test('creates internet gateway', () => {
      template.hasResource('AWS::EC2::InternetGateway', {});
    });

    test('attaches internet gateway to VPC', () => {
      template.hasResource('AWS::EC2::VPCGatewayAttachment', {});
    });
  });

  describe('Route Tables', () => {
    test('creates route tables for subnets', () => {
      template.hasResource('AWS::EC2::RouteTable', {});
    });

    test('creates routes for public subnets to IGW', () => {
      template.hasResourceProperties('AWS::EC2::Route', 
        Match.objectLike({
          DestinationCidrBlock: '0.0.0.0/0',
          GatewayId: Match.anyValue()
        })
      );
    });
  });

  describe('Tags', () => {
    test('applies common tags to VPC', () => {
      const vpc = template.findResources('AWS::EC2::VPC');
      const vpcResource = Object.values(vpc)[0] as any;
      const tags = vpcResource?.Properties?.Tags || [];
      
      // Check that the tags array contains our expected tags
      const hasEnvironmentTag = tags.some((tag: any) => tag.Key === 'Environment' && tag.Value === 'test');
      const hasProjectNameTag = tags.some((tag: any) => tag.Key === 'ProjectName' && tag.Value === 'test-project');
      const hasCostCenterTag = tags.some((tag: any) => tag.Key === 'CostCenter' && tag.Value === 'test-center');
      
      expect(hasEnvironmentTag).toBe(true);
      expect(hasProjectNameTag).toBe(true);
      expect(hasCostCenterTag).toBe(true);
    });
  });
});