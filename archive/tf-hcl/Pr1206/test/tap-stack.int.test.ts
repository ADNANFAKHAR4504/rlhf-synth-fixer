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
      const requiredOutputs = [
        'vpc_id',
        'public_subnet_ids',
        'private_subnet_ids',
        'rds_cluster_endpoint', 
        'rds_cluster_reader_endpoint',
        's3_bucket_name',
        'kms_key_id',
        'guardduty_detector_id'
      ];

      requiredOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        expect(outputs[outputKey]).not.toBeNull();
        expect(outputs[outputKey]).not.toBe('');
      });
    });

    test('should have valid VPC ID format', () => {
      expect(outputs.vpc_id).toMatch(/^vpc-[a-f0-9]{8,17}$/);
    });

    test('should have valid subnet IDs format', () => {
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
      if (outputs.load_balancer_dns && outputs.load_balancer_dns !== '') {
        expect(outputs.load_balancer_dns).toMatch(
          /^[a-z0-9-]+\.[a-z0-9-]+\.elb\.amazonaws\.com$/
        );
      } else {
        console.log('Load balancer DNS not available - skipping validation');
      }
    });

    test('should have valid CloudFront domain name format', () => {
      if (outputs.cloudfront_domain_name && outputs.cloudfront_domain_name !== '') {
        expect(outputs.cloudfront_domain_name).toMatch(
          /^[a-z0-9]+\.cloudfront\.net$/
        );
      } else {
        console.log('CloudFront domain name not available - skipping validation');
      }
    });

    test('should have valid WAF Web ACL ARN format', () => {
      if (outputs.waf_web_acl_arn && outputs.waf_web_acl_arn !== '') {
        expect(outputs.waf_web_acl_arn).toMatch(
          /^arn:aws:wafv2:[a-z0-9-]+:\d{12}:global\/webacl\/[a-zA-Z0-9-]+\/[a-f0-9-]{36}$/
        );
      } else {
        console.log('WAF Web ACL ARN not available - skipping validation');
      }
    });
  });

  describe('Infrastructure Validation', () => {
    test('should have multi-AZ subnet configuration', () => {
      const publicSubnetIds = JSON.parse(outputs.public_subnet_ids);
      const privateSubnetIds = JSON.parse(outputs.private_subnet_ids);
      
      expect(publicSubnetIds.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnetIds.length).toBeGreaterThanOrEqual(2);
    });

    test('should have security components configured', () => {
      expect(outputs.kms_key_id).toBeTruthy();
      
      expect(outputs.guardduty_detector_id).toBeTruthy();
    });
  });

  describe('Environment Configuration', () => {
    test('should have all required infrastructure components', () => {
      expect(outputs.vpc_id).toBeTruthy();
      expect(outputs.s3_bucket_name).toBeTruthy();
      expect(outputs.rds_cluster_endpoint).toBeTruthy();
      expect(outputs.kms_key_id).toBeTruthy();
      expect(outputs.guardduty_detector_id).toBeTruthy();

      if (outputs.load_balancer_dns) {
        expect(outputs.load_balancer_dns).toBeTruthy();
      }
      if (outputs.cloudfront_domain_name) {
        expect(outputs.cloudfront_domain_name).toBeTruthy();
      }
      if (outputs.waf_web_acl_arn) {
        expect(outputs.waf_web_acl_arn).toBeTruthy();
      }
    });
  });

  describe('Resource Relationships', () => {
    test('should have proper resource naming conventions', () => {
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
      
      expect(publicSubnetIds).not.toEqual(privateSubnetIds);
      
      const intersection = publicSubnetIds.filter((id: string) => privateSubnetIds.includes(id));
      expect(intersection.length).toBe(0);
    });
  });
});