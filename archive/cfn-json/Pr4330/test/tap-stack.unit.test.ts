import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('HIPAA-Compliant Healthcare Infrastructure CloudFormation Template', () => {
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
      expect(template.Description).toContain('HIPAA-compliant');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Description).toContain('Environment suffix');
    });
  });

  describe('KMS Encryption', () => {
    test('should have KMS key for encryption', () => {
      expect(template.Resources.EncryptionKey).toBeDefined();
      expect(template.Resources.EncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have rotation enabled', () => {
      const key = template.Resources.EncryptionKey;
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('KMS key should have proper key policy', () => {
      const key = template.Resources.EncryptionKey;
      expect(key.Properties.KeyPolicy).toBeDefined();
      expect(key.Properties.KeyPolicy.Statement).toBeDefined();
    });

    test('should have KMS key alias with environment suffix', () => {
      expect(template.Resources.EncryptionKeyAlias).toBeDefined();
      expect(template.Resources.EncryptionKeyAlias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/hipaa-key-${EnvironmentSuffix}',
      });
    });
  });

  describe('S3 Buckets', () => {
    test('should have patient data bucket with encryption', () => {
      expect(template.Resources.PatientDataBucket).toBeDefined();
      const bucket = template.Resources.PatientDataBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('patient data bucket should have versioning enabled', () => {
      const bucket = template.Resources.PatientDataBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('patient data bucket should block public access', () => {
      const bucket = template.Resources.PatientDataBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have logging bucket', () => {
      expect(template.Resources.LoggingBucket).toBeDefined();
      expect(template.Resources.LoggingBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have CloudTrail bucket', () => {
      expect(template.Resources.CloudTrailBucket).toBeDefined();
      expect(template.Resources.CloudTrailBucket.Type).toBe('AWS::S3::Bucket');
    });
  });

  describe('CloudTrail', () => {
    test('should have CloudTrail for audit logging', () => {
      expect(template.Resources.AuditTrail).toBeDefined();
      expect(template.Resources.AuditTrail.Type).toBe('AWS::CloudTrail::Trail');
    });

    test('CloudTrail should be multi-region', () => {
      const trail = template.Resources.AuditTrail;
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
    });

    test('CloudTrail should have log file validation enabled', () => {
      const trail = template.Resources.AuditTrail;
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('should have CloudTrail log group with encryption', () => {
      expect(template.Resources.CloudTrailLogGroup).toBeDefined();
      const logGroup = template.Resources.CloudTrailLogGroup;
      expect(logGroup.Properties.KmsKeyId).toBeDefined();
    });
  });

  describe('VPC Configuration', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should have S3 VPC endpoint', () => {
      expect(template.Resources.S3VPCEndpoint).toBeDefined();
      expect(template.Resources.S3VPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
    });

    test('should have CloudWatch Logs VPC endpoint', () => {
      expect(template.Resources.CloudWatchLogsVPCEndpoint).toBeDefined();
    });

    test('should have security groups', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      expect(template.Resources.VPCEndpointSecurityGroup).toBeDefined();
    });
  });

  describe('DynamoDB Audit Table', () => {
    test('should have audit table with encryption', () => {
      expect(template.Resources.AuditTable).toBeDefined();
      const table = template.Resources.AuditTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.SSESpecification.SSEType).toBe('KMS');
    });

    test('audit table should have point-in-time recovery', () => {
      const table = template.Resources.AuditTable;
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('audit table should use on-demand billing', () => {
      const table = template.Resources.AuditTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });
  });

  describe('Lambda Function', () => {
    test('should have data processor function', () => {
      expect(template.Resources.DataProcessorFunction).toBeDefined();
      const lambda = template.Resources.DataProcessorFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda should use Node.js 20.x runtime', () => {
      const lambda = template.Resources.DataProcessorFunction;
      expect(lambda.Properties.Runtime).toBe('nodejs20.x');
    });

    test('Lambda should have VPC configuration', () => {
      const lambda = template.Resources.DataProcessorFunction;
      expect(lambda.Properties.VpcConfig).toBeDefined();
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toBeDefined();
      expect(lambda.Properties.VpcConfig.SubnetIds).toBeDefined();
    });

    test('Lambda should have execution role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('Lambda should have log group with encryption', () => {
      expect(template.Resources.ProcessingFunctionLogGroup).toBeDefined();
      const logGroup = template.Resources.ProcessingFunctionLogGroup;
      expect(logGroup.Properties.KmsKeyId).toBeDefined();
      expect(logGroup.Properties.RetentionInDays).toBe(14);
    });
  });

  describe('SNS Topic', () => {
    test('should have alert topic with encryption', () => {
      expect(template.Resources.AlertTopic).toBeDefined();
      const topic = template.Resources.AlertTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.KmsMasterKeyId).toBeDefined();
    });
  });

  describe('SSM Parameters', () => {
    test('should have SSM parameters for configuration', () => {
      expect(template.Resources.ConfigParameter).toBeDefined();
      expect(template.Resources.BucketNameParameter).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'PatientDataBucketName',
        'AuditTableName',
        'DataProcessorFunctionName',
        'VPCId',
        'EncryptionKeyId',
        'CloudTrailName',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Description).toBeDefined();
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

    test('should have appropriate number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(10);
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should use environment suffix in names', () => {
      const bucket = template.Resources.PatientDataBucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'patient-data-${EnvironmentSuffix}-${AWS::AccountId}-${AWS::Region}',
      });

      const table = template.Resources.AuditTable;
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'audit-trail-${EnvironmentSuffix}',
      });
    });
  });

  describe('HIPAA Compliance', () => {
    test('all S3 buckets should have encryption', () => {
      const buckets = ['PatientDataBucket', 'LoggingBucket', 'CloudTrailBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
      });
    });

    test('all S3 buckets should block public access', () => {
      const buckets = ['PatientDataBucket', 'LoggingBucket', 'CloudTrailBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      });
    });

    test('DynamoDB table should have encryption', () => {
      const table = template.Resources.AuditTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('Lambda should have VPC configuration for network isolation', () => {
      const lambda = template.Resources.DataProcessorFunction;
      expect(lambda.Properties.VpcConfig).toBeDefined();
    });

    test('CloudWatch Logs should have encryption', () => {
      const logGroups = ['CloudTrailLogGroup', 'ProcessingFunctionLogGroup'];
      logGroups.forEach(logGroupName => {
        const logGroup = template.Resources[logGroupName];
        expect(logGroup.Properties.KmsKeyId).toBeDefined();
      });
    });
  });
});
