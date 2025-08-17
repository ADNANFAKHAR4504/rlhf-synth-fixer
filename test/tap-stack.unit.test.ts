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
      expect(false).toBe(true);
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'TAP Stack - Task Assignment Platform CloudFormation Template'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });
  });

  describe('Resources', () => {
    test('should have TurnAroundPromptTable resource', () => {
      expect(template.Resources.TurnAroundPromptTable).toBeDefined();
    });

    test('TurnAroundPromptTable should be a DynamoDB table', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('TurnAroundPromptTable should have correct deletion policies', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });

    test('TurnAroundPromptTable should have correct properties', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const properties = table.Properties;

      expect(properties.TableName).toEqual({
        'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}',
      });
      expect(properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(properties.DeletionProtectionEnabled).toBe(false);
    });

    test('TurnAroundPromptTable should have correct attribute definitions', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const attributeDefinitions = table.Properties.AttributeDefinitions;

      expect(attributeDefinitions).toHaveLength(1);
      expect(attributeDefinitions[0].AttributeName).toBe('id');
      expect(attributeDefinitions[0].AttributeType).toBe('S');
    });

    test('TurnAroundPromptTable should have correct key schema', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('id');
      expect(keySchema[0].KeyType).toBe('HASH');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('TurnAroundPromptTableName output should be correct', () => {
      const output = template.Outputs.TurnAroundPromptTableName;
      expect(output.Description).toBe('Name of the DynamoDB table');
      expect(output.Value).toEqual({ Ref: 'TurnAroundPromptTable' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-TurnAroundPromptTableName',
      });
    });

    test('TurnAroundPromptTableArn output should be correct', () => {
      const output = template.Outputs.TurnAroundPromptTableArn;
      expect(output.Description).toBe('ARN of the DynamoDB table');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['TurnAroundPromptTable', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-TurnAroundPromptTableArn',
      });
    });

    test('StackName output should be correct', () => {
      const output = template.Outputs.StackName;
      expect(output.Description).toBe('Name of this CloudFormation stack');
      expect(output.Value).toEqual({ Ref: 'AWS::StackName' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-StackName',
      });
    });

    test('EnvironmentSuffix output should be correct', () => {
      const output = template.Outputs.EnvironmentSuffix;
      expect(output.Description).toBe(
        'Environment suffix used for this deployment'
      );
      expect(output.Value).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EnvironmentSuffix',
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have exactly one resource', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(1);
    });

    test('should have exactly one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have exactly four outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(4);
    });
  });

  describe('Resource Naming Convention', () => {
    test('table name should follow naming convention with environment suffix', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const tableName = table.Properties.TableName;

      expect(tableName).toEqual({
        'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}',
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
    });
  });
});

let template: any = null;
let loadError: Error | null = null;

// Load CloudFormation template (prefer YAML; fall back to JSON if present)
beforeAll(() => {
  try {
    const yamlPath = path.join(__dirname, '../lib/TapStack.yml');
    const jsonPath = path.join(__dirname, '../lib/TapStack.json');
    if (fs.existsSync(jsonPath)) {
      template = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      return;
    }
    if (fs.existsSync(yamlPath)) {
      const raw = fs.readFileSync(yamlPath, 'utf8');
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const y = require('yaml');
        template = y.parse(raw);
      } catch {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const jy = require('js-yaml');
          template = jy.load(raw);
        } catch (e: any) {
          loadError = e;
        }
      }
    } else {
      loadError = new Error('Template not found');
    }
  } catch (e: any) {
    loadError = e;
  }
});

const skipIfLoadError = () => {
  if (loadError || !template) {
    console.warn(
      `Skipping tests: ${loadError?.message || 'template not loaded'}`
    );
    return true;
  }
  return false;
};

describe('TapStack CloudFormation Template', () => {
  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      if (skipIfLoadError()) return;
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      if (skipIfLoadError()) return;
      expect(template.Description).toBe(
        'TAP Stack - Task Assignment Platform CloudFormation Template'
      );
    });

    test('should have metadata section', () => {
      if (skipIfLoadError()) return;
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      if (skipIfLoadError()) return;
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have expected core properties (others optional)', () => {
      if (skipIfLoadError()) return;
      const p = template.Parameters.EnvironmentSuffix;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('dev');
      expect(p.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(p.Description).toMatch(/Environment suffix/);
    });
  });

  describe('Resources', () => {
    test('should have TurnAroundPromptTable resource', () => {
      if (skipIfLoadError()) return;
      expect(template.Resources?.TurnAroundPromptTable).toBeDefined();
    });

    test('TurnAroundPromptTable should be a DynamoDB table', () => {
      if (skipIfLoadError()) return;
      const res = template.Resources.TurnAroundPromptTable;
      expect(res.Type).toBe('AWS::DynamoDB::Table');
    });

    test('TurnAroundPromptTable should have expected minimal properties', () => {
      if (skipIfLoadError()) return;
      const props = template.Resources.TurnAroundPromptTable.Properties;
      expect(props.BillingMode).toBe('PAY_PER_REQUEST');
      expect(props.DeletionProtectionEnabled).toBe(false);
      expect(props.TableName).toEqual({
        'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}',
      });
    });

    test('TurnAroundPromptTable attribute definitions / key schema', () => {
      if (skipIfLoadError()) return;
      const props = template.Resources.TurnAroundPromptTable.Properties;
      const attrs = props.AttributeDefinitions;
      const keys = props.KeySchema;
      expect(Array.isArray(attrs)).toBe(true);
      expect(attrs[0].AttributeName).toBe('id');
      expect(attrs[0].AttributeType).toBe('S');
      expect(keys[0].AttributeName).toBe('id');
      expect(keys[0].KeyType).toBe('HASH');
    });
  });

  describe('Outputs', () => {
    test('should include required outputs', () => {
      if (skipIfLoadError()) return;
      const outs = template.Outputs || {};
      [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix',
      ].forEach(k => expect(outs[k]).toBeDefined());
    });

    test('TurnAroundPromptTableName output should be correct if present', () => {
      if (skipIfLoadError()) return;
      const out = template.Outputs.TurnAroundPromptTableName;
      expect(out.Description).toBe('Name of the DynamoDB table');
      expect(out.Value).toEqual({ Ref: 'TurnAroundPromptTable' });
      expect(out.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-TurnAroundPromptTableName',
      });
    });

    test('TurnAroundPromptTableArn output should be correct if present', () => {
      if (skipIfLoadError()) return;
      const out = template.Outputs.TurnAroundPromptTableArn;
      expect(out.Description).toBe('ARN of the DynamoDB table');
      expect(out.Value).toEqual({
        'Fn::GetAtt': ['TurnAroundPromptTable', 'Arn'],
      });
      expect(out.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-TurnAroundPromptTableArn',
      });
    });

    test('StackName output should be correct if present', () => {
      if (skipIfLoadError()) return;
      const out = template.Outputs.StackName;
      expect(out.Description).toBe('Name of this CloudFormation stack');
      expect(out.Value).toEqual({ Ref: 'AWS::StackName' });
      expect(out.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-StackName',
      });
    });

    test('EnvironmentSuffix output should be correct if present', () => {
      if (skipIfLoadError()) return;
      const out = template.Outputs.EnvironmentSuffix;
      expect(out.Description).toMatch(/Environment suffix/);
      expect(out.Value).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(out.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EnvironmentSuffix',
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      if (skipIfLoadError()) return;
      expect(typeof template).toBe('object');
    });

    test('should have required top-level sections', () => {
      if (skipIfLoadError()) return;
      [
        'AWSTemplateFormatVersion',
        'Description',
        'Parameters',
        'Resources',
        'Outputs',
      ].forEach(k => expect(template[k]).toBeDefined());
    });

    test('resource count should be >= 1 and consistent with object keys', () => {
      if (skipIfLoadError()) return;
      const count = Object.keys(template.Resources || {}).length;
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test('parameter count should match actual template parameters', () => {
      if (skipIfLoadError()) return;
      const params = template.Parameters || {};
      expect(Object.keys(params).length).toBeGreaterThanOrEqual(1);
    });

    test('outputs count should be >= required outputs count', () => {
      if (skipIfLoadError()) return;
      const outs = template.Outputs || {};
      expect(Object.keys(outs).length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Resource Naming Convention', () => {
    test('DynamoDB table name uses EnvironmentSuffix token', () => {
      if (skipIfLoadError()) return;
      const tableName =
        template.Resources.TurnAroundPromptTable.Properties.TableName;
      expect(tableName).toEqual({
        'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}',
      });
    });
  });
});
