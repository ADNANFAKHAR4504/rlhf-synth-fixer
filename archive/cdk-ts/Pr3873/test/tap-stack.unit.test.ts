import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    template = Template.fromStack(stack);
  });

  test('Creates DynamoDB tables with correct properties', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      BillingMode: 'PAY_PER_REQUEST',
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true,
      },
      StreamSpecification: {
        StreamViewType: 'NEW_AND_OLD_IMAGES',
      },
    });

    template.resourceCountIs('AWS::DynamoDB::Table', 2);
  });

  test('Creates Lambda functions with Node.js 18.x runtime', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs18.x',
      Timeout: 30,
      MemorySize: 256,
    });

    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs18.x',
      Timeout: 60,
      MemorySize: 512,
    });
  });

  test('Creates API Gateway REST API with correct configuration', () => {
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      Name: 'polling-api-test',
    });

    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'POST',
      ApiKeyRequired: true,
    });
  });

  test('Creates Usage Plan with rate limiting', () => {
    template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
      Throttle: {
        RateLimit: 10,
        BurstLimit: 20,
      },
      Quota: {
        Limit: 10000,
        Period: 'DAY',
      },
    });
  });

  test('Creates S3 bucket with versioning enabled', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
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
    });
  });

  test('Creates CloudWatch alarms for monitoring', () => {
    template.resourceCountIs('AWS::CloudWatch::Alarm', 3);

    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      MetricName: 'Errors',
      Namespace: 'AWS/Lambda',
      Threshold: 10,
      ComparisonOperator: 'GreaterThanOrEqualToThreshold',
    });
  });

  test('Grants appropriate IAM permissions', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: Match.arrayWith([
              'dynamodb:BatchGetItem',
              'dynamodb:GetRecords',
              'dynamodb:GetShardIterator',
              'dynamodb:Query',
              'dynamodb:GetItem',
              'dynamodb:Scan',
              'dynamodb:ConditionCheckItem',
              'dynamodb:BatchWriteItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
            ]),
            Effect: 'Allow',
          }),
        ]),
      },
    });
  });

  test('Configures DynamoDB Stream event source', () => {
    template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
      BatchSize: 100,
      StartingPosition: 'LATEST',
      BisectBatchOnFunctionError: true,
      MaximumRetryAttempts: 3,
    });
  });

  test('Creates stack outputs', () => {
    template.hasOutput('APIEndpoint', {});
    template.hasOutput('APIKeyId', {});
    template.hasOutput('VotesTableName', {});
    template.hasOutput('ResultsTableName', {});
    template.hasOutput('SnapshotBucketName', {});
  });

  test('Uses environment suffix from props', () => {
    const app2 = new cdk.App();
    const stack2 = new TapStack(app2, 'TestStack2', {
      environmentSuffix: 'custom-suffix',
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    const template2 = Template.fromStack(stack2);

    template2.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'polling-votes-custom-suffix',
    });
  });

  test('Uses environment suffix from context', () => {
    const app3 = new cdk.App({ context: { environmentSuffix: 'context-suffix' } });
    const stack3 = new TapStack(app3, 'TestStack3', {
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    const template3 = Template.fromStack(stack3);

    template3.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'polling-votes-context-suffix',
    });
  });

  test('Defaults to dev environment suffix', () => {
    const app4 = new cdk.App();
    const stack4 = new TapStack(app4, 'TestStack4', {
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    const template4 = Template.fromStack(stack4);

    template4.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'polling-votes-dev',
    });
  });

  test('API Gateway has CORS enabled', () => {
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'OPTIONS',
    });
  });

  test('Lambda functions have appropriate log retention', () => {
    template.hasResourceProperties('Custom::LogRetention', {
      RetentionInDays: 7,
    });
  });

  test('S3 bucket has auto-delete enabled', () => {
    template.hasResourceProperties('Custom::S3AutoDeleteObjects', {
      BucketName: Match.anyValue(),
    });
  });

  test('Creates API key with proper naming', () => {
    template.hasResourceProperties('AWS::ApiGateway::ApiKey', {
      Name: 'polling-api-key-test',
      Enabled: true,
    });
  });

  test('API Gateway methods require API key', () => {
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'POST',
      ApiKeyRequired: true,
    });

    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'GET',
      ApiKeyRequired: true,
    });
  });
});
