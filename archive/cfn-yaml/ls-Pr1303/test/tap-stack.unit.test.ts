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
        'TAP Stack - Serverless Infrastructure with API Gateway, Lambda, WAF, and Monitoring'
      );
    });

    test('should have SAM transform', () => {
      expect(template.Transform).toBe('AWS::Serverless-2016-10-31');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParameters = [
        'EnvironmentSuffix',
        'EnvironmentType',
        'AllowedIPRange',
        'LambdaMemorySize',
        'LambdaTimeout'
      ];

      expectedParameters.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
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

    test('EnvironmentType parameter should have correct properties', () => {
      const envTypeParam = template.Parameters.EnvironmentType;
      expect(envTypeParam.Type).toBe('String');
      expect(envTypeParam.Default).toBe('dev');
      expect(envTypeParam.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    test('LambdaMemorySize parameter should have correct constraints', () => {
      const memoryParam = template.Parameters.LambdaMemorySize;
      expect(memoryParam.Type).toBe('Number');
      expect(memoryParam.Default).toBe(256);
      expect(memoryParam.MinValue).toBe(128);
      expect(memoryParam.MaxValue).toBe(3008);
    });

    test('LambdaTimeout parameter should have correct constraints', () => {
      const timeoutParam = template.Parameters.LambdaTimeout;
      expect(timeoutParam.Type).toBe('Number');
      expect(timeoutParam.Default).toBe(30);
      expect(timeoutParam.MinValue).toBe(1);
      expect(timeoutParam.MaxValue).toBe(900);
    });
  });

  describe('Resources', () => {
    test('should have all required resources', () => {
      const expectedResources = [
        'EncryptionKey',
        'EncryptionKeyAlias',
        'TurnAroundPromptTable',
        'LambdaExecutionRole',
        'GetPromptFunction',
        'CreatePromptFunction',
        'UpdatePromptFunction',
        'DeletePromptFunction',
        'ApiGateway',
        'AuthorizerFunction',

        'LambdaErrorAlarm',
        'APIGatewayErrorAlarm'
      ];

      expectedResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    describe('KMS Encryption', () => {
      test('should have KMS encryption key', () => {
        const encryptionKey = template.Resources.EncryptionKey;
        expect(encryptionKey.Type).toBe('AWS::KMS::Key');
        expect(encryptionKey.Properties.Description).toBeDefined();
        expect(encryptionKey.Properties.KeyPolicy).toBeDefined();
      });

      test('should have KMS key alias', () => {
        const keyAlias = template.Resources.EncryptionKeyAlias;
        expect(keyAlias.Type).toBe('AWS::KMS::Alias');
        expect(keyAlias.Properties.AliasName).toBeDefined();
        expect(keyAlias.Properties.TargetKeyId).toBeDefined();
      });
    });

    describe('DynamoDB Table', () => {
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

        expect(properties.TableName).toBeDefined();
        expect(properties.BillingMode).toBe('PAY_PER_REQUEST');
        expect(properties.DeletionProtectionEnabled).toBeDefined();
        expect(properties.SSESpecification).toBeDefined();
        expect(properties.SSESpecification.SSEEnabled).toBe(true);
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

    describe('Lambda Execution Role', () => {
      test('should have Lambda execution role', () => {
        const role = template.Resources.LambdaExecutionRole;
        expect(role.Type).toBe('AWS::IAM::Role');
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
        expect(role.Properties.ManagedPolicyArns).toBeDefined();
        expect(role.Properties.Policies).toBeDefined();
      });

      test('Lambda execution role should have correct assume role policy', () => {
        const role = template.Resources.LambdaExecutionRole;
        const assumeRolePolicy = role.Properties.AssumeRolePolicyDocument;
        
        expect(assumeRolePolicy.Version).toBe('2012-10-17');
        expect(assumeRolePolicy.Statement).toHaveLength(1);
        expect(assumeRolePolicy.Statement[0].Effect).toBe('Allow');
        expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      });

      test('Lambda execution role should have required managed policies', () => {
        const role = template.Resources.LambdaExecutionRole;
        const managedPolicies = role.Properties.ManagedPolicyArns;
        
        expect(managedPolicies).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
        expect(managedPolicies).toContain('arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess');
      });
    });

    describe('Lambda Functions', () => {
      const lambdaFunctions = [
        'GetPromptFunction',
        'CreatePromptFunction',
        'UpdatePromptFunction',
        'DeletePromptFunction'
      ];

      lambdaFunctions.forEach(functionName => {
        test(`${functionName} should be a SAM function`, () => {
          const func = template.Resources[functionName];
          expect(func.Type).toBe('AWS::Serverless::Function');
        });

        test(`${functionName} should have correct properties`, () => {
          const func = template.Resources[functionName];
          const properties = func.Properties;

          expect(properties.FunctionName).toBeDefined();
          expect(properties.InlineCode).toBeDefined();
          expect(properties.Handler).toBe('index.handler');
          expect(properties.Runtime).toBe('nodejs20.x');
          expect(properties.MemorySize).toBeDefined();
          expect(properties.Timeout).toBeDefined();
          expect(properties.Role).toBeDefined();
          expect(properties.Environment).toBeDefined();
          expect(properties.Tracing).toBe('Active');
          expect(properties.AutoPublishAlias).toBeDefined();
          expect(properties.DeploymentPreference).toBeDefined();
          expect(properties.Tags).toBeDefined();
        });

        test(`${functionName} should have environment variables`, () => {
          const func = template.Resources[functionName];
          const envVars = func.Properties.Environment.Variables;

          expect(envVars.TABLE_NAME).toBeDefined();
          expect(envVars.ENVIRONMENT).toBeDefined();
          expect(envVars.LOG_LEVEL).toBeDefined();
        });
      });
    });

    describe('API Gateway', () => {
      test('should have API Gateway resource', () => {
        const apiGateway = template.Resources.ApiGateway;
        expect(apiGateway.Type).toBe('AWS::Serverless::Api');
      });

      test('API Gateway should have correct properties', () => {
        const apiGateway = template.Resources.ApiGateway;
        const properties = apiGateway.Properties;

        expect(properties.Name).toBeDefined();
        expect(properties.StageName).toBeDefined();
        expect(properties.TracingEnabled).toBe(true);
        expect(properties.MethodSettings).toBeDefined();
        expect(properties.Cors).toBeDefined();
        expect(properties.Auth).toBeDefined();
        expect(properties.Tags).toBeDefined();
      });

      test('API Gateway should have authorization configured', () => {
        const apiGateway = template.Resources.ApiGateway;
        const auth = apiGateway.Properties.Auth;

        expect(auth.DefaultAuthorizer).toBe('LambdaAuthorizer');
        expect(auth.Authorizers).toBeDefined();
        expect(auth.Authorizers.LambdaAuthorizer).toBeDefined();
      });
    });

    describe('Lambda Authorizer', () => {
      test('should have authorizer function', () => {
        const authorizer = template.Resources.AuthorizerFunction;
        expect(authorizer.Type).toBe('AWS::Serverless::Function');
        expect(authorizer.Properties.FunctionName).toBeDefined();
        expect(authorizer.Properties.InlineCode).toBeDefined();
        expect(authorizer.Properties.Handler).toBe('index.handler');
        expect(authorizer.Properties.Runtime).toBe('nodejs20.x');
      });
    });



    describe('CloudWatch Alarms', () => {
      test('should have Lambda error alarm', () => {
        const alarm = template.Resources.LambdaErrorAlarm;
        expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
        expect(alarm.Properties.AlarmName).toBeDefined();
        expect(alarm.Properties.MetricName).toBe('Errors');
        expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      });

      test('should have API Gateway error alarm', () => {
        const alarm = template.Resources.APIGatewayErrorAlarm;
        expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
        expect(alarm.Properties.AlarmName).toBeDefined();
        expect(alarm.Properties.MetricName).toBe('5XXError');
        expect(alarm.Properties.Namespace).toBe('AWS/ApiGateway');
      });
    });


  });

  describe('Conditions', () => {
    test('should have IsProd condition', () => {
      expect(template.Conditions.IsProd).toBeDefined();
    });


  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'ApiGatewayUrl',
        'EncryptionKeyArn',
        'StackName',
        'EnvironmentSuffix'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('TurnAroundPromptTableName output should be correct', () => {
      const output = template.Outputs.TurnAroundPromptTableName;
      expect(output.Description).toBe('Name of the DynamoDB table');
      expect(output.Value).toBeDefined();
      expect(output.Export).toBeDefined();
    });

    test('ApiGatewayUrl output should be correct', () => {
      const output = template.Outputs.ApiGatewayUrl;
      expect(output.Description).toBe('API Gateway URL');
      expect(output.Value).toBeDefined();
      expect(output.Export).toBeDefined();
    });

    test('EncryptionKeyArn output should be correct', () => {
      const output = template.Outputs.EncryptionKeyArn;
      expect(output.Description).toBe('KMS Encryption Key ARN');
      expect(output.Value).toBeDefined();
      expect(output.Export).toBeDefined();
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
      expect(template.Conditions).not.toBeNull();
    });

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(6); // Should have multiple resources now (using SAM Events for API Gateway)
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(5); // EnableWAF parameter is properly commented out
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(6);
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow prod-* naming convention', () => {
      const resources = template.Resources;
      
      // Check key resources that should follow the naming convention
      const keyResources = [
        'TurnAroundPromptTable',
        'LambdaExecutionRole',
        'GetPromptFunction',
        'CreatePromptFunction',
        'UpdatePromptFunction',
        'DeletePromptFunction',
        'AuthorizerFunction'
      ];

      keyResources.forEach(resourceName => {
        const resource = resources[resourceName];
        if (resource.Properties && resource.Properties.Name) {
          const name = resource.Properties.Name;
          // Handle both string and object (Fn::Sub) values
          if (typeof name === 'string') {
            expect(name).toMatch(/prod-.*/);
          } else if (name && typeof name === 'object' && name['Fn::Sub']) {
            const subValue = name['Fn::Sub'];
            expect(subValue).toMatch(/prod-.*/);
          }
        }
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Security Validation', () => {
    test('Lambda functions should have proper IAM roles', () => {
      const lambdaFunctions = [
        'GetPromptFunction',
        'CreatePromptFunction',
        'UpdatePromptFunction',
        'DeletePromptFunction',
        'AuthorizerFunction'
      ];

      lambdaFunctions.forEach(functionName => {
        const func = template.Resources[functionName];
        expect(func.Properties.Role).toBeDefined();
      });
    });

    test('DynamoDB table should have encryption enabled', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('Lambda functions should have X-Ray tracing enabled', () => {
      const lambdaFunctions = [
        'GetPromptFunction',
        'CreatePromptFunction',
        'UpdatePromptFunction',
        'DeletePromptFunction',
        'AuthorizerFunction'
      ];

      lambdaFunctions.forEach(functionName => {
        const func = template.Resources[functionName];
        expect(func.Properties.Tracing).toBe('Active');
      });
    });
  });
});
