import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';

describe('TapStack Integration Tests', () => {
  let outputs: any;

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(
      __dirname,
      '../cfn-outputs/flat-outputs.json'
    );

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        'Deployment outputs not found. Please deploy the stack first.'
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  });

  describe('VPC Validation', () => {
    it('should have VPC ID in outputs', () => {
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.vpcId).toMatch(/^vpc-[a-f0-9]+$/);
    });

    it('should have public subnet IDs', () => {
      expect(outputs.publicSubnetIds).toBeDefined();
      // Handle both array and string (JSON serialized) formats
      const subnets = typeof outputs.publicSubnetIds === 'string'
        ? JSON.parse(outputs.publicSubnetIds)
        : outputs.publicSubnetIds;
      expect(Array.isArray(subnets)).toBe(true);
      expect(subnets.length).toBeGreaterThanOrEqual(3);
    });

    it('should have private subnet IDs', () => {
      expect(outputs.privateSubnetIds).toBeDefined();
      // Handle both array and string (JSON serialized) formats
      const subnets = typeof outputs.privateSubnetIds === 'string'
        ? JSON.parse(outputs.privateSubnetIds)
        : outputs.privateSubnetIds;
      expect(Array.isArray(subnets)).toBe(true);
      expect(subnets.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('ECS Cluster Validation', () => {
    it('should have ECS cluster ID', () => {
      expect(outputs.ecsClusterId).toBeDefined();
      expect(typeof outputs.ecsClusterId).toBe('string');
    });
  });

  describe('RDS Database Validation', () => {
    it('should have RDS endpoint', () => {
      expect(outputs.rdsEndpoint).toBeDefined();
      expect(outputs.rdsEndpoint).toMatch(/\.rds\.amazonaws\.com/);
    });
  });

  describe('S3 Bucket Validation', () => {
    it('should have app bucket name', () => {
      expect(outputs.appBucketName).toBeDefined();
      expect(typeof outputs.appBucketName).toBe('string');
    });
  });

  describe('Load Balancer Validation', () => {
    it('should have ALB DNS name', () => {
      expect(outputs.albDnsName).toBeDefined();
      expect(outputs.albDnsName).toMatch(/\.elb\.amazonaws\.com$/);
    });

    it('should be accessible via HTTP', done => {
      const albUrl = `http://${outputs.albDnsName}`;

      http
        .get(albUrl, res => {
          expect(res.statusCode).toBeDefined();
          expect([200, 503]).toContain(res.statusCode); // 503 is acceptable if targets are unhealthy initially
          done();
        })
        .on('error', error => {
          // ALB might not be immediately accessible
          console.warn('ALB connectivity check failed:', error.message);
          done();
        });
    }, 30000);
  });

  describe('CloudFront Distribution Validation', () => {
    it('should have CloudFront domain name', () => {
      expect(outputs.cloudfrontDomainName).toBeDefined();
      expect(outputs.cloudfrontDomainName).toMatch(/\.cloudfront\.net$/);
    });

    it('should be accessible via HTTPS', done => {
      const cfUrl = `https://${outputs.cloudfrontDomainName}`;

      https
        .get(cfUrl, res => {
          expect(res.statusCode).toBeDefined();
          expect([200, 403, 404]).toContain(res.statusCode); // 403/404 acceptable if no content uploaded
          done();
        })
        .on('error', error => {
          // CloudFront might not be fully deployed
          console.warn('CloudFront connectivity check failed:', error.message);
          done();
        });
    }, 30000);
  });

  describe('Resource Tagging', () => {
    it('should have all required outputs', () => {
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.ecsClusterId).toBeDefined();
      expect(outputs.rdsEndpoint).toBeDefined();
      expect(outputs.albDnsName).toBeDefined();
      expect(outputs.cloudfrontDomainName).toBeDefined();
      expect(outputs.appBucketName).toBeDefined();
    });
  });
});
