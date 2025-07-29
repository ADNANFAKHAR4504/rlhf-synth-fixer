import fs from 'fs';
import fetch from 'node-fetch';

const outputsPath = 'cfn-outputs/flat-outputs.json';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

let apiBaseUrl: string | null = null;

try {
  const outputsRaw = fs.readFileSync(outputsPath, 'utf8');
  // JSON.parse might throw, so wrap in try-catch
  const outputs: Record<string, unknown> = JSON.parse(outputsRaw);

  // Safely get the API endpoint string
  const endpoint = outputs[`TapStack${environmentSuffix}.ApiEndpoint`];
  if (typeof endpoint === 'string' && endpoint.trim() !== '') {
    apiBaseUrl = endpoint;
  } else {
    console.warn(`[WARN] API endpoint not found or invalid for environment: ${environmentSuffix}`);
  }
} catch (err) {
  console.error(`[ERROR] Failed to read or parse outputs file: ${outputsPath}`, err);
}

describe('Turn Around Prompt API Integration Tests', () => {
  if (!apiBaseUrl) {
    test.skip('Skipping integration tests because API endpoint is not available', () => {
      console.warn(`[SKIPPED] No API endpoint for environment: ${environmentSuffix}`);
    });
    return;
  }

  describe('GET /health', () => {
    test('should return 200 OK and expected JSON structure', async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/health`);

        // Check response status
        expect(response.status).toBe(200);

        // Parse JSON safely
        const json = await response.json();
        expect(json).toBeDefined();
        expect(typeof json).toBe('object');
      } catch (error) {
        console.error('[ERROR] Failed to fetch /health endpoint:', error);
        fail('Request to /health failed');
      }
    });
  });
});
