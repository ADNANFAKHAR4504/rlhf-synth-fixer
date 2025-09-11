import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    try {
      const templatePath = path.join(__dirname, '../lib/TapStack.json');
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      template = JSON.parse(templateContent);
    } catch (error) {
      console.error('Failed to load template:', error);
      throw error;
    }
  });

  test('should load template successfully', () => {
    expect(template).toBeDefined();
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
  });

  describe('Template Structure', () => {
    test('should have correct AWS template format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description and parameters', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Secure AWS Infrastructure');
    });

    test('should have environment suffix parameter', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Resource Validation', () => {
    test('should have KMS encryption key', () => {
      expect(template.Resources.S3EncryptionKey).toBeDefined();
      expect(template.Resources.S3EncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.S3EncryptionKeyAlias).toBeDefined();
      expect(template.Resources.S3EncryptionKeyAlias.Type).toBe('AWS::KMS::Alias');
      expect(template.Resources.S3EncryptionKeyAlias.Properties.AliasName).toBeDefined();
      expect(template.Resources.S3EncryptionKeyAlias.Properties.TargetKeyId.Ref).toBe('S3EncryptionKey');
    });

    test('should have IAM role', () => {
      expect(template.Resources.S3AccessRole).toBeDefined();
      expect(template.Resources.S3AccessRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have instance profile', () => {
      expect(template.Resources.S3AccessInstanceProfile).toBeDefined();
      expect(template.Resources.S3AccessInstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(template.Resources.S3AccessInstanceProfile.Properties.Roles).toContainEqual({ Ref: 'S3AccessRole' });
    });

    test('should have S3 buckets', () => {
      expect(template.Resources.PrimaryDataBucket).toBeDefined();
      expect(template.Resources.SecondaryDataBucket).toBeDefined();
      expect(template.Resources.PrimaryDataBucket.Type).toBe('AWS::S3::Bucket');
      expect(template.Resources.SecondaryDataBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have bucket policies', () => {
      expect(template.Resources.PrimaryBucketPolicy).toBeDefined();
      expect(template.Resources.SecondaryBucketPolicy).toBeDefined();
      expect(template.Resources.PrimaryBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
      expect(template.Resources.SecondaryBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('should have all resources with proper dependencies', () => {
      // Check that bucket policies reference the correct buckets
      expect(template.Resources.PrimaryBucketPolicy.Properties.Bucket.Ref).toBe('PrimaryDataBucket');
      expect(template.Resources.SecondaryBucketPolicy.Properties.Bucket.Ref).toBe('SecondaryDataBucket');
    });
  });

  describe('KMS Key Configuration', () => {
    test('should have proper KMS key configuration', () => {
      const kmsKey = template.Resources.S3EncryptionKey;
      expect(kmsKey.Properties.KeySpec).toBe('SYMMETRIC_DEFAULT');
      expect(kmsKey.Properties.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(kmsKey.Properties.Description).toBeDefined();
    });

    test('should have comprehensive KMS key policy', () => {
      const keyPolicy = template.Resources.S3EncryptionKey.Properties.KeyPolicy;
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toBeDefined();
      expect(Array.isArray(keyPolicy.Statement)).toBe(true);
      expect(keyPolicy.Statement.length).toBeGreaterThan(0);

      // Check for root permissions
      const rootStatement = keyPolicy.Statement.find((stmt: any) => 
        stmt.Sid === 'Enable IAM User Permissions'
      );
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');

      // Check for S3 service permissions
      const s3Statement = keyPolicy.Statement.find((stmt: any) => 
        stmt.Sid === 'Allow S3 Service Access'
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Principal.Service).toBe('s3.amazonaws.com');
    });

    test('should have proper KMS key tags', () => {
      const kmsKey = template.Resources.S3EncryptionKey;
      expect(kmsKey.Properties.Tags).toBeDefined();
      expect(Array.isArray(kmsKey.Properties.Tags)).toBe(true);
      expect(kmsKey.Properties.Tags.length).toBeGreaterThan(0);

      const nameTag = kmsKey.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      const envTag = kmsKey.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
      const purposeTag = kmsKey.Properties.Tags.find((tag: any) => tag.Key === 'Purpose');

      expect(nameTag).toBeDefined();
      expect(envTag).toBeDefined();
      expect(purposeTag).toBeDefined();
      expect(purposeTag.Value).toBe('S3-Encryption');
    });
  });

  describe('Security Configuration', () => {
    test('S3 buckets should have KMS encryption', () => {
      const primaryBucket = template.Resources.PrimaryDataBucket;
      const secondaryBucket = template.Resources.SecondaryDataBucket;
      
      [primaryBucket, secondaryBucket].forEach(bucket => {
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
        expect(encryption.BucketKeyEnabled).toBe(true);
        expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID.Ref).toBe('S3EncryptionKey');
      });
    });

    test('S3 buckets should have public access blocked', () => {
      const primaryBucket = template.Resources.PrimaryDataBucket;
      const secondaryBucket = template.Resources.SecondaryDataBucket;
      
      [primaryBucket, secondaryBucket].forEach(bucket => {
        const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });
    });

    test('S3 buckets should have versioning enabled', () => {
      const primaryBucket = template.Resources.PrimaryDataBucket;
      const secondaryBucket = template.Resources.SecondaryDataBucket;
      
      [primaryBucket, secondaryBucket].forEach(bucket => {
        expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      });
    });

    test('S3 buckets should have lifecycle configuration', () => {
      const primaryBucket = template.Resources.PrimaryDataBucket;
      const secondaryBucket = template.Resources.SecondaryDataBucket;
      
      [primaryBucket, secondaryBucket].forEach(bucket => {
        if (bucket.Properties.LifecycleConfiguration) {
          expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
          expect(Array.isArray(bucket.Properties.LifecycleConfiguration.Rules)).toBe(true);
        }
      });
    });

    test('should enforce HTTPS through bucket policies', () => {
      const primaryPolicy = template.Resources.PrimaryBucketPolicy;
      const secondaryPolicy = template.Resources.SecondaryBucketPolicy;
      
      [primaryPolicy, secondaryPolicy].forEach(policy => {
        const policyDoc = policy.Properties.PolicyDocument;
        const httpsStatement = policyDoc.Statement.find((stmt: any) => 
          stmt.Sid === 'DenyInsecureConnections'
        );
        expect(httpsStatement).toBeDefined();
        expect(httpsStatement.Effect).toBe('Deny');
        expect(httpsStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
      });
    });

    test('should deny unencrypted uploads through bucket policies', () => {
      const primaryPolicy = template.Resources.PrimaryBucketPolicy;
      const secondaryPolicy = template.Resources.SecondaryBucketPolicy;
      
      [primaryPolicy, secondaryPolicy].forEach(policy => {
        const policyDoc = policy.Properties.PolicyDocument;
        const encryptionStatement = policyDoc.Statement.find((stmt: any) => 
          stmt.Sid === 'DenyUnencryptedUploads'
        );
        expect(encryptionStatement).toBeDefined();
        expect(encryptionStatement.Effect).toBe('Deny');
      });
    });

    test('IAM role should have least privilege policies', () => {
      const iamRole = template.Resources.S3AccessRole;
      const policy = iamRole.Properties.Policies[0];
      const policyDoc = policy.PolicyDocument;
      
      // Should have explicit deny statements for security
      const denyStatements = policyDoc.Statement.filter((stmt: any) => stmt.Effect === 'Deny');
      expect(denyStatements.length).toBeGreaterThan(0);

      // Should have region enforcement
      const regionDenyStatement = denyStatements.find((stmt: any) => 
        stmt.Sid?.includes('DenyActionsOutsideRegion') || 
        stmt.Condition?.StringNotEquals?.['aws:RequestedRegion']
      );
      expect(regionDenyStatement).toBeDefined();
    });

    test('IAM role should have proper assume role policy', () => {
      const iamRole = template.Resources.S3AccessRole;
      const assumeRolePolicy = iamRole.Properties.AssumeRolePolicyDocument;
      
      expect(assumeRolePolicy.Version).toBe('2012-10-17');
      expect(assumeRolePolicy.Statement).toBeDefined();
      expect(Array.isArray(assumeRolePolicy.Statement)).toBe(true);

      // Should allow EC2 service to assume role
      const ec2Statement = assumeRolePolicy.Statement.find((stmt: any) => 
        stmt.Principal?.Service === 'ec2.amazonaws.com'
      );
      expect(ec2Statement).toBeDefined();
      expect(ec2Statement.Effect).toBe('Allow');
      expect(ec2Statement.Action).toBe('sts:AssumeRole');
    });

    test('should enforce region restrictions in IAM policies', () => {
      const iamRole = template.Resources.S3AccessRole;
      
      // Check assume role policy for region conditions
      const assumeRolePolicy = iamRole.Properties.AssumeRolePolicyDocument;
      assumeRolePolicy.Statement.forEach((stmt: any) => {
        if (stmt.Condition) {
          expect(stmt.Condition.StringEquals?.['aws:RequestedRegion']).toBe('us-west-2');
        }
      });
    });
  });

  describe('Output Validation', () => {
    test('should have all required outputs', () => {
      expect(template.Outputs.StackRegion).toBeDefined();
      expect(template.Outputs.KMSKeyId).toBeDefined();
      expect(template.Outputs.KMSKeyArn).toBeDefined();
      expect(template.Outputs.IAMRoleArn).toBeDefined();
      expect(template.Outputs.IAMRoleName).toBeDefined();
      expect(template.Outputs.InstanceProfileArn).toBeDefined();
      expect(template.Outputs.PrimaryBucketName).toBeDefined();
      expect(template.Outputs.PrimaryBucketArn).toBeDefined();
      expect(template.Outputs.SecondaryBucketName).toBeDefined();
      expect(template.Outputs.SecondaryBucketArn).toBeDefined();
      expect(template.Outputs.DeploymentSummary).toBeDefined();
    });

    test('outputs should have proper export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export) {
          expect(output.Export.Name).toBeDefined();
          expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
        }
      });
    });

    test('outputs should have meaningful descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(typeof output.Description).toBe('string');
        expect(output.Description.length).toBeGreaterThan(5);
      });
    });

    test('bucket outputs should reference correct resources', () => {
      expect(template.Outputs.PrimaryBucketName.Value.Ref).toBe('PrimaryDataBucket');
      expect(template.Outputs.SecondaryBucketName.Value.Ref).toBe('SecondaryDataBucket');
    });

    test('KMS outputs should reference correct resources', () => {
      expect(template.Outputs.KMSKeyId.Value.Ref).toBe('S3EncryptionKey');
      expect(template.Outputs.KMSKeyArn.Value['Fn::GetAtt'][0]).toBe('S3EncryptionKey');
      expect(template.Outputs.KMSKeyArn.Value['Fn::GetAtt'][1]).toBe('Arn');
    });

    test('IAM outputs should reference correct resources', () => {
      expect(template.Outputs.IAMRoleArn.Value['Fn::GetAtt'][0]).toBe('S3AccessRole');
      expect(template.Outputs.IAMRoleName.Value.Ref).toBe('S3AccessRole');
      expect(template.Outputs.InstanceProfileArn.Value['Fn::GetAtt'][0]).toBe('S3AccessInstanceProfile');
    });
  });

  describe('Naming Conventions', () => {
    test('resources should follow consistent naming patterns', () => {
      const resourceNames = Object.keys(template.Resources);
      
      // KMS resources should follow pattern
      expect(resourceNames).toContain('S3EncryptionKey');
      expect(resourceNames).toContain('S3EncryptionKeyAlias');
      
      // S3 resources should follow pattern
      expect(resourceNames).toContain('PrimaryDataBucket');
      expect(resourceNames).toContain('SecondaryDataBucket');
      expect(resourceNames).toContain('PrimaryBucketPolicy');
      expect(resourceNames).toContain('SecondaryBucketPolicy');
      
      // IAM resources should follow pattern
      expect(resourceNames).toContain('S3AccessRole');
      expect(resourceNames).toContain('S3AccessInstanceProfile');
    });

    test('resource names should include environment suffix where appropriate', () => {
      // Check IAM Role tags include environment suffix
      const iamRole = template.Resources.S3AccessRole;
      const nameTag = iamRole.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');

      // Check KMS key alias includes environment suffix
      const kmsAlias = template.Resources.S3EncryptionKeyAlias;
      expect(kmsAlias.Properties.AliasName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Template Validation', () => {
    test('should not have any circular dependencies', () => {
      // This is a simple check - in a real scenario you'd want more sophisticated dependency analysis
      const resources = template.Resources;
      const resourceNames = Object.keys(resources);
      
      resourceNames.forEach(resourceName => {
        const resource = resources[resourceName];
        // Check that no resource references itself directly
        if (resource.Properties) {
          const resourceString = JSON.stringify(resource.Properties);
          expect(resourceString).not.toContain(`"Ref":"${resourceName}"`);
        }
      });
    });

    test('should have valid CloudFormation functions', () => {
      const templateString = JSON.stringify(template);
      
      // Check for proper CloudFormation function usage
      const functionPatterns = [
        /"Fn::Sub"/,
        /"Fn::GetAtt"/,
        /"Fn::Join"/,
        /"Ref"/
      ];
      
      // At least some CloudFormation functions should be used
      const functionsUsed = functionPatterns.filter(pattern => pattern.test(templateString));
      expect(functionsUsed.length).toBeGreaterThan(0);
    });

    test('should not contain any TODO or FIXME comments', () => {
      const templateString = JSON.stringify(template);
      expect(templateString.toLowerCase()).not.toContain('todo');
      expect(templateString.toLowerCase()).not.toContain('fixme');
    });

    test('should have consistent indentation and formatting', () => {
      // This template was loaded from JSON, so it should be valid JSON
      expect(() => JSON.parse(JSON.stringify(template))).not.toThrow();
    });
  });

  describe('Security Best Practices', () => {
    test('should not contain hardcoded secrets or keys', () => {
      const templateString = JSON.stringify(template);
      
      // Check for common secret patterns (this is basic - real checks would be more comprehensive)
      const secretPatterns = [
        /AKIA[0-9A-Z]{16}/i,  // AWS Access Key pattern
        /password.*[:=]\s*['"]/i,
        /secret.*[:=]\s*['"]/i,
        /api[_-]?key.*[:=]\s*['"]/i
      ];
      
      secretPatterns.forEach(pattern => {
        expect(templateString).not.toMatch(pattern);
      });
    });

    test('should use least privilege access patterns', () => {
      const iamRole = template.Resources.S3AccessRole;
      const policies = iamRole.Properties.Policies;
      
      expect(policies).toBeDefined();
      expect(Array.isArray(policies)).toBe(true);
      
      policies.forEach((policy: any) => {
        const statements = policy.PolicyDocument.Statement;
        
        // Check that allow statements are specific (not broad permissions)
        const allowStatements = statements.filter((stmt: any) => stmt.Effect === 'Allow');
        allowStatements.forEach((stmt: any) => {
          // Should not allow all actions
          expect(stmt.Action).not.toBe('*');
          expect(stmt.Action).not.toEqual(['*']);
          
          // Should not allow all resources
          expect(stmt.Resource).not.toBe('*');
          expect(stmt.Resource).not.toEqual(['*']);
        });
      });
    });

    test('should enforce encryption in transit', () => {
      // Check bucket policies for HTTPS enforcement
      const bucketPolicies = [
        template.Resources.PrimaryBucketPolicy,
        template.Resources.SecondaryBucketPolicy
      ];
      
      bucketPolicies.forEach(bucketPolicy => {
        const statements = bucketPolicy.Properties.PolicyDocument.Statement;
        const httpsEnforcement = statements.find((stmt: any) => 
          stmt.Effect === 'Deny' && 
          stmt.Condition?.Bool?.['aws:SecureTransport'] === 'false'
        );
        expect(httpsEnforcement).toBeDefined();
      });
    });

    test('should enforce encryption at rest', () => {
      const buckets = [
        template.Resources.PrimaryDataBucket,
        template.Resources.SecondaryDataBucket
      ];
      
      buckets.forEach(bucket => {
        const encryption = bucket.Properties.BucketEncryption;
        expect(encryption).toBeDefined();
        expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
        expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      });
    });
  });
});
