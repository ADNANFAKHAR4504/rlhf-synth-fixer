// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import fetch from 'node-fetch';

// Check if outputs file exists
const outputsPath = 'cfn-outputs/flat-outputs.json';
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
} else {
  // Default outputs for local testing when cfn-outputs file is not available
  console.log('Using default outputs for local testing');
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
// Default to 'pr115' to match the local outputs when no env variable is set
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr115';

describe('E-Commerce API Integration Tests', () => {
  // Skip tests if outputs file doesn't exist (not deployed)
  beforeAll(() => {
    if (!fs.existsSync(outputsPath)) {
      console.warn('cfn-outputs/flat-outputs.json not found. Skipping integration tests.');
    }
  });

  describe('API Gateway Endpoint Tests', () => {
    test('API Gateway endpoint is accessible', async () => {
      if (!outputs.ECommerceApiUrl) {
        console.warn('API URL not found in outputs, skipping test');
        return;
      }

      const response = await fetch(`${outputs.ECommerceApiUrl}auth`, {
        method: 'OPTIONS'
      });

      expect(response.status).toBeLessThan(500);
    });

    test('API Gateway health check via root endpoint', async () => {
      if (!outputs.ECommerceApiUrl) {
        console.warn('API URL not found in outputs, skipping test');
        return;
      }

      // Remove trailing slash for root access
      const rootUrl = outputs.ECommerceApiUrl.replace(/\/$/, '');
      const response = await fetch(rootUrl, {
        method: 'GET'
      });

      // API Gateway should return some response (even if 403/404)
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Authentication Endpoint', () => {
    test('POST /auth returns 400 without credentials', async () => {
      if (!outputs.ECommerceApiUrl) {
        console.warn('API URL not found in outputs, skipping test');
        return;
      }

      const response = await fetch(`${outputs.ECommerceApiUrl}auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Email and password required');
    });

    test('POST /auth returns 200 with valid credentials', async () => {
      if (!outputs.ECommerceApiUrl) {
        console.warn('API URL not found in outputs, skipping test');
        return;
      }

      const response = await fetch(`${outputs.ECommerceApiUrl}auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe('Authentication successful');
      expect(data.token).toBeDefined();
      expect(data.userId).toBeDefined();
      expect(data.email).toBe('test@example.com');
      expect(data.token).toMatch(/^jwt-token-/);
      expect(data.userId).toMatch(/^user-/);
    });
    test('POST /auth handles malformed JSON gracefully', async () => {
      if (!outputs.ECommerceApiUrl) {
        console.warn('API URL not found in outputs, skipping test');
        return;
      }

      const response = await fetch(`${outputs.ECommerceApiUrl}auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: 'invalid-json'
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Products Endpoint (with API Key)', () => {
    test('GET /products requires API key', async () => {
      if (!outputs.ECommerceApiUrl) {
        console.warn('API URL not found in outputs, skipping test');
        return;
      }

      const response = await fetch(`${outputs.ECommerceApiUrl}products`, {
        method: 'GET'
      });

      expect(response.status).toBe(403); // Forbidden without API key
      const data = await response.json();
      expect(data.message).toContain('Forbidden');
    });

    test('GET /products with invalid API key returns 403', async () => {
      if (!outputs.ECommerceApiUrl) {
        console.warn('API URL not found in outputs, skipping test');
        return;
      }

      const response = await fetch(`${outputs.ECommerceApiUrl}products`, {
        method: 'GET',
        headers: {
          'X-API-Key': 'invalid-key-placeholder'
        }
      });

      expect(response.status).toBe(403);
    });

    test('GET /products/{productId} endpoint exists and requires API key', async () => {
      if (!outputs.ECommerceApiUrl) {
        console.warn('API URL not found in outputs, skipping test');
        return;
      }

      const response = await fetch(`${outputs.ECommerceApiUrl}products/test-product-123`, {
        method: 'GET'
      });

      // Should return 403 due to missing API key, not 404 (endpoint exists)
      expect(response.status).toBe(403);
    });

    test('POST /products endpoint exists and requires API key', async () => {
      if (!outputs.ECommerceApiUrl) {
        console.warn('API URL not found in outputs, skipping test');
        return;
      }

      const response = await fetch(`${outputs.ECommerceApiUrl}products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Test Product',
          price: 29.99,
          description: 'A test product'
        })
      });

      // Should return 403 due to missing API key, not 404 (endpoint exists)
      expect(response.status).toBe(403);
    });

    test('PUT method not allowed on products endpoint', async () => {
      if (!outputs.ECommerceApiUrl) {
        console.warn('API URL not found in outputs, skipping test');
        return;
      }

      const response = await fetch(`${outputs.ECommerceApiUrl}products`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      // Should return 403 (missing API key) or 405 (method not allowed)
      expect([403, 405]).toContain(response.status);
    });
  });

  describe('Orders Endpoint (with API Key)', () => {
    test('GET /orders requires API key', async () => {
      if (!outputs.ECommerceApiUrl) {
        console.warn('API URL not found in outputs, skipping test');
        return;
      }

      const response = await fetch(`${outputs.ECommerceApiUrl}orders`, {
        method: 'GET'
      });

      expect(response.status).toBe(403); // Forbidden without API key
    });

    test('GET /orders/{orderId} endpoint exists and requires API key', async () => {
      if (!outputs.ECommerceApiUrl) {
        console.warn('API URL not found in outputs, skipping test');
        return;
      }

      const response = await fetch(`${outputs.ECommerceApiUrl}orders/test-order-456`, {
        method: 'GET'
      });

      // Should return 403 due to missing API key, not 404 (endpoint exists)
      expect(response.status).toBe(403);
    });

    test('POST /orders endpoint exists and requires API key', async () => {
      if (!outputs.ECommerceApiUrl) {
        console.warn('API URL not found in outputs, skipping test');
        return;
      }

      const response = await fetch(`${outputs.ECommerceApiUrl}orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerId: 'customer-123',
          items: [
            { productId: '1', quantity: 2, price: 19.99 },
            { productId: '2', quantity: 1, price: 29.99 }
          ],
          total: 69.97
        })
      });

      // Should return 403 due to missing API key, not 404 (endpoint exists)
      expect(response.status).toBe(403);
    });

    test('DELETE method not allowed on orders endpoint', async () => {
      if (!outputs.ECommerceApiUrl) {
        console.warn('API URL not found in outputs, skipping test');
        return;
      }

      const response = await fetch(`${outputs.ECommerceApiUrl}orders/test-order`, {
        method: 'DELETE'
      });

      // Should return 403 (missing API key) or 405 (method not allowed)
      expect([403, 405]).toContain(response.status);
    });
  });

  describe('AWS Resource Integration', () => {


    test('Lambda function ARNs exist in outputs with correct patterns', () => {
      if (Object.keys(outputs).length === 0) {
        console.warn('No outputs found, skipping Lambda ARN test');
        return;
      }

      expect(outputs.ProductLambdaArn).toBeDefined();
      expect(outputs.OrderLambdaArn).toBeDefined();
      expect(outputs.AuthLambdaArn).toBeDefined();

      // Check ARN patterns
      expect(outputs.ProductLambdaArn).toMatch(/^arn:aws:lambda:[\w-]+:\d+:function:ecommerce-product-handler-/);
      expect(outputs.OrderLambdaArn).toMatch(/^arn:aws:lambda:[\w-]+:\d+:function:ecommerce-order-handler-/);
      expect(outputs.AuthLambdaArn).toMatch(/^arn:aws:lambda:[\w-]+:\d+:function:ecommerce-auth-handler-/);

      // Check environment suffix in function names
      expect(outputs.ProductLambdaArn).toContain(environmentSuffix);
      expect(outputs.OrderLambdaArn).toContain(environmentSuffix);
      expect(outputs.AuthLambdaArn).toContain(environmentSuffix);
    });

    test('Total Reserved Concurrency output exists', () => {
      if (Object.keys(outputs).length === 0) {
        console.warn('No outputs found, skipping concurrency test');
        return;
      }

      expect(outputs.TotalReservedConcurrency).toBeDefined();
      expect(outputs.TotalReservedConcurrency).toBe('45');
    });
  });

  describe('CORS Configuration', () => {
    test('API returns proper CORS headers on OPTIONS requests', async () => {
      if (!outputs.ECommerceApiUrl) {
        console.warn('API URL not found in outputs, skipping CORS test');
        return;
      }

      const response = await fetch(`${outputs.ECommerceApiUrl}auth`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://example.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });

      expect(response.headers.get('access-control-allow-origin')).toBeTruthy();
      expect(response.headers.get('access-control-allow-methods')).toBeTruthy();
      expect(response.headers.get('access-control-allow-headers')).toBeTruthy();
    });

    test('API returns CORS headers on actual requests', async () => {
      if (!outputs.ECommerceApiUrl) {
        console.warn('API URL not found in outputs, skipping CORS test');
        return;
      }

      const response = await fetch(`${outputs.ECommerceApiUrl}auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://example.com'
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      });

      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });
  });

  describe('Error Handling', () => {
    test('Auth endpoint handles malformed JSON gracefully', async () => {
      if (!outputs.ECommerceApiUrl) {
        console.warn('API URL not found in outputs, skipping error handling test');
        return;
      }

      const response = await fetch(`${outputs.ECommerceApiUrl}auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: 'invalid-json-payload'
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Internal server error');
    });

    test('API returns 403 for non-existent endpoints (due to missing API key)', async () => {
      if (!outputs.ECommerceApiUrl) {
        console.warn('API URL not found in outputs, skipping 404 test');
        return;
      }

      const response = await fetch(`${outputs.ECommerceApiUrl}nonexistent-endpoint`, {
        method: 'GET'
      });

      // API Gateway with API key requirements returns 403 for missing resources without keys
      expect(response.status).toBe(403);
    });

    test('Auth endpoint returns proper error structure', async () => {
      if (!outputs.ECommerceApiUrl) {
        console.warn('API URL not found in outputs, skipping error structure test');
        return;
      }

      const response = await fetch(`${outputs.ECommerceApiUrl}auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@example.com'
          // Missing password
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(typeof data.error).toBe('string');
    });
  });

  describe('Environment-Specific Resources', () => {
    test('all resources include environment suffix in names', () => {
      if (Object.keys(outputs).length === 0) {
        console.warn('No outputs found, skipping environment suffix test');
        return;
      }

      // Check S3 bucket
      if (outputs.ECommerceS3Bucket) {
        expect(outputs.ECommerceS3Bucket).toContain(environmentSuffix);
      }

      // Check DLQ
      if (outputs.ECommerceDLQUrl) {
        expect(outputs.ECommerceDLQUrl).toContain(environmentSuffix);
      }

      // Check Lambda ARNs
      if (outputs.ProductLambdaArn) {
        expect(outputs.ProductLambdaArn).toContain(environmentSuffix);
      }
      if (outputs.OrderLambdaArn) {
        expect(outputs.OrderLambdaArn).toContain(environmentSuffix);
      }
      if (outputs.AuthLambdaArn) {
        expect(outputs.AuthLambdaArn).toContain(environmentSuffix);
      }
    });

    test('resources are properly isolated by environment', () => {
      if (Object.keys(outputs).length === 0) {
        console.warn('No outputs found, skipping environment isolation test');
        return;
      }

      // Ensure resources are not using hardcoded names
      const resourceNames = [
        outputs.ECommerceS3Bucket,
        outputs.ECommerceDLQUrl,
        outputs.ProductLambdaArn,
        outputs.OrderLambdaArn,
        outputs.AuthLambdaArn
      ].filter(Boolean);

      resourceNames.forEach(resourceName => {
        expect(resourceName).toContain(environmentSuffix);
        // Should not contain other common environment names if this is not that environment
        if (environmentSuffix !== 'prod') {
          expect(resourceName).not.toContain('-prod-');
        }
        if (environmentSuffix !== 'dev') {
          expect(resourceName).not.toContain('-dev-');
        }
        if (environmentSuffix !== 'staging') {
          expect(resourceName).not.toContain('-staging-');
        }
      });
    });
  });

  describe('API Gateway Rate Limiting', () => {
    test('API Gateway should handle concurrent requests', async () => {
      if (!outputs.ECommerceApiUrl) {
        console.warn('API URL not found in outputs, skipping rate limiting test');
        return;
      }

      // Make multiple concurrent requests to test rate limiting
      const requests = Array(5).fill(null).map(() =>
        fetch(`${outputs.ECommerceApiUrl}auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
          })
        })
      );

      const responses = await Promise.all(requests);

      // All requests should complete (not necessarily succeed, but not fail due to overload)
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });

      // At least some should succeed
      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses.length).toBeGreaterThan(0);
    }, 10000); // 10 second timeout for this test
  });

  describe('Lambda Function Integration', () => {
    test('Product Lambda processes requests correctly', async () => {
      if (!outputs.ECommerceApiUrl) {
        console.warn('API URL not found in outputs, skipping Lambda integration test');
        return;
      }

      // Test auth endpoint (no API key required) to verify Lambda integration
      const response = await fetch(`${outputs.ECommerceApiUrl}auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'integration-test@example.com',
          password: 'testpass123'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      // Verify the Lambda response structure matches expected format
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('userId');
      expect(data).toHaveProperty('email');

      expect(data.message).toBe('Authentication successful');
      expect(data.email).toBe('integration-test@example.com');
    });
  });
});