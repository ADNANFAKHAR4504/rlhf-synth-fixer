import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('S3 Lambda Trigger CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the CloudFormation template JSON file
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
      expect(template.Description).toBe('CloudFormation template to deploy a Lambda function triggered by an S3 event on object creation.');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });
  });

  describe('Parameters', () => {
    test('should have BucketName parameter', () => {
      const param = template.Parameters.BucketName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Description).toBe('The name of the S3 bucket that will trigger the Lambda function.');
    });

    test('should have LambdaFunctionName parameter', () => {
      const param = template.Parameters.LambdaFunctionName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Description).toBe('The name of the Lambda function to be created.');
    });

    test('should have LambdaRoleName parameter', () => {
      const param = template.Parameters.LambdaRoleName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Description).toBe('The IAM Role name for the Lambda function.');
    });

    test('should have LambdaHandler parameter', () => {
      const param = template.Parameters.LambdaHandler;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('index.handler');
    });

    test('should have LambdaRuntime parameter', () => {
      const param = template.Parameters.LambdaRuntime;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('nodejs22.x');
    });
  });

  describe('Resources', () => {
    test('should have S3Bucket resource', () => {
      const s3Bucket = template.Resources.S3Bucket;
      expect(s3Bucket).toBeDefined();
      expect(s3Bucket.Type).toBe('AWS::S3::Bucket');
      expect(s3Bucket.Properties.BucketName).toEqual({ Ref: 'BucketName' });
    });

    test('should have LambdaExecutionRole resource', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(role.Properties.Policies[0].PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
    });

    test('should have LambdaFunction resource', () => {
      const lambdaFunction = template.Resources.LambdaFunction;
      expect(lambdaFunction).toBeDefined();
      expect(lambdaFunction.Type).toBe('AWS::Lambda::Function');
      expect(lambdaFunction.Properties.FunctionName).toEqual({ Ref: 'LambdaFunctionName' });
      expect(lambdaFunction.Properties.Handler).toEqual({ Ref: 'LambdaHandler' });
      expect(lambdaFunction.Properties.Role).toEqual({ 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] });
    });

    test('should have EventSourceMapping for Lambda', () => {
      const eventSourceMapping = template.Resources.LambdaS3EventSource;
      expect(eventSourceMapping).toBeDefined();
      expect(eventSourceMapping.Type).toBe('AWS::Lambda::EventSourceMapping');
      expect(eventSourceMapping.Properties.EventSourceArn).toEqual({ 'Fn::GetAtt': ['S3Bucket', 'Arn'] });
      expect(eventSourceMapping.Properties.FunctionName).toEqual({ Ref: 'LambdaFunction' });
    });

    test('should have S3 Bucket Notification Configuration', () => {
      const notificationConfig = template.Resources.BucketNotification;
      expect(notificationConfig).toBeDefined();
      expect(notificationConfig.Type).toBe('AWS::S3::BucketNotification');
      expect(notificationConfig.Properties.NotificationConfiguration.LambdaFunctionConfigurations[0].Event).toBe('s3:ObjectCreated:*');
      expect(notificationConfig.Properties.NotificationConfiguration.LambdaFunctionConfigurations[0].Function).toEqual({ 'Fn::GetAtt': ['LambdaFunction', 'Arn'] });
    });
  });

  describe('Outputs', () => {
    test('should have LambdaFunctionName output', () => {
      const output = template.Outputs.LambdaFunctionName;
      expect(output).toBeDefined();
      expect(output.Description).toBe('The name of the Lambda function');
      expect(output.Value).toEqual({ Ref: 'LambdaFunctionName' });
    });

    test('should have LambdaExecutionRoleArn output', () => {
      const output = template.Outputs.LambdaExecutionRoleArn;
      expect(output).toBeDefined();
      expect(output.Description).toBe('The ARN of the IAM Role assumed by Lambda');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] });
    });

    test('should have S3BucketName output', () => {
      const output = template.Outputs.S3BucketName;
      expect(output).toBeDefined();
      expect(output.Description).toBe('The name of the S3 bucket');
      expect(output.Value).toEqual({ Ref: 'S3Bucket' });
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
  });
});
