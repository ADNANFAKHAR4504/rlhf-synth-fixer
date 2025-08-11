import fs from 'fs';
import https from 'https';
import { URL } from 'url';

function readOutputs() {
  const path = 'cfn-outputs/flat-outputs.json';
  if (!fs.existsSync(path)) {
    throw new Error(
      'Missing cfn-outputs/flat-outputs.json. Deploy the stack and export outputs first.'
    );
  }
  return JSON.parse(fs.readFileSync(path, 'utf8')) as Record<string, string>;
}

describe('TapStack Integration Tests', () => {
  const outputs = readOutputs();

  it('has required outputs', () => {
    expect(outputs['ApiGatewayUrl']).toBeTruthy();
    expect(outputs['LambdaFunctionArn']).toMatch(/^arn:aws:lambda:/);
    expect(outputs['S3BucketName']).toMatch(/^[a-z0-9.-]+$/);
  });

  const shouldCallApi = process.env.RUN_INTEGRATION_HTTP_TEST === '1';
  const apiUrl = outputs['ApiGatewayUrl'];

  const doHttpRequest = (method: 'GET' | 'POST', urlStr: string, body?: any) =>
    new Promise<{ statusCode?: number; body: string; headers: any }>(
      (resolve, reject) => {
        const u = new URL(urlStr);
        const payload = body ? Buffer.from(JSON.stringify(body)) : undefined;
        const req = https.request(
          {
            method,
            hostname: u.hostname,
            path: u.pathname + u.search,
            protocol: u.protocol,
            port: u.port || 443,
            headers: payload
              ? {
                  'Content-Type': 'application/json',
                  'Content-Length': payload.length,
                }
              : undefined,
          },
          res => {
            let data = '';
            res.on('data', chunk => (data += chunk));
            res.on('end', () =>
              resolve({
                statusCode: res.statusCode,
                body: data,
                headers: res.headers,
              })
            );
          }
        );
        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
      }
    );

  (shouldCallApi ? it : it.skip)(
    'responds to a GET request with JSON',
    async () => {
      jest.setTimeout(20000);
      const base = `${apiUrl}`.replace(/\/$/, '');
      const { statusCode, body, headers } = await doHttpRequest('GET', base);
      expect(statusCode).toBe(200);
      expect(headers['content-type'] || '').toContain('application/json');
      const parsed = JSON.parse(body);
      // Verify expected fields from Lambda response
      expect(parsed.message).toBeDefined();
      expect(parsed.request_id).toBeDefined();
      expect(parsed.s3_location).toMatch(/^s3:\/\//);
      if (outputs['S3BucketName']) {
        expect(parsed.s3_location).toContain(outputs['S3BucketName']);
      }
      expect(parsed.timestamp).toBeDefined();
    }
  );

  (shouldCallApi ? it : it.skip)(
    'accepts a POST request with JSON body',
    async () => {
      jest.setTimeout(20000);
      const base = `${apiUrl}`.replace(/\/$/, '');
      const sample = { hello: 'world' };
      const { statusCode, body } = await doHttpRequest('POST', base, sample);
      expect(statusCode).toBe(200);
      const parsed = JSON.parse(body);
      expect(parsed.request_id).toBeDefined();
      expect(parsed.s3_location).toMatch(/^s3:\/\//);
    }
  );
});
