import axios from 'axios';
import fs from 'fs';
import path from 'path';

// --- Test Configuration ---

// Read outputs from the deployed stack
let outputs: { [key: string]: string };
try {
  outputs = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../cfn-outputs/flat-outputs.json'), 'utf8')
  );
} catch (error) {
  console.warn('Could not read cfn-outputs/flat-outputs.json. Skipping integration tests.');
  outputs = {};
}

// The API Key's *value* must be set as an environment variable in your CI/CD pipeline
const API_KEY = process.env.API_KEY_VALUE;
const API_URL = outputs.ApiInvokeUrl;

// --- Test Suite ---

// Skip all tests if the API URL or Key is not available
const describeIf = (condition: any) => (condition ? describe : describe.skip);

describeIf(API_URL && API_KEY)('Payment API Integration Tests', () => {
  const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
      'x-api-key': API_KEY,
    },
    validateStatus: () => true, // Let us handle all status codes
  });

  describe('POST /payments', () => {
    test('should process a valid payment and return 200 OK', async () => {
      const paymentData = { amount: 150.75, currency: 'USD' };
      const response = await apiClient.post('payments', paymentData);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('paymentId');
      expect(response.data.status).toBe('success');
    });

    test('should handle requests with no body gracefully', async () => {
      const response = await apiClient.post('payments', {});
      expect(response.status).toBe(200);
      expect(response.data.amount).toBe(0);
    });
  });

  describe('GET /transactions', () => {
    test('should retrieve a list of transactions with correct CORS header', async () => {
      const response = await apiClient.get('transactions');

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('access-control-allow-origin', '*');
      expect(Array.isArray(response.data.transactions)).toBe(true);
    });

    test('should respect the "limit" query parameter', async () => {
      const limit = 3;
      const response = await apiClient.get(`transactions?limit=${limit}`);

      expect(response.status).toBe(200);
      expect(response.data.transactions).toHaveLength(limit);
      expect(response.data.count).toBe(limit);
    });
  });

  describe('API Security and Routing', () => {
    test('should return 403 Forbidden without an API key', async () => {
      const clientWithoutKey = axios.create({ baseURL: API_URL, validateStatus: () => true });
      const response = await clientWithoutKey.get('transactions');
      expect(response.status).toBe(403);
    });

    test('should return 403 Forbidden for a non-existent path', async () => {
      // API Gateway returns 403 for paths that don't exist when an API key is required.
      const response = await apiClient.get('/non-existent-path');
      expect(response.status).toBe(403);
    });
  });
});
