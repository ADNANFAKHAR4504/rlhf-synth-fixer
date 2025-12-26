import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
  });

  test('creates stack with basic resources', () => {
    const stack = new TapStack(app, 'TestTapStack');
    template = Template.fromStack(stack);

    // Verify S3 bucket is created
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [{
          ServerSideEncryptionByDefault: {
            SSEAlgorithm: 'AES256'
          }
        }]
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true
      }
    });

    // Verify Lambda function is created
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs18.x',
      Handler: 'index.handler'
    });

    // Verify IAM role is created
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [{
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com'
          },
          Action: 'sts:AssumeRole'
        }]
      }
    });
  });

  test('configures resources for LocalStack environment', () => {
    const stack = new TapStack(app, 'TestTapStackLocal', { 
      isLocalStack: true 
    });
    template = Template.fromStack(stack);

    // Verify bucket has LocalStack-specific configuration
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: Match.objectLike({
        ServerSideEncryptionConfiguration: Match.anyValue()
      })
    });

    // Verify Lambda function has LocalStack environment variable
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          IS_LOCALSTACK: 'true'
        }
      }
    });
  });

  test('configures resources for AWS environment', () => {
    const stack = new TapStack(app, 'TestTapStackAws', { 
      isLocalStack: false 
    });
    template = Template.fromStack(stack);

    // Verify Lambda function has AWS environment variable
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          IS_LOCALSTACK: 'false'
        }
      }
    });
  });

  test('creates stack outputs', () => {
    const stack = new TapStack(app, 'TestTapStack');
    template = Template.fromStack(stack);

    // Verify outputs are created
    template.hasOutput('BucketName', {});
    template.hasOutput('FunctionArn', {});
    template.hasOutput('RoleArn', {});
  });

  test('Lambda function has correct IAM permissions', () => {
    const stack = new TapStack(app, 'TestTapStack');
    template = Template.fromStack(stack);

    // Verify Lambda has S3 permissions through policy
    // bucket.grantReadWrite() creates comprehensive S3 permissions
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Action: Match.arrayWith([
              Match.stringLikeRegexp('s3:GetObject.*'),
              Match.stringLikeRegexp('s3:PutObject.*')
            ])
          })
        ])
      }
    });
  });
});
