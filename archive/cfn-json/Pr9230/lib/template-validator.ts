import fs from 'fs';

/**
 * CloudFormation Template Validator
 * Validates the structure and content of CloudFormation templates
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TemplateStructure {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Metadata?: Record<string, unknown>;
  Parameters?: Record<string, unknown>;
  Resources?: Record<string, unknown>;
  Outputs?: Record<string, unknown>;
}

export class CloudFormationTemplateValidator {
  private template: TemplateStructure;

  constructor(templatePath: string) {
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    this.template = JSON.parse(templateContent);
  }

  /**
   * Validates the entire template structure
   */
  public validate(): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Validate format version
    const formatVersionResult = this.validateFormatVersion();
    if (!formatVersionResult.isValid) {
      result.isValid = false;
      result.errors.push(...formatVersionResult.errors);
    }
    result.warnings.push(...formatVersionResult.warnings);

    // Validate resources
    const resourcesResult = this.validateResources();
    if (!resourcesResult.isValid) {
      result.isValid = false;
      result.errors.push(...resourcesResult.errors);
    }
    result.warnings.push(...resourcesResult.warnings);

    // Validate outputs
    const outputsResult = this.validateOutputs();
    if (!outputsResult.isValid) {
      result.isValid = false;
      result.errors.push(...outputsResult.errors);
    }
    result.warnings.push(...outputsResult.warnings);

    // Validate parameters
    const parametersResult = this.validateParameters();
    if (!parametersResult.isValid) {
      result.isValid = false;
      result.errors.push(...parametersResult.errors);
    }
    result.warnings.push(...parametersResult.warnings);

    return result;
  }

  /**
   * Validates CloudFormation format version
   */
  public validateFormatVersion(): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    if (!this.template.AWSTemplateFormatVersion) {
      result.isValid = false;
      result.errors.push('Missing AWSTemplateFormatVersion');
      return result;
    }

    const validVersions = ['2010-09-09'];
    if (!validVersions.includes(this.template.AWSTemplateFormatVersion)) {
      result.isValid = false;
      result.errors.push(
        `Invalid AWSTemplateFormatVersion: ${this.template.AWSTemplateFormatVersion}`
      );
    }

    return result;
  }

  /**
   * Validates resources section
   */
  public validateResources(): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    if (!this.template.Resources) {
      result.isValid = false;
      result.errors.push('Missing Resources section');
      return result;
    }

    const resourceCount = Object.keys(this.template.Resources).length;
    if (resourceCount === 0) {
      result.isValid = false;
      result.errors.push('Resources section is empty');
      return result;
    }

    // Validate each resource
    for (const [resourceName, resource] of Object.entries(
      this.template.Resources
    )) {
      if (!this.isValidResource(resource)) {
        result.errors.push(`Invalid resource structure: ${resourceName}`);
        result.isValid = false;
      }
    }

    return result;
  }

  /**
   * Validates outputs section
   */
  public validateOutputs(): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    if (!this.template.Outputs) {
      result.warnings.push('No Outputs section defined');
      return result;
    }

    const outputCount = Object.keys(this.template.Outputs).length;
    if (outputCount === 0) {
      result.warnings.push('Outputs section is empty');
    }

    // Validate each output
    for (const [outputName, output] of Object.entries(this.template.Outputs)) {
      if (!this.isValidOutput(output)) {
        result.errors.push(`Invalid output structure: ${outputName}`);
        result.isValid = false;
      }
    }

    return result;
  }

  /**
   * Validates parameters section
   */
  public validateParameters(): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    if (!this.template.Parameters) {
      result.warnings.push('No Parameters section defined');
      return result;
    }

    const parameterCount = Object.keys(this.template.Parameters).length;
    if (parameterCount === 0) {
      result.warnings.push('Parameters section is empty');
    }

    // Validate each parameter
    for (const [paramName, param] of Object.entries(this.template.Parameters)) {
      if (!this.isValidParameter(param)) {
        result.errors.push(`Invalid parameter structure: ${paramName}`);
        result.isValid = false;
      }
    }

    return result;
  }

  /**
   * Checks if environment suffix is used in resource names
   */
  public hasEnvironmentSuffix(): boolean {
    if (!this.template.Resources) {
      return false;
    }

    let hasEnvironmentSuffix = false;

    for (const resource of Object.values(this.template.Resources)) {
      if (this.resourceUsesEnvironmentSuffix(resource)) {
        hasEnvironmentSuffix = true;
        break;
      }
    }

    return hasEnvironmentSuffix;
  }

  /**
   * Gets resource count
   */
  public getResourceCount(): number {
    return this.template.Resources
      ? Object.keys(this.template.Resources).length
      : 0;
  }

  /**
   * Gets output count
   */
  public getOutputCount(): number {
    return this.template.Outputs
      ? Object.keys(this.template.Outputs).length
      : 0;
  }

  /**
   * Gets parameter count
   */
  public getParameterCount(): number {
    return this.template.Parameters
      ? Object.keys(this.template.Parameters).length
      : 0;
  }

  /**
   * Checks if resource has deletion policy set to Delete
   */
  public hasDeleteDeletionPolicy(): boolean {
    if (!this.template.Resources) {
      return false;
    }

    for (const resource of Object.values(this.template.Resources)) {
      if (this.isResourceDestroyable(resource)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Private helper methods
   */
  private isValidResource(resource: unknown): boolean {
    if (typeof resource !== 'object' || resource === null) {
      return false;
    }

    const resourceObj = resource as Record<string, unknown>;
    return typeof resourceObj.Type === 'string' && resourceObj.Type.length > 0;
  }

  private isValidOutput(output: unknown): boolean {
    if (typeof output !== 'object' || output === null) {
      return false;
    }

    const outputObj = output as Record<string, unknown>;
    return outputObj.Value !== undefined;
  }

  private isValidParameter(param: unknown): boolean {
    if (typeof param !== 'object' || param === null) {
      return false;
    }

    const paramObj = param as Record<string, unknown>;
    return typeof paramObj.Type === 'string' && paramObj.Type.length > 0;
  }

  private resourceUsesEnvironmentSuffix(resource: unknown): boolean {
    const resourceStr = JSON.stringify(resource);
    return (
      resourceStr.includes('EnvironmentSuffix') ||
      resourceStr.includes('environmentSuffix')
    );
  }

  private isResourceDestroyable(resource: unknown): boolean {
    if (typeof resource !== 'object' || resource === null) {
      return false;
    }

    const resourceObj = resource as Record<string, unknown>;
    return resourceObj.DeletionPolicy === 'Delete';
  }
}

/**
 * Validates a CloudFormation template file
 */
export function validateTemplate(templatePath: string): ValidationResult {
  const validator = new CloudFormationTemplateValidator(templatePath);
  return validator.validate();
}
