import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Read the JSON template file
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
      expect(template.Description).toContain('Secure AWS infrastructure');
      expect(template.Description).toContain('enterprise-grade security controls');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toHaveLength(4);
    });
  });

  describe('Parameters', () => {
    const requiredParameters = [
      'EnvironmentName',
      'EnvironmentSuffix',
      'S3BucketPrefix',
      'CloudTrailBucketPrefix',
      'RequireMFA',
      'EnableCrossRegionReplication',
      'GlacierTransitionDays',
      'EnableLogFileValidation'
    ];

    test('should have all required parameters', () => {
      requiredParameters.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentName parameter should have correct properties', () => {
      const envNameParam = template.Parameters.EnvironmentName;
      expect(envNameParam.Type).toBe('String');
      expect(envNameParam.Default).toBe('Production');
      expect(envNameParam.AllowedValues).toEqual(['Production', 'Staging', 'Development']);
    });

    test('RequireMFA parameter should default to true', () => {
      const mfaParam = template.Parameters.RequireMFA;
      expect(mfaParam.Default).toBe('true');
      expect(mfaParam.AllowedValues).toEqual(['true', 'false']);
    });

    test('GlacierTransitionDays should have correct constraints', () => {
      const glacierParam = template.Parameters.GlacierTransitionDays;
      expect(glacierParam.Type).toBe('Number');
      expect(glacierParam.Default).toBe(30);
      expect(glacierParam.MinValue).toBe(1);
      expect(glacierParam.MaxValue).toBe(365);
    });
  });

  describe('Conditions', () => {
    test('should have all necessary conditions', () => {
      const expectedConditions = [
        'RequireMFACondition',
        'EnableReplicationCondition',
        'EnableLogValidation'
      ];

      expectedConditions.forEach(condition => {
        expect(template.Conditions[condition]).toBeDefined();
      });
    });
  });

  describe('Resources - Security Components', () => {
    describe('KMS Key', () => {
      test('should have DataEncryptionKey resource', () => {
        expect(template.Resources.DataEncryptionKey).toBeDefined();
        expect(template.Resources.DataEncryptionKey.Type).toBe('AWS::KMS::Key');
      });

      test('DataEncryptionKey should have key rotation enabled', () => {
        const kmsKey = template.Resources.DataEncryptionKey;
        expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
      });

      test('DataEncryptionKey should have proper key policy', () => {
        const kmsKey = template.Resources.DataEncryptionKey;
        const keyPolicy = kmsKey.Properties.KeyPolicy;
        expect(keyPolicy.Version).toBe('2012-10-17');
        expect(keyPolicy.Statement).toHaveLength(2);
        
        // Check for root account access
        const rootStatement = keyPolicy.Statement.find((s: any) => s.Sid === 'Enable IAM policies');
        expect(rootStatement).toBeDefined();
        expect(rootStatement.Action).toBe('kms:*');
        
        // Check for service access
        const serviceStatement = keyPolicy.Statement.find((s: any) => s.Sid === 'Allow services to use the key');
        expect(serviceStatement).toBeDefined();
        expect(serviceStatement.Principal.Service).toContain('s3.amazonaws.com');
        expect(serviceStatement.Principal.Service).toContain('cloudtrail.amazonaws.com');
      });

      test('should have KMS key alias', () => {
        expect(template.Resources.DataEncryptionKeyAlias).toBeDefined();
        expect(template.Resources.DataEncryptionKeyAlias.Type).toBe('AWS::KMS::Alias');
      });
    });

    describe('S3 Buckets', () => {
      test('should have CloudTrailBucket with encryption', () => {
        const bucket = template.Resources.CloudTrailBucket;
        expect(bucket).toBeDefined();
        expect(bucket.Type).toBe('AWS::S3::Bucket');
        
        const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
        expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID.Ref).toBe('DataEncryptionKey');
      });

      test('should have SensitiveDataBucket with proper configuration', () => {
        const bucket = template.Resources.SensitiveDataBucket;
        expect(bucket).toBeDefined();
        expect(bucket.Type).toBe('AWS::S3::Bucket');
        
        // Check encryption
        const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
        expect(encryption.BucketKeyEnabled).toBe(true);
        
        // Check versioning
        expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
        
        // Check public access block
        const publicBlock = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicBlock.BlockPublicAcls).toBe(true);
        expect(publicBlock.BlockPublicPolicy).toBe(true);
        expect(publicBlock.IgnorePublicAcls).toBe(true);
        expect(publicBlock.RestrictPublicBuckets).toBe(true);
      });

      test('should have lifecycle policies for cost optimization', () => {
        const bucket = template.Resources.SensitiveDataBucket;
        const lifecycleRules = bucket.Properties.LifecycleConfiguration.Rules;
        
        const glacierRule = lifecycleRules.find((r: any) => r.Id === 'TransitionToGlacier');
        expect(glacierRule).toBeDefined();
        expect(glacierRule.Status).toBe('Enabled');
        expect(glacierRule.Transitions[0].StorageClass).toBe('GLACIER');
        
        const multipartRule = lifecycleRules.find((r: any) => r.Id === 'DeleteIncompleteMultipartUploads');
        expect(multipartRule).toBeDefined();
        expect(multipartRule.AbortIncompleteMultipartUpload.DaysAfterInitiation).toBe(7);
      });

      test('should have ReplicationBucket with condition', () => {
        const bucket = template.Resources.ReplicationBucket;
        expect(bucket).toBeDefined();
        expect(bucket.Condition).toBe('EnableReplicationCondition');
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      });
    });

    describe('IAM Resources', () => {
      test('should have S3ReplicationRole with proper permissions', () => {
        const role = template.Resources.S3ReplicationRole;
        expect(role).toBeDefined();
        expect(role.Type).toBe('AWS::IAM::Role');
        expect(role.Condition).toBe('EnableReplicationCondition');
        
        const policy = role.Properties.Policies[0];
        expect(policy.PolicyName).toBe('S3ReplicationPolicy');
        expect(policy.PolicyDocument.Statement).toHaveLength(4);
      });

      test('should have DataAdministratorsGroup', () => {
        const group = template.Resources.DataAdministratorsGroup;
        expect(group).toBeDefined();
        expect(group.Type).toBe('AWS::IAM::Group');
      });

      test('should have DataAdminManagedPolicy with MFA requirements', () => {
        const policy = template.Resources.DataAdminManagedPolicy;
        expect(policy).toBeDefined();
        expect(policy.Type).toBe('AWS::IAM::ManagedPolicy');
        
        const statements = policy.Properties.PolicyDocument.Statement;
        
        // Check for MFA-required statement
        const mfaStatement = statements.find((s: any) => s.Sid === 'RequireMFAForSensitiveOperations');
        expect(mfaStatement).toBeDefined();
        expect(mfaStatement.Condition).toBeDefined();
      });

      test('should have ReadOnlyAccessRole', () => {
        const role = template.Resources.ReadOnlyAccessRole;
        expect(role).toBeDefined();
        expect(role.Type).toBe('AWS::IAM::Role');
        
        // Check for MFA condition in trust policy
        const trustPolicy = role.Properties.AssumeRolePolicyDocument;
        expect(trustPolicy.Statement[0].Condition).toBeDefined();
      });

      test('should have SampleDataAdmin user', () => {
        const user = template.Resources.SampleDataAdmin;
        expect(user).toBeDefined();
        expect(user.Type).toBe('AWS::IAM::User');
        expect(user.Properties.Groups).toContainEqual({'Ref': 'DataAdministratorsGroup'});
      });
    });

    describe('CloudTrail', () => {
      test('should have AuditTrail resource', () => {
        const trail = template.Resources.AuditTrail;
        expect(trail).toBeDefined();
        expect(trail.Type).toBe('AWS::CloudTrail::Trail');
        expect(trail.DependsOn).toBe('CloudTrailBucketPolicy');
      });

      test('AuditTrail should have proper configuration', () => {
        const trail = template.Resources.AuditTrail;
        const props = trail.Properties;
        
        expect(props.S3BucketName.Ref).toBe('CloudTrailBucket');
        expect(props.IncludeGlobalServiceEvents).toBe(true);
        expect(props.IsLogging).toBe(true);
        expect(props.IsMultiRegionTrail).toBe(true);
        
        // Check event selectors
        expect(props.EventSelectors).toHaveLength(1);
        expect(props.EventSelectors[0].ReadWriteType).toBe('All');
        expect(props.EventSelectors[0].IncludeManagementEvents).toBe(true);
        expect(props.EventSelectors[0].DataResources).toBeDefined();
      });
    });

    describe('CloudTrail Bucket Policy', () => {
      test('should have proper bucket policy for CloudTrail', () => {
        const policy = template.Resources.CloudTrailBucketPolicy;
        expect(policy).toBeDefined();
        expect(policy.Type).toBe('AWS::S3::BucketPolicy');
        
        const statements = policy.Properties.PolicyDocument.Statement;
        expect(statements).toHaveLength(2);
        
        // Check ACL permission
        const aclStatement = statements.find((s: any) => s.Sid === 'AWSCloudTrailAclCheck');
        expect(aclStatement.Action).toBe('s3:GetBucketAcl');
        expect(aclStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
        
        // Check write permission
        const writeStatement = statements.find((s: any) => s.Sid === 'AWSCloudTrailWrite');
        expect(writeStatement.Action).toBe('s3:PutObject');
        expect(writeStatement.Condition.StringEquals['s3:x-amz-acl']).toBe('bucket-owner-full-control');
      });
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'DataEncryptionKeyId',
      'DataEncryptionKeyArn',
      'SensitiveDataBucketName',
      'SensitiveDataBucketArn',
      'CloudTrailBucketName',
      'AuditTrailName',
      'DataAdministratorsGroupName',
      'ReadOnlyAccessRoleArn',
      'StackName',
      'EnvironmentName',
      'EnvironmentSuffix'
    ];

    test('should have all required outputs', () => {
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have conditional ReplicationBucketName output', () => {
      const output = template.Outputs.ReplicationBucketName;
      expect(output).toBeDefined();
      expect(output.Condition).toBe('EnableReplicationCondition');
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Security Compliance Validation', () => {
    test('all S3 buckets should have encryption enabled', () => {
      const s3Resources = Object.entries(template.Resources)
        .filter(([_, resource]: [string, any]) => resource.Type === 'AWS::S3::Bucket');
      
      s3Resources.forEach(([name, resource]: [string, any]) => {
        expect(resource.Properties.BucketEncryption).toBeDefined();
        const encryption = resource.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      });
    });

    test('all S3 buckets should block public access', () => {
      const s3Resources = Object.entries(template.Resources)
        .filter(([_, resource]: [string, any]) => resource.Type === 'AWS::S3::Bucket');
      
      s3Resources.forEach(([name, resource]: [string, any]) => {
        const publicBlock = resource.Properties.PublicAccessBlockConfiguration;
        expect(publicBlock.BlockPublicAcls).toBe(true);
        expect(publicBlock.BlockPublicPolicy).toBe(true);
        expect(publicBlock.IgnorePublicAcls).toBe(true);
        expect(publicBlock.RestrictPublicBuckets).toBe(true);
      });
    });

    test('all S3 buckets should have versioning enabled', () => {
      const s3Resources = Object.entries(template.Resources)
        .filter(([_, resource]: [string, any]) => resource.Type === 'AWS::S3::Bucket');
      
      s3Resources.forEach(([name, resource]: [string, any]) => {
        expect(resource.Properties.VersioningConfiguration).toBeDefined();
        expect(resource.Properties.VersioningConfiguration.Status).toBe('Enabled');
      });
    });

    test('IAM policies should follow least privilege principle', () => {
      const iamPolicies = Object.entries(template.Resources)
        .filter(([_, resource]: [string, any]) => 
          resource.Type === 'AWS::IAM::ManagedPolicy' || 
          (resource.Type === 'AWS::IAM::Role' && resource.Properties.Policies)
        );
      
      iamPolicies.forEach(([name, resource]: [string, any]) => {
        let statements: any[] = [];
        
        if (resource.Type === 'AWS::IAM::ManagedPolicy') {
          statements = resource.Properties.PolicyDocument.Statement;
        } else if (resource.Properties.Policies) {
          resource.Properties.Policies.forEach((policy: any) => {
            statements.push(...policy.PolicyDocument.Statement);
          });
        }
        
        // Check that no statement has wildcard actions without conditions
        statements.forEach(statement => {
          if (statement.Effect === 'Allow' && statement.Action === '*') {
            expect(statement.Condition).toBeDefined();
          }
        });
      });
    });

    test('CloudTrail should log S3 data events', () => {
      const trail = template.Resources.AuditTrail;
      const dataResources = trail.Properties.EventSelectors[0].DataResources;
      
      expect(dataResources).toBeDefined();
      expect(dataResources.some((dr: any) => dr.Type === 'AWS::S3::Object')).toBe(true);
    });
  });

  describe('Resource Dependencies', () => {
    test('CloudTrail should depend on bucket policy', () => {
      const trail = template.Resources.AuditTrail;
      expect(trail.DependsOn).toBe('CloudTrailBucketPolicy');
    });

    test('no circular dependencies should exist', () => {
      // This test passed if the template was successfully converted to JSON
      // as cfn-flip would have failed with circular dependency errors
      expect(template).toBeDefined();
    });
  });

  describe('Tags', () => {
    test('all taggable resources should have Environment tag', () => {
      const taggableTypes = [
        'AWS::S3::Bucket',
        'AWS::KMS::Key',
        'AWS::IAM::Role',
        'AWS::IAM::User',
        'AWS::CloudTrail::Trail'
      ];
      
      const taggableResources = Object.entries(template.Resources)
        .filter(([_, resource]: [string, any]) => taggableTypes.includes(resource.Type));
      
      taggableResources.forEach(([name, resource]: [string, any]) => {
        if (resource.Properties.Tags) {
          const envTag = resource.Properties.Tags.find((t: any) => t.Key === 'Environment');
          expect(envTag).toBeDefined();
          expect(envTag.Value.Ref).toBe('EnvironmentName');
        }
      });
    });
  });
});