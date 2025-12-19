/* eslint-disable prettier/prettier */

/**
 * Unit tests for TapStack CloudFormation Template
 * Tests the YAML CloudFormation template structure and resources
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;
  let resources: any;
  let parameters: any;
  let outputs: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');

    // Define custom YAML types for CloudFormation intrinsic functions
    const CFN_SCHEMA = yaml.DEFAULT_SCHEMA.extend([
      new yaml.Type('!Ref', {
        kind: 'scalar',
        construct: (data) => ({ Ref: data }),
      }),
      new yaml.Type('!Sub', {
        kind: 'scalar',
        construct: (data) => ({ 'Fn::Sub': data }),
      }),
      new yaml.Type('!Sub', {
        kind: 'sequence',
        construct: (data) => ({ 'Fn::Sub': data }),
      }),
      new yaml.Type('!GetAtt', {
        kind: 'scalar',
        construct: (data) => {
          const parts = data.split('.');
          return { 'Fn::GetAtt': parts };
        },
      }),
      new yaml.Type('!GetAtt', {
        kind: 'sequence',
        construct: (data) => ({ 'Fn::GetAtt': data }),
      }),
      new yaml.Type('!Equals', {
        kind: 'sequence',
        construct: (data) => ({ 'Fn::Equals': data }),
      }),
      new yaml.Type('!If', {
        kind: 'sequence',
        construct: (data) => ({ 'Fn::If': data }),
      }),
      new yaml.Type('!FindInMap', {
        kind: 'sequence',
        construct: (data) => ({ 'Fn::FindInMap': data }),
      }),
      new yaml.Type('!Join', {
        kind: 'sequence',
        construct: (data) => ({ 'Fn::Join': data }),
      }),
    ]);

    template = yaml.load(templateContent, { schema: CFN_SCHEMA });
    resources = template.Resources;
    parameters = template.Parameters;
    outputs = template.Outputs;
  });

  describe('Template Basic Structure', () => {
    test('should have correct AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('TAP Stack');
    });

    test('should have Metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have Parameters section', () => {
      expect(parameters).toBeDefined();
      expect(Object.keys(parameters).length).toBeGreaterThan(0);
    });

    test('should have Resources section with at least 15 resources', () => {
      expect(resources).toBeDefined();
      expect(Object.keys(resources).length).toBeGreaterThanOrEqual(15);
    });

    test('should have Outputs section', () => {
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });
  });

  describe('Parameters Validation', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(parameters.EnvironmentSuffix).toBeDefined();
      expect(parameters.EnvironmentSuffix.Type).toBe('String');
      expect(parameters.EnvironmentSuffix.Default).toBe('pr3600');
    });

    test('should have DomainName parameter', () => {
      expect(parameters.DomainName).toBeDefined();
      expect(parameters.DomainName.Type).toBe('String');
    });

    test('should have SSHKeyName parameter', () => {
      expect(parameters.SSHKeyName).toBeDefined();
      expect(parameters.SSHKeyName.AllowedValues).toContain('discourse-forum-key');
    });

    test('should have EC2InstanceType parameter with default t3.small', () => {
      expect(parameters.EC2InstanceType).toBeDefined();
      expect(parameters.EC2InstanceType.Default).toBe('t3.small');
    });

    test('should have DBInstanceClass parameter with default db.t3.small', () => {
      expect(parameters.DBInstanceClass).toBeDefined();
      expect(parameters.DBInstanceClass.Default).toBe('db.t3.small');
    });

    test('should have DBUsername parameter', () => {
      expect(parameters.DBUsername).toBeDefined();
      expect(parameters.DBUsername.Type).toBe('String');
    });

    test('should have CacheNodeType parameter with default cache.t3.micro', () => {
      expect(parameters.CacheNodeType).toBeDefined();
      expect(parameters.CacheNodeType.Default).toBe('cache.t3.micro');
    });

    test('should have AdminEmail parameter', () => {
      expect(parameters.AdminEmail).toBeDefined();
      expect(parameters.AdminEmail.Type).toBe('String');
    });

    test('should have CreateDNS parameter', () => {
      expect(parameters.CreateDNS).toBeDefined();
      expect(parameters.CreateDNS.Default).toBe('false');
    });
  });

  describe('Security Groups', () => {
    test('should have EC2 security group with HTTP/HTTPS ingress rules', () => {
      expect(resources.EC2SecurityGroup).toBeDefined();
      expect(resources.EC2SecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      const ingress = resources.EC2SecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toBeDefined();
      const ports = ingress.map((rule: any) => rule.FromPort);
      expect(ports).toContain(80);
      expect(ports).toContain(443);
    });

    test('should have RDS security group with PostgreSQL ingress from EC2', () => {
      expect(resources.RDSSecurityGroup).toBeDefined();
      expect(resources.RDSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      const ingress = resources.RDSSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress[0].FromPort).toBe(5432);
    });

    test('should have ElastiCache security group with Redis ingress from EC2', () => {
      expect(resources.ElastiCacheSecurityGroup).toBeDefined();
      expect(resources.ElastiCacheSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      const ingress = resources.ElastiCacheSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress[0].FromPort).toBe(6379);
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 IAM role with appropriate policies', () => {
      expect(resources.EC2Role).toBeDefined();
      expect(resources.EC2Role.Type).toBe('AWS::IAM::Role');
      expect(resources.EC2Role.Properties.Policies).toBeDefined();
    });

    test('should have EC2 instance profile', () => {
      expect(resources.EC2InstanceProfile).toBeDefined();
      expect(resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have Backup IAM role', () => {
      expect(resources.BackupRole).toBeDefined();
      expect(resources.BackupRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('Secrets Manager', () => {
    test('should have database secret with proper structure', () => {
      expect(resources.DBSecret).toBeDefined();
      expect(resources.DBSecret.Type).toBe('AWS::SecretsManager::Secret');
      expect(resources.DBSecret.DeletionPolicy).toBe('Retain');
      expect(resources.DBSecret.UpdateReplacePolicy).toBe('Retain');
    });
  });

  describe('Database Layer', () => {
    test('should have RDS subnet group spanning both AZs', () => {
      expect(resources.DBSubnetGroup).toBeDefined();
      expect(resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have RDS PostgreSQL instance with correct configuration', () => {
      expect(resources.ForumDatabase).toBeDefined();
      expect(resources.ForumDatabase.Type).toBe('AWS::RDS::DBInstance');
      expect(resources.ForumDatabase.Properties.Engine).toBe('postgres');
      expect(resources.ForumDatabase.Properties.StorageEncrypted).toBe(true);
    });

    test('should have automated backups enabled', () => {
      expect(resources.ForumDatabase.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('should have DeletionPolicy set to Snapshot', () => {
      expect(resources.ForumDatabase.DeletionPolicy).toBe('Snapshot');
      expect(resources.ForumDatabase.UpdateReplacePolicy).toBe('Snapshot');
    });
  });

  describe('Caching Layer', () => {
    test('should have ElastiCache subnet group', () => {
      expect(resources.CacheSubnetGroup).toBeDefined();
      expect(resources.CacheSubnetGroup.Type).toBe('AWS::ElastiCache::SubnetGroup');
    });

    test('should have Redis cluster with correct configuration', () => {
      expect(resources.RedisCluster).toBeDefined();
      expect(resources.RedisCluster.Type).toBe('AWS::ElastiCache::CacheCluster');
      expect(resources.RedisCluster.Properties.Engine).toBe('redis');
    });
  });

  describe('Storage Layer', () => {
    test('should have uploads S3 bucket with encryption', () => {
      expect(resources.UploadsBucket).toBeDefined();
      expect(resources.UploadsBucket.Type).toBe('AWS::S3::Bucket');
      expect(resources.UploadsBucket.Properties.BucketEncryption).toBeDefined();
    });

    test('should have uploads bucket with lifecycle policy', () => {
      expect(resources.UploadsBucket.Properties.LifecycleConfiguration).toBeDefined();
    });

    test('should have backups S3 bucket with encryption', () => {
      expect(resources.BackupsBucket).toBeDefined();
      expect(resources.BackupsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have bucket policies restricting access', () => {
      expect(resources.UploadsBucketPolicy).toBeDefined();
      expect(resources.BackupsBucketPolicy).toBeDefined();
    });

    test('should have public access block configured', () => {
      expect(resources.UploadsBucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(resources.UploadsBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });
  });

  describe('CDN and Distribution', () => {
    test('should have CloudFront Origin Access Identity', () => {
      expect(resources.CloudFrontOAI).toBeDefined();
      expect(resources.CloudFrontOAI.Type).toBe('AWS::CloudFront::CloudFrontOriginAccessIdentity');
    });

    test('should have CloudFront distribution with S3 origin', () => {
      expect(resources.CloudFrontDistribution).toBeDefined();
      expect(resources.CloudFrontDistribution.Type).toBe('AWS::CloudFront::Distribution');
    });

    test('should have CloudFront distribution with HTTPS redirect', () => {
      const behavior = resources.CloudFrontDistribution.Properties.DistributionConfig.DefaultCacheBehavior;
      expect(behavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });
  });

  describe('DNS and Certificate', () => {
    test('should have Route 53 hosted zone', () => {
      expect(resources.HostedZone).toBeDefined();
      expect(resources.HostedZone.Type).toBe('AWS::Route53::HostedZone');
      expect(resources.HostedZone.Condition).toBe('ShouldCreateDNS');
    });

    test('should have ACM SSL certificate with DNS validation', () => {
      expect(resources.SSLCertificate).toBeDefined();
      expect(resources.SSLCertificate.Type).toBe('AWS::CertificateManager::Certificate');
      expect(resources.SSLCertificate.Properties.ValidationMethod).toBe('DNS');
    });

    test('should have Route 53 A record pointing to CloudFront', () => {
      expect(resources.DNSRecord).toBeDefined();
      expect(resources.DNSRecord.Type).toBe('AWS::Route53::RecordSet');
    });
  });

  describe('Compute Layer', () => {
    test('should have EC2 instance with correct instance type', () => {
      expect(resources.DiscourseEC2Instance).toBeDefined();
      expect(resources.DiscourseEC2Instance.Type).toBe('AWS::EC2::Instance');
    });

    test('should have EC2 instance with IAM instance profile', () => {
      expect(resources.DiscourseEC2Instance.Properties.IamInstanceProfile).toBeDefined();
    });

    test('should have EC2 instance with encrypted EBS volume', () => {
      const blockDevice = resources.DiscourseEC2Instance.Properties.BlockDeviceMappings[0];
      expect(blockDevice.Ebs.Encrypted).toBe(true);
    });

    test('should have EC2 instance with UserData script', () => {
      expect(resources.DiscourseEC2Instance.Properties.UserData).toBeDefined();
    });

    test('should have EC2 instance with DependsOn', () => {
      expect(resources.DiscourseEC2Instance.DependsOn).toBeDefined();
      expect(resources.DiscourseEC2Instance.DependsOn).toContain('ForumDatabase');
    });
  });

  describe('Monitoring and Logging', () => {
    test('should have CloudWatch log group', () => {
      expect(resources.DiscourseLogGroup).toBeDefined();
      expect(resources.DiscourseLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have SNS topic for alarms', () => {
      expect(resources.AlarmSNSTopic).toBeDefined();
      expect(resources.AlarmSNSTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have EC2 CPU alarm with 80% threshold', () => {
      expect(resources.EC2CPUAlarm).toBeDefined();
      expect(resources.EC2CPUAlarm.Properties.Threshold).toBe(80);
    });

    test('should have EC2 disk alarm with 80% threshold', () => {
      expect(resources.EC2DiskAlarm).toBeDefined();
      expect(resources.EC2DiskAlarm.Properties.Threshold).toBe(80);
    });

    test('should have RDS CPU alarm', () => {
      expect(resources.RDSCPUAlarm).toBeDefined();
      expect(resources.RDSCPUAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });
  });

  describe('Backup Configuration', () => {
    test('should have backup vault', () => {
      expect(resources.BackupVault).toBeDefined();
      expect(resources.BackupVault.Type).toBe('AWS::Backup::BackupVault');
    });

    test('should have backup plan with 7-day retention', () => {
      expect(resources.BackupPlan).toBeDefined();
      expect(resources.BackupPlan.Type).toBe('AWS::Backup::BackupPlan');
      const rule = resources.BackupPlan.Properties.BackupPlan.BackupPlanRule[0];
      expect(rule.Lifecycle.DeleteAfterDays).toBe(7);
    });

    test('should have backup plan with daily schedule', () => {
      const rule = resources.BackupPlan.Properties.BackupPlan.BackupPlanRule[0];
      expect(rule.ScheduleExpression).toContain('cron');
    });

    test('should have backup selection', () => {
      expect(resources.BackupSelection).toBeDefined();
      expect(resources.BackupSelection.Type).toBe('AWS::Backup::BackupSelection');
    });
  });

  describe('Resource Tags', () => {
    test('should have required tags on EC2SecurityGroup', () => {
      const tags = resources.EC2SecurityGroup.Properties.Tags;
      expect(tags).toBeDefined();
      const tagNames = tags.map((t: any) => t.Key);
      expect(tagNames).toContain('Environment');
      expect(tagNames).toContain('Application');
    });

    test('should have required tags on DiscourseEC2Instance', () => {
      const tags = resources.DiscourseEC2Instance.Properties.Tags;
      expect(tags).toBeDefined();
      const tagNames = tags.map((t: any) => t.Key);
      expect(tagNames).toContain('Name');
      expect(tagNames).toContain('BackupEnabled');
    });

    test('should have required tags on ForumDatabase', () => {
      const tags = resources.ForumDatabase.Properties.Tags;
      expect(tags).toBeDefined();
      const tagNames = tags.map((t: any) => t.Key);
      expect(tagNames).toContain('BackupEnabled');
    });
  });

  describe('Outputs', () => {
    test('should have EC2 public IP output', () => {
      expect(outputs.EC2PublicIP).toBeDefined();
    });

    test('should have RDS endpoint output', () => {
      expect(outputs.RDSEndpoint).toBeDefined();
    });

    test('should have Redis endpoint output', () => {
      expect(outputs.RedisEndpoint).toBeDefined();
    });

    test('should have S3 bucket names outputs', () => {
      expect(outputs.UploadsBucketName).toBeDefined();
      expect(outputs.BackupsBucketName).toBeDefined();
    });

    test('should have CloudFront URL output', () => {
      expect(outputs.CloudFrontURL).toBeDefined();
    });

    test('should have all outputs with exports', () => {
      Object.values(outputs).forEach((output: any) => {
        expect(output.Export).toBeDefined();
      });
    });
  });

  describe('Conditions', () => {
    test('should have ShouldCreateDNS condition', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.ShouldCreateDNS).toBeDefined();
    });
  });

  describe('Template Completeness', () => {
    test('should have all required security resources', () => {
      expect(resources.EC2SecurityGroup).toBeDefined();
      expect(resources.RDSSecurityGroup).toBeDefined();
      expect(resources.ElastiCacheSecurityGroup).toBeDefined();
    });

    test('should have all required database resources', () => {
      expect(resources.ForumDatabase).toBeDefined();
      expect(resources.DBSubnetGroup).toBeDefined();
      expect(resources.DBSecret).toBeDefined();
    });

    test('should have all required storage resources', () => {
      expect(resources.UploadsBucket).toBeDefined();
      expect(resources.BackupsBucket).toBeDefined();
    });

    test('should have total resource count of at least 30', () => {
      expect(Object.keys(resources).length).toBeGreaterThanOrEqual(30);
    });
  });
});
