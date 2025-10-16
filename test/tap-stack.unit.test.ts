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
      expect(template.Description).toContain('Serverless Fitness Workout Logging API');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('prod');
      expect(envSuffixParam.Description).toContain('Environment identifier');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-z0-9-]+$');
    });

    test('should have ApiStageName parameter', () => {
      expect(template.Parameters.ApiStageName).toBeDefined();
      const stageParam = template.Parameters.ApiStageName;
      expect(stageParam.Type).toBe('String');
      expect(stageParam.Default).toBe('v1');
      expect(stageParam.AllowedValues).toEqual(['v1', 'v2', 'prod', 'dev']);
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have WorkoutLogsTable resource', () => {
      expect(template.Resources.WorkoutLogsTable).toBeDefined();
    });

    test('WorkoutLogsTable should be a DynamoDB table with ON_DEMAND billing', () => {
      const table = template.Resources.WorkoutLogsTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('ON_DEMAND');
    });

    test('WorkoutLogsTable should have correct table name with environment suffix', () => {
      const table = template.Resources.WorkoutLogsTable;
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'workoutlogs-${EnvironmentSuffix}',
      });
    });

    test('WorkoutLogsTable should have correct key schema', () => {
      const table = template.Resources.WorkoutLogsTable;
      const keySchema = table.Properties.KeySchema;
      
      expect(keySchema).toHaveLength(2);
      expect(keySchema[0].AttributeName).toBe('userId');
      expect(keySchema[0].KeyType).toBe('HASH');
      expect(keySchema[1].AttributeName).toBe('workoutTimestamp');
      expect(keySchema[1].KeyType).toBe('RANGE');
    });

    test('WorkoutLogsTable should have Global Secondary Index', () => {
      const table = template.Resources.WorkoutLogsTable;
      const gsi = table.Properties.GlobalSecondaryIndexes;
      
      expect(gsi).toHaveLength(1);
      expect(gsi[0].IndexName).toBe('WorkoutTypeIndex');
      expect(gsi[0].KeySchema[0].AttributeName).toBe('workoutType');
    });

    test('WorkoutLogsTable should have encryption and recovery enabled', () => {
      const table = template.Resources.WorkoutLogsTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('WorkoutLogsTable should have proper tags', () => {
      const table = template.Resources.WorkoutLogsTable;
      const tags = table.Properties.Tags;
      
      expect(tags).toContainEqual({
        Key: 'Environment',
        Value: { Ref: 'EnvironmentSuffix' }
      });
      expect(tags).toContainEqual({
        Key: 'Application',
        Value: 'FitnessWorkoutAPI'
      });
    });
  });

  describe('Lambda Resources', () => {
    test('should have all Lambda functions', () => {
      expect(template.Resources.CreateWorkoutLogFunction).toBeDefined();
      expect(template.Resources.GetWorkoutLogsFunction).toBeDefined();
      expect(template.Resources.GetWorkoutStatsFunction).toBeDefined();
    });

    test('Lambda functions should have correct runtime and configuration', () => {
      const lambdaFunctions = [
        'CreateWorkoutLogFunction',
        'GetWorkoutLogsFunction',
        'GetWorkoutStatsFunction'
      ];

      lambdaFunctions.forEach(funcName => {
        const func = template.Resources[funcName];
        expect(func.Type).toBe('AWS::Lambda::Function');
        expect(func.Properties.Runtime).toBe('python3.9');
        expect(func.Properties.Handler).toBe('index.lambda_handler');
        expect(func.Properties.Timeout).toBe(30);
        expect(func.Properties.MemorySize).toBe(256);
      });
    });

    test('Lambda functions should have environment variables', () => {
      const lambdaFunctions = [
        'CreateWorkoutLogFunction',
        'GetWorkoutLogsFunction', 
        'GetWorkoutStatsFunction'
      ];

      lambdaFunctions.forEach(funcName => {
        const func = template.Resources[funcName];
        expect(func.Properties.Environment.Variables.TABLE_NAME).toEqual({
          Ref: 'WorkoutLogsTable'
        });
        expect(func.Properties.Environment.Variables.ENVIRONMENT).toEqual({
          Ref: 'EnvironmentSuffix'
        });
      });
    });

    test('should have IAM role for Lambda functions', () => {
      expect(template.Resources.WorkoutApiLambdaRole).toBeDefined();
      const role = template.Resources.WorkoutApiLambdaRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('Lambda role should have DynamoDB permissions', () => {
      const role = template.Resources.WorkoutApiLambdaRole;
      const policies = role.Properties.Policies;
      
      expect(policies).toHaveLength(1);
      const dynamoPolicy = policies[0].PolicyDocument.Statement[0];
      expect(dynamoPolicy.Action).toContain('dynamodb:PutItem');
      expect(dynamoPolicy.Action).toContain('dynamodb:GetItem');
      expect(dynamoPolicy.Action).toContain('dynamodb:Query');
    });
  });

  describe('API Gateway Resources', () => {
    test('should have WorkoutApi REST API', () => {
      expect(template.Resources.WorkoutApi).toBeDefined();
      const api = template.Resources.WorkoutApi;
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    test('should have API Gateway resources', () => {
      expect(template.Resources.WorkoutLogsResource).toBeDefined();
      expect(template.Resources.StatsResource).toBeDefined();
    });

    test('should have API Gateway methods with IAM authorization', () => {
      const methods = [
        'CreateWorkoutMethod',
        'GetWorkoutsMethod',
        'GetStatsMethod'
      ];

      methods.forEach(methodName => {
        const method = template.Resources[methodName];
        expect(method.Type).toBe('AWS::ApiGateway::Method');
        expect(method.Properties.AuthorizationType).toBe('AWS_IAM');
      });
    });

    test('should have API Gateway deployment', () => {
      expect(template.Resources.ApiDeployment).toBeDefined();
      const deployment = template.Resources.ApiDeployment;
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
      expect(deployment.Properties.StageName).toEqual({ Ref: 'ApiStageName' });
    });

    test('should have Lambda permissions for API Gateway', () => {
      const permissions = [
        'CreateWorkoutLambdaPermission',
        'GetWorkoutsLambdaPermission',
        'GetStatsLambdaPermission'
      ];

      permissions.forEach(permissionName => {
        const permission = template.Resources[permissionName];
        expect(permission.Type).toBe('AWS::Lambda::Permission');
        expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
      });
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have CloudWatch Log Groups', () => {
      expect(template.Resources.ApiGatewayLogGroup).toBeDefined();
      expect(template.Resources.CreateWorkoutLogGroup).toBeDefined();
      expect(template.Resources.GetWorkoutsLogGroup).toBeDefined();
      expect(template.Resources.GetStatsLogGroup).toBeDefined();
    });

    test('Log Groups should have appropriate retention periods', () => {
      const apiLogGroup = template.Resources.ApiGatewayLogGroup;
      expect(apiLogGroup.Properties.RetentionInDays).toBe(30);

      const lambdaLogGroups = [
        'CreateWorkoutLogGroup',
        'GetWorkoutsLogGroup', 
        'GetStatsLogGroup'
      ];

      lambdaLogGroups.forEach(logGroupName => {
        const logGroup = template.Resources[logGroupName];
        expect(logGroup.Properties.RetentionInDays).toBe(14);
      });
    });

    test('should have CloudWatch alarms', () => {
      expect(template.Resources.ApiErrorAlarm).toBeDefined();
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
    });
  });

  describe('SSM Parameters', () => {
    test('should have SSM parameters', () => {
      expect(template.Resources.ApiEndpointParameter).toBeDefined();
      expect(template.Resources.TableNameParameter).toBeDefined();
    });

    test('SSM parameters should have correct values', () => {
      const apiParam = template.Resources.ApiEndpointParameter;
      expect(apiParam.Type).toBe('AWS::SSM::Parameter');
      expect(apiParam.Properties.Name).toEqual({
        'Fn::Sub': '/fitness-app/${EnvironmentSuffix}/api-endpoint'
      });

      const tableParam = template.Resources.TableNameParameter;
      expect(tableParam.Properties.Value).toEqual({ Ref: 'WorkoutLogsTable' });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ApiEndpoint',
        'DynamoDBTableName',
        'CreateWorkoutEndpoint',
        'GetWorkoutsEndpoint',
        'GetStatsEndpoint',
        'WorkoutApiId',
        'LambdaRoleArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have proper export names with environment suffix', () => {
      const exportsWithSuffix = [
        'ApiEndpoint',
        'DynamoDBTableName',
        'WorkoutApiId',
        'LambdaRoleArn'
      ];

      exportsWithSuffix.forEach(outputName => {
        const output = template.Outputs[outputName];
        if (output.Export) {
          expect(output.Export.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
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

    test('should have reasonable number of resources for fitness API', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(15); // At least DynamoDB, Lambda, API Gateway, IAM, etc.
      expect(resourceCount).toBeLessThan(35); // Not overly complex
    });

    test('should have correct parameter count', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2); // EnvironmentSuffix and ApiStageName
    });

    test('should have appropriate number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(7); // API endpoints, table name, etc.
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow naming convention with environment suffix', () => {
      // Check DynamoDB table name
      const table = template.Resources.WorkoutLogsTable;
      expect(table.Properties.TableName['Fn::Sub']).toContain('${EnvironmentSuffix}');

      // Check Lambda function names
      const lambdaFunctions = [
        'CreateWorkoutLogFunction',
        'GetWorkoutLogsFunction',
        'GetWorkoutStatsFunction'
      ];

      lambdaFunctions.forEach(funcName => {
        const func = template.Resources[funcName];
        expect(func.Properties.FunctionName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });

      // Check API Gateway name
      const api = template.Resources.WorkoutApi;
      expect(api.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should use consistent resource prefixes', () => {
      // Lambda functions should start with workout-related names
      expect(template.Resources.CreateWorkoutLogFunction.Properties.FunctionName['Fn::Sub'])
        .toContain('create-workout-log');
      expect(template.Resources.GetWorkoutLogsFunction.Properties.FunctionName['Fn::Sub'])
        .toContain('get-workoutlogs');
      
      // API should have workout prefix
      expect(template.Resources.WorkoutApi.Properties.Name['Fn::Sub'])
        .toContain('workoutapi');
      
      // Table should have workout-related name
      expect(template.Resources.WorkoutLogsTable.Properties.TableName['Fn::Sub'])
        .toContain('workoutlogs');
    });
  });
});
