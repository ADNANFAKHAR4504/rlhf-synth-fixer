import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { ServerlessAppStack } from '../lib/serverless-app-stack.mjs';

describe('ServerlessAppStack', () => {
  let app;
  let parentStack;
  let nestedStack;
  let template;

  beforeEach(() => {
    app = new cdk.App();
    parentStack = new cdk.Stack(app, 'ParentStack', {
      env: {
        account: '123456789012',
        region: 'us-west-2'
      }
    });
    
    const environmentSuffix = 'test';
    nestedStack = new ServerlessAppStack(parentStack, 'ServerlessAppStack', {
      environmentSuffix
    });
    
    template = Template.fromStack(nestedStack);
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket with proper configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }
          ]
        },
        VersioningConfiguration: {
          Status: 'Enabled'
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('should have lifecycle rules configured', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'DeleteOldVersions',
              Status: 'Enabled'
            })
          ])
        }
      });
    });

    test('should have bucket notification configuration', () => {
      template.hasResource('Custom::S3BucketNotifications', {});
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with proper configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        MemorySize: 256,
        Timeout: 30
      });
    });

    test('should have environment variables configured', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            PARAMETERS_SECRETS_EXTENSION_CACHE_ENABLED: 'true',
            PARAMETERS_SECRETS_EXTENSION_CACHE_SIZE: '1000',
            PARAMETERS_SECRETS_EXTENSION_TTL_SECONDS: '300'
          })
        }
      });
    });

    test('should have Lambda layer for secrets extension', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Layers: Match.arrayWith([
          Match.stringLikeRegexp('.*AWS-Parameters-and-Secrets-Lambda-Extension.*')
        ])
      });
    });

    test('should have dead letter queue configured', () => {
      template.hasResource('AWS::SQS::Queue', {});
      template.hasResourceProperties('AWS::Lambda::EventInvokeConfig', {
        MaximumRetryAttempts: 2
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create Lambda execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            })
          ])
        })
      });
    });

    test('should have Lambda role policy for S3 access', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith(['s3:GetObject*']),
              Resource: Match.anyValue()
            })
          ])
        }
      });
    });

    test('should have Lambda role policy for Secrets Manager access', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith(['secretsmanager:GetSecretValue']),
              Resource: Match.anyValue()
            })
          ])
        }
      });
    });
  });

  describe('Secrets Manager', () => {
    test('should create Secrets Manager secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'Configuration secrets for ServerlessApp',
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: Match.anyValue(),
          GenerateStringKey: 'tempPassword',
          ExcludeCharacters: '"@/\\'
        })
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp('ServerlessApp-Monitoring-.*')
      });
    });

    test('should create CloudWatch error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('ServerlessApp-Lambda-Errors-.*'),
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        EvaluationPeriods: 2,
        Threshold: 5
      });
    });

    test('should create CloudWatch duration alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('ServerlessApp-Lambda-Duration-.*'),
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 3,
        Threshold: 10000
      });
    });

    test('should create CloudWatch log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp('/aws/lambda/ServerlessApp-FileProcessor-.*'),
        RetentionInDays: 14
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should have S3 bucket name output', () => {
      template.hasOutput('FileStorageBucketName', {
        Description: 'Name of the S3 bucket for file storage'
      });
    });

    test('should have Lambda function ARN output', () => {
      template.hasOutput('LambdaFunctionArn', {
        Description: 'ARN of the file processor Lambda function'
      });
    });

    test('should have Secrets Manager ARN output', () => {
      template.hasOutput('SecretsManagerArn', {
        Description: 'ARN of the Secrets Manager secret'
      });
    });

    test('should have CloudWatch Dashboard URL output', () => {
      template.hasOutput('CloudWatchDashboardUrl', {
        Description: 'URL to the CloudWatch dashboard'
      });
    });
  });

  describe('Resource Removal Policies', () => {
    test('should have DESTROY removal policy for S3 bucket', () => {
      template.hasResource('AWS::S3::Bucket', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete'
      });
    });

    test('should have DESTROY removal policy for Secrets Manager secret', () => {
      template.hasResource('AWS::SecretsManager::Secret', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete'
      });
    });

    test('should have DESTROY removal policy for log group', () => {
      template.hasResource('AWS::Logs::LogGroup', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete'
      });
    });
  });

  describe('Public Properties', () => {
    test('should expose fileStorageBucket as public property', () => {
      expect(nestedStack.fileStorageBucket).toBeDefined();
      expect(nestedStack.fileStorageBucket.bucketName).toBeDefined();
    });

    test('should expose fileProcessorFunction as public property', () => {
      expect(nestedStack.fileProcessorFunction).toBeDefined();
      expect(nestedStack.fileProcessorFunction.functionName).toBeDefined();
    });

    test('should expose appSecrets as public property', () => {
      expect(nestedStack.appSecrets).toBeDefined();
    });

    test('should expose dashboard as public property', () => {
      expect(nestedStack.dashboard).toBeDefined();
    });
  });
});