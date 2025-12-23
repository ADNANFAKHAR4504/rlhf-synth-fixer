import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { NetworkingConstruct } from '../lib/networking-construct';

describe('NetworkingConstruct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let networking: NetworkingConstruct;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    networking = new NetworkingConstruct(stack, 'TestNetworking', {
      environmentSuffix: 'test',
    });
    template = Template.fromStack(stack);
  });

  test('Construct is created successfully', () => {
    expect(networking).toBeDefined();
    expect(networking.vpc).toBeDefined();
  });

  test('VPC is created with correct name', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        { Key: 'Name', Value: 'cicd-vpc-test' },
      ]),
    });
  });

  test('VPC has DNS enabled', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });
  });

  test('VPC has 2 availability zones', () => {
    // Should have 2 public subnets (one per AZ)
    template.resourceCountIs('AWS::EC2::Subnet', 2);
  });

  test('VPC has no NAT Gateways for cost optimization', () => {
    template.resourceCountIs('AWS::EC2::NatGateway', 0);
  });

  test('Public subnets are created', () => {
    template.hasResourceProperties('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: true,
    });
  });

  test('Internet Gateway is created', () => {
    template.resourceCountIs('AWS::EC2::InternetGateway', 1);
  });

  test('S3 Gateway Endpoint is created', () => {
    template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
      VpcEndpointType: 'Gateway',
      ServiceName: {
        'Fn::Join': [
          '',
          ['com.amazonaws.', { Ref: 'AWS::Region' }, '.s3'],
        ],
      },
    });
  });

  test('ECR Docker Interface Endpoint is created', () => {
    const endpoints = template.findResources('AWS::EC2::VPCEndpoint', {
      Properties: {
        VpcEndpointType: 'Interface',
      },
    });
    // Check that we have interface endpoints
    expect(Object.keys(endpoints).length).toBeGreaterThanOrEqual(1);
  });

  test('ECR API Interface Endpoint is created', () => {
    const endpoints = template.findResources('AWS::EC2::VPCEndpoint', {
      Properties: {
        VpcEndpointType: 'Interface',
      },
    });
    // Check that we have interface endpoints
    expect(Object.keys(endpoints).length).toBeGreaterThanOrEqual(2);
  });

  test('CloudWatch Logs Interface Endpoint is created', () => {
    const endpoints = template.findResources('AWS::EC2::VPCEndpoint', {
      Properties: {
        VpcEndpointType: 'Interface',
      },
    });
    // Check that we have all 3 interface endpoints
    expect(Object.keys(endpoints).length).toBe(3);
  });

  test('Total of 4 VPC Endpoints are created', () => {
    template.resourceCountIs('AWS::EC2::VPCEndpoint', 4);
  });

  test('Environment tag is applied to VPC', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        { Key: 'Environment', Value: 'test' },
      ]),
    });
  });

  test('Route tables are created for public subnets', () => {
    template.resourceCountIs('AWS::EC2::RouteTable', 2);
  });

  test('Routes to Internet Gateway are created', () => {
    template.hasResourceProperties('AWS::EC2::Route', {
      DestinationCidrBlock: '0.0.0.0/0',
    });
  });

  test('VPC CIDR block is 10.0.0.0/16', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
    });
  });
});
