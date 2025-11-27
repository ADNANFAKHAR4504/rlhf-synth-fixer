/**
 * Integration tests for TapStack infrastructure
 *
 * These tests validate the deployed infrastructure by reading actual
 * deployment outputs from cfn-outputs/flat-outputs.json and performing
 * real integration testing without mocking.
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import * as dns from 'dns';
import { promisify } from 'util';
import * as https from 'https';
import * as http from 'http';

const dnsLookup = promisify(dns.lookup);
const dnsResolve4 = promisify(dns.resolve4);

interface DeploymentOutputs {
  albDnsName: string;
  ecsClusterName: string;
  rdsEndpoint: string;
  vpcId: string;
}

describe('TapStack Integration Tests', () => {
  let outputs: DeploymentOutputs;
  const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

  beforeAll(() => {
    // Load deployment outputs from the JSON file
    expect(fs.existsSync(outputsPath)).toBe(true);

    const rawData = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(rawData) as DeploymentOutputs;

    // Validate that all required outputs exist
    expect(outputs).toBeDefined();
    expect(outputs.albDnsName).toBeDefined();
    expect(outputs.ecsClusterName).toBeDefined();
    expect(outputs.rdsEndpoint).toBeDefined();
    expect(outputs.vpcId).toBeDefined();
  });

  describe('Deployment Outputs Validation', () => {
    it('should have valid deployment outputs file', () => {
      expect(outputs).toBeTruthy();
    });

    it('should have ALB DNS name in correct format', () => {
      expect(outputs.albDnsName).toMatch(/^fintech-alb-.*\.elb\.amazonaws\.com$/);
      expect(outputs.albDnsName).toContain('.elb.amazonaws.com');
    });

    it('should have ECS cluster name with correct prefix', () => {
      expect(outputs.ecsClusterName).toMatch(/^fintech-cluster-/);
      expect(outputs.ecsClusterName.length).toBeGreaterThan(16);
    });

    it('should have RDS endpoint in correct format', () => {
      expect(outputs.rdsEndpoint).toMatch(/^fintech-db-.*\.rds\.amazonaws\.com:\d+$/);
      expect(outputs.rdsEndpoint).toContain(':5432'); // PostgreSQL default port
    });

    it('should have VPC ID in correct format', () => {
      expect(outputs.vpcId).toMatch(/^vpc-[a-f0-9]{17}$/);
    });
  });

  describe('Application Load Balancer Integration', () => {
    it('should resolve ALB DNS name to IP addresses', async () => {
      const addresses = await dnsResolve4(outputs.albDnsName);

      expect(addresses).toBeDefined();
      expect(Array.isArray(addresses)).toBe(true);
      expect(addresses.length).toBeGreaterThan(0);

      // Validate IP address format
      addresses.forEach(ip => {
        expect(ip).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
      });
    });

    it('should have ALB DNS name resolvable via DNS lookup', async () => {
      const result = await dnsLookup(outputs.albDnsName);

      expect(result).toBeDefined();
      expect(result.address).toBeDefined();
      expect(result.address).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
      expect(result.family).toBe(4); // IPv4
    });

    it('should have ALB endpoint responding on port 80', async () => {
      const isReachable = await new Promise<boolean>((resolve) => {
        const req = http.get(`http://${outputs.albDnsName}`, {
          timeout: 10000,
        }, (res) => {
          resolve(res.statusCode !== undefined);
          res.resume(); // Consume response
        });

        req.on('error', () => {
          resolve(false);
        });

        req.on('timeout', () => {
          req.destroy();
          resolve(false);
        });
      });

      // ALB should be reachable (even if app returns error)
      expect(isReachable).toBe(true);
    }, 15000);

    it('should have valid ALB DNS format matching AWS ELB pattern', () => {
      const parts = outputs.albDnsName.split('.');

      expect(parts.length).toBeGreaterThanOrEqual(4);
      expect(parts[parts.length - 1]).toBe('com');
      expect(parts[parts.length - 2]).toBe('amazonaws');
      expect(parts[parts.length - 3]).toBe('elb');
    });

    it('should have ALB name containing environment suffix', () => {
      const albName = outputs.albDnsName.split('.')[0];

      expect(albName).toContain('fintech-alb');
      expect(albName).toMatch(/fintech-alb-pr\d+/);
    });
  });

  describe('ECS Cluster Integration', () => {
    it('should have ECS cluster name matching naming convention', () => {
      expect(outputs.ecsClusterName).toContain('fintech-cluster');
    });

    it('should have ECS cluster name with environment suffix', () => {
      const clusterName = outputs.ecsClusterName;

      expect(clusterName).toMatch(/^fintech-cluster-pr\d+$/);
    });

    it('should have consistent environment suffix across resources', () => {
      const albSuffix = outputs.albDnsName.match(/fintech-alb-(pr\d+)/)?.[1];
      const ecsSuffix = outputs.ecsClusterName.match(/fintech-cluster-(pr\d+)/)?.[1];

      expect(albSuffix).toBeDefined();
      expect(ecsSuffix).toBeDefined();
      expect(albSuffix).toBe(ecsSuffix);
    });
  });

  describe('RDS Database Integration', () => {
    it('should have RDS endpoint with correct hostname format', () => {
      const [hostname, port] = outputs.rdsEndpoint.split(':');

      expect(hostname).toMatch(/^fintech-db-.*\.rds\.amazonaws\.com$/);
      expect(port).toBe('5432');
    });

    it('should have RDS endpoint resolvable via DNS', async () => {
      const [hostname] = outputs.rdsEndpoint.split(':');
      const result = await dnsLookup(hostname);

      expect(result).toBeDefined();
      expect(result.address).toBeDefined();
      expect(result.address).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
    });

    it('should have RDS endpoint using PostgreSQL default port', () => {
      expect(outputs.rdsEndpoint).toContain(':5432');
    });

    it('should have RDS identifier matching naming convention', () => {
      const hostname = outputs.rdsEndpoint.split(':')[0];
      const identifier = hostname.split('.')[0];

      expect(identifier).toMatch(/^fintech-db-pr\d+$/);
    });

    it('should have RDS endpoint in us-east-1 region', () => {
      expect(outputs.rdsEndpoint).toContain('.us-east-1.rds.amazonaws.com');
    });
  });

  describe('VPC Integration', () => {
    it('should have valid VPC ID format', () => {
      expect(outputs.vpcId).toMatch(/^vpc-[a-f0-9]{17}$/);
    });

    it('should have VPC ID starting with vpc- prefix', () => {
      expect(outputs.vpcId).toMatch(/^vpc-/);
    });

    it('should have VPC ID with correct hexadecimal suffix length', () => {
      const suffix = outputs.vpcId.replace('vpc-', '');

      expect(suffix.length).toBe(17);
      expect(suffix).toMatch(/^[a-f0-9]+$/);
    });
  });

  describe('Cross-Resource Integration', () => {
    it('should have all resources in the same AWS region (us-east-1)', () => {
      expect(outputs.albDnsName).toContain('.us-east-1.elb.amazonaws.com');
      expect(outputs.rdsEndpoint).toContain('.us-east-1.rds.amazonaws.com');
    });

    it('should have consistent naming across all resources', () => {
      const albName = outputs.albDnsName.split('.')[0];
      const ecsName = outputs.ecsClusterName;
      const rdsName = outputs.rdsEndpoint.split('.')[0];

      expect(albName).toContain('fintech');
      expect(ecsName).toContain('fintech');
      expect(rdsName).toContain('fintech');
    });

    it('should have matching environment suffixes across all resources', () => {
      const albMatch = outputs.albDnsName.match(/(pr\d+)/);
      const ecsMatch = outputs.ecsClusterName.match(/(pr\d+)/);
      const rdsMatch = outputs.rdsEndpoint.match(/(pr\d+)/);

      expect(albMatch).toBeTruthy();
      expect(ecsMatch).toBeTruthy();
      expect(rdsMatch).toBeTruthy();

      const albSuffix = albMatch?.[1];
      const ecsSuffix = ecsMatch?.[1];
      const rdsSuffix = rdsMatch?.[1];

      expect(albSuffix).toBe(ecsSuffix);
      expect(ecsSuffix).toBe(rdsSuffix);
    });
  });

  describe('Infrastructure Connectivity', () => {
    it('should have ALB endpoint network accessible', async () => {
      try {
        await dnsLookup(outputs.albDnsName);
        expect(true).toBe(true);
      } catch (error) {
        fail(`ALB DNS lookup failed: ${error}`);
      }
    });

    it('should have RDS endpoint network accessible via DNS', async () => {
      const [hostname] = outputs.rdsEndpoint.split(':');

      try {
        const result = await dnsLookup(hostname);
        expect(result.address).toBeTruthy();
      } catch (error) {
        fail(`RDS DNS lookup failed: ${error}`);
      }
    });

    it('should have all DNS names resolvable within timeout', async () => {
      const albPromise = dnsLookup(outputs.albDnsName);
      const rdsPromise = dnsLookup(outputs.rdsEndpoint.split(':')[0]);

      const results = await Promise.all([albPromise, rdsPromise]);

      expect(results).toHaveLength(2);
      expect(results[0].address).toBeTruthy();
      expect(results[1].address).toBeTruthy();
    }, 10000);
  });

  describe('Output File Integrity', () => {
    it('should have well-formed JSON in outputs file', () => {
      const rawData = fs.readFileSync(outputsPath, 'utf-8');

      expect(() => JSON.parse(rawData)).not.toThrow();
    });

    it('should have exactly 4 output properties', () => {
      const keys = Object.keys(outputs);

      expect(keys).toHaveLength(4);
      expect(keys).toContain('albDnsName');
      expect(keys).toContain('ecsClusterName');
      expect(keys).toContain('rdsEndpoint');
      expect(keys).toContain('vpcId');
    });

    it('should have no null or undefined values in outputs', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        expect(value).not.toBeNull();
        expect(value).not.toBeUndefined();
        expect(value).toBeTruthy();
      });
    });

    it('should have all output values as non-empty strings', () => {
      Object.values(outputs).forEach(value => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });
  });

  describe('AWS Service Endpoint Validation', () => {
    it('should have ALB in ELB service domain', () => {
      expect(outputs.albDnsName).toContain('elb.amazonaws.com');
    });

    it('should have RDS in RDS service domain', () => {
      expect(outputs.rdsEndpoint).toContain('rds.amazonaws.com');
    });

    it('should have valid AWS service endpoint formats', () => {
      // ALB format: <name>-<id>.region.elb.amazonaws.com
      expect(outputs.albDnsName).toMatch(/^[\w-]+\.\w+-\w+-\d+\.elb\.amazonaws\.com$/);

      // RDS format: <identifier>.hash.region.rds.amazonaws.com:port
      expect(outputs.rdsEndpoint).toMatch(/^[\w-]+\.[\w]+\.\w+-\w+-\d+\.rds\.amazonaws\.com:\d+$/);
    });
  });

  describe('Resource Naming Standards', () => {
    it('should follow lowercase naming convention', () => {
      expect(outputs.albDnsName.split('.')[0]).toMatch(/^[a-z0-9-]+$/);
      expect(outputs.ecsClusterName).toMatch(/^[a-z0-9-]+$/);
      expect(outputs.rdsEndpoint.split('.')[0]).toMatch(/^[a-z0-9-]+$/);
    });

    it('should use hyphen as separator in resource names', () => {
      const albName = outputs.albDnsName.split('.')[0];
      const rdsName = outputs.rdsEndpoint.split('.')[0];

      expect(albName).toContain('-');
      expect(outputs.ecsClusterName).toContain('-');
      expect(rdsName).toContain('-');
    });

    it('should have consistent fintech prefix across resources', () => {
      expect(outputs.albDnsName).toContain('fintech');
      expect(outputs.ecsClusterName).toContain('fintech');
      expect(outputs.rdsEndpoint).toContain('fintech');
    });
  });
});
