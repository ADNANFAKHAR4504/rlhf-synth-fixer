import fs from 'fs';
import path from 'path';

const environment = process.env.ENVIRONMENT || 'prod';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Write Integration TESTS', () => {
    test('Dont forget!', async () => {
      expect(false).toBe(false);
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Serverless application with Lambda and API Gateway - Production ready template'
      );
    });
  });

  describe('Parameters', () => {
    test('should have ProjectName parameter', () => {
      expect(template.Parameters.ProjectName).toBeDefined();
    });

    test('ProjectName parameter should have correct properties', () => {
      const projectNameParam = template.Parameters.ProjectName;
      expect(projectNameParam.Type).toBe('String');
      expect(projectNameParam.Default).toBe('myproject');
      expect(projectNameParam.Description).toBe(
        'Project name for resource naming convention'
      );
      expect(projectNameParam.AllowedPattern).toBe('[a-z0-9]*');
      expect(projectNameParam.ConstraintDescription).toBe(
        'ProjectName must be lowercase letters and numbers only'
      );
    });

    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('Environment parameter should have correct properties', () => {
      const environmentParam = template.Parameters.Environment;
      expect(environmentParam.Type).toBe('String');
      expect(environmentParam.Default).toBe('prod');
      expect(environmentParam.Description).toBe(
        'Environment name for resource naming convention'
      );
      expect(environmentParam.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });
  });

  describe('Resources', () => {
    test('should have LambdaCodeS3Bucket resource', () => {
      expect(template.Resources.LambdaCodeS3Bucket).toBeDefined();
    });

    test('LambdaCodeS3Bucket should be an S3 bucket', () => {
      const bucket = template.Resources.LambdaCodeS3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('LambdaCodeS3Bucket should have correct properties', () => {
      const bucket = template.Resources.LambdaCodeS3Bucket;
      const properties = bucket.Properties;

      expect(properties.BucketName).toEqual({
        'Fn::Sub': '${ProjectName}-lambda-code-${Environment}-${AWS::AccountId}',
      });
      expect(properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have LambdaExecutionRole resource', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
    });

    test('LambdaExecutionRole should be an IAM role', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should have ServerlessLambdaFunction resource', () => {
      expect(template.Resources.ServerlessLambdaFunction).toBeDefined();
    });

    test('ServerlessLambdaFunction should be a Lambda function', () => {
      const lambdaFunction = template.Resources.ServerlessLambdaFunction;
      expect(lambdaFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should have ServerlessApiGateway resource', () => {
      expect(template.Resources.ServerlessApiGateway).toBeDefined();
    });

    test('ServerlessApiGateway should be an API Gateway REST API', () => {
      const apiGateway = template.Resources.ServerlessApiGateway;
      expect(apiGateway.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should have ApiGatewayDeployment resource', () => {
      expect(template.Resources.ApiGatewayDeployment).toBeDefined();
    });

    test('ApiGatewayDeployment should be an API Gateway deployment', () => {
      const deployment = template.Resources.ApiGatewayDeployment;
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
    });

    test('should have ApiGatewayStage resource', () => {
      expect(template.Resources.ApiGatewayStage).toBeDefined();
    });

    test('ApiGatewayStage should be an API Gateway stage', () => {
      const stage = template.Resources.ApiGatewayStage;
      expect(stage.Type).toBe('AWS::ApiGateway::Stage');
    });
  });

  describe('Outputs', () => {
    test('ApiGatewayUrl output should be correct', () => {
      const output = template.Outputs.ApiGatewayUrl;
      expect(output.Description).toBe(
        'API Gateway endpoint URL'
      );
      expect(output.Value).toEqual({
        "Fn::Sub": 'https://${ServerlessApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${Environment}'
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${ProjectName}-api-url-${Environment}',
      });
    });

    test('LambdaFunctionArn output should be correct', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toBe('Lambda function ARN');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ServerlessLambdaFunction', 'Arn']
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${ProjectName}-lambda-arn-${Environment}',
      });
    });

    test('LambdaCodeBucketName output should be correct', () => {
      const output = template.Outputs.LambdaCodeBucketName;
      expect(output.Description).toBe('S3 bucket name for Lambda code storage');
      expect(output.Value).toEqual({
        'Ref': 'LambdaCodeS3Bucket'
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${ProjectName}-lambda-bucket-${Environment}',
      });
    });

    test('ApiGatewayId output should be correct', () => {
      const output = template.Outputs.ApiGatewayId;
      expect(output.Description).toBe('API Gateway REST API ID');
      expect(output.Value).toEqual({
        'Ref': 'ServerlessApiGateway'
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${ProjectName}-api-id-${Environment}',
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

    test('should have exactly twelve resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(12);
    });

    test('should have exactly two parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });

    test('should have exactly four outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(4);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should follow consistent naming patterns', () => {
      const resources = Object.keys(template.Resources);

      // Check that resource names are in PascalCase
      resources.forEach(resourceName => {
        expect(resourceName).toMatch(/^[A-Z][A-Za-z0-9]*$/);
      });
    });

    test('output export names should follow consistent naming convention', () => {
      const outputs = template.Outputs;

      Object.keys(outputs).forEach(outputKey => {
        const output = outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toMatch(/^\${ProjectName}-.*-\${Environment}$/);
      });
    });

    test('parameters should have proper constraints', () => {
      const projectNameParam = template.Parameters.ProjectName;
      const environmentParam = template.Parameters.Environment;

      expect(projectNameParam.AllowedPattern).toBeDefined();
      expect(projectNameParam.ConstraintDescription).toBeDefined();
      expect(environmentParam.AllowedValues).toBeDefined();
    });
  });
});
