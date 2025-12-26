import fs from 'fs';
import path from 'path';

type CfnTemplate = {
  AWSTemplateFormatVersion: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Resources: Record<string, any>;
  Outputs?: Record<string, any>;
};

describe('TapStack CloudFormation Template - Unit Tests', () => {
  let template: CfnTemplate;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    if (!fs.existsSync(templatePath)) {
      throw new Error(
        'TapStack.json not found. Run: pipenv run cfn-flip lib/TapStack.yml lib/TapStack.json'
      );
    }
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have Description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Serverless infrastructure with Lambda, API Gateway, S3, and CloudWatch monitoring'
      );
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Parameters Validation', () => {
    test('Environment parameter should have correct type and constraints', () => {
      const param = template.Parameters!.Environment;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('prod');
      expect(param.AllowedValues).toEqual(['dev', 'staging', 'prod']);
      expect(param.Description).toBe('Environment name for resource naming');
    });
  });

  describe('KMS Resources', () => {
    test('should create KMS key with proper configuration (LocalStack compatible)', () => {
      const key = template.Resources['S3EncryptionKey'];
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.Description).toBe('KMS key for S3 bucket encryption');
      // EnableKeyRotation removed for LocalStack compatibility
      expect(key.Properties.EnableKeyRotation).toBeUndefined();
      expect(key.Properties.KeyPolicy).toBeDefined();
      expect(key.Properties.KeyPolicy.Version).toBe('2012-10-17');
    });

    test('KMS key should have proper IAM permissions', () => {
      const key = template.Resources['S3EncryptionKey'];
      const statements = key.Properties.KeyPolicy.Statement;
      expect(Array.isArray(statements)).toBe(true);
      const rootStatement = statements.find(
        (s: any) => s.Sid === 'Enable IAM User Permissions'
      );
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Action).toBe('kms:*');
    });

    test('should create KMS alias referencing the key', () => {
      const alias = template.Resources['S3EncryptionKeyAlias'];
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName['Fn::Sub']).toContain(
        '-s3-encryption-key'
      );
      // LocalStack compatible - uses Ref instead of GetAtt KeyId
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'S3EncryptionKey' });
    });
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket with KMS encryption', () => {
      const bucket = template.Resources['ProcessedDataBucket'];
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      
      const encryption = bucket.Properties.BucketEncryption;
      expect(encryption).toBeDefined();
      const sseConfig = encryption.ServerSideEncryptionConfiguration[0];
      expect(sseConfig.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(sseConfig.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({
        Ref: 'S3EncryptionKey'
      });
      // BucketKeyEnabled removed for LocalStack compatibility
      expect(sseConfig.BucketKeyEnabled).toBeUndefined();
    });

    test('should block all public access', () => {
      const bucket = template.Resources['ProcessedDataBucket'];
      const pab = bucket.Properties.PublicAccessBlockConfiguration;
      expect(pab).toBeDefined();
      expect(pab.BlockPublicAcls).toBe(true);
      expect(pab.BlockPublicPolicy).toBe(true);
      expect(pab.IgnorePublicAcls).toBe(true);
      expect(pab.RestrictPublicBuckets).toBe(true);
    });

    test('should have versioning enabled', () => {
      const bucket = template.Resources['ProcessedDataBucket'];
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should not have lifecycle rules (removed for LocalStack)', () => {
      const bucket = template.Resources['ProcessedDataBucket'];
      // Lifecycle rules removed for LocalStack compatibility
      expect(bucket.Properties.LifecycleConfiguration).toBeUndefined();
    });
  });

  describe('CloudWatch Log Group', () => {
    test('should create log group with 14-day retention', () => {
      const logGroup = template.Resources['LambdaLogGroup'];
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName['Fn::Sub']).toContain(
        '/aws/lambda/'
      );
      expect(logGroup.Properties.LogGroupName['Fn::Sub']).toContain(
        '-processor-function'
      );
      expect(logGroup.Properties.RetentionInDays).toBe(14);
    });
  });

  describe('IAM Role', () => {
    test('should create Lambda execution role with proper trust policy', () => {
      const role = template.Resources['LambdaExecutionRole'];
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Version).toBe('2012-10-17');
      expect(trustPolicy.Statement[0].Effect).toBe('Allow');
      expect(trustPolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should not use managed policies (LocalStack compatible)', () => {
      const role = template.Resources['LambdaExecutionRole'];
      // ManagedPolicyArns removed for LocalStack compatibility
      expect(role.Properties.ManagedPolicyArns).toBeUndefined();
    });

    test('should have CloudWatch Logs inline policy', () => {
      const role = template.Resources['LambdaExecutionRole'];
      const policies = role.Properties.Policies;
      expect(Array.isArray(policies)).toBe(true);
      
      const logsPolicy = policies.find((p: any) => p.PolicyName === 'CloudWatchLogsPolicy');
      expect(logsPolicy).toBeDefined();
      
      const statements = logsPolicy.PolicyDocument.Statement;
      expect(statements[0].Effect).toBe('Allow');
      expect(statements[0].Action).toContain('logs:CreateLogGroup');
      expect(statements[0].Action).toContain('logs:CreateLogStream');
      expect(statements[0].Action).toContain('logs:PutLogEvents');
    });

    test('should have S3 access policy with least privilege', () => {
      const role = template.Resources['LambdaExecutionRole'];
      const policies = role.Properties.Policies;
      
      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
      expect(s3Policy).toBeDefined();
      
      const statements = s3Policy.PolicyDocument.Statement;
      
      // Check object-level permissions
      const objectStmt = statements.find((s: any) =>
        s.Action.includes('s3:PutObject')
      );
      expect(objectStmt).toBeDefined();
      expect(objectStmt.Action).toContain('s3:GetObject');
      expect(objectStmt.Action).toContain('s3:PutObject');
      expect(objectStmt.Action).toContain('s3:DeleteObject');
      
      // Check bucket-level permissions
      const bucketStmt = statements.find((s: any) =>
        s.Action.includes('s3:ListBucket')
      );
      expect(bucketStmt).toBeDefined();
      expect(bucketStmt.Action).toContain('s3:ListBucket');
    });

    test('should have KMS access policy', () => {
      const role = template.Resources['LambdaExecutionRole'];
      const policies = role.Properties.Policies;
      
      const kmsPolicy = policies.find((p: any) => p.PolicyName === 'KMSAccessPolicy');
      expect(kmsPolicy).toBeDefined();
      
      const statements = kmsPolicy.PolicyDocument.Statement;
      expect(statements[0].Effect).toBe('Allow');
      expect(statements[0].Action).toContain('kms:Decrypt');
      expect(statements[0].Action).toContain('kms:GenerateDataKey');
      expect(statements[0].Action).toContain('kms:DescribeKey');
      expect(statements[0].Resource).toEqual({
        'Fn::GetAtt': ['S3EncryptionKey', 'Arn']
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with correct configuration', () => {
      const lambda = template.Resources['LambdaFunction'];
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.DependsOn).toBe('LambdaLogGroup');
      
      const props = lambda.Properties;
      expect(props.FunctionName['Fn::Sub']).toContain('-processor-function');
      // Python 3.11 for LocalStack compatibility
      expect(props.Runtime).toBe('python3.11');
      expect(props.Handler).toBe('index.lambda_handler');
      expect(props.Timeout).toBe(30);
      expect(props.MemorySize).toBe(256);
    });

    test('should have environment variables for S3 and KMS', () => {
      const lambda = template.Resources['LambdaFunction'];
      const envVars = lambda.Properties.Environment.Variables;
      
      expect(envVars.S3_BUCKET_NAME).toEqual({ Ref: 'ProcessedDataBucket' });
      expect(envVars.KMS_KEY_ID).toEqual({ Ref: 'S3EncryptionKey' });
    });

    test('should have inline code with lambda_handler', () => {
      const lambda = template.Resources['LambdaFunction'];
      const code = lambda.Properties.Code.ZipFile;
      
      expect(code).toBeDefined();
      expect(code).toContain('lambda_handler');
      expect(code).toContain('boto3');
      expect(code).toContain('s3_client');
      expect(code).toContain('put_object');
    });

    test('should reference IAM role correctly', () => {
      const lambda = template.Resources['LambdaFunction'];
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn']
      });
    });
  });

  describe('API Gateway', () => {
    test('should create REST API with correct configuration', () => {
      const api = template.Resources['ApiGateway'];
      expect(api).toBeDefined();
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.Name['Fn::Sub']).toContain('-api');
      expect(api.Properties.Description).toBe('REST API for Lambda function');
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    test('should create proxy resource', () => {
      const resource = template.Resources['ApiGatewayResource'];
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::ApiGateway::Resource');
      expect(resource.Properties.RestApiId).toEqual({ Ref: 'ApiGateway' });
      expect(resource.Properties.ParentId).toEqual({
        'Fn::GetAtt': ['ApiGateway', 'RootResourceId']
      });
      expect(resource.Properties.PathPart).toBe('{proxy+}');
    });

    test('should create ANY method for proxy resource with AWS_PROXY integration', () => {
      const method = template.Resources['ApiGatewayMethod'];
      expect(method).toBeDefined();
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('ANY');
      expect(method.Properties.AuthorizationType).toBe('NONE');
      expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
      expect(method.Properties.Integration.IntegrationHttpMethod).toBe('POST');
    });

    test('should create ANY method for root resource', () => {
      const method = template.Resources['ApiGatewayRootMethod'];
      expect(method).toBeDefined();
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('ANY');
      expect(method.Properties.AuthorizationType).toBe('NONE');
      expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
    });

    test('should create deployment with stage', () => {
      const deployment = template.Resources['ApiGatewayDeployment'];
      expect(deployment).toBeDefined();
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
      expect(deployment.DependsOn).toContain('ApiGatewayMethod');
      expect(deployment.DependsOn).toContain('ApiGatewayRootMethod');
      expect(deployment.Properties.RestApiId).toEqual({ Ref: 'ApiGateway' });
      expect(deployment.Properties.StageName).toEqual({ Ref: 'Environment' });
    });
  });

  describe('Lambda Permissions', () => {
    test('should grant API Gateway permission to invoke Lambda for proxy paths', () => {
      const permission = template.Resources['LambdaApiGatewayPermission'];
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.FunctionName).toEqual({ Ref: 'LambdaFunction' });
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
      expect(permission.Properties.SourceArn['Fn::Sub']).toContain('arn:aws:execute-api');
      expect(permission.Properties.SourceArn['Fn::Sub']).toContain('${Environment}/ANY/*');
    });

    test('should grant API Gateway permission to invoke Lambda for root path', () => {
      const permission = template.Resources['LambdaApiGatewayRootPermission'];
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.FunctionName).toEqual({ Ref: 'LambdaFunction' });
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
      expect(permission.Properties.SourceArn['Fn::Sub']).toContain('${Environment}/ANY');
    });
  });

  describe('CloudWatch Alarms (Removed for LocalStack)', () => {
    test('should not have CloudWatch Alarms (removed for LocalStack compatibility)', () => {
      const errorAlarm = template.Resources['LambdaErrorAlarm'];
      const durationAlarm = template.Resources['LambdaDurationAlarm'];
      const invocationAlarm = template.Resources['LambdaInvocationAlarm'];
      
      expect(errorAlarm).toBeUndefined();
      expect(durationAlarm).toBeUndefined();
      expect(invocationAlarm).toBeUndefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      expect(template.Outputs).toBeDefined();
      const outputs = template.Outputs!;
      
      expect(outputs['ApiGatewayUrl']).toBeDefined();
      expect(outputs['LambdaFunctionArn']).toBeDefined();
      expect(outputs['S3BucketName']).toBeDefined();
      expect(outputs['KMSKeyId']).toBeDefined();
      expect(outputs['KMSKeyAlias']).toBeDefined();
    });

    test('ApiGatewayUrl output should be properly formatted', () => {
      const output = template.Outputs!['ApiGatewayUrl'];
      expect(output.Description).toBe('API Gateway invocation URL for testing and consuming the API');
      expect(output.Value['Fn::Sub']).toContain('https://');
      expect(output.Value['Fn::Sub']).toContain('execute-api');
      expect(output.Export.Name['Fn::Sub']).toContain('-api-url');
    });

    test('LambdaFunctionArn output should reference Lambda ARN', () => {
      const output = template.Outputs!['LambdaFunctionArn'];
      expect(output.Description).toBe('Lambda function Amazon Resource Name (ARN)');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['LambdaFunction', 'Arn'] });
      expect(output.Export.Name['Fn::Sub']).toContain('-lambda-arn');
    });

    test('S3BucketName output should reference bucket', () => {
      const output = template.Outputs!['S3BucketName'];
      expect(output.Description).toBe('S3 bucket name for processed data');
      expect(output.Value).toEqual({ Ref: 'ProcessedDataBucket' });
      expect(output.Export.Name['Fn::Sub']).toContain('-s3-bucket');
    });

    test('KMSKeyId output should reference KMS key', () => {
      const output = template.Outputs!['KMSKeyId'];
      expect(output.Description).toBe('KMS key ID used for S3 encryption');
      expect(output.Value).toEqual({ Ref: 'S3EncryptionKey' });
      expect(output.Export.Name['Fn::Sub']).toContain('-kms-key');
    });

    test('KMSKeyAlias output should reference KMS alias', () => {
      const output = template.Outputs!['KMSKeyAlias'];
      expect(output.Description).toBe('KMS key alias for easier reference');
      expect(output.Value).toEqual({ Ref: 'S3EncryptionKeyAlias' });
      expect(output.Export.Name['Fn::Sub']).toContain('-kms-alias');
    });
  });

  describe('Resource Count', () => {
    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      // 13 resources: KMS Key, KMS Alias, S3 Bucket, Log Group, IAM Role, Lambda, 
      // API Gateway, API Resource, 2 API Methods, API Deployment, 2 Lambda Permissions
      expect(resourceCount).toBe(13);
    });

    test('should have all expected resource types', () => {
      const resources = template.Resources;
      const resourceTypes = Object.values(resources).map((r: any) => r.Type);
      
      expect(resourceTypes).toContain('AWS::KMS::Key');
      expect(resourceTypes).toContain('AWS::KMS::Alias');
      expect(resourceTypes).toContain('AWS::S3::Bucket');
      expect(resourceTypes).toContain('AWS::Logs::LogGroup');
      expect(resourceTypes).toContain('AWS::IAM::Role');
      expect(resourceTypes).toContain('AWS::Lambda::Function');
      expect(resourceTypes).toContain('AWS::ApiGateway::RestApi');
      expect(resourceTypes).toContain('AWS::ApiGateway::Resource');
      expect(resourceTypes).toContain('AWS::ApiGateway::Method');
      expect(resourceTypes).toContain('AWS::ApiGateway::Deployment');
      expect(resourceTypes).toContain('AWS::Lambda::Permission');
    });
  });
});
