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
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack Tags', () => {
    test('Should have Environment tag set to Production', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'Production' },
        ]),
      });
    });

    test('Should have iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          { Key: 'iac-rlhf-amazon', Value: 'true' },
        ]),
      });
    });
  });

  describe('S3 Bucket', () => {
    test('Should create exactly one S3 bucket', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('Should have versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('Should have server-side encryption with AES-256', () => {
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

    test('Should have lifecycle rule to transition to Glacier after 30 days', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'MoveToGlacierAfter30Days',
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 30,
                },
              ],
            },
          ],
        },
      });
    });

    test('Should block all public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('Should have access logging enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LoggingConfiguration: {
          LogFilePrefix: 'access-logs/',
        },
      });
    });

    test('Should enforce SSL/TLS', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
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
  });

  describe('Lambda Function', () => {
    test('Should create main Lambda function', () => {
      // NodejsFunction may create additional custom resource Lambda functions
      // So we just verify our main function exists with correct properties
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs22.x',
        Handler: 'index.handler',
      });
    });

    test('Should use Node.js 22 runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs22.x',
      });
    });

    test('Should have correct handler', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.handler',
      });
    });

    test('Should have timeout of 15 seconds', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Timeout: 15,
      });
    });

    test('Should have memory size of 256 MB', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        MemorySize: 256,
      });
    });

    test('Should have dead letter queue configured', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        DeadLetterConfig: {
          TargetArn: Match.anyValue(),
        },
      });
    });

    test('Should have X-Ray tracing enabled', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('Should have environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            NODE_ENV: 'production',
            ENVIRONMENT: environmentSuffix,
          },
        },
      });
    });

    test('Should have EventInvokeConfig with retry attempts and max event age', () => {
      template.hasResourceProperties('AWS::Lambda::EventInvokeConfig', {
        MaximumRetryAttempts: 2,
        MaximumEventAgeInSeconds: 21600,
      });
    });
  });

  describe('IAM Role', () => {
    test('Should create Lambda execution role', () => {
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

    test('Should have AWSLambdaBasicExecutionRole managed policy', () => {
      const roles = template.findResources('AWS::IAM::Role');

      // Verify at least one Lambda role has the managed policy
      const hasBasicExecutionRole = Object.values(roles).some((role: any) => {
        // Check if role is for Lambda
        const isLambdaRole = role.Properties?.AssumeRolePolicyDocument?.Statement?.some(
          (stmt: any) => stmt.Principal?.Service === 'lambda.amazonaws.com'
        );

        if (!isLambdaRole) return false;

        const arns = role.Properties?.ManagedPolicyArns || [];
        return arns.some((arn: any) => {
          if (typeof arn === 'string') {
            return arn.includes('AWSLambdaBasicExecutionRole');
          }
          if (typeof arn === 'object' && arn['Fn::Join']) {
            const parts = arn['Fn::Join'];
            if (Array.isArray(parts) && parts.length >= 2 && Array.isArray(parts[1])) {
              return parts[1].some((part: any) =>
                typeof part === 'string' && part.includes('AWSLambdaBasicExecutionRole')
              );
            }
          }
          return false;
        });
      });

      expect(hasBasicExecutionRole).toBe(true);
    });

    test('Should have S3 read permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: ['s3:GetObject', 's3:GetObjectVersion', 's3:HeadObject'],
            }),
          ]),
        },
      });
    });

    test('Should have SQS permissions for DLQ', () => {
      const policies = template.findResources('AWS::IAM::Policy');

      // Find a policy that contains SQS permissions
      const hasSqsPermissions = Object.values(policies).some((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some((stmt: any) =>
          stmt.Effect === 'Allow' &&
          Array.isArray(stmt.Action) &&
          stmt.Action.includes('sqs:SendMessage')
        );
      });

      expect(hasSqsPermissions).toBe(true);
    });

    test('Should have X-Ray tracing permissions', () => {
      const policies = template.findResources('AWS::IAM::Policy');

      // Find a policy that contains X-Ray permissions
      const hasXrayPermissions = Object.values(policies).some((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some((stmt: any) =>
          stmt.Effect === 'Allow' &&
          Array.isArray(stmt.Action) &&
          stmt.Action.includes('xray:PutTraceSegments')
        );
      });

      expect(hasXrayPermissions).toBe(true);
    });
  });

  describe('SQS Dead Letter Queue', () => {
    test('Should create exactly one SQS queue', () => {
      template.resourceCountIs('AWS::SQS::Queue', 1);
    });

    test('Should have KMS encryption enabled', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        KmsMasterKeyId: 'alias/aws/sqs',
      });
    });

    test('Should have message retention period of 14 days', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        MessageRetentionPeriod: 1209600, // 14 days in seconds
      });
    });
  });

  describe('SNS Topic', () => {
    test('Should create exactly one SNS topic', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });

    test('Should have display name configured', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Lambda Error Notifications',
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('Should create exactly two CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });

    test('Should have Lambda error alarm with correct threshold', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Threshold: 5,
        Period: 300, // 5 minutes
        EvaluationPeriods: 1,
        Statistic: 'Sum',
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('Should have DLQ messages alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'ApproximateNumberOfMessagesVisible',
        Namespace: 'AWS/SQS',
        Threshold: 1,
        Period: 300,
        EvaluationPeriods: 1,
      });
    });

    test('Lambda error alarm should have SNS action', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Errors',
        AlarmActions: Match.anyValue(),
      });
    });

    test('DLQ alarm should have SNS action', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'ApproximateNumberOfMessagesVisible',
        AlarmActions: Match.anyValue(),
      });
    });
  });

  describe('S3 Event Notification', () => {
    test('Should have Lambda permission for S3 to invoke function', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 's3.amazonaws.com',
      });
    });

    test('Should configure S3 bucket notification', () => {
      template.hasResourceProperties('Custom::S3BucketNotifications', {
        NotificationConfiguration: {
          LambdaFunctionConfigurations: Match.arrayWith([
            Match.objectLike({
              Events: ['s3:ObjectCreated:*'],
            }),
          ]),
        },
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('Should have S3 Bucket ARN output', () => {
      template.hasOutput('S3BucketArn', {
        Description: 'ARN of the S3 bucket',
      });
    });

    test('Should have S3 Bucket Name output', () => {
      template.hasOutput('S3BucketName', {
        Description: 'Name of the S3 bucket',
      });
    });

    test('Should have Lambda Function ARN output', () => {
      template.hasOutput('LambdaFunctionArn', {
        Description: 'ARN of the Lambda function',
      });
    });

    test('Should have Lambda Function Name output', () => {
      template.hasOutput('LambdaFunctionName', {
        Description: 'Name of the Lambda function',
      });
    });

    test('Should have DLQ URL output', () => {
      template.hasOutput('DLQUrl', {
        Description: 'URL of the Dead Letter Queue',
      });
    });

    test('Should have Alarm Topic ARN output', () => {
      template.hasOutput('AlarmTopicArn', {
        Description: 'ARN of the SNS topic for alarm notifications',
      });
    });
  });

  describe('Environment Suffix Support', () => {
    test('Should use environment suffix in resource names', () => {
      // Create a new app instance to avoid synthesis conflicts
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: 'prod',
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: 'lambda-dlq-prod',
      });

      customTemplate.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'lambda-errors-topic-prod',
      });

      customTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 's3-processor-prod',
      });
    });

    test('Should use environment suffix from CDK context', () => {
      // Create a new app instance with context
      const customApp = new cdk.App({
        context: {
          environmentSuffix: 'qa',
        },
      });
      const customStack = new TapStack(customApp, 'ContextStack');
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: 'lambda-dlq-qa',
      });

      customTemplate.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'lambda-errors-topic-qa',
      });

      customTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 's3-processor-qa',
      });
    });

    test('Should default to "dev" when no suffix provided', () => {
      // Create stack without props or context - should fall back to 'dev'
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'DefaultStack');
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: 'lambda-dlq-dev',
      });

      customTemplate.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'lambda-errors-topic-dev',
      });

      customTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 's3-processor-dev',
      });
    });
  });

  describe('Custom Bucket Name Support', () => {
    test('Should use custom bucket name when provided', () => {
      // Create a new app instance to avoid synthesis conflicts
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomBucketStack', {
        environmentSuffix: 'test',
        bucketName: 'my-custom-bucket-name',
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'my-custom-bucket-name',
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('Should create expected number of resources', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.resourceCountIs('AWS::S3::BucketPolicy', 1);
      // Note: Lambda function count may be > 1 due to custom resource handlers
      // We verify the main Lambda function exists in other tests
      template.resourceCountIs('AWS::SQS::Queue', 1);
      template.resourceCountIs('AWS::SNS::Topic', 1);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
      // Lambda::Permission count may vary due to custom resources
      template.resourceCountIs('AWS::Lambda::EventInvokeConfig', 1);
    });
  });
});
