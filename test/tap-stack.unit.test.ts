import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Convert YAML to JSON for testing: cfn-flip lib/TapStack.yml > lib/TapStack.json
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have correct description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Secure AWS Infrastructure Foundation with S3, RDS, IAM, and CloudWatch monitoring'
      );
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      const envParam = template.Parameters.EnvironmentSuffix;
      expect(envParam).toBeDefined();
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('dev');
      expect(envParam.Description).toBe(
        'Environment suffix for resource naming'
      );
    });
  });

  describe('Security Resources', () => {
    test('should have DatabaseSecret resource', () => {
      const secret = template.Resources.DatabaseSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString).toBeDefined();
    });

    test('should have S3 KMS Key', () => {
      const s3Key = template.Resources.S3KMSKey;
      expect(s3Key).toBeDefined();
      expect(s3Key.Type).toBe('AWS::KMS::Key');
      expect(s3Key.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have RDS KMS Key', () => {
      const rdsKey = template.Resources.RDSKMSKey;
      expect(rdsKey).toBeDefined();
      expect(rdsKey.Type).toBe('AWS::KMS::Key');
      expect(rdsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have KMS Key Aliases', () => {
      expect(template.Resources.S3KMSKeyAlias).toBeDefined();
      expect(template.Resources.S3KMSKeyAlias.Type).toBe('AWS::KMS::Alias');
      expect(template.Resources.RDSKMSKeyAlias).toBeDefined();
      expect(template.Resources.RDSKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe('S3 Resources', () => {
    test('should have LoggingBucket with security controls', () => {
      const bucket = template.Resources.LoggingBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have ApplicationBucket with security controls', () => {
      const bucket = template.Resources.ApplicationBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.LoggingConfiguration).toBeDefined();
    });

    test('should have S3 bucket policies', () => {
      expect(template.Resources.LoggingBucketPolicy).toBeDefined();
      expect(template.Resources.LoggingBucketPolicy.Type).toBe(
        'AWS::S3::BucketPolicy'
      );
      expect(template.Resources.ApplicationBucketPolicy).toBeDefined();
      expect(template.Resources.ApplicationBucketPolicy.Type).toBe(
        'AWS::S3::BucketPolicy'
      );
    });
  });

  describe('VPC and Networking', () => {
    test('should have VPC with correct configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have private subnets in multiple AZs', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have DB subnet group', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
    });

    test('should have security groups', () => {
      expect(template.Resources.DBSecurityGroup).toBeDefined();
      expect(template.Resources.DBSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
      expect(template.Resources.ApplicationSecurityGroup).toBeDefined();
      expect(template.Resources.ApplicationSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });
  });

  describe('RDS Database', () => {
    test('should have encrypted RDS database', () => {
      const database = template.Resources.Database;
      expect(database).toBeDefined();
      expect(database.Type).toBe('AWS::RDS::DBInstance');
      expect(database.Properties.StorageEncrypted).toBe(true);
      expect(database.Properties.DeletionProtection).toBe(false);
      expect(database.DeletionPolicy).toBe('Delete');
    });

    test('should use Secrets Manager for database credentials', () => {
      const database = template.Resources.Database;
      const masterUsername = database.Properties.MasterUsername;
      const masterPassword = database.Properties.MasterUserPassword;

      expect(masterUsername['Fn::Sub']).toContain('resolve:secretsmanager:');
      expect(masterPassword['Fn::Sub']).toContain('resolve:secretsmanager:');
    });

    test('should have enhanced monitoring enabled', () => {
      const database = template.Resources.Database;
      expect(database.Properties.MonitoringInterval).toBe(60);
      expect(database.Properties.MonitoringRoleArn).toBeDefined();
    });
  });

  describe('IAM Roles', () => {
    test('should have S3AccessRole with least privilege', () => {
      const role = template.Resources.S3AccessRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.Policies).toBeDefined();
    });

    test('should have RDSEnhancedMonitoringRole', () => {
      const role = template.Resources.RDSEnhancedMonitoringRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
      );
    });

    test('should have CloudWatchRole', () => {
      const role = template.Resources.CloudWatchRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have SNS topic for alerts', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.KmsMasterKeyId).toBe('alias/aws/sns');
    });

    test('should have CloudWatch log groups', () => {
      expect(template.Resources.S3AccessLogGroup).toBeDefined();
      expect(template.Resources.S3AccessLogGroup.Type).toBe(
        'AWS::Logs::LogGroup'
      );
      expect(template.Resources.RDSLogGroup).toBeDefined();
      expect(template.Resources.RDSLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.CloudTrailLogGroup).toBeDefined();
      expect(template.Resources.CloudTrailLogGroup.Type).toBe(
        'AWS::Logs::LogGroup'
      );
    });

    test('should have security monitoring alarms', () => {
      expect(template.Resources.UnauthorizedS3AccessAlarm).toBeDefined();
      expect(template.Resources.DatabaseConnectionFailureAlarm).toBeDefined();
      expect(template.Resources.HighErrorRateAlarm).toBeDefined();
      expect(template.Resources.KMSKeyUsageAlarm).toBeDefined();
      expect(template.Resources.FailedLoginAlarm).toBeDefined();
    });
  });

  describe('CloudTrail', () => {
    test('should have CloudTrail for audit logging', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail).toBeDefined();
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('should have failed login metric filter', () => {
      const filter = template.Resources.FailedLoginMetricFilter;
      expect(filter).toBeDefined();
      expect(filter.Type).toBe('AWS::Logs::MetricFilter');
      expect(filter.Properties.FilterPattern).toContain(
        'UnauthorizedOperation'
      );
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'ApplicationBucketName',
        'DatabaseEndpoint',
        'S3KMSKeyId',
        'CloudTrailArn',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have descriptions and export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(output.Value).toBeDefined();
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
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

    test('should have expected number of resources for comprehensive infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(25); // We have 30+ resources
    });

    test('should have one parameter for configuration', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1); // ProjectId only
    });

    test('should have five outputs for integration', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(5); // VPCId, ApplicationBucketName, DatabaseEndpoint, S3KMSKeyId, CloudTrailArn
    });
  });

  describe('Security Best Practices', () => {
    test('all S3 buckets should have encryption enabled', () => {
      const s3Resources = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::S3::Bucket'
      );

      s3Resources.forEach(bucketKey => {
        const bucket = template.Resources[bucketKey];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      });
    });

    test('all KMS keys should have key rotation enabled', () => {
      const kmsKeys = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::KMS::Key'
      );

      kmsKeys.forEach(keyId => {
        const key = template.Resources[keyId];
        expect(key.Properties.EnableKeyRotation).toBe(true);
      });
    });

    test('database should use encryption at rest', () => {
      const database = template.Resources.Database;
      expect(database.Properties.StorageEncrypted).toBe(true);
      expect(database.Properties.KmsKeyId).toBeDefined();
    });

    test('database should not be publicly accessible', () => {
      const database = template.Resources.Database;
      expect(database.Properties.PubliclyAccessible).toBe(false);
    });
  });
});
