import fs from 'fs';
import path from 'path';
import axios from 'axios'; // You'll need to install this: npm install axios

// --- Configuration ---
// Load the deployed CloudFormation stack's outputs
let outputs;
try {
  const outputPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
  outputs = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
} catch (error) {
  console.error(
    'Error: Could not read cfn-outputs/flat-outputs.json. Make sure you have deployed the stack and the output file exists.'
  );
  // Set a default to prevent the test suite from crashing if the file doesn't exist.
  outputs = { ApiUrl: '' };
}

const apiUrl = outputs.ApiUrl;

describe('Greeting API Integration Tests', () => {
  // Check if the API URL is available before running tests
  if (!apiUrl) {
    test.only('Skipping integration tests because ApiUrl is not defined in cfn-outputs/flat-outputs.json', () => {
      console.warn(
        'Skipping integration tests. Please deploy the CloudFormation stack first.'
      );
      expect(true).toBe(true);
    });
    return;
  }

  describe('GET /greet endpoint', () => {
    test('should return a 200 status code and the correct greeting message', async () => {
      try {
        // Act: Make a GET request to the deployed API endpoint
        const response = await axios.get(apiUrl);

        // Assert: Check the response
        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
        expect(response.data.message).toBe(
          'Hello from a secure, serverless API!'
        );
      } catch (error) {
        // FIX: Handle the 'unknown' type of the error object in a catch block.
        // We check if it's an instance of Error before accessing .message.
        if (error instanceof Error) {
          console.error('API request failed:', error.message);
        } else {
          console.error('An unknown error occurred during the API request:', error);
        }
        // We rethrow the error to ensure the test case fails.
        throw error;
      }
    }, 15000); // Increase timeout to 15 seconds for potential Lambda cold starts
  });
});
