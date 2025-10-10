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
        'Serverless backend for mobile app user profile management'
      );
    });
  });

  describe('Parameters', () => {
    test('should have required parameters', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.DynamoDBReadCapacity).toBeDefined();
      expect(template.Parameters.DynamoDBWriteCapacity).toBeDefined();
      expect(template.Parameters.LogRetentionDays).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix to append to resource names (e.g., dev, staging, prod)'
      );
    });

    test('DynamoDB capacity parameters should have correct bounds', () => {
      const readCapParam = template.Parameters.DynamoDBReadCapacity;
      const writeCapParam = template.Parameters.DynamoDBWriteCapacity;
      
      expect(readCapParam.Type).toBe('Number');
      expect(readCapParam.MinValue).toBe(1);
      expect(readCapParam.MaxValue).toBe(10);
      expect(writeCapParam.Type).toBe('Number');
      expect(writeCapParam.MinValue).toBe(1);
      expect(writeCapParam.MaxValue).toBe(10);
    });
  });

  describe('DynamoDB Table', () => {
    test('should have UserProfilesTable resource', () => {
      expect(template.Resources.UserProfilesTable).toBeDefined();
    });

    test('UserProfilesTable should be a DynamoDB table', () => {
      const table = template.Resources.UserProfilesTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('UserProfilesTable should have correct key schema', () => {
      const table = template.Resources.UserProfilesTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('userId');
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    test('UserProfilesTable should have Global Secondary Indexes', () => {
      const table = template.Resources.UserProfilesTable;
      const gsis = table.Properties.GlobalSecondaryIndexes;

      expect(gsis).toHaveLength(2);
      expect(gsis[0].IndexName).toBe('EmailIndex');
      expect(gsis[1].IndexName).toBe('CreatedAtIndex');
    });

    test('UserProfilesTable should have encryption enabled', () => {
      const table = template.Resources.UserProfilesTable;
      const sseSpec = table.Properties.SSESpecification;

      expect(sseSpec.SSEEnabled).toBe(true);
    });

    test('UserProfilesTable should have point-in-time recovery enabled', () => {
      const table = template.Resources.UserProfilesTable;
      const pitr = table.Properties.PointInTimeRecoverySpecification;

      expect(pitr.PointInTimeRecoveryEnabled).toBe(true);
    });
  });

  describe('Lambda Functions', () => {
    test('should have all CRUD Lambda functions', () => {
      const expectedFunctions = [
        'CreateUserFunction',
        'GetUserFunction',
        'UpdateUserFunction',
        'DeleteUserFunction',
        'ListUsersFunction'
      ];

      expectedFunctions.forEach(functionName => {
        expect(template.Resources[functionName]).toBeDefined();
        expect(template.Resources[functionName].Type).toBe('AWS::Lambda::Function');
      });
    });

    test('Lambda functions should have correct runtime and handler', () => {
      const functions = [
        'CreateUserFunction',
        'GetUserFunction',
        'UpdateUserFunction',
        'DeleteUserFunction',
        'ListUsersFunction'
      ];

      functions.forEach(functionName => {
        const lambdaFunction = template.Resources[functionName];
        expect(lambdaFunction.Properties.Runtime).toBe('python3.9');
        expect(lambdaFunction.Properties.Handler).toBe('index.lambda_handler');
      });
    });

    test('Lambda functions should have X-Ray tracing enabled', () => {
      const functions = [
        'CreateUserFunction',
        'GetUserFunction',
        'UpdateUserFunction',
        'DeleteUserFunction',
        'ListUsersFunction'
      ];

      functions.forEach(functionName => {
        const lambdaFunction = template.Resources[functionName];
        expect(lambdaFunction.Properties.TracingConfig.Mode).toBe('Active');
      });
    });
  });

  describe('API Gateway', () => {
    test('should have REST API resource', () => {
      expect(template.Resources.RestApi).toBeDefined();
      expect(template.Resources.RestApi.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should have API Gateway resources', () => {
      expect(template.Resources.UsersResource).toBeDefined();
      expect(template.Resources.UserIdResource).toBeDefined();
    });

    test('should have HTTP methods for CRUD operations', () => {
      const expectedMethods = [
        'CreateUserMethod',
        'GetUserMethod',
        'UpdateUserMethod',
        'DeleteUserMethod',
        'ListUsersMethod'
      ];

      expectedMethods.forEach(methodName => {
        expect(template.Resources[methodName]).toBeDefined();
        expect(template.Resources[methodName].Type).toBe('AWS::ApiGateway::Method');
      });
    });

    test('should have CORS OPTIONS methods', () => {
      expect(template.Resources.UsersOptionsMethod).toBeDefined();
      expect(template.Resources.UserIdOptionsMethod).toBeDefined();
    });

    test('should have API deployment and stage', () => {
      expect(template.Resources.ApiDeployment).toBeDefined();
      expect(template.Resources.ApiStage).toBeDefined();
    });
  });

  describe('IAM Roles', () => {
    test('should have Lambda execution role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have DynamoDB auto scaling role', () => {
      expect(template.Resources.DynamoDBAutoScalingRole).toBeDefined();
      expect(template.Resources.DynamoDBAutoScalingRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have API Gateway CloudWatch logs role', () => {
      expect(template.Resources.ApiGatewayCloudWatchLogsRole).toBeDefined();
      expect(template.Resources.ApiGatewayCloudWatchLogsRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have CloudWatch log groups for all Lambda functions', () => {
      const expectedLogGroups = [
        'CreateUserLogGroup',
        'GetUserLogGroup',
        'UpdateUserLogGroup',
        'DeleteUserLogGroup',
        'ListUsersLogGroup'
      ];

      expectedLogGroups.forEach(logGroupName => {
        expect(template.Resources[logGroupName]).toBeDefined();
        expect(template.Resources[logGroupName].Type).toBe('AWS::Logs::LogGroup');
      });
    });

    test('should have CloudWatch alarms', () => {
      const expectedAlarms = [
        'DynamoDBThrottleAlarm',
        'LambdaErrorAlarm',
        'ApiGateway4XXAlarm',
        'ApiGateway5XXAlarm'
      ];

      expectedAlarms.forEach(alarmName => {
        expect(template.Resources[alarmName]).toBeDefined();
        expect(template.Resources[alarmName].Type).toBe('AWS::CloudWatch::Alarm');
      });
    });

    test('should have monitoring dashboard', () => {
      expect(template.Resources.MonitoringDashboard).toBeDefined();
      expect(template.Resources.MonitoringDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });
  });

  describe('Systems Manager Parameters', () => {
    test('should have SSM parameters', () => {
      const expectedParameters = [
        'TableNameParameter',
        'ApiEndpointParameter',
        'EnvironmentParameter'
      ];

      expectedParameters.forEach(paramName => {
        expect(template.Resources[paramName]).toBeDefined();
        expect(template.Resources[paramName].Type).toBe('AWS::SSM::Parameter');
      });
    });
  });

  describe('Auto Scaling', () => {
    test('should have DynamoDB auto scaling resources', () => {
      expect(template.Resources.TableReadCapacityScalableTarget).toBeDefined();
      expect(template.Resources.TableWriteCapacityScalableTarget).toBeDefined();
      expect(template.Resources.TableReadScalingPolicy).toBeDefined();
      expect(template.Resources.TableWriteScalingPolicy).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ApiEndpoint',
        'DynamoDBTableName',
        'DynamoDBTableArn',
        'CreateUserFunctionArn',
        'GetUserFunctionArn',
        'UpdateUserFunctionArn',
        'DeleteUserFunctionArn',
        'ListUsersFunctionArn',
        'Environment'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
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

    test('should have correct number of resources for serverless API', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20); // Should have many resources for complete serverless stack
    });

    test('should have multiple parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });

    test('should have multiple outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(9);
    });
  });
});
