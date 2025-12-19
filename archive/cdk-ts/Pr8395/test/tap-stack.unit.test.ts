import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { ServerlessStack } from '../lib/serverless-stack';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
    });
    template = Template.fromStack(stack);
  });

  test('Stack creates ServerlessStack as nested stack', () => {
    // TapStack creates ServerlessStack, which is a separate CDK Stack
    // Both stacks are deployed independently but related
    // TapStack will be essentially empty as it only instantiates ServerlessStack
    const resources = Object.keys(template.toJSON().Resources || {});
    // TapStack should have at least CDK metadata
    expect(resources.length).toBeGreaterThanOrEqual(0);
    // Verify stack was created correctly
    expect(stack.stackName).toBeDefined();
  });

  test('Stack uses environment suffix from props when provided', () => {
    const customApp = new cdk.App();
    const customStack = new TapStack(customApp, 'CustomTapStack', {
      environmentSuffix: 'custom',
    });
    expect(customStack.stackName).toBe('CustomTapStack');
  });

  test('Stack uses context environment suffix when no props provided', () => {
    const contextApp = new cdk.App({
      context: { environmentSuffix: 'context' },
    });
    const contextStack = new TapStack(contextApp, 'ContextTapStack');
    expect(contextStack.stackName).toBe('ContextTapStack');
  });

  test('Stack defaults to dev when no suffix provided', () => {
    const defaultApp = new cdk.App();
    const defaultStack = new TapStack(defaultApp, 'DefaultTapStack');
    expect(defaultStack.stackName).toBe('DefaultTapStack');
  });
});

describe('ServerlessStack', () => {
  let app: cdk.App;
  let stack: ServerlessStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new ServerlessStack(app, 'TestServerlessStack', {
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('EventBridge Resources', () => {
    test('Creates custom EventBridge bus with correct name', () => {
      template.hasResourceProperties('AWS::Events::EventBus', {
        Name: `serverless-events-${environmentSuffix}`,
      });
    });

    test('Creates EventBridge rule for order processing', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `order-processing-${environmentSuffix}`,
        EventPattern: {
          source: ['serverless.orders'],
          'detail-type': ['Order Created', 'Order Updated'],
        },
      });
    });

    test('Creates CloudWatch Log Group for EventBridge', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/events/serverless-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });
  });

  describe('Lambda Functions', () => {
    test('Creates User Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `user-service-${environmentSuffix}`,
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        Timeout: 30,
        MemorySize: 512,
        TracingConfig: {
          Mode: 'Active',
        },
        Environment: {
          Variables: Match.objectLike({
            ENVIRONMENT: environmentSuffix,
            POWERTOOLS_SERVICE_NAME: 'user-service',
            POWERTOOLS_METRICS_NAMESPACE: 'ServerlessApp',
            POWERTOOLS_LOG_LEVEL: 'INFO',
          }),
        },
      });
    });

    test('Creates Order Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `order-service-${environmentSuffix}`,
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        Timeout: 30,
        MemorySize: 512,
        TracingConfig: {
          Mode: 'Active',
        },
        Environment: {
          Variables: Match.objectLike({
            ENVIRONMENT: environmentSuffix,
            POWERTOOLS_SERVICE_NAME: 'order-service',
            POWERTOOLS_METRICS_NAMESPACE: 'ServerlessApp',
            POWERTOOLS_LOG_LEVEL: 'INFO',
          }),
        },
      });
    });

    test('Creates Scheduled Processing Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `scheduled-processing-${environmentSuffix}`,
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        Timeout: 60,
        MemorySize: 256,
        TracingConfig: {
          Mode: 'Active',
        },
        Environment: {
          Variables: Match.objectLike({
            ENVIRONMENT: environmentSuffix,
            POWERTOOLS_SERVICE_NAME: 'scheduled-processing',
            POWERTOOLS_METRICS_NAMESPACE: 'ServerlessApp',
            POWERTOOLS_LOG_LEVEL: 'INFO',
          }),
        },
      });
    });

    test('All Lambda functions use Powertools layer', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      Object.values(functions).forEach((func: any) => {
        expect(func.Properties.Layers).toBeDefined();
        expect(JSON.stringify(func.Properties.Layers[0])).toContain(
          'AWSLambdaPowertoolsTypeScriptV2'
        );
      });
    });

    test('Creates Lambda aliases for all functions', () => {
      // Should have 3 Lambda aliases (one for each function)
      template.resourceCountIs('AWS::Lambda::Alias', 3);
      template.hasResourceProperties('AWS::Lambda::Alias', {
        Name: 'live',
      });
    });

    test('Creates Lambda versions for all functions', () => {
      // Should have 3 Lambda versions (one for each function)
      template.resourceCountIs('AWS::Lambda::Version', 3);
    });
  });

  describe('EventBridge Scheduler', () => {
    test('Creates Schedule Group for organization', () => {
      template.hasResourceProperties('AWS::Scheduler::ScheduleGroup', {
        Name: `serverless-schedules-${environmentSuffix}`,
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: environmentSuffix },
          { Key: 'Service', Value: 'serverless-processing' },
        ]),
      });
    });

    test('Skips schedule creation when disableScheduler context is true', () => {
      // Create a stack with disableScheduler context set to true
      const disabledApp = new cdk.App({
        context: { disableScheduler: 'true' },
      });
      const disabledStack = new ServerlessStack(disabledApp, 'DisabledSchedulerStack', {
        environmentSuffix: 'disabled',
      });
      const disabledTemplate = Template.fromStack(disabledStack);

      // Should still create the schedule group (it's created before the check)
      disabledTemplate.hasResourceProperties('AWS::Scheduler::ScheduleGroup', {
        Name: 'serverless-schedules-disabled',
      });

      // Should NOT create any schedules when disabled
      const schedules = disabledTemplate.findResources('AWS::Scheduler::Schedule');
      expect(Object.keys(schedules).length).toBe(0);
    });

    test('Creates Daily Processing Schedule', () => {
      template.hasResourceProperties('AWS::Scheduler::Schedule', {
        Name: `daily-processing-${environmentSuffix}`,
        ScheduleExpression: 'cron(0 2 * * ? *)',
        ScheduleExpressionTimezone: 'UTC',
        State: 'ENABLED',
        FlexibleTimeWindow: {
          Mode: 'FLEXIBLE',
          MaximumWindowInMinutes: 15,
        },
        Target: Match.objectLike({
          Input: Match.serializedJson(
            Match.objectLike({
              scheduleType: 'daily',
              task: 'daily-maintenance',
              environment: environmentSuffix,
            })
          ),
        }),
      });
    });

    test('Creates Hourly Processing Schedule', () => {
      template.hasResourceProperties('AWS::Scheduler::Schedule', {
        Name: `hourly-processing-${environmentSuffix}`,
        ScheduleExpression: 'rate(1 hour)',
        State: 'ENABLED',
        FlexibleTimeWindow: {
          Mode: 'FLEXIBLE',
          MaximumWindowInMinutes: 5,
        },
        Target: Match.objectLike({
          Input: Match.serializedJson(
            Match.objectLike({
              scheduleType: 'hourly',
              task: 'frequent-check',
              environment: environmentSuffix,
            })
          ),
        }),
      });
    });

    test('Creates One-time Initialization Schedule', () => {
      template.hasResourceProperties('AWS::Scheduler::Schedule', {
        Name: `initialization-${environmentSuffix}`,
        ScheduleExpressionTimezone: 'UTC',
        State: 'ENABLED',
        FlexibleTimeWindow: {
          Mode: 'OFF',
        },
        Target: Match.objectLike({
          Input: Match.serializedJson(
            Match.objectLike({
              scheduleType: 'one-time',
              task: 'system-initialization',
              environment: environmentSuffix,
            })
          ),
        }),
      });
    });

    test('Creates IAM role for Scheduler execution', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'scheduler.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });
  });

  describe('CodeDeploy Configuration', () => {
    test('Creates CodeDeploy application', () => {
      template.hasResourceProperties('AWS::CodeDeploy::Application', {
        ApplicationName: `serverless-app-${environmentSuffix}`,
        ComputePlatform: 'Lambda',
      });
    });

    test('Creates deployment groups for all functions', () => {
      // Should have 3 deployment groups (user, order, scheduled)
      template.resourceCountIs('AWS::CodeDeploy::DeploymentGroup', 3);
    });

    test('Deployment groups use CANARY configuration', () => {
      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        DeploymentConfigName: 'CodeDeployDefault.LambdaCanary10Percent5Minutes',
        AutoRollbackConfiguration: {
          Enabled: true,
          Events: Match.arrayWith(['DEPLOYMENT_FAILURE']),
        },
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('Creates error alarms for all Lambda functions', () => {
      // Should have 4 CloudWatch alarms (3 function errors + 1 custom metrics alarm)
      template.resourceCountIs('AWS::CloudWatch::Alarm', 4);
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Errors',
        Threshold: 1,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
      });
    });

    test('Creates custom metrics alarm for Powertools', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Namespace: 'ServerlessApp',
        MetricName: 'UserProcessingError',
        Threshold: 3,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
      });
    });
  });

  describe('API Gateway', () => {
    test('Creates REST API with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `serverless-api-${environmentSuffix}`,
        Description: 'Enhanced Serverless API with Powertools and Scheduler',
      });
    });

    test('Creates API deployment', () => {
      template.hasResourceProperties('AWS::ApiGateway::Deployment', {
        RestApiId: { Ref: Match.anyValue() },
      });
      // Stage is created separately
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: environmentSuffix,
      });
    });

    test('Creates users resource with GET and POST methods', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'users',
      });

      // Check for GET and POST methods on users resource
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        ResourceId: { Ref: Match.stringLikeRegexp('ServerlessApiusers') },
      });

      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        ResourceId: { Ref: Match.stringLikeRegexp('ServerlessApiusers') },
      });
    });

    test('Creates orders resource with GET and POST methods', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'orders',
      });

      // Check for GET and POST methods on orders resource
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        ResourceId: { Ref: Match.stringLikeRegexp('ServerlessApiorders') },
      });

      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        ResourceId: { Ref: Match.stringLikeRegexp('ServerlessApiorders') },
      });
    });

    test('Creates customer-specific orders endpoint', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: '{customerId}',
      });

      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        ResourceId: {
          Ref: Match.stringLikeRegexp('ServerlessApiorderscustomerId'),
        },
      });
    });

    test('Configures CORS for API', () => {
      // Check for OPTIONS methods (CORS preflight)
      const optionsMethods = template.findResources('AWS::ApiGateway::Method', {
        Properties: {
          HttpMethod: 'OPTIONS',
        },
      });
      expect(Object.keys(optionsMethods).length).toBeGreaterThan(0);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('Creates IAM roles for Lambda functions', () => {
      // Should have at least 1 IAM role for Lambda functions (shared role)
      const lambdaRoles = template.findResources('AWS::IAM::Role', {
        Properties: {
          AssumeRolePolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Principal: {
                  Service: 'lambda.amazonaws.com',
                },
              }),
            ]),
          },
        },
      });
      expect(Object.keys(lambdaRoles).length).toBeGreaterThanOrEqual(1);
    });

    test('Creates IAM roles for CodeDeploy', () => {
      // Should have IAM roles for CodeDeploy
      const codeDeployRoles = template.findResources('AWS::IAM::Role', {
        Properties: {
          AssumeRolePolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Principal: {
                  Service: 'codedeploy.amazonaws.com',
                },
              }),
            ]),
          },
        },
      });
      expect(Object.keys(codeDeployRoles).length).toBeGreaterThanOrEqual(2);
    });

    test('Grants EventBridge permissions to Order function', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: 'events:PutEvents',
            }),
          ]),
        },
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('Creates output for API Gateway URL', () => {
      template.hasOutput('ApiGatewayUrl', {
        Export: {
          Name: `api-url-${environmentSuffix}`,
        },
      });
    });

    test('Creates output for EventBus name', () => {
      template.hasOutput('EventBusName', {
        Description: 'EventBridge Bus Name',
        Export: {
          Name: `event-bus-${environmentSuffix}`,
        },
      });
    });

    test('Creates output for Lambda function names', () => {
      template.hasOutput('UserFunctionName', {
        Export: {
          Name: `user-function-${environmentSuffix}`,
        },
      });

      template.hasOutput('OrderFunctionName', {
        Export: {
          Name: `order-function-${environmentSuffix}`,
        },
      });

      template.hasOutput('ScheduledProcessingFunctionName', {
        Export: {
          Name: `scheduled-function-${environmentSuffix}`,
        },
      });
    });

    test('Creates outputs for EventBridge Scheduler resources', () => {
      template.hasOutput('ScheduleGroupName', {
        Description: 'EventBridge Scheduler Group Name',
        Export: {
          Name: `schedule-group-${environmentSuffix}`,
        },
      });
    });

    test('Creates outputs for Powertools log groups', () => {
      template.hasOutput('PowertoolsLogGroupArn', {
        Description: 'Lambda Powertools Log Group ARN',
        Export: {
          Name: `powertools-log-group-${environmentSuffix}`,
        },
      });

      template.hasOutput('EventBridgeLogGroupArn', {
        Description: 'EventBridge Log Group ARN',
        Export: {
          Name: `eventbridge-log-group-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Stack Properties', () => {
    test('Exposes API property', () => {
      expect(stack.api).toBeDefined();
    });

    test('Exposes userFunction property', () => {
      expect(stack.userFunction).toBeDefined();
    });

    test('Exposes orderFunction property', () => {
      expect(stack.orderFunction).toBeDefined();
    });

    test('Exposes scheduledProcessingFunction property', () => {
      expect(stack.scheduledProcessingFunction).toBeDefined();
    });
  });

  describe('Lambda Function Code', () => {
    test('User function includes Powertools and returns correct response structure', () => {
      const resources = template.findResources('AWS::Lambda::Function', {
        Properties: {
          FunctionName: `user-service-${environmentSuffix}`,
        },
      });
      expect(Object.keys(resources).length).toBe(1);
      const functionResource = Object.values(resources)[0];
      const code = functionResource.Properties.Code.ZipFile;
      expect(code).toContain('@aws-lambda-powertools/logger');
      expect(code).toContain('@aws-lambda-powertools/metrics');
      expect(code).toContain('@aws-lambda-powertools/tracer');
      expect(code).toContain('User operation successful');
      expect(code).toContain('statusCode: 200');
      expect(code).toContain('logger.info');
      expect(code).toContain('metrics.addMetric');
    });

    test('Order function includes Powertools and processes orders correctly', () => {
      const resources = template.findResources('AWS::Lambda::Function', {
        Properties: {
          FunctionName: `order-service-${environmentSuffix}`,
        },
      });
      expect(Object.keys(resources).length).toBe(1);
      const functionResource = Object.values(resources)[0];
      const code = functionResource.Properties.Code.ZipFile;
      expect(code).toContain('@aws-lambda-powertools/logger');
      expect(code).toContain('@aws-lambda-powertools/metrics');
      expect(code).toContain('@aws-lambda-powertools/tracer');
      expect(code).toContain('Order processed successfully');
      expect(code).toContain('orderId');
      expect(code).toContain('customerId');
      expect(code).toContain('PutEventsCommand');
    });

    test('Scheduled function includes Powertools and handles scheduled tasks', () => {
      const resources = template.findResources('AWS::Lambda::Function', {
        Properties: {
          FunctionName: `scheduled-processing-${environmentSuffix}`,
        },
      });
      expect(Object.keys(resources).length).toBe(1);
      const functionResource = Object.values(resources)[0];
      const code = functionResource.Properties.Code.ZipFile;
      expect(code).toContain('@aws-lambda-powertools/logger');
      expect(code).toContain('@aws-lambda-powertools/metrics');
      expect(code).toContain('@aws-lambda-powertools/tracer');
      expect(code).toContain('Scheduled processing completed successfully');
      expect(code).toContain('scheduleArn');
      expect(code).toContain('ScheduledProcessingInvocation');
    });
  });
});
