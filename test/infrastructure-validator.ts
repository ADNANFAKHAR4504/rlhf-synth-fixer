export interface TerraformResource {
  type: string;
  name: string;
  attributes: Record<string, string | boolean | number>;
}

export class InfrastructureValidator {
  private content: string;

  constructor(content: string) {
    this.content = content;
  }

  /**
   * Check if a resource type exists in the configuration
   */
  hasResourceType(resourceType: string): boolean {
    const regex = new RegExp(
      `resource\\s+"${resourceType}"\\s+"[^"]+"\\s*{`,
      'g'
    );
    return regex.test(this.content);
  }

  /**
   * Count occurrences of a resource type
   */
  countResourceType(resourceType: string): number {
    const regex = new RegExp(
      `resource\\s+"${resourceType}"\\s+"[^"]+"\\s*{`,
      'g'
    );
    const matches = this.content.match(regex);
    return matches ? matches.length : 0;
  }

  /**
   * Check if a variable is declared
   */
  hasVariable(variableName: string): boolean {
    const regex = new RegExp(`variable\\s+"${variableName}"\\s*{`, 'g');
    return regex.test(this.content);
  }

  /**
   * Check if an output is declared
   */
  hasOutput(outputName: string): boolean {
    const regex = new RegExp(`output\\s+"${outputName}"\\s*{`, 'g');
    return regex.test(this.content);
  }

  /**
   * Validate multi-region setup
   */
  validateMultiRegion(regions: string[]): boolean {
    return regions.every(region => this.content.includes(region));
  }

  /**
   * Check for security best practices
   */
  validateSecurityPractices(): {
    hasEncryption: boolean;
    hasVersioning: boolean;
    hasPublicAccessBlock: boolean;
  } {
    return {
      hasEncryption: /encryption|kms_key_id/.test(this.content),
      hasVersioning: /versioning/.test(this.content),
      hasPublicAccessBlock: /public_access_block/.test(this.content),
    };
  }

  /**
   * Extract resource names by type
   */
  getResourceNames(resourceType: string): string[] {
    const regex = new RegExp(
      `resource\\s+"${resourceType}"\\s+"([^"]+)"\\s*{`,
      'g'
    );
    const names: string[] = [];
    let match;

    while ((match = regex.exec(this.content)) !== null) {
      names.push(match[1]);
    }

    return names;
  }
}

/**
 * Helper function to validate Terraform file structure
 */
export function validateTerraformStructure(content: string): {
  hasVariables: boolean;
  hasLocals: boolean;
  hasResources: boolean;
  hasOutputs: boolean;
  hasDataSources: boolean;
} {
  return {
    hasVariables: /variable\s+"[^"]+"\s*{/.test(content),
    hasLocals: /locals\s*{/.test(content),
    hasResources: /resource\s+"[^"]+"\s+"[^"]+"\s*{/.test(content),
    hasOutputs: /output\s+"[^"]+"\s*{/.test(content),
    hasDataSources: /data\s+"[^"]+"\s+"[^"]+"\s*{/.test(content),
  };
}

/**
 * Validate AWS provider configuration
 */
export function validateProviderConfiguration(content: string): {
  hasDefaultProvider: boolean;
  hasAliasProviders: boolean;
  hasVersionConstraints: boolean;
} {
  return {
    hasDefaultProvider: /provider\s+"aws"\s*{[^}]*region\s*=/.test(content),
    hasAliasProviders: /provider\s+"aws"\s*{[^}]*alias\s*=/.test(content),
    hasVersionConstraints: /required_version|required_providers/.test(content),
  };
}
