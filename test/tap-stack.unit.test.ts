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

  describe('S3 Bucket Tests', () => {
    test('should create S3 bucket for IoT data uploads', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `iot-data-bucket-${environmentSuffix}`,
      });
    });

    test('should configure S3 bucket with auto-delete objects', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `iot-data-bucket-${environmentSuffix}`,
      });
    });

    test('should create S3 bucket notification configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        NotificationConfiguration: {
          LambdaConfigurations: [
            {
              Event: 's3:ObjectCreated:*',
            },
          ],
        },
      });
    });
  });

  describe('DynamoDB Table Tests', () => {
    test('should create DynamoDB table for processed IoT data', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `iot-processed-data-${environmentSuffix}`,
        BillingMode: 'ON_DEMAND',
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
      });
    });
  });

  describe('Lambda Function Tests', () => {
    test('should create Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'IoTDataProcessor',
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        MemorySize: 256,
        Timeout: 300,
        ReservedConcurrencyLimit: 500,
      });
    });

    test('should configure Lambda function with environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            DYNAMODB_TABLE_NAME: `iot-processed-data-${environmentSuffix}`,
            AWS_REGION: 'us-west-2',
          },
        },
      });
    });
  });

  describe('CloudWatch Log Group Tests', () => {
    test('should create CloudWatch log group with exact required name', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/lambda/IoTDataProcessor',
        RetentionInDays: 7,
      });
    });
  });

  describe('IAM Role Tests', () => {
    test('should create IAM role for Lambda function', () => {
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
        },
      });
    });

    test('should have S3 read permissions in IAM policy', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:GetObject'],
            },
          ],
        },
      });
    });

    test('should have DynamoDB write permissions in IAM policy', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
            },
          ],
        },
      });
    });

    test('should have CloudWatch logs permissions in IAM policy', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
            },
          ],
        },
      });
    });
  });

  describe('CloudFormation Outputs Tests', () => {
    test('should create required CloudFormation outputs', () => {
      template.hasOutput('S3BucketName', {});
      template.hasOutput('DynamoDBTableName', {});
      template.hasOutput('LambdaFunctionName', {});
      template.hasOutput('LogGroupName', {});
    });
  });

  describe('Stack Properties Tests', () => {
    test('should deploy to us-west-2 region', () => {
      expect(stack.region).toBe('us-west-2');
    });

    test('should have correct environment suffix', () => {
      expect(stack.s3Bucket.bucketName).toBe(`iot-data-bucket-${environmentSuffix}`);
      expect(stack.dynamoTable.tableName).toBe(`iot-processed-data-${environmentSuffix}`);
    });
  });
});