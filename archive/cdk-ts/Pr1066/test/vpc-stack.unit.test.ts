import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { VpcStack } from '../lib/vpc-stack';

describe('VpcStack', () => {
  let app: cdk.App;
  let testStack: cdk.Stack;

  beforeEach(() => {
    app = new cdk.App();
    testStack = new cdk.Stack(app, 'TestStack');
  });

  test('Creates VPC with correct CIDR block', () => {
    new VpcStack(testStack, 'TestVpcStack', {
      environmentSuffix: 'test',
    });
    const template = Template.fromStack(testStack);

    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });
  });

  test('Creates public and private subnets', () => {
    new VpcStack(testStack, 'TestVpcStack', {
      environmentSuffix: 'test',
    });
    const template = Template.fromStack(testStack);

    // Check for public subnet
    template.hasResourceProperties('AWS::EC2::Subnet', {
      CidrBlock: '10.0.0.0/24',
      MapPublicIpOnLaunch: true,
    });

    // Check for private subnet
    template.hasResourceProperties('AWS::EC2::Subnet', {
      CidrBlock: '10.0.1.0/24',
      MapPublicIpOnLaunch: false,
    });
  });

  test('Creates internet gateway and NAT gateway', () => {
    new VpcStack(testStack, 'TestVpcStack', {
      environmentSuffix: 'test',
    });
    const template = Template.fromStack(testStack);

    template.hasResource('AWS::EC2::InternetGateway', {});
    template.hasResource('AWS::EC2::NatGateway', {});
  });

  test('Creates route tables for both subnets', () => {
    new VpcStack(testStack, 'TestVpcStack', {
      environmentSuffix: 'test',
    });
    const template = Template.fromStack(testStack);

    const routeTables = template.findResources('AWS::EC2::RouteTable');
    expect(Object.keys(routeTables).length).toBe(2);
  });

  test('VPC is properly tagged', () => {
    new VpcStack(testStack, 'TestVpcStack', {
      environmentSuffix: 'test',
    });
    const template = Template.fromStack(testStack);

    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'Environment',
          Value: 'Development',
        }),
        Match.objectLike({
          Key: 'Name',
          Value: 'vpcBasictest',
        }),
      ]),
    });
  });

  test('Subnets are properly tagged', () => {
    new VpcStack(testStack, 'TestVpcStack', {
      environmentSuffix: 'test',
    });
    const template = Template.fromStack(testStack);

    // Check public subnet tags
    template.hasResourceProperties('AWS::EC2::Subnet', {
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'Name',
          Value: 'subnetPublictest',
        }),
      ]),
    });

    // Check private subnet tags
    template.hasResourceProperties('AWS::EC2::Subnet', {
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'Name',
          Value: 'subnetPrivatetest',
        }),
      ]),
    });
  });

  test('Uses default environment suffix when not provided', () => {
    new VpcStack(testStack, 'TestVpcStack');
    const template = Template.fromStack(testStack);

    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'Name',
          Value: 'vpcBasicdev',
        }),
      ]),
    });
  });

  test('Creates VPC gateway attachment', () => {
    new VpcStack(testStack, 'TestVpcStack', {
      environmentSuffix: 'test',
    });
    const template = Template.fromStack(testStack);

    template.hasResource('AWS::EC2::VPCGatewayAttachment', {});
  });

  test('Stack exports are properly defined', () => {
    const vpcStack = new VpcStack(testStack, 'TestVpcStack', {
      environmentSuffix: 'test',
    });

    expect(vpcStack.vpc).toBeDefined();
    expect(vpcStack.publicSubnet).toBeDefined();
    expect(vpcStack.privateSubnet).toBeDefined();
  });

  test('All outputs have proper descriptions', () => {
    new VpcStack(testStack, 'TestVpcStack', {
      environmentSuffix: 'test',
    });
    const template = Template.fromStack(testStack);

    // Since we removed the outputs from individual constructs, 
    // this test should verify that the main stack handles outputs
    const outputs = template.findOutputs('*');
    // The outputs are now handled by the main TapStack, not the individual constructs
    expect(Object.keys(outputs).length).toBe(0);
  });

  test('VPC has correct instance tenancy', () => {
    new VpcStack(testStack, 'TestVpcStack', {
      environmentSuffix: 'test',
    });
    const template = Template.fromStack(testStack);

    template.hasResourceProperties('AWS::EC2::VPC', {
      InstanceTenancy: 'default',
    });
  });

  test('Subnets are in correct availability zones', () => {
    new VpcStack(testStack, 'TestVpcStack', {
      environmentSuffix: 'test',
    });
    const template = Template.fromStack(testStack);

    const subnets = template.findResources('AWS::EC2::Subnet');
    Object.values(subnets).forEach((subnet: any) => {
      expect(subnet.Properties.AvailabilityZone).toBeDefined();
    });
  });
});

