/**
 * Unit tests for Terraform Utils
 */

import { TerraformUtils } from '../lib/terraform-utils';
import * as fs from 'fs';
import * as path from 'path';

describe('TerraformUtils', () => {
  const sampleHcl = fs.readFileSync(path.join(__dirname, '../lib/tap_stack.tf'), 'utf8');

  describe('parseVariables', () => {
    it('should parse variables from HCL content', () => {
      const variables = TerraformUtils.parseVariables(sampleHcl);
      expect(variables.length).toBeGreaterThan(10);
      
      const envVar = variables.find(v => v.name === 'environment');
      expect(envVar).toBeDefined();
      expect(envVar?.type).toBe('string');
      expect(envVar?.default).toBe('development');
    });

    it('should parse variables with validation rules', () => {
      const variables = TerraformUtils.parseVariables(sampleHcl);
      const regionVar = variables.find(v => v.name === 'aws_region');
      
      expect(regionVar).toBeDefined();
      expect(regionVar?.validation).toBeDefined();
      expect(regionVar?.validation?.condition).toContain('us-east-1');
    });

    it('should parse environment_suffix variable', () => {
      const variables = TerraformUtils.parseVariables(sampleHcl);
      const suffixVar = variables.find(v => v.name === 'environment_suffix');
      
      expect(suffixVar).toBeDefined();
      expect(suffixVar?.type).toBe('string');
      expect(suffixVar?.default).toBe('dev');
    });
  });

  describe('parseOutputs', () => {
    it('should parse outputs from HCL content', () => {
      const outputs = TerraformUtils.parseOutputs(sampleHcl);
      expect(outputs.length).toBeGreaterThan(5);
      
      const vpcOutput = outputs.find(o => o.name === 'vpc_id');
      expect(vpcOutput).toBeDefined();
      expect(vpcOutput?.description).toContain('VPC ID');
    });

    it('should identify sensitive outputs', () => {
      const outputs = TerraformUtils.parseOutputs(sampleHcl);
      const rdsOutput = outputs.find(o => o.name === 'rds_endpoint');
      
      expect(rdsOutput).toBeDefined();
      expect(rdsOutput?.sensitive).toBe(true);
    });

    it('should parse cost estimation output', () => {
      const outputs = TerraformUtils.parseOutputs(sampleHcl);
      const costOutput = outputs.find(o => o.name === 'cost_estimation');
      
      expect(costOutput).toBeDefined();
      expect(costOutput?.description).toContain('Estimated monthly costs');
    });
  });

  describe('extractSecurityGroupRules', () => {
    it('should extract ALB security group rules', () => {
      const rules = TerraformUtils.extractSecurityGroupRules(sampleHcl, 'alb');
      
      expect(rules.length).toBeGreaterThan(0);
      
      const httpRule = rules.find(r => r.fromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule?.type).toBe('ingress');
      expect(httpRule?.protocol).toBe('tcp');
    });

    it('should extract bastion security group SSH rules', () => {
      const rules = TerraformUtils.extractSecurityGroupRules(sampleHcl, 'bastion');
      
      const sshRule = rules.find(r => r.fromPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule?.type).toBe('ingress');
      expect(sshRule?.cidrBlocks).toBeDefined();
    });

    it('should extract application security group rules', () => {
      const rules = TerraformUtils.extractSecurityGroupRules(sampleHcl, 'application');
      
      expect(rules.length).toBeGreaterThan(0);
      const ingressRules = rules.filter(r => r.type === 'ingress');
      const egressRules = rules.filter(r => r.type === 'egress');
      
      expect(ingressRules.length).toBeGreaterThan(0);
      expect(egressRules.length).toBeGreaterThan(0);
    });
  });

  describe('generateTfvars', () => {
    it('should generate development environment tfvars', () => {
      const tfvars = TerraformUtils.generateTfvars('development', 'dev123');
      
      expect(tfvars).toContain('environment = "development"');
      expect(tfvars).toContain('environment_suffix = "dev123"');
      expect(tfvars).toContain('vpc_cidr = "10.0.0.0/16"');
      expect(tfvars).toContain('instance_type = "t3.micro"');
      expect(tfvars).toContain('enable_multi_az = false');
    });

    it('should generate staging environment tfvars', () => {
      const tfvars = TerraformUtils.generateTfvars('staging', 'stage456');
      
      expect(tfvars).toContain('environment = "staging"');
      expect(tfvars).toContain('environment_suffix = "stage456"');
      expect(tfvars).toContain('vpc_cidr = "10.1.0.0/16"');
      expect(tfvars).toContain('instance_type = "t3.small"');
      expect(tfvars).toContain('enable_multi_az = true');
    });

    it('should generate production environment tfvars', () => {
      const tfvars = TerraformUtils.generateTfvars('production', 'prod789');
      
      expect(tfvars).toContain('environment = "production"');
      expect(tfvars).toContain('environment_suffix = "prod789"');
      expect(tfvars).toContain('vpc_cidr = "10.2.0.0/16"');
      expect(tfvars).toContain('instance_type = "t3.medium"');
      expect(tfvars).toContain('enable_deletion_protection = false');
    });
  });

  describe('validateTagStrategy', () => {
    it('should validate complete tag strategy', () => {
      const validTags = {
        Environment: 'development',
        Project: 'aws-infrastructure',
        ManagedBy: 'terraform',
        Owner: 'devops-team',
        EnvironmentSuffix: 'dev123'
      };
      
      expect(TerraformUtils.validateTagStrategy(validTags)).toBe(true);
    });

    it('should reject incomplete tag strategy', () => {
      const incompleteTags = {
        Environment: 'development',
        Project: 'aws-infrastructure',
        ManagedBy: 'terraform',
        Owner: '',
        EnvironmentSuffix: ''
      };
      
      expect(TerraformUtils.validateTagStrategy(incompleteTags)).toBe(false);
    });

    it('should reject non-terraform managed resources', () => {
      const invalidTags = {
        Environment: 'development',
        Project: 'aws-infrastructure',
        ManagedBy: 'manual',
        Owner: 'devops-team',
        EnvironmentSuffix: 'dev123'
      };
      
      expect(TerraformUtils.validateTagStrategy(invalidTags)).toBe(false);
    });
  });

  describe('calculateEstimatedCosts', () => {
    it('should calculate development environment costs', () => {
      const costs = TerraformUtils.calculateEstimatedCosts('development');
      
      expect(costs.ec2_instances).toBe(30);
      expect(costs.rds_instance).toBe(50);
      expect(costs.total_estimated).toBe(80);
    });

    it('should calculate staging environment costs', () => {
      const costs = TerraformUtils.calculateEstimatedCosts('staging');
      
      expect(costs.ec2_instances).toBe(60);
      expect(costs.rds_instance).toBe(100);
      expect(costs.total_estimated).toBe(225);
    });

    it('should calculate production environment costs', () => {
      const costs = TerraformUtils.calculateEstimatedCosts('production');
      
      expect(costs.ec2_instances).toBe(150);
      expect(costs.rds_instance).toBe(200);
      expect(costs.total_estimated).toBe(415);
    });

    it('should default to development costs for unknown environment', () => {
      const costs = TerraformUtils.calculateEstimatedCosts('unknown');
      
      expect(costs.total_estimated).toBe(80);
    });
  });

  describe('generateResourceName', () => {
    it('should generate consistent resource names', () => {
      const name = TerraformUtils.generateResourceName('tap', 'dev123', 'vpc');
      expect(name).toBe('tap-dev123-vpc');
    });

    it('should handle different resource types', () => {
      expect(TerraformUtils.generateResourceName('tap', 'prod', 'alb')).toBe('tap-prod-alb');
      expect(TerraformUtils.generateResourceName('tap', 'stage', 'rds')).toBe('tap-stage-rds');
    });
  });

  describe('isValidCidr', () => {
    it('should validate correct CIDR blocks', () => {
      expect(TerraformUtils.isValidCidr('10.0.0.0/16')).toBe(true);
      expect(TerraformUtils.isValidCidr('192.168.1.0/24')).toBe(true);
      expect(TerraformUtils.isValidCidr('172.16.0.0/12')).toBe(true);
    });

    it('should reject invalid CIDR blocks', () => {
      expect(TerraformUtils.isValidCidr('256.0.0.0/16')).toBe(false);
      expect(TerraformUtils.isValidCidr('10.0.0.0/33')).toBe(false);
      expect(TerraformUtils.isValidCidr('10.0.0.0')).toBe(false);
      expect(TerraformUtils.isValidCidr('not-a-cidr')).toBe(false);
    });
  });

  describe('supportsDeletionProtection', () => {
    it('should identify resources that support deletion protection', () => {
      expect(TerraformUtils.supportsDeletionProtection('aws_db_instance')).toBe(true);
      expect(TerraformUtils.supportsDeletionProtection('aws_lb')).toBe(true);
      expect(TerraformUtils.supportsDeletionProtection('aws_elasticache_cluster')).toBe(true);
    });

    it('should identify resources that do not support deletion protection', () => {
      expect(TerraformUtils.supportsDeletionProtection('aws_vpc')).toBe(false);
      expect(TerraformUtils.supportsDeletionProtection('aws_subnet')).toBe(false);
      expect(TerraformUtils.supportsDeletionProtection('aws_security_group')).toBe(false);
    });
  });

  describe('generateBackendConfig', () => {
    it('should generate S3 backend configuration', () => {
      const config = TerraformUtils.generateBackendConfig(
        'my-terraform-state',
        'env/dev/terraform.tfstate',
        'us-east-1'
      );
      
      expect(config).toContain('backend "s3"');
      expect(config).toContain('bucket = "my-terraform-state"');
      expect(config).toContain('key    = "env/dev/terraform.tfstate"');
      expect(config).toContain('region = "us-east-1"');
      expect(config).toContain('encrypt = true');
    });
  });
});