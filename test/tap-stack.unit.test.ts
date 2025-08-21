import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('TapStack CloudFormation YAML Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should define Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should define Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });
  });

  describe('VPC', () => {
    test('should define a VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });
  });

  describe('Subnets', () => {
    test('should define two public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should define two private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });
  });

  describe('Security Groups', () => {
    test('should define ALBSecurityGroup', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should define EC2SecurityGroup', () => {
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
      expect(template.Resources.EC2SecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should define RDSSecurityGroup', () => {
      expect(template.Resources.RDSSecurityGroup).toBeDefined();
      expect(template.Resources.RDSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });
  });

  describe('Load Balancer', () => {
    test('should define an Application Load Balancer', () => {
      expect(template.Resources.ALB).toBeDefined();
      expect(template.Resources.ALB.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('should define a Target Group', () => {
      expect(template.Resources.TargetGroup).toBeDefined();
      expect(template.Resources.TargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('should define a Listener', () => {
      expect(template.Resources.Listener).toBeDefined();
      expect(template.Resources.Listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });
  });

  describe('Auto Scaling', () => {
    test('should define a LaunchTemplate', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('should define an AutoScalingGroup', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });
  });

  describe('RDS', () => {
    test('should define a DBSubnetGroup', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should define a MyDB resource', () => {
      expect(template.Resources.MyDB).toBeDefined();
      expect(template.Resources.MyDB.Type).toBe('AWS::RDS::DBInstance');
    });
  });

  describe('Outputs', () => {
    test('should define ALBDNSName output', () => {
      expect(template.Outputs.ALBDNSName).toBeDefined();
      expect(template.Outputs.ALBDNSName.Value).toBeDefined();
    });

    test('should define VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toBeDefined();
    });

    test('should define PublicSubnet1Id and PublicSubnet2Id outputs', () => {
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
    });

    test('should define PrivateSubnet1Id and PrivateSubnet2Id outputs', () => {
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
    });

    test('should define RDSEndpoint output', () => {
      expect(template.Outputs.RDSEndpoint).toBeDefined();
      expect(template.Outputs.RDSEndpoint.Value).toBeDefined();
    });
  });
});