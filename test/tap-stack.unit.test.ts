/**
 * TapStack CloudFormation Template Unit Tests (ESM, .unit.test.mjs)
 * - Matches pipeline regex: /\.unit\.test\.mjs$/
 * - Mirrors the archived test's describe/title style and structure
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template;

  beforeAll(() => {
    // Adjust path if your template lives elsewhere
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // ---------------- Template Structure ----------------
  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have all required top-level sections', () => {
      expect(template).toHaveProperty('AWSTemplateFormatVersion');
      expect(template).toHaveProperty('Description');
      expect(template).toHaveProperty('Parameters');
      expect(template).toHaveProperty('Resources');
      expect(template).toHaveProperty('Outputs');
    });

    test('should have metadata interface section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
      expect(template).not.toBeNull();
    });
  });

  // ---------------- Parameters ----------------
  describe('Parameters', () => {
    test('should include EnvironmentSuffix', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix should be lowercase and constrained', () => {
      const p = template.Parameters.EnvironmentSuffix;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('dev');
      expect(p.AllowedPattern).toBe('^[a-z0-9]+$');
      expect(p.ConstraintDescription).toMatch(/lowercase/);
    });

    test('should have VPC/network parameters', () => {
      ['VPCCidr', 'PublicSubnet1Cidr', 'PublicSubnet2Cidr', 'PrivateSubnet1Cidr', 'PrivateSubnet2Cidr']
        .forEach(k => expect(template.Parameters[k]).toBeDefined());
    });

    test('should have EC2 parameters (no KeyName)', () => {
      expect(template.Parameters.InstanceType).toBeDefined();
      expect(template.Parameters.LatestAmiId).toBeDefined();
      // Intentional: no KeyName param to avoid CFN validation differences
      expect(template.Parameters.KeyName).toBeUndefined();
    });

    test('should have DB parameters (username + instance class)', () => {
      expect(template.Parameters.DBUsername).toBeDefined();
      expect(template.Parameters.DBInstanceClass).toBeDefined();
      const u = template.Parameters.DBUsername;
      // cannot be 'admin' and must start with a letter
      expect(u.AllowedPattern).toBe("^(?!admin$)[a-zA-Z][a-zA-Z0-9_]*$");
    });
  });

  // ---------------- Resources ----------------
  describe('Resources', () => {
    test('should have KMS key and alias', () => {
      expect(template.Resources.KMSKey?.Type).toBe('AWS::KMS::Key');
      expect(template.Resources.KMSAlias?.Type).toBe('AWS::KMS::Alias');
    });

    test('should have VPC and core networking', () => {
      const r = template.Resources;
      ['VPC', 'InternetGateway', 'AttachGateway', 'PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2',
        'PublicRouteTable', 'PublicRoute', 'PrivateRouteTable', 'PrivateRoute', 'NATGateway', 'NATGatewayEIP']
        .forEach(k => expect(r[k]).toBeDefined());
    });

    test('should have security groups', () => {
      const r = template.Resources;
      ['BastionSecurityGroup', 'ALBSecurityGroup', 'EC2SecurityGroup', 'RDSSecurityGroup']
        .forEach(k => expect(r[k]).toBeDefined());
    });

    test('should have EC2 + ASG + ALB', () => {
      const r = template.Resources;
      ['BastionHost', 'LaunchTemplate', 'AutoScalingGroup', 'ApplicationLoadBalancer', 'ALBTargetGroup', 'ALBListener']
        .forEach(k => expect(r[k]).toBeDefined());
    });

    test('should have S3 buckets and policies', () => {
      const r = template.Resources;
      ['LogBucket', 'DataBucket', 'ContentBucket', 'DataBucketPolicy', 'ContentBucketPolicy', 'LogBucketPolicy']
        .forEach(k => expect(r[k]).toBeDefined());
      expect(r.LogBucket.Type).toBe('AWS::S3::Bucket');
      expect(r.DataBucket.Type).toBe('AWS::S3::Bucket');
      expect(r.ContentBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have CloudFront with OAI', () => {
      expect(template.Resources.CloudFrontDistribution?.Type).toBe('AWS::CloudFront::Distribution');
      expect(template.Resources.CloudFrontOAI?.Type).toBe('AWS::CloudFront::CloudFrontOriginAccessIdentity');
    });

    test('should have RDS (PostgreSQL) with subnet group and secret', () => {
      const r = template.Resources;
      expect(r.DBSubnetGroup?.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(r.DBSecret?.Type).toBe('AWS::SecretsManager::Secret');
      expect(r.DBInstance?.Type).toBe('AWS::RDS::DBInstance');

      const db = r.DBInstance?.Properties || {};
      expect(db.Engine).toBe('postgres');
      expect(db.EngineVersion).toBe('15.10');
      expect(db.VPCSecurityGroups?.length).toBeGreaterThan(0);
      expect(db.EnableCloudwatchLogsExports).toContain('postgresql');
      expect(db.PubliclyAccessible).toBe(false);
      expect(db.MultiAZ).toBe(true);
    });

    test('should have Lambda and invoke permissions', () => {
      expect(template.Resources.LogProcessorFunction?.Type).toBe('AWS::Lambda::Function');
      expect(template.Resources.LambdaExecutionRole?.Type).toBe('AWS::IAM::Role');
      expect(template.Resources.LambdaS3Permission?.Type).toBe('AWS::Lambda::Permission');
    });

    test('should have CloudWatch alarms + scaling policies', () => {
      const r = template.Resources;
      ['CPUAlarmHigh', 'CPUAlarmLow', 'ScaleUpPolicy', 'ScaleDownPolicy']
        .forEach(k => expect(r[k]).toBeDefined());
    });
  });

  // ---------------- Security & Compliance ----------------
  describe('Security and Compliance', () => {
    test('KMS key should have rotation enabled', () => {
      expect(template.Resources.KMSKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('S3 buckets should have KMS encryption and public access blocked', () => {
      ['LogBucket', 'DataBucket', 'ContentBucket'].forEach(name => {
        const b = template.Resources[name].Properties;
        const cfg = b.BucketEncryption?.ServerSideEncryptionConfiguration?.[0]?.ServerSideEncryptionByDefault || {};
        expect(cfg.SSEAlgorithm).toBe('aws:kms');

        const pab = b.PublicAccessBlockConfiguration || {};
        expect(pab.BlockPublicAcls).toBe(true);
        expect(pab.BlockPublicPolicy).toBe(true);
        expect(pab.IgnorePublicAcls).toBe(true);
        expect(pab.RestrictPublicBuckets).toBe(true);
      });
    });

    test('RDS must be encrypted with project KMS and private', () => {
      const db = template.Resources.DBInstance.Properties;
      expect(db.StorageEncrypted).toBe(true);
      expect(db.KmsKeyId).toEqual({ Ref: 'KMSKey' });
      expect(db.PubliclyAccessible).toBe(false);
    });

    test('DB instance should be deletable for test environments', () => {
      const dbr = template.Resources.DBInstance;
      expect(dbr.DeletionPolicy).toBe('Delete');
      expect(dbr.UpdateReplacePolicy).toBe('Delete');
    });

    test('LaunchTemplate root volume should be encrypted (no custom CMK on EBS)', () => {
      const ebs = template.Resources.LaunchTemplate.Properties.LaunchTemplateData.BlockDeviceMappings[0].Ebs;
      expect(ebs.Encrypted).toBe(true);
      expect(ebs.KmsKeyId).toBeUndefined();
    });
  });

  // ---------------- Resource Naming ----------------
  describe('Resource Naming Convention', () => {
    test('KMS alias should use environment suffix', () => {
      expect(template.Resources.KMSAlias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/TapStack${EnvironmentSuffix}-key',
      });
    });

    test('S3 bucket names should include env suffix + account + region', () => {
      const log = template.Resources.LogBucket.Properties.BucketName;
      const data = template.Resources.DataBucket.Properties.BucketName;
      const content = template.Resources.ContentBucket.Properties.BucketName;

      expect(log).toEqual({ 'Fn::Sub': 'tapstack${EnvironmentSuffix}-logs-${AWS::AccountId}-${AWS::Region}' });
      expect(data).toEqual({ 'Fn::Sub': 'tapstack${EnvironmentSuffix}-data-${AWS::AccountId}-${AWS::Region}' });
      expect(content).toEqual({ 'Fn::Sub': 'tapstack${EnvironmentSuffix}-content-${AWS::AccountId}-${AWS::Region}' });
    });

    test('VPC tag should include environment suffix', () => {
      const tags = template.Resources.VPC.Properties.Tags || [];
      const nameTag = tags.find(t => t.Key === 'Name');
      expect(nameTag?.Value).toEqual({ 'Fn::Sub': 'TapStack${EnvironmentSuffix}-VPC' });
    });

    test('DB secret name should use environment suffix', () => {
      expect(template.Resources.DBSecret.Properties.Name).toEqual({
        'Fn::Sub': 'TapStack${EnvironmentSuffix}/db/master',
      });
    });
  });

  // ---------------- Outputs ----------------
  describe('Outputs', () => {
    test('should have all required outputs', () => {
      ['VPCId', 'ALBDNSName', 'CloudFrontURL', 'BastionPublicIP', 'DataBucketName', 'RDSEndpoint', 'LambdaFunctionArn']
        .forEach(k => expect(template.Outputs[k]).toBeDefined());
    });

    test('output export names should use environment suffix', () => {
      const expected = {
        VPCId: 'TapStack${EnvironmentSuffix}-VPC-ID',
        ALBDNSName: 'TapStack${EnvironmentSuffix}-ALB-DNS',
        CloudFrontURL: 'TapStack${EnvironmentSuffix}-CloudFront-URL',
        BastionPublicIP: 'TapStack${EnvironmentSuffix}-Bastion-IP',
        DataBucketName: 'TapStack${EnvironmentSuffix}-DataBucket',
        RDSEndpoint: 'TapStack${EnvironmentSuffix}-RDS-Endpoint',
        LambdaFunctionArn: 'TapStack${EnvironmentSuffix}-Lambda-ARN',
      };

      Object.entries(expected).forEach(([k, subVal]) => {
        const out = template.Outputs[k];
        expect(out).toBeDefined();
        expect(out.Export?.Name).toEqual({ 'Fn::Sub': subVal });
      });
    });
  });

  // ---------------- Template Validation ----------------
  describe('Template Validation', () => {
    test('should not have null sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have reasonable number of resources for comprehensive infra', () => {
      const count = Object.keys(template.Resources).length;
      expect(count).toBeGreaterThan(20);
    });

    test('should have enough parameters and include EnvironmentSuffix', () => {
      const pc = Object.keys(template.Parameters).length;
      expect(pc).toBeGreaterThan(5);
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('should have comprehensive outputs', () => {
      const oc = Object.keys(template.Outputs).length;
      expect(oc).toBeGreaterThanOrEqual(7);
    });
  });
});
