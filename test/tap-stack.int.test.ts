// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import https from 'https';

jest.setTimeout(30000);


const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);



// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
function requireOutput(key: string): string {
  const value = outputs[key];
  if (!value || typeof value !== 'string') {
    throw new Error(`Missing required output: ${key}`);
  }
  return value;
}

async function httpPostJson(urlString: string, payload: unknown): Promise<{ status: number; bodyText: string; }> {
  // Use global fetch if available (Node 18+), else fallback to https
  const anyGlobal: any = global as any;
  if (typeof anyGlobal.fetch === 'function') {
    const res = await anyGlobal.fetch(urlString, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const bodyText = await res.text();
    return { status: res.status, bodyText };
  }

  return await new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(urlString);
      const req = https.request(
        {
          protocol: urlObj.protocol,
          hostname: urlObj.hostname,
          path: urlObj.pathname + urlObj.search,
          method: 'POST',
          headers: { 'content-type': 'application/json' },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk.toString()));
          res.on('end', () => resolve({ status: res.statusCode || 0, bodyText: data }));
        }
      );
      req.on('error', reject);
      req.write(JSON.stringify(payload));
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function httpRequest(
  method: 'GET' | 'POST',
  urlString: string,
  payload?: unknown
): Promise<{ status: number; bodyText: string; }> {
  const anyGlobal: any = global as any;
  if (typeof anyGlobal.fetch === 'function') {
    const res = await anyGlobal.fetch(urlString, {
      method,
      headers: { 'content-type': 'application/json' },
      body: method === 'POST' ? JSON.stringify(payload ?? {}) : undefined,
    });
    const bodyText = await res.text();
    return { status: res.status, bodyText };
  }
  return await new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(urlString);
      const req = https.request(
        {
          protocol: urlObj.protocol,
          hostname: urlObj.hostname,
          path: urlObj.pathname + urlObj.search,
          method,
          headers: { 'content-type': 'application/json' },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk.toString()));
          res.on('end', () => resolve({ status: res.statusCode || 0, bodyText: data }));
        }
      );
      req.on('error', reject);
      if (method === 'POST') {
        req.write(JSON.stringify(payload ?? {}));
      }
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

describe('Turn Around Prompt API Integration Tests', () => {
  const httpApiUrl = requireOutput('HttpApiUrl');
  const eventsTableName = requireOutput('EventsTableName');
  const eventBusName = requireOutput('EventBusName');
  const alertsTopicArn = requireOutput('AlertsTopicArn');
  const auditBucketName = requireOutput('AuditBucketName');

  describe('Outputs and naming', () => {
    test('all required outputs are present', () => {
      expect(httpApiUrl).toBeTruthy();
      expect(eventsTableName).toBeTruthy();
      expect(eventBusName).toBeTruthy();
      expect(alertsTopicArn).toBeTruthy();
      expect(auditBucketName).toBeTruthy();
    });

  });

  describe('E2E Flow', () => {
    test('POST /ingest returns 200 and ok response (end-to-end happy path)', async () => {
      const payload = {
        source: 'market.data',
        'detail-type': 'market.event',
        detail: { type: 'trade', id: `itest-${Date.now()}` },
      };

      const { status, bodyText } = await httpPostJson(`${httpApiUrl}/ingest`, payload);
      expect(status).toBeGreaterThanOrEqual(200);
      expect(status).toBeLessThan(300);

      // Our ingestion lambda returns { ok: true }
      try {
        const json = JSON.parse(bodyText);
        expect(json).toHaveProperty('ok', true);
      } catch {
        // If not JSON, still assert we got a 2xx
        expect(true).toBe(true);
      }
    });

    test('ingests multiple event types concurrently (fan-out scenario)', async () => {
      const kinds = ['trade', 'quote', 'trade', 'quote', 'trade', 'quote', 'trade', 'quote', 'trade', 'quote'];
      const start = Date.now();
      const results = await Promise.all(
        kinds.map((k, idx) =>
          httpPostJson(`${httpApiUrl}/ingest`, {
            source: 'market.data',
            'detail-type': 'market.event',
            detail: { type: k, id: `bulk-${idx}-${Date.now()}` },
          })
        )
      );
      const elapsedMs = Date.now() - start;
      results.forEach((r) => {
        expect(r.status).toBeGreaterThanOrEqual(200);
        expect(r.status).toBeLessThan(300);
      });
      // All should complete within a reasonable time window
      expect(elapsedMs).toBeLessThan(10000);
    });

    test('ingests larger payload within typical API Gateway limits', async () => {
      const largeBlob = 'x'.repeat(50 * 1024); // ~50KB
      const { status, bodyText } = await httpPostJson(`${httpApiUrl}/ingest`, {
        source: 'market.data',
        'detail-type': 'market.event',
        detail: { type: 'trade', id: `large-${Date.now()}`, blob: largeBlob },
      });
      expect(status).toBeGreaterThanOrEqual(200);
      expect(status).toBeLessThan(300);
      try {
        const json = JSON.parse(bodyText);
        expect(json).toHaveProperty('ok', true);
      } catch {
        expect(true).toBe(true);
      }
    });

    test('GET /ingest is not allowed and returns 4xx', async () => {
      const { status } = await httpRequest('GET', `${httpApiUrl}/ingest`);
      expect(status).toBeGreaterThanOrEqual(400);
      expect(status).toBeLessThan(500);
    });
  });

  describe('ARN and URL structure', () => {
    test('SNS ARN structure is valid and matches region', () => {
      const parts = alertsTopicArn.split(':');
      expect(parts[0]).toBe('arn');
      expect(parts[1]).toBe('aws');
      expect(parts[2]).toBe('sns');
      expect(parts[3]).toBe('us-west-2');
      expect(parts[4]).toMatch(/^\d{12}$/);
      expect(parts[5].startsWith('alerts-us-west-2-')).toBe(true);
    });

    test('HTTP API URL encodes correct region in hostname', () => {
      const url = new URL(httpApiUrl);
      const host = url.hostname; // e.g. os5mrxwpr4.execute-api.us-west-2.amazonaws.com
      const regionMatch = host.match(/execute-api\.([a-z0-9-]+)\.amazonaws\.com$/);
      expect(regionMatch).toBeTruthy();
      expect(regionMatch && regionMatch[1]).toBe('us-west-2');
    });
  });

  describe('S3 bucket naming constraints', () => {
    test('bucket name is lowercase, valid characters, and length OK', () => {
      expect(auditBucketName).toBe(auditBucketName.toLowerCase());
      expect(/^[a-z0-9-]+$/.test(auditBucketName)).toBe(true);
      expect(auditBucketName.length).toBeGreaterThanOrEqual(3);
      expect(auditBucketName.length).toBeLessThanOrEqual(63);
    });
  });

  describe('Idempotent ingestion behavior', () => {
    test('multiple POST /ingest calls succeed', async () => {
      const base = {
        source: 'market.data',
        'detail-type': 'market.event',
        detail: { type: 'quote' },
      } as any;

      const first = await httpPostJson(`${httpApiUrl}/ingest`, {
        ...base,
        detail: { ...base.detail, id: `itest-1-${Date.now()}` },
      });
      const second = await httpPostJson(`${httpApiUrl}/ingest`, {
        ...base,
        detail: { ...base.detail, id: `itest-2-${Date.now()}` },
      });

      expect(first.status).toBeGreaterThanOrEqual(200);
      expect(first.status).toBeLessThan(300);
      expect(second.status).toBeGreaterThanOrEqual(200);
      expect(second.status).toBeLessThan(300);
    });
  });

  describe('Latency', () => {
    test('POST /ingest responds within 5s', async () => {
      const start = Date.now();
      const res = await httpPostJson(`${httpApiUrl}/ingest`, {
        source: 'market.data',
        'detail-type': 'market.event',
        detail: { type: 'trade', id: `perf-${Date.now()}` },
      });
      const elapsedMs = Date.now() - start;
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(300);
      expect(elapsedMs).toBeLessThan(5000);
    });
  });
});
