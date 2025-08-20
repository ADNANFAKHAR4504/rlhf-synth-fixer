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

  describe('Write Integration TESTS', () => {
    test('Dont forget!', async () => {
      expect(true).toBe(true);
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'TAP Stack - Task Assignment Platform with Serverless Architecture'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParameters = ['EnvironmentSuffix', 'Environment'];

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

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('Production');
      expect(envParam.Description).toBe(
        'Environment name for resource tagging'
      );
    });
  });

  describe('Resources', () => {
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

        expect(properties.TableName).toEqual({
          'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}',
        });
        expect(properties.BillingMode).toBe('PAY_PER_REQUEST');
        expect(properties.DeletionProtectionEnabled).toBe(false);
      });

      test('TurnAroundPromptTable should have production features enabled', () => {
        const table = template.Resources.TurnAroundPromptTable;
        const properties = table.Properties;

        expect(properties.StreamSpecification).toEqual({
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        });
        expect(properties.PointInTimeRecoverySpecification).toEqual({
          PointInTimeRecoveryEnabled: true,
        });
        expect(properties.SSESpecification).toEqual({
          SSEEnabled: true,
        });
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

    describe('IAM Role', () => {
      test('should have LambdaExecutionRole resource', () => {
        expect(template.Resources.LambdaExecutionRole).toBeDefined();
      });

      test('LambdaExecutionRole should be an IAM role', () => {
        const role = template.Resources.LambdaExecutionRole;
        expect(role.Type).toBe('AWS::IAM::Role');
      });

      test('LambdaExecutionRole should have correct assume role policy', () => {
        const role = template.Resources.LambdaExecutionRole;
        const assumeRolePolicy = role.Properties.AssumeRolePolicyDocument;

        expect(assumeRolePolicy.Version).toBe('2012-10-17');
        expect(assumeRolePolicy.Statement[0].Effect).toBe('Allow');
        expect(assumeRolePolicy.Statement[0].Principal.Service).toBe(
          'lambda.amazonaws.com'
        );
        expect(assumeRolePolicy.Statement[0].Action).toBe('sts:AssumeRole');
      });

      test('LambdaExecutionRole should have correct managed policies', () => {
        const role = template.Resources.LambdaExecutionRole;
        const managedPolicies = role.Properties.ManagedPolicyArns;

        expect(managedPolicies).toContain(
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        );
        expect(managedPolicies).toContain(
          'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess'
        );
      });

      test('LambdaExecutionRole should have DynamoDB policy', () => {
        const role = template.Resources.LambdaExecutionRole;
        const policies = role.Properties.Policies;

        const dynamoPolicy = policies.find(
          (p: any) => p.PolicyName === 'DynamoDBPolicy'
        );
        expect(dynamoPolicy).toBeDefined();
        expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain(
          'dynamodb:GetItem'
        );
        expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain(
          'dynamodb:PutItem'
        );
      });
    });

    describe('Lambda Functions', () => {
      const expectedLambdaFunctions = [
        'HelloWorldFunction',
        'DataProcessorFunction',
        'HealthCheckFunction',
      ];

      test.each(expectedLambdaFunctions)(
        'should have %s resource',
        functionName => {
          expect(template.Resources[functionName]).toBeDefined();
        }
      );

      test.each(expectedLambdaFunctions)(
        '%s should be a Lambda function',
        functionName => {
          const func = template.Resources[functionName];
          expect(func.Type).toBe('AWS::Lambda::Function');
        }
      );

      test('HelloWorldFunction should have correct properties', () => {
        const func = template.Resources.HelloWorldFunction;
        const properties = func.Properties;

        expect(properties.Runtime).toBe('python3.9');
        expect(properties.Handler).toBe('index.lambda_handler');
        expect(properties.MemorySize).toBe(128);
        expect(properties.Timeout).toBe(30);
        expect(properties.TracingConfig.Mode).toBe('Active');
      });

      test('DataProcessorFunction should have correct memory and timeout', () => {
        const func = template.Resources.DataProcessorFunction;
        const properties = func.Properties;

        expect(properties.MemorySize).toBe(256);
        expect(properties.Timeout).toBe(60);
      });

      test('HealthCheckFunction should have minimal resources', () => {
        const func = template.Resources.HealthCheckFunction;
        const properties = func.Properties;

        expect(properties.MemorySize).toBe(128);
        expect(properties.Timeout).toBe(15);
      });

      test('all Lambda functions should have environment variables', () => {
        expectedLambdaFunctions.forEach(functionName => {
          const func = template.Resources[functionName];
          const envVars = func.Properties.Environment.Variables;

          expect(envVars.REGION).toEqual({ Ref: 'AWS::Region' });
          expect(envVars.ENVIRONMENT).toEqual({ Ref: 'Environment' });
          expect(envVars.ENVIRONMENT_SUFFIX).toEqual({
            Ref: 'EnvironmentSuffix',
          });
        });
      });
    });

    describe('CloudWatch Log Groups', () => {
      const expectedLogGroups = [
        'HelloWorldLogGroup',
        'DataProcessorLogGroup',
        'HealthCheckLogGroup',
      ];

      test.each(expectedLogGroups)('should have %s resource', logGroupName => {
        expect(template.Resources[logGroupName]).toBeDefined();
      });

      test.each(expectedLogGroups)(
        '%s should be a CloudWatch log group',
        logGroupName => {
          const logGroup = template.Resources[logGroupName];
          expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
        }
      );

      test.each(expectedLogGroups)(
        '%s should have correct retention period',
        logGroupName => {
          const logGroup = template.Resources[logGroupName];
          expect(logGroup.Properties.RetentionInDays).toBe(14);
        }
      );
    });

    describe('API Gateway', () => {
      test('should have TAPServerlessApi resource', () => {
        expect(template.Resources.TAPServerlessApi).toBeDefined();
      });

      test('TAPServerlessApi should be a REST API', () => {
        const api = template.Resources.TAPServerlessApi;
        expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      });

      test('should have all required API Gateway resources', () => {
        const expectedResources = [
          'HelloResource',
          'TasksResource',
          'HealthResource',
        ];

        expectedResources.forEach(resourceName => {
          expect(template.Resources[resourceName]).toBeDefined();
          expect(template.Resources[resourceName].Type).toBe(
            'AWS::ApiGateway::Resource'
          );
        });
      });

      test('should have all required API Gateway methods', () => {
        const expectedMethods = [
          'HelloMethod',
          'TasksPostMethod',
          'HealthMethod',
          'HelloOptionsMethod',
          'TasksOptionsMethod',
        ];

        expectedMethods.forEach(methodName => {
          expect(template.Resources[methodName]).toBeDefined();
          expect(template.Resources[methodName].Type).toBe(
            'AWS::ApiGateway::Method'
          );
        });
      });

      test('should have API Gateway deployment', () => {
        expect(template.Resources.ApiDeployment).toBeDefined();
        expect(template.Resources.ApiDeployment.Type).toBe(
          'AWS::ApiGateway::Deployment'
        );
      });

      test('should have Lambda permissions for API Gateway', () => {
        const expectedPermissions = [
          'HelloLambdaPermission',
          'TasksLambdaPermission',
          'HealthLambdaPermission',
        ];

        expectedPermissions.forEach(permissionName => {
          expect(template.Resources[permissionName]).toBeDefined();
          expect(template.Resources[permissionName].Type).toBe(
            'AWS::Lambda::Permission'
          );
        });
      });
    });

    describe('CloudWatch Alarms', () => {
      test('should have error monitoring alarms', () => {
        const expectedAlarms = [
          'HelloFunctionErrorAlarm',
          'DataProcessorErrorAlarm',
        ];

        expectedAlarms.forEach(alarmName => {
          expect(template.Resources[alarmName]).toBeDefined();
          expect(template.Resources[alarmName].Type).toBe(
            'AWS::CloudWatch::Alarm'
          );
        });
      });

      test('error alarms should have correct configuration', () => {
        const alarm = template.Resources.HelloFunctionErrorAlarm;
        const properties = alarm.Properties;

        expect(properties.MetricName).toBe('Errors');
        expect(properties.Namespace).toBe('AWS/Lambda');
        expect(properties.Statistic).toBe('Sum');
        expect(properties.Threshold).toBe(5);
        expect(properties.ComparisonOperator).toBe('GreaterThanThreshold');
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix',
        'ApiGatewayUrl',
        'HelloWorldFunctionArn',
        'DataProcessorFunctionArn',
        'HealthCheckFunctionArn',
        'LambdaExecutionRoleArn',
        'Region',
        'ApiEndpoints',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    describe('Existing TAP Stack Outputs', () => {
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

    describe('Serverless Architecture Outputs', () => {
      test('ApiGatewayUrl output should be correct', () => {
        const output = template.Outputs.ApiGatewayUrl;
        expect(output.Description).toBe('TAP API Gateway endpoint URL');
        expect(output.Value).toEqual({
          'Fn::Sub':
            'https://${TAPServerlessApi}.execute-api.${AWS::Region}.amazonaws.com/prod',
        });
        expect(output.Export.Name).toEqual({
          'Fn::Sub': '${AWS::StackName}-ApiUrl',
        });
      });

      test('HelloWorldFunctionArn output should be correct', () => {
        const output = template.Outputs.HelloWorldFunctionArn;
        expect(output.Description).toBe('TAP HelloWorld Lambda Function ARN');
        expect(output.Value).toEqual({
          'Fn::GetAtt': ['HelloWorldFunction', 'Arn'],
        });
        expect(output.Export.Name).toEqual({
          'Fn::Sub': '${AWS::StackName}-HelloWorldFunction',
        });
      });

      test('DataProcessorFunctionArn output should be correct', () => {
        const output = template.Outputs.DataProcessorFunctionArn;
        expect(output.Description).toBe(
          'TAP DataProcessor Lambda Function ARN'
        );
        expect(output.Value).toEqual({
          'Fn::GetAtt': ['DataProcessorFunction', 'Arn'],
        });
        expect(output.Export.Name).toEqual({
          'Fn::Sub': '${AWS::StackName}-DataProcessorFunction',
        });
      });

      test('HealthCheckFunctionArn output should be correct', () => {
        const output = template.Outputs.HealthCheckFunctionArn;
        expect(output.Description).toBe('TAP HealthCheck Lambda Function ARN');
        expect(output.Value).toEqual({
          'Fn::GetAtt': ['HealthCheckFunction', 'Arn'],
        });
        expect(output.Export.Name).toEqual({
          'Fn::Sub': '${AWS::StackName}-HealthCheckFunction',
        });
      });

      test('LambdaExecutionRoleArn output should be correct', () => {
        const output = template.Outputs.LambdaExecutionRoleArn;
        expect(output.Description).toBe('TAP Lambda Execution Role ARN');
        expect(output.Value).toEqual({
          'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'],
        });
        expect(output.Export.Name).toEqual({
          'Fn::Sub': '${AWS::StackName}-LambdaExecutionRole',
        });
      });

      test('Region output should be correct', () => {
        const output = template.Outputs.Region;
        expect(output.Description).toBe('Deployment Region');
        expect(output.Value).toEqual({ Ref: 'AWS::Region' });
        expect(output.Export.Name).toEqual({
          'Fn::Sub': '${AWS::StackName}-Region',
        });
      });

      test('ApiEndpoints output should be correct', () => {
        const output = template.Outputs.ApiEndpoints;
        expect(output.Description).toBe('Available API endpoints');
        expect(output.Value).toBeDefined();
        expect(output.Value['Fn::Sub']).toContain('Health Check:');
        expect(output.Value['Fn::Sub']).toContain('Hello World:');
        expect(output.Value['Fn::Sub']).toContain('Tasks (POST):');
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

    test('should have multiple resources for serverless architecture', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(15); // Has Lambda, API Gateway, DynamoDB, IAM, CloudWatch, etc.
    });

    test('should have all required parameters for deployment', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(5); // EnvironmentSuffix, Environment, DeploymentRegion, CrossRegionEndpoint, EnableCrossRegionReplication
    });

    test('should have comprehensive outputs for serverless architecture', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThan(12); // Multiple outputs for API, Lambda functions, multi-region, compliance, etc.
    });

    test('should have proper resource dependencies', () => {
      // Check that Lambda functions depend on log groups
      expect(template.Resources.HelloWorldFunction.DependsOn).toContain(
        'HelloWorldLogGroup'
      );
      expect(template.Resources.DataProcessorFunction.DependsOn).toContain(
        'DataProcessorLogGroup'
      );
      expect(template.Resources.HealthCheckFunction.DependsOn).toContain(
        'HealthCheckLogGroup'
      );

      // Check that API deployment depends on methods
      const apiDeployment = template.Resources.ApiDeployment;
      expect(apiDeployment.DependsOn).toContain('HelloMethod');
      expect(apiDeployment.DependsOn).toContain('TasksPostMethod');
      expect(apiDeployment.DependsOn).toContain('HealthMethod');
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

    test('Lambda functions should follow TAP naming convention', () => {
      const functionNames = [
        'HelloWorldFunction',
        'DataProcessorFunction',
        'HealthCheckFunction',
      ];

      functionNames.forEach(functionName => {
        const func = template.Resources[functionName];
        const functionNameValue = func.Properties.FunctionName;
        expect(functionNameValue['Fn::Sub']).toMatch(
          /^TAP-.+-\$\{AWS::Region\}-\$\{EnvironmentSuffix\}$/
        );
      });
    });

    test('IAM role should follow TAP naming convention', () => {
      const role = template.Resources.LambdaExecutionRole;
      const roleName = role.Properties.RoleName;
      expect(roleName).toEqual({
        'Fn::Sub':
          'TAPServerlessLambdaRole-${AWS::Region}-${EnvironmentSuffix}',
      });
    });

    test('API Gateway should follow TAP naming convention', () => {
      const api = template.Resources.TAPServerlessApi;
      const apiName = api.Properties.Name;
      expect(apiName).toEqual({
        'Fn::Sub': 'TAP-ServerlessAPI-${AWS::Region}-${EnvironmentSuffix}',
      });
    });

    test('CloudWatch log groups should follow TAP naming convention', () => {
      const logGroups = [
        'HelloWorldLogGroup',
        'DataProcessorLogGroup',
        'HealthCheckLogGroup',
      ];

      logGroups.forEach(logGroupName => {
        const logGroup = template.Resources[logGroupName];
        const logGroupNameValue = logGroup.Properties.LogGroupName;
        expect(logGroupNameValue['Fn::Sub']).toMatch(
          /^\/aws\/lambda\/TAP-.+-\$\{AWS::Region\}-\$\{EnvironmentSuffix\}$/
        );
      });
    });

    test('CloudWatch alarms should follow TAP naming convention', () => {
      const alarms = ['HelloFunctionErrorAlarm', 'DataProcessorErrorAlarm'];

      alarms.forEach(alarmName => {
        const alarm = template.Resources[alarmName];
        const alarmNameValue = alarm.Properties.AlarmName;
        expect(alarmNameValue['Fn::Sub']).toMatch(
          /^TAP-.+-Errors-\$\{AWS::Region\}-\$\{EnvironmentSuffix\}$/
        );
      });
    });

    test('export names should follow naming convention', () => {
      // Check specific outputs that we know should follow the pattern
      const outputsToCheck = {
        TurnAroundPromptTableName: 'TurnAroundPromptTableName',
        TurnAroundPromptTableArn: 'TurnAroundPromptTableArn',
        StackName: 'StackName',
        EnvironmentSuffix: 'EnvironmentSuffix',
        ApiGatewayUrl: 'ApiUrl', // This one has a different export name
        HelloWorldFunctionArn: 'HelloWorldFunction',
        DataProcessorFunctionArn: 'DataProcessorFunction',
        HealthCheckFunctionArn: 'HealthCheckFunction',
        LambdaExecutionRoleArn: 'LambdaExecutionRole',
        Region: 'Region',
      };

      Object.keys(outputsToCheck).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        const expectedExportName =
          outputsToCheck[outputKey as keyof typeof outputsToCheck];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${expectedExportName}`,
        });
      });
    });
  });

  describe('Serverless Architecture Integration', () => {
    test('all resources should have proper tagging', () => {
      const resourcesWithTags = [
        'TurnAroundPromptTable',
        'LambdaExecutionRole',
        'HelloWorldFunction',
        'DataProcessorFunction',
        'HealthCheckFunction',
        'HelloWorldLogGroup',
        'DataProcessorLogGroup',
        'HealthCheckLogGroup',
        'TAPServerlessApi',
        'HelloFunctionErrorAlarm',
        'DataProcessorErrorAlarm',
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();

        const tags = resource.Properties.Tags;
        const environmentTag = tags.find(
          (tag: any) => tag.Key === 'Environment'
        );
        const environmentSuffixTag = tags.find(
          (tag: any) => tag.Key === 'EnvironmentSuffix'
        );

        expect(environmentTag).toBeDefined();
        expect(environmentTag.Value).toEqual({ Ref: 'Environment' });
        expect(environmentSuffixTag).toBeDefined();
        expect(environmentSuffixTag.Value).toEqual({
          Ref: 'EnvironmentSuffix',
        });
      });
    });

    test('Lambda functions should have access to DynamoDB table', () => {
      const lambdaFunctions = ['HelloWorldFunction', 'DataProcessorFunction'];

      lambdaFunctions.forEach(functionName => {
        const func = template.Resources[functionName];
        const envVars = func.Properties.Environment.Variables;
        expect(envVars.TABLE_NAME).toEqual({ Ref: 'TurnAroundPromptTable' });
      });
    });

    test('Lambda functions should use correct execution role', () => {
      const lambdaFunctions = [
        'HelloWorldFunction',
        'DataProcessorFunction',
        'HealthCheckFunction',
      ];

      lambdaFunctions.forEach(functionName => {
        const func = template.Resources[functionName];
        expect(func.Properties.Role).toEqual({
          'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'],
        });
      });
    });

    test('API Gateway methods should integrate with correct Lambda functions', () => {
      const methodIntegrations = {
        HelloMethod: 'HelloWorldFunction',
        TasksPostMethod: 'DataProcessorFunction',
        HealthMethod: 'HealthCheckFunction',
      };

      Object.keys(methodIntegrations).forEach(methodName => {
        const method = template.Resources[methodName];
        const expectedFunction =
          methodIntegrations[methodName as keyof typeof methodIntegrations];
        const integrationUri = method.Properties.Integration.Uri;

        expect(integrationUri['Fn::Sub']).toContain(
          `\${${expectedFunction}.Arn}`
        );
      });
    });
  });
});
