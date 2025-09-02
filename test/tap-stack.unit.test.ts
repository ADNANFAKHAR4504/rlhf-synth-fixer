import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(5);
    });

    test('metadata section is optional but valid if present', () => {
      if (template.Metadata) {
        expect(typeof template.Metadata).toBe('object');
      }
    });
  });

  describe('Parameters', () => {
    test('should have at least one parameter', () => {
      expect(template.Parameters).toBeDefined();
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
    });
  });

  describe('Resources', () => {
    test('should have at least one resource', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('all resources should have a Type defined', () => {
      Object.values(template.Resources).forEach((resource: any) => {
        expect(resource.Type).toBeDefined();
      });
    });
  });

  describe('Outputs', () => {
    test('should have at least one output if Outputs section exists', () => {
      if (template.Outputs) {
        expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
      } else {
        console.warn('No Outputs section found in template — skipping test.');
      }
    });

    test('all outputs should have a description and export name if Outputs exist', () => {
      if (template.Outputs) {
        Object.entries(template.Outputs).forEach(([outputKey, output]: any) => {
          expect(output.Description).toBeDefined();
          expect(output.Value).toBeDefined();
          expect(output.Export).toBeDefined();
          expect(output.Export.Name).toBeDefined();
        });
      }
    });

    test('export names should follow naming convention if Outputs exist', () => {
      if (template.Outputs) {
        Object.entries(template.Outputs).forEach(([outputKey, output]: any) => {
          expect(output.Export.Name).toEqual({
            'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
          });
        });
      }
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('required sections should not be null', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      // Outputs are optional in CloudFormation, so don’t enforce non-null
    });
  });
});
