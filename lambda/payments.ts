import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Received payment request:', JSON.stringify(event, null, 2));

  try {
    // Placeholder payment processing logic
    const body = event.body ? JSON.parse(event.body) : {};

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Payment processed successfully',
        paymentId: `pay_${Date.now()}`,
        amount: body.amount || 0,
        status: 'success',
      }),
    };
  } catch (error) {
    console.error('Error processing payment:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Error processing payment',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
