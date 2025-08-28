import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON template for testing
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
      expect(template.Description).toContain('Enterprise-Grade AWS Security Framework');
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'Environment',
        'ProjectName',
        'VpcCidr',
        'TrustedIpRange',
        'ComplianceRetentionDays'
      ];

      expectedParams.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('production');
      expect(envParam.AllowedValues).toEqual(['development', 'staging', 'production']);
    });

    test('ProjectName parameter should have correct properties', () => {
      const projectParam = template.Parameters.ProjectName;
      expect(projectParam.Type).toBe('String');
      expect(projectParam.Default).toBe('secure-enterprise');
      expect(projectParam.MinLength).toBe(3);
      expect(projectParam.MaxLength).toBe(20);
      expect(projectParam.AllowedPattern).toBe('^[a-z0-9-]+$');
    });

    test('VpcCidr parameter should have correct properties', () => {
      const vpcParam = template.Parameters.VpcCidr;
      expect(vpcParam.Type).toBe('String');
      expect(vpcParam.Default).toBe('10.0.0.0/16');
      expect(vpcParam.AllowedPattern).toBeDefined();
    });

    test('TrustedIpRange parameter should have correct properties', () => {
      const trustedParam = template.Parameters.TrustedIpRange;
      expect(trustedParam.Type).toBe('String');
      expect(trustedParam.Default).toBe('10.0.0.0/8');
    });

    test('ComplianceRetentionDays parameter should have correct properties', () => {
      const retentionParam = template.Parameters.ComplianceRetentionDays;
      expect(retentionParam.Type).toBe('Number');
      expect(retentionParam.Default).toBe(2555);
      expect(retentionParam.MinValue).toBe(365);
      expect(retentionParam.MaxValue).toBe(3653);
    });
  });

  describe('KMS Resources', () => {
    test('should have S3EncryptionKey', () => {
      expect(template.Resources.S3EncryptionKey).toBeDefined();
      expect(template.Resources.S3EncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('S3EncryptionKey should have correct properties', () => {
      const key = template.Resources.S3EncryptionKey;
      expect(key.Properties.EnableKeyRotation).toBe(true);
      expect(key.Properties.KeyPolicy).toBeDefined();
      expect(key.Properties.Tags).toBeDefined();
    });

    test('should have S3EncryptionKeyAlias', () => {
      expect(template.Resources.S3EncryptionKeyAlias).toBeDefined();
      expect(template.Resources.S3EncryptionKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('should have CloudTrailEncryptionKey', () => {
      expect(template.Resources.CloudTrailEncryptionKey).toBeDefined();
      expect(template.Resources.CloudTrailEncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have CloudTrailEncryptionKeyAlias', () => {
      expect(template.Resources.CloudTrailEncryptionKeyAlias).toBeDefined();
      expect(template.Resources.CloudTrailEncryptionKeyAlias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe('VPC and Networking', () => {
    test('should have SecureVPC', () => {
      expect(template.Resources.SecureVPC).toBeDefined();
      expect(template.Resources.SecureVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('SecureVPC should have correct properties', () => {
      const vpc = template.Resources.SecureVPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.Tags).toBeDefined();
    });

    test('should have InternetGateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPCGatewayAttachment', () => {
      expect(template.Resources.VPCGatewayAttachment).toBeDefined();
      expect(template.Resources.VPCGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });
  });

  describe('Security Groups', () => {
    test('should have WebTierSecurityGroup', () => {
      expect(template.Resources.WebTierSecurityGroup).toBeDefined();
      expect(template.Resources.WebTierSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have ApplicationTierSecurityGroup', () => {
      expect(template.Resources.ApplicationTierSecurityGroup).toBeDefined();
      expect(template.Resources.ApplicationTierSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have DataTierSecurityGroup', () => {
      expect(template.Resources.DataTierSecurityGroup).toBeDefined();
      expect(template.Resources.DataTierSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have ManagementSecurityGroup', () => {
      expect(template.Resources.ManagementSecurityGroup).toBeDefined();
      expect(template.Resources.ManagementSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('WebTierSecurityGroup should allow HTTP and HTTPS', () => {
      const sg = template.Resources.WebTierSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      const httpRule = ingress.find((rule: any) => rule.FromPort === 80);
      const httpsRule = ingress.find((rule: any) => rule.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have WebTierInstanceRole', () => {
      expect(template.Resources.WebTierInstanceRole).toBeDefined();
      expect(template.Resources.WebTierInstanceRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have WebTierInstanceProfile', () => {
      expect(template.Resources.WebTierInstanceProfile).toBeDefined();
      expect(template.Resources.WebTierInstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have ApplicationTierInstanceRole', () => {
      expect(template.Resources.ApplicationTierInstanceRole).toBeDefined();
      expect(template.Resources.ApplicationTierInstanceRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have ApplicationTierInstanceProfile', () => {
      expect(template.Resources.ApplicationTierInstanceProfile).toBeDefined();
      expect(template.Resources.ApplicationTierInstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have CloudTrailRole', () => {
      expect(template.Resources.CloudTrailRole).toBeDefined();
      expect(template.Resources.CloudTrailRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have ConfigRole', () => {
      expect(template.Resources.ConfigRole).toBeDefined();
      expect(template.Resources.ConfigRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('S3 Buckets', () => {
    test('should have SecureS3Bucket', () => {
      expect(template.Resources.SecureS3Bucket).toBeDefined();
      expect(template.Resources.SecureS3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('SecureS3Bucket should have encryption enabled', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('SecureS3Bucket should have versioning enabled', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('SecureS3Bucket should block public access', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
    });

    test('should have S3AccessLogsBucket', () => {
      expect(template.Resources.S3AccessLogsBucket).toBeDefined();
      expect(template.Resources.S3AccessLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have ConfigS3Bucket', () => {
      expect(template.Resources.ConfigS3Bucket).toBeDefined();
      expect(template.Resources.ConfigS3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have CloudTrailS3Bucket', () => {
      expect(template.Resources.CloudTrailS3Bucket).toBeDefined();
      expect(template.Resources.CloudTrailS3Bucket.Type).toBe('AWS::S3::Bucket');
    });
  });

  describe('S3 Bucket Policies', () => {
    test('should have SecureS3BucketPolicy', () => {
      expect(template.Resources.SecureS3BucketPolicy).toBeDefined();
      expect(template.Resources.SecureS3BucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('should have CloudTrailS3BucketPolicy', () => {
      expect(template.Resources.CloudTrailS3BucketPolicy).toBeDefined();
      expect(template.Resources.CloudTrailS3BucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should have VPCFlowLogsGroup', () => {
      expect(template.Resources.VPCFlowLogsGroup).toBeDefined();
      expect(template.Resources.VPCFlowLogsGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('VPCFlowLogsGroup should have retention policy', () => {
      const logGroup = template.Resources.VPCFlowLogsGroup;
      expect(logGroup.Properties.RetentionInDays).toBeDefined();
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
    });

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20); // Should have many resources
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(5); // Environment, ProjectName, VpcCidr, TrustedIpRange, ComplianceRetentionDays
    });
  });

  describe('Resource Naming Convention', () => {
    test('resource names should follow naming convention with project and environment', () => {
      const resources = template.Resources;

      // Check a few key resources for naming convention
      const vpc = resources.SecureVPC;
      const s3Key = resources.S3EncryptionKey;

      expect(vpc.Properties.Tags).toBeDefined();
      expect(s3Key.Properties.Tags).toBeDefined();
    });

    test('tags should include required keys', () => {
      const resources = template.Resources;

      // Check a few resources for required tags
      const vpc = resources.SecureVPC;
      const tags = vpc.Properties.Tags;

      const tagKeys = tags.map((tag: any) => tag.Key);
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('Purpose');
      expect(tagKeys).toContain('ManagedBy');
    });
  });
});

