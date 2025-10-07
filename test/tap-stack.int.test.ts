import { CloudFormationClient, DescribeStacksCommand, ListStacksCommand } from '@aws-sdk/client-cloudformation';
import fs from 'fs';
import { SignatureV4 } from '@smithy/signature-v4';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { HttpRequest as SmithyHttpRequest } from '@smithy/protocol-http';
import { Sha256 } from '@aws-crypto/sha256-js';

let outputs: Record<string, string> | undefined;

async function fetchOutputsFromCloudFormation(): Promise<Record<string, string>> {
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  const client = new CloudFormationClient(region ? { region } : {});
  // Look for stacks in a COMPLETE state
  const listRes = await client.send(
    new ListStacksCommand({
      StackStatusFilter: ['CREATE_COMPLETE', 'UPDATE_COMPLETE'],
    })
  );

  const stackSummaries = listRes.StackSummaries ?? [];
  for (const s of stackSummaries) {
    if (!s.StackName) continue;
    try {
      const desc = await client.send(
        new DescribeStacksCommand({ StackName: s.StackName })
      );
      const stack = desc.Stacks?.[0];
      if (!stack || !stack.Outputs) continue;

      const flat: Record<string, string> = {};
      for (const o of stack.Outputs) {
        if (o.OutputKey && o.OutputValue !== undefined) {
          flat[o.OutputKey] = o.OutputValue;
        }
      }

      // Accept a stack only if it contains the three Function URLs required by tests
      if (
        flat.UserFunctionUrl &&
        flat.ProductFunctionUrl &&
        flat.OrderFunctionUrl
      ) {
        return flat;
      }
    } catch {
      // ignore and continue searching other stacks
    }
  }

  throw new Error(
    'Unable to locate stack outputs containing UserFunctionUrl/ProductFunctionUrl/OrderFunctionUrl. ' +
    'Set AWS credentials and region, or create cfn-outputs/flat-outputs.json from your deploy step.'
  );
}

const loadOutputs = async (): Promise<Record<string, string>> => {
  // Prefer local artifact if present
  try {
    const path = 'cfn-outputs/flat-outputs.json';
    if (fs.existsSync(path)) {
      return JSON.parse(fs.readFileSync(path, 'utf8')) as Record<string, string>;
    }
  } catch {
    /* fall through to CFN lookup */
  }

  // If not present locally, query CloudFormation
  return await fetchOutputsFromCloudFormation();
};

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

  let response = await fetch(targetUrl, init);

  if (response.status === 403) {
    try {
      const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
      if (region) {
        const credsProvider = defaultProvider();
        const urlObj = new URL(targetUrl);
        const awsReq = new SmithyHttpRequest({
          protocol: urlObj.protocol,
          hostname: urlObj.hostname,
          path: `${urlObj.pathname}${urlObj.search}`,
          method,
          headers: {
            ...(init.headers as Record<string, string> | undefined),
            host: urlObj.host,
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        const signer = new SignatureV4({
          credentials: credsProvider,
          service: 'lambda',
          region,
          sha256: Sha256,
        });

        const signed = await signer.sign(awsReq);

        const signedInit: RequestInit = {
          method,
          headers: signed.headers as Record<string, string>,
          body: awsReq.body,
        };

        response = await fetch(targetUrl, signedInit);
      }
    } catch {
      // fall back to original 403 response
    }
  }

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

  let userFunctionUrl: string;
  let productFunctionUrl: string;
  let orderFunctionUrl: string;

  beforeAll(async () => {
    outputs = await loadOutputs();

    userFunctionUrl = outputs.UserFunctionUrl;
    productFunctionUrl = outputs.ProductFunctionUrl;
    orderFunctionUrl = outputs.OrderFunctionUrl;

    if (!userFunctionUrl || !productFunctionUrl || !orderFunctionUrl) {
      throw new Error('Function URLs are missing from deployment outputs.');
    }
  });

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
