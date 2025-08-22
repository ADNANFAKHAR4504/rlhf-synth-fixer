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


  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'TAP Stack - Secure Task Assignment Platform with S3 and DynamoDB Infrastructure'
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
    const expectedResources = [
      'TAPAccessRole',
      'TAPDynamoDBKMSKey', 
      'TAPDynamoDBKMSKeyAlias',
      'TAPSecureS3Bucket',
      'TAPS3AccessLogsBucket',
      'TAPSecureS3BucketPolicy',
      'TAPS3LogGroup',
      'TurnAroundPromptTable',
      'TAPDynamoDBAccessPolicy'
    ];

    test('should have all required resources', () => {
      expectedResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    describe('IAM Role', () => {
      test('TAPAccessRole should be an IAM role', () => {
        const role = template.Resources.TAPAccessRole;
        expect(role.Type).toBe('AWS::IAM::Role');
      });

      test('TAPAccessRole should have correct properties', () => {
        const role = template.Resources.TAPAccessRole;
        const properties = role.Properties;
        expect(properties.RoleName).toEqual({
          'Fn::Sub': 'TAPAccessRole-${EnvironmentSuffix}'
        });
        expect(properties.AssumeRolePolicyDocument).toBeDefined();
      });
    });

    describe('KMS Resources', () => {
      test('TAPDynamoDBKMSKey should be a KMS key', () => {
        const kmsKey = template.Resources.TAPDynamoDBKMSKey;
        expect(kmsKey.Type).toBe('AWS::KMS::Key');
      });

      test('TAPDynamoDBKMSKeyAlias should be a KMS alias', () => {
        const alias = template.Resources.TAPDynamoDBKMSKeyAlias;
        expect(alias.Type).toBe('AWS::KMS::Alias');
        expect(alias.Properties.AliasName).toEqual({
          'Fn::Sub': 'alias/tap-dynamodb-${EnvironmentSuffix}'
        });
      });
    });

    describe('S3 Resources', () => {
      test('TAPSecureS3Bucket should be an S3 bucket', () => {
        const bucket = template.Resources.TAPSecureS3Bucket;
        expect(bucket.Type).toBe('AWS::S3::Bucket');
      });

      test('TAPS3AccessLogsBucket should be an S3 bucket', () => {
        const logsBucket = template.Resources.TAPS3AccessLogsBucket;
        expect(logsBucket.Type).toBe('AWS::S3::Bucket');
      });

      test('TAPSecureS3BucketPolicy should be an S3 bucket policy', () => {
        const policy = template.Resources.TAPSecureS3BucketPolicy;
        expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      });

      test('S3 bucket should have encryption enabled', () => {
        const bucket = template.Resources.TAPSecureS3Bucket;
        const encryption = bucket.Properties.BucketEncryption;
        expect(encryption).toBeDefined();
        expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      });

      test('S3 bucket should have versioning enabled', () => {
        const bucket = template.Resources.TAPSecureS3Bucket;
        expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      });

      test('S3 bucket should block public access', () => {
        const bucket = template.Resources.TAPSecureS3Bucket;
        const publicBlock = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicBlock.BlockPublicAcls).toBe(true);
        expect(publicBlock.BlockPublicPolicy).toBe(true);
        expect(publicBlock.IgnorePublicAcls).toBe(true);
        expect(publicBlock.RestrictPublicBuckets).toBe(true);
      });
    });

    describe('DynamoDB Table', () => {
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

      test('TurnAroundPromptTable should have KMS encryption', () => {
        const table = template.Resources.TurnAroundPromptTable;
        const sse = table.Properties.SSESpecification;
        expect(sse.SSEEnabled).toBe(true);
        expect(sse.SSEType).toBe('KMS');
        expect(sse.KMSMasterKeyId).toEqual({ Ref: 'TAPDynamoDBKMSKey' });
      });

      test('TurnAroundPromptTable should have point-in-time recovery enabled', () => {
        const table = template.Resources.TurnAroundPromptTable;
        expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
      });

      test('TurnAroundPromptTable should have streams enabled', () => {
        const table = template.Resources.TurnAroundPromptTable;
        expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
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

    describe('CloudWatch Log Group', () => {
      test('TAPS3LogGroup should be a CloudWatch log group', () => {
        const logGroup = template.Resources.TAPS3LogGroup;
        expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      });

      test('TAPS3LogGroup should have correct retention', () => {
        const logGroup = template.Resources.TAPS3LogGroup;
        expect(logGroup.Properties.RetentionInDays).toBe(30);
      });
    });

    describe('IAM Policy', () => {
      test('TAPDynamoDBAccessPolicy should be an IAM policy', () => {
        const policy = template.Resources.TAPDynamoDBAccessPolicy;
        expect(policy.Type).toBe('AWS::IAM::Policy');
      });

      test('TAPDynamoDBAccessPolicy should have correct DynamoDB permissions', () => {
        const policy = template.Resources.TAPDynamoDBAccessPolicy;
        const policyDoc = policy.Properties.PolicyDocument;
        const statements = policyDoc.Statement;
        
        const dynamoStatement = statements.find((s: any) => 
          s.Action.includes('dynamodb:GetItem'));
        expect(dynamoStatement).toBeDefined();
        expect(dynamoStatement.Effect).toBe('Allow');
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'S3BucketName',
        'S3BucketArn', 
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'KMSKeyId',
        'TAPAccessRoleArn',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('S3BucketName output should be correct', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBe('Name of the secure TAP S3 bucket');
      expect(output.Value).toEqual({ Ref: 'TAPSecureS3Bucket' });
    });

    test('S3BucketArn output should be correct', () => {
      const output = template.Outputs.S3BucketArn;
      expect(output.Description).toBe('ARN of the secure TAP S3 bucket');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['TAPSecureS3Bucket', 'Arn'],
      });
    });

    test('KMSKeyId output should be correct', () => {
      const output = template.Outputs.KMSKeyId;
      expect(output.Description).toBe('KMS Key ID for DynamoDB encryption');
      expect(output.Value).toEqual({ Ref: 'TAPDynamoDBKMSKey' });
    });

    test('TAPAccessRoleArn output should be correct', () => {
      const output = template.Outputs.TAPAccessRoleArn;
      expect(output.Description).toBe('ARN of the TAP access role');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['TAPAccessRole', 'Arn'],
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

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(8); // At least 8 main resources
    });

    test('should have exactly one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(8); // At least 8 outputs
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
