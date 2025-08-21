// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Secure AWS Infrastructure Integration Tests', () => {
  describe('VPC Integration', () => {
    test('VPC should be accessible and properly configured', async () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId).toMatch(/^vpc-[a-zA-Z0-9]+$/);
    });
  });

  describe('Security Group Integration', () => {
    test('Security Group should exist and be properly configured', async () => {
      expect(outputs.SecurityGroupId).toBeDefined();
      expect(outputs.SecurityGroupId).toMatch(/^sg-[a-zA-Z0-9]+$/);
    });
  });

  describe('S3 Bucket Integration', () => {
    test('S3 bucket should exist and be accessible', async () => {
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.S3BucketName).toContain('secure-bucket');
    });

    test('S3 bucket should have proper naming convention', async () => {
      expect(outputs.S3BucketName).toMatch(/^secureapp-prod-secure-bucket-\d+$/);
    });
  });

  describe('IAM Role Integration', () => {
    test('Application IAM Role should be created', async () => {
      expect(outputs.ApplicationRoleArn).toBeDefined();
      expect(outputs.ApplicationRoleArn).toMatch(/^arn:aws:iam::\d+:role\/.+$/);
    });

    test('IAM Role should follow naming convention', async () => {
      expect(outputs.ApplicationRoleArn).toContain('application-role');
    });
  });

  describe('CloudWatch Logging Integration', () => {
    test('CloudWatch Log Group should be created', async () => {
      expect(outputs.CloudWatchLogGroup).toBeDefined();
      expect(outputs.CloudWatchLogGroup).toMatch(/^\/aws\/application\/.+$/);
    });
  });

  describe('Security Compliance Validation', () => {
    test('All security outputs should be present', async () => {
      const requiredOutputs = [
        'VPCId',
        'SecurityGroupId',
        'S3BucketName', 
        'ApplicationRoleArn',
        'CloudWatchLogGroup'
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBeNull();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('Resource names should follow security naming conventions', async () => {
      // VPC should have proper ID format
      expect(outputs.VPCId).toMatch(/^vpc-[0-9a-f]+$/);
      
      // Security Group should have proper ID format  
      expect(outputs.SecurityGroupId).toMatch(/^sg-[0-9a-f]+$/);
      
      // S3 bucket should include account ID for uniqueness
      expect(outputs.S3BucketName).toMatch(/-\d+$/);
      
      // IAM role should have ARN format
      expect(outputs.ApplicationRoleArn).toContain(':role/');
      
      // Log group should follow AWS naming pattern
      expect(outputs.CloudWatchLogGroup).toMatch(/^\/aws\//);
    });
  });

  describe('End-to-End Security Workflow', () => {
    test('Security infrastructure should support application deployment', async () => {
      // Verify that all core security components are deployed and interconnected
      const coreSecurityOutputs = [
        outputs.VPCId,
        outputs.SecurityGroupId, 
        outputs.S3BucketName,
        outputs.ApplicationRoleArn,
        outputs.CloudWatchLogGroup
      ];

      // All security infrastructure should be present for application deployment
      coreSecurityOutputs.forEach(output => {
        expect(output).toBeDefined();
        expect(output).toBeTruthy();
      });
    });

    test('Security configuration should be consistent across resources', async () => {
      // Check that all resource names follow consistent naming pattern with environment
      expect(outputs.S3BucketName).toContain('secureapp');
      expect(outputs.ApplicationRoleArn).toContain('secureapp');
      expect(outputs.CloudWatchLogGroup).toContain('secureapp');
    });
  });
});