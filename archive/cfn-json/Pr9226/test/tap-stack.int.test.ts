// Integration tests for CloudFormation WAF Security Infrastructure
// These tests validate the deployment outputs and structure
import fs from 'fs';

// Load outputs from deployed stack
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('WAF Security Infrastructure Integration Tests', () => {
  describe('Deployment Outputs Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs.WebACLArn).toBeDefined();
      expect(outputs.WebACLId).toBeDefined();
      expect(outputs.WAFLogsBucketName).toBeDefined();
      expect(outputs.WAFLogsBucketArn).toBeDefined();
      expect(outputs.OfficeIPSetArn).toBeDefined();
    });

    test('WebACLArn should be valid ARN format', () => {
      expect(outputs.WebACLArn).toMatch(/^arn:aws:wafv2:/);
      expect(outputs.WebACLArn).toContain('regional/webacl');
    });

    test('WAFLogsBucketName should follow naming convention', () => {
      expect(outputs.WAFLogsBucketName).toContain('aws-waf-logs');
      expect(outputs.WAFLogsBucketName).toContain(environmentSuffix);
    });

    test('OfficeIPSetArn should be valid ARN format', () => {
      expect(outputs.OfficeIPSetArn).toMatch(/^arn:aws:wafv2:/);
      expect(outputs.OfficeIPSetArn).toContain('regional/ipset');
    });
  });

  describe('Resource Naming Conventions', () => {
    test('all outputs should use correct naming patterns', () => {
      // Web ACL should include environment suffix in ARN
      expect(outputs.WebACLArn).toContain(environmentSuffix);

      // S3 bucket should include environment suffix
      expect(outputs.WAFLogsBucketName).toContain(environmentSuffix);

      // IP Set should include environment suffix in ARN
      expect(outputs.OfficeIPSetArn).toContain(environmentSuffix);
    });

    test('S3 bucket name should include account ID for global uniqueness', () => {
      // Bucket name format: aws-waf-logs-{suffix}-{accountId}
      const bucketName = outputs.WAFLogsBucketName;
      const parts = bucketName.split('-');

      // Should have at least 5 parts: aws, waf, logs, suffix, accountId
      expect(parts.length).toBeGreaterThanOrEqual(5);

      // Last part should be numeric (account ID)
      const lastPart = parts[parts.length - 1];
      expect(lastPart).toMatch(/^\d{12}$/);
    });
  });

  describe('Security Best Practices', () => {
    test('WAF Web ACL should be regional scope', () => {
      // Regional Web ACLs have 'regional' in their ARN
      expect(outputs.WebACLArn).toContain('regional');
    });

    test('S3 bucket ARN should be valid', () => {
      expect(outputs.WAFLogsBucketArn).toMatch(/^arn:aws:s3:::/);
      expect(outputs.WAFLogsBucketArn).toBe(`arn:aws:s3:::${outputs.WAFLogsBucketName}`);
    });
  });

  describe('End-to-End Validation', () => {
    test('all critical security components should be deployed', () => {
      // Verify all 5 key outputs exist and are non-empty
      expect(outputs.WebACLArn).toBeTruthy();
      expect(outputs.WebACLId).toBeTruthy();
      expect(outputs.WAFLogsBucketName).toBeTruthy();
      expect(outputs.WAFLogsBucketArn).toBeTruthy();
      expect(outputs.OfficeIPSetArn).toBeTruthy();

      // Verify they contain expected patterns
      expect(outputs.WebACLArn).toContain('wafv2');
      expect(outputs.WebACLArn).toContain('webacl');
      expect(outputs.WAFLogsBucketName).toContain('aws-waf-logs');
      expect(outputs.WAFLogsBucketArn).toContain('s3');
      expect(outputs.OfficeIPSetArn).toContain('ipset');
    });
  });
});
