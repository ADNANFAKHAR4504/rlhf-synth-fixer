import fs from 'fs';
import fetch from 'node-fetch';

const outputsPath = 'cfn-outputs/flat-outputs.json';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

let apiBaseUrl: string | null = null;

try {
  const outputsRaw = fs.readFileSync(outputsPath, 'utf8');
  const outputs = JSON.parse(outputsRaw);

  apiBaseUrl = outputs[`TapStack${environmentSuffix}.ApiEndpoint`] || null;

  if (!apiBaseUrl) {
    console.warn(`[WARN] API endpoint not found in outputs for environment: ${environmentSuffix}`);
  }
} catch (err: any) {
  console.error(`[ERROR] Failed to read or parse outputs file: ${outputsPath}`, err);
}

describe('Turn Around Prompt API Integration Tests', () => {
  if (!apiBaseUrl) {
    // Skip all integration tests when API endpoint is missing
    test.skip('Skipping integration tests because API endpoint is not available', () => {
      console.warn(`[SKIPPED] No API endpoint for environment: ${environmentSuffix}`);
    });
    return;
  }

  describe('GET /health', () => {
    test('should return 200 OK and expected JSON structure', async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/health`);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json).toBeDefined();
        expect(typeof json).toBe('object');
      } catch (error) {
        console.error('[ERROR] Failed to fetch /health endpoint:', error);
        fail('Request to /health failed');
      }
    });
  });
});
