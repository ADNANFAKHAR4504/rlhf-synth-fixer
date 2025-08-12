import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack');
    template = Template.fromStack(stack);
  });

  test('Stack synthesizes successfully', () => {
    expect(template).toBeDefined();
    expect(stack.stackName).toBe('TestTapStack');
  });

  test('Creates a Lambda function with correct properties', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'lambda-nova-team-development',
      Runtime: 'nodejs18.x',
      Handler: 'index.handler',
      MemorySize: 1024,
      Timeout: 30,
      Description: expect.stringContaining('High-performance Lambda function'),
      Environment: {
        Variables: {
          NODE_ENV: 'development',
          LOG_LEVEL: 'info'
        }
      }
    });
  });

  test('Creates an API Gateway HTTP API', () => {
    template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
      Name: 'api-gateway-nova-team-development',
      ProtocolType: 'HTTP',
      Description: expect.stringContaining('HTTP API Gateway for nova-team development environment')
    });
  });

  test('Creates Lambda alias for provisioned concurrency', () => {
    template.hasResourceProperties('AWS::Lambda::Alias', {
      Name: 'live',
      Description: expect.stringContaining('Live alias for production traffic')
    });
  });

  test('Outputs API Gateway URL', () => {
    template.hasOutput('ApiGatewayUrl', {
      Description: 'HTTP API Gateway endpoint URL',
      Export: { Name: 'nova-team-development-api-url' }
    });
  });

  test('Outputs Lambda function name', () => {
    template.hasOutput('LambdaFunctionName', {
      Description: 'Lambda function name',
      Export: { Name: 'nova-team-development-lambda-name' }
    });
  });

  test('Outputs Lambda alias name', () => {
    template.hasOutput('LambdaAliasName', {
      Description: 'Lambda alias name for provisioned concurrency',
      Export: { Name: 'nova-team-development-lambda-alias' }
    });
  });

  test('Outputs Lambda log group name', () => {
    template.hasOutput('LogGroupName', {
      Description: 'CloudWatch Log Group name for Lambda function',
      Export: { Name: 'nova-team-development-log-group' }
    });
  });
});
