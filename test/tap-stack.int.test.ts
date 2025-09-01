import fs from 'fs';
const outputsPath = 'cfn-outputs/flat-outputs.json';

let outputs: any = {};
if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
} else {
  // Skip all tests if outputs file is missing
  describe('Turn Around Prompt API Integration Tests', () => {
    test.skip('Integration tests skipped: outputs file missing', () => { });
  });
  // Exit early so no other tests run
  // @ts-ignore
  return;
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Turn Around Prompt API Integration Tests', () => {
  describe('Write Integration TESTS', () => {
    test('Dont forget!', async () => {
      expect(false).toBe(true);
    });
  });
});
