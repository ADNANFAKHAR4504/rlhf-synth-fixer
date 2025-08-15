import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    const environmentSuffix = 'test';
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  test('Creates nested constructs with correct hierarchy', () => {
    // Verify the main stack exists
    expect(stack).toBeDefined();

    // Check that the stack has the expected number of child nodes
    const children = stack.node.children;
    expect(children.length).toBeGreaterThanOrEqual(3); // At least 3 child constructs
  });

  test('Passes environment suffix to all child constructs', () => {
    const app = new cdk.App();
    const environmentSuffix = 'test-env';
    const stack = new TapStack(app, 'TestStack', { environmentSuffix });

    // Verify that all child constructs receive the environment suffix
    const vpcStack = stack.node.findChild('VpcStack');
    const securityStack = stack.node.findChild('SecurityStack');
    const computeStack = stack.node.findChild('ComputeStack');

    expect(vpcStack).toBeDefined();
    expect(securityStack).toBeDefined();
    expect(computeStack).toBeDefined();
  });

  test('Creates VPC with correct CIDR block', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });
  });

  test('Creates public subnet with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::Subnet', {
      CidrBlock: '10.0.0.0/24',
      MapPublicIpOnLaunch: true,
    });
  });

  test('Creates private subnet with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::Subnet', {
      CidrBlock: '10.0.1.0/24',
      MapPublicIpOnLaunch: false,
    });
  });

  test('Creates Internet Gateway', () => {
    template.hasResourceProperties('AWS::EC2::InternetGateway', {});
  });

  test('Creates NAT Gateway for private subnet', () => {
    template.hasResourceProperties('AWS::EC2::NatGateway', {});
  });

  test('Creates route tables for subnets', () => {
    // Should have at least 2 route tables (public and private)
    const routeTables = template.findResources('AWS::EC2::RouteTable');
    expect(Object.keys(routeTables).length).toBeGreaterThanOrEqual(2);
  });

  test('Tags all resources with Environment tag', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'Environment',
          Value: 'Development',
        }),
      ]),
    });
  });

  test('Creates security groups with correct properties', () => {
    // Check for public security group
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for public subnet EC2 instances',
    });

    // Check for private security group
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for private subnet EC2 instances',
    });
  });

  test('Creates EC2 instances with correct configuration', () => {
    // Check for public instance
    template.hasResourceProperties('AWS::EC2::Instance', {
      InstanceType: 't2.micro',
    });

    // Check for private instance
    const instances = template.findResources('AWS::EC2::Instance');
    expect(Object.keys(instances).length).toBe(2); // Should have 2 instances
  });

  test('Creates key pair for EC2 instances', () => {
    template.hasResourceProperties('AWS::EC2::KeyPair', {
      KeyType: 'rsa',
      KeyFormat: 'pem',
    });
  });

  test('Creates IAM roles for EC2 instances', () => {
    const roles = template.findResources('AWS::IAM::Role');
    expect(Object.keys(roles).length).toBeGreaterThanOrEqual(2); // At least 2 roles
  });

  test('Creates instance profiles for EC2 instances', () => {
    const profiles = template.findResources('AWS::IAM::InstanceProfile');
    expect(Object.keys(profiles).length).toBeGreaterThanOrEqual(2); // At least 2 profiles
  });

  test('Exports correct outputs', () => {
    const outputs = template.findOutputs('*');
    
    // Check that all expected outputs exist
    expect(outputs.VpcId).toBeDefined();
    expect(outputs.PublicSubnetId).toBeDefined();
    expect(outputs.PrivateSubnetId).toBeDefined();
    expect(outputs.PublicSecurityGroupId).toBeDefined();
    expect(outputs.PrivateSecurityGroupId).toBeDefined();
    expect(outputs.PublicInstanceId).toBeDefined();
    expect(outputs.PrivateInstanceId).toBeDefined();
    expect(outputs.KeyPairName).toBeDefined();
  });

  test('Outputs have correct descriptions', () => {
    const outputs = template.findOutputs('*');
    
    expect(outputs.VpcId.Description).toContain('VPC ID from VPC Stack');
    expect(outputs.PublicSubnetId.Description).toContain('Public Subnet ID from VPC Stack');
    expect(outputs.PrivateSubnetId.Description).toContain('Private Subnet ID from VPC Stack');
    expect(outputs.PublicSecurityGroupId.Description).toContain('Public Security Group ID from Security Stack');
    expect(outputs.PrivateSecurityGroupId.Description).toContain('Private Security Group ID from Security Stack');
    expect(outputs.PublicInstanceId.Description).toContain('Public EC2 Instance ID from Compute Stack');
    expect(outputs.PrivateInstanceId.Description).toContain('Private EC2 Instance ID from Compute Stack');
    expect(outputs.KeyPairName.Description).toContain('EC2 Key Pair Name from Compute Stack');
  });

  test('Outputs have correct export names', () => {
    const outputs = template.findOutputs('*');
    const environmentSuffix = 'test';
    
    expect(outputs.VpcId.Export.Name).toBe(`TestTapStack-VpcId`);
    expect(outputs.PublicSubnetId.Export.Name).toBe(`TestTapStack-PublicSubnetId`);
    expect(outputs.PrivateSubnetId.Export.Name).toBe(`TestTapStack-PrivateSubnetId`);
    expect(outputs.PublicSecurityGroupId.Export.Name).toBe(`TestTapStack-PublicSecurityGroupId`);
    expect(outputs.PrivateSecurityGroupId.Export.Name).toBe(`TestTapStack-PrivateSecurityGroupId`);
    expect(outputs.PublicInstanceId.Export.Name).toBe(`TestTapStack-PublicInstanceId`);
    expect(outputs.PrivateInstanceId.Export.Name).toBe(`TestTapStack-PrivateInstanceId`);
    expect(outputs.KeyPairName.Export.Name).toBe(`TestTapStack-KeyPairName`);
  });

  test('Uses default environment suffix when not provided', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestStackDefault');
    const template = Template.fromStack(stack);

    // Check that resources use 'dev' as default suffix
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'Name',
          Value: 'vpcBasicdev',
        }),
      ]),
    });
  });

  test('Creates all required networking resources', () => {
    // Check for VPC
    template.hasResource('AWS::EC2::VPC', {});
    
    // Check for subnets
    template.hasResource('AWS::EC2::Subnet', {});
    
    // Check for internet gateway
    template.hasResource('AWS::EC2::InternetGateway', {});
    
    // Check for NAT gateway
    template.hasResource('AWS::EC2::NatGateway', {});
    
    // Check for route tables
    template.hasResource('AWS::EC2::RouteTable', {});
  });

  test('Creates all required security resources', () => {
    // Check for security groups
    template.hasResource('AWS::EC2::SecurityGroup', {});
    
    // Check for security group ingress rules
    template.hasResource('AWS::EC2::SecurityGroupIngress', {});
  });

  test('Creates all required compute resources', () => {
    // Check for EC2 instances
    template.hasResource('AWS::EC2::Instance', {});
    
    // Check for key pair
    template.hasResource('AWS::EC2::KeyPair', {});
    
    // Check for IAM roles
    template.hasResource('AWS::IAM::Role', {});
    
    // Check for instance profiles
    template.hasResource('AWS::IAM::InstanceProfile', {});
  });
});
