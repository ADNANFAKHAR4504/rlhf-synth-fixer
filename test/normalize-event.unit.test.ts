import type { APIGatewayProxyEvent } from 'aws-lambda';
import { normalizeEvent } from '../lib/runtime/normalize-event';

describe('normalizeEvent', () => {
  it('returns a default proxy event when input is not an object', () => {
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
      body: JSON.stringify({ email: 'sample@example.com' }),
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

  it('maps Lambda Function URL payloads into a proxy event shape', () => {
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

  it('preserves raw string bodies from Function URL events', () => {
    const normalized = normalizeEvent({
      requestContext: { http: { method: 'get', path: '/hello' } },
      rawPath: '/hello',
      body: 'plain-text-body',
    });

    expect(normalized.body).toBe('plain-text-body');
  });

  it('returns null body when Function URL payload omits the body property', () => {
    const normalized = normalizeEvent({
      requestContext: { http: { method: 'delete', path: '/resources/1' } },
      rawPath: '/resources/1',
    });

    expect(normalized.body).toBeNull();
  });

  it('falls back to defaults when method cannot be determined', () => {
    const bodyThatThrows = {
      toJSON() {
        throw new Error('cannot serialize');
      },
    };

    const normalized = normalizeEvent({
      path: '/fallback',
      resource: '/fallback',
      headers: { 'x-custom': 'value' },
      body: bodyThatThrows,
    });

    expect(normalized.httpMethod).toBe('GET');
    expect(normalized.path).toBe('/fallback');
    expect(normalized.resource).toBe('/fallback');
    expect(normalized.body).toBe('[object Object]');
    expect(normalized.headers).toEqual({ 'x-custom': 'value' });
  });
});
