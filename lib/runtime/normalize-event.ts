import { APIGatewayProxyEvent } from 'aws-lambda';

type Headers = Record<string, string>;

type MultiValueHeaders = Record<string, string[]>;

type FunctionUrlRequestContext = {
  http?: {
    method?: string;
    path?: string;
  };
};

type NormalizableEvent = {
  httpMethod?: unknown;
  headers?: Headers;
  multiValueHeaders?: MultiValueHeaders;
  body?: unknown;
  isBase64Encoded?: boolean;
  path?: unknown;
  rawPath?: unknown;
  pathParameters?: Record<string, string> | null;
  queryStringParameters?: Record<string, string> | null;
  multiValueQueryStringParameters?: Record<string, string[]> | null;
  stageVariables?: Record<string, string> | null;
  resource?: unknown;
  requestContext?: FunctionUrlRequestContext;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function createEmptyEvent(method: string = 'GET'): APIGatewayProxyEvent {
  return {
    resource: '',
    path: '/',
    httpMethod: method,
    headers: {},
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    stageVariables: null,
    requestContext: {} as APIGatewayProxyEvent['requestContext'],
    body: null,
    isBase64Encoded: false,
  };
}

function coerceBody(body: unknown): string | null {
  if (typeof body === 'string') {
    return body;
  }
  if (body === undefined || body === null) {
    return null;
  }
  try {
    return JSON.stringify(body);
  } catch {
    return String(body);
  }
}

export function normalizeEvent(event: unknown): APIGatewayProxyEvent {
  if (!isRecord(event)) {
    return createEmptyEvent();
  }

  const incoming = event as NormalizableEvent;

  if (typeof incoming.httpMethod === 'string') {
    return incoming as unknown as APIGatewayProxyEvent;
  }

  if (typeof incoming.body === 'string') {
    try {
      const parsed = JSON.parse(incoming.body);
      if (isRecord(parsed) && typeof parsed.httpMethod === 'string') {
        return parsed as unknown as APIGatewayProxyEvent;
      }
    } catch {
      // ignore malformed JSON bodies
    }
  }

  const method = asString(incoming.requestContext?.http?.method);
  if (method) {
    const normalized = createEmptyEvent(method.toUpperCase());
    const resolvedPath =
      asString(incoming.rawPath) ??
      asString(incoming.requestContext?.http?.path) ??
      asString(incoming.path) ??
      normalized.path;

    return {
      ...normalized,
      headers: (incoming.headers ?? {}) as Headers,
      multiValueHeaders: (incoming.multiValueHeaders ??
        {}) as MultiValueHeaders,
      path: resolvedPath,
      resource: asString(incoming.resource) ?? normalized.resource,
      pathParameters: incoming.pathParameters ?? null,
      queryStringParameters: incoming.queryStringParameters ?? null,
      multiValueQueryStringParameters:
        incoming.multiValueQueryStringParameters ?? null,
      stageVariables: incoming.stageVariables ?? null,
      requestContext:
        (incoming.requestContext as unknown as APIGatewayProxyEvent['requestContext']) ||
        normalized.requestContext,
      body: coerceBody(incoming.body),
      isBase64Encoded: Boolean(incoming.isBase64Encoded),
    };
  }

  const base = createEmptyEvent();

  return {
    ...base,
    headers: (incoming.headers ?? {}) as Headers,
    multiValueHeaders: (incoming.multiValueHeaders ?? {}) as MultiValueHeaders,
    path: asString(incoming.path) ?? base.path,
    resource: asString(incoming.resource) ?? base.resource,
    pathParameters: incoming.pathParameters ?? null,
    queryStringParameters: incoming.queryStringParameters ?? null,
    multiValueQueryStringParameters:
      incoming.multiValueQueryStringParameters ?? null,
    stageVariables: incoming.stageVariables ?? null,
    requestContext:
      (incoming.requestContext as unknown as APIGatewayProxyEvent['requestContext']) ||
      base.requestContext,
    body: coerceBody(incoming.body),
    isBase64Encoded: Boolean(incoming.isBase64Encoded),
  };
}
