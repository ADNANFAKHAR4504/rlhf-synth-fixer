/**
 * Terraform Utility Functions
 * 
 * This module provides utility functions for working with Terraform configurations
 * in a multi-environment AWS infrastructure setup.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface TerraformVariable {
  name: string;
  type: string;
  description?: string;
  default?: any;
  validation?: {
    condition: string;
    errorMessage: string;
  };
}

export interface TerraformOutput {
  name: string;
  description?: string;
  value: string;
  sensitive?: boolean;
}

export interface SecurityGroupRule {
  type: 'ingress' | 'egress';
  fromPort: number;
  toPort: number;
  protocol: string;
  cidrBlocks?: string[];
  securityGroups?: string[];
}

export interface TagStrategy {
  Environment: string;
  Project: string;
  ManagedBy: string;
  Owner: string;
  EnvironmentSuffix: string;
}

export class TerraformUtils {
  /**
   * Parse Terraform variables from HCL content
   */
  public static parseVariables(content: string): TerraformVariable[] {
    const variables: TerraformVariable[] = [];
    const varPattern = /variable\s+"([^"]+)"\s*{([^}]*)}/g;
    
    let match;
    while ((match = varPattern.exec(content)) !== null) {
      const name = match[1];
      const block = match[2];
      
      const variable: TerraformVariable = {
        name,
        type: this.extractValue(block, 'type') || 'string'
      };

      const description = this.extractValue(block, 'description');
      if (description) {
        variable.description = description.replace(/"/g, '');
      }

      const defaultValue = this.extractValue(block, 'default');
      if (defaultValue) {
        variable.default = this.parseDefaultValue(defaultValue);
      }

      if (block.includes('validation')) {
        const validationBlock = this.extractBlock(block, 'validation');
        if (validationBlock) {
          variable.validation = {
            condition: this.extractValue(validationBlock, 'condition') || '',
            errorMessage: this.extractValue(validationBlock, 'error_message')?.replace(/"/g, '') || ''
          };
        }
      }

      variables.push(variable);
    }

    return variables;
  }

  /**
   * Parse Terraform outputs from HCL content
   */
  public static parseOutputs(content: string): TerraformOutput[] {
    const outputs: TerraformOutput[] = [];
    const outputPattern = /output\s+"([^"]+)"\s*{([^}]*)}/g;
    
    let match;
    while ((match = outputPattern.exec(content)) !== null) {
      const name = match[1];
      const block = match[2];
      
      const output: TerraformOutput = {
        name,
        value: this.extractValue(block, 'value') || ''
      };

      const description = this.extractValue(block, 'description');
      if (description) {
        output.description = description.replace(/"/g, '');
      }

      if (block.includes('sensitive = true')) {
        output.sensitive = true;
      }

      outputs.push(output);
    }

    return outputs;
  }

  /**
   * Extract security group rules from configuration
   */
  public static extractSecurityGroupRules(content: string, sgName: string): SecurityGroupRule[] {
    const rules: SecurityGroupRule[] = [];
    const sgPattern = new RegExp(`resource\\s+"aws_security_group"\\s+"${sgName}"\\s*{([^}]*(?:{[^}]*}[^}]*)*)}`);
    const sgMatch = sgPattern.exec(content);
    
    if (!sgMatch) return rules;
    
    const sgBlock = sgMatch[1];
    
    // Extract ingress rules
    const ingressPattern = /ingress\s*{([^}]*)}/g;
    let match;
    while ((match = ingressPattern.exec(sgBlock)) !== null) {
      const ruleBlock = match[1];
      const rule: SecurityGroupRule = {
        type: 'ingress',
        fromPort: parseInt(this.extractValue(ruleBlock, 'from_port') || '0'),
        toPort: parseInt(this.extractValue(ruleBlock, 'to_port') || '0'),
        protocol: this.extractValue(ruleBlock, 'protocol')?.replace(/"/g, '') || 'tcp'
      };

      const cidrBlocks = this.extractArray(ruleBlock, 'cidr_blocks');
      if (cidrBlocks.length > 0) {
        rule.cidrBlocks = cidrBlocks;
      }

      const securityGroups = this.extractArray(ruleBlock, 'security_groups');
      if (securityGroups.length > 0) {
        rule.securityGroups = securityGroups;
      }

      rules.push(rule);
    }

    // Extract egress rules
    const egressPattern = /egress\s*{([^}]*)}/g;
    while ((match = egressPattern.exec(sgBlock)) !== null) {
      const ruleBlock = match[1];
      const rule: SecurityGroupRule = {
        type: 'egress',
        fromPort: parseInt(this.extractValue(ruleBlock, 'from_port') || '0'),
        toPort: parseInt(this.extractValue(ruleBlock, 'to_port') || '0'),
        protocol: this.extractValue(ruleBlock, 'protocol')?.replace(/"/g, '') || '-1'
      };

      const cidrBlocks = this.extractArray(ruleBlock, 'cidr_blocks');
      if (cidrBlocks.length > 0) {
        rule.cidrBlocks = cidrBlocks;
      }

      rules.push(rule);
    }

    return rules;
  }

  /**
   * Generate environment-specific tfvars content
   */
  public static generateTfvars(environment: string, suffix: string): string {
    const configs: { [key: string]: any } = {
      development: {
        vpc_cidr: '10.0.0.0/16',
        public_subnet_cidrs: ['10.0.1.0/24', '10.0.2.0/24'],
        private_subnet_cidrs: ['10.0.11.0/24', '10.0.12.0/24'],
        instance_type: 't3.micro',
        db_instance_class: 'db.t3.micro',
        enable_multi_az: false,
        enable_deletion_protection: false
      },
      staging: {
        vpc_cidr: '10.1.0.0/16',
        public_subnet_cidrs: ['10.1.1.0/24', '10.1.2.0/24'],
        private_subnet_cidrs: ['10.1.11.0/24', '10.1.12.0/24'],
        instance_type: 't3.small',
        db_instance_class: 'db.t3.small',
        enable_multi_az: true,
        enable_deletion_protection: false
      },
      production: {
        vpc_cidr: '10.2.0.0/16',
        public_subnet_cidrs: ['10.2.1.0/24', '10.2.2.0/24', '10.2.3.0/24'],
        private_subnet_cidrs: ['10.2.11.0/24', '10.2.12.0/24', '10.2.13.0/24'],
        instance_type: 't3.medium',
        db_instance_class: 'db.t3.medium',
        enable_multi_az: true,
        enable_deletion_protection: false  // Always false for testing
      }
    };

    const config = configs[environment] || configs.development;
    
    let tfvars = `# terraform.tfvars for ${environment} environment\n\n`;
    tfvars += `environment = "${environment}"\n`;
    tfvars += `environment_suffix = "${suffix}"\n\n`;
    
    tfvars += `# Network configuration\n`;
    tfvars += `vpc_cidr = "${config.vpc_cidr}"\n`;
    tfvars += `public_subnet_cidrs = ${JSON.stringify(config.public_subnet_cidrs)}\n`;
    tfvars += `private_subnet_cidrs = ${JSON.stringify(config.private_subnet_cidrs)}\n\n`;
    
    tfvars += `# Instance configuration\n`;
    tfvars += `instance_type = "${config.instance_type}"\n`;
    tfvars += `db_instance_class = "${config.db_instance_class}"\n\n`;
    
    tfvars += `# High availability\n`;
    tfvars += `enable_multi_az = ${config.enable_multi_az}\n`;
    tfvars += `enable_deletion_protection = ${config.enable_deletion_protection}\n`;
    
    return tfvars;
  }

  /**
   * Validate tag strategy compliance
   */
  public static validateTagStrategy(tags: TagStrategy): boolean {
    const requiredTags = ['Environment', 'Project', 'ManagedBy', 'Owner', 'EnvironmentSuffix'];
    
    for (const tag of requiredTags) {
      if (!tags[tag as keyof TagStrategy]) {
        return false;
      }
    }
    
    return tags.ManagedBy === 'terraform';
  }

  /**
   * Calculate estimated monthly costs
   */
  public static calculateEstimatedCosts(environment: string): { [key: string]: number } {
    const costs = {
      development: {
        ec2_instances: 30,
        rds_instance: 50,
        alb: 0,
        nat_gateway: 0,
        total_estimated: 80
      },
      staging: {
        ec2_instances: 60,
        rds_instance: 100,
        alb: 20,
        nat_gateway: 45,
        total_estimated: 225
      },
      production: {
        ec2_instances: 150,
        rds_instance: 200,
        alb: 20,
        nat_gateway: 45,
        total_estimated: 415
      }
    };

    return costs[environment] || costs.development;
  }

  /**
   * Generate resource naming based on prefix and suffix
   */
  public static generateResourceName(prefix: string, suffix: string, resourceType: string): string {
    return `${prefix}-${suffix}-${resourceType}`;
  }

  /**
   * Validate CIDR block format
   */
  public static isValidCidr(cidr: string): boolean {
    const cidrPattern = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
    if (!cidrPattern.test(cidr)) return false;
    
    const [ip, mask] = cidr.split('/');
    const octets = ip.split('.').map(Number);
    const maskNum = Number(mask);
    
    return octets.every(octet => octet >= 0 && octet <= 255) && maskNum >= 0 && maskNum <= 32;
  }

  /**
   * Check if a resource supports deletion protection
   */
  public static supportsDeletionProtection(resourceType: string): boolean {
    const supportedTypes = [
      'aws_db_instance',
      'aws_lb',
      'aws_elasticache_cluster',
      'aws_elasticsearch_domain'
    ];
    
    return supportedTypes.includes(resourceType);
  }

  /**
   * Generate backend configuration for Terraform
   */
  public static generateBackendConfig(bucket: string, key: string, region: string): string {
    return `terraform {
  backend "s3" {
    bucket = "${bucket}"
    key    = "${key}"
    region = "${region}"
    encrypt = true
  }
}`;
  }

  // Helper methods
  private static extractValue(block: string, key: string): string | undefined {
    const pattern = new RegExp(`${key}\\s*=\\s*([^\\n]+)`);
    const match = pattern.exec(block);
    return match ? match[1].trim() : undefined;
  }

  private static extractBlock(content: string, blockName: string): string | undefined {
    const pattern = new RegExp(`${blockName}\\s*{([^}]*)}`);
    const match = pattern.exec(content);
    return match ? match[1] : undefined;
  }

  private static extractArray(block: string, key: string): string[] {
    const pattern = new RegExp(`${key}\\s*=\\s*\\[([^\\]]*)\\]`);
    const match = pattern.exec(block);
    if (!match) return [];
    
    return match[1]
      .split(',')
      .map(item => item.trim().replace(/"/g, ''))
      .filter(item => item.length > 0);
  }

  private static parseDefaultValue(value: string): any {
    value = value.trim();
    
    if (value === 'true' || value === 'false') {
      return value === 'true';
    }
    
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }
    
    if (value.startsWith('[') && value.endsWith(']')) {
      return this.extractArray(`dummy = ${value}`, 'dummy');
    }
    
    if (!isNaN(Number(value))) {
      return Number(value);
    }
    
    return value;
  }
}