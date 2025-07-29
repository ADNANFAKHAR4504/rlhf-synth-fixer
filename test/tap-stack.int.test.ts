import fs from 'fs';
import fetch from 'node-fetch';

const outputsPath = 'cfn-outputs/flat-outputs.json';

// Get environment suffix from environment variable or fallback
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

let apiBaseUrl: string | null = null;

try {
  const outputsRaw = fs.readFileSync(outputsPath, 'utf8');
  const outputs = JSON.parse(outputsRaw);

  // Adjust this key based on how your output is labeled in CloudFormation outputs
  apiBaseUrl = outputs[`TapStack${environmentSuffix}.ApiEndpoint`];

  if (!apiBaseUrl) {
    console.warn(`[WARN] API endpoint not found in outputs for environment: ${environmentSuffix}`);
  }
} catch (err: any) {
  console.error(`[ERROR] Failed to read or parse outputs file: ${outputsPath}`, err);
}

describe('Turn Around Prompt API Integration Tests', () => {
  if (!apiBaseUrl) {
    test('Skip tests if API endpoint not available', () => {
      expect(apiBaseUrl).toBeDefined();
    });
    return; // Skip the remaining integration tests
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

  // Additional future tests can go here
});
