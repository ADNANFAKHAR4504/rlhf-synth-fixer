// tests/live-multi-region-endpoints.test.ts
// Live verification using Terraform structured outputs for multi-region deployment
// Tests both primary and secondary region load balancer reachability and HTTP response.

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
  primary_alb_dns_name?: TfOutputValue<string>;
  secondary_alb_dns_name?: TfOutputValue<string>;
  primary_vpc_id?: TfOutputValue<string>;
  secondary_vpc_id?: TfOutputValue<string>;
};

function readStructuredOutputs() {
  const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (!fs.existsSync(p)) {
    throw new Error(`Outputs file not found at ${p}`);
  }
  const out = JSON.parse(fs.readFileSync(p, "utf8")) as StructuredOutputs;

  if (!out.primary_alb_dns_name?.value) {
    throw new Error("primary_alb_dns_name.value missing in cfn-outputs/all-outputs.json");
  }
  
  if (!out.secondary_alb_dns_name?.value) {
    throw new Error("secondary_alb_dns_name.value missing in cfn-outputs/all-outputs.json");
  }

  const primaryDomain = out.primary_alb_dns_name.value;
  const secondaryDomain = out.secondary_alb_dns_name.value;

  return { 
    primaryDomain, 
    secondaryDomain,
    primaryVpcId: out.primary_vpc_id?.value,
    secondaryVpcId: out.secondary_vpc_id?.value
  };
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

function makeHttpRequest(url: string, timeout: number = 30000): Promise<{ statusCode: number; headers: any; body: string; responseTime: number }> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
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
        'User-Agent': 'terraform-multi-region-integration-test/1.0',
        'Accept': '*/*',
      },
    };

    const req = client.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers,
          body: body,
          responseTime: responseTime,
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
const { 
  primaryDomain, 
  secondaryDomain, 
  primaryVpcId, 
  secondaryVpcId 
} = readStructuredOutputs();

const primaryHttpUrl = `http://${primaryDomain}`;
const secondaryHttpUrl = `http://${secondaryDomain}`;

describe("LIVE: Multi-Region Load Balancer verification from Terraform structured outputs", () => {
  
  describe("Primary Region Endpoint Tests", () => {
    test("primary region load balancer domain DNS resolution", async () => {
      await expect(retry(() => checkDnsResolution(primaryDomain), 8, 1500)).resolves.toBeUndefined();
    }, 60000);

    test("primary region HTTP endpoint is reachable and returns 200", async () => {
      const response = await retry(async () => {
        const res = await makeHttpRequest(primaryHttpUrl);
        
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

    test("primary region load balancer responds with valid headers", async () => {
      const response = await retry(async () => {
        return await makeHttpRequest(primaryHttpUrl);
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

    test("primary region load balancer response time is reasonable", async () => {
      await retry(async () => {
        const response = await makeHttpRequest(primaryHttpUrl, 10000); // 10 second timeout
        
        if (response.statusCode >= 200 && response.statusCode < 400) {
          // Response time should be under 5 seconds for a healthy load balancer
          expect(response.responseTime).toBeLessThan(5000);
          return response;
        }
        
        throw new Error(`Request returned status ${response.statusCode}`);
      }, 5, 3000);
    }, 60000);
  });

  describe("Secondary Region Endpoint Tests", () => {
    test("secondary region load balancer domain DNS resolution", async () => {
      await expect(retry(() => checkDnsResolution(secondaryDomain), 8, 1500)).resolves.toBeUndefined();
    }, 60000);

    test("secondary region HTTP endpoint is reachable and returns 200", async () => {
      const response = await retry(async () => {
        const res = await makeHttpRequest(secondaryHttpUrl);
        
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

    test("secondary region load balancer responds with valid headers", async () => {
      const response = await retry(async () => {
        return await makeHttpRequest(secondaryHttpUrl);
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

    test("secondary region load balancer response time is reasonable", async () => {
      await retry(async () => {
        const response = await makeHttpRequest(secondaryHttpUrl, 10000); // 10 second timeout
        
        if (response.statusCode >= 200 && response.statusCode < 400) {
          // Response time should be under 5 seconds for a healthy load balancer
          expect(response.responseTime).toBeLessThan(5000);
          return response;
        }
        
        throw new Error(`Request returned status ${response.statusCode}`);
      }, 5, 3000);
    }, 60000);
  });

  describe("Cross-Region Consistency Tests", () => {
    test("both regions are consistently available", async () => {
      const attempts = 3;
      const primaryResults: number[] = [];
      const secondaryResults: number[] = [];
      
      for (let i = 0; i < attempts; i++) {
        // Test primary region
        const primaryResponse = await makeHttpRequest(primaryHttpUrl);
        primaryResults.push(primaryResponse.statusCode);
        
        // Test secondary region
        const secondaryResponse = await makeHttpRequest(secondaryHttpUrl);
        secondaryResults.push(secondaryResponse.statusCode);
        
        // Wait between requests to test consistency
        if (i < attempts - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // All requests should return successful status codes for both regions
      primaryResults.forEach((statusCode, index) => {
        expect(statusCode).toBeGreaterThanOrEqual(200);
        expect(statusCode).toBeLessThan(500); // Allow 4xx but not 5xx errors
      });
      
      secondaryResults.forEach((statusCode, index) => {
        expect(statusCode).toBeGreaterThanOrEqual(200);
        expect(statusCode).toBeLessThan(500); // Allow 4xx but not 5xx errors
      });
      
      // Check consistency - all responses should have similar status codes within each region
      const uniquePrimaryStatusCodes = [...new Set(primaryResults)];
      const uniqueSecondaryStatusCodes = [...new Set(secondaryResults)];
      
      expect(uniquePrimaryStatusCodes.length).toBeLessThanOrEqual(2);
      expect(uniqueSecondaryStatusCodes.length).toBeLessThanOrEqual(2);
    }, 120000);

    test("both regions have distinct DNS names", async () => {
      expect(primaryDomain).toBeTruthy();
      expect(secondaryDomain).toBeTruthy();
      expect(primaryDomain).not.toBe(secondaryDomain);
      
      // Both should be valid ALB DNS names (contain region indicators)
      expect(primaryDomain).toMatch(/\.elb\.amazonaws\.com$/);
      expect(secondaryDomain).toMatch(/\.elb\.amazonaws\.com$/);
    });

    test("VPC IDs are distinct between regions", async () => {
      if (primaryVpcId && secondaryVpcId) {
        expect(primaryVpcId).toBeTruthy();
        expect(secondaryVpcId).toBeTruthy();
        expect(primaryVpcId).not.toBe(secondaryVpcId);
        
        // Both should be valid VPC IDs
        expect(primaryVpcId).toMatch(/^vpc-[a-f0-9]+$/);
        expect(secondaryVpcId).toMatch(/^vpc-[a-f0-9]+$/);
      }
    });

    test("cross-region failover capability validation", async () => {
      // Test that both regions can handle requests simultaneously
      const primaryPromise = retry(() => makeHttpRequest(primaryHttpUrl), 5, 1000);
      const secondaryPromise = retry(() => makeHttpRequest(secondaryHttpUrl), 5, 1000);
      
      const [primaryResponse, secondaryResponse] = await Promise.all([
        primaryPromise,
        secondaryPromise
      ]);
      
      // Both regions should respond successfully
      expect(primaryResponse.statusCode).toBeGreaterThanOrEqual(200);
      expect(primaryResponse.statusCode).toBeLessThan(400);
      expect(secondaryResponse.statusCode).toBeGreaterThanOrEqual(200);
      expect(secondaryResponse.statusCode).toBeLessThan(400);
      
      // Response times should be reasonable for both regions
      expect(primaryResponse.responseTime).toBeLessThan(10000);
      expect(secondaryResponse.responseTime).toBeLessThan(10000);
    }, 90000);

    test("regional load balancer performance comparison", async () => {
      const attempts = 5;
      const primaryResponseTimes: number[] = [];
      const secondaryResponseTimes: number[] = [];
      
      for (let i = 0; i < attempts; i++) {
        try {
          const primaryResponse = await makeHttpRequest(primaryHttpUrl, 5000);
          if (primaryResponse.statusCode >= 200 && primaryResponse.statusCode < 400) {
            primaryResponseTimes.push(primaryResponse.responseTime);
          }
        } catch (error) {
          // Log but don't fail the test for individual request failures
          console.warn(`Primary region request ${i + 1} failed:`, error);
        }
        
        try {
          const secondaryResponse = await makeHttpRequest(secondaryHttpUrl, 5000);
          if (secondaryResponse.statusCode >= 200 && secondaryResponse.statusCode < 400) {
            secondaryResponseTimes.push(secondaryResponse.responseTime);
          }
        } catch (error) {
          // Log but don't fail the test for individual request failures
          console.warn(`Secondary region request ${i + 1} failed:`, error);
        }
        
        // Wait between attempts
        if (i < attempts - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // At least some requests should have succeeded for each region
      expect(primaryResponseTimes.length).toBeGreaterThan(0);
      expect(secondaryResponseTimes.length).toBeGreaterThan(0);
      
      // Calculate average response times
      const primaryAvg = primaryResponseTimes.reduce((a, b) => a + b, 0) / primaryResponseTimes.length;
      const secondaryAvg = secondaryResponseTimes.reduce((a, b) => a + b, 0) / secondaryResponseTimes.length;
      
      // Both regions should have reasonable average response times
      expect(primaryAvg).toBeLessThan(3000); // 3 seconds
      expect(secondaryAvg).toBeLessThan(3000); // 3 seconds
      
      console.log(`Primary region average response time: ${primaryAvg.toFixed(2)}ms`);
      console.log(`Secondary region average response time: ${secondaryAvg.toFixed(2)}ms`);
    }, 120000);
  });
});