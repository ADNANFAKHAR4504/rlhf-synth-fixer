import fs from 'fs';
import { Lambda } from 'aws-sdk';

const outputs = (() => {
  try {
    return JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')) as Record<string, string>;
  } catch (error) {
    throw new Error(
      'Integration tests require cfn-outputs/flat-outputs.json. Run the deploy step to generate it before executing tests.'
    );
  }
})();

process.env.AWS_SDK_LOAD_CONFIG = process.env.AWS_SDK_LOAD_CONFIG || '1';

const region = process.env.AWS_REGION || outputs.ApiEndpoint?.split('.')[2] || 'us-west-2';
const lambda = new Lambda({ region });

const inferFunctionName = (tableName: string, purpose: string) =>
  tableName.replace('-users-', `-${purpose}-`);

const userFunctionName = inferFunctionName(outputs.UserTableName, 'user-service');
const productFunctionName = inferFunctionName(outputs.ProductTableName, 'product-service');
const orderFunctionName = inferFunctionName(outputs.OrderTableName, 'order-service');

const invokeLambda = async <T>(functionName: string, payload: Record<string, unknown>) => {
  const response = await lambda
    .invoke({
      FunctionName: functionName,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(payload),
    })
    .promise();

  const raw = response.Payload ? JSON.parse(response.Payload.toString()) : {};
  const status = raw.statusCode as number;
  const body = raw.body ? (JSON.parse(raw.body) as T) : undefined;
  return { status, body };
};

const buildEvent = (
  method: string,
  path: string,
  body?: Record<string, unknown>,
  pathParameters?: Record<string, string>
) => ({
  resource: path,
  path,
  httpMethod: method,
  headers: {},
  multiValueHeaders: {},
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  pathParameters: pathParameters ?? null,
  stageVariables: null,
  requestContext: {},
  body: body ? JSON.stringify(body) : null,
  isBase64Encoded: false,
});

const uniqueId = `int-${Date.now().toString(36)}`;

jest.setTimeout(120_000);

describe('Serverless Lambda integration workflow', () => {
  let createdUserId: string | undefined;
  let createdProductId: string | undefined;
  let createdOrderId: string | undefined;

  afterAll(async () => {
    if (createdOrderId) {
      await invokeLambda(
        orderFunctionName,
        buildEvent('PATCH', `/orders/${createdOrderId}`, { status: 'CANCELLED' }, { orderId: createdOrderId })
      );
    }
    if (createdUserId) {
      await invokeLambda(
        userFunctionName,
        buildEvent('DELETE', `/users/${createdUserId}`, undefined, { userId: createdUserId })
      );
    }
    if (createdProductId) {
      await invokeLambda(
        productFunctionName,
        buildEvent('DELETE', `/products/${createdProductId}`, undefined, { productId: createdProductId })
      );
    }
  });

  test('supports user, product, and order lifecycle', async () => {
    const createUser = await invokeLambda<{ userId: string }>(
      userFunctionName,
      buildEvent('POST', '/users', {
        name: `Integration User ${uniqueId}`,
        email: `${uniqueId}@example.com`,
      })
    );
    expect(createUser.status).toBe(201);
    createdUserId = createUser.body?.userId;
    expect(createdUserId).toEqual(expect.any(String));

    const getUser = await invokeLambda(
      userFunctionName,
      buildEvent('GET', `/users/${createdUserId}`, undefined, { userId: createdUserId! })
    );
    expect(getUser.status).toBe(200);
    expect(getUser.body).toEqual(expect.objectContaining({ userId: createdUserId }));

    const createProduct = await invokeLambda<{ productId: string }>(
      productFunctionName,
      buildEvent('POST', '/products', {
        name: `Integration Product ${uniqueId}`,
        description: 'Integration test asset',
        price: 19.99,
        inventory: 10,
      })
    );
    expect(createProduct.status).toBe(201);
    createdProductId = createProduct.body?.productId;
    expect(createdProductId).toEqual(expect.any(String));

    const getProduct = await invokeLambda(
      productFunctionName,
      buildEvent('GET', `/products/${createdProductId}`, undefined, { productId: createdProductId! })
    );
    expect(getProduct.status).toBe(200);

    const createOrder = await invokeLambda<{ orderId: string }>(
      orderFunctionName,
      buildEvent('POST', '/orders', {
        userId: createdUserId,
        productId: createdProductId,
        quantity: 2,
      })
    );
    expect(createOrder.status).toBe(201);
    createdOrderId = createOrder.body?.orderId;
    expect(createdOrderId).toEqual(expect.any(String));

    const getOrder = await invokeLambda(
      orderFunctionName,
      buildEvent('GET', `/orders/${createdOrderId}`, undefined, { orderId: createdOrderId! })
    );
    expect(getOrder.status).toBe(200);
    expect(getOrder.body).toEqual(
      expect.objectContaining({
        orderId: createdOrderId,
        userId: createdUserId,
        productId: createdProductId,
      })
    );

    const patchOrder = await invokeLambda(
      orderFunctionName,
      buildEvent('PATCH', `/orders/${createdOrderId}`, { status: 'SHIPPED' }, { orderId: createdOrderId! })
    );
    expect(patchOrder.status).toBe(200);

    const verifyOrder = await invokeLambda(
      orderFunctionName,
      buildEvent('GET', `/orders/${createdOrderId}`, undefined, { orderId: createdOrderId! })
    );
    expect(verifyOrder.status).toBe(200);
    expect(verifyOrder.body).toEqual(expect.objectContaining({ status: 'SHIPPED' }));

    const listUsers = await invokeLambda<any[]>(
      userFunctionName,
      buildEvent('GET', '/users')
    );
    expect(listUsers.status).toBe(200);
    expect(listUsers.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: createdUserId }),
      ])
    );

    const listProducts = await invokeLambda<any[]>(
      productFunctionName,
      buildEvent('GET', '/products')
    );
    expect(listProducts.status).toBe(200);
    expect(listProducts.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ productId: createdProductId }),
      ])
    );

    const listOrders = await invokeLambda<any[]>(
      orderFunctionName,
      buildEvent('GET', '/orders')
    );
    expect(listOrders.status).toBe(200);
    expect(listOrders.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ orderId: createdOrderId }),
      ])
    );
  });
});
