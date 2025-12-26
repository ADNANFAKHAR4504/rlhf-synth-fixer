import path from 'path';
import { CloudFormationTemplateValidator, validateTemplate } from '../lib/template-validator';

const templatePath = path.join(__dirname, '../lib/TapStack.json');

describe('CloudFormationTemplateValidator', () => {
  let validator: CloudFormationTemplateValidator;

  beforeEach(() => {
    validator = new CloudFormationTemplateValidator(templatePath);
  });

  describe('Constructor', () => {
    test('should successfully load and parse template', () => {
      expect(validator).toBeInstanceOf(CloudFormationTemplateValidator);
    });

    test('should throw error for non-existent file', () => {
      expect(() => {
        new CloudFormationTemplateValidator('/non/existent/path.json');
      }).toThrow();
    });
  });

  describe('validate', () => {
    test('should return valid result for correct template', () => {
      const result = validator.validate();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate all sections', () => {
      const result = validator.validate();

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
    });

    test('should aggregate errors from format version validation', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.AWSTemplateFormatVersion = undefined;

      const result = invalidValidator.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('Missing AWSTemplateFormatVersion'))).toBe(true);
    });

    test('should aggregate errors from resources validation', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Resources = undefined;

      const result = invalidValidator.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('Missing Resources section'))).toBe(true);
    });

    test('should aggregate errors from outputs validation', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Outputs = {
        InvalidOutput: { NoValue: 'test' },
      };

      const result = invalidValidator.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('Invalid output structure'))).toBe(true);
    });

    test('should aggregate errors from parameters validation', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Parameters = {
        InvalidParam: { NoType: 'value' },
      };

      const result = invalidValidator.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('Invalid parameter structure'))).toBe(true);
    });

    test('should aggregate warnings from all validations', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Outputs = undefined;
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Parameters = undefined;

      const result = invalidValidator.validate();

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings).toContain('No Outputs section defined');
      expect(result.warnings).toContain('No Parameters section defined');
    });
  });

  describe('validateFormatVersion', () => {
    test('should validate correct format version', () => {
      const result = validator.validateFormatVersion();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should return error for missing format version', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.AWSTemplateFormatVersion = undefined;

      const result = invalidValidator.validateFormatVersion();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing AWSTemplateFormatVersion');
    });

    test('should return error for invalid format version', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.AWSTemplateFormatVersion = '2000-01-01';

      const result = invalidValidator.validateFormatVersion();

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Invalid AWSTemplateFormatVersion');
    });
  });

  describe('validateResources', () => {
    test('should validate resources section', () => {
      const result = validator.validateResources();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should return error for missing resources section', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Resources = undefined;

      const result = invalidValidator.validateResources();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing Resources section');
    });

    test('should return error for empty resources section', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Resources = {};

      const result = invalidValidator.validateResources();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Resources section is empty');
    });

    test('should validate each resource structure', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Resources = {
        InvalidResource: { NoType: 'value' },
      };

      const result = invalidValidator.validateResources();

      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('Invalid resource structure'))).toBe(true);
    });
  });

  describe('validateOutputs', () => {
    test('should validate outputs section', () => {
      const result = validator.validateOutputs();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should return warning for missing outputs section', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Outputs = undefined;

      const result = invalidValidator.validateOutputs();

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('No Outputs section defined');
    });

    test('should return warning for empty outputs section', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Outputs = {};

      const result = invalidValidator.validateOutputs();

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Outputs section is empty');
    });

    test('should validate each output structure', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Outputs = {
        InvalidOutput: { NoValue: 'test' },
      };

      const result = invalidValidator.validateOutputs();

      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('Invalid output structure'))).toBe(true);
    });
  });

  describe('validateParameters', () => {
    test('should validate parameters section', () => {
      const result = validator.validateParameters();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should return warning for missing parameters section', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Parameters = undefined;

      const result = invalidValidator.validateParameters();

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('No Parameters section defined');
    });

    test('should return warning for empty parameters section', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Parameters = {};

      const result = invalidValidator.validateParameters();

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Parameters section is empty');
    });

    test('should validate each parameter structure', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Parameters = {
        InvalidParam: { NoType: 'value' },
      };

      const result = invalidValidator.validateParameters();

      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('Invalid parameter structure'))).toBe(true);
    });
  });

  describe('hasEnvironmentSuffix', () => {
    test('should detect environment suffix usage', () => {
      const result = validator.hasEnvironmentSuffix();

      expect(result).toBe(true);
    });

    test('should return false when no resources exist', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Resources = undefined;

      const result = invalidValidator.hasEnvironmentSuffix();

      expect(result).toBe(false);
    });

    test('should return false when environment suffix not used', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Resources = {
        MyResource: {
          Type: 'AWS::S3::Bucket',
          Properties: {
            BucketName: 'static-bucket-name',
          },
        },
      };

      const result = invalidValidator.hasEnvironmentSuffix();

      expect(result).toBe(false);
    });
  });

  describe('getResourceCount', () => {
    test('should return correct resource count', () => {
      const count = validator.getResourceCount();

      expect(count).toBe(1);
    });

    test('should return 0 when no resources exist', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Resources = undefined;

      const count = invalidValidator.getResourceCount();

      expect(count).toBe(0);
    });
  });

  describe('getOutputCount', () => {
    test('should return correct output count', () => {
      const count = validator.getOutputCount();

      expect(count).toBe(4);
    });

    test('should return 0 when no outputs exist', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Outputs = undefined;

      const count = invalidValidator.getOutputCount();

      expect(count).toBe(0);
    });
  });

  describe('getParameterCount', () => {
    test('should return correct parameter count', () => {
      const count = validator.getParameterCount();

      expect(count).toBe(1);
    });

    test('should return 0 when no parameters exist', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Parameters = undefined;

      const count = invalidValidator.getParameterCount();

      expect(count).toBe(0);
    });
  });

  describe('hasDeleteDeletionPolicy', () => {
    test('should detect Delete deletion policy', () => {
      const result = validator.hasDeleteDeletionPolicy();

      expect(result).toBe(true);
    });

    test('should return false when no resources exist', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Resources = undefined;

      const result = invalidValidator.hasDeleteDeletionPolicy();

      expect(result).toBe(false);
    });

    test('should return false when no Delete deletion policy exists', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Resources = {
        MyResource: {
          Type: 'AWS::S3::Bucket',
          DeletionPolicy: 'Retain',
        },
      };

      const result = invalidValidator.hasDeleteDeletionPolicy();

      expect(result).toBe(false);
    });

    test('should handle null resources in deletion policy check', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Resources = {
        NullResource: null,
      };

      const result = invalidValidator.hasDeleteDeletionPolicy();

      expect(result).toBe(false);
    });

    test('should handle non-object resources in deletion policy check', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Resources = {
        StringResource: 'not an object',
      };

      const result = invalidValidator.hasDeleteDeletionPolicy();

      expect(result).toBe(false);
    });
  });

  describe('Private helper methods edge cases', () => {
    test('isValidResource should handle null values', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Resources = {
        NullResource: null,
      };

      const result = invalidValidator.validateResources();

      expect(result.isValid).toBe(false);
    });

    test('isValidResource should handle non-object values', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Resources = {
        StringResource: 'not an object',
      };

      const result = invalidValidator.validateResources();

      expect(result.isValid).toBe(false);
    });

    test('isValidResource should require Type field', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Resources = {
        ResourceWithEmptyType: {
          Type: '',
        },
      };

      const result = invalidValidator.validateResources();

      expect(result.isValid).toBe(false);
    });

    test('isValidOutput should handle null values', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Outputs = {
        NullOutput: null,
      };

      const result = invalidValidator.validateOutputs();

      expect(result.isValid).toBe(false);
    });

    test('isValidOutput should handle non-object values', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Outputs = {
        StringOutput: 'not an object',
      };

      const result = invalidValidator.validateOutputs();

      expect(result.isValid).toBe(false);
    });

    test('isValidParameter should handle null values', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Parameters = {
        NullParam: null,
      };

      const result = invalidValidator.validateParameters();

      expect(result.isValid).toBe(false);
    });

    test('isValidParameter should handle non-object values', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Parameters = {
        StringParam: 'not an object',
      };

      const result = invalidValidator.validateParameters();

      expect(result.isValid).toBe(false);
    });

    test('isValidParameter should require Type field', () => {
      const invalidValidator = new CloudFormationTemplateValidator(templatePath);
      // @ts-ignore - accessing private property for testing
      invalidValidator.template.Parameters = {
        ParamWithEmptyType: {
          Type: '',
        },
      };

      const result = invalidValidator.validateParameters();

      expect(result.isValid).toBe(false);
    });
  });
});

describe('validateTemplate function', () => {
  test('should validate template using standalone function', () => {
    const result = validateTemplate(templatePath);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should return errors for invalid template', () => {
    expect(() => {
      validateTemplate('/non/existent/path.json');
    }).toThrow();
  });
});
