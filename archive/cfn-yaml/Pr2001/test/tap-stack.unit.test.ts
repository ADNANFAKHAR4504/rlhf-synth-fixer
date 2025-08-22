import fs from 'fs';
import path from 'path';

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
        'Serverless infrastructure with API Gateway, Lambda, and S3'
      );
    });
  });

  describe('Parameters', () => {
  // Environment parameter removed from TapStack.json and TapStack.yml

    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
      expect(template.Parameters.EnvironmentSuffix.Description).toBe(
        'Environment suffix for unique resource naming'
      );
    });
  });

  describe('Resources', () => {
    test('should have all required resources', () => {
      expect(template.Resources).toBeDefined();
      expect(template.Resources.DataBucket).toBeDefined();
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.ProcessingLambda).toBeDefined();
      expect(template.Resources.LambdaApiGatewayPermission).toBeDefined();
      expect(template.Resources.ServerlessApi).toBeDefined();
      expect(template.Resources.LambdaIntegration).toBeDefined();
      expect(template.Resources.ProcessRoute).toBeDefined();
      expect(template.Resources.ApiStage).toBeDefined();
    });

    describe('S3 Bucket', () => {
      test('should have correct type and properties', () => {
        const bucket = template.Resources.DataBucket;
        expect(bucket.Type).toBe('AWS::S3::Bucket');
        expect(bucket.Properties).toBeDefined();
      });

      test('should have environment suffix in bucket name', () => {
        const bucket = template.Resources.DataBucket;
        expect(bucket.Properties.BucketName).toEqual({
          'Fn::Sub': 'tapstack-${EnvironmentSuffix}-data-bucket-${AWS::AccountId}'
        });
      });

      test('should have public access blocked', () => {
        const bucket = template.Resources.DataBucket;
        const blockConfig = bucket.Properties.PublicAccessBlockConfiguration;
        expect(blockConfig.BlockPublicAcls).toBe(true);
        expect(blockConfig.BlockPublicPolicy).toBe(true);
        expect(blockConfig.IgnorePublicAcls).toBe(true);
        expect(blockConfig.RestrictPublicBuckets).toBe(true);
      });

      test('should have versioning enabled', () => {
        const bucket = template.Resources.DataBucket;
        expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      });

      test('should have encryption enabled', () => {
        const bucket = template.Resources.DataBucket;
        const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      });
    });

    describe('Lambda Execution Role', () => {
      test('should have correct type and properties', () => {
        const role = template.Resources.LambdaExecutionRole;
        expect(role.Type).toBe('AWS::IAM::Role');
        expect(role.Properties).toBeDefined();
      });

      test('should have environment suffix in role name', () => {
        const role = template.Resources.LambdaExecutionRole;
        expect(role.Properties.RoleName).toEqual({
          'Fn::Sub': '${AWS::StackName}-${EnvironmentSuffix}-lambda-execution-role'
        });
      });

      test('should allow Lambda service to assume role', () => {
        const role = template.Resources.LambdaExecutionRole;
        const assumePolicy = role.Properties.AssumeRolePolicyDocument;
        expect(assumePolicy.Statement[0].Effect).toBe('Allow');
        expect(assumePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
        expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
      });

      test('should have basic execution policy attached', () => {
        const role = template.Resources.LambdaExecutionRole;
        expect(role.Properties.ManagedPolicyArns).toContain(
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        );
      });

      test('should have S3 access policy with least privileges', () => {
        const role = template.Resources.LambdaExecutionRole;
        const s3Policy = role.Properties.Policies[0];
        expect(s3Policy.PolicyName).toBe('S3AccessPolicy');
        
        const statements = s3Policy.PolicyDocument.Statement;
        expect(statements).toHaveLength(2);
        
        // Check object operations
        expect(statements[0].Effect).toBe('Allow');
        expect(statements[0].Action).toContain('s3:GetObject');
        expect(statements[0].Action).toContain('s3:PutObject');
        expect(statements[0].Action).toContain('s3:DeleteObject');
        expect(statements[0].Resource).toEqual({
          'Fn::Sub': '${DataBucket.Arn}/*'
        });
        
        // Check list bucket operation
        expect(statements[1].Effect).toBe('Allow');
        expect(statements[1].Action).toContain('s3:ListBucket');
        expect(statements[1].Resource).toEqual({
          'Fn::GetAtt': ['DataBucket', 'Arn']
        });
      });
    });

    describe('Lambda Function', () => {
      test('should have correct type and properties', () => {
        const lambda = template.Resources.ProcessingLambda;
        expect(lambda.Type).toBe('AWS::Lambda::Function');
        expect(lambda.Properties).toBeDefined();
      });

      test('should have environment suffix in function name', () => {
        const lambda = template.Resources.ProcessingLambda;
        expect(lambda.Properties.FunctionName).toEqual({
          'Fn::Sub': '${AWS::StackName}-${EnvironmentSuffix}-processing-function'
        });
      });

      test('should use Python 3.11 runtime', () => {
        const lambda = template.Resources.ProcessingLambda;
        expect(lambda.Properties.Runtime).toBe('python3.11');
      });

      test('should have correct handler', () => {
        const lambda = template.Resources.ProcessingLambda;
        expect(lambda.Properties.Handler).toBe('index.lambda_handler');
      });

      test('should reference the execution role', () => {
        const lambda = template.Resources.ProcessingLambda;
        expect(lambda.Properties.Role).toEqual({
          'Fn::GetAtt': ['LambdaExecutionRole', 'Arn']
        });
      });

      test('should have BUCKET_NAME environment variable', () => {
        const lambda = template.Resources.ProcessingLambda;
        expect(lambda.Properties.Environment.Variables.BUCKET_NAME).toEqual({
          Ref: 'DataBucket'
        });
      });

      test('should have appropriate timeout and memory', () => {
        const lambda = template.Resources.ProcessingLambda;
        expect(lambda.Properties.Timeout).toBe(30);
        expect(lambda.Properties.MemorySize).toBe(128);
      });

      test('should include inline Python code', () => {
        const lambda = template.Resources.ProcessingLambda;
        expect(lambda.Properties.Code.ZipFile).toBeDefined();
        expect(lambda.Properties.Code.ZipFile).toContain('lambda_handler');
        expect(lambda.Properties.Code.ZipFile).toContain('boto3');
        expect(lambda.Properties.Code.ZipFile).toContain('s3_client');
      });
    });

    describe('API Gateway', () => {
      test('should have HTTP API configured', () => {
        const api = template.Resources.ServerlessApi;
        expect(api.Type).toBe('AWS::ApiGatewayV2::Api');
        expect(api.Properties.ProtocolType).toBe('HTTP');
      });

      test('should have environment suffix in API name', () => {
        const api = template.Resources.ServerlessApi;
        expect(api.Properties.Name).toEqual({
          'Fn::Sub': '${AWS::StackName}-${EnvironmentSuffix}-serverless-api'
        });
      });

      test('should have CORS configured', () => {
        const api = template.Resources.ServerlessApi;
        const cors = api.Properties.CorsConfiguration;
        expect(cors.AllowOrigins).toContain('*');
        expect(cors.AllowMethods).toContain('GET');
        expect(cors.AllowMethods).toContain('POST');
        expect(cors.AllowMethods).toContain('OPTIONS');
        expect(cors.AllowHeaders).toContain('Content-Type');
        expect(cors.AllowHeaders).toContain('Authorization');
      });

      test('should have Lambda integration configured', () => {
        const integration = template.Resources.LambdaIntegration;
        expect(integration.Type).toBe('AWS::ApiGatewayV2::Integration');
        expect(integration.Properties.IntegrationType).toBe('AWS_PROXY');
        expect(integration.Properties.PayloadFormatVersion).toBe('2.0');
      });

      test('should have POST /process route configured', () => {
        const route = template.Resources.ProcessRoute;
        expect(route.Type).toBe('AWS::ApiGatewayV2::Route');
        expect(route.Properties.RouteKey).toBe('POST /process');
      });

      test('should have prod stage with auto-deploy', () => {
        const stage = template.Resources.ApiStage;
        expect(stage.Type).toBe('AWS::ApiGatewayV2::Stage');
        expect(stage.Properties.StageName).toBe('prod');
        expect(stage.Properties.AutoDeploy).toBe(true);
      });
    });

    describe('Lambda Permission', () => {
      test('should grant API Gateway permission to invoke Lambda', () => {
        const permission = template.Resources.LambdaApiGatewayPermission;
        expect(permission.Type).toBe('AWS::Lambda::Permission');
        expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
        expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
        expect(permission.Properties.FunctionName).toEqual({
          Ref: 'ProcessingLambda'
        });
      });

      test('should have correct SourceArn format', () => {
        const permission = template.Resources.LambdaApiGatewayPermission;
        expect(permission.Properties.SourceArn).toEqual({
          'Fn::Sub': 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ServerlessApi}/*/*'
        });
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      expect(template.Outputs).toBeDefined();
      expect(template.Outputs.ApiEndpoint).toBeDefined();
      expect(template.Outputs.S3BucketName).toBeDefined();
      expect(template.Outputs.LambdaFunctionArn).toBeDefined();
      expect(template.Outputs.LambdaFunctionName).toBeDefined();
    });

    test('ApiEndpoint output should have correct value', () => {
      const output = template.Outputs.ApiEndpoint;
      expect(output.Description).toBe('API Gateway endpoint URL');
      expect(output.Value).toEqual({
        'Fn::Sub': 'https://${ServerlessApi}.execute-api.${AWS::Region}.amazonaws.com/prod'
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-api-endpoint'
      });
    });

    test('S3BucketName output should have correct value', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBe('Name of the S3 bucket for data storage');
      expect(output.Value).toEqual({
        Ref: 'DataBucket'
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-s3-bucket'
      });
    });

    test('LambdaFunctionArn output should have correct value', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toBe('ARN of the Lambda function');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ProcessingLambda', 'Arn']
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-lambda-arn'
      });
    });

    test('LambdaFunctionName output should have correct value', () => {
      const output = template.Outputs.LambdaFunctionName;
      expect(output.Description).toBe('Name of the Lambda function');
      expect(output.Value).toEqual({
        Ref: 'ProcessingLambda'
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-lambda-name'
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

    test('should have exactly 1 parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have exactly 8 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(8);
    });

    test('should have exactly 4 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(4);
    });
  });

  describe('Security Best Practices', () => {
    test('S3 bucket should not allow public access', () => {
      const bucket = template.Resources.DataBucket;
      const blockConfig = bucket.Properties.PublicAccessBlockConfiguration;
      expect(blockConfig.BlockPublicAcls).toBe(true);
      expect(blockConfig.BlockPublicPolicy).toBe(true);
      expect(blockConfig.IgnorePublicAcls).toBe(true);
      expect(blockConfig.RestrictPublicBuckets).toBe(true);
    });

    test('Lambda role should follow least privilege principle', () => {
      const role = template.Resources.LambdaExecutionRole;
      const s3Policy = role.Properties.Policies[0];
      const statements = s3Policy.PolicyDocument.Statement;
      
      // Check that permissions are scoped to specific bucket
      statements.forEach((statement: any) => {
        expect(statement.Effect).toBe('Allow');
        expect(statement.Resource).toBeDefined();
        // Resource should reference the specific bucket, not use wildcards
        if (statement.Action.includes('s3:ListBucket')) {
          expect(statement.Resource).toEqual({
            'Fn::GetAtt': ['DataBucket', 'Arn']
          });
        } else {
          expect(statement.Resource).toEqual({
            'Fn::Sub': '${DataBucket.Arn}/*'
          });
        }
      });
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.DataBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault).toBeDefined();
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.DataBucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });
  });

  describe('Resource Dependencies', () => {
    test('Lambda function should depend on execution role', () => {
      const lambda = template.Resources.ProcessingLambda;
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn']
      });
    });

    test('Lambda permission should reference Lambda function', () => {
      const permission = template.Resources.LambdaApiGatewayPermission;
      expect(permission.Properties.FunctionName).toEqual({
        Ref: 'ProcessingLambda'
      });
    });

    test('Lambda integration should reference Lambda function', () => {
      const integration = template.Resources.LambdaIntegration;
      expect(integration.Properties.IntegrationUri).toEqual({
        'Fn::Sub': 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ProcessingLambda.Arn}/invocations'
      });
    });

    test('API route should reference integration', () => {
      const route = template.Resources.ProcessRoute;
      expect(route.Properties.Target).toEqual({
        'Fn::Sub': 'integrations/${LambdaIntegration}'
      });
    });

    test('API stage should reference API', () => {
      const stage = template.Resources.ApiStage;
      expect(stage.Properties.ApiId).toEqual({
        Ref: 'ServerlessApi'
      });
    });
  });
});