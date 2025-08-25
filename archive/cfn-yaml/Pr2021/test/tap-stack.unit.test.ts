import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Read the JSON version of the template
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
      expect(template.Description).toBe('Secure S3 bucket with comprehensive security configurations');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe('Environment suffix for resource naming and isolation');
      expect(envSuffixParam.AllowedPattern).toBe('[a-zA-Z0-9]+');
      expect(envSuffixParam.ConstraintDescription).toBe('Must contain only alphanumeric characters');
    });

    test('should have VpcId parameter', () => {
      expect(template.Parameters.VpcId).toBeDefined();
      const vpcParam = template.Parameters.VpcId;
      expect(vpcParam.Type).toBe('String');
      expect(vpcParam.Default).toBe('vpc-123abc456');
      expect(vpcParam.Description).toBe('VPC ID that will have access to the S3 bucket');
    });

    test('should have BucketNamePrefix parameter', () => {
      expect(template.Parameters.BucketNamePrefix).toBeDefined();
      const prefixParam = template.Parameters.BucketNamePrefix;
      expect(prefixParam.Type).toBe('String');
      expect(prefixParam.Default).toBe('secure-bucket');
      expect(prefixParam.Description).toBe('Prefix for the S3 bucket name');
    });
  });

  describe('Resources', () => {
    test('should have all required resources', () => {
      expect(template.Resources).toBeDefined();
      expect(template.Resources.S3EncryptionKey).toBeDefined();
      expect(template.Resources.S3EncryptionKeyAlias).toBeDefined();
      expect(template.Resources.AccessLogsBucket).toBeDefined();
      expect(template.Resources.SecureS3Bucket).toBeDefined();
      expect(template.Resources.SecureS3BucketPolicy).toBeDefined();
      expect(template.Resources.S3AccessLogGroup).toBeDefined();
    });

    describe('KMS Key', () => {
      test('should have correct properties', () => {
        const kmsKey = template.Resources.S3EncryptionKey;
        expect(kmsKey.Type).toBe('AWS::KMS::Key');
        expect(kmsKey.DeletionPolicy).toBe('Delete');
        expect(kmsKey.UpdateReplacePolicy).toBe('Delete');
        expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
        expect(kmsKey.Properties.KeyPolicy).toBeDefined();
      });

      test('should have correct key policy', () => {
        const keyPolicy = template.Resources.S3EncryptionKey.Properties.KeyPolicy;
        expect(keyPolicy.Version).toBe('2012-10-17');
        expect(keyPolicy.Statement).toHaveLength(2);
        
        const rootStatement = keyPolicy.Statement.find((s: any) => s.Sid === 'Enable IAM User Permissions');
        expect(rootStatement).toBeDefined();
        expect(rootStatement.Effect).toBe('Allow');
        expect(rootStatement.Action).toBe('kms:*');
        
        const s3Statement = keyPolicy.Statement.find((s: any) => s.Sid === 'Allow S3 Service');
        expect(s3Statement).toBeDefined();
        expect(s3Statement.Effect).toBe('Allow');
        expect(s3Statement.Principal.Service).toBe('s3.amazonaws.com');
        expect(s3Statement.Action).toContain('kms:Decrypt');
        expect(s3Statement.Action).toContain('kms:GenerateDataKey');
      });
    });

    describe('KMS Key Alias', () => {
      test('should have correct properties', () => {
        const kmsAlias = template.Resources.S3EncryptionKeyAlias;
        expect(kmsAlias.Type).toBe('AWS::KMS::Alias');
        expect(kmsAlias.DeletionPolicy).toBe('Delete');
        expect(kmsAlias.Properties.TargetKeyId.Ref).toBe('S3EncryptionKey');
      });
    });

    describe('Access Logs Bucket', () => {
      test('should have correct properties', () => {
        const logsBucket = template.Resources.AccessLogsBucket;
        expect(logsBucket.Type).toBe('AWS::S3::Bucket');
        expect(logsBucket.DeletionPolicy).toBe('Delete');
        expect(logsBucket.UpdateReplacePolicy).toBe('Delete');
      });

      test('should have encryption configuration', () => {
        const encryption = template.Resources.AccessLogsBucket.Properties.BucketEncryption;
        expect(encryption).toBeDefined();
        expect(encryption.ServerSideEncryptionConfiguration).toHaveLength(1);
        expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
        expect(encryption.ServerSideEncryptionConfiguration[0].BucketKeyEnabled).toBe(true);
      });

      test('should have public access block configuration', () => {
        const publicBlock = template.Resources.AccessLogsBucket.Properties.PublicAccessBlockConfiguration;
        expect(publicBlock).toBeDefined();
        expect(publicBlock.BlockPublicAcls).toBe(true);
        expect(publicBlock.BlockPublicPolicy).toBe(true);
        expect(publicBlock.IgnorePublicAcls).toBe(true);
        expect(publicBlock.RestrictPublicBuckets).toBe(true);
      });

      test('should have lifecycle configuration', () => {
        const lifecycle = template.Resources.AccessLogsBucket.Properties.LifecycleConfiguration;
        expect(lifecycle).toBeDefined();
        expect(lifecycle.Rules).toHaveLength(1);
        expect(lifecycle.Rules[0].Status).toBe('Enabled');
        expect(lifecycle.Rules[0].ExpirationInDays).toBe(90);
      });
    });

    describe('Secure S3 Bucket', () => {
      test('should have correct properties', () => {
        const secureBucket = template.Resources.SecureS3Bucket;
        expect(secureBucket.Type).toBe('AWS::S3::Bucket');
        expect(secureBucket.DeletionPolicy).toBe('Delete');
        expect(secureBucket.UpdateReplacePolicy).toBe('Delete');
      });

      test('should have versioning enabled', () => {
        const versioning = template.Resources.SecureS3Bucket.Properties.VersioningConfiguration;
        expect(versioning).toBeDefined();
        expect(versioning.Status).toBe('Enabled');
      });

      test('should have KMS encryption configuration', () => {
        const encryption = template.Resources.SecureS3Bucket.Properties.BucketEncryption;
        expect(encryption).toBeDefined();
        expect(encryption.ServerSideEncryptionConfiguration).toHaveLength(1);
        const encConfig = encryption.ServerSideEncryptionConfiguration[0];
        expect(encConfig.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
        expect(encConfig.ServerSideEncryptionByDefault.KMSMasterKeyID.Ref).toBe('S3EncryptionKey');
        expect(encConfig.BucketKeyEnabled).toBe(true);
      });

      test('should have object lock configuration', () => {
        const objectLock = template.Resources.SecureS3Bucket.Properties.ObjectLockConfiguration;
        expect(objectLock).toBeDefined();
        expect(objectLock.ObjectLockEnabled).toBe('Enabled');
        expect(objectLock.Rule).toBeDefined();
        expect(objectLock.Rule.DefaultRetention.Mode).toBe('COMPLIANCE');
        expect(objectLock.Rule.DefaultRetention.Days).toBe(7);
      });

      test('should have logging configuration', () => {
        const logging = template.Resources.SecureS3Bucket.Properties.LoggingConfiguration;
        expect(logging).toBeDefined();
        expect(logging.DestinationBucketName.Ref).toBe('AccessLogsBucket');
        expect(logging.LogFilePrefix).toBe('access-logs/');
      });

      test('should have public access block configuration', () => {
        const publicBlock = template.Resources.SecureS3Bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicBlock).toBeDefined();
        expect(publicBlock.BlockPublicAcls).toBe(true);
        expect(publicBlock.BlockPublicPolicy).toBe(true);
        expect(publicBlock.IgnorePublicAcls).toBe(true);
        expect(publicBlock.RestrictPublicBuckets).toBe(true);
      });

      test('should have EventBridge notification enabled', () => {
        const notification = template.Resources.SecureS3Bucket.Properties.NotificationConfiguration;
        expect(notification).toBeDefined();
        expect(notification.EventBridgeConfiguration).toBeDefined();
        expect(notification.EventBridgeConfiguration.EventBridgeEnabled).toBe(true);
      });

      test('should have object lock enabled', () => {
        expect(template.Resources.SecureS3Bucket.Properties.ObjectLockEnabled).toBe(true);
      });
    });

    describe('Bucket Policy', () => {
      test('should have correct properties', () => {
        const bucketPolicy = template.Resources.SecureS3BucketPolicy;
        expect(bucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
        expect(bucketPolicy.DeletionPolicy).toBe('Delete');
        expect(bucketPolicy.Properties.Bucket.Ref).toBe('SecureS3Bucket');
      });

      test('should have VPC restriction statements', () => {
        const policyDoc = template.Resources.SecureS3BucketPolicy.Properties.PolicyDocument;
        expect(policyDoc.Version).toBe('2012-10-17');
        expect(policyDoc.Statement).toHaveLength(2);
        
        const denyStatement = policyDoc.Statement.find((s: any) => s.Sid === 'DenyAccessFromOutsideVPC');
        expect(denyStatement).toBeDefined();
        expect(denyStatement.Effect).toBe('Deny');
        expect(denyStatement.Principal).toBe('*');
        expect(denyStatement.Action).toBe('s3:*');
        expect(denyStatement.Condition.StringNotEquals['aws:SourceVpc'].Ref).toBe('VpcId');
        
        const allowStatement = policyDoc.Statement.find((s: any) => s.Sid === 'AllowVPCAccess');
        expect(allowStatement).toBeDefined();
        expect(allowStatement.Effect).toBe('Allow');
        expect(allowStatement.Principal).toBe('*');
        expect(allowStatement.Action).toContain('s3:GetObject');
        expect(allowStatement.Action).toContain('s3:PutObject');
        expect(allowStatement.Action).toContain('s3:DeleteObject');
        expect(allowStatement.Action).toContain('s3:ListBucket');
        expect(allowStatement.Condition.StringEquals['aws:SourceVpc'].Ref).toBe('VpcId');
      });
    });

    describe('CloudWatch Log Group', () => {
      test('should have correct properties', () => {
        const logGroup = template.Resources.S3AccessLogGroup;
        expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
        expect(logGroup.DeletionPolicy).toBe('Delete');
        expect(logGroup.Properties.RetentionInDays).toBe(30);
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      expect(template.Outputs).toBeDefined();
      expect(template.Outputs.SecureS3BucketName).toBeDefined();
      expect(template.Outputs.SecureS3BucketArn).toBeDefined();
      expect(template.Outputs.AccessLogsBucketName).toBeDefined();
      expect(template.Outputs.KMSKeyId).toBeDefined();
      expect(template.Outputs.KMSKeyAlias).toBeDefined();
      expect(template.Outputs.VpcId).toBeDefined();
    });

    test('SecureS3BucketName output should have correct properties', () => {
      const output = template.Outputs.SecureS3BucketName;
      expect(output.Description).toBe('Name of the secure S3 bucket');
      expect(output.Value.Ref).toBe('SecureS3Bucket');
      expect(output.Export).toBeDefined();
    });

    test('SecureS3BucketArn output should have correct properties', () => {
      const output = template.Outputs.SecureS3BucketArn;
      expect(output.Description).toBe('ARN of the secure S3 bucket');
      expect(output.Value['Fn::GetAtt']).toEqual(['SecureS3Bucket', 'Arn']);
      expect(output.Export).toBeDefined();
    });

    test('AccessLogsBucketName output should have correct properties', () => {
      const output = template.Outputs.AccessLogsBucketName;
      expect(output.Description).toBe('Name of the access logs bucket');
      expect(output.Value.Ref).toBe('AccessLogsBucket');
      expect(output.Export).toBeDefined();
    });

    test('KMSKeyId output should have correct properties', () => {
      const output = template.Outputs.KMSKeyId;
      expect(output.Description).toBe('KMS Key ID used for encryption');
      expect(output.Value.Ref).toBe('S3EncryptionKey');
      expect(output.Export).toBeDefined();
    });

    test('KMSKeyAlias output should have correct properties', () => {
      const output = template.Outputs.KMSKeyAlias;
      expect(output.Description).toBe('KMS Key Alias');
      expect(output.Value.Ref).toBe('S3EncryptionKeyAlias');
      expect(output.Export).toBeDefined();
    });

    test('VpcId output should have correct properties', () => {
      const output = template.Outputs.VpcId;
      expect(output.Description).toBe('VPC ID configured for bucket access');
      expect(output.Value.Ref).toBe('VpcId');
      expect(output.Export).toBeDefined();
    });
  });

  describe('Security Configuration Validation', () => {
    test('all resources should have DeletionPolicy set to Delete', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).toBe('Delete');
      });
    });

    test('all S3 buckets should have encryption enabled', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Type === 'AWS::S3::Bucket') {
          expect(resource.Properties.BucketEncryption).toBeDefined();
          expect(resource.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
        }
      });
    });

    test('all S3 buckets should have public access blocked', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Type === 'AWS::S3::Bucket') {
          const publicBlock = resource.Properties.PublicAccessBlockConfiguration;
          expect(publicBlock).toBeDefined();
          expect(publicBlock.BlockPublicAcls).toBe(true);
          expect(publicBlock.BlockPublicPolicy).toBe(true);
          expect(publicBlock.IgnorePublicAcls).toBe(true);
          expect(publicBlock.RestrictPublicBuckets).toBe(true);
        }
      });
    });

    test('bucket names should use environment suffix', () => {
      const accessLogsBucket = template.Resources.AccessLogsBucket;
      const secureBucket = template.Resources.SecureS3Bucket;
      
      expect(accessLogsBucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(secureBucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('KMS key alias should use environment suffix', () => {
      const kmsAlias = template.Resources.S3EncryptionKeyAlias;
      expect(kmsAlias.Properties.AliasName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });
});