// Configuration - These are coming from cdk.out after cdk deploy
import fs from 'fs';
const outputsTapStackdevTemplate = JSON.parse(
  fs.readFileSync('cdk.out/TapStackdev.template.json', 'utf8')
);

const outputsTapStackdevAssets = JSON.parse(
  fs.readFileSync('cdk.out/TapStackdev.assets.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Turn Around Prompt API Integration Tests', () => {
  describe('Write Integration TESTS', () => {
    test('Dont forget!', async () => {
      expect(false).toBe(true);
    });
  });
});
