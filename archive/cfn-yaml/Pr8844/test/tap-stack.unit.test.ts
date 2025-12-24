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

    test('should not have SAM Transform (LocalStack compatible)', () => {
      expect(template.Transform).toBeUndefined();
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'TAP Stack - Task Assignment Platform CloudFormation Template - LocalStack Compatible'
      );
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('Environment parameter should have correct properties', () => {
      const param = template.Parameters.Environment;
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

    test('should have TapFunction Lambda resource (standard CloudFormation)', () => {
      expect(template.Resources.TapFunction).toBeDefined();
      expect(template.Resources.TapFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should have API Gateway REST API resource', () => {
      expect(template.Resources.TapRestApi).toBeDefined();
      expect(template.Resources.TapRestApi.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should have API Gateway Method resources', () => {
      expect(template.Resources.RootMethod).toBeDefined();
      expect(template.Resources.RootMethod.Type).toBe('AWS::ApiGateway::Method');
      expect(template.Resources.ProxyMethod).toBeDefined();
      expect(template.Resources.ProxyMethod.Type).toBe('AWS::ApiGateway::Method');
    });

    test('should have API Gateway Resource for proxy', () => {
      expect(template.Resources.ProxyResource).toBeDefined();
      expect(template.Resources.ProxyResource.Type).toBe('AWS::ApiGateway::Resource');
    });

    test('should have API Gateway Deployment resource', () => {
      expect(template.Resources.ApiDeployment).toBeDefined();
      expect(template.Resources.ApiDeployment.Type).toBe('AWS::ApiGateway::Deployment');
    });

    test('should have API Gateway Stage resource', () => {
      expect(template.Resources.ApiStage).toBeDefined();
      expect(template.Resources.ApiStage.Type).toBe('AWS::ApiGateway::Stage');
    });

    test('should have Lambda Permission for API Gateway', () => {
      expect(template.Resources.LambdaApiGatewayPermission).toBeDefined();
      expect(template.Resources.LambdaApiGatewayPermission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  describe('Outputs', () => {
    test('should have RestApiUrl output', () => {
      expect(template.Outputs.RestApiUrl).toBeDefined();
      expect(template.Outputs.RestApiUrl.Value).toEqual({
        'Fn::Sub': 'https://${TapRestApi}.execute-api.${AWS::Region}.amazonaws.com/${Environment}/'
      });
    });

    test('should have LambdaFunctionArn output', () => {
      expect(template.Outputs.LambdaFunctionArn).toBeDefined();
      expect(template.Outputs.LambdaFunctionArn.Value).toEqual({
        'Fn::GetAtt': ['TapFunction', 'Arn']
      });
    });

    test('should have S3BucketName output', () => {
      expect(template.Outputs.S3BucketName).toBeDefined();
      expect(template.Outputs.S3BucketName.Value).toEqual({ Ref: 'LambdaAssetsBucket' });
    });

    test('should have LambdaExecutionRoleArn output', () => {
      expect(template.Outputs.LambdaExecutionRoleArn).toBeDefined();
      expect(template.Outputs.LambdaExecutionRoleArn.Value).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn']
      });
    });

    test('should have RestApiId output', () => {
      expect(template.Outputs.RestApiId).toBeDefined();
      expect(template.Outputs.RestApiId.Value).toEqual({ Ref: 'TapRestApi' });
    });
  });

  describe('Resource Properties', () => {
    test('LambdaExecutionRole should have correct managed policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('TapFunction should have correct runtime and handler', () => {
      const lambda = template.Resources.TapFunction;
      expect(lambda.Properties.Runtime).toBe('python3.11');
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
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('LambdaAssetsBucket should have public access blocked', () => {
      const bucket = template.Resources.LambdaAssetsBucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });

    test('TapFunction should have correct environment variables', () => {
      const lambda = template.Resources.TapFunction;
      expect(lambda.Properties.Environment.Variables.ENVIRONMENT).toEqual({ Ref: 'Environment' });
      expect(lambda.Properties.Environment.Variables.BUCKET_NAME).toEqual({
        Ref: 'LambdaAssetsBucket'
      });
    });

    test('TapFunction should have ZipFile code (inline code)', () => {
      const lambda = template.Resources.TapFunction;
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(typeof lambda.Properties.Code.ZipFile).toBe('string');
      expect(lambda.Properties.Code.ZipFile.length).toBeGreaterThan(0);
    });
  });

  describe('API Gateway Configuration', () => {
    test('REST API should have correct configuration', () => {
      const restApi = template.Resources.TapRestApi;
      expect(restApi.Properties.Name).toEqual({
        'Fn::Sub': 'TapRestApi-${Environment}'
      });
      expect(restApi.Properties.Description).toBe('TAP REST API Gateway');
      expect(restApi.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    test('Root Method should have correct configuration', () => {
      const rootMethod = template.Resources.RootMethod;
      expect(rootMethod.Properties.HttpMethod).toBe('ANY');
      expect(rootMethod.Properties.AuthorizationType).toBe('NONE');
      expect(rootMethod.Properties.Integration.Type).toBe('AWS_PROXY');
      expect(rootMethod.Properties.Integration.IntegrationHttpMethod).toBe('POST');
    });

    test('Proxy Resource should have correct path part', () => {
      const proxyResource = template.Resources.ProxyResource;
      expect(proxyResource.Properties.PathPart).toBe('{proxy+}');
    });

    test('Proxy Method should have correct configuration', () => {
      const proxyMethod = template.Resources.ProxyMethod;
      expect(proxyMethod.Properties.HttpMethod).toBe('ANY');
      expect(proxyMethod.Properties.AuthorizationType).toBe('NONE');
      expect(proxyMethod.Properties.Integration.Type).toBe('AWS_PROXY');
      expect(proxyMethod.Properties.RequestParameters['method.request.path.proxy']).toBe(true);
    });

    test('API Gateway Deployment should depend on methods', () => {
      const deployment = template.Resources.ApiDeployment;
      expect(deployment.DependsOn).toContain('RootMethod');
      expect(deployment.DependsOn).toContain('ProxyMethod');
    });

    test('API Gateway Stage should reference Environment parameter', () => {
      const stage = template.Resources.ApiStage;
      expect(stage.Properties.StageName).toEqual({ Ref: 'Environment' });
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

    test('should have correct number of resources for LocalStack compatibility', () => {
      const expectedResources = [
        'LambdaExecutionRole',
        'LambdaAssetsBucket',
        'TapFunction',
        'LambdaApiGatewayPermission',
        'TapRestApi',
        'RootMethod',
        'ProxyResource',
        'ProxyMethod',
        'ApiDeployment',
        'ApiStage'
      ];
      expectedResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('Lambda function name should follow naming convention with environment suffix', () => {
      const lambda = template.Resources.TapFunction;
      expect(lambda.Properties.FunctionName).toEqual({
        'Fn::Sub': 'TapFunction-${Environment}'
      });
    });

    test('S3 bucket name should follow naming convention with environment suffix', () => {
      const bucket = template.Resources.LambdaAssetsBucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'tap-lambda-assets-${Environment}-${AWS::AccountId}'
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export && output.Export.Name) {
          const exportName = output.Export.Name;
          if (typeof exportName === 'object' && exportName['Fn::Sub']) {
            expect(exportName['Fn::Sub']).toMatch(/^TapStack-\$\{Environment\}-/);
          }
        }
      });
    });
  });

  describe('Security and Best Practices', () => {
    test('Lambda function should have proper IAM role integration', () => {
      const lambda = template.Resources.TapFunction;
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn']
      });
    });

    test('Lambda Permission should allow API Gateway to invoke function', () => {
      const permission = template.Resources.LambdaApiGatewayPermission;
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
      expect(permission.Properties.FunctionName).toEqual({ Ref: 'TapFunction' });
    });

    test('IAM Role should have CloudWatch Logs policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const cloudWatchPolicy = policies.find((p: any) => p.PolicyName === 'CloudWatchLogsPolicy');
      expect(cloudWatchPolicy).toBeDefined();
      expect(cloudWatchPolicy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogGroup');
      expect(cloudWatchPolicy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogStream');
      expect(cloudWatchPolicy.PolicyDocument.Statement[0].Action).toContain('logs:PutLogEvents');
    });
  });

  describe('LocalStack Compatibility', () => {
    test('should not use SAM Transform', () => {
      expect(template.Transform).toBeUndefined();
    });

    test('should not use AWS::Serverless resources', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.Type).not.toMatch(/^AWS::Serverless::/);
      });
    });

    test('should use standard AWS::Lambda::Function instead of AWS::Serverless::Function', () => {
      const lambdaFunction = template.Resources.TapFunction;
      expect(lambdaFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should use REST API Gateway instead of HTTP API', () => {
      const restApi = template.Resources.TapRestApi;
      expect(restApi.Type).toBe('AWS::ApiGateway::RestApi');
      // Should not have HttpApi resources
      expect(template.Resources.ServerlessHttpApi).toBeUndefined();
    });

    test('should use Python 3.11 runtime (LocalStack compatible)', () => {
      const lambda = template.Resources.TapFunction;
      expect(lambda.Properties.Runtime).toBe('python3.11');
    });

    test('all resources should be LocalStack Pro supported types', () => {
      const supportedTypes = [
        'AWS::IAM::Role',
        'AWS::S3::Bucket',
        'AWS::Lambda::Function',
        'AWS::Lambda::Permission',
        'AWS::ApiGateway::RestApi',
        'AWS::ApiGateway::Method',
        'AWS::ApiGateway::Resource',
        'AWS::ApiGateway::Deployment',
        'AWS::ApiGateway::Stage'
      ];

      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(supportedTypes).toContain(resource.Type);
      });
    });
  });
});
