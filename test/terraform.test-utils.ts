// tests/utils/terraform-test-utils.ts
// Utility functions for Terraform testing

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export interface TerraformPlan {
  planned_values?: {
    root_module?: {
      resources?: Array<{
        type: string;
        name: string;
        values: Record<string, any>;
      }>;
    };
  };
  configuration?: {
    root_module?: {
      resources?: Array<{
        type: string;
        name: string;
        expressions?: Record<string, any>;
      }>;
    };
  };
}

export class TerraformTestHelper {
  private tfDir: string;

  constructor(terraformDirectory: string) {
    this.tfDir = terraformDirectory;
  }

  /**
   * Initialize Terraform without backend
   */
  init(options: { backend?: boolean } = {}): void {
    const backendFlag = options.backend === false ? "-backend=false" : "";
    execSync(`terraform init ${backendFlag}`, {
      stdio: "pipe",
      cwd: this.tfDir
    });
  }

  /**
   * Validate Terraform configuration
   */
  validate(): boolean {
    try {
      execSync("terraform validate", {
        stdio: "pipe",
        cwd: this.tfDir
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Format check Terraform files
   */
  formatCheck(): boolean {
    try {
      execSync("terraform fmt -check -recursive", {
        stdio: "pipe",
        cwd: this.tfDir
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Generate and return Terraform plan
   */
  plan(options: { 
    vars?: Record<string, string>; 
    workspace?: string;
    outputFile?: string;
  } = {}): TerraformPlan {
    let command = "terraform plan";
    
    if (options.vars) {
      const varFlags = Object.entries(options.vars)
        .map(([key, value]) => `-var="${key}=${value}"`)
        .join(" ");
      command += ` ${varFlags}`;
    }

    const outputFile = options.outputFile || "test-plan";
    command += ` -out=${outputFile}`;

    if (options.workspace) {
      this.selectWorkspace(options.workspace);
    }

    execSync(command, {
      stdio: "pipe",
      cwd: this.tfDir
    });

    const jsonOutput = execSync(`terraform show -json ${outputFile}`, {
      encoding: "utf8",
      cwd: this.tfDir
    });

    return JSON.parse(jsonOutput);
  }

  /**
   * Create or select workspace
   */
  selectWorkspace(workspace: string): void {
    try {
      execSync(`terraform workspace new ${workspace}`, {
        stdio: "pipe",
        cwd: this.tfDir
      });
    } catch (e) {
      // Workspace might already exist
      execSync(`terraform workspace select ${workspace}`, {
        stdio: "pipe",
        cwd: this.tfDir
      });
    }
  }

  /**
   * Get current workspace
   */
  getCurrentWorkspace(): string {
    return execSync("terraform workspace show", {
      encoding: "utf8",
      cwd: this.tfDir
    }).trim();
  }

  /**
   * Run Conftest policy validation
   */
  runConftest(policyFile: string, planFile: string): boolean {
    try {
      execSync(`conftest test --policy ${policyFile} ${planFile}`, {
        stdio: "pipe",
        cwd: this.tfDir
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get resources of specific type from plan
   */
  getResourcesOfType(plan: TerraformPlan, resourceType: string): any[] {
    return plan.planned_values?.root_module?.resources?.filter(
      r => r.type === resourceType
    ) || [];
  }

  /**
   * Check if resource exists in plan
   */
  hasResource(plan: TerraformPlan, resourceType: string, resourceName?: string): boolean {
    const resources = this.getResourcesOfType(plan, resourceType);
    if (resourceName) {
      return resources.some(r => r.name === resourceName);
    }
    return resources.length > 0;
  }

  /**
   * Get all security groups from plan
   */
  getSecurityGroups(plan: TerraformPlan): any[] {
    return this.getResourcesOfType(plan, "aws_security_group");
  }

  /**
   * Get all EC2 instances from plan
   */
  getEC2Instances(plan: TerraformPlan): any[] {
    return this.getResourcesOfType(plan, "aws_instance");
  }

  /**
   * Get all RDS instances from plan
   */
  getRDSInstances(plan: TerraformPlan): any[] {
    return this.getResourcesOfType(plan, "aws_db_instance");
  }

  /**
   * Validate that all resources have required tags
   */
  validateResourceTags(plan: TerraformPlan, requiredTags: string[]): {
    valid: boolean;
    violations: Array<{ resource: string; missingTags: string[] }>;
  } {
    const violations: Array<{ resource: string; missingTags: string[] }> = [];
    const resources = plan.planned_values?.root_module?.resources || [];

    // Filter out resources that don't typically have tags
    const taggedResources = resources.filter(r => 
      !["random_id", "local_file", "data"].includes(r.type) &&
      !r.type.startsWith("aws_route_table_association") &&
      !r.type.startsWith("aws_iam_role_policy_attachment")
    );

    taggedResources.forEach(resource => {
      const tags = resource.values.tags || {};
      const missingTags = requiredTags.filter(tag => !tags.hasOwnProperty(tag));
      
      if (missingTags.length > 0) {
        violations.push({
          resource: `${resource.type}.${resource.name}`,
          missingTags
        });
      }
    });

    return {
      valid: violations.length === 0,
      violations
    };
  }

  /**
   * Check security group ingress rules
   */
  validateSecurityGroupRules(plan: TerraformPlan): {
    valid: boolean;
    violations: Array<{ resource: string; issue: string }>;
  } {
    const violations: Array<{ resource: string; issue: string }> = [];
    const securityGroups = this.getSecurityGroups(plan);

    securityGroups.forEach(sg => {
      const ingressRules = sg.values.ingress || [];
      
      // Check public security groups
      if (sg.name.includes("public")) {
        ingressRules.forEach((rule: any) => {
          const allowedPorts = [22, 80];
          if (!allowedPorts.includes(rule.from_port) || !allowedPorts.includes(rule.to_port)) {
            violations.push({
              resource: `aws_security_group.${sg.name}`,
              issue: `Public security group allows port ${rule.from_port}-${rule.to_port}, only 22 and 80 are allowed`
            });
          }
        });
      }

      // Check SSH access
      ingressRules.forEach((rule: any) => {
        if (rule.from_port === 22 && rule.cidr_blocks?.includes("0.0.0.0/0")) {
          violations.push({
            resource: `aws_security_group.${sg.name}`,
            issue: "SSH access (port 22) is open to 0.0.0.0/0"
          });
        }
      });
    });

    return {
      valid: violations.length === 0,
      violations
    };
  }

  /**
   * Validate encryption settings
   */
  validateEncryption(plan: TerraformPlan): {
    valid: boolean;
    violations: Array<{ resource: string; issue: string }>;
  } {
    const violations: Array<{ resource: string; issue: string }> = [];

    // Check EBS encryption
    const ec2Instances = this.getEC2Instances(plan);
    ec2Instances.forEach(instance => {
      const rootBlockDevice = instance.values.root_block_device?.[0];
      if (rootBlockDevice && !rootBlockDevice.encrypted) {
        violations.push({
          resource: `aws_instance.${instance.name}`,
          issue: "Root EBS volume is not encrypted"
        });
      }
    });

    // Check RDS encryption
    const rdsInstances = this.getRDSInstances(plan);
    rdsInstances.forEach(instance => {
      if (!instance.values.storage_encrypted) {
        violations.push({
          resource: `aws_db_instance.${instance.name}`,
          issue: "RDS storage is not encrypted"
        });
      }
    });

    return {
      valid: violations.length === 0,
      violations
    };
  }

  /**
   * Clean up test files
   */
  cleanup(files: string[]): void {
    files.forEach(file => {
      const filePath = path.join(this.tfDir, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  }
}

/**
 * Common test data and constants
 */
export const TestConstants = {
  REQUIRED_TAGS: ["Project"],
  ALLOWED_INSTANCE_TYPES: ["t2.micro"],
  ALLOWED_PUBLIC_PORTS: [22, 80],
  REQUIRED_OUTPUTS: [
    "vpc_id",
    "website_bucket_name",
    "website_url", 
    "web_instance_ids",
    "rds_endpoint",
    "sns_topic_arn",
    "lambda_function_name"
  ],
  REQUIRED_RESOURCES: [
    "aws_vpc",
    "aws_subnet",
    "aws_security_group", 
    "aws_instance",
    "aws_db_instance",
    "aws_s3_bucket",
    "aws_lambda_function",
    "aws_cloudwatch_metric_alarm",
    "aws_sns_topic"
  ]
};

/**
 * Mock data for testing policy violations
 */
export const MockViolations = {
  invalidInstanceType: {
    resource: {
      aws_instance: {
        test: {
          instance_type: "t3.large",
          root_block_device: [{ encrypted: true }]
        }
      }
    }
  },
  unencryptedEBS: {
    resource: {
      aws_instance: {
        test: {
          instance_type: "t2.micro", 
          root_block_device: [{ encrypted: false }]
        }
      }
    }
  },
  invalidSecurityGroup: {
    resource: {
      aws_security_group: {
        web_public: {
          ingress: [{
            from_port: 443,
            to_port: 443,
            protocol: "tcp",
            cidr_blocks: ["0.0.0.0/0"]
          }]
        }
      }
    }
  },
  httpSNS: {
    resource: {
      aws_sns_topic_subscription: {
        test: {
          protocol: "http",
          endpoint: "http://example.com"
        }
      }
    }
  }
};
