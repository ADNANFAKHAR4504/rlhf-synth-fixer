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
    const lambdas = template.findResources('AWS::Lambda::Function');
    const found = Object.values(lambdas).some((lambda: any) => {
      const props = lambda.Properties;
      return (
        props.FunctionName === 'lambda-nova-team-development' &&
        props.Runtime === 'nodejs18.x' &&
        props.Handler === 'index.handler' &&
        props.MemorySize === 1024 &&
        props.Timeout === 30 &&
        typeof props.Description === 'string' &&
        props.Description.includes('High-performance Lambda function') &&
        props.Environment &&
        props.Environment.Variables &&
        props.Environment.Variables.NODE_ENV === 'development' &&
        props.Environment.Variables.LOG_LEVEL === 'info'
      );
    });
    expect(found).toBe(true);
  });

  test('Creates an API Gateway HTTP API', () => {
    const apis = template.findResources('AWS::ApiGatewayV2::Api');
    const found = Object.values(apis).some((api: any) => {
      const props = api.Properties;
      return (
        props.Name === 'api-gateway-nova-team-development' &&
        props.ProtocolType === 'HTTP' &&
        typeof props.Description === 'string' &&
        props.Description.includes('HTTP API Gateway for nova-team development environment')
      );
    });
    expect(found).toBe(true);
  });

  test('Creates Lambda alias for provisioned concurrency', () => {
    const aliases = template.findResources('AWS::Lambda::Alias');
    const found = Object.values(aliases).some((alias: any) => {
      const props = alias.Properties;
      return (
        props.Name === 'live' &&
        typeof props.Description === 'string' &&
        props.Description.includes('Live alias for production traffic') &&
        props.ProvisionedConcurrencyConfig &&
        props.ProvisionedConcurrencyConfig.ProvisionedConcurrentExecutions === 1000
      );
    });
    expect(found).toBe(true);
  });

  test('Creates IAM Role for Lambda execution', () => {
    template.resourceCountIs('AWS::IAM::Role', 2); // LambdaExecutionRole and AutoScalingRole
    // Check that at least one role has the lambda principal
    const roles = template.findResources('AWS::IAM::Role');
    const hasLambdaPrincipal = Object.values(roles).some((role: any) => {
      return role.Properties.AssumeRolePolicyDocument.Statement.some((stmt: any) => {
        return stmt.Principal && stmt.Principal.Service === 'lambda.amazonaws.com';
      });
    });
    expect(hasLambdaPrincipal).toBe(true);
  });

  test('Creates Application Auto Scaling Target', () => {
    template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
      ServiceNamespace: 'lambda',
      ScalableDimension: 'lambda:function:ProvisionedConcurrency',
      MinCapacity: 50,
      MaxCapacity: 1000
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
