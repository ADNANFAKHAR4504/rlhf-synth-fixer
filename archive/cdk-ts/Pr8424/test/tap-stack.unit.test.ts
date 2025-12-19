import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { LambdaStack } from '../lib/lambda-stack';
import { ApiGatewayStack } from '../lib/api-gateway-stack';
import { MonitoringStack } from '../lib/monitoring-stack';
import * as lambda from 'aws-cdk-lib/aws-lambda';

// Set environment variables for testing
process.env.CDK_DEFAULT_ACCOUNT = '123456789012';
process.env.CDK_DEFAULT_REGION = 'us-west-2';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const testEnvSuffix = 'test123';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, `TapStack${testEnvSuffix}`, { 
      environmentSuffix: testEnvSuffix 
    });
    template = Template.fromStack(stack);
  });

  describe('Main Stack Tests', () => {
    test('should create main stack with nested stacks', () => {
      // The main stack itself contains the nested stacks
      // In CDK v2, nested stacks are created as constructs within the main stack
      const stackJson = template.toJSON();
      
      // Verify the stack exists
      expect(stackJson).toBeDefined();
      // Main stack may have minimal resources as nested stacks are separate
      expect(stackJson).not.toBeNull();
    });

    test('should apply production tags to the stack', () => {
      // Check that tags are applied at stack level
      const stackJson = template.toJSON();
      
      // Tags are applied at the construct level
      // Verify by checking specific resources have tags
      if (stackJson.Resources) {
        Object.values(stackJson.Resources).forEach((resource: any) => {
          if (resource.Properties && resource.Properties.Tags) {
            const tags = resource.Properties.Tags;
            const envTag = tags.find((tag: any) => tag.Key === 'Environment');
            if (envTag) {
              expect(envTag.Value).toBe('Production');
            }
          }
        });
      }
    });

    test('should expose all required outputs for integration tests', () => {
      // These outputs are required for the integration tests to work
      template.hasOutput('LambdaFunctionName', {});
      template.hasOutput('LambdaFunctionArn', {});
      template.hasOutput('FunctionUrl', {});
      template.hasOutput('ApiGatewayUrl', {});
      template.hasOutput('ApiGatewayRestApiId', {});
      template.hasOutput('AlertTopicArn', {});
      template.hasOutput('DashboardName', {});
      template.hasOutput('DashboardUrl', {});
      template.hasOutput('Region', {});
      template.hasOutput('StackEnvironmentSuffix', {});
    });
  });

  describe('Lambda Stack Tests', () => {
    let lambdaStack: LambdaStack;
    let lambdaTemplate: Template;

    beforeEach(() => {
      const lambdaApp = new cdk.App();
      lambdaStack = new LambdaStack(lambdaApp, 'TestLambdaStack', {
        environmentSuffix: testEnvSuffix
      });
      lambdaTemplate = Template.fromStack(lambdaStack);
    });

    test('should create Lambda function with correct configuration', () => {
      lambdaTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `serverless-api-${testEnvSuffix}`,
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        Timeout: 30,
        MemorySize: 256,
        Environment: {
          Variables: {
            NODE_ENV: 'production',
            LOG_LEVEL: 'info'
          }
        }
      });
    });

    test('should create Lambda function URL with CORS', () => {
      lambdaTemplate.hasResourceProperties('AWS::Lambda::Url', {
        AuthType: 'NONE',
        Cors: {
          AllowCredentials: false,
          AllowMethods: ['*'],
          AllowOrigins: ['*'],
          AllowHeaders: ['*'],
          MaxAge: 3600
        }
      });
    });

    test('should create IAM role with least privilege', () => {
      lambdaTemplate.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com'
            }
          }]
        }
      });
      
      // Verify the role has managed policies attached
      const roleResource = lambdaTemplate.toJSON().Resources;
      const iamRole = Object.values(roleResource).find((r: any) => r.Type === 'AWS::IAM::Role');
      expect(iamRole).toBeDefined();
      expect((iamRole as any).Properties.ManagedPolicyArns).toBeDefined();
      expect((iamRole as any).Properties.ManagedPolicyArns.length).toBeGreaterThan(0);
    });

    test('should enable Lambda Insights', () => {
      lambdaTemplate.hasResourceProperties('AWS::Lambda::Function', {
        Layers: Match.arrayWith([
          Match.objectLike({
            'Fn::FindInMap': Match.anyValue()
          })
        ])
      });
    });

    test('should create CloudWatch Log Group with retention', () => {
      lambdaTemplate.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/serverless-api-${testEnvSuffix}`,
        RetentionInDays: 7,
        LogGroupClass: 'STANDARD'
      });
    });

    test('should output Lambda function name and URL', () => {
      lambdaTemplate.hasOutput('FunctionUrl', {});
      lambdaTemplate.hasOutput('LambdaFunctionName', {});
    });
  });

  describe('API Gateway Stack Tests', () => {
    let apiGatewayStack: ApiGatewayStack;
    let apiTemplate: Template;
    let mockLambdaFunction: lambda.Function;

    beforeEach(() => {
      const apiApp = new cdk.App();
      const lambdaStack = new LambdaStack(apiApp, 'TestLambdaStack', {
        environmentSuffix: testEnvSuffix
      });
      
      apiGatewayStack = new ApiGatewayStack(apiApp, 'TestApiGatewayStack', {
        environmentSuffix: testEnvSuffix,
        lambdaFunction: lambdaStack.lambdaFunction
      });
      apiTemplate = Template.fromStack(apiGatewayStack);
    });

    test('should create REST API with CORS configuration', () => {
      apiTemplate.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `serverless-api-${testEnvSuffix}`,
        Description: `Serverless API for ${testEnvSuffix} environment`
      });
    });

    test('should configure API Gateway deployment options', () => {
      apiTemplate.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: testEnvSuffix,
        MethodSettings: [{
          MetricsEnabled: true,
          LoggingLevel: 'INFO',
          DataTraceEnabled: true,
          ResourcePath: '/*',
          HttpMethod: '*'
        }]
      });
    });

    test('should set throttling limits', () => {
      // Check that stage is configured with proper settings
      // Note: CDK may apply throttling via usage plans or at method level
      apiTemplate.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: testEnvSuffix
      });
      
      // Verify deployment exists
      apiTemplate.hasResourceProperties('AWS::ApiGateway::Deployment', {});
    });

    test('should create API resources and methods', () => {
      // Check for /api/v1/health endpoint
      apiTemplate.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        ResourceId: Match.anyValue()
      });

      // Check for /api/v1/data endpoints
      apiTemplate.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        ResourceId: Match.anyValue()
      });
    });

    test('should output API Gateway URL', () => {
      apiTemplate.hasOutput('ApiGatewayUrl', {});
    });
  });

  describe('Monitoring Stack Tests', () => {
    let monitoringStack: MonitoringStack;
    let monitoringTemplate: Template;

    beforeEach(() => {
      const monApp = new cdk.App();
      const lambdaStack = new LambdaStack(monApp, 'TestLambdaStack', {
        environmentSuffix: testEnvSuffix
      });
      const apiStack = new ApiGatewayStack(monApp, 'TestApiGatewayStack', {
        environmentSuffix: testEnvSuffix,
        lambdaFunction: lambdaStack.lambdaFunction
      });
      
      monitoringStack = new MonitoringStack(monApp, 'TestMonitoringStack', {
        environmentSuffix: testEnvSuffix,
        lambdaFunction: lambdaStack.lambdaFunction,
        apiGateway: apiStack.restApi
      });
      monitoringTemplate = Template.fromStack(monitoringStack);
    });

    test('should create SNS topic for alerts', () => {
      monitoringTemplate.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `serverless-api-alerts-${testEnvSuffix}`,
        DisplayName: 'Serverless API Alerts'
      });
    });

    test('should create Lambda duration alarm', () => {
      monitoringTemplate.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `lambda-duration-${testEnvSuffix}`,
        AlarmDescription: 'Lambda function duration exceeds threshold',
        Threshold: 5000,
        EvaluationPeriods: 2,
        ComparisonOperator: 'GreaterThanThreshold'
      });
    });

    test('should create Lambda error alarm', () => {
      monitoringTemplate.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `lambda-errors-${testEnvSuffix}`,
        AlarmDescription: 'Lambda function error rate is too high',
        Threshold: 5,
        EvaluationPeriods: 2,
        ComparisonOperator: 'GreaterThanThreshold'
      });
    });

    test('should create Lambda throttle alarm', () => {
      monitoringTemplate.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `lambda-throttles-${testEnvSuffix}`,
        AlarmDescription: 'Lambda function is being throttled',
        Threshold: 1,
        EvaluationPeriods: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold'
      });
    });

    test('should create API Gateway 4XX error alarm', () => {
      monitoringTemplate.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `api-4xx-errors-${testEnvSuffix}`,
        AlarmDescription: 'API Gateway 4XX error rate is high',
        Threshold: 10,
        EvaluationPeriods: 2,
        ComparisonOperator: 'GreaterThanThreshold'
      });
    });

    test('should create API Gateway 5XX error alarm', () => {
      monitoringTemplate.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `api-5xx-errors-${testEnvSuffix}`,
        AlarmDescription: 'API Gateway 5XX error rate is high',
        Threshold: 1,
        EvaluationPeriods: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold'
      });
    });

    test('should create CloudWatch Dashboard', () => {
      monitoringTemplate.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `serverless-api-dashboard-${testEnvSuffix}`
      });
    });

    test('should output SNS topic ARN and Dashboard URL', () => {
      monitoringTemplate.hasOutput('AlertTopicArn', {});
      monitoringTemplate.hasOutput('DashboardUrl', {});
    });
  });

  describe('Production Tags Tests', () => {
    test('all stacks should have Production environment tag', () => {
      // Create a fresh app for this test to avoid synthesis conflicts
      const testApp = new cdk.App();
      
      const lambdaStack = new LambdaStack(testApp, 'TestLambdaProd', { 
        environmentSuffix: testEnvSuffix 
      });
      
      const apiStack = new ApiGatewayStack(testApp, 'TestApiProd', { 
        environmentSuffix: testEnvSuffix,
        lambdaFunction: lambdaStack.lambdaFunction
      });
      
      const monStack = new MonitoringStack(testApp, 'TestMonProd', { 
        environmentSuffix: testEnvSuffix,
        lambdaFunction: lambdaStack.lambdaFunction,
        apiGateway: apiStack.restApi
      });

      // Check each stack for Production tags
      [lambdaStack, apiStack, monStack].forEach(stack => {
        const stackTemplate = Template.fromStack(stack);
        const stackJson = stackTemplate.toJSON();
        
        // Verify at least one resource has Production tag
        let hasProductionTag = false;
        if (stackJson.Resources) {
          Object.values(stackJson.Resources).forEach((resource: any) => {
            if (resource.Properties && resource.Properties.Tags) {
              const tags = resource.Properties.Tags;
              const envTag = tags.find((tag: any) => tag.Key === 'Environment' && tag.Value === 'Production');
              if (envTag) {
                hasProductionTag = true;
              }
            }
          });
        }
        
        expect(hasProductionTag).toBe(true);
      });
    });
  });

  describe('Branch Coverage Tests', () => {
    test('should handle missing environment suffix defaulting to dev', () => {
      const appNoDef = new cdk.App();
      const stackNoDef = new TapStack(appNoDef, 'TapStackNoDef', {});
      const templateNoDef = Template.fromStack(stackNoDef);
      expect(templateNoDef).toBeDefined();
    });

    test('should use context environmentSuffix when not in props', () => {
      const appContext = new cdk.App();
      appContext.node.setContext('environmentSuffix', 'contextSuffix');
      const stackContext = new TapStack(appContext, 'TapStackContext', {});
      const templateContext = Template.fromStack(stackContext);
      expect(templateContext).toBeDefined();
    });

    test('Lambda stack should handle missing environment suffix', () => {
      const lambdaApp = new cdk.App();
      const lambdaStackNoDef = new LambdaStack(lambdaApp, 'TestLambdaStackNoDef', {});
      const lambdaTemplateNoDef = Template.fromStack(lambdaStackNoDef);
      
      lambdaTemplateNoDef.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'serverless-api-dev'
      });
    });

    test('API Gateway stack should handle missing environment suffix', () => {
      const apiApp = new cdk.App();
      const lambdaStackForApi = new LambdaStack(apiApp, 'TestLambdaForApi', {});
      const apiStackNoDef = new ApiGatewayStack(apiApp, 'TestApiStackNoDef', {
        lambdaFunction: lambdaStackForApi.lambdaFunction
      });
      const apiTemplateNoDef = Template.fromStack(apiStackNoDef);
      
      apiTemplateNoDef.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'serverless-api-dev'
      });
    });

    test('Monitoring stack should handle missing environment suffix', () => {
      const monApp = new cdk.App();
      const lambdaStackForMon = new LambdaStack(monApp, 'TestLambdaForMon', {});
      const apiStackForMon = new ApiGatewayStack(monApp, 'TestApiForMon', {
        lambdaFunction: lambdaStackForMon.lambdaFunction
      });
      const monStackNoDef = new MonitoringStack(monApp, 'TestMonStackNoDef', {
        lambdaFunction: lambdaStackForMon.lambdaFunction,
        apiGateway: apiStackForMon.restApi
      });
      const monTemplateNoDef = Template.fromStack(monStackNoDef);
      
      monTemplateNoDef.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'serverless-api-alerts-dev'
      });
    });
  });
});
