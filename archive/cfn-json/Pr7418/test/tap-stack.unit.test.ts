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

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Serverless cryptocurrency price alert processing system with Lambda, DynamoDB, and EventBridge'
      );
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
        'Environment suffix for resource naming (e.g., dev, qa, prod)'
      );
    });
  });

  describe('Resources', () => {
    test('should have CryptoAlertsTable resource', () => {
      expect(template.Resources.CryptoAlertsTable).toBeDefined();
    });

    test('CryptoAlertsTable should be a DynamoDB table', () => {
      const table = template.Resources.CryptoAlertsTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('CryptoAlertsTable should have correct deletion policies', () => {
      const table = template.Resources.CryptoAlertsTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBeUndefined(); // Not present in actual template
    });

    test('CryptoAlertsTable should have correct properties', () => {
      const table = template.Resources.CryptoAlertsTable;
      const properties = table.Properties;

      expect(properties.TableName).toEqual({
        'Fn::Sub': 'CryptoAlerts-${EnvironmentSuffix}',
      });
      expect(properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(properties.DeletionProtectionEnabled).toBeUndefined(); // Not present
    });

    test('CryptoAlertsTable should have correct attribute definitions', () => {
      const table = template.Resources.CryptoAlertsTable;
      const attributeDefinitions = table.Properties.AttributeDefinitions;

      expect(attributeDefinitions).toHaveLength(2);
      expect(attributeDefinitions[0].AttributeName).toBe('userId');
      expect(attributeDefinitions[0].AttributeType).toBe('S');
      expect(attributeDefinitions[1].AttributeName).toBe('alertId');
      expect(attributeDefinitions[1].AttributeType).toBe('S');
    });

    test('CryptoAlertsTable should have correct key schema', () => {
      const table = template.Resources.CryptoAlertsTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(2);
      expect(keySchema[0].AttributeName).toBe('userId');
      expect(keySchema[0].KeyType).toBe('HASH');
      expect(keySchema[1].AttributeName).toBe('alertId');
      expect(keySchema[1].KeyType).toBe('RANGE');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'PriceWebhookProcessorArn',
        'AlertMatcherArn',
        'ProcessedAlertsArn',
        'CryptoAlertsTableName',
        'EventBridgeRuleName',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('PriceWebhookProcessorArn output should be correct', () => {
      const output = template.Outputs.PriceWebhookProcessorArn;
      expect(output.Description).toBe('ARN of the PriceWebhookProcessor Lambda function');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['PriceWebhookProcessorFunction', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-PriceWebhookProcessorArn',
      });
    });

    test('AlertMatcherArn output should be correct', () => {
      const output = template.Outputs.AlertMatcherArn;
      expect(output.Description).toBe('ARN of the AlertMatcher Lambda function');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['AlertMatcherFunction', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-AlertMatcherArn',
      });
    });

    test('ProcessedAlertsArn output should be correct', () => {
      const output = template.Outputs.ProcessedAlertsArn;
      expect(output.Description).toBe('ARN of the ProcessedAlerts Lambda function');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ProcessedAlertsFunction', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ProcessedAlertsArn',
      });
    });

    test('CryptoAlertsTableName output should be correct', () => {
      const output = template.Outputs.CryptoAlertsTableName;
      expect(output.Description).toBe('Name of the DynamoDB table for storing alerts');
      expect(output.Value).toEqual({ Ref: 'CryptoAlertsTable' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-CryptoAlertsTableName',
      });
    });

    test('EventBridgeRuleName output should be correct', () => {
      const output = template.Outputs.EventBridgeRuleName;
      expect(output.Description).toBe('Name of the EventBridge rule triggering AlertMatcher');
      expect(output.Value).toEqual({ Ref: 'AlertMatcherScheduleRule' });
      expect(output.Export).toBeUndefined(); // No export for this one
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

    test('should have exactly fifteen resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(15);
    });

    test('should have exactly one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have exactly five outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(5);
    });
  });

  describe('Resource Naming Convention', () => {
    test('table name should follow naming convention with environment suffix', () => {
      const table = template.Resources.CryptoAlertsTable;
      const tableName = table.Properties.TableName;

      expect(tableName).toEqual({
        'Fn::Sub': 'CryptoAlerts-${EnvironmentSuffix}',
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export) {
          expect(output.Export.Name).toEqual({
            'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
          });
        }
      });
    });
  });
});
