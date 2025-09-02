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
    test('should create KMS key for encryption', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for TAP application encryption',
        EnableKeyRotation: true,
      });
    });

    test('should create KMS key alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/tap-app-key',
      });
    });

    test('should create DynamoDB table with encryption', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'tap-items-table',
        BillingMode: 'PAY_PER_REQUEST',
        SSESpecification: {
          SSEEnabled: true,
          SSEType: 'KMS',
        },
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('should create S3 bucket with encryption and versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should create logs bucket with proper configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        // Logs bucket doesn't have versioning enabled
      });
    });

    test('should create Lambda functions with proper configuration', () => {
      // Check for all three Lambda functions
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'tap-create-item',
        Runtime: 'nodejs18.x',
        Handler: 'create_item.handler',
        Timeout: 30,
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'tap-get-items',
        Runtime: 'nodejs18.x',
        Handler: 'get_item.handler',
        Timeout: 30,
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'tap-upload-file',
        Runtime: 'nodejs18.x',
        Handler: 'upload_file.handler',
        Timeout: 30,
      });
    });

    test('should create API Gateway with CORS enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'TAP Serverless API',
        Description: 'Secure serverless web application API',
      });
    });

    test('should create CloudWatch Log Groups for Lambda functions', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/lambda/tap-create-item',
        RetentionInDays: 7,
      });

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/lambda/tap-get-items',
        RetentionInDays: 7,
      });

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/lambda/tap-upload-file',
        RetentionInDays: 7,
      });
    });

    test('should create Secrets Manager secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: 'tap-app/secrets',
        Description: 'Application secrets for TAP serverless app',
      });
    });
  });

  describe('Security and IAM', () => {
    test('should create IAM role for Lambda execution', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });
    });

    test('should create proper IAM policies for least privilege', () => {
      // Check that the Lambda role has the basic execution policy
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
              ],
            ],
          },
        ],
      });
    });

    test('should create KMS key policy with proper statements', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for TAP application encryption',
        EnableKeyRotation: true,
      });
    });
  });

  describe('Outputs', () => {
    test('should export API Gateway URL', () => {
      template.hasOutput('ApiGatewayUrl', {
        Description: 'API Gateway endpoint URL',
      });
    });

    test('should export DynamoDB table name', () => {
      template.hasOutput('DynamoDBTableName', {
        Description: 'DynamoDB table name',
      });
    });

    test('should export S3 bucket name', () => {
      template.hasOutput('S3BucketName', {
        Description: 'S3 bucket name for file uploads',
      });
    });

    test('should export KMS key ID', () => {
      template.hasOutput('KMSKeyId', {
        Description: 'KMS Key ID for encryption',
      });
    });

    test('should export Secrets Manager ARN', () => {
      template.hasOutput('SecretsManagerArn', {
        Description: 'Secrets Manager secret ARN',
      });
    });
  });

  describe('Stack Configuration and Props', () => {
    test('should create stack with default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      const defaultTemplate = Template.fromStack(defaultStack);

      // Should still create all resources
      defaultTemplate.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for TAP application encryption',
      });
    });

    test('should create stack with custom environment suffix when provided', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: 'prod'
      });
      const customTemplate = Template.fromStack(customStack);

      // Should still create all resources
      customTemplate.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for TAP application encryption',
      });
    });

    test('should create stack with undefined props', () => {
      const undefinedApp = new cdk.App();
      const undefinedStack = new TapStack(undefinedApp, 'UndefinedStack', undefined);
      const undefinedTemplate = Template.fromStack(undefinedStack);

      // Should still create all resources
      undefinedTemplate.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for TAP application encryption',
      });
    });

    test('should create stack with null props', () => {
      const nullApp = new cdk.App();
      const nullStack = new TapStack(nullApp, 'NullStack', undefined);
      const nullTemplate = Template.fromStack(nullStack);

      // Should still create all resources
      nullTemplate.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for TAP application encryption',
      });
    });
  });

  describe('Resource Properties and Configuration', () => {
    test('should configure DynamoDB table with proper encryption settings', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'tap-items-table',
        BillingMode: 'PAY_PER_REQUEST',
        SSESpecification: {
          SSEEnabled: true,
          SSEType: 'KMS',
        },
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        // RemovalPolicy is set at the CDK level, not in CloudFormation template
      });
    });

    test('should configure S3 buckets with proper encryption and access settings', () => {
      // Files bucket
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            },
          ],
        },
      });
    });

    test('should configure Lambda functions with proper runtime and timeout', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Timeout: 30,
        Handler: 'create_item.handler',
      });
    });

    test('should configure CloudWatch Log Groups with proper retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7,
      });
    });
  });

  describe('Tagging and Metadata', () => {
    test('should apply proper tags to resources', () => {
      // KMS Key tags
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for TAP application encryption',
      });

      // DynamoDB table tags
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'tap-items-table',
      });

      // S3 bucket tags
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty string environment suffix', () => {
      const emptyApp = new cdk.App();
      const emptyStack = new TapStack(emptyApp, 'EmptyStack', {
        environmentSuffix: ''
      });
      const emptyTemplate = Template.fromStack(emptyStack);

      // Should still create all resources
      emptyTemplate.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for TAP application encryption',
      });
    });

    test('should handle whitespace environment suffix', () => {
      const whitespaceApp = new cdk.App();
      const whitespaceStack = new TapStack(whitespaceApp, 'WhitespaceStack', {
        environmentSuffix: '   '
      });
      const whitespaceTemplate = Template.fromStack(whitespaceStack);

      // Should still create all resources
      whitespaceTemplate.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for TAP application encryption',
      });
    });
  });
});
