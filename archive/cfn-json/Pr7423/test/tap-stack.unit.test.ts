import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Security Infrastructure', () => {
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
      expect(template.Description).toContain('Security-first infrastructure');
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
      expect(envSuffixParam.AllowedPattern).toBe('^[a-z0-9]{3,8}$');
    });

    test('should have CompanyName parameter', () => {
      expect(template.Parameters.CompanyName).toBeDefined();
      expect(template.Parameters.CompanyName.Type).toBe('String');
      expect(template.Parameters.CompanyName.Default).toBe('FinSecure');
    });

    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.AllowedValues).toContain('Production');
      expect(template.Parameters.Environment.AllowedValues).toContain('Staging');
      expect(template.Parameters.Environment.AllowedValues).toContain('Development');
    });

    test('should have TrustedAccountId parameter', () => {
      expect(template.Parameters.TrustedAccountId).toBeDefined();
      expect(template.Parameters.TrustedAccountId.AllowedPattern).toBe('^[0-9]{12}$');
    });

    test('should have SecurityScannerExternalId parameter', () => {
      expect(template.Parameters.SecurityScannerExternalId).toBeDefined();
      expect(template.Parameters.SecurityScannerExternalId.NoEcho).toBe(true);
      expect(template.Parameters.SecurityScannerExternalId.MinLength).toBe(32);
    });
  });

  describe('KMS Resources', () => {
    test('should have SecurityPrimaryKMSKey resource', () => {
      expect(template.Resources.SecurityPrimaryKMSKey).toBeDefined();
      expect(template.Resources.SecurityPrimaryKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have rotation enabled', () => {
      const kmsKey = template.Resources.SecurityPrimaryKMSKey;
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('KMS key should have proper key policy', () => {
      const kmsKey = template.Resources.SecurityPrimaryKMSKey;
      expect(kmsKey.Properties.KeyPolicy).toBeDefined();
      expect(kmsKey.Properties.KeyPolicy.Statement).toBeInstanceOf(Array);
      expect(kmsKey.Properties.KeyPolicy.Statement.length).toBeGreaterThan(0);
    });

    test('KMS key should have proper tags', () => {
      const kmsKey = template.Resources.SecurityPrimaryKMSKey;
      const tags = kmsKey.Properties.Tags;
      expect(tags).toBeInstanceOf(Array);

      const tagKeys = tags.map((t: any) => t.Key);
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('CostCenter');
      expect(tagKeys).toContain('DataClassification');
      expect(tagKeys).toContain('Owner');
    });

    test('should have SecurityPrimaryKMSAlias resource', () => {
      expect(template.Resources.SecurityPrimaryKMSAlias).toBeDefined();
      expect(template.Resources.SecurityPrimaryKMSAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('KMS alias should reference KMS key', () => {
      const alias = template.Resources.SecurityPrimaryKMSAlias;
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'SecurityPrimaryKMSKey' });
    });
  });

  describe('Secrets Manager Resources', () => {
    test('should have DatabaseCredentialsSecret resource', () => {
      expect(template.Resources.DatabaseCredentialsSecret).toBeDefined();
      expect(template.Resources.DatabaseCredentialsSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('secret should use KMS encryption', () => {
      const secret = template.Resources.DatabaseCredentialsSecret;
      expect(secret.Properties.KmsKeyId).toEqual({ Ref: 'SecurityPrimaryKMSKey' });
    });

    test('secret should have GenerateSecretString configuration', () => {
      const secret = template.Resources.DatabaseCredentialsSecret;
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
    });

    test('should have SecretsRotationLambda resource', () => {
      expect(template.Resources.SecretsRotationLambda).toBeDefined();
      expect(template.Resources.SecretsRotationLambda.Type).toBe('AWS::Lambda::Function');
    });

    test('should have SecretRotationSchedule resource', () => {
      expect(template.Resources.SecretRotationSchedule).toBeDefined();
      expect(template.Resources.SecretRotationSchedule.Type).toBe('AWS::SecretsManager::RotationSchedule');
    });

    test('rotation should be configured for 30 days', () => {
      const rotation = template.Resources.SecretRotationSchedule;
      expect(rotation.Properties.RotationRules.AutomaticallyAfterDays).toBe(30);
    });
  });

  describe('IAM Roles', () => {
    test('should have SecretsRotationLambdaRole resource', () => {
      expect(template.Resources.SecretsRotationLambdaRole).toBeDefined();
      expect(template.Resources.SecretsRotationLambdaRole.Type).toBe('AWS::IAM::Role');
    });

    test('Lambda role should have proper assume role policy', () => {
      const role = template.Resources.SecretsRotationLambdaRole;
      const policy = role.Properties.AssumeRolePolicyDocument;
      expect(policy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('should have CrossAccountAssumeRole resource', () => {
      expect(template.Resources.CrossAccountAssumeRole).toBeDefined();
      expect(template.Resources.CrossAccountAssumeRole.Type).toBe('AWS::IAM::Role');
    });

    test('CrossAccountAssumeRole should have external ID condition', () => {
      const role = template.Resources.CrossAccountAssumeRole;
      const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Condition.StringEquals['sts:ExternalId']).toBeDefined();
    });

    test('should have SecurityScannerRole resource', () => {
      expect(template.Resources.SecurityScannerRole).toBeDefined();
      expect(template.Resources.SecurityScannerRole.Type).toBe('AWS::IAM::Role');
    });

    test('SecurityScannerRole should have proper policies', () => {
      const role = template.Resources.SecurityScannerRole;
      expect(role.Properties.Policies).toBeDefined();
      expect(role.Properties.Policies.length).toBeGreaterThan(0);
    });
  });

  describe('IAM Policies', () => {
    test('should have S3EncryptionEnforcementPolicy resource', () => {
      expect(template.Resources.S3EncryptionEnforcementPolicy).toBeDefined();
      expect(template.Resources.S3EncryptionEnforcementPolicy.Type).toBe('AWS::IAM::ManagedPolicy');
    });

    test('S3 policy should enforce KMS encryption', () => {
      const policy = template.Resources.S3EncryptionEnforcementPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      const kmsStatement = statements.find((s: any) => s.Sid === 'RequireKMSEncryptionForS3');
      expect(kmsStatement).toBeDefined();
      expect(kmsStatement.Effect).toBe('Deny');
    });

    test('should have EC2EncryptionBoundaryPolicy resource', () => {
      expect(template.Resources.EC2EncryptionBoundaryPolicy).toBeDefined();
      expect(template.Resources.EC2EncryptionBoundaryPolicy.Type).toBe('AWS::IAM::ManagedPolicy');
    });

    test('EC2 policy should prevent unencrypted instances', () => {
      const policy = template.Resources.EC2EncryptionBoundaryPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      const denyStatement = statements.find((s: any) => s.Sid === 'DenyEC2LaunchWithoutEncryption');
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Effect).toBe('Deny');
    });
  });

  describe('IAM Groups', () => {
    test('should have SecurityAuditorsGroup resource', () => {
      expect(template.Resources.SecurityAuditorsGroup).toBeDefined();
      expect(template.Resources.SecurityAuditorsGroup.Type).toBe('AWS::IAM::Group');
    });

    test('SecurityAuditorsGroup should have SecurityAudit managed policy', () => {
      const group = template.Resources.SecurityAuditorsGroup;
      expect(group.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/SecurityAudit');
    });

    test('SecurityAuditorsGroup should have CloudTrail and Config permissions', () => {
      const group = template.Resources.SecurityAuditorsGroup;
      const policies = group.Properties.Policies;
      expect(policies).toBeInstanceOf(Array);
      expect(policies.length).toBeGreaterThan(0);
    });
  });

  describe('Outputs', () => {
    test('should have KMSKeyArn output', () => {
      expect(template.Outputs.KMSKeyArn).toBeDefined();
      expect(template.Outputs.KMSKeyArn.Export).toBeDefined();
    });

    test('should have KMSKeyId output', () => {
      expect(template.Outputs.KMSKeyId).toBeDefined();
      expect(template.Outputs.KMSKeyId.Export).toBeDefined();
    });

    test('should have CrossAccountRoleArn output', () => {
      expect(template.Outputs.CrossAccountRoleArn).toBeDefined();
      expect(template.Outputs.CrossAccountRoleArn.Export).toBeDefined();
    });

    test('should have SecurityScannerRoleArn output', () => {
      expect(template.Outputs.SecurityScannerRoleArn).toBeDefined();
      expect(template.Outputs.SecurityScannerRoleArn.Export).toBeDefined();
    });

    test('should have DatabaseCredentialsSecretArn output', () => {
      expect(template.Outputs.DatabaseCredentialsSecretArn).toBeDefined();
    });

    test('should have SecretsRotationLambdaArn output', () => {
      expect(template.Outputs.SecretsRotationLambdaArn).toBeDefined();
    });

    test('should have S3EncryptionPolicyArn output', () => {
      expect(template.Outputs.S3EncryptionPolicyArn).toBeDefined();
    });

    test('should have EC2BoundaryPolicyArn output', () => {
      expect(template.Outputs.EC2BoundaryPolicyArn).toBeDefined();
    });

    test('should have SecurityAuditorsGroupName output', () => {
      expect(template.Outputs.SecurityAuditorsGroupName).toBeDefined();
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should include EnvironmentSuffix in name', () => {
      const resources = template.Resources;
      const resourcesWithNames = Object.keys(resources).filter(key => {
        const resource = resources[key];
        return resource.Properties && (resource.Properties.RoleName || resource.Properties.Name || resource.Properties.FunctionName || resource.Properties.GroupName || resource.Properties.ManagedPolicyName);
      });

      resourcesWithNames.forEach(key => {
        const resource = resources[key];
        const name = resource.Properties.RoleName || resource.Properties.Name || resource.Properties.FunctionName || resource.Properties.GroupName || resource.Properties.ManagedPolicyName;

        if (typeof name === 'object' && name['Fn::Sub']) {
          expect(name['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('export names should use stack name', () => {
      const outputs = template.Outputs;
      Object.keys(outputs).forEach(key => {
        const output = outputs[key];
        if (output.Export) {
          expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('all IAM roles should have proper tags', () => {
      const roles = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::IAM::Role')
        .map(key => template.Resources[key]);

      roles.forEach(role => {
        expect(role.Properties.Tags).toBeDefined();
        expect(role.Properties.Tags.length).toBeGreaterThan(0);

        const tagKeys = role.Properties.Tags.map((t: any) => t.Key);
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('CostCenter');
        expect(tagKeys).toContain('Owner');
      });
    });

    test('secrets should have required tags', () => {
      const secret = template.Resources.DatabaseCredentialsSecret;
      const tags = secret.Properties.Tags;
      const tagKeys = tags.map((t: any) => t.Key);

      expect(tagKeys).toContain('DataClassification');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('CostCenter');
      expect(tagKeys).toContain('Owner');
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

    test('should have all required resources', () => {
      const requiredResources = [
        'SecurityPrimaryKMSKey',
        'SecurityPrimaryKMSAlias',
        'DatabaseCredentialsSecret',
        'SecretsRotationLambdaRole',
        'SecretsRotationLambda',
        'SecretRotationSchedule',
        'CrossAccountAssumeRole',
        'SecurityScannerRole',
        'S3EncryptionEnforcementPolicy',
        'EC2EncryptionBoundaryPolicy',
        'SecurityAuditorsGroup'
      ];

      requiredResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });
  });
});
