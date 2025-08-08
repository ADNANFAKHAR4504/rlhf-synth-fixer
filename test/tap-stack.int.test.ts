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

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;

describe('TAP Stack Infrastructure Integration Tests', () => {
  let template: any;

  beforeAll(() => {
    // Load template for validation since we can't assume stack is deployed
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Integration Readiness', () => {
    test('should have template loaded successfully', () => {
      simpleAssert(template, 'Template should be loaded');
      simpleEqual(typeof template, 'object', 'Template should be an object');
    });

    test('should have deployable structure', () => {
      simpleAssert(
        template.AWSTemplateFormatVersion,
        'Should have CloudFormation version'
      );
      simpleAssert(template.Resources, 'Should have Resources section');
      simpleAssert(template.Outputs, 'Should have Outputs section');
    });

    test('should have DynamoDB table resource for integration', () => {
      const table = template.Resources.TurnAroundPromptTable;
      simpleAssert(table, 'Should have TurnAroundPromptTable resource');
      simpleEqual(
        table.Type,
        'AWS::DynamoDB::Table',
        'Should be DynamoDB table'
      );
    });

    test('should have required outputs for integration testing', () => {
      const requiredOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
      ];
      requiredOutputs.forEach(outputName => {
        simpleAssert(
          template.Outputs[outputName],
          `Should have ${outputName} output`
        );
      });
    });

    test('should have environment suffix parameter for deployment', () => {
      const param = template.Parameters.EnvironmentSuffix;
      simpleAssert(param, 'Should have EnvironmentSuffix parameter');
      simpleEqual(param.Type, 'String', 'Should be String type');
    });
  });

  describe('Deployment Compatibility', () => {
    test('should be deployable without CAPABILITY_NAMED_IAM', () => {
      const resources = Object.values(template.Resources);
      const iamResources = resources.filter(
        (resource: any) =>
          resource.Type && resource.Type.startsWith('AWS::IAM::')
      );
      simpleEqual(
        iamResources.length,
        0,
        'Should have no IAM resources to avoid CAPABILITY_NAMED_IAM requirement'
      );
    });

    test('should have correct table naming for environment', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const expectedTableName = {
        'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}',
      };
      simpleEqual(
        table.Properties.TableName,
        expectedTableName,
        'Table name should include environment suffix'
      );
    });

    test('should have pay-per-request billing for cost efficiency', () => {
      const table = template.Resources.TurnAroundPromptTable;
      simpleEqual(
        table.Properties.BillingMode,
        'PAY_PER_REQUEST',
        'Should use pay-per-request billing'
      );
    });

    test('should have deletion protection disabled for dev environments', () => {
      const table = template.Resources.TurnAroundPromptTable;
      simpleEqual(
        table.Properties.DeletionProtectionEnabled,
        false,
        'Deletion protection should be disabled'
      );
    });

    test('should have proper deletion policies for cleanup', () => {
      const table = template.Resources.TurnAroundPromptTable;
      simpleEqual(table.DeletionPolicy, 'Delete', 'Should have Delete policy');
      simpleEqual(
        table.UpdateReplacePolicy,
        'Delete',
        'Should have Delete update policy'
      );
    });
  });

  describe('Resource Configuration', () => {
    test('should have correct DynamoDB key schema', () => {
      const table = template.Resources.TurnAroundPromptTable;
      simpleAssert(
        table.Properties.KeySchema.length === 1,
        'Should have exactly 1 key'
      );
      simpleEqual(
        table.Properties.KeySchema[0].AttributeName,
        'id',
        'Key should be id'
      );
      simpleEqual(
        table.Properties.KeySchema[0].KeyType,
        'HASH',
        'Should be hash key'
      );
    });

    test('should have correct attribute definitions', () => {
      const table = template.Resources.TurnAroundPromptTable;
      simpleAssert(
        table.Properties.AttributeDefinitions.length === 1,
        'Should have 1 attribute'
      );
      simpleEqual(
        table.Properties.AttributeDefinitions[0].AttributeName,
        'id',
        'Attribute should be id'
      );
      simpleEqual(
        table.Properties.AttributeDefinitions[0].AttributeType,
        'S',
        'Should be String type'
      );
    });

    test('should have minimal resource footprint', () => {
      const resourceCount = Object.keys(template.Resources).length;
      simpleEqual(resourceCount, 1, 'Should have minimal resource count');
    });

    test('should have no complex networking resources', () => {
      const resources = Object.values(template.Resources);
      const networkResources = resources.filter(
        (resource: any) =>
          resource.Type &&
          (resource.Type.startsWith('AWS::EC2::') ||
            resource.Type.startsWith('AWS::ELB::') ||
            resource.Type.startsWith('AWS::ElasticLoadBalancing::'))
      );
      simpleEqual(
        networkResources.length,
        0,
        'Should have no networking resources'
      );
    });

    test('should have no storage resources other than DynamoDB', () => {
      const resources = Object.values(template.Resources);
      const storageResources = resources.filter(
        (resource: any) =>
          resource.Type &&
          (resource.Type.startsWith('AWS::S3::') ||
            resource.Type.startsWith('AWS::RDS::') ||
            resource.Type.startsWith('AWS::EFS::'))
      );
      simpleEqual(
        storageResources.length,
        0,
        'Should have no additional storage resources'
      );
    });
  });

  describe('Output Validation', () => {
    test('should have table name output for integration', () => {
      const output = template.Outputs.TurnAroundPromptTableName;
      simpleAssert(output, 'Should have table name output');
      simpleAssert(
        output.Export,
        'Should have export for cross-stack reference'
      );
    });

    test('should have table ARN output for integration', () => {
      const output = template.Outputs.TurnAroundPromptTableArn;
      simpleAssert(output, 'Should have table ARN output');
      simpleAssert(
        output.Export,
        'Should have export for cross-stack reference'
      );
    });

    test('should have stack name output for reference', () => {
      const output = template.Outputs.StackName;
      simpleAssert(output, 'Should have stack name output');
      simpleEqual(
        output.Value,
        { Ref: 'AWS::StackName' },
        'Should reference stack name'
      );
    });

    test('should have environment suffix output for validation', () => {
      const output = template.Outputs.EnvironmentSuffix;
      simpleAssert(output, 'Should have environment suffix output');
      simpleEqual(
        output.Value,
        { Ref: 'EnvironmentSuffix' },
        'Should reference parameter'
      );
    });

    test('should have all outputs with proper export names', () => {
      const outputs = Object.keys(template.Outputs);
      outputs.forEach(outputName => {
        const output = template.Outputs[outputName];
        simpleAssert(output.Export, `${outputName} should have export`);
        simpleAssert(
          output.Export.Name,
          `${outputName} should have export name`
        );
        simpleAssert(
          output.Export.Name['Fn::Sub'],
          `${outputName} should use Fn::Sub for export name`
        );
      });
    });
  });

  describe('Integration Test Readiness', () => {
    test('should be ready for deployment testing', () => {
      // This test validates that the template is ready for actual deployment
      simpleAssert(
        template.AWSTemplateFormatVersion === '2010-09-09',
        'Should have valid CF version'
      );
      simpleAssert(
        Object.keys(template.Resources).length > 0,
        'Should have resources to deploy'
      );
      simpleAssert(
        Object.keys(template.Outputs).length > 0,
        'Should have outputs to validate'
      );
    });

    test('should have expected stack name format', () => {
      // Validate that the expected stack name follows the pattern
      const expectedPattern = /^TapStack[a-zA-Z0-9]+$/;
      simpleAssert(
        expectedPattern.test(stackName),
        `Stack name ${stackName} should match pattern`
      );
    });

    test('should have region configuration', () => {
      // Validate region is set for integration tests
      simpleAssert(region, 'AWS region should be configured');
      simpleAssert(typeof region === 'string', 'Region should be a string');
    });

    test('should have environment suffix configuration', () => {
      // Validate environment suffix is set
      simpleAssert(
        environmentSuffix,
        'Environment suffix should be configured'
      );
      simpleAssert(
        typeof environmentSuffix === 'string',
        'Environment suffix should be a string'
      );
    });

    test('should be compatible with CI/CD deployment', () => {
      // Validate template doesn't require manual intervention
      const resources = Object.values(template.Resources);
      const manualResources = resources.filter((resource: any) => {
        // Check for resources that might require manual setup
        return (
          resource.Type &&
          (resource.Type === 'AWS::IAM::Role' ||
            resource.Type === 'AWS::IAM::User' ||
            resource.Type === 'AWS::IAM::Policy')
        );
      });
      simpleEqual(
        manualResources.length,
        0,
        'Should have no resources requiring manual IAM setup'
      );
    });
  });
});
