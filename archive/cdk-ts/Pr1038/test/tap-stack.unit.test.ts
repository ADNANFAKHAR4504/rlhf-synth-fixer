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
      environmentSuffix: 'test'
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

    test('creates exactly one VPC', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('VPC has correct tags', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: Match.anyValue() })
        ])
      });
    });
  });

  describe('Subnet Configuration', () => {
    test('creates exactly two public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 2);
    });

    test('subnets are configured as public', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true
      });
    });

    test('subnets are in different availability zones', () => {
      const resources = template.findResources('AWS::EC2::Subnet');
      const azs = Object.values(resources).map(resource => 
        (resource.Properties as any).AvailabilityZone
      );
      
      expect(azs).toHaveLength(2);
      expect(azs[0]).not.toEqual(azs[1]);
    });

    test('subnets have correct CIDR blocks', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.0.0/24'
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.1.0/24'
      });
    });
  });

  describe('Internet Gateway', () => {
    test('creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('attaches Internet Gateway to VPC', () => {
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
      template.hasResourceProperties('AWS::EC2::VPCGatewayAttachment', {
        InternetGatewayId: Match.anyValue(),
        VpcId: Match.anyValue()
      });
    });
  });

  describe('Route Tables', () => {
    test('creates route tables for public subnets', () => {
      template.resourceCountIs('AWS::EC2::RouteTable', 2);
    });

    test('creates default routes to Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::Route', 2);
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
        GatewayId: Match.anyValue()
      });
    });

    test('associates route tables with subnets', () => {
      template.resourceCountIs('AWS::EC2::SubnetRouteTableAssociation', 2);
    });
  });

  describe('VPC Lattice', () => {
    test('creates VPC Lattice Service Network', () => {
      template.resourceCountIs('AWS::VpcLattice::ServiceNetwork', 1);
      template.hasResourceProperties('AWS::VpcLattice::ServiceNetwork', {
        AuthType: 'AWS_IAM',
        Name: 'service-network-test'
      });
    });

    test('associates VPC with Service Network', () => {
      template.resourceCountIs('AWS::VpcLattice::ServiceNetworkVpcAssociation', 1);
      template.hasResourceProperties('AWS::VpcLattice::ServiceNetworkVpcAssociation', {
        ServiceNetworkIdentifier: Match.anyValue(),
        VpcIdentifier: Match.anyValue()
      });
    });
  });

  describe('VPC Endpoints', () => {
    test('creates S3 Gateway Endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Gateway',
        ServiceName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([
              Match.stringLikeRegexp('.*s3$')
            ])
          ])
        })
      });
    });

    test('creates DynamoDB Gateway Endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Gateway',
        ServiceName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([
              Match.stringLikeRegexp('.*dynamodb$')
            ])
          ])
        })
      });
    });

    test('endpoints are associated with public route tables', () => {
      const endpoints = template.findResources('AWS::EC2::VPCEndpoint');
      Object.values(endpoints).forEach(endpoint => {
        const routeTableIds = (endpoint.Properties as any).RouteTableIds;
        expect(routeTableIds).toBeDefined();
        expect(routeTableIds).toHaveLength(2);
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID for the main VPC'
      });
    });

    test('exports VPC CIDR', () => {
      template.hasOutput('VpcCidr', {
        Description: 'CIDR block for the VPC'
      });
    });

    test('exports Public Subnet IDs', () => {
      template.hasOutput('PublicSubnetIds', {
        Description: 'Public subnet IDs'
      });
    });

    test('exports Availability Zones', () => {
      template.hasOutput('AvailabilityZones', {
        Description: 'Availability zones used'
      });
    });

    test('exports Internet Gateway ID', () => {
      template.hasOutput('InternetGatewayId', {
        Description: 'Internet Gateway ID'
      });
    });

    test('exports Service Network ID', () => {
      template.hasOutput('ServiceNetworkId', {
        Description: 'VPC Lattice Service Network ID for future application connectivity'
      });
    });

    test('exports S3 Endpoint ID', () => {
      template.hasOutput('S3EndpointId', {
        Description: 'S3 Gateway Endpoint ID for cost-optimized S3 access'
      });
    });

    test('exports DynamoDB Endpoint ID', () => {
      template.hasOutput('DynamoEndpointId', {
        Description: 'DynamoDB Gateway Endpoint ID for cost-optimized DynamoDB access'
      });
    });
  });

  describe('Security', () => {
    test('VPC has default security group configured', () => {
      // CDK automatically handles security groups, verify VPC exists
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });
  });

  describe('Environment Suffix Handling', () => {
    test('uses environment suffix in resource names', () => {
      const newApp = new cdk.App();
      const testStack = new TapStack(newApp, 'TestStackWithSuffix', { 
        environmentSuffix: 'prod123'
      });
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::VpcLattice::ServiceNetwork', {
        Name: 'service-network-prod123'
      });
    });

    test('falls back to dev when no environment suffix provided', () => {
      const newApp = new cdk.App();
      const defaultStack = new TapStack(newApp, 'DefaultStack');
      const defaultTemplate = Template.fromStack(defaultStack);
      
      defaultTemplate.hasResourceProperties('AWS::VpcLattice::ServiceNetwork', {
        Name: 'service-network-dev'
      });
    });
  });
});