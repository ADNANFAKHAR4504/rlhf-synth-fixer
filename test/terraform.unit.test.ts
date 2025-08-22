// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for Terraform configuration
// Tests syntax, structure, security compliance, and best practices
// No Terraform commands are executed.

import fs from 'fs';
import path from 'path';

const STACK_REL = '../lib/tap_stack.tf';
const PROVIDER_REL = '../lib/provider.tf';
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe('Terraform Infrastructure Unit Tests', () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    // Ensure files exist before running tests
    expect(fs.existsSync(stackPath)).toBe(true);
    expect(fs.existsSync(providerPath)).toBe(true);

    stackContent = fs.readFileSync(stackPath, 'utf8');
    providerContent = fs.readFileSync(providerPath, 'utf8');
  });

  describe('File Structure and Existence', () => {
    test('tap_stack.tf exists', () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test('provider.tf exists', () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test('modules directory exists', () => {
      const modulesPath = path.resolve(__dirname, '../lib/modules');
      expect(fs.existsSync(modulesPath)).toBe(true);
    });
  });

  describe('Provider Configuration Compliance', () => {
    test('does NOT declare provider in tap_stack.tf (provider.tf owns providers)', () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test('provider.tf contains AWS provider configuration', () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test('provider.tf uses latest Terraform version (>= 1.4.0)', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
    });

    test('provider.tf uses latest AWS provider version (>= 5.0)', () => {
      expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });

    test('provider.tf includes S3 backend configuration', () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*{/);
    });
  });

  describe('Variable Declarations and Requirements', () => {
    test('declares aws_region variable in tap_stack.tf', () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test('aws_region variable defaults to us-east-1', () => {
      const regionMatch = stackContent.match(
        /variable\s+"aws_region"\s*{[\s\S]*?default\s*=\s*"([^"]+)"/
      );
      expect(regionMatch).toBeTruthy();
      expect(regionMatch![1]).toBe('us-east-1');
    });

    test('declares required tagging variables (environment, owner, purpose)', () => {
      expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
      expect(stackContent).toMatch(/variable\s+"owner"\s*{/);
      expect(stackContent).toMatch(/variable\s+"purpose"\s*{/);
    });

    test('declares VPC configuration variables', () => {
      expect(stackContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
      expect(stackContent).toMatch(/variable\s+"availability_zones"\s*{/);
      expect(stackContent).toMatch(/variable\s+"public_subnet_cidrs"\s*{/);
      expect(stackContent).toMatch(/variable\s+"private_subnet_cidrs"\s*{/);
    });

    test('declares CloudTrail configuration variables', () => {
      expect(stackContent).toMatch(/variable\s+"cloudtrail_bucket_name"\s*{/);
      expect(stackContent).toMatch(/variable\s+"cloudtrail_name"\s*{/);
    });

    test('declares EC2 configuration variables', () => {
      expect(stackContent).toMatch(/variable\s+"ec2_instance_type"\s*{/);
      expect(stackContent).toMatch(/variable\s+"key_pair_name"\s*{/);
    });

    test('declares RDS configuration variables', () => {
      expect(stackContent).toMatch(/variable\s+"db_instance_class"\s*{/);
      expect(stackContent).toMatch(/variable\s+"db_allocated_storage"\s*{/);
      expect(stackContent).toMatch(/variable\s+"db_engine_version"\s*{/);
    });
  });

  describe('Modular Architecture', () => {
    test('uses VPC module', () => {
      expect(stackContent).toMatch(
        /module\s+"vpc"\s*{[\s\S]*?source\s*=\s*"\.\/modules\/vpc"/
      );
    });

    test('uses IAM module', () => {
      expect(stackContent).toMatch(
        /module\s+"iam"\s*{[\s\S]*?source\s*=\s*"\.\/modules\/iam"/
      );
    });

    test('uses S3 module', () => {
      expect(stackContent).toMatch(
        /module\s+"s3"\s*{[\s\S]*?source\s*=\s*"\.\/modules\/s3"/
      );
    });

    test('uses CloudTrail module', () => {
      expect(stackContent).toMatch(
        /module\s+"cloudtrail"\s*{[\s\S]*?source\s*=\s*"\.\/modules\/cloudtrail"/
      );
    });

    test('uses EC2 module', () => {
      expect(stackContent).toMatch(
        /module\s+"ec2"\s*{[\s\S]*?source\s*=\s*"\.\/modules\/ec2"/
      );
    });

    test('uses RDS module', () => {
      expect(stackContent).toMatch(
        /module\s+"rds"\s*{[\s\S]*?source\s*=\s*"\.\/modules\/rds"/
      );
    });
  });

  describe('Security Best Practices', () => {
    test('no hardcoded AWS credentials in stack file', () => {
      expect(stackContent).not.toMatch(/aws_access_key_id/i);
      expect(stackContent).not.toMatch(/aws_secret_access_key/i);
      expect(stackContent).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS Access Key pattern
    });

    test('no hardcoded AWS credentials in provider file', () => {
      expect(providerContent).not.toMatch(/access_key/);
      expect(providerContent).not.toMatch(/secret_key/);
      expect(providerContent).not.toMatch(/AKIA[0-9A-Z]{16}/);
    });

    test('module dependencies are properly defined', () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[\s*module\.s3\s*\]/); // CloudTrail depends on S3
      expect(stackContent).toMatch(
        /depends_on\s*=\s*\[\s*module\.vpc,\s*module\.iam\s*\]/
      ); // EC2 dependencies
      expect(stackContent).toMatch(/depends_on\s*=\s*\[\s*module\.vpc,\s*module\.ec2\s*\]/); // RDS depends on VPC and EC2
    });
  });

  describe('Tagging Compliance', () => {
    test('defines common_tags local with required tags', () => {
      expect(stackContent).toMatch(/locals\s*{[\s\S]*?common_tags\s*=/);

      const localsMatch = stackContent.match(
        /locals\s*{[\s\S]*?common_tags\s*=\s*{[\s\S]*?}/
      );
      expect(localsMatch).toBeTruthy();

      const commonTagsBlock = localsMatch![0];
      expect(commonTagsBlock).toMatch(/Environment\s*=\s*var\.environment/);
      expect(commonTagsBlock).toMatch(/Owner\s*=\s*var\.owner/);
      expect(commonTagsBlock).toMatch(/Purpose\s*=\s*var\.purpose/);
    });

    test('passes common_tags to all modules', () => {
      const moduleBlocks = stackContent.match(/module\s+"[^"]+"\s*{[\s\S]*?}/g);
      expect(moduleBlocks).toBeTruthy();

      moduleBlocks!.forEach(moduleBlock => {
        expect(moduleBlock).toMatch(/common_tags\s*=\s*local\.common_tags/);
      });
    });

    test('provider.tf includes default tags', () => {
      expect(providerContent).toMatch(/default_tags\s*{/);
      expect(providerContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(providerContent).toMatch(/Owner\s*=\s*var\.owner/);
      expect(providerContent).toMatch(/Purpose\s*=\s*var\.purpose/);
      expect(providerContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });
  });

  describe('Resource Configuration', () => {
    test('availability zones use dynamic discovery', () => {
      const azMatch = stackContent.match(
        /variable\s+"availability_zones"\s*{[\s\S]*?default\s*=\s*\[\s*\]/
      );
      expect(azMatch).toBeTruthy();
    });

    test('uses appropriate CIDR blocks for VPC and subnets', () => {
      expect(stackContent).toMatch(/default\s*=\s*"10\.0\.0\.0\/16"/); // VPC CIDR
      expect(stackContent).toMatch(
        /default\s*=\s*\[\s*"10\.0\.1\.0\/24",\s*"10\.0\.2\.0\/24"\s*\]/
      ); // Public subnets
      expect(stackContent).toMatch(
        /default\s*=\s*\[\s*"10\.0\.10\.0\/24",\s*"10\.0\.20\.0\/24"\s*\]/
      ); // Private subnets
    });

    test('uses cost-effective instance types', () => {
      expect(stackContent).toMatch(/default\s*=\s*"t3\.micro"/); // EC2 instance type
      expect(stackContent).toMatch(/default\s*=\s*"db\.t3\.micro"/); // RDS instance class
    });
  });

  describe('Output Configuration', () => {
    test('defines required outputs', () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"/);
      expect(stackContent).toMatch(/output\s+"public_subnet_ids"/);
      expect(stackContent).toMatch(/output\s+"private_subnet_ids"/);
      expect(stackContent).toMatch(/output\s+"ec2_instance_ids"/);
      expect(stackContent).toMatch(/output\s+"rds_endpoint"/);
      expect(stackContent).toMatch(/output\s+"cloudtrail_arn"/);
      expect(stackContent).toMatch(/output\s+"s3_bucket_name"/);
    });

    test('sensitive outputs are marked as sensitive', () => {
      const rdsOutputMatch = stackContent.match(
        /output\s+"rds_endpoint"\s*{[\s\S]*?}/
      );
      expect(rdsOutputMatch).toBeTruthy();
      expect(rdsOutputMatch![0]).toMatch(/sensitive\s*=\s*true/);
    });

    test('outputs have descriptions', () => {
      const outputs = stackContent.match(/output\s+"[^"]+"\s*{[\s\S]*?}/g);
      expect(outputs).toBeTruthy();

      outputs!.forEach(output => {
        expect(output).toMatch(/description\s*=/);
      });
    });
  });

  describe('Code Quality and Best Practices', () => {
    test('no TODO or FIXME comments in production code', () => {
      expect(stackContent).not.toMatch(/TODO|FIXME|XXX/i);
    });

    test('consistent indentation and formatting', () => {
      // Check for consistent use of spaces (no tabs)
      expect(stackContent).not.toMatch(/\t/);

      // Check for consistent block formatting
      const blocks = stackContent.match(
        /(variable|module|output|locals)\s+"[^"]*"\s*{/g
      );
      expect(blocks).toBeTruthy();
      blocks!.forEach(block => {
        expect(block).toMatch(/{\s*$/);
      });
    });

    test('variable types are explicitly defined', () => {
      const variables = stackContent.match(/variable\s+"[^"]+"\s*{[\s\S]*?}/g);
      expect(variables).toBeTruthy();

      variables!.forEach(variable => {
        expect(variable).toMatch(/type\s*=/);
      });
    });

    test('all variables have descriptions', () => {
      const variables = stackContent.match(/variable\s+"[^"]+"\s*{[\s\S]*?}/g);
      expect(variables).toBeTruthy();

      variables!.forEach(variable => {
        expect(variable).toMatch(/description\s*=/);
      });
    });
  });
});
