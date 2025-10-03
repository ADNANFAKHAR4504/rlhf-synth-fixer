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

  describe('Template Transformation', () => {
    test('should handle CloudFormation intrinsic functions correctly', () => {
      const tableName = template.Resources.TurnAroundPromptTable.Properties.TableName;
      expect(tableName).toHaveProperty('Fn::Sub');
      expect(tableName['Fn::Sub']).toBe('TurnAroundPromptTable${EnvironmentSuffix}');
    });

    test('should use correct deletion policies for data safety', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
      expect(table.Properties.DeletionProtectionEnabled).toBe(false);
    });

    test('should have consistent export naming patterns', () => {
      const expectedPattern = /^\$\{AWS::StackName\}-\w+$/;
      Object.keys(template.Outputs).forEach(outputKey => {
        const exportName = template.Outputs[outputKey].Export.Name['Fn::Sub'];
        expect(exportName).toMatch(expectedPattern);
      });
    });
  });

  describe('Security and Compliance', () => {
    test('should not have hardcoded sensitive values', () => {
      const templateString = JSON.stringify(template);
      // Exclude CloudFormation key schema and key type which are legitimate
      const sensitivePattern = /password|secret(?!Manager)|token/i;
      expect(templateString).not.toMatch(sensitivePattern);
    });

    test('should use parameter references instead of hardcoded values', () => {
      const tableName = template.Resources.TurnAroundPromptTable.Properties.TableName;
      expect(tableName).toHaveProperty('Fn::Sub');
      expect(tableName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should enable proper resource cleanup', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.Properties.DeletionProtectionEnabled).toBe(false);
    });
  });

  describe('Cost Optimization', () => {
    test('should use pay-per-request billing for cost efficiency', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should not have provisioned capacity configured', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.ProvisionedThroughput).toBeUndefined();
    });
  });

  describe('Infrastructure Resilience', () => {
    test('should have proper table configuration for availability', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should support environment-specific deployments', () => {
      const parameter = template.Parameters.EnvironmentSuffix;
      expect(parameter.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(parameter.Default).toBe('dev');
    });

    test('should handle parameter constraint validation', () => {
      const parameter = template.Parameters.EnvironmentSuffix;
      expect(parameter.ConstraintDescription).toBe('Must contain only alphanumeric characters');
      expect(parameter.Type).toBe('String');
    });
  });

  describe('CloudFormation Best Practices', () => {
    test('should have proper metadata for AWS Console interface', () => {
      const metadata = template.Metadata;
      expect(metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(metadata['AWS::CloudFormation::Interface'].ParameterGroups).toHaveLength(1);
    });

    test('should group parameters logically in metadata', () => {
      const parameterGroups = template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
      expect(parameterGroups[0].Label.default).toBe('Environment Configuration');
      expect(parameterGroups[0].Parameters).toContain('EnvironmentSuffix');
    });

    test('should have comprehensive stack outputs for integration', () => {
      const outputs = template.Outputs;
      expect(Object.keys(outputs)).toEqual(
        expect.arrayContaining(['TurnAroundPromptTableName', 'TurnAroundPromptTableArn', 'StackName', 'EnvironmentSuffix'])
      );
    });

    test('should follow CloudFormation intrinsic function patterns', () => {
      const tableArn = template.Outputs.TurnAroundPromptTableArn.Value;
      expect(tableArn).toHaveProperty('Fn::GetAtt');
      expect(tableArn['Fn::GetAtt']).toEqual(['TurnAroundPromptTable', 'Arn']);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty or minimal valid parameters', () => {
      const parameter = template.Parameters.EnvironmentSuffix;
      expect(parameter.AllowedPattern).toBe('^[a-zA-Z0-9]+$'); // At least one character required
    });

    test('should validate all required template sections exist', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Metadata).toBeDefined();
    });

    test('should handle attribute type consistency', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const keySchema = table.Properties.KeySchema[0];
      const attributeDefinitions = table.Properties.AttributeDefinitions[0];
      
      expect(keySchema.AttributeName).toBe(attributeDefinitions.AttributeName);
      expect(attributeDefinitions.AttributeType).toBe('S'); // String type
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
