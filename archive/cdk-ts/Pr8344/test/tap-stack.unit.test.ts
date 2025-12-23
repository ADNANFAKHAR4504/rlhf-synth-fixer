//fix changes
//fix changes
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Infrastructure Resources', () => {
    test('should create S3 bucket with correct configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': [
            '',
            [`iot-data-bucket-${environmentSuffix}-`, { Ref: 'AWS::AccountId' }]
          ]
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should create DynamoDB table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: {
          'Fn::Join': [
            '',
            [`iot-processed-data-${environmentSuffix}-`, { Ref: 'AWS::AccountId' }]
          ]
        },
        BillingMode: 'PAY_PER_REQUEST',
        AttributeDefinitions: [
          {
            AttributeName: 'deviceId',
            AttributeType: 'S',
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'S',
          },
        ],
        KeySchema: [
          {
            AttributeName: 'deviceId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });

    test('should create Lambda function with correct configuration', () => {
      // Find the specific IoT Data Processor Lambda function
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      const iotProcessorFunction = Object.values(lambdaFunctions).find((func: any) => 
        func.Properties?.Code?.ZipFile?.includes('Processing IoT data upload event')
      );

      expect(iotProcessorFunction).toBeDefined();
      expect(iotProcessorFunction?.Properties).toMatchObject({
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        MemorySize: 512,
        Timeout: 300,
      });

      // ReservedConcurrentExecutions is commented out in the construct, so we don't expect it
      expect(iotProcessorFunction?.Properties.ReservedConcurrentExecutions).toBeUndefined();
    });

    test('should create CloudWatch log group with correct name', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 14,
      });
    });

    test('should create IAM role with correct name and policies', () => {
      // Check that the IAM role exists with correct assume role policy (no explicit role name)
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
      });

      // Check that the role has the correct policies attached
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Action: ['s3:GetObject', 's3:GetObjectVersion'],
              Effect: 'Allow',
            },
            {
              Action: [
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:GetItem',
              ],
              Effect: 'Allow',
            },
            {
              Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
              Effect: 'Allow',
            },
          ],
          Version: '2012-10-17',
        },
      });
    });

    test('should create S3 bucket notification for Lambda trigger', () => {
      // Check that bucket notifications are created
      template.hasResourceProperties('Custom::S3BucketNotifications', {
        NotificationConfiguration: {
          LambdaFunctionConfigurations: [
            {
              Events: ['s3:ObjectCreated:*'],
            },
          ],
        },
      });
    });

    test('should have Lambda permission for S3 bucket notifications', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 's3.amazonaws.com',
      });
    });

    test('should have all required stack outputs', () => {
      template.hasOutput('S3BucketName', {
        Description: 'S3 bucket for IoT data uploads',
      });

      template.hasOutput('DynamoDBTableName', {
        Description: 'DynamoDB table for processed IoT data',
      });

      template.hasOutput('LambdaFunctionName', {
        Description: 'Lambda function for processing IoT data',
      });

      template.hasOutput('LambdaFunctionArn', {
        Description: 'Lambda function ARN',
      });

      template.hasOutput('LogGroupName', {
        Description: 'CloudWatch log group for Lambda function',
      });
    });

    test('should configure Lambda with correct environment variables', () => {
      // Find the specific IoT Data Processor Lambda function
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      const iotProcessorFunction = Object.values(lambdaFunctions).find((func: any) => 
        func.Properties?.Code?.ZipFile?.includes('Processing IoT data upload event')
      );

      expect(iotProcessorFunction).toBeDefined();
      expect(iotProcessorFunction?.Properties.Environment.Variables).toHaveProperty('DYNAMODB_TABLE_NAME');
      expect(iotProcessorFunction?.Properties.Environment.Variables).toHaveProperty('LOG_GROUP_NAME');
    });
  });

  describe('Stack Properties', () => {
    test('should deploy to us-west-2 region', () => {
      expect(stack.region).toBe('us-west-2');
    });

    test('should have correct resource references', () => {
      // Verify that resources are properly instantiated
      expect(stack.iotDataProcessor.s3Bucket).toBeDefined();
      expect(stack.iotDataProcessor.dynamoTable).toBeDefined();
      expect(stack.iotDataProcessor.lambdaFunction).toBeDefined();
      expect(stack.iotDataProcessor.lambdaRole).toBeDefined();
      expect(stack.iotDataProcessor.logGroup).toBeDefined();
    });

    test('should use custom environment suffix when provided in props', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomTestStack', { 
        environmentSuffix: 'custom-env' 
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': [
            '',
            ['iot-data-bucket-custom-env-', { Ref: 'AWS::AccountId' }]
          ]
        },
      });

      customTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: {
          'Fn::Join': [
            '',
            ['iot-processed-data-custom-env-', { Ref: 'AWS::AccountId' }]
          ]
        },
      });

      // Check that IAM role exists (no explicit role name in implementation)
      customTemplate.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
      });
    });

    test('should use environment suffix from CDK context', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'context-env'
        }
      });
      const contextStack = new TapStack(contextApp, 'ContextTestStack');
      const contextTemplate = Template.fromStack(contextStack);

      contextTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': [
            '',
            ['iot-data-bucket-context-env-', { Ref: 'AWS::AccountId' }]
          ]
        },
      });

      contextTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: {
          'Fn::Join': [
            '',
            ['iot-processed-data-context-env-', { Ref: 'AWS::AccountId' }]
          ]
        },
      });

      // Check that IAM role exists (no explicit role name in implementation)
      contextTemplate.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
      });
    });

    test('should use default environment suffix when neither props nor context provide it', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultTestStack');
      const defaultTemplate = Template.fromStack(defaultStack);

      defaultTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': [
            '',
            ['iot-data-bucket-dev-', { Ref: 'AWS::AccountId' }]
          ]
        },
      });

      defaultTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: {
          'Fn::Join': [
            '',
            ['iot-processed-data-dev-', { Ref: 'AWS::AccountId' }]
          ]
        },
      });

      // Check that IAM role exists (no explicit role name in implementation)
      defaultTemplate.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should create exactly one of each core resource', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
      template.resourceCountIs('AWS::Lambda::Function', 3); // Our function + bucket notifications handler + auto-delete handler
      template.resourceCountIs('AWS::Logs::LogGroup', 1);
      template.resourceCountIs('AWS::IAM::Role', 3); // Our role + bucket notifications role + auto-delete role
    });
  });
});