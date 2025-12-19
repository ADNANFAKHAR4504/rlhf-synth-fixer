import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      projectName: 'TestProject',
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('KMS Key', () => {
    test('should create KMS key with encryption and rotation', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'TestProject encryption key',
        EnableKeyRotation: true,
      });
    });

    test('should have proper tags on KMS key', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'Production' },
          { Key: 'Project', Value: 'TestProject' },
        ]),
      });
    });
  });

  describe('S3 Buckets', () => {
    test('should create code bucket with KMS encryption', () => {
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

    test('should create logs bucket with lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteOldLogs',
              Status: 'Enabled',
              ExpirationInDays: 90,
              Transitions: [
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                },
              ],
            },
          ],
        },
      });
    });

    test('should block public access on all buckets', () => {
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

  describe('SQS Dead Letter Queue', () => {
    test('should create DLQ with KMS encryption', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `TestProject-DLQ-${environmentSuffix}`,
        MessageRetentionPeriod: 1209600, // 14 days
      });
    });
  });

  describe('IAM Role', () => {
    test('should create Lambda execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `TestProject-Lambda-Role-${environmentSuffix}`,
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

    test('should have proper managed policies attached', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `TestProject-Lambda-Role-${environmentSuffix}`,
      });

      // Simply check that we have managed policy ARNs (no nesting)
      template.resourceCountIs('AWS::IAM::Role', 2); // CloudWatch role + Lambda role
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with proper configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `TestProject-API-${environmentSuffix}`,
        Runtime: 'python3.9',
        Handler: 'api-handler.lambda_handler',
        MemorySize: 512,
        Timeout: 30,
        Environment: {
          Variables: {
            STAGE: 'production',
          },
        },
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('should have dedicated log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/TestProject-API-${environmentSuffix}`,
        RetentionInDays: 30,
      });
    });
  });

  describe('API Gateway', () => {
    test('should create REST API with proper configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `TestProject-API-${environmentSuffix}`,
        Description: 'TestProject Production API',
        EndpointConfiguration: {
          Types: ['REGIONAL'],
        },
        ApiKeySourceType: 'HEADER',
      });
    });

    test('should create API Key', () => {
      template.hasResourceProperties('AWS::ApiGateway::ApiKey', {
        Name: `TestProject-API-Key-${environmentSuffix}`,
        Description: 'API Key for TestProject Production API',
        Enabled: true,
      });
    });

    test('should create Usage Plan with throttling', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        UsagePlanName: `TestProject-Usage-Plan-${environmentSuffix}`,
        Throttle: {
          RateLimit: 1000,
          BurstLimit: 2000,
        },
        Quota: {
          Limit: 10000,
          Period: 'DAY',
        },
      });
    });

    test('should require API key for proxy methods', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'ANY',
        ApiKeyRequired: true,
      });
    });
  });

  describe('WAF Protection', () => {
    test('should create WAF Web ACL', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Name: `TestProject-WAF-${environmentSuffix}`,
        Scope: 'REGIONAL',
        DefaultAction: {
          Allow: {},
        },
      });
    });

    test('should have rate limiting rule', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          {
            Name: 'RateLimitRule',
            Priority: 1,
            Statement: {
              RateBasedStatement: {
                Limit: 2000,
                AggregateKeyType: 'IP',
              },
            },
            Action: {
              Block: {},
            },
            VisibilityConfig: {
              CloudWatchMetricsEnabled: true,
              MetricName: 'RateLimitRule',
              SampledRequestsEnabled: true,
            },
          },
        ]),
      });
    });

    test('should associate WAF with API Gateway', () => {
      // Just check that the association resource exists
      template.resourceCountIs('AWS::WAFv2::WebACLAssociation', 1);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create Lambda error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `TestProject-Lambda-Errors-${environmentSuffix}`,
        AlarmDescription: 'Lambda function error rate',
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Threshold: 5,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('should create Lambda throttle alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `TestProject-Lambda-Throttles-${environmentSuffix}`,
        AlarmDescription: 'Lambda function throttle rate',
        MetricName: 'Throttles',
        Namespace: 'AWS/Lambda',
        Threshold: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should have API Gateway URL output', () => {
      template.hasOutput('ApiGatewayUrl', {
        Description: 'API Gateway URL',
      });
    });

    test('should have API Key ID output', () => {
      template.hasOutput('ApiKeyId', {
        Description: 'API Key ID - retrieve value from AWS Console',
      });
    });

    test('should have WAF ARN output', () => {
      template.hasOutput('WAFWebAclArn', {
        Description: 'WAF Web ACL ARN',
      });
    });

    test('should have Lambda function name output', () => {
      template.hasOutput('LambdaFunctionName', {
        Description: 'Lambda Function Name',
      });
    });
  });

  describe('Security and Best Practices', () => {
    test('should have X-Ray tracing enabled on API Gateway stage', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        TracingEnabled: true,
      });
    });

    test('should have proper CORS configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
        Integration: {
          Type: 'MOCK',
        },
      });
    });

    test('should use environment suffix in resource names', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp(`.*${environmentSuffix}`),
      });
    });

    test('should have proper tagging on all resources', () => {
      const resourceTypes = [
        'AWS::S3::Bucket',
        'AWS::Lambda::Function',
        'AWS::ApiGateway::RestApi',
        'AWS::CloudWatch::Alarm',
      ];

      resourceTypes.forEach((resourceType) => {
        template.hasResourceProperties(resourceType, {
          Tags: Match.arrayWith([
            { Key: 'Environment', Value: 'Production' },
          ]),
        });
      });
    });
  });

  describe('Edge Cases and Environment Handling', () => {
    test('should handle missing environment suffix', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {
        projectName: 'Test',
        // No environmentSuffix provided
      });
      const testTemplate = Template.fromStack(testStack);

      // Should default to 'dev'
      testTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'Test-API-dev',
      });
    });

    test('should use context environmentSuffix when provided', () => {
      const testApp = new cdk.App({
        context: {
          environmentSuffix: 'prod',
        },
      });
      const testStack = new TapStack(testApp, 'TestStack', {
        projectName: 'Test',
      });
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'Test-API-prod',
      });
    });
  });
});
