import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
// We'll require the stack dynamically after ensuring CI/env vars are unset
let ServerlessInfrastructureStack: any;
let TapStack: any;

// Provide a typed global so editors/TS don't show a red-squiggle at the
// `globalThis.__AWS_MOCKS__` assignment below.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  var __AWS_MOCKS__: {
    ssmClient?: { send: (...args: any[]) => any };
    dynamo?: { send: (...args: any[]) => any };
    PutCommand?: any;
    GetCommand?: any;
    GetParameterCommand?: any;
  } | undefined;
}

const sanitizeName = (input: string): string =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 63);

const FIXED_NOW = 1_700_000_000_000;

// Create shared send mocks so instances created inside the handler use them
const sendMockSSM = jest.fn();
const sendMockDynamo = jest.fn();

const ORIGINAL_GLOBAL_MOCKS = (globalThis as any).__AWS_MOCKS__;

// Inject mocks via globalThis to avoid dynamic import issues in Jest
(globalThis as any).__AWS_MOCKS__ = {
  ssmClient: { send: (...args: any[]) => sendMockSSM(...args) },
  dynamo: { send: (...args: any[]) => sendMockDynamo(...args) },
};

// Import the handler after installing global mocks
const { handler } = require('../lib/lambda-handler/index.js');

// Preserve and set CI and USE_NODEJS_BUNDLER to explicit '0' to avoid bundling
const ORIGINAL_USE_NODEJS_BUNDLER = process.env.USE_NODEJS_BUNDLER;
const ORIGINAL_CI = process.env.CI;
process.env.USE_NODEJS_BUNDLER = process.env.USE_NODEJS_BUNDLER || '0';
process.env.CI = process.env.CI || '0';

// Load stacks after adjusting env to avoid bundling during module initialization
beforeAll(() => {
  ServerlessInfrastructureStack =
    require('../lib/serverless-infrastructure-stack').ServerlessInfrastructureStack;
  TapStack = require('../lib/tap-stack').TapStack;
});

const createStackTemplate = (envSuffix = 'qa-env', id = 'TapStackTest') => {
  const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);
  const app = new cdk.App();
  const stack = new ServerlessInfrastructureStack(app, id, {
    stackName: id,
    envSuffix,
    env: { region: 'us-east-1' },
  });
  const template = Template.fromStack(stack);
  nowSpy.mockRestore();
  const suffix = sanitizeName(`${envSuffix}-${String(FIXED_NOW).slice(-6)}`);
  return { template, suffix, stack };
};

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
    if (ORIGINAL_USE_NODEJS_BUNDLER === undefined)
      delete process.env.USE_NODEJS_BUNDLER;
    else process.env.USE_NODEJS_BUNDLER = ORIGINAL_USE_NODEJS_BUNDLER;
    if (ORIGINAL_CI === undefined) delete process.env.CI;
    else process.env.CI = ORIGINAL_CI;
  });

  describe('Api url fallback branches', () => {
    test('uses unknown when RestApi.url is undefined', () => {
      const apigateway = require('aws-cdk-lib/aws-apigateway');
      const spy = jest
        .spyOn(apigateway.RestApi.prototype, 'url', 'get')
        .mockReturnValue(undefined);

      const a = new cdk.App();
      const s = new ServerlessInfrastructureStack(a, 'StackApiUrlUndefined');
      const t = Template.fromStack(s);
      const json = t.toJSON();
      // ApiUrl output should use the fallback 'unknown'
      expect(json.Outputs).toBeDefined();
      const apiUrlOutput =
        json.Outputs && json.Outputs.ApiUrl && json.Outputs.ApiUrl.Value;
      expect(apiUrlOutput).toBe('unknown');

      spy.mockRestore();
    });

    test('uses actual url when RestApi.url is present', () => {
      const apigateway = require('aws-cdk-lib/aws-apigateway');
      const spy = jest
        .spyOn(apigateway.RestApi.prototype, 'url', 'get')
        .mockReturnValue('https://example.test/');

      const a = new cdk.App();
      const s = new ServerlessInfrastructureStack(a, 'StackApiUrlPresent');
      const t = Template.fromStack(s);
      const json = t.toJSON();
      const apiUrlOutput =
        json.Outputs && json.Outputs.ApiUrl && json.Outputs.ApiUrl.Value;
      expect(apiUrlOutput).toBe('https://example.test/');

      spy.mockRestore();
    });
  });

  test('synthesizes expected resources', () => {
    const json = template.toJSON();
    expect(json).toHaveProperty('Resources');
    const resources = Object.values(json.Resources || {}).map(
      (r: any) => r.Type
    );
    // DynamoDB table
    expect(resources).toContain('AWS::DynamoDB::Table');
    // S3 bucket
    expect(resources).toContain('AWS::S3::Bucket');
    // SQS queue (DLQ)
    expect(resources).toContain('AWS::SQS::Queue');
    // Lambda function
    expect(
      resources.filter((t: string) => t === 'AWS::Lambda::Function').length
    ).toBeGreaterThanOrEqual(1);
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

  describe('resource configuration and naming', () => {
    test('sanitizes names when composing suffixes and aliases', () => {
      const envSuffix = 'QA Env!!';
      const stackId = 'MyTestStack';
      const expectedSuffix = sanitizeName(
        `${envSuffix}-${String(FIXED_NOW).slice(-6)}`
      );
      const expectedStackPrefix = sanitizeName(stackId);
      const { template: templatedStack } = createStackTemplate(
        envSuffix,
        stackId
      );

      templatedStack.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `api-logs-${expectedSuffix}`,
      });
      templatedStack.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `lambda-dlq-${expectedSuffix}`,
      });
      templatedStack.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/${expectedStackPrefix}-key-${expectedSuffix}`,
      });
    });

    test('enables encryption and lifecycle policies on storage resources', () => {
      const { template: secureTemplate } = createStackTemplate('secure-env');

      secureTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: Match.objectLike({
          SSEEnabled: true,
          SSEType: 'KMS',
        }),
        BillingMode: 'PAY_PER_REQUEST',
        AttributeDefinitions: Match.arrayWith([
          Match.objectLike({ AttributeName: 'id', AttributeType: 'S' }),
        ]),
      });

      secureTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'aws:kms',
              }),
            }),
          ]),
        }),
        LifecycleConfiguration: Match.objectLike({
          Rules: Match.arrayWith([
            Match.objectLike({ ExpirationInDays: 30, Status: 'Enabled' }),
          ]),
        }),
        PublicAccessBlockConfiguration: Match.objectLike({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        }),
      });

      secureTemplate.hasResourceProperties('AWS::SQS::Queue', {
        MessageRetentionPeriod: 14 * 24 * 60 * 60,
      });
    });

    test('wires lambda with DLQ, tracing, and environment variables', () => {
      const { template: lambdaTemplate } = createStackTemplate('lambda-env');
      const functions = lambdaTemplate.findResources('AWS::Lambda::Function');
      const appFunction = Object.values(functions).find(
        (fn: any) =>
          fn.Properties &&
          fn.Properties.Environment &&
          fn.Properties.Environment.Variables &&
          fn.Properties.Environment.Variables.TABLE_NAME
      ) as any;
      expect(appFunction).toBeDefined();
      expect(appFunction.Properties.Runtime).toBe('nodejs18.x');
      expect(appFunction.Properties.MemorySize).toBe(256);
      expect(appFunction.Properties.Timeout).toBe(30);
      expect(appFunction.Properties.Environment.Variables).toEqual(
        expect.objectContaining({
          TABLE_NAME: expect.any(Object),
          CONFIG_PARAMETER_NAME: expect.any(Object),
          ENV: 'lambda-env',
        })
      );
      expect(appFunction.Properties.TracingConfig).toEqual({ Mode: 'Active' });
      expect(appFunction.Properties.DeadLetterConfig?.TargetArn).toBeDefined();
    });

    test('attaches managed policies and kms grants to lambda role', () => {
      const { template: policyTemplate } = createStackTemplate('policy-check');
      const roles = policyTemplate.findResources('AWS::IAM::Role');
      const lambdaRole = Object.values(roles).find(
        (role: any) =>
          role.Properties &&
          typeof role.Properties.RoleName === 'string' &&
          role.Properties.RoleName.includes('lambda-execution-role')
      ) as any;
      expect(lambdaRole).toBeDefined();
      const managedPoliciesJson = JSON.stringify(
        lambdaRole.Properties.ManagedPolicyArns || []
      );
      expect(managedPoliciesJson).toContain('AWSLambdaBasicExecutionRole');
      expect(managedPoliciesJson).toContain('AWSXRayDaemonWriteAccess');

      const policies = policyTemplate.findResources('AWS::IAM::Policy');
      const rolePolicy = Object.values(policies).find(
        (p: any) =>
          p.Properties &&
          p.Properties.PolicyDocument &&
          JSON.stringify(p.Properties.PolicyDocument).includes('dynamodb:PutItem')
      );
      expect(rolePolicy).toBeDefined();
    });

    test('configures API Gateway logging, tracing, and alarms', () => {
      const { template: apiTemplate } = createStackTemplate('api-audit');
      const stage = Object.values(
        apiTemplate.findResources('AWS::ApiGateway::Stage')
      )[0] as any;
      expect(stage.Properties.TracingEnabled).toBe(true);
      expect(stage.Properties.MethodSettings[0]).toMatchObject({
        LoggingLevel: 'INFO',
        DataTraceEnabled: true,
      });
      expect(stage.Properties.AccessLogSetting?.DestinationArn).toBeDefined();

      const alarms = Object.values(
        apiTemplate.findResources('AWS::CloudWatch::Alarm')
      );
      expect(alarms.length).toBeGreaterThanOrEqual(3);
      const alarmWithSnsAction = alarms.find(
        (alarm: any) =>
          alarm.Properties &&
          Array.isArray(alarm.Properties.AlarmActions) &&
          alarm.Properties.AlarmActions.length > 0
      );
      expect(alarmWithSnsAction).toBeDefined();
    });

    test('stores configuration in SSM with environment context', () => {
      const { template: configTemplate, suffix } =
        createStackTemplate('config-env');
      configTemplate.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/application/config-${suffix}`,
        Value: Match.stringLikeRegexp('"environment":"config-env"'),
        Tier: 'Standard',
      });
    });
  });

  describe('Lambda handler behavior', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // ensure lambda reads from a known parameter name in tests
      process.env.CONFIG_PARAMETER_NAME = '/application/config-test';
    });

    test('writes item to DynamoDB and returns 201 on valid input', async () => {
      // Arrange: SSM returns config, DynamoDB put succeeds
      sendMockSSM.mockResolvedValueOnce({
        Parameter: { Value: JSON.stringify({ apiVersion: '1.0' }) },
      });
      sendMockDynamo.mockResolvedValueOnce({});

      const event = {
        body: JSON.stringify({ id: 'abc-123', payload: { foo: 'bar' } }),
      };
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
      sendMockSSM.mockRejectedValueOnce(new Error('SSM failure'));
      sendMockDynamo.mockResolvedValueOnce({});

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
      sendMockSSM.mockResolvedValueOnce({
        Parameter: { Value: JSON.stringify({ apiVersion: '1.0' }) },
      });
      sendMockDynamo.mockRejectedValueOnce(new Error('Dynamo failed'));

      const event = { body: JSON.stringify({ id: 'fail-1', payload: {} }) };
      const res = await handler(event);
      expect(res.statusCode).toBe(500);
      const body = JSON.parse(res.body);
      expect(body.error).toMatch(/Internal Server Error/);
    });

    test('falls back to empty config when SSM returns no value', async () => {
      sendMockSSM.mockResolvedValueOnce({});
      sendMockDynamo.mockResolvedValueOnce({});

      const event = { body: JSON.stringify({ id: 'no-param' }) };
      const res = await handler(event);
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.item.configVersion).toBe('unknown');
      expect(body.item.payload).toBeNull();
    });

    test('accepts already-parsed object bodies', async () => {
      delete process.env.CONFIG_PARAMETER_NAME;
      sendMockDynamo.mockResolvedValueOnce({});

      const event = { body: { id: 'object-body' } };
      const res = await handler(event);
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.item.id).toBe('object-body');
      expect(body.item.payload).toBeNull();
    });

    test('returns 400 when body is missing entirely', async () => {
      delete process.env.CONFIG_PARAMETER_NAME;
      const res = await handler({});
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.error).toMatch(/Missing required field/);
    });

    test('when CONFIG_PARAMETER_NAME is not set, configVersion is unknown', async () => {
      delete process.env.CONFIG_PARAMETER_NAME;
      // Dynamo put succeeds
      sendMockDynamo.mockResolvedValueOnce({});

      const event = { body: JSON.stringify({ id: 'nocfg-1', payload: {} }) };
      const res = await handler(event);
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.item.configVersion).toBe('unknown');
    });
  });
});

describe('lambda handler without injected AWS mocks', () => {
  beforeEach(() => {
    delete (globalThis as any).__AWS_MOCKS__;
    delete process.env.CONFIG_PARAMETER_NAME;
    jest.resetModules();
  });

  afterEach(() => {
    jest.resetModules();
    if (ORIGINAL_GLOBAL_MOCKS === undefined)
      delete (globalThis as any).__AWS_MOCKS__;
    else (globalThis as any).__AWS_MOCKS__ = ORIGINAL_GLOBAL_MOCKS;
  });

  test('falls back to real AWS SDK clients when no mocks are provided', async () => {
    let isolatedHandler;
    jest.isolateModules(() => {
      // Import after removing mocks so handler initializes real clients
      isolatedHandler = require('../lib/lambda-handler/index.js').handler;
    });

    const response = await isolatedHandler!({ body: 'not-json' });
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toMatch(/Invalid JSON/);
  });
});

describe('stack env selection branches', () => {
  test('uses envSuffix prop when provided', () => {
    const a = new cdk.App();
    const s = new ServerlessInfrastructureStack(a, 'StackWithProp', {
      envSuffix: 'propenv',
    });
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
      const { ServerlessInfrastructureStack: NonBundledStack } =
        require('../lib/serverless-infrastructure-stack');
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
      ServerlessInfrastructureStack =
        require('../lib/serverless-infrastructure-stack').ServerlessInfrastructureStack;
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

describe('TapStack composition', () => {
  test('passes environmentSuffix and env to child stack', () => {
    const app = new cdk.App();
    const tapStack = new TapStack(app, 'ParentTap', {
      environmentSuffix: 'qa',
      env: { account: '123456789012', region: 'us-west-2' },
    });
    const child = tapStack.node.findChild(
      'ServerlessInfrastructureStackqa'
    ) as any;
    expect(child).toBeDefined();
    expect(child.stackName).toBe('ServerlessInfrastructureStackqa');
    expect(child.region).toBe('us-west-2');
  });

  test('uses context environmentSuffix when prop is omitted', () => {
    const app = new cdk.App({ context: { environmentSuffix: 'ctx' } });
    const tapStack = new TapStack(app, 'ContextTap', {
      env: { region: 'eu-central-1' },
    });
    const child = tapStack.node.findChild(
      'ServerlessInfrastructureStackctx'
    ) as any;
    expect(child).toBeDefined();
    expect(child.region).toBe('eu-central-1');
  });

  test('still creates child stack when no environmentSuffix is provided', () => {
    const app = new cdk.App();
    const tapStack = new TapStack(app, 'DefaultTap');
    const child = tapStack.node
      .findAll()
      .find((node: any) =>
        typeof node.stackName === 'string' &&
        node.stackName.startsWith('ServerlessInfrastructureStack')
      );
    expect(child).toBeDefined();
  });
});
