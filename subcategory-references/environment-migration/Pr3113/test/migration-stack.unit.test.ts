import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MigrationStack } from '../lib/migration-stack';

import { Match } from 'aws-cdk-lib/assertions';

describe('MigrationStack', () => {
  let app: cdk.App;
  let stack: MigrationStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new MigrationStack(app, 'TestMigrationStack', {});
    template = Template.fromStack(stack);
  });

  test('should create a VPC with the correct properties', () => {
    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '192.168.0.0/16',
    });
  });

  test('should create the correct number of subnets', () => {
    template.resourceCountIs('AWS::EC2::Subnet', 6);
  });

  test('should create public subnets', () => {
    const subnets = template.findResources('AWS::EC2::Subnet', {
      Properties: {
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:subnet-type',
            Value: 'Public',
          },
        ]),
      },
    });
    expect(Object.keys(subnets).length).toBe(2);
  });

  test('should create private application subnets', () => {
    const subnets = template.findResources('AWS::EC2::Subnet', {
      Properties: {
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:subnet-type',
            Value: 'Private',
          },
        ]),
      },
    });
    expect(Object.keys(subnets).length).toBe(2);
  });

  test('should create private database subnets', () => {
    const subnets = template.findResources('AWS::EC2::Subnet', {
      Properties: {
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:subnet-type',
            Value: 'Isolated',
          },
        ]),
      },
    });
    expect(Object.keys(subnets).length).toBe(2);
  });

  test('should create NAT gateways', () => {
    template.resourceCountIs('AWS::EC2::NatGateway', 2);
  });

  test('should create security groups', () => {
    template.resourceCountIs('AWS::EC2::SecurityGroup', 3);
  });

  test('should create the ALB security group with the correct rules', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for the Application Load Balancer',
      VpcId: Match.anyValue(),
      SecurityGroupIngress: [
        {
          CidrIp: '0.0.0.0/0',
          Description: 'Allow HTTP traffic from the internet',
          FromPort: 80,
          IpProtocol: 'tcp',
          ToPort: 80,
        },
      ],
    });
  });

  test('should create the web tier security group with the correct rules', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for the Web Tier EC2 instances',
      VpcId: Match.anyValue(),
      SecurityGroupIngress: [
        {
          Description: 'Allow HTTP traffic from ALB only',
          FromPort: 80,
          IpProtocol: 'tcp',
          SourceSecurityGroupId: Match.anyValue(),
          ToPort: 80,
        },
      ],
    });
  });

  test('should create the bastion host security group with the correct rules', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for the Bastion Host',
      VpcId: Match.anyValue(),
      SecurityGroupIngress: [
        {
          CidrIp: '0.0.0.0/0',
          Description: 'Allow SSH traffic from specified IP',
          FromPort: 22,
          IpProtocol: 'tcp',
          ToPort: 22,
        },
      ],
    });
  });

  test('should create an Auto Scaling Group with the correct properties', () => {
    template.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 1);
    template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
      MinSize: '2',
      MaxSize: '4',
      DesiredCapacity: '2',
    });
  });

  test('should create an Application Load Balancer with the correct properties', () => {
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      Scheme: 'internet-facing',
    });
  });

  test('should create a bastion host with the correct properties', () => {
    template.resourceCountIs('AWS::EC2::Instance', 1);
    template.hasResourceProperties('AWS::EC2::Instance', {
      InstanceType: 't3.nano',
    });
  });

  test('should create the correct outputs', () => {
    template.hasOutput('LoadBalancerDNS', {});
    template.hasOutput('BastionHostIP', {});
  });
});
