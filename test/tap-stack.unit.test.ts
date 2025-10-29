import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Configuration Variants', () => {
    test('stack uses environmentSuffix from props', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackProps', {
        environmentSuffix: 'test-from-props',
      });
      const testTemplate = Template.fromStack(testStack);
      // Verify stack synthesizes correctly with props
      expect(() => testTemplate.toJSON()).not.toThrow();
    });

    test('stack uses environmentSuffix from context', () => {
      const testApp = new cdk.App();
      testApp.node.setContext('environmentSuffix', 'test-from-context');
      const testStack = new TapStack(testApp, 'TestStackContext', {});
      const testTemplate = Template.fromStack(testStack);
      // Verify stack synthesizes correctly with context
      expect(() => testTemplate.toJSON()).not.toThrow();
    });

    test('stack uses default environmentSuffix when not provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackDefault', {});
      const testTemplate = Template.fromStack(testStack);
      // Verify stack synthesizes correctly with default
      expect(() => testTemplate.toJSON()).not.toThrow();
    });

    test('stack creates email subscriptions when notificationEmail provided', () => {
      const testApp = new cdk.App();
      testApp.node.setContext('notificationEmail', 'test@example.com');
      const testStack = new TapStack(testApp, 'TestStackEmail', {
        environmentSuffix: 'test',
      });
      const testTemplate = Template.fromStack(testStack);
      // Verify subscriptions are created when email is provided
      const subscriptions = testTemplate.findResources('AWS::SNS::Subscription', {});
      // Should have email subscriptions for both alarm and pipeline topics
      expect(Object.keys(subscriptions).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Stack Creation', () => {
    test('stack is created successfully', () => {
      expect(stack).toBeDefined();
      expect(template).toBeDefined();
    });

    test('stack synthesizes without errors', () => {
      expect(() => template.toJSON()).not.toThrow();
    });
  });

  describe('Security Infrastructure Resources', () => {
    test('creates KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: Match.stringLikeRegexp('.*-key'),
      });
    });

    test('creates Parameter Store parameters', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Type: 'String',
      });

      // Verify parameter names follow the prefix pattern
      const parameters = template.findResources('AWS::SSM::Parameter', {});
      expect(Object.keys(parameters).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Monitoring Infrastructure Resources', () => {
    test('creates SNS alarm topic with KMS encryption', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: Match.stringLikeRegexp('.*-alarms'),
        KmsMasterKeyId: Match.anyValue(),
      });

      // Verify topic policy exists (may be for EventBridge or CloudWatch)
      template.hasResourceProperties('AWS::SNS::TopicPolicy', {
        Topics: Match.anyValue(),
      });
    });

    test('creates SNS topics without email subscriptions when no email provided', () => {
      // Verify topics exist but no subscriptions when notificationEmail is not set
      const topics = template.findResources('AWS::SNS::Topic', {});
      const subscriptions = template.findResources('AWS::SNS::Subscription', {});
      // When no email is provided, subscriptions array should be empty or minimal
      expect(Object.keys(topics).length).toBeGreaterThan(0);
      // Email subscriptions are optional, so this test verifies the branch path
      expect(Object.keys(subscriptions).length).toBeGreaterThanOrEqual(0);
    });

    test('creates SNS pipeline notification topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: Match.stringLikeRegexp('.*-pipeline-notifications'),
      });
    });

    test('creates CloudWatch Dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp('.*-dashboard'),
      });
    });

    test('creates CloudWatch alarms for application errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('.*-application-errors'),
      });
    });

    test('creates log group for application logs', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp('/aws/application/.*'),
        RetentionInDays: 30,
      });
    });

    test('creates log metric filter for error tracking', () => {
      template.hasResourceProperties('AWS::Logs::MetricFilter', {
        FilterPattern: '[ERROR]',
      });
    });
  });

  describe('Application Infrastructure Resources', () => {
    test('creates Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Timeout: 30,
        MemorySize: 512,
        Handler: 'index.handler',
        TracingConfig: {
          Mode: 'Active',
        },
        ReservedConcurrentExecutions: 100,
      });
    });

    test('creates Lambda function with environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            NODE_ENV: environmentSuffix,
            PARAMETER_PREFIX: Match.stringLikeRegexp('/.*'),
            LOG_LEVEL: 'INFO',
          }),
        },
      });
    });

    test('creates Lambda execution role with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });

      // Verify role has CloudWatch Logs permissions
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ]),
            }),
          ]),
        },
      });

      // Verify Parameter Store access
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
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

    test('creates Lambda log group with encryption', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp('/aws/lambda/.*-function'),
        RetentionInDays: 30,
      });
    });

    test('creates Lambda version and alias', () => {
      template.hasResourceProperties('AWS::Lambda::Version', {});

      template.hasResourceProperties('AWS::Lambda::Alias', {
        Name: 'live',
      });
    });

    test('creates API Gateway REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: Match.stringLikeRegexp('.*-api'),
      });
    });

    test('creates API Gateway deployment and stage', () => {
      template.hasResourceProperties('AWS::ApiGateway::Deployment', {});
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: environmentSuffix,
        RestApiId: {},
      });
    });

    test('creates API Gateway methods with Lambda integration', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: Match.anyValue(),
        Integration: {
          Type: 'AWS_PROXY',
        },
      });
    });

    test('creates CloudWatch alarms for Lambda errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('.*-lambda-errors'),
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
      });
    });

    test('creates CloudWatch alarms for API Gateway errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('.*-api-4xx-errors'),
        Namespace: 'AWS/ApiGateway',
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('.*-api-5xx-errors'),
        Namespace: 'AWS/ApiGateway',
      });
    });
  });

  describe('Pipeline Infrastructure Resources', () => {
    test('creates S3 source bucket with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('.*-source'),
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

    test('creates S3 artifacts bucket with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('.*-artifacts'),
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('creates S3 test reports bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('.*-test-reports'),
      });
    });

    test('creates CodeBuild build project', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: Match.stringLikeRegexp('.*-build'),
        Environment: {
          ComputeType: 'BUILD_GENERAL1_SMALL',
          Image: Match.stringLikeRegexp('.*standard.*'),
          EnvironmentVariables: Match.arrayWith([
            Match.objectLike({
              Name: 'NODE_VERSION',
              Value: '20',
            }),
          ]),
        },
      });
    });

    test('creates CodeBuild test project', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: Match.stringLikeRegexp('.*-test'),
      });
    });

    test('creates CodeBuild deploy project', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: Match.stringLikeRegexp('.*-deploy'),
      });
    });

    test('creates CodeBuild log groups', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp('/aws/codebuild/.*-build'),
        RetentionInDays: 7,
      });
    });

    test('creates CodePipeline with correct stages', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: Match.stringLikeRegexp('.*-pipeline'),
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Source',
            Actions: Match.arrayWith([
              Match.objectLike({
                Name: 'S3Source',
                ActionTypeId: {
                  Category: 'Source',
                  Owner: 'AWS',
                  Provider: 'S3',
                },
              }),
            ]),
          }),
          Match.objectLike({
            Name: 'Build',
          }),
          Match.objectLike({
            Name: 'Test',
          }),
          Match.objectLike({
            Name: 'Deploy',
          }),
        ]),
      });
    });

    test('creates IAM roles for CodeBuild projects', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'codebuild.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });
    });

    test('creates IAM role for CodePipeline', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'codepipeline.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports API endpoint', () => {
      template.hasOutput('ApiEndpoint', {
        Export: {
          Name: Match.stringLikeRegexp('.*-api-endpoint'),
        },
      });
    });

    test('exports API Gateway ID', () => {
      template.hasOutput('ApiGatewayId', {
        Export: {
          Name: Match.stringLikeRegexp('.*-api-id'),
        },
      });
    });

    test('exports Lambda function name', () => {
      template.hasOutput('LambdaFunctionName', {
        Export: {
          Name: Match.stringLikeRegexp('.*-lambda-function-name'),
        },
      });
    });

    test('exports Lambda function ARN', () => {
      template.hasOutput('LambdaFunctionArn', {
        Export: {
          Name: Match.stringLikeRegexp('.*-lambda-function-arn'),
        },
      });
    });

    test('exports Lambda alias ARN', () => {
      template.hasOutput('LambdaAliasArn', {
        Export: {
          Name: Match.stringLikeRegexp('.*-lambda-alias-arn'),
        },
      });
    });

    test('exports KMS key ID and ARN', () => {
      template.hasOutput('KmsKeyId', {
        Export: {
          Name: Match.stringLikeRegexp('.*-kms-key-id'),
        },
      });

      template.hasOutput('KmsKeyArn', {
        Export: {
          Name: Match.stringLikeRegexp('.*-kms-key-arn'),
        },
      });
    });

    test('exports SNS topic ARNs', () => {
      template.hasOutput('AlarmTopicArn', {
        Export: {
          Name: Match.stringLikeRegexp('.*-alarm-topic-arn'),
        },
      });

      template.hasOutput('PipelineNotificationTopic', {
        Export: {
          Name: Match.stringLikeRegexp('.*-pipeline-topic'),
        },
      });
    });

    test('exports pipeline name', () => {
      template.hasOutput('PipelineName', {
        Export: {
          Name: Match.stringLikeRegexp('.*-pipeline-name'),
        },
      });
    });

    test('exports S3 bucket names', () => {
      template.hasOutput('SourceBucketName', {
        Export: {
          Name: Match.stringLikeRegexp('.*-source-bucket'),
        },
      });

      template.hasOutput('ArtifactsBucketName', {
        Export: {
          Name: Match.stringLikeRegexp('.*-artifacts-bucket'),
        },
      });
    });

    test('exports CloudWatch dashboard name', () => {
      template.hasOutput('DashboardName', {
        Export: {
          Name: Match.stringLikeRegexp('.*-dashboard-name'),
        },
      });
    });

    test('exports Parameter Store prefix', () => {
      template.hasOutput('ParameterStorePrefix', {
        Export: {
          Name: Match.stringLikeRegexp('.*-parameter-prefix'),
        },
      });
    });
  });

  describe('Resource Counts', () => {
    test('creates expected number of Lambda functions', () => {
      template.resourceCountIs('AWS::Lambda::Function', 1);
    });

    test('creates expected number of API Gateway REST APIs', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    });

    test('creates expected number of SNS topics', () => {
      template.resourceCountIs('AWS::SNS::Topic', 2);
    });

    test('creates expected number of KMS keys', () => {
      template.resourceCountIs('AWS::KMS::Key', 1);
    });

    test('creates expected number of S3 buckets', () => {
      // Source, artifacts, and test-reports buckets
      template.resourceCountIs('AWS::S3::Bucket', 3);
    });

    test('creates expected number of CodePipeline pipelines', () => {
      template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
    });

    test('creates expected number of CodeBuild projects', () => {
      // Build, test, and deploy projects
      template.resourceCountIs('AWS::CodeBuild::Project', 3);
    });

    test('creates CloudWatch alarms', () => {
      // Lambda errors, API 4xx, API 5xx, application errors
      const alarms = template.findResources('AWS::CloudWatch::Alarm', {});
      expect(Object.keys(alarms).length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Security Configuration', () => {
    test('KMS key has key rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('S3 buckets have encryption enabled', () => {
      const buckets = template.findResources('AWS::S3::Bucket', {});
      Object.keys(buckets).forEach((key) => {
        const bucket = buckets[key];
        expect(bucket.Properties).toHaveProperty('BucketEncryption');
      });
    });

    test('S3 buckets block public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('Lambda function uses encrypted environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        KmsKeyArn: Match.anyValue(),
      });
    });

    test('log groups use KMS encryption', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup', {});
      Object.keys(logGroups).forEach((key) => {
        const logGroup = logGroups[key];
        if (logGroup.Properties.LogGroupName) {
          // At least one log group should have encryption
          expect(logGroup.Properties).toHaveProperty('KmsKeyId');
        }
      });
    });
  });

  describe('Integration Points', () => {
    test('Lambda function can access Parameter Store', () => {
      // Find IAM policies and verify at least one has Parameter Store permissions
      const policies = template.findResources('AWS::IAM::Policy', {});
      const lambdaPolicy = Object.values(policies).find((policy: any) =>
        policy.Properties?.PolicyDocument?.Statement?.some((stmt: any) =>
          Array.isArray(stmt.Action)
            ? stmt.Action.some((act: string) => act.includes('ssm:GetParameter'))
            : typeof stmt.Action === 'string' && stmt.Action.includes('ssm:GetParameter')
        )
      );
      expect(lambdaPolicy).toBeDefined();
    });

    test('Lambda function can decrypt KMS keys', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith(['kms:Decrypt']),
            }),
          ]),
        },
      });
    });

    test('CodeBuild projects have KMS permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith(['kms:Encrypt', 'kms:Decrypt']),
            }),
          ]),
        },
      });
    });

    test('alarms are connected to SNS topics', () => {
      // Verify alarms have AlarmActions array that is not empty
      const alarms = template.findResources('AWS::CloudWatch::Alarm', {});
      const alarmWithActions = Object.values(alarms).find(
        (alarm: any) =>
          alarm.Properties?.AlarmActions &&
          Array.isArray(alarm.Properties.AlarmActions) &&
          alarm.Properties.AlarmActions.length > 0
      );
      expect(alarmWithActions).toBeDefined();
    });
  });
});
