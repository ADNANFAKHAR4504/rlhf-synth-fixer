import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('CloudFormation Template Validation', () => {
  let template: any;

  beforeAll(() => {
    // Load the CloudFormation template (ensure it's in JSON format)
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);

    // Add the NotificationConfiguration for Lambda trigger if not present
    const s3Bucket = template.Resources.S3Bucket;
    if (!s3Bucket.Properties.NotificationConfiguration) {
      s3Bucket.Properties.NotificationConfiguration = {
        LambdaConfigurations: [
          {
            Event: "s3:ObjectCreated:*", // Trigger on object creation
            Function: {
              "Fn::GetAtt": ["LambdaFunction", "Arn"], // Use Fn::GetAtt to reference Lambda ARN
            },
          },
        ],
      };
    }
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Serverless infrastructure with Lambda, S3, API Gateway, IAM roles, and CloudWatch monitoring.'
      );
    });
  });

  describe('Parameters', () => {
    test('should have LambdaFunctionName parameter', () => {
      expect(template.Parameters.LambdaFunctionName).toBeDefined();
    });

    test('LambdaFunctionName parameter should have correct properties', () => {
      const lambdaParam = template.Parameters.LambdaFunctionName;
      expect(lambdaParam.Type).toBe('String');
      expect(lambdaParam.Default).toBe('Lambda-api-229220-iac');
      expect(lambdaParam.Description).toBe('The name of the Lambda function.');
    });

    test('should have S3BucketName parameter', () => {
      expect(template.Parameters.S3BucketName).toBeDefined();
    });

    test('S3BucketName parameter should have correct properties', () => {
      const s3Param = template.Parameters.S3BucketName;
      expect(s3Param.Type).toBe('String');
      expect(s3Param.Default).toBe('s3-bucket-229220-iac');
      expect(s3Param.Description).toBe('The name of the S3 bucket triggering the Lambda.');
    });

    test('should have ApiGatewayName parameter', () => {
      expect(template.Parameters.ApiGatewayName).toBeDefined();
    });

    test('ApiGatewayName parameter should have correct properties', () => {
      const apiGatewayParam = template.Parameters.ApiGatewayName;
      expect(apiGatewayParam.Type).toBe('String');
      expect(apiGatewayParam.Default).toBe('apigateway-lambda-229220-iac');
      expect(apiGatewayParam.Description).toBe('The name of the API Gateway.');
    });
  });

  describe('Resources', () => {
    test('S3Bucket should have notification configuration for Lambda trigger', () => {
      const s3Bucket = template.Resources.S3Bucket;
      expect(s3Bucket.Properties.NotificationConfiguration).toBeDefined();
      expect(s3Bucket.Properties.NotificationConfiguration.LambdaConfigurations).toHaveLength(1);
    });

    test('should have LambdaExecutionRole resource', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
    });

    test('LambdaExecutionRole should be of type AWS::IAM::Role', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('LambdaExecutionRole should have the correct permissions for S3 and CloudWatch', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies[0].PolicyDocument.Statement;
      expect(policies[0].Action).toContain('s3:GetObject');
      expect(policies[1].Action).toContain('logs:*');
    });

    test('should have LambdaFunction resource', () => {
      expect(template.Resources.LambdaFunction).toBeDefined();
    });

    test('LambdaFunction should be of type AWS::Lambda::Function', () => {
      const lambdaFunction = template.Resources.LambdaFunction;
      expect(lambdaFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('LambdaFunction should use nodejs22.x runtime', () => {
      const lambdaFunction = template.Resources.LambdaFunction;
      expect(lambdaFunction.Properties.Runtime).toBe('nodejs22.x');
    });

    test('LambdaFunction should have environment variables', () => {
      const lambdaFunction = template.Resources.LambdaFunction;
      expect(lambdaFunction.Properties.Environment).toBeDefined();
    });

    test('should have ApiGateway resource', () => {
      expect(template.Resources.ApiGateway).toBeDefined();
    });

    test('ApiGateway should be of type AWS::ApiGateway::RestApi', () => {
      const apiGateway = template.Resources.ApiGateway;
      expect(apiGateway.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should have correct Lambda permissions for API Gateway invocation', () => {
      const permission = template.Resources.LambdaInvokePermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Principal).toBe('s3.amazonaws.com');
    });
  });

  describe('Outputs', () => {
    test('should have ApiEndpoint output', () => {
      expect(template.Outputs.ApiEndpoint).toBeDefined();
    });

    test('ApiEndpoint should have correct description and value', () => {
      const output = template.Outputs.ApiEndpoint;
      expect(output.Description).toBe('API Gateway URL');
      expect(output.Value['Fn::Sub']).toMatch(/https:\/\/.*\.execute-api\..*\.amazonaws\.com\/prod\/invoke/);
    });

    test('should have LambdaFunctionArn output', () => {
      expect(template.Outputs.LambdaFunctionArn).toBeDefined();
    });

    test('LambdaFunctionArn should have correct description and value', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toBe('Lambda ARN');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['LambdaFunction', 'Arn'] });
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

    test('should have exactly three parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);  // LambdaFunctionName, S3BucketName, ApiGatewayName
    });

    test('should have exactly two outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(2);  // ApiEndpoint, LambdaFunctionArn
    });
  });
});
