import fs from 'fs';
import path from 'path';
import axios, { AxiosError } from 'axios';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

describe('Secure API Integration Tests', () => {

  let apiUrl: string;

  beforeAll(() => {
    // Get the API Gateway URL from the CloudFormation outputs
    apiUrl = outputs.ApiGatewayInvokeURL;
    if (!apiUrl) {
      throw new Error('API Gateway URL not found in cfn-outputs.json');
    }
  });

  // Test to verify the API endpoint is reachable and returns the correct response
  test('should successfully call the API Gateway endpoint and retrieve the secret', async () => {
    let response;
    try {
      // Make a GET request to the deployed API endpoint
      response = await axios.get(apiUrl, { timeout: 10000 });
    } catch (error) {
      const axiosError = error as AxiosError;
      // Provide detailed logging for debugging API errors
      if (axiosError.response) {
        console.error(`Received status code: ${axiosError.response.status}`);
        console.error('Response data:', axiosError.response.data);
      }
      // If the request fails, throw a more descriptive error
      throw new Error(`Failed to call API Gateway endpoint at ${apiUrl}. Error: ${axiosError.message}`);
    }

    // Assert that the HTTP status code is 200 (OK)
    expect(response.status).toBe(200);

    // Assert that the response body contains the expected success message
    // This verifies that the Lambda function executed successfully
    expect(response.data).toBe('Hello, secure world! We retrieved the secret.');
  });
});
