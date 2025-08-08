import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { NetworkStack } from '../lib/network-stack';

describe('NetworkStack', () => {
  let app: cdk.App;
  let parentStack: cdk.Stack;
  let stack: NetworkStack;
  let template: Template;
  const environmentSuffix = 'testenv';

  beforeEach(() => {
    app = new cdk.App();
    parentStack = new cdk.Stack(app, 'ParentStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });

    stack = new NetworkStack(parentStack, 'TestNetworkStack', {
      environmentSuffix,
    });
    
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 9); // 3 public, 3 private, 3 isolated
      
      // Check for public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('creates NAT gateways for private subnets', () => {
      // Should have NAT gateways for private subnet connectivity
      template.hasResourceProperties('AWS::EC2::NatGateway', Match.anyValue());
    });
  });

  describe('Security Groups', () => {
    test('creates ALB security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: Match.stringLikeRegexp(`${environmentSuffix}-alb-sg`),
        GroupDescription: 'Security group for Application Load Balancer',
      });
    });

    test('ALB security group allows HTTP and HTTPS', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 80,
        ToPort: 80,
        CidrIp: '0.0.0.0/0',
      });

      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 443,
        ToPort: 443,
        CidrIp: '0.0.0.0/0',
      });
    });

    test('creates EC2 security group with restricted SSH access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: Match.stringLikeRegexp(`${environmentSuffix}-ec2-sg`),
        GroupDescription: Match.stringLikeRegexp('.*restricted SSH access'),
      });
    });

    test('EC2 security group restricts SSH to specific IP ranges', () => {
      // Check for private IP ranges only
      const allowedRanges = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];
      
      allowedRanges.forEach(range => {
        template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
          IpProtocol: 'tcp',
          FromPort: 22,
          ToPort: 22,
          CidrIp: range,
        });
      });

      // Ensure no 0.0.0.0/0 SSH access
      const resources = template.findResources('AWS::EC2::SecurityGroupIngress');
      Object.values(resources).forEach(resource => {
        const props = resource.Properties as any;
        if (props?.FromPort === 22 && props?.ToPort === 22) {
          expect(props.CidrIp).not.toBe('0.0.0.0/0');
        }
      });
    });

    test('creates RDS security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: Match.stringLikeRegexp(`${environmentSuffix}-rds-sg`),
        GroupDescription: 'Security group for RDS database',
        SecurityGroupEgress: Match.absent(), // No outbound rules by default
      });
    });

    test('RDS security group allows MySQL from EC2 only', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306,
        SourceSecurityGroupId: Match.anyValue(),
      });
    });
  });

  describe('Network Isolation', () => {
    test('creates isolated subnets for databases', () => {
      // Check for isolated subnets (no NAT gateway)
      const subnets = template.findResources('AWS::EC2::Subnet');
      const isolatedSubnets = Object.entries(subnets).filter(([key]) => 
        key.includes('isolated')
      );
      
      expect(isolatedSubnets.length).toBeGreaterThan(0);
    });

    test('ALB security group restricts outbound traffic', () => {
      const albSg = template.findResources('AWS::EC2::SecurityGroup', {
        Properties: {
          GroupName: Match.stringLikeRegexp(`${environmentSuffix}-alb-sg`),
        },
      });

      Object.values(albSg).forEach(sg => {
        expect(sg.Properties?.SecurityGroupEgress).toBeUndefined();
      });
    });
  });
});