import fs from 'fs';
import path from 'path';

// --- Configuration ---
const REGION = 'us-east-2';
const PROJECT_NAME = 'TapStack'; // This should ideally come from the outputs as well, or be a consistent default.

// Determine the outputs file path.
const outputsFilePath = 'cdk-outputs/flat-outputs.json'
let outputs: any;

try {
  // Read and parse the outputs JSON file once when the test file is loaded
  outputs = JSON.parse(fs.readFileSync(outputsFilePath, 'utf8'));
  console.log(`Successfully loaded outputs from: ${outputsFilePath}`);
} catch (error) {
  console.error(`Error reading or parsing outputs file: ${outputsFilePath}`);
  console.error(`Please ensure 'cdk-outputs/flat-outputs.json' exists and is valid JSON.`);
  console.error(`Error details:`, error);
  // Exit the process to prevent tests from running with missing/invalid outputs
  process.exit(1);
}

describe('CloudFormation Stack Outputs Verification (Post-Deployment)', () => {

  // This test suite verifies the outputs of a CloudFormation stack
  // after it has been deployed. It reads the outputs from a JSON file.
  // It does NOT deploy or delete the stack, nor does it query live AWS resources.

  test('should have NatEipR1PublicIp output', () => {
    expect(outputs.NatEipR1PublicIp).toBeDefined();
    expect(typeof outputs.NatEipR1PublicIp).toBe('string');
    expect(outputs.NatEipR1PublicIp.length).toBeGreaterThan(0);
    // Basic IP address format check, assuming standard IPv4
    expect(outputs.NatEipR1PublicIp).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
  });

  test('should have NatEipR1AllocationId output', () => {
    expect(outputs.NatEipR1AllocationId).toBeDefined();
    expect(typeof outputs.NatEipR1AllocationId).toBe('string');
    expect(outputs.NatEipR1AllocationId.length).toBeGreaterThan(0);
    // Standard EIP allocation ID format
    expect(outputs.NatEipR1AllocationId).toMatch(/^eipalloc-[0-9a-f]{17}$/);
  });
});