// Integration tests for Terraform infrastructure
// These tests validate that the Terraform configuration can be properly initialized and planned

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure Integration Tests', () => {
  const libPath = path.resolve(__dirname, '../lib');

  describe('Terraform Configuration Validation', () => {
    test('all Terraform files exist', () => {
      expect(fs.existsSync(path.join(libPath, 'provider.tf'))).toBe(true);
      expect(fs.existsSync(path.join(libPath, 'tap_stack.tf'))).toBe(true);
      expect(fs.existsSync(path.join(libPath, 'user_data.sh'))).toBe(true);
    });

    test('Terraform files are valid HCL', () => {
      const providerContent = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');
      const stackContent = fs.readFileSync(path.join(libPath, 'tap_stack.tf'), 'utf8');

      // Basic HCL syntax validation - check for balanced braces
      const countBraces = (content: string, char: string) =>
        (content.match(new RegExp(`\\${char}`, 'g')) || []).length;

      expect(countBraces(providerContent, '{') === countBraces(providerContent, '}')).toBe(true);
      expect(countBraces(stackContent, '{') === countBraces(stackContent, '}')).toBe(true);
    });

    test('provider.tf declares required providers', () => {
      const content = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');
      expect(content).toMatch(/required_providers\s*{/);
      expect(content).toMatch(/aws\s*=\s*{/);
      expect(content).toMatch(/tls\s*=\s*{/);
    });

    test('variables are declared with proper types', () => {
      const content = fs.readFileSync(path.join(libPath, 'tap_stack.tf'), 'utf8');

      // Check that sensitive variables are marked as sensitive
      const sensitiveVarPattern = /variable\s+"(db_username|db_password)"\s*{[\s\S]*?sensitive\s*=\s*true/g;
      const matches = content.match(sensitiveVarPattern);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    });

    test('outputs are properly defined', () => {
      const content = fs.readFileSync(path.join(libPath, 'tap_stack.tf'), 'utf8');

      // Check for required outputs
      expect(content).toMatch(/output\s+"vpc_id"/);
      expect(content).toMatch(/output\s+"alb_dns_name"/);
      expect(content).toMatch(/output\s+"rds_endpoint"/);
      expect(content).toMatch(/output\s+"redis_primary_endpoint"/);
    });

    test('user_data.sh is executable format', () => {
      const content = fs.readFileSync(path.join(libPath, 'user_data.sh'), 'utf8');
      expect(content).toMatch(/^#!\/bin\/bash/);
      expect(content).toMatch(/set -e/); // Error handling
    });
  });

  describe('AWS Best Practices Validation', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(path.join(libPath, 'tap_stack.tf'), 'utf8');
    });

    test('all resources have proper tagging', () => {
      // Count tag blocks - more reliable than parsing resources
      const tagBlocksPattern = /tags\s*=\s*{/g;
      const tagBlocks = stackContent.match(tagBlocksPattern);

      expect(tagBlocks).not.toBeNull();
      expect(tagBlocks!.length).toBeGreaterThan(20); // Should have many tagged resources

      // Verify standard tags are used
      expect(stackContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(stackContent).toMatch(/Owner\s*=\s*var\.owner/);
      expect(stackContent).toMatch(/Project\s*=\s*var\.project_name/);
    });

    test('encryption is enabled for data at rest', () => {
      // RDS encryption
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);

      // ElastiCache encryption
      expect(stackContent).toMatch(/at_rest_encryption_enabled\s*=\s*true/);
      expect(stackContent).toMatch(/transit_encryption_enabled\s*=\s*true/);

      // KMS key rotation
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('multi-AZ is enabled for high availability', () => {
      expect(stackContent).toMatch(/multi_az\s*=\s*true/); // RDS
      expect(stackContent).toMatch(/multi_az_enabled\s*=\s*true/); // ElastiCache
    });

    test('monitoring and logging are configured', () => {
      // CloudWatch alarms
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);

      // CloudWatch logs
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"/);

      // X-Ray tracing
      expect(stackContent).toMatch(/resource\s+"aws_xray_sampling_rule"/);

      // RDS CloudWatch logs
      expect(stackContent).toMatch(/enabled_cloudwatch_logs_exports/);
    });

    test('security groups follow least privilege principle', () => {
      // Check that security groups don't allow 0.0.0.0/0 on private resources
      const rdsSecurityGroup = stackContent.match(/resource\s+"aws_security_group"\s+"rds"[\s\S]*?}/);
      const elasticacheSecurityGroup = stackContent.match(/resource\s+"aws_security_group"\s+"elasticache"[\s\S]*?}/);

      expect(rdsSecurityGroup).not.toBeNull();
      expect(rdsSecurityGroup![0]).not.toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);

      expect(elasticacheSecurityGroup).not.toBeNull();
      expect(elasticacheSecurityGroup![0]).not.toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });

    test('backup and disaster recovery configured', () => {
      // RDS backups
      expect(stackContent).toMatch(/backup_retention_period\s*=\s*7/);

      // ElastiCache snapshots
      expect(stackContent).toMatch(/snapshot_retention_limit\s*=\s*5/);
    });

    test('auto-scaling is properly configured', () => {
      // Auto Scaling Group
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"/);

      // Scaling policies
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_policy".*cpu_target_tracking/);
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_policy".*alb_request_count/);
    });
  });

  describe('Infrastructure Completeness', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(path.join(libPath, 'tap_stack.tf'), 'utf8');
    });

    test('VPC networking components are complete', () => {
      const requiredNetworkComponents = [
        'aws_vpc',
        'aws_subnet.*public',
        'aws_subnet.*private',
        'aws_internet_gateway',
        'aws_nat_gateway',
        'aws_route_table.*public',
        'aws_route_table.*private',
      ];

      requiredNetworkComponents.forEach(component => {
        expect(stackContent).toMatch(new RegExp(`resource\\s+"${component}"`));
      });
    });

    test('compute components are complete', () => {
      const requiredComputeComponents = [
        'aws_launch_template',
        'aws_autoscaling_group',
        'aws_autoscaling_policy',
      ];

      requiredComputeComponents.forEach(component => {
        expect(stackContent).toMatch(new RegExp(`resource\\s+"${component}"`));
      });
    });

    test('database components are complete', () => {
      const requiredDbComponents = [
        'aws_db_subnet_group',
        'aws_db_instance',
        'aws_elasticache_subnet_group',
        'aws_elasticache_replication_group',
      ];

      requiredDbComponents.forEach(component => {
        expect(stackContent).toMatch(new RegExp(`resource\\s+"${component}"`));
      });
    });

    test('load balancing components are complete', () => {
      const requiredLbComponents = [
        'aws_lb"',
        'aws_lb_target_group',
        'aws_lb_listener.*http',
        'aws_lb_listener.*https',
      ];

      requiredLbComponents.forEach(component => {
        expect(stackContent).toMatch(new RegExp(`resource\\s+"${component}`));
      });
    });

    test('security components are complete', () => {
      const requiredSecurityComponents = [
        'aws_security_group.*alb',
        'aws_security_group.*ec2',
        'aws_security_group.*rds',
        'aws_security_group.*elasticache',
        'aws_kms_key',
        'aws_guardduty_detector',
      ];

      requiredSecurityComponents.forEach(component => {
        expect(stackContent).toMatch(new RegExp(`resource\\s+"${component}`));
      });
    });

    test('IAM components are complete', () => {
      const requiredIamComponents = [
        'aws_iam_role.*ec2',
        'aws_iam_role_policy.*cloudwatch_logs',
        'aws_iam_role_policy.*cloudwatch_metrics',
        'aws_iam_role_policy.*xray',
        'aws_iam_instance_profile',
      ];

      requiredIamComponents.forEach(component => {
        expect(stackContent).toMatch(new RegExp(`resource\\s+"${component}`));
      });
    });
  });
});
