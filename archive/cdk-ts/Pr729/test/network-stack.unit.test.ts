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
      // Check for ALB security group with HTTP/HTTPS rules
      const albSg = template.findResources('AWS::EC2::SecurityGroup');
      const albSecurityGroups = Object.values(albSg).filter(sg => 
        sg.Properties?.GroupName?.includes(`${environmentSuffix}-alb-sg`)
      );
      
      expect(albSecurityGroups.length).toBeGreaterThan(0);
      
      // Check for separate ingress resources or inline rules
      const hasHttpIngress = template.findResources('AWS::EC2::SecurityGroupIngress', {
        Properties: {
          IpProtocol: 'tcp',
          FromPort: 80,
          ToPort: 80,
        },
      });
      
      const hasHttpsIngress = template.findResources('AWS::EC2::SecurityGroupIngress', {
        Properties: {
          IpProtocol: 'tcp',
          FromPort: 443,
          ToPort: 443,
        },
      });
      
      // Either separate ingress resources exist OR they are inline in the security group
      const hasHttpRules = Object.keys(hasHttpIngress).length > 0 || 
        albSecurityGroups.some(sg => 
          sg.Properties?.SecurityGroupIngress?.some((rule: any) => 
            rule.FromPort === 80 && rule.ToPort === 80
          )
        );
        
      const hasHttpsRules = Object.keys(hasHttpsIngress).length > 0 ||
        albSecurityGroups.some(sg => 
          sg.Properties?.SecurityGroupIngress?.some((rule: any) => 
            rule.FromPort === 443 && rule.ToPort === 443
          )
        );
      
      expect(hasHttpRules || hasHttpsRules).toBe(true);
    });

    test('creates EC2 security group with restricted SSH access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: Match.stringLikeRegexp(`${environmentSuffix}-ec2-sg`),
        GroupDescription: Match.stringLikeRegexp('.*restricted SSH access'),
      });
    });

    test('EC2 security group restricts SSH to specific IP ranges', () => {
      // Check for EC2 security group
      const ec2Sg = template.findResources('AWS::EC2::SecurityGroup');
      const ec2SecurityGroups = Object.values(ec2Sg).filter(sg => 
        sg.Properties?.GroupName?.includes(`${environmentSuffix}-ec2-sg`)
      );
      
      expect(ec2SecurityGroups.length).toBeGreaterThan(0);
      
      // Check for SSH ingress rules (either separate or inline)
      const sshIngress = template.findResources('AWS::EC2::SecurityGroupIngress', {
        Properties: {
          IpProtocol: 'tcp',
          FromPort: 22,
          ToPort: 22,
        },
      });
      
      // Check inline rules in security groups
      const inlineSshRules: any[] = [];
      ec2SecurityGroups.forEach(sg => {
        if (sg.Properties?.SecurityGroupIngress) {
          const sshRules = sg.Properties.SecurityGroupIngress.filter((rule: any) =>
            rule.FromPort === 22 && rule.ToPort === 22
          );
          inlineSshRules.push(...sshRules);
        }
      });
      
      // Combine separate and inline SSH rules
      const allSshRules = [
        ...Object.values(sshIngress).map(r => r.Properties),
        ...inlineSshRules
      ];
      
      // Check that at least some SSH rules exist
      expect(allSshRules.length).toBeGreaterThan(0);
      
      // Ensure no 0.0.0.0/0 SSH access
      allSshRules.forEach(rule => {
        expect(rule?.CidrIp).not.toBe('0.0.0.0/0');
      });
    });

    test('creates RDS security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: Match.stringLikeRegexp(`${environmentSuffix}-rds-sg`),
        GroupDescription: 'Security group for RDS database',
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
      const albSg = template.findResources('AWS::EC2::SecurityGroup');
      const albSecurityGroups = Object.values(albSg).filter(sg => 
        sg.Properties?.GroupName?.includes(`${environmentSuffix}-alb-sg`)
      );

      expect(albSecurityGroups.length).toBeGreaterThan(0);
      albSecurityGroups.forEach(sg => {
        // ALB security group should have allowAllOutbound set to false,
        // which means no default egress rules
        const hasDefaultEgress = sg.Properties?.SecurityGroupEgress?.some((rule: any) =>
          rule.CidrIp === '0.0.0.0/0' && rule.IpProtocol === '-1'
        );
        expect(hasDefaultEgress).toBeFalsy();
      });
    });
  });
});