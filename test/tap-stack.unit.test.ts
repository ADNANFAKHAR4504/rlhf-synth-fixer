import fs from 'fs';
import path from 'path';

describe('CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
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
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });
    test('should have Parameters, Resources, and Outputs sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should define required parameters', () => {
      const required = ['DeploymentEnv', 'MFAMaxSessionDuration'];
      required.forEach(param =>
        expect(template.Parameters[param]).toBeDefined()
      );
    });
    test('should have correct DeploymentEnv parameter', () => {
      const p = template.Parameters.DeploymentEnv;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('pr');
      expect(p.AllowedPattern).toBe('[a-z]+');
      expect(p.AllowedValues).toContain('production');
      expect(p.ConstraintDescription).toBe(
        'Must contain only lowercase letters'
      );
    });
    test('should have correct MFAMaxSessionDuration parameter', () => {
      const p = template.Parameters.MFAMaxSessionDuration;
      expect(p.Type).toBe('Number');
      expect(p.Default).toBe(3600);
      expect(p.MinValue).toBe(900);
      expect(p.MaxValue).toBe(43200);
    });
  });

  describe('Resources', () => {
    test('should create a CloudTrail for security auditing', () => {
      expect(template.Resources.SecurityAuditTrail).toBeDefined();
      expect(template.Resources.SecurityAuditTrail.Type).toBe(
        'AWS::CloudTrail::Trail'
      );
    });
    test('should create an encrypted S3 bucket for audit logs', () => {
      const bucket = template.Resources.SecurityAuditBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy
      ).toBe(true);
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls
      ).toBe(true);
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets
      ).toBe(true);
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });
    test('should create an IAM role with MFA enforcement and least privilege', () => {
      const role = template.Resources.SecureAccessRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(
        role.Properties.AssumeRolePolicyDocument.Statement.some(
          (s: any) =>
            s.Condition &&
            s.Condition.Bool &&
            s.Condition.Bool['aws:MultiFactorAuthPresent'] === 'true'
        )
      ).toBe(true);
      expect(role.Properties.ManagedPolicyArns).toEqual(
        expect.arrayContaining([
          { Ref: 'ReadOnlyAccessPolicy' },
          { Ref: 'LimitedS3AccessPolicy' },
        ])
      );
    });
    test('should create a managed policy denying sensitive IAM actions', () => {
      const policy = template.Resources.ReadOnlyAccessPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::IAM::ManagedPolicy');
      const denyStatement = policy.Properties.PolicyDocument.Statement.find(
        (s: any) => s.Effect === 'Deny'
      );
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Action).toContain('iam:CreateRole');
      expect(denyStatement.Action).toContain('iam:DeleteUser');
    });
    test('should create an emergency access role with stricter MFA', () => {
      const role = template.Resources.EmergencyAccessRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(
        role.Properties.AssumeRolePolicyDocument.Statement.some(
          (s: any) =>
            s.Condition &&
            s.Condition.Bool &&
            s.Condition.Bool['aws:MultiFactorAuthPresent'] === 'true' &&
            s.Condition.NumericLessThan &&
            s.Condition.NumericLessThan['aws:MultiFactorAuthAge'] === '900'
        )
      ).toBe(true);
      expect(role.Properties.ManagedPolicyArns).toEqual(
        expect.arrayContaining([{ Ref: 'EmergencyAccessPolicy' }])
      );
    });
    test('should create an emergency access policy with time-limited permissions', () => {
      const policy = template.Resources.EmergencyAccessPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::IAM::ManagedPolicy');
      const allowStatement = policy.Properties.PolicyDocument.Statement.find(
        (s: any) => s.Effect === 'Allow'
      );
      expect(allowStatement).toBeDefined();
      expect(allowStatement.Condition.Bool['aws:MultiFactorAuthPresent']).toBe(
        'true'
      );
      expect(
        allowStatement.Condition.NumericLessThan['aws:MultiFactorAuthAge']
      ).toBe('900');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expected = [
        'SecureAccessRoleArn',
        'EmergencyAccessRoleArn',
        'SecurityAuditTrailArn',
        'SecurityAuditBucketName',
        'MFAComplianceStatus',
        'SecurityValidationChecklist',
      ];
      expected.forEach(key => expect(template.Outputs[key]).toBeDefined());
    });
    test('should have correct output descriptions and export names', () => {
      const outputs = template.Outputs;
      expect(outputs.SecureAccessRoleArn.Description).toMatch(
        /secure access role/i
      );
      expect(outputs.EmergencyAccessRoleArn.Description).toMatch(
        /emergency access role/i
      );
      expect(outputs.SecurityAuditTrailArn.Description).toMatch(/CloudTrail/i);
      expect(outputs.SecurityAuditBucketName.Description).toMatch(/S3 bucket/i);
      expect(outputs.SecurityAuditTrailArn.Export.Name['Fn::Sub']).toMatch(
        /security-audit-trail-arn/
      );
      expect(outputs.SecurityAuditBucketName.Export.Name['Fn::Sub']).toMatch(
        /security-audit-bucket-name/
      );
    });
  });

  describe('Template Validation', () => {
    test('should be a valid object', () => {
      expect(typeof template).toBe('object');
      expect(template).toBeDefined();
    });
    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
    test('should have at least 2 parameters', () => {
      expect(Object.keys(template.Parameters).length).toBeGreaterThanOrEqual(2);
    });
    test('should have at least 6 outputs', () => {
      expect(Object.keys(template.Outputs).length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Resource Naming Convention', () => {
    test('should use Fn::Sub for output export names with environment suffix', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        if (
          output.Export &&
          output.Export.Name &&
          output.Export.Name['Fn::Sub']
        ) {
          expect(output.Export.Name['Fn::Sub']).toMatch(/\${DeploymentEnv}-/);
        }
      });
    });
    test('should apply tags to resources where required', () => {
      // All taggable resources should have Tags property
      const taggableTypes = [
        'AWS::IAM::Role',
        'AWS::S3::Bucket',
        'AWS::CloudTrail::Trail',
      ];
      Object.values(template.Resources).forEach((res: any) => {
        if (taggableTypes.includes(res.Type)) {
          expect(res.Properties.Tags).toBeDefined();
        }
      });
    });
  });
});
