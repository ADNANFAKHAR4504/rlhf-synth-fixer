// Configuration - Load CloudFormation template for unit testing
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
        'TAP Stack - Task Assignment Platform CloudFormation Template - Serverless Application'
      );
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toBe('Environment suffix for resource naming');
    });
  });

  describe('Resources', () => {
    test('should have LambdaExecutionRole resource', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have LambdaAssetsBucket resource', () => {
      expect(template.Resources.LambdaAssetsBucket).toBeDefined();
      expect(template.Resources.LambdaAssetsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have LambdaFunction resource', () => {
      expect(template.Resources.LambdaFunction).toBeDefined();
      expect(template.Resources.LambdaFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should have ApiGateway resource', () => {
      expect(template.Resources.ApiGateway).toBeDefined();
      expect(template.Resources.ApiGateway.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should have ApiGatewayResource resource', () => {
      expect(template.Resources.ApiGatewayResource).toBeDefined();
      expect(template.Resources.ApiGatewayResource.Type).toBe('AWS::ApiGateway::Resource');
    });

    test('should have ApiGatewayMethodRoot resource', () => {
      expect(template.Resources.ApiGatewayMethodRoot).toBeDefined();
      expect(template.Resources.ApiGatewayMethodRoot.Type).toBe('AWS::ApiGateway::Method');
    });

    test('should have ApiGatewayMethodProxy resource', () => {
      expect(template.Resources.ApiGatewayMethodProxy).toBeDefined();
      expect(template.Resources.ApiGatewayMethodProxy.Type).toBe('AWS::ApiGateway::Method');
    });

    test('should have ApiGatewayDeployment resource', () => {
      expect(template.Resources.ApiGatewayDeployment).toBeDefined();
      expect(template.Resources.ApiGatewayDeployment.Type).toBe('AWS::ApiGateway::Deployment');
    });

    test('should have LambdaPermission resource', () => {
      expect(template.Resources.LambdaPermission).toBeDefined();
      expect(template.Resources.LambdaPermission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  describe('Outputs', () => {
    test('should have ApiGatewayUrl output', () => {
      expect(template.Outputs.ApiGatewayUrl).toBeDefined();
      expect(template.Outputs.ApiGatewayUrl.Value).toEqual({
        'Fn::Sub': 'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/prod'
      });
    });

    test('should have LambdaFunctionArn output', () => {
      expect(template.Outputs.LambdaFunctionArn).toBeDefined();
      expect(template.Outputs.LambdaFunctionArn.Value).toEqual({
        'Fn::GetAtt': ['LambdaFunction', 'Arn'],
      });
    });

    test('should have S3BucketName output', () => {
      expect(template.Outputs.S3BucketName).toBeDefined();
      expect(template.Outputs.S3BucketName.Value).toEqual({ Ref: 'LambdaAssetsBucket' });
    });

    test('should have LambdaExecutionRoleArn output', () => {
      expect(template.Outputs.LambdaExecutionRoleArn).toBeDefined();
      expect(template.Outputs.LambdaExecutionRoleArn.Value).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'],
      });
    });
  });

  describe('Resource Properties', () => {
    test('LambdaExecutionRole should have correct managed policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('LambdaFunction should have correct runtime and handler', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.Runtime).toBe('python3.13');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
      expect(lambda.Properties.Timeout).toBe(30);
      expect(lambda.Properties.MemorySize).toBe(128);
    });

    test('LambdaAssetsBucket should have versioning enabled', () => {
      const bucket = template.Resources.LambdaAssetsBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('LambdaAssetsBucket should have encryption enabled', () => {
      const bucket = template.Resources.LambdaAssetsBucket;
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('LambdaAssetsBucket should have public access blocked', () => {
      const bucket = template.Resources.LambdaAssetsBucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });

    test('ApiGateway should have correct endpoint configuration', () => {
      const api = template.Resources.ApiGateway;
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    test('LambdaFunction should have correct environment variables', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.Environment.Variables.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(lambda.Properties.Environment.Variables.BUCKET_NAME).toEqual({ Ref: 'LambdaAssetsBucket' });
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

    test('should have at least one resource', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(0);
    });

    test('should have at least one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThan(0);
    });

    test('should have at least one output', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThan(0);
    });
  });

  describe('Resource Naming Convention', () => {
    test('Lambda function name should follow naming convention with environment suffix', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.FunctionName).toEqual({
        'Fn::Sub': 'TapFunction-${EnvironmentSuffix}',
      });
    });

    test('API Gateway name should follow naming convention with environment suffix', () => {
      const api = template.Resources.ApiGateway;
      expect(api.Properties.Name).toEqual({
        'Fn::Sub': 'TapApi-${EnvironmentSuffix}',
      });
    });

    test('S3 bucket name should follow naming convention with environment suffix', () => {
      const bucket = template.Resources.LambdaAssetsBucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'tap-lambda-assets-${EnvironmentSuffix}-${AWS::AccountId}',
      });
    });

    test('IAM role name should follow naming convention with environment suffix', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': 'TapStackLambdaRole-${EnvironmentSuffix}',
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export && output.Export.Name) {
          const exportName = output.Export.Name;
          if (typeof exportName === 'object' && exportName['Fn::Sub']) {
            expect(exportName['Fn::Sub']).toMatch(/^TapStack-\$\{EnvironmentSuffix\}-/);
          }
        }
      });
    });
  });

  describe('Security and Best Practices', () => {
    test('API Gateway methods should have proper authorization', () => {
      const methodRoot = template.Resources.ApiGatewayMethodRoot;
      const methodProxy = template.Resources.ApiGatewayMethodProxy;
      expect(methodRoot.Properties.AuthorizationType).toBe('NONE');
      expect(methodProxy.Properties.AuthorizationType).toBe('NONE');
    });

    test('Lambda function should have proper integration with API Gateway', () => {
      const methodRoot = template.Resources.ApiGatewayMethodRoot;
      expect(methodRoot.Properties.Integration.Type).toBe('AWS_PROXY');
      expect(methodRoot.Properties.Integration.IntegrationHttpMethod).toBe('POST');
    });

    test('Lambda permission should allow API Gateway invocation', () => {
      const permission = template.Resources.LambdaPermission;
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
    });

    test('API Gateway deployment should depend on methods', () => {
      const deployment = template.Resources.ApiGatewayDeployment;
      expect(deployment.DependsOn).toContain('ApiGatewayMethodRoot');
      expect(deployment.DependsOn).toContain('ApiGatewayMethodProxy');
    });
  });
});
