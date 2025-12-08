/**
 * Lambda handler for order processing
 * This is a sample implementation for the optimization demonstration
 */

interface OrderEvent {
  orderId?: string;
  orderData?: Record<string, unknown>;
}

interface OrderResponse {
  statusCode: number;
  body: string;
}

export const handler = async (event: OrderEvent): Promise<OrderResponse> => {
  console.log('Processing order:', JSON.stringify(event, null, 2));

  try {
    // Simulate order processing logic
    const orderId = event.orderId || 'unknown';
    const orderData = event.orderData || {};

    // Validate order
    if (!orderId || orderId === 'unknown') {
      throw new Error('Invalid order ID');
    }

    // Process order
    const result = {
      orderId,
      status: 'processed',
      timestamp: new Date().toISOString(),
      data: orderData,
    };

    console.log('Order processed successfully:', result);

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Error processing order:', error);

    // For testing DLQ functionality
    throw error;
  }
};
