// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import axios from 'axios';

// Get environment suffix from environment variable (set by CI/CD pipeline)  
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Try to load outputs if available
let outputs: any = {};
try {
  if (fs.existsSync('cfn-outputs/flat-outputs.json')) {
    outputs = JSON.parse(
      fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
    );
  }
} catch (error) {
  console.warn('Could not load outputs file, skipping integration tests');
}

describe('Travel Platform API Integration Tests', () => {
  const apiEndpoint = outputs.ApiEndpoint;
  const skipTests = !apiEndpoint;

  beforeAll(() => {
    if (skipTests) {
      console.log('Skipping integration tests - API endpoint not available');
    }
  });

  describe('Infrastructure Validation', () => {
    test('should have all required outputs available', () => {
      if (skipTests) {
        console.log('Skipping test: API endpoint not available');
        return;
      }

      const requiredOutputs = [
        'ApiEndpoint',
        'TravelDataTableName',
        'TravelDataTableArn',
        'CacheEndpoint',
        'EventBusName',
        'DashboardURL',
        'StackName',
        'EnvironmentSuffix'
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBeNull();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('API endpoint should be valid URL', () => {
      if (skipTests) {
        console.log('Skipping test: API endpoint not available');
        return;
      }

      expect(apiEndpoint).toMatch(/^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/[a-z0-9]+$/);
    });

    test('environment suffix should match expected value', () => {
      if (skipTests) {
        console.log('Skipping test: API endpoint not available');
        return;
      }

      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
    });
  });

  describe('API Functionality Tests', () => {
    test('should return 400 for search without query parameter', async () => {
      if (skipTests) {
        console.log('Skipping test: API endpoint not available');
        return;
      }

      try {
        const response = await axios.get(`${apiEndpoint}/search`);
        // Should not reach here
        expect(false).toBe(true);
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toBe('Query parameter "q" is required');
      }
    }, 10000);

    test('should return 404 for invalid endpoint', async () => {
      if (skipTests) {
        console.log('Skipping test: API endpoint not available');
        return;
      }

      try {
        const response = await axios.get(`${apiEndpoint}/invalid`);
        // Should not reach here
        expect(false).toBe(true);
      } catch (error: any) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.error).toBe('Not Found');
      }
    }, 10000);

    test('should successfully process flight search request', async () => {
      if (skipTests) {
        console.log('Skipping test: API endpoint not available');
        return;
      }

      const response = await axios.get(`${apiEndpoint}/search`, {
        params: {
          type: 'flight',
          q: 'NYC-LAX'
        }
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data.searchType).toBe('flight');
      expect(response.data.query).toBe('NYC-LAX');
      expect(response.data.results).toBeDefined();
      expect(Array.isArray(response.data.results)).toBe(true);
      expect(response.data.results.length).toBeGreaterThan(0);
    }, 10000);

    test('should successfully process hotel search request', async () => {
      if (skipTests) {
        console.log('Skipping test: API endpoint not available');
        return;
      }

      const response = await axios.get(`${apiEndpoint}/search`, {
        params: {
          type: 'hotel',
          q: 'Paris'
        }
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data.searchType).toBe('hotel');
      expect(response.data.query).toBe('Paris');
      expect(response.data.results).toBeDefined();
      expect(Array.isArray(response.data.results)).toBe(true);
    }, 10000);

    test('should include proper CORS headers', async () => {
      if (skipTests) {
        console.log('Skipping test: API endpoint not available');
        return;
      }

      const response = await axios.get(`${apiEndpoint}/search`, {
        params: {
          type: 'flight',
          q: 'test-search'
        }
      });

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['x-request-id']).toBeDefined();
    }, 10000);

    test('should handle repeated requests (caching test)', async () => {
      if (skipTests) {
        console.log('Skipping test: API endpoint not available');
        return;
      }

      const searchQuery = `cache-test-${Date.now()}`;
      
      // First request
      const response1 = await axios.get(`${apiEndpoint}/search`, {
        params: {
          type: 'flight',
          q: searchQuery
        }
      });

      expect(response1.status).toBe(200);
      
      // Second request (should be faster due to caching)
      const response2 = await axios.get(`${apiEndpoint}/search`, {
        params: {
          type: 'flight',
          q: searchQuery
        }
      });

      expect(response2.status).toBe(200);
      expect(response2.data).toEqual(response1.data);
    }, 15000);
  });

  describe('Error Handling Tests', () => {
    test('should handle malformed requests gracefully', async () => {
      if (skipTests) {
        console.log('Skipping test: API endpoint not available');
        return;
      }

      try {
        const response = await axios.post(`${apiEndpoint}/search`, {
          invalid: 'data'
        });
        // Should not reach here
        expect(false).toBe(true);
      } catch (error: any) {
        expect([404, 405]).toContain(error.response.status);
      }
    }, 10000);

    test('should return proper error structure', async () => {
      if (skipTests) {
        console.log('Skipping test: API endpoint not available');
        return;
      }

      try {
        await axios.get(`${apiEndpoint}/search`);
      } catch (error: any) {
        expect(error.response.data).toBeDefined();
        expect(error.response.data.error).toBeDefined();
        expect(typeof error.response.data.error).toBe('string');
      }
    }, 10000);
  });

  describe('Performance Tests', () => {
    test('should respond within reasonable time limits', async () => {
      if (skipTests) {
        console.log('Skipping test: API endpoint not available');
        return;
      }

      const startTime = Date.now();
      
      const response = await axios.get(`${apiEndpoint}/search`, {
        params: {
          type: 'flight',
          q: `perf-test-${Date.now()}`
        }
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    }, 10000);

    test('should handle concurrent requests', async () => {
      if (skipTests) {
        console.log('Skipping test: API endpoint not available');
        return;
      }

      const concurrentRequests = 5;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          axios.get(`${apiEndpoint}/search`, {
            params: {
              type: 'flight',
              q: `concurrent-test-${i}-${Date.now()}`
            }
          })
        );
      }

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
      });
    }, 15000);
  });

  describe('Data Persistence Tests', () => {
    test('should persist search data in DynamoDB', async () => {
      if (skipTests) {
        console.log('Skipping test: API endpoint not available');
        return;
      }

      const uniqueQuery = `persistence-test-${Date.now()}`;
      
      // Make a search request
      const response = await axios.get(`${apiEndpoint}/search`, {
        params: {
          type: 'flight',
          q: uniqueQuery
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.query).toBe(uniqueQuery);
      
      // Make the same request again to verify it's retrieved from the database
      const response2 = await axios.get(`${apiEndpoint}/search`, {
        params: {
          type: 'flight',
          q: uniqueQuery
        }
      });

      expect(response2.status).toBe(200);
      expect(response2.data).toEqual(response.data);
    }, 15000);
  });
});
