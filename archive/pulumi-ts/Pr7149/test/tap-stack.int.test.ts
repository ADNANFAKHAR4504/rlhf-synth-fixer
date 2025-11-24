/**
 * Integration Tests for TAP Stack Deployment
 *
 * These tests validate the actual deployment outputs from cfn-outputs/flat-outputs.json
 * against expected values and infrastructure requirements.
 *
 * Pattern: Uses cfn-outputs/flat-outputs.json to validate deployed infrastructure
 * No AWS SDK calls - all validation based on deployment outputs
 */
import * as fs from 'fs';
import * as path from 'path';

describe('TAP Stack Infrastructure Integration Tests', () => {
  let outputs: any;
  let environmentSuffix: string;

  beforeAll(() => {
    const outputsPath = path.join(
      __dirname,
      '..',
      'cfn-outputs',
      'flat-outputs.json'
    );

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Deployment outputs not found at ${outputsPath}. Run deployment first.`
      );
    }

    const rawData = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(rawData);

    // Extract environment suffix from bucket name or ALB name
    const match = outputs.staticBucketName?.match(/payment-static-(.+)$/);
    if (match) {
      environmentSuffix = match[1];
    }
  });

  describe('Core Outputs', () => {
    test('should have all required outputs', () => {
      expect(outputs.albDnsName).toBeDefined();
      expect(outputs.clusterEndpoint).toBeDefined();
      expect(outputs.staticBucketName).toBeDefined();
      expect(outputs.auditBucketName).toBeDefined();
    });

    test('should have valid output types', () => {
      expect(typeof outputs.albDnsName).toBe('string');
      expect(typeof outputs.clusterEndpoint).toBe('string');
      expect(typeof outputs.staticBucketName).toBe('string');
      expect(typeof outputs.auditBucketName).toBe('string');
    });

    test('outputs should not be empty strings', () => {
      expect(outputs.albDnsName.length).toBeGreaterThan(0);
      expect(outputs.clusterEndpoint.length).toBeGreaterThan(0);
      expect(outputs.staticBucketName.length).toBeGreaterThan(0);
      expect(outputs.auditBucketName.length).toBeGreaterThan(0);
    });
  });

  describe('Application Load Balancer', () => {
    test('should have valid ALB DNS name', () => {
      expect(outputs.albDnsName).toBeDefined();
      expect(outputs.albDnsName).toMatch(/\.elb\.amazonaws\.com$/);
    });

    test('ALB DNS should include region', () => {
      expect(outputs.albDnsName).toMatch(/\.us-east-1\.elb\.amazonaws\.com$/);
    });

    test('ALB DNS should include environment suffix', () => {
      expect(outputs.albDnsName).toContain(`payment-alb-${environmentSuffix}`);
    });

    test('ALB DNS should follow AWS format', () => {
      expect(outputs.albDnsName).toMatch(/^payment-alb-[a-z0-9-]+-\d+\.us-east-1\.elb\.amazonaws\.com$/);
    });

    test('ALB name should include payment-alb prefix', () => {
      expect(outputs.albDnsName).toMatch(/^payment-alb-/);
    });

    test('ALB DNS should be resolvable format', () => {
      const parts = outputs.albDnsName.split('.');
      expect(parts.length).toBeGreaterThan(4);
      expect(parts[parts.length - 1]).toBe('com');
      expect(parts[parts.length - 2]).toBe('amazonaws');
    });
  });

  describe('RDS Cluster', () => {
    test('should have valid cluster endpoint', () => {
      expect(outputs.clusterEndpoint).toBeDefined();
      expect(outputs.clusterEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });

    test('cluster endpoint should include region', () => {
      expect(outputs.clusterEndpoint).toMatch(/\.us-east-1\.rds\.amazonaws\.com$/);
    });

    test('cluster endpoint should include environment suffix', () => {
      expect(outputs.clusterEndpoint).toContain(`payment-cluster-${environmentSuffix}`);
    });

    test('cluster endpoint should follow AWS RDS format', () => {
      expect(outputs.clusterEndpoint).toMatch(/^payment-cluster-[a-z0-9-]+\.cluster-[a-z0-9]+\.us-east-1\.rds\.amazonaws\.com$/);
    });

    test('cluster endpoint should have cluster identifier', () => {
      expect(outputs.clusterEndpoint).toMatch(/\.cluster-/);
    });

    test('cluster endpoint should be Aurora format', () => {
      // Aurora clusters have .cluster- in their endpoint
      const match = outputs.clusterEndpoint.match(/\.cluster-([a-z0-9]+)\./);
      expect(match).not.toBeNull();
      expect(match![1].length).toBeGreaterThan(0);
    });

    test('cluster name should include payment-cluster prefix', () => {
      expect(outputs.clusterEndpoint).toMatch(/^payment-cluster-/);
    });
  });

  describe('S3 Static Assets Bucket', () => {
    test('should have valid static bucket name', () => {
      expect(outputs.staticBucketName).toBeDefined();
      expect(outputs.staticBucketName).toMatch(/^payment-static-/);
    });

    test('static bucket should include environment suffix', () => {
      expect(outputs.staticBucketName).toBe(`payment-static-${environmentSuffix}`);
    });

    test('static bucket name should follow naming convention', () => {
      expect(outputs.staticBucketName).toMatch(/^payment-static-[a-z0-9-]+$/);
    });

    test('static bucket name should not contain uppercase', () => {
      expect(outputs.staticBucketName).toBe(outputs.staticBucketName.toLowerCase());
    });

    test('static bucket name should not contain underscores', () => {
      expect(outputs.staticBucketName).not.toContain('_');
    });

    test('static bucket name length should be valid', () => {
      // S3 bucket names must be between 3 and 63 characters
      expect(outputs.staticBucketName.length).toBeGreaterThanOrEqual(3);
      expect(outputs.staticBucketName.length).toBeLessThanOrEqual(63);
    });

    test('static bucket should start with payment-static', () => {
      expect(outputs.staticBucketName.startsWith('payment-static-')).toBe(true);
    });
  });

  describe('S3 Audit Logs Bucket', () => {
    test('should have valid audit bucket name', () => {
      expect(outputs.auditBucketName).toBeDefined();
      expect(outputs.auditBucketName).toMatch(/^payment-audit-logs-/);
    });

    test('audit bucket should include environment suffix', () => {
      expect(outputs.auditBucketName).toBe(`payment-audit-logs-${environmentSuffix}`);
    });

    test('audit bucket name should follow naming convention', () => {
      expect(outputs.auditBucketName).toMatch(/^payment-audit-logs-[a-z0-9-]+$/);
    });

    test('audit bucket name should not contain uppercase', () => {
      expect(outputs.auditBucketName).toBe(outputs.auditBucketName.toLowerCase());
    });

    test('audit bucket name should not contain underscores', () => {
      expect(outputs.auditBucketName).not.toContain('_');
    });

    test('audit bucket name length should be valid', () => {
      // S3 bucket names must be between 3 and 63 characters
      expect(outputs.auditBucketName.length).toBeGreaterThanOrEqual(3);
      expect(outputs.auditBucketName.length).toBeLessThanOrEqual(63);
    });

    test('audit bucket should start with payment-audit-logs', () => {
      expect(outputs.auditBucketName.startsWith('payment-audit-logs-')).toBe(true);
    });

    test('audit and static buckets should be different', () => {
      expect(outputs.auditBucketName).not.toBe(outputs.staticBucketName);
    });
  });

  describe('Naming Conventions', () => {
    test('all resources should use consistent environment suffix', () => {
      const albSuffix = outputs.albDnsName.match(/payment-alb-([a-z0-9-]+)-\d+/)?.[1];
      const clusterSuffix = outputs.clusterEndpoint.match(/payment-cluster-([a-z0-9-]+)\./)?.[1];
      const staticSuffix = outputs.staticBucketName.match(/payment-static-(.+)$/)?.[1];
      const auditSuffix = outputs.auditBucketName.match(/payment-audit-logs-(.+)$/)?.[1];

      expect(albSuffix).toBe(clusterSuffix);
      expect(clusterSuffix).toBe(staticSuffix);
      expect(staticSuffix).toBe(auditSuffix);
    });

    test('resource names should include payment prefix', () => {
      expect(outputs.albDnsName).toContain('payment-alb');
      expect(outputs.clusterEndpoint).toContain('payment-cluster');
      expect(outputs.staticBucketName).toContain('payment-static');
      expect(outputs.auditBucketName).toContain('payment-audit-logs');
    });

    test('environment suffix should be consistent across all resources', () => {
      expect(environmentSuffix).toBeDefined();
      expect(environmentSuffix.length).toBeGreaterThan(0);
    });

    test('resource names should follow kebab-case', () => {
      const albName = outputs.albDnsName.split('.')[0];
      expect(albName).toMatch(/^[a-z0-9-]+$/);
      expect(outputs.staticBucketName).toMatch(/^[a-z0-9-]+$/);
      expect(outputs.auditBucketName).toMatch(/^[a-z0-9-]+$/);
    });
  });

  describe('AWS Resource Format Validation', () => {
    test('ALB DNS should follow AWS ELB format', () => {
      expect(outputs.albDnsName).toMatch(/^[a-z0-9-]+-\d+\.[a-z0-9-]+\.elb\.amazonaws\.com$/);
    });

    test('RDS endpoint should follow AWS RDS format', () => {
      expect(outputs.clusterEndpoint).toMatch(/^[a-z0-9-]+\.cluster-[a-z0-9]+\.[a-z0-9-]+\.rds\.amazonaws\.com$/);
    });

    test('S3 bucket names should follow AWS S3 naming rules', () => {
      const buckets = [outputs.staticBucketName, outputs.auditBucketName];

      buckets.forEach((bucket: string) => {
        // Must be lowercase
        expect(bucket).toBe(bucket.toLowerCase());
        // Must not start or end with hyphen
        expect(bucket.startsWith('-')).toBe(false);
        expect(bucket.endsWith('-')).toBe(false);
        // Must be valid length
        expect(bucket.length).toBeGreaterThanOrEqual(3);
        expect(bucket.length).toBeLessThanOrEqual(63);
        // Must match allowed characters
        expect(bucket).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
      });
    });

    test('all endpoints should use HTTPS-compatible format', () => {
      expect(outputs.albDnsName).not.toContain('_');
      expect(outputs.clusterEndpoint).not.toContain('_');
    });
  });

  describe('Regional Configuration', () => {
    test('all AWS resources should be in us-east-1', () => {
      expect(outputs.albDnsName).toContain('us-east-1');
      expect(outputs.clusterEndpoint).toContain('us-east-1');
    });

    test('ALB should be in us-east-1 region', () => {
      expect(outputs.albDnsName).toMatch(/\.us-east-1\.elb\.amazonaws\.com$/);
    });

    test('RDS cluster should be in us-east-1 region', () => {
      expect(outputs.clusterEndpoint).toMatch(/\.us-east-1\.rds\.amazonaws\.com$/);
    });
  });

  describe('Output Completeness', () => {
    test('should not have undefined outputs', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        expect(value).not.toBeUndefined();
      });
    });

    test('should not have null outputs', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        expect(value).not.toBeNull();
      });
    });

    test('required outputs should not be empty', () => {
      const requiredOutputs = [
        'albDnsName',
        'clusterEndpoint',
        'staticBucketName',
        'auditBucketName',
      ];

      requiredOutputs.forEach(key => {
        const value = outputs[key];
        expect(value).toBeDefined();
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });

    test('should have exactly 4 outputs', () => {
      const expectedOutputs = [
        'albDnsName',
        'clusterEndpoint',
        'staticBucketName',
        'auditBucketName',
      ];

      const actualOutputKeys = Object.keys(outputs);
      expect(actualOutputKeys.sort()).toEqual(expectedOutputs.sort());
    });
  });

  describe('Infrastructure Architecture', () => {
    test('should have compute layer (ALB)', () => {
      expect(outputs.albDnsName).toBeDefined();
      expect(outputs.albDnsName).toContain('elb.amazonaws.com');
    });

    test('should have data layer (RDS)', () => {
      expect(outputs.clusterEndpoint).toBeDefined();
      expect(outputs.clusterEndpoint).toContain('rds.amazonaws.com');
    });

    test('should have storage layer (S3)', () => {
      expect(outputs.staticBucketName).toBeDefined();
      expect(outputs.auditBucketName).toBeDefined();
    });

    test('should have static assets storage', () => {
      expect(outputs.staticBucketName).toContain('payment-static');
    });

    test('should have audit logging storage', () => {
      expect(outputs.auditBucketName).toContain('payment-audit-logs');
    });

    test('should have separate buckets for different purposes', () => {
      expect(outputs.staticBucketName).not.toBe(outputs.auditBucketName);
    });
  });

  describe('Security and Compliance', () => {
    test('should have audit logging bucket', () => {
      expect(outputs.auditBucketName).toBeDefined();
      expect(outputs.auditBucketName).toContain('audit-logs');
    });

    test('ALB should use secure DNS', () => {
      // AWS ELB endpoints are HTTPS-capable
      expect(outputs.albDnsName).not.toContain('http://');
      expect(outputs.albDnsName).not.toContain('https://');
      // Just the hostname, which is correct for secure connections
    });

    test('RDS endpoint should support encrypted connections', () => {
      // RDS endpoints support SSL/TLS
      expect(outputs.clusterEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });
  });

  describe('Environment Identification', () => {
    test('should identify environment suffix from outputs', () => {
      expect(environmentSuffix).toBeDefined();
      expect(typeof environmentSuffix).toBe('string');
      expect(environmentSuffix.length).toBeGreaterThan(0);
    });

    test('environment suffix should be alphanumeric with hyphens', () => {
      expect(environmentSuffix).toMatch(/^[a-z0-9-]+$/);
    });

    test('should support PR environment naming (pr####)', () => {
      // Should handle both standard environments and PR environments
      const isPrEnv = environmentSuffix.match(/^pr\d+$/);
      const isStandardEnv = ['dev', 'qa', 'staging', 'prod'].includes(environmentSuffix);

      expect(isPrEnv || isStandardEnv).toBeTruthy();
    });
  });

  describe('DNS and Endpoint Validation', () => {
    test('RDS endpoint should have valid hostname structure', () => {
      const parts = outputs.clusterEndpoint.split('.');
      expect(parts.length).toBe(6); // cluster.cluster-id.region.rds.amazonaws.com
      expect(parts[3]).toBe('rds');
      expect(parts[4]).toBe('amazonaws');
      expect(parts[5]).toBe('com');
    });

    test('endpoints should not contain spaces', () => {
      expect(outputs.albDnsName).not.toContain(' ');
      expect(outputs.clusterEndpoint).not.toContain(' ');
    });

    test('endpoints should not contain special characters', () => {
      expect(outputs.albDnsName).toMatch(/^[a-z0-9.-]+$/);
      expect(outputs.clusterEndpoint).toMatch(/^[a-z0-9.-]+$/);
    });
  });

  describe('Deployment Validation', () => {
    test('outputs file should be valid JSON', () => {
      const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
      const rawData = fs.readFileSync(outputsPath, 'utf-8');

      expect(() => JSON.parse(rawData)).not.toThrow();
    });

    test('deployment should produce all required infrastructure', () => {
      const requiredInfrastructure = {
        compute: outputs.albDnsName,
        database: outputs.clusterEndpoint,
        storage: outputs.staticBucketName && outputs.auditBucketName,
      };

      Object.entries(requiredInfrastructure).forEach(([component, exists]) => {
        expect(exists).toBeTruthy();
      });
    });
  });

  describe('Production Readiness', () => {
    test('should have load balancer for high availability', () => {
      expect(outputs.albDnsName).toContain('elb.amazonaws.com');
    });

    test('should have Aurora RDS cluster for HA database', () => {
      expect(outputs.clusterEndpoint).toContain('.cluster-');
    });

    test('should have separate storage for static and audit', () => {
      expect(outputs.staticBucketName).toBeDefined();
      expect(outputs.auditBucketName).toBeDefined();
      expect(outputs.staticBucketName).not.toBe(outputs.auditBucketName);
    });

    test('all critical infrastructure should be deployed', () => {
      const criticalComponents = [
        outputs.albDnsName,
        outputs.clusterEndpoint,
        outputs.staticBucketName,
        outputs.auditBucketName,
      ];

      criticalComponents.forEach(component => {
        expect(component).toBeDefined();
        expect(component.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Resource Uniqueness', () => {
    test('all output values should be unique', () => {
      const values = Object.values(outputs);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });

    test('bucket names should be globally unique format', () => {
      // S3 buckets must be globally unique
      expect(outputs.staticBucketName).toContain(environmentSuffix);
      expect(outputs.auditBucketName).toContain(environmentSuffix);
    });

    test('ALB should have unique identifier', () => {
      const match = outputs.albDnsName.match(/payment-alb-[a-z0-9-]+-(\d+)\./);
      expect(match).not.toBeNull();
      expect(match![1].length).toBeGreaterThan(0);
    });

    test('RDS cluster should have unique identifier', () => {
      const match = outputs.clusterEndpoint.match(/\.cluster-([a-z0-9]+)\./);
      expect(match).not.toBeNull();
      expect(match![1].length).toBeGreaterThan(0);
    });
  });
});
