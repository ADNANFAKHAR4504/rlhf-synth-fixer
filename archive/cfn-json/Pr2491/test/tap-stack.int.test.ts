// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import path from 'path';

const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
} else {
  // Optionally: skip tests or set outputs to default
  console.warn('Warning: flat-outputs.json not found, using empty outputs.');
  outputs = {};
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Turn Around Prompt API Integration Tests', () => {
  describe('Write Integration TESTS', () => {
    test('Dont forget!', async () => {
      expect(true).toBe(true); // <-- Make this test pass
    });
  });
});
