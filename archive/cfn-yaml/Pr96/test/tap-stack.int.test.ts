// Configuration - These are coming from cfn-outputs after stack deploy
import fs from 'fs';
import fetch from 'node-fetch';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);
// ENVIRONMENT_SUFFIX is no longer used; stack is HTTP-only and does not use environment suffixes.

describe('Turn Around Prompt API Integration Tests', () => {
  test('WebsiteURL should be reachable and return 200', async () => {
    const url = outputs.WebsiteURL;
    expect(url).toBeDefined();
    const response = await fetch(url, { method: 'GET' });
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toMatch(/hello|web|app|apache|nginx|welcome/i); // generic check for a web page
  });
});