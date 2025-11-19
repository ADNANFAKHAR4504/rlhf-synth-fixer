import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

// Initialize SSM client outside handler for connection reuse
const ssmClient = new SSMClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

interface PaymentRequest {
  amount: number;
  currency: string;
  paymentMethod: string;
}

interface PaymentConfig {
  maxAmount: number;
  allowedCurrencies: string[];
  timeout: number;
}

/**
 * Payment processing Lambda handler
 * Reads configuration from SSM Parameter Store based on environment
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Get SSM parameter path from environment variable
    const ssmPath = process.env.SSM_CONFIG_PATH;
    if (!ssmPath) {
      throw new Error('SSM_CONFIG_PATH environment variable not set');
    }

    console.log(`Loading configuration from SSM path: ${ssmPath}`);

    // Load configuration from SSM Parameter Store
    const command = new GetParameterCommand({
      Name: ssmPath,
      WithDecryption: true,
    });

    const response = await ssmClient.send(command);
    const config: PaymentConfig = JSON.parse(response.Parameter?.Value || '{}');

    // Parse payment request
    const payment: PaymentRequest = JSON.parse(event.body || '{}');

    // Validate payment request
    if (!payment.amount || payment.amount <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid payment amount' }),
      };
    }

    if (payment.amount > config.maxAmount) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `Payment amount exceeds maximum allowed: ${config.maxAmount}`,
        }),
      };
    }

    if (!config.allowedCurrencies.includes(payment.currency)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `Currency ${payment.currency} not supported`,
        }),
      };
    }

    // Process payment (simulation)
    console.log('Processing payment:', payment);

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Payment processed successfully',
        transactionId: `txn-${Date.now()}`,
        amount: payment.amount,
        currency: payment.currency,
      }),
    };
  } catch (error) {
    console.error('Error processing payment:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
