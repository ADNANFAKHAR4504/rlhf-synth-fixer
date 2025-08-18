import fs from 'fs';
import https from 'https';
import path from 'path';

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

async function httpGet(url: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode || 0, body: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

describe('Terraform E2E Integration', () => {
  const flatPath = path.resolve(process.cwd(), 'cfn-outputs/flat-outputs.json');
  const fullPath = path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json');
  let outputs: Record<string, string> = {};
  let hasOutputs = false;

  beforeAll(() => {
    if (fs.existsSync(flatPath)) {
      try {
        const raw = fs.readFileSync(flatPath, 'utf8') || '{}';
        outputs = JSON.parse(raw);
      } catch {
        outputs = {};
      }
    }

    if (
      (!outputs || Object.keys(outputs).length === 0) &&
      fs.existsSync(fullPath)
    ) {
      try {
        const raw = fs.readFileSync(fullPath, 'utf8') || '{}';
        const all = JSON.parse(raw) as any;
        const cf = all?.cloudfront_domain_name?.value;
        const api = all?.api_invoke_url?.value;
        outputs = {
          ...(cf ? { cloudfront_domain_name: cf } : {}),
          ...(api ? { api_invoke_url: api } : {}),
        } as Record<string, string>;
      } catch {
        outputs = outputs || {};
      }
    }

    hasOutputs = Object.keys(outputs).length > 0;
    if (!hasOutputs) {
      // Do not fail local runs that didn't deploy; CI should provide outputs
      // eslint-disable-next-line no-console
      console.warn(
        'No deployment outputs found. Skipping live integration checks.'
      );
    }
  });

  test('CloudFront is reachable (200/302)', async () => {
    if (!hasOutputs) return; // skip if no outputs
    const domain = outputs['cloudfront_domain_name'];
    if (!domain) {
      // eslint-disable-next-line no-console
      console.warn(
        'cloudfront_domain_name not found in outputs. Skipping test.'
      );
      return;
    }
    const url = `https://${domain}`;

    let lastStatus = 0;
    for (let i = 0; i < 10; i++) {
      const { status } = await httpGet(url);
      lastStatus = status;
      if ([200, 301, 302].includes(status)) break;
      await sleep(5000);
    }
    expect([200, 301, 302]).toContain(lastStatus);
  }, 180000);

  test('API Gateway /hello responds', async () => {
    if (!hasOutputs) return; // skip if no outputs
    const apiUrl = outputs['api_invoke_url'];
    if (!apiUrl) {
      // eslint-disable-next-line no-console
      console.warn('api_invoke_url not found in outputs. Skipping test.');
      return;
    }

    let lastStatus = 0;
    for (let i = 0; i < 10; i++) {
      const { status } = await httpGet(apiUrl);
      lastStatus = status;
      if ([200, 401, 403].includes(status)) break; // Cognito authorizer may require auth
      await sleep(5000);
    }
    expect([200, 401, 403]).toContain(lastStatus);
  }, 180000);
});
