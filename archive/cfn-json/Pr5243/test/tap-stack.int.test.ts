import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Detailed Integration Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  test('should deploy DynamoDB table resource with correct properties', () => {
    const table = template.Resources.TurnAroundPromptTable;
    expect(table).toBeDefined();
    expect(table.Type).toBe('AWS::DynamoDB::Table');
    expect(table.Properties.AttributeDefinitions).toEqual([
      { AttributeName: 'id', AttributeType: 'S' }
    ]);
    expect(table.Properties.KeySchema).toEqual([
      { AttributeName: 'id', KeyType: 'HASH' }
    ]);
    expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
  });

  test('should export table name and ARN as outputs', () => {
    expect(template.Outputs.TurnAroundPromptTableName).toBeDefined();
    expect(template.Outputs.TurnAroundPromptTableArn).toBeDefined();
  });

  test('should export stack name and environment suffix as outputs', () => {
    expect(template.Outputs.StackName).toBeDefined();
    expect(template.Outputs.EnvironmentSuffix).toBeDefined();
  });

  test('should have DeletionPolicy and UpdateReplacePolicy set to Delete', () => {
    const table = template.Resources.TurnAroundPromptTable;
    expect(table.DeletionPolicy).toBe('Delete');
    expect(table.UpdateReplacePolicy).toBe('Delete');
  });
});