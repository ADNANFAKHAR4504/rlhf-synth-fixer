import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Transaction Processing Infrastructure', () => {
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
      expect(template.Description).toContain('Transaction Processing Infrastructure');
    });

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
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have strict pattern validation', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-z0-9]{6,12}$');
      expect(envSuffixParam.ConstraintDescription).toBe('Must be 6-12 lowercase alphanumeric characters');
    });

    test('should have exactly one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have SessionTable resource', () => {
      expect(template.Resources.SessionTable).toBeDefined();
      expect(template.Resources.SessionTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('SessionTable should have correct deletion policies', () => {
      const table = template.Resources.SessionTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });

    test('SessionTable should include environmentSuffix in name', () => {
      const table = template.Resources.SessionTable;
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'sessions-${EnvironmentSuffix}',
      });
    });

    test('SessionTable should have encryption enabled', () => {
      const table = template.Resources.SessionTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('SessionTable should have point-in-time recovery', () => {
      const table = template.Resources.SessionTable;
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('SessionTable should have global secondary index', () => {
      const table = template.Resources.SessionTable;
      expect(table.Properties.GlobalSecondaryIndexes).toHaveLength(1);
      expect(table.Properties.GlobalSecondaryIndexes[0].IndexName).toBe('UserIdIndex');
    });

    test('should have TransactionTable resource', () => {
      expect(template.Resources.TransactionTable).toBeDefined();
      expect(template.Resources.TransactionTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('TransactionTable should have DynamoDB Streams enabled', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Properties.StreamSpecification).toBeDefined();
      expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('TransactionTable should include environmentSuffix in name', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'transactions-${EnvironmentSuffix}',
      });
    });
  });

  describe('S3 Resources', () => {
    test('should have AuditLogBucket resource', () => {
      expect(template.Resources.AuditLogBucket).toBeDefined();
      expect(template.Resources.AuditLogBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('AuditLogBucket should have versioning enabled', () => {
      const bucket = template.Resources.AuditLogBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('AuditLogBucket should have encryption enabled', () => {
      const bucket = template.Resources.AuditLogBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('AuditLogBucket should block all public access', () => {
      const bucket = template.Resources.AuditLogBucket;
      const publicAccessConfig = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });

    test('AuditLogBucket should have lifecycle policy', () => {
      const bucket = template.Resources.AuditLogBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules.length).toBeGreaterThan(0);
    });

    test('should have TemplatesBucket for nested stacks', () => {
      expect(template.Resources.TemplatesBucket).toBeDefined();
      expect(template.Resources.TemplatesBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('TemplatesBucket should allow CloudFormation access', () => {
      expect(template.Resources.TemplatesBucketPolicy).toBeDefined();
      const policy = template.Resources.TemplatesBucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('ECR Resources', () => {
    test('should have TransactionValidatorECRRepository', () => {
      expect(template.Resources.TransactionValidatorECRRepository).toBeDefined();
      expect(template.Resources.TransactionValidatorECRRepository.Type).toBe('AWS::ECR::Repository');
    });

    test('ECR repository should have image scanning enabled', () => {
      const repo = template.Resources.TransactionValidatorECRRepository;
      expect(repo.Properties.ImageScanningConfiguration.ScanOnPush).toBe(true);
    });

    test('ECR repository should have lifecycle policy', () => {
      const repo = template.Resources.TransactionValidatorECRRepository;
      expect(repo.Properties.LifecyclePolicy).toBeDefined();
    });

    test('ECR repository should include environmentSuffix in name', () => {
      const repo = template.Resources.TransactionValidatorECRRepository;
      expect(repo.Properties.RepositoryName).toEqual({
        'Fn::Sub': 'transaction-validator-${EnvironmentSuffix}',
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'SessionTableName',
        'TransactionTableName',
        'TransactionTableStreamArn',
        'AuditLogBucketName',
        'TemplatesBucketName',
        'TransactionValidatorECRRepositoryUri'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });

    test('SessionTableName output should reference SessionTable', () => {
      const output = template.Outputs.SessionTableName;
      expect(output.Value).toEqual({ Ref: 'SessionTable' });
    });

    test('TransactionTableStreamArn output should use GetAtt', () => {
      const output = template.Outputs.TransactionTableStreamArn;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['TransactionTable', 'StreamArn'],
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all named resources should include environmentSuffix', () => {
      const namedResources = [
        'SessionTable',
        'TransactionTable',
        'AuditLogBucket',
        'TemplatesBucket',
        'TransactionValidatorECRRepository'
      ];

      namedResources.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties.TableName) {
          expect(JSON.stringify(resource.Properties.TableName)).toContain('${EnvironmentSuffix}');
        } else if (resource.Properties.BucketName) {
          expect(JSON.stringify(resource.Properties.BucketName)).toContain('${EnvironmentSuffix}');
        } else if (resource.Properties.RepositoryName) {
          expect(JSON.stringify(resource.Properties.RepositoryName)).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('export names should follow standard naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(JSON.stringify(output.Export.Name)).toContain('${AWS::StackName}');
      });
    });
  });

  describe('Security and Best Practices', () => {
    test('all resources should have Delete deletion policy', () => {
      const resourcesWithDeletionPolicy = [
        'SessionTable',
        'TransactionTable',
        'AuditLogBucket',
        'TemplatesBucket',
        'TransactionValidatorECRRepository'
      ];

      resourcesWithDeletionPolicy.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).toBe('Delete');
      });
    });

    test('all DynamoDB tables should have DeletionProtectionEnabled set to false', () => {
      const tables = ['SessionTable', 'TransactionTable'];
      tables.forEach(tableKey => {
        const table = template.Resources[tableKey];
        expect(table.Properties.DeletionProtectionEnabled).toBe(false);
      });
    });

    test('all DynamoDB tables should use PAY_PER_REQUEST billing', () => {
      const tables = ['SessionTable', 'TransactionTable'];
      tables.forEach(tableKey => {
        const table = template.Resources[tableKey];
        expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      });
    });
  });

  describe('Template Completeness', () => {
    test('should have minimum required resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(5);
    });

    test('should have minimum required outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(6);
    });

    test('template should be valid JSON', () => {
      expect(() => JSON.parse(JSON.stringify(template))).not.toThrow();
    });
  });
});
