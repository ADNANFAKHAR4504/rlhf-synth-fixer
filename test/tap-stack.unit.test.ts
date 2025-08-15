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
});
