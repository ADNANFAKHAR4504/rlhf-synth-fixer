import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { normalizeEvent } from '../lib/runtime/normalize-event';

const globalAny = globalThis as any;

jest.mock('aws-cdk-lib/aws-lambda-nodejs', () => {
  const lambdaModule = require('aws-cdk-lib/aws-lambda');
  const cloudwatchModule = require('aws-cdk-lib/aws-cloudwatch');

  if (!globalAny.__nodejsFunctionPropsStore) {
    globalAny.__nodejsFunctionPropsStore = [];
  }
  const store = globalAny.__nodejsFunctionPropsStore as Array<{ id: string; props: any }>;

  class MockNodejsFunction extends lambdaModule.Function {
    public readonly addPermission: jest.Mock;
    public readonly metricInvocations: jest.Mock;

    constructor(scope: any, id: string, props: any) {
      super(scope, id, {
        runtime: props.runtime,
        handler: props.handler,
        timeout: props.timeout,
        memorySize: props.memorySize,
        description: props.description,
        environment: props.environment,
        role: props.role,
        tracing: props.tracing,
        functionName: props.functionName,
        code: lambdaModule.Code.fromInline('exports.handler = async () => {};'),
      });

      this.addPermission = jest.fn();
      this.metricInvocations = jest.fn(() =>
        new cloudwatchModule.Metric({ namespace: 'AWS/Lambda', metricName: 'Invocations' })
      );

      store.push({ id, props });
    }
  }

  const actual = jest.requireActual('aws-cdk-lib/aws-lambda-nodejs');
  return {
    NodejsFunction: MockNodejsFunction,
    OutputFormat: actual.OutputFormat,
  };
});

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: class { },
}));

jest.mock('@aws-sdk/lib-dynamodb', () => {
  if (!globalAny.__dynamoSendMock) {
    globalAny.__dynamoSendMock = jest.fn();
  }
  const sendMock: jest.Mock = globalAny.__dynamoSendMock;
  const clientInstance = { send: (...args: any[]) => sendMock(...args) };

  class BaseCommand {
    public readonly input: any;
    constructor(input: any) {
      this.input = input;
    }
  }

  return {
    DynamoDBDocumentClient: {
      from: jest.fn(() => clientInstance),
    },
    GetCommand: class extends BaseCommand { },
    ScanCommand: class extends BaseCommand { },
    PutCommand: class extends BaseCommand { },
    UpdateCommand: class extends BaseCommand { },
    DeleteCommand: class extends BaseCommand { },
    QueryCommand: class extends BaseCommand { },
    TransactWriteCommand: class extends BaseCommand { },
  };
});

jest.mock('@aws-sdk/client-sns', () => {
  if (!globalAny.__snsSendMock) {
    globalAny.__snsSendMock = jest.fn();
  }
  const sendMock: jest.Mock = globalAny.__snsSendMock;

  return {
    SNSClient: class {
      public send(command: any) {
        return sendMock(command);
      }
    },
    PublishCommand: class {
      public readonly input: any;
      constructor(input: any) {
        this.input = input;
      }
    },
  };
});

jest.mock('@aws-sdk/client-secrets-manager', () => {
  if (!globalAny.__secretsSendMock) {
    globalAny.__secretsSendMock = jest.fn();
  }
  const sendMock: jest.Mock = globalAny.__secretsSendMock;

  return {
    SecretsManagerClient: class {
      public send(command: any) {
        return sendMock(command);
      }
    },
    GetSecretValueCommand: class {
      public readonly input: any;
      constructor(input: any) {
        this.input = input;
      }
    },
  };
});

import { TapStack } from '../lib/tap-stack';

type UserHandler = typeof import('../lib/runtime/user-service').handler;
type ProductHandler = typeof import('../lib/runtime/product-service').handler;
type OrderHandler = typeof import('../lib/runtime/order-service').handler;

const getNodejsFunctionStore = () =>
  (globalAny.__nodejsFunctionPropsStore || []) as Array<{ id: string; props: any }>;
const getDynamoMock = (): jest.Mock => globalAny.__dynamoSendMock;
const getSnsMock = (): jest.Mock => globalAny.__snsSendMock;
const getSecretsMock = (): jest.Mock => globalAny.__secretsSendMock;

const loadUserHandler = (): UserHandler => {
  let mod: { handler: UserHandler } | undefined;
  jest.isolateModules(() => {
    mod = require('../lib/runtime/user-service');
  });
  return mod!.handler;
};

const loadProductHandler = (): ProductHandler => {
  let mod: { handler: ProductHandler } | undefined;
  jest.isolateModules(() => {
    mod = require('../lib/runtime/product-service');
  });
  return mod!.handler;
};

const loadOrderHandler = (): OrderHandler => {
  let mod: { handler: OrderHandler } | undefined;
  jest.isolateModules(() => {
    mod = require('../lib/runtime/order-service');
  });
  return mod!.handler;
};

const createEvent = (overrides: Partial<APIGatewayProxyEvent>): APIGatewayProxyEvent =>
({
  resource: '/',
  path: overrides.path ?? '/',
  httpMethod: overrides.httpMethod ?? 'GET',
  headers: {},
  multiValueHeaders: {},
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  pathParameters: overrides.pathParameters ?? {},
  stageVariables: null,
  requestContext: {} as any,
  body: overrides.body ?? null,
  isBase64Encoded: false,
  ...overrides,
} as APIGatewayProxyEvent);

const expectCommandCall = (call: any, matcher: any) => {
  expect(call[0].input).toEqual(expect.objectContaining(matcher));
};

describe('TapStack infrastructure', () => {
  beforeEach(() => {
    getNodejsFunctionStore().length = 0;
  });

  test('sanitises parameters, applies tags and configures KMS policy', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'UnitTestStack', {
      environmentSuffix: 'qa123',
      env: { account: '111111111111', region: 'us-west-2' },
    });

    const template = Template.fromStack(stack);
    const templateJson = template.toJSON();

    expect(templateJson.Parameters.EnvironmentName.AllowedPattern).toBe('^[a-z0-9-]+$');

    const keyResource = Object.values<any>(templateJson.Resources).find(
      resource => resource.Type === 'AWS::KMS::Key'
    );
    const policyStatements = keyResource?.Properties?.KeyPolicy?.Statement as any[];
    expect(policyStatements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Sid: 'AllowCloudWatchLogsUse',
          Condition: expect.objectContaining({
            ArnLike: expect.objectContaining({
              'kms:EncryptionContext:aws:logs:arn': expect.anything(),
            }),
          }),
        }),
      ])
    );

    const renderedTags = stack.tags.renderTags();
    renderedTags.forEach((tag: { Value: any; }) => {
      expect(tag.Value).toMatch(/^[a-zA-Z+\-=._:/]+$/);
    });

    const functions = getNodejsFunctionStore();
    expect(functions).toHaveLength(3);
    functions.forEach(entry => {
      expect(entry.props.environment).toEqual(expect.any(Object));
      expect(entry.props.functionName.length).toBeLessThanOrEqual(64);
    });
  });

  test('creates billing alarm when region is us-east-1', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'BillingStack', {
      environmentSuffix: 'qa123',
      env: { account: '111111111111', region: 'us-east-1' },
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      MetricName: 'EstimatedCharges',
      Namespace: 'AWS/Billing',
    });
  });

  test('handles edge case sanitization properly', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'EdgeCaseStack', {
      environmentSuffix: '123!@#$%^&*()_+-={}[]|\\:";\'<>?,./',
      env: { account: '111111111111', region: 'us-west-2' },
    });

    // Verify stack creation doesn't fail with complex suffix
    expect(stack).toBeDefined();

    // Test with empty environmentSuffix
    const stack2 = new TapStack(app, 'EmptyStack', {
      environmentSuffix: '',
      env: { account: '111111111111', region: 'us-west-2' },
    });
    expect(stack2).toBeDefined();

    // Test with only special characters that should result in 'dev'
    const stack3 = new TapStack(app, 'SpecialStack', {
      environmentSuffix: '!@#$%^&*()',
      env: { account: '111111111111', region: 'us-west-2' },
    });
    expect(stack3).toBeDefined();
  });
});

describe('normalizeEvent helper', () => {
  it('returns default proxy event when input is not an object', () => {
    const normalized = normalizeEvent(undefined);
    expect(normalized.httpMethod).toBe('GET');
    expect(normalized.path).toBe('/');
    expect(normalized.body).toBeNull();
  });

  it('passes through API Gateway v1 events unchanged', () => {
    const original: APIGatewayProxyEvent = {
      resource: '/users',
      path: '/users',
      httpMethod: 'POST',
      headers: { 'content-type': 'application/json' },
      multiValueHeaders: {},
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      pathParameters: null,
      stageVariables: null,
      requestContext: {} as APIGatewayProxyEvent['requestContext'],
      body: JSON.stringify({ name: 'sample' }),
      isBase64Encoded: false,
    };

    const normalized = normalizeEvent(original);
    expect(normalized).toBe(original);
  });

  it('parses serialized proxy events embedded in the body', () => {
    const serialized = JSON.stringify({
      resource: '/orders',
      path: '/orders',
      httpMethod: 'PATCH',
      headers: {},
      multiValueHeaders: {},
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      pathParameters: null,
      stageVariables: null,
      requestContext: {} as APIGatewayProxyEvent['requestContext'],
      body: JSON.stringify({ status: 'SHIPPED' }),
      isBase64Encoded: false,
    });

    const normalized = normalizeEvent({ body: serialized });
    expect(normalized.httpMethod).toBe('PATCH');
    expect(normalized.path).toBe('/orders');
    expect(normalized.body).toBe(JSON.stringify({ status: 'SHIPPED' }));
  });

  it('maps Function URL payloads into proxy event shape', () => {
    const functionUrlEvent = {
      headers: { host: 'example.lambda-url.aws' },
      multiValueHeaders: { host: ['example.lambda-url.aws'] },
      requestContext: {
        http: {
          method: 'post',
          path: '/orders/abc123',
        },
      },
      rawPath: '/orders/abc123',
      pathParameters: { orderId: 'abc123' },
      queryStringParameters: { expand: 'true' },
      multiValueQueryStringParameters: { expand: ['true', 'audit'] },
      stageVariables: { stage: 'dev' },
      resource: '/orders/{orderId}',
      body: { sample: 'payload' },
      isBase64Encoded: true,
    };

    const normalized = normalizeEvent(functionUrlEvent);
    expect(normalized.httpMethod).toBe('POST');
    expect(normalized.path).toBe('/orders/abc123');
    expect(normalized.body).toBe(JSON.stringify({ sample: 'payload' }));
    expect(normalized.isBase64Encoded).toBe(true);
    expect(normalized.pathParameters).toEqual({ orderId: 'abc123' });
    expect(normalized.multiValueQueryStringParameters).toEqual({
      expand: ['true', 'audit'],
    });
  });

  it('handles missing body on Function URL payloads', () => {
    const normalized = normalizeEvent({
      requestContext: { http: { method: 'delete', path: '/items/1' } },
      rawPath: '/items/1',
    });

    expect(normalized.body).toBeNull();
    expect(normalized.pathParameters).toEqual({ itemId: '1' });
  });

  it('ignores malformed serialized body content', () => {
    const normalized = normalizeEvent({
      body: '{not json',
      requestContext: { http: { method: 'post', path: '/malformed' } },
      rawPath: '/malformed',
    });

    expect(normalized.httpMethod).toBe('POST');
    expect(normalized.path).toBe('/malformed');
    expect(normalized.pathParameters).toBeNull();
  });

  it('stringifies complex objects when no method is provided', () => {
    const nonSerializable = {
      path: '/fallback',
      resource: '/fallback',
      headers: { test: 'value' },
      body: {
        toJSON() {
          throw new Error('fail');
        },
      },
    };

    const normalized = normalizeEvent(nonSerializable);
    expect(normalized.httpMethod).toBe('GET');
    expect(normalized.path).toBe('/fallback');
    expect(normalized.body).toBe('[object Object]');
    expect(normalized.pathParameters).toBeNull();
  });

  it('retains provided pathParameters', () => {
    const normalized = normalizeEvent({
      requestContext: { http: { method: 'get', path: '/orders/abc123' } },
      rawPath: '/orders/abc123',
      pathParameters: { orderId: 'custom-id' },
    });

    expect(normalized.pathParameters).toEqual({ orderId: 'custom-id' });
  });

  it('does not derive ids for nested resource paths', () => {
    const normalized = normalizeEvent({
      requestContext: { http: { method: 'get', path: '/orders/abc/items' } },
      rawPath: '/orders/abc/items',
    });

    expect(normalized.pathParameters).toBeNull();
  });

  it('derives identifier keys for singular resource segments', () => {
    const normalized = normalizeEvent({
      requestContext: { http: { method: 'get', path: '/team/alpha' } },
      rawPath: '/team/alpha',
    });

    expect(normalized.pathParameters).toEqual({ teamId: 'alpha' });
  });

  it('handles events with no requestContext method but other fields', () => {
    const normalized = normalizeEvent({
      headers: { 'content-type': 'application/json' },
      path: '/custom',
      resource: '/custom',
      body: { test: 'data' },
      isBase64Encoded: true,
    });

    expect(normalized.httpMethod).toBe('GET');
    expect(normalized.path).toBe('/custom');
    expect(normalized.resource).toBe('/custom');
    expect(normalized.body).toBe('{"test":"data"}');
    expect(normalized.isBase64Encoded).toBe(true);
  });

  it('handles events with requestContext but no method', () => {
    const normalized = normalizeEvent({
      requestContext: { http: {} },
      path: '/test',
      headers: { host: 'example.com' },
    });

    expect(normalized.httpMethod).toBe('GET');
    expect(normalized.path).toBe('/test');
    expect(normalized.headers).toEqual({ host: 'example.com' });
  });

  it('handles function URL events with missing rawPath', () => {
    const normalized = normalizeEvent({
      requestContext: { http: { method: 'get', path: '/orders/123' } },
      pathParameters: { orderId: '123' },
    });

    expect(normalized.httpMethod).toBe('GET');
    expect(normalized.path).toBe('/orders/123');
    expect(normalized.pathParameters).toEqual({ orderId: '123' });
  });

  it('uses fallback path resolution order', () => {
    const normalized = normalizeEvent({
      requestContext: { http: { method: 'post' } },
      rawPath: '/raw-path',
      path: '/backup-path',
    });

    expect(normalized.httpMethod).toBe('POST');
    expect(normalized.path).toBe('/raw-path');
  });

  it('handles null/undefined values in coerceBody', () => {
    let normalized = normalizeEvent({
      requestContext: { http: { method: 'post', path: '/test' } },
      body: null,
    });
    expect(normalized.body).toBeNull();

    normalized = normalizeEvent({
      requestContext: { http: { method: 'post', path: '/test' } },
      body: undefined,
    });
    expect(normalized.body).toBeNull();
  });

  it('handles events with no requestContext http property', () => {
    const normalized = normalizeEvent({
      requestContext: {},
      headers: { 'x-custom': 'header' },
      path: '/fallback-test',
      resource: '/fallback-test',
      queryStringParameters: { param: 'value' },
      multiValueQueryStringParameters: { multiParam: ['value1', 'value2'] },
      stageVariables: { stage: 'test' },
      body: { data: 'test' },
      isBase64Encoded: false,
    });

    expect(normalized.httpMethod).toBe('GET');
    expect(normalized.path).toBe('/fallback-test');
    expect(normalized.resource).toBe('/fallback-test');
    expect(normalized.headers).toEqual({ 'x-custom': 'header' });
    expect(normalized.queryStringParameters).toEqual({ param: 'value' });
    expect(normalized.multiValueQueryStringParameters).toEqual({ multiParam: ['value1', 'value2'] });
    expect(normalized.stageVariables).toEqual({ stage: 'test' });
    expect(normalized.body).toBe('{"data":"test"}');
    expect(normalized.isBase64Encoded).toBe(false);
  });

  it('handles empty path segments that cannot be decoded', () => {
    const normalized = normalizeEvent({
      requestContext: { http: { method: 'get', path: '/items/' } },
      rawPath: '/items/',
    });

    expect(normalized.pathParameters).toBeNull();
  });
});

describe('user-service handler', () => {
  const baseContext = { awsRequestId: 'req-123' } as any;
  let userHandler: UserHandler;
  let dynamoMock: jest.Mock;
  let snsMock: jest.Mock;
  let secretsMock: jest.Mock;

  beforeEach(() => {
    userHandler = loadUserHandler();
    dynamoMock = getDynamoMock();
    snsMock = getSnsMock();
    secretsMock = getSecretsMock();
    dynamoMock.mockReset();
    snsMock.mockReset();
    secretsMock.mockReset();
    process.env.USER_TABLE_NAME = 'users-table';
    process.env.NOTIFICATION_TOPIC_ARN = 'arn:aws:sns:us-west-2:123:topic';
    process.env.API_SECRET_ARN = 'arn:aws:secretsmanager:us-west-2:123:secret';
  });

  afterEach(() => {
    delete process.env.USER_TABLE_NAME;
    delete process.env.NOTIFICATION_TOPIC_ARN;
    delete process.env.API_SECRET_ARN;
  });

  test('returns 500 when configuration is missing', async () => {
    delete process.env.USER_TABLE_NAME;

    const response = await userHandler(createEvent({ httpMethod: 'GET' }), baseContext);
    expect(response.statusCode).toBe(500);
  });

  test('returns 404 when user lookup misses', async () => {
    dynamoMock.mockResolvedValueOnce({});

    const response = await userHandler(
      createEvent({
        httpMethod: 'GET',
        path: '/users/user-1',
        pathParameters: { userId: 'user-1' },
      }),
      baseContext
    );

    expect(response.statusCode).toBe(404);
  });

  test('returns user when lookup succeeds', async () => {
    dynamoMock.mockResolvedValueOnce({ Item: { userId: 'user-1', name: 'Ada' } });

    const response = await userHandler(
      createEvent({
        httpMethod: 'GET',
        path: '/users/user-1',
        pathParameters: { userId: 'user-1' },
      }),
      baseContext
    );

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ userId: 'user-1', name: 'Ada' });
  });

  test('lists users when identifier is absent', async () => {
    dynamoMock.mockResolvedValueOnce({ Items: [{ userId: 'user-1' }] });

    const response = await userHandler(
      createEvent({ httpMethod: 'GET', path: '/users' }),
      baseContext
    );

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([{ userId: 'user-1' }]);
  });

  test('lists users falls back to empty array when scan returns no items', async () => {
    dynamoMock.mockResolvedValueOnce({});

    const response = await userHandler(
      createEvent({ httpMethod: 'GET', path: '/users' }),
      baseContext
    );

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([]);
  });

  test('POST without body returns 400', async () => {
    const response = await userHandler(
      createEvent({ httpMethod: 'POST', path: '/users' }),
      baseContext
    );

    expect(response.statusCode).toBe(400);
  });

  test('POST with missing fields returns 422', async () => {
    const response = await userHandler(
      createEvent({
        httpMethod: 'POST',
        path: '/users',
        body: JSON.stringify({ name: 'Ada' }),
      }),
      baseContext
    );

    expect(response.statusCode).toBe(422);
  });

  test('POST fails when secret payload missing string', async () => {
    dynamoMock.mockResolvedValueOnce({});
    secretsMock.mockResolvedValueOnce({});

    const response = await userHandler(
      createEvent({
        httpMethod: 'POST',
        path: '/users',
        body: JSON.stringify({ name: 'Ada', email: 'ada@example.com' }),
      }),
      baseContext
    );

    expect(response.statusCode).toBe(500);
    expect(snsMock).not.toHaveBeenCalled();
  });

  test('POST fails when apiKey missing from secret', async () => {
    dynamoMock.mockResolvedValueOnce({});
    secretsMock.mockResolvedValueOnce({ SecretString: JSON.stringify({}) });

    const response = await userHandler(
      createEvent({
        httpMethod: 'POST',
        path: '/users',
        body: JSON.stringify({ name: 'Ada', email: 'ada@example.com' }),
      }),
      baseContext
    );

    expect(response.statusCode).toBe(500);
    expect(snsMock).not.toHaveBeenCalled();
  });

  test('creates a user, publishes notification and caches secret reuse', async () => {
    dynamoMock.mockResolvedValue({});
    secretsMock.mockResolvedValueOnce({
      SecretString: JSON.stringify({ apiKey: 'abcd1234' }),
    });
    snsMock.mockResolvedValue({});

    const payload = JSON.stringify({ name: 'Ada', email: 'ada@example.com' });

    const first = await userHandler(
      createEvent({ httpMethod: 'POST', path: '/users', body: payload }),
      baseContext
    );
    expect(first.statusCode).toBe(201);
    expect(secretsMock).toHaveBeenCalledTimes(1);

    secretsMock.mockClear();
    snsMock.mockClear();

    const second = await userHandler(
      createEvent({ httpMethod: 'POST', path: '/users', body: payload }),
      baseContext
    );
    expect(second.statusCode).toBe(201);
    expect(secretsMock).not.toHaveBeenCalled();
    expect(snsMock).toHaveBeenCalledTimes(1);
  });

  test('PUT requires identifier and body', async () => {
    let response = await userHandler(
      createEvent({ httpMethod: 'PUT', path: '/users/user-1' }),
      baseContext
    );
    expect(response.statusCode).toBe(400);

    response = await userHandler(
      createEvent({
        httpMethod: 'PUT',
        path: '/users/user-1',
        pathParameters: { userId: 'user-1' },
      }),
      baseContext
    );
    expect(response.statusCode).toBe(400);
  });

  test('PUT updates selected fields and lowers email case', async () => {
    dynamoMock.mockResolvedValueOnce({});

    const response = await userHandler(
      createEvent({
        httpMethod: 'PUT',
        path: '/users/user-1',
        pathParameters: { userId: 'user-1' },
        body: JSON.stringify({ name: 'ADA', email: 'ADA@Example.COM' }),
      }),
      baseContext
    );

    expect(response.statusCode).toBe(200);
    const updateCall = dynamoMock.mock.calls.at(-1);
    expectCommandCall(updateCall, {
      ExpressionAttributeValues: expect.objectContaining({
        ':email': 'ada@example.com',
      }),
    });
  });

  test('PUT updates only name when email is not provided', async () => {
    dynamoMock.mockResolvedValueOnce({});

    const response = await userHandler(
      createEvent({
        httpMethod: 'PUT',
        path: '/users/user-1',
        pathParameters: { userId: 'user-1' },
        body: JSON.stringify({ name: 'New Name' }),
      }),
      baseContext
    );

    expect(response.statusCode).toBe(200);
    const updateCall = dynamoMock.mock.calls.at(-1);
    expectCommandCall(updateCall, {
      ExpressionAttributeValues: expect.objectContaining({
        ':name': 'New Name',
      }),
    });
  });

  test('PUT updates only email when name is not provided', async () => {
    dynamoMock.mockResolvedValueOnce({});

    const response = await userHandler(
      createEvent({
        httpMethod: 'PUT',
        path: '/users/user-1',
        pathParameters: { userId: 'user-1' },
        body: JSON.stringify({ email: 'new@example.com' }),
      }),
      baseContext
    );

    expect(response.statusCode).toBe(200);
    const updateCall = dynamoMock.mock.calls.at(-1);
    expectCommandCall(updateCall, {
      ExpressionAttributeValues: expect.objectContaining({
        ':email': 'new@example.com',
      }),
    });
  });

  test('PUT returns 422 when neither name nor email is provided', async () => {
    const response = await userHandler(
      createEvent({
        httpMethod: 'PUT',
        path: '/users/user-1',
        pathParameters: { userId: 'user-1' },
        body: JSON.stringify({}),
      }),
      baseContext
    );

    expect(response.statusCode).toBe(422);
    expect(JSON.parse(response.body).message).toBe('Provide at least one attribute to update.');
  });

  test('DELETE enforces identifier existence', async () => {
    const response = await userHandler(
      createEvent({ httpMethod: 'DELETE', path: '/users' }),
      baseContext
    );
    expect(response.statusCode).toBe(400);
  });

  test('DELETE removes user when identifier is provided', async () => {
    dynamoMock.mockResolvedValueOnce({});

    const response = await userHandler(
      createEvent({
        httpMethod: 'DELETE',
        path: '/users/user-1',
        pathParameters: { userId: 'user-1' },
      }),
      baseContext
    );

    expect(response.statusCode).toBe(204);
    const deleteCall = dynamoMock.mock.calls.at(-1);
    expectCommandCall(deleteCall, {
      TableName: 'users-table',
      Key: { userId: 'user-1' },
    });
  });

  test('returns 405 for unsupported method', async () => {
    const response = await userHandler(
      createEvent({ httpMethod: 'OPTIONS', path: '/users' }),
      baseContext
    );
    expect(response.statusCode).toBe(405);
  });

  test('bubbles datastore errors as 500', async () => {
    dynamoMock.mockRejectedValueOnce(new Error('boom'));

    const response = await userHandler(
      createEvent({ httpMethod: 'GET', path: '/users' }),
      baseContext
    );
    expect(response.statusCode).toBe(500);
  });
});

describe('product-service handler', () => {
  const baseContext = { awsRequestId: 'ctx-456' } as any;
  let productHandler: ProductHandler;
  let dynamoMock: jest.Mock;
  let snsMock: jest.Mock;

  beforeEach(() => {
    productHandler = loadProductHandler();
    dynamoMock = getDynamoMock();
    snsMock = getSnsMock();
    dynamoMock.mockReset();
    snsMock.mockReset();
    process.env.PRODUCT_TABLE_NAME = 'products-table';
    process.env.NOTIFICATION_TOPIC_ARN = 'arn:aws:sns:us-west-2:123:product-topic';
  });

  afterEach(() => {
    delete process.env.PRODUCT_TABLE_NAME;
    delete process.env.NOTIFICATION_TOPIC_ARN;
  });

  test('returns 500 when configuration is incomplete', async () => {
    delete process.env.PRODUCT_TABLE_NAME;
    const response = await productHandler(createEvent({ httpMethod: 'GET' }), baseContext);
    expect(response.statusCode).toBe(500);
  });

  test('lists products when identifier missing', async () => {
    dynamoMock.mockResolvedValueOnce({ Items: [{ productId: 'p1' }] });

    const response = await productHandler(
      createEvent({ httpMethod: 'GET', path: '/products' }),
      baseContext
    );

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([{ productId: 'p1' }]);
  });

  test('lists products returns empty list when Items missing', async () => {
    dynamoMock.mockResolvedValueOnce({});

    const response = await productHandler(
      createEvent({ httpMethod: 'GET', path: '/products' }),
      baseContext
    );

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([]);
  });

  test('bubbles datastore errors as 500', async () => {
    dynamoMock.mockRejectedValueOnce(new Error('boom'));

    const response = await productHandler(
      createEvent({ httpMethod: 'GET', path: '/products' }),
      baseContext
    );

    expect(response.statusCode).toBe(500);
  });

  test('retrieves product by identifier', async () => {
    dynamoMock.mockResolvedValueOnce({ Item: { productId: 'p1' } });

    const response = await productHandler(
      createEvent({
        httpMethod: 'GET',
        path: '/products/p1',
        pathParameters: { productId: 'p1' },
      }),
      baseContext
    );

    expect(response.statusCode).toBe(200);
  });

  test('returns 404 when product not found', async () => {
    dynamoMock.mockResolvedValueOnce({});

    const response = await productHandler(
      createEvent({
        httpMethod: 'GET',
        path: '/products/p1',
        pathParameters: { productId: 'p1' },
      }),
      baseContext
    );

    expect(response.statusCode).toBe(404);
  });

  test('POST validates request body fields', async () => {
    let response = await productHandler(
      createEvent({ httpMethod: 'POST', path: '/products' }),
      baseContext
    );
    expect(response.statusCode).toBe(400);

    response = await productHandler(
      createEvent({
        httpMethod: 'POST',
        path: '/products',
        body: JSON.stringify({ name: 'Widget' }),
      }),
      baseContext
    );
    expect(response.statusCode).toBe(422);

    response = await productHandler(
      createEvent({
        httpMethod: 'POST',
        path: '/products',
        body: JSON.stringify({ name: 'Widget', price: -1, inventory: 5 }),
      }),
      baseContext
    );
    expect(response.statusCode).toBe(422);

    response = await productHandler(
      createEvent({
        httpMethod: 'POST',
        path: '/products',
        body: JSON.stringify({ name: 'Widget', price: 1, inventory: -1 }),
      }),
      baseContext
    );
    expect(response.statusCode).toBe(422);
  });

  test('POST writes new product and publishes notification', async () => {
    dynamoMock.mockResolvedValueOnce({});
    snsMock.mockResolvedValueOnce({});

    const response = await productHandler(
      createEvent({
        httpMethod: 'POST',
        path: '/products',
        body: JSON.stringify({ name: 'Widget', price: 10.5, inventory: 5 }),
      }),
      baseContext
    );

    expect(response.statusCode).toBe(201);
    expect(dynamoMock).toHaveBeenCalledWith(
      expect.objectContaining({ input: expect.objectContaining({ TableName: 'products-table' }) })
    );
    expect(snsMock).toHaveBeenCalledTimes(1);
  });

  test('PUT validates price and inventory inputs', async () => {
    let response = await productHandler(
      createEvent({
        httpMethod: 'PUT',
        path: '/products/p1',
        pathParameters: { productId: 'p1' },
        body: JSON.stringify({ price: -5 }),
      }),
      baseContext
    );
    expect(response.statusCode).toBe(422);

    response = await productHandler(
      createEvent({
        httpMethod: 'PUT',
        path: '/products/p1',
        pathParameters: { productId: 'p1' },
        body: JSON.stringify({ inventory: -2 }),
      }),
      baseContext
    );
    expect(response.statusCode).toBe(422);
  });

  test('PUT requires identifier and body', async () => {
    let response = await productHandler(
      createEvent({ httpMethod: 'PUT', path: '/products' }),
      baseContext
    );
    expect(response.statusCode).toBe(400);

    response = await productHandler(
      createEvent({
        httpMethod: 'PUT',
        path: '/products/p1',
        pathParameters: { productId: 'p1' },
      }),
      baseContext
    );
    expect(response.statusCode).toBe(400);
  });

  test('PUT without any updates returns 422', async () => {
    const response = await productHandler(
      createEvent({
        httpMethod: 'PUT',
        path: '/products/p1',
        pathParameters: { productId: 'p1' },
        body: JSON.stringify({}),
      }),
      baseContext
    );

    expect(response.statusCode).toBe(422);
  });

  test('PUT updates mutable fields', async () => {
    dynamoMock.mockResolvedValueOnce({});

    const response = await productHandler(
      createEvent({
        httpMethod: 'PUT',
        path: '/products/p1',
        pathParameters: { productId: 'p1' },
        body: JSON.stringify({
          name: 'Widget+',
          description: 'updated',
          price: 10,
          inventory: 7,
        }),
      }),
      baseContext
    );

    expect(response.statusCode).toBe(200);
    const updateCall = dynamoMock.mock.calls.at(-1);
    expectCommandCall(updateCall, { TableName: 'products-table', Key: { productId: 'p1' } });
  });

  test('DELETE enforces identifier and removes record', async () => {
    let response = await productHandler(
      createEvent({ httpMethod: 'DELETE', path: '/products' }),
      baseContext
    );
    expect(response.statusCode).toBe(400);

    dynamoMock.mockResolvedValueOnce({});
    response = await productHandler(
      createEvent({
        httpMethod: 'DELETE',
        path: '/products/p1',
        pathParameters: { productId: 'p1' },
      }),
      baseContext
    );
    expect(response.statusCode).toBe(204);
  });

  test('returns 405 for unsupported product method', async () => {
    const response = await productHandler(
      createEvent({ httpMethod: 'OPTIONS', path: '/products' }),
      baseContext
    );
    expect(response.statusCode).toBe(405);
  });
});

describe('order-service handler', () => {
  const baseContext = { awsRequestId: 'ctx-789' } as any;
  let orderHandler: OrderHandler;
  let dynamoMock: jest.Mock;
  let snsMock: jest.Mock;

  beforeEach(() => {
    orderHandler = loadOrderHandler();
    dynamoMock = getDynamoMock();
    snsMock = getSnsMock();
    dynamoMock.mockReset();
    snsMock.mockReset();
    process.env.ORDER_TABLE_NAME = 'orders-table';
    process.env.USER_TABLE_NAME = 'users-table';
    process.env.PRODUCT_TABLE_NAME = 'products-table';
    process.env.NOTIFICATION_TOPIC_ARN = 'arn:aws:sns:us-west-2:123:orders-topic';
  });

  afterEach(() => {
    delete process.env.ORDER_TABLE_NAME;
    delete process.env.USER_TABLE_NAME;
    delete process.env.PRODUCT_TABLE_NAME;
    delete process.env.NOTIFICATION_TOPIC_ARN;
  });

  test('returns 500 when environment configuration missing', async () => {
    delete process.env.ORDER_TABLE_NAME;
    const response = await orderHandler(createEvent({ httpMethod: 'GET' }), baseContext);
    expect(response.statusCode).toBe(500);
  });

  test('POST validates body and required fields', async () => {
    let response = await orderHandler(
      createEvent({ httpMethod: 'POST', path: '/orders' }),
      baseContext
    );
    expect(response.statusCode).toBe(400);

    response = await orderHandler(
      createEvent({
        httpMethod: 'POST',
        path: '/orders',
        body: JSON.stringify({ userId: 'u1' }),
      }),
      baseContext
    );
    expect(response.statusCode).toBe(422);

    response = await orderHandler(
      createEvent({
        httpMethod: 'POST',
        path: '/orders',
        body: JSON.stringify({ userId: 'u1', productId: 'p1' }),
      }),
      baseContext
    );
    expect(response.statusCode).toBe(422);

    response = await orderHandler(
      createEvent({
        httpMethod: 'POST',
        path: '/orders',
        body: JSON.stringify({ productId: 'p1', quantity: 1 }),
      }),
      baseContext
    );
    expect(response.statusCode).toBe(422);

    response = await orderHandler(
      createEvent({
        httpMethod: 'POST',
        path: '/orders',
        body: JSON.stringify({ userId: 'u1', productId: 'p1', quantity: undefined }),
      }),
      baseContext
    );
    expect(response.statusCode).toBe(422);
  });

  test('POST aborts when user does not exist', async () => {
    dynamoMock.mockResolvedValueOnce({});
    dynamoMock.mockResolvedValueOnce({ Item: { productId: 'p1', inventory: 5, price: 10 } });

    const response = await orderHandler(
      createEvent({
        httpMethod: 'POST',
        path: '/orders',
        body: JSON.stringify({ userId: 'u1', productId: 'p1', quantity: 1 }),
      }),
      baseContext
    );

    expect(response.statusCode).toBe(404);
  });

  test('POST aborts when product missing', async () => {
    dynamoMock.mockResolvedValueOnce({ Item: { userId: 'u1' } });
    dynamoMock.mockResolvedValueOnce({});

    const response = await orderHandler(
      createEvent({
        httpMethod: 'POST',
        path: '/orders',
        body: JSON.stringify({ userId: 'u1', productId: 'p1', quantity: 1 }),
      }),
      baseContext
    );

    expect(response.statusCode).toBe(404);
  });

  test('POST rejects insufficient inventory', async () => {
    dynamoMock
      .mockResolvedValueOnce({ Item: { userId: 'u1' } })
      .mockResolvedValueOnce({ Item: { productId: 'p1', inventory: 1, price: 10 } });

    const response = await orderHandler(
      createEvent({
        httpMethod: 'POST',
        path: '/orders',
        body: JSON.stringify({ userId: 'u1', productId: 'p1', quantity: 5 }),
      }),
      baseContext
    );

    expect(response.statusCode).toBe(409);
  });

  test('POST rejects zero quantity', async () => {
    const response = await orderHandler(
      createEvent({
        httpMethod: 'POST',
        path: '/orders',
        body: JSON.stringify({ userId: 'u1', productId: 'p1', quantity: 0 }),
      }),
      baseContext
    );

    expect(response.statusCode).toBe(422);
  });

  test('POST creates order, updates inventory and publishes notification', async () => {
    dynamoMock
      .mockResolvedValueOnce({ Item: { userId: 'u1' } })
      .mockResolvedValueOnce({ Item: { productId: 'p1', inventory: 5, price: 25 } })
      .mockResolvedValueOnce({});
    snsMock.mockResolvedValueOnce({});

    const response = await orderHandler(
      createEvent({
        httpMethod: 'POST',
        path: '/orders',
        body: JSON.stringify({ userId: 'u1', productId: 'p1', quantity: 2 }),
      }),
      baseContext
    );

    expect(response.statusCode).toBe(201);
    expect(dynamoMock).toHaveBeenCalledTimes(3);
    expect(snsMock).toHaveBeenCalledTimes(1);
  });

  test('POST handles transaction cancellation gracefully', async () => {
    dynamoMock
      .mockResolvedValueOnce({ Item: { userId: 'u1' } })
      .mockResolvedValueOnce({ Item: { productId: 'p1', inventory: 5, price: 25 } })
      .mockRejectedValueOnce({ name: 'TransactionCanceledException' });

    const response = await orderHandler(
      createEvent({
        httpMethod: 'POST',
        path: '/orders',
        body: JSON.stringify({ userId: 'u1', productId: 'p1', quantity: 3 }),
      }),
      baseContext
    );

    expect(response.statusCode).toBe(409);
    expect(snsMock).not.toHaveBeenCalled();
  });

  test('POST bubbles unexpected transaction errors', async () => {
    dynamoMock
      .mockResolvedValueOnce({ Item: { userId: 'u1' } })
      .mockResolvedValueOnce({ Item: { productId: 'p1', inventory: 5, price: 25 } })
      .mockRejectedValueOnce(new Error('kaboom'));

    const response = await orderHandler(
      createEvent({
        httpMethod: 'POST',
        path: '/orders',
        body: JSON.stringify({ userId: 'u1', productId: 'p1', quantity: 1 }),
      }),
      baseContext
    );

    expect(response.statusCode).toBe(500);
  });

  test('PATCH validates identifier and payload', async () => {
    let response = await orderHandler(
      createEvent({ httpMethod: 'PATCH', path: '/orders' }),
      baseContext
    );
    expect(response.statusCode).toBe(400);

    response = await orderHandler(
      createEvent({
        httpMethod: 'PATCH',
        path: '/orders/order-1',
        pathParameters: { orderId: 'order-1' },
      }),
      baseContext
    );
    expect(response.statusCode).toBe(400);

    response = await orderHandler(
      createEvent({
        httpMethod: 'PATCH',
        path: '/orders/order-1',
        pathParameters: { orderId: 'order-1' },
        body: JSON.stringify({}),
      }),
      baseContext
    );
    expect(response.statusCode).toBe(422);
  });

  test('PATCH updates status when provided', async () => {
    dynamoMock.mockResolvedValueOnce({});

    const response = await orderHandler(
      createEvent({
        httpMethod: 'PATCH',
        path: '/orders/order-1',
        pathParameters: { orderId: 'order-1' },
        body: JSON.stringify({ status: 'SHIPPED' }),
      }),
      baseContext
    );

    expect(response.statusCode).toBe(200);
  });

  test('GET list returns known orders', async () => {
    dynamoMock.mockResolvedValueOnce({ Items: [{ orderId: 'o1' }] });

    const response = await orderHandler(
      createEvent({ httpMethod: 'GET', path: '/orders' }),
      baseContext
    );

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([{ orderId: 'o1' }]);
  });

  test('GET list returns empty array when Items missing', async () => {
    dynamoMock.mockResolvedValueOnce({});

    const response = await orderHandler(
      createEvent({ httpMethod: 'GET', path: '/orders' }),
      baseContext
    );

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([]);
  });

  test('GET order by id returns record or 404', async () => {
    dynamoMock.mockResolvedValueOnce({ Item: { orderId: 'o1' } });
    let response = await orderHandler(
      createEvent({
        httpMethod: 'GET',
        path: '/orders/o1',
        pathParameters: { orderId: 'o1' },
      }),
      baseContext
    );
    expect(response.statusCode).toBe(200);

    dynamoMock.mockResolvedValueOnce({});
    response = await orderHandler(
      createEvent({
        httpMethod: 'GET',
        path: '/orders/o2',
        pathParameters: { orderId: 'o2' },
      }),
      baseContext
    );
    expect(response.statusCode).toBe(404);
  });

  test('returns 405 for unsupported order method', async () => {
    const response = await orderHandler(
      createEvent({ httpMethod: 'DELETE', path: '/orders' }),
      baseContext
    );
    expect(response.statusCode).toBe(405);
  });

  test('handles datastore failures with 500 response', async () => {
    dynamoMock.mockRejectedValueOnce(new Error('boom'));

    const response = await orderHandler(
      createEvent({ httpMethod: 'GET', path: '/orders' }),
      baseContext
    );

    expect(response.statusCode).toBe(500);
  });
});
