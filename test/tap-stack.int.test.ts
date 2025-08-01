import { Template, Match } from 'aws-cdk-lib/assertions';
import * as cdk from 'aws-cdk-lib';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

// Mock AWS SDK v3 for integration testing
jest.mock('@aws-sdk/client-s3', () => {
  const mockGetObjectCommand = jest.fn();
  const mockS3Client = {
    send: jest.fn().mockImplementation((command) => {
      if (command.constructor.name === 'GetObjectCommand') {
        return Promise.resolve({
          Body: {
            transformToString: jest.fn().mockResolvedValue('test file content')
          },
          ContentLength: 20,
          LastModified: new Date('2023-01-01')
        });
      }
      // Default return for other commands
      return Promise.resolve({});
    })
  };

  return {
    S3Client: jest.fn(() => mockS3Client),
    GetObjectCommand: mockGetObjectCommand
  };
});

jest.mock('@aws-sdk/client-cloudwatch-logs', () => {
  const mockCreateLogStreamCommand = jest.fn();
  const mockPutLogEventsCommand = jest.fn();
  const mockCloudWatchLogsClient = {
    send: jest.fn().mockResolvedValue({})
  };

  return {
    CloudWatchLogsClient: jest.fn(() => mockCloudWatchLogsClient),
    CreateLogStreamCommand: mockCreateLogStreamCommand,
    PutLogEventsCommand: mockPutLogEventsCommand
  };
});

describe('TapStack Integration Tests', () => {
  let template: any;
  let mockEvent: any;

  beforeAll(() => {
    // Read the CloudFormation JSON template (converted from YAML)
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);

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
      // Note: S3BucketNotification is not included since we cannot modify existing S3 buckets
    });

    test('should have correct resource dependencies', () => {
      const lambda = template.Resources.S3FileProcessorFunction;
      const role = template.Resources.LambdaExecutionRole;
      const permission = template.Resources.LambdaInvokePermission;

      // Lambda should reference the role
      expect(lambda.Properties.Role).toEqual({ 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] });

      // Permission should reference the Lambda function
      expect(permission.Properties.FunctionName).toEqual({ 'Ref': 'S3FileProcessorFunction' });
    });
  });

  describe('Lambda Function Integration', () => {
    test('should have correct environment configuration', () => {
      const lambda = template.Resources.S3FileProcessorFunction;
      const envVars = lambda.Properties.Environment.Variables;

      expect(envVars.LOG_GROUP_NAME).toBeDefined();
      expect(envVars.LOG_GROUP_NAME).toEqual({ 'Ref': 'CloudWatchLogGroupName' });
    });

    test('should have proper IAM permissions for S3 access', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const s3Policy = policies[0].PolicyDocument.Statement[0];

      expect(s3Policy.Effect).toBe('Allow');
      expect(s3Policy.Action).toContain('s3:GetObject');
      expect(s3Policy.Resource).toEqual({ 'Fn::Sub': 'arn:aws:s3:::${S3BucketName}/*' });
    });

    test('should have proper IAM permissions for CloudWatch access', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const cloudWatchPolicy = policies[0].PolicyDocument.Statement[1];

      expect(cloudWatchPolicy.Effect).toBe('Allow');
      expect(cloudWatchPolicy.Action).toContain('logs:CreateLogStream');
      expect(cloudWatchPolicy.Action).toContain('logs:PutLogEvents');
      expect(cloudWatchPolicy.Resource).toEqual({ 'Fn::Sub': 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:${CloudWatchLogGroupName}:*' });
    });
  });

  describe('S3 Event Integration', () => {
    test('should have proper Lambda permission for S3 invocation', () => {
      const permission = template.Resources.LambdaInvokePermission;

      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('s3.amazonaws.com');
      expect(permission.Properties.SourceArn).toEqual({ 'Fn::Sub': 'arn:aws:s3:::${S3BucketName}' });
    });

    test('should be configured to handle S3 ObjectCreated events', () => {
      // Since S3 bucket notification is not in the template (existing bucket),
      // we verify the Lambda function is designed to handle S3 events
      const lambda = template.Resources.S3FileProcessorFunction;
      const code = lambda.Properties.Code.ZipFile;

      expect(code).toContain('event.Records');
      expect(code).toContain('record.s3.bucket.name');
      expect(code).toContain('record.s3.object.key');
    });
  });

  describe('Lambda Function Code Integration', () => {
    test('should have valid JavaScript code', () => {
      const lambda = template.Resources.S3FileProcessorFunction;
      const code = lambda.Properties.Code.ZipFile;

      // Check that the code contains essential elements for AWS SDK v3
      expect(code).toContain('require(\'@aws-sdk/client-s3\')');
      expect(code).toContain('require(\'@aws-sdk/client-cloudwatch-logs\')');
      expect(code).toContain('exports.handler = async (event) =>');
      expect(code).toContain('s3Client.send');
      expect(code).toContain('cloudWatchClient.send');
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

      expect(code).toContain('fileContent = await s3Object.Body.transformToString');
      expect(code).toContain('fileSize = s3Object.ContentLength');
      expect(code).toContain('lastModified = s3Object.LastModified');
    });

    test('should log to CloudWatch correctly', () => {
      const lambda = template.Resources.S3FileProcessorFunction;
      const code = lambda.Properties.Code.ZipFile;

      expect(code).toContain('process.env.LOG_GROUP_NAME');
      expect(code).toContain('CreateLogStreamCommand');
      expect(code).toContain('PutLogEventsCommand');
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

      expect(lambda.Properties.FunctionName['Fn::Sub']).toContain('s3-file-processor');
      expect(role.Properties.RoleName['Fn::Sub']).toContain('lambda-execution-role');
    });

    test('should reference stack name in resource names', () => {
      const lambda = template.Resources.S3FileProcessorFunction;
      const role = template.Resources.LambdaExecutionRole;

      expect(lambda.Properties.FunctionName['Fn::Sub']).toContain('${AWS::StackName}');
      expect(role.Properties.RoleName['Fn::Sub']).toContain('${AWS::StackName}');
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

      expect(outputs.LambdaFunctionName.Export.Name['Fn::Sub']).toContain('LambdaFunctionName');
      expect(outputs.LambdaFunctionArn.Export.Name['Fn::Sub']).toContain('LambdaFunctionArn');
      expect(outputs.LambdaExecutionRoleArn.Export.Name['Fn::Sub']).toContain('LambdaExecutionRoleArn');
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
      expect(s3Policy.Resource).toEqual({ 'Fn::Sub': 'arn:aws:s3:::${S3BucketName}/*' });
      expect(s3Policy.Action).toEqual(['s3:GetObject', 's3:GetObjectVersion']);

      // Check CloudWatch permissions are specific to the log group
      const cloudWatchPolicy = policies[1];
      expect(cloudWatchPolicy.Resource).toEqual({ 'Fn::Sub': 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:${CloudWatchLogGroupName}:*' });
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
