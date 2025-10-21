import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  test('should have valid CloudFormation format version', () => {
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
  });

  test('should have correct description', () => {
    expect(template.Description).toBe('TAP Stack - Task Assignment Platform CloudFormation Template');
  });

  test('should have Parameters, Resources, and Outputs sections', () => {
    expect(template.Parameters).toBeDefined();
    expect(template.Resources).toBeDefined();
    expect(template.Outputs).toBeDefined();
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toBe('Environment suffix for resource naming (e.g., dev, staging, prod)');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toBe('Must contain only alphanumeric characters');
    });
  });

  describe('Resources', () => {
    test('should have TurnAroundPromptTable resource', () => {
      expect(template.Resources.TurnAroundPromptTable).toBeDefined();
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.TableName).toBeDefined();
      expect(table.Properties.AttributeDefinitions).toBeDefined();
      expect(table.Properties.KeySchema).toBeDefined();
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(table.Properties.DeletionProtectionEnabled).toBe(false);
    });
  });

  describe('Outputs', () => {
    test('should have TurnAroundPromptTableName output', () => {
      expect(template.Outputs.TurnAroundPromptTableName).toBeDefined();
      const output = template.Outputs.TurnAroundPromptTableName;
      expect(output.Description).toBe('Name of the DynamoDB table');
      expect(output.Value).toBeDefined();
    });

    test('should have TurnAroundPromptTableArn output', () => {
      expect(template.Outputs.TurnAroundPromptTableArn).toBeDefined();
      const output = template.Outputs.TurnAroundPromptTableArn;
      expect(output.Description).toBe('ARN of the DynamoDB table');
      expect(output.Value).toBeDefined();
    });

    test('should have StackName output', () => {
      expect(template.Outputs.StackName).toBeDefined();
      const output = template.Outputs.StackName;
      expect(output.Description).toBe('Name of this CloudFormation stack');
      expect(output.Value).toBeDefined();
    });

    test('should have EnvironmentSuffix output', () => {
      expect(template.Outputs.EnvironmentSuffix).toBeDefined();
      const output = template.Outputs.EnvironmentSuffix;
      expect(output.Description).toBe('Environment suffix used for this deployment');
      expect(output.Value).toBeDefined();
    });
  });
});

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  test('should have valid CloudFormation format version', () => {
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
  });

  test('should have correct description', () => {
    expect(template.Description).toBe('TAP Stack - Task Assignment Platform CloudFormation Template');
  });

  test('should have Parameters, Resources, and Outputs sections', () => {
    expect(template.Parameters).toBeDefined();
    expect(template.Resources).toBeDefined();
    expect(template.Outputs).toBeDefined();
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toBe('Environment suffix for resource naming (e.g., dev, staging, prod)');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toBe('Must contain only alphanumeric characters');
    });
  });

  describe('Resources', () => {
    test('should have TurnAroundPromptTable resource', () => {
      expect(template.Resources.TurnAroundPromptTable).toBeDefined();
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.TableName).toBeDefined();
      expect(table.Properties.AttributeDefinitions).toBeDefined();
      expect(table.Properties.KeySchema).toBeDefined();
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(table.Properties.DeletionProtectionEnabled).toBe(false);
    });
  });

  describe('Outputs', () => {
    test('should have TurnAroundPromptTableName output', () => {
      expect(template.Outputs.TurnAroundPromptTableName).toBeDefined();
      const output = template.Outputs.TurnAroundPromptTableName;
      expect(output.Description).toBe('Name of the DynamoDB table');
      expect(output.Value).toBeDefined();
    });

    test('should have TurnAroundPromptTableArn output', () => {
      expect(template.Outputs.TurnAroundPromptTableArn).toBeDefined();
      const output = template.Outputs.TurnAroundPromptTableArn;
      expect(output.Description).toBe('ARN of the DynamoDB table');
      expect(output.Value).toBeDefined();
    });

    test('should have StackName output', () => {
      expect(template.Outputs.StackName).toBeDefined();
      const output = template.Outputs.StackName;
      expect(output.Description).toBe('Name of this CloudFormation stack');
      expect(output.Value).toBeDefined();
    });

    test('should have EnvironmentSuffix output', () => {
      expect(template.Outputs.EnvironmentSuffix).toBeDefined();
      const output = template.Outputs.EnvironmentSuffix;
      expect(output.Description).toBe('Environment suffix used for this deployment');
      expect(output.Value).toBeDefined();
    });
  });
});
