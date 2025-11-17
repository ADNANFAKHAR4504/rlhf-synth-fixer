/**
 * tap-stack.unit.test.ts
 *
 * Unit tests for CloudFormation template validation.
 * Tests validate template structure, resource properties, and dependencies without deploying to AWS.
 */

import * as fs from 'fs';
import * as path from 'path';
import TemplateValidator from '../lib/template-validator';

describe('CloudFormation Template Unit Tests', () => {
  let template: any;
  let validator: TemplateValidator;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
    validator = new TemplateValidator(templatePath);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(validator.getTemplate().AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Transaction Processing Infrastructure');
      expect(validator.getTemplate().Description).toContain('Transaction Processing Infrastructure');
    });

    test('should have parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
      expect(validator.getParameterCount()).toBeGreaterThan(0);
    });

    test('should have resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
      expect(validator.getResourceCount()).toBeGreaterThan(0);
    });

    test('should have outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
      expect(validator.getOutputCount()).toBeGreaterThan(0);
    });

    test('should validate template structure', () => {
      expect(validator.validateStructure()).toBe(true);
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
      expect(validator.validateParameter('EnvironmentSuffix', 'String')).toBe(true);
    });

    test('should have TableName parameter', () => {
      expect(template.Parameters.TableName).toBeDefined();
      expect(template.Parameters.TableName.Type).toBe('String');
      expect(template.Parameters.TableName.Default).toBe('TransactionTable');
      expect(validator.validateParameter('TableName', 'String')).toBe(true);
    });

    test('should have FunctionName parameter', () => {
      expect(template.Parameters.FunctionName).toBeDefined();
      expect(template.Parameters.FunctionName.Type).toBe('String');
      expect(template.Parameters.FunctionName.Default).toBe('PaymentProcessor');
      expect(validator.validateParameter('FunctionName', 'String')).toBe(true);
    });

    test('parameters should have alphanumeric pattern constraint', () => {
      expect(template.Parameters.EnvironmentSuffix.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(template.Parameters.TableName.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(template.Parameters.FunctionName.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('should get all parameters', () => {
      const params = validator.getParameters();
      expect(Object.keys(params)).toContain('EnvironmentSuffix');
      expect(Object.keys(params)).toContain('TableName');
      expect(Object.keys(params)).toContain('FunctionName');
    });
  });

  describe('DynamoDB Table', () => {
    let transactionTable: any;

    beforeAll(() => {
      transactionTable = template.Resources.TransactionTable;
    });

    test('should exist', () => {
      expect(transactionTable).toBeDefined();
      expect(validator.hasResource('TransactionTable')).toBe(true);
      expect(validator.getResource('TransactionTable')).toBeDefined();
    });

    test('should be of correct type', () => {
      expect(transactionTable.Type).toBe('AWS::DynamoDB::Table');
      const dynamoResources = validator.getResourcesByType('AWS::DynamoDB::Table');
      expect(Object.keys(dynamoResources)).toContain('TransactionTable');
    });

    test('should have Delete deletion policy', () => {
      expect(transactionTable.DeletionPolicy).toBe('Delete');
      expect(transactionTable.UpdateReplacePolicy).toBe('Delete');
      expect(validator.validateDestroyable('TransactionTable')).toBe(true);
    });

    test('should have PAY_PER_REQUEST billing mode', () => {
      expect(transactionTable.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should have DeletionProtectionEnabled set to false', () => {
      expect(transactionTable.Properties.DeletionProtectionEnabled).toBe(false);
    });

    test('should have correct table name with EnvironmentSuffix', () => {
      expect(transactionTable.Properties.TableName).toEqual({
        'Fn::Sub': '${TableName}-${EnvironmentSuffix}'
      });
      expect(validator.usesIntrinsicFunction('TransactionTable', ['TableName'])).toBe(true);
    });

    test('should have required attribute definitions', () => {
      const attrs = transactionTable.Properties.AttributeDefinitions;
      expect(attrs).toHaveLength(2);

      const transactionIdAttr = attrs.find((a: any) => a.AttributeName === 'transactionId');
      expect(transactionIdAttr).toBeDefined();
      expect(transactionIdAttr.AttributeType).toBe('S');

      const timestampAttr = attrs.find((a: any) => a.AttributeName === 'timestamp');
      expect(timestampAttr).toBeDefined();
      expect(timestampAttr.AttributeType).toBe('N');
    });

    test('should have correct key schema', () => {
      const keySchema = transactionTable.Properties.KeySchema;
      expect(keySchema).toHaveLength(2);

      const hashKey = keySchema.find((k: any) => k.KeyType === 'HASH');
      expect(hashKey.AttributeName).toBe('transactionId');

      const rangeKey = keySchema.find((k: any) => k.KeyType === 'RANGE');
      expect(rangeKey.AttributeName).toBe('timestamp');
    });

    test('should have Environment tag', () => {
      const tags = transactionTable.Properties.Tags;
      const envTag = tags.find((t: any) => t.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
    });
  });

  describe('Lambda Execution Role', () => {
    let lambdaRole: any;

    beforeAll(() => {
      lambdaRole = template.Resources.LambdaExecutionRole;
    });

    test('should exist', () => {
      expect(lambdaRole).toBeDefined();
      expect(validator.hasResource('LambdaExecutionRole')).toBe(true);
    });

    test('should be of correct type', () => {
      expect(lambdaRole.Type).toBe('AWS::IAM::Role');
      const iamRoles = validator.getResourcesByType('AWS::IAM::Role');
      expect(Object.keys(iamRoles)).toContain('LambdaExecutionRole');
    });

    test('should have correct role name with EnvironmentSuffix', () => {
      expect(lambdaRole.Properties.RoleName).toEqual({
        'Fn::Sub': 'PaymentProcessorRole-${EnvironmentSuffix}'
      });
      expect(validator.usesIntrinsicFunction('LambdaExecutionRole', ['RoleName'])).toBe(true);
    });

    test('should have Lambda assume role policy', () => {
      const assumePolicy = lambdaRole.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Version).toBe('2012-10-17');

      const statement = assumePolicy.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal.Service).toBe('lambda.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('should have basic Lambda execution managed policy', () => {
      const policies = lambdaRole.Properties.ManagedPolicyArns;
      expect(policies).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });

    test('should have Environment tag', () => {
      const tags = lambdaRole.Properties.Tags;
      const envTag = tags.find((t: any) => t.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
    });
  });

  describe('DynamoDB Access Policy', () => {
    let policy: any;

    beforeAll(() => {
      policy = template.Resources.DynamoDBAccessPolicy;
    });

    test('should exist', () => {
      expect(policy).toBeDefined();
      expect(validator.hasResource('DynamoDBAccessPolicy')).toBe(true);
    });

    test('should be of correct type', () => {
      expect(policy.Type).toBe('AWS::IAM::ManagedPolicy');
      const policies = validator.getResourcesByType('AWS::IAM::ManagedPolicy');
      expect(Object.keys(policies)).toContain('DynamoDBAccessPolicy');
    });

    test('should have dependencies inferred from intrinsic functions', () => {
      // Dependencies are inferred from !GetAtt and !Ref intrinsic functions
      // Explicit DependsOn is not required (and would be redundant per CloudFormation lint)
      const policyDoc = policy.Properties.PolicyDocument;
      const statement = policyDoc.Statement[0];
      
      // Verify dependency on TransactionTable via !GetAtt
      expect(statement.Resource).toEqual({
        'Fn::GetAtt': ['TransactionTable', 'Arn']
      });
      
      // Verify dependency on LambdaExecutionRole via !Ref
      expect(policy.Properties.Roles).toEqual([
        { Ref: 'LambdaExecutionRole' }
      ]);
    });

    test('should have correct policy name with EnvironmentSuffix', () => {
      expect(policy.Properties.ManagedPolicyName).toEqual({
        'Fn::Sub': 'DynamoDBAccessPolicy-${EnvironmentSuffix}'
      });
      expect(validator.usesIntrinsicFunction('DynamoDBAccessPolicy', ['ManagedPolicyName'])).toBe(true);
    });

    test('should grant DynamoDB permissions', () => {
      const policyDoc = policy.Properties.PolicyDocument;
      const statement = policyDoc.Statement[0];

      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toContain('dynamodb:PutItem');
      expect(statement.Action).toContain('dynamodb:GetItem');
      expect(statement.Action).toContain('dynamodb:UpdateItem');
      expect(statement.Action).toContain('dynamodb:Query');
      expect(statement.Action).toContain('dynamodb:Scan');
    });

    test('should use intrinsic function for table ARN', () => {
      const policyDoc = policy.Properties.PolicyDocument;
      const statement = policyDoc.Statement[0];

      expect(statement.Resource).toEqual({
        'Fn::GetAtt': ['TransactionTable', 'Arn']
      });
    });

    test('should be attached to Lambda execution role', () => {
      expect(policy.Properties.Roles).toEqual([
        { Ref: 'LambdaExecutionRole' }
      ]);
    });
  });

  describe('Lambda Function', () => {
    let lambdaFunction: any;

    beforeAll(() => {
      lambdaFunction = template.Resources.PaymentProcessorFunction;
    });

    test('should exist', () => {
      expect(lambdaFunction).toBeDefined();
      expect(validator.hasResource('PaymentProcessorFunction')).toBe(true);
    });

    test('should be of correct type', () => {
      expect(lambdaFunction.Type).toBe('AWS::Lambda::Function');
      const lambdas = validator.getResourcesByType('AWS::Lambda::Function');
      expect(Object.keys(lambdas)).toContain('PaymentProcessorFunction');
    });

    test('should have dependencies inferred from intrinsic functions', () => {
      // LambdaExecutionRole dependency is inferred from !GetAtt in Role property
      expect(lambdaFunction.Properties.Role).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn']
      });
      
      // DynamoDBAccessPolicy dependency is explicit to ensure policy is attached before Lambda creation
      expect(lambdaFunction.DependsOn).toContain('DynamoDBAccessPolicy');
      expect(validator.hasDependency('PaymentProcessorFunction', 'DynamoDBAccessPolicy')).toBe(true);
    });

    test('should have correct function name with EnvironmentSuffix', () => {
      expect(lambdaFunction.Properties.FunctionName).toEqual({
        'Fn::Sub': '${FunctionName}-${EnvironmentSuffix}'
      });
      expect(validator.usesIntrinsicFunction('PaymentProcessorFunction', ['FunctionName'])).toBe(true);
    });

    test('should have 256MB memory allocation', () => {
      expect(lambdaFunction.Properties.MemorySize).toBe(256);
    });

    test('should have timeout configured', () => {
      expect(lambdaFunction.Properties.Timeout).toBe(30);
    });

    test('should have correct runtime', () => {
      expect(lambdaFunction.Properties.Runtime).toBe('python3.11');
    });

    test('should have correct handler', () => {
      expect(lambdaFunction.Properties.Handler).toBe('index.lambda_handler');
    });

    test('should reference execution role using GetAtt', () => {
      expect(lambdaFunction.Properties.Role).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn']
      });
      expect(validator.usesIntrinsicFunction('PaymentProcessorFunction', ['Role'])).toBe(true);
    });

    test('should have environment variables', () => {
      const envVars = lambdaFunction.Properties.Environment.Variables;

      expect(envVars.TABLE_NAME).toEqual({ Ref: 'TransactionTable' });
      expect(envVars.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('should have inline code', () => {
      expect(lambdaFunction.Properties.Code.ZipFile).toBeDefined();
      expect(lambdaFunction.Properties.Code.ZipFile).toContain('lambda_handler');
    });

    test('should have Environment tag', () => {
      const tags = lambdaFunction.Properties.Tags;
      const envTag = tags.find((t: any) => t.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
    });
  });

  describe('Outputs', () => {
    test('should have TransactionTableName output', () => {
      const output = template.Outputs.TransactionTableName;
      expect(output).toBeDefined();
      expect(output.Description).toContain('DynamoDB transaction table');
      expect(output.Value).toEqual({ Ref: 'TransactionTable' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-TransactionTableName'
      });
      expect(validator.hasOutput('TransactionTableName')).toBe(true);
    });

    test('should have TransactionTableArn output', () => {
      const output = template.Outputs.TransactionTableArn;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['TransactionTable', 'Arn']
      });
      expect(validator.hasOutput('TransactionTableArn')).toBe(true);
    });

    test('should have PaymentProcessorFunctionArn output', () => {
      const output = template.Outputs.PaymentProcessorFunctionArn;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['PaymentProcessorFunction', 'Arn']
      });
      expect(validator.hasOutput('PaymentProcessorFunctionArn')).toBe(true);
    });

    test('should have PaymentProcessorFunctionName output', () => {
      const output = template.Outputs.PaymentProcessorFunctionName;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'PaymentProcessorFunction' });
      expect(validator.hasOutput('PaymentProcessorFunctionName')).toBe(true);
    });

    test('should have LambdaExecutionRoleArn output', () => {
      const output = template.Outputs.LambdaExecutionRoleArn;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn']
      });
      expect(validator.hasOutput('LambdaExecutionRoleArn')).toBe(true);
    });

    test('should have EnvironmentSuffix output', () => {
      const output = template.Outputs.EnvironmentSuffix;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(validator.hasOutput('EnvironmentSuffix')).toBe(true);
    });

    test('all outputs should have export names', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });

      const outputs = validator.getOutputs();
      expect(Object.keys(outputs).length).toBe(6);
    });
  });

  describe('Dependency Resolution', () => {
    test('should not have circular dependencies', () => {
      const transactionTable = template.Resources.TransactionTable;
      const lambdaRole = template.Resources.LambdaExecutionRole;
      const policy = template.Resources.DynamoDBAccessPolicy;
      const lambdaFunction = template.Resources.PaymentProcessorFunction;

      // TransactionTable should have no dependencies
      expect(transactionTable.DependsOn).toBeUndefined();

      // LambdaExecutionRole should have no dependencies
      expect(lambdaRole.DependsOn).toBeUndefined();

      // DynamoDBAccessPolicy dependencies are inferred from intrinsic functions (!GetAtt and !Ref)
      // Explicit DependsOn is not required (and would be redundant per CloudFormation lint)
      expect(policy.DependsOn).toBeUndefined();

      // PaymentProcessorFunction depends on DynamoDBAccessPolicy explicitly
      // LambdaExecutionRole dependency is inferred from !GetAtt in Role property
      expect(lambdaFunction.DependsOn).toContain('DynamoDBAccessPolicy');

      // Validate using validator
      expect(validator.validateNCircularDependencies()).toBe(true);
    });

    test('should detect circular dependencies', () => {
      // Create a test template with circular dependencies to test that branch
      const testTemplate = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Test template with circular dependencies',
        Resources: {
          ResourceA: {
            Type: 'AWS::S3::Bucket',
            DependsOn: 'ResourceB'
          },
          ResourceB: {
            Type: 'AWS::S3::Bucket',
            DependsOn: 'ResourceA'
          }
        }
      };
      const testTemplatePath = path.join(__dirname, 'test-template-circular.json');
      fs.writeFileSync(testTemplatePath, JSON.stringify(testTemplate));
      
      try {
        const testValidator = new TemplateValidator(testTemplatePath);
        expect(testValidator.validateNCircularDependencies()).toBe(false);
      } finally {
        if (fs.existsSync(testTemplatePath)) {
          fs.unlinkSync(testTemplatePath);
        }
      }
    });

    test('should detect circular dependencies with deeper cycle', () => {
      // Create a test template with a deeper circular dependency chain
      const testTemplate = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Test template with deeper circular dependencies',
        Resources: {
          ResourceA: {
            Type: 'AWS::S3::Bucket',
            DependsOn: 'ResourceB'
          },
          ResourceB: {
            Type: 'AWS::S3::Bucket',
            DependsOn: 'ResourceC'
          },
          ResourceC: {
            Type: 'AWS::S3::Bucket',
            DependsOn: 'ResourceA'
          }
        }
      };
      const testTemplatePath = path.join(__dirname, 'test-template-circular-deep.json');
      fs.writeFileSync(testTemplatePath, JSON.stringify(testTemplate));
      
      try {
        const testValidator = new TemplateValidator(testTemplatePath);
        expect(testValidator.validateNCircularDependencies()).toBe(false);
      } finally {
        if (fs.existsSync(testTemplatePath)) {
          fs.unlinkSync(testTemplatePath);
        }
      }
    });

    test('should use intrinsic functions instead of hardcoded values', () => {
      const policy = template.Resources.DynamoDBAccessPolicy;
      const lambdaFunction = template.Resources.PaymentProcessorFunction;

      // Policy should use GetAtt for table ARN
      const policyResource = policy.Properties.PolicyDocument.Statement[0].Resource;
      expect(policyResource['Fn::GetAtt']).toBeDefined();

      // Lambda should use GetAtt for role ARN
      expect(lambdaFunction.Properties.Role['Fn::GetAtt']).toBeDefined();

      // Lambda should use Ref for table name
      expect(lambdaFunction.Properties.Environment.Variables.TABLE_NAME.Ref).toBe('TransactionTable');
    });
  });

  describe('Resource Naming', () => {
    test('all resources should include EnvironmentSuffix in names', () => {
      const transactionTable = template.Resources.TransactionTable;
      const lambdaRole = template.Resources.LambdaExecutionRole;
      const policy = template.Resources.DynamoDBAccessPolicy;
      const lambdaFunction = template.Resources.PaymentProcessorFunction;

      expect(transactionTable.Properties.TableName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(lambdaRole.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(policy.Properties.ManagedPolicyName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(lambdaFunction.Properties.FunctionName['Fn::Sub']).toContain('${EnvironmentSuffix}');

      // Validate using validator
      expect(validator.validateEnvironmentSuffixUsage()).toBe(true);
    });
  });

  describe('Destroyability', () => {
    test('DynamoDB table should be destroyable', () => {
      const transactionTable = template.Resources.TransactionTable;

      expect(transactionTable.DeletionPolicy).toBe('Delete');
      expect(transactionTable.UpdateReplacePolicy).toBe('Delete');
      expect(transactionTable.Properties.DeletionProtectionEnabled).toBe(false);
      expect(validator.validateDestroyable('TransactionTable')).toBe(true);
    });

    test('should not have Retain deletion policies', () => {
      Object.entries(template.Resources).forEach(([id, resource]: [string, any]) => {
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
        expect(validator.validateDestroyable(id)).toBe(true);
      });
    });
  });

  describe('Resource Types', () => {
    test('should have correct resource types', () => {
      const resourceTypes = validator.getResourceTypes();
      expect(resourceTypes).toContain('AWS::DynamoDB::Table');
      expect(resourceTypes).toContain('AWS::IAM::Role');
      expect(resourceTypes).toContain('AWS::IAM::ManagedPolicy');
      expect(resourceTypes).toContain('AWS::Lambda::Function');
    });

    test('should have 4 resources total', () => {
      expect(validator.getResourceCount()).toBe(4);
    });
  });

  describe('Validator Edge Cases', () => {
    test('should handle constructor with custom template path', () => {
      const customPath = path.join(__dirname, '..', 'lib', 'TapStack.json');
      const customValidator = new TemplateValidator(customPath);
      expect(customValidator.getTemplate()).toBeDefined();
      expect(customValidator.getResourceCount()).toBeGreaterThan(0);
    });

    test('should handle missing resource', () => {
      expect(validator.hasResource('NonExistentResource')).toBe(false);
      expect(validator.getResource('NonExistentResource')).toBeUndefined();
    });

    test('should handle validateDestroyable on non-existent resource', () => {
      expect(validator.validateDestroyable('NonExistentResource')).toBe(false);
    });

    test('should handle invalid parameter validation', () => {
      expect(validator.validateParameter('NonExistentParam', 'String')).toBe(false);
      expect(validator.validateParameter('EnvironmentSuffix', 'Number')).toBe(false);
    });

    test('should handle missing output', () => {
      expect(validator.hasOutput('NonExistentOutput')).toBe(false);
    });

    test('should handle resource without dependencies', () => {
      expect(validator.hasDependency('TransactionTable', 'SomeResource')).toBe(false);
    });

    test('should handle non-array DependsOn', () => {
      // Test resources with explicit dependencies
      const lambdaFunction = validator.getResource('PaymentProcessorFunction');
      expect(Array.isArray(lambdaFunction.DependsOn)).toBe(true);
    });

    test('should handle string DependsOn (non-array)', () => {
      // Create a test template with string DependsOn to test the non-array branch
      const testTemplate = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Test template',
        Resources: {
          TestResource: {
            Type: 'AWS::S3::Bucket',
            DependsOn: 'SomeOtherResource'
          }
        }
      };
      const testTemplatePath = path.join(__dirname, 'test-template.json');
      fs.writeFileSync(testTemplatePath, JSON.stringify(testTemplate));
      
      try {
        const testValidator = new TemplateValidator(testTemplatePath);
        expect(testValidator.hasDependency('TestResource', 'SomeOtherResource')).toBe(true);
        expect(testValidator.hasDependency('TestResource', 'NonExistent')).toBe(false);
      } finally {
        // Clean up
        if (fs.existsSync(testTemplatePath)) {
          fs.unlinkSync(testTemplatePath);
        }
      }
    });

    test('should get resources by type with no matches', () => {
      const resources = validator.getResourcesByType('AWS::S3::Bucket');
      expect(Object.keys(resources).length).toBe(0);
    });

    test('should check intrinsic function on property without intrinsic', () => {
      // BillingMode doesn't use intrinsic functions
      expect(validator.usesIntrinsicFunction('TransactionTable', ['BillingMode'])).toBe(false);
    });

    test('should check intrinsic function on non-existent resource', () => {
      expect(validator.usesIntrinsicFunction('NonExistent', ['SomeProperty'])).toBe(false);
    });

    test('should handle usesIntrinsicFunction with null property in path', () => {
      // Create a test template with a property path that becomes null
      const testTemplate = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Test template',
        Resources: {
          TestResource: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              SomeProperty: null
            }
          }
        }
      };
      const testTemplatePath = path.join(__dirname, 'test-template-null.json');
      fs.writeFileSync(testTemplatePath, JSON.stringify(testTemplate));
      
      try {
        const testValidator = new TemplateValidator(testTemplatePath);
        // Accessing a nested property on null should return false
        expect(testValidator.usesIntrinsicFunction('TestResource', ['SomeProperty', 'Nested'])).toBe(false);
      } finally {
        if (fs.existsSync(testTemplatePath)) {
          fs.unlinkSync(testTemplatePath);
        }
      }
    });

    test('should handle usesIntrinsicFunction with undefined property in path', () => {
      // Create a test template where a property doesn't exist in the path
      const testTemplate = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Test template',
        Resources: {
          TestResource: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              SomeProperty: {}
            }
          }
        }
      };
      const testTemplatePath = path.join(__dirname, 'test-template-undefined.json');
      fs.writeFileSync(testTemplatePath, JSON.stringify(testTemplate));
      
      try {
        const testValidator = new TemplateValidator(testTemplatePath);
        // Accessing a nested property that doesn't exist should return false
        expect(testValidator.usesIntrinsicFunction('TestResource', ['SomeProperty', 'NonExistent', 'Nested'])).toBe(false);
      } finally {
        if (fs.existsSync(testTemplatePath)) {
          fs.unlinkSync(testTemplatePath);
        }
      }
    });

    test('should check intrinsic function with Fn::Join', () => {
      // Create a test template with Fn::Join to test that branch
      const testTemplate = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Test template',
        Resources: {
          TestResource: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              BucketName: {
                'Fn::Join': ['-', ['test', 'bucket']]
              }
            }
          }
        }
      };
      const testTemplatePath = path.join(__dirname, 'test-template-join.json');
      fs.writeFileSync(testTemplatePath, JSON.stringify(testTemplate));
      
      try {
        const testValidator = new TemplateValidator(testTemplatePath);
        expect(testValidator.usesIntrinsicFunction('TestResource', ['BucketName'])).toBe(true);
      } finally {
        if (fs.existsSync(testTemplatePath)) {
          fs.unlinkSync(testTemplatePath);
        }
      }
    });

    test('should check intrinsic function with Fn::Select', () => {
      // Create a test template with Fn::Select to test that branch
      const testTemplate = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Test template',
        Resources: {
          TestResource: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              BucketName: {
                'Fn::Select': [0, ['test', 'bucket']]
              }
            }
          }
        }
      };
      const testTemplatePath = path.join(__dirname, 'test-template-select.json');
      fs.writeFileSync(testTemplatePath, JSON.stringify(testTemplate));
      
      try {
        const testValidator = new TemplateValidator(testTemplatePath);
        expect(testValidator.usesIntrinsicFunction('TestResource', ['BucketName'])).toBe(true);
      } finally {
        if (fs.existsSync(testTemplatePath)) {
          fs.unlinkSync(testTemplatePath);
        }
      }
    });

    test('should check intrinsic function with Fn::ImportValue', () => {
      // Create a test template with Fn::ImportValue to test that branch
      const testTemplate = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Test template',
        Resources: {
          TestResource: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              BucketName: {
                'Fn::ImportValue': 'SomeExportedValue'
              }
            }
          }
        }
      };
      const testTemplatePath = path.join(__dirname, 'test-template-import.json');
      fs.writeFileSync(testTemplatePath, JSON.stringify(testTemplate));
      
      try {
        const testValidator = new TemplateValidator(testTemplatePath);
        expect(testValidator.usesIntrinsicFunction('TestResource', ['BucketName'])).toBe(true);
      } finally {
        if (fs.existsSync(testTemplatePath)) {
          fs.unlinkSync(testTemplatePath);
        }
      }
    });

    test('should handle template without Parameters section', () => {
      const testTemplate = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Test template without Parameters',
        Resources: {
          TestResource: {
            Type: 'AWS::S3::Bucket'
          }
        }
      };
      const testTemplatePath = path.join(__dirname, 'test-template-no-params.json');
      fs.writeFileSync(testTemplatePath, JSON.stringify(testTemplate));
      
      try {
        const testValidator = new TemplateValidator(testTemplatePath);
        const params = testValidator.getParameters();
        expect(params).toEqual({});
        expect(testValidator.getParameterCount()).toBe(0);
      } finally {
        if (fs.existsSync(testTemplatePath)) {
          fs.unlinkSync(testTemplatePath);
        }
      }
    });

    test('should handle template without Outputs section', () => {
      const testTemplate = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Test template without Outputs',
        Resources: {
          TestResource: {
            Type: 'AWS::S3::Bucket'
          }
        }
      };
      const testTemplatePath = path.join(__dirname, 'test-template-no-outputs.json');
      fs.writeFileSync(testTemplatePath, JSON.stringify(testTemplate));
      
      try {
        const testValidator = new TemplateValidator(testTemplatePath);
        const outputs = testValidator.getOutputs();
        expect(outputs).toEqual({});
        expect(testValidator.getOutputCount()).toBe(0);
      } finally {
        if (fs.existsSync(testTemplatePath)) {
          fs.unlinkSync(testTemplatePath);
        }
      }
    });

    test('should validate environment suffix usage correctly', () => {
      expect(validator.validateEnvironmentSuffixUsage()).toBe(true);
    });

    test('should detect missing EnvironmentSuffix in resource name', () => {
      // Create a test template without EnvironmentSuffix to test that branch
      const testTemplate = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Test template',
        Resources: {
          TestTable: {
            Type: 'AWS::DynamoDB::Table',
            Properties: {
              TableName: {
                'Fn::Sub': '${TableName}'
                // Missing ${EnvironmentSuffix}
              }
            }
          }
        }
      };
      const testTemplatePath = path.join(__dirname, 'test-template-no-suffix.json');
      fs.writeFileSync(testTemplatePath, JSON.stringify(testTemplate));
      
      try {
        const testValidator = new TemplateValidator(testTemplatePath);
        expect(testValidator.validateEnvironmentSuffixUsage()).toBe(false);
      } finally {
        if (fs.existsSync(testTemplatePath)) {
          fs.unlinkSync(testTemplatePath);
        }
      }
    });

    test('should get resource types list', () => {
      const types = validator.getResourceTypes();
      expect(types.length).toBe(4);
    });
  });
});
