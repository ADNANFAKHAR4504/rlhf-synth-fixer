import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Received transactions request:', JSON.stringify(event, null, 2));

  try {
    // Placeholder transaction retrieval logic
    const queryParams = event.queryStringParameters || {};
    const limit = queryParams.limit ? parseInt(queryParams.limit) : 10;

    // Mock transaction data
    const transactions = Array.from({ length: limit }, (_, i) => ({
      transactionId: `txn_${Date.now()}_${i}`,
      amount: Math.floor(Math.random() * 1000) + 1,
      status: 'completed',
      timestamp: new Date().toISOString(),
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        transactions,
        count: transactions.length,
      }),
    };
  } catch (error) {
    console.error('Error retrieving transactions:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Error retrieving transactions',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
