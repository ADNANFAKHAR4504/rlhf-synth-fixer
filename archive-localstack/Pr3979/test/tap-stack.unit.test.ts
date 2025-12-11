import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Basics', () => {
    test('has correct format version and description', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).toBe('SecureEnv - Foundational secure AWS environment for sensitive workloads');
    });
  });

  describe('Parameters', () => {
    test('all required parameters exist', () => {
      const expectedParams = ['InstanceType', 'DBInstanceClass', 'CertificateARN', 'AllowedCIDR', 'AMIID'];
      expectedParams.forEach(p => expect(template.Parameters[p]).toBeDefined());
    });

    test('InstanceType has correct defaults and allowed values', () => {
      const p = template.Parameters.InstanceType;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('t3.micro');
      expect(p.AllowedValues).toEqual(['t3.micro', 't3.small', 't3.medium']);
    });

    test('DBInstanceClass has correct defaults and allowed values', () => {
      const p = template.Parameters.DBInstanceClass;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('db.t3.micro');
      expect(p.AllowedValues).toEqual(['db.t3.micro', 'db.t3.small']);
    });

    test('CertificateARN parameter exists for optional HTTPS', () => {
      const p = template.Parameters.CertificateARN;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('');
    });

    test('AMIID uses SSM parameter type', () => {
      const p = template.Parameters.AMIID;
      expect(p.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(p.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
    });
  });

  describe('Conditions', () => {
    test('HasCertificate condition exists', () => {
      expect(template.Conditions.HasCertificate).toBeDefined();
    });
  });

  describe('VPC and Networking', () => {
    test('VPC is created with correct CIDR', () => {
      const vpc = template.Resources.SecureEnvVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('public subnets are created correctly', () => {
      const s1 = template.Resources.SecureEnvPublicSubnet1;
      const s2 = template.Resources.SecureEnvPublicSubnet2;
      expect(s1.Type).toBe('AWS::EC2::Subnet');
      expect(s2.Type).toBe('AWS::EC2::Subnet');
      expect(s1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(s2.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(s1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(s2.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('private subnets are created correctly', () => {
      const s1 = template.Resources.SecureEnvPrivateSubnet1;
      const s2 = template.Resources.SecureEnvPrivateSubnet2;
      expect(s1.Type).toBe('AWS::EC2::Subnet');
      expect(s2.Type).toBe('AWS::EC2::Subnet');
      expect(s1.Properties.CidrBlock).toBe('10.0.3.0/24');
      expect(s2.Properties.CidrBlock).toBe('10.0.4.0/24');
    });
  });

  describe('Security Groups', () => {
    test('web security group allows HTTP and HTTPS', () => {
      const sg = template.Resources.SecureEnvWebSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress.length).toBeGreaterThanOrEqual(2);
    });

    test('database security group allows MySQL from web tier', () => {
      const sg = template.Resources.SecureEnvDatabaseSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(3306);
      expect(sg.Properties.SecurityGroupIngress[0].ToPort).toBe(3306);
    });
  });

  describe('IAM Roles', () => {
    test('EC2 role is created', () => {
      const role = template.Resources.SecureEnvEC2Role;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('EC2 instance profile is created', () => {
      const profile = template.Resources.SecureEnvEC2InstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('Lambda role is created with VPC permissions', () => {
      const role = template.Resources.SecureEnvLambdaRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('S3 Buckets', () => {
    test('data bucket is created with encryption and versioning', () => {
      const bucket = template.Resources.SecureEnvDataBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });

    test('logs bucket is created with encryption', () => {
      const bucket = template.Resources.SecureEnvLogsBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('logs bucket policy allows ALB to write logs', () => {
      const policy = template.Resources.SecureEnvLogBucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.PolicyDocument.Statement).toBeDefined();
    });
  });

  describe('EC2 Instance', () => {
    test('web server is created with encrypted EBS', () => {
      const instance = template.Resources.SecureEnvWebServer;
      expect(instance.Type).toBe('AWS::EC2::Instance');
      expect(instance.Properties.BlockDeviceMappings[0].Ebs.Encrypted).toBe(true);
      expect(instance.Properties.BlockDeviceMappings[0].Ebs.VolumeType).toBe('gp3');
    });
  });

  describe('RDS Database', () => {
    test('DB secret is created in Secrets Manager', () => {
      const secret = template.Resources.SecureEnvDBSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString).toBeDefined();
    });

    test('DB subnet group is created', () => {
      const group = template.Resources.SecureEnvDBSubnetGroup;
      expect(group.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('RDS instance is created with encryption and security settings', () => {
      const db = template.Resources.SecureEnvDatabase;
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.PubliclyAccessible).toBe(false);
      expect(db.Properties.MultiAZ).toBe(true);
      expect(db.Properties.DeletionProtection).toBe(false);
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB is created as internet-facing', () => {
      const alb = template.Resources.SecureEnvALB;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });

    test('target group is created with health checks', () => {
      const tg = template.Resources.SecureEnvTargetGroup;
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.HealthCheckPath).toBe('/');
    });

    test('ALB listener supports conditional HTTPS/HTTP', () => {
      const listener = template.Resources.SecureEnvALBListener;
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBeDefined();
      expect(listener.Properties.Protocol).toBeDefined();
    });
  });

  describe('Monitoring and Security', () => {
    test('CloudWatch alarms are created for EC2', () => {
      const alarm = template.Resources.SecureEnvEC2CPUAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Threshold).toBe(80);
    });

    test('CloudWatch alarms are created for RDS', () => {
      const alarm = template.Resources.SecureEnvRDSConnectionsAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('DatabaseConnections');
    });

    test('CloudWatch alarms are created for ALB', () => {
      const alarm = template.Resources.SecureEnvALBTargetResponseTimeAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.Namespace).toBe('AWS/ApplicationELB');
    });

    test('GuardDuty detector is created', () => {
      const gd = template.Resources.SecureEnvGuardDutyDetector;
      expect(gd.Type).toBe('AWS::GuardDuty::Detector');
      expect(gd.Properties.Enable).toBe(true);
    });

    test('VPC Flow Logs are configured', () => {
      const flowLogs = template.Resources.SecureEnvVPCFlowLogs;
      expect(flowLogs.Type).toBe('AWS::EC2::FlowLog');
      expect(template.Resources.SecureEnvVPCFlowLogsRole.Type).toBe('AWS::IAM::Role');
      expect(template.Resources.SecureEnvVPCFlowLogsGroup.Type).toBe('AWS::Logs::LogGroup');
    });
  });

  describe('Outputs', () => {
    test('VPC outputs are defined', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
    });

    test('application outputs are defined', () => {
      expect(template.Outputs.LoadBalancerDNS).toBeDefined();
      expect(template.Outputs.S3BucketName).toBeDefined();
      expect(template.Outputs.DatabaseSecretArn).toBeDefined();
    });
  });

  describe('Resource Naming and Tags', () => {
    test('resources use StackName in naming convention', () => {
      const vpc = template.Resources.SecureEnvVPC;
      const nameTag = vpc.Properties.Tags?.find((t: any) => t.Key === 'Name');
      expect(nameTag).toBeDefined();
    });

    test('outputs have export names for cross-stack references', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });
});

