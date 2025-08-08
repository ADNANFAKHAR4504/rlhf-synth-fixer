import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TAP Stack CloudFormation Template', () => {
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

    test('should have a comprehensive description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain(
        'TAP Stack - Task Assignment Platform'
      );
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBeDefined();
      expect(param.Description).toContain(
        'Environment suffix for resource naming'
      );
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have TurnAroundPromptTable', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(table.Properties.DeletionProtectionEnabled).toBe(false);
    });

    test('should have correct table name with environment suffix', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}',
      });
    });

    test('should have correct key schema', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.KeySchema).toHaveLength(1);
      expect(table.Properties.KeySchema[0].AttributeName).toBe('id');
      expect(table.Properties.KeySchema[0].KeyType).toBe('HASH');
    });

    test('should have correct attribute definitions', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.AttributeDefinitions).toHaveLength(1);
      expect(table.Properties.AttributeDefinitions[0].AttributeName).toBe('id');
      expect(table.Properties.AttributeDefinitions[0].AttributeType).toBe('S');
    });

    test('should have deletion policies set', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });
  });

  describe('Outputs', () => {
    test('should have TurnAroundPromptTableName output', () => {
      const output = template.Outputs.TurnAroundPromptTableName;
      expect(output).toBeDefined();
      expect(output.Description).toContain('Name of the DynamoDB table');
      expect(output.Value).toEqual({ Ref: 'TurnAroundPromptTable' });
    });

    test('should have TurnAroundPromptTableArn output', () => {
      const output = template.Outputs.TurnAroundPromptTableArn;
      expect(output).toBeDefined();
      expect(output.Description).toContain('ARN of the DynamoDB table');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['TurnAroundPromptTable', 'Arn'],
      });
    });

    test('should have StackName output', () => {
      const output = template.Outputs.StackName;
      expect(output).toBeDefined();
      expect(output.Description).toContain('Name of this CloudFormation stack');
      expect(output.Value).toEqual({ Ref: 'AWS::StackName' });
    });

    test('should have EnvironmentSuffix output', () => {
      const output = template.Outputs.EnvironmentSuffix;
      expect(output).toBeDefined();
      expect(output.Description).toContain(
        'Environment suffix used for this deployment'
      );
      expect(output.Value).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('should have all outputs with exports', () => {
      const outputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix',
      ];
      outputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Export).toBeDefined();
        expect(template.Outputs[outputName].Export.Name).toBeDefined();
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(1); // Only DynamoDB table
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1); // Only EnvironmentSuffix
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(4); // Table name, ARN, stack name, environment suffix
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });
});
