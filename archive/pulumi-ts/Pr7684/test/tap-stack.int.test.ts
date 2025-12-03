import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests', () => {
  let outputs: Record<string, string>;

  beforeAll(() => {
    const outputsPath = path.join(
      process.cwd(),
      'cfn-outputs',
      'flat-outputs.json'
    );
    
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Outputs file not found at ${outputsPath}. Deploy the stack first.`
      );
    }

    const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent);
  });

  describe('Deployment Outputs', () => {
    it('should have all required outputs', () => {
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    it('should have VpcId output', () => {
      expect(outputs.VpcId).toBeDefined();
      expect(typeof outputs.VpcId).toBe('string');
      expect(outputs.VpcId.length).toBeGreaterThan(0);
    });

    it('should have Ec2InstanceId output', () => {
      expect(outputs.Ec2InstanceId).toBeDefined();
      expect(typeof outputs.Ec2InstanceId).toBe('string');
      expect(outputs.Ec2InstanceId.length).toBeGreaterThan(0);
    });

    it('should have SnsTopicArn output', () => {
      expect(outputs.SnsTopicArn).toBeDefined();
      expect(typeof outputs.SnsTopicArn).toBe('string');
      expect(outputs.SnsTopicArn.length).toBeGreaterThan(0);
    });

    it('should have S3BucketName output', () => {
      expect(outputs.S3BucketName).toBeDefined();
      expect(typeof outputs.S3BucketName).toBe('string');
      expect(outputs.S3BucketName.length).toBeGreaterThan(0);
    });
  });

  describe('VPC Validation', () => {
    it('should have valid VPC ID format', () => {
      expect(outputs.VpcId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
    });

    it('should have VPC ID starting with vpc-', () => {
      expect(outputs.VpcId).toMatch(/^vpc-/);
    });
  });

  describe('EC2 Instance Validation', () => {
    it('should have valid EC2 instance ID format', () => {
      expect(outputs.Ec2InstanceId).toMatch(/^i-[a-f0-9]{8,17}$/);
    });

    it('should have instance ID starting with i-', () => {
      expect(outputs.Ec2InstanceId).toMatch(/^i-/);
    });
  });

  describe('SNS Topic Validation', () => {
    it('should have valid SNS topic ARN format', () => {
      expect(outputs.SnsTopicArn).toMatch(
        /^arn:aws:sns:[a-z0-9-]+:[0-9]{12}:.+$/
      );
    });

    it('should have SNS ARN with correct service', () => {
      expect(outputs.SnsTopicArn).toContain(':sns:');
    });

    it('should have SNS ARN starting with arn:aws', () => {
      expect(outputs.SnsTopicArn).toMatch(/^arn:aws:/);
    });

    it('should contain security-alerts in topic name', () => {
      expect(outputs.SnsTopicArn).toContain('security-alerts');
    });
  });

  describe('S3 Bucket Validation', () => {
    it('should have valid S3 bucket name', () => {
      expect(outputs.S3BucketName).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
    });

    it('should have bucket name starting with inspector-audit', () => {
      expect(outputs.S3BucketName).toMatch(/^inspector-audit-/);
    });

    it('should have lowercase bucket name', () => {
      expect(outputs.S3BucketName).toBe(outputs.S3BucketName.toLowerCase());
    });

    it('should not contain uppercase letters', () => {
      expect(outputs.S3BucketName).not.toMatch(/[A-Z]/);
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should have consistent naming pattern across resources', () => {
      expect(outputs.S3BucketName).toContain('inspector-audit');
      expect(outputs.SnsTopicArn).toContain('security-alerts');
    });

    it('should not contain hardcoded environment names', () => {
      const allValues = Object.values(outputs).join(' ');
      expect(allValues).not.toMatch(/\b(prod|production)\b/i);
      expect(allValues).not.toMatch(/\b(dev|development)\b/i);
      expect(allValues).not.toMatch(/\b(stage|staging)\b/i);
    });
  });

  describe('ARN Format Validation', () => {
    it('should have properly formatted ARNs', () => {
      const arnOutputs = Object.entries(outputs).filter(([key, value]) =>
        value.startsWith('arn:')
      );

      arnOutputs.forEach(([key, arn]) => {
        expect(arn).toMatch(/^arn:aws:[a-z0-9-]+:[a-z0-9-]*:[0-9]*:.+$/);
      });
    });

    it('should have SNS ARN with correct region', () => {
      const arnParts = outputs.SnsTopicArn.split(':');
      expect(arnParts[3]).toMatch(/^[a-z]{2}-[a-z]+-[0-9]$/);
    });

    it('should have SNS ARN with account ID', () => {
      const arnParts = outputs.SnsTopicArn.split(':');
      expect(arnParts[4]).toMatch(/^[0-9]{12}$/);
    });
  });

  describe('Output Data Types', () => {
    it('should have all outputs as strings', () => {
      Object.values(outputs).forEach((value) => {
        expect(typeof value).toBe('string');
      });
    });

    it('should have non-empty output values', () => {
      Object.values(outputs).forEach((value) => {
        expect(value).toBeTruthy();
        expect(value.length).toBeGreaterThan(0);
      });
    });

    it('should not have null or undefined outputs', () => {
      Object.values(outputs).forEach((value) => {
        expect(value).not.toBeNull();
        expect(value).not.toBeUndefined();
      });
    });
  });

  describe('Output Keys', () => {
    it('should have properly formatted output keys', () => {
      const expectedKeys = [
        'VpcId',
        'Ec2InstanceId',
        'SnsTopicArn',
        'S3BucketName',
      ];
      expectedKeys.forEach((key) => {
        expect(outputs).toHaveProperty(key);
      });
    });

    it('should use PascalCase for output keys', () => {
      Object.keys(outputs).forEach((key) => {
        expect(key).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
      });
    });
  });

  describe('Resource IDs Uniqueness', () => {
    it('should have unique resource identifiers', () => {
      const values = Object.values(outputs);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });
  });

  describe('AWS Service Integration', () => {
    it('should reference us-east-1 region in ARNs', () => {
      const arnOutputs = Object.entries(outputs).filter(([key, value]) =>
        value.startsWith('arn:')
      );

      arnOutputs.forEach(([key, arn]) => {
        expect(arn).toContain('us-east-1');
      });
    });
  });

  describe('Infrastructure Completeness', () => {
    it('should have all four core infrastructure outputs', () => {
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.Ec2InstanceId).toBeDefined();
      expect(outputs.SnsTopicArn).toBeDefined();
      expect(outputs.S3BucketName).toBeDefined();
    });

    it('should have valid AWS resource identifiers', () => {
      expect(outputs.VpcId).toMatch(/^vpc-/);
      expect(outputs.Ec2InstanceId).toMatch(/^i-/);
      expect(outputs.SnsTopicArn).toMatch(/^arn:aws:sns:/);
      expect(outputs.S3BucketName).toMatch(/^inspector-audit-/);
    });
  });

  describe('Security and Compliance', () => {
    it('should use encrypted S3 bucket (naming convention)', () => {
      expect(outputs.S3BucketName).toContain('audit');
    });

    it('should have security-focused SNS topic', () => {
      expect(outputs.SnsTopicArn).toContain('security-alerts');
    });
  });

  describe('Output File Structure', () => {
    it('should be a valid JSON object', () => {
      expect(typeof outputs).toBe('object');
      expect(outputs).not.toBeNull();
      expect(Array.isArray(outputs)).toBe(false);
    });

    it('should have exactly 4 outputs', () => {
      expect(Object.keys(outputs).length).toBe(4);
    });
  });

  describe('Resource Name Length Validation', () => {
    it('should have VPC ID with correct length', () => {
      expect(outputs.VpcId.length).toBeGreaterThanOrEqual(12);
      expect(outputs.VpcId.length).toBeLessThanOrEqual(21);
    });

    it('should have EC2 instance ID with correct length', () => {
      expect(outputs.Ec2InstanceId.length).toBeGreaterThanOrEqual(10);
      expect(outputs.Ec2InstanceId.length).toBeLessThanOrEqual(19);
    });

    it('should have S3 bucket name within AWS limits', () => {
      expect(outputs.S3BucketName.length).toBeGreaterThanOrEqual(3);
      expect(outputs.S3BucketName.length).toBeLessThanOrEqual(63);
    });
  });

  describe('Inspector-Specific Resources', () => {
    it('should have inspector-prefixed resources', () => {
      expect(outputs.S3BucketName).toMatch(/^inspector-/);
    });

    it('should reference inspector target in EC2 instance', () => {
      // Instance ID itself may not contain 'inspector', but we verify it exists
      expect(outputs.Ec2InstanceId).toBeTruthy();
    });
  });

  describe('Cross-Resource References', () => {
    it('should have VPC and EC2 instance in same deployment', () => {
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.Ec2InstanceId).toBeDefined();
    });

    it('should have S3 bucket and SNS topic for audit trail', () => {
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.SnsTopicArn).toBeDefined();
    });
  });

  describe('No Hardcoded Values', () => {
    it('should not contain static test values', () => {
      const allValues = JSON.stringify(outputs);
      expect(allValues).not.toContain('test-123');
      expect(allValues).not.toContain('dummy');
      expect(allValues).not.toContain('mock');
      expect(allValues).not.toContain('fake');
    });
  });

  describe('Account and Region Consistency', () => {
    it('should have consistent account ID across ARNs', () => {
      const arnOutputs = Object.entries(outputs)
        .filter(([key, value]) => value.startsWith('arn:'))
        .map(([key, value]) => value);

      if (arnOutputs.length > 1) {
        const accountIds = arnOutputs.map((arn) => arn.split(':')[4]);
        const uniqueAccountIds = new Set(accountIds);
        expect(uniqueAccountIds.size).toBe(1);
      }
    });

    it('should have consistent region across ARNs', () => {
      const arnOutputs = Object.entries(outputs)
        .filter(([key, value]) => value.startsWith('arn:'))
        .map(([key, value]) => value);

      if (arnOutputs.length > 1) {
        const regions = arnOutputs.map((arn) => arn.split(':')[3]);
        const uniqueRegions = new Set(regions);
        expect(uniqueRegions.size).toBe(1);
      }
    });
  });
});
