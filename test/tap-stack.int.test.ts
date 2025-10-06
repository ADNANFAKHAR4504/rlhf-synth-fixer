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
  url: string,
  method: string,
  body?: Record<string, unknown>
): Promise<{ status: number; json?: T; headers: Headers }> => {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

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
      await invokeFunctionUrl(orderFunctionUrl, 'PATCH', {
        status: 'CANCELLED',
        path: `/orders/${createdOrderId}`,
        httpMethod: 'PATCH',
        pathParameters: { orderId: createdOrderId },
      });
    }
    if (createdUserId) {
      await invokeFunctionUrl(userFunctionUrl, 'DELETE', {
        path: `/users/${createdUserId}`,
        httpMethod: 'DELETE',
        pathParameters: { userId: createdUserId },
      });
    }
    if (createdProductId) {
      await invokeFunctionUrl(productFunctionUrl, 'DELETE', {
        path: `/products/${createdProductId}`,
        httpMethod: 'DELETE',
        pathParameters: { productId: createdProductId },
      });
    }
  });

  test('supports user, product, and order lifecycle', async () => {
    const createUser = await invokeFunctionUrl<{ userId: string }>(
      userFunctionUrl,
      'POST',
      {
        path: '/users',
        httpMethod: 'POST',
        body: JSON.stringify({
          name: `Integration User ${uniqueId}`,
          email: `${uniqueId}@example.com`,
        }),
      }
    );
    expect(createUser.status).toBe(201);
    createdUserId = createUser.json?.userId;
    expect(createdUserId).toEqual(expect.any(String));

    const getUser = await invokeFunctionUrl(
      userFunctionUrl,
      'POST',
      {
        path: `/users/${createdUserId}`,
        httpMethod: 'GET',
        pathParameters: { userId: createdUserId! },
      }
    );
    expect(getUser.status).toBe(200);
    expect(getUser.json).toEqual(
      expect.objectContaining({ userId: createdUserId })
    );

    const createProduct = await invokeFunctionUrl<{ productId: string }>(
      productFunctionUrl,
      'POST',
      {
        path: '/products',
        httpMethod: 'POST',
        body: JSON.stringify({
          name: `Integration Product ${uniqueId}`,
          description: 'Integration test asset',
          price: 19.99,
          inventory: 10,
        }),
      }
    );
    expect(createProduct.status).toBe(201);
    createdProductId = createProduct.json?.productId;
    expect(createdProductId).toEqual(expect.any(String));

    const getProduct = await invokeFunctionUrl(
      productFunctionUrl,
      'POST',
      {
        path: `/products/${createdProductId}`,
        httpMethod: 'GET',
        pathParameters: { productId: createdProductId! },
      }
    );
    expect(getProduct.status).toBe(200);

    const createOrder = await invokeFunctionUrl<{ orderId: string }>(
      orderFunctionUrl,
      'POST',
      {
        path: '/orders',
        httpMethod: 'POST',
        body: JSON.stringify({
          userId: createdUserId,
          productId: createdProductId,
          quantity: 2,
        }),
      }
    );
    expect(createOrder.status).toBe(201);
    createdOrderId = createOrder.json?.orderId;
    expect(createdOrderId).toEqual(expect.any(String));

    const getOrder = await invokeFunctionUrl(
      orderFunctionUrl,
      'POST',
      {
        path: `/orders/${createdOrderId}`,
        httpMethod: 'GET',
        pathParameters: { orderId: createdOrderId! },
      }
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
      'POST',
      {
        path: `/orders/${createdOrderId}`,
        httpMethod: 'PATCH',
        pathParameters: { orderId: createdOrderId! },
        body: JSON.stringify({ status: 'SHIPPED' }),
      }
    );
    expect(patchOrder.status).toBe(200);

    const verifyOrder = await invokeFunctionUrl(
      orderFunctionUrl,
      'POST',
      {
        path: `/orders/${createdOrderId}`,
        httpMethod: 'GET',
        pathParameters: { orderId: createdOrderId! },
      }
    );
    expect(verifyOrder.status).toBe(200);
    expect(verifyOrder.json).toEqual(
      expect.objectContaining({ status: 'SHIPPED' })
    );

    const listUsers = await invokeFunctionUrl<any[]>(
      userFunctionUrl,
      'POST',
      {
        path: '/users',
        httpMethod: 'GET',
      }
    );
    expect(listUsers.status).toBe(200);
    expect(listUsers.json).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: createdUserId }),
      ])
    );

    const listProducts = await invokeFunctionUrl<any[]>(
      productFunctionUrl,
      'POST',
      {
        path: '/products',
        httpMethod: 'GET',
      }
    );
    expect(listProducts.status).toBe(200);
    expect(listProducts.json).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ productId: createdProductId }),
      ])
    );

    const listOrders = await invokeFunctionUrl<any[]>(
      orderFunctionUrl,
      'POST',
      {
        path: '/orders',
        httpMethod: 'GET',
      }
    );
    expect(listOrders.status).toBe(200);
    expect(listOrders.json).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ orderId: createdOrderId }),
      ])
    );
  });
});
