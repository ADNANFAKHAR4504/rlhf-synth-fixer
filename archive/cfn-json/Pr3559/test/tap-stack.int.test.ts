import fs from 'fs';
import path from 'path';
import https from 'https';

// Helper function to make HTTPS requests and return a promise
const makeRequest = (options: https.RequestOptions, postData: string = '') => {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};


// Check if the CloudFormation outputs file exists. This allows the test to be skipped
// when run locally, preventing crashes, but run in the CI/CD pipeline after deployment.
const outputsFilePath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
const cfnOutputsExist = fs.existsSync(outputsFilePath);

const describeIf = (condition: boolean) => (condition ? describe : describe.skip);

describeIf(cfnOutputsExist)('Portfolio API Integration Tests', () => {
  // Parse the outputs file to get the deployed API endpoint URL
  const outputs = JSON.parse(fs.readFileSync(outputsFilePath, 'utf8'));
  const apiEndpoint = new URL(outputs.ApiEndpoint);

  // Set a longer timeout for the API call
  jest.setTimeout(30000); // 30 seconds

  /**
   * Test 1: Happy Path
   * This test sends a valid POST request and expects a 200 OK response.
   */
  test('POST /contact with valid data should return a 200 OK response', async () => {
    const postData = JSON.stringify({
      name: 'Integration Test',
      email: 'test@example.com',
      message: 'This is a test message.',
    });

    const options = {
      hostname: apiEndpoint.hostname,
      path: apiEndpoint.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    // @ts-ignore
    const response: { statusCode: number, body: string } = await makeRequest(options, postData);

    expect(response.statusCode).toBe(200);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.message).toBe('Contact form submission successful');
  });

  /**
   * Test 2: Invalid HTTP Method
   * This test sends a GET request to an endpoint that only accepts POST.
   * API Gateway should block this and return a 403 Forbidden status.
   */
  test('GET /contact should return a 403 Forbidden response', async () => {
    const options = {
      hostname: apiEndpoint.hostname,
      path: apiEndpoint.pathname,
      method: 'GET',
    };

    // @ts-ignore
    const response: { statusCode: number } = await makeRequest(options);
    expect(response.statusCode).toBe(403);
  });

  /**
   * Test 3: Malformed Payload
   * This test sends a POST request with an empty body.
   * The Lambda function should handle this gracefully and return a 500 error, not crash.
   */
  test('POST /contact with an empty body should return a 500 Internal Server Error', async () => {
    const postData = ''; // Invalid JSON

    const options = {
      hostname: apiEndpoint.hostname,
      path: apiEndpoint.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    // @ts-ignore
    const response: { statusCode: number, body: string } = await makeRequest(options, postData);

    expect(response.statusCode).toBe(500);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.message).toBe('An error occurred');
  });
});

