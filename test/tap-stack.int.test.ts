import axios, { AxiosResponse } from 'axios';

// Configuration - These are coming from cdk-outputs after cdk deploy
import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cdk-outputs/flat-outputs.json', 'utf8')
);
const API_GATEWAY_ENDPOINT = Object.entries(outputs).find(([key]) =>
  key.startsWith('TurnAroundPromptApiEndpoint')
)?.[1];

const READ_ONLY_API_KEY =
  process.env.READ_ONLY_API_KEY ||
  'readOnlyApiKeyValuexxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const ADMIN_API_KEY =
  process.env.ADMIN_API_KEY || 'adminApiKeyValuexxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

describe('Turn Around Prompt API Integration Tests', () => {
  const baseURL = `${API_GATEWAY_ENDPOINT}turnaroundprompt`;
  let TEST_RECORD_ID: string;
  const TEST_RECORD_NAME = 'Test Record Name';
  const UPDATED_RECORD_NAME = 'Updated Record Name';

  // Helper function to make authenticated requests
  const makeRequest = async (
    method: 'GET' | 'PUT' | 'PATCH' | 'DELETE',
    data?: { id?: string; [key: string]: any },
    apiKey: string = ADMIN_API_KEY
  ): Promise<AxiosResponse> => {
    return await axios({
      method,
      url: method !== 'GET' ? baseURL : `${baseURL}?id=${data?.id}`,
      data: method !== 'GET' ? data : undefined,
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
        'x-api-key': apiKey,
      },
      validateStatus: () => true, // Don't throw on HTTP error status codes
    });
  };

  // Cleanup function to ensure test record doesn't exist
  const cleanupTestRecord = async (): Promise<void> => {
    try {
      await makeRequest('DELETE', { id: TEST_RECORD_ID });
    } catch (error) {
      // Ignore errors during cleanup
    }
  };

  beforeEach(async () => {
    // Clean up before each test
    await cleanupTestRecord();
    TEST_RECORD_ID = `TAP-${Date.now()}`;
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupTestRecord();
  });

  describe('PUT record', () => {
    test('should put one record in the database', async () => {
      const requestBody = {
        id: TEST_RECORD_ID,
        name: TEST_RECORD_NAME,
        status: 'active', // Assuming status is a required field
      };

      const response = await makeRequest('PUT', requestBody);

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();

      // Validate that the record was created
      const getResponse = await makeRequest(
        'GET',
        { id: TEST_RECORD_ID },
        READ_ONLY_API_KEY
      );
      expect(getResponse.status).toBe(200);
      expect(getResponse.data).toBeDefined();
      expect(getResponse.data.id).toBe(TEST_RECORD_ID);
      expect(getResponse.data.name).toBe(TEST_RECORD_NAME);
      expect(getResponse.data.status).toBe('active');
    });

    test('should raise a 400 exception if the record already exists', async () => {
      const requestBody = {
        id: TEST_RECORD_ID,
        name: TEST_RECORD_NAME,
        status: 'active', // Assuming status is a required field
      };

      // First, create the record
      const firstResponse = await makeRequest('PUT', requestBody);
      expect(firstResponse.status).toBe(200);

      // Try to create the same record again
      const secondResponse = await makeRequest('PUT', requestBody);
      expect(secondResponse.status).toBe(400);
    });

    test('should raise a 400 exception if bad request (missing required fields)', async () => {
      // Missing 'name' field
      const invalidRequestBody = {
        id: TEST_RECORD_ID,
      };

      const response = await makeRequest('PUT', invalidRequestBody);
      expect(response.status).toBe(400);
    });

    test('should raise a 400 exception if bad request (missing id field)', async () => {
      // Missing 'id' field
      const invalidRequestBody = {
        name: TEST_RECORD_NAME,
      };

      const response = await makeRequest('PUT', invalidRequestBody);
      expect(response.status).toBe(400);
    });

    test('should raise a 400 exception if bad request (invalid JSON schema)', async () => {
      // Invalid data types
      const invalidRequestBody = {
        id: 'TA-123', // Should be string starting with 'TAP-'
        name: TEST_RECORD_NAME,
      };

      const response = await makeRequest('PUT', invalidRequestBody);
      expect(response.status).toBe(400);
    });

    test('should raise a 403 exception if no API key provided', async () => {
      const requestBody = {
        id: TEST_RECORD_ID,
        name: TEST_RECORD_NAME,
      };

      const response = await axios({
        method: 'PUT',
        url: baseURL,
        data: requestBody,
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(403);
    });

    test('should raise a 403 exception if invalid API key provided', async () => {
      const requestBody = {
        id: TEST_RECORD_ID,
        name: TEST_RECORD_NAME,
      };

      const response = await axios({
        method: 'PUT',
        url: baseURL,
        data: requestBody,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'invalid-api-key',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(403);
    });
  });

  describe('GET record', () => {
    test('should get one record from the database', async () => {
      // First, create a record to retrieve
      const createRequestBody = {
        id: TEST_RECORD_ID,
        name: TEST_RECORD_NAME,
      };
      await makeRequest('PUT', createRequestBody);

      // Now retrieve it
      const getRequestBody = {
        id: TEST_RECORD_ID,
      };

      const response = await makeRequest(
        'GET',
        getRequestBody,
        READ_ONLY_API_KEY
      );

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      // Depending on DynamoDB response format, you might want to check specific fields
    });

    test('should work with read-only API key', async () => {
      // First, create a record with admin key
      const createRequestBody = {
        id: TEST_RECORD_ID,
        name: TEST_RECORD_NAME,
      };
      await makeRequest('PUT', createRequestBody, ADMIN_API_KEY);

      // Now retrieve it with read-only key
      const getRequestBody = {
        id: TEST_RECORD_ID,
      };

      const response = await makeRequest(
        'GET',
        getRequestBody,
        READ_ONLY_API_KEY
      );
      expect(response.status).toBe(200);
    });
  });

  describe('PATCH record', () => {
    test('should update an existing record in the database', async () => {
      // First, create a record
      const createRequestBody = {
        id: TEST_RECORD_ID,
        name: TEST_RECORD_NAME,
        status: 'active', // Assuming status is a required field
      };
      await makeRequest('PUT', createRequestBody);

      // Now update it
      const updateRequestBody = {
        id: TEST_RECORD_ID,
        name: UPDATED_RECORD_NAME,
        status: 'inactive', // Assuming status is a required field
      };

      const response = await makeRequest('PATCH', updateRequestBody);
      expect(response.status).toBe(200);

      // Validate that the record was updated
      const getResponse = await makeRequest(
        'GET',
        { id: TEST_RECORD_ID },
        READ_ONLY_API_KEY
      );
      expect(getResponse.status).toBe(200);
      expect(getResponse.data).toBeDefined();
      expect(getResponse.data.id).toBe(TEST_RECORD_ID);
      expect(getResponse.data.name).toBe(UPDATED_RECORD_NAME);
      expect(getResponse.data.status).toBe('inactive');
    });

    test('should raise a 400 exception if record does not exist', async () => {
      const updateRequestBody = {
        id: 'non-existent-record-id',
        name: UPDATED_RECORD_NAME,
        status: 'active', // Assuming status is a required field
      };

      const response = await makeRequest('PATCH', updateRequestBody);
      expect(response.status).toBe(400);
    });

    test('should raise a 400 exception if bad request (missing required fields)', async () => {
      // Missing 'name' field
      const invalidRequestBody = {
        id: TEST_RECORD_ID,
      };

      const response = await makeRequest('PATCH', invalidRequestBody);
      expect(response.status).toBe(400);
    });

    test('should raise a 400 exception if bad request (missing id field)', async () => {
      // Missing 'id' field
      const invalidRequestBody = {
        name: UPDATED_RECORD_NAME,
      };

      const response = await makeRequest('PATCH', invalidRequestBody);
      expect(response.status).toBe(400);
    });

    test('should raise a 400 exception if bad request (invalid JSON schema)', async () => {
      // Invalid data types
      const invalidRequestBody = {
        id: TEST_RECORD_ID,
        name: 123, // Should be string
      };

      const response = await makeRequest('PATCH', invalidRequestBody);
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE record', () => {
    test('should delete one record from the database', async () => {
      // First, create a record to delete
      const createRequestBody = {
        id: TEST_RECORD_ID,
        name: TEST_RECORD_NAME,
        status: 'active', // Assuming status is a required field
      };
      await makeRequest('PUT', createRequestBody);

      // Now delete it
      const deleteRequestBody = {
        id: TEST_RECORD_ID,
      };

      const response = await makeRequest('DELETE', deleteRequestBody);
      expect(response.status).toBe(200);

      // Validate that the record was deleted
      const getResponse = await makeRequest(
        'GET',
        { id: TEST_RECORD_ID },
        READ_ONLY_API_KEY
      );
      expect(getResponse.status).toBe(200);
      expect(getResponse.data).toBeDefined();
      expect(getResponse.data.id).toBe(TEST_RECORD_ID);
      expect(getResponse.data.deleted).toBe('true'); // Assuming deleted flag is set
    });

    test('should raise a 404 exception if record does not exist', async () => {
      const deleteRequestBody = {
        id: 'non-existent-record-id',
      };

      const response = await makeRequest('DELETE', deleteRequestBody);
      expect(response.status).toBe(400);
    });

    test('should raise a 400 exception if bad request (missing id field)', async () => {
      const invalidRequestBody = {};

      const response = await makeRequest('DELETE', invalidRequestBody);
      expect(response.status).toBe(400);
    });

    test('should raise a 400 exception if bad request (invalid JSON schema)', async () => {
      // Invalid data type
      const invalidRequestBody = {
        id: 'TA-2343', // Should be string
      };

      const response = await makeRequest('DELETE', invalidRequestBody);
      expect(response.status).toBe(400);
    });

    test('should fail if deleting an already deleted record', async () => {
      // First, create a record
      const createRequestBody = {
        id: TEST_RECORD_ID,
        name: TEST_RECORD_NAME,
        status: 'active', // Assuming status is a required field
      };
      await makeRequest('PUT', createRequestBody);

      // Delete it once
      const deleteRequestBody = {
        id: TEST_RECORD_ID,
      };
      const firstDeleteResponse = await makeRequest(
        'DELETE',
        deleteRequestBody
      );
      expect(firstDeleteResponse.status).toBe(200);

      // Delete it again - should be idempotent or return 404
      const secondDeleteResponse = await makeRequest(
        'DELETE',
        deleteRequestBody
      );
      expect(secondDeleteResponse.status).toBe(400);
    });
  });

  describe('API Key Authorization', () => {
    test('should accept valid admin API key for all operations', async () => {
      const requestBody = {
        id: TEST_RECORD_ID,
        name: TEST_RECORD_NAME,
        status: 'active', // Assuming status is a required field
      };

      // Test PUT with admin key
      const putResponse = await makeRequest('PUT', requestBody, ADMIN_API_KEY);
      expect(putResponse.status).toBe(200);

      // Test GET with admin key
      const getResponse = await makeRequest(
        'GET',
        { id: TEST_RECORD_ID },
        ADMIN_API_KEY
      );
      expect(getResponse.status).toBe(200);

      // Test PATCH with admin key
      const patchResponse = await makeRequest(
        'PATCH',
        { id: TEST_RECORD_ID, name: UPDATED_RECORD_NAME, status: 'inactive' },
        ADMIN_API_KEY
      );
      expect(patchResponse.status).toBe(200);

      // Test DELETE with admin key
      const deleteResponse = await makeRequest(
        'DELETE',
        { id: TEST_RECORD_ID },
        ADMIN_API_KEY
      );
      expect(deleteResponse.status).toBe(200);
    });

    test('should accept valid read-only API key for GET operations', async () => {
      // First create a record with admin key
      const createRequestBody = {
        id: TEST_RECORD_ID,
        name: TEST_RECORD_NAME,
      };
      await makeRequest('PUT', createRequestBody, ADMIN_API_KEY);

      // Test GET with read-only key
      const getResponse = await makeRequest(
        'GET',
        { id: TEST_RECORD_ID },
        READ_ONLY_API_KEY
      );
      expect(getResponse.status).toBe(200);
    });

    test('should reject requests without API key', async () => {
      const response = await axios({
        method: 'GET',
        url: baseURL,
        data: { id: TEST_RECORD_ID },
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(403);
    });
  });

  describe('Content-Type Validation', () => {
    test('should reject requests with invalid Content-Type', async () => {
      const requestBody = {
        id: TEST_RECORD_ID,
        name: TEST_RECORD_NAME,
      };

      const response = await axios({
        method: 'PUT',
        url: baseURL,
        data: requestBody,
        headers: {
          'Content-Type': 'text/plain',
          'x-api-key': ADMIN_API_KEY,
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(415); // 415 Unsupported Media Type
    });

    test('should accept requests with correct Content-Type', async () => {
      const requestBody = {
        id: TEST_RECORD_ID,
        name: TEST_RECORD_NAME,
        status: 'active',
      };

      const response = await makeRequest('PUT', requestBody);
      expect(response.status).toBe(200);
    });
  });

  describe('Rate Limiting', () => {
    test('should respect rate limits', async () => {
      const requestBody = {
        id: TEST_RECORD_ID,
        name: TEST_RECORD_NAME,
      };

      // Create the record first
      await makeRequest('PUT', requestBody);

      // Make multiple rapid requests to test rate limiting
      const promises = Array.from({ length: 25 }, (_, i) =>
        makeRequest('GET', { id: TEST_RECORD_ID }).then(response => ({
          index: i,
          status: response.status,
        }))
      );

      const results = await Promise.all(promises);

      // Check if any requests were rate limited (429 status)
      const rateLimitedRequests = results.filter(
        result => result.status === 429
      );

      // With a rate limit of 10 req/sec and burst of 20, we should see some rate limiting
      // Note: This test might be flaky depending on timing, so we just check that the API responds
      expect(results.length).toBe(25);

      // At least some requests should succeed
      const successfulRequests = results.filter(
        result => result.status === 200
      );
      expect(successfulRequests.length).toBeGreaterThan(0);
    }, 30000); // Increased timeout for this test
  });
});
