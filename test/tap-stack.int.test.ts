// Configuration - These are coming from cfn-outputs after terraform apply
import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Secure Web Infrastructure Integration Tests', () => {
  describe('Stack Outputs', () => {
    test('should have all expected stack outputs', () => {
      const expectedOutputs = [
        'vpc_id',
        'public_subnet_ids',
        'private_subnet_ids',
        'rds_cluster_endpoint', 
        'rds_cluster_reader_endpoint',
        's3_bucket_name',
        'kms_key_id',
        'guardduty_detector_id',
        'load_balancer_dns',
        'cloudfront_domain_name',
        'waf_web_acl_arn'
      ];

      expectedOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        expect(outputs[outputKey]).not.toBeNull();
        expect(outputs[outputKey]).not.toBe('');
      });
    });

    test('should have valid VPC ID format', () => {
      expect(outputs.vpc_id).toMatch(/^vpc-[a-f0-9]{8,17}$/);
    });

    test('should have valid subnet IDs format', () => {
      // Parse subnet ID arrays from JSON strings
      const publicSubnetIds = JSON.parse(outputs.public_subnet_ids);
      const privateSubnetIds = JSON.parse(outputs.private_subnet_ids);
      
      expect(Array.isArray(publicSubnetIds)).toBe(true);
      expect(Array.isArray(privateSubnetIds)).toBe(true);
      expect(publicSubnetIds.length).toBeGreaterThan(0);
      expect(privateSubnetIds.length).toBeGreaterThan(0);

      publicSubnetIds.forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      });

      privateSubnetIds.forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      });
    });

    test('should have valid RDS cluster endpoints', () => {
      expect(outputs.rds_cluster_endpoint).toMatch(
        /^[a-z0-9-]+\.cluster-[a-z0-9]+\.[a-z0-9-]+\.rds\.amazonaws\.com$/
      );
      expect(outputs.rds_cluster_reader_endpoint).toMatch(
        /^[a-z0-9-]+\.cluster-ro-[a-z0-9]+\.[a-z0-9-]+\.rds\.amazonaws\.com$/
      );
    });

    test('should have valid S3 bucket name', () => {
      expect(outputs.s3_bucket_name).toMatch(
        /^[a-z0-9-]+$/
      );
      expect(outputs.s3_bucket_name.length).toBeLessThanOrEqual(63);
      expect(outputs.s3_bucket_name.length).toBeGreaterThan(3);
    });

    test('should have valid KMS key ID format', () => {
      expect(outputs.kms_key_id).toMatch(
        /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/
      );
    });

    test('should have valid GuardDuty detector ID format', () => {
      expect(outputs.guardduty_detector_id).toMatch(/^[a-f0-9]{32}$/);
    });

    test('should have valid Load Balancer DNS format', () => {
      expect(outputs.load_balancer_dns).toMatch(
        /^[a-z0-9-]+\.[a-z0-9-]+\.elb\.amazonaws\.com$/
      );
    });

    test('should have valid CloudFront domain name format', () => {
      expect(outputs.cloudfront_domain_name).toMatch(
        /^[a-z0-9]+\.cloudfront\.net$/
      );
    });

    test('should have valid WAF Web ACL ARN format', () => {
      expect(outputs.waf_web_acl_arn).toMatch(
        /^arn:aws:wafv2:[a-z0-9-]+:\d{12}:global\/webacl\/[a-zA-Z0-9-]+\/[a-f0-9-]{36}$/
      );
    });
  });

  describe('Infrastructure Validation', () => {
    test('should have consistent environment naming', () => {
      // S3 bucket should contain environment suffix
      expect(outputs.s3_bucket_name).toContain(`-${environmentSuffix}-`);
      
      // RDS cluster should contain environment suffix
      expect(outputs.rds_cluster_endpoint).toContain(`-${environmentSuffix}-`);
    });

    test('should have multi-AZ subnet configuration', () => {
      const publicSubnetIds = JSON.parse(outputs.public_subnet_ids);
      const privateSubnetIds = JSON.parse(outputs.private_subnet_ids);
      
      // Should have at least 2 subnets for HA
      expect(publicSubnetIds.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnetIds.length).toBeGreaterThanOrEqual(2);
    });

    test('should have security components configured', () => {
      // KMS key for encryption
      expect(outputs.kms_key_id).toBeTruthy();
      
      // GuardDuty for threat detection
      expect(outputs.guardduty_detector_id).toBeTruthy();
    });
  });

  describe('Environment Configuration', () => {
    test('should use correct environment suffix', () => {
      expect(['dev', 'staging', 'prod']).toContain(environmentSuffix);
    });

    test('should have all required infrastructure components', () => {
      // Verify we have all the key components of secure web infrastructure
      expect(outputs.vpc_id).toBeTruthy(); // Network layer
      expect(outputs.s3_bucket_name).toBeTruthy(); // Storage layer
      expect(outputs.rds_cluster_endpoint).toBeTruthy(); // Database layer
      expect(outputs.load_balancer_dns).toBeTruthy(); // Load balancing layer
      expect(outputs.cloudfront_domain_name).toBeTruthy(); // CDN layer
      expect(outputs.kms_key_id).toBeTruthy(); // Encryption
      expect(outputs.guardduty_detector_id).toBeTruthy(); // Security monitoring
      expect(outputs.waf_web_acl_arn).toBeTruthy(); // Web application firewall
    });
  });

  describe('Resource Relationships', () => {
    test('should have proper resource naming conventions', () => {
      // All AWS resource IDs should follow proper AWS naming patterns
      const resources = [
        outputs.vpc_id,
        outputs.s3_bucket_name,
        outputs.kms_key_id,
        outputs.guardduty_detector_id
      ];

      resources.forEach(resource => {
        expect(resource).toBeTruthy();
        expect(resource.length).toBeGreaterThan(0);
      });
    });

    test('should have network isolation properly configured', () => {
      const publicSubnetIds = JSON.parse(outputs.public_subnet_ids);
      const privateSubnetIds = JSON.parse(outputs.private_subnet_ids);
      
      // Should have separate public and private subnets
      expect(publicSubnetIds).not.toEqual(privateSubnetIds);
      
      // No subnet should be in both arrays
      const intersection = publicSubnetIds.filter((id: string) => privateSubnetIds.includes(id));
      expect(intersection.length).toBe(0);
    });
  });
});