// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import path from 'path';

const outputsPath = path.join('cfn-outputs', 'flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
} else {
  // Warn and skip tests if outputs file is missing
  console.warn(`Warning: ${outputsPath} not found. Integration tests will be skipped.`);
}

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Turn Around Prompt API Integration Tests', () => {
  if (!fs.existsSync(outputsPath)) {
    test.skip('Skipping integration tests due to missing outputs file', () => { });
    return;
  }

  describe('Write Integration TESTS', () => {
    test('Dont forget!', async () => {
      expect(true).toBe(true);
    });
  });
});
