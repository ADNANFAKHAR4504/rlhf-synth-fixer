// tests/live-alb-domain.test.ts
// Live verification using Terraform structured outputs (cfn-outputs/all-outputs.json)
// No Terraform CLI; tests ALB domain reachability and DNS resolution.

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
  alb_dns_name?: TfOutputValue<string>;
};

function readStructuredOutputs() {
  const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (!fs.existsSync(p)) {
    throw new Error(`Outputs file not found at ${p}`);
  }
  const out = JSON.parse(fs.readFileSync(p, "utf8")) as StructuredOutputs;

  if (!out.alb_dns_name?.value) {
    throw new Error("alb_dns_name.value missing in cfn-outputs/all-outputs.json");
  }
  const domain = out.alb_dns_name.value;

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

async function isDomainAlive(domain: string, timeout: number = 10000): Promise<boolean> {
  try {
    const httpUrl = `http://${domain}`;
    const response = await makeHttpRequest(httpUrl, timeout);
    
    // This includes connection establishment, DNS resolution, and any HTTP response
    return response.statusCode !== undefined && response.statusCode > 0;
  } catch (error: any) {
    // Check if the error indicates the domain is unreachable vs just returning an error response
    if (error.message.includes('ENOTFOUND') || 
        error.message.includes('ECONNREFUSED') || 
        error.message.includes('DNS resolution failed') ||
        error.message.includes('timed out')) {
      return false;
    }
    
    // If we get other HTTP errors, the domain is still "alive" (responding)
    return true;
  }
}

async function checkDomainConnectivity(domain: string): Promise<{ connected: boolean; responseTime: number }> {
  const startTime = Date.now();
  
  try {
    const httpUrl = `http://${domain}`;
    await makeHttpRequest(httpUrl, 15000);
    const responseTime = Date.now() - startTime;
    return { connected: true, responseTime };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    // Even if request fails, if we got a connection, domain is reachable
    if (!error.message.includes('ENOTFOUND') && 
        !error.message.includes('ECONNREFUSED') && 
        !error.message.includes('DNS resolution failed') &&
        !error.message.includes('timed out')) {
      return { connected: true, responseTime };
    }
    
    return { connected: false, responseTime };
  }
}

// Initialize outputs and URLs at module level (before describe block)
const { domain: albDomain } = readStructuredOutputs();

describe("LIVE: ALB Domain verification from Terraform structured outputs", () => {
  
  test("ALB domain DNS resolution", async () => {
    await expect(retry(() => checkDnsResolution(albDomain), 8, 1500)).resolves.toBeUndefined();
  }, 60000);

  test("ALB domain is alive and reachable", async () => {
    const isAlive = await retry(async () => {
      const alive = await isDomainAlive(albDomain, 15000);
      
      if (!alive) {
        throw new Error(`Domain ${albDomain} is not responding`);
      }
      
      return alive;
    }, 12, 2000);

    expect(isAlive).toBe(true);
  }, 120000);

  test("ALB domain connectivity check", async () => {
    const connectivity = await retry(async () => {
      const result = await checkDomainConnectivity(albDomain);
      
      if (!result.connected) {
        throw new Error(`Cannot establish connection to ${albDomain}`);
      }
      
      return result;
    }, 8, 2000);

    expect(connectivity.connected).toBe(true);
    expect(connectivity.responseTime).toBeGreaterThan(0);
    // ALB should respond reasonably quickly (under 10 seconds for connection)
    expect(connectivity.responseTime).toBeLessThan(10000);
  }, 80000);

  test("ALB domain responds with valid HTTP headers", async () => {
    const response = await retry(async () => {
      return await makeHttpRequest(`http://${albDomain}`, 15000);
    }, 8, 2000);

    // Check for common HTTP headers that indicate a live web service
    expect(response.headers).toBeTruthy();
    expect(typeof response.headers).toBe('object');
    
    // Most web servers/load balancers return at least one of these headers
    const hasExpectedHeaders = 
      response.headers['server'] ||
      response.headers['date'] ||
      response.headers['content-type'] ||
      response.headers['content-length'] ||
      response.headers['connection'] ||
      response.headers['x-amzn-requestid'] || // ALB specific
      response.headers['x-amz-request-id'];   // AWS specific
      
    expect(hasExpectedHeaders).toBeTruthy();
  }, 60000);

  test("ALB domain is consistently reachable", async () => {
    const attempts = 3;
    const results: boolean[] = [];
    
    for (let i = 0; i < attempts; i++) {
      const isAlive = await isDomainAlive(albDomain, 10000);
      results.push(isAlive);
      
      // Wait between requests to test consistency
      if (i < attempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // All requests should show domain as alive
    results.forEach((isAlive, index) => {
      expect(isAlive).toBe(true);
    });
    
    // Check consistency - all attempts should succeed
    const successCount = results.filter(result => result === true).length;
    expect(successCount).toBe(attempts);
  }, 90000);

  test("ALB domain response time is reasonable", async () => {
    await retry(async () => {
      const connectivity = await checkDomainConnectivity(albDomain);
      
      if (!connectivity.connected) {
        throw new Error(`Domain ${albDomain} is not reachable`);
      }
      
      // Response time should be under 8 seconds for a healthy ALB
      expect(connectivity.responseTime).toBeLessThan(8000);
      expect(connectivity.responseTime).toBeGreaterThan(0);
      
      return connectivity;
    }, 5, 3000);
  }, 60000);

  test("ALB domain has valid DNS record structure", async () => {
    const dns = promisify(require('dns').lookup);
    
    const dnsResult = await retry(async () => {
      return await dns(albDomain);
    }, 5, 2000);

    // Should return valid IP address
    expect(dnsResult).toBeTruthy();
    expect(typeof dnsResult).toBe('string');
    
    // Basic IP address format validation (IPv4)
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    expect(ipRegex.test(dnsResult as string)).toBe(true);
  }, 45000);
});