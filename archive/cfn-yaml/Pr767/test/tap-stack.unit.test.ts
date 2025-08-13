import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const environment = process.env.ENVIRONMENT || 'prod';

describe('Serverless CloudFormation Template Unit Tests', () => {
  let template: any;

beforeAll(() => {
  const templatePath = path.join(__dirname, '../lib/TapStack.json');
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  template = JSON.parse(templateContent);
});

  describe('Template Structure', () => {
    test('should have correct CloudFormation version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have comprehensive description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Production-grade serverless architecture');
      expect(template.Description).toContain('API Gateway v2');
      expect(template.Description).toContain('Lambda');
      expect(template.Description).toContain('S3');
    });

    test('should have required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters - Serverless Configuration', () => {
    test('should have Environment parameter with proper defaults', () => {
      const param = template.Parameters.Environment;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('prod');
      expect(param.Description).toContain('Environment name');
    });

    test('should have UseKms parameter for encryption options', () => {
      const param = template.Parameters.UseKms;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('false');
      expect(param.AllowedValues).toEqual(['true', 'false']);
    });

    test('should have KmsKeyArn parameter', () => {
      const param = template.Parameters.KmsKeyArn;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.Description).toContain('KMS Key ARN');
    });

    test('should have LogRetentionDays parameter with valid values', () => {
      const param = template.Parameters.LogRetentionDays;
      expect(param).toBeDefined();
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(14);
      expect(param.AllowedValues).toContain(14);
      expect(param.AllowedValues).toContain(30);
      expect(param.AllowedValues).toContain(365);
    });
  });

  describe('Conditions - Encryption Logic', () => {
    test('should have UseKmsEncryption condition', () => {
      expect(template.Conditions.UseKmsEncryption).toBeDefined();
      expect(template.Conditions.UseKmsEncryption).toEqual({
        'Fn::Equals': [{ 'Ref': 'UseKms' }, 'true']
      });
    });

    test('should have HasKmsKey condition', () => {
      expect(template.Conditions.HasKmsKey).toBeDefined();
      expect(template.Conditions.HasKmsKey['Fn::And']).toBeDefined();
      expect(template.Conditions.HasKmsKey['Fn::And']).toHaveLength(2);
    });
  });

  describe('S3 Bucket - Security and Compliance', () => {
    test('should create S3 bucket with proper configuration', () => {
      const s3 = template.Resources.OutputBucket;
      expect(s3.Type).toBe('AWS::S3::Bucket');
      expect(s3.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have dynamic bucket naming with stack suffix', () => {
      const s3 = template.Resources.OutputBucket;
      expect(s3.Properties.BucketName['Fn::Sub']).toBeDefined();
      expect(s3.Properties.BucketName['Fn::Sub'][0]).toContain('${Environment}-s3-app-output');
      expect(s3.Properties.BucketName['Fn::Sub'][0]).toContain('${Suffix}');
    });

    test('should block all public access', () => {
      const s3 = template.Resources.OutputBucket;
      const publicBlock = s3.Properties.PublicAccessBlockConfiguration;
      expect(publicBlock.BlockPublicAcls).toBe(true);
      expect(publicBlock.BlockPublicPolicy).toBe(true);
      expect(publicBlock.IgnorePublicAcls).toBe(true);
      expect(publicBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should enable conditional KMS encryption', () => {
      const s3 = template.Resources.OutputBucket;
      const encryption = s3.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm['Fn::If']).toBeDefined();
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm['Fn::If'][0]).toBe('UseKmsEncryption');
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm['Fn::If'][1]).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm['Fn::If'][2]).toBe('AES256');
    });

    test('should have proper bucket policy with encryption enforcement', () => {
      const policy = template.Resources.OutputBucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      
      const statements = policy.Properties.PolicyDocument.Statement;
      expect(statements).toHaveLength(2);

      // Check deny insecure transport
      const secureTransportStatement = statements[0];
      expect(secureTransportStatement.Sid).toBe('DenyInsecureConnections');
      expect(secureTransportStatement.Effect).toBe('Deny');
      expect(secureTransportStatement.Condition.Bool['aws:SecureTransport']).toBe('false');

      // Check encryption enforcement with conditional logic
      const encryptionStatement = statements[1];
      expect(encryptionStatement['Fn::If']).toBeDefined();
      expect(encryptionStatement['Fn::If'][0]).toBe('UseKmsEncryption');
    });

    test('should use correct ARN format in bucket policy', () => {
      const policy = template.Resources.OutputBucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      
      // Check that resources use proper ARN format
      statements.forEach((statement: any) => {
        if (statement.Resource) {
          statement.Resource.forEach((resource: any) => {
            if (typeof resource === 'object' && resource['Fn::Sub']) {
              expect(resource['Fn::Sub']).toContain('arn:aws:s3:::');
            }
          });
        }
      });
    });
  });

  describe('Lambda Function - Configuration and Security', () => {
    test('should create Lambda function with correct runtime', () => {
      const lambda = template.Resources.ProcessorFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.12');
      expect(lambda.Properties.Handler).toBe('index.handler');
      expect(lambda.Properties.Timeout).toBe(30);
      expect(lambda.Properties.MemorySize).toBe(128);
    });

    test('should enable X-Ray tracing', () => {
      const lambda = template.Resources.ProcessorFunction;
      expect(lambda.Properties.TracingConfig.Mode).toBe('Active');
    });

    test('should have proper environment variables', () => {
      const lambda = template.Resources.ProcessorFunction;
      const envVars = lambda.Properties.Environment.Variables;
      
      expect(envVars.BUCKET_NAME).toEqual({ 'Ref': 'OutputBucket' });
      expect(envVars.OBJECT_PREFIX).toBe('processed/');
      expect(envVars.ENVIRONMENT).toEqual({ 'Ref': 'Environment' });
      expect(envVars.USE_KMS).toEqual({ 'Ref': 'UseKms' });
      expect(envVars.KMS_KEY_ARN['Fn::If']).toBeDefined();
    });

    test('should have inline code with proper error handling', () => {
      const lambda = template.Resources.ProcessorFunction;
      const code = lambda.Properties.Code.ZipFile;
      
      expect(code).toContain('import json');
      expect(code).toContain('import boto3');
      expect(code).toContain('def handler(event, context)');
      expect(code).toContain('try:');
      expect(code).toContain('except Exception as e:');
      expect(code).toContain('ServerSideEncryption');
    });

    test('should depend on log group', () => {
      const lambda = template.Resources.ProcessorFunction;
      expect(lambda.DependsOn).toBe('LambdaLogGroup');
    });

    test('should have proper function naming', () => {
      const lambda = template.Resources.ProcessorFunction;
      expect(lambda.Properties.FunctionName['Fn::Sub']).toBe('${Environment}-lambda-processor');
    });
  });

  describe('IAM Roles and Policies - Least Privilege', () => {
    test('should create Lambda execution role', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('should have least privilege IAM policy', () => {
      const policy = template.Resources.LambdaExecutionPolicy;
      expect(policy.Type).toBe('AWS::IAM::Policy');
      
      const statements = policy.Properties.PolicyDocument.Statement;
      expect(statements).toHaveLength(3);

      // CloudWatch Logs policy
      const logsStatement = statements[0];
      expect(logsStatement.Action).toEqual([
        'logs:CreateLogStream',
        'logs:PutLogEvents'
      ]);
      expect(logsStatement.Resource['Fn::Sub']).toContain('log-group:/aws/lambda/${Environment}-lambda-processor*');

      // X-Ray policy
      const xrayStatement = statements[1];
      expect(xrayStatement.Action).toEqual([
        'xray:PutTraceSegments',
        'xray:PutTelemetryRecords'
      ]);
      expect(xrayStatement.Resource).toBe('*');

      // S3 policy with proper ARN
      const s3Statement = statements[2];
      expect(s3Statement.Action).toEqual([
        's3:PutObject',
        's3:PutObjectAcl'
      ]);
      expect(s3Statement.Resource['Fn::Sub']).toBe('arn:aws:s3:::${OutputBucket}/processed/*');
    });

    test('should use environment-specific role naming', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.RoleName['Fn::Sub']).toBe('${Environment}-lambda-execution-role');
    });
  });

  describe('API Gateway v2 HTTP API - Configuration', () => {
    test('should create HTTP API with proper configuration', () => {
      const api = template.Resources.HttpApi;
      expect(api.Type).toBe('AWS::ApiGatewayV2::Api');
      expect(api.Properties.ProtocolType).toBe('HTTP');
      expect(api.Properties.Name['Fn::Sub']).toBe('${Environment}-apigw-http');
      expect(api.Properties.Description).toContain('HTTP API for serverless processing application');
    });

    test('should have CORS configuration', () => {
      const api = template.Resources.HttpApi;
      const cors = api.Properties.CorsConfiguration;
      
      expect(cors.AllowCredentials).toBe(false);
      expect(cors.AllowHeaders).toContain('Content-Type');
      expect(cors.AllowMethods).toContain('POST');
      expect(cors.AllowMethods).toContain('OPTIONS');
      expect(cors.AllowOrigins).toEqual(['*']);
      expect(cors.MaxAge).toBe(86400);
    });

    test('should create Lambda proxy integration', () => {
      const integration = template.Resources.LambdaIntegration;
      expect(integration.Type).toBe('AWS::ApiGatewayV2::Integration');
      expect(integration.Properties.IntegrationType).toBe('AWS_PROXY');
      expect(integration.Properties.IntegrationMethod).toBe('POST');
      expect(integration.Properties.PayloadFormatVersion).toBe('2.0');
      expect(integration.Properties.IntegrationUri['Fn::Sub']).toContain('lambda:path/2015-03-31/functions/${ProcessorFunction.Arn}/invocations');
    });

    test('should create POST /process route', () => {
      const route = template.Resources.ProcessRoute;
      expect(route.Type).toBe('AWS::ApiGatewayV2::Route');
      expect(route.Properties.RouteKey).toBe('POST /process');
      expect(route.Properties.Target['Fn::Sub']).toBe('integrations/${LambdaIntegration}');
    });

    test('should create default stage with access logging', () => {
      const stage = template.Resources.ApiStage;
      expect(stage.Type).toBe('AWS::ApiGatewayV2::Stage');
      expect(stage.Properties.StageName).toBe('$default');
      expect(stage.Properties.AutoDeploy).toBe(true);
      expect(stage.Properties.AccessLogSettings.DestinationArn['Fn::GetAtt']).toEqual(['ApiGatewayLogGroup', 'Arn']);
      expect(stage.Properties.AccessLogSettings.Format).toContain('requestId');
    });

    test('should have Lambda permission for API Gateway', () => {
      const permission = template.Resources.LambdaApiGatewayPermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.FunctionName).toEqual({ 'Ref': 'ProcessorFunction' });
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
      expect(permission.Properties.SourceArn['Fn::Sub']).toContain('execute-api:${AWS::Region}:${AWS::AccountId}:${HttpApi}/*/*');
    });
  });

  describe('CloudWatch Logging - Configuration', () => {
    test('should create Lambda log group with retention', () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName['Fn::Sub']).toBe('/aws/lambda/${Environment}-lambda-processor');
      expect(logGroup.Properties.RetentionInDays).toEqual({ 'Ref': 'LogRetentionDays' });
    });

    test('should create API Gateway log group', () => {
      const logGroup = template.Resources.ApiGatewayLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName['Fn::Sub']).toBe('/aws/apigatewayv2/${Environment}-apigw-http');
      expect(logGroup.Properties.RetentionInDays).toEqual({ 'Ref': 'LogRetentionDays' });
    });
  });

  describe('Tagging Compliance', () => {
    test('should tag all resources consistently', () => {
      const resourcesWithTags = [
        'OutputBucket', 'LambdaLogGroup', 'ApiGatewayLogGroup',
        'LambdaExecutionRole', 'ProcessorFunction', 'ApiStage'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties) {
          let tags;
          
          // Handle different tag formats
          if (resource.Properties.Tags) {
            tags = resource.Properties.Tags;
          } else if (resource.Properties.Tags && Array.isArray(resource.Properties.Tags)) {
            tags = resource.Properties.Tags;
          }

         if (tags) {
  // Handle both array and object tag formats
  let nameTag, envTag, appTag;
  
  if (Array.isArray(tags)) {
    nameTag = tags.find((tag: any) => tag.Key === 'Name');
    envTag = tags.find((tag: any) => tag.Key === 'Environment');
    appTag = tags.find((tag: any) => tag.Key === 'Application');
  } else {
    // Handle object format tags
    nameTag = tags.Name ? { Key: 'Name', Value: tags.Name } : undefined;
    envTag = tags.Environment ? { Key: 'Environment', Value: tags.Environment } : undefined;
    appTag = tags.Application ? { Key: 'Application', Value: tags.Application } : undefined;
  }

            expect(nameTag).toBeDefined();
            expect(envTag).toBeDefined();
            expect(appTag).toBeDefined();

            if (typeof envTag.Value === 'object') {
              expect(envTag.Value).toEqual({ 'Ref': 'Environment' });
            }
            
            if (typeof appTag.Value === 'object' && appTag.Value['Fn::Sub']) {
              expect(appTag.Value['Fn::Sub']).toContain('${Environment}-serverless-app');
            }
          }
        }
      });
    });

    test('should use environment-specific naming convention', () => {
      const resourcesWithNaming = [
        'OutputBucket', 'LambdaExecutionRole', 'ProcessorFunction', 'HttpApi'
      ];

      resourcesWithNaming.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties) {
          const nameProperty = resource.Properties.BucketName || 
                               resource.Properties.RoleName || 
                               resource.Properties.FunctionName || 
                               resource.Properties.Name;
          
          if (nameProperty && typeof nameProperty === 'object' && nameProperty['Fn::Sub']) {
            // Handle both string and array Fn::Sub formats
if (Array.isArray(nameProperty['Fn::Sub'])) {
  expect(nameProperty['Fn::Sub'][0]).toContain('${Environment}');
} else {
  expect(nameProperty['Fn::Sub']).toContain('${Environment}');
}
          }
        }
      });
    });
  });

  describe('Outputs - Information Export', () => {
    test('should export API endpoint URLs', () => {
      expect(template.Outputs.ApiEndpoint).toBeDefined();
      expect(template.Outputs.ApiEndpoint.Description).toContain('HTTP API Gateway base endpoint URL');
      expect(template.Outputs.ApiEndpoint.Value['Fn::Sub']).toBe('https://${HttpApi}.execute-api.${AWS::Region}.amazonaws.com');
      
      expect(template.Outputs.ApiProcessEndpoint).toBeDefined();
      expect(template.Outputs.ApiProcessEndpoint.Description).toContain('HTTP API Gateway process endpoint URL');
      expect(template.Outputs.ApiProcessEndpoint.Value['Fn::Sub']).toBe('https://${HttpApi}.execute-api.${AWS::Region}.amazonaws.com/process');
    });

    test('should export Lambda function details', () => {
      expect(template.Outputs.LambdaFunctionArn).toBeDefined();
      expect(template.Outputs.LambdaFunctionArn.Value['Fn::GetAtt']).toEqual(['ProcessorFunction', 'Arn']);
      
      expect(template.Outputs.LambdaFunctionName).toBeDefined();
      expect(template.Outputs.LambdaFunctionName.Value).toEqual({ 'Ref': 'ProcessorFunction' });
    });

    test('should export S3 bucket name', () => {
      expect(template.Outputs.OutputBucketName).toBeDefined();
      expect(template.Outputs.OutputBucketName.Value).toEqual({ 'Ref': 'OutputBucket' });
    });

    test('should have proper export names for cross-stack references', () => {
      const outputs = template.Outputs;
      Object.keys(outputs).forEach(key => {
        const output = outputs[key];
        if (output.Export && output.Export.Name) {
          expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
        }
      });
    });
  });

  describe('Production Readiness Validation', () => {
    test('should meet AWS Well-Architected Framework requirements', () => {
      // Security Pillar
      expect(template.Resources.OutputBucket.Properties.BucketEncryption).toBeDefined();
      expect(template.Resources.LambdaExecutionPolicy).toBeDefined();
      
      // Reliability Pillar
      expect(template.Resources.ProcessorFunction.Properties.Timeout).toBe(30);
      expect(template.Resources.LambdaLogGroup).toBeDefined();
      
      // Performance Efficiency Pillar
      expect(template.Resources.ProcessorFunction.Properties.MemorySize).toBe(128);
      
      // Cost Optimization Pillar
      expect(template.Parameters.LogRetentionDays.Default).toBe(14);
      
      // Operational Excellence Pillar
      expect(template.Resources.ProcessorFunction.Properties.TracingConfig.Mode).toBe('Active');
    });

    test('should be deployment-ready without user input', () => {
      // All parameters should have sensible defaults
      Object.keys(template.Parameters).forEach(paramKey => {
        const param = template.Parameters[paramKey];
        expect(param.Default).toBeDefined();
      });
    });

    test('should follow least-privilege principle', () => {
      const policy = template.Resources.LambdaExecutionPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      
      // Check that resources are scoped appropriately
      statements.forEach((statement: any) => {
        if (statement.Resource && statement.Resource !== '*') {
          // Resources should be scoped to specific resources when possible
          if (typeof statement.Resource === 'object' && statement.Resource['Fn::Sub']) {
            expect(statement.Resource['Fn::Sub']).not.toBe('*');
          }
        }
      });
    });
  });

  describe('Error Handling and Validation', () => {
    test('should validate conditional logic structure', () => {
      // UseKmsEncryption condition should be properly structured
      expect(template.Conditions.UseKmsEncryption['Fn::Equals']).toHaveLength(2);
      
      // HasKmsKey condition should have nested logic
      expect(template.Conditions.HasKmsKey['Fn::And']).toHaveLength(2);
    });

    test('should handle optional KMS key parameter correctly', () => {
      const s3Encryption = template.Resources.OutputBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(s3Encryption.ServerSideEncryptionByDefault.KMSMasterKeyID['Fn::If']).toBeDefined();
      expect(s3Encryption.ServerSideEncryptionByDefault.KMSMasterKeyID['Fn::If'][0]).toBe('HasKmsKey');
    });

    test('should have proper resource dependencies', () => {
      // Lambda should depend on log group
      expect(template.Resources.ProcessorFunction.DependsOn).toBe('LambdaLogGroup');
      
      // IAM policy should reference role
expect(template.Resources.LambdaExecutionPolicy.Properties.Roles).toContainEqual({ 'Ref': 'LambdaExecutionRole' });
    });
  });
});