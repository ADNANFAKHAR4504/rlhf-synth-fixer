import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Secure Web App CloudFormation Template', () => {
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

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Secure, highly available, and scalable web application infrastructure'
      );
    });
  });

  describe('Parameters', () => {
    test('should have DBUsername parameter', () => {
      expect(template.Parameters.DBUsername).toBeDefined();
      const param = template.Parameters.DBUsername;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('webappuser');
      expect(param.Description).toBe('Master username for RDS PostgreSQL database');
    });

    test('should have SSHAccessCIDR parameter', () => {
      expect(template.Parameters.SSHAccessCIDR).toBeDefined();
      const param = template.Parameters.SSHAccessCIDR;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('0.0.0.0/0');
    });
  });

  describe('Mappings', () => {
    test('should have AWSRegionAMI mapping', () => {
      expect(template.Mappings.AWSRegionAMI).toBeDefined();
      expect(template.Mappings.AWSRegionAMI['us-east-1']).toBeDefined();
      expect(template.Mappings.AWSRegionAMI['us-west-2']).toBeDefined();
      expect(template.Mappings.AWSRegionAMI['eu-west-1']).toBeDefined();
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC with correct CIDR', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have public subnets with correct CIDRs', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;
      
      expect(publicSubnet1).toBeDefined();
      expect(publicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      
      expect(publicSubnet2).toBeDefined();
      expect(publicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets with correct CIDRs', () => {
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;
      
      expect(privateSubnet1).toBeDefined();
      expect(privateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet1.Properties.CidrBlock).toBe('10.0.10.0/24');
      
      expect(privateSubnet2).toBeDefined();
      expect(privateSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet2.Properties.CidrBlock).toBe('10.0.11.0/24');
    });

    test('should have NAT Gateways with EIPs', () => {
      const natGw1 = template.Resources.NatGateway1;
      const natGw2 = template.Resources.NatGateway2;
      const eip1 = template.Resources.NatGateway1EIP;
      const eip2 = template.Resources.NatGateway2EIP;
      
      expect(natGw1).toBeDefined();
      expect(natGw1.Type).toBe('AWS::EC2::NatGateway');
      expect(natGw2).toBeDefined();
      expect(natGw2.Type).toBe('AWS::EC2::NatGateway');
      expect(eip1).toBeDefined();
      expect(eip1.Type).toBe('AWS::EC2::EIP');
      expect(eip2).toBeDefined();
      expect(eip2.Type).toBe('AWS::EC2::EIP');
    });
  });

  describe('Security Groups', () => {
    test('should have ALB Security Group with HTTP/HTTPS access', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingressRules = sg.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(2);
      
      const httpRule = ingressRules.find((rule: any) => rule.FromPort === 80);
      const httpsRule = ingressRules.find((rule: any) => rule.FromPort === 443);
      
      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have Web Server Security Group with restricted access', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingressRules = sg.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(2);
      
      const httpRule = ingressRules.find((rule: any) => rule.FromPort === 80);
      const sshRule = ingressRules.find((rule: any) => rule.FromPort === 22);
      
      expect(httpRule).toBeDefined();
      expect(httpRule.SourceSecurityGroupId).toBeDefined();
      expect(sshRule).toBeDefined();
    });

    test('should have Database Security Group with PostgreSQL access', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingressRules = sg.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(1);
      expect(ingressRules[0].FromPort).toBe(5432);
      expect(ingressRules[0].ToPort).toBe(5432);
    });
  });

  describe('Database Resources', () => {
    test('should have Secrets Manager secret for database password', () => {
      const secret = template.Resources.DatabasePasswordSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString).toBeDefined();
    });

    test('should have RDS PostgreSQL instance with Multi-AZ', () => {
      const db = template.Resources.Database;
      expect(db).toBeDefined();
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.Properties.Engine).toBe('postgres');
      expect(db.Properties.MultiAZ).toBe(true);
      expect(db.Properties.PubliclyAccessible).toBe(false);
      expect(db.Properties.StorageEncrypted).toBe(true);
    });

    test('should have database subnet group', () => {
      const subnetGroup = template.Resources.DatabaseSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });
  });

  describe('Auto Scaling Resources', () => {
    test('should have Launch Template with t3.micro instances', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateData.InstanceType).toBe('t3.micro');
    });

    test('should have Auto Scaling Group with correct configuration', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.DesiredCapacity).toBe(2);
      expect(asg.Properties.MaxSize).toBe(6);
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have Application Load Balancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });

    test('should have Target Group for HTTP traffic', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
    });

    test('should have ALB Listener', () => {
      const listener = template.Resources.ALBListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 IAM Role with least privilege', () => {
      const role = template.Resources.EC2Role;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });

    test('should have EC2 Instance Profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
    });
  });

  describe('Outputs', () => {
    test('should have VPC ID output', () => {
      const output = template.Outputs.VPCId;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('should have Load Balancer URL output', () => {
      const output = template.Outputs.LoadBalancerURL;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({
        'Fn::Sub': 'http://${ApplicationLoadBalancer.DNSName}'
      });
    });

    test('should have Database Endpoint output', () => {
      const output = template.Outputs.DatabaseEndpoint;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['Database', 'Endpoint.Address']
      });
    });

    test('should have Database Port output', () => {
      const output = template.Outputs.DatabasePort;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['Database', 'Endpoint.Port']
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have expected number of resources for 3-tier architecture', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(15); // VPC, subnets, gateways, ALB, ASG, RDS, etc.
    });

    test('should have correct parameter count', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });

    test('should have correct output count', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(4);
    });
  });

  describe('Security Best Practices', () => {
    test('database should not be publicly accessible', () => {
      const db = template.Resources.Database;
      expect(db.Properties.PubliclyAccessible).toBe(false);
    });

    test('database should be encrypted at rest', () => {
      const db = template.Resources.Database;
      expect(db.Properties.StorageEncrypted).toBe(true);
    });

    test('database should have backup retention', () => {
      const db = template.Resources.Database;
      expect(db.Properties.BackupRetentionPeriod).toBeGreaterThan(0);
    });

    test('should use secrets manager for database password', () => {
      const db = template.Resources.Database;
      expect(db.Properties.MasterUserPassword).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${DatabasePasswordSecret}::password}}'
      });
    });
  });
});
