import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Configuration Unit Tests', () => {
  const libDir = path.join(process.cwd(), 'lib');
  let mainTfContent: string;

  beforeAll(() => {
    const mainTfPath = path.join(libDir, 'main.tf');
    mainTfContent = fs.readFileSync(mainTfPath, 'utf8');
  });

  describe('main.tf', () => {

    it('should exist', () => {
      const mainTfPath = path.join(libDir, 'main.tf');
      expect(fs.existsSync(mainTfPath)).toBe(true);
    });

    it('should use TapStack naming convention', () => {
      expect(mainTfContent).toContain('TapStack${var.environment_suffix}');
    });

    it('should define VPC resource', () => {
      expect(mainTfContent).toContain('resource "aws_vpc" "main"');
    });

    it('should define public subnets', () => {
      expect(mainTfContent).toContain('resource "aws_subnet" "public_1"');
      expect(mainTfContent).toContain('resource "aws_subnet" "public_2"');
      expect(mainTfContent).toContain('resource "aws_subnet" "public_3"');
    });

    it('should define private subnets', () => {
      expect(mainTfContent).toContain('resource "aws_subnet" "private_1"');
      expect(mainTfContent).toContain('resource "aws_subnet" "private_2"');
      expect(mainTfContent).toContain('resource "aws_subnet" "private_3"');
    });

    it('should define internet gateway', () => {
      expect(mainTfContent).toContain('resource "aws_internet_gateway" "main"');
    });

    it('should define ALB security group', () => {
      expect(mainTfContent).toContain('resource "aws_security_group" "alb"');
    });

    it('should define ECS security group', () => {
      expect(mainTfContent).toContain('resource "aws_security_group" "ecs"');
    });

    it('should define S3 buckets for logs', () => {
      expect(mainTfContent).toContain('resource "aws_s3_bucket" "alb_logs"');
      expect(mainTfContent).toContain('resource "aws_s3_bucket" "application_logs"');
      expect(mainTfContent).toContain('resource "aws_s3_bucket" "audit_logs"');
    });

    it('should enable S3 versioning', () => {
      expect(mainTfContent).toContain('resource "aws_s3_bucket_versioning"');
    });

    it('should enable S3 encryption', () => {
      expect(mainTfContent).toContain('resource "aws_s3_bucket_server_side_encryption_configuration"');
    });

    it('should define ECS cluster', () => {
      expect(mainTfContent).toContain('resource "aws_ecs_cluster" "main"');
    });

    it('should define IAM role for ECS task execution', () => {
      expect(mainTfContent).toContain('resource "aws_iam_role" "ecs_task_execution"');
    });

    it('should define ALB', () => {
      expect(mainTfContent).toContain('resource "aws_lb" "main"');
    });

    it('should have deletion protection disabled for ALB', () => {
      expect(mainTfContent).toContain('enable_deletion_protection = false');
    });

    it('should define CloudWatch log groups', () => {
      expect(mainTfContent).toContain('resource "aws_cloudwatch_log_group" "api"');
      expect(mainTfContent).toContain('resource "aws_cloudwatch_log_group" "worker"');
      expect(mainTfContent).toContain('resource "aws_cloudwatch_log_group" "scheduler"');
    });
  });

  describe('variables.tf', () => {
    let variablesTfContent: string;

    beforeAll(() => {
      const variablesTfPath = path.join(libDir, 'variables.tf');
      variablesTfContent = fs.readFileSync(variablesTfPath, 'utf8');
    });

    it('should exist', () => {
      const variablesTfPath = path.join(libDir, 'variables.tf');
      expect(fs.existsSync(variablesTfPath)).toBe(true);
    });

    it('should define environment_suffix variable', () => {
      expect(variablesTfContent).toContain('variable "environment_suffix"');
    });

    it('should define aws_region variable', () => {
      expect(variablesTfContent).toContain('variable "aws_region"');
    });

    it('should have description for environment_suffix', () => {
      expect(variablesTfContent).toContain('description');
    });
  });

  describe('terraform and provider configuration', () => {
    it('should require terraform version >= 1.5.0', () => {
      expect(mainTfContent).toContain('required_version = ">= 1.5.0"');
    });

    it('should use AWS provider version ~> 5.0', () => {
      expect(mainTfContent).toContain('version = "~> 5.0"');
    });

    it('should use S3 backend', () => {
      expect(mainTfContent).toContain('backend "s3" {}');
    });

    it('should define AWS provider', () => {
      expect(mainTfContent).toContain('provider "aws"');
    });
  });

  describe('outputs.tf', () => {
    let outputsTfContent: string;

    beforeAll(() => {
      const outputsTfPath = path.join(libDir, 'outputs.tf');
      outputsTfContent = fs.readFileSync(outputsTfPath, 'utf8');
    });

    it('should exist', () => {
      const outputsTfPath = path.join(libDir, 'outputs.tf');
      expect(fs.existsSync(outputsTfPath)).toBe(true);
    });

    it('should output vpc_id', () => {
      expect(outputsTfContent).toContain('output "vpc_id"');
    });

    it('should output ecs_cluster_name', () => {
      expect(outputsTfContent).toContain('output "ecs_cluster_name"');
    });

    it('should output alb_dns_name', () => {
      expect(outputsTfContent).toContain('output "alb_dns_name"');
    });
  });

  describe('terraform.tfvars', () => {
    let tfvarsContent: string;

    beforeAll(() => {
      const tfvarsPath = path.join(libDir, 'terraform.tfvars');
      tfvarsContent = fs.readFileSync(tfvarsPath, 'utf8');
    });

    it('should exist', () => {
      const tfvarsPath = path.join(libDir, 'terraform.tfvars');
      expect(fs.existsSync(tfvarsPath)).toBe(true);
    });

    it('should set environment_suffix to pr7999', () => {
      expect(tfvarsContent).toContain('environment_suffix = "pr7999"');
    });

    it('should set aws_region', () => {
      expect(tfvarsContent).toContain('aws_region');
    });
  });

  describe('optimize.py', () => {
    it('should exist', () => {
      const optimizePyPath = path.join(libDir, 'optimize.py');
      expect(fs.existsSync(optimizePyPath)).toBe(true);
    });

    it('should be executable', () => {
      const optimizePyPath = path.join(libDir, 'optimize.py');
      const stats = fs.statSync(optimizePyPath);
      // Check if file has execute permission (owner)
      const isExecutable = (stats.mode & fs.constants.S_IXUSR) !== 0;
      expect(isExecutable).toBe(true);
    });

    it('should have shebang for python3', () => {
      const optimizePyPath = path.join(libDir, 'optimize.py');
      const content = fs.readFileSync(optimizePyPath, 'utf8');
      expect(content.startsWith('#!/usr/bin/env python3')).toBe(true);
    });
  });
});
