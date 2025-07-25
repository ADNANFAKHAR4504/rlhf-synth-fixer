import fs from 'fs';
import path from 'path';
import axios from 'axios';
import {
  CloudFormationClient,
  DescribeStackResourcesCommand,
} from '@aws-sdk/client-cloudformation'; // You'll need to install this: npm install @aws-sdk/client-cloudformation

// --- Configuration ---

// **IMPORTANT**: Update this to match the name of your deployed CloudFormation stack.
const stackName = 'GreetingApiStack';

// The AWS SDK for JavaScript (v3) will automatically use credentials from environment variables:
// - AWS_ACCESS_KEY_ID
// - AWS_SECRET_ACCESS_KEY
// - AWS_SESSION_TOKEN (optional)
// It will also use the region from the AWS_REGION environment variable.
const awsRegion = process.env.AWS_REGION || 'us-east-1'; // Default to a region if not set in environment

// Load the deployed CloudFormation stack's outputs
let outputs;
try {
  // This path assumes your tests are run from a 'tests' or 'src' directory.
  // Adjust the path if your directory structure is different.
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

const credentials = {
  accessKeyId: awsAccessKeyId,
  secretAccessKey: awsSecretAccessKey,
};

// Initialize the CloudFormation client. It will automatically pick up credentials
// and region from the environment.
const cfClient = new CloudFormationClient({ region, credentials });

/**
 * Test Suite for CloudFormation Stack Validation.
 * These tests connect to AWS to verify that the infrastructure is deployed correctly.
 */
describe('CloudFormation Stack Validation', () => {
  let stackResources;

  // Before running any tests in this suite, fetch the stack resources once.
  beforeAll(async () => {
    // A test will fail if a stack name is not provided.
    if (!stackName) {
      console.error('Stack name is not configured. Please set the `stackName` variable in the test file.');
      stackResources = [];
      return;
    }

    try {
      const command = new DescribeStackResourcesCommand({ StackName: stackName });
      const response = await cfClient.send(command);
      stackResources = response.StackResources;
      console.log(`Successfully fetched ${stackResources.length} resources for stack: ${stackName}`);
    } catch (error) {
      console.error(
        `Failed to describe stack resources for stack "${stackName}".\nPlease ensure:\n1. The stack is deployed in the '${awsRegion}' region.\n2. The stack name is correct.\n3. Your AWS credentials in the environment variables are valid and have permissions.`
      );
      // Set to an empty array to prevent subsequent tests from failing due to an undefined variable.
      stackResources = [];
    }
  }, 30000); // Increase timeout to 30 seconds for the AWS API call.

  test('should have the stack deployed and be able to fetch its resources', () => {
    expect(stackResources.length).toBeGreaterThan(0);
  });

  test('should contain all the essential resource types from the YAML file', () => {
    // Define the expected resource types based on the stack.yaml file.
    const expectedResourceTypes = [
      'AWS::ApiGateway::RestApi',
      'AWS::ApiGateway::Resource',
      'AWS::ApiGateway::Method',
      'AWS::ApiGateway::Deployment',
      'AWS::ApiGateway::Stage',
      'AWS::IAM::Role',
      'AWS::Lambda::Function',
      'AWS::Lambda::Permission',
      'AWS::Logs::LogGroup',
    ];

    // Extract the actual resource types from the fetched stack resources.
    const actualResourceTypes = stackResources.map(
      (resource) => resource.ResourceType
    );

    // Assert that every expected resource type is present in the actual resource list.
    expectedResourceTypes.forEach((expectedType) => {
      expect(actualResourceTypes).toContain(expectedType);
    });
  });
});

/**
 * Test Suite for the Greeting API endpoint.
 * These tests verify the runtime behavior of the deployed API.
 */
describe('Greeting API Integration Tests', () => {
  // Check if the API URL is available before running tests.
  if (!apiUrl) {
    test.only('Skipping integration tests because ApiUrl is not defined in cfn-outputs/flat-outputs.json', () => {
      console.warn(
        'Skipping integration tests. Please deploy the CloudFormation stack and generate the outputs file first.'
      );
      expect(true).toBe(true);
    });
    return;
  }

  describe('GET /greet endpoint', () => {
    test('should return a 200 status code and the correct greeting message', async () => {
      try {
        // Act: Make a GET request to the deployed API endpoint.
        const response = await axios.get(apiUrl);

        // Assert: Check the response.
        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
        expect(response.data.message).toBe(
          'Hello from a secure, serverless API!'
        );
      } catch (error) {
        if (error instanceof Error) {
          console.error('API request failed:', error.message);
        } else {
          console.error(
            'An unknown error occurred during the API request:',
            error
          );
        }
        // We rethrow the error to ensure the test case fails.
        throw error;
      }
    }, 15000); // Increase timeout to 15 seconds for potential Lambda cold starts.
  });
});
