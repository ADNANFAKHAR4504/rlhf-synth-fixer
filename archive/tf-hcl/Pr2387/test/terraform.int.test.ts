// tests/live-alb-domain.test.ts
// Live verification using Terraform structured outputs (cfn-outputs/all-outputs.json)
// No Terraform CLI; tests ALB domain reachability and DNS resolution.

import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import * as https from "https";
import { URL } from "url";
import { promisify } from "util";
import { EC2Client, DescribeVpcsCommand, DescribeSecurityGroupsCommand } from "@aws-sdk/client-ec2";
import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from "@aws-sdk/client-auto-scaling";

type TfOutputValue<T> = {
  sensitive: boolean;
  type: any;
  value: T;
};

type StructuredOutputs = {
  alb_dns_name?: TfOutputValue<string>;
  vpc_id?: TfOutputValue<string>;
  alb_security_group_id?: TfOutputValue<string>;
  autoscaling_group_name?: TfOutputValue<string>;
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
  if (!out.vpc_id?.value) {
    throw new Error("vpc_id.value missing in cfn-outputs/all-outputs.json");
  }
  if (!out.alb_security_group_id?.value) {
    throw new Error("alb_security_group_id.value missing in cfn-outputs/all-outputs.json");
  }
  if (!out.autoscaling_group_name?.value) {
    throw new Error("autoscaling_group_name.value missing in cfn-outputs/all-outputs.json");
  }

  const domain = out.alb_dns_name.value;
  const vpcId = out.vpc_id.value;
  const securityGroupId = out.alb_security_group_id.value;
  const autoscalingGroupName = out.autoscaling_group_name.value;
  const region = "us-west-2"

  return { domain, vpcId, securityGroupId, autoscalingGroupName, region };
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

async function verifyVpcExists(vpcId: string, region: string): Promise<{ exists: boolean; state: string; cidr?: string }> {
  const ec2Client = new EC2Client({ region });
  
  try {
    const command = new DescribeVpcsCommand({
      VpcIds: [vpcId]
    });
    
    const response = await ec2Client.send(command);
    
    if (!response.Vpcs || response.Vpcs.length === 0) {
      return { exists: false, state: 'not-found' };
    }
    
    const vpc = response.Vpcs[0];
    return {
      exists: true,
      state: vpc.State || 'unknown',
      cidr: vpc.CidrBlock
    };
  } catch (error: any) {
    if (error.name === 'InvalidVpcID.NotFound') {
      return { exists: false, state: 'not-found' };
    }
    throw error;
  }
}

async function verifySecurityGroupExists(securityGroupId: string, region: string): Promise<{ exists: boolean; state: string; vpcId?: string }> {
  const ec2Client = new EC2Client({ region });
  
  try {
    const command = new DescribeSecurityGroupsCommand({
      GroupIds: [securityGroupId]
    });
    
    const response = await ec2Client.send(command);
    
    if (!response.SecurityGroups || response.SecurityGroups.length === 0) {
      return { exists: false, state: 'not-found' };
    }
    
    const sg = response.SecurityGroups[0];
    return {
      exists: true,
      state: 'available', // Security groups don't have states like VPCs
      vpcId: sg.VpcId
    };
  } catch (error: any) {
    if (error.name === 'InvalidGroupId.NotFound') {
      return { exists: false, state: 'not-found' };
    }
    throw error;
  }
}

async function verifyAutoScalingGroupExists(asgName: string, region: string): Promise<{ exists: boolean; desiredCapacity?: number; instanceCount?: number }> {
  const asgClient = new AutoScalingClient({ region });
  
  try {
    const command = new DescribeAutoScalingGroupsCommand({
      AutoScalingGroupNames: [asgName]
    });
    
    const response = await asgClient.send(command);
    
    if (!response.AutoScalingGroups || response.AutoScalingGroups.length === 0) {
      return { exists: false };
    }
    
    const asg = response.AutoScalingGroups[0];
    return {
      exists: true,
      desiredCapacity: asg.DesiredCapacity,
      instanceCount: asg.Instances?.length || 0
    };
  } catch (error: any) {
    if (error.name === 'ValidationError' && error.message.includes('does not exist')) {
      return { exists: false };
    }
    throw error;
  }
}

// Initialize outputs and URLs at module level (before describe block)
const { domain: albDomain, vpcId, securityGroupId, autoscalingGroupName, region } = readStructuredOutputs();

describe("LIVE: Infrastructure verification from Terraform structured outputs", () => {
  
  // ALB Module Tests (existing)
  describe("ALB Module Tests", () => {
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
        const result = await dns(albDomain);
        // Extract just the address string
        return result.address;
      }, 5, 2000);

      // Should return valid IP address
      expect(dnsResult).toBeTruthy();
      expect(typeof dnsResult).toBe('string');
      
      // Basic IP address format validation (IPv4)
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      expect(ipRegex.test(dnsResult)).toBe(true);
    }, 45000);
  });

  // VPC Module Tests
  describe("VPC Module Tests", () => {
    test("VPC exists and is in available state", async () => {
      const vpcInfo = await retry(async () => {
        const result = await verifyVpcExists(vpcId, region);
        
        if (!result.exists) {
          throw new Error(`VPC ${vpcId} does not exist`);
        }
        
        if (result.state !== 'available') {
          throw new Error(`VPC ${vpcId} is in state: ${result.state}, expected: available`);
        }
        
        return result;
      }, 8, 2000);

      expect(vpcInfo.exists).toBe(true);
      expect(vpcInfo.state).toBe('available');
      expect(vpcInfo.cidr).toBeTruthy();
      
      // Validate CIDR format
      const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
      expect(cidrRegex.test(vpcInfo.cidr!)).toBe(true);
    }, 60000);

    test("VPC has valid CIDR block configuration", async () => {
      const vpcInfo = await verifyVpcExists(vpcId, region);
      
      expect(vpcInfo.exists).toBe(true);
      expect(vpcInfo.cidr).toBeTruthy();
      
      // Parse CIDR to validate it's a private network range
      const cidrParts = vpcInfo.cidr!.split('/');
      const ipParts = cidrParts[0].split('.');
      const firstOctet = parseInt(ipParts[0]);
      
      // Common private IP ranges: 10.x.x.x, 172.16-31.x.x, 192.168.x.x
      const isPrivateRange = 
        firstOctet === 10 ||
        (firstOctet === 172 && parseInt(ipParts[1]) >= 16 && parseInt(ipParts[1]) <= 31) ||
        (firstOctet === 192 && parseInt(ipParts[1]) === 168);
      
      expect(isPrivateRange).toBe(true);
      
      // Subnet mask should be reasonable (not too small, not too large)
      const subnetMask = parseInt(cidrParts[1]);
      expect(subnetMask).toBeGreaterThanOrEqual(16);
      expect(subnetMask).toBeLessThanOrEqual(28);
    }, 30000);
  });

  // Security Module Tests  
  describe("Security Module Tests", () => {
    test("ALB security group exists and is properly configured", async () => {
      const sgInfo = await retry(async () => {
        const result = await verifySecurityGroupExists(securityGroupId, region);
        
        if (!result.exists) {
          throw new Error(`Security Group ${securityGroupId} does not exist`);
        }
        
        return result;
      }, 8, 2000);

      expect(sgInfo.exists).toBe(true);
      expect(sgInfo.state).toBe('available');
      expect(sgInfo.vpcId).toBeTruthy();
    }, 60000);

    test("Security group is associated with the correct VPC", async () => {
      const sgInfo = await verifySecurityGroupExists(securityGroupId, region);
      
      expect(sgInfo.exists).toBe(true);
      expect(sgInfo.vpcId).toBe(vpcId);
    }, 30000);

    test("Security group has valid configuration", async () => {
      const ec2Client = new EC2Client({ region });
      
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId]
      });
      
      const response = await ec2Client.send(command);
      const sg = response.SecurityGroups![0];
      
      // Security group should have a name and description
      expect(sg.GroupName).toBeTruthy();
      expect(sg.Description).toBeTruthy();
      
      // Should have ingress rules (for ALB, typically HTTP/HTTPS)
      expect(sg.IpPermissions).toBeTruthy();
      expect(sg.IpPermissions!.length).toBeGreaterThan(0);
      
      // Check for common ALB ports (80, 443)
      const ports = sg.IpPermissions!.map(rule => rule.FromPort).filter(port => port !== undefined);
      const hasHttpPorts = ports.some(port => port === 80 || port === 443);
      expect(hasHttpPorts).toBe(true);
    }, 45000);
  });

  // EC2 Module Tests
  describe("EC2 Module Tests", () => {
    test("Auto Scaling Group exists and has desired configuration", async () => {
      const asgInfo = await retry(async () => {
        const result = await verifyAutoScalingGroupExists(autoscalingGroupName, region);
        
        if (!result.exists) {
          throw new Error(`Auto Scaling Group ${autoscalingGroupName} does not exist`);
        }
        
        return result;
      }, 10, 3000);

      expect(asgInfo.exists).toBe(true);
      expect(asgInfo.desiredCapacity).toBeDefined();
      expect(asgInfo.instanceCount).toBeDefined();
      
      // Desired capacity should be reasonable (1-10 for typical setups)
      expect(asgInfo.desiredCapacity!).toBeGreaterThanOrEqual(1);
      expect(asgInfo.desiredCapacity!).toBeLessThanOrEqual(10);
    }, 90000);

    test("Auto Scaling Group has healthy instances", async () => {
      const asgClient = new AutoScalingClient({ region });
      
      const asgInfo = await retry(async () => {
        const command = new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [autoscalingGroupName]
        });
        
        const response = await asgClient.send(command);
        const asg = response.AutoScalingGroups![0];
        
        // Check if instances are launching or running
        const instances = asg.Instances || [];
        const healthyInstances = instances.filter(instance => 
          instance.HealthStatus === 'Healthy' || 
          instance.LifecycleState === 'InService'
        );
        
        if (healthyInstances.length === 0 && instances.length > 0) {
          // If instances exist but none are healthy, they might still be launching
          const launchingInstances = instances.filter(instance => 
            instance.LifecycleState === 'Pending' ||
            instance.LifecycleState === 'InService' ||
            instance.LifecycleState === 'Standby'
          );
          
          if (launchingInstances.length === 0) {
            throw new Error(`No healthy or launching instances found in ASG ${autoscalingGroupName}`);
          }
        }
        
        return {
          totalInstances: instances.length,
          healthyInstances: healthyInstances.length,
          desiredCapacity: asg.DesiredCapacity,
          instances: instances
        };
      }, 12, 5000);

      expect(asgInfo.totalInstances).toBeGreaterThanOrEqual(1);
      // Allow some time for instances to become healthy
      expect(asgInfo.totalInstances).toBeLessThanOrEqual(asgInfo.desiredCapacity! + 1);
    }, 180000);

    test("Auto Scaling Group configuration is valid", async () => {
      const asgClient = new AutoScalingClient({ region });
      
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [autoscalingGroupName]
      });
      
      const response = await asgClient.send(command);
      const asg = response.AutoScalingGroups![0];
      
      // Basic ASG configuration validation
      expect(asg.AutoScalingGroupName).toBe(autoscalingGroupName);
      expect(asg.MinSize).toBeDefined();
      expect(asg.MaxSize).toBeDefined();
      expect(asg.DesiredCapacity).toBeDefined();
      
      // Logical size constraints
      expect(asg.MinSize!).toBeLessThanOrEqual(asg.DesiredCapacity!);
      expect(asg.DesiredCapacity!).toBeLessThanOrEqual(asg.MaxSize!);
      
      // Should have at least one availability zone
      expect(asg.AvailabilityZones).toBeTruthy();
      expect(asg.AvailabilityZones!.length).toBeGreaterThan(0);
      
      // Should have launch template or launch configuration
      expect(asg.LaunchTemplate || asg.LaunchConfigurationName).toBeTruthy();
    }, 45000);
  });
});