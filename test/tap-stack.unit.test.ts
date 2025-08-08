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
      expect(typeof template.Description).toBe('string');
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
      expect(param.Description).toBeDefined();
      expect(param.AllowedPattern).toBeDefined();
    });

    test('should have ApplicationName parameter', () => {
      expect(template.Parameters.ApplicationName).toBeDefined();
    });

    test('ApplicationName parameter should have correct properties', () => {
      const param = template.Parameters.ApplicationName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('serverless-app');
      expect(param.Description).toBeDefined();
    });

    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('Environment parameter should have correct properties', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('prod');
      expect(param.Description).toBeDefined();
      expect(param.AllowedValues).toBeDefined();
      expect(param.AllowedValues).toContain('dev');
      expect(param.AllowedValues).toContain('staging');
      expect(param.AllowedValues).toContain('prod');
    });
  });

  describe('Resources', () => {
    test('should have MainLambdaFunction resource', () => {
      expect(template.Resources.MainLambdaFunction).toBeDefined();
    });

    test('MainLambdaFunction should be a Lambda function', () => {
      const resource = template.Resources.MainLambdaFunction;
      expect(resource.Type).toBe('AWS::Lambda::Function');
    });

    test('MainLambdaFunction should have correct properties', () => {
      const resource = template.Resources.MainLambdaFunction;
      expect(resource.Properties).toBeDefined();
      expect(resource.Properties.Runtime).toBeDefined();
      expect(resource.Properties.Handler).toBeDefined();
      expect(resource.Properties.Role).toBeDefined();
      expect(resource.Properties.Code).toBeDefined();
    });

    test('should have LambdaLogGroup resource', () => {
      expect(template.Resources.LambdaLogGroup).toBeDefined();
    });

    test('LambdaLogGroup should be a CloudWatch Log Group', () => {
      const resource = template.Resources.LambdaLogGroup;
      expect(resource.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have RestApi resource', () => {
      expect(template.Resources.RestApi).toBeDefined();
    });

    test('RestApi should be an API Gateway REST API', () => {
      const resource = template.Resources.RestApi;
      expect(resource.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should have ApiResource resource', () => {
      expect(template.Resources.ApiResource).toBeDefined();
    });

    test('ApiResource should be an API Gateway Resource', () => {
      const resource = template.Resources.ApiResource;
      expect(resource.Type).toBe('AWS::ApiGateway::Resource');
    });

    test('should have ApiMethod resource', () => {
      expect(template.Resources.ApiMethod).toBeDefined();
    });

    test('ApiMethod should be an API Gateway Method', () => {
      const resource = template.Resources.ApiMethod;
      expect(resource.Type).toBe('AWS::ApiGateway::Method');
    });

    test('should have ApiGatewayLogGroup resource', () => {
      expect(template.Resources.ApiGatewayLogGroup).toBeDefined();
    });

    test('ApiGatewayLogGroup should be a CloudWatch Log Group', () => {
      const resource = template.Resources.ApiGatewayLogGroup;
      expect(resource.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have S3Bucket resource', () => {
      expect(template.Resources.S3Bucket).toBeDefined();
    });

    test('S3Bucket should be an S3 bucket', () => {
      const resource = template.Resources.S3Bucket;
      expect(resource.Type).toBe('AWS::S3::Bucket');
    });

    test('S3Bucket should have correct properties', () => {
      const resource = template.Resources.S3Bucket;
      expect(resource.Properties).toBeDefined();
      expect(resource.Properties.BucketEncryption).toBeDefined();
      expect(resource.Properties.VersioningConfiguration).toBeDefined();
      expect(resource.Properties.PublicAccessBlockConfiguration).toBeDefined();
    });

    test('should have LambdaExecutionRole resource', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
    });

    test('LambdaExecutionRole should be an IAM Role', () => {
      const resource = template.Resources.LambdaExecutionRole;
      expect(resource.Type).toBe('AWS::IAM::Role');
    });

    test('should have ApiGatewayCloudWatchRole resource', () => {
      expect(template.Resources.ApiGatewayCloudWatchRole).toBeDefined();
    });

    test('ApiGatewayCloudWatchRole should be an IAM Role', () => {
      const resource = template.Resources.ApiGatewayCloudWatchRole;
      expect(resource.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const outputs = template.Outputs;
      expect(outputs.ApiGatewayUrl).toBeDefined();
      expect(outputs.LambdaFunctionArn).toBeDefined();
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.LambdaFunctionName).toBeDefined();
      expect(outputs.CloudWatchLogGroups).toBeDefined();
      expect(outputs.SecurityFeatures).toBeDefined();
      expect(outputs.StackName).toBeDefined();
      expect(outputs.EnvironmentSuffix).toBeDefined();
    });

    test('ApiGatewayUrl output should be correct', () => {
      const output = template.Outputs.ApiGatewayUrl;
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
      expect(output.Value['Fn::Sub']).toBeDefined();
    });

    test('LambdaFunctionArn output should be correct', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
      expect(output.Value['Fn::GetAtt']).toBeDefined();
    });

    test('S3BucketName output should be correct', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
      expect(output.Value.Ref).toBeDefined();
    });

    test('LambdaFunctionName output should be correct', () => {
      const output = template.Outputs.LambdaFunctionName;
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
      expect(output.Value.Ref).toBeDefined();
    });

    test('CloudWatchLogGroups output should be correct', () => {
      const output = template.Outputs.CloudWatchLogGroups;
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
      expect(output.Value['Fn::Sub']).toBeDefined();
    });

    test('SecurityFeatures output should be correct', () => {
      const output = template.Outputs.SecurityFeatures;
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
      expect(output.Value).toContain('S3 AES-256 encryption');
    });

    test('StackName output should be correct', () => {
      const output = template.Outputs.StackName;
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
      expect(output.Value.Ref).toBeDefined();
      expect(output.Export).toBeDefined();
    });

    test('EnvironmentSuffix output should be correct', () => {
      const output = template.Outputs.EnvironmentSuffix;
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
      expect(output.Value.Ref).toBeDefined();
      expect(output.Export).toBeDefined();
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have the correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(0);
    });

    test('should have the correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3); // EnvironmentSuffix, ApplicationName, Environment
    });

    test('should have the correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThan(0);
    });
  });

  describe('Resource Naming Convention', () => {
    test('Lambda function name should follow naming convention with environment suffix', () => {
      const lambdaFunction = template.Resources.MainLambdaFunction;
      const functionName = lambdaFunction.Properties.FunctionName;
      expect(functionName['Fn::Sub']).toBeDefined();
      expect(functionName['Fn::Sub']).toContain('${ApplicationName}');
      expect(functionName['Fn::Sub']).toContain('${Environment}');
    });

    test('S3 bucket name should follow naming convention', () => {
      const s3Bucket = template.Resources.S3Bucket;
      const bucketName = s3Bucket.Properties.BucketName;
      expect(bucketName['Fn::Sub']).toBeDefined();
      expect(bucketName['Fn::Sub']).toContain('${ApplicationName}');
      expect(bucketName['Fn::Sub']).toContain('${Environment}');
      expect(bucketName['Fn::Sub']).toContain('${AWS::AccountId}');
    });

    test('export names should follow naming convention', () => {
      const stackNameOutput = template.Outputs.StackName;
      const envSuffixOutput = template.Outputs.EnvironmentSuffix;
      
      expect(stackNameOutput.Export.Name['Fn::Sub']).toBeDefined();
      expect(stackNameOutput.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      
      expect(envSuffixOutput.Export.Name['Fn::Sub']).toBeDefined();
      expect(envSuffixOutput.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
    });
  });
});
