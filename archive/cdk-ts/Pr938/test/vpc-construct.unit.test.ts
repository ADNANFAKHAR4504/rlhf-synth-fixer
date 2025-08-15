import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { VpcConstruct } from '../lib/constructs/vpc-construct';

describe('VpcConstruct', () => {
  let stack: cdk.Stack;
  let vpcConstruct: VpcConstruct;
  let template: Template;

  describe('Basic VPC creation', () => {
    beforeEach(() => {
      const app = new cdk.App();
      stack = new cdk.Stack(app, 'TestStack');
      vpcConstruct = new VpcConstruct(stack, 'TestVpc', {
        environmentSuffix: 'test',
        vpcCidr: '10.0.0.0/16',
        maxAzs: 2,
        enableLogging: true,
      });
      template = Template.fromStack(stack);
    });

    test('Creates VPC with correct properties', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        InstanceTenancy: 'default',
      });
    });

    test('VPC has correct number of availability zones', () => {
      // 2 AZs * 3 subnet types = 6 subnets
      template.resourceCountIs('AWS::EC2::Subnet', 6);
    });

    test('Creates public subnets with correct properties', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-name',
            Value: Match.stringLikeRegexp('Public-'),
          }),
        ]),
      });
    });

    test('Creates private subnets with NAT', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-name',
            Value: Match.stringLikeRegexp('Private-'),
          }),
        ]),
      });
    });

    test('Creates isolated subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-name',
            Value: Match.stringLikeRegexp('Isolated-'),
          }),
        ]),
      });
    });

    test('Creates Internet Gateway and attaches to VPC', () => {
      template.hasResource('AWS::EC2::InternetGateway', {});
      template.hasResource('AWS::EC2::VPCGatewayAttachment', {});
    });

    test('Creates NAT Gateway with Elastic IP', () => {
      template.hasResource('AWS::EC2::NatGateway', {});
      template.hasResource('AWS::EC2::EIP', {});
    });

    test('Exposes VPC as public property', () => {
      expect(vpcConstruct.vpc).toBeDefined();
      expect(vpcConstruct.vpc.vpcId).toBeDefined();
    });
  });

  describe('VPC Flow Logs', () => {
    test('Creates flow logs when logging is enabled', () => {
      const app = new cdk.App();
      const testStack = new cdk.Stack(app, 'TestStack');
      new VpcConstruct(testStack, 'TestVpc', {
        environmentSuffix: 'test',
        vpcCidr: '10.0.0.0/16',
        maxAzs: 2,
        enableLogging: true,
      });
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResource('AWS::EC2::FlowLog', {});
      testTemplate.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp('/aws/vpc/flowlogs/'),
      });
    });

    test('Does not create flow logs when logging is disabled', () => {
      const app = new cdk.App();
      const testStack = new cdk.Stack(app, 'TestStack');
      new VpcConstruct(testStack, 'TestVpc', {
        environmentSuffix: 'test',
        vpcCidr: '10.0.0.0/16',
        maxAzs: 2,
        enableLogging: false,
      });
      const testTemplate = Template.fromStack(testStack);

      expect(() => {
        testTemplate.hasResource('AWS::EC2::FlowLog', {});
      }).toThrow();
    });

    test('Flow log retention varies by environment', () => {
      const app = new cdk.App();
      const prodStack = new cdk.Stack(app, 'ProdStack');
      new VpcConstruct(prodStack, 'ProdVpc', {
        environmentSuffix: 'prod',
        vpcCidr: '10.0.0.0/16',
        maxAzs: 3,
        enableLogging: true,
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 90,
      });
    });
  });

  describe('Subnet configuration', () => {
    test('Subnet CIDR blocks are calculated correctly', () => {
      const app = new cdk.App();
      const testStack = new cdk.Stack(app, 'TestStack');
      new VpcConstruct(testStack, 'TestVpc', {
        environmentSuffix: 'test',
        vpcCidr: '10.0.0.0/16',
        maxAzs: 2,
        enableLogging: false,
      });
      const testTemplate = Template.fromStack(testStack);

      // Check public subnets have /24 CIDR
      testTemplate.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: Match.stringLikeRegexp('10\\.0\\.[0-9]+\\.0/24'),
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-type',
            Value: 'Public',
          }),
        ]),
      });

      // Check private subnets have /24 CIDR
      testTemplate.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: Match.stringLikeRegexp('10\\.0\\.[0-9]+\\.0/24'),
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-type',
            Value: 'Private',
          }),
        ]),
      });

      // Check isolated subnets have /28 CIDR
      testTemplate.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: Match.stringLikeRegexp('10\\.0\\.[0-9]+\\.[0-9]+/28'),
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-type',
            Value: 'Isolated',
          }),
        ]),
      });
    });
  });

  describe('Route tables and routes', () => {
    test('Creates route tables for each subnet', () => {
      const app = new cdk.App();
      const testStack = new cdk.Stack(app, 'TestStack');
      new VpcConstruct(testStack, 'TestVpc', {
        environmentSuffix: 'test',
        vpcCidr: '10.0.0.0/16',
        maxAzs: 2,
        enableLogging: false,
      });
      const testTemplate = Template.fromStack(testStack);

      // 3 subnet types * 2 AZs = 6 route tables
      testTemplate.resourceCountIs('AWS::EC2::RouteTable', 6);
    });

    test('Public subnets have internet route', () => {
      const app = new cdk.App();
      const testStack = new cdk.Stack(app, 'TestStack');
      new VpcConstruct(testStack, 'TestVpc', {
        environmentSuffix: 'test',
        vpcCidr: '10.0.0.0/16',
        maxAzs: 2,
        enableLogging: false,
      });
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
        GatewayId: Match.objectLike({
          Ref: Match.stringLikeRegexp('VpcIGW'),
        }),
      });
    });

    test('Private subnets have NAT route', () => {
      const app = new cdk.App();
      const testStack = new cdk.Stack(app, 'TestStack');
      new VpcConstruct(testStack, 'TestVpc', {
        environmentSuffix: 'test',
        vpcCidr: '10.0.0.0/16',
        maxAzs: 2,
        enableLogging: false,
      });
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
        NatGatewayId: Match.objectLike({
          Ref: Match.stringLikeRegexp('NATGateway'),
        }),
      });
    });
  });
});