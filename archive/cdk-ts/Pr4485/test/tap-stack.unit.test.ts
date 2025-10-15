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
      env: {
        account: '123456789012',
        region: 'ap-northeast-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket with correct configuration', () => {
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

    test('should have lifecycle rule for old versions', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'delete-old-versions',
              Status: 'Enabled',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30,
              },
            },
          ],
        },
      });
    });

    test('should have proper tags', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: environmentSuffix },
          { Key: 'Project', Value: 'iac-rlhf-amazon' },
        ]),
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('should create DynamoDB table with on-demand billing', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
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
      });
    });

    test('should have encryption enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });

    test('should have contributor insights enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        ContributorInsightsSpecification: {
          Enabled: true,
        },
      });
    });

    test('should have proper tags', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: environmentSuffix },
          { Key: 'Project', Value: 'iac-rlhf-amazon' },
        ]),
      });
    });
  });

  describe('SNS Topic', () => {
    test('should create SNS topic for error alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: `TAP Error Alerts (${environmentSuffix})`,
        TopicName: `tap-error-alerts-${environmentSuffix}`,
      });
    });

    test('should have proper tags', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: environmentSuffix },
          { Key: 'Project', Value: 'iac-rlhf-amazon' },
        ]),
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should create Lambda log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/tap-function-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });

    test('should create API Gateway log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/apigateway/tap-api-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });
  });

  describe('IAM Role', () => {
    test('should create Lambda IAM role', () => {
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
        Description: 'IAM role for TAP Lambda function',
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp(
                  'service-role/AWSLambdaBasicExecutionRole'
                ),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('should grant S3 read permissions to Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['s3:GetObject*']),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should grant DynamoDB read/write permissions to Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'dynamodb:GetItem',
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

    test('should grant SNS publish permissions to Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sns:Publish',
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with Node.js 22.x runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs22.x',
        Handler: 'index.handler',
        FunctionName: `tap-function-${environmentSuffix}`,
        Timeout: 30,
        MemorySize: 256,
      });
    });

    test('should have environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            S3_BUCKET_NAME: Match.anyValue(),
            DYNAMODB_TABLE_NAME: Match.anyValue(),
            ERROR_TOPIC_ARN: Match.anyValue(),
            ENVIRONMENT: environmentSuffix,
          },
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

    test('should have event invoke config with retry attempts', () => {
      template.hasResourceProperties('AWS::Lambda::EventInvokeConfig', {
        MaximumRetryAttempts: 2,
      });
    });

    test('should have proper tags', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `tap-function-${environmentSuffix}`,
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: environmentSuffix },
          { Key: 'Project', Value: 'iac-rlhf-amazon' },
        ]),
      });
    });
  });

  describe('API Gateway', () => {
    test('should create HTTP API', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
        Name: `tap-api-${environmentSuffix}`,
        ProtocolType: 'HTTP',
        Description: `TAP HTTP API (${environmentSuffix})`,
      });
    });

    test('should have CORS configuration', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
        CorsConfiguration: {
          AllowOrigins: ['https://example.com'],
          AllowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          AllowHeaders: ['Content-Type', 'Authorization'],
          MaxAge: 86400,
        },
      });
    });

    test('should have Lambda integration', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Integration', {
        IntegrationType: 'AWS_PROXY',
        PayloadFormatVersion: '2.0',
      });
    });

    test('should have routes configured', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
        RouteKey: 'ANY /{proxy+}',
      });

      template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
        RouteKey: 'ANY /',
      });
    });

    test('should have access logging configured', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Stage', {
        AccessLogSettings: {
          DestinationArn: Match.anyValue(),
          Format: Match.stringLikeRegexp('requestId'),
        },
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should have API URL output', () => {
      template.hasOutput(`ApiUrl${environmentSuffix}`, {
        Description: `HTTP API endpoint URL (${environmentSuffix})`,
        Export: {
          Name: `tap-api-url-${environmentSuffix}`,
        },
      });
    });

    test('should have Bucket Name output', () => {
      template.hasOutput(`BucketName${environmentSuffix}`, {
        Description: `S3 bucket name (${environmentSuffix})`,
        Export: {
          Name: `tap-bucket-name-${environmentSuffix}`,
        },
      });
    });

    test('should have Table Name output', () => {
      template.hasOutput(`TableName${environmentSuffix}`, {
        Description: `DynamoDB table name (${environmentSuffix})`,
        Export: {
          Name: `tap-table-name-${environmentSuffix}`,
        },
      });
    });

    test('should have Error Topic ARN output', () => {
      template.hasOutput(`ErrorTopicArn${environmentSuffix}`, {
        Description: `SNS error topic ARN (${environmentSuffix})`,
        Export: {
          Name: `tap-error-topic-arn-${environmentSuffix}`,
        },
      });
    });

    test('should have Lambda Function Name output', () => {
      template.hasOutput(`LambdaFunctionName${environmentSuffix}`, {
        Description: `Lambda function name (${environmentSuffix})`,
        Export: {
          Name: `tap-lambda-name-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Resource Count', () => {
    test('should have expected number of resources', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
      template.resourceCountIs('AWS::SNS::Topic', 1);
      template.resourceCountIs('AWS::Lambda::Function', 2); // Lambda + AutoDelete Custom Resource
      template.resourceCountIs('AWS::ApiGatewayV2::Api', 1);
      template.resourceCountIs('AWS::Logs::LogGroup', 2);
      template.resourceCountIs('AWS::IAM::Role', 3); // Lambda, API Log, AutoDelete
    });
  });

  describe('Environment-specific Configuration', () => {
    test('should use dev environment settings by default', () => {
      const devApp = new cdk.App();
      const devStack = new TapStack(devApp, 'DevStack', {
        environmentSuffix: 'dev',
        env: {
          account: '123456789012',
          region: 'ap-northeast-1',
        },
      });
      const devTemplate = Template.fromStack(devStack);

      devTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: false,
        },
      });
    });

    test('should use prod environment settings', () => {
      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'ProdStack', {
        environmentSuffix: 'prod',
        env: {
          account: '123456789012',
          region: 'ap-northeast-1',
        },
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('should use default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack', {
        env: {
          account: '123456789012',
          region: 'ap-northeast-1',
        },
      });
      const defaultTemplate = Template.fromStack(defaultStack);

      // Should default to 'dev' suffix
      defaultTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'tap-function-dev',
      });
    });

    test('should use environment suffix from context', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'qa',
        },
      });
      const contextStack = new TapStack(contextApp, 'ContextStack', {
        env: {
          account: '123456789012',
          region: 'ap-northeast-1',
        },
      });
      const contextTemplate = Template.fromStack(contextStack);

      contextTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'tap-function-qa',
      });
    });
  });
});
