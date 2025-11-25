/**
 * Unit Tests for Terraform Compliance Validation Infrastructure
 * Tests the structure, configuration, and compliance logic of the Terraform templates
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'hcl2-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Terraform Configuration Structure', () => {
  let mainTfContent;
  let variablesTfContent;
  let outputsTfContent;
  let moduleTfContent;

  beforeAll(() => {
    const libPath = join(__dirname, '..', 'lib');

    // Read main Terraform files
    mainTfContent = readFileSync(join(libPath, 'main.tf'), 'utf8');
    variablesTfContent = readFileSync(join(libPath, 'variables.tf'), 'utf8');
    outputsTfContent = readFileSync(join(libPath, 'outputs.tf'), 'utf8');
    moduleTfContent = readFileSync(join(libPath, 'modules', 'compliance-validator', 'main.tf'), 'utf8');
  });

  describe('File Existence', () => {
    test('main.tf should exist', () => {
      const filePath = join(__dirname, '..', 'lib', 'main.tf');
      expect(existsSync(filePath)).toBe(true);
    });

    test('variables.tf should exist', () => {
      const filePath = join(__dirname, '..', 'lib', 'variables.tf');
      expect(existsSync(filePath)).toBe(true);
    });

    test('outputs.tf should exist', () => {
      const filePath = join(__dirname, '..', 'lib', 'outputs.tf');
      expect(existsSync(filePath)).toBe(true);
    });

    test('compliance-validator module should exist', () => {
      const filePath = join(__dirname, '..', 'lib', 'modules', 'compliance-validator', 'main.tf');
      expect(existsSync(filePath)).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    test('should configure AWS provider', () => {
      expect(mainTfContent).toContain('provider "aws"');
    });

    test('should use AWS provider version ~> 5.0', () => {
      expect(mainTfContent).toContain('version = "~> 5.0"');
    });

    test('should require Terraform version >= 1.5.0', () => {
      expect(mainTfContent).toContain('required_version = ">= 1.5.0"');
    });

    test('should configure provider region from variable', () => {
      expect(mainTfContent).toContain('region = var.aws_region');
    });
  });

  describe('Data Sources - EC2', () => {
    test('should query individual EC2 instances using for_each', () => {
      expect(mainTfContent).toContain('data "aws_instance" "instances"');
      expect(mainTfContent).toContain('for_each');
      expect(mainTfContent).toContain('instance_id = each.value');
    });

    test('should discover running and stopped instances', () => {
      expect(mainTfContent).toContain('data "aws_instances" "all_instances"');
      expect(mainTfContent).toContain('instance_state_names = ["running", "stopped"]');
    });

    test('should not use invalid data sources', () => {
      expect(mainTfContent).not.toContain('data "aws_ec2_instances"');
    });
  });

  describe('Data Sources - RDS', () => {
    test('should query RDS instances using for_each', () => {
      expect(mainTfContent).toContain('data "aws_db_instance" "databases"');
      expect(mainTfContent).toContain('for_each');
      expect(mainTfContent).toContain('db_instance_identifier = each.value');
    });

    test('should not use invalid RDS data sources', () => {
      expect(mainTfContent).not.toContain('data "aws_rds_instances"');
    });
  });

  describe('Data Sources - S3', () => {
    test('should query S3 buckets using for_each', () => {
      expect(mainTfContent).toContain('data "aws_s3_bucket" "buckets"');
      expect(mainTfContent).toContain('for_each');
      expect(mainTfContent).toContain('bucket = each.value');
    });

    test('should NOT use invalid S3 data sources', () => {
      // These were the critical bugs in the original implementation
      expect(mainTfContent).not.toContain('data "aws_s3_buckets"');
      expect(mainTfContent).not.toContain('data "aws_s3_bucket_versioning"');
      expect(mainTfContent).not.toContain('data "aws_s3_bucket_server_side_encryption_configuration"');
      expect(mainTfContent).not.toContain('data "aws_s3_bucket_public_access_block"');
    });

    test('should include comment about S3 data source limitations', () => {
      expect(mainTfContent).toContain('AWS provider only provides data "aws_s3_bucket" for basic bucket info');
    });
  });

  describe('Data Sources - VPC and Security Groups', () => {
    test('should query all VPCs', () => {
      expect(mainTfContent).toContain('data "aws_vpcs" "all"');
    });

    test('should query security groups per VPC', () => {
      expect(mainTfContent).toContain('data "aws_security_groups" "all_groups"');
    });

    test('should query default security groups', () => {
      expect(mainTfContent).toContain('data "aws_security_group" "default_groups"');
      expect(mainTfContent).toContain('name     = "default"');
    });

    test('should query instance security groups', () => {
      expect(mainTfContent).toContain('data "aws_security_group" "instance_sgs"');
    });
  });

  describe('Data Sources - IAM', () => {
    test('should query IAM roles using for_each', () => {
      expect(mainTfContent).toContain('data "aws_iam_role" "roles"');
      expect(mainTfContent).toContain('for_each');
      expect(mainTfContent).toContain('name     = each.value');
    });

    test('should analyze IAM role policies', () => {
      expect(mainTfContent).toContain('data "aws_iam_policy_document" "role_policies"');
    });

    test('should NOT use invalid IAM data sources', () => {
      // This was a bug in the original - aws_iam_role_policy_attachment is resource only
      expect(mainTfContent).not.toContain('data "aws_iam_role_policy_attachment"');
    });
  });

  describe('Variables Configuration', () => {
    test('should define environment_suffix variable', () => {
      expect(variablesTfContent).toContain('variable "environment_suffix"');
    });

    test('should define aws_region variable with default', () => {
      expect(variablesTfContent).toContain('variable "aws_region"');
      expect(variablesTfContent).toContain('default     = "us-east-1"');
    });

    test('should define ec2_instance_ids variable', () => {
      expect(variablesTfContent).toContain('variable "ec2_instance_ids"');
      expect(variablesTfContent).toContain('type        = list(string)');
    });

    test('should define approved_ami_ids variable', () => {
      expect(variablesTfContent).toContain('variable "approved_ami_ids"');
    });

    test('should define rds_instance_identifiers variable', () => {
      expect(variablesTfContent).toContain('variable "rds_instance_identifiers"');
    });

    test('should define minimum_backup_retention_days variable', () => {
      expect(variablesTfContent).toContain('variable "minimum_backup_retention_days"');
      expect(variablesTfContent).toContain('default     = 7');
    });

    test('should define s3_bucket_names variable', () => {
      expect(variablesTfContent).toContain('variable "s3_bucket_names"');
    });

    test('should define production_bucket_names variable', () => {
      expect(variablesTfContent).toContain('variable "production_bucket_names"');
    });

    test('should define iam_role_names variable', () => {
      expect(variablesTfContent).toContain('variable "iam_role_names"');
    });

    test('should define required_tags variable', () => {
      expect(variablesTfContent).toContain('variable "required_tags"');
      expect(variablesTfContent).toContain('type        = map(string)');
    });

    test('should define sensitive_ports variable', () => {
      expect(variablesTfContent).toContain('variable "sensitive_ports"');
      expect(variablesTfContent).toContain('type        = list(number)');
    });
  });

  describe('Module Configuration', () => {
    test('should call compliance_validator module', () => {
      expect(mainTfContent).toContain('module "compliance_validator"');
      expect(mainTfContent).toContain('source = "./modules/compliance-validator"');
    });

    test('should pass environment_suffix to module', () => {
      expect(mainTfContent).toContain('environment_suffix    = var.environment_suffix');
    });

    test('should pass ec2_instances data to module', () => {
      expect(mainTfContent).toContain('ec2_instances         = data.aws_instance.instances');
    });

    test('should pass rds_instances data to module', () => {
      expect(mainTfContent).toContain('rds_instances         = data.aws_db_instance.databases');
    });

    test('should pass s3_buckets data to module', () => {
      expect(mainTfContent).toContain('s3_buckets            = data.aws_s3_bucket.buckets');
    });

    test('should pass iam_roles data to module', () => {
      expect(mainTfContent).toContain('iam_roles             = data.aws_iam_role.roles');
    });

    test('should pass security_groups data to module', () => {
      expect(mainTfContent).toContain('security_groups       = data.aws_security_group.instance_sgs');
    });

    test('should pass configuration variables to module', () => {
      expect(mainTfContent).toContain('approved_ami_ids');
      expect(mainTfContent).toContain('minimum_backup_retention_days');
      expect(mainTfContent).toContain('production_bucket_names');
      expect(mainTfContent).toContain('required_tags');
      expect(mainTfContent).toContain('sensitive_ports');
    });
  });

  describe('Outputs Configuration', () => {
    test('should output compliance_report', () => {
      expect(outputsTfContent).toContain('output "compliance_report"');
    });

    test('should output compliance_status', () => {
      expect(outputsTfContent).toContain('output "compliance_status"');
    });

    test('should output critical_findings_count', () => {
      expect(outputsTfContent).toContain('output "critical_findings_count"');
    });

    test('should output high_findings_count', () => {
      expect(outputsTfContent).toContain('output "high_findings_count"');
    });

    test('should output medium_findings_count', () => {
      expect(outputsTfContent).toContain('output "medium_findings_count"');
    });

    test('should output low_findings_count', () => {
      expect(outputsTfContent).toContain('output "low_findings_count"');
    });

    test('should output environment_suffix', () => {
      expect(outputsTfContent).toContain('output "environment_suffix"');
    });
  });

  describe('Compliance Module Logic', () => {
    test('should define EC2 compliance checks', () => {
      expect(moduleTfContent).toContain('ec2_findings = flatten');
    });

    test('should check for approved AMIs', () => {
      expect(moduleTfContent).toContain('Instance uses unapproved AMI');
    });

    test('should check for required tags', () => {
      expect(moduleTfContent).toContain('Missing required tag');
    });

    test('should define RDS compliance checks', () => {
      expect(moduleTfContent).toContain('rds_findings = flatten');
    });

    test('should check RDS backup retention', () => {
      expect(moduleTfContent).toContain('Insufficient backup retention period');
    });

    test('should check RDS encryption', () => {
      expect(moduleTfContent).toContain('Database storage is not encrypted');
    });

    test('should check RDS multi-AZ for production', () => {
      expect(moduleTfContent).toContain('Production database is not multi-AZ');
    });

    test('should define S3 compliance checks', () => {
      expect(moduleTfContent).toContain('s3_findings = flatten');
    });

    test('should define security group compliance checks', () => {
      expect(moduleTfContent).toContain('sg_findings = flatten');
    });

    test('should check for overly permissive security rules', () => {
      expect(moduleTfContent).toContain('Security group has overly permissive rule');
      expect(moduleTfContent).toContain('0.0.0.0/0');
    });

    test('should define IAM compliance checks', () => {
      expect(moduleTfContent).toContain('iam_findings = flatten');
    });

    test('should check for wildcard IAM policies', () => {
      expect(moduleTfContent).toContain('IAM role may have overly permissive policies');
    });
  });

  describe('Compliance Validation Resource', () => {
    test('should create null_resource for compliance validation', () => {
      expect(moduleTfContent).toContain('resource "null_resource" "compliance_check"');
    });

    test('should use lifecycle precondition for critical findings', () => {
      expect(moduleTfContent).toContain('lifecycle');
      expect(moduleTfContent).toContain('precondition');
      expect(moduleTfContent).toContain('length(local.critical_findings) == 0');
    });

    test('should reference environment_suffix in error message', () => {
      expect(moduleTfContent).toContain('Environment: ${var.environment_suffix}');
    });
  });

  describe('Check Blocks (Terraform 1.5+)', () => {
    test('should define EC2 compliance check block', () => {
      expect(moduleTfContent).toContain('check "ec2_compliance"');
    });

    test('should define RDS backup compliance check block', () => {
      expect(moduleTfContent).toContain('check "rds_backup_compliance"');
    });

    test('should define S3 validation check block', () => {
      expect(moduleTfContent).toContain('check "s3_bucket_validation"');
    });

    test('should use assert blocks in checks', () => {
      expect(moduleTfContent).toContain('assert');
      expect(moduleTfContent).toContain('condition');
      expect(moduleTfContent).toContain('error_message');
    });
  });

  describe('Compliance Logic Locals', () => {
    test('should flatten all findings', () => {
      expect(moduleTfContent).toContain('all_findings = compact(flatten');
    });

    test('should categorize findings by severity', () => {
      expect(moduleTfContent).toContain('critical_findings');
      expect(moduleTfContent).toContain('high_findings');
      expect(moduleTfContent).toContain('medium_findings');
      expect(moduleTfContent).toContain('low_findings');
    });

    test('should determine compliance status based on severity', () => {
      expect(moduleTfContent).toContain('compliance_status');
      expect(moduleTfContent).toContain('CRITICAL_ISSUES_FOUND');
      expect(moduleTfContent).toContain('COMPLIANT');
    });
  });

  describe('Read-Only Analysis Validation', () => {
    test('should not create EC2 instances', () => {
      expect(mainTfContent).not.toContain('resource "aws_instance"');
    });

    test('should not create RDS instances', () => {
      expect(mainTfContent).not.toContain('resource "aws_db_instance"');
    });

    test('should not create S3 buckets', () => {
      expect(mainTfContent).not.toContain('resource "aws_s3_bucket"');
    });

    test('should not create VPCs', () => {
      expect(mainTfContent).not.toContain('resource "aws_vpc"');
    });

    test('should not create IAM roles', () => {
      expect(mainTfContent).not.toContain('resource "aws_iam_role"');
    });

    test('should only use data sources for querying', () => {
      const resourceCount = (mainTfContent.match(/resource "/g) || []).length;
      expect(resourceCount).toBe(0); // No resources should be created in main.tf
    });
  });

  describe('Environment Suffix Usage', () => {
    test('should include environment_suffix in metadata output', () => {
      expect(outputsTfContent).toContain('environment_suffix');
    });

    test('should pass environment_suffix to module', () => {
      expect(mainTfContent).toContain('environment_suffix    = var.environment_suffix');
    });
  });
});
