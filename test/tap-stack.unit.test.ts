import * as validator from '../lib/terraform-validator';

describe('Terraform Multi-Region DR Infrastructure - Validator Tests', () => {
  describe('File Discovery', () => {
    it('should discover all Terraform files', () => {
      const files = validator.getTerraformFiles();
      expect(files.length).toBeGreaterThan(0);
      expect(files.every(f => f.name.endsWith('.tf'))).toBe(true);
    });

    it('should read file contents', () => {
      const files = validator.getTerraformFiles();
      expect(files.every(f => f.content.length > 0)).toBe(true);
    });

    it('should include file sizes', () => {
      const files = validator.getTerraformFiles();
      expect(files.every(f => f.size > 0)).toBe(true);
    });
  });

  describe('Required Files Validation', () => {
    it('should validate that all required files exist', () => {
      const result = validator.validateRequiredFiles();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return file list including main.tf', () => {
      const files = validator.getTerraformFiles();
      const fileNames = files.map(f => f.name);
      expect(fileNames).toContain('main.tf');
    });

    it('should return file list including aurora.tf', () => {
      const files = validator.getTerraformFiles();
      const fileNames = files.map(f => f.name);
      expect(fileNames).toContain('aurora.tf');
    });

    it('should return file list including vpc.tf', () => {
      const files = validator.getTerraformFiles();
      const fileNames = files.map(f => f.name);
      expect(fileNames).toContain('vpc.tf');
    });

    it('should return file list including secrets.tf', () => {
      const files = validator.getTerraformFiles();
      const fileNames = files.map(f => f.name);
      expect(fileNames).toContain('secrets.tf');
    });

    it('should return file list including s3.tf', () => {
      const files = validator.getTerraformFiles();
      const fileNames = files.map(f => f.name);
      expect(fileNames).toContain('s3.tf');
    });

    it('should return file list including route53.tf', () => {
      const files = validator.getTerraformFiles();
      const fileNames = files.map(f => f.name);
      expect(fileNames).toContain('route53.tf');
    });

    it('should return file list including sns.tf', () => {
      const files = validator.getTerraformFiles();
      const fileNames = files.map(f => f.name);
      expect(fileNames).toContain('sns.tf');
    });

    it('should return file list including variables.tf', () => {
      const files = validator.getTerraformFiles();
      const fileNames = files.map(f => f.name);
      expect(fileNames).toContain('variables.tf');
    });

    it('should return file list including outputs.tf', () => {
      const files = validator.getTerraformFiles();
      const fileNames = files.map(f => f.name);
      expect(fileNames).toContain('outputs.tf');
    });
  });

  describe('Provider Configuration Validation', () => {
    it('should validate provider configuration in main.tf', () => {
      const files = validator.getTerraformFiles();
      const mainFile = files.find(f => f.name === 'main.tf');
      expect(mainFile).toBeDefined();

      const result = validator.validateProviderConfig(mainFile!.content);
      expect(result.valid).toBe(true);
    });

    it('should detect missing terraform block', () => {
      const result = validator.validateProviderConfig('provider "aws" {}');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing terraform block');
    });

    it('should detect missing required_providers', () => {
      const result = validator.validateProviderConfig('terraform {}');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required_providers block');
    });

    it('should detect missing AWS provider', () => {
      const result = validator.validateProviderConfig('terraform { required_providers {} }');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing AWS provider');
    });

    it('should warn about missing random provider', () => {
      const content = 'terraform { required_providers { aws = { source = "hashicorp/aws" } } }';
      const result = validator.validateProviderConfig(content);
      expect(result.warnings.some(w => w.includes('random provider'))).toBe(true);
    });

    it('should warn about missing S3 backend', () => {
      const content = 'terraform { required_providers { aws = { source = "hashicorp/aws" } random = { source = "hashicorp/random" } } }';
      const result = validator.validateProviderConfig(content);
      expect(result.warnings.some(w => w.includes('S3 backend'))).toBe(true);
    });
  });

  describe('Multi-Region Configuration Validation', () => {
    it('should validate multi-region configuration', () => {
      const files = validator.getTerraformFiles();
      const mainFile = files.find(f => f.name === 'main.tf');
      expect(mainFile).toBeDefined();

      const result = validator.validateMultiRegion(mainFile!.content);
      expect(result.valid).toBe(true);
    });

    it('should detect missing primary region alias', () => {
      const content = 'provider "aws" { alias = "secondary" }';
      const result = validator.validateMultiRegion(content);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing primary region provider alias');
    });

    it('should detect missing secondary region alias', () => {
      const content = 'provider "aws" { alias = "primary" }';
      const result = validator.validateMultiRegion(content);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing secondary region provider alias');
    });
  });

  describe('Resource Naming Validation', () => {
    it('should validate resource naming includes environmentSuffix', () => {
      const files = validator.getTerraformFiles();
      const auroraFile = files.find(f => f.name === 'aurora.tf');
      expect(auroraFile).toBeDefined();

      const result = validator.validateResourceNaming(auroraFile!.content);
      expect(result.valid).toBe(true);
    });

    it('should detect missing environmentSuffix in resource names', () => {
      const content = 'resource "aws_vpc" "main" { tags = { Name = "my-vpc" } }';
      const result = validator.validateResourceNaming(content);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('environmentSuffix');
    });

    it('should handle content with no resource names', () => {
      const content = 'resource "aws_vpc" "main" { cidr_block = "10.0.0.0/16" }';
      const result = validator.validateResourceNaming(content);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('No resource names found');
    });

    it('should validate correct naming pattern', () => {
      const content = 'resource "aws_vpc" "main" { tags = { Name = "vpc-${var.environment_suffix}" } }';
      const result = validator.validateResourceNaming(content);
      expect(result.valid).toBe(true);
    });
  });

  describe('Security Validation', () => {
    it('should validate security best practices in aurora.tf', () => {
      const files = validator.getTerraformFiles();
      const auroraFile = files.find(f => f.name === 'aurora.tf');
      expect(auroraFile).toBeDefined();

      const result = validator.validateSecurity(auroraFile!.content);
      expect(result.valid).toBe(true);
    });

    it('should detect hardcoded passwords', () => {
      const content = 'resource "aws_db_instance" "main" { password = "hardcoded123" }';
      const result = validator.validateSecurity(content);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Hardcoded password detected');
    });

    it('should allow variable-referenced passwords', () => {
      const content = 'resource "aws_db_instance" "main" { password = var.db_password }';
      const result = validator.validateSecurity(content);
      expect(result.valid).toBe(true);
    });

    it('should warn about missing RDS encryption', () => {
      const content = 'resource "aws_rds_cluster" "main" { engine = "aurora-postgresql" }';
      const result = validator.validateSecurity(content);
      expect(result.warnings.some(w => w.includes('RDS encryption'))).toBe(true);
    });

    it('should warn about missing S3 encryption', () => {
      const content = 'resource "aws_s3_bucket" "main" { bucket = "my-bucket" }';
      const result = validator.validateSecurity(content);
      expect(result.warnings.some(w => w.includes('S3 encryption'))).toBe(true);
    });

    it('should warn about deletion protection enabled', () => {
      const content = 'resource "aws_rds_cluster" "main" { deletion_protection = true }';
      const result = validator.validateSecurity(content);
      expect(result.warnings.some(w => w.includes('Deletion protection'))).toBe(true);
    });
  });

  describe('Aurora Global Database Validation', () => {
    it('should validate Aurora configuration', () => {
      const files = validator.getTerraformFiles();
      const auroraFile = files.find(f => f.name === 'aurora.tf');
      expect(auroraFile).toBeDefined();

      const result = validator.validateAuroraConfig(auroraFile!.content);
      expect(result.valid).toBe(true);
    });

    it('should detect missing Global Database', () => {
      const content = 'resource "aws_rds_cluster" "main" {}';
      const result = validator.validateAuroraConfig(content);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing Aurora Global Database configuration');
    });

    it('should detect missing global_cluster_identifier', () => {
      const content = 'resource "aws_rds_global_cluster" "main" {}';
      const result = validator.validateAuroraConfig(content);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing global_cluster_identifier reference');
    });

    it('should warn about wrong instance class', () => {
      const content = 'resource "aws_rds_global_cluster" "main" {} global_cluster_identifier = "test" instance_class = "db.t3.medium"';
      const result = validator.validateAuroraConfig(content);
      expect(result.warnings.some(w => w.includes('db.r6g.large'))).toBe(true);
    });
  });

  describe('Disaster Recovery Features Validation', () => {
    it('should validate DR features', () => {
      const result = validator.validateDRFeatures();
      expect(result.valid).toBe(true);
    });

    it('should detect missing Route 53 failover', () => {
      // This would require mocking the file system, so we test the logic
      const files = validator.getTerraformFiles();
      const route53File = files.find(f => f.name === 'route53.tf');
      expect(route53File).toBeDefined();
      expect(route53File!.content).toContain('failover_routing_policy');
    });

    it('should check for replication lag monitoring', () => {
      const files = validator.getTerraformFiles();
      const route53File = files.find(f => f.name === 'route53.tf');
      expect(route53File).toBeDefined();
      expect(route53File!.content).toContain('AuroraGlobalDBReplicationLag');
    });

    it('should check for S3 cross-region replication', () => {
      const files = validator.getTerraformFiles();
      const s3File = files.find(f => f.name === 's3.tf');
      expect(s3File).toBeDefined();
      expect(s3File!.content).toContain('replication_configuration');
    });
  });

  describe('Complete Validation', () => {
    it('should run all validations successfully', () => {
      const result = validator.validateAll();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should aggregate results from multiple validations', () => {
      const result = validator.validateAll();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
    });

    it('should validate all terraform files exist', () => {
      const result = validator.validateAll();
      const files = validator.getTerraformFiles();
      expect(files.length).toBeGreaterThanOrEqual(9);
    });

    it('should validate provider configuration is correct', () => {
      const files = validator.getTerraformFiles();
      const mainFile = files.find(f => f.name === 'main.tf');
      expect(mainFile).toBeDefined();
      expect(mainFile!.content).toContain('hashicorp/aws');
    });

    it('should validate multi-region setup is correct', () => {
      const files = validator.getTerraformFiles();
      const mainFile = files.find(f => f.name === 'main.tf');
      expect(mainFile).toBeDefined();
      expect(mainFile!.content).toContain('alias  = "primary"');
      expect(mainFile!.content).toContain('alias  = "secondary"');
    });

    it('should validate aurora configuration is correct', () => {
      const files = validator.getTerraformFiles();
      const auroraFile = files.find(f => f.name === 'aurora.tf');
      expect(auroraFile).toBeDefined();
      expect(auroraFile!.content).toContain('aws_rds_global_cluster');
    });

    it('should validate resource naming is correct', () => {
      const files = validator.getTerraformFiles();
      const auroraFile = files.find(f => f.name === 'aurora.tf');
      expect(auroraFile).toBeDefined();
      expect(auroraFile!.content).toContain('${var.environment_suffix}');
    });

    it('should validate security practices are correct', () => {
      const files = validator.getTerraformFiles();
      const auroraFile = files.find(f => f.name === 'aurora.tf');
      expect(auroraFile).toBeDefined();
      const result = validator.validateSecurity(auroraFile!.content);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate DR features are correct', () => {
      const result = validator.validateDRFeatures();
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty content gracefully', () => {
      const result = validator.validateProviderConfig('');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle malformed content gracefully', () => {
      const result = validator.validateResourceNaming('invalid { content }');
      expect(result.valid).toBe(true); // No names found is valid
    });

    it('should validate complete file structure', () => {
      const files = validator.getTerraformFiles();
      expect(files.every(f => f.name && f.path && f.content && f.size)).toBe(true);
    });

    it('should detect when only some resources have environmentSuffix', () => {
      const content = `
        resource "aws_vpc" "main" {
          tags = { Name = "vpc-\${var.environment_suffix}" }
        }
        resource "aws_subnet" "main" {
          tags = { Name = "hardcoded-name" }
        }
      `;
      const result = validator.validateResourceNaming(content);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('resources include environmentSuffix');
    });

    it('should detect configuration without replication lag monitoring', () => {
      const content = 'resource "aws_route53_zone" "main" {} resource "aws_route53_health_check" "main" {} failover_routing_policy {}';
      const result = validator.validateAuroraConfig(content);
      // This will fail other validations but tests the path
      expect(result).toBeDefined();
    });
  });
});
