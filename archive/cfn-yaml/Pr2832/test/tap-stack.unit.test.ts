import fs from 'fs';
import path from 'path';

const EnvironmentType = process.env.ENVIRONMENT_SUFFIX || 'dev';

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
        'Complete Serverless Application Infrastructure - Production-ready stack with Lambda, API Gateway, S3, DynamoDB, and comprehensive monitoring'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentType parameter', () => {
      expect(template.Parameters.EnvironmentType).toBeDefined();
    });

    test('EnvironmentType parameter should have correct properties', () => {
      const envTypeParam = template.Parameters.EnvironmentType;
      expect(envTypeParam.Type).toBe('String');
      expect(envTypeParam.Default).toBe('Production');
      expect(envTypeParam.Description).toBe(
        'Environment type for resource tagging and configuration'
      );
      expect(envTypeParam.AllowedValues).toEqual(['Production', 'Development', 'Staging']);
      expect(envTypeParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });
  });

  describe('Resources', () => {
    test('should have ApplicationDynamoDBTable resource', () => {
      expect(template.Resources.ApplicationDynamoDBTable).toBeDefined();
    });

    test('ApplicationDynamoDBTable should be a DynamoDB table', () => {
      const table = template.Resources.ApplicationDynamoDBTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('ApplicationDynamoDBTable should have correct deletion policies', () => {
      const table = template.Resources.ApplicationDynamoDBTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });

    test('ApplicationDynamoDBTable should have correct properties', () => {
      const table = template.Resources.ApplicationDynamoDBTable;
      const properties = table.Properties;

      expect(properties.TableName).toEqual({
        'Fn::Sub': 'Prod-${ApplicationName}-Table',
      });
      expect(properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(properties.DeletionProtectionEnabled).toBe(false);
    });

    test('ApplicationDynamoDBTable should have correct attribute definitions', () => {
      const table = template.Resources.ApplicationDynamoDBTable;
      const attributeDefinitions = table.Properties.AttributeDefinitions;

      expect(attributeDefinitions).toHaveLength(2);
      expect(attributeDefinitions[0].AttributeName).toBe('pk');
      expect(attributeDefinitions[0].AttributeType).toBe('S');
      expect(attributeDefinitions[1].AttributeName).toBe('sk');
      expect(attributeDefinitions[1].AttributeType).toBe('S');
    });

    test('ApplicationDynamoDBTable should have correct key schema', () => {
      const table = template.Resources.ApplicationDynamoDBTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(2);
      expect(keySchema[0].AttributeName).toBe('pk');
      expect(keySchema[0].KeyType).toBe('HASH');
      expect(keySchema[1].AttributeName).toBe('sk');
      expect(keySchema[1].KeyType).toBe('RANGE');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ApiGatewayEndpointUrl',
        'HealthCheckUrl',
        'S3BucketName',
        'S3BucketDomainName',
        'DynamoDBTableName',
        'LambdaFunctionArn',
        'LambdaFunctionName',
        'KMSKeyId',
        'KMSKeyAlias',
        'LambdaExecutionRoleArn',
        'EnvironmentType',
        'ApplicationName'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ApplicationDynamoDBTableName output should be correct', () => {
      const output = template.Outputs.DynamoDBTableName;
      expect(output.Description).toBe('Name of the DynamoDB table');
      expect(output.Value).toEqual({ Ref: 'ApplicationDynamoDBTable' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-DynamoDBTableName',
      });
    });

    test('ApplicationDynamoDBTableArn output should be correct', () => {
      const output = template.Outputs.DynamoDBTableArn;
      expect(output.Description).toBe('ARN of the DynamoDB table');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ApplicationDynamoDBTable', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-DynamoDBTableArn',
      });
    });

    test('StackName output should be correct', () => {
      const output = template.Outputs.StackName;
      expect(output.Description).toBe('Name of the CloudFormation stack');
      expect(output.Value).toEqual({ Ref: 'AWS::StackName' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-StackName',
      });
    });

    test('EnvironmentType output should be correct', () => {
      const output = template.Outputs.EnvironmentType;
      expect(output.Description).toBe(
        "Environment type of the deployment"
      );
      expect(output.Value).toEqual({ Ref: 'EnvironmentType' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EnvironmentType',
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

    test('should have 22 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(22);
    });

    test('should have exactly 5 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(5);
    });

    test('should have exactly fourteen outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(14);
    });
  });

  describe('Resource Naming Convention', () => {
    test('table name should follow naming convention with environment suffix', () => {
      const table = template.Resources.ApplicationDynamoDBTable;
      const tableName = table.Properties.TableName;

      expect(tableName).toEqual({
        'Fn::Sub': 'Prod-${ApplicationName}-Table',
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
