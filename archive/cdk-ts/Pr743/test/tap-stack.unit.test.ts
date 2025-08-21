import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Initialization', () => {
  test('should use environmentSuffix from context when props are not provided', () => {
    const app = new cdk.App({ context: { environmentSuffix: 'staging' } });
    const stack = new TapStack(app, 'StagingStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::KMS::Alias', {
      AliasName: 'alias/tap/s3-key-staging',
    });
  });

  test('should use default "dev" suffix when no context or props are provided', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'DevStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::KMS::Alias', {
      AliasName: 'alias/tap/s3-key-dev',
    });
  });
});

describe('TapStack Unit Tests (using props)', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeAll(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: environmentSuffix,
      stackName: `TapStack-${environmentSuffix}`,
      env: {
        account: '123456789012', // Mock account
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('KMS Key', () => {
    test('KMS Key is created with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('KMS Key alias is created with the correct environment suffix', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/tap/s3-key-${environmentSuffix}`,
        TargetKeyId: Match.anyValue(),
      });
    });
  });

  describe('S3 Bucket', () => {
    test('S3 Bucket is created with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            }),
          ]),
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('S3 bucket has a deletion policy of "Delete"', () => {
      template.hasResource('AWS::S3::Bucket', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });
  });

  describe('Lambda Function and IAM Role', () => {
    test('Lambda function is created with correct runtime, handler, and environment', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        Environment: {
          Variables: {
            BUCKET_NAME: {
              Ref: Match.stringLikeRegexp('SecureDataBucket'),
            },
          },
        },
      });
    });

    test('Lambda IAM Role has correct assume role policy', () => {
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

    test('Lambda IAM Role has the correct inline policy for logging', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'LambdaLoggingPolicy',
            PolicyDocument: {
              Statement: [
                {
                  Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                  Effect: 'Allow',
                  Resource: {
                    'Fn::GetAtt': [
                      Match.stringLikeRegexp('ApiHandlerLogGroup'),
                      'Arn',
                    ],
                  },
                },
              ],
            },
          }),
        ]),
      });
    });

    test('IAM policy grants Lambda permissions for S3 write and KMS encryption', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: [
                's3:DeleteObject*',
                's3:PutObject',
                's3:PutObjectLegalHold',
                's3:PutObjectRetention',
                's3:PutObjectTagging',
                's3:PutObjectVersionTagging',
                's3:Abort*',
              ],
              Effect: 'Allow',
              Resource: Match.arrayWith([
                {
                  'Fn::GetAtt': [
                    Match.stringLikeRegexp('SecureDataBucket'),
                    'Arn',
                  ],
                },
                {
                  'Fn::Join': [
                    '',
                    [
                      {
                        'Fn::GetAtt': [
                          Match.stringLikeRegexp('SecureDataBucket'),
                          'Arn',
                        ],
                      },
                      '/*',
                    ],
                  ],
                },
              ]),
            }),
            Match.objectLike({
              Action: [
                'kms:Encrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
              ],
              Effect: 'Allow',
              Resource: {
                'Fn::GetAtt': [
                  Match.stringLikeRegexp('S3BucketKey'),
                  'Arn',
                ],
              },
            }),
          ]),
        },
        Roles: Match.arrayWith([
          { Ref: Match.stringLikeRegexp('ApiHandlerRole') },
        ]),
      });
    });
  });

  describe('API Gateway', () => {
    test('REST API is created with correct name', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `Tap Service API - ${environmentSuffix}`,
      });
    });

    test('API Gateway Stage is created with correct environment name and settings', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: environmentSuffix,
        AccessLogSetting: {
          DestinationArn: {
            'Fn::GetAtt': [
              Match.stringLikeRegexp('ApiGatewayAccessLogs'),
              'Arn',
            ],
          },
          Format: Match.anyValue(),
        },
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            LoggingLevel: 'INFO',
            MetricsEnabled: true,
          }),
        ]),
      });
    });
  });

  describe('Log Groups', () => {
    test('Log Groups for Lambda and API Gateway have correct retention and removal policy', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      for (const lg of Object.values(logGroups)) {
        expect(lg.Properties.RetentionInDays).toEqual(7);
        expect(lg.UpdateReplacePolicy).toEqual('Delete');
        expect(lg.DeletionPolicy).toEqual('Delete');
      }
    });
  });

  describe('CloudFormation Outputs', () => {
    test('Stack has an output for API Gateway URL', () => {
      template.hasOutput('ApiGatewayUrl', {
        Description: 'The URL of the API Gateway endpoint',
      });
    });

    test('Stack has an output for Lambda Function ARN', () => {
      template.hasOutput('LambdaFunctionArn', {
        Description: 'The ARN of the Lambda function',
      });
    });

    test('Stack has an output for S3 Bucket Name', () => {
      template.hasOutput('S3BucketName', {
        Description: 'The name of the S3 bucket',
      });
    });
  });
});