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

    test('should have SAM Transform', () => {
      expect(template.Transform).toBe('AWS::Serverless-2016-10-31');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'TAP Stack - Task Assignment Platform SAM Template - Serverless Application'
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

    test('should have TapFunction SAM resource', () => {
      expect(template.Resources.TapFunction).toBeDefined();
      expect(template.Resources.TapFunction.Type).toBe('AWS::Serverless::Function');
    });
  });
  describe('Outputs', () => {
    test('should have HttpApiUrl output', () => {
      expect(template.Outputs.HttpApiUrl).toBeDefined();
      expect(template.Outputs.HttpApiUrl.Value).toEqual({
        'Fn::Sub': 'https://${ServerlessHttpApi}.execute-api.${AWS::Region}.amazonaws.com/'
      });
    });

    test('should have LambdaFunctionArn output', () => {
      expect(template.Outputs.LambdaFunctionArn).toBeDefined();
      expect(template.Outputs.LambdaFunctionArn.Value).toEqual({
        'Fn::GetAtt': ['TapFunction', 'Arn'],
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
    });    test('TapFunction should have correct runtime and handler', () => {
      const lambda = template.Resources.TapFunction;
      expect(lambda.Properties.Runtime).toBe('python3.8');
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
    });    test('ApiGateway should have correct endpoint configuration', () => {
      const lambda = template.Resources.TapFunction;
      expect(lambda.Properties.Events).toBeDefined();
      expect(lambda.Properties.Events.ApiEvent).toBeDefined();
      expect(lambda.Properties.Events.ApiEvent.Type).toBe('HttpApi');
      expect(lambda.Properties.Events.RootEvent).toBeDefined();
      expect(lambda.Properties.Events.RootEvent.Type).toBe('HttpApi');
    });

    test('TapFunction should have correct environment variables', () => {
      const lambda = template.Resources.TapFunction;
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
      const lambda = template.Resources.TapFunction;
      expect(lambda.Properties.FunctionName).toEqual({
        'Fn::Sub': 'TapFunction-${EnvironmentSuffix}',
      });
    });

    test('S3 bucket name should follow naming convention with environment suffix', () => {
      const bucket = template.Resources.LambdaAssetsBucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'tap-lambda-assets-${EnvironmentSuffix}-${AWS::AccountId}',
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
    test('SAM Function should have proper HTTP API events configuration', () => {
      const samFunction = template.Resources.TapFunction;
      expect(samFunction.Properties.Events.ApiEvent.Type).toBe('HttpApi');
      expect(samFunction.Properties.Events.ApiEvent.Properties.Path).toBe('/{proxy+}');
      expect(samFunction.Properties.Events.ApiEvent.Properties.Method).toBe('ANY');
    });

    test('SAM Function should have root path event configuration', () => {
      const samFunction = template.Resources.TapFunction;
      expect(samFunction.Properties.Events.RootEvent.Type).toBe('HttpApi');
      expect(samFunction.Properties.Events.RootEvent.Properties.Path).toBe('/');
      expect(samFunction.Properties.Events.RootEvent.Properties.Method).toBe('ANY');
    });

    test('TapFunction should have proper IAM role integration', () => {
      const samFunction = template.Resources.TapFunction;
      expect(samFunction.Properties.Role).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn']
      });
    });  });

  describe('SAM-Specific Validations', () => {
    test('should use SAM Transform', () => {
      expect(template.Transform).toBe('AWS::Serverless-2016-10-31');
    });

    test('should have AWS::Serverless::Function resource', () => {
      const samFunction = template.Resources.TapFunction;
      expect(samFunction).toBeDefined();
      expect(samFunction.Type).toBe('AWS::Serverless::Function');
    });

    test('SAM Function should have HttpApi events instead of REST API', () => {
      const samFunction = template.Resources.TapFunction;
      expect(samFunction.Properties.Events).toBeDefined();
      
      // Check for HttpApi events (HTTP API v2)
      expect(samFunction.Properties.Events.ApiEvent.Type).toBe('HttpApi');
      expect(samFunction.Properties.Events.RootEvent.Type).toBe('HttpApi');
    });

    test('should not have traditional API Gateway REST API resources', () => {
      // These should not exist in SAM template as HttpApi is used
      expect(template.Resources.ApiGateway).toBeUndefined();
      expect(template.Resources.ApiGatewayResource).toBeUndefined();
      expect(template.Resources.ApiGatewayMethod).toBeUndefined();
      expect(template.Resources.ApiGatewayDeployment).toBeUndefined();
    });

    test('SAM Function should have inline code property', () => {
      const samFunction = template.Resources.TapFunction;
      expect(samFunction.Properties.InlineCode).toBeDefined();
      expect(typeof samFunction.Properties.InlineCode).toBe('string');
      expect(samFunction.Properties.InlineCode.length).toBeGreaterThan(0);
    });
  });
});
