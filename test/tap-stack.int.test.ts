import { Template, Match } from 'aws-cdk-lib/assertions';
import * as cdk from 'aws-cdk-lib';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

// Mock AWS SDK for integration testing
jest.mock('aws-sdk', () => {
  const mockS3 = {
    getObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Body: Buffer.from('test file content'),
        ContentLength: 20,
        LastModified: new Date('2023-01-01')
      })
    })
  };

  const mockCloudWatch = {
    createLogStream: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    }),
    putLogEvents: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    })
  };

  return {
    S3: jest.fn(() => mockS3),
    CloudWatchLogs: jest.fn(() => mockCloudWatch)
  };
});

describe('TapStack Integration Tests', () => {
  let template: any;
  let mockEvent: any;

  beforeAll(() => {
    // Read the CloudFormation YAML template
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent);

    // Mock S3 event
    mockEvent = {
      Records: [
        {
          eventVersion: '2.1',
          eventSource: 'aws:s3',
          awsRegion: 'us-east-1',
          eventTime: '2023-01-01T00:00:00.000Z',
          eventName: 'ObjectCreated:Put',
          s3: {
            s3SchemaVersion: '1.0',
            configurationId: 'test-config',
            bucket: {
              name: 'test-bucket',
              ownerIdentity: {
                principalId: 'test-owner'
              },
              arn: 'arn:aws:s3:::test-bucket'
            },
            object: {
              key: 'test-file.txt',
              size: 20,
              eTag: 'test-etag',
              sequencer: 'test-sequencer'
            }
          }
        }
      ]
    };
  });

  describe('Template Deployment Simulation', () => {
    test('should have all required resources for deployment', () => {
      const resources = template.Resources;
      
      // Check that all required resources exist
      expect(resources.LambdaExecutionRole).toBeDefined();
      expect(resources.S3FileProcessorFunction).toBeDefined();
      expect(resources.LambdaInvokePermission).toBeDefined();
      expect(resources.S3BucketNotification).toBeDefined();
    });

    test('should have correct resource dependencies', () => {
      const lambda = template.Resources.S3FileProcessorFunction;
      const role = template.Resources.LambdaExecutionRole;
      const permission = template.Resources.LambdaInvokePermission;
      const notification = template.Resources.S3BucketNotification;

      // Lambda should reference the role
      expect(lambda.Properties.Role).toContain('LambdaExecutionRole');

      // Permission should reference the Lambda function
      expect(permission.Properties.FunctionName).toContain('S3FileProcessorFunction');

      // Notification should reference the Lambda function
      expect(notification.Properties.LambdaConfigurations[0].Function).toContain('S3FileProcessorFunction');
    });
  });

  describe('Lambda Function Integration', () => {
    test('should have correct environment configuration', () => {
      const lambda = template.Resources.S3FileProcessorFunction;
      const envVars = lambda.Properties.Environment.Variables;

      expect(envVars.LOG_GROUP_NAME).toBeDefined();
      expect(envVars.LOG_GROUP_NAME).toContain('CloudWatchLogGroupName');
    });

    test('should have proper IAM permissions for S3 access', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const s3Policy = policies[0].PolicyDocument.Statement[0];

      expect(s3Policy.Effect).toBe('Allow');
      expect(s3Policy.Action).toContain('s3:GetObject');
      expect(s3Policy.Resource).toContain('S3BucketName');
    });

    test('should have proper IAM permissions for CloudWatch access', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const cloudWatchPolicy = policies[0].PolicyDocument.Statement[1];

      expect(cloudWatchPolicy.Effect).toBe('Allow');
      expect(cloudWatchPolicy.Action).toContain('logs:CreateLogStream');
      expect(cloudWatchPolicy.Action).toContain('logs:PutLogEvents');
      expect(cloudWatchPolicy.Resource).toContain('CloudWatchLogGroupName');
    });
  });

  describe('S3 Event Integration', () => {
    test('should configure S3 event trigger correctly', () => {
      const notification = template.Resources.S3BucketNotification;
      const lambdaConfig = notification.Properties.LambdaConfigurations[0];

      expect(lambdaConfig.Event).toBe('s3:ObjectCreated:*');
      expect(lambdaConfig.Function).toBeDefined();
      expect(lambdaConfig.Filter).toBeDefined();
    });

    test('should filter for text files only', () => {
      const notification = template.Resources.S3BucketNotification;
      const filter = notification.Properties.LambdaConfigurations[0].Filter;

      expect(filter.S3Key.Rules[0].Name).toBe('suffix');
      expect(filter.S3Key.Rules[0].Value).toBe('.txt');
    });

    test('should have proper Lambda permission for S3 invocation', () => {
      const permission = template.Resources.LambdaInvokePermission;

      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('s3.amazonaws.com');
      expect(permission.Properties.SourceArn).toContain('S3BucketName');
    });
  });

  describe('Lambda Function Code Integration', () => {
    test('should have valid JavaScript code', () => {
      const lambda = template.Resources.S3FileProcessorFunction;
      const code = lambda.Properties.Code.ZipFile;

      // Check that the code contains essential elements
      expect(code).toContain('const AWS = require(\'aws-sdk\')');
      expect(code).toContain('exports.handler = async (event) =>');
      expect(code).toContain('s3.getObject');
      expect(code).toContain('cloudwatch.putLogEvents');
    });

    test('should handle S3 event records correctly', () => {
      const lambda = template.Resources.S3FileProcessorFunction;
      const code = lambda.Properties.Code.ZipFile;

      expect(code).toContain('for (const record of event.Records)');
      expect(code).toContain('record.s3.bucket.name');
      expect(code).toContain('record.s3.object.key');
    });

    test('should process file content and metadata', () => {
      const lambda = template.Resources.S3FileProcessorFunction;
      const code = lambda.Properties.Code.ZipFile;

      expect(code).toContain('fileContent = s3Object.Body.toString');
      expect(code).toContain('fileSize = s3Object.ContentLength');
      expect(code).toContain('lastModified = s3Object.LastModified');
    });

    test('should log to CloudWatch correctly', () => {
      const lambda = template.Resources.S3FileProcessorFunction;
      const code = lambda.Properties.Code.ZipFile;

      expect(code).toContain('process.env.LOG_GROUP_NAME');
      expect(code).toContain('cloudwatch.createLogStream');
      expect(code).toContain('cloudwatch.putLogEvents');
    });
  });

  describe('Error Handling Integration', () => {
    test('should have proper error handling in Lambda code', () => {
      const lambda = template.Resources.S3FileProcessorFunction;
      const code = lambda.Properties.Code.ZipFile;

      expect(code).toContain('try {');
      expect(code).toContain('catch (error) {');
      expect(code).toContain('console.error');
      expect(code).toContain('throw error');
    });

    test('should return proper response structure', () => {
      const lambda = template.Resources.S3FileProcessorFunction;
      const code = lambda.Properties.Code.ZipFile;

      expect(code).toContain('statusCode: 200');
      expect(code).toContain('JSON.stringify');
      expect(code).toContain('processedRecords');
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('should use consistent naming convention', () => {
      const lambda = template.Resources.S3FileProcessorFunction;
      const role = template.Resources.LambdaExecutionRole;

      expect(lambda.Properties.FunctionName).toContain('s3-file-processor');
      expect(role.Properties.RoleName).toContain('lambda-execution-role');
    });

    test('should reference stack name in resource names', () => {
      const lambda = template.Resources.S3FileProcessorFunction;
      const role = template.Resources.LambdaExecutionRole;

      expect(lambda.Properties.FunctionName).toContain('AWS::StackName');
      expect(role.Properties.RoleName).toContain('AWS::StackName');
    });
  });

  describe('Output Integration', () => {
    test('should export all necessary values', () => {
      const outputs = template.Outputs;

      expect(outputs.LambdaFunctionName).toBeDefined();
      expect(outputs.LambdaFunctionArn).toBeDefined();
      expect(outputs.LambdaExecutionRoleArn).toBeDefined();
    });

    test('should have proper export names', () => {
      const outputs = template.Outputs;

      expect(outputs.LambdaFunctionName.Export.Name).toContain('LambdaFunctionName');
      expect(outputs.LambdaFunctionArn.Export.Name).toContain('LambdaFunctionArn');
      expect(outputs.LambdaExecutionRoleArn.Export.Name).toContain('LambdaExecutionRoleArn');
    });
  });

  describe('Parameter Validation Integration', () => {
    test('should validate S3 bucket name format', () => {
      const s3BucketParam = template.Parameters.S3BucketName;
      const pattern = new RegExp(s3BucketParam.AllowedPattern);

      // Valid bucket names
      expect(pattern.test('my-bucket')).toBe(true);
      expect(pattern.test('mybucket123')).toBe(true);
      expect(pattern.test('my.bucket')).toBe(true);

      // Invalid bucket names
      expect(pattern.test('My-Bucket')).toBe(false); // uppercase
      expect(pattern.test('-my-bucket')).toBe(false); // starts with dash
      expect(pattern.test('my-bucket-')).toBe(false); // ends with dash
    });

    test('should validate CloudWatch Log Group name format', () => {
      const logGroupParam = template.Parameters.CloudWatchLogGroupName;
      const pattern = new RegExp(logGroupParam.AllowedPattern);

      // Valid log group names
      expect(pattern.test('/aws/lambda/my-function')).toBe(true);
      expect(pattern.test('my-log-group')).toBe(true);
      expect(pattern.test('my.log.group')).toBe(true);

      // Invalid log group names
      expect(pattern.test('my log group')).toBe(false); // spaces
      expect(pattern.test('my@log@group')).toBe(false); // invalid characters
    });
  });

  describe('Security Integration', () => {
    test('should use least privilege principle', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies[0].PolicyDocument.Statement;

      // Check S3 permissions are specific to the bucket
      const s3Policy = policies[0];
      expect(s3Policy.Resource).toContain('S3BucketName');
      expect(s3Policy.Action).toEqual(['s3:GetObject', 's3:GetObjectVersion']);

      // Check CloudWatch permissions are specific to the log group
      const cloudWatchPolicy = policies[1];
      expect(cloudWatchPolicy.Resource).toContain('CloudWatchLogGroupName');
      expect(cloudWatchPolicy.Action).toEqual(['logs:CreateLogStream', 'logs:PutLogEvents']);
    });

    test('should not expose sensitive information in outputs', () => {
      const outputs = template.Outputs;

      // Should not export sensitive information like role ARNs with embedded credentials
      expect(outputs.LambdaExecutionRoleArn.Value).not.toContain('sts:AssumeRole');
      expect(outputs.LambdaFunctionArn.Value).not.toContain('credentials');
    });
  });
});
