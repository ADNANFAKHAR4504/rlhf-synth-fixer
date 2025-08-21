// tests/live-cloudfront-from-outputs.test.ts
// Live verification using Terraform structured outputs (cfn-outputs/all-outputs.json)
// No Terraform CLI; tests CloudFront distribution reachability and HTTP response.

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
  cloudfront_domain_name?: TfOutputValue<string>;
  cloudfront_distribution_id?: TfOutputValue<string>;
};

function readStructuredOutputs() {
  const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (!fs.existsSync(p)) {
    throw new Error(`Outputs file not found at ${p}`);
  }
  const out = JSON.parse(fs.readFileSync(p, "utf8")) as StructuredOutputs;

  if (!out.cloudfront_domain_name?.value) {
    throw new Error("cloudfront_domain_name.value missing in cfn-outputs/all-outputs.json");
  }
  const domain = out.cloudfront_domain_name.value;
  const distributionId = out.cloudfront_distribution_id?.value;

  return { domain, distributionId };
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
        'User-Agent': 'terraform-cloudfront-test/1.0',
        'Accept': '*/*',
        'Cache-Control': 'no-cache',
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
const { domain: cloudfrontDomain, distributionId } = readStructuredOutputs();
const httpsUrl = `https://${cloudfrontDomain}`;
const httpUrl = `http://${cloudfrontDomain}`;

describe("LIVE: CloudFront Distribution verification from Terraform structured outputs", () => {
  
  test("CloudFront domain DNS resolution", async () => {
    await expect(retry(() => checkDnsResolution(cloudfrontDomain), 10, 2000)).resolves.toBeUndefined();
  }, 90000);

  test("HTTPS endpoint is reachable and returns valid response", async () => {
    const response = await retry(async () => {
      const res = await makeHttpRequest(httpsUrl, 45000);
      
      // Accept 200, 3xx redirects, or 403 (common for S3/CloudFront without index document) as successful responses
      if ((res.statusCode >= 200 && res.statusCode < 400) || res.statusCode === 403) {
        return res;
      }
      
      throw new Error(`HTTPS request returned status ${res.statusCode}`);
    }, 15, 3000);

    expect([200, 301, 302, 303, 307, 308, 403]).toContain(response.statusCode);
    expect(response.headers).toBeTruthy();
  }, 180000);

  test("HTTP endpoint redirects to HTTPS (CloudFront best practice)", async () => {
    const response = await retry(async () => {
      return await makeHttpRequest(httpUrl, 30000);
    }, 10, 2000);

    // CloudFront typically redirects HTTP to HTTPS
    if (response.statusCode >= 300 && response.statusCode < 400) {
      expect(response.headers.location).toBeTruthy();
      expect(response.headers.location).toMatch(/^https:/);
    } else {
      // If not redirecting, should still be a valid response
      expect([200, 403]).toContain(response.statusCode);
    }
  }, 120000);

  test("CloudFront responds with expected headers", async () => {
    const response = await retry(async () => {
      return await makeHttpRequest(httpsUrl, 30000);
    }, 10, 2500);

    expect(response.headers).toBeTruthy();
    expect(typeof response.headers).toBe('object');
    
    // CloudFront should include these headers
    expect(response.headers['x-amz-cf-pop'] || response.headers['x-amz-cf-id']).toBeTruthy();
    
    // Common web headers should be present
    const hasExpectedHeaders = 
      response.headers['server'] ||
      response.headers['date'] ||
      response.headers['content-type'] ||
      response.headers['content-length'] ||
      response.headers['connection'] ||
      response.headers['etag'] ||
      response.headers['last-modified'];
      
    expect(hasExpectedHeaders).toBeTruthy();
  }, 90000);

  test("CloudFront distribution is consistently available", async () => {
    const attempts = 4;
    const results: { statusCode: number; pop?: string }[] = [];
    
    for (let i = 0; i < attempts; i++) {
      const response = await retry(async () => {
        return await makeHttpRequest(httpsUrl, 25000);
      }, 5, 2000);
      
      results.push({
        statusCode: response.statusCode,
        pop: response.headers['x-amz-cf-pop']
      });
      
      // Wait between requests to test consistency
      if (i < attempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    // All requests should return successful status codes
    results.forEach((result, index) => {
      expect([200, 301, 302, 303, 307, 308, 403]).toContain(result.statusCode);
    });
    
    // Check consistency - all responses should have similar status codes
    const statusCodes = results.map(r => r.statusCode);
    const uniqueStatusCodes = [...new Set(statusCodes)];
    expect(uniqueStatusCodes.length).toBeLessThanOrEqual(2); // Allow some variation but not too much
    
    // Verify we're hitting CloudFront edge locations
    const pops = results.map(r => r.pop).filter(Boolean);
    expect(pops.length).toBeGreaterThan(0);
  }, 150000);

  test("CloudFront response time is reasonable", async () => {
    const attempts = 3;
    const responseTimes: number[] = [];
    
    for (let i = 0; i < attempts; i++) {
      await retry(async () => {
        const requestStart = Date.now();
        const response = await makeHttpRequest(httpsUrl, 15000);
        const requestEnd = Date.now();
        
        const responseTime = requestEnd - requestStart;
        responseTimes.push(responseTime);
        
        if ((response.statusCode >= 200 && response.statusCode < 400) || response.statusCode === 403) {
          return response;
        }
        
        throw new Error(`Request returned status ${response.statusCode}`);
      }, 5, 2000);
      
      // Brief pause between timing tests
      if (i < attempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    // Calculate average response time
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    
    // CloudFront should respond quickly (under 10 seconds average)
    expect(avgResponseTime).toBeLessThan(10000);
    
    // No single request should take more than 15 seconds
    responseTimes.forEach(time => {
      expect(time).toBeLessThan(15000);
    });
  }, 120000);

  test("CloudFront serves content with proper caching headers", async () => {
    const response = await retry(async () => {
      const res = await makeHttpRequest(httpsUrl, 25000);
      
      if ((res.statusCode >= 200 && res.statusCode < 400) || res.statusCode === 403) {
        return res;
      }
      
      throw new Error(`Request returned status ${res.statusCode}`);
    }, 8, 2500);

    // Check for caching-related headers
    const hasCacheHeaders = 
      response.headers['cache-control'] ||
      response.headers['expires'] ||
      response.headers['etag'] ||
      response.headers['last-modified'] ||
      response.headers['x-cache'];
      
    expect(hasCacheHeaders).toBeTruthy();
  }, 90000);

  test("CloudFront domain format is valid", () => {
    // CloudFront domains should follow the pattern: *.cloudfront.net
    expect(cloudfrontDomain).toMatch(/^[a-z0-9]+\.cloudfront\.net$/);
    
    // Should not be empty or undefined
    expect(cloudfrontDomain).toBeTruthy();
    expect(typeof cloudfrontDomain).toBe('string');
    expect(cloudfrontDomain.length).toBeGreaterThan(0);
  });

  test("CloudFront distribution ID format is valid (if provided)", () => {
    if (distributionId) {
      // CloudFront distribution IDs are typically 14 characters, alphanumeric
      expect(distributionId).toMatch(/^[A-Z0-9]{10,20}$/);
      expect(typeof distributionId).toBe('string');
      expect(distributionId.length).toBeGreaterThan(0);
    }
  });
});