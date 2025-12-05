/**
 * Unit tests for Terraform Infrastructure Configuration
 *
 * These tests validate the Terraform configuration structure and ensure
 * all required files are present for the IaC optimization task.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure Configuration', () => {
  const libDir = path.join(__dirname, '..', 'lib');

  describe('Required Files', () => {
    test('tap-stack.tf should exist', () => {
      const filePath = path.join(libDir, 'tap-stack.tf');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('optimize.py should exist', () => {
      const filePath = path.join(libDir, 'optimize.py');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('PROMPT.md should exist', () => {
      const filePath = path.join(libDir, 'PROMPT.md');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('MODEL_RESPONSE.md should exist', () => {
      const filePath = path.join(libDir, 'MODEL_RESPONSE.md');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('MODEL_FAILURES.md should exist', () => {
      const filePath = path.join(libDir, 'MODEL_FAILURES.md');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('IDEAL_RESPONSE.md should exist', () => {
      const filePath = path.join(libDir, 'IDEAL_RESPONSE.md');
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe('Terraform Configuration Validation', () => {
    let terraformContent: string;

    beforeAll(() => {
      const filePath = path.join(libDir, 'tap-stack.tf');
      terraformContent = fs.readFileSync(filePath, 'utf-8');
    });

    test('should contain terraform block', () => {
      expect(terraformContent).toContain('terraform {');
    });

    test('should contain required_version constraint', () => {
      expect(terraformContent).toContain('required_version');
    });

    test('should contain AWS provider configuration', () => {
      expect(terraformContent).toContain('provider "aws"');
    });

    test('should define VPC resources', () => {
      expect(terraformContent).toContain('resource "aws_vpc"');
    });

    test('should define subnet resources', () => {
      expect(terraformContent).toContain('resource "aws_subnet"');
    });

    test('should define security group resources', () => {
      expect(terraformContent).toContain('resource "aws_security_group"');
    });

    test('should define EC2 instance resources', () => {
      expect(terraformContent).toContain('resource "aws_instance"');
    });

    test('should define RDS instance resources', () => {
      expect(terraformContent).toContain('resource "aws_db_instance"');
    });

    test('should define load balancer resources', () => {
      expect(terraformContent).toContain('resource "aws_lb"');
    });

    test('should contain outputs', () => {
      expect(terraformContent).toContain('output "');
    });

    test('should contain variables', () => {
      expect(terraformContent).toContain('variable "');
    });
  });

  describe('Optimization Script Validation', () => {
    let optimizeContent: string;

    beforeAll(() => {
      const filePath = path.join(libDir, 'optimize.py');
      optimizeContent = fs.readFileSync(filePath, 'utf-8');
    });

    test('should contain InfrastructureOptimizer class', () => {
      expect(optimizeContent).toContain('class InfrastructureOptimizer');
    });

    test('should contain boto3 import', () => {
      expect(optimizeContent).toContain('import boto3');
    });

    test('should contain EC2 optimization method', () => {
      expect(optimizeContent).toContain('def optimize_ec2_instance');
    });

    test('should contain RDS optimization method', () => {
      expect(optimizeContent).toContain('def optimize_rds_instance');
    });

    test('should contain security group analysis method', () => {
      expect(optimizeContent).toContain('def analyze_security_groups');
    });

    test('should contain tag optimization method', () => {
      expect(optimizeContent).toContain('def apply_tag_optimization');
    });

    test('should contain report generation method', () => {
      expect(optimizeContent).toContain('def generate_optimization_report');
    });

    test('should contain main function', () => {
      expect(optimizeContent).toContain('def main():');
    });

    test('should contain CloudWatch integration', () => {
      expect(optimizeContent).toContain('cloudwatch');
    });

    test('should calculate cost savings', () => {
      expect(optimizeContent).toContain('cost_saving');
    });
  });

  describe('Anti-Patterns for Learning', () => {
    let terraformContent: string;

    beforeAll(() => {
      const filePath = path.join(libDir, 'tap-stack.tf');
      terraformContent = fs.readFileSync(filePath, 'utf-8');
    });

    test('should contain hardcoded values (intentional for baseline)', () => {
      // These are intentional anti-patterns to be optimized
      expect(terraformContent).toContain('10.0.0.0/16');
      expect(terraformContent).toContain('10.1.0.0/16');
      expect(terraformContent).toContain('10.2.0.0/16');
    });

    test('should contain duplicate resource definitions (intentional)', () => {
      const vpcMatches = terraformContent.match(/resource "aws_vpc"/g);
      expect(vpcMatches).not.toBeNull();
      expect(vpcMatches!.length).toBeGreaterThan(1);
    });

    test('should contain multiple security group definitions', () => {
      const sgMatches = terraformContent.match(/resource "aws_security_group"/g);
      expect(sgMatches).not.toBeNull();
      expect(sgMatches!.length).toBeGreaterThan(1);
    });
  });

  describe('Documentation Quality', () => {
    test('MODEL_FAILURES.md should document anti-patterns', () => {
      const filePath = path.join(libDir, 'MODEL_FAILURES.md');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('Failure Pattern');
      expect(content).toContain('Learning Opportunity');
      expect(content).toContain('Training Quality');
    });

    test('IDEAL_RESPONSE.md should provide optimization strategy', () => {
      const filePath = path.join(libDir, 'IDEAL_RESPONSE.md');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('Optimization Strategy');
      expect(content).toContain('Implementation');
      expect(content).toContain('Expected Outcomes');
    });

    test('MODEL_RESPONSE.md should explain implementation', () => {
      const filePath = path.join(libDir, 'MODEL_RESPONSE.md');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('Implementation Approach');
      expect(content).toContain('Design Decisions');
      expect(content).toContain('Training Quality Justification');
    });
  });

  describe('Metadata Validation', () => {
    test('metadata.json should exist', () => {
      const filePath = path.join(__dirname, '..', 'metadata.json');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('metadata.json should have required fields', () => {
      const filePath = path.join(__dirname, '..', 'metadata.json');
      const metadata = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      expect(metadata).toHaveProperty('po_id');
      expect(metadata).toHaveProperty('platform');
      expect(metadata).toHaveProperty('language');
      expect(metadata).toHaveProperty('complexity');
      expect(metadata).toHaveProperty('subtask');
      expect(metadata).toHaveProperty('subject_labels');
      expect(metadata).toHaveProperty('training_quality');
    });

    test('metadata should indicate IaC Optimization task', () => {
      const filePath = path.join(__dirname, '..', 'metadata.json');
      const metadata = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      expect(metadata.subtask).toBe('IaC Program Optimization');
      expect(metadata.subject_labels).toContain('IaC Optimization');
    });
  });
});
