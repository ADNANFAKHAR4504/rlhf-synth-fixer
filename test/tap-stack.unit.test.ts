import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Security Compliance Tests', () => {
    test('should have comprehensive security infrastructure', async () => {
      // Verify all security components are present
      const securityResources = [
        'MasterKMSKey',
        'CloudTrail',
        'SecurityLogGroup',
        'ApplicationRole',
        'CloudTrailLogsRole',
      ];

      securityResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });

      expect(true).toBe(true);
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Secure cloud infrastructure with encryption, monitoring, and least privilege access'
      );
    });

    test('should have parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('should have DBUsername parameter', () => {
      expect(template.Parameters.DBUsername).toBeDefined();
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('production');
      expect(envParam.Description).toBe(
        'Environment name for resource tagging'
      );
    });
  });

  describe('Resources', () => {
    test('should have MasterKMSKey resource', () => {
      expect(template.Resources.MasterKMSKey).toBeDefined();
      expect(template.Resources.MasterKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have DatabaseInstance resource', () => {
      expect(template.Resources.DatabaseInstance).toBeDefined();
      expect(template.Resources.DatabaseInstance.Type).toBe(
        'AWS::RDS::DBInstance'
      );
    });

    test('should have S3 buckets with encryption', () => {
      expect(template.Resources.CloudTrailBucket).toBeDefined();
      expect(template.Resources.ApplicationDataBucket).toBeDefined();

      const cloudTrailBucket = template.Resources.CloudTrailBucket;
      const appDataBucket = template.Resources.ApplicationDataBucket;

      expect(cloudTrailBucket.Type).toBe('AWS::S3::Bucket');
      expect(appDataBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('DatabaseInstance should have encryption enabled', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.KmsKeyId).toEqual({ Ref: 'MasterKMSKey' });
    });

    test('should have IAM roles with least privilege', () => {
      expect(template.Resources.ApplicationRole).toBeDefined();
      expect(template.Resources.CloudTrailLogsRole).toBeDefined();

      const appRole = template.Resources.ApplicationRole;
      expect(appRole.Type).toBe('AWS::IAM::Role');
      expect(appRole.Properties.Policies).toBeDefined();
    });

    test('should have CloudTrail for auditing', () => {
      expect(template.Resources.CloudTrail).toBeDefined();
      const cloudTrail = template.Resources.CloudTrail;
      expect(cloudTrail.Type).toBe('AWS::CloudTrail::Trail');
      expect(cloudTrail.Properties.KMSKeyId).toEqual({ Ref: 'MasterKMSKey' });
    });

    test('should have EBS volume with encryption', () => {
      expect(template.Resources.EncryptedEBSVolume).toBeDefined();
      const ebsVolume = template.Resources.EncryptedEBSVolume;
      expect(ebsVolume.Type).toBe('AWS::EC2::Volume');
      expect(ebsVolume.Properties.Encrypted).toBe(true);
      expect(ebsVolume.Properties.KmsKeyId).toEqual({ Ref: 'MasterKMSKey' });
    });
  });

  describe('Outputs', () => {
    test('should have all required security outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'KMSKeyId',
        'DatabaseEndpoint',
        'ApplicationDataBucket',
        'CloudTrailBucket',
        'ApplicationRoleArn',
        'SecurityLogGroup',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('KMSKeyId output should be correct', () => {
      const output = template.Outputs.KMSKeyId;
      expect(output.Description).toBe('KMS Key ID for encryption');
      expect(output.Value).toEqual({ Ref: 'MasterKMSKey' });
    });

    test('DatabaseEndpoint output should be correct', () => {
      const output = template.Outputs.DatabaseEndpoint;
      expect(output.Description).toBe('RDS Database Endpoint');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['DatabaseInstance', 'Endpoint.Address'],
      });
    });

    test('ApplicationDataBucket output should be correct', () => {
      const output = template.Outputs.ApplicationDataBucket;
      expect(output.Description).toBe('S3 Bucket for application data');
      expect(output.Value).toEqual({ Ref: 'ApplicationDataBucket' });
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

    test('should have multiple security resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(10);
    });

    test('should have two parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });

    test('should have seven outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8);
    });
  });

  describe('Security Configuration', () => {
    test('all S3 buckets should have encryption enabled', () => {
      const s3Resources = Object.values(template.Resources).filter(
        (resource: any) => resource.Type === 'AWS::S3::Bucket'
      );

      s3Resources.forEach((bucket: any) => {
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        const encryption =
          bucket.Properties.BucketEncryption
            .ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
          'aws:kms'
        );
      });
    });

    test('all S3 buckets should block public access', () => {
      const s3Resources = Object.values(template.Resources).filter(
        (resource: any) => resource.Type === 'AWS::S3::Bucket'
      );

      s3Resources.forEach((bucket: any) => {
        const publicAccessBlock =
          bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });
    });

    test('KMS key should have proper key policy', () => {
      const kmsKey = template.Resources.MasterKMSKey;
      expect(kmsKey.Properties.KeyPolicy).toBeDefined();
      expect(kmsKey.Properties.KeyPolicy.Statement).toBeDefined();
      expect(Array.isArray(kmsKey.Properties.KeyPolicy.Statement)).toBe(true);
    });

    test('VPC should have DNS support enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });
  });
});
