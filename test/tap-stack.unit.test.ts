import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the security compliance template in JSON format
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a security compliance description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Security and compliance template enforcing encryption and MFA requirements'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toBe('Environment suffix for resource naming (e.g., dev, staging, prod)');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });
  });

  describe('KMS Resources', () => {
    test('should have S3 KMS key resource', () => {
      expect(template.Resources.S3KMSKey).toBeDefined();
    });

    test('S3KMSKey should be a KMS key with rotation enabled', () => {
      const key = template.Resources.S3KMSKey;
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.EnableKeyRotation).toBe(true);
      expect(key.Properties.Description).toBe('KMS key for S3 bucket encryption');
    });

    test('should have EBS KMS key resource', () => {
      expect(template.Resources.EBSKMSKey).toBeDefined();
    });

    test('EBSKMSKey should be a KMS key with rotation enabled', () => {
      const key = template.Resources.EBSKMSKey;
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.EnableKeyRotation).toBe(true);
      expect(key.Properties.Description).toBe('KMS key for EBS volume encryption');
    });

    test('should have KMS key aliases with environment suffix', () => {
      const s3Alias = template.Resources.S3KMSKeyAlias;
      const ebsAlias = template.Resources.EBSKMSKeyAlias;
      
      expect(s3Alias).toBeDefined();
      expect(ebsAlias).toBeDefined();
      expect(s3Alias.Properties.AliasName['Fn::Sub']).toBe('alias/s3-encryption-key-${EnvironmentSuffix}');
      expect(ebsAlias.Properties.AliasName['Fn::Sub']).toBe('alias/ebs-encryption-key-${EnvironmentSuffix}');
    });
  });

  describe('S3 Security Resources', () => {
    test('should have encrypted S3 bucket', () => {
      expect(template.Resources.EncryptedS3Bucket).toBeDefined();
    });

    test('EncryptedS3Bucket should have proper encryption and security settings', () => {
      const bucket = template.Resources.EncryptedS3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
      expect(bucket.UpdateReplacePolicy).toBe('Delete');
      
      // Check encryption
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      
      // Check public access block
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
      
      // Check versioning
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have bucket policy enforcing encryption', () => {
      expect(template.Resources.EncryptedS3BucketPolicy).toBeDefined();
      const policy = template.Resources.EncryptedS3BucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.PolicyDocument.Statement).toHaveLength(3);
    });
  });

  describe('EBS Encryption Resources', () => {
    test('should have EBS encryption lambda function', () => {
      expect(template.Resources.EBSEncryptionLambda).toBeDefined();
    });

    test('EBSEncryptionLambda should have proper configuration', () => {
      const lambda = template.Resources.EBSEncryptionLambda;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.12');
      expect(lambda.Properties.Handler).toBe('index.handler');
      expect(lambda.Properties.Timeout).toBe(30);
    });

    test('should have EBS encryption custom resource', () => {
      expect(template.Resources.EBSEncryptionCustomResource).toBeDefined();
      const customResource = template.Resources.EBSEncryptionCustomResource;
      expect(customResource.Type).toBe('Custom::EBSEncryption');
    });

    test('should have IAM role for EBS encryption lambda', () => {
      expect(template.Resources.EBSEncryptionLambdaRole).toBeDefined();
      const role = template.Resources.EBSEncryptionLambdaRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });
  });

  describe('IAM MFA Resources', () => {
    test('should have MFA required policy', () => {
      expect(template.Resources.MFARequiredPolicy).toBeDefined();
    });

    test('MFARequiredPolicy should have environment suffix in name', () => {
      const policy = template.Resources.MFARequiredPolicy;
      expect(policy.Type).toBe('AWS::IAM::ManagedPolicy');
      expect(policy.Properties.ManagedPolicyName['Fn::Sub']).toBe('RequireMFAForPrivilegedActions-${EnvironmentSuffix}');
      expect(policy.Properties.Description).toBe('Policy requiring MFA for privileged actions');
    });

    test('should have AllUsers group with environment suffix', () => {
      expect(template.Resources.AllUsersGroup).toBeDefined();
      const group = template.Resources.AllUsersGroup;
      expect(group.Type).toBe('AWS::IAM::Group');
      expect(group.Properties.GroupName['Fn::Sub']).toBe('AllUsers-${EnvironmentSuffix}');
    });
  });

  describe('AWS Config Resources', () => {
    test('should have Config role', () => {
      expect(template.Resources.ConfigRole).toBeDefined();
      const role = template.Resources.ConfigRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWS_ConfigRole');
    });

    test('should have Config bucket with proper settings', () => {
      expect(template.Resources.ConfigBucket).toBeDefined();
      const bucket = template.Resources.ConfigBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
      expect(bucket.UpdateReplacePolicy).toBe('Delete');
    });

    test('should have Config recorder with environment suffix', () => {
      expect(template.Resources.ConfigRecorder).toBeDefined();
      const recorder = template.Resources.ConfigRecorder;
      expect(recorder.Type).toBe('AWS::Config::ConfigurationRecorder');
      expect(recorder.Properties.Name['Fn::Sub']).toBe('DefaultRecorder-${EnvironmentSuffix}');
      expect(recorder.Properties.RecordingGroup.AllSupported).toBe(true);
    });

    test('should have Config delivery channel', () => {
      expect(template.Resources.ConfigDeliveryChannel).toBeDefined();
      const channel = template.Resources.ConfigDeliveryChannel;
      expect(channel.Type).toBe('AWS::Config::DeliveryChannel');
      expect(channel.Properties.ConfigSnapshotDeliveryProperties.DeliveryFrequency).toBe('One_Hour');
    });
  });

  describe('AWS Config Rules', () => {
    test('should have S3 encryption rule with environment suffix', () => {
      expect(template.Resources.S3EncryptionRule).toBeDefined();
      const rule = template.Resources.S3EncryptionRule;
      expect(rule.Type).toBe('AWS::Config::ConfigRule');
      expect(rule.Properties.ConfigRuleName['Fn::Sub']).toBe('s3-bucket-server-side-encryption-enabled-${EnvironmentSuffix}');
      expect(rule.Properties.Description).toBe('Checks if S3 buckets have encryption enabled');
      expect(rule.Properties.Source.Owner).toBe('AWS');
      expect(rule.Properties.Source.SourceIdentifier).toBe('S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED');
    });

    test('should have EBS encryption rule with environment suffix', () => {
      expect(template.Resources.EBSEncryptionRule).toBeDefined();
      const rule = template.Resources.EBSEncryptionRule;
      expect(rule.Type).toBe('AWS::Config::ConfigRule');
      expect(rule.Properties.ConfigRuleName['Fn::Sub']).toBe('encrypted-volumes-${EnvironmentSuffix}');
      expect(rule.Properties.Description).toBe('Checks if EBS volumes are encrypted');
      expect(rule.Properties.Source.Owner).toBe('AWS');
      expect(rule.Properties.Source.SourceIdentifier).toBe('ENCRYPTED_VOLUMES');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      expect(template.Outputs.S3KMSKeyArn).toBeDefined();
      expect(template.Outputs.EBSKMSKeyArn).toBeDefined();
      expect(template.Outputs.EncryptedS3BucketName).toBeDefined();
      expect(template.Outputs.MFARequiredPolicyArn).toBeDefined();
      expect(template.Outputs.ConfigBucketName).toBeDefined();
    });

    test('S3KMSKeyArn output should be correct', () => {
      const output = template.Outputs.S3KMSKeyArn;
      expect(output.Description).toBe('ARN of the KMS key for S3 encryption');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['S3KMSKey', 'Arn'] });
    });

    test('EBSKMSKeyArn output should be correct', () => {
      const output = template.Outputs.EBSKMSKeyArn;
      expect(output.Description).toBe('ARN of the KMS key for EBS encryption');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['EBSKMSKey', 'Arn'] });
    });

    test('EncryptedS3BucketName output should be correct', () => {
      const output = template.Outputs.EncryptedS3BucketName;
      expect(output.Description).toBe('Name of the encrypted S3 bucket');
      expect(output.Value).toEqual({ Ref: 'EncryptedS3Bucket' });
    });

    test('MFARequiredPolicyArn output should be correct', () => {
      const output = template.Outputs.MFARequiredPolicyArn;
      expect(output.Description).toBe('ARN of the IAM policy requiring MFA for privileged actions');
      expect(output.Value).toEqual({ Ref: 'MFARequiredPolicy' });
    });

    test('ConfigBucketName output should be correct', () => {
      const output = template.Outputs.ConfigBucketName;
      expect(output.Description).toBe('Name of the bucket storing AWS Config data');
      expect(output.Value).toEqual({ Ref: 'ConfigBucket' });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(typeof template).toBe('object');
      expect(template).not.toBeNull();
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(18);
    });

    test('should have exactly one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have exactly five outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(5);
    });
  });

  describe('Security Best Practices', () => {
    test('all S3 buckets should have DeletionPolicy Delete', () => {
      const buckets = Object.values(template.Resources).filter((resource: any) => 
        resource.Type === 'AWS::S3::Bucket'
      );
      buckets.forEach((bucket: any) => {
        expect(bucket.DeletionPolicy).toBe('Delete');
        expect(bucket.UpdateReplacePolicy).toBe('Delete');
      });
    });

    test('Config rules should have unique names with environment suffix', () => {
      const configRules = Object.values(template.Resources).filter((resource: any) => 
        resource.Type === 'AWS::Config::ConfigRule'
      );
      configRules.forEach((rule: any) => {
        expect(rule.Properties.ConfigRuleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });

    test('export names should follow naming convention', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        if (output.Export && output.Export.Name) {
          expect(output.Export.Name['Fn::Sub']).toMatch(/^\${AWS::StackName}-.+$/);
        }
      });
    });
  });
});