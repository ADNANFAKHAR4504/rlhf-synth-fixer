import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have meaningful description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('highly available web application');
    });

    test('should have required sections', () => {
      expect(template).toHaveProperty('Parameters');
      expect(template).toHaveProperty('Resources');
      expect(template).toHaveProperty('Outputs');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentName parameter', () => {
      const param = template.Parameters.EnvironmentName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.AllowedValues).toContain('dev');
      expect(param.AllowedValues).toContain('staging');
      expect(param.AllowedValues).toContain('prod');
    });

    test('should have required parameters for deployment', () => {
      expect(template.Parameters.KeyPairName).toBeDefined();
      expect(template.Parameters.DatabaseUsername).toBeDefined();
      // CertificateArn and DatabasePassword removed - using Secrets Manager
    });

    test('should have database secret in resources', () => {
      expect(template.Resources.DBPasswordSecret).toBeDefined();
      expect(template.Resources.DBPasswordSecret.Type).toBe('AWS::SecretsManager::Secret');
    });
  });

  describe('VPC Infrastructure', () => {
    test('should create VPC with proper configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('should create public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();

      const subnet1 = template.Resources.PublicSubnet1;
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should create private subnet', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();

      const subnet1 = template.Resources.PrivateSubnet1;
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should use dynamic availability zones', () => {
      const subnet = template.Resources.PublicSubnet1;
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress.some((rule: any) => rule.FromPort === 80)).toBe(true);
      expect(ingress.some((rule: any) => rule.FromPort === 443)).toBe(true);
    });

    test('should create EC2 security group with restricted access', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    });

    test('should create RDS security group', () => {
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress[0].FromPort).toBe(3306);
    });
  });

  describe('Auto Scaling Configuration', () => {
    test('should create launch template', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');

      const data = lt.Properties.LaunchTemplateData;
      expect(data.InstanceType).toBe('t3.medium');
      expect(data.Monitoring.Enabled).toBe(true);
    });

    test('should encrypt EBS volumes', () => {
      const lt = template.Resources.LaunchTemplate;
      const devices = lt.Properties.LaunchTemplateData.BlockDeviceMappings;

      devices.forEach((device: any) => {
        expect(device.Ebs.Encrypted).toBe(true);
      });
    });

    test('should create auto scaling group', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe('2');
      expect(asg.Properties.MaxSize).toBe('10');
    });
  });

  describe('Load Balancer', () => {
    test('should create application load balancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('should create target group', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.HealthCheckPath).toBe('/health');
    });
  });

  describe('RDS Database', () => {
    test('should create RDS instance', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.MultiAZ).toBe(true);
      expect(rds.Properties.StorageEncrypted).toBe(true);
    });

    test('should create DB subnet group', () => {
      const sg = template.Resources.DBSubnetGroup;
      expect(sg.Type).toBe('AWS::RDS::DBSubnetGroup');
    });
  });

  describe('Outputs', () => {
    test('should export VPC ID', () => {
      const output = template.Outputs.VPCId;
      expect(output).toBeDefined();
      expect(output.Export).toBeDefined();
    });

    test('should have outputs section defined', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Template Validation', () => {
    test('should be valid JSON', () => {
      expect(typeof template).toBe('object');
      expect(template).not.toBeNull();
    });

    test('should have reasonable resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(25);
    });

    test('resource names should be descriptive', () => {
      const resourceNames = Object.keys(template.Resources);

      expect(resourceNames).toContain('VPC');
      expect(resourceNames).toContain('InternetGateway');
      expect(resourceNames).toContain('ApplicationLoadBalancer');
      expect(resourceNames).toContain('AutoScalingGroup');
      expect(resourceNames).toContain('RDSDatabase');
    });
  });
});