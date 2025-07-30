/**
 * Integration tests for the TapStack.
 *
 * These tests run against a live, deployed Pulumi stack.
 *
 * Pre-requisites:
 * 1. The Pulumi stack must be deployed (`pulumi up`).
 * 2. You must be logged into the Pulumi backend.
 * 3. The following dependencies must be installed:
 * `npm install --save-dev @pulumi/automation jest-fetch-mock node-fetch`
 */
import { LocalWorkspace } from '@pulumi/pulumi/automation';
import 'jest';
import fetch from 'node-fetch';

// Increase the timeout for integration tests since they involve network requests.
jest.setTimeout(60000); // 1 minute

describe('ServerlessApp Integration Tests', () => {
  let apiUrl: string;

  // Before running the tests, get the API URL from the deployed stack.
  beforeAll(async () => {
    // This uses the Pulumi Automation API to get the outputs of the
    // stack that is currently selected in your local environment.
    const workspace = await LocalWorkspace.create({});
    const stack = await workspace.selectStack(await workspace.getCurrentlySelectedStackName());
    const outputs = await stack.outputs();
    
    if (!outputs.apiUrl || !outputs.apiUrl.value) {
        throw new Error("Stack output 'apiUrl' is not available. Please run `pulumi up` first.");
    }

    apiUrl = outputs.apiUrl.value;
    console.log(`Testing API endpoint: ${apiUrl}`);
  });

  it('API endpoint should be a valid HTTPS URL', () => {
    expect(apiUrl).toBeDefined();
    expect(apiUrl.startsWith('https://')).toBe(true);
    expect(apiUrl.endsWith('.amazonaws.com/')).toBe(true);
  });

  it('API endpoint should return a 200 OK status', async () => {
    const response = await fetch(apiUrl);
    expect(response.status).toBe(200);
  });

  it('API endpoint should return the correct JSON payload from Lambda', async () => {
    const response = await fetch(apiUrl);
    const body = await response.json();

    expect(body.message).toBe('Hello from Lambda!');
    expect(body.region).toBe('us-east-1');
    expect(body.table).toBeDefined();
  });
});
