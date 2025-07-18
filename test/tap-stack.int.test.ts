// Configuration - These are coming from cdk-outputs after cdk deploy
import fs from 'fs';
// You might need to adjust the path based on where your cdk-outputs are generated.
// Common paths include 'cdk-outputs.json', 'cdk-outputs/flat-outputs.json', or a specific regional file.
const outputs = JSON.parse(
  fs.readFileSync('cdk-outputs/flat-outputs.json', 'utf8')
);

// If running in Node.js environment without a global fetch, you'll need to import it.
// For Node.js versions < 18, you might need a polyfill like 'node-fetch'.
// If you are using Node.js 18+ or a browser-like environment (e.g., Jest with 'jsdom' test environment),
// 'fetch' might be globally available.
// import fetch from 'node-fetch'; // Uncomment this line if 'fetch' is not globally available

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Integration Tests', () => {
  // Test 1: Verify ALB DNS Name outputs exist
  test('ALB DNS Name outputs should exist for both regions', () => {
    // These outputs are directly from your CloudFormation template's Outputs section
    expect(outputs.AlbDnsNameR1).toBeDefined();
    expect(outputs.AlbDnsNameR2).toBeDefined();
    // Optionally, you can add more specific checks, e.g., that they are non-empty strings
    expect(typeof outputs.AlbDnsNameR1).toBe('string');
    expect(outputs.AlbDnsNameR1.length).toBeGreaterThan(0);
    expect(typeof outputs.AlbDnsNameR2).toBe('string');
    expect(outputs.AlbDnsNameR2.length).toBeGreaterThan(0);
  });

  // Test 2: Verify connectivity to the ALB in Region 1
  // This test requires network access to the deployed ALB.
  // It also assumes your EC2 instances are serving HTTP content on port 80.
  // Increase timeout as network requests can take longer.
  test('ALB in Region 1 should be accessible and return 200 OK', async () => {
    const albDns = outputs.AlbDnsNameR1;
    expect(albDns).toBeDefined(); // Ensure the DNS name exists before attempting to fetch

    try {
      // Use the global fetch API or imported node-fetch
      const response = await fetch(`http://${albDns}`);
      expect(response.status).toBe(200); // Expect a successful HTTP response

      // Optional: Verify specific content from the EC2 instance's UserData
      const text = await response.text();
      expect(text).toContain(`Hello from ${outputs.ProjectName || 'TapStack'} App Instance`);
    } catch (error) {
      // Catch any network errors (e.g., DNS resolution failure, connection refused)
      fail(`Failed to connect to ALB in Region 1 (${albDns}): ${error}`);
    }
  }, 60000); // Increased timeout to 60 seconds for network operations

  // Test 3: Verify connectivity to the ALB in Region 2
  test('ALB in Region 2 should be accessible and return 200 OK', async () => {
    const albDns = outputs.AlbDnsNameR2;
    expect(albDns).toBeDefined();

    try {
      const response = await fetch(`http://${albDns}`);
      expect(response.status).toBe(200);

      const text = await response.text();
      expect(text).toContain(`Hello from ${outputs.ProjectName || 'TapStack'} App Instance`);
    } catch (error) {
      fail(`Failed to connect to ALB in Region 2 (${albDns}): ${error}`);
    }
  }, 60000); // Increased timeout to 60 seconds

  // You can add more integration tests here based on your application's functionality.
  // For example, if your application interacts with the database, you might
  // consider a test that writes/reads data, assuming you have an endpoint for it.
});