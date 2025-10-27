import fs from 'fs';
import path from 'path';

describe('TapStack Integration', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  test('CloudFormation template should have expected resources', () => {
    expect(template.Resources).toHaveProperty('TurnAroundPromptTable');
    expect(template.Resources.TurnAroundPromptTable.Type).toBe('AWS::DynamoDB::Table');
  });

  test('CloudFormation template should have expected outputs', () => {
    expect(template.Outputs).toHaveProperty('TurnAroundPromptTableName');
    expect(template.Outputs).toHaveProperty('TurnAroundPromptTableArn');
    expect(template.Outputs).toHaveProperty('StackName');
    expect(template.Outputs).toHaveProperty('EnvironmentSuffix');
  });

  test('TurnAroundPromptTable should use PAY_PER_REQUEST billing mode', () => {
    expect(template.Resources.TurnAroundPromptTable.Properties.BillingMode).toBe('PAY_PER_REQUEST');
  });

  test('TurnAroundPromptTable should have correct key schema', () => {
    const keySchema = template.Resources.TurnAroundPromptTable.Properties.KeySchema;
    expect(Array.isArray(keySchema)).toBe(true);
    expect(keySchema[0]).toEqual({ AttributeName: 'id', KeyType: 'HASH' });
  });

  test('TurnAroundPromptTable should have correct attribute definitions', () => {
    const attrDefs = template.Resources.TurnAroundPromptTable.Properties.AttributeDefinitions;
    expect(Array.isArray(attrDefs)).toBe(true);
    expect(attrDefs[0]).toEqual({ AttributeName: 'id', AttributeType: 'S' });
  });

  test('TurnAroundPromptTable should have DeletionProtectionEnabled set to false', () => {
    expect(template.Resources.TurnAroundPromptTable.Properties.DeletionProtectionEnabled).toBe(false);
  });

  test('TurnAroundPromptTableName output value should reference TurnAroundPromptTable', () => {
    expect(template.Outputs.TurnAroundPromptTableName.Value).toEqual({ Ref: 'TurnAroundPromptTable' });
  });

  test('TurnAroundPromptTableArn output value should use Fn::GetAtt for TurnAroundPromptTable Arn', () => {
    expect(template.Outputs.TurnAroundPromptTableArn.Value).toEqual({ 'Fn::GetAtt': ['TurnAroundPromptTable', 'Arn'] });
  });

  test('StackName output value should reference AWS::StackName', () => {
    expect(template.Outputs.StackName.Value).toEqual({ Ref: 'AWS::StackName' });
  });

  test('EnvironmentSuffix output value should reference EnvironmentSuffix parameter', () => {
    expect(template.Outputs.EnvironmentSuffix.Value).toEqual({ Ref: 'EnvironmentSuffix' });
  });
});
import fs from 'fs';
import path from 'path';

describe('TapStack Integration', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  test('CloudFormation template should have expected resources', () => {
    expect(template.Resources).toHaveProperty('TurnAroundPromptTable');
    expect(template.Resources.TurnAroundPromptTable.Type).toBe('AWS::DynamoDB::Table');
  });

  test('CloudFormation template should have expected outputs', () => {
    expect(template.Outputs).toHaveProperty('TurnAroundPromptTableName');
    expect(template.Outputs).toHaveProperty('TurnAroundPromptTableArn');
    expect(template.Outputs).toHaveProperty('StackName');
    expect(template.Outputs).toHaveProperty('EnvironmentSuffix');
  });

  test('TurnAroundPromptTable should use PAY_PER_REQUEST billing mode', () => {
    expect(template.Resources.TurnAroundPromptTable.Properties.BillingMode).toBe('PAY_PER_REQUEST');
  });

  test('TurnAroundPromptTable should have correct key schema', () => {
    const keySchema = template.Resources.TurnAroundPromptTable.Properties.KeySchema;
    expect(Array.isArray(keySchema)).toBe(true);
    expect(keySchema[0]).toEqual({ AttributeName: 'id', KeyType: 'HASH' });
  });
});
