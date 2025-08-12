import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If you're testing a yaml template, run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
      expect(template.Description).toBe(
        'Highly secure cloud infrastructure with encrypted S3 buckets, least-privilege IAM roles, and comprehensive CloudWatch logging'
      );
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('prod');
      expect(envParam.Description).toBe('Environment name for resource tagging');
      expect(envParam.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });
  });

  describe('KMS Resources', () => {
    test('should have SecureAppKMSKey resource', () => {
      expect(template.Resources.SecureAppKMSKey).toBeDefined();
    });

    test('SecureAppKMSKey should be a KMS key', () => {
      const kmsKey = template.Resources.SecureAppKMSKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
    });

    test('SecureAppKMSKey should have correct properties', () => {
      const kmsKey = template.Resources.SecureAppKMSKey;
      const properties = kmsKey.Properties;

      expect(properties.Description).toBe('KMS key for SecureApp S3 bucket encryption');
      expect(properties.KeyPolicy.Version).toBe('2012-10-17');
      expect(properties.KeyPolicy.Statement).toHaveLength(2);
    });

    test('should have SecureAppKMSKeyAlias resource', () => {
      expect(template.Resources.SecureAppKMSKeyAlias).toBeDefined();
    });

    test('SecureAppKMSKeyAlias should be a KMS alias', () => {
      const alias = template.Resources.SecureAppKMSKeyAlias;
      expect(alias.Type).toBe('AWS::KMS::Alias');
    });

    test('SecureAppKMSKeyAlias should reference the KMS key', () => {
      const alias = template.Resources.SecureAppKMSKeyAlias;
      expect(alias.Properties.AliasName).toBe('alias/secureapp-s3-encryption-key');
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'SecureAppKMSKey' });
    });
  });

  describe('S3 Bucket Resources', () => {
    test('should have SecureAppDataBucket resource', () => {
      expect(template.Resources.SecureAppDataBucket).toBeDefined();
    });

    test('SecureAppDataBucket should be an S3 bucket', () => {
      const bucket = template.Resources.SecureAppDataBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('SecureAppDataBucket should have KMS encryption enabled', () => {
      const bucket = template.Resources.SecureAppDataBucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'SecureAppKMSKey' });
      expect(encryption.BucketKeyEnabled).toBe(true);
    });

    test('SecureAppDataBucket should have public access blocked', () => {
      const bucket = template.Resources.SecureAppDataBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('SecureAppDataBucket should have versioning enabled', () => {
      const bucket = template.Resources.SecureAppDataBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have SecureAppLogsBucket resource', () => {
      expect(template.Resources.SecureAppLogsBucket).toBeDefined();
    });

    test('SecureAppLogsBucket should have lifecycle configuration', () => {
      const bucket = template.Resources.SecureAppLogsBucket;
      const lifecycle = bucket.Properties.LifecycleConfiguration.Rules[0];
      
      expect(lifecycle.Id).toBe('DeleteOldLogs');
      expect(lifecycle.Status).toBe('Enabled');
      expect(lifecycle.ExpirationInDays).toBe(90);
    });

    test('should have SecureAppLogsBucketPolicy resource', () => {
      expect(template.Resources.SecureAppLogsBucketPolicy).toBeDefined();
    });

    test('SecureAppLogsBucketPolicy should be an S3 bucket policy', () => {
      const policy = template.Resources.SecureAppLogsBucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('SecureAppLogsBucketPolicy should allow CloudTrail access', () => {
      const policy = template.Resources.SecureAppLogsBucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      
      expect(statements).toHaveLength(3);
      
      const aclCheckStatement = statements.find((s: any) => s.Sid === 'CloudTrailAclCheck');
      expect(aclCheckStatement).toBeDefined();
      expect(aclCheckStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
      expect(aclCheckStatement.Action).toBe('s3:GetBucketAcl');
      
      const writeStatement = statements.find((s: any) => s.Sid === 'CloudTrailWrite');
      expect(writeStatement).toBeDefined();
      expect(writeStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
      expect(writeStatement.Action).toBe('s3:PutObject');
      expect(writeStatement.Resource).toEqual({
        'Fn::Sub': '${SecureAppLogsBucket.Arn}/cloudtrail-logs/*'
      });
      
      const logDeliveryStatement = statements.find((s: any) => s.Sid === 'CloudTrailLogDeliveryWrite');
      expect(logDeliveryStatement).toBeDefined();
      expect(logDeliveryStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
      expect(logDeliveryStatement.Action).toBe('s3:PutObject');
      expect(logDeliveryStatement.Resource).toEqual({
        'Fn::Sub': '${SecureAppLogsBucket.Arn}/cloudtrail-logs/*'
      });
    });

    test('should have SecureAppBackupBucket resource', () => {
      expect(template.Resources.SecureAppBackupBucket).toBeDefined();
    });

    test('SecureAppBackupBucket should have versioning enabled', () => {
      const bucket = template.Resources.SecureAppBackupBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });
  });

  describe('IAM Role Resources', () => {
    test('should have SecureAppReadOnlyRole resource', () => {
      expect(template.Resources.SecureAppReadOnlyRole).toBeDefined();
    });

    test('SecureAppReadOnlyRole should be an IAM role', () => {
      const role = template.Resources.SecureAppReadOnlyRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('SecureAppReadOnlyRole should have correct assume role policy', () => {
      const role = template.Resources.SecureAppReadOnlyRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      
      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement).toHaveLength(2);
    });

    test('should have SecureAppReadOnlyPolicy resource', () => {
      expect(template.Resources.SecureAppReadOnlyPolicy).toBeDefined();
    });

    test('SecureAppReadOnlyPolicy should be an IAM policy', () => {
      const policy = template.Resources.SecureAppReadOnlyPolicy;
      expect(policy.Type).toBe('AWS::IAM::Policy');
    });

    test('should have SecureAppReadWriteRole resource', () => {
      expect(template.Resources.SecureAppReadWriteRole).toBeDefined();
    });

    test('should have SecureAppReadWritePolicy resource', () => {
      expect(template.Resources.SecureAppReadWritePolicy).toBeDefined();
    });

    test('should have SecureAppBackupRole resource', () => {
      expect(template.Resources.SecureAppBackupRole).toBeDefined();
    });

    test('should have SecureAppBackupPolicy resource', () => {
      expect(template.Resources.SecureAppBackupPolicy).toBeDefined();
    });
  });

  describe('CloudWatch Log Resources', () => {
    test('should have SecureAppS3LogGroup resource', () => {
      expect(template.Resources.SecureAppS3LogGroup).toBeDefined();
    });

    test('SecureAppS3LogGroup should be a CloudWatch log group', () => {
      const logGroup = template.Resources.SecureAppS3LogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('SecureAppS3LogGroup should have correct properties', () => {
      const logGroup = template.Resources.SecureAppS3LogGroup;
      expect(logGroup.Properties.LogGroupName).toBe('/secureapp/s3-events');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should have SecureAppCloudFormationLogGroup resource', () => {
      expect(template.Resources.SecureAppCloudFormationLogGroup).toBeDefined();
    });

    test('SecureAppCloudFormationLogGroup should have 90-day retention', () => {
      const logGroup = template.Resources.SecureAppCloudFormationLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(90);
    });

    test('should have SecureAppApplicationLogGroup resource', () => {
      expect(template.Resources.SecureAppApplicationLogGroup).toBeDefined();
    });

    test('SecureAppApplicationLogGroup should have 90-day retention', () => {
      const logGroup = template.Resources.SecureAppApplicationLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(90);
    });
  });

  describe('CloudTrail Resource', () => {
    test('should have SecureAppCloudTrail resource', () => {
      expect(template.Resources.SecureAppCloudTrail).toBeDefined();
    });

    test('SecureAppCloudTrail should be a CloudTrail', () => {
      const trail = template.Resources.SecureAppCloudTrail;
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
    });

    test('SecureAppCloudTrail should have correct properties', () => {
      const trail = template.Resources.SecureAppCloudTrail;
      const properties = trail.Properties;
      
      expect(properties.TrailName).toBe('secureapp-cloudtrail');
      expect(properties.S3BucketName).toEqual({ Ref: 'SecureAppLogsBucket' });
      expect(properties.IncludeGlobalServiceEvents).toBe(true);
      expect(properties.IsLogging).toBe(true);
      expect(properties.IsMultiRegionTrail).toBe(false);
      expect(properties.EnableLogFileValidation).toBe(true);
    });

    test('SecureAppCloudTrail should have correct event selectors', () => {
      const trail = template.Resources.SecureAppCloudTrail;
      const eventSelector = trail.Properties.EventSelectors[0];
      
      expect(eventSelector.ReadWriteType).toBe('All');
      expect(eventSelector.IncludeManagementEvents).toBe(true);
      expect(eventSelector.DataResources).toBeUndefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'DataBucketName',
        'BackupBucketName',
        'LogsBucketName',
        'KMSKeyId',
        'KMSKeyAlias',
        'ReadOnlyRoleArn',
        'ReadWriteRoleArn',
        'BackupRoleArn',
        'S3LogGroupName',
        'CloudFormationLogGroupName',
        'ApplicationLogGroupName',
        'CloudTrailName',
        'StackName',
        'Environment'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('DataBucketName output should be correct', () => {
      const output = template.Outputs.DataBucketName;
      expect(output.Description).toBe('Name of the primary data bucket');
      expect(output.Value).toEqual({ Ref: 'SecureAppDataBucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-DataBucket',
      });
    });

    test('KMSKeyId output should be correct', () => {
      const output = template.Outputs.KMSKeyId;
      expect(output.Description).toBe('KMS Key ID for S3 encryption');
      expect(output.Value).toEqual({ Ref: 'SecureAppKMSKey' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-KMSKey',
      });
    });

    test('ReadOnlyRoleArn output should be correct', () => {
      const output = template.Outputs.ReadOnlyRoleArn;
      expect(output.Description).toBe('ARN of the read-only IAM role');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['SecureAppReadOnlyRole', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ReadOnlyRole',
      });
    });

    test('StackName output should be correct', () => {
      const output = template.Outputs.StackName;
      expect(output.Description).toBe('Name of this CloudFormation stack');
      expect(output.Value).toEqual({ Ref: 'AWS::StackName' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-StackName',
      });
    });

    test('Environment output should be correct', () => {
      const output = template.Outputs.Environment;
      expect(output.Description).toBe('Environment name used for this deployment');
      expect(output.Value).toEqual({ Ref: 'Environment' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-Environment',
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

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(16); // KMS Key, KMS Alias, 3 S3 Buckets, 1 S3 Bucket Policy, 3 IAM Roles, 3 IAM Policies, 3 CloudWatch Log Groups, 1 CloudTrail
    });

    test('should have exactly one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have exactly fourteen outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(14);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resource names should be prefixed with secureapp', () => {
      const resourceNames = Object.keys(template.Resources);
      resourceNames.forEach(name => {
        expect(name).toMatch(/^SecureApp/);
      });
    });

    test('export names should follow naming convention', () => {
      // Define the expected export name mapping
      const exportNameMapping: { [key: string]: string } = {
        'DataBucketName': 'DataBucket',
        'BackupBucketName': 'BackupBucket',
        'LogsBucketName': 'LogsBucket',
        'KMSKeyId': 'KMSKey',
        'KMSKeyAlias': 'KMSKeyAlias',
        'ReadOnlyRoleArn': 'ReadOnlyRole',
        'ReadWriteRoleArn': 'ReadWriteRole',
        'BackupRoleArn': 'BackupRole',
        'S3LogGroupName': 'S3LogGroup',
        'CloudFormationLogGroupName': 'CFLogGroup',
        'ApplicationLogGroupName': 'AppLogGroup',
        'CloudTrailName': 'CloudTrail',
        'StackName': 'StackName',
        'Environment': 'Environment'
      };

      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        const expectedExportName = exportNameMapping[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${expectedExportName}`,
        });
      });
    });
  });

  describe('Security Best Practices', () => {
    test('all S3 buckets should have encryption enabled', () => {
      const s3Buckets = ['SecureAppDataBucket', 'SecureAppLogsBucket', 'SecureAppBackupBucket'];
      
      s3Buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
        expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'SecureAppKMSKey' });
      });
    });

    test('all S3 buckets should have public access blocked', () => {
      const s3Buckets = ['SecureAppDataBucket', 'SecureAppLogsBucket', 'SecureAppBackupBucket'];
      
      s3Buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });
    });

    test('IAM policies should follow least privilege principle', () => {
      const policies = ['SecureAppReadOnlyPolicy', 'SecureAppReadWritePolicy', 'SecureAppBackupPolicy'];
      
      policies.forEach(policyName => {
        const policy = template.Resources[policyName];
        const statements = policy.Properties.PolicyDocument.Statement;
        
        statements.forEach((statement: any) => {
          expect(statement.Effect).toBe('Allow');
          expect(statement.Action).toBeDefined();
          expect(statement.Resource).toBeDefined();
        });
      });
    });
  });
});
