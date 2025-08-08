import fs from 'fs';
import path from 'path';

// Simple assertion helpers to avoid Jest dependency issues
function simpleAssert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function simpleEqual(actual: any, expected: any, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${message}. Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`
    );
  }
}

function simpleContains(str: string, substring: string, message: string) {
  if (!str.includes(substring)) {
    throw new Error(
      `${message}. String "${str}" does not contain "${substring}"`
    );
  }
}

describe('TAP Stack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      simpleEqual(
        template.AWSTemplateFormatVersion,
        '2010-09-09',
        'CloudFormation format version should be 2010-09-09'
      );
    });

    test('should have a comprehensive description', () => {
      simpleAssert(template.Description, 'Description should be defined');
      simpleContains(
        template.Description,
        'TAP Stack - Task Assignment Platform',
        'Description should contain TAP Stack'
      );
    });

    test('should have all required sections', () => {
      simpleAssert(template.Parameters, 'Parameters section should be defined');
      simpleAssert(template.Resources, 'Resources section should be defined');
      simpleAssert(template.Outputs, 'Outputs section should be defined');
    });

    test('should have metadata section', () => {
      simpleAssert(template.Metadata, 'Metadata should be defined');
      simpleAssert(
        template.Metadata['AWS::CloudFormation::Interface'],
        'CloudFormation Interface should be defined'
      );
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      const param = template.Parameters.EnvironmentSuffix;
      simpleAssert(param, 'EnvironmentSuffix parameter should be defined');
      simpleEqual(
        param.Type,
        'String',
        'EnvironmentSuffix should be String type'
      );
      simpleEqual(
        param.Default,
        'dev',
        'EnvironmentSuffix default should be dev'
      );
      simpleAssert(
        param.AllowedPattern,
        'EnvironmentSuffix should have AllowedPattern'
      );
    });

    test('should have correct parameter description', () => {
      const param = template.Parameters.EnvironmentSuffix;
      simpleContains(
        param.Description,
        'Environment suffix for resource naming',
        'Should have correct description'
      );
    });

    test('should have constraint description', () => {
      const param = template.Parameters.EnvironmentSuffix;
      simpleAssert(
        param.ConstraintDescription,
        'Should have constraint description'
      );
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have TurnAroundPromptTable', () => {
      const table = template.Resources.TurnAroundPromptTable;
      simpleAssert(table, 'TurnAroundPromptTable should be defined');
      simpleEqual(
        table.Type,
        'AWS::DynamoDB::Table',
        'Should be DynamoDB table type'
      );
    });

    test('should have correct billing mode', () => {
      const table = template.Resources.TurnAroundPromptTable;
      simpleEqual(
        table.Properties.BillingMode,
        'PAY_PER_REQUEST',
        'Should use PAY_PER_REQUEST billing'
      );
    });

    test('should have deletion protection disabled', () => {
      const table = template.Resources.TurnAroundPromptTable;
      simpleEqual(
        table.Properties.DeletionProtectionEnabled,
        false,
        'Deletion protection should be disabled'
      );
    });

    test('should have correct table name with environment suffix', () => {
      const table = template.Resources.TurnAroundPromptTable;
      simpleEqual(
        table.Properties.TableName,
        { 'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}' },
        'Should have correct table name'
      );
    });

    test('should have correct key schema', () => {
      const table = template.Resources.TurnAroundPromptTable;
      simpleAssert(
        table.Properties.KeySchema.length === 1,
        'Should have exactly 1 key schema item'
      );
      simpleEqual(
        table.Properties.KeySchema[0].AttributeName,
        'id',
        'Key attribute should be id'
      );
      simpleEqual(
        table.Properties.KeySchema[0].KeyType,
        'HASH',
        'Key type should be HASH'
      );
    });

    test('should have correct attribute definitions', () => {
      const table = template.Resources.TurnAroundPromptTable;
      simpleAssert(
        table.Properties.AttributeDefinitions.length === 1,
        'Should have exactly 1 attribute definition'
      );
      simpleEqual(
        table.Properties.AttributeDefinitions[0].AttributeName,
        'id',
        'Attribute name should be id'
      );
      simpleEqual(
        table.Properties.AttributeDefinitions[0].AttributeType,
        'S',
        'Attribute type should be S'
      );
    });

    test('should have deletion policies set', () => {
      const table = template.Resources.TurnAroundPromptTable;
      simpleEqual(
        table.DeletionPolicy,
        'Delete',
        'DeletionPolicy should be Delete'
      );
      simpleEqual(
        table.UpdateReplacePolicy,
        'Delete',
        'UpdateReplacePolicy should be Delete'
      );
    });
  });

  describe('Outputs', () => {
    test('should have TurnAroundPromptTableName output', () => {
      const output = template.Outputs.TurnAroundPromptTableName;
      simpleAssert(
        output,
        'TurnAroundPromptTableName output should be defined'
      );
      simpleContains(
        output.Description,
        'Name of the DynamoDB table',
        'Should have correct description'
      );
      simpleEqual(
        output.Value,
        { Ref: 'TurnAroundPromptTable' },
        'Should reference the table'
      );
    });

    test('should have TurnAroundPromptTableArn output', () => {
      const output = template.Outputs.TurnAroundPromptTableArn;
      simpleAssert(output, 'TurnAroundPromptTableArn output should be defined');
      simpleContains(
        output.Description,
        'ARN of the DynamoDB table',
        'Should have correct description'
      );
      simpleEqual(
        output.Value,
        { 'Fn::GetAtt': ['TurnAroundPromptTable', 'Arn'] },
        'Should get table ARN'
      );
    });

    test('should have StackName output', () => {
      const output = template.Outputs.StackName;
      simpleAssert(output, 'StackName output should be defined');
      simpleContains(
        output.Description,
        'Name of this CloudFormation stack',
        'Should have correct description'
      );
      simpleEqual(
        output.Value,
        { Ref: 'AWS::StackName' },
        'Should reference stack name'
      );
    });

    test('should have EnvironmentSuffix output', () => {
      const output = template.Outputs.EnvironmentSuffix;
      simpleAssert(output, 'EnvironmentSuffix output should be defined');
      simpleContains(
        output.Description,
        'Environment suffix used for this deployment',
        'Should have correct description'
      );
      simpleEqual(
        output.Value,
        { Ref: 'EnvironmentSuffix' },
        'Should reference parameter'
      );
    });

    test('should have all outputs with exports', () => {
      const outputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix',
      ];
      outputs.forEach(outputName => {
        simpleAssert(
          template.Outputs[outputName],
          `Output ${outputName} should be defined`
        );
        simpleAssert(
          template.Outputs[outputName].Export,
          `Output ${outputName} should have Export`
        );
        simpleAssert(
          template.Outputs[outputName].Export.Name,
          `Output ${outputName} should have Export Name`
        );
      });
    });

    test('should have correct export names', () => {
      const outputs = Object.keys(template.Outputs);
      outputs.forEach(outputName => {
        const exportName = template.Outputs[outputName].Export.Name;
        simpleAssert(exportName['Fn::Sub'], 'Export name should use Fn::Sub');
        simpleContains(
          exportName['Fn::Sub'],
          '${AWS::StackName}',
          'Export name should include stack name'
        );
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      simpleAssert(template, 'Template should be defined');
      simpleEqual(typeof template, 'object', 'Template should be an object');
    });

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      simpleEqual(resourceCount, 1, 'Should have exactly 1 resource');
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      simpleEqual(parameterCount, 1, 'Should have exactly 1 parameter');
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      simpleEqual(outputCount, 4, 'Should have exactly 4 outputs');
    });

    test('should have no IAM resources', () => {
      const resources = Object.values(template.Resources);
      const iamResources = resources.filter(
        (resource: any) =>
          resource.Type && resource.Type.startsWith('AWS::IAM::')
      );
      simpleEqual(iamResources.length, 0, 'Should have no IAM resources');
    });

    test('should have no VPC resources', () => {
      const resources = Object.values(template.Resources);
      const vpcResources = resources.filter(
        (resource: any) =>
          resource.Type && resource.Type.startsWith('AWS::EC2::')
      );
      simpleEqual(vpcResources.length, 0, 'Should have no VPC resources');
    });

    test('should have no S3 resources', () => {
      const resources = Object.values(template.Resources);
      const s3Resources = resources.filter(
        (resource: any) =>
          resource.Type && resource.Type.startsWith('AWS::S3::')
      );
      simpleEqual(s3Resources.length, 0, 'Should have no S3 resources');
    });

    test('should be deployable without CAPABILITY_NAMED_IAM', () => {
      // Check that no resources have explicit names that would require CAPABILITY_NAMED_IAM
      const resources = Object.values(template.Resources);
      resources.forEach((resource: any) => {
        if (resource.Type && resource.Type.startsWith('AWS::IAM::')) {
          const properties = resource.Properties || {};
          simpleAssert(
            !properties.RoleName,
            'IAM roles should not have explicit RoleName'
          );
          simpleAssert(
            !properties.UserName,
            'IAM users should not have explicit UserName'
          );
          simpleAssert(
            !properties.PolicyName,
            'IAM policies should not have explicit PolicyName'
          );
        }
      });
    });
  });
});
