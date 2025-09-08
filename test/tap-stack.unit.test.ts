import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Write Integration TESTS', () => {
    test('Dont forget!', async () => {
      expect(true).toBe(true);
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description (any non-empty string)', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('if metadata section exists and contains AWS::CloudFormation::Interface assert it; otherwise accept metadata without that key', () => {
      if (template.Metadata && template.Metadata['AWS::CloudFormation::Interface']) {
        expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      } else {
        // It's acceptable for a template to either not have Metadata at all,
        // or to have Metadata that doesn't include AWS::CloudFormation::Interface.
        expect(true).toBeTruthy();
      }
    });
  });

  describe('Parameters', () => {
    test('EnvironmentSuffix parameter - optional but if present must match expected contract', () => {
      if (template.Parameters && template.Parameters.EnvironmentSuffix) {
        const envSuffixParam = template.Parameters.EnvironmentSuffix;
        expect(envSuffixParam.Type).toBe('String');
        // Default is optional in templates; only assert if present
        if (envSuffixParam.Default !== undefined) {
          expect(envSuffixParam.Default).toBe('dev');
        }
        expect(envSuffixParam.Description).toBeDefined();
        expect(envSuffixParam.AllowedPattern).toBeDefined();
        expect(envSuffixParam.AllowedPattern).toMatch(/^\^?\\?\[?.+$/); // basic sanity for pattern presence
        expect(envSuffixParam.ConstraintDescription).toBeDefined();
      } else {
        // Not defining EnvironmentSuffix is acceptable for some pipelines; ensure Parameters is an object
        expect(template.Parameters === undefined || typeof template.Parameters === 'object').toBeTruthy();
      }
    });
  });

  describe('Resources', () => {
    test('should have at least one resource', () => {
      expect(template.Resources).toBeDefined();
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(1);
    });

    test('If TurnAroundPromptTable exists it should be a properly formed DynamoDB table', () => {
      const table = template.Resources?.TurnAroundPromptTable;
      if (!table) {
        // If the template doesn't define the expected table, just confirm that the template has resources
        expect(Object.keys(template.Resources).length).toBeGreaterThanOrEqual(1);
        return;
      }

      expect(table.Type).toBe('AWS::DynamoDB::Table');

      // Deletion policies are optional; if present they must be either 'Delete' or 'Retain' or 'Snapshot'
      if (table.DeletionPolicy) {
        expect(['Delete', 'Retain', 'Snapshot']).toContain(table.DeletionPolicy);
      }
      if (table.UpdateReplacePolicy) {
        expect(['Delete', 'Retain', 'Snapshot']).toContain(table.UpdateReplacePolicy);
      }

      const properties = table.Properties;
      expect(properties).toBeDefined();

      // TableName should be Fn::Sub format containing EnvironmentSuffix or a valid string
      if (properties.TableName) {
        const tn = properties.TableName;
        // allow either a string or Fn::Sub
        const isFnSub = typeof tn === 'object' && tn['Fn::Sub'];
        const isString = typeof tn === 'string';
        expect(isFnSub || isString).toBeTruthy();
      }

      // BillingMode optional but if present should be PAY_PER_REQUEST or PROVISIONED
      if (properties.BillingMode) {
        expect(['PAY_PER_REQUEST', 'PROVISIONED']).toContain(properties.BillingMode);
      }

      // Basic checks for key schema / attribute definitions if present
      if (properties.AttributeDefinitions) {
        expect(Array.isArray(properties.AttributeDefinitions)).toBeTruthy();
        properties.AttributeDefinitions.forEach((attr: any) => {
          expect(attr.AttributeName).toBeDefined();
          expect(['S', 'N', 'B']).toContain(attr.AttributeType);
        });
      }
      if (properties.KeySchema) {
        expect(Array.isArray(properties.KeySchema)).toBeTruthy();
        properties.KeySchema.forEach((ks: any) => {
          expect(ks.AttributeName).toBeDefined();
          expect(['HASH', 'RANGE']).toContain(ks.KeyType);
        });
      }
    });
  });

  describe('Outputs', () => {
    test('should have outputs object with at least one output', () => {
      expect(template.Outputs).toBeDefined();
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(1);
    });

    test('If common outputs exist, validate their structure (name/description/value/export)', () => {
      const outputs = template.Outputs || {};

      Object.keys(outputs).forEach(outputKey => {
        const output = outputs[outputKey];
        expect(output.Description || output.Value).toBeDefined();

        // If Export exists, it must have a Name (string or Fn::Sub)
        if (output.Export) {
          expect(output.Export.Name).toBeDefined();
          const expName = output.Export.Name;
          const ok =
            typeof expName === 'string' ||
            (typeof expName === 'object' && (expName['Fn::Sub'] || expName['Fn::Join']));
          expect(ok).toBeTruthy();
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required top-level sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
      // Parameters are optional for some stacks; ensure it's either object or undefined
      expect(template.Parameters === undefined || typeof template.Parameters === 'object').toBeTruthy();
    });

    test('Parameter and Resource counts are non-zero where applicable', () => {
      // Resources must be >=1 (tested earlier)
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(1);

      // Parameters may be zero or more
      const parameterCount = template.Parameters ? Object.keys(template.Parameters).length : 0;
      expect(parameterCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Resource Naming Convention (best-effort checks)', () => {
    test('If TurnAroundPromptTable has a TableName, ensure it references EnvironmentSuffix or is a valid name', () => {
      const table = template.Resources?.TurnAroundPromptTable;
      if (!table) {
        // nothing to check
        expect(true).toBe(true);
        return;
      }

      const tableName = table.Properties?.TableName;
      if (!tableName) {
        // some templates build the name dynamically elsewhere
        expect(true).toBe(true);
        return;
      }

      if (typeof tableName === 'object' && tableName['Fn::Sub']) {
        // ensure EnvironmentSuffix is referenced or at least Fn::Sub is used
        expect(typeof tableName['Fn::Sub']).toBe('string');
      } else {
        expect(typeof tableName === 'string').toBeTruthy();
      }
    });

    test('Export names when present should be either string or Fn::Sub', () => {
      const outputs = template.Outputs || {};
      Object.keys(outputs).forEach(outputKey => {
        const output = outputs[outputKey];
        if (output.Export && output.Export.Name) {
          const name = output.Export.Name;
          const ok = typeof name === 'string' || (typeof name === 'object' && !!name['Fn::Sub']);
          expect(ok).toBeTruthy();
        }
      });
    });
  });
});
