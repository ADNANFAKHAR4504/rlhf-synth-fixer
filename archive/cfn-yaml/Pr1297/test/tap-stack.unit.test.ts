import fs from 'fs';
import path from 'path';

describe('CloudFormation Template', () => {
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
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });
    test('should have Resources and Outputs sections', () => {
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Resources', () => {
    test('should define SecureDeveloperRole with MFA enforcement', () => {
      const role = template.Resources.SecureDeveloperRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      const assume = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(assume.Condition.Bool['aws:MultiFactorAuthPresent']).toBe('true');
      expect(assume.Condition.NumericLessThan['aws:MultiFactorAuthAge']).toBe(
        '3600'
      );
      expect(role.Properties.ManagedPolicyArns[0].Ref).toBe(
        'DeveloperManagedPolicy'
      );
      expect(
        role.Properties.Tags.some(
          (t: any) => t.Key === 'MFARequired' && t.Value === 'true'
        )
      ).toBe(true);
    });
    test('should define SecureReadOnlyRole with MFA enforcement', () => {
      const role = template.Resources.SecureReadOnlyRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      const assume = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(assume.Condition.Bool['aws:MultiFactorAuthPresent']).toBe('true');
      expect(assume.Condition.NumericLessThan['aws:MultiFactorAuthAge']).toBe(
        '7200'
      );
      expect(role.Properties.ManagedPolicyArns[0].Ref).toBe(
        'ReadOnlyManagedPolicy'
      );
      expect(
        role.Properties.Tags.some(
          (t: any) => t.Key === 'MFARequired' && t.Value === 'true'
        )
      ).toBe(true);
    });
    test('should define SecureOperationsRole with MFA enforcement', () => {
      const role = template.Resources.SecureOperationsRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      const assume = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(assume.Condition.Bool['aws:MultiFactorAuthPresent']).toBe('true');
      expect(assume.Condition.NumericLessThan['aws:MultiFactorAuthAge']).toBe(
        '1800'
      );
      expect(role.Properties.ManagedPolicyArns[0].Ref).toBe(
        'OperationsManagedPolicy'
      );
      expect(
        role.Properties.Tags.some(
          (t: any) => t.Key === 'MFARequired' && t.Value === 'true'
        )
      ).toBe(true);
    });
    test('should define DeveloperManagedPolicy with least privilege', () => {
      const policy = template.Resources.DeveloperManagedPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::IAM::ManagedPolicy');
      const ec2Statement = policy.Properties.PolicyDocument.Statement.find(
        (s: any) => s.Sid === 'EC2DevelopmentAccess'
      );
      expect(ec2Statement).toBeDefined();
      expect(ec2Statement.Effect).toBe('Allow');
      expect(ec2Statement.Action).toContain('ec2:RunInstances');
      expect(ec2Statement.Condition.StringEquals['ec2:InstanceType']).toContain(
        't3.micro'
      );
    });
    test('should define ReadOnlyManagedPolicy with only read actions', () => {
      const policy = template.Resources.ReadOnlyManagedPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::IAM::ManagedPolicy');
      const readStatement = policy.Properties.PolicyDocument.Statement.find(
        (s: any) => s.Sid === 'GeneralReadOnlyAccess'
      );
      expect(readStatement).toBeDefined();
      expect(readStatement.Effect).toBe('Allow');
      expect(readStatement.Action).toContain('ec2:Describe*');
      expect(readStatement.Action).not.toContain('ec2:RunInstances');
    });
    test('should define OperationsManagedPolicy with region restriction', () => {
      const policy = template.Resources.OperationsManagedPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::IAM::ManagedPolicy');
      const ec2Statement = policy.Properties.PolicyDocument.Statement.find(
        (s: any) => s.Sid === 'EC2OperationalAccess'
      );
      expect(ec2Statement).toBeDefined();
      expect(
        ec2Statement.Condition.StringEquals['aws:RequestedRegion']
      ).toBeDefined();
    });
    test('should define SecurityAuditTrail for CloudTrail', () => {
      const trail = template.Resources.SecurityAuditTrail;
      expect(trail).toBeDefined();
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });
    test('should define CloudTrailLogsBucketPolicy for S3 bucket', () => {
      const policy = template.Resources.CloudTrailLogsBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.Bucket['Fn::Sub']).toMatch(
        /security-audit-logs-\$\{AWS::AccountId\}/
      );
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expected = [
        'SecureDeveloperRoleArn',
        'SecureReadOnlyRoleArn',
        'SecureOperationsRoleArn',
        'CloudTrailArn',
        'CloudTrailLogsBucketName',
      ];
      expected.forEach(key => expect(template.Outputs[key]).toBeDefined());
    });
    test('should have correct output descriptions and export names', () => {
      const outputs = template.Outputs;
      expect(outputs.SecureDeveloperRoleArn.Description).toMatch(
        /Developer Role/i
      );
      expect(outputs.SecureReadOnlyRoleArn.Description).toMatch(
        /Read-Only Role/i
      );
      expect(outputs.SecureOperationsRoleArn.Description).toMatch(
        /Operations Role/i
      );
      expect(outputs.CloudTrailArn.Description).toMatch(/CloudTrail/i);
      expect(outputs.CloudTrailLogsBucketName.Description).toMatch(
        /CloudTrail logs/i
      );
      expect(outputs.SecureDeveloperRoleArn.Export.Name).toBe(
        'SecureDeveloperRoleArn'
      );
      expect(outputs.SecureReadOnlyRoleArn.Export.Name).toBe(
        'SecureReadOnlyRoleArn'
      );
      expect(outputs.SecureOperationsRoleArn.Export.Name).toBe(
        'SecureOperationsRoleArn'
      );
      expect(outputs.CloudTrailArn.Export.Name).toBe('CloudTrailArn');
      expect(outputs.CloudTrailLogsBucketName.Export.Name).toBe(
        'CloudTrailLogsBucketName'
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
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
    test('should have at least 5 outputs', () => {
      expect(Object.keys(template.Outputs).length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Resource Naming Convention', () => {
    test('should use correct export names for outputs', () => {
      const outputs = template.Outputs;
      expect(outputs.SecureDeveloperRoleArn.Export.Name).toBe(
        'SecureDeveloperRoleArn'
      );
      expect(outputs.SecureReadOnlyRoleArn.Export.Name).toBe(
        'SecureReadOnlyRoleArn'
      );
      expect(outputs.SecureOperationsRoleArn.Export.Name).toBe(
        'SecureOperationsRoleArn'
      );
      expect(outputs.CloudTrailArn.Export.Name).toBe('CloudTrailArn');
      expect(outputs.CloudTrailLogsBucketName.Export.Name).toBe(
        'CloudTrailLogsBucketName'
      );
    });
    test('should apply tags to IAM roles', () => {
      const roles = [
        'SecureDeveloperRole',
        'SecureReadOnlyRole',
        'SecureOperationsRole',
      ];
      roles.forEach(roleName => {
        const role = template.Resources[roleName];
        expect(role.Properties.Tags).toBeDefined();
        expect(
          role.Properties.Tags.some(
            (t: any) => t.Key === 'MFARequired' && t.Value === 'true'
          )
        ).toBe(true);
      });
    });
  });
});
