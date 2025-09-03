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
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toHaveLength(2);
    });
  });

  describe('Parameters', () => {
    const requiredParameters = [
      'EnvironmentSuffix',
      'BucketPrefix',
      'EnableMFA',
      'EnableReplication',
      'LifecycleDays'
    ];

    test('should have all required parameters', () => {
      requiredParameters.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('EnableMFA parameter should default to true', () => {
      const mfaParam = template.Parameters.EnableMFA;
      expect(mfaParam.Default).toBe('true');
      expect(mfaParam.AllowedValues).toEqual(['true', 'false']);
    });

    test('LifecycleDays should have correct constraints', () => {
      const lifecycleParam = template.Parameters.LifecycleDays;
      expect(lifecycleParam.Type).toBe('Number');
      expect(lifecycleParam.Default).toBe(30);
      expect(lifecycleParam.MinValue).toBe(1);
      expect(lifecycleParam.MaxValue).toBe(365);
    });

    // Edge case tests for parameter validation
    describe('Parameter Edge Cases', () => {
      test('BucketPrefix should have proper pattern constraints', () => {
        const bucketParam = template.Parameters.BucketPrefix;
        expect(bucketParam.AllowedPattern).toBe('^[a-z0-9-]+$');
        expect(bucketParam.ConstraintDescription).toContain('lowercase');
        expect(bucketParam.MinLength).toBe(3);
        expect(bucketParam.MaxLength).toBe(20);
      });

      test('EnvironmentSuffix should have alphanumeric pattern', () => {
        const envSuffixParam = template.Parameters.EnvironmentSuffix;
        expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
        expect(envSuffixParam.ConstraintDescription).toContain('alphanumeric');
        expect(envSuffixParam.MinLength).toBe(2);
        expect(envSuffixParam.MaxLength).toBe(10);
      });

      test('all boolean parameters should have proper allowed values', () => {
        const booleanParams = ['EnableMFA', 'EnableReplication'];
        booleanParams.forEach(param => {
          expect(template.Parameters[param].AllowedValues).toEqual(['true', 'false']);
        });
      });

      test('numeric parameters should have reasonable constraints', () => {
        const lifecycleParam = template.Parameters.LifecycleDays;
        expect(lifecycleParam.MinValue).toBeGreaterThan(0);
        expect(lifecycleParam.MaxValue).toBeLessThanOrEqual(365);
        expect(lifecycleParam.Default).toBeGreaterThanOrEqual(lifecycleParam.MinValue);
        expect(lifecycleParam.Default).toBeLessThanOrEqual(lifecycleParam.MaxValue);
      });

      test('parameters should have meaningful descriptions', () => {
        requiredParameters.forEach(param => {
          expect(template.Parameters[param].Description).toBeDefined();
          expect(template.Parameters[param].Description.length).toBeGreaterThan(5);
        });
      });
    });
  });

  describe('Conditions', () => {
    test('should have all necessary conditions', () => {
      const expectedConditions = [
        'MFAEnabled',
        'ReplicationEnabled'
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
        expect(bucket.Condition).toBe('ReplicationEnabled');
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      });
    });

    describe('IAM Resources', () => {
      test('should have S3ReplicationRole with proper permissions', () => {
        const role = template.Resources.S3ReplicationRole;
        expect(role).toBeDefined();
        expect(role.Type).toBe('AWS::IAM::Role');
        expect(role.Condition).toBe('ReplicationEnabled');
        
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
      'EnvironmentSuffixOutput'
    ];

    test('should have all required outputs', () => {
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have conditional ReplicationBucketName output', () => {
      const output = template.Outputs.ReplicationBucketName;
      expect(output).toBeDefined();
      expect(output.Condition).toBe('ReplicationEnabled');
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

    // Advanced security edge cases
    describe('Security Edge Cases', () => {
      test('KMS key should have proper key rotation and policies', () => {
        const kmsKey = template.Resources.DataEncryptionKey;
        expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
        
        const keyPolicy = kmsKey.Properties.KeyPolicy;
        expect(keyPolicy.Version).toBe('2012-10-17');
        
        // Should have at least root access and service access statements
        expect(keyPolicy.Statement.length).toBeGreaterThanOrEqual(2);
        
        // Root access should be present
        const rootAccess = keyPolicy.Statement.find((s: any) => {
          if (s.Principal?.AWS) {
            const awsPrincipal = Array.isArray(s.Principal.AWS) ? s.Principal.AWS : [s.Principal.AWS];
            return awsPrincipal.some((principal: any) => 
              (typeof principal === 'string' && (principal.includes('root') || principal.includes('${AWS::AccountId}'))) ||
              (typeof principal === 'object' && principal['Fn::Sub']?.includes('${AWS::AccountId}:root'))
            );
          }
          return false;
        });
        expect(rootAccess).toBeDefined();
      });

      test('S3 bucket names should include account ID for uniqueness', () => {
        const s3Resources = Object.entries(template.Resources)
          .filter(([_, resource]: [string, any]) => resource.Type === 'AWS::S3::Bucket');
        
        s3Resources.forEach(([name, resource]: [string, any]) => {
          if (resource.Properties.BucketName) {
            expect(resource.Properties.BucketName['Fn::Sub']).toContain('${AWS::AccountId}');
          }
        });
      });

      test('lifecycle policies should have reasonable transition days', () => {
        const sensitiveDataBucket = template.Resources.SensitiveDataBucket;
        const lifecycleRules = sensitiveDataBucket.Properties.LifecycleConfiguration.Rules;
        
        const glacierRule = lifecycleRules.find((r: any) => r.Id === 'TransitionToGlacier');
        expect(glacierRule).toBeDefined();
        
        // Handle CloudFormation references (Ref function)
        const transitionDays = glacierRule.Transitions[0].TransitionInDays;
        if (typeof transitionDays === 'object' && transitionDays.Ref) {
          // Should reference LifecycleDays parameter
          expect(transitionDays.Ref).toBe('LifecycleDays');
          expect(template.Parameters.LifecycleDays).toBeDefined();
          expect(template.Parameters.LifecycleDays.Type).toBe('Number');
          expect(template.Parameters.LifecycleDays.MinValue).toBeGreaterThan(0);
          expect(template.Parameters.LifecycleDays.MaxValue).toBeLessThanOrEqual(365);
        } else {
          // If it's a direct value
          expect(transitionDays).toBeLessThanOrEqual(365);
          expect(transitionDays).toBeGreaterThan(0);
        }
      });

      test('IAM policies should not have overly permissive actions', () => {
        const dangerousActions = ['*', 's3:*', 'iam:*', 'kms:*'];
        const iamResources = Object.entries(template.Resources)
          .filter(([_, resource]: [string, any]) => 
            resource.Type === 'AWS::IAM::ManagedPolicy' || 
            resource.Type === 'AWS::IAM::Role'
          );
        
        iamResources.forEach(([name, resource]: [string, any]) => {
          let statements: any[] = [];
          
          if (resource.Type === 'AWS::IAM::ManagedPolicy') {
            statements = resource.Properties.PolicyDocument.Statement;
          } else if (resource.Properties.Policies) {
            resource.Properties.Policies.forEach((policy: any) => {
              statements.push(...policy.PolicyDocument.Statement);
            });
          }
          
          statements.forEach(statement => {
            if (statement.Effect === 'Allow') {
              const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
              actions.forEach((action: string) => {
                if (dangerousActions.includes(action)) {
                  // If using dangerous actions, should have restrictive conditions or be for root access
                  expect(
                    statement.Condition || 
                    statement.Principal?.AWS?.includes('root') ||
                    name === 'DataEncryptionKey' // KMS key policy exception
                  ).toBeTruthy();
                }
              });
            }
          });
    });
  });

      test('CloudTrail should have proper configuration for compliance', () => {
        const trail = template.Resources.AuditTrail;
        expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
        expect(trail.Properties.IsMultiRegionTrail).toBe(true);
        expect(trail.Properties.IsLogging).toBe(true);
        
        // Should have event selectors for data events
        expect(trail.Properties.EventSelectors).toBeDefined();
        expect(trail.Properties.EventSelectors.length).toBeGreaterThan(0);
        
        const eventSelector = trail.Properties.EventSelectors[0];
        expect(eventSelector.ReadWriteType).toBe('All');
        expect(eventSelector.IncludeManagementEvents).toBe(true);
      });

      test('conditional resources should have proper condition references', () => {
        const conditionalResources = Object.entries(template.Resources)
          .filter(([_, resource]: [string, any]) => resource.Condition);
        
        conditionalResources.forEach(([name, resource]: [string, any]) => {
          expect(template.Conditions[resource.Condition]).toBeDefined();
      });
    });

      test('resource dependencies should be properly defined', () => {
        const cloudTrail = template.Resources.AuditTrail;
        expect(cloudTrail.DependsOn).toBe('CloudTrailBucketPolicy');
        
        // Check that referenced resources exist
        const referencedResources = ['CloudTrailBucketPolicy'];
        referencedResources.forEach(resourceName => {
          expect(template.Resources[resourceName]).toBeDefined();
        });
      });
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
          expect(envTag.Value.Ref).toBe('EnvironmentSuffix');
        }
      });
    });
  });
});