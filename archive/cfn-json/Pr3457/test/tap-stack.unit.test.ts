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

    test('should create RDS security group with restricted access', () => {
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].ToPort).toBe(3306);
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'EC2SecurityGroup' });
      expect(ingress[0].Description).toBe('Allow MySQL from EC2 instances only');
    });

    test('should create ALB security group with proper ingress rules', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      
      const httpRule = ingress.find((rule: any) => rule.FromPort === 80);
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpRule.Description).toBe('Allow HTTP from anywhere');
      
      const httpsRule = ingress.find((rule: any) => rule.FromPort === 443);
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.Description).toBe('Allow HTTPS from anywhere');
    });

    test('should create EC2 security group with proper egress rules', () => {
      const sg = template.Resources.EC2SecurityGroup;
      const egress = sg.Properties.SecurityGroupEgress;
      
      expect(egress).toHaveLength(1);
      expect(egress[0].FromPort).toBe(443);
      expect(egress[0].ToPort).toBe(443);
      expect(egress[0].CidrIp).toBe('0.0.0.0/0');
      expect(egress[0].Description).toBe('Allow HTTPS for updates');
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

    test('should create auto scaling group with proper configuration', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe('2');
      expect(asg.Properties.DesiredCapacity).toBe('4');
      expect(asg.Properties.MaxSize).toBe('10');
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
      expect(asg.Properties.VPCZoneIdentifier).toEqual([{ Ref: 'PrivateSubnet1' }]);
    });

    test('should configure launch template with proper instance settings', () => {
      const lt = template.Resources.LaunchTemplate;
      const data = lt.Properties.LaunchTemplateData;
      
      expect(data.InstanceType).toBe('t3.medium');
      expect(data.Monitoring.Enabled).toBe(true);
      expect(data.SecurityGroupIds).toEqual([{ Ref: 'EC2SecurityGroup' }]);
      expect(data.IamInstanceProfile.Arn).toEqual({ 'Fn::GetAtt': ['EC2InstanceProfile', 'Arn'] });
    });
  });

  describe('Load Balancer', () => {
    test('should create application load balancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('should create target group with proper health check configuration', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.TargetType).toBe('instance');
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/health');
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
    });

    test('should configure target group with sticky sessions', () => {
      const tg = template.Resources.ALBTargetGroup;
      const attributes = tg.Properties.TargetGroupAttributes;
      
      const stickinessEnabled = attributes.find((attr: any) => attr.Key === 'stickiness.enabled');
      expect(stickinessEnabled.Value).toBe('true');
      
      const stickinessDuration = attributes.find((attr: any) => attr.Key === 'stickiness.lb_cookie.duration_seconds');
      expect(stickinessDuration.Value).toBe('86400');
    });
  });

  describe('RDS Database', () => {
    test('should create RDS instance with proper configuration', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.EngineVersion).toBe('8.0.43');
      expect(rds.Properties.DBInstanceClass).toBe('db.t3.medium');
      expect(rds.Properties.MultiAZ).toBe(true);
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.AllocatedStorage).toBe('100');
      expect(rds.Properties.StorageType).toBe('gp3');
      expect(rds.Properties.MaxAllocatedStorage).toBe(500);
      expect(rds.Properties.PubliclyAccessible).toBe(false);
    });

    test('should configure RDS backup and maintenance settings', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
      expect(rds.Properties.PreferredBackupWindow).toBe('03:00-04:00');
      expect(rds.Properties.PreferredMaintenanceWindow).toBe('sun:04:00-sun:05:00');
      expect(rds.Properties.EnableCloudwatchLogsExports).toEqual(['error', 'general', 'slowquery']);
    });

    test('should create DB subnet group', () => {
      const sg = template.Resources.DBSubnetGroup;
      expect(sg.Type).toBe('AWS::RDS::DBSubnetGroup');
    });
  });


});