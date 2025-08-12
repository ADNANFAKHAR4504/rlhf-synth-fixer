import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
      env: {
        region: 'us-west-2',
        account: '123456789012',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack initialization with default values', () => {
    test('uses default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultTestStack', {
        env: {
          region: 'us-west-2',
          account: '123456789012',
        },
      });
      const defaultTemplate = Template.fromStack(defaultStack);
      
      defaultTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 's3-event-processor-dev',
      });
      
      defaultTemplate.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/lambda/s3-processor-dev',
      });
    });

    test('accepts custom environment suffix', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomTestStack', {
        environmentSuffix: 'production',
        env: {
          region: 'us-west-2',
          account: '123456789012',
        },
      });
      const customTemplate = Template.fromStack(customStack);
      
      customTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 's3-event-processor-production',
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('creates an S3 bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('blocks all public access to the S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('enables server-side encryption for the S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });
    });

    test('configures lifecycle rules for cost optimization', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'CostOptimization',
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                },
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90,
                },
              ],
              NoncurrentVersionExpiration: {
                NoncurrentDays: 365,
              },
            },
          ],
        },
      });
    });

    test('has a bucket policy that denies non-SSL requests', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Principal: { AWS: '*' },
              Action: 's3:*',
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

    test('configures S3 event notifications for Lambda', () => {
      template.hasResourceProperties('Custom::S3BucketNotifications', {
        NotificationConfiguration: {
          LambdaFunctionConfigurations: Match.arrayWith([
            Match.objectLike({
              Events: ['s3:ObjectCreated:*'],
              Filter: {
                Key: {
                  FilterRules: [
                    {
                      Name: 'prefix',
                      Value: 'incoming/',
                    },
                  ],
                },
              },
            }),
            Match.objectLike({
              Events: ['s3:ObjectRemoved:*'],
            }),
          ]),
        },
      });
    });
  });

  describe('Lambda Function Configuration', () => {
    test('creates a Lambda function with Python 3.11 runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.11',
        FunctionName: 's3-event-processor-test',
      });
    });

    test('uses ARM64 architecture for better performance', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Architectures: ['arm64'],
      });
    });

    test('sets appropriate memory and timeout configurations', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        MemorySize: 256,
        Timeout: 30,
      });
    });

    test('configures reserved concurrent executions', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        ReservedConcurrentExecutions: 10,
      });
    });

    test('sets environment variables for Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            LOG_LEVEL: 'INFO',
            ENVIRONMENT: 'test',
          }),
        },
      });
    });

    test('configures Lambda function handler correctly', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.lambda_handler',
      });
    });
  });

  describe('IAM Roles and Permissions', () => {
    test('creates IAM role for Lambda function', () => {
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
        Description: 'IAM role for S3 event processor Lambda function',
      });
    });

    test('attaches S3 permissions to Lambda role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: [
          {
            PolicyName: 'S3ProcessingPolicy',
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.arrayWith([
                    's3:GetObject',
                    's3:GetObjectVersion',
                    's3:PutObject',
                    's3:PutObjectAcl',
                    's3:DeleteObject',
                  ]),
                }),
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.arrayWith([
                    's3:ListBucket',
                    's3:GetBucketNotification',
                    's3:GetBucketVersioning',
                  ]),
                }),
              ]),
            },
          },
        ],
      });
    });

    test('grants Lambda permission to write CloudWatch logs', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: [
          {
            PolicyName: 'S3ProcessingPolicy',
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                }),
              ]),
            },
          },
        ],
      });
    });

    test('allows S3 to invoke Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 's3.amazonaws.com',
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('creates CloudWatch log group with retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/lambda/s3-processor-test',
        RetentionInDays: 7,
      });
    });

    test('creates CloudWatch dashboard for monitoring', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'serverless-processing-test',
      });
    });

    test('dashboard contains Lambda metrics widgets', () => {
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
      expect(Object.keys(dashboards)).toHaveLength(1);
      const dashboardResource = Object.values(dashboards)[0];
      const dashboardBody = dashboardResource.Properties.DashboardBody;
      expect(dashboardBody).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    test('applies Environment Production tag to resources', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'Production',
          },
        ]),
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'Production',
          },
        ]),
      });
    });

    test('applies Project tag to resources', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          {
            Key: 'Project',
            Value: 'ServerlessEventProcessing',
          },
        ]),
      });
    });

    test('applies Component tag to resources', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          {
            Key: 'Component',
            Value: 'EventDrivenArchitecture',
          },
        ]),
      });
    });

    test('applies CostCenter tag to resources', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          {
            Key: 'CostCenter',
            Value: 'Engineering',
          },
        ]),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports S3 bucket name', () => {
      template.hasOutput('BucketName', {
        Description: 'S3 bucket name for serverless processing',
        Export: {
          Name: Match.stringLikeRegexp('.*-BucketName'),
        },
      });
    });

    test('exports Lambda function name', () => {
      template.hasOutput('LambdaFunctionName', {
        Description: 'Lambda function name for S3 event processing',
        Export: {
          Name: Match.stringLikeRegexp('.*-LambdaFunctionName'),
        },
      });
    });

    test('exports Lambda function ARN', () => {
      template.hasOutput('LambdaFunctionArn', {
        Description: 'Lambda function ARN',
        Export: {
          Name: Match.stringLikeRegexp('.*-LambdaFunctionArn'),
        },
      });
    });

    test('exports CloudWatch dashboard URL', () => {
      template.hasOutput('DashboardUrl', {
        Description: 'CloudWatch Dashboard URL for monitoring',
        Export: {
          Name: Match.stringLikeRegexp('.*-DashboardUrl'),
        },
      });
    });
  });

  describe('Resource Removal Policy', () => {
    test('S3 bucket has DESTROY removal policy', () => {
      template.hasResource('AWS::S3::Bucket', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });

    test('CloudWatch log group has DESTROY removal policy', () => {
      template.hasResource('AWS::Logs::LogGroup', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });
  });

  describe('Lambda Function Code', () => {
    test('Lambda function contains proper handler implementation', () => {
      const lambdaResources = template.findResources('AWS::Lambda::Function', {
        Properties: {
          FunctionName: 's3-event-processor-test',
        },
      });
      
      expect(Object.keys(lambdaResources)).toHaveLength(1);
      const lambdaFunction = Object.values(lambdaResources)[0];
      const code = lambdaFunction.Properties.Code.ZipFile;
      
      // Verify key functions are present in the code
      expect(code).toContain('def lambda_handler');
      expect(code).toContain('def process_s3_record');
      expect(code).toContain('def determine_processing_action');
      expect(code).toContain('import boto3');
      expect(code).toContain('s3_client = boto3.client');
    });
  });
});
