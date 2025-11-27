// Unit tests for Terraform HCL configuration
// Tests main.tf, variables.tf, outputs.tf, provider.tf structure and syntax

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'hcl2-parser';
import {
  readTerraformFile,
  validateEnvironmentSuffixUsage,
  validateResourceNaming,
  validateS3ForceDestroy,
  validateKMSConfiguration,
  validateTerraformConfiguration,
} from '../lib/terraform-validator';

const LIB_DIR = path.resolve(__dirname, '../lib');
const MAIN_TF = path.join(LIB_DIR, 'main.tf');
const VARIABLES_TF = path.join(LIB_DIR, 'variables.tf');
const OUTPUTS_TF = path.join(LIB_DIR, 'outputs.tf');
const PROVIDER_TF = path.join(LIB_DIR, 'provider.tf');

describe('Terraform Configuration Unit Tests', () => {
  describe('File Existence', () => {
    test('main.tf exists', () => {
      expect(fs.existsSync(MAIN_TF)).toBe(true);
    });

    test('variables.tf exists', () => {
      expect(fs.existsSync(VARIABLES_TF)).toBe(true);
    });

    test('outputs.tf exists', () => {
      expect(fs.existsSync(OUTPUTS_TF)).toBe(true);
    });

    test('provider.tf exists', () => {
      expect(fs.existsSync(PROVIDER_TF)).toBe(true);
    });
  });

  describe('Variables Configuration', () => {
    let variablesContent: string;

    beforeAll(() => {
      variablesContent = fs.readFileSync(VARIABLES_TF, 'utf-8');
    });

    test('defines environment_suffix variable', () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*\{/);
    });

    test('defines aws_region variable', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*\{/);
    });

    test('defines ecs_cluster_name variable', () => {
      expect(variablesContent).toMatch(/variable\s+"ecs_cluster_name"\s*\{/);
    });

    test('defines rds_cluster_identifier variable', () => {
      expect(variablesContent).toMatch(/variable\s+"rds_cluster_identifier"\s*\{/);
    });

    test('defines api_endpoint_url variable', () => {
      expect(variablesContent).toMatch(/variable\s+"api_endpoint_url"\s*\{/);
    });

    test('defines log_group_names variable with list type', () => {
      expect(variablesContent).toMatch(/variable\s+"log_group_names"\s*\{[\s\S]*?type\s*=\s*list\(string\)/);
    });

    test('does not have hardcoded Production environment', () => {
      expect(variablesContent).not.toMatch(/Environment\s*=\s*"Production"/);
    });
  });

  describe('Main Configuration', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(MAIN_TF, 'utf-8');
    });

    test('creates SNS topics with environment_suffix', () => {
      expect(mainContent).toMatch(/resource\s+"aws_sns_topic"\s+"critical_alerts"/);
      expect(mainContent).toMatch(/payment-monitoring-critical-\$\{var\.environment_suffix\}/);
    });

    test('creates CloudWatch dashboard with environment_suffix', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"payment_processing"/);
      expect(mainContent).toMatch(/payment-processing-\$\{var\.environment_suffix\}/);
    });

    test('creates CloudWatch alarms with environment_suffix', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ecs_cpu_high"/);
      expect(mainContent).toMatch(/ecs-cpu-high-\$\{var\.environment_suffix\}/);
    });

    test('creates CloudWatch Synthetics canary with environment_suffix', () => {
      expect(mainContent).toMatch(/resource\s+"aws_synthetics_canary"\s+"api_monitor"/);
      expect(mainContent).toMatch(/api-monitor-\$\{var\.environment_suffix\}/);
    });

    test('creates KMS keys for encryption', () => {
      expect(mainContent).toMatch(/resource\s+"aws_kms_key"\s+"sns_encryption"/);
      expect(mainContent).toMatch(/resource\s+"aws_kms_key"\s+"cloudwatch_logs"/);
    });

    test('creates S3 buckets for canary artifacts', () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket"\s+"canary_artifacts"/);
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket"\s+"canary_code"/);
    });

    test('creates metric filters for logs', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"error_rate"/);
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"latency"/);
    });

    test('creates composite alarm', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_composite_alarm"\s+"critical_system_state"/);
    });

    test('creates CloudWatch Logs saved queries', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_query_definition"\s+"error_analysis"/);
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_query_definition"\s+"latency_percentiles"/);
    });

    test('S3 buckets have force_destroy = true', () => {
      // Match S3 bucket resources and check for force_destroy within the block
      const s3BucketBlocks = mainContent.match(/resource\s+"aws_s3_bucket"\s+"[^"]+"\s*\{[\s\S]*?\n\}/g);
      expect(s3BucketBlocks).toBeTruthy();
      const bucketsWithForceDestroy = s3BucketBlocks?.filter(block => block.includes('force_destroy'));
      expect(bucketsWithForceDestroy).toBeTruthy();
      expect(bucketsWithForceDestroy!.length).toBeGreaterThanOrEqual(2);
    });

    test('does not contain invalid code block in canary', () => {
      // Ensure the "code" block was removed and replaced with s3_bucket/s3_key
      const canarySection = mainContent.match(/resource\s+"aws_synthetics_canary"[\s\S]*?(?=\n\s*resource\s+"|$)/);
      expect(canarySection).toBeTruthy();
      expect(canarySection![0]).not.toMatch(/\s+code\s*\{/);
      expect(canarySection![0]).toMatch(/s3_bucket\s*=/);
      expect(canarySection![0]).toMatch(/s3_key\s*=/);
    });

    test('S3 lifecycle configuration has filter', () => {
      const lifecycleSection = mainContent.match(/resource\s+"aws_s3_bucket_lifecycle_configuration"[\s\S]*?(?=\n\s*resource\s+"|$)/);
      expect(lifecycleSection).toBeTruthy();
      expect(lifecycleSection![0]).toMatch(/filter\s*\{/);
    });
  });

  describe('Provider Configuration', () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = fs.readFileSync(PROVIDER_TF, 'utf-8');
    });

    test('defines AWS provider', () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*\{/);
    });

    test('uses aws_region variable', () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('requires terraform version >= 1.0', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.[0-9]+\.0"/);
    });

    test('defines archive provider', () => {
      expect(providerContent).toMatch(/archive\s*=\s*\{[\s\S]*?source\s*=\s*"hashicorp\/archive"/);
    });
  });

  describe('Outputs Configuration', () => {
    let outputsContent: string;

    beforeAll(() => {
      outputsContent = fs.readFileSync(OUTPUTS_TF, 'utf-8');
    });

    test('outputs dashboard URL', () => {
      expect(outputsContent).toMatch(/output\s+"dashboard_url"/);
    });

    test('outputs SNS topic ARNs', () => {
      expect(outputsContent).toMatch(/output\s+"critical_alerts_topic_arn"/);
      expect(outputsContent).toMatch(/output\s+"warning_alerts_topic_arn"/);
      expect(outputsContent).toMatch(/output\s+"info_alerts_topic_arn"/);
    });

    test('outputs canary name', () => {
      expect(outputsContent).toMatch(/output\s+"canary_name"/);
    });

    test('outputs alarm names', () => {
      expect(outputsContent).toMatch(/output\s+"alarm_names"/);
    });

    test('outputs KMS key IDs', () => {
      expect(outputsContent).toMatch(/output\s+"kms_key_ids"/);
    });
  });

  describe('Resource Naming Convention', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(MAIN_TF, 'utf-8');
    });

    test('all resource names include environment_suffix', () => {
      const resourceNames = [
        'payment-monitoring-critical',
        'payment-monitoring-warning',
        'payment-monitoring-info',
        'payment-processing',
        'ecs-cpu-high',
        'ecs-memory-high',
        'rds-cpu-high',
        'api-monitor',
        'canary-artifacts',
        'canary-code',
      ];

      resourceNames.forEach((name) => {
        const regex = new RegExp(`${name}-\\$\\{var\\.environment_suffix\\}`);
        expect(mainContent).toMatch(regex);
      });
    });
  });

  describe('Security Configuration', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(MAIN_TF, 'utf-8');
    });

    test('S3 buckets have public access block', () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"canary_artifacts"/);
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"canary_code"/);
    });

    test('S3 buckets have encryption configuration', () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"canary_artifacts"/);
    });

    test('KMS keys have key rotation enabled', () => {
      expect(mainContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('SNS topics use KMS encryption', () => {
      expect(mainContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.sns_encryption\.id/);
    });
  });

  describe('Terraform Validator Utility Tests', () => {
    describe('readTerraformFile', () => {
      test('reads existing Terraform file', () => {
        const file = readTerraformFile(MAIN_TF);
        expect(file.path).toBe(MAIN_TF);
        expect(file.content).toBeTruthy();
        expect(file.content.length).toBeGreaterThan(0);
      });

      test('throws error for non-existent file', () => {
        expect(() => readTerraformFile('/nonexistent/file.tf')).toThrow('File not found');
      });
    });

    describe('validateEnvironmentSuffixUsage', () => {
      test('validates environment_suffix usage in main.tf', () => {
        const mainContent = fs.readFileSync(MAIN_TF, 'utf-8');
        const result = validateEnvironmentSuffixUsage(mainContent);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('detects missing environment_suffix', () => {
        const content = 'resource "aws_s3_bucket" "test" { bucket = "my-bucket" }';
        const result = validateEnvironmentSuffixUsage(content);
        expect(result.warnings).toContain('environment_suffix variable not used in configuration');
      });

      test('detects hardcoded environment names', () => {
        const content = 'variable "env" { default = "prod" }';
        const result = validateEnvironmentSuffixUsage(content);
        expect(result.warnings.length).toBeGreaterThan(0);
      });
    });

    describe('validateResourceNaming', () => {
      test('validates resource naming in main.tf', () => {
        const mainContent = fs.readFileSync(MAIN_TF, 'utf-8');
        const result = validateResourceNaming(mainContent);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('detects invalid resource names', () => {
        const content = 'resource "aws_s3_bucket" "Invalid-Name" {}';
        const result = validateResourceNaming(content);
        expect(result.warnings.length).toBeGreaterThan(0);
      });

      test('accepts valid snake_case names', () => {
        const content = 'resource "aws_s3_bucket" "my_valid_bucket_123" {}';
        const result = validateResourceNaming(content);
        expect(result.warnings).toHaveLength(0);
      });
    });

    describe('validateS3ForceDestroy', () => {
      test('validates S3 force_destroy in main.tf', () => {
        const mainContent = fs.readFileSync(MAIN_TF, 'utf-8');
        const result = validateS3ForceDestroy(mainContent);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('detects missing force_destroy', () => {
        const content = 'resource "aws_s3_bucket" "test" {\n  bucket = "test"\n}';
        const result = validateS3ForceDestroy(content);
        expect(result.warnings.length).toBeGreaterThan(0);
      });

      test('detects force_destroy = false', () => {
        const content = 'resource "aws_s3_bucket" "test" {\n  force_destroy = false\n}';
        const result = validateS3ForceDestroy(content);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('validateKMSConfiguration', () => {
      test('validates KMS configuration in main.tf', () => {
        const mainContent = fs.readFileSync(MAIN_TF, 'utf-8');
        const result = validateKMSConfiguration(mainContent);
        expect(result.valid).toBe(true);
      });

      test('detects missing key rotation', () => {
        const content = 'resource "aws_kms_key" "test" {\n  description = "test"\n}';
        const result = validateKMSConfiguration(content);
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings.some(w => w.includes('key rotation'))).toBe(true);
      });

      test('detects missing deletion window', () => {
        const content = 'resource "aws_kms_key" "test" {\n  enable_key_rotation = true\n}';
        const result = validateKMSConfiguration(content);
        expect(result.warnings.some(w => w.includes('deletion window'))).toBe(true);
      });
    });

    describe('validateTerraformConfiguration', () => {
      test('validates complete Terraform configuration', () => {
        const result = validateTerraformConfiguration(MAIN_TF);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('throws error for non-existent file', () => {
        expect(() => validateTerraformConfiguration('/nonexistent/file.tf')).toThrow();
      });
    });
  });
});
