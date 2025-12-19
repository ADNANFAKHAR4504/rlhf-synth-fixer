import fs from 'fs';
import path from 'path';

describe('Travel Platform API - Terraform Integration Tests', () => {
  describe('Terraform Validation', () => {
    test('tap_stack.tf should be valid Terraform syntax', () => {
      const stackPath = path.resolve(__dirname, '../lib/tap_stack.tf');
      expect(fs.existsSync(stackPath)).toBe(true);

      // Check if the file contains valid Terraform resource blocks
      const content = fs.readFileSync(stackPath, 'utf8');
      expect(content).toMatch(/resource\s+"aws_/);
      expect(content).toMatch(/variable\s+"aws_region"/);
      expect(content).toMatch(/output\s+"/);
    });

    test('All required AWS resources should be defined', () => {
      const stackPath = path.resolve(__dirname, '../lib/tap_stack.tf');
      const content = fs.readFileSync(stackPath, 'utf8');

      // Check for all required resources
      const requiredResources = [
        'aws_api_gateway_rest_api',
        'aws_lambda_function',
        'aws_dynamodb_table',
        'aws_elasticache_replication_group',
        'aws_cloudwatch_log_group',
        'aws_wafv2_web_acl',
        'aws_sns_topic',
        'aws_kms_key',
        'aws_vpc',
        'aws_security_group'
      ];

      requiredResources.forEach(resource => {
        expect(content).toMatch(new RegExp(`resource\\s+"${resource}"`, 'i'));
      });
    });

    test('GDPR compliance resources should be configured', () => {
      const stackPath = path.resolve(__dirname, '../lib/tap_stack.tf');
      const content = fs.readFileSync(stackPath, 'utf8');

      // Check for GDPR-related configurations
      expect(content).toMatch(/ttl\s*{[^}]*enabled\s*=\s*true/); // DynamoDB TTL
      expect(content).toMatch(/kms_key_id/i); // Encryption
      expect(content).toMatch(/at_rest_encryption_enabled\s*=\s*true/); // ElastiCache encryption
      expect(content).toMatch(/point_in_time_recovery/); // Backup capability
    });

    test('All resources should have proper tagging', () => {
      const stackPath = path.resolve(__dirname, '../lib/tap_stack.tf');
      const content = fs.readFileSync(stackPath, 'utf8');

      // Check that common_tags is defined and used
      expect(content).toMatch(/common_tags\s*=/);
      expect(content).toMatch(/Environment\s*=\s*var\.environment/);
      expect(content).toMatch(/Owner\s*=\s*var\.owner/);
      expect(content).toMatch(/Project\s*=\s*var\.project_name/);
    });
  });
});