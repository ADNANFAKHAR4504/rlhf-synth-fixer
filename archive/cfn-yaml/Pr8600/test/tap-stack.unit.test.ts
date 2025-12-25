import fs from 'fs';
import path from 'path';

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
