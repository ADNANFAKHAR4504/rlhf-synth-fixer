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

  describe('Environment Suffix Tests', () => {
    test('should use props environmentSuffix when provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack1', { environmentSuffix: 'test' });
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'MyApp-Metadata-test'
      });
    });

    test('should use context environmentSuffix when props not provided', () => {
      const testApp = new cdk.App();
      testApp.node.setContext('environmentSuffix', 'staging');
      const testStack = new TapStack(testApp, 'TestStack2');
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'MyApp-Metadata-staging'
      });
    });

    test('should use default dev when neither props nor context provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack3');
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'MyApp-Metadata-dev'
      });
    });
  });

  describe('Infrastructure Unit Tests', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create Lambda function with correct runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.11',
        Handler: 'index.lambda_handler',
        Timeout: 30,
        MemorySize: 256,
      });
    });

    test('should create API Gateway REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `MyApp-API-${environmentSuffix}`,
        Description: 'API for MyApp data processing',
      });
    });

    test('should create S3 bucket with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            },
          ],
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should create DynamoDB table with on-demand billing', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S',
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'S',
          },
        ],
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
      });
    });

    test('should create KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for MyApp encryption',
        EnableKeyRotation: true,
      });
    });

    test('should create SQS dead letter queue', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `MyApp-DLQ-${environmentSuffix}`,
        MessageRetentionPeriod: 1209600,
      });
    });

    test('should create CloudFront distribution', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          Comment: `MyApp CloudFront Distribution - ${environmentSuffix}`,
          Enabled: true,
          DefaultCacheBehavior: {
            ViewerProtocolPolicy: 'redirect-to-https',
          },
        },
      });
    });

    test('should have proper resource count', () => {
      template.resourceCountIs('AWS::Lambda::Function', 1); // Main function only
      template.resourceCountIs('AWS::S3::Bucket', 2); // Data bucket + CloudFront logs bucket
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
      template.resourceCountIs('AWS::KMS::Key', 1);
      template.resourceCountIs('AWS::SQS::Queue', 1);
      template.resourceCountIs('AWS::CloudFront::Distribution', 1);
    });

    test('should create stack outputs', () => {
      template.hasOutput('ApiGatewayUrl', {});
      template.hasOutput('CloudFrontUrl', {});
      template.hasOutput('S3BucketName', {});
      template.hasOutput('DynamoDBTableName', {});
      template.hasOutput('LambdaFunctionName', {});
    });
  });
});
