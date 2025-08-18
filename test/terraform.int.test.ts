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

  beforeAll(() => {
    if (fs.existsSync(flatPath)) {
      const raw = fs.readFileSync(flatPath, 'utf8') || '{}';
      try {
        outputs = JSON.parse(raw);
      } catch {
        outputs = {};
      }
    }

    // Fallback: read from all-outputs.json and extract .value fields
    if (
      (!outputs || Object.keys(outputs).length === 0) &&
      fs.existsSync(fullPath)
    ) {
      const raw = fs.readFileSync(fullPath, 'utf8') || '{}';
      try {
        const all = JSON.parse(raw) as any;
        const maybeCloudfront = all?.cloudfront_domain_name?.value;
        const maybeApi = all?.api_invoke_url?.value;
        outputs = {
          ...(maybeCloudfront
            ? { cloudfront_domain_name: maybeCloudfront }
            : {}),
          ...(maybeApi ? { api_invoke_url: maybeApi } : {}),
        } as Record<string, string>;
      } catch {
        // ignore
      }
    }
  });

  test('CloudFront is reachable (200/302)', async () => {
    const domain = outputs['cloudfront_domain_name'];
    expect(domain).toBeTruthy();
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
    const apiUrl = outputs['api_invoke_url'];
    expect(apiUrl).toBeTruthy();

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
