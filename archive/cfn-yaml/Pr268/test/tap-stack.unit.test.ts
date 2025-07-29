import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
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
      expect(template.Description).toBe(
        'Secure, Scalable, Fully Serverless Web Application Infrastructure'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have parameter groups in metadata', () => {
      const cfnInterface = template.Metadata['AWS::CloudFormation::Interface'];
      expect(cfnInterface.ParameterGroups).toBeDefined();
      expect(cfnInterface.ParameterGroups).toHaveLength(1);
      expect(cfnInterface.ParameterGroups[0].Label.default).toBe('Environment Configuration');
    });

    test('should have parameter labels in metadata', () => {
      const cfnInterface = template.Metadata['AWS::CloudFormation::Interface'];
      expect(cfnInterface.ParameterLabels).toBeDefined();
      expect(cfnInterface.ParameterLabels.EnvironmentSuffix).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('prod');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });

  });

  describe('KMS Resources', () => {
    test('should have KMSKey resource', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMSKey should have correct properties', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey.Properties.Description).toEqual({
        'Fn::Sub': 'KMS Key for ${EnvironmentSuffix} serverless application encryption'
      });
      expect(kmsKey.Properties.KeyPolicy).toBeDefined();
      expect(kmsKey.Properties.KeyPolicy.Version).toBe('2012-10-17');
    });

    test('KMSKey should have correct IAM permissions', () => {
      const kmsKey = template.Resources.KMSKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;
      
      expect(statements).toHaveLength(3);
      expect(statements[0].Sid).toBe('Enable IAM User Permissions');
      expect(statements[1].Sid).toBe('Allow CloudWatch Logs');
      expect(statements[2].Sid).toBe('Allow Lambda Service');
    });

    test('KMSKey should have correct tags', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey.Properties.Tags).toHaveLength(2);
      expect(kmsKey.Properties.Tags[0].Key).toBe('Environment');
    });

    test('should have KMSKeyAlias resource', () => {
      expect(template.Resources.KMSKeyAlias).toBeDefined();
      expect(template.Resources.KMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('KMSKeyAlias should reference KMSKey', () => {
      const alias = template.Resources.KMSKeyAlias;
      expect(alias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/${EnvironmentSuffix}-serverless-app-key'
      });
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'KMSKey' });
    });
  });

  describe('S3 Resources', () => {
    test('should have S3Bucket resource', () => {
      expect(template.Resources.S3Bucket).toBeDefined();
      expect(template.Resources.S3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3Bucket should have KMS encryption enabled', () => {
      const s3Bucket = template.Resources.S3Bucket;
      const encryption = s3Bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'KMSKey' });
      expect(encryption.BucketKeyEnabled).toBe(true);
    });

    test('S3Bucket should have versioning enabled', () => {
      const s3Bucket = template.Resources.S3Bucket;
      expect(s3Bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3Bucket should block all public access', () => {
      const s3Bucket = template.Resources.S3Bucket;
      const publicAccessBlock = s3Bucket.Properties.PublicAccessBlockConfiguration;
      
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('S3Bucket should have lifecycle configuration', () => {
      const s3Bucket = template.Resources.S3Bucket;
      const lifecycleRules = s3Bucket.Properties.LifecycleConfiguration.Rules;
      
      expect(lifecycleRules).toHaveLength(2);
      expect(lifecycleRules[0].Id).toBe('DeleteIncompleteMultipartUploads');
      expect(lifecycleRules[1].Id).toBe('TransitionToIA');
    });

    test('S3Bucket should have deletion and update policies', () => {
      const s3Bucket = template.Resources.S3Bucket;
      expect(s3Bucket.DeletionPolicy).toBe('Retain');
      expect(s3Bucket.UpdateReplacePolicy).toBe('Retain');
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have DynamoDBTable resource', () => {
      expect(template.Resources.DynamoDBTable).toBeDefined();
      expect(template.Resources.DynamoDBTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('DynamoDBTable should have correct table name', () => {
      const dynamoTable = template.Resources.DynamoDBTable;
      expect(dynamoTable.Properties.TableName).toEqual({
        'Fn::Sub': 'ServerlessAppTable-${EnvironmentSuffix}'
      });
    });

    test('DynamoDBTable should have correct attribute definitions', () => {
      const dynamoTable = template.Resources.DynamoDBTable;
      const attributeDefinitions = dynamoTable.Properties.AttributeDefinitions;

      expect(attributeDefinitions).toHaveLength(2);
      expect(attributeDefinitions[0]).toEqual({ AttributeName: 'id', AttributeType: 'S' });
      expect(attributeDefinitions[1]).toEqual({ AttributeName: 'timestamp', AttributeType: 'S' });
    });

    test('DynamoDBTable should have correct key schema', () => {
      const dynamoTable = template.Resources.DynamoDBTable;
      const keySchema = dynamoTable.Properties.KeySchema;

      expect(keySchema).toHaveLength(2);
      expect(keySchema[0]).toEqual({ AttributeName: 'id', KeyType: 'HASH' });
      expect(keySchema[1]).toEqual({ AttributeName: 'timestamp', KeyType: 'RANGE' });
    });

    test('DynamoDBTable should use pay-per-request billing', () => {
      const dynamoTable = template.Resources.DynamoDBTable;
      expect(dynamoTable.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('DynamoDBTable should have KMS encryption', () => {
      const dynamoTable = template.Resources.DynamoDBTable;
      const sseSpec = dynamoTable.Properties.SSESpecification;
      
      expect(sseSpec.SSEEnabled).toBe(true);
      expect(sseSpec.SSEType).toBe('KMS');
      expect(sseSpec.KMSMasterKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('DynamoDBTable should have point-in-time recovery enabled', () => {
      const dynamoTable = template.Resources.DynamoDBTable;
      expect(dynamoTable.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('DynamoDBTable should have streams enabled', () => {
      const dynamoTable = template.Resources.DynamoDBTable;
      expect(dynamoTable.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });
  });

  describe('Lambda Resources', () => {
    test('should have LambdaLogGroup resource', () => {
      expect(template.Resources.LambdaLogGroup).toBeDefined();
      expect(template.Resources.LambdaLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('LambdaLogGroup should have correct configuration', () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/${EnvironmentSuffix}-serverless-app-function'
      });
      expect(logGroup.Properties.RetentionInDays).toBe(14);
      expect(logGroup.Properties.KmsKeyId).toEqual({
        'Fn::GetAtt': ['KMSKey', 'Arn']
      });
    });

    test('should have LambdaExecutionRole resource', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('LambdaExecutionRole should have correct assume role policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const assumeRolePolicy = role.Properties.AssumeRolePolicyDocument;
      
      expect(assumeRolePolicy.Version).toBe('2012-10-17');
      expect(assumeRolePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumeRolePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('LambdaExecutionRole should have correct managed policies', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('LambdaExecutionRole should have DynamoDB access policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const dynamoPolicy = role.Properties.Policies.find((p: { PolicyName: string; }) => p.PolicyName === 'DynamoDBAccess');
      
      expect(dynamoPolicy).toBeDefined();
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:GetItem');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:PutItem');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Resource).toEqual({
        'Fn::GetAtt': ['DynamoDBTable', 'Arn']
      });
    });

    test('LambdaExecutionRole should have S3 access policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const s3Policy = role.Properties.Policies.find((p: { PolicyName: string; }) => p.PolicyName === 'S3Access');
      
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement).toHaveLength(2);
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
      expect(s3Policy.PolicyDocument.Statement[1].Action).toContain('s3:ListBucket');
    });

    test('LambdaExecutionRole should have KMS access policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const kmsPolicy = role.Properties.Policies.find((p: { PolicyName: string; }) => p.PolicyName === 'KMSAccess');
      
      expect(kmsPolicy).toBeDefined();
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:Decrypt');
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:GenerateDataKey');
      expect(kmsPolicy.PolicyDocument.Statement[0].Resource).toEqual({
        'Fn::GetAtt': ['KMSKey', 'Arn']
      });
    });

    test('LambdaExecutionRole should have CloudWatch Logs policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const logsPolicy = role.Properties.Policies.find((p: { PolicyName: string; }) => p.PolicyName === 'CloudWatchLogs');
      
      expect(logsPolicy).toBeDefined();
      expect(logsPolicy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogGroup');
      expect(logsPolicy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogStream');
      expect(logsPolicy.PolicyDocument.Statement[0].Action).toContain('logs:PutLogEvents');
    });

    test('should have LambdaFunction resource', () => {
      expect(template.Resources.LambdaFunction).toBeDefined();
      expect(template.Resources.LambdaFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('LambdaFunction should have correct configuration', () => {
      const lambdaFunction = template.Resources.LambdaFunction;
      
      expect(lambdaFunction.Properties.FunctionName).toEqual({
        'Fn::Sub': '${EnvironmentSuffix}-serverless-app-function'
      });
      expect(lambdaFunction.Properties.Runtime).toBe('python3.11');
      expect(lambdaFunction.Properties.Handler).toBe('index.lambda_handler');
      expect(lambdaFunction.Properties.Timeout).toBe(30);
      expect(lambdaFunction.Properties.MemorySize).toBe(256);
    });

    test('LambdaFunction should have correct environment variables', () => {
      const lambdaFunction = template.Resources.LambdaFunction;
      const envVars = lambdaFunction.Properties.Environment.Variables;
      
      expect(envVars.DYNAMODB_TABLE).toEqual({ Ref: 'DynamoDBTable' });
      expect(envVars.S3_BUCKET).toEqual({ Ref: 'S3Bucket' });
      expect(envVars.KMS_KEY_ID).toEqual({ Ref: 'KMSKey' });
      expect(envVars.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('LambdaFunction should have KMS encryption', () => {
      const lambdaFunction = template.Resources.LambdaFunction;
      expect(lambdaFunction.Properties.KmsKeyArn).toEqual({
        'Fn::GetAtt': ['KMSKey', 'Arn']
      });
    });

    test('LambdaFunction should depend on LambdaLogGroup', () => {
      const lambdaFunction = template.Resources.LambdaFunction;
      expect(lambdaFunction.DependsOn).toContain('LambdaLogGroup');
    });

    test('LambdaFunction should have inline code', () => {
      const lambdaFunction = template.Resources.LambdaFunction;
      expect(lambdaFunction.Properties.Code.ZipFile).toBeDefined();
      expect(lambdaFunction.Properties.Code.ZipFile).toContain('import json');
      expect(lambdaFunction.Properties.Code.ZipFile).toContain('def lambda_handler(event, context):');
    });
  });

  describe('Resource Tags', () => {

    test('all taggable resources should have Name tag', () => {
      const taggableResources = ['KMSKey', 'S3Bucket', 'DynamoDBTable', 'LambdaLogGroup'];
      
      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameTag = resource.Properties.Tags.find((tag: { Key: string; }) => tag.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag.Value).toHaveProperty('Fn::Sub');
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
    });

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(19); // KMSKey, KMSKeyAlias, S3Bucket, DynamoDBTable, LambdaLogGroup, LambdaExecutionRole, LambdaFunction
    });

    test('all resources should have Type property', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        expect(template.Resources[resourceName].Type).toBeDefined();
      });
    });

    test('all resources should have Properties section', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        expect(template.Resources[resourceName].Properties).toBeDefined();
      });
    });
  });

  describe('Security Validation', () => {
    test('S3 bucket should block all public access', () => {
      const s3Bucket = template.Resources.S3Bucket;
      const publicAccessBlock = s3Bucket.Properties.PublicAccessBlockConfiguration;
      
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('DynamoDB table should have encryption enabled', () => {
      const dynamoTable = template.Resources.DynamoDBTable;
      expect(dynamoTable.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('Lambda function should use customer-managed KMS key', () => {
      const lambdaFunction = template.Resources.LambdaFunction;
      expect(lambdaFunction.Properties.KmsKeyArn).toEqual({
        'Fn::GetAtt': ['KMSKey', 'Arn']
      });
    });

    test('CloudWatch logs should be encrypted', () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup.Properties.KmsKeyId).toEqual({
        'Fn::GetAtt': ['KMSKey', 'Arn']
      });
    });

    test('IAM role should follow least privilege principle', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      
      // Check that each policy is specific to its purpose
      expect(policies).toHaveLength(4);
      expect(policies.find((p: { PolicyName: string; }) => p.PolicyName === 'DynamoDBAccess')).toBeDefined();
      expect(policies.find((p: { PolicyName: string; }) => p.PolicyName === 'S3Access')).toBeDefined();
      expect(policies.find((p: { PolicyName: string; }) => p.PolicyName === 'KMSAccess')).toBeDefined();
      expect(policies.find((p: { PolicyName: string; }) => p.PolicyName === 'CloudWatchLogs')).toBeDefined();
    });
  });

  describe('Resource Naming Convention', () => {
    test('resource names should follow consistent pattern', () => {
      const expectedResourceNames = [
        'KMSKey',
        'KMSKeyAlias', 
        'S3Bucket',
        'DynamoDBTable',
        'LambdaLogGroup',
        'LambdaExecutionRole',
        'LambdaFunction'
      ];

      expectedResourceNames.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    test('dynamic resource names should use environment suffix', () => {
      const dynamoTable = template.Resources.DynamoDBTable;
      expect(dynamoTable.Properties.TableName).toEqual({
        'Fn::Sub': 'ServerlessAppTable-${EnvironmentSuffix}'
      });

      const lambdaFunction = template.Resources.LambdaFunction;
      expect(lambdaFunction.Properties.FunctionName).toEqual({
        'Fn::Sub': '${EnvironmentSuffix}-serverless-app-function'
      });
    });
  });
});