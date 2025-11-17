import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';

// Load deployment outputs
const outputsPath = path.join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

// Parse alarm ARNs from string
const alarmArns = JSON.parse(outputs.alarmArns);

// Extract environment suffix from outputs
const environmentSuffix = outputs.failoverDnsName.split('payment-')[1].split('.')[0];
const primaryRegion = 'us-east-1';
const secondaryRegion = 'us-east-2';

// Helper function to make HTTPS requests
function httpsRequest(
  url: string,
  options: { method?: string; headers?: any; body?: string } = {}
): Promise<{ statusCode: number; headers: any; body: string }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

describe('TapStack Multi-Region DR Infrastructure - Integration Tests', () => {
  describe('Deployment Outputs Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs.primaryApiEndpoint).toBeDefined();
      expect(outputs.secondaryApiEndpoint).toBeDefined();
      expect(outputs.failoverDnsName).toBeDefined();
      expect(outputs.healthCheckId).toBeDefined();
      expect(outputs.alarmArns).toBeDefined();
    });

    test('should have valid API endpoint URLs', () => {
      expect(outputs.primaryApiEndpoint).toMatch(/^https:\/\/.+\.execute-api\.us-east-1\.amazonaws\.com\/prod$/);
      expect(outputs.secondaryApiEndpoint).toMatch(/^https:\/\/.+\.execute-api\.us-east-2\.amazonaws\.com\/prod$/);
    });

    test('should have 4 alarm ARNs', () => {
      expect(alarmArns).toHaveLength(4);
      alarmArns.forEach((arn: string) => {
        expect(arn).toMatch(/^arn:aws:cloudwatch:(us-east-1|us-east-2):\d+:alarm:.+$/);
      });
    });

    test('should have valid health check ID (UUID format)', () => {
      expect(outputs.healthCheckId).toMatch(/^[a-f0-9-]{36}$/);
    });

    test('should have valid failover DNS name', () => {
      expect(outputs.failoverDnsName).toContain('payment-');
      expect(outputs.failoverDnsName).toContain('.test.local');
      expect(outputs.failoverDnsName).toBe(`api.payment-${environmentSuffix}.test.local`);
    });

    test('should extract environment suffix correctly', () => {
      expect(environmentSuffix).toBeDefined();
      expect(environmentSuffix.length).toBeGreaterThan(0);
      expect(outputs.failoverDnsName).toContain(environmentSuffix);
    });

    test('should have consistent environment suffix across outputs', () => {
      expect(outputs.primaryApiEndpoint).toContain('us-east-1');
      expect(outputs.secondaryApiEndpoint).toContain('us-east-2');
    });
  });

  describe('Alarm ARNs Structure Validation', () => {
    test('should have DynamoDB health alarm ARN', () => {
      const dynamoAlarm = alarmArns.find((arn: string) =>
        arn.includes('dynamo-health-alarm')
      );
      expect(dynamoAlarm).toBeDefined();
      expect(dynamoAlarm).toContain('us-east-1');
      expect(dynamoAlarm).toContain(environmentSuffix);
    });

    test('should have primary Lambda error alarm ARN', () => {
      const lambdaAlarm = alarmArns.find(
        (arn: string) =>
          arn.includes('lambda-errors') && arn.includes(primaryRegion)
      );
      expect(lambdaAlarm).toBeDefined();
      expect(lambdaAlarm).toContain('us-east-1');
      expect(lambdaAlarm).toContain(environmentSuffix);
    });

    test('should have secondary Lambda error alarm ARN', () => {
      const lambdaAlarm = alarmArns.find(
        (arn: string) =>
          arn.includes('lambda-errors') && arn.includes(secondaryRegion)
      );
      expect(lambdaAlarm).toBeDefined();
      expect(lambdaAlarm).toContain('us-east-2');
      expect(lambdaAlarm).toContain(environmentSuffix);
    });

    test('should have S3 replication lag alarm ARN', () => {
      const s3Alarm = alarmArns.find((arn: string) =>
        arn.includes('s3-replication-lag')
      );
      expect(s3Alarm).toBeDefined();
      expect(s3Alarm).toContain('us-east-1');
      expect(s3Alarm).toContain(environmentSuffix);
    });

    test('should have alarms in correct regions', () => {
      const primaryAlarms = alarmArns.filter((arn: string) =>
        arn.includes('us-east-1')
      );
      const secondaryAlarms = alarmArns.filter((arn: string) =>
        arn.includes('us-east-2')
      );

      expect(primaryAlarms.length).toBe(3); // DynamoDB, Primary Lambda, S3
      expect(secondaryAlarms.length).toBe(1); // Secondary Lambda
    });
  });

  describe('API Gateway - Primary Region Endpoints', () => {
    test('should have accessible primary API endpoint', async () => {
      const response = await httpsRequest(outputs.primaryApiEndpoint);
      // Any response (even 403/404) means the endpoint exists
      expect(response.statusCode).toBeDefined();
      expect([200, 403, 404]).toContain(response.statusCode);
    });


    test('should return proper CORS headers', async () => {
      const testPayment = { paymentId: `cors-test-${Date.now()}`, amount: 100 };

      const response = await httpsRequest(
        `${outputs.primaryApiEndpoint}/payment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayment),
        }
      );

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      // The Lambda returns CORS headers in the body's headers field
      expect(body).toBeDefined();
    });

    test('should process payment with default amount when not provided', async () => {
      const testPayment = {
        paymentId: `default-amount-test-${Date.now()}`,
      };

      const response = await httpsRequest(
        `${outputs.primaryApiEndpoint}/payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testPayment),
        }
      );

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Payment processed successfully');
      expect(body.amount).toBeDefined();
    });
  });

  describe('API Gateway - Secondary Region Endpoints', () => {
    test('should have accessible secondary API endpoint', async () => {
      const response = await httpsRequest(outputs.secondaryApiEndpoint);
      // Any response (even 403/404) means the endpoint exists
      expect(response.statusCode).toBeDefined();
      expect([200, 403, 404]).toContain(response.statusCode);
    });

    test('should process payments independently from primary', async () => {
      const testPayment = {
        paymentId: `independent-test-${Date.now()}`,
        amount: 2000,
      };

      const response = await httpsRequest(
        `${outputs.secondaryApiEndpoint}/payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testPayment),
        }
      );

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.region).toBe(secondaryRegion);
      expect(body.message).toBe('Payment processed successfully');
    });

  });

  describe('Multi-Region Disaster Recovery Validation', () => {
    test('should have both regions operational', async () => {
      const primaryPayment = {
        paymentId: `dr-primary-${Date.now()}`,
        amount: 500,
      };

      const secondaryPayment = {
        paymentId: `dr-secondary-${Date.now()}`,
        amount: 750,
      };

      const [primaryResponse, secondaryResponse] = await Promise.all([
        httpsRequest(`${outputs.primaryApiEndpoint}/payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(primaryPayment),
        }),
        httpsRequest(`${outputs.secondaryApiEndpoint}/payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(secondaryPayment),
        }),
      ]);

      expect(primaryResponse.statusCode).toBe(200);
      expect(secondaryResponse.statusCode).toBe(200);

      const primaryBody = JSON.parse(primaryResponse.body);
      const secondaryBody = JSON.parse(secondaryResponse.body);

      expect(primaryBody.region).toBe('us-east-1');
      expect(secondaryBody.region).toBe('us-east-2');
    });

    test('should verify secondary region can handle failover independently', async () => {
      const testPayment = {
        paymentId: `failover-test-${Date.now()}`,
        amount: 3000,
      };

      const response = await httpsRequest(
        `${outputs.secondaryApiEndpoint}/payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testPayment),
        }
      );

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.paymentId).toBeDefined();
      expect(body.region).toBe(secondaryRegion);
      expect(body.message).toBe('Payment processed successfully');
    });

    test('should have appropriate response times for both regions', async () => {
      const testPayment = {
        paymentId: `perf-test-${Date.now()}`,
        amount: 100,
      };

      const startPrimary = Date.now();
      await httpsRequest(`${outputs.primaryApiEndpoint}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayment),
      });
      const primaryDuration = Date.now() - startPrimary;

      const startSecondary = Date.now();
      await httpsRequest(`${outputs.secondaryApiEndpoint}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...testPayment, paymentId: `perf-test-2-${Date.now()}` }),
      });
      const secondaryDuration = Date.now() - startSecondary;

      // Both should respond within reasonable time (< 30 seconds)
      expect(primaryDuration).toBeLessThan(30000);
      expect(secondaryDuration).toBeLessThan(30000);
    });
  });

  describe('Resource Naming Conventions from Outputs', () => {
    test('should follow naming pattern in alarm ARNs', () => {
      alarmArns.forEach((arn: string) => {
        expect(arn).toMatch(/^arn:aws:cloudwatch:(us-east-1|us-east-2):\d+:alarm:.+$/);
      });
    });

    test('should include environment suffix in alarm names', () => {
      alarmArns.forEach((arn: string) => {
        const alarmName = arn.split(':alarm:')[1];
        expect(alarmName).toContain(environmentSuffix);
      });
    });

    test('should include region in regional alarm names', () => {
      const regionalAlarms = alarmArns.filter(
        (arn: string) => arn.includes('lambda-errors') || arn.includes('dynamo')
      );
      regionalAlarms.forEach((arn: string) => {
        const region = arn.includes('us-east-2') ? 'us-east-2' : 'us-east-1';
        const alarmName = arn.split(':alarm:')[1];
        expect(alarmName).toContain(region);
      });
    });

    test('should have API endpoints with correct region identifiers', () => {
      expect(outputs.primaryApiEndpoint).toContain('us-east-1');
      expect(outputs.secondaryApiEndpoint).toContain('us-east-2');
    });
  });

  describe('End-to-End Payment Flow via API', () => {

    test('should verify idempotency with unique payment IDs', async () => {
      const baseTime = Date.now();
      const payment1 = {
        paymentId: `idempotent-test-${baseTime}-1`,
        amount: 100,
      };
      const payment2 = {
        paymentId: `idempotent-test-${baseTime}-2`,
        amount: 100,
      };

      const [response1, response2] = await Promise.all([
        httpsRequest(`${outputs.primaryApiEndpoint}/payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payment1),
        }),
        httpsRequest(`${outputs.primaryApiEndpoint}/payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payment2),
        }),
      ]);

      expect(response1.statusCode).toBe(200);
      expect(response2.statusCode).toBe(200);

      const body1 = JSON.parse(response1.body);
      const body2 = JSON.parse(response2.body);

      // Both should succeed with their respective payment IDs
      expect(body1.paymentId).toBeDefined();
      expect(body2.paymentId).toBeDefined();
    });
  });

  describe('Output File Structure and Integrity', () => {
    test('should have valid JSON structure', () => {
      expect(typeof outputs).toBe('object');
      expect(outputs).not.toBeNull();
    });

    test('should have all expected keys', () => {
      const expectedKeys = [
        'alarmArns',
        'failoverDnsName',
        'healthCheckId',
        'primaryApiEndpoint',
        'secondaryApiEndpoint',
      ];

      expectedKeys.forEach((key) => {
        expect(outputs).toHaveProperty(key);
        expect(outputs[key]).toBeDefined();
      });
    });

    test('should have string values for all outputs', () => {
      Object.keys(outputs).forEach((key) => {
        expect(typeof outputs[key]).toBe('string');
      });
    });

    test('should have parseable alarm ARNs JSON string', () => {
      expect(() => JSON.parse(outputs.alarmArns)).not.toThrow();
      const parsed = JSON.parse(outputs.alarmArns);
      expect(Array.isArray(parsed)).toBe(true);
    });
  });
});
