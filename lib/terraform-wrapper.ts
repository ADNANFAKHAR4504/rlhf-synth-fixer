import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Terraform Infrastructure Wrapper for Testing
 * Provides utilities for validating and testing Terraform configurations
 */
export class TerraformInfrastructure {
  private libPath: string;
  private terraformFiles: Map<string, string>;

  constructor(libPath?: string) {
    this.libPath = libPath || path.join(__dirname);
    this.terraformFiles = new Map();
    this.loadTerraformFiles();
  }

  /**
   * Load all Terraform files from the lib directory
   */
  private loadTerraformFiles(): void {
    const tfFiles = ['main.tf', 'variables.tf', 'outputs.tf', 'provider.tf'];
    tfFiles.forEach(file => {
      const filePath = path.join(this.libPath, file);
      if (fs.existsSync(filePath)) {
        this.terraformFiles.set(file, fs.readFileSync(filePath, 'utf8'));
      }
    });
  }

  /**
   * Get content of a specific Terraform file
   */
  public getFileContent(fileName: string): string | undefined {
    return this.terraformFiles.get(fileName);
  }

  /**
   * Check if a resource exists in the configuration
   */
  public hasResource(resourceType: string, resourceName: string): boolean {
    const mainContent = this.getFileContent('main.tf');
    if (!mainContent) return false;

    const resourcePattern = new RegExp(
      `resource\\s+"${resourceType}"\\s+"${resourceName}"`,
      's'
    );
    return resourcePattern.test(mainContent);
  }

  /**
   * Check if a variable is defined
   */
  public hasVariable(varName: string): boolean {
    const variablesContent = this.getFileContent('variables.tf');
    if (!variablesContent) return false;

    return variablesContent.includes(`variable "${varName}"`);
  }

  /**
   * Check if an output is defined
   */
  public hasOutput(outputName: string): boolean {
    const outputsContent = this.getFileContent('outputs.tf');
    if (!outputsContent) return false;

    return outputsContent.includes(`output "${outputName}"`);
  }

  /**
   * Validate Terraform configuration
   */
  public validateConfiguration(): { valid: boolean; message: string } {
    try {
      // Try to initialize terraform first
      try {
        execSync('terraform init -reconfigure', {
          cwd: this.libPath,
          encoding: 'utf8',
          stdio: 'pipe',
        });
      } catch (initError) {
        return {
          valid: false,
          message: `Terraform init failed: ${initError instanceof Error ? initError.message : 'Unknown init error'}`,
        };
      }

      const result = execSync('terraform validate', {
        cwd: this.libPath,
        encoding: 'utf8',
      });
      return {
        valid: result.includes('Success'),
        message: result,
      };
    } catch (error) {
      return {
        valid: false,
        message: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }

  /**
   * Check Terraform formatting
   */
  public checkFormatting(): boolean {
    try {
      // Try to initialize terraform first
      try {
        execSync('terraform init -reconfigure', {
          cwd: this.libPath,
          encoding: 'utf8',
          stdio: 'pipe',
        });
      } catch (initError) {
        // If init fails, we can still try formatting check as it doesn't require providers
        console.warn(
          'Terraform init failed, attempting formatting check anyway'
        );
      }

      execSync('terraform fmt -check', {
        cwd: this.libPath,
        encoding: 'utf8',
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all resources of a specific type
   */
  public getResourcesOfType(resourceType: string): string[] {
    const mainContent = this.getFileContent('main.tf');
    if (!mainContent) return [];

    const resourcePattern = new RegExp(
      `resource\\s+"${resourceType}"\\s+"([^"]+)"`,
      'g'
    );
    const matches = Array.from(mainContent.matchAll(resourcePattern));
    return matches.map(match => match[1]);
  }

  /**
   * Check if resource has specific configuration
   */
  public resourceHasConfig(
    resourceType: string,
    resourceName: string,
    config: string
  ): boolean {
    const mainContent = this.getFileContent('main.tf');
    if (!mainContent) return false;

    // First find the resource block
    const resourceStart = mainContent.indexOf(
      `resource "${resourceType}" "${resourceName}"`
    );
    if (resourceStart === -1) return false;

    // Find the end of this resource block by counting braces
    let braceCount = 0;
    let inResourceBlock = false;
    let resourceEnd = resourceStart;

    for (let i = resourceStart; i < mainContent.length; i++) {
      if (mainContent[i] === '{') {
        braceCount++;
        inResourceBlock = true;
      } else if (mainContent[i] === '}') {
        braceCount--;
        if (inResourceBlock && braceCount === 0) {
          resourceEnd = i;
          break;
        }
      }
    }

    // Extract the resource block content
    const resourceBlock = mainContent.substring(resourceStart, resourceEnd + 1);

    // Check if the config exists in this block
    return resourceBlock.includes(config);
  }

  /**
   * Get all defined variables
   */
  public getAllVariables(): string[] {
    const variablesContent = this.getFileContent('variables.tf');
    if (!variablesContent) return [];

    const varPattern = /variable\s+"([^"]+)"/g;
    const matches = Array.from(variablesContent.matchAll(varPattern));
    return matches.map(match => match[1]);
  }

  /**
   * Get all defined outputs
   */
  public getAllOutputs(): string[] {
    const outputsContent = this.getFileContent('outputs.tf');
    if (!outputsContent) return [];

    const outputPattern = /output\s+"([^"]+)"/g;
    const matches = Array.from(outputsContent.matchAll(outputPattern));
    return matches.map(match => match[1]);
  }

  /**
   * Check if configuration uses locals
   */
  public usesLocals(): boolean {
    const mainContent = this.getFileContent('main.tf');
    if (!mainContent) return false;

    return mainContent.includes('locals {');
  }

  /**
   * Check if resource has tags
   */
  public resourceHasTags(resourceType: string, resourceName: string): boolean {
    return this.resourceHasConfig(resourceType, resourceName, 'tags');
  }

  /**
   * Count resources with specific tag
   */
  public countResourcesWithTag(tagKey: string, tagValue?: string): number {
    const mainContent = this.getFileContent('main.tf');
    if (!mainContent) return 0;

    const pattern = tagValue
      ? new RegExp(`${tagKey}\\s*=\\s*"${tagValue}"`, 'g')
      : new RegExp(`${tagKey}\\s*=`, 'g');

    const matches = mainContent.match(pattern);
    return matches ? matches.length : 0;
  }

  /**
   * Check security configurations
   */
  public hasSecurityFeature(feature: string): boolean {
    const mainContent = this.getFileContent('main.tf');
    if (!mainContent) return false;

    const securityFeatures: { [key: string]: string } = {
      encryption: 'encryption|encrypted|kms',
      versioning: 'versioning',
      logging: 'logging|log',
      monitoring: 'cloudwatch|metric|alarm',
      public_access_block: 'public_access_block',
      least_privilege: 'least privilege',
    };

    const pattern = securityFeatures[feature];
    if (!pattern) return false;

    return new RegExp(pattern, 'i').test(mainContent);
  }

  /**
   * Get environment suffix configuration
   */
  public getEnvironmentSuffixUsage(): number {
    const allContent = Array.from(this.terraformFiles.values()).join('\n');
    const matches = allContent.match(/\$\{local\.name_prefix\}/g);
    return matches ? matches.length : 0;
  }

  /**
   * Validate compliance with requirements
   */
  public validateCompliance(): { compliant: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for corp prefix
    if (!this.hasVariable('project_name')) {
      issues.push('Missing project_name variable');
    }

    // Check for environment suffix
    if (!this.hasVariable('environment_suffix')) {
      issues.push('Missing environment_suffix variable');
    }

    // Check for S3 buckets
    const s3Buckets = this.getResourcesOfType('aws_s3_bucket');
    if (s3Buckets.length < 2) {
      issues.push('Should have at least 2 S3 buckets (main and logs)');
    }

    // Check for encryption
    if (!this.hasResource('aws_kms_key', 's3_key')) {
      issues.push('Missing KMS key for encryption');
    }

    // Check for IAM roles
    const iamRoles = this.getResourcesOfType('aws_iam_role');
    if (iamRoles.length === 0) {
      issues.push('No IAM roles defined');
    }

    // Check for CloudTrail
    if (!this.getResourcesOfType('aws_cloudtrail').length) {
      issues.push('CloudTrail not configured');
    }

    // Check for CloudWatch alarms
    if (!this.getResourcesOfType('aws_cloudwatch_metric_alarm').length) {
      issues.push('No CloudWatch alarms configured');
    }

    return {
      compliant: issues.length === 0,
      issues,
    };
  }
}

// Export utility functions for direct use
export function validateTerraformConfig(libPath?: string): boolean {
  const tf = new TerraformInfrastructure(libPath);
  return tf.validateConfiguration().valid;
}

export function checkTerraformFormatting(libPath?: string): boolean {
  const tf = new TerraformInfrastructure(libPath);
  return tf.checkFormatting();
}

export function validateCompliance(libPath?: string): {
  compliant: boolean;
  issues: string[];
} {
  const tf = new TerraformInfrastructure(libPath);
  return tf.validateCompliance();
}
