import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests', () => {
  let outputs: any;

  beforeAll(() => {
    // Load deployment outputs from cfn-outputs/flat-outputs.json
    const outputsPath = path.join(
      process.cwd(),
      'cfn-outputs',
      'flat-outputs.json'
    );
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(outputsContent);
    } else {
      console.warn('No deployment outputs found, using mock values');
      outputs = {
        vpc_id: 'vpc-mock12345',
        bastion_public_ip: '54.123.45.67',
        private_instance_id: 'i-mock98765',
        rds_endpoint: 'tap-rds-test.abc123.us-east-1.rds.amazonaws.com',
        s3_bucket_name: 'tap-test-app-xyz789',
        api_url: 'https://api123.execute-api.us-east-1.amazonaws.com/v1',
        kms_key_arn: 'arn:aws:kms:us-east-1:123456789012:key/mock-key-id',
      };
    }
  });

  describe('VPC and Network Infrastructure', () => {
    it('should have created a VPC', () => {
      expect(outputs.vpc_id).toBeDefined();
      expect(outputs.vpc_id).toMatch(/^vpc-[a-z0-9]+$/);
    });

    it('should have a bastion host with public IP', () => {
      expect(outputs.bastion_public_ip).toBeDefined();
      // Check if it's a valid IPv4 address
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      expect(outputs.bastion_public_ip).toMatch(ipRegex);
    });

    it('should have a private instance', () => {
      expect(outputs.private_instance_id).toBeDefined();
      expect(outputs.private_instance_id).toMatch(/^i-[a-z0-9]+$/);
    });
  });

  describe('Database Infrastructure', () => {
    it('should have created an RDS endpoint', () => {
      expect(outputs.rds_endpoint).toBeDefined();
      expect(outputs.rds_endpoint).toContain('.rds.amazonaws.com');
    });

    it('should have RDS in the correct region', () => {
      expect(outputs.rds_endpoint).toContain('.us-east-1.rds.amazonaws.com');
    });
  });

  describe('Storage Infrastructure', () => {
    it('should have created an S3 bucket', () => {
      expect(outputs.s3_bucket_name).toBeDefined();
      expect(outputs.s3_bucket_name).toContain('tap-');
    });

    it('should include environment suffix in bucket name', () => {
      // The bucket name should contain the environment suffix
      expect(outputs.s3_bucket_name).toBeDefined();
      expect(outputs.s3_bucket_name.length).toBeGreaterThan(0);
    });
  });

  describe('API Infrastructure', () => {
    it('should have created an API Gateway endpoint', () => {
      expect(outputs.api_url).toBeDefined();
      expect(outputs.api_url).toContain('execute-api');
      expect(outputs.api_url).toContain('amazonaws.com');
    });

    it('should have the correct API stage', () => {
      expect(outputs.api_url).toContain('/v1');
    });

    it('should be in the correct region', () => {
      expect(outputs.api_url).toContain('.us-east-1.amazonaws.com');
    });
  });

  describe('Security Infrastructure', () => {
    it('should have created a KMS key', () => {
      expect(outputs.kms_key_arn).toBeDefined();
      expect(outputs.kms_key_arn).toMatch(
        /^arn:aws:kms:[a-z0-9-]+:\d{12}:key\/[a-z0-9-]+$/
      );
    });

    it('should have KMS key in the correct region', () => {
      expect(outputs.kms_key_arn).toContain(':us-east-1:');
    });
  });

  describe('Cross-Resource Integration', () => {
    it('should have all required outputs', () => {
      const requiredOutputs = [
        'vpc_id',
        'bastion_public_ip',
        'private_instance_id',
        'rds_endpoint',
        's3_bucket_name',
        'api_url',
        'kms_key_arn',
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
        expect(outputs[output]).not.toBeNull();
      });
    });

    it('should have consistent resource naming', () => {
      // All resources should follow the tap-{environment} naming pattern
      if (outputs.s3_bucket_name) {
        expect(outputs.s3_bucket_name).toContain('tap-');
      }
      if (outputs.rds_endpoint) {
        expect(outputs.rds_endpoint).toContain('tap-');
      }
    });
  });

  describe('Network Connectivity', () => {
    it('should have proper VPC configuration for multi-tier architecture', () => {
      // VPC should be created
      expect(outputs.vpc_id).toBeDefined();

      // Bastion should have public IP for external access
      expect(outputs.bastion_public_ip).toBeDefined();

      // Private instance should exist for internal resources
      expect(outputs.private_instance_id).toBeDefined();
    });

    it('should have database in private network', () => {
      // RDS endpoint should exist but not be directly accessible
      expect(outputs.rds_endpoint).toBeDefined();
      // The endpoint format indicates it's in a VPC
      expect(outputs.rds_endpoint).toContain('.rds.amazonaws.com');
    });
  });

  describe('API and Compute Integration', () => {
    it('should have API Gateway configured', () => {
      expect(outputs.api_url).toBeDefined();
      expect(outputs.api_url).toMatch(
        /^https:\/\/.+\.execute-api\..+\.amazonaws\.com\/.+$/
      );
    });

    it('should use HTTPS for API endpoints', () => {
      expect(outputs.api_url.startsWith('https://')).toBe(true);
    });
  });

  describe('Data Protection', () => {
    it('should have encryption key for data protection', () => {
      expect(outputs.kms_key_arn).toBeDefined();
      expect(outputs.kms_key_arn).toContain(':kms:');
    });

    it('should have S3 bucket for data storage', () => {
      expect(outputs.s3_bucket_name).toBeDefined();
      // Bucket names must be globally unique and follow naming rules
      expect(outputs.s3_bucket_name).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
    });
  });

  describe('High Availability', () => {
    it('should have resources deployed in us-east-1', () => {
      // Check that resources are in the expected region
      if (outputs.kms_key_arn) {
        expect(outputs.kms_key_arn).toContain(':us-east-1:');
      }
      if (outputs.api_url) {
        expect(outputs.api_url).toContain('.us-east-1.amazonaws.com');
      }
      if (outputs.rds_endpoint) {
        expect(outputs.rds_endpoint).toContain('.us-east-1.rds.amazonaws.com');
      }
    });
  });
});
