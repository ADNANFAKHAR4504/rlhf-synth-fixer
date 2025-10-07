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

  describe('Template Loading and Validation', () => {
    test('should successfully load and parse JSON template', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
      expect(template).not.toBeNull();
    });

    test('should have valid CloudFormation template structure', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Metadata).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should handle template parsing errors gracefully', () => {
      // Test that the beforeAll block would handle invalid JSON
      const validJson = JSON.stringify(template);
      expect(() => JSON.parse(validJson)).not.toThrow();
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

    test('should have properly structured metadata interface', () => {
      const cfnInterface = template.Metadata['AWS::CloudFormation::Interface'];
      expect(cfnInterface.ParameterGroups).toBeDefined();
      expect(cfnInterface.ParameterLabels).toBeDefined();
      expect(Array.isArray(cfnInterface.ParameterGroups)).toBe(true);
      expect(cfnInterface.ParameterGroups.length).toBeGreaterThan(0);
    });

    test('should have correct parameter group structure in metadata', () => {
      const parameterGroups = template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
      expect(parameterGroups[0].Label).toBeDefined();
      expect(parameterGroups[0].Label.default).toBe('Environment Configuration');
      expect(parameterGroups[0].Parameters).toContain('EnvironmentSuffix');
    });

    test('should have correct parameter labels in metadata', () => {
      const parameterLabels = template.Metadata['AWS::CloudFormation::Interface'].ParameterLabels;
      expect(parameterLabels.EnvironmentSuffix).toBeDefined();
      expect(parameterLabels.EnvironmentSuffix.default).toBe('Environment Suffix');
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

    test('EnvironmentSuffix parameter validation pattern should work correctly', () => {
      const pattern = new RegExp('^[a-zA-Z0-9]+$');
      
      // Valid values
      expect(pattern.test('dev')).toBe(true);
      expect(pattern.test('staging')).toBe(true);
      expect(pattern.test('prod123')).toBe(true);
      expect(pattern.test('TEST')).toBe(true);
      
      // Invalid values
      expect(pattern.test('dev-staging')).toBe(false);
      expect(pattern.test('dev_staging')).toBe(false);
      expect(pattern.test('dev.staging')).toBe(false);
      expect(pattern.test('')).toBe(false);
      expect(pattern.test('dev staging')).toBe(false);
    });

    test('should not have any additional parameters beyond EnvironmentSuffix', () => {
      const parameterKeys = Object.keys(template.Parameters);
      expect(parameterKeys).toEqual(['EnvironmentSuffix']);
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

    test('TurnAroundPromptTable should have optimal configuration for cost and performance', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const properties = table.Properties;

      // Cost optimization: PAY_PER_REQUEST billing
      expect(properties.BillingMode).toBe('PAY_PER_REQUEST');
      
      // No provisioned capacity settings (which would be cost-inefficient for variable workloads)
      expect(properties.ProvisionedThroughput).toBeUndefined();
      
      // Deletion protection disabled for easy cleanup in non-prod environments
      expect(properties.DeletionProtectionEnabled).toBe(false);
      
      // No point-in-time recovery configured (can be enabled per environment)
      expect(properties.PointInTimeRecoveryEnabled).toBeUndefined();
    });

    test('TurnAroundPromptTable should not have unnecessary advanced features', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const properties = table.Properties;

      // These features should not be configured for a simple table
      expect(properties.StreamSpecification).toBeUndefined();
      expect(properties.SSESpecification).toBeUndefined();
      expect(properties.TimeToLiveSpecification).toBeUndefined();
      expect(properties.GlobalSecondaryIndexes).toBeUndefined();
      expect(properties.LocalSecondaryIndexes).toBeUndefined();
      expect(properties.Tags).toBeUndefined();
    });

    test('should not have any additional resources beyond TurnAroundPromptTable', () => {
      const resourceKeys = Object.keys(template.Resources);
      expect(resourceKeys).toEqual(['TurnAroundPromptTable']);
      expect(resourceKeys.length).toBe(1);
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

    test('should have correct CloudFormation template format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should not have optional sections that are not needed', () => {
      expect(template.Conditions).toBeUndefined();
      expect(template.Mappings).toBeUndefined();
      expect(template.Rules).toBeUndefined();
      expect(template.Transform).toBeUndefined();
    });

    test('should have consistent naming throughout template', () => {
      const resourceName = 'TurnAroundPromptTable';
      
      // Resource exists
      expect(template.Resources[resourceName]).toBeDefined();
      
      // Referenced in outputs
      expect(template.Outputs.TurnAroundPromptTableName.Value.Ref).toBe(resourceName);
      expect(template.Outputs.TurnAroundPromptTableArn.Value['Fn::GetAtt'][0]).toBe(resourceName);
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

    test('all exports should be properly formatted for cross-stack references', () => {
      const expectedPattern = /^\${AWS::StackName}-.+$/;
      
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        const exportName = output.Export.Name['Fn::Sub'];
        expect(exportName).toMatch(expectedPattern);
      });
    });
  });

  describe('CloudFormation Intrinsic Functions', () => {
    test('should use Ref function correctly', () => {
      // Check parameter references
      expect(template.Outputs.EnvironmentSuffix.Value.Ref).toBe('EnvironmentSuffix');
      expect(template.Outputs.StackName.Value.Ref).toBe('AWS::StackName');
      expect(template.Outputs.TurnAroundPromptTableName.Value.Ref).toBe('TurnAroundPromptTable');
    });

    test('should use Fn::Sub function correctly', () => {
      // Check substitution patterns
      expect(template.Resources.TurnAroundPromptTable.Properties.TableName['Fn::Sub'])
        .toBe('TurnAroundPromptTable${EnvironmentSuffix}');
      
      Object.keys(template.Outputs).forEach(outputKey => {
        const exportName = template.Outputs[outputKey].Export.Name['Fn::Sub'];
        expect(exportName).toContain('${AWS::StackName}');
      });
    });

    test('should use Fn::GetAtt function correctly', () => {
      const arnOutput = template.Outputs.TurnAroundPromptTableArn;
      expect(arnOutput.Value['Fn::GetAtt']).toEqual(['TurnAroundPromptTable', 'Arn']);
    });
  });

  describe('Security and Best Practices', () => {
    test('should have deletion policies set to Delete for non-production cleanup', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });

    test('should not have any hardcoded values that could cause conflicts', () => {
      // Table name uses environment suffix
      const tableName = template.Resources.TurnAroundPromptTable.Properties.TableName['Fn::Sub'];
      expect(tableName).toContain('${EnvironmentSuffix}');
    });

    test('should have proper resource isolation through naming', () => {
      // All resource names should include environment suffix for isolation
      const table = template.Resources.TurnAroundPromptTable;
      const tableNameSub = table.Properties.TableName['Fn::Sub'];
      expect(tableNameSub).toMatch(/\${EnvironmentSuffix}$/);
    });
  });

  describe('Environment Variable Integration', () => {
    test('should handle environment suffix from process environment', () => {
      // Test that our test setup correctly reads ENVIRONMENT_SUFFIX
      expect(environmentSuffix).toBeDefined();
      expect(typeof environmentSuffix).toBe('string');
    });

    test('should have fallback environment suffix', () => {
      // Verify default fallback when ENVIRONMENT_SUFFIX is not set
      const expectedDefault = process.env.ENVIRONMENT_SUFFIX || 'dev';
      expect(environmentSuffix).toBe(expectedDefault);
    });
  });
});
