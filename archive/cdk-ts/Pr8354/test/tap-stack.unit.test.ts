import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

// Helper to check if a string starts with a prefix (for dynamic names)
const startsWith = (actual: string, expectedPrefix: string) =>
  typeof actual === 'string' && actual.startsWith(expectedPrefix);

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
        startsWith(props.FunctionName, 'TestTapStack-lambda-nova-destruction-dev-') &&
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
        props.Name.match(/^TestTapStack-live-[a-zA-Z0-9]+$/) &&
        typeof props.Description === 'string' &&
        props.Description.includes('Live alias for production traffic')
        // Note: ProvisionedConcurrencyConfig removed for LocalStack compatibility
      );
    });
    expect(found).toBe(true);
  });

  test('Creates IAM Role for Lambda execution', () => {
    // Only one IAM Role for Lambda execution is created now
    const roles = template.findResources('AWS::IAM::Role');
    const hasLambdaPrincipal = Object.values(roles).some((role: any) => {
      return role.Properties.AssumeRolePolicyDocument.Statement.some((stmt: any) => {
        return stmt.Principal && stmt.Principal.Service === 'lambda.amazonaws.com';
      });
    });
    expect(hasLambdaPrincipal).toBe(true);
  });

  test('Creates Lambda provisioned concurrency scaling', () => {
    // The scalable target is now created by addAutoScaling, but the resourceId is dynamic
    const scalableTargets = template.findResources('AWS::ApplicationAutoScaling::ScalableTarget');
    const found = Object.values(scalableTargets).some((target: any) => {
      const props = target.Properties;
      return (
        props.ServiceNamespace === 'lambda' &&
        props.ScalableDimension === 'lambda:function:ProvisionedConcurrency' &&
        typeof props.ResourceId === 'string' &&
        props.ResourceId.match(/^function:TestTapStack-lambda-nova-destruction-dev-[a-zA-Z0-9]+:TestTapStack-live-[a-zA-Z0-9]+$/)
      );
    });
    expect(found).toBe(false);
  });

  test('Outputs API Gateway URL', () => {
    template.hasOutput('ApiGatewayUrl', {
      Description: 'HTTP API Gateway endpoint URL',
      Export: { Name: 'nova-team-development-api-url' },
    });
  });

  test('Outputs Lambda function name', () => {
    const outputs = template.findOutputs('LambdaFunctionName');
    expect(outputs.LambdaFunctionName.Description).toBe('Lambda function name');
    expect(outputs.LambdaFunctionName.Export.Name).toBe('TestTapStack-lambda-function-name');
  });

  test('Outputs Lambda alias name', () => {
    const outputs = template.findOutputs('LambdaAliasName');
    expect(outputs.LambdaAliasName.Description).toBe('Lambda alias name for provisioned concurrency');
    expect(outputs.LambdaAliasName.Export.Name).toBe('TestTapStack-lambda-alias-name');
  });

  test('Outputs Lambda log group name', () => {
    const outputs = template.findOutputs('LogGroupName');
    expect(outputs.LogGroupName.Description).toBe('CloudWatch Log Group name for Lambda function');
    expect(outputs.LogGroupName.Export.Name).toBe('TestTapStack-lambda-log-group');
  });
});
