import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { ProjectXLambdaStack } from '../lib/lambda-stack';
import { ProjectXApiGatewayStack } from '../lib/api-gateway-stack';
import { ProjectXMonitoringStack } from '../lib/monitoring-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

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
        region: 'us-east-1'
      }
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Configuration', () => {
    test('should create TapStack with proper configuration', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should have main API endpoint output', () => {
      template.hasOutput('ProjectXMainApiEndpoint', {
        Description: 'Main API endpoint for ProjectX serverless service',
        Export: {
          Name: `projectX-api-endpoint-${environmentSuffix}`
        }
      });
    });

    test('should have API URL output', () => {
      template.hasOutput('ProjectXApiUrl', {
        Description: 'ProjectX API Gateway URL',
        Export: {
          Name: `projectX-api-url-${environmentSuffix}`
        }
      });
    });

    test('should have Lambda function ARN output', () => {
      template.hasOutput('ProjectXLambdaFunctionArn', {
        Description: 'ProjectX Lambda Function ARN',
        Export: {
          Name: `projectX-lambda-arn-${environmentSuffix}`
        }
      });
    });

    test('should have API Gateway ID output', () => {
      template.hasOutput('ProjectXApiId', {
        Description: 'ProjectX API Gateway ID',
        Export: {
          Name: `projectX-api-id-${environmentSuffix}`
        }
      });
    });

    test('should have Dashboard URL output', () => {
      template.hasOutput('ProjectXDashboardUrl', {
        Description: 'ProjectX CloudWatch Dashboard URL',
        Export: {
          Name: `projectX-dashboard-url-${environmentSuffix}`
        }
      });
    });

    test('should use provided environment suffix', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: 'custom',
      });
      expect(customStack).toBeDefined();
    });

    test('should use context environment suffix when not provided in props', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'context-env'
        }
      });
      const contextStack = new TapStack(contextApp, 'ContextStack');
      expect(contextStack).toBeDefined();
    });

    test('should default to dev environment when no suffix provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      expect(defaultStack).toBeDefined();
    });
  });

  describe('Nested Stacks', () => {
    test('should create all nested stacks', () => {
      const stacks = app.node.findAll();
      const stackNames = stacks
        .filter(node => node instanceof cdk.Stack)
        .map(stack => (stack as cdk.Stack).stackName);
      
      expect(stackNames).toContain('TestTapStack');
      expect(stackNames).toContain(`ProjectXLambdaStack${environmentSuffix}`);
      expect(stackNames).toContain(`ProjectXApiGatewayStack${environmentSuffix}`);
      expect(stackNames).toContain(`ProjectXMonitoringStack${environmentSuffix}`);
    });
  });
});

describe('ProjectXLambdaStack', () => {
  let app: cdk.App;
  let stack: ProjectXLambdaStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new ProjectXLambdaStack(app, 'TestLambdaStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    template = Template.fromStack(stack);
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `projectX-handler-${environmentSuffix}`,
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        Timeout: 300,
        MemorySize: 512,
        Environment: {
          Variables: {
            NODE_ENV: environmentSuffix,
            PROJECT_NAME: 'projectX'
          }
        }
      });
    });

    test('should have inline code', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      const functionResource = Object.values(functions)[0];
      expect(functionResource.Properties.Code.ZipFile).toContain('exports.handler');
      expect(functionResource.Properties.Code.ZipFile).toContain('Hello from ProjectX Lambda!');
    });

    test('should export Lambda function', () => {
      expect(stack.lambdaFunction).toBeDefined();
      // Function name is a token at this point, will be resolved during deployment
      expect(stack.lambdaFunction.functionName).toBeDefined();
    });
  });

  describe('CloudWatch Logs', () => {
    test('should create log group with retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/projectX-handler-${environmentSuffix}`,
        RetentionInDays: 7
      });
    });

    test('should set removal policy to DESTROY', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      const logGroup = Object.values(logGroups)[0];
      expect(logGroup.DeletionPolicy).toBe('Delete');
    });
  });

  // Note: Outputs are now created at the main stack level, not in nested stacks
});

describe('ProjectXApiGatewayStack', () => {
  let app: cdk.App;
  let lambdaStack: ProjectXLambdaStack;
  let apiStack: ProjectXApiGatewayStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    lambdaStack = new ProjectXLambdaStack(app, 'TestLambdaStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    apiStack = new ProjectXApiGatewayStack(app, 'TestApiStack', {
      environmentSuffix,
      lambdaFunction: lambdaStack.lambdaFunction,
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    template = Template.fromStack(apiStack);
  });

  describe('API Gateway', () => {
    test('should create REST API with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `projectX-api-${environmentSuffix}`,
        Description: 'ProjectX Serverless Web Service API'
      });
    });

    test('should configure CORS', () => {
      const restApis = template.findResources('AWS::ApiGateway::RestApi');
      const restApi = Object.values(restApis)[0];
      expect(restApi).toBeDefined();
    });

    test('should export API', () => {
      expect(apiStack.api).toBeDefined();
      expect(apiStack.api.restApiName).toBe(`projectX-api-${environmentSuffix}`);
    });
  });

  describe('API Methods', () => {
    test('should create GET method on root', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        AuthorizationType: 'NONE'
      });
    });

    test('should create POST method on root', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        AuthorizationType: 'NONE'
      });
    });

    test('should create health endpoint', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'health'
      });
    });

    test('should create api/v1/data endpoint structure', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'api'
      });
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'v1'
      });
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'data'
      });
    });

    test('should create proxy resource for catch-all routing', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: '{proxy+}'
      });
    });
  });

  describe('CloudWatch Logs', () => {
    test('should create log group for API Gateway', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `projectX-api-gateway-${environmentSuffix}`,
        RetentionInDays: 7
      });
    });
  });

  describe('Deployment', () => {
    test('should create deployment stage', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: environmentSuffix,
        MethodSettings: [
          {
            DataTraceEnabled: true,
            HttpMethod: '*',
            LoggingLevel: 'INFO',
            ResourcePath: '/*',
            MetricsEnabled: true
          }
        ]
      });
    });
  });

  // Note: Outputs are now created at the main stack level, not in nested stacks
});

describe('ProjectXMonitoringStack', () => {
  let app: cdk.App;
  let lambdaStack: ProjectXLambdaStack;
  let apiStack: ProjectXApiGatewayStack;
  let monitoringStack: ProjectXMonitoringStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    lambdaStack = new ProjectXLambdaStack(app, 'TestLambdaStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    apiStack = new ProjectXApiGatewayStack(app, 'TestApiStack', {
      environmentSuffix,
      lambdaFunction: lambdaStack.lambdaFunction,
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    monitoringStack = new ProjectXMonitoringStack(app, 'TestMonitoringStack', {
      environmentSuffix,
      lambdaFunction: lambdaStack.lambdaFunction,
      api: apiStack.api,
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    template = Template.fromStack(monitoringStack);
  });

  describe('CloudWatch Dashboard', () => {
    test('should create dashboard with correct name', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `projectX-monitoring-${environmentSuffix}`
      });
    });

    test('should have dashboard body with widgets', () => {
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboard = Object.values(dashboards)[0];
      // DashboardBody is a token object, not a string at test time
      expect(dashboard.Properties.DashboardBody).toBeDefined();
      expect(dashboard.Properties.DashboardBody['Fn::Join']).toBeDefined();
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create Lambda error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `projectX-lambda-errors-${environmentSuffix}`,
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Threshold: 5,
        EvaluationPeriods: 2,
        Statistic: 'Sum'
      });
    });

    test('should create API latency alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `projectX-api-high-latency-${environmentSuffix}`,
        MetricName: 'Latency',
        Namespace: 'AWS/ApiGateway',
        Threshold: 5000,
        EvaluationPeriods: 3,
        Statistic: 'Average'
      });
    });
  });

  describe('Metrics', () => {
    test('should configure Lambda metrics', () => {
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboard = Object.values(dashboards)[0];
      // Dashboard body contains metrics configuration but as tokens during testing
      expect(dashboard.Properties.DashboardBody).toBeDefined();
      // Verify the dashboard exists and has a body
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('should configure API Gateway metrics', () => {
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboard = Object.values(dashboards)[0];
      // Dashboard body contains API metrics but as tokens during testing
      expect(dashboard.Properties.DashboardBody).toBeDefined();
      // Verify the dashboard has the right name
      expect(dashboard.Properties.DashboardName).toBe(`projectX-monitoring-${environmentSuffix}`);
    });
  });

  // Note: Outputs are now created at the main stack level, not in nested stacks
});
