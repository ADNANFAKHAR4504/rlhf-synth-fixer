import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('S3 Bucket Configuration', () => {
    test('creates S3 bucket with proper security configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        // Fix: Use Match.anyValue() for BucketName since it's a CloudFormation function
        BucketName: Match.anyValue(),
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }
          ]
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        },
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('has lifecycle rules configured', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteOldVersions',
              Status: 'Enabled',
              // Fix: Use correct property name from actual CloudFormation
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30
              },
              AbortIncompleteMultipartUpload: {
                DaysAfterInitiation: 7
              }
            }
          ]
        }
      });
    });
  });

  describe('SQS Dead Letter Queue', () => {
    test('creates DLQ with proper configuration', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `ecommerce-dlq-${environmentSuffix}`,
        MessageRetentionPeriod: 1209600, // 14 days in seconds
        KmsMasterKeyId: 'alias/aws/sqs'
      });
    });
  });

  describe('Lambda Functions', () => {
    test('creates product Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `ecommerce-product-handler-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        MemorySize: 256,
        TracingConfig: {
          Mode: 'Active'
        }
      });
    });

    test('creates order Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `ecommerce-order-handler-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        MemorySize: 256,
        TracingConfig: {
          Mode: 'Active'
        }
      });
    });

    test('creates auth Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `ecommerce-auth-handler-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 15,
        MemorySize: 128,
        TracingConfig: {
          Mode: 'Active'
        }
      });
    });

    test('Lambda functions have environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            BUCKET_NAME: Match.anyValue(),
            DLQ_URL: Match.anyValue(),
            NODE_ENV: environmentSuffix
          }
        }
      });
    });
  });

  describe('IAM Roles', () => {
    test('creates product Lambda role with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        // Fix: Use correct property name
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com'
              }
            }
          ]
        },
        Description: 'IAM role for product management Lambda functions'
      });
    });

    test('creates order Lambda role with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        // Fix: Use correct property name
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com'
              }
            }
          ]
        },
        Description: 'IAM role for order management Lambda functions'
      });
    });
  });

  describe('API Gateway', () => {
    test('creates REST API with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `ecommerce-api-${environmentSuffix}`,
        Description: 'E-Commerce Platform API Gateway',
        EndpointConfiguration: {
          Types: ['REGIONAL']
        }
      });
    });

    test('creates API deployment with correct stage configuration', () => {
      // Fix: Check for AWS::ApiGateway::Stage instead of Deployment for StageName
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod'
      });

      // Also verify the deployment exists (without StageName)
      template.hasResourceProperties('AWS::ApiGateway::Deployment', {
        RestApiId: Match.anyValue(),
        Description: 'E-Commerce Platform API Gateway'
      });
    });

    test('creates usage plan for throttling', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        UsagePlanName: `ecommerce-usage-plan-${environmentSuffix}`,
        Description: 'Usage plan for E-Commerce API with throttling',
        Throttle: {
          RateLimit: 100,
          BurstLimit: 200
        },
        Quota: {
          Limit: 10000,
          Period: 'DAY'
        }
      });
    });

    test('creates API key', () => {
      template.hasResourceProperties('AWS::ApiGateway::ApiKey', {
        Name: `ecommerce-api-key-${environmentSuffix}`,
        Description: 'API Key for E-Commerce platform'
      });
    });
  });

  describe('CloudWatch Resources', () => {
    test('creates log groups for Lambda functions', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/ecommerce-product-handler-${environmentSuffix}`,
        RetentionInDays: 30
      });

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/ecommerce-order-handler-${environmentSuffix}`,
        RetentionInDays: 30
      });

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/ecommerce-auth-handler-${environmentSuffix}`,
        RetentionInDays: 30
      });
    });

    test('creates CloudWatch alarms', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `ecommerce-product-lambda-errors-${environmentSuffix}`,
        AlarmDescription: 'Alarm for product Lambda function errors',
        Threshold: 5,
        EvaluationPeriods: 2
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `ecommerce-order-lambda-errors-${environmentSuffix}`,
        AlarmDescription: 'Alarm for order Lambda function errors',
        Threshold: 5,
        EvaluationPeriods: 2
      });
    });
  });

  describe('Resource Tagging', () => {
    test('applies common tags to resources', () => {
      const stackResources = template.findResources('AWS::Lambda::Function');
      Object.values(stackResources).forEach(resource => {
        expect(resource.Properties?.Tags).toBeDefined();
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('creates all required outputs', () => {
      template.hasOutput('ApiGatewayUrl', {
        Description: 'API Gateway URL',
        Export: {
          Name: 'ECommerceApiUrl'
        }
      });

      template.hasOutput('ApiKeyId', {
        Description: 'API Key ID for authentication',
        Export: {
          Name: 'ECommerceApiKeyId'
        }
      });

      template.hasOutput('S3BucketName', {
        Description: 'S3 Bucket for artifacts',
        Export: {
          Name: 'ECommerceS3Bucket'
        }
      });

      template.hasOutput('DeadLetterQueueUrl', {
        Description: 'Dead Letter Queue URL',
        Export: {
          Name: 'ECommerceDLQUrl'
        }
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('has expected number of Lambda functions', () => {
      template.resourceCountIs('AWS::Lambda::Function', 3);
    });

    test('has expected number of IAM roles', () => {
      template.resourceCountIs('AWS::IAM::Role', 3); // 2 custom + 1 API Gateway CloudWatch role
    });

    test('has expected number of CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 5);
    });

    test('has expected number of log groups', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 3);
    });
  });

  describe('Environment Suffix Handling', () => {
    test('handles missing environment suffix gracefully', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackNoSuffix');
      const testTemplate = Template.fromStack(testStack);

      // Should default to 'dev' when no suffix provided
      testTemplate.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: 'ecommerce-dlq-dev'
      });
    });

    test('uses provided environment suffix consistently', () => {
      const customSuffix = 'custom-env';
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackCustomSuffix', {
        environmentSuffix: customSuffix
      });
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `ecommerce-dlq-${customSuffix}`
      });
    });
  });

});