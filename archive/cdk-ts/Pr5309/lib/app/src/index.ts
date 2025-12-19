import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2WithRequestContext,
  APIGatewayProxyResult,
  Context as LambdaContext,
} from 'aws-lambda';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore hono is installed at compile time
import { Hono } from 'hono';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore hono is installed at compile time
import { handle as handleV2 } from 'hono/aws-lambda';

const app = new Hono();

// Basic routes
app.get('/', (c: any) => c.json({ message: 'OK', service: 'hono-app' }));
app.get('/health', (c: any) => c.json({ status: 'healthy' }));
app.get('/hello/:name', (c: any) => c.text(`Hello, ${c.req.param('name')}!`));
app.post('/echo', async (c: any) => {
  const body = await c.req.json().catch(() => ({}));
  return c.json({ received: body });
});

// Adapter that accepts both APIGW v1 and v2 events
const v2Handler = handleV2(app);

export const handler = async (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2WithRequestContext<any>,
  context: LambdaContext
): Promise<APIGatewayProxyResult> => {
  return v2Handler(event as any, context) as Promise<APIGatewayProxyResult>;
};
