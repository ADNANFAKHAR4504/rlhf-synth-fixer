import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { MonitoringStack } from '../lib/monitoring-stack.mjs';

describe('MonitoringStack Unit Tests', () => {
  let app;
  let stack;
  let template;
  let mockLambdaStack;
  const environmentSuffix = 'test';
  const mockApi = {
    restApiId: 'mock-api-id',
    url: 'https://mock-api.execute-api.us-west-2.amazonaws.com/test',
  };

  beforeEach(() => {
    app = new cdk.App();
    
    // Create a separate stack for mock Lambda functions
    const mockStack = new cdk.Stack(app, 'MockStack');
    const mockLambda = new lambda.Function(mockStack, 'MockLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline('exports.handler = async () => ({ statusCode: 200 });'),
    });

    mockLambdaStack = {
      userManagementFunction: mockLambda,
      productCatalogFunction: mockLambda,
      orderProcessingFunction: mockLambda,
    };

    stack = new MonitoringStack(app, 'TestMonitoringStack', {
      environmentSuffix,
      api: mockApi,
      lambdaStack: mockLambdaStack,
    });
    template = Template.fromStack(stack);
  });

  describe('SNS Topic Configuration', () => {
    test('should create SNS topic for alarms', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `prod-serverless-alarms-${environmentSuffix}`,
        DisplayName: 'Serverless Infrastructure Alarms',
      });
    });
  });

  describe('API Gateway Alarms', () => {
    test('should create 4XX error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `prod-api-4xx-errors-${environmentSuffix}`,
        AlarmDescription: 'API Gateway 4xx error rate is too high',
        MetricName: '4XXError',
        Namespace: 'AWS/ApiGateway',
        Threshold: 10,
        EvaluationPeriods: 2,
      });
    });

    test('should create 5XX error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `prod-api-5xx-errors-${environmentSuffix}`,
        AlarmDescription: 'API Gateway 5xx error rate is too high',
        MetricName: '5XXError',
        Namespace: 'AWS/ApiGateway',
        Threshold: 5,
        EvaluationPeriods: 2,
      });
    });

    test('should use correct dimensions for alarms', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: '4XXError',
        Dimensions: [
          {
            Name: 'ApiName',
            Value: 'prod-MyAPI',
          },
          {
            Name: 'Stage',
            Value: environmentSuffix,
          },
        ],
      });
    });

    test('should use SUM statistic for error metrics', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: '4XXError',
        Statistic: 'Sum',
        Period: 300,
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `prod-serverless-dashboard-${environmentSuffix}`,
      });
    });

    test('should include API Gateway request widget', () => {
      const resources = template.toJSON().Resources;
      const dashboard = Object.values(resources).find(r => r.Type === 'AWS::CloudWatch::Dashboard');
      const bodyStr = dashboard.Properties.DashboardBody['Fn::Join'][1].join('');
      const body = JSON.parse(bodyStr);
      
      const requestWidget = body.widgets.flat().find(w => w.properties?.title === 'API Gateway Requests');
      expect(requestWidget).toBeDefined();
      expect(requestWidget.properties.metrics[0]).toContain('AWS/ApiGateway');
      expect(requestWidget.properties.metrics[0]).toContain('Count');
    });

    test('should include API Gateway latency widget', () => {
      const resources = template.toJSON().Resources;
      const dashboard = Object.values(resources).find(r => r.Type === 'AWS::CloudWatch::Dashboard');
      const bodyStr = dashboard.Properties.DashboardBody['Fn::Join'][1].join('');
      const body = JSON.parse(bodyStr);
      
      const latencyWidget = body.widgets.flat().find(w => w.properties?.title === 'API Gateway Latency');
      expect(latencyWidget).toBeDefined();
      expect(latencyWidget.properties.metrics[0]).toContain('AWS/ApiGateway');
      expect(latencyWidget.properties.metrics[0]).toContain('Latency');
    });

    test('should include error widgets', () => {
      const resources = template.toJSON().Resources;
      const dashboard = Object.values(resources).find(r => r.Type === 'AWS::CloudWatch::Dashboard');
      const bodyStr = dashboard.Properties.DashboardBody['Fn::Join'][1].join('');
      const body = JSON.parse(bodyStr);
      
      const errorWidget4xx = body.widgets.flat().find(w => w.properties?.title === 'API Gateway 4XX Errors');
      const errorWidget5xx = body.widgets.flat().find(w => w.properties?.title === 'API Gateway 5XX Errors');
      
      expect(errorWidget4xx).toBeDefined();
      expect(errorWidget5xx).toBeDefined();
    });

    test('should have correct widget dimensions', () => {
      const resources = template.toJSON().Resources;
      const dashboard = Object.values(resources).find(r => r.Type === 'AWS::CloudWatch::Dashboard');
      const bodyStr = dashboard.Properties.DashboardBody['Fn::Join'][1].join('');
      const body = JSON.parse(bodyStr);
      
      body.widgets.flat().forEach(widget => {
        if (widget.width) expect(widget.width).toBe(12);
        if (widget.height) expect(widget.height).toBe(6);
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should output alarm topic ARN', () => {
      template.hasOutput('AlarmTopicArn', {
        Description: 'SNS Topic ARN for alarms',
      });
    });

    test('should output dashboard URL', () => {
      template.hasOutput('DashboardUrl', {
        Description: 'CloudWatch Dashboard URL',
      });
    });
  });

  describe('Monitoring Best Practices', () => {
    test('should have appropriate thresholds for 4XX errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: '4XXError',
        Threshold: 10,
      });
    });

    test('should have appropriate thresholds for 5XX errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: '5XXError',
        Threshold: 5,
      });
    });

    test('should use 5-minute periods for alarms', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Period: 300,
      });
    });

    test('should require 2 evaluation periods', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        EvaluationPeriods: 2,
      });
    });
  });

  describe('Production Configuration', () => {
    test('should use prod naming convention for resources', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: Match.stringLikeRegexp('^prod-'),
      });
      
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('^prod-'),
      });
      
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp('^prod-'),
      });
    });

    test('should include environment suffix in all resource names', () => {
      const resources = template.toJSON().Resources;
      const topic = Object.values(resources).find(r => r.Type === 'AWS::SNS::Topic');
      const alarms = Object.values(resources).filter(r => r.Type === 'AWS::CloudWatch::Alarm');
      const dashboard = Object.values(resources).find(r => r.Type === 'AWS::CloudWatch::Dashboard');
      
      expect(topic.Properties.TopicName).toContain(environmentSuffix);
      alarms.forEach(alarm => {
        expect(alarm.Properties.AlarmName).toContain(environmentSuffix);
      });
      expect(dashboard.Properties.DashboardName).toContain(environmentSuffix);
    });
  });
});