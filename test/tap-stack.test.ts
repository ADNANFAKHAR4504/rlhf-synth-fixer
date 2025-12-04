import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      environment: 'test',
    });
    template = Template.fromStack(stack);
  });

  test('Creates source S3 bucket with correct properties', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'image-source-test',
    });
  });

  test('Creates thumbnail S3 bucket with correct properties', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'image-thumbnail-test',
    });
  });

  test('Creates Lambda function with correct configuration', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'process-image-test',
      Runtime: 'nodejs20.x',
      Timeout: 30,
      MemorySize: 1024,
    });
  });

  test('Creates IAM role for Lambda with correct name', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'process-image-role-test',
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

  test('Creates CloudWatch Log Group', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/aws/lambda/process-image-test',
      RetentionInDays: 7,
    });
  });

  test('Configures S3 event notifications for Lambda', () => {
    template.hasResourceProperties('Custom::S3BucketNotifications', {
      NotificationConfiguration: {
        LambdaFunctionConfigurations: [
          {
            Events: ['s3:ObjectCreated:*'],
            Filter: {
              Key: {
                FilterRules: [
                  {
                    Name: 'suffix',
                    Value: '.jpg',
                  },
                ],
              },
            },
          },
          {
            Events: ['s3:ObjectCreated:*'],
            Filter: {
              Key: {
                FilterRules: [
                  {
                    Name: 'suffix',
                    Value: '.jpeg',
                  },
                ],
              },
            },
          },
          {
            Events: ['s3:ObjectCreated:*'],
            Filter: {
              Key: {
                FilterRules: [
                  {
                    Name: 'suffix',
                    Value: '.png',
                  },
                ],
              },
            },
          },
        ],
      },
    });
  });

  test('All S3 buckets have removal policy DESTROY', () => {
    const buckets = template.findResources('AWS::S3::Bucket');
    Object.values(buckets).forEach((bucket: any) => {
      expect(bucket.DeletionPolicy).toBe('Delete');
    });
  });

  test('Creates CloudFormation outputs', () => {
    template.hasOutput('SourceBucketName', {});
    template.hasOutput('ThumbnailBucketName', {});
    template.hasOutput('ProcessImageFunctionArn', {});
    template.hasOutput('LogGroupName', {});
  });

  test('Stack has correct tags', () => {
    const stackTags = cdk.Tags.of(stack);
    // Tags are applied at the stack level
    expect(stack.tags.tagValues()).toEqual(
      expect.objectContaining({
        Environment: 'test',
        Project: 'MediaProcessingPipeline',
        ManagedBy: 'CDK',
      })
    );
  });
});
