/**
 * Integration tests for the TapStack.
 *
 * These tests run against a live, deployed Pulumi stack.
 *
 * Pre-requisites:
 * 1. The Pulumi stack must be deployed (`pulumi up`).
 * 2. You must be logged into the Pulumi backend.
 * 3. The `ENVIRONMENT_SUFFIX` environment variable must be set (e.g., 'pr320').
 * 4. The following dependencies must be installed:
 * `npm install --save-dev @pulumi/automation jest-fetch-mock node-fetch`
 */
import { LocalWorkspace } from '@pulumi/pulumi/automation';
import 'jest';
import fetch from 'node-fetch';
import * as path from 'path';

// Define an interface for the expected Lambda response payload for type safety.
interface LambdaResponse {
  message: string;
  region: string;
  table: string;
}

// Increase the timeout for integration tests since they involve network requests and stack refreshes.
jest.setTimeout(90000); // 1.5 minutes

describe('ServerlessApp Integration Tests', () => {
  let apiUrl: string;

  beforeAll(async () => {
    // This test constructs the stack name from the `ENVIRONMENT_SUFFIX`
    // environment variable, mirroring the logic used in the CI/CD pipeline.
    const environmentSuffix = process.env.ENVIRONMENT_SUFFIX;
    if (!environmentSuffix) {
      throw new Error(
        "The 'ENVIRONMENT_SUFFIX' environment variable must be set to the suffix of the stack you want to test (e.g., 'pr320')."
      );
    }

    const stackName = `TapStack${environmentSuffix}`;

    // Explicitly set the working directory to the project root.
    const workDir = path.join(__dirname, '..');

    // NOTE: console.log statements are intentionally left in for easier debugging in CI/CD environments.
    console.log(
      `Attempting to select stack '${stackName}' in directory '${workDir}'...`
    );

    // Use `createOrSelectStack` to ensure the specified stack is selected.
    const stack = await LocalWorkspace.createOrSelectStack({
      stackName,
      workDir,
    });

    console.log(`Successfully selected stack: ${stack.name}`);

    // Refresh the stack's state to ensure we have the latest outputs.
    console.log('Refreshing stack state...');
    await stack.refresh();
    console.log('Stack refresh complete.');

    // Now get the outputs from the stack.
    const outputs = await stack.outputs();

    if (!outputs.apiUrl || !outputs.apiUrl.value) {
      throw new Error(
        `Stack output 'apiUrl' is not available in stack '${stackName}'. Please ensure the stack is deployed correctly with 'pulumi up'.`
      );
    }

    apiUrl = outputs.apiUrl.value;
    console.log(`Testing API endpoint: ${apiUrl}`);
  });

  it('API endpoint should be a valid HTTPS URL', () => {
    expect(apiUrl).toBeDefined();
    expect(apiUrl.startsWith('https://')).toBe(true);
    expect(apiUrl.includes('.amazonaws.com')).toBe(true);
  });

  it('API endpoint should return a 200 OK status', async () => {
    const response = await fetch(apiUrl);
    expect(response.status).toBe(200);
  });

  it('API endpoint should return the correct JSON payload from Lambda', async () => {
    const response = await fetch(apiUrl);
    // Use the specific interface instead of `any` for type safety.
    const body: LambdaResponse = await response.json();

    expect(body.message).toBe('Hello from Lambda!');
    expect(body.region).toBe('us-east-1');
    expect(body.table).toBeDefined();
  });
});
