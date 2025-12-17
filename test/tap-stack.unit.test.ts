import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { VpcStack } from '../lib/vpc-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let vpcStack: VpcStack;

  beforeEach(() => {
    app = new cdk.App();
    const environmentSuffix = 'test';
    stack = new TapStack(app, `TapStack${environmentSuffix}`, { 
      environmentSuffix 
    });
    vpcStack = stack.vpcStack;
  });

  describe('Environment Suffix Handling', () => {
    test('should use provided environment suffix from props', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'TapStackCustom', { 
        environmentSuffix: 'custom' 
      });
      const customVpcStack = customStack.vpcStack;
      
      const vpcTemplate = Template.fromStack(customVpcStack);
      vpcTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('vpc-custom')
          })
        ])
      });
    });

    test('should use context environment suffix when no props provided', () => {
      const customApp = new cdk.App({
        context: {
          environmentSuffix: 'fromcontext'
        }
      });
      const customStack = new TapStack(customApp, 'TapStackContext');
      const customVpcStack = customStack.vpcStack;
      
      const vpcTemplate = Template.fromStack(customVpcStack);
      vpcTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('vpc-fromcontext')
          })
        ])
      });
    });

    test('should use default dev suffix when neither props nor context provided', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'TapStackDefault');
      const customVpcStack = customStack.vpcStack;
      
      const vpcTemplate = Template.fromStack(customVpcStack);
      vpcTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('vpc-dev')
          })
        ])
      });
    });
  });

  describe('Main Stack Configuration', () => {
    test('should create TapStack with VpcStack as nested stack', () => {
      expect(stack).toBeDefined();
      expect(vpcStack).toBeDefined();
      expect(vpcStack).toBeInstanceOf(VpcStack);
    });

    test('should pass environment suffix to VpcStack', () => {
      const vpcTemplate = Template.fromStack(vpcStack);
      // Check that resources have the environment suffix
      vpcTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('vpc-test')
          })
        ])
      });
    });
  });

  describe('VPC Stack Resources', () => {
    let vpcTemplate: Template;

    beforeEach(() => {
      vpcTemplate = Template.fromStack(vpcStack);
    });

    test('should create VPC with correct CIDR block', () => {
      vpcTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });

    test('should create public and private subnets', () => {
      // Check for public subnets
      vpcTemplate.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true
      });

      // Check for private subnets
      vpcTemplate.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false
      });

      // Verify we have at least 4 subnets (2 public, 2 private)
      const subnets = vpcTemplate.findResources('AWS::EC2::Subnet');
      expect(Object.keys(subnets).length).toBeGreaterThanOrEqual(4);
    });

    test('should create Internet Gateway', () => {
      vpcTemplate.hasResourceProperties('AWS::EC2::InternetGateway', {});
      vpcTemplate.hasResourceProperties('AWS::EC2::VPCGatewayAttachment', {});
    });

    test('should create NAT Gateway for private subnet internet access', () => {
      vpcTemplate.hasResourceProperties('AWS::EC2::NatGateway', {});
      vpcTemplate.hasResourceProperties('AWS::EC2::EIP', {
        Domain: 'vpc'
      });
    });

    test('should create Security Group with HTTP and HTTPS rules', () => {
      vpcTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0'
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0'
          })
        ])
      });
    });

    test('should create VPC Flow Logs with CloudWatch destination', () => {
      // Check for Flow Log
      vpcTemplate.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
        LogDestinationType: 'cloud-watch-logs'
      });

      // Check for CloudWatch Log Group
      vpcTemplate.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7
      });

      // Check for IAM Role for Flow Logs
      vpcTemplate.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: Match.objectLike({
                Service: 'vpc-flow-logs.amazonaws.com'
              })
            })
          ])
        })
      });
    });

    test('should create CloudWatch Dashboard for monitoring', () => {
      vpcTemplate.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp('vpc-monitoring-')
      });
    });

    test('should create VPC Lattice Service Network', () => {
      vpcTemplate.hasResourceProperties('AWS::VpcLattice::ServiceNetwork', {
        AuthType: 'NONE'
      });

      vpcTemplate.hasResourceProperties('AWS::VpcLattice::ServiceNetworkVpcAssociation', {});
    });

    test('should have production environment tags', () => {
      // Check that the VPC has the expected tags
      const vpc = vpcTemplate.findResources('AWS::EC2::VPC');
      const vpcResource = Object.values(vpc)[0];
      const tags = vpcResource.Properties.Tags;
      
      // Check for production tags
      expect(tags).toContainEqual(
        expect.objectContaining({ Key: 'Environment', Value: 'production' })
      );
      expect(tags).toContainEqual(
        expect.objectContaining({ Key: 'Project', Value: 'VPC-Infrastructure' })
      );
      // ManagedBy:CDK tag may be added by CDK automatically
    });

    test('should create stack outputs', () => {
      vpcTemplate.hasOutput('VpcId', {});
      vpcTemplate.hasOutput('SecurityGroupId', {});
      vpcTemplate.hasOutput('LatticeServiceNetworkId', {});
    });

    test('should set proper removal policies for clean deletion', () => {
      // CloudWatch Log Group should have DESTROY removal policy
      vpcTemplate.hasResource('AWS::Logs::LogGroup', {
        DeletionPolicy: 'Delete'
      });
    });
  });

  describe('Stack Relationships', () => {
    test('should have VpcStack as a child stack', () => {
      // VpcStack is created as a child stack under TapStack
      // The relationship is verified through stack naming and hierarchy
      expect(vpcStack.stackName).toContain('VpcStack');
      expect(vpcStack.node.scope).toBe(stack);
      
      // Verify that the VPC resources are created in the VpcStack
      const vpcTemplate = Template.fromStack(vpcStack);
      vpcTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16'
      });
    });
  });
});
