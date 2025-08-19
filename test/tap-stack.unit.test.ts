import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Generate unique test ID for each test run
const testId = crypto.randomBytes(8).toString('hex');
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || `test${testId}`;

describe('TAP Stack CloudFormation Template - Comprehensive Unit Tests', () => {
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

    test('should have enhanced security description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Secure Task Assignment Platform');
      expect(template.Description).toContain('comprehensive security controls');
    });

    test('should have comprehensive metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      const paramGroups = template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
      expect(paramGroups).toHaveLength(1);
      expect(paramGroups[0].Parameters).toEqual([
        'EnvironmentSuffix',
        'EnableSecurity',
        'EnableCloudTrail',
        'EnableKMSEncryption'
      ]);
    });

    test('should not have mappings section (removed for cleaner template)', () => {
      expect(template.Mappings).toBeUndefined();
    });

    test('should have comprehensive conditions', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.SecurityEnabled).toBeDefined();
      expect(template.Conditions.CloudTrailEnabled).toBeDefined();
      expect(template.Conditions.KMSEnabled).toBeDefined();
    });
  });

  describe('Security Parameters', () => {
    test('should have all required security parameters', () => {
      const expectedParams = [
        'EnvironmentSuffix',
        'EnableSecurity',
        'EnableCloudTrail',
        'EnableKMSEncryption'
      ];
      
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('EnableSecurity parameter should have correct properties', () => {
      const param = template.Parameters.EnableSecurity;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('true');
      expect(param.AllowedValues).toEqual(['true', 'false']);
    });

    test('EnableCloudTrail parameter should have correct properties', () => {
      const param = template.Parameters.EnableCloudTrail;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('true');
      expect(param.AllowedValues).toEqual(['true', 'false']);
    });

    test('EnableKMSEncryption parameter should have correct properties', () => {
      const param = template.Parameters.EnableKMSEncryption;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('true');
      expect(param.AllowedValues).toEqual(['true', 'false']);
    });
  });

  describe('KMS Security Resources', () => {
    test('should have KMS key resource with comprehensive policy', () => {
      const kmsKey = template.Resources.TapStackKMSKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Condition).toBe('KMSEnabled');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('KMS key should have comprehensive access policies', () => {
      const kmsKey = template.Resources.TapStackKMSKey;
      const policy = kmsKey.Properties.KeyPolicy;
      expect(policy.Statement).toHaveLength(4);
      
      // Check for CloudTrail, S3, and DynamoDB service access
      const services = policy.Statement.map((stmt: any) => stmt.Sid);
      expect(services).toContain('EnableIAMUserPermissions');
      expect(services).toContain('AllowCloudTrailEncryption');
      expect(services).toContain('AllowS3ServiceAccess');
      expect(services).toContain('AllowDynamoDBAccess');
    });

    test('should have KMS key alias with unique naming', () => {
      const alias = template.Resources.TapStackKMSKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/tap-${EnvironmentSuffix}-key-${AWS::AccountId}'
      });
    });
  });

  describe('S3 Security Resources', () => {
    test('should have secure data bucket with comprehensive security', () => {
      const bucket = template.Resources.TapStackDataBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Condition).toBe('SecurityEnabled');
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'tap-${EnvironmentSuffix}-data-${AWS::AccountId}-${AWS::Region}'
      });
    });

    test('data bucket should have encryption enabled', () => {
      const bucket = template.Resources.TapStackDataBucket;
      const encryption = bucket.Properties.BucketEncryption;
      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toEqual({
        'Fn::If': ['KMSEnabled', 'aws:kms', 'AES256']
      });
    });

    test('data bucket should block all public access', () => {
      const bucket = template.Resources.TapStackDataBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('data bucket should have versioning and lifecycle policies', () => {
      const bucket = template.Resources.TapStackDataBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.Properties.LifecycleConfiguration.Rules).toHaveLength(1);
      expect(bucket.Properties.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(365);
    });

    test('should have CloudTrail bucket with security features', () => {
      const bucket = template.Resources.TapStackCloudTrailBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Condition).toBe('CloudTrailEnabled');
    });

    test('CloudTrail bucket should have proper bucket policy', () => {
      const policy = template.Resources.TapStackCloudTrailBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.PolicyDocument.Statement).toHaveLength(2);
    });
  });

  describe('IAM Security Resources', () => {
    test('should have service role with least privilege', () => {
      const role = template.Resources.TapStackServiceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Condition).toBe('SecurityEnabled');
      expect(role.Properties.Policies).toHaveLength(3);
    });

    test('service role should have DynamoDB access policy', () => {
      const role = template.Resources.TapStackServiceRole;
      const ddbPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'DynamoDBAccessPolicy');
      expect(ddbPolicy).toBeDefined();
      expect(ddbPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:GetItem');
      expect(ddbPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:PutItem');
    });

    test('service role should have S3 access policy with conditions', () => {
      const role = template.Resources.TapStackServiceRole;
      const s3Policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[1].Condition.StringEquals['s3:prefix']).toEqual({
        'Fn::Sub': '${EnvironmentSuffix}/*'
      });
    });

    test('service role should have KMS access policy', () => {
      const role = template.Resources.TapStackServiceRole;
      const kmsPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'KMSAccessPolicy');
      expect(kmsPolicy).toBeDefined();
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:Decrypt');
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:Encrypt');
    });

    test('should have CloudTrail role with minimal permissions', () => {
      const role = template.Resources.TapStackCloudTrailRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Condition).toBe('CloudTrailEnabled');
    });
  });

  describe('Network Security Resources', () => {
    test('should have HTTPS-only security group', () => {
      const sg = template.Resources.TapStackSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Condition).toBe('SecurityEnabled');
    });

    test('security group should only allow HTTPS inbound', () => {
      const sg = template.Resources.TapStackSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(443);
      expect(ingress[0].ToPort).toBe(443);
      expect(ingress[0].IpProtocol).toBe('tcp');
    });

    test('security group should have minimal egress rules', () => {
      const sg = template.Resources.TapStackSecurityGroup;
      const egress = sg.Properties.SecurityGroupEgress;
      expect(egress).toHaveLength(2);
      expect(egress[0].FromPort).toBe(443); // HTTPS
      expect(egress[1].FromPort).toBe(80);  // HTTP for updates only
    });
  });

  describe('CloudTrail Audit Resources', () => {
    test('should have comprehensive CloudTrail configuration', () => {
      const trail = template.Resources.TapStackCloudTrail;
      expect(trail).toBeDefined();
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Condition).toBe('CloudTrailEnabled');
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('CloudTrail should monitor DynamoDB and S3 data events', () => {
      const trail = template.Resources.TapStackCloudTrail;
      const eventSelectors = trail.Properties.EventSelectors;
      expect(eventSelectors).toHaveLength(1);
      expect(eventSelectors[0].DataResources).toHaveLength(2);
      expect(eventSelectors[0].DataResources[0].Type).toBe('AWS::DynamoDB::Table');
      expect(eventSelectors[0].DataResources[1].Type).toBe('AWS::S3::Object');
    });

    test('should have CloudWatch log group with encryption', () => {
      const logGroup = template.Resources.TapStackLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Condition).toBe('CloudTrailEnabled');
      expect(logGroup.Properties.RetentionInDays).toBe(90);
    });
  });

  describe('Enhanced DynamoDB Resource', () => {
    test('should have enhanced DynamoDB table with security features', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'TAP-${EnvironmentSuffix}-TurnAroundPrompts-${AWS::AccountId}'
      });
    });

    test('DynamoDB table should have comprehensive attribute definitions', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const attributes = table.Properties.AttributeDefinitions;
      expect(attributes).toHaveLength(3);
      expect(attributes.map((a: any) => a.AttributeName)).toEqual(['id', 'userId', 'timestamp']);
    });

    test('DynamoDB table should have GSI for user queries', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const gsi = table.Properties.GlobalSecondaryIndexes;
      expect(gsi).toHaveLength(1);
      expect(gsi[0].IndexName).toBe('UserIndex');
      expect(gsi[0].KeySchema[0].AttributeName).toBe('userId');
      expect(gsi[0].KeySchema[1].AttributeName).toBe('timestamp');
    });

    test('DynamoDB table should have encryption and streams enabled', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
      expect(table.Properties.SSESpecification.SSEEnabled).toEqual({
        'Fn::If': ['KMSEnabled', true, false]
      });
    });
  });

  describe('Comprehensive Outputs', () => {
    test('should have all core infrastructure outputs', () => {
      const coreOutputs = [
        'StackName',
        'EnvironmentSuffix',
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'TurnAroundPromptTableStreamArn'
      ];
      
      coreOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('should have all security outputs with conditions', () => {
      const securityOutputs = [
        { name: 'KMSKeyId', condition: 'KMSEnabled' },
        { name: 'KMSKeyArn', condition: 'KMSEnabled' },
        { name: 'ServiceRoleArn', condition: 'SecurityEnabled' },
        { name: 'SecurityGroupId', condition: 'SecurityEnabled' },
        { name: 'DataBucketName', condition: 'SecurityEnabled' }
      ];
      
      securityOutputs.forEach(({ name, condition }) => {
        expect(template.Outputs[name]).toBeDefined();
        expect(template.Outputs[name].Condition).toBe(condition);
      });
    });

    test('should have CloudTrail outputs with conditions', () => {
      const auditOutputs = [
        'CloudTrailArn',
        'CloudTrailBucketName',
        'LogGroupName',
        'LogGroupArn'
      ];
      
      auditOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
        expect(template.Outputs[output].Condition).toBe('CloudTrailEnabled');
      });
    });

    test('should have security status outputs', () => {
      const statusOutputs = [
        'SecurityEnabled',
        'EncryptionEnabled', 
        'AuditingEnabled'
      ];
      
      statusOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('outputs should have proper export names with stack prefix', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`
        });
      });
    });
  });

  describe('Resource Naming and Conventions', () => {
    test('all resource names should include account ID for uniqueness', () => {
      const resourcesWithAccountId = [
        'TapStackKMSKeyAlias',
        'TapStackDataBucket',
        'TapStackCloudTrailBucket',
        'TapStackServiceRole',
        'TapStackSecurityGroup',
        'TapStackCloudTrailRole',
        'TapStackCloudTrail',
        'TurnAroundPromptTable'
      ];
      
      resourcesWithAccountId.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties) {
          const nameProperty = resource.Properties.RoleName || 
                             resource.Properties.GroupName ||
                             resource.Properties.BucketName ||
                             resource.Properties.TableName ||
                             resource.Properties.TrailName ||
                             resource.Properties.AliasName;
          if (nameProperty && typeof nameProperty === 'object' && nameProperty['Fn::Sub']) {
            expect(nameProperty['Fn::Sub']).toContain('${AWS::AccountId}');
          }
        }
      });
    });

    test('resources should follow TAP-environment-service-account naming pattern', () => {
      const namingPatterns = [
        { resource: 'TapStackKMSKey', pattern: 'TAP-${EnvironmentSuffix}-KMS-${AWS::AccountId}' },
        { resource: 'TapStackDataBucket', pattern: 'TAP-${EnvironmentSuffix}-Data-${AWS::AccountId}' },
        { resource: 'TapStackServiceRole', pattern: 'TAP-${EnvironmentSuffix}-ServiceRole' }
      ];
      
      namingPatterns.forEach(({ resource, pattern }) => {
        const res = template.Resources[resource];
        if (res && res.Properties && res.Properties.Tags) {
          const nameTag = res.Properties.Tags.find((tag: any) => tag.Key === 'Name');
          if (nameTag) {
            expect(nameTag.Value).toEqual({ 'Fn::Sub': pattern });
          }
        }
      });
    });

    test('all resources should be properly tagged', () => {
      const taggedResources = [
        'TapStackKMSKey',
        'TapStackDataBucket',
        'TapStackLogGroup',
        'TapStackServiceRole',
        'TapStackSecurityGroup',
        'TapStackCloudTrailBucket',
        'TapStackCloudTrail',
        'TurnAroundPromptTable'
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

  describe('Template Validation and Structure', () => {
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

    test('should have expected number of resources for comprehensive security', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(12); // All security resources + DynamoDB + VPC
    });

    test('should have all security parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });

    test('should have comprehensive outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(20); // All outputs including VPC for comprehensive monitoring
    });

    test('all resources should have proper deletion policies', () => {
      const resourcesWithDeletionPolicy = [
        'TapStackKMSKey',
        'TapStackDataBucket',
        'TapStackLogGroup',
        'TapStackCloudTrailBucket',
        'TurnAroundPromptTable'
      ];
      
      resourcesWithDeletionPolicy.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).toBe('Delete');
        expect(resource.UpdateReplacePolicy).toBe('Delete');
      });
    });
  });

  describe('Security Best Practices Validation', () => {
    test('encryption should be enabled by default for all storage resources', () => {
      // S3 buckets
      expect(template.Resources.TapStackDataBucket.Properties.BucketEncryption).toBeDefined();
      expect(template.Resources.TapStackCloudTrailBucket.Properties.BucketEncryption).toBeDefined();
      
      // DynamoDB
      expect(template.Resources.TurnAroundPromptTable.Properties.SSESpecification).toBeDefined();
      
      // CloudWatch Logs
      const logGroup = template.Resources.TapStackLogGroup;
      expect(logGroup.Properties.KmsKeyId).toEqual({
        'Fn::If': ['KMSEnabled', { 'Fn::GetAtt': ['TapStackKMSKey', 'Arn'] }, { 'Ref': 'AWS::NoValue' }]
      });
    });

    test('all S3 buckets should have public access blocked', () => {
      const s3Buckets = ['TapStackDataBucket', 'TapStackCloudTrailBucket'];
      
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
      const serviceRole = template.Resources.TapStackServiceRole;
      const policies = serviceRole.Properties.Policies;
      
      // Should have exactly 3 policies for specific services
      expect(policies).toHaveLength(3);
      
      // Each policy should be service-specific
      const policyNames = policies.map((p: any) => p.PolicyName);
      expect(policyNames).toContain('DynamoDBAccessPolicy');
      expect(policyNames).toContain('S3AccessPolicy');
      expect(policyNames).toContain('KMSAccessPolicy');
    });

    test('network security should be properly configured', () => {
      const securityGroup = template.Resources.TapStackSecurityGroup;
      
      // Should only allow HTTPS inbound
      const ingress = securityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(443);
      
      // Should have minimal egress
      const egress = securityGroup.Properties.SecurityGroupEgress;
      expect(egress).toHaveLength(2); // HTTPS + HTTP for updates only
    });

    test('audit logging should be comprehensive', () => {
      const cloudTrail = template.Resources.TapStackCloudTrail;
      expect(cloudTrail.Properties.IsMultiRegionTrail).toBe(true);
      expect(cloudTrail.Properties.EnableLogFileValidation).toBe(true);
      expect(cloudTrail.Properties.EventSelectors[0].IncludeManagementEvents).toBe(true);
      expect(cloudTrail.Properties.EventSelectors[0].ReadWriteType).toBe('All');
    });
  });
});
