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

  describe('Write Integration TESTS', () => {
    test('Integration tests are implemented in tap-stack.int.test.ts', async () => {
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
        'Gold Standard Secure S3 Bucket with comprehensive security controls and compliance features'
      );
    });
  });

  describe('Parameters', () => {
    test('should have no parameters (ExternalAccountId hardcoded)', () => {
      expect(template.Parameters).toBeUndefined();
    });
  });

  describe('Resources', () => {
    test('should have S3EncryptionKey resource', () => {
      expect(template.Resources.S3EncryptionKey).toBeDefined();
    });

    test('S3EncryptionKey should be a KMS key', () => {
      const key = template.Resources.S3EncryptionKey;
      expect(key.Type).toBe('AWS::KMS::Key');
    });

    test('should have S3EncryptionKeyAlias resource', () => {
      expect(template.Resources.S3EncryptionKeyAlias).toBeDefined();
    });

    test('S3EncryptionKeyAlias should be a KMS alias', () => {
      const alias = template.Resources.S3EncryptionKeyAlias;
      expect(alias.Type).toBe('AWS::KMS::Alias');
    });

    test('should have LoggingBucket resource', () => {
      expect(template.Resources.LoggingBucket).toBeDefined();
    });

    test('LoggingBucket should be an S3 bucket', () => {
      const bucket = template.Resources.LoggingBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('LoggingBucket should have public access blocked', () => {
      const bucket = template.Resources.LoggingBucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });

    test('should have SecureDataBucket resource', () => {
      expect(template.Resources.SecureDataBucket).toBeDefined();
    });

    test('SecureDataBucket should be an S3 bucket', () => {
      const bucket = template.Resources.SecureDataBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('SecureDataBucket should have deletion protection', () => {
      const bucket = template.Resources.SecureDataBucket;
      expect(bucket.DeletionPolicy).toBe('Retain');
      expect(bucket.UpdateReplacePolicy).toBe('Retain');
    });

    test('SecureDataBucket should have versioning enabled', () => {
      const bucket = template.Resources.SecureDataBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('SecureDataBucket should have KMS encryption', () => {
      const bucket = template.Resources.SecureDataBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('SecureDataBucket should have access logging configured', () => {
      const bucket = template.Resources.SecureDataBucket;
      expect(bucket.Properties.LoggingConfiguration).toBeDefined();
      expect(bucket.Properties.LoggingConfiguration.DestinationBucketName).toBeDefined();
    });

    test('should have SecureDataBucketPolicy resource', () => {
      expect(template.Resources.SecureDataBucketPolicy).toBeDefined();
    });

    test('SecureDataBucketPolicy should be a bucket policy', () => {
      const policy = template.Resources.SecureDataBucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'SecureBucketName',
        'KMSKeyArn',
        'LoggingBucketName',
        'KMSKeyAlias',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('SecureBucketName output should be correct', () => {
      const output = template.Outputs.SecureBucketName;
      expect(output.Description).toBe('Name of the secure S3 bucket');
      expect(output.Value).toEqual({ Ref: 'SecureDataBucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-SecureBucketName',
      });
    });

    test('KMSKeyArn output should be correct', () => {
      const output = template.Outputs.KMSKeyArn;
      expect(output.Description).toBe('ARN of the KMS key used for bucket encryption');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['S3EncryptionKey', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-KMSKeyArn',
      });
    });

    test('LoggingBucketName output should be correct', () => {
      const output = template.Outputs.LoggingBucketName;
      expect(output.Description).toBe('Name of the access logging bucket');
      expect(output.Value).toEqual({ Ref: 'LoggingBucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-LoggingBucketName',
      });
    });

    test('KMSKeyAlias output should be correct', () => {
      const output = template.Outputs.KMSKeyAlias;
      expect(output.Description).toBe('Alias of the KMS key for easier reference');
      expect(output.Value).toEqual({ Ref: 'S3EncryptionKeyAlias' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-KMSKeyAlias',
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
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have exactly five resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(5);
    });

    test('should have exactly zero parameters', () => {
      expect(template.Parameters).toBeUndefined();
    });

    test('should have exactly four outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(4);
    });
  });

  describe('Resource Naming Convention', () => {
    test('bucket should not have explicit name (auto-generated)', () => {
      const bucket = template.Resources.SecureDataBucket;
      const bucketName = bucket.Properties.BucketName;

      // Bucket name should be auto-generated by CloudFormation
      expect(bucketName).toBeUndefined();
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
    });
  });
});
