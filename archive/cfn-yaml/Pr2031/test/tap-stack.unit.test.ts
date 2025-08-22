import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - IAM MFA Enforcement', () => {
  let template: any;

  beforeAll(() => {
    // Template converted from YAML to JSON for testing
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description for MFA enforcement', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'TAP Stack - IAM MFA Enforcement CloudFormation Template'
      );
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all MFA-related parameters', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.MFAMaxSessionDuration).toBeDefined();
      expect(template.Parameters.RequireMFAAge).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });

    test('MFAMaxSessionDuration parameter should have correct properties', () => {
      const mfaParam = template.Parameters.MFAMaxSessionDuration;
      expect(mfaParam.Type).toBe('Number');
      expect(mfaParam.Default).toBe(3600);
      expect(mfaParam.MinValue).toBe(900);
      expect(mfaParam.MaxValue).toBe(43200);
    });

    test('RequireMFAAge parameter should have correct properties', () => {
      const ageParam = template.Parameters.RequireMFAAge;
      expect(ageParam.Type).toBe('Number');
      expect(ageParam.Default).toBe(3600);
      expect(ageParam.MinValue).toBe(0);
      expect(ageParam.MaxValue).toBe(86400);
    });
  });

  describe('Resources', () => {
    test('should have all MFA-related resources', () => {
      expect(template.Resources.MFAEnforcedAdminRole).toBeDefined();
      expect(template.Resources.MFAEnforcedDeveloperRole).toBeDefined();
      expect(template.Resources.MFAEnforcementPolicy).toBeDefined();
      expect(template.Resources.DeveloperPermissionsPolicy).toBeDefined();
      expect(template.Resources.IdentityCenterMFAPolicy).toBeDefined();
      expect(template.Resources.TurnAroundPromptTable).toBeDefined();
    });

    test('MFAEnforcedAdminRole should be an IAM role with MFA conditions', () => {
      const role = template.Resources.MFAEnforcedAdminRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      const statement = trustPolicy.Statement[0];
      expect(statement.Condition.Bool['aws:MultiFactorAuthPresent']).toBe('true');
      expect(statement.Condition.NumericLessThan['aws:MultiFactorAuthAge']).toEqual({Ref: 'RequireMFAAge'});
    });

    test('MFAEnforcedDeveloperRole should be an IAM role with regional restrictions', () => {
      const role = template.Resources.MFAEnforcedDeveloperRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      const statement = trustPolicy.Statement[0];
      expect(statement.Condition.StringEquals['aws:RequestedRegion']).toContain('us-east-1');
      expect(statement.Condition.StringEquals['aws:RequestedRegion']).toContain('us-west-1');
    });

    test('MFAEnforcementPolicy should be an IAM managed policy', () => {
      const policy = template.Resources.MFAEnforcementPolicy;
      expect(policy.Type).toBe('AWS::IAM::ManagedPolicy');
      
      const policyDoc = policy.Properties.PolicyDocument;
      expect(policyDoc.Statement).toBeDefined();
      expect(policyDoc.Statement.length).toBeGreaterThan(2); // Should have multiple statements
    });

    test('TurnAroundPromptTable should have correct properties with hyphen', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      
      const properties = table.Properties;
      expect(properties.TableName).toEqual({
        'Fn::Sub': 'TurnAroundPromptTable-${EnvironmentSuffix}',
      });
      expect(properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(properties.DeletionProtectionEnabled).toBe(false);
    });

    test('TurnAroundPromptTable should have correct deletion policies', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });

    test('TurnAroundPromptTable should have correct attribute definitions', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const attributeDefinitions = table.Properties.AttributeDefinitions;

      expect(attributeDefinitions).toHaveLength(1);
      expect(attributeDefinitions[0].AttributeName).toBe('id');
      expect(attributeDefinitions[0].AttributeType).toBe('S');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs including MFA-related ARNs', () => {
      const expectedOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix',
        'MFAEnforcedAdminRoleArn',
        'MFAEnforcedDeveloperRoleArn',
        'MFAEnforcementPolicyArn',
        'DeveloperPermissionsPolicyArn',
        'IdentityCenterMFAPolicyArn',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('TurnAroundPromptTableName output should be correct', () => {
      const output = template.Outputs.TurnAroundPromptTableName;
      expect(output.Description).toBe('Name of the DynamoDB table');
      expect(output.Value).toEqual({ Ref: 'TurnAroundPromptTable' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-TurnAroundPromptTableName',
      });
    });

    test('TurnAroundPromptTableArn output should be correct', () => {
      const output = template.Outputs.TurnAroundPromptTableArn;
      expect(output.Description).toBe('ARN of the DynamoDB table');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['TurnAroundPromptTable', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-TurnAroundPromptTableArn',
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

    test('EnvironmentSuffix output should be correct', () => {
      const output = template.Outputs.EnvironmentSuffix;
      expect(output.Description).toBe(
        'Environment suffix used for this deployment'
      );
      expect(output.Value).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EnvironmentSuffix',
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

    test('should have six resources for MFA enforcement', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(6);
    });

    test('should have three parameters for MFA configuration', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });

    test('should have nine outputs including MFA ARNs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(9);
    });
  });

  describe('Resource Naming Convention', () => {
    test('table name should follow naming convention with hyphen', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const tableName = table.Properties.TableName;

      expect(tableName).toEqual({
        'Fn::Sub': 'TurnAroundPromptTable-${EnvironmentSuffix}',
      });
    });

    test('IAM roles should follow naming convention', () => {
      const adminRole = template.Resources.MFAEnforcedAdminRole;
      const devRole = template.Resources.MFAEnforcedDeveloperRole;
      
      expect(adminRole.Properties.RoleName).toEqual({
        'Fn::Sub': 'MFAEnforcedAdminRole-${EnvironmentSuffix}',
      });
      expect(devRole.Properties.RoleName).toEqual({
        'Fn::Sub': 'MFAEnforcedDeveloperRole-${EnvironmentSuffix}',
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
    });
  });

  describe('MFA Security Features', () => {
    test('should have FIDO2 support in MFA enforcement policy', () => {
      const policy = template.Resources.MFAEnforcementPolicy;
      const policyDoc = policy.Properties.PolicyDocument;
      
      // Look for FIDO2 support statement
      const fido2Statement = policyDoc.Statement.find((stmt: any) => 
        stmt.Sid === 'AllowFIDO2SecurityKeyManagement'
      );
      expect(fido2Statement).toBeDefined();
      expect(fido2Statement.Condition.StringEquals['iam:AWSServiceName']).toBe('fido.aws.amazon.com');
    });

    test('should have Identity Center integration policy', () => {
      const policy = template.Resources.IdentityCenterMFAPolicy;
      expect(policy.Type).toBe('AWS::IAM::ManagedPolicy');
      
      const policyDoc = policy.Properties.PolicyDocument;
      const ssoStatement = policyDoc.Statement.find((stmt: any) => 
        stmt.Action.includes('sso:ListInstances')
      );
      expect(ssoStatement).toBeDefined();
    });

    test('should have proper MFA deny conditions', () => {
      const policy = template.Resources.MFAEnforcementPolicy;
      const policyDoc = policy.Properties.PolicyDocument;
      
      const denyStatement = policyDoc.Statement.find((stmt: any) => 
        stmt.Sid === 'DenyAllWithoutMFA'
      );
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Effect).toBe('Deny');
      expect(denyStatement.Condition.BoolIfExists['aws:MultiFactorAuthPresent']).toBe('false');
    });
  });
});
