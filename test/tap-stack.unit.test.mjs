import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app;
  let stack;
  let template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('ECR Repository', () => {
    test('creates ECR repository for fraud detection model', () => {
      template.resourceCountIs('AWS::ECR::Repository', 1);
    });

    test('ECR repository has image scan on push enabled', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        ImageScanningConfiguration: {
          ScanOnPush: true,
        },
      });
    });
  });

  describe('S3 Bucket', () => {
    test('creates S3 bucket for model artifacts', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      expect(Object.keys(buckets).length).toBeGreaterThan(0);
    });

    test('S3 bucket has versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('S3 bucket blocks public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('creates DynamoDB table for prediction records', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });

    test('DynamoDB table has point-in-time recovery enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('DynamoDB table has stream enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
      });
    });
  });

  describe('SageMaker Resources', () => {
    test('creates SageMaker model', () => {
      template.resourceCountIs('AWS::SageMaker::Model', 1);
    });

    test('creates SageMaker endpoint config', () => {
      template.resourceCountIs('AWS::SageMaker::EndpointConfig', 1);
    });

    test('creates SageMaker endpoint', () => {
      template.resourceCountIs('AWS::SageMaker::Endpoint', 1);
    });

    test('SageMaker endpoint config has data capture enabled', () => {
      template.hasResourceProperties('AWS::SageMaker::EndpointConfig', {
        DataCaptureConfig: {
          EnableCapture: true,
          InitialSamplingPercentage: 20,
        },
      });
    });
  });

  describe('Lambda Functions', () => {
    test('creates Lambda functions', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(functions).length).toBeGreaterThanOrEqual(2);
    });

    test('Lambda functions have proper timeout', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Timeout: 30,
      });
    });
  });

  describe('API Gateway', () => {
    test('creates REST API', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    });

    test('API Gateway has logging enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: [
          {
            DataTraceEnabled: true,
            LoggingLevel: 'INFO',
          },
        ],
      });
    });

    test('creates API key', () => {
      template.resourceCountIs('AWS::ApiGateway::ApiKey', 1);
    });

    test('creates usage plan', () => {
      template.resourceCountIs('AWS::ApiGateway::UsagePlan', 1);
    });
  });

  describe('SNS Topic', () => {
    test('creates SNS topic for alerts', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });
  });

  describe('CloudWatch Resources', () => {
    test('creates CloudWatch dashboard', () => {
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });

    test('creates CloudWatch alarms', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      expect(Object.keys(alarms).length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('EventBridge Rules', () => {
    test('creates EventBridge rule for drift detection', () => {
      template.resourceCountIs('AWS::Events::Rule', 1);
    });
  });

  describe('IAM Roles', () => {
    test('creates SageMaker execution role', () => {
      const roles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(roles).length).toBeGreaterThanOrEqual(2);
    });

    test('roles have correct assume role policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'sagemaker.amazonaws.com',
              },
            },
          ],
        },
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports API endpoint', () => {
      template.hasOutput('ApiEndpoint', {});
    });

    test('exports SageMaker endpoint name', () => {
      template.hasOutput('SageMakerEndpoint', {});
    });

    test('exports model bucket name', () => {
      template.hasOutput('ModelBucketName', {});
    });

    test('exports prediction table name', () => {
      template.hasOutput('PredictionTableName', {});
    });

    test('exports API key ID', () => {
      template.hasOutput('ApiKeyId', {});
    });

    test('exports ECR repository URI', () => {
      template.hasOutput('ModelRepositoryUri', {});
    });
  });

  describe('TapStack Specific Tests', () => {
    test('creates stack with environment suffix from props', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {
        environmentSuffix: 'prod',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });

      expect(testStack).toBeDefined();
      const testTemplate = Template.fromStack(testStack);
      expect(testTemplate).toBeDefined();
    });

    test('creates stack with environment suffix from context', () => {
      const testApp = new cdk.App({
        context: {
          environmentSuffix: 'staging',
        },
      });
      const testStack = new TapStack(testApp, 'TestStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });

      expect(testStack).toBeDefined();
    });

    test('creates stack with default environment suffix', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });

      expect(testStack).toBeDefined();
    });
  });

  describe('Tags', () => {
    test('resources have Owner tag', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Owner',
            Value: 'FinTechMLOps',
          }),
        ]),
      });
    });

    test('resources have CostCenter tag', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'CostCenter',
            Value: 'ML-Infrastructure',
          }),
        ]),
      });
    });

    test('resources have Application tag', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Application',
            Value: 'FraudPrediction',
          }),
        ]),
      });
    });
  });
});

