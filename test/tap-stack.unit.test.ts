import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'prod';

describe('Expert-Level Secure CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON template that was converted from YAML
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a comprehensive description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Expert-level CloudFormation template for secure infrastructure deployment in us-east-1'
      );
    });

    test('should have all required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters with proper defaults', () => {
      const expectedParams = [
        'ProjectName',
        'Environment'
      ];
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('ProjectName parameter should have correct properties', () => {
      const param = template.Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('secureorg');
      expect(param.AllowedPattern).toBe('^[a-z][a-z0-9-]*$');
      expect(param.ConstraintDescription).toContain('lowercase letter');
      expect(param.MinLength).toBe(3);
      expect(param.MaxLength).toBe(20);
    });

    test('Environment parameter should have correct properties', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('prod');
      expect(param.AllowedValues).toEqual(['dev', 'staging', 'prod']);
      expect(param.Description).toContain('Environment for deployment');
    });


  });

  describe('Password Policy Resources', () => {
    test('should have Password Policy Lambda Role with correct permissions', () => {
      const role = template.Resources.PasswordPolicyLambdaRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
      expect(role.Properties.Policies).toHaveLength(1);
      
      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('IAMPasswordPolicyAccess');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('iam:UpdateAccountPasswordPolicy');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('iam:GetAccountPasswordPolicy');
    });

    test('should have Password Policy Lambda Function with correct configuration', () => {
      const lambda = template.Resources.PasswordPolicyLambda;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.9');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
      expect(lambda.Properties.Timeout).toBe(60);
      expect(lambda.Properties.Code.ZipFile).toContain('MinimumPasswordLength=12');
      expect(lambda.Properties.Code.ZipFile).toContain('RequireSymbols=True');
      expect(lambda.Properties.Code.ZipFile).toContain('RequireNumbers=True');
      expect(lambda.Properties.Code.ZipFile).toContain('RequireUppercaseCharacters=True');
      expect(lambda.Properties.Code.ZipFile).toContain('RequireLowercaseCharacters=True');
      expect(lambda.Properties.Code.ZipFile).toContain('PasswordReusePrevention=12');
      expect(lambda.Properties.Code.ZipFile).toContain('HardExpiry=True');
    });

    test('should have Custom Resource to trigger password policy enforcement', () => {
      const customResource = template.Resources.PasswordPolicyCustomResource;
      expect(customResource.Type).toBe('AWS::CloudFormation::CustomResource');
      expect(customResource.Properties.ServiceToken).toEqual({
        'Fn::GetAtt': ['PasswordPolicyLambda', 'Arn']
      });
    });
  });

  describe('S3 Buckets', () => {
    test('should have Primary Data Bucket with correct security settings', () => {
      const bucket = template.Resources.PrimaryDataBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': '${ProjectName}-${Environment}-s3bucket-primary'
      });
      
      // Security settings
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
      
      // Encryption
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].BucketKeyEnabled).toBe(true);
      
      // Versioning
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      
      // Lifecycle rules
      expect(bucket.Properties.LifecycleConfiguration.Rules).toHaveLength(2);
      expect(bucket.Properties.LifecycleConfiguration.Rules[0].Transitions[0].TransitionInDays).toBe(30);
      expect(bucket.Properties.LifecycleConfiguration.Rules[0].Transitions[0].StorageClass).toBe('STANDARD_IA');
      expect(bucket.Properties.LifecycleConfiguration.Rules[1].Transitions[0].TransitionInDays).toBe(90);
      expect(bucket.Properties.LifecycleConfiguration.Rules[1].Transitions[0].StorageClass).toBe('GLACIER');
    });

    test('should have Backup Data Bucket with security settings', () => {
      const bucket = template.Resources.BackupDataBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': '${ProjectName}-${Environment}-s3bucket-backup'
      });
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have Logs Bucket with extended retention policy', () => {
      const bucket = template.Resources.LogsBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': '${ProjectName}-${Environment}-s3bucket-logs'
      });
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      
      // Extended retention rules
      expect(bucket.Properties.LifecycleConfiguration.Rules).toHaveLength(2);
      expect(bucket.Properties.LifecycleConfiguration.Rules[0].Transitions[0].TransitionInDays).toBe(365);
      expect(bucket.Properties.LifecycleConfiguration.Rules[1].ExpirationInDays).toBe(2555); // 7 years
    });

    test('should verify S3 bucket notification permissions exist', () => {
      // Since we removed the S3BucketNotification resource, verify the Lambda permission exists
      const permission = template.Resources.S3InvokeLambdaPermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('s3.amazonaws.com');
      expect(permission.Properties.SourceArn).toEqual({
        'Fn::GetAtt': ['PrimaryDataBucket', 'Arn']
      });
      expect(permission.Properties.SourceAccount).toEqual({
        Ref: 'AWS::AccountId'
      });
    });
  });

  describe('Lambda Function Resources', () => {
    test('should have Lambda Execution Role with minimal privileges', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
      expect(role.Properties.Policies).toHaveLength(1);
      
      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('S3AccessPolicy');
      expect(policy.PolicyDocument.Statement).toHaveLength(3);
      
      // Check S3 object permissions with proper ARN format
      const objectStatement = policy.PolicyDocument.Statement[0];
      expect(objectStatement.Action).toContain('s3:GetObject');
      expect(objectStatement.Action).toContain('s3:PutObject');
      expect(objectStatement.Action).toContain('s3:DeleteObject');
      expect(objectStatement.Resource).toContainEqual({
        'Fn::Sub': 'arn:aws:s3:::${PrimaryDataBucket}/*'
      });
      
      // Check S3 bucket permissions with proper ARN format
      const bucketStatement = policy.PolicyDocument.Statement[1];
      expect(bucketStatement.Action).toContain('s3:ListBucket');
      expect(bucketStatement.Resource).toContainEqual({
        'Fn::GetAtt': ['PrimaryDataBucket', 'Arn']
      });
    });

    test('should have Data Processor Lambda with secure configuration', () => {
      const lambda = template.Resources.DataProcessorLambda;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.9');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
      expect(lambda.Properties.Timeout).toBe(300);
      expect(lambda.Properties.MemorySize).toBe(256);
      
      // Environment variables (non-sensitive only)
      const envVars = lambda.Properties.Environment.Variables;
      expect(envVars.ENVIRONMENT).toEqual({ Ref: 'Environment' });
      expect(envVars.PROJECT_NAME).toEqual({ Ref: 'ProjectName' });
      expect(envVars.PRIMARY_BUCKET).toEqual({ Ref: 'PrimaryDataBucket' });
      expect(envVars.BACKUP_BUCKET).toEqual({ Ref: 'BackupDataBucket' });
      expect(envVars.LOGS_BUCKET).toEqual({ Ref: 'LogsBucket' });
      
      // Ensure no sensitive AWS credentials in environment variables
      expect(envVars.AWS_ACCESS_KEY_ID).toBeUndefined();
      expect(envVars.AWS_SECRET_ACCESS_KEY).toBeUndefined();
      expect(envVars.AWS_SESSION_TOKEN).toBeUndefined();
      
      // Check for sensitive information filtering in code
      expect(lambda.Properties.Code.ZipFile).toContain('SensitiveInfoFilter');
      expect(lambda.Properties.Code.ZipFile).toContain('AWS_ACCESS_KEY_ID');
      expect(lambda.Properties.Code.ZipFile).toContain('REDACTED - Sensitive AWS credential detected');
    });

    test('should have Lambda Permission with proper S3 integration and SourceAccount', () => {
      const permission = template.Resources.S3InvokeLambdaPermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.FunctionName).toEqual({ Ref: 'DataProcessorLambda' });
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('s3.amazonaws.com');
      expect(permission.Properties.SourceArn).toEqual({
        'Fn::GetAtt': ['PrimaryDataBucket', 'Arn']
      });
      expect(permission.Properties.SourceAccount).toEqual({
        Ref: 'AWS::AccountId'
      });
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have Lambda Log Group with appropriate retention', () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      // LogGroupName was removed for auto-generated naming
      expect(logGroup.Properties.LogGroupName).toBeUndefined();
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('Security Policy Resources', () => {
    test('should have Organization Security Policy with comprehensive restrictions', () => {
      const policy = template.Resources.OrganizationSecurityPolicy;
      expect(policy.Type).toBe('AWS::IAM::ManagedPolicy');
      // ManagedPolicyName was removed for auto-generated naming
      expect(policy.Properties.ManagedPolicyName).toBeUndefined();
      expect(policy.Properties.Description).toBe(
        'Organization security policy enforcing best practices'
      );
      
      const statements = policy.Properties.PolicyDocument.Statement;
      expect(statements).toHaveLength(3);
      
      // Check unencrypted S3 uploads denial with proper ARNs
      const denyUnencryptedStatement = statements[0];
      expect(denyUnencryptedStatement.Sid).toBe('DenyUnencryptedS3Uploads');
      expect(denyUnencryptedStatement.Effect).toBe('Deny');
      expect(denyUnencryptedStatement.Action).toBe('s3:PutObject');
      expect(denyUnencryptedStatement.Resource).toContainEqual({
        'Fn::Sub': 'arn:aws:s3:::${PrimaryDataBucket}/*'
      });
      expect(denyUnencryptedStatement.Condition.StringNotEquals['s3:x-amz-server-side-encryption']).toBe('AES256');
      
      // Check HTTPS enforcement with proper ARNs
      const denyInsecureStatement = statements[1];
      expect(denyInsecureStatement.Sid).toBe('DenyInsecureS3Operations');
      expect(denyInsecureStatement.Effect).toBe('Deny');
      expect(denyInsecureStatement.Action).toBe('s3:*');
      expect(denyInsecureStatement.Resource).toContain({
        'Fn::GetAtt': ['PrimaryDataBucket', 'Arn']
      });
      expect(denyInsecureStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
      
      // Check Lambda function modification restrictions
      const restrictLambdaStatement = statements[2];
      expect(restrictLambdaStatement.Sid).toBe('RestrictLambdaModification');
      expect(restrictLambdaStatement.Effect).toBe('Deny');
      expect(restrictLambdaStatement.Action).toContain('lambda:UpdateFunctionCode');
      expect(restrictLambdaStatement.Action).toContain('lambda:UpdateFunctionConfiguration');
      expect(restrictLambdaStatement.Action).toContain('lambda:DeleteFunction');
      expect(restrictLambdaStatement.Resource).toEqual({
        'Fn::GetAtt': ['DataProcessorLambda', 'Arn']
      });
      expect(restrictLambdaStatement.Condition.StringNotEquals['aws:PrincipalTag/Department']).toBe('SecurityTeam');
    });
  });

  describe('Template Outputs', () => {
    test('should have all infrastructure outputs', () => {
      const expectedOutputs = [
        'PrimaryBucketName',
        'BackupBucketName',
        'LogsBucketName',
        'LambdaFunctionArn',
        'LambdaExecutionRoleArn',
        'SecurityPolicyArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
        expect(template.Outputs[outputName].Export).toBeDefined();
      });
    });

    test('should have correct output values and export names', () => {
      const primaryBucketOutput = template.Outputs.PrimaryBucketName;
      expect(primaryBucketOutput.Description).toBe('Name of the primary S3 bucket');
      expect(primaryBucketOutput.Value).toEqual({ Ref: 'PrimaryDataBucket' });
      expect(primaryBucketOutput.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-PrimaryBucket'
      });

      const lambdaOutput = template.Outputs.LambdaFunctionArn;
      expect(lambdaOutput.Description).toBe('ARN of the data processor Lambda function');
      expect(lambdaOutput.Value).toEqual({
        'Fn::GetAtt': ['DataProcessorLambda', 'Arn']
      });
      expect(lambdaOutput.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-LambdaFunction'
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

    test('should have comprehensive resource coverage', () => {
      const resourceTypes = Object.values(template.Resources).map(
        (resource: any) => resource.Type
      );
      const expectedTypes = [
        'AWS::IAM::Role',
        'AWS::Lambda::Function',
        'AWS::CloudFormation::CustomResource',
        'AWS::S3::Bucket',
        'AWS::Lambda::Permission',
        'AWS::Logs::LogGroup',
        'AWS::IAM::ManagedPolicy'
      ];

      expectedTypes.forEach(type => {
        expect(resourceTypes).toContain(type);
      });
    });

    test('should meet security requirements', () => {
      // Check for secure S3 buckets
      const primaryBucket = template.Resources.PrimaryDataBucket;
      expect(primaryBucket.Properties.BucketEncryption).toBeDefined();
      expect(primaryBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(primaryBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');

      // Check for secure Lambda function
      const lambda = template.Resources.DataProcessorLambda;
      expect(lambda.Properties.Code.ZipFile).toContain('SensitiveInfoFilter');
      expect(lambda.Properties.Environment.Variables.AWS_ACCESS_KEY_ID).toBeUndefined();

      // Check for password policy enforcement
      const passwordLambda = template.Resources.PasswordPolicyLambda;
      expect(passwordLambda.Properties.Code.ZipFile).toContain('MinimumPasswordLength=12');
      expect(passwordLambda.Properties.Code.ZipFile).toContain('RequireSymbols=True');
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow naming convention with parameters', () => {
      const primaryBucket = template.Resources.PrimaryDataBucket;
      expect(primaryBucket.Properties.BucketName).toEqual({
        'Fn::Sub': '${ProjectName}-${Environment}-s3bucket-primary'
      });

      const lambda = template.Resources.DataProcessorLambda;
      // FunctionName was removed for auto-generated naming
      expect(lambda.Properties.FunctionName).toBeUndefined();
    });

    test('export names should follow naming convention', () => {
      // The CloudFormation template uses shortened export names, not the full output key names
      const expectedExportMappings = {
        'PrimaryBucketName': 'PrimaryBucket',
        'BackupBucketName': 'BackupBucket', 
        'LogsBucketName': 'LogsBucket',
        'LambdaFunctionArn': 'LambdaFunction',
        'LambdaExecutionRoleArn': 'LambdaRole',
        'SecurityPolicyArn': 'SecurityPolicy'
      };

      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
     const expectedExportName = expectedExportMappings[outputKey as keyof typeof expectedExportMappings] || outputKey;
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${expectedExportName}`
        });
      });
    });
  });

  describe('Security Compliance Validation', () => {
    test('should enforce encryption at rest for all S3 buckets', () => {
      const buckets = [
        'PrimaryDataBucket',
        'BackupDataBucket', 
        'LogsBucket',
        'S3BucketNotification'
      ];

      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        if (bucket) {
          expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
        }
      });
    });

    test('should block all public access for S3 buckets', () => {
      const buckets = [
        'PrimaryDataBucket',
        'BackupDataBucket',
        'LogsBucket', 
        'S3BucketNotification'
      ];

      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        if (bucket) {
          const config = bucket.Properties.PublicAccessBlockConfiguration;
          expect(config.BlockPublicAcls).toBe(true);
          expect(config.BlockPublicPolicy).toBe(true);
          expect(config.IgnorePublicAcls).toBe(true);
          expect(config.RestrictPublicBuckets).toBe(true);
        }
      });
    });

    test('should implement comprehensive IAM password policy requirements', () => {
      const passwordLambda = template.Resources.PasswordPolicyLambda;
      const code = passwordLambda.Properties.Code.ZipFile;
      
      expect(code).toContain('MinimumPasswordLength=12');
      expect(code).toContain('RequireSymbols=True');
      expect(code).toContain('RequireNumbers=True');
      expect(code).toContain('RequireUppercaseCharacters=True');
      expect(code).toContain('RequireLowercaseCharacters=True');
      expect(code).toContain('AllowUsersToChangePassword=True');
      expect(code).toContain('MaxPasswordAge=90');
      expect(code).toContain('PasswordReusePrevention=12');
      expect(code).toContain('HardExpiry=True');
    });

    test('should prevent sensitive credential logging in Lambda', () => {
      const lambda = template.Resources.DataProcessorLambda;
      const code = lambda.Properties.Code.ZipFile;
      
      expect(code).toContain('class SensitiveInfoFilter');
      expect(code).toContain('AWS_ACCESS_KEY_ID');
      expect(code).toContain('AWS_SECRET_ACCESS_KEY');
      expect(code).toContain('AWS_SESSION_TOKEN');
      expect(code).toContain('REDACTED - Sensitive AWS credential detected');
      expect(code).toContain('addFilter(SensitiveInfoFilter())');
    });
  });
});