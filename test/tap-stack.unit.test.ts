import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('IAM Security Resources', () => {
    test('should have TestS3Bucket resource', () => {
      expect(template.Resources.TestS3Bucket).toBeDefined();
      expect(template.Resources.TestS3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have EC2InstanceRole resource', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have EC2InstanceProfile resource', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have TestIAMUser resource', () => {
      expect(template.Resources.TestIAMUser).toBeDefined();
      expect(template.Resources.TestIAMUser.Type).toBe('AWS::IAM::User');
    });

    test('should have S3SpecificBucketReadOnlyPolicy resource', () => {
      expect(template.Resources.S3SpecificBucketReadOnlyPolicy).toBeDefined();
      expect(template.Resources.S3SpecificBucketReadOnlyPolicy.Type).toBe('AWS::IAM::Policy');
    });

    test('EC2InstanceRole should have S3 read-only permissions with explicit deny on write', () => {
      const role = template.Resources.EC2InstanceRole;
      const policy = role.Properties.Policies[0];
      
      expect(policy.PolicyName).toBe('S3ReadOnlyAccess');
      expect(policy.PolicyDocument.Statement).toHaveLength(2);
      
      // Check allow statement
      const allowStatement = policy.PolicyDocument.Statement[0];
      expect(allowStatement.Effect).toBe('Allow');
      expect(allowStatement.Action).toContain('s3:GetObject');
      expect(allowStatement.Action).toContain('s3:ListBucket');
      
      // Check deny statement
      const denyStatement = policy.PolicyDocument.Statement[1];
      expect(denyStatement.Effect).toBe('Deny');
      expect(denyStatement.Action).toContain('s3:PutObject');
      expect(denyStatement.Action).toContain('s3:DeleteObject');
    });

    test('S3SpecificBucketReadOnlyPolicy should have correct read-only permissions', () => {
      const policy = template.Resources.S3SpecificBucketReadOnlyPolicy;
      const statement = policy.Properties.PolicyDocument.Statement[0];
      
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toContain('s3:GetObject');
      expect(statement.Action).toContain('s3:ListBucket');
      expect(statement.Resource).toHaveLength(2); // bucket and bucket/*
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'TAP Stack - Task Assignment Platform CloudFormation Template'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
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
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });
  });

  describe('Resources', () => {
    test('should have TurnAroundPromptTable resource', () => {
      expect(template.Resources.TurnAroundPromptTable).toBeDefined();
    });

    test('TurnAroundPromptTable should be a DynamoDB table', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('TurnAroundPromptTable should have correct deletion policies', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });

    test('TurnAroundPromptTable should have correct properties', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const properties = table.Properties;

      expect(properties.TableName).toEqual({
        'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}',
      });
      expect(properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(properties.DeletionProtectionEnabled).toBe(false);
    });

    test('TurnAroundPromptTable should have correct attribute definitions', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const attributeDefinitions = table.Properties.AttributeDefinitions;

      expect(attributeDefinitions).toHaveLength(1);
      expect(attributeDefinitions[0].AttributeName).toBe('id');
      expect(attributeDefinitions[0].AttributeType).toBe('S');
    });

    test('TurnAroundPromptTable should have correct key schema', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('id');
      expect(keySchema[0].KeyType).toBe('HASH');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'TestS3BucketName',
        'TestS3BucketArn',
        'EC2InstanceRoleArn',
        'EC2InstanceProfileArn',
        'TestIAMUserArn',
        'S3SpecificBucketReadOnlyPolicyArn',
        'StackName',
        'EnvironmentSuffix',
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

    test('should have exactly six resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(6); // DynamoDB, S3, IAM Role, Instance Profile, IAM User, IAM Policy
    });

    test('should have exactly one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have exactly ten outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(10); // All the security resources plus original outputs
    });
  });

  describe('Resource Naming Convention', () => {
    test('table name should follow naming convention with environment suffix', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const tableName = table.Properties.TableName;

      expect(tableName).toEqual({
        'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}',
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
});
