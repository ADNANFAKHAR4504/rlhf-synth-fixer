import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('S3 Buckets', () => {
    test('should create data bucket with correct configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `prod-data-bucket-${environmentSuffix}`,
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
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

    test('should create log bucket with correct configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.anyValue(),
        }),
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should have lifecycle rules on data bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `prod-data-bucket-${environmentSuffix}`,
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'delete-old-versions',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30,
              },
              Status: 'Enabled',
            }),
          ]),
        },
      });
    });

    test('should enforce SSL on data bucket', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 's3:*',
              Effect: 'Deny',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }),
          ]),
        },
      });
    });

    test('data bucket should have server access logging enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `prod-data-bucket-${environmentSuffix}`,
        LoggingConfiguration: Match.objectLike({
          LogFilePrefix: 'access-logs/',
        }),
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create S3 read-only role with correct name', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `prod-data-bucket-readonly-role-${environmentSuffix}`,
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

    test('S3 read-only role should have least privilege permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['s3:GetObject*', 's3:GetBucket*', 's3:List*']),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should create Lambda service role', () => {
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
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp('AWSLambdaBasicExecutionRole'),
              ]),
            ]),
          }),
        ]),
      });
    });
  });

  describe('CloudWatch Log Group', () => {
    test('should create log group with correct name', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/prod-object-logger-${environmentSuffix}`,
        RetentionInDays: 90,
      });
    });

    test('log group should have retention policy', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 90,
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with correct name', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `prod-object-logger-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        MemorySize: 256,
      });
    });

    test('Lambda should have correct environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            NODE_ENV: 'production',
            LOG_LEVEL: 'INFO',
            BUCKET_NAME: Match.objectLike({
              Ref: Match.anyValue(),
            }),
          },
        },
      });
    });

    test('Lambda should have retry configuration', () => {
      template.hasResourceProperties('AWS::Lambda::EventInvokeConfig', {
        MaximumRetryAttempts: 2,
      });
    });

    test('Lambda should have read access to S3 bucket', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['s3:GetObject*', 's3:GetBucket*', 's3:List*']),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('Lambda should be triggered by S3 events', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 's3.amazonaws.com',
      });
    });
  });

  describe('S3 Event Notifications', () => {
    test('should configure S3 bucket notifications for Lambda', () => {
      template.hasResourceProperties('Custom::S3BucketNotifications', {
        NotificationConfiguration: {
          LambdaFunctionConfigurations: [
            {
              Events: ['s3:ObjectCreated:*'],
              LambdaFunctionArn: Match.objectLike({
                'Fn::GetAtt': Match.arrayWith([Match.stringLikeRegexp('.*')]),
              }),
            },
          ],
        },
      });
    });
  });

  describe('Resource Tagging', () => {
    test('all S3 buckets should have Production environment tag', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'Production',
          },
        ]),
      });
    });

    test('all S3 buckets should have iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          {
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          },
        ]),
      });
    });

    test('IAM roles should have Production environment tag', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'Production',
          },
        ]),
      });
    });

    test('IAM roles should have iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Tags: Match.arrayWith([
          {
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          },
        ]),
      });
    });

    test('Lambda function should have Production environment tag', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'Production',
          },
        ]),
      });
    });

    test('Lambda function should have iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Tags: Match.arrayWith([
          {
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          },
        ]),
      });
    });

    test('Log group should have Production environment tag', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'Production',
          },
        ]),
      });
    });

    test('Log group should have iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        Tags: Match.arrayWith([
          {
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          },
        ]),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should export bucket name', () => {
      template.hasOutput('BucketName', {
        Description: 'Name of the production data bucket',
      });
    });

    test('should export bucket ARN', () => {
      template.hasOutput('BucketArn', {
        Description: 'ARN of the production data bucket',
      });
    });

    test('should export read-only role ARN', () => {
      template.hasOutput('ReadOnlyRoleArn', {
        Description: 'ARN of the S3 read-only role',
      });
    });

    test('should export Lambda function ARN', () => {
      template.hasOutput('LambdaFunctionArn', {
        Description: 'ARN of the object logger Lambda function',
      });
    });

    test('should export log group name', () => {
      template.hasOutput('LogGroupName', {
        Description: 'CloudWatch Log Group for Lambda function',
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should have no public S3 buckets', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        });
      });
    });

    test('all S3 buckets should have encryption enabled', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(
          bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration
        ).toBeDefined();
      });
    });

    test('data bucket should have versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `prod-data-bucket-${environmentSuffix}`,
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });
  });

  describe('Resource Count', () => {
    test('should create expected number of S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 2);
    });

    test('should create expected number of IAM roles', () => {
      template.resourceCountIs('AWS::IAM::Role', 3);
    });

    test('should create expected number of Lambda functions', () => {
      template.resourceCountIs('AWS::Lambda::Function', 2);
    });

    test('should create expected number of log groups', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 1);
    });
  });

  describe('Environment Suffix Integration', () => {
    test('should use environment suffix in resource names', () => {
      const customEnv = 'test123';
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomEnvStack', {
        environmentSuffix: customEnv,
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `prod-data-bucket-${customEnv}`,
      });

      customTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `prod-object-logger-${customEnv}`,
      });

      customTemplate.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `prod-data-bucket-readonly-role-${customEnv}`,
      });
    });

    test('should default to dev when no environment suffix provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack', {});
      const defaultTemplate = Template.fromStack(defaultStack);

      defaultTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'prod-data-bucket-dev',
      });

      defaultTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'prod-object-logger-dev',
      });

      defaultTemplate.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'prod-data-bucket-readonly-role-dev',
      });
    });

    test('should use context value when props not provided', () => {
      const contextApp = new cdk.App({
        context: { environmentSuffix: 'staging' },
      });
      const contextStack = new TapStack(contextApp, 'ContextStack', {});
      const contextTemplate = Template.fromStack(contextStack);

      contextTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'prod-data-bucket-staging',
      });
    });
  });
});
