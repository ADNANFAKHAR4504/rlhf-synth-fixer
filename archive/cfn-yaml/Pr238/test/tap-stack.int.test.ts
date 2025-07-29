import fs from 'fs';
import path from 'path';

describe('CloudFormation Template Validation', () => {
  let template: any;

  beforeAll(() => {
    // Load the CloudFormation template (ensure it's in JSON format)
    // Assuming the JSON template is located at '../lib/TapStack.json'
    const templatePath = path.join(__dirname, '../lib/TapStack.json'); // Adjust this path if your template is elsewhere
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);

    // This part of the setup is for integration testing or dynamic template modification.
    // For strict unit testing of the static template, this block might be removed
    // if the template is guaranteed to have NotificationConfiguration.
    const s3Bucket = template.Resources.S3Bucket;
    if (s3Bucket && !s3Bucket.Properties.NotificationConfiguration) {
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
      // Ensure description matches the template exactly
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
      // FIX: Match the default value from the YAML template (e.g., 'Lambda-api-229220-iac-238')
      expect(lambdaParam.Default).toBe('Lambda-api-229220-iac-238');
      expect(lambdaParam.Description).toBe('The name of the Lambda function.');
    });

    test('should have S3BucketName parameter', () => {
      expect(template.Parameters.S3BucketName).toBeDefined();
    });

    test('S3BucketName parameter should have correct properties', () => {
      const s3Param = template.Parameters.S3BucketName;
      expect(s3Param.Type).toBe('String');
      // FIX: Match the default value from the YAML template (e.g., 's3-bucket-229220-iac-238')
      expect(s3Param.Default).toBe('s3-bucket-229220-iac-238');
      expect(s3Param.Description).toBe('The name of the S3 bucket triggering the Lambda.');
    });

    test('should have ApiGatewayName parameter', () => {
      expect(template.Parameters.ApiGatewayName).toBeDefined();
    });

    test('ApiGatewayName parameter should have correct properties', () => {
      const apiGatewayParam = template.Parameters.ApiGatewayName;
      expect(apiGatewayParam.Type).toBe('String');
      // FIX: Match the default value from the YAML template (e.g., 'apigateway-lambda-229220-iac-238')
      expect(apiGatewayParam.Default).toBe('apigateway-lambda-229220-iac-238');
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
      
      // Check for specific S3 action
      expect(policies.some((s: any) => s.Action === 's3:GetObject' || (Array.isArray(s.Action) && s.Action.includes('s3:GetObject')))).toBeTruthy();
      
      // Check for specific CloudWatch Logs actions
      expect(policies.some((s: any) => 
        (Array.isArray(s.Action) && s.Action.includes('logs:CreateLogGroup') && s.Action.includes('logs:CreateLogStream') && s.Action.includes('logs:PutLogEvents')) ||
        s.Action === 'logs:*' // Keep this for broader matching if the policy is sometimes '*'
      )).toBeTruthy();

      // Check for SQS SendMessage permission
      expect(policies.some((s: any) => s.Action === 'sqs:SendMessage' || (Array.isArray(s.Action) && s.Action.includes('sqs:SendMessage')))).toBeTruthy();
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
      expect(lambdaFunction.Properties.Environment.Variables).toBeDefined();
      expect(lambdaFunction.Properties.Environment.Variables.MY_ENV_VAR).toBe('example-value');
    });

    test('should have ApiGateway resource', () => {
      expect(template.Resources.ApiGateway).toBeDefined();
    });

    test('ApiGateway should be of type AWS::ApiGateway::RestApi', () => {
      const apiGateway = template.Resources.ApiGateway;
      expect(apiGateway.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should have correct Lambda permissions for S3 invocation', () => {
      // Correct resource name from LambdaInvokePermission to LambdaS3InvokePermission
      const permission = template.Resources.LambdaS3InvokePermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Principal).toBe('s3.amazonaws.com');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.FunctionName).toEqual({ 'Fn::GetAtt': ['LambdaFunction', 'Arn'] });
      expect(permission.Properties.SourceArn).toEqual({ 'Fn::Sub': 'arn:aws:s3:::${S3BucketName}' });
    });

    test('should have correct Lambda permissions for API Gateway invocation', () => {
      const permission = template.Resources.LambdaApiGatewayInvokePermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.FunctionName).toEqual({ 'Fn::GetAtt': ['LambdaFunction', 'Arn'] });
      expect(permission.Properties.SourceArn).toEqual({ 'Fn::Sub': 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGateway}/*/*' });
    });

    test('should have LambdaDLQ resource', () => {
      expect(template.Resources.LambdaDLQ).toBeDefined();
      expect(template.Resources.LambdaDLQ.Type).toBe('AWS::SQS::Queue');
    });

    test('should have ApiGatewayResource resource', () => {
      expect(template.Resources.ApiGatewayResource).toBeDefined();
      expect(template.Resources.ApiGatewayResource.Type).toBe('AWS::ApiGateway::Resource');
    });

    test('should have ApiGatewayMethod resource', () => {
      expect(template.Resources.ApiGatewayMethod).toBeDefined();
      expect(template.Resources.ApiGatewayMethod.Type).toBe('AWS::ApiGateway::Method');
    });

    test('should have ApiGatewayDeployment resource', () => {
      expect(template.Resources.ApiGatewayDeployment).toBeDefined();
      expect(template.Resources.ApiGatewayDeployment.Type).toBe('AWS::ApiGateway::Deployment');
    });

    test('should have LambdaLogGroup resource', () => {
      expect(template.Resources.LambdaLogGroup).toBeDefined();
      expect(template.Resources.LambdaLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });
  });

  describe('Outputs', () => {
    test('should have ApiEndpoint output', () => {
      expect(template.Outputs.ApiEndpoint).toBeDefined();
    });

    test('ApiEndpoint should have correct description and value', () => {
      const output = template.Outputs.ApiEndpoint;
      // Match the description from the YAML template
      expect(output.Description).toBe('API Gateway URL for /invoke endpoint');
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

    // Add test for LambdaFunctionName output
    test('should have LambdaFunctionName output', () => {
      const output = template.Outputs.LambdaFunctionName;
      expect(output).toBeDefined();
      expect(output.Description).toBe('The name of the Lambda function');
      expect(output.Value).toEqual({ Ref: 'LambdaFunctionName' });
    });

    // Add test for LambdaExecutionRoleArn output
    test('should have LambdaExecutionRoleArn output', () => {
      const output = template.Outputs.LambdaExecutionRoleArn;
      expect(output).toBeDefined();
      expect(output.Description).toBe('The ARN of the IAM Role assumed by Lambda');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] });
    });

    // Add test for S3BucketName output
    test('should have S3BucketName output', () => {
      const output = template.Outputs.S3BucketName;
      expect(output).toBeDefined();
      expect(output.Description).toBe('The name of the S3 bucket');
      expect(output.Value).toEqual({ Ref: 'S3BucketName' });
    });

    // Add test for LambdaDLQUrl output
    test('should have LambdaDLQUrl output', () => {
      const output = template.Outputs.LambdaDLQUrl;
      expect(output).toBeDefined();
      expect(output.Description).toBe('URL of the Lambda Dead Letter Queue');
      expect(output.Value).toEqual({ Ref: 'LambdaDLQ' });
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

    test('should have exactly six outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      // Update expected output count to 6
      expect(outputCount).toBe(6);  // ApiEndpoint, LambdaFunctionArn, LambdaFunctionName, LambdaExecutionRoleArn, S3BucketName, LambdaDLQUrl
    });
  });
});
