import fs from 'fs';
import path from 'path';
import axios from 'axios';
import {
  CloudFormationClient,
  DescribeStackResourcesCommand,
  StackResource,
} from '@aws-sdk/client-cloudformation';
// --- NEW: Import the API Gateway client and command ---
import {
  APIGatewayClient,
  GetRestApiCommand,
} from '@aws-sdk/client-api-gateway';

// --- Configuration ---

// REMOVED: No longer need to hardcode the stack name.
// const stackName = 'TapStackpr122'; 
const awsRegion = process.env.AWS_REGION || 'us-east-1';

// Load the deployed CloudFormation stack's outputs
let outputs;
try {
  const outputPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
  outputs = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
} catch (error) {
  console.error(
    'Error: Could not read cfn-outputs/flat-outputs.json. Make sure you have deployed the stack and the output file exists.'
  );
  outputs = { ApiUrl: '' };
}

const apiUrl = outputs.ApiUrl;

// Initialize AWS clients
const cfClient = new CloudFormationClient({ region: awsRegion });
const apiGatewayClient = new APIGatewayClient({ region: awsRegion }); // NEW: API Gateway client

// --- NEW HELPER FUNCTION ---
/**
 * Finds the CloudFormation stack name associated with a given API Gateway URL.
 * It works by extracting the API ID from the URL and reading the 'aws:cloudformation:stack-name'
 * tag from the REST API resource.
 * @param {string} url The full invoke URL of the API Gateway stage.
 * @param {string} region The AWS region where the API is deployed.
 * @returns {Promise<string | null>} The name of the stack, or null if not found.
 */
async function findStackNameByApiUrl(
  url: string,
  region: string
): Promise<string | null> {
  // 1. Extract the API ID from the URL (e.g., 'abc123xyz' from 'https://abc123xyz.execute-api...')
  const match = url.match(/https:\/\/([^.]+)\.execute-api/);
  const apiId = match ? match[1] : null;

  if (!apiId) {
    console.error('Could not parse API ID from URL:', url);
    return null;
  }

  try {
    // 2. Use the API ID to get details about the REST API, including its tags.
    const command = new GetRestApiCommand({ restApiId: apiId });
    const response = await apiGatewayClient.send(command);
    console.log(JSON.stringify(response))
    // 3. Find and return the stack name from the tags.
    const stackNameTag = 'aws:cloudformation:stack-name';
    if (response.tags && response.tags[stackNameTag]) {
      return response.tags[stackNameTag];
    } else {
      console.error(
        `Could not find the '${stackNameTag}' tag on API Gateway REST API with ID '${apiId}'.`
      );
      return null;
    }
  } catch (error) {
    console.error(
      `Failed to get REST API details for ID '${apiId}'. Please ensure IAM permissions are sufficient (apigateway:GET).`,
      error
    );
    return null;
  }
}

/**
 * Test Suite for CloudFormation Stack Validation.
 */
describe('CloudFormation Stack Validation', () => {
  let stackResources: StackResource[] = [];
  let discoveredStackName: string | null = null; // To store the found stack name

  // MODIFIED: This block now dynamically finds the stack name before running tests.
  beforeAll(async () => {
    if (!apiUrl) {
      console.error('API URL is not available from outputs file. Cannot find stack.');
      return;
    }

    // --- MODIFIED LOGIC ---
    // Find the stack name using the helper function
    discoveredStackName = await findStackNameByApiUrl(apiUrl, awsRegion);

    if (!discoveredStackName) {
      console.error('Could not dynamically determine the stack name. Halting validation tests.');
      return;
    }
    
    console.log(`Discovered stack name: ${discoveredStackName}`);

    try {
      const command = new DescribeStackResourcesCommand({ StackName: discoveredStackName });
      const response = await cfClient.send(command);
      stackResources = response.StackResources || [];
      console.log(`Successfully fetched ${stackResources.length} resources for stack: ${discoveredStackName}`);
    } catch (error) {
      console.error(
        `Failed to describe stack resources for stack "${discoveredStackName}".`, error
      );
      stackResources = [];
    }
  }, 30000);

  test('should have the stack deployed and be able to fetch its resources', () => {
    // This test now implicitly confirms the stack was found and resources were fetched.
    expect(discoveredStackName).not.toBeNull();
    expect(stackResources.length).toBeGreaterThan(0);
  });

  // This test remains unchanged as it consumes the 'stackResources' array.
  test('should contain all the essential resource types from the YAML file', () => {
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

    const actualResourceTypes = stackResources.map(
      (resource) => resource.ResourceType
    );

    expectedResourceTypes.forEach((expectedType) => {
      expect(actualResourceTypes).toContain(expectedType);
    });
  });
});


/**
 * Test Suite for the Greeting API endpoint.
 * (This suite remains unchanged)
 */
describe('Greeting API Integration Tests', () => {
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
        const response = await axios.get(apiUrl);
        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
        expect(response.data.message).toBe(
          'Hello from a secure, serverless API!'
        );
      } catch (error) {
        if (error instanceof Error) {
          console.error('API request failed:', error.message);
        } else {
          console.error('An unknown error occurred during the API request:', error);
        }
        throw error;
      }
    }, 15000);
  });
});