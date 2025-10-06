import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import type { APIGatewayProxyEvent } from 'aws-lambda';

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

    const stageResource = Object.values<any>(templateJson.Resources).find(
      resource => resource.Type === 'AWS::ApiGateway::Stage'
    );
    expect(typeof stageResource?.Properties?.StageName).toBe('string');
    expect(stageResource?.Properties?.StageName).toMatch(/^[A-Za-z0-9_]+$/);

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
    renderedTags.forEach((tag: any) => {
      expect(tag.Value).toMatch(/^[a-zA-Z+\-=._:/]+$/);
    });

    const functions = getNodejsFunctionStore();
    expect(functions).toHaveLength(3);
    functions.forEach(entry => {
      expect(entry.props.environment).toEqual(expect.any(Object));
      expect(entry.props.functionName.length).toBeLessThanOrEqual(64);
    });
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

  test('POST creates order, updates inventory and publishes notification', async () => {
    dynamoMock
      .mockResolvedValueOnce({ Item: { userId: 'u1' } })
      .mockResolvedValueOnce({ Item: { productId: 'p1', inventory: 5, price: 25 } })
      .mockResolvedValueOnce({})
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
    expect(dynamoMock).toHaveBeenCalledTimes(4);
    expect(snsMock).toHaveBeenCalledTimes(1);
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
});
