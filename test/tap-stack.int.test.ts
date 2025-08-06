import fs from 'fs';

// --- Configuration ---
let outputs: { [key: string]: string } = {};

try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn(
    'cfn-outputs/flat-outputs.json does not exist, aborting integration tests'
  );
}

describe('CloudFormation Infrastructure Integration Tests', () => {
  test('should have defined outputs from the CloudFormation stack', () => {
    const loadBalancerDNSName = outputs['LoadBalancerDNSName'];
    const applicationUrl = outputs['ApplicationURL'];

    expect(loadBalancerDNSName).toBeDefined();
    expect(applicationUrl).toBeDefined();
  });
});
