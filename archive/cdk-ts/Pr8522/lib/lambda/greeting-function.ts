interface APIGatewayEvent {
  queryStringParameters?: { name?: string };
  requestContext?: { requestId?: string };
}

interface APIGatewayResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayResponse> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const greeting = process.env.GREETING_MESSAGE || 'Hello, World!';
  const name = event.queryStringParameters?.name || 'Guest';

  try {
    const response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: JSON.stringify({
        message: `${greeting}, ${name}!`,
        timestamp: new Date().toISOString(),
        requestId: event.requestContext?.requestId || 'unknown',
      }),
    };

    return response;
  } catch (error) {
    console.error('Error processing request:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to process greeting request',
      }),
    };
  }
};
