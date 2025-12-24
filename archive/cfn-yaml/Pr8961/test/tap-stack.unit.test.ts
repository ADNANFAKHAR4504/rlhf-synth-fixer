import * as fs from 'fs';
import * as path from 'path';

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
    test('should have all required resources', () => {
      const expectedResources = [
        'TestS3Bucket',
        'EC2InstanceRole',
        'EC2InstanceProfile',
        'TestIAMUser',
        'S3SpecificBucketReadOnlyPolicy',
        'TurnAroundPromptTable',
      ];

      expectedResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

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

    // S3 Bucket Tests
    describe('TestS3Bucket', () => {
      test('should be an S3 bucket', () => {
        const bucket = template.Resources.TestS3Bucket;
        expect(bucket.Type).toBe('AWS::S3::Bucket');
      });

      test('should have correct deletion policies', () => {
        const bucket = template.Resources.TestS3Bucket;
        expect(bucket.DeletionPolicy).toBe('Delete');
        expect(bucket.UpdateReplacePolicy).toBe('Delete');
      });

      test('should have encryption configured', () => {
        const bucket = template.Resources.TestS3Bucket;
        const encryption = bucket.Properties.BucketEncryption;
        expect(
          encryption.ServerSideEncryptionConfiguration[0]
            .ServerSideEncryptionByDefault.SSEAlgorithm
        ).toBe('AES256');
      });

      test('should have public access blocked', () => {
        const bucket = template.Resources.TestS3Bucket;
        const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });

      test('should have versioning enabled', () => {
        const bucket = template.Resources.TestS3Bucket;
        expect(bucket.Properties.VersioningConfiguration.Status).toBe(
          'Enabled'
        );
      });
    });

    // IAM Role Tests
    describe('EC2InstanceRole', () => {
      test('should be an IAM role', () => {
        const role = template.Resources.EC2InstanceRole;
        expect(role.Type).toBe('AWS::IAM::Role');
      });

      test('should allow EC2 service to assume role', () => {
        const role = template.Resources.EC2InstanceRole;
        const assumePolicy = role.Properties.AssumeRolePolicyDocument;
        expect(assumePolicy.Statement[0].Effect).toBe('Allow');
        expect(assumePolicy.Statement[0].Principal.Service).toBe(
          'ec2.amazonaws.com'
        );
        expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
      });

      test('should have S3 read-only managed policy', () => {
        const role = template.Resources.EC2InstanceRole;
        expect(role.Properties.ManagedPolicyArns).toContain(
          'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess'
        );
      });

      test('should have explicit S3 write deny policy', () => {
        const role = template.Resources.EC2InstanceRole;
        const policies = role.Properties.Policies;
        expect(policies).toHaveLength(1);

        const denyPolicy = policies[0];
        expect(denyPolicy.PolicyDocument.Statement[0].Effect).toBe('Deny');
        expect(denyPolicy.PolicyDocument.Statement[0].Resource).toBe('*');

        const denyActions = denyPolicy.PolicyDocument.Statement[0].Action;
        expect(denyActions).toContain('s3:PutObject');
        expect(denyActions).toContain('s3:DeleteObject');
        expect(denyActions).toContain('s3:PutBucketPolicy');
        expect(denyActions).toContain('s3:DeleteBucket');
      });
    });

    // Instance Profile Tests
    describe('EC2InstanceProfile', () => {
      test('should be an instance profile', () => {
        const profile = template.Resources.EC2InstanceProfile;
        expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      });

      test('should reference the EC2 instance role', () => {
        const profile = template.Resources.EC2InstanceProfile;
        expect(profile.Properties.Roles).toEqual([{ Ref: 'EC2InstanceRole' }]);
      });
    });

    // IAM User Tests
    describe('TestIAMUser', () => {
      test('should be an IAM user', () => {
        const user = template.Resources.TestIAMUser;
        expect(user).toBeDefined();
        expect(user.Type).toBe('AWS::IAM::User');
      });

      test('should have properties defined', () => {
        const user = template.Resources.TestIAMUser;
        expect(user.Properties).toBeDefined();
      });
      test('should have UserName property if specified in template', () => {
        const user = template.Resources.TestIAMUser;
        if (user.Properties.UserName) {
          expect(user.Properties.UserName).toEqual({
            'Fn::Sub': 'test-s3-user-${EnvironmentSuffix}',
          });
        }
      });

      test('should not have any managed policies attached directly', () => {
        const user = template.Resources.TestIAMUser;
        expect(user.Properties.ManagedPolicyArns).toBeUndefined();
      });

      test('should not have inline policies attached directly', () => {
        const user = template.Resources.TestIAMUser;
        expect(user.Properties.Policies).toBeUndefined();
      });

      test('should not have groups specified', () => {
        const user = template.Resources.TestIAMUser;
        expect(user.Properties.Groups).toBeUndefined();
      });

      test('should have path property as default if not specified', () => {
        const user = template.Resources.TestIAMUser;
        if (user.Properties.Path) {
          expect(user.Properties.Path).toBe('/');
        }
      });

      test('should not have permissions boundary specified', () => {
        const user = template.Resources.TestIAMUser;
        expect(user.Properties.PermissionsBoundary).toBeUndefined();
      });
    });

    // IAM Policy Tests
    describe('S3SpecificBucketReadOnlyPolicy', () => {
      test('should be an IAM policy', () => {
        const policy = template.Resources.S3SpecificBucketReadOnlyPolicy;
        expect(policy.Type).toBe('AWS::IAM::Policy');
      });

      test('should be attached to the test IAM user', () => {
        const policy = template.Resources.S3SpecificBucketReadOnlyPolicy;
        expect(policy.Properties.Users).toEqual([{ Ref: 'TestIAMUser' }]);
      });

      test('should allow read-only access to specific S3 bucket', () => {
        const policy = template.Resources.S3SpecificBucketReadOnlyPolicy;
        const statement = policy.Properties.PolicyDocument.Statement[0];

        expect(statement.Effect).toBe('Allow');
        expect(statement.Action).toContain('s3:GetObject');
        expect(statement.Action).toContain('s3:ListBucket');
        expect(statement.Action).toContain('s3:GetBucketLocation');

        expect(statement.Resource).toEqual([
          { 'Fn::GetAtt': ['TestS3Bucket', 'Arn'] },
          { 'Fn::Sub': '${TestS3Bucket.Arn}/*' },
        ]);
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'TestS3BucketName',
        'TestS3BucketArn',
        'EC2InstanceRoleName',
        'EC2InstanceRoleArn',
        'EC2InstanceProfileName',
        'EC2InstanceProfileArn',
        'TestIAMUserName',
        'TestIAMUserArn',
        'S3SpecificBucketReadOnlyPolicyName',
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
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
      expect(resourceCount).toBe(6);
    });

    test('should have exactly one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have exactly thirteen outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(13);
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
