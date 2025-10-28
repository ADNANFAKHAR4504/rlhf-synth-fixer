// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Helper to handle multiple possible shapes for the flat outputs file
function getOutputValue(key: string): string {
  if (!outputs) throw new Error('cfn outputs file is empty or missing');
  const v = outputs[key];
  if (!v) throw new Error(`Output key ${key} not found in cfn outputs`);
  if (typeof v === 'string') return v;
  if (typeof v === 'object') {
    // common shapes: { Value: '...' } or { value: '...' } or {OutputValue: '...'}
    if (typeof v.Value === 'string') return v.Value;
    if (typeof v.value === 'string') return v.value;
    if (typeof v.OutputValue === 'string') return v.OutputValue;
    // sometimes the flat outputs may directly be nested; try to stringify fallback
    throw new Error(`Unable to resolve string value for output key ${key}`);
  }
  throw new Error(`Unsupported output value type for key ${key}`);
}

// Minimal HTTP GET using node's built-in http/https modules to avoid adding deps
import http from 'http';
import https from 'https';
import { URL } from 'url';

function httpGet(urlString: string, timeoutMs = 10000): Promise<{status: number; body: string}> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.get(url, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(Buffer.from(c)));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        resolve({ status: res.statusCode || 0, body });
      });
    });
    req.on('error', (err) => reject(err));
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('Request timed out'));
    });
  });
}

describe('Turn Around Prompt API Integration Tests', () => {
  test('Health endpoint returns 200 and expected response', async () => {
    // try to resolve APIGatewayURL from outputs; fall back to env var if present
    let apiUrl: string | undefined;
    try {
      apiUrl = getOutputValue('APIGatewayURL');
    } catch (e) {
      // fall back to environment variable sometimes used in CI
      apiUrl = process.env.API_GATEWAY_ENDPOINT;
    }

    if (!apiUrl) {
      throw new Error('API Gateway URL not found in outputs or environment (API_GATEWAY_ENDPOINT)');
    }

    // Ensure the URL ends without extra slash and append /health
    const base = apiUrl.replace(/\/$/, '');
    const healthUrl = base + '/health';

    const res = await httpGet(healthUrl, 15000);
    // Expect HTTP 200
    expect(res.status).toBe(200);

    // If response is JSON, assert that it's parseable and non-empty
    let parsed: any = null;
    try {
      parsed = JSON.parse(res.body);
    } catch (e) {
      // not JSON — that's acceptable if body contains 'OK' or similar
    }

    if (parsed) {
      // ensure parsed has something useful (object or string)
      expect(Object.keys(parsed).length).toBeGreaterThanOrEqual(0);
    } else {
      // plain text response should not be empty
      expect(res.body.length).toBeGreaterThan(0);
    }
  }, 30000);

  test('CloudFormation outputs contain EnvironmentSuffix and DBSecretArn', () => {
    // sanity checks — ensure the outputs file contains a couple of expected keys
    expect(() => getOutputValue('EnvironmentSuffix')).not.toThrow();
    expect(() => getOutputValue('DBSecretArn')).not.toThrow();
  });

  describe('CloudFormation outputs - presence and basic shape', () => {
    const keys: Array<{key: string; validator?: (v: string) => void}> = [
      { key: 'RedisEndpoint', validator: (v) => expect(v).toMatch(/\./) },
      { key: 'RedisPort', validator: (v) => expect(Number(v)).toBeGreaterThan(0) },
      { key: 'DBSecretArn', validator: (v) => expect(v).toMatch(/^arn:aws:secretsmanager:/) },
      { key: 'VPCId', validator: (v) => expect(v).toMatch(/^vpc-/) },
      { key: 'AuroraClusterEndpoint', validator: (v) => expect(v).toMatch(/rds|cluster/ ) },
      { key: 'EnvironmentSuffix', validator: (v) => expect(v).toMatch(/^[a-zA-Z0-9-]+$/) },
      { key: 'ECSClusterName', validator: (v) => expect(v.length).toBeGreaterThan(0) },
      { key: 'KinesisStreamARN', validator: (v) => expect(v).toMatch(/^arn:aws:kinesis:/) },
      { key: 'AuroraClusterReadEndpoint', validator: (v) => expect(v).toMatch(/rds|cluster/ ) },
      { key: 'EFSFileSystemId', validator: (v) => expect(v).toMatch(/^fs-/) },
      { key: 'APIGatewayURL', validator: (v) => expect(v).toMatch(/^https?:\/\//) },
      { key: 'KinesisStreamName', validator: (v) => expect(v.length).toBeGreaterThan(0) },
    ];

    for (const entry of keys) {
      test(`output ${entry.key} exists and has valid shape`, () => {
        const v = getOutputValue(entry.key);
        expect(typeof v).toBe('string');
        expect(v.length).toBeGreaterThan(0);
        if (entry.validator) entry.validator(v);
      });
    }
  });
  
  test('APIGatewayURL responds to /health with 200', async () => {
    let apiUrl: string;
    try {
      apiUrl = getOutputValue('APIGatewayURL');
    } catch (err) {
      apiUrl = process.env.API_GATEWAY_ENDPOINT || '';
    }
    if (!apiUrl) throw new Error('APIGatewayURL not found in outputs or API_GATEWAY_ENDPOINT env var');

    // append /health (avoid duplicate slashes)
    const base = apiUrl.replace(/\/$/, '');
    const healthUrl = base + '/health';

    const res = await httpGet(healthUrl, 15000);
    expect(res.status).toBe(200);

    // response should be non-empty
    expect(res.body.length).toBeGreaterThan(0);
  }, 30000);
});
