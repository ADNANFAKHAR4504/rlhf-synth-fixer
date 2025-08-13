import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { LambdaStack } from '../lib/lambda-stack';
import { ApiGatewayStack } from '../lib/api-gateway-stack';
import { MonitoringStack } from '../lib/monitoring-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const testEnvironmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: testEnvironmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Structure', () => {
    test('Should create the main stack with correct outputs', () => {
      template.hasOutput('Environment', {
        Value: testEnvironmentSuffix,
        Description: 'Environment suffix for this deployment',
      });

      template.hasOutput('Region', {
        Value: { Ref: 'AWS::Region' },
        Description: 'AWS Region for this deployment',
      });
    });

    test('Should create outputs for environment and region', () => {
      // The main stack should have outputs
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs)).toContain('Environment');
      expect(Object.keys(outputs)).toContain('Region');
    });
  });
});

describe('LambdaStack', () => {
  let app: cdk.App;
  let stack: LambdaStack;
  let template: Template;
  const testEnvironmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new LambdaStack(app, 'TestLambdaStack', {
      environmentSuffix: testEnvironmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('Lambda Functions', () => {
    test('Should create processing Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `processing-function-${testEnvironmentSuffix}`,
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        MemorySize: 512,
        Timeout: 30,
        ReservedConcurrentExecutions: 100,
        Environment: {
          Variables: {
            ENVIRONMENT: testEnvironmentSuffix,
            LOG_LEVEL: 'INFO',
          },
        },
      });
    });

    test('Should create streaming Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `streaming-function-${testEnvironmentSuffix}`,
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        MemorySize: 1024,
        Timeout: 300,
        ReservedConcurrentExecutions: 50,
        Environment: {
          Variables: {
            ENVIRONMENT: testEnvironmentSuffix,
            LOG_LEVEL: 'INFO',
          },
        },
      });
    });

    test('Should create IAM role with proper permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            }),
          ]),
        },
      });

      // Check for CloudWatch permissions
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'CloudWatchMetrics',
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.arrayWith([
                    'cloudwatch:PutMetricData',
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                  ]),
                }),
              ]),
            },
          }),
        ]),
      });
    });

    test('Should create CloudWatch log groups with retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/processing-function-${testEnvironmentSuffix}`,
        RetentionInDays: 7,
      });

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/streaming-function-${testEnvironmentSuffix}`,
        RetentionInDays: 7,
      });
    });

    test('Should create CloudWatch alarms for Lambda errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `processing-function-errors-${testEnvironmentSuffix}`,
        MetricName: 'Errors',
        Threshold: 5,
        EvaluationPeriods: 2,
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `streaming-function-errors-${testEnvironmentSuffix}`,
        MetricName: 'Errors',
        Threshold: 3,
        EvaluationPeriods: 2,
      });
    });

    test('Should have correct stack outputs', () => {
      template.hasOutput('ProcessingFunctionArn', {
        Description: 'ARN of the processing Lambda function',
      });

      template.hasOutput('StreamingFunctionArn', {
        Description: 'ARN of the streaming Lambda function',
      });
    });
  });

  describe('Resource Removal Policies', () => {
    test('Should have DESTROY removal policy for log groups', () => {
      template.hasResource('AWS::Logs::LogGroup', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });
});

describe('ApiGatewayStack', () => {
  let app: cdk.App;
  let lambdaStack: LambdaStack;
  let apiStack: ApiGatewayStack;
  let template: Template;
  const testEnvironmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    const parentStack = new cdk.Stack(app, 'ParentStack');

    lambdaStack = new LambdaStack(parentStack, 'TestLambdaStack', {
      environmentSuffix: testEnvironmentSuffix,
    });

    apiStack = new ApiGatewayStack(parentStack, 'TestApiGatewayStack', {
      environmentSuffix: testEnvironmentSuffix,
      processingFunction: lambdaStack.processingFunction,
      streamingFunction: lambdaStack.streamingFunction,
    });

    template = Template.fromStack(apiStack);
  });

  describe('API Gateway Configuration', () => {
    test('Should create REST API with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `serverless-api-${testEnvironmentSuffix}`,
        Description: Match.anyValue(),
      });
    });

    test('Should have API Gateway deployment stage configured', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: testEnvironmentSuffix,
        TracingEnabled: true,
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            LoggingLevel: 'INFO',
            DataTraceEnabled: true,
            MetricsEnabled: true,
          }),
        ]),
      });
    });

    test('Should create API resources and methods', () => {
      // Check for resources
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'v1',
      });

      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'process',
      });

      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'stream',
      });

      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'health',
      });

      // Check for methods (including OPTIONS methods for CORS)
      // GET+POST for process, GET+POST for stream, GET for health + OPTIONS methods
      const methods = template.findResources('AWS::ApiGateway::Method');
      expect(Object.keys(methods).length).toBeGreaterThanOrEqual(5);
    });

    test('Should create usage plan with rate limiting', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        UsagePlanName: `serverless-usage-plan-${testEnvironmentSuffix}`,
        Throttle: {
          RateLimit: 1000,
          BurstLimit: 2000,
        },
        Quota: {
          Limit: 1000000,
          Period: 'MONTH',
        },
      });
    });

    test('Should have Lambda permissions for API Gateway', () => {
      // Permissions for Lambda functions (including test invocation permissions)
      const permissions = template.findResources('AWS::Lambda::Permission');
      expect(Object.keys(permissions).length).toBeGreaterThanOrEqual(4);
    });

    test('Should create CloudWatch log group for API Gateway', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/apigateway/serverless-api-${testEnvironmentSuffix}`,
        RetentionInDays: 7,
      });
    });

    test('Should have correct stack outputs', () => {
      template.hasOutput('ApiUrl', {
        Description: 'URL of the API Gateway',
      });

      template.hasOutput('ApiId', {
        Description: 'ID of the API Gateway',
      });
    });
  });

  describe('CORS Configuration', () => {
    test('Should have CORS headers configured', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
        AuthorizationType: 'NONE',
      });
    });
  });
});

describe('MonitoringStack', () => {
  let app: cdk.App;
  let lambdaStack: LambdaStack;
  let apiStack: ApiGatewayStack;
  let monitoringStack: MonitoringStack;
  let template: Template;
  const testEnvironmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    const parentStack = new cdk.Stack(app, 'ParentStack');

    lambdaStack = new LambdaStack(parentStack, 'TestLambdaStack', {
      environmentSuffix: testEnvironmentSuffix,
    });

    apiStack = new ApiGatewayStack(parentStack, 'TestApiGatewayStack', {
      environmentSuffix: testEnvironmentSuffix,
      processingFunction: lambdaStack.processingFunction,
      streamingFunction: lambdaStack.streamingFunction,
    });

    monitoringStack = new MonitoringStack(parentStack, 'TestMonitoringStack', {
      environmentSuffix: testEnvironmentSuffix,
      processingFunction: lambdaStack.processingFunction,
      streamingFunction: lambdaStack.streamingFunction,
      api: apiStack.api,
    });

    template = Template.fromStack(monitoringStack);
  });

  describe('CloudWatch Dashboard', () => {
    test('Should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `serverless-dashboard-${testEnvironmentSuffix}`,
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('Should create Lambda error alarms', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `processing-function-high-errors-${testEnvironmentSuffix}`,
        AlarmDescription: 'Processing function error rate is high',
        Threshold: 10,
        EvaluationPeriods: 2,
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `streaming-function-high-errors-${testEnvironmentSuffix}`,
        AlarmDescription: 'Streaming function error rate is high',
        Threshold: 5,
        EvaluationPeriods: 2,
      });
    });

    test('Should create API Gateway alarms', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `api-gateway-high-errors-${testEnvironmentSuffix}`,
        AlarmDescription: 'API Gateway 5XX error rate is high',
        Threshold: 20,
        EvaluationPeriods: 2,
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `api-gateway-high-latency-${testEnvironmentSuffix}`,
        AlarmDescription: 'API Gateway latency is high',
        Threshold: 2000,
        EvaluationPeriods: 3,
      });
    });
  });

  describe('SNS Configuration', () => {
    test('Should create SNS topic for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `serverless-alerts-${testEnvironmentSuffix}`,
        DisplayName: `Serverless Alerts - ${testEnvironmentSuffix}`,
      });
    });

    test('Should configure SNS subscriptions for alarms', () => {
      template.resourceCountIs('AWS::SNS::Subscription', 0); // No email subscriptions by default
    });

    test('Should have correct stack outputs', () => {
      template.hasOutput('DashboardUrl', {
        Description: 'CloudWatch Dashboard URL',
      });

      template.hasOutput('AlertTopicArn', {
        Description: 'SNS Topic ARN for alerts',
      });
    });
  });

  describe('Resource Removal Policies', () => {
    test('SNS topic should have DESTROY removal policy', () => {
      template.hasResource('AWS::SNS::Topic', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });
});

describe('Stack Integration', () => {
  test('Should properly integrate Lambda, API Gateway and Monitoring stacks', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
    });

    // The TapStack should exist and have correct structure
    expect(stack.stackName).toBe('TestTapStack');

    // Check that the stack has child nodes for the nested stacks
    const children = stack.node.children;
    const lambdaStack = children.find(c => c.node.id === 'LambdaStack');
    const apiStack = children.find(c => c.node.id === 'ApiGatewayStack');
    const monitoringStack = children.find(c => c.node.id === 'MonitoringStack');

    expect(lambdaStack).toBeDefined();
    expect(apiStack).toBeDefined();
    expect(monitoringStack).toBeDefined();

    // Verify that stacks are properly created as nested stacks
    expect(lambdaStack?.constructor.name).toBe('LambdaStack');
    expect(apiStack?.constructor.name).toBe('ApiGatewayStack');
    expect(monitoringStack?.constructor.name).toBe('MonitoringStack');
  });
});

describe('TapStack with different environment suffixes', () => {
  test('Should use provided environmentSuffix', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'prod',
    });
    const template = Template.fromStack(stack);

    template.hasOutput('Environment', {
      Value: 'prod',
      Description: 'Environment suffix for this deployment',
    });
  });

  test('Should use context environmentSuffix when props not provided', () => {
    const app = new cdk.App({
      context: {
        environmentSuffix: 'staging',
      },
    });
    const stack = new TapStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.hasOutput('Environment', {
      Value: 'staging',
      Description: 'Environment suffix for this deployment',
    });
  });

  test('Should default to dev when no suffix provided', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.hasOutput('Environment', {
      Value: 'dev',
      Description: 'Environment suffix for this deployment',
    });
  });
});
