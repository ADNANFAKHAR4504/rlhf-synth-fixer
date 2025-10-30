import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Unit Tests', () => {
  // Validate the template format version and description
  describe('Template Metadata', () => {
    test('should have correct CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });
    test('should have a non-empty description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });
  });

  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // ==================== Minimal Template Validation ====================
  describe('Parameters', () => {
    test('should have EnvironmentSuffix with all required properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toBe('Environment suffix for resource naming (e.g., dev, staging, prod)');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toBe('Must contain only alphanumeric characters');
    });
    test('should have exactly 1 parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have EnvironmentSuffix parameter with correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toBeDefined();
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toBe('Must contain only alphanumeric characters');
    });
  });

  describe('Resources', () => {
    test('TurnAroundPromptTable should have correct DeletionPolicy and UpdateReplacePolicy', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });
    test('TurnAroundPromptTable TableName should use Fn::Sub with EnvironmentSuffix', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.TableName).toEqual({ 'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}' });
    });
    test('TurnAroundPromptTable should have correct AttributeDefinitions', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.AttributeDefinitions).toEqual([
        { AttributeName: 'id', AttributeType: 'S' }
      ]);
    });
    test('TurnAroundPromptTable should have correct KeySchema', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.KeySchema).toEqual([
        { AttributeName: 'id', KeyType: 'HASH' }
      ]);
    });
    test('TurnAroundPromptTable should use PAY_PER_REQUEST billing mode', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });
    test('TurnAroundPromptTable should have DeletionProtectionEnabled set to false', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.DeletionProtectionEnabled).toBe(false);
    });
    test('should have exactly 1 resource', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(1);
    });

    test('should have TurnAroundPromptTable with correct properties', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.TableName).toBeDefined();
      expect(table.Properties.AttributeDefinitions).toEqual([
        { AttributeName: 'id', AttributeType: 'S' }
      ]);
      expect(table.Properties.KeySchema).toEqual([
        { AttributeName: 'id', KeyType: 'HASH' }
      ]);
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(table.Properties.DeletionProtectionEnabled).toBe(false);
    });
  });

  describe('Outputs', () => {
    test('TurnAroundPromptTableName output should export correct name and value', () => {
      const output = template.Outputs.TurnAroundPromptTableName;
      expect(output.Description).toBe('Name of the DynamoDB table');
      expect(output.Value).toEqual({ Ref: 'TurnAroundPromptTable' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-TurnAroundPromptTableName' });
    });
    test('TurnAroundPromptTableArn output should export correct name and value', () => {
      const output = template.Outputs.TurnAroundPromptTableArn;
      expect(output.Description).toBe('ARN of the DynamoDB table');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['TurnAroundPromptTable', 'Arn'] });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-TurnAroundPromptTableArn' });
    });
    test('StackName output should export correct name and value', () => {
      const output = template.Outputs.StackName;
      expect(output.Description).toBe('Name of this CloudFormation stack');
      expect(output.Value).toEqual({ Ref: 'AWS::StackName' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-StackName' });
    });
    test('EnvironmentSuffix output should export correct name and value', () => {
      const output = template.Outputs.EnvironmentSuffix;
      expect(output.Description).toBe('Environment suffix used for this deployment');
      expect(output.Value).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-EnvironmentSuffix' });
    });
    test('should have exactly 4 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(4);
    });

    test('should have all required outputs', () => {
      const expectedOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix'
      ];
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('TurnAroundPromptTableName output should have correct value', () => {
      const output = template.Outputs.TurnAroundPromptTableName;
      expect(output.Description).toBe('Name of the DynamoDB table');
      expect(output.Value).toEqual({ Ref: 'TurnAroundPromptTable' });
      expect(output.Export.Name).toBeDefined();
    });

    test('TurnAroundPromptTableArn output should have correct value', () => {
      const output = template.Outputs.TurnAroundPromptTableArn;
      expect(output.Description).toBe('ARN of the DynamoDB table');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['TurnAroundPromptTable', 'Arn'] });
      expect(output.Export.Name).toBeDefined();
    });

    test('StackName output should have correct value', () => {
      const output = template.Outputs.StackName;
      expect(output.Description).toBe('Name of this CloudFormation stack');
      expect(output.Value).toEqual({ Ref: 'AWS::StackName' });
      expect(output.Export.Name).toBeDefined();
    });

    test('EnvironmentSuffix output should have correct value', () => {
      const output = template.Outputs.EnvironmentSuffix;
      expect(output.Description).toBe('Environment suffix used for this deployment');
      expect(output.Value).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(output.Export.Name).toBeDefined();
    });
  });
});