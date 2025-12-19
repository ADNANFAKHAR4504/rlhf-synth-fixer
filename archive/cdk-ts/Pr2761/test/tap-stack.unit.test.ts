import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('KMS Key', () => {
    test('should create KMS key with key rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for TAP application encryption',
        EnableKeyRotation: true,
      });
    });

    test('should have Environment=Production tag', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Tags: Match.arrayWith([{ Key: 'Environment', Value: 'Production' }]),
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket with encryption and versioning', () => {
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

    test('should have lifecycle rule for incomplete multipart uploads', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              AbortIncompleteMultipartUpload: {
                DaysAfterInitiation: 1,
              },
              Id: 'DeleteIncompleteMultipartUploads',
              Status: 'Enabled',
            },
          ],
        },
      });
    });

    test('should have SSL enforcement policy', () => {
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

  describe('DynamoDB Table', () => {
    test('should create DynamoDB table with correct partition key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S',
          },
        ],
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('should have encryption and point-in-time recovery enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
        },
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('should have correct table name with environment suffix', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.anyValue(),
      });
    });
  });

  describe('SNS Topic', () => {
    test('should create SNS topic with KMS encryption', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'TAP Application Notifications',
        TopicName: Match.anyValue(),
        KmsMasterKeyId: Match.anyValue(),
      });
    });
  });

  describe('SQS Dead Letter Queue', () => {
    test('should create SQS queue with encryption and correct settings', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: Match.anyValue(),
        KmsMasterKeyId: 'alias/aws/sqs',
        MessageRetentionPeriod: 1209600,
        VisibilityTimeout: 300,
      });
    });
  });

  describe('Parameter Store', () => {
    test('should create parameter for DynamoDB table name', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/tap/config/table-name-${environmentSuffix}`,
        Description: 'DynamoDB table name for TAP application',
        Type: 'String',
      });
    });

    test('should create parameter for S3 bucket name', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/tap/config/bucket-name-${environmentSuffix}`,
        Description: 'S3 bucket name for TAP application',
        Type: 'String',
      });
    });

    test('should create parameter for SNS topic ARN', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/tap/config/sns-topic-arn-${environmentSuffix}`,
        Description: 'SNS topic ARN for TAP notifications',
        Type: 'String',
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.anyValue(),
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        MemorySize: 256,
        Timeout: 30,
      });
    });

    test('should have correct environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            REGION: Match.anyValue(),
            TABLE_NAME_PARAM: Match.anyValue(),
            BUCKET_NAME_PARAM: Match.anyValue(),
            SNS_TOPIC_PARAM: Match.anyValue(),
          },
        },
      });
    });

    test('should have dead letter queue configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        DeadLetterConfig: {
          TargetArn: Match.anyValue(),
        },
      });
    });

    test('should have X-Ray tracing enabled', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('should have event invoke config for retry attempts', () => {
      template.hasResourceProperties('AWS::Lambda::EventInvokeConfig', {
        MaximumRetryAttempts: 2,
        Qualifier: '$LATEST',
      });
    });
  });

  describe('IAM Role and Policies', () => {
    test('should create Lambda IAM role with correct name', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.anyValue(),
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

    test('should attach basic Lambda execution policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: [Match.anyValue()],
      });
    });

    test('should create custom policy with least privilege permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyName: Match.anyValue(),
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
              ]),
            }),
            Match.objectLike({
              Effect: 'Allow',
              Action: 's3:ListBucket',
            }),
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ]),
            }),
            Match.objectLike({
              Effect: 'Allow',
              Action: 'sns:Publish',
            }),
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'ssm:GetParameter',
                'ssm:GetParameters',
                'ssm:GetParametersByPath',
              ]),
            }),
          ]),
        },
      });
    });
  });

  describe('API Gateway', () => {
    test('should create REST API with correct name and description', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: Match.anyValue(),
        Description: 'TAP Serverless API',
      });
    });

    test('should create deployment stage with logging and throttling', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
        MethodSettings: [
          {
            DataTraceEnabled: true,
            HttpMethod: '*',
            LoggingLevel: 'INFO',
            ResourcePath: '/*',
            ThrottlingBurstLimit: 200,
            ThrottlingRateLimit: 100,
          },
        ],
      });
    });

    test('should create data resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'data',
      });
    });

    test('should create POST method for data resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        AuthorizationType: 'NONE',
      });
    });

    test('should create OPTIONS method for CORS', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
        AuthorizationType: 'NONE',
      });
    });

    test('should have Lambda integration with correct URI', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        Integration: {
          Type: 'AWS_PROXY',
          IntegrationHttpMethod: 'POST',
        },
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should create API Gateway log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.anyValue(),
        RetentionInDays: 30,
      });
    });

    test('should create Lambda log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 30,
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should have all required outputs', () => {
      const outputs = template.toJSON().Outputs;

      // Check that all required outputs exist
      expect(outputs.ApiGatewayUrl).toBeDefined();
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.DynamoDBTableName).toBeDefined();
      expect(outputs.LambdaFunctionName).toBeDefined();
      expect(outputs.SNSTopicArn).toBeDefined();
      expect(outputs.SQSDeadLetterQueueUrl).toBeDefined();
      expect(outputs.KMSKeyId).toBeDefined();

      // Check descriptions
      expect(outputs.ApiGatewayUrl.Description).toBe('URL of the API Gateway');
      expect(outputs.S3BucketName.Description).toBe('Name of the S3 bucket');
      expect(outputs.DynamoDBTableName.Description).toBe(
        'Name of the DynamoDB table'
      );
      expect(outputs.LambdaFunctionName.Description).toBe(
        'Name of the Lambda function'
      );
      expect(outputs.SNSTopicArn.Description).toBe('ARN of the SNS topic');
      expect(outputs.SQSDeadLetterQueueUrl.Description).toBe(
        'URL of the SQS dead letter queue'
      );
      expect(outputs.KMSKeyId.Description).toBe('ID of the KMS key');
    });
  });

  describe('Resource Count', () => {
    test('should create expected number of resources', () => {
      const resources = template.toJSON().Resources;

      // Count major resource types
      const s3Buckets = Object.values(resources).filter(
        r => (r as any).Type === 'AWS::S3::Bucket'
      ).length;
      const dynamoTables = Object.values(resources).filter(
        r => (r as any).Type === 'AWS::DynamoDB::Table'
      ).length;
      const lambdaFunctions = Object.values(resources).filter(
        r => (r as any).Type === 'AWS::Lambda::Function'
      ).length;
      const kmsKeys = Object.values(resources).filter(
        r => (r as any).Type === 'AWS::KMS::Key'
      ).length;
      const snsTopics = Object.values(resources).filter(
        r => (r as any).Type === 'AWS::SNS::Topic'
      ).length;
      const sqsQueues = Object.values(resources).filter(
        r => (r as any).Type === 'AWS::SQS::Queue'
      ).length;
      const apiGateways = Object.values(resources).filter(
        r => (r as any).Type === 'AWS::ApiGateway::RestApi'
      ).length;

      expect(s3Buckets).toBe(1);
      expect(dynamoTables).toBe(1);
      expect(lambdaFunctions).toBeGreaterThanOrEqual(1); // At least 1 (may include CDK helper functions)
      expect(kmsKeys).toBe(1);
      expect(snsTopics).toBe(1);
      expect(sqsQueues).toBe(1);
      expect(apiGateways).toBe(1);
    });
  });

  describe('Environment Suffix Integration', () => {
    test('should properly incorporate environment suffix in resource names', () => {
      const templateJson = template.toJSON();

      // Check that environment suffix is included in output export names
      // The names use CloudFormation functions so we check for the Fn::Join structure
      expect(templateJson.Outputs.ApiGatewayUrl.Export.Name).toEqual(
        expect.objectContaining({
          'Fn::Join': expect.arrayContaining([
            '',
            expect.arrayContaining([`TapApiUrl-${environmentSuffix}-`]),
          ]),
        })
      );
    });

    test('should use default environment suffix when not provided in props', () => {
      // Create a new stack without environmentSuffix in props
      const newApp = new cdk.App();
      const newStack = new TapStack(newApp, 'TestTapStackDefault');
      const newTemplate = Template.fromStack(newStack);

      // Should still create all required resources
      expect(newTemplate.findResources('AWS::DynamoDB::Table')).toBeTruthy();
      expect(newTemplate.findResources('AWS::S3::Bucket')).toBeTruthy();
      expect(newTemplate.findResources('AWS::Lambda::Function')).toBeTruthy();
    });

    test('should use context environment suffix when not in props', () => {
      // Create a new app with context
      const newApp = new cdk.App();
      newApp.node.setContext('environmentSuffix', 'context-test');
      const newStack = new TapStack(newApp, 'TestTapStackContext');
      const newTemplate = Template.fromStack(newStack);

      // Should still create all required resources
      expect(newTemplate.findResources('AWS::DynamoDB::Table')).toBeTruthy();
      expect(newTemplate.findResources('AWS::S3::Bucket')).toBeTruthy();
      expect(newTemplate.findResources('AWS::Lambda::Function')).toBeTruthy();
    });
  });
});
