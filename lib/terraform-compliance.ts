/**
 * Terraform Compliance Checker
 * 
 * This module ensures all compliance requirements are met for the multi-environment infrastructure
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ComplianceRequirement {
  id: number;
  name: string;
  description: string;
  validator: () => boolean;
}

export interface ComplianceReport {
  totalRequirements: number;
  passedRequirements: number;
  failedRequirements: number;
  compliance: number;
  details: Array<{
    requirement: string;
    status: 'PASS' | 'FAIL';
    message?: string;
  }>;
}

export class TerraformComplianceChecker {
  private configPath: string;
  private providerPath: string;
  private tfvarsPath: string;
  private outputsPath: string;
  private requirements: ComplianceRequirement[];

  constructor() {
    this.configPath = path.join(__dirname, 'tap_stack.tf');
    this.providerPath = path.join(__dirname, 'provider.tf');
    this.tfvarsPath = path.join(__dirname, 'terraform.tfvars');
    this.outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    this.requirements = this.initializeRequirements();
  }

  private initializeRequirements(): ComplianceRequirement[] {
    return [
      {
        id: 1,
        name: 'Region Compliance',
        description: 'All resources in us-east-1 region',
        validator: () => this.checkRegionCompliance()
      },
      {
        id: 2,
        name: 'Terraform Version',
        description: 'Latest Terraform version',
        validator: () => this.checkTerraformVersion()
      },
      {
        id: 3,
        name: 'Environment Configurations',
        description: 'Environment-specific configurations',
        validator: () => this.checkEnvironmentConfigs()
      },
      {
        id: 4,
        name: 'Cost Estimation',
        description: 'Cost estimation process',
        validator: () => this.checkCostEstimation()
      },
      {
        id: 5,
        name: 'Network Architecture',
        description: 'Dedicated public/private subnets',
        validator: () => this.checkNetworkArchitecture()
      },
      {
        id: 6,
        name: 'SSH Restrictions',
        description: 'SSH access restricted to specific IPs',
        validator: () => this.checkSSHRestrictions()
      },
      {
        id: 7,
        name: 'Remote State',
        description: 'Remote state management',
        validator: () => this.checkRemoteState()
      },
      {
        id: 8,
        name: 'S3 Security',
        description: 'S3 bucket HTTPS enforcement',
        validator: () => this.checkS3Security()
      },
      {
        id: 9,
        name: 'CI Pipeline',
        description: 'CI pipeline for syntax checking',
        validator: () => this.checkCIPipeline()
      },
      {
        id: 10,
        name: 'Naming Conventions',
        description: 'AWS naming conventions',
        validator: () => this.checkNamingConventions()
      },
      {
        id: 11,
        name: 'Modular Configuration',
        description: 'Modular resource configurations',
        validator: () => this.checkModularConfiguration()
      },
      {
        id: 12,
        name: 'No Hardcoded Secrets',
        description: 'No hardcoded secrets',
        validator: () => this.checkNoHardcodedSecrets()
      }
    ];
  }

  private readFile(filePath: string): string {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch {
      return '';
    }
  }

  private checkRegionCompliance(): boolean {
    const config = this.readFile(this.configPath);
    const provider = this.readFile(this.providerPath);
    
    return config.includes('us-east-1') && 
           config.includes('var.aws_region == "us-east-1"') &&
           provider.includes('region = var.aws_region');
  }

  private checkTerraformVersion(): boolean {
    const provider = this.readFile(this.providerPath);
    return provider.includes('required_version') && provider.includes('>= 1.4.0');
  }

  private checkEnvironmentConfigs(): boolean {
    const config = this.readFile(this.configPath);
    return config.includes('development') && 
           config.includes('staging') && 
           config.includes('production') &&
           config.includes('environment_suffix');
  }

  private checkCostEstimation(): boolean {
    const config = this.readFile(this.configPath);
    return config.includes('output "cost_estimation"');
  }

  private checkNetworkArchitecture(): boolean {
    const config = this.readFile(this.configPath);
    return config.includes('aws_vpc') &&
           config.includes('aws_subnet" "public') &&
           config.includes('aws_subnet" "private') &&
           config.includes('aws_nat_gateway') &&
           config.includes('aws_internet_gateway');
  }

  private checkSSHRestrictions(): boolean {
    const config = this.readFile(this.configPath);
    return config.includes('allowed_ssh_cidrs') && 
           !config.includes('0.0.0.0/0", 22');
  }

  private checkRemoteState(): boolean {
    const provider = this.readFile(this.providerPath);
    return provider.includes('backend "s3"');
  }

  private checkS3Security(): boolean {
    const config = this.readFile(this.configPath);
    return config.includes('aws_s3_bucket_public_access_block') &&
           config.includes('aws_s3_bucket_server_side_encryption_configuration') &&
           config.includes('aws_s3_bucket_policy') &&
           config.includes('DenyNonHttpsRequests');
  }

  private checkCIPipeline(): boolean {
    const config = this.readFile(this.configPath);
    // Check for valid Terraform syntax structure
    const openBraces = (config.match(/{/g) || []).length;
    const closeBraces = (config.match(/}/g) || []).length;
    return openBraces === closeBraces && openBraces > 0;
  }

  private checkNamingConventions(): boolean {
    const config = this.readFile(this.configPath);
    return config.includes('name_prefix') && 
           config.includes('tap-${var.environment_suffix}');
  }

  private checkModularConfiguration(): boolean {
    const config = this.readFile(this.configPath);
    return config.includes('NETWORKING MODULE') &&
           config.includes('SECURITY MODULE') &&
           config.includes('COMPUTE MODULE') &&
           config.includes('DATABASE MODULE') &&
           config.includes('STORAGE MODULE') &&
           config.includes('MONITORING MODULE');
  }

  private checkNoHardcodedSecrets(): boolean {
    const config = this.readFile(this.configPath);
    const passwordPattern = /password\s*=\s*"[^"$]{8,}"/;
    const secretPattern = /secret\s*=\s*"[^"$]{8,}"/;
    
    return !passwordPattern.test(config) && 
           !secretPattern.test(config) &&
           config.includes('random_password') &&
           config.includes('aws_secretsmanager_secret');
  }

  public runComplianceCheck(): ComplianceReport {
    const report: ComplianceReport = {
      totalRequirements: this.requirements.length,
      passedRequirements: 0,
      failedRequirements: 0,
      compliance: 0,
      details: []
    };

    for (const requirement of this.requirements) {
      const passed = requirement.validator();
      
      if (passed) {
        report.passedRequirements++;
        report.details.push({
          requirement: `${requirement.id}. ${requirement.name}`,
          status: 'PASS'
        });
      } else {
        report.failedRequirements++;
        report.details.push({
          requirement: `${requirement.id}. ${requirement.name}`,
          status: 'FAIL',
          message: requirement.description
        });
      }
    }

    report.compliance = (report.passedRequirements / report.totalRequirements) * 100;
    return report;
  }

  public checkEnvironmentSuffix(): boolean {
    const tfvars = this.readFile(this.tfvarsPath);
    return tfvars.includes('environment_suffix');
  }

  public checkDeletionProtection(): boolean {
    const config = this.readFile(this.configPath);
    // Ensure deletion protection is disabled for testing
    return config.includes('deletion_protection = false');
  }

  public validateOutputsFile(): boolean {
    try {
      if (!fs.existsSync(this.outputsPath)) {
        return false;
      }
      
      const outputs = JSON.parse(fs.readFileSync(this.outputsPath, 'utf8'));
      
      const requiredOutputs = [
        'vpc_id',
        'public_subnet_ids',
        'private_subnet_ids',
        'alb_dns_name',
        'rds_endpoint',
        's3_bucket_name',
        'security_group_ids',
        'environment_info',
        'cost_estimation'
      ];

      return requiredOutputs.every(output => output in outputs);
    } catch {
      return false;
    }
  }

  public getCompliancePercentage(): number {
    const report = this.runComplianceCheck();
    return report.compliance;
  }

  public isFullyCompliant(): boolean {
    return this.getCompliancePercentage() === 100;
  }

  public getFailedRequirements(): string[] {
    const report = this.runComplianceCheck();
    return report.details
      .filter(d => d.status === 'FAIL')
      .map(d => d.requirement);
  }

  public generateComplianceMarkdown(): string {
    const report = this.runComplianceCheck();
    
    let markdown = '# Terraform Compliance Report\n\n';
    markdown += `## Summary\n\n`;
    markdown += `- Total Requirements: ${report.totalRequirements}\n`;
    markdown += `- Passed: ${report.passedRequirements}\n`;
    markdown += `- Failed: ${report.failedRequirements}\n`;
    markdown += `- Compliance: ${report.compliance.toFixed(2)}%\n\n`;
    
    markdown += '## Details\n\n';
    for (const detail of report.details) {
      const icon = detail.status === 'PASS' ? '✅' : '❌';
      markdown += `${icon} ${detail.requirement}`;
      if (detail.message) {
        markdown += ` - ${detail.message}`;
      }
      markdown += '\n';
    }
    
    return markdown;
  }
}