// Terraform configuration validator
// This utility provides functions to validate Terraform HCL configurations

import fs from "fs";
import path from "path";

export interface TerraformResource {
  type: string;
  name: string;
  attributes: Record<string, any>;
}

export interface TerraformVariable {
  name: string;
  type?: string;
  description?: string;
  default?: any;
}

export interface TerraformOutput {
  name: string;
  description?: string;
  value: string;
}

export class TerraformValidator {
  private content: string;

  constructor(filePath: string) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    this.content = fs.readFileSync(filePath, "utf8");
  }

  /**
   * Check if a resource type exists in the configuration
   */
  hasResource(resourceType: string, resourceName?: string): boolean {
    if (resourceName) {
      const pattern = new RegExp(
        `resource\\s+"${resourceType}"\\s+"${resourceName}"\\s*\\{`,
        "m"
      );
      return pattern.test(this.content);
    }
    const pattern = new RegExp(`resource\\s+"${resourceType}"`, "m");
    return pattern.test(this.content);
  }

  /**
   * Check if a variable is declared
   */
  hasVariable(variableName: string): boolean {
    const pattern = new RegExp(`variable\\s+"${variableName}"\\s*\\{`, "m");
    return pattern.test(this.content);
  }

  /**
   * Check if an output is declared
   */
  hasOutput(outputName: string): boolean {
    const pattern = new RegExp(`output\\s+"${outputName}"\\s*\\{`, "m");
    return pattern.test(this.content);
  }

  /**
   * Check if a data source exists
   */
  hasDataSource(dataType: string, dataName?: string): boolean {
    if (dataName) {
      const pattern = new RegExp(
        `data\\s+"${dataType}"\\s+"${dataName}"\\s*\\{`,
        "m"
      );
      return pattern.test(this.content);
    }
    const pattern = new RegExp(`data\\s+"${dataType}"`, "m");
    return pattern.test(this.content);
  }

  /**
   * Check if provider is declared
   */
  hasProvider(providerName: string): boolean {
    const pattern = new RegExp(`provider\\s+"${providerName}"\\s*\\{`, "m");
    return pattern.test(this.content);
  }

  /**
   * Get all resources matching a type
   */
  getResourcesByType(resourceType: string): string[] {
    const pattern = new RegExp(
      `resource\\s+"${resourceType}"\\s+"([^"]+)"`,
      "g"
    );
    const matches: string[] = [];
    let match;
    while ((match = pattern.exec(this.content)) !== null) {
      matches.push(match[1]);
    }
    return matches;
  }

  /**
   * Count occurrences of a pattern
   */
  countPattern(pattern: RegExp): number {
    const matches = this.content.match(pattern);
    return matches ? matches.length : 0;
  }

  /**
   * Check if a resource attribute contains a value
   */
  resourceHasAttribute(
    resourceType: string,
    resourceName: string,
    attributeName: string,
    expectedValue?: any
  ): boolean {
    const resourcePattern = new RegExp(
      `resource\\s+"${resourceType}"\\s+"${resourceName}"\\s*\\{([\\s\\S]*?)\\n\\}`,
      "m"
    );
    const resourceMatch = this.content.match(resourcePattern);
    if (!resourceMatch) {
      return false;
    }

    const resourceBlock = resourceMatch[1];
    const attributePattern = new RegExp(`${attributeName}\\s*=`, "m");
    if (!attributePattern.test(resourceBlock)) {
      return false;
    }

    if (expectedValue !== undefined) {
      const valuePattern = new RegExp(
        `${attributeName}\\s*=\\s*${expectedValue}`,
        "m"
      );
      return valuePattern.test(resourceBlock);
    }

    return true;
  }

  /**
   * Check if resources use environment_suffix variable
   */
  hasEnvironmentSuffixInNames(): boolean {
    return this.content.includes("${var.environment_suffix}");
  }

  /**
   * Check if resources have tags
   */
  hasTagsWithKey(tagKey: string): boolean {
    const pattern = new RegExp(
      `tags\\s*=\\s*\\{[\\s\\S]*?${tagKey}[\\s\\S]*?\\}`,
      "g"
    );
    return pattern.test(this.content);
  }

  /**
   * Validate KMS encryption is enabled
   */
  hasKMSEncryption(): boolean {
    return (
      this.content.includes("kms_key_id") ||
      this.content.includes("kms_master_key_id")
    );
  }

  /**
   * Get variable default value
   */
  getVariableDefault(variableName: string): string | null {
    const variablePattern = new RegExp(
      `variable\\s+"${variableName}"\\s*\\{([\\s\\S]*?)\\n\\}`,
      "m"
    );
    const match = this.content.match(variablePattern);
    if (!match) {
      return null;
    }

    const variableBlock = match[1];
    const defaultPattern = /default\s*=\s*"([^"]*)"/m;
    const defaultMatch = variableBlock.match(defaultPattern);
    return defaultMatch ? defaultMatch[1] : null;
  }

  /**
   * Check if output has description
   */
  outputHasDescription(outputName: string): boolean {
    const outputPattern = new RegExp(
      `output\\s+"${outputName}"\\s*\\{([\\s\\S]*?)\\n\\}`,
      "m"
    );
    const match = this.content.match(outputPattern);
    if (!match) {
      return false;
    }

    const outputBlock = match[1];
    return /description\s*=/m.test(outputBlock);
  }

  /**
   * Get raw content for custom checks
   */
  getContent(): string {
    return this.content;
  }
}

/**
 * Validate all Terraform files in lib directory
 */
export function validateTerraformProject(libDir: string): {
  hasMainTf: boolean;
  hasVariablesTf: boolean;
  hasOutputsTf: boolean;
  hasProviderTf: boolean;
} {
  return {
    hasMainTf: fs.existsSync(path.join(libDir, "main.tf")),
    hasVariablesTf: fs.existsSync(path.join(libDir, "variables.tf")),
    hasOutputsTf: fs.existsSync(path.join(libDir, "outputs.tf")),
    hasProviderTf: fs.existsSync(path.join(libDir, "provider.tf")),
  };
}
