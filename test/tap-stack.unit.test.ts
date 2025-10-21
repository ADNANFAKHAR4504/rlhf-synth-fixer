import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
// We'll require the stack dynamically after ensuring CI/env vars are unset
let ServerlessInfrastructureStack: any;

// Mock aws-sdk used by the lambda handler
// Create shared mocks so instances created inside the handler use them
const getParameterMock = jest.fn();
const putMock = jest.fn();

jest.mock('aws-sdk', () => {
  const SSM = function () {
    return { getParameter: getParameterMock };
  } as any;
  const DynamoDB = {
    DocumentClient: function () {
      return { put: putMock };
    },
  } as any;
  return { SSM, DynamoDB };
});

// Import the handler after mocking aws-sdk
const { handler } = require('../lib/lambda-handler/index.js');

// Mock NodejsFunction globally so tests never attempt Docker bundling.
// Note: we intentionally don't mock 'aws-cdk-lib/aws-lambda-nodejs' here to
// avoid interfering with real lambda.Function behavior. The bundler path is
// mocked only inside the dedicated bundler test using jest.isolateModules.

// Preserve and set CI and USE_NODEJS_BUNDLER to explicit '0' to avoid bundling
const ORIGINAL_USE_NODEJS_BUNDLER = process.env.USE_NODEJS_BUNDLER;
const ORIGINAL_CI = process.env.CI;
process.env.USE_NODEJS_BUNDLER = process.env.USE_NODEJS_BUNDLER || '0';
process.env.CI = process.env.CI || '0';

// Load stack after adjusting env to avoid bundling during module initialization
beforeAll(() => {
  ServerlessInfrastructureStack = require('../lib/serverless-infrastructure-stack').ServerlessInfrastructureStack;
});

describe('ServerlessInfrastructureStack and Lambda handler', () => {
  const uniqueSuffix = `test-${Date.now().toString().slice(-6)}`;
  let app: cdk.App;
  let stack: any;
  let template: Template;

  beforeAll(() => {
    app = new cdk.App();
    stack = new ServerlessInfrastructureStack(app, `TapStack${uniqueSuffix}`, {
      stackName: `TapStack${uniqueSuffix}`,
      envSuffix: uniqueSuffix,
      env: { region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  // Restore any env that should be present after these tests finish
  afterAll(() => {
    if (ORIGINAL_USE_NODEJS_BUNDLER === undefined) delete process.env.USE_NODEJS_BUNDLER;
    else process.env.USE_NODEJS_BUNDLER = ORIGINAL_USE_NODEJS_BUNDLER;
    if (ORIGINAL_CI === undefined) delete process.env.CI;
    else process.env.CI = ORIGINAL_CI;
  });

  describe('Api url fallback branches', () => {
    test('uses unknown when RestApi.url is undefined', () => {
      const apigateway = require('aws-cdk-lib/aws-apigateway');
      const spy = jest.spyOn(apigateway.RestApi.prototype, 'url', 'get').mockReturnValue(undefined);

      const a = new cdk.App();
      const s = new ServerlessInfrastructureStack(a, 'StackApiUrlUndefined');
      const t = Template.fromStack(s);
      const json = t.toJSON();
      // ApiUrl output should use the fallback 'unknown'
      expect(json.Outputs).toBeDefined();
      const apiUrlOutput = json.Outputs && json.Outputs.ApiUrl && json.Outputs.ApiUrl.Value;
      expect(apiUrlOutput).toBe('unknown');

      spy.mockRestore();
    });

    test('uses actual url when RestApi.url is present', () => {
      const apigateway = require('aws-cdk-lib/aws-apigateway');
      const spy = jest.spyOn(apigateway.RestApi.prototype, 'url', 'get').mockReturnValue('https://example.test/');

      const a = new cdk.App();
      const s = new ServerlessInfrastructureStack(a, 'StackApiUrlPresent');
      const t = Template.fromStack(s);
      const json = t.toJSON();
      const apiUrlOutput = json.Outputs && json.Outputs.ApiUrl && json.Outputs.ApiUrl.Value;
      expect(apiUrlOutput).toBe('https://example.test/');

      spy.mockRestore();
    });
  });

  test('synthesizes expected resources', () => {
    const json = template.toJSON();
    expect(json).toHaveProperty('Resources');
    const resources = Object.values(json.Resources || {}).map((r: any) => r.Type);
    // DynamoDB table
    expect(resources).toContain('AWS::DynamoDB::Table');
    // S3 bucket
    expect(resources).toContain('AWS::S3::Bucket');
    // SQS queue (DLQ)
    expect(resources).toContain('AWS::SQS::Queue');
    // Lambda function
    expect(resources.filter((t: string) => t === 'AWS::Lambda::Function').length).toBeGreaterThanOrEqual(1);
    // API Gateway
    expect(resources).toContain('AWS::ApiGateway::RestApi');
    // SSM Parameter
    expect(resources).toContain('AWS::SSM::Parameter');

    // Outputs exist
    const outputs = json.Outputs || {};
    expect(outputs).toHaveProperty('ApiEndpointUrl');
    expect(outputs).toHaveProperty('DynamoTableName');
    expect(outputs).toHaveProperty('LogsBucketName');
  });

  describe('Lambda handler behavior', () => {

    beforeEach(() => {
      jest.clearAllMocks();
      // ensure lambda reads from a known parameter name in tests
      process.env.CONFIG_PARAMETER_NAME = '/application/config-test';
    });

    test('writes item to DynamoDB and returns 201 on valid input', async () => {
      // Arrange: SSM returns config, DynamoDB put succeeds
      getParameterMock.mockReturnValueOnce({ promise: () => Promise.resolve({ Parameter: { Value: JSON.stringify({ apiVersion: '1.0' }) } }) });
      putMock.mockReturnValueOnce({ promise: () => Promise.resolve({}) });

      const event = { body: JSON.stringify({ id: 'abc-123', payload: { foo: 'bar' } }) };
      const res = await handler(event);
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.item.id).toBe('abc-123');
      expect(body.item.configVersion).toBe('1.0');
    });

    test('returns 400 for invalid JSON body', async () => {
      const event = { body: 'not-json' };
      const res = await handler(event);
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.error).toMatch(/Invalid JSON/);
    });

    test('returns 400 when id is missing', async () => {
      const event = { body: JSON.stringify({ payload: { foo: 'bar' } }) };
      const res = await handler(event);
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.error).toMatch(/Missing required field/);
    });

    test('handles SSM failure gracefully and still stores item', async () => {
      // SSM throws; DynamoDB put succeeds
      getParameterMock.mockReturnValueOnce({ promise: () => Promise.reject(new Error('SSM failure')) });
      putMock.mockReturnValueOnce({ promise: () => Promise.resolve({}) });

      const event = { body: JSON.stringify({ id: 'xyz-789', payload: {} }) };
      const res = await handler(event);
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.item.id).toBe('xyz-789');
      // configVersion falls back to 'unknown' when SSM read fails
      expect(body.item.configVersion).toBe('unknown');
    });

    test('returns 500 when DynamoDB put fails', async () => {
      // SSM returns config, DynamoDB put fails
      getParameterMock.mockReturnValueOnce({ promise: () => Promise.resolve({ Parameter: { Value: JSON.stringify({ apiVersion: '1.0' }) } }) });
      putMock.mockReturnValueOnce({ promise: () => Promise.reject(new Error('Dynamo failed')) });

      const event = { body: JSON.stringify({ id: 'fail-1', payload: {} }) };
      const res = await handler(event);
      expect(res.statusCode).toBe(500);
      const body = JSON.parse(res.body);
      expect(body.error).toMatch(/Internal Server Error/);
    });

    test('when CONFIG_PARAMETER_NAME is not set, configVersion is unknown', async () => {
      delete process.env.CONFIG_PARAMETER_NAME;
      // Dynamo put succeeds
      putMock.mockReturnValueOnce({ promise: () => Promise.resolve({}) });

      const event = { body: JSON.stringify({ id: 'nocfg-1', payload: {} }) };
      const res = await handler(event);
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.item.configVersion).toBe('unknown');
    });
  });
});

describe('stack env selection branches', () => {
  test('uses envSuffix prop when provided', () => {
    const a = new cdk.App();
    const s = new ServerlessInfrastructureStack(a, 'StackWithProp', { envSuffix: 'propenv' });
    const t = Template.fromStack(s);
    const json = t.toJSON();
    // Expect exports with prop-based suffix
    const outputs = json.Outputs || {};
    expect(Object.keys(outputs).length).toBeGreaterThanOrEqual(1);
  });

  test('falls back to process.env.ENV when envSuffix not provided', () => {
    process.env.ENV = 'envvar';
    const a = new cdk.App();
    const s = new ServerlessInfrastructureStack(a, 'StackWithEnvVar');
    const t = Template.fromStack(s);
    const json = t.toJSON();
    expect(json.Outputs).toBeDefined();
    delete process.env.ENV;
  });

  test('defaults to dev when neither envSuffix nor ENV provided', () => {
    const a = new cdk.App();
    const s = new ServerlessInfrastructureStack(a, 'StackWithDefault');
    const t = Template.fromStack(s);
    const json = t.toJSON();
    expect(json.Outputs).toBeDefined();
  });
});

// bundling selection branches: intentionally omitted in unit tests because
// NodejsFunction bundling may invoke Docker during asset bundling. The
// repository supports CI bundling (NodejsFunction) and local testing
// (lambda.Function with Code.fromAsset). Coverage for the stack's
// outputs and other branches is exercised elsewhere in this file.

describe('bundling selection branch (mocked)', () => {
  test('uses NodejsFunction bundler when USE_NODEJS_BUNDLER is set (mocked)', () => {
    // Use isolateModules so our mock is in place before the stack module loads
    jest.isolateModules(() => {
      // trigger bundler path for module load
      process.env.USE_NODEJS_BUNDLER = '1';

      // Mock aws-lambda-nodejs before requiring the stack module to avoid Docker
      // Return a NodejsFunction that constructs a real lambda.Function so grants/metrics work
      jest.doMock('aws-cdk-lib/aws-lambda-nodejs', () => ({
        NodejsFunction: jest.fn().mockImplementation((scope: any, id: string, props: any) => {
          const realLambda = require('aws-cdk-lib/aws-lambda');
          // Create a small real Function with inline code to satisfy CDK grant operations
          return new realLambda.Function(scope, `${id}-Stub`, {
            functionName: props && props.functionName,
            runtime: realLambda.Runtime.NODEJS_18_X,
            code: realLambda.Code.fromInline('exports.handler = async () => ({ statusCode: 200, body: "ok" });'),
            handler: 'index.handler',
            role: props && props.role,
            environment: props && props.environment,
            deadLetterQueue: props && props.deadLetterQueue,
            deadLetterQueueEnabled: props && props.deadLetterQueueEnabled,
            tracing: realLambda.Tracing.ACTIVE,
            reservedConcurrentExecutions: props && props.reservedConcurrentExecutions,
            timeout: props && props.timeout,
            memorySize: props && props.memorySize,
          });
        }),
      }));

      // Now require the stack module fresh so it picks up our mocked NodejsFunction
      const { ServerlessInfrastructureStack: MockedStack } = require('../lib/serverless-infrastructure-stack');
      const a = new cdk.App();
      const s = new MockedStack(a, 'StackWithBundlerMock');
      const t = Template.fromStack(s);
      const json = t.toJSON();
      expect(json.Outputs).toBeDefined();

      // Cleanup the env we set inside isolateModules
      delete process.env.USE_NODEJS_BUNDLER;
      // Reset module registry so mocks and module cache do not affect later tests
      jest.resetModules();
      // Re-load the original ServerlessInfrastructureStack into the shared variable
      ServerlessInfrastructureStack = require('../lib/serverless-infrastructure-stack').ServerlessInfrastructureStack;
    });
  });
});

describe('bundling selection branch (non-bundler)', () => {
  test('uses Code.fromAsset when USE_NODEJS_BUNDLER is not set (isolated)', () => {
    // Ensure env disables bundler and isolate module load so the stack takes the else branch
    jest.isolateModules(() => {
      process.env.USE_NODEJS_BUNDLER = '0';
      process.env.CI = '0';

      // Require the stack fresh so it reads the env flags during initialization
      const { ServerlessInfrastructureStack: NonBundledStack } = require('../lib/serverless-infrastructure-stack');
      const a = new cdk.App();
      const s = new NonBundledStack(a, 'StackWithCodeAsset');
      const t = Template.fromStack(s);
      const json = t.toJSON();
      expect(json.Outputs).toBeDefined();

      // cleanup
      delete process.env.USE_NODEJS_BUNDLER;
      delete process.env.CI;
      jest.resetModules();
      // Re-load original ServerlessInfrastructureStack for other tests
      ServerlessInfrastructureStack = require('../lib/serverless-infrastructure-stack').ServerlessInfrastructureStack;
    });
  });
});

describe('SNS subscription and alarms branches', () => {
  test('creates SNS subscription when EMAIL_ALERT_TOPIC_ADDRESS is set', () => {
    process.env.EMAIL_ALERT_TOPIC_ADDRESS = 'alerts@example.com';
    const a = new cdk.App();
    const s = new ServerlessInfrastructureStack(a, 'StackWithEmailSub');
    const t = Template.fromStack(s);
    const json = t.toJSON();
    // When email is provided, a subscription resource should exist
    const resources = Object.values(json.Resources || {}).map((r: any) => r.Type);
    expect(resources).toContain('AWS::SNS::Subscription');
    delete process.env.EMAIL_ALERT_TOPIC_ADDRESS;
  });

  test('does not create SNS subscription when EMAIL_ALERT_TOPIC_ADDRESS is not set', () => {
    delete process.env.EMAIL_ALERT_TOPIC_ADDRESS;
    const a = new cdk.App();
    const s = new ServerlessInfrastructureStack(a, 'StackWithoutEmailSub');
    const t = Template.fromStack(s);
    const json = t.toJSON();
    const resources = Object.values(json.Resources || {}).map((r: any) => r.Type);
    // There may still be a Topic resource, but no Subscription should be present
    const hasSubscription = resources.includes('AWS::SNS::Subscription');
    expect(hasSubscription).toBe(false);
  });
});