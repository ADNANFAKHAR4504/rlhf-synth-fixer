import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { VpcStack } from '../lib/vpc-stack';

describe('VpcStack', () => {
  describe('Environment Suffix Handling', () => {
    test('should use provided environment suffix', () => {
      const app = new cdk.App();
      const stack = new VpcStack(app, 'TestVpcStack', { 
        environmentSuffix: 'custom' 
      });
      
      const template = Template.fromStack(stack);
      
      // Check VPC name includes suffix
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: 'vpc-custom'
          })
        ])
      });
      
      // Check security group name includes suffix
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'web-sg-custom'
      });
      
      // VPC Lattice removed for LocalStack compatibility
      // VPC Lattice is not supported in LocalStack Community Edition
    });

    test('should use default dev suffix when not provided', () => {
      const app = new cdk.App();
      const stack = new VpcStack(app, 'TestVpcStackDefault');
      
      const template = Template.fromStack(stack);
      
      // Check VPC name includes default suffix
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: 'vpc-dev'
          })
        ])
      });
      
      // Check security group name includes default suffix
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'web-sg-dev'
      });
      
      // VPC Lattice removed for LocalStack compatibility
      // VPC Lattice is not supported in LocalStack Community Edition
    });
  });

  describe('VPC Configuration', () => {
    let app: cdk.App;
    let stack: VpcStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new VpcStack(app, 'TestVpcStack', { 
        environmentSuffix: 'test' 
      });
      template = Template.fromStack(stack);
    });

    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });

    test('should create correct subnet configuration', () => {
      // Check for public subnets only (LocalStack compatibility)
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true
      });

      // Verify subnet count - only public subnets (2 AZs)
      const subnets = template.findResources('AWS::EC2::Subnet');
      expect(Object.keys(subnets).length).toBe(2);
    });

    test('should not create NAT Gateway for LocalStack compatibility', () => {
      // NAT Gateway requires EIP which is not fully supported in LocalStack Community
      const natGateways = template.findResources('AWS::EC2::NatGateway');
      expect(Object.keys(natGateways).length).toBe(0);

      const eips = template.findResources('AWS::EC2::EIP');
      expect(Object.keys(eips).length).toBe(0);
    });

    test('should create Internet Gateway', () => {
      template.hasResourceProperties('AWS::EC2::InternetGateway', {});
      template.hasResourceProperties('AWS::EC2::VPCGatewayAttachment', {});
    });

    test('should create Security Group with correct rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'web-sg-test',
        GroupDescription: 'Security Group for web traffic',
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

    test('should create VPC Flow Logs with proper configuration', () => {
      // Check Flow Log
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
        LogDestinationType: 'cloud-watch-logs'
      });

      // Check CloudWatch Log Group
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/vpc/flowlogs/test',
        RetentionInDays: 7
      });

      // Check IAM Role for Flow Logs
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'vpc-flow-log-role-test',
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

    test('should not create VPC Lattice for LocalStack compatibility', () => {
      // VPC Lattice is not supported in LocalStack Community Edition
      const latticeNetworks = template.findResources('AWS::VpcLattice::ServiceNetwork');
      expect(Object.keys(latticeNetworks).length).toBe(0);

      const latticeAssociations = template.findResources('AWS::VpcLattice::ServiceNetworkVpcAssociation');
      expect(Object.keys(latticeAssociations).length).toBe(0);
    });

    test('should create CloudWatch Dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'vpc-monitoring-test'
      });
    });

    test('should apply correct tags', () => {
      const vpc = template.findResources('AWS::EC2::VPC');
      const vpcResource = Object.values(vpc)[0];
      const tags = vpcResource.Properties.Tags;
      
      expect(tags).toContainEqual(
        expect.objectContaining({ Key: 'Environment', Value: 'production' })
      );
      expect(tags).toContainEqual(
        expect.objectContaining({ Key: 'Project', Value: 'VPC-Infrastructure' })
      );
    });

    test('should create stack outputs', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
        Export: {
          Name: 'VpcId-test'
        }
      });

      template.hasOutput('SecurityGroupId', {
        Description: 'Web Security Group ID',
        Export: {
          Name: 'WebSecurityGroupId-test'
        }
      });

      // VPC Lattice output removed for LocalStack compatibility
    });

    test('should set proper removal policies', () => {
      // CloudWatch Log Group should have DESTROY removal policy
      template.hasResource('AWS::Logs::LogGroup', {
        DeletionPolicy: 'Delete'
      });
    });
  });

  describe('Stack Properties', () => {
    test('should expose VPC and Security Group as public properties', () => {
      const app = new cdk.App();
      const stack = new VpcStack(app, 'TestVpcStack', {
        environmentSuffix: 'test'
      });

      expect(stack.vpc).toBeDefined();
      expect(stack.securityGroup).toBeDefined();
      // VPC Lattice removed for LocalStack compatibility
    });
  });
});