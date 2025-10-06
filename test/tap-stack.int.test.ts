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

const apiEndpoint =
  (outputs.ApiEndpoint as string | undefined) ||
  (outputs.NovaRestApiEndpointADC846BC as string | undefined);

if (!apiEndpoint) {
  throw new Error('ApiEndpoint output not present in deployment outputs.');
}

const baseUrl = apiEndpoint.endsWith('/') ? apiEndpoint.slice(0, -1) : apiEndpoint;

const requestJson = async <T>(
  method: string,
  resourcePath: string,
  body?: Record<string, unknown>
): Promise<{ status: number; json?: T; headers: Headers }> => {
  const url = `${baseUrl}${resourcePath}`;
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
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

describe('Serverless API integration workflow', () => {
  let createdUserId: string | undefined;
  let createdProductId: string | undefined;
  let createdOrderId: string | undefined;

  afterAll(async () => {
    if (createdOrderId) {
      await requestJson('PATCH', `/orders/${createdOrderId}`, {
        status: 'CANCELLED',
      });
    }
    if (createdUserId) {
      await requestJson('DELETE', `/users/${createdUserId}`);
    }
    if (createdProductId) {
      await requestJson('DELETE', `/products/${createdProductId}`);
    }
  });

  test('supports user, product, and order lifecycle', async () => {
    const createUserResponse = await requestJson<{ userId: string }>('POST', '/users', {
      name: `Integration User ${uniqueId}`,
      email: `${uniqueId}@example.com`,
    });
    expect(createUserResponse.status).toBe(201);
    createdUserId = createUserResponse.json?.userId;
    expect(createdUserId).toEqual(expect.any(String));

    const getUserResponse = await requestJson('GET', `/users/${createdUserId}`);
    expect(getUserResponse.status).toBe(200);
    expect(getUserResponse.json).toEqual(
      expect.objectContaining({
        userId: createdUserId,
        email: `${uniqueId}@example.com`,
      })
    );

    const createProductResponse = await requestJson<{ productId: string }>('POST', '/products', {
      name: `Integration Product ${uniqueId}`,
      description: 'Integration test asset',
      price: 19.99,
      inventory: 10,
    });
    expect(createProductResponse.status).toBe(201);
    createdProductId = createProductResponse.json?.productId;
    expect(createdProductId).toEqual(expect.any(String));

    const getProductResponse = await requestJson('GET', `/products/${createdProductId}`);
    expect(getProductResponse.status).toBe(200);
    expect(getProductResponse.json).toEqual(
      expect.objectContaining({ productId: createdProductId })
    );

    const createOrderResponse = await requestJson<{ orderId: string }>('POST', '/orders', {
      userId: createdUserId,
      productId: createdProductId,
      quantity: 2,
    });
    expect(createOrderResponse.status).toBe(201);
    createdOrderId = createOrderResponse.json?.orderId;
    expect(createdOrderId).toEqual(expect.any(String));

    const getOrderResponse = await requestJson('GET', `/orders/${createdOrderId}`);
    expect(getOrderResponse.status).toBe(200);
    expect(getOrderResponse.json).toEqual(
      expect.objectContaining({
        orderId: createdOrderId,
        userId: createdUserId,
        productId: createdProductId,
      })
    );

    const patchOrderResponse = await requestJson('PATCH', `/orders/${createdOrderId}`, {
      status: 'SHIPPED',
    });
    expect(patchOrderResponse.status).toBe(200);

    const verifyOrderResponse = await requestJson('GET', `/orders/${createdOrderId}`);
    expect(verifyOrderResponse.status).toBe(200);
    expect(verifyOrderResponse.json).toEqual(
      expect.objectContaining({ status: 'SHIPPED' })
    );

    const listUsersResponse = await requestJson<any[]>('GET', '/users');
    expect(listUsersResponse.status).toBe(200);
    expect(listUsersResponse.json).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: createdUserId }),
      ])
    );

    const listProductsResponse = await requestJson<any[]>('GET', '/products');
    expect(listProductsResponse.status).toBe(200);
    expect(listProductsResponse.json).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ productId: createdProductId }),
      ])
    );

    const listOrdersResponse = await requestJson<any[]>('GET', '/orders');
    expect(listOrdersResponse.status).toBe(200);
    expect(listOrdersResponse.json).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ orderId: createdOrderId }),
      ])
    );
  });
});
