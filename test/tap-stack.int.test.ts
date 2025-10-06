import fs from 'fs';

const outputs = (() => {
  try {
    return JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')) as Record<string, string>;
  } catch (error) {
    throw new Error(
      'Integration tests require cfn-outputs/flat-outputs.json. Run the deploy step to generate it before executing tests.'
    );
  }
})();

const userFunctionUrl = outputs.UserFunctionUrl;
const productFunctionUrl = outputs.ProductFunctionUrl;
const orderFunctionUrl = outputs.OrderFunctionUrl;

if (!userFunctionUrl || !productFunctionUrl || !orderFunctionUrl) {
  throw new Error('Function URLs are missing from deployment outputs.');
}

const invokeFunctionUrl = async <T>(
  baseUrl: string,
  method: string,
  path: string,
  body?: unknown
): Promise<{ status: number; json?: T; headers: Headers }> => {
  const targetUrl = new URL(path.replace(/^\//, ''), baseUrl).toString();
  const init: RequestInit = {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  };

  const response = await fetch(targetUrl, init);

  if (response.status === 204) {
    return { status: response.status, headers: response.headers };
  }

  const text = await response.text();
  const parsed = text.length ? (JSON.parse(text) as T) : undefined;
  return { status: response.status, json: parsed, headers: response.headers };
};

const uniqueId = `int-${Date.now().toString(36)}`;

jest.setTimeout(120_000);

describe('Lambda function URL integration workflow', () => {
  let createdUserId: string | undefined;
  let createdProductId: string | undefined;
  let createdOrderId: string | undefined;

  afterAll(async () => {
    if (createdOrderId) {
      await invokeFunctionUrl(orderFunctionUrl, 'PATCH', `/orders/${createdOrderId}`, {
        status: 'CANCELLED',
      });
    }
    if (createdUserId) {
      await invokeFunctionUrl(userFunctionUrl, 'DELETE', `/users/${createdUserId}`);
    }
    if (createdProductId) {
      await invokeFunctionUrl(productFunctionUrl, 'DELETE', `/products/${createdProductId}`);
    }
  });

  test('supports user, product, and order lifecycle', async () => {
    const createUser = await invokeFunctionUrl<{ userId: string }>(
      userFunctionUrl,
      'POST',
      '/users',
      {
        name: `Integration User ${uniqueId}`,
        email: `${uniqueId}@example.com`,
      }
    );
    expect(createUser.status).toBe(201);
    createdUserId = createUser.json?.userId;
    expect(createdUserId).toEqual(expect.any(String));

    const getUser = await invokeFunctionUrl(
      userFunctionUrl,
      'GET',
      `/users/${createdUserId}`
    );
    expect(getUser.status).toBe(200);
    expect(getUser.json).toEqual(
      expect.objectContaining({ userId: createdUserId })
    );

    const createProduct = await invokeFunctionUrl<{ productId: string }>(
      productFunctionUrl,
      'POST',
      '/products',
      {
        name: `Integration Product ${uniqueId}`,
        description: 'Integration test asset',
        price: 19.99,
        inventory: 10,
      }
    );
    expect(createProduct.status).toBe(201);
    createdProductId = createProduct.json?.productId;
    expect(createdProductId).toEqual(expect.any(String));

    const getProduct = await invokeFunctionUrl(
      productFunctionUrl,
      'GET',
      `/products/${createdProductId}`
    );
    expect(getProduct.status).toBe(200);

    const createOrder = await invokeFunctionUrl<{ orderId: string }>(
      orderFunctionUrl,
      'POST',
      '/orders',
      {
        userId: createdUserId,
        productId: createdProductId,
        quantity: 2,
      }
    );
    expect(createOrder.status).toBe(201);
    createdOrderId = createOrder.json?.orderId;
    expect(createdOrderId).toEqual(expect.any(String));

    const getOrder = await invokeFunctionUrl(
      orderFunctionUrl,
      'GET',
      `/orders/${createdOrderId}`
    );
    expect(getOrder.status).toBe(200);
    expect(getOrder.json).toEqual(
      expect.objectContaining({
        orderId: createdOrderId,
        userId: createdUserId,
        productId: createdProductId,
      })
    );

    const patchOrder = await invokeFunctionUrl(
      orderFunctionUrl,
      'PATCH',
      `/orders/${createdOrderId}`,
      { status: 'SHIPPED' }
    );
    expect(patchOrder.status).toBe(200);

    const verifyOrder = await invokeFunctionUrl(
      orderFunctionUrl,
      'GET',
      `/orders/${createdOrderId}`
    );
    expect(verifyOrder.status).toBe(200);
    expect(verifyOrder.json).toEqual(
      expect.objectContaining({ status: 'SHIPPED' })
    );

    const listUsers = await invokeFunctionUrl<any[]>(
      userFunctionUrl,
      'GET',
      '/users'
    );
    expect(listUsers.status).toBe(200);
    expect(listUsers.json).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: createdUserId }),
      ])
    );

    const listProducts = await invokeFunctionUrl<any[]>(
      productFunctionUrl,
      'GET',
      '/products'
    );
    expect(listProducts.status).toBe(200);
    expect(listProducts.json).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ productId: createdProductId }),
      ])
    );

    const listOrders = await invokeFunctionUrl<any[]>(
      orderFunctionUrl,
      'GET',
      '/orders'
    );
    expect(listOrders.status).toBe(200);
    expect(listOrders.json).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ orderId: createdOrderId }),
      ])
    );
  });
});
