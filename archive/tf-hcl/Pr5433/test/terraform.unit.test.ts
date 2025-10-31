// Unit tests for Terraform infrastructure configuration
// Tests validate Terraform configuration files without deploying infrastructure

import fs from 'fs';
import path from 'path';
import { parse } from 'hcl2-parser';

const LIB_DIR = path.resolve(__dirname, '../lib');

describe('Terraform Infrastructure Configuration - Unit Tests', () => {
  describe('File Structure', () => {
    test('backend.tf exists', () => {
      const backendPath = path.join(LIB_DIR, 'backend.tf');
      expect(fs.existsSync(backendPath)).toBe(true);
    });

    test('provider.tf exists', () => {
      const providerPath = path.join(LIB_DIR, 'provider.tf');
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test('variables.tf exists', () => {
      const variablesPath = path.join(LIB_DIR, 'variables.tf');
      expect(fs.existsSync(variablesPath)).toBe(true);
    });

    test('outputs.tf exists', () => {
      const outputsPath = path.join(LIB_DIR, 'outputs.tf');
      expect(fs.existsSync(outputsPath)).toBe(true);
    });

    test('data.tf exists', () => {
      const dataPath = path.join(LIB_DIR, 'data.tf');
      expect(fs.existsSync(dataPath)).toBe(true);
    });

    test('compute.tf exists', () => {
      const computePath = path.join(LIB_DIR, 'compute.tf');
      expect(fs.existsSync(computePath)).toBe(true);
    });

    test('alb.tf exists', () => {
      const albPath = path.join(LIB_DIR, 'alb.tf');
      expect(fs.existsSync(albPath)).toBe(true);
    });

    test('datasync.tf exists', () => {
      const datasyncPath = path.join(LIB_DIR, 'datasync.tf');
      expect(fs.existsSync(datasyncPath)).toBe(true);
    });

    test('imports.tf exists', () => {
      const importsPath = path.join(LIB_DIR, 'imports.tf');
      expect(fs.existsSync(importsPath)).toBe(true);
    });

    test('state-backend-resources.tf exists', () => {
      const statePath = path.join(LIB_DIR, 'state-backend-resources.tf');
      expect(fs.existsSync(statePath)).toBe(true);
    });

    test('terraform.tfvars exists', () => {
      const tfvarsPath = path.join(LIB_DIR, 'terraform.tfvars');
      expect(fs.existsSync(tfvarsPath)).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    test('provider.tf declares AWS provider', () => {
      const providerPath = path.join(LIB_DIR, 'provider.tf');
      const content = fs.readFileSync(providerPath, 'utf8');
      expect(content).toContain('provider "aws"');
    });

    test('provider.tf uses var.aws_region', () => {
      const providerPath = path.join(LIB_DIR, 'provider.tf');
      const content = fs.readFileSync(providerPath, 'utf8');
      expect(content).toContain('var.aws_region');
    });

    test('provider.tf includes default_tags', () => {
      const providerPath = path.join(LIB_DIR, 'provider.tf');
      const content = fs.readFileSync(providerPath, 'utf8');
      expect(content).toContain('default_tags');
    });
  });

  describe('Variables Configuration', () => {
    test('variables.tf declares environment_suffix variable', () => {
      const variablesPath = path.join(LIB_DIR, 'variables.tf');
      const content = fs.readFileSync(variablesPath, 'utf8');
      expect(content).toContain('variable "environment_suffix"');
    });

    test('variables.tf declares aws_region variable', () => {
      const variablesPath = path.join(LIB_DIR, 'variables.tf');
      const content = fs.readFileSync(variablesPath, 'utf8');
      expect(content).toContain('variable "aws_region"');
    });

    test('variables.tf declares migration_phase variable', () => {
      const variablesPath = path.join(LIB_DIR, 'variables.tf');
      const content = fs.readFileSync(variablesPath, 'utf8');
      expect(content).toContain('variable "migration_phase"');
    });

    test('variables.tf declares vpc_id variable', () => {
      const variablesPath = path.join(LIB_DIR, 'variables.tf');
      const content = fs.readFileSync(variablesPath, 'utf8');
      expect(content).toContain('variable "vpc_id"');
    });

    test('variables.tf declares subnet_ids variable', () => {
      const variablesPath = path.join(LIB_DIR, 'variables.tf');
      const content = fs.readFileSync(variablesPath, 'utf8');
      expect(content).toContain('variable "subnet_ids"');
    });
  });

  describe('Environment Suffix Usage', () => {
    test('alb.tf uses environment_suffix in resource names', () => {
      const albPath = path.join(LIB_DIR, 'alb.tf');
      const content = fs.readFileSync(albPath, 'utf8');
      expect(content).toMatch(/\$\{var\.environment_suffix\}/);
    });

    test('compute.tf uses environment_suffix in resource names', () => {
      const computePath = path.join(LIB_DIR, 'compute.tf');
      const content = fs.readFileSync(computePath, 'utf8');
      expect(content).toMatch(/\$\{var\.environment_suffix\}/);
    });

    test('imports.tf uses environment_suffix in resource names', () => {
      const importsPath = path.join(LIB_DIR, 'imports.tf');
      const content = fs.readFileSync(importsPath, 'utf8');
      expect(content).toMatch(/\$\{var\.environment_suffix\}/);
    });

    test('datasync.tf uses environment_suffix in resource names', () => {
      const datasyncPath = path.join(LIB_DIR, 'datasync.tf');
      const content = fs.readFileSync(datasyncPath, 'utf8');
      expect(content).toMatch(/\$\{var\.environment_suffix\}/);
    });

    test('state-backend-resources.tf uses environment_suffix in resource names', () => {
      const statePath = path.join(LIB_DIR, 'state-backend-resources.tf');
      const content = fs.readFileSync(statePath, 'utf8');
      expect(content).toMatch(/\$\{var\.environment_suffix\}/);
    });
  });

  describe('Compute Resources', () => {
    test('compute.tf declares EC2 instances with for_each', () => {
      const computePath = path.join(LIB_DIR, 'compute.tf');
      const content = fs.readFileSync(computePath, 'utf8');
      expect(content).toContain('resource "aws_instance"');
      expect(content).toContain('for_each');
    });

    test('compute.tf declares EBS volumes', () => {
      const computePath = path.join(LIB_DIR, 'compute.tf');
      const content = fs.readFileSync(computePath, 'utf8');
      expect(content).toContain('resource "aws_ebs_volume"');
    });

    test('compute.tf declares EBS volume attachments', () => {
      const computePath = path.join(LIB_DIR, 'compute.tf');
      const content = fs.readFileSync(computePath, 'utf8');
      expect(content).toContain('resource "aws_volume_attachment"');
    });

    test('compute.tf uses var.instance_type', () => {
      const computePath = path.join(LIB_DIR, 'compute.tf');
      const content = fs.readFileSync(computePath, 'utf8');
      expect(content).toContain('var.instance_type');
    });

    test('compute.tf uses var.ebs_volume_size', () => {
      const computePath = path.join(LIB_DIR, 'compute.tf');
      const content = fs.readFileSync(computePath, 'utf8');
      expect(content).toContain('var.ebs_volume_size');
    });
  });

  describe('Load Balancer Resources', () => {
    test('alb.tf declares Application Load Balancer', () => {
      const albPath = path.join(LIB_DIR, 'alb.tf');
      const content = fs.readFileSync(albPath, 'utf8');
      expect(content).toContain('resource "aws_lb"');
    });

    test('alb.tf declares blue target group', () => {
      const albPath = path.join(LIB_DIR, 'alb.tf');
      const content = fs.readFileSync(albPath, 'utf8');
      expect(content).toContain('resource "aws_lb_target_group" "blue"');
    });

    test('alb.tf declares green target group', () => {
      const albPath = path.join(LIB_DIR, 'alb.tf');
      const content = fs.readFileSync(albPath, 'utf8');
      expect(content).toContain('resource "aws_lb_target_group" "green"');
    });

    test('alb.tf declares listener', () => {
      const albPath = path.join(LIB_DIR, 'alb.tf');
      const content = fs.readFileSync(albPath, 'utf8');
      expect(content).toContain('resource "aws_lb_listener"');
    });

    test('alb.tf declares security group', () => {
      const albPath = path.join(LIB_DIR, 'alb.tf');
      const content = fs.readFileSync(albPath, 'utf8');
      expect(content).toContain('resource "aws_security_group" "alb"');
    });
  });

  describe('DataSync Resources', () => {
    test('datasync.tf declares S3 location', () => {
      const datasyncPath = path.join(LIB_DIR, 'datasync.tf');
      const content = fs.readFileSync(datasyncPath, 'utf8');
      expect(content).toContain('resource "aws_datasync_location_s3"');
    });

    test('datasync.tf declares IAM role', () => {
      const datasyncPath = path.join(LIB_DIR, 'datasync.tf');
      const content = fs.readFileSync(datasyncPath, 'utf8');
      expect(content).toContain('resource "aws_iam_role" "datasync_s3_access"');
    });

    test('datasync.tf declares IAM policy', () => {
      const datasyncPath = path.join(LIB_DIR, 'datasync.tf');
      const content = fs.readFileSync(datasyncPath, 'utf8');
      expect(content).toContain('resource "aws_iam_role_policy"');
    });
  });

  describe('State Backend Resources', () => {
    test('state-backend-resources.tf declares S3 bucket', () => {
      const statePath = path.join(LIB_DIR, 'state-backend-resources.tf');
      const content = fs.readFileSync(statePath, 'utf8');
      expect(content).toContain('resource "aws_s3_bucket" "terraform_state"');
    });

    test('state-backend-resources.tf declares DynamoDB table', () => {
      const statePath = path.join(LIB_DIR, 'state-backend-resources.tf');
      const content = fs.readFileSync(statePath, 'utf8');
      expect(content).toContain('resource "aws_dynamodb_table" "terraform_state_lock"');
    });

    test('state-backend-resources.tf enables S3 versioning', () => {
      const statePath = path.join(LIB_DIR, 'state-backend-resources.tf');
      const content = fs.readFileSync(statePath, 'utf8');
      expect(content).toContain('resource "aws_s3_bucket_versioning"');
    });

    test('state-backend-resources.tf enables S3 encryption', () => {
      const statePath = path.join(LIB_DIR, 'state-backend-resources.tf');
      const content = fs.readFileSync(statePath, 'utf8');
      expect(content).toContain('resource "aws_s3_bucket_server_side_encryption_configuration"');
    });
  });

  describe('Import Resources', () => {
    test('imports.tf declares imported security group', () => {
      const importsPath = path.join(LIB_DIR, 'imports.tf');
      const content = fs.readFileSync(importsPath, 'utf8');
      expect(content).toContain('resource "aws_security_group" "imported_sg"');
    });

    test('imports.tf declares imported S3 bucket', () => {
      const importsPath = path.join(LIB_DIR, 'imports.tf');
      const content = fs.readFileSync(importsPath, 'utf8');
      expect(content).toContain('resource "aws_s3_bucket" "imported_bucket"');
    });

    test('imports.tf declares imported IAM role', () => {
      const importsPath = path.join(LIB_DIR, 'imports.tf');
      const content = fs.readFileSync(importsPath, 'utf8');
      expect(content).toContain('resource "aws_iam_role" "imported_role"');
    });

    test('imports.tf declares IAM instance profile', () => {
      const importsPath = path.join(LIB_DIR, 'imports.tf');
      const content = fs.readFileSync(importsPath, 'utf8');
      expect(content).toContain('resource "aws_iam_instance_profile"');
    });
  });

  describe('Data Sources', () => {
    test('data.tf declares VPC data source', () => {
      const dataPath = path.join(LIB_DIR, 'data.tf');
      const content = fs.readFileSync(dataPath, 'utf8');
      expect(content).toContain('data "aws_vpc" "existing"');
    });

    test('data.tf declares subnet data sources', () => {
      const dataPath = path.join(LIB_DIR, 'data.tf');
      const content = fs.readFileSync(dataPath, 'utf8');
      expect(content).toContain('data "aws_subnet" "existing"');
    });

    test('data.tf declares AMI data source', () => {
      const dataPath = path.join(LIB_DIR, 'data.tf');
      const content = fs.readFileSync(dataPath, 'utf8');
      expect(content).toContain('data "aws_ami"');
    });
  });

  describe('Outputs Configuration', () => {
    test('outputs.tf declares alb_dns_name output', () => {
      const outputsPath = path.join(LIB_DIR, 'outputs.tf');
      const content = fs.readFileSync(outputsPath, 'utf8');
      expect(content).toContain('output "alb_dns_name"');
    });

    test('outputs.tf declares s3_bucket_arn output', () => {
      const outputsPath = path.join(LIB_DIR, 'outputs.tf');
      const content = fs.readFileSync(outputsPath, 'utf8');
      expect(content).toContain('output "s3_bucket_arn"');
    });

    test('outputs.tf declares instance_ids output', () => {
      const outputsPath = path.join(LIB_DIR, 'outputs.tf');
      const content = fs.readFileSync(outputsPath, 'utf8');
      expect(content).toContain('output "instance_ids"');
    });

    test('outputs.tf declares target group outputs', () => {
      const outputsPath = path.join(LIB_DIR, 'outputs.tf');
      const content = fs.readFileSync(outputsPath, 'utf8');
      expect(content).toContain('output "blue_target_group_arn"');
      expect(content).toContain('output "green_target_group_arn"');
    });

    test('outputs.tf declares workspace output', () => {
      const outputsPath = path.join(LIB_DIR, 'outputs.tf');
      const content = fs.readFileSync(outputsPath, 'utf8');
      expect(content).toContain('output "workspace"');
    });
  });

  describe('No Hardcoded Values', () => {
    test('no prevent_destroy lifecycle rules present', () => {
      const tfFiles = fs.readdirSync(LIB_DIR).filter(f => f.endsWith('.tf'));
      tfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        expect(content).not.toContain('prevent_destroy = true');
      });
    });

    test('no hardcoded prod- or dev- prefixes', () => {
      const tfFiles = fs.readdirSync(LIB_DIR).filter(f => f.endsWith('.tf'));
      tfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        expect(content).not.toMatch(/["']prod-/);
        expect(content).not.toMatch(/["']dev-/);
        expect(content).not.toMatch(/["']stage-/);
      });
    });
  });

  describe('Tagging Strategy', () => {
    test('resources include Environment tag via default_tags', () => {
      const providerPath = path.join(LIB_DIR, 'provider.tf');
      const content = fs.readFileSync(providerPath, 'utf8');
      expect(content).toContain('Environment');
    });

    test('resources include MigrationPhase tag via default_tags', () => {
      const providerPath = path.join(LIB_DIR, 'provider.tf');
      const content = fs.readFileSync(providerPath, 'utf8');
      expect(content).toContain('MigrationPhase');
    });
  });
});
