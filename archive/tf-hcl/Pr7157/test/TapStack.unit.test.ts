/**
 * Unit Tests for Terraform Compliance Validation Infrastructure
 * Tests the structure, configuration, and compliance logic of the Terraform templates
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Terraform Configuration Structure', () => {
  let mainTfContent: string;
  let variablesTfContent: string;
  let outputsTfContent: string;
  let moduleTfContent: string;
  const libPath = join(__dirname, '..', 'lib');

  beforeAll(() => {
    // Read main Terraform files
    mainTfContent = readFileSync(join(libPath, 'main.tf'), 'utf8');
    variablesTfContent = readFileSync(join(libPath, 'variables.tf'), 'utf8');
    outputsTfContent = readFileSync(join(libPath, 'outputs.tf'), 'utf8');
    moduleTfContent = readFileSync(join(libPath, 'modules', 'compliance-validator', 'main.tf'), 'utf8');
  });

  describe('File Existence', () => {
    it('main.tf should exist', () => {
      const filePath = join(libPath, 'main.tf');
      expect(existsSync(filePath)).toBe(true);
    });

    it('variables.tf should exist', () => {
      const filePath = join(libPath, 'variables.tf');
      expect(existsSync(filePath)).toBe(true);
    });

    it('outputs.tf should exist', () => {
      const filePath = join(libPath, 'outputs.tf');
      expect(existsSync(filePath)).toBe(true);
    });

    it('compliance-validator module should exist', () => {
      const filePath = join(libPath, 'modules', 'compliance-validator', 'main.tf');
      expect(existsSync(filePath)).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    it('should configure AWS provider', () => {
      expect(mainTfContent).toContain('provider "aws"');
    });

    it('should use AWS provider version ~> 5.0', () => {
      expect(mainTfContent).toContain('version = "~> 5.0"');
    });

    it('should require Terraform version >= 1.5.0', () => {
      expect(mainTfContent).toContain('required_version = ">= 1.5.0"');
    });

    it('should configure provider region from variable', () => {
      expect(mainTfContent).toContain('region = var.aws_region');
    });
  });

  describe('Data Sources - EC2', () => {
    it('should query individual EC2 instances using for_each', () => {
      expect(mainTfContent).toContain('data "aws_instance" "instances"');
      expect(mainTfContent).toContain('for_each');
      expect(mainTfContent).toContain('instance_id = each.value');
    });

    it('should discover running and stopped instances', () => {
      expect(mainTfContent).toContain('data "aws_instances" "all_instances"');
      expect(mainTfContent).toContain('instance_state_names = ["running", "stopped"]');
    });

    it('should not use invalid data sources', () => {
      expect(mainTfContent).not.toContain('data "aws_ec2_instances"');
    });
  });

  describe('Data Sources - RDS', () => {
    it('should query RDS instances using for_each', () => {
      expect(mainTfContent).toContain('data "aws_db_instance" "databases"');
      expect(mainTfContent).toContain('for_each');
      expect(mainTfContent).toContain('db_instance_identifier = each.value');
    });

    it('should not use invalid RDS data sources', () => {
      expect(mainTfContent).not.toContain('data "aws_rds_instances"');
    });
  });

  describe('Data Sources - S3 (CRITICAL FIX)', () => {
    it('should query S3 buckets using for_each', () => {
      expect(mainTfContent).toContain('data "aws_s3_bucket" "buckets"');
      expect(mainTfContent).toContain('for_each');
      expect(mainTfContent).toContain('bucket   = each.value');
    });

    it('should NOT use invalid S3 data sources (FIXED)', () => {
      // These were the critical bugs in the original implementation
      expect(mainTfContent).not.toContain('data "aws_s3_buckets"');
      expect(mainTfContent).not.toContain('data "aws_s3_bucket_versioning"');
      expect(mainTfContent).not.toContain('data "aws_s3_bucket_server_side_encryption_configuration"');
      expect(mainTfContent).not.toContain('data "aws_s3_bucket_public_access_block"');
    });

    it('should include comment about S3 data source limitations', () => {
      expect(mainTfContent).toContain('AWS provider only provides data "aws_s3_bucket" for basic bucket info');
    });
  });

  describe('Data Sources - VPC and Security Groups', () => {
    it('should query all VPCs', () => {
      expect(mainTfContent).toContain('data "aws_vpcs" "all"');
    });

    it('should query security groups per VPC', () => {
      expect(mainTfContent).toContain('data "aws_security_groups" "all_groups"');
    });

    it('should query default security groups', () => {
      expect(mainTfContent).toContain('data "aws_security_group" "default_groups"');
      expect(mainTfContent).toContain('name     = "default"');
    });

    it('should query instance security groups', () => {
      expect(mainTfContent).toContain('data "aws_security_group" "instance_sgs"');
    });
  });

  describe('Data Sources - IAM (CRITICAL FIX)', () => {
    it('should query IAM roles using for_each', () => {
      expect(mainTfContent).toContain('data "aws_iam_role" "roles"');
      expect(mainTfContent).toContain('for_each');
      expect(mainTfContent).toContain('name     = each.value');
    });

    it('should analyze IAM role policies', () => {
      expect(mainTfContent).toContain('data "aws_iam_policy_document" "role_policies"');
    });

    it('should NOT use invalid IAM data sources (FIXED)', () => {
      // This was a bug in the original - aws_iam_role_policy_attachment is resource only
      expect(mainTfContent).not.toContain('data "aws_iam_role_policy_attachment"');
    });
  });

  describe('Variables Configuration', () => {
    it('should define environment_suffix variable', () => {
      expect(variablesTfContent).toContain('variable "environment_suffix"');
    });

    it('should define aws_region variable with default', () => {
      expect(variablesTfContent).toContain('variable "aws_region"');
      expect(variablesTfContent).toContain('default     = "us-east-1"');
    });

    it('should define ec2_instance_ids variable', () => {
      expect(variablesTfContent).toContain('variable "ec2_instance_ids"');
      expect(variablesTfContent).toContain('type        = list(string)');
    });

    it('should define approved_ami_ids variable', () => {
      expect(variablesTfContent).toContain('variable "approved_ami_ids"');
    });

    it('should define rds_instance_identifiers variable', () => {
      expect(variablesTfContent).toContain('variable "rds_instance_identifiers"');
    });

    it('should define minimum_backup_retention_days variable', () => {
      expect(variablesTfContent).toContain('variable "minimum_backup_retention_days"');
      expect(variablesTfContent).toContain('default     = 7');
    });

    it('should define s3_bucket_names variable', () => {
      expect(variablesTfContent).toContain('variable "s3_bucket_names"');
    });

    it('should define production_bucket_names variable', () => {
      expect(variablesTfContent).toContain('variable "production_bucket_names"');
    });

    it('should define iam_role_names variable', () => {
      expect(variablesTfContent).toContain('variable "iam_role_names"');
    });

    it('should define required_tags variable', () => {
      expect(variablesTfContent).toContain('variable "required_tags"');
      expect(variablesTfContent).toContain('type        = map(string)');
    });

    it('should define sensitive_ports variable', () => {
      expect(variablesTfContent).toContain('variable "sensitive_ports"');
      expect(variablesTfContent).toContain('type        = list(number)');
    });
  });

  describe('Module Configuration', () => {
    it('should call compliance_validator module', () => {
      expect(mainTfContent).toContain('module "compliance_validator"');
      expect(mainTfContent).toContain('source = "./modules/compliance-validator"');
    });

    it('should pass environment_suffix to module', () => {
      expect(mainTfContent).toContain('environment_suffix');
    });

    it('should pass ec2_instances data to module', () => {
      expect(mainTfContent).toContain('ec2_instances');
    });

    it('should pass rds_instances data to module', () => {
      expect(mainTfContent).toContain('rds_instances');
    });

    it('should pass s3_buckets data to module', () => {
      expect(mainTfContent).toContain('s3_buckets');
    });

    it('should pass iam_roles data to module', () => {
      expect(mainTfContent).toContain('iam_roles');
    });

    it('should pass security_groups data to module', () => {
      expect(mainTfContent).toContain('security_groups');
    });

    it('should pass configuration variables to module', () => {
      expect(mainTfContent).toContain('approved_ami_ids');
      expect(mainTfContent).toContain('minimum_backup_retention_days');
      expect(mainTfContent).toContain('production_bucket_names');
      expect(mainTfContent).toContain('required_tags');
      expect(mainTfContent).toContain('sensitive_ports');
    });
  });

  describe('Outputs Configuration', () => {
    it('should output compliance_report', () => {
      expect(outputsTfContent).toContain('output "compliance_report"');
    });

    it('should output compliance_status', () => {
      expect(outputsTfContent).toContain('output "compliance_status"');
    });

    it('should output critical_findings_count', () => {
      expect(outputsTfContent).toContain('output "critical_findings_count"');
    });

    it('should output high_findings_count', () => {
      expect(outputsTfContent).toContain('output "high_findings_count"');
    });

    it('should output medium_findings_count', () => {
      expect(outputsTfContent).toContain('output "medium_findings_count"');
    });

    it('should output low_findings_count', () => {
      expect(outputsTfContent).toContain('output "low_findings_count"');
    });

    it('should output environment_suffix', () => {
      expect(outputsTfContent).toContain('output "environment_suffix"');
    });
  });

  describe('Compliance Module Logic', () => {
    it('should define EC2 compliance checks', () => {
      expect(moduleTfContent).toContain('ec2_findings = flatten');
    });

    it('should check for approved AMIs', () => {
      expect(moduleTfContent).toContain('Instance uses unapproved AMI');
    });

    it('should check for required tags', () => {
      expect(moduleTfContent).toContain('Missing required tag');
    });

    it('should define RDS compliance checks', () => {
      expect(moduleTfContent).toContain('rds_findings = flatten');
    });

    it('should check RDS backup retention', () => {
      expect(moduleTfContent).toContain('Insufficient backup retention period');
    });

    it('should check RDS encryption', () => {
      expect(moduleTfContent).toContain('Database storage is not encrypted');
    });

    it('should check RDS multi-AZ for production', () => {
      expect(moduleTfContent).toContain('Production database is not multi-AZ');
    });

    it('should define S3 compliance checks', () => {
      expect(moduleTfContent).toContain('s3_findings = flatten');
    });

    it('should define security group compliance checks', () => {
      expect(moduleTfContent).toContain('sg_findings = flatten');
    });

    it('should check for overly permissive security rules', () => {
      expect(moduleTfContent).toContain('Security group has overly permissive rule');
      expect(moduleTfContent).toContain('0.0.0.0/0');
    });

    it('should define IAM compliance checks', () => {
      expect(moduleTfContent).toContain('iam_findings = flatten');
    });

    it('should check for wildcard IAM policies', () => {
      expect(moduleTfContent).toContain('IAM role may have overly permissive policies');
    });
  });

  describe('Compliance Validation Resource', () => {
    it('should create null_resource for compliance validation', () => {
      expect(moduleTfContent).toContain('resource "null_resource" "compliance_check"');
    });

    it('should use lifecycle precondition for critical findings', () => {
      expect(moduleTfContent).toContain('lifecycle');
      expect(moduleTfContent).toContain('precondition');
      expect(moduleTfContent).toContain('length(local.critical_findings) == 0');
    });

    it('should reference environment_suffix in error message', () => {
      expect(moduleTfContent).toContain('Environment: ${var.environment_suffix}');
    });
  });

  describe('Check Blocks (Terraform 1.5+)', () => {
    it('should define EC2 compliance check block', () => {
      expect(moduleTfContent).toContain('check "ec2_compliance"');
    });

    it('should define RDS backup compliance check block', () => {
      expect(moduleTfContent).toContain('check "rds_backup_compliance"');
    });

    it('should define S3 validation check block', () => {
      expect(moduleTfContent).toContain('check "s3_bucket_validation"');
    });

    it('should use assert blocks in checks', () => {
      expect(moduleTfContent).toContain('assert');
      expect(moduleTfContent).toContain('condition');
      expect(moduleTfContent).toContain('error_message');
    });
  });

  describe('Compliance Logic Locals', () => {
    it('should flatten all findings', () => {
      expect(moduleTfContent).toContain('all_findings = compact(flatten');
    });

    it('should categorize findings by severity', () => {
      expect(moduleTfContent).toContain('critical_findings');
      expect(moduleTfContent).toContain('high_findings');
      expect(moduleTfContent).toContain('medium_findings');
      expect(moduleTfContent).toContain('low_findings');
    });

    it('should determine compliance status based on severity', () => {
      expect(moduleTfContent).toContain('compliance_status');
      expect(moduleTfContent).toContain('CRITICAL_ISSUES_FOUND');
      expect(moduleTfContent).toContain('COMPLIANT');
    });
  });

  describe('Read-Only Analysis Validation', () => {
    it('should not create EC2 instances', () => {
      expect(mainTfContent).not.toContain('resource "aws_instance"');
    });

    it('should not create RDS instances', () => {
      expect(mainTfContent).not.toContain('resource "aws_db_instance"');
    });

    it('should not create S3 buckets', () => {
      expect(mainTfContent).not.toContain('resource "aws_s3_bucket"');
    });

    it('should not create VPCs', () => {
      expect(mainTfContent).not.toContain('resource "aws_vpc"');
    });

    it('should not create IAM roles', () => {
      expect(mainTfContent).not.toContain('resource "aws_iam_role"');
    });

    it('should only use data sources for querying', () => {
      const resourceCount = (mainTfContent.match(/resource "/g) || []).length;
      expect(resourceCount).toBe(0); // No resources should be created in main.tf
    });
  });

  describe('Environment Suffix Usage', () => {
    it('should include environment_suffix in metadata output', () => {
      expect(outputsTfContent).toContain('environment_suffix');
    });

    it('should pass environment_suffix to module', () => {
      expect(mainTfContent).toContain('environment_suffix');
    });
  });
});
