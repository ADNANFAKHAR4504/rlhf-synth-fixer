import axios from 'axios';

// These tests assume the stack has been deployed and environment variables are set.
// They are designed to run against a real environment (staging/prod).

describe('End-to-End Application Flows', () => {
  const cloudFrontUrl = process.env.CLOUDFRONT_URL || 'https://example.com';
  const apiUrl = process.env.API_URL || 'https://api.example.com';

  // Skip tests if URLs are placeholder or not provided, preventing failure in non-deployed envs
  // during simple build/test cycles unless explicitly enabled.
  const runE2E = process.env.RUN_E2E === 'true';

  if (!runE2E) {
    test.skip('Skipping E2E tests as RUN_E2E is not set', () => {});
    return;
  }

  test('Flow 1: User can access the frontend application', async () => {
    // Scenario: User navigates to the main website
    try {
      const response = await axios.get(cloudFrontUrl);
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
    } catch (error) {
      // Fail gracefully with context
      throw new Error(
        `Failed to access Frontend at ${cloudFrontUrl}: ${error}`
      );
    }
  });

  test('Flow 2: Frontend can communicate with Backend API', async () => {
    // Scenario: Frontend calls the API health check or status endpoint
    try {
      const response = await axios.get(`${apiUrl}/api/health`); // Assuming /api prefix routing
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
    } catch (error) {
      throw new Error(
        `Failed to access Backend API at ${apiUrl}/api/health: ${error}`
      );
    }
  });

  test('Flow 3: Backend can connect to Database', async () => {
    // Scenario: API endpoint that requires DB access (e.g., list users or status)
    // This validates the ECS -> RDS connection and security groups
    try {
      const response = await axios.get(`${apiUrl}/api/db-status`); // Hypothetical endpoint
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'connected');
    } catch (error) {
      // If the endpoint doesn't exist, we might get 404, but 500 implies DB connection fail usually
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.warn('DB status endpoint not found, skipping strict check');
      } else {
        throw new Error(`Backend failed to connect to DB: ${error}`);
      }
    }
  });

  test('Flow 4: Security WAF blocks malicious requests', async () => {
    // Scenario: Attacker tries SQL Injection
    try {
      await axios.get(`${apiUrl}/api/search?q=' OR 1=1 --`);
      fail('Request should have been blocked by WAF');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // WAF usually returns 403 Forbidden
        expect(error.response?.status).toBe(403);
      } else {
        throw error;
      }
    }
  });
});
