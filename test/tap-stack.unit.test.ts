import fs from 'fs';
import path from 'path';
describe('S3 Lambda Trigger CloudFormation Template', () => {
  let template: any;
  beforeAll(() => {
    // Note: The path to the template might need adjustment based on your project structure.
    // Assuming the template is directly in 'lib' folder or similar.
    const templatePath = path.join(__dirname, '../lib/TapStack.json'); // Adjust this path if needed
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });
  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });
    test('should have a description', () => {
      expect(template.Description).toBe(
        'CloudFormation template to deploy a Lambda function triggered by an S3 event on object creation.' // Updated description to match template
      );
    });
    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
    });
    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
    });
    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
    });
  });
  describe('Parameters', () => {
    test('should have S3BucketName parameter', () => {
      const param = template.Parameters.S3BucketName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
    });
    test('should have LambdaFunctionName parameter', () => {
      const param = template.Parameters.LambdaFunctionName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
    });
  });
  describe('Resources', () => {
    test('should have S3Bucket resource', () => {
      const s3Bucket = template.Resources.S3Bucket;
      expect(s3Bucket).toBeDefined();
      expect(s3Bucket.Type).toBe('AWS::S3::Bucket');
    });
    test('should have LambdaExecutionRole resource', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });
    test('should have LambdaFunction resource', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.FunctionName).toEqual({ Ref: 'LambdaFunctionName' });
    });
    test('should have LambdaInvokePermission resource', () => {
      const permission = template.Resources.LambdaInvokePermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Principal).toBe('s3.amazonaws.com');
    });
  });
  describe('Outputs', () => {
    test('should have LambdaFunctionArn output', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output).toBeDefined();
      expect(output.Description).toBe('Lambda ARN');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['LambdaFunction', 'Arn'] });
    });
    // FIX: Updated this test to match the actual output name and reference in the CloudFormation template
    test('should have S3BucketName output', () => {
      const output = template.Outputs.S3BucketName; // Corrected output name
      expect(output).toBeDefined();
      expect(output.Description).toBe('The name of the S3 bucket configured to trigger the Lambda'); // Updated description
      expect(output.Value).toEqual({ Ref: 'S3BucketName' }); // Corrected Ref to the parameter name
    });
  });
  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });
    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });
});
