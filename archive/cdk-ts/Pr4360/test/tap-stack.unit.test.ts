import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: { region: 'ap-northeast-1' },
    });
    template = Template.fromStack(stack);
  });

  describe('DynamoDB Table', () => {
    test('should create DynamoDB table with correct properties', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `app-data-table-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S',
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'N',
          },
        ],
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('should have iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket with correct properties', () => {
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
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should have lifecycle rule for log deletion', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              ExpirationInDays: 90,
              Status: 'Enabled',
            }),
          ]),
        },
      });
    });

    test('should have bucket policy', () => {
      template.resourceCountIs('AWS::S3::BucketPolicy', 1);
    });

    test('should have iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with correct runtime and handler', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs22.x',
        Handler: 'index.handler',
        FunctionName: `api-lambda-${environmentSuffix}`,
        MemorySize: 256,
        Timeout: 10,
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('should have environment variables configured', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            DYNAMODB_TABLE_NAME: Match.anyValue(),
            S3_BUCKET_NAME: Match.anyValue(),
            ENVIRONMENT: environmentSuffix,
            DB_PORT: '5432',
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
          }),
        },
      });
    });

    test('should have IAM role with DynamoDB permissions', () => {
      const policyJson = template.toJSON().Resources;
      const policies = Object.values(policyJson).filter(
        (r: any) => r.Type === 'AWS::IAM::Policy'
      );

      const hasDB = policies.some((policy: any) =>
        policy.Properties.PolicyDocument.Statement.some((stmt: any) =>
          stmt.Action.some(
            (action: string) =>
              action.includes('dynamodb:PutItem') ||
              action.includes('dynamodb:Scan')
          )
        )
      );

      expect(hasDB).toBe(true);
    });

    test('should have IAM role with S3 permissions', () => {
      const policyJson = template.toJSON().Resources;
      const policies = Object.values(policyJson).filter(
        (r: any) => r.Type === 'AWS::IAM::Policy'
      );

      const hasS3 = policies.some((policy: any) =>
        policy.Properties.PolicyDocument.Statement.some((stmt: any) =>
          stmt.Action.some(
            (action: string) =>
              action.includes('s3:PutObject') || action.includes('s3:GetObject')
          )
        )
      );

      expect(hasS3).toBe(true);
    });

    test('should have IAM role with X-Ray permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should have iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });
  });

  describe('API Gateway', () => {
    test('should create REST API with correct properties', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `serverless-api-${environmentSuffix}`,
        Description: `Serverless API Gateway for ${environmentSuffix} environment`,
      });
    });

    test('should have deployment stage configured', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: environmentSuffix,
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            DataTraceEnabled: true,
            LoggingLevel: 'INFO',
            MetricsEnabled: true,
            ThrottlingBurstLimit: 100,
            ThrottlingRateLimit: 50,
          }),
        ]),
      });
    });

    test('should have GET method on /api resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        Integration: Match.objectLike({
          Type: 'AWS_PROXY',
        }),
      });
    });

    test('should have POST method on /api resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        Integration: Match.objectLike({
          Type: 'AWS_PROXY',
        }),
      });
    });

    test('should have PUT method on /api resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'PUT',
        Integration: Match.objectLike({
          Type: 'AWS_PROXY',
        }),
      });
    });

    test('should have DELETE method on /api resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'DELETE',
        Integration: Match.objectLike({
          Type: 'AWS_PROXY',
        }),
      });
    });

    test('should have CORS OPTIONS method', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
        Integration: Match.objectLike({
          Type: 'MOCK',
        }),
      });
    });

    test('should have Lambda invoke permissions for API Gateway', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 'apigateway.amazonaws.com',
      });
    });

    test('should have iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create SNS topic for alarms', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `lambda-alarms-${environmentSuffix}`,
        DisplayName: `Lambda Alarms for ${environmentSuffix}`,
      });
    });

    test('should create Lambda error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `lambda-error-rate-${environmentSuffix}`,
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Threshold: 5,
        EvaluationPeriods: 1,
        Statistic: 'Sum',
        TreatMissingData: 'notBreaching',
      });
    });

    test('should create Lambda throttle alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `lambda-throttle-${environmentSuffix}`,
        MetricName: 'Throttles',
        Namespace: 'AWS/Lambda',
        Threshold: 1,
        EvaluationPeriods: 1,
        Statistic: 'Sum',
        TreatMissingData: 'notBreaching',
      });
    });

    test('should create Lambda duration alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `lambda-duration-${environmentSuffix}`,
        MetricName: 'Duration',
        Namespace: 'AWS/Lambda',
        Threshold: 8000,
        EvaluationPeriods: 2,
        Statistic: 'Average',
        TreatMissingData: 'notBreaching',
      });
    });

    test('all alarms should have SNS alarm actions', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      Object.values(alarms).forEach((alarm: any) => {
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should have API URL output', () => {
      template.hasOutput('ApiUrl', {
        Description: 'API Gateway URL',
        Export: {
          Name: `ApiUrl-${environmentSuffix}`,
        },
      });
    });

    test('should have Lambda function name output', () => {
      template.hasOutput('LambdaFunctionName', {
        Description: 'Lambda Function Name',
        Export: {
          Name: `LambdaFunctionName-${environmentSuffix}`,
        },
      });
    });

    test('should have DynamoDB table name output', () => {
      template.hasOutput('DynamoTableName', {
        Description: 'DynamoDB Table Name',
        Export: {
          Name: `DynamoTableName-${environmentSuffix}`,
        },
      });
    });

    test('should have S3 bucket name output', () => {
      template.hasOutput('LogBucketName', {
        Description: 'S3 Log Bucket Name',
        Export: {
          Name: `LogBucketName-${environmentSuffix}`,
        },
      });
    });

    test('should have Region output', () => {
      template.hasOutput('Region', {
        Description: 'Deployment Region',
      });
    });
  });

  describe('Resource Count', () => {
    test('should create expected number of resources', () => {
      const resources = template.toJSON().Resources;
      expect(Object.keys(resources).length).toBeGreaterThan(20);
    });

    test('should have exactly one DynamoDB table', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });

    test('should have exactly one S3 bucket', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('should have exactly two Lambda functions', () => {
      // One for API handler, one for S3 auto-delete
      template.resourceCountIs('AWS::Lambda::Function', 2);
    });

    test('should have exactly one API Gateway REST API', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    });

    test('should have exactly one SNS topic', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });

    test('should have exactly three CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 3);
    });
  });

  describe('Integration with region', () => {
    test('stack should use specified region', () => {
      expect(stack.region).toBe('ap-northeast-1');
    });

    test('resources should be region-independent', () => {
      const resources = template.toJSON().Resources;
      const resourceKeys = Object.keys(resources);

      // Check that resource names contain environmentSuffix but not hardcoded regions
      resourceKeys.forEach((key) => {
        expect(key).not.toContain('us-east-1');
        expect(key).not.toContain('us-west-2');
      });
    });
  });

  describe('Environment Suffix Handling', () => {
    test('should use context environmentSuffix if provided', () => {
      const testApp = new cdk.App({
        context: { environmentSuffix: 'qa' },
      });
      const testStack = new TapStack(testApp, 'TestStack', {
        env: { region: 'ap-northeast-1' },
      });
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'app-data-table-qa',
      });
    });

    test('should use props environmentSuffix over context', () => {
      const testApp = new cdk.App({
        context: { environmentSuffix: 'qa' },
      });
      const testStack = new TapStack(testApp, 'TestStack', {
        environmentSuffix: 'staging',
        env: { region: 'ap-northeast-1' },
      });
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'app-data-table-staging',
      });
    });

    test('should default to dev if no environmentSuffix provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {
        env: { region: 'ap-northeast-1' },
      });
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'app-data-table-dev',
      });
    });
  });
});
