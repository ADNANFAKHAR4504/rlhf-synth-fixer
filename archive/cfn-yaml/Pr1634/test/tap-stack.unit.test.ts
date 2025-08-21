import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Generate unique test ID for each test run
const testId = crypto.randomBytes(8).toString('hex');
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || `test${testId}`;

describe('TAP Stack CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure and Metadata', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have security-focused description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Secure AWS Infrastructure');
      expect(template.Description).toContain('IAM, KMS, S3, VPC Security Groups, and CloudTrail');
    });

    test('should have required parameters', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters.ProjectName).toBeDefined();
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.ExistingVpcId).toBeDefined();
    });

    test('should have conditional logic for VPC', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.HasExistingVpc).toBeDefined();
    });
  });

  describe('Parameters Configuration', () => {
    test('ProjectName parameter should have correct properties', () => {
      const param = template.Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('myapp');
      expect(param.Description).toContain('Project name for resource naming');
    });

    test('Environment parameter should have correct properties', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('prod');
      expect(param.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    test('ExistingVpcId parameter should be optional', () => {
      const param = template.Parameters.ExistingVpcId;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.Description).toContain('Existing VPC ID');
    });
  });

  describe('KMS Security Resources', () => {
    test('should have KMS key resource with comprehensive policy', () => {
      const kmsKey = template.Resources.DataEncryptionKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.KeyPolicy).toBeDefined();
      expect(kmsKey.Properties.KeyPolicy.Statement).toHaveLength(4);
    });

    test('KMS key should have service access policies', () => {
      const kmsKey = template.Resources.DataEncryptionKey;
      const policy = kmsKey.Properties.KeyPolicy;
      const sids = policy.Statement.map((stmt: any) => stmt.Sid);
      expect(sids).toContain('Enable IAM User Permissions');
      expect(sids).toContain('Allow CloudTrail to encrypt logs');
      expect(sids).toContain('Allow S3 service to use the key');
      expect(sids).toContain('Allow CloudWatch Logs');
    });

    test('should have KMS key alias', () => {
      const alias = template.Resources.DataEncryptionKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/${ProjectName}-data-${Environment}',
      });
    });
  });

  describe('S3 Security Resources', () => {
    test('should have secure data bucket with encryption', () => {
      const bucket = template.Resources.SecureDataBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': '${ProjectName}-secure-data-${Environment}-${AWS::AccountId}',
      });
    });

    test('data bucket should have KMS encryption enabled', () => {
      const bucket = template.Resources.SecureDataBucket;
      const encryption = bucket.Properties.BucketEncryption;
      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('data bucket should block all public access', () => {
      const bucket = template.Resources.SecureDataBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('data bucket should have versioning enabled', () => {
      const bucket = template.Resources.SecureDataBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have access logs bucket with lifecycle policy', () => {
      const bucket = template.Resources.AccessLogsBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.LifecycleConfiguration.Rules).toHaveLength(1);
      expect(bucket.Properties.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(90);
    });

    test('should have CloudTrail bucket with security features', () => {
      const bucket = template.Resources.CloudTrailBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('CloudTrail bucket should have proper bucket policy', () => {
      const policy = template.Resources.CloudTrailBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.PolicyDocument.Statement).toHaveLength(2);
    });
  });

  describe('IAM Security Resources', () => {
    test('should have web server role with least privilege', () => {
      const role = template.Resources.WebServerRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.Policies).toHaveLength(2);
    });

    test('web server role should have S3 access policy', () => {
      const role = template.Resources.WebServerRole;
      const s3Policy = role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'S3ReadOnlyAccess'
      );
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObjectVersion');
    });

    test('web server role should have KMS decrypt access', () => {
      const role = template.Resources.WebServerRole;
      const kmsPolicy = role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'KMSDecryptAccess'
      );
      expect(kmsPolicy).toBeDefined();
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:Decrypt');
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:DescribeKey');
    });

    test('should have instance profile for web servers', () => {
      const profile = template.Resources.WebServerInstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles[0].Ref).toBe('WebServerRole');
    });

    test('should have developer group with limited permissions', () => {
      const group = template.Resources.DeveloperGroup;
      expect(group).toBeDefined();
      expect(group.Type).toBe('AWS::IAM::Group');
      expect(group.Properties.Policies).toHaveLength(2);
    });

    test('should have CloudTrail role with minimal permissions', () => {
      const role = template.Resources.CloudTrailRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.Policies).toHaveLength(1);
    });
  });

  describe('Network Security Resources', () => {
    test('should have conditional security group', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Condition).toBe('HasExistingVpc');
    });

    test('security group should only allow HTTPS inbound', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(443);
      expect(ingress[0].ToPort).toBe(443);
      expect(ingress[0].IpProtocol).toBe('tcp');
    });

    test('security group should have minimal egress rules', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const egress = sg.Properties.SecurityGroupEgress;
      expect(egress).toHaveLength(2);
      expect(egress[0].FromPort).toBe(443); // HTTPS
      expect(egress[1].FromPort).toBe(80); // HTTP for updates
    });
  });

  describe('CloudWatch Logging Resources', () => {
    test('should have S3 access log group with KMS encryption', () => {
      const logGroup = template.Resources.S3AccessLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
      expect(logGroup.Properties.KmsKeyId).toEqual({
        'Fn::GetAtt': ['DataEncryptionKey', 'Arn'],
      });
    });

    test('should have CloudTrail log group with KMS encryption', () => {
      const logGroup = template.Resources.CloudTrailLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(90);
      expect(logGroup.Properties.KmsKeyId).toEqual({
        'Fn::GetAtt': ['DataEncryptionKey', 'Arn'],
      });
    });
  });

  describe('CloudTrail Audit Resources', () => {
    test('should have comprehensive CloudTrail configuration', () => {
      const trail = template.Resources.SecurityAuditTrail;
      expect(trail).toBeDefined();
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
      expect(trail.Properties.IsLogging).toBe(true);
    });

    test('CloudTrail should monitor S3 data events', () => {
      const trail = template.Resources.SecurityAuditTrail;
      const eventSelectors = trail.Properties.EventSelectors;
      expect(eventSelectors).toHaveLength(1);
      expect(eventSelectors[0].DataResources).toHaveLength(1);
      expect(eventSelectors[0].DataResources[0].Type).toBe('AWS::S3::Object');
    });

    test('CloudTrail should have CloudWatch Logs integration', () => {
      const trail = template.Resources.SecurityAuditTrail;
      expect(trail.Properties.CloudWatchLogsLogGroupArn).toEqual({
        'Fn::GetAtt': ['CloudTrailLogGroup', 'Arn'],
      });
      expect(trail.Properties.CloudWatchLogsRoleArn).toEqual({
        'Fn::GetAtt': ['CloudTrailRole', 'Arn'],
      });
    });
  });

  describe('Template Outputs', () => {
    test('should have all core infrastructure outputs', () => {
      const coreOutputs = [
        'KMSKeyId',
        'KMSKeyArn',
        'SecureDataBucketName',
        'WebServerRoleArn',
        'CloudTrailArn',
      ];

      coreOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('should have conditional security group output', () => {
      expect(template.Outputs.WebServerSecurityGroupId).toBeDefined();
      expect(template.Outputs.WebServerSecurityGroupId.Condition).toBe('HasExistingVpc');
    });

    test('outputs should have proper export names', () => {
      const expectedExportNames: { [key: string]: string } = {
        'KMSKeyId': 'KMSKeyId',
        'KMSKeyArn': 'KMSKeyArn', 
        'SecureDataBucketName': 'SecureDataBucket',
        'WebServerSecurityGroupId': 'WebServerSG',
        'WebServerRoleArn': 'WebServerRole',
        'CloudTrailArn': 'CloudTrail'
      };
      
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        const expectedSuffix = expectedExportNames[outputKey] || outputKey;
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${expectedSuffix}`,
        });
      });
    });
  });

  describe('Resource Naming and Conventions', () => {
    test('resources should use account ID for uniqueness', () => {
      const resourcesWithAccountId = [
        'SecureDataBucket',
        'AccessLogsBucket',
        'CloudTrailBucket',
      ];

      resourcesWithAccountId.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const bucketName = resource.Properties.BucketName['Fn::Sub'];
        expect(bucketName).toContain('${AWS::AccountId}');
      });
    });

    test('all resources should be properly tagged', () => {
      const taggedResources = [
        'DataEncryptionKey',
        'SecureDataBucket',
        'AccessLogsBucket',
        'CloudTrailBucket',
        'WebServerRole',
        'WebServerSecurityGroup',
        'SecurityAuditTrail',
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        const tags = resource.Properties.Tags;
        const tagKeys = tags.map((tag: any) => tag.Key);
        expect(tagKeys).toContain('Environment');
      });
    });
  });

  describe('Security Best Practices Validation', () => {
    test('encryption should be enabled for all storage resources', () => {
      // S3 buckets
      expect(template.Resources.SecureDataBucket.Properties.BucketEncryption).toBeDefined();
      expect(template.Resources.AccessLogsBucket.Properties.BucketEncryption).toBeDefined();
      expect(template.Resources.CloudTrailBucket.Properties.BucketEncryption).toBeDefined();

      // CloudWatch Logs
      expect(template.Resources.S3AccessLogGroup.Properties.KmsKeyId).toBeDefined();
      expect(template.Resources.CloudTrailLogGroup.Properties.KmsKeyId).toBeDefined();
    });

    test('all S3 buckets should have public access blocked', () => {
      const s3Buckets = ['SecureDataBucket', 'AccessLogsBucket', 'CloudTrailBucket'];

      s3Buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });
    });

    test('IAM roles should follow principle of least privilege', () => {
      const webServerRole = template.Resources.WebServerRole;
      const policies = webServerRole.Properties.Policies;

      // Should have exactly 2 policies for specific services
      expect(policies).toHaveLength(2);

      // Each policy should be service-specific
      const policyNames = policies.map((p: any) => p.PolicyName);
      expect(policyNames).toContain('S3ReadOnlyAccess');
      expect(policyNames).toContain('KMSDecryptAccess');
    });

    test('network security should be properly configured', () => {
      const securityGroup = template.Resources.WebServerSecurityGroup;

      // Should only allow HTTPS inbound
      const ingress = securityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(443);

      // Should have minimal egress
      const egress = securityGroup.Properties.SecurityGroupEgress;
      expect(egress).toHaveLength(2); // HTTPS + HTTP for updates only
    });

    test('audit logging should be comprehensive', () => {
      const cloudTrail = template.Resources.SecurityAuditTrail;
      expect(cloudTrail.Properties.IsMultiRegionTrail).toBe(true);
      expect(cloudTrail.Properties.EnableLogFileValidation).toBe(true);
      expect(cloudTrail.Properties.EventSelectors[0].IncludeManagementEvents).toBe(true);
      expect(cloudTrail.Properties.EventSelectors[0].ReadWriteType).toBe('All');
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(14); // All security resources from current template
    });

    test('should have all parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });

    test('should have all outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(6); // All outputs from current template
    });
  });
});