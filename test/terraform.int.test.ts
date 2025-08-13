// tests/live-lb-from-outputs.test.ts
// Live verification using Terraform structured outputs (cfn-outputs/all-outputs.json)
// No Terraform CLI; tests load balancer reachability and HTTP response.

import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import * as https from "https";
import { URL } from "url";
import { promisify } from "util";

type TfOutputValue<T> = {
  sensitive: boolean;
  type: any;
  value: T;
};

type StructuredOutputs = {
  lb_domain?: TfOutputValue<string>;
};

function readStructuredOutputs() {
  const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (!fs.existsSync(p)) {
    throw new Error(`Outputs file not found at ${p}`);
  }
  const out = JSON.parse(fs.readFileSync(p, "utf8")) as StructuredOutputs;

  if (!out.lb_domain?.value) {
    throw new Error("lb_domain.value missing in cfn-outputs/all-outputs.json");
  }
  const domain = out.lb_domain.value;

  return { domain };
}

async function retry<T>(fn: () => Promise<T>, attempts = 12, baseMs = 2000): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const wait = baseMs * Math.pow(1.5, i) + Math.floor(Math.random() * 500);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

function makeHttpRequest(url: string, timeout: number = 30000): Promise<{ statusCode: number; headers: any; body: string }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      timeout: timeout,
      headers: {
        'User-Agent': 'terraform-integration-test/1.0',
        'Accept': '*/*',
      },
    };

    const req = client.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers,
          body: body,
        });
      });
    });

    req.on('error', (err) => {
      reject(new Error(`HTTP request failed: ${err.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`HTTP request timed out after ${timeout}ms`));
    });

    req.end();
  });
}

async function checkDnsResolution(domain: string): Promise<void> {
  const dns = promisify(require('dns').lookup);
  try {
    await dns(domain);
  } catch (error: any) {
    throw new Error(`DNS resolution failed for ${domain}: ${error.message}`);
  }
}

// Initialize outputs and URLs at module level (before describe block)
const { domain: lbDomain } = readStructuredOutputs();
const httpUrl = `http://${lbDomain}`;

describe("LIVE: Load Balancer verification from Terraform structured outputs", () => {
  
  test("load balancer domain DNS resolution", async () => {
    await expect(retry(() => checkDnsResolution(lbDomain), 8, 1500)).resolves.toBeUndefined();
  }, 60000);

  test("HTTP endpoint is reachable and returns 200", async () => {
    const response = await retry(async () => {
      const res = await makeHttpRequest(httpUrl);
      
      // Accept 200 or 3xx redirects as successful responses
      if (res.statusCode >= 200 && res.statusCode < 400) {
        return res;
      }
      
      throw new Error(`HTTP request returned status ${res.statusCode}`);
    }, 12, 2000);

    expect(response.statusCode).toBeGreaterThanOrEqual(200);
    expect(response.statusCode).toBeLessThan(400);
    expect(response.headers).toBeTruthy();
  }, 120000);

  test("load balancer responds with valid headers", async () => {
    const response = await retry(async () => {
      return await makeHttpRequest(httpUrl);
    }, 8, 2000);

    // Check for common load balancer/server headers
    expect(response.headers).toBeTruthy();
    expect(typeof response.headers).toBe('object');
    
    // Most web servers return at least one of these headers
    const hasExpectedHeaders = 
      response.headers['server'] ||
      response.headers['date'] ||
      response.headers['content-type'] ||
      response.headers['content-length'] ||
      response.headers['connection'];
      
    expect(hasExpectedHeaders).toBeTruthy();
  }, 60000);

  test("load balancer is consistently available", async () => {
    const attempts = 3;
    const results: number[] = [];
    
    for (let i = 0; i < attempts; i++) {
      const response = await makeHttpRequest(httpUrl);
      results.push(response.statusCode);
      
      // Wait between requests to test consistency
      if (i < attempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // All requests should return successful status codes
    results.forEach((statusCode, index) => {
      expect(statusCode).toBeGreaterThanOrEqual(200);
      expect(statusCode).toBeLessThan(500); // Allow 4xx but not 5xx errors
    });
    
    // Check consistency - all responses should have similar status codes
    const uniqueStatusCodes = [...new Set(results)];
    expect(uniqueStatusCodes.length).toBeLessThanOrEqual(2); // Allow some variation but not too much
  }, 90000);

  test("load balancer response time is reasonable", async () => {
    const startTime = Date.now();
    
    await retry(async () => {
      const requestStart = Date.now();
      const response = await makeHttpRequest(httpUrl, 10000); // 10 second timeout
      const requestEnd = Date.now();
      
      const responseTime = requestEnd - requestStart;
      
      if (response.statusCode >= 200 && response.statusCode < 400) {
        // Response time should be under 5 seconds for a healthy load balancer
        expect(responseTime).toBeLessThan(5000);
        return response;
      }
      
      throw new Error(`Request returned status ${response.statusCode}`);
    }, 5, 3000);
  }, 60000);
});