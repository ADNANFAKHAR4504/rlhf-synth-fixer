// Configuration - These are coming from cdk-outputs after cdk deploy
import fs from 'fs';
import path from 'path'; // Import path module for robust path joining

// Determine the outputs file path.
// It's good practice to make this configurable or infer it based on environment.
// For now, assuming cdk-outputs/flat-outputs.json as per your original.
const outputsFilePath = path.join(process.cwd(), 'cdk-outputs', 'flat-outputs.json'); // Using process.cwd() for robustness
let outputs: any;
try {
  outputs = JSON.parse(fs.readFileSync(outputsFilePath, 'utf8'));
} catch (error) {
  console.error(`Error reading or parsing cdk-outputs.json: ${error}`);
  console.error(`Please ensure 'cdk-outputs/flat-outputs.json' exists and is valid JSON.`);
  // Exit or throw to prevent tests from running with invalid outputs
  process.exit(1);
}

// If running in Node.js environment without a global fetch, you'll need to import it.
// For Node.js versions < 18, you might need a polyfill like 'node-fetch'.
// If you are using Node.js 18+ or a browser-like environment (e.g., Jest with 'jsdom' test environment),
// 'fetch' might be globally available.
// import fetch from 'node-fetch'; // Uncomment this line if 'fetch' is not globally available

// Get environment suffix from environment variable (set by CI/CD pipeline)
// Note: Your YAML does not explicitly use an environment suffix for resource naming.
// If your CDK stack incorporates this suffix into its output names (e.g., ProjectName-dev),
// you might need to adjust how outputs are accessed or how ProjectName is determined here.
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Integration Tests', () => {
  // Test 1: Verify ALB DNS Name outputs exist
  test('ALB DNS Name outputs should exist for both regions', () => {
    // The output names directly correspond to the 'Outputs' section in your YAML.
    // Your YAML outputs are `AlbDnsNameR1` and `AlbDnsNameR2`.
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
    const albDns = outputs.AlbDnsNameR1; // This is correct, matches YAML output
    expect(albDns).toBeDefined(); // Ensure the DNS name exists before attempting to fetch

    try {
      // Use the global fetch API or imported node-fetch
      const response = await fetch(`http://${albDns}`);
      expect(response.status).toBe(200); // Expect a successful HTTP response

      // Optional: Verify specific content from the EC2 instance's UserData
      // The UserData in your YAML includes:
      // echo "<h1>Hello from ${ProjectName} App Instance 1 in Region 1 (${Region1})</h1>"
      // So we should expect the ProjectName to be part of the response.
      // Assuming 'ProjectName' output is also available or inferring 'TapStack' as default.
      const projectName = outputs.ProjectName || 'TapStack'; // Get ProjectName from outputs or use default
      const text = await response.text();
      expect(text).toContain(`Hello from ${projectName} App Instance`);
    } catch (error) {
      // Catch any network errors (e.g., DNS resolution failure, connection refused)
      fail(`Failed to connect to ALB in Region 1 (${albDns}): ${error}`);
    }
  }, 60000); // Increased timeout to 60 seconds for network operations

  // Test 3: Verify connectivity to the ALB in Region 2
  test('ALB in Region 2 should be accessible and return 200 OK', async () => {
    const albDns = outputs.AlbDnsNameR2; // This is correct, matches YAML output
    expect(albDns).toBeDefined();

    try {
      const response = await fetch(`http://${albDns}`);
      expect(response.status).toBe(200);

      const projectName = outputs.ProjectName || 'TapStack'; // Get ProjectName from outputs or use default
      const text = await response.text();
      expect(text).toContain(`Hello from ${projectName} App Instance`);
    } catch (error) {
      fail(`Failed to connect to ALB in Region 2 (${albDns}): ${error}`);
    }
  }, 60000); // Increased timeout to 60 seconds

  // You can add more integration tests here based on your application's functionality.
  // For example, if your application interacts with the database, you might
  // consider a test that writes/reads data, assuming you have an endpoint for it.
});