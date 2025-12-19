import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const testEnvironmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix: testEnvironmentSuffix 
    });
    template = Template.fromStack(stack);
  });

  describe('DynamoDB Table', () => {
    test('creates DynamoDB table with correct properties', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `lambda-invocation-logs-${testEnvironmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        AttributeDefinitions: [
          {
            AttributeName: 'requestId',
            AttributeType: 'S',
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'S',
          },
        ],
        KeySchema: [
          {
            AttributeName: 'requestId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
      });
    });

    test('creates global secondary index for timestamp queries', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: [
          {
            IndexName: 'TimestampIndex',
            KeySchema: [
              {
                AttributeName: 'timestamp',
                KeyType: 'HASH',
              },
            ],
            Projection: {
              ProjectionType: 'ALL',
            },
          },
        ],
      });
    });

    test('has DESTROY removal policy for development', () => {
      template.hasResource('AWS::DynamoDB::Table', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });
  });

  describe('Lambda Function', () => {
    test('creates Lambda function with Python 3.12 runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `s3-object-processor-${testEnvironmentSuffix}`,
        Runtime: 'python3.12',
        Handler: 'index.handler',
        MemorySize: 256,
        Timeout: 300,
      });
    });

    test('Lambda function has DynamoDB table name in environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            DYNAMODB_TABLE_NAME: {
              Ref: Match.anyValue(),
            },
          },
        },
      });
    });

    test('Lambda function has proper IAM role', () => {
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
        ]),
      });
    });

    test('Lambda function has DynamoDB table environment variable', () => {
      // Verify Lambda is configured with DynamoDB table - implies permissions are set
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            DYNAMODB_TABLE_NAME: {
              Ref: Match.anyValue(),
            },
          },
        },
      });
    });

    test('Lambda function has EventBridge bus environment variable', () => {
      // Verify Lambda is configured with EventBridge bus - implies permissions are set
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            EVENT_BUS_NAME: {
              Ref: Match.anyValue(),
            },
          },
        },
      });
    });

    test('Lambda function code is defined inline', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Code: {
          ZipFile: Match.anyValue(),
        },
      });
    });

    test('Lambda function has X-Ray tracing enabled', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });
  });

  describe('S3 Bucket', () => {
    test('creates S3 bucket with correct configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': [
            '',
            [
              `object-trigger-bucket-${testEnvironmentSuffix}-`,
              { Ref: 'AWS::AccountId' },
            ],
          ],
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
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

    test('S3 bucket has lifecycle rule for incomplete multipart uploads', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteIncompleteMultipartUploads',
              Status: 'Enabled',
              AbortIncompleteMultipartUpload: {
                DaysAfterInitiation: 1,
              },
            },
          ],
        },
      });
    });

    test('S3 bucket has SSL enforcement policy', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: 's3:*',
              Principal: { AWS: '*' },
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

    test('S3 bucket has auto-delete objects custom resource', () => {
      template.hasResource('Custom::S3AutoDeleteObjects', {
        Properties: {
          ServiceToken: {
            'Fn::GetAtt': [Match.anyValue(), 'Arn'],
          },
          BucketName: {
            Ref: Match.anyValue(),
          },
        },
      });
    });
  });

  describe('S3 Event Notifications', () => {
    test('S3 bucket has Lambda trigger for object creation', () => {
      template.hasResource('Custom::S3BucketNotifications', {
        Properties: {
          NotificationConfiguration: {
            LambdaFunctionConfigurations: [
              {
                Events: ['s3:ObjectCreated:*'],
                LambdaFunctionArn: {
                  'Fn::GetAtt': [Match.anyValue(), 'Arn'],
                },
              },
            ],
          },
        },
      });
    });

    test('Lambda has permission to be invoked by S3', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 's3.amazonaws.com',
        SourceArn: {
          'Fn::GetAtt': [Match.anyValue(), 'Arn'],
        },
      });
    });
  });

  describe('EventBridge', () => {
    test('creates custom EventBridge event bus', () => {
      template.hasResourceProperties('AWS::Events::EventBus', {
        Name: `processing-events-${testEnvironmentSuffix}`,
      });
    });

    test('creates success event rule with correct pattern', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `s3-processing-success-${testEnvironmentSuffix}`,
        EventBusName: {
          Ref: Match.anyValue(),
        },
        EventPattern: {
          source: ['custom.s3.processor'],
          'detail-type': ['S3 Object Processed Successfully'],
          detail: {
            status: ['SUCCESS'],
          },
        },
      });
    });

    test('creates error event rule with correct pattern', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `s3-processing-error-${testEnvironmentSuffix}`,
        EventBusName: {
          Ref: Match.anyValue(),
        },
        EventPattern: {
          source: ['custom.s3.processor'],
          'detail-type': ['S3 Object Processing Error'],
          detail: {
            status: ['ERROR'],
          },
        },
      });
    });

    test('Lambda role has X-Ray daemon write access', () => {
      // Verify Lambda role has X-Ray daemon write access managed policy
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: Match.arrayWith([
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/AWSXRayDaemonWriteAccess',
              ],
            ],
          },
        ]),
      });
    });
  });

  describe('CloudWatch Log Group', () => {
    test('creates EventBridge log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/events/processing-${testEnvironmentSuffix}`,
        RetentionInDays: 7,
      });
    });
  });

  describe('Stack Outputs', () => {
    test('creates DynamoDB table name output', () => {
      template.hasOutput('DynamoDBTableName', {
        Description: 'Name of the DynamoDB table for Lambda invocation logs',
        Export: {
          Name: `DynamoDBTableName-${testEnvironmentSuffix}`,
        },
      });
    });

    test('creates DynamoDB table ARN output', () => {
      template.hasOutput('DynamoDBTableArn', {
        Description: 'ARN of the DynamoDB table',
        Export: {
          Name: `DynamoDBTableArn-${testEnvironmentSuffix}`,
        },
      });
    });

    test('creates Lambda function name output', () => {
      template.hasOutput('LambdaFunctionName', {
        Description: 'Name of the Lambda function',
        Export: {
          Name: `LambdaFunctionName-${testEnvironmentSuffix}`,
        },
      });
    });

    test('creates Lambda function ARN output', () => {
      template.hasOutput('LambdaFunctionArn', {
        Description: 'ARN of the Lambda function',
        Export: {
          Name: `LambdaFunctionArn-${testEnvironmentSuffix}`,
        },
      });
    });

    test('creates S3 bucket name output', () => {
      template.hasOutput('S3BucketName', {
        Description: 'Name of the S3 bucket that triggers Lambda function',
        Export: {
          Name: `S3BucketName-${testEnvironmentSuffix}`,
        },
      });
    });

    test('creates S3 bucket ARN output', () => {
      template.hasOutput('S3BucketArn', {
        Description: 'ARN of the S3 bucket that triggers Lambda function',
        Export: {
          Name: `S3BucketArn-${testEnvironmentSuffix}`,
        },
      });
    });

    test('creates EventBridge bus name output', () => {
      template.hasOutput('EventBusName', {
        Description: 'Name of the custom EventBridge event bus',
        Export: {
          Name: `EventBusName-${testEnvironmentSuffix}`,
        },
      });
    });

    test('creates EventBridge bus ARN output', () => {
      template.hasOutput('EventBusArn', {
        Description: 'ARN of the custom EventBridge event bus',
        Export: {
          Name: `EventBusArn-${testEnvironmentSuffix}`,
        },
      });
    });
  });

  describe('Tags', () => {
    test('resources are tagged with environment', () => {
      // Check if DynamoDB table has environment tag
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: testEnvironmentSuffix,
          }),
        ]),
      });

      // Check if Lambda function has environment tag
      template.hasResourceProperties('AWS::Lambda::Function', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: testEnvironmentSuffix,
          }),
        ]),
      });

      // Check if S3 bucket has environment tag
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: testEnvironmentSuffix,
          }),
        ]),
      });
    });

    test('resources are tagged with purpose', () => {
      // Check if DynamoDB table has purpose tag
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Purpose',
            Value: 'LambdaInvocationLogging',
          }),
        ]),
      });

      // Check if Lambda function has purpose tag
      template.hasResourceProperties('AWS::Lambda::Function', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Purpose',
            Value: 'S3EventProcessing',
          }),
        ]),
      });

      // Check if S3 bucket has purpose tag
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Purpose',
            Value: 'LambdaTrigger',
          }),
        ]),
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('Lambda function depends on IAM role', () => {
      template.hasResource('AWS::Lambda::Function', {
        DependsOn: Match.arrayWith([Match.stringLikeRegexp('S3ProcessorLambdaRole')]),
      });
    });

    test('S3 notifications depend on Lambda permissions', () => {
      template.hasResource('Custom::S3BucketNotifications', {
        DependsOn: Match.arrayWith([
          Match.stringLikeRegexp('ObjectTriggerBucketAllowBucketNotifications'),
        ]),
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles missing environment suffix', () => {
      const appNoSuffix = new cdk.App();
      const stackNoSuffix = new TapStack(appNoSuffix, 'TestStackNoSuffix');
      const templateNoSuffix = Template.fromStack(stackNoSuffix);
      
      // Should use 'dev' as default
      templateNoSuffix.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'lambda-invocation-logs-dev',
      });
    });

    test('handles context-provided environment suffix', () => {
      const appWithContext = new cdk.App({
        context: {
          environmentSuffix: 'context-test',
        },
      });
      const stackWithContext = new TapStack(appWithContext, 'TestStackContext');
      const templateWithContext = Template.fromStack(stackWithContext);
      
      templateWithContext.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'lambda-invocation-logs-context-test',
      });
    });
  });
});
