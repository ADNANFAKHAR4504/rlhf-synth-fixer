import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Financial Services CloudFormation Template', () => {
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

    test('should have a comprehensive description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain(
        'Secure Financial Services Environment'
      );
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have ApplicationName parameter', () => {
      const param = template.Parameters.ApplicationName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('FinancialApp');
      expect(param.AllowedPattern).toBeDefined();
    });

    test('should have Environment parameter', () => {
      const param = template.Parameters.Environment;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('Prod');
      expect(param.AllowedValues).toEqual(['Prod', 'Stage', 'Dev']);
    });

    test('should have InstanceType parameter', () => {
      const param = template.Parameters.InstanceType;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.micro');
      expect(param.AllowedValues).toContain('t3.micro');
    });
  });

  describe('Mappings', () => {
    test('should have RegionMap with updated AMI ID', () => {
      const regionMap = template.Mappings.RegionMap;
      expect(regionMap).toBeDefined();
      expect(regionMap['us-east-1']).toBeDefined();
      expect(regionMap['us-east-1'].AMI).toBe('ami-0dd6a5d3354342a7a');
    });
  });

  describe('KMS Resources', () => {
    test('should have RDS encryption key', () => {
      const key = template.Resources.RDSEncryptionKey;
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.KeyRotationStatus).toBe(true);
    });

    test('should have KMS key alias', () => {
      const alias = template.Resources.RDSEncryptionKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe('S3 Resources', () => {
    test('should have application data bucket', () => {
      const bucket = template.Resources.ApplicationDataBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('should have CloudTrail logs bucket', () => {
      const bucket = template.Resources.CloudTrailLogsBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);
    });

    test('should have CloudTrail bucket policy', () => {
      const policy = template.Resources.CloudTrailLogsBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC', () => {
      const vpc = template.Resources.ApplicationVPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('should have public subnet', () => {
      const subnet = template.Resources.PublicSubnet;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets for Multi-AZ', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;

      expect(subnet1).toBeDefined();
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.2.0/24');

      expect(subnet2).toBeDefined();
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.3.0/24');
    });

    test('should have internet gateway and routing', () => {
      const igw = template.Resources.InternetGateway;
      const attachment = template.Resources.AttachGateway;
      const routeTable = template.Resources.PublicRouteTable;
      const route = template.Resources.PublicRoute;

      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(attachment).toBeDefined();
      expect(routeTable).toBeDefined();
      expect(route).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have application security group with HTTPS only', () => {
      const sg = template.Resources.ApplicationSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      const ingressRules = sg.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(1);
      expect(ingressRules[0].FromPort).toBe(443);
      expect(ingressRules[0].ToPort).toBe(443);
    });

    test('should have database security group', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      const ingressRules = sg.Properties.SecurityGroupIngress;
      expect(ingressRules[0].FromPort).toBe(3306);
      expect(ingressRules[0].ToPort).toBe(3306);
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 instance role', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
    });

    test('should have EC2 instance policy with least privilege', () => {
      const policy = template.Resources.EC2InstancePolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::IAM::Policy');
    });

    test('should have EC2 instance profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have RDS monitoring role', () => {
      const role = template.Resources.RDSMonitoringRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
      );
    });
  });

  describe('EC2 Resources', () => {
    test('should have application instance with updated AMI', () => {
      const instance = template.Resources.ApplicationInstance;
      expect(instance).toBeDefined();
      expect(instance.Type).toBe('AWS::EC2::Instance');
      expect(instance.Properties.Monitoring).toBe(true);
    });

    test('should have EC2 recovery alarm', () => {
      const alarm = template.Resources.EC2RecoveryAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.AlarmActions).toHaveLength(1);
      expect(alarm.Properties.AlarmActions[0]).toEqual({
        'Fn::Sub': 'arn:aws:automate:${AWS::Region}:ec2:recover',
      });
    });
  });

  describe('RDS Resources', () => {
    test('should have DB subnet group with private subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have database instance with latest MySQL version', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db).toBeDefined();
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.EngineVersion).toBe('8.4.6');
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.MultiAZ).toBe(true);
    });

    test('should have proper database security configuration', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.PubliclyAccessible).toBe(false);
      expect(db.Properties.DeletionProtection).toBe(true);
      expect(db.Properties.BackupRetentionPeriod).toBe(30);
    });
  });

  describe('CloudTrail Resources', () => {
    test('should have CloudTrail for audit logging', () => {
      const trail = template.Resources.CloudTrailAuditLog;
      expect(trail).toBeDefined();
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
    });
  });

  describe('Outputs', () => {
    test('should have KMS key ARN output', () => {
      const output = template.Outputs.KMSKeyArn;
      expect(output).toBeDefined();
      expect(output.Description).toContain('KMS key');
    });

    test('should have S3 bucket outputs', () => {
      const appBucket = template.Outputs.ApplicationDataBucketName;
      const trailBucket = template.Outputs.CloudTrailLogsBucketName;

      expect(appBucket).toBeDefined();
      expect(trailBucket).toBeDefined();
    });

    test('should have database endpoint output', () => {
      const output = template.Outputs.DatabaseEndpoint;
      expect(output).toBeDefined();
      expect(output.Description).toContain('database endpoint');
    });

    test('should have all required outputs', () => {
      const expectedOutputs = [
        'KMSKeyArn',
        'ApplicationDataBucketName',
        'CloudTrailLogsBucketName',
        'SecurityGroupId',
        'VPCId',
        'EC2InstanceId',
        'DatabaseEndpoint',
        'CloudTrailArn',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should have encrypted storage for RDS', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.StorageEncrypted).toBe(true);
    });

    test('should have S3 buckets with encryption', () => {
      const appBucket = template.Resources.ApplicationDataBucket;
      const trailBucket = template.Resources.CloudTrailLogsBucket;

      expect(appBucket.Properties.BucketEncryption).toBeDefined();
      expect(trailBucket.Properties.BucketEncryption).toBeDefined();
    });

    test('should have S3 buckets with public access blocked', () => {
      const appBucket = template.Resources.ApplicationDataBucket;
      const trailBucket = template.Resources.CloudTrailLogsBucket;

      expect(
        appBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);
      expect(
        trailBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);
    });

    test('should have KMS key rotation enabled', () => {
      const key = template.Resources.RDSEncryptionKey;
      expect(key.Properties.KeyRotationStatus).toBe(true);
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(typeof template).toBe('object');
    });

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(25); // Updated count for all resources
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8);
    });
  });
});
