import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Detailed Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  test('should have valid CloudFormation format version', () => {
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
  });

  test('should have a description', () => {
    expect(template.Description).toBeDefined();
    expect(typeof template.Description).toBe('string');
    expect(template.Description.length).toBeGreaterThan(0);
  });

  test('should have Parameters, Resources, and Outputs sections', () => {
    expect(template.Parameters).toBeDefined();
    expect(template.Resources).toBeDefined();
    expect(template.Outputs).toBeDefined();
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBeDefined();
      expect(param.Description).toBeDefined();
      expect(param.AllowedPattern).toBeDefined();
    });
  });

  describe('DynamoDB Table Resource', () => {
    test('should have TurnAroundPromptTable resource', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });
    test('should have correct attribute definitions', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.AttributeDefinitions).toEqual([
        { AttributeName: 'id', AttributeType: 'S' }
      ]);
    });
    test('should have correct key schema', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.KeySchema).toEqual([
        { AttributeName: 'id', KeyType: 'HASH' }
      ]);
    });
    test('should use PAY_PER_REQUEST billing mode', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });
    test('should have DeletionPolicy and UpdateReplacePolicy set to Delete', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });
  });

  describe('Outputs', () => {
    test('should have 4 outputs', () => {
      expect(Object.keys(template.Outputs).length).toBe(4);
    });
    test('should export table name and ARN', () => {
      expect(template.Outputs.TurnAroundPromptTableName).toBeDefined();
      expect(template.Outputs.TurnAroundPromptTableArn).toBeDefined();
    });
    test('should export stack name and environment suffix', () => {
      expect(template.Outputs.StackName).toBeDefined();
      expect(template.Outputs.EnvironmentSuffix).toBeDefined();
    });
  });
});