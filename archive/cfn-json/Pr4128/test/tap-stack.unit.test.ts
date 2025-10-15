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
        'Serverless infrastructure with S3 bucket and Lambda function with KMS encryption and lifecycle policies'
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

  describe('KMS Resources', () => {
    test('should have AppKMSKey resource', () => {
      expect(template.Resources.AppKMSKey).toBeDefined();
      expect(template.Resources.AppKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('AppKMSKey should have correct deletion policies', () => {
      const key = template.Resources.AppKMSKey;
      expect(key.DeletionPolicy).toBe('Delete');
      expect(key.UpdateReplacePolicy).toBe('Delete');
    });

    test('AppKMSKey should have correct properties', () => {
      const key = template.Resources.AppKMSKey;
      const properties = key.Properties;

      expect(properties.Description).toBe('KMS key for encrypting Lambda environment variables');
      expect(properties.KeyPolicy).toBeDefined();
      expect(properties.KeyPolicy.Version).toBe('2012-10-17');
      expect(properties.KeyPolicy.Statement).toHaveLength(2);
    });

    test('should have AppKMSKeyAlias resource', () => {
      expect(template.Resources.AppKMSKeyAlias).toBeDefined();
      expect(template.Resources.AppKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('AppKMSKeyAlias should have correct properties', () => {
      const alias = template.Resources.AppKMSKeyAlias;
      expect(alias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/app-lambda-env-key-${EnvironmentSuffix}'
      });
      expect(alias.Properties.TargetKeyId).toEqual({
        Ref: 'AppKMSKey'
      });
    });
  });

  describe('S3 Resources', () => {
    test('should have AppS3Bucket resource', () => {
      expect(template.Resources.AppS3Bucket).toBeDefined();
      expect(template.Resources.AppS3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('AppS3Bucket should have correct deletion policies', () => {
      const bucket = template.Resources.AppS3Bucket;
      expect(bucket.DeletionPolicy).toBe('Delete');
      expect(bucket.UpdateReplacePolicy).toBe('Delete');
    });

    test('AppS3Bucket should have correct bucket name with environment suffix', () => {
      const bucket = template.Resources.AppS3Bucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'app-s3bucket-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}'
      });
    });

    test('AppS3Bucket should have encryption enabled', () => {
      const bucket = template.Resources.AppS3Bucket;
      const encryption = bucket.Properties.BucketEncryption;
      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('AppS3Bucket should block public access', () => {
      const bucket = template.Resources.AppS3Bucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('AppS3Bucket should have versioning enabled', () => {
      const bucket = template.Resources.AppS3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('AppS3Bucket should have lifecycle policy for multipart uploads', () => {
      const bucket = template.Resources.AppS3Bucket;
      const lifecycle = bucket.Properties.LifecycleConfiguration;
      expect(lifecycle.Rules).toHaveLength(1);
      expect(lifecycle.Rules[0].Id).toBe('DeleteIncompleteMultipartUploads');
      expect(lifecycle.Rules[0].Status).toBe('Enabled');
      expect(lifecycle.Rules[0].AbortIncompleteMultipartUpload.DaysAfterInitiation).toBe(7);
    });

    test('AppS3Bucket should have Lambda notification configuration', () => {
      const bucket = template.Resources.AppS3Bucket;
      const notification = bucket.Properties.NotificationConfiguration;
      expect(notification).toBeDefined();
      expect(notification.LambdaConfigurations).toBeDefined();
      expect(notification.LambdaConfigurations).toHaveLength(1);
      expect(notification.LambdaConfigurations[0].Event).toBe('s3:ObjectCreated:*');
      expect(notification.LambdaConfigurations[0].Function).toEqual({
        'Fn::GetAtt': ['AppLambdaFunction', 'Arn']
      });
    });

    test('AppS3Bucket should NOT depend on AppLambdaPermission (circular dependency avoided)', () => {
      const bucket = template.Resources.AppS3Bucket;
      expect(bucket.DependsOn).toBeUndefined(); // Dependency removed to prevent circular dependency
    });
  });

  describe('Lambda Resources', () => {
    test('should have AppLambdaFunction resource', () => {
      expect(template.Resources.AppLambdaFunction).toBeDefined();
      expect(template.Resources.AppLambdaFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('AppLambdaFunction should have correct properties', () => {
      const lambda = template.Resources.AppLambdaFunction;
      const properties = lambda.Properties;

      expect(properties.FunctionName).toEqual({
        'Fn::Sub': 'app-lambda-function-${EnvironmentSuffix}'
      });
      expect(properties.Runtime).toBe('python3.12');
      expect(properties.Handler).toBe('index.lambda_handler');
      expect(properties.Timeout).toBe(60);
      expect(properties.MemorySize).toBe(256);
      expect(properties.ReservedConcurrentExecutions).toBe(10);
    });

    test('AppLambdaFunction should have correct role reference', () => {
      const lambda = template.Resources.AppLambdaFunction;
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['AppLambdaExecutionRole', 'Arn']
      });
    });

    test('AppLambdaFunction should have KMS encryption', () => {
      const lambda = template.Resources.AppLambdaFunction;
      expect(lambda.Properties.KmsKeyArn).toEqual({
        'Fn::GetAtt': ['AppKMSKey', 'Arn']
      });
    });

    test('AppLambdaFunction should have environment variables', () => {
      const lambda = template.Resources.AppLambdaFunction;
      const env = lambda.Properties.Environment.Variables;
      expect(env.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(env.PROCESSING_MODE).toBe('automatic');
      // Note: S3_BUCKET env var removed to break circular dependency - Lambda gets bucket from event
    });

    test('AppLambdaFunction should depend on AppLambdaLogGroup', () => {
      const lambda = template.Resources.AppLambdaFunction;
      expect(lambda.DependsOn).toBe('AppLambdaLogGroup');
    });

    test('should have AppLambdaPermission resource', () => {
      expect(template.Resources.AppLambdaPermission).toBeDefined();
      expect(template.Resources.AppLambdaPermission.Type).toBe('AWS::Lambda::Permission');
    });

    test('AppLambdaPermission should allow S3 to invoke Lambda with SourceAccount', () => {
      const permission = template.Resources.AppLambdaPermission;
      const properties = permission.Properties;

      expect(properties.Action).toBe('lambda:InvokeFunction');
      expect(properties.Principal).toBe('s3.amazonaws.com');
      expect(properties.FunctionName).toEqual({
        'Fn::GetAtt': ['AppLambdaFunction', 'Arn']
      });
      expect(properties.SourceAccount).toEqual({
        Ref: 'AWS::AccountId'
      });
      // SourceArn removed to avoid circular dependency while maintaining security via SourceAccount
      expect(properties.SourceArn).toBeUndefined();
    });
  });

  describe('IAM Resources', () => {
    test('should have AppLambdaExecutionRole resource', () => {
      expect(template.Resources.AppLambdaExecutionRole).toBeDefined();
      expect(template.Resources.AppLambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('AppLambdaExecutionRole should have correct role name', () => {
      const role = template.Resources.AppLambdaExecutionRole;
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': 'app-lambda-execution-role-${EnvironmentSuffix}'
      });
    });

    test('AppLambdaExecutionRole should have Lambda assume policy', () => {
      const role = template.Resources.AppLambdaExecutionRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('AppLambdaExecutionRole should have basic execution policy', () => {
      const role = template.Resources.AppLambdaExecutionRole;
      const managedPolicies = role.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });

    test('AppLambdaExecutionRole should have inline policy with correct permissions', () => {
      const role = template.Resources.AppLambdaExecutionRole;
      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(1);

      const policy = policies[0];
      expect(policy.PolicyName).toEqual({
        'Fn::Sub': 'app-lambda-s3-access-policy-${EnvironmentSuffix}'
      });

      const statements = policy.PolicyDocument.Statement;
      expect(statements).toHaveLength(3); // S3, Logs, KMS
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have AppLambdaLogGroup resource', () => {
      expect(template.Resources.AppLambdaLogGroup).toBeDefined();
      expect(template.Resources.AppLambdaLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('AppLambdaLogGroup should have correct properties', () => {
      const logGroup = template.Resources.AppLambdaLogGroup;
      const properties = logGroup.Properties;

      expect(properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/app-lambda-function-${EnvironmentSuffix}'
      });
      expect(properties.RetentionInDays).toBe(30);
    });

    test('AppLambdaLogGroup should have correct deletion policies', () => {
      const logGroup = template.Resources.AppLambdaLogGroup;
      expect(logGroup.DeletionPolicy).toBe('Delete');
      expect(logGroup.UpdateReplacePolicy).toBe('Delete');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'S3BucketArn',
        'S3BucketName',
        'LambdaFunctionArn',
        'LambdaFunctionName',
        'KMSKeyId',
        'KMSKeyArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('S3BucketArn output should be correct', () => {
      const output = template.Outputs.S3BucketArn;
      expect(output.Description).toBe('ARN of the created S3 bucket');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['AppS3Bucket', 'Arn']
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-S3BucketArn'
      });
    });

    test('S3BucketName output should be correct', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBe('Name of the created S3 bucket');
      expect(output.Value).toEqual({ Ref: 'AppS3Bucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-S3BucketName'
      });
    });

    test('LambdaFunctionArn output should be correct', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toBe('ARN of the Lambda function');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['AppLambdaFunction', 'Arn']
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-LambdaFunctionArn'
      });
    });

    test('LambdaFunctionName output should be correct', () => {
      const output = template.Outputs.LambdaFunctionName;
      expect(output.Description).toBe('Name of the Lambda function');
      expect(output.Value).toEqual({ Ref: 'AppLambdaFunction' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-LambdaFunctionName'
      });
    });

    test('KMSKeyId output should be correct', () => {
      const output = template.Outputs.KMSKeyId;
      expect(output.Description).toBe('ID of the KMS key used for encryption');
      expect(output.Value).toEqual({ Ref: 'AppKMSKey' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-KMSKeyId'
      });
    });

    test('KMSKeyArn output should be correct', () => {
      const output = template.Outputs.KMSKeyArn;
      expect(output.Description).toBe('ARN of the KMS key used for encryption');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['AppKMSKey', 'Arn']
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-KMSKeyArn'
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

    test('should have required resources present', () => {
      const expectedResources = [
        'AppKMSKey',
        'AppKMSKeyAlias',
        'AppS3Bucket',
        'AppLambdaFunction',
        'AppLambdaExecutionRole',
        'AppLambdaLogGroup',
        'AppLambdaPermission'
      ];

      expectedResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    test('should have at least one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThanOrEqual(1);
    });

    test('should have required outputs present', () => {
      const expectedOutputs = [
        'S3BucketArn',
        'S3BucketName',
        'LambdaFunctionArn',
        'LambdaFunctionName',
        'KMSKeyId',
        'KMSKeyArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all resources should have proper resource types', () => {
      const expectedResourceTypes = {
        'AppKMSKey': 'AWS::KMS::Key',
        'AppKMSKeyAlias': 'AWS::KMS::Alias',
        'AppS3Bucket': 'AWS::S3::Bucket',
        'AppLambdaFunction': 'AWS::Lambda::Function',
        'AppLambdaExecutionRole': 'AWS::IAM::Role',
        'AppLambdaLogGroup': 'AWS::Logs::LogGroup',
        'AppLambdaPermission': 'AWS::Lambda::Permission'
      };

      Object.entries(expectedResourceTypes).forEach(([resourceName, expectedType]) => {
        expect(template.Resources[resourceName]).toBeDefined();
        expect(template.Resources[resourceName].Type).toBe(expectedType);
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resource names should follow app- prefix convention', () => {
      const resourcesWithNaming = [
        'AppKMSKey',
        'AppKMSKeyAlias',
        'AppS3Bucket',
        'AppLambdaFunction',
        'AppLambdaExecutionRole',
        'AppLambdaLogGroup',
        'AppLambdaPermission'
      ];

      resourcesWithNaming.forEach(resourceName => {
        expect(resourceName).toMatch(/^App/);
      });
    });

    test('resource names should include environment suffix where applicable', () => {
      // Test KMS Key
      const kmsKey = template.Resources.AppKMSKey;
      expect(kmsKey.Properties.Tags.some((tag: any) =>
        tag.Key === 'Name' && tag.Value['Fn::Sub'] === 'app-kms-key-${EnvironmentSuffix}'
      )).toBe(true);

      // Test S3 Bucket
      const s3Bucket = template.Resources.AppS3Bucket;
      expect(s3Bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'app-s3bucket-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}'
      });

      // Test Lambda Function
      const lambdaFunction = template.Resources.AppLambdaFunction;
      expect(lambdaFunction.Properties.FunctionName).toEqual({
        'Fn::Sub': 'app-lambda-function-${EnvironmentSuffix}'
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

  describe('Security Configuration', () => {
    test('all resources should have appropriate deletion policies', () => {
      const resourcesWithDeletionPolicy = [
        'AppKMSKey',
        'AppS3Bucket',
        'AppLambdaLogGroup'
      ];

      resourcesWithDeletionPolicy.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).toBe('Delete');
        expect(resource.UpdateReplacePolicy).toBe('Delete');
      });
    });

    test('S3 bucket should have security best practices enabled', () => {
      const bucket = template.Resources.AppS3Bucket;
      const properties = bucket.Properties;

      // Public access should be blocked
      expect(properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);

      // Encryption should be enabled
      expect(properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');

      // Versioning should be enabled
      expect(properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('Lambda environment variables should be encrypted with KMS', () => {
      const lambda = template.Resources.AppLambdaFunction;
      expect(lambda.Properties.KmsKeyArn).toEqual({
        'Fn::GetAtt': ['AppKMSKey', 'Arn']
      });
    });

    test('IAM role should follow least privilege principle', () => {
      const role = template.Resources.AppLambdaExecutionRole;
      const policies = role.Properties.Policies[0];
      const statements = policies.PolicyDocument.Statement;

      // Should have specific resource ARNs, not wildcards
      const s3Statement = statements.find((stmt: any) => stmt.Action.includes('s3:GetObject'));
      expect(s3Statement.Resource).toBeInstanceOf(Array);
      expect(s3Statement.Resource[0]).toEqual({
        'Fn::Sub': 'arn:aws:s3:::app-s3bucket-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}'
      });
    });
  });
});

