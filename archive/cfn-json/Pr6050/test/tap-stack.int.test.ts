import fs from 'fs';
import path from 'path';

// Full integration tests for the TapStack CloudFormation template
const templatePath = path.join(__dirname, '../lib/TapStack.json');
const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

describe('TapStack full integration tests', () => {
  test('top-level template validation', () => {
    expect(template).toBeDefined();
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    expect(typeof template.Description).toBe('string');
    expect(template.Description).toBe('TAP Stack - Task Assignment Platform CloudFormation Template');
    expect(template.Metadata).toBeDefined();
    expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();

    // Validate ParameterGroups exist and reference EnvironmentSuffix
    const paramGroups = template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
    expect(Array.isArray(paramGroups)).toBe(true);
    const groupParams = paramGroups.flatMap((g: any) => g.Parameters || []);
    expect(groupParams).toContain('EnvironmentSuffix');
  });

  test('parameters validation', () => {
    expect(template.Parameters).toBeDefined();
    const keys = Object.keys(template.Parameters);
    // Expect exactly one parameter (EnvironmentSuffix)
    expect(keys.length).toBe(1);
    const env = template.Parameters.EnvironmentSuffix;
    expect(env.Type).toBe('String');
    expect(env.Default).toBe('dev');
    expect(env.Description).toMatch(/Environment suffix/);
    expect(env.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    expect(env.ConstraintDescription).toBe('Must contain only alphanumeric characters');
  });

  test('resources validation', () => {
    expect(template.Resources).toBeDefined();
    const resourceKeys = Object.keys(template.Resources);
    // Template is expected to have exactly one resource (the table)
    expect(resourceKeys.length).toBe(1);
    expect(resourceKeys).toContain('TurnAroundPromptTable');

    const table = template.Resources.TurnAroundPromptTable;
    expect(table.Type).toBe('AWS::DynamoDB::Table');
    // Deletion policies
    expect(table.DeletionPolicy).toBe('Delete');
    expect(table.UpdateReplacePolicy).toBe('Delete');

    // Properties validation
    const props = table.Properties;
    expect(props).toBeDefined();
    expect(props.TableName).toEqual({ 'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}' });
    expect(props.BillingMode).toBe('PAY_PER_REQUEST');
    expect(props.DeletionProtectionEnabled).toBe(false);

    // AttributeDefinitions & KeySchema
    expect(Array.isArray(props.AttributeDefinitions)).toBe(true);
    expect(props.AttributeDefinitions.length).toBe(1);
    expect(props.AttributeDefinitions[0].AttributeName).toBe('id');
    expect(props.AttributeDefinitions[0].AttributeType).toBe('S');

    expect(Array.isArray(props.KeySchema)).toBe(true);
    expect(props.KeySchema.length).toBe(1);
    expect(props.KeySchema[0].AttributeName).toBe('id');
    expect(props.KeySchema[0].KeyType).toBe('HASH');
  });

  test('outputs validation', () => {
    expect(template.Outputs).toBeDefined();
    const outputs = template.Outputs;
    const expectedOutputs = [
      'TurnAroundPromptTableName',
      'TurnAroundPromptTableArn',
      'StackName',
      'EnvironmentSuffix'
    ];
    expectedOutputs.forEach(o => expect(outputs[o]).toBeDefined());

    // Validate specific output shapes
    expect(outputs.TurnAroundPromptTableName.Value).toEqual({ Ref: 'TurnAroundPromptTable' });
    expect(outputs.TurnAroundPromptTableName.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-TurnAroundPromptTableName' });

    expect(outputs.TurnAroundPromptTableArn.Value).toEqual({ 'Fn::GetAtt': ['TurnAroundPromptTable', 'Arn'] });
    expect(outputs.TurnAroundPromptTableArn.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-TurnAroundPromptTableArn' });

    expect(outputs.StackName.Value).toEqual({ Ref: 'AWS::StackName' });
    expect(outputs.EnvironmentSuffix.Value).toEqual({ Ref: 'EnvironmentSuffix' });
  });
});
