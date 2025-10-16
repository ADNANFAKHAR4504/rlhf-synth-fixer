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
    it('should have the correct AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    it('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Serverless Fitness Workout Logging API');
    });

    it('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    it('should have EnvironmentSuffix parameter with correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('prod');
    });

    it('should have ApiStageName parameter with correct properties', () => {
      const param = template.Parameters.ApiStageName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('v1');
      expect(param.AllowedValues).toEqual(['v1', 'v2', 'prod', 'dev']);
    });
  });

  describe('DynamoDB Resources', () => {
    it('should have WorkoutLogsTable with correct configuration', () => {
      const table = template.Resources.WorkoutLogsTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    it('should have correct table name with region and environment suffix', () => {
      const table = template.Resources.WorkoutLogsTable;
      expect(table.Properties.TableName['Fn::Sub']).toBe('workoutlogs-${AWS::Region}-${EnvironmentSuffix}');
    });

    it('should have correct attribute definitions', () => {
      const table = template.Resources.WorkoutLogsTable;
      const attributes = table.Properties.AttributeDefinitions;
      expect(attributes).toHaveLength(3);
      expect(attributes).toContainEqual({ AttributeName: 'userId', AttributeType: 'S' });
      expect(attributes).toContainEqual({ AttributeName: 'workoutTimestamp', AttributeType: 'N' });
      expect(attributes).toContainEqual({ AttributeName: 'workoutType', AttributeType: 'S' });
    });

    it('should have correct key schema', () => {
      const table = template.Resources.WorkoutLogsTable;
      const keySchema = table.Properties.KeySchema;
      expect(keySchema).toHaveLength(2);
      expect(keySchema[0]).toEqual({ AttributeName: 'userId', KeyType: 'HASH' });
      expect(keySchema[1]).toEqual({ AttributeName: 'workoutTimestamp', KeyType: 'RANGE' });
    });

    it('should have WorkoutTypeIndex global secondary index', () => {
      const table = template.Resources.WorkoutLogsTable;
      const gsi = table.Properties.GlobalSecondaryIndexes;
      expect(gsi).toHaveLength(1);
      expect(gsi[0].IndexName).toBe('WorkoutTypeIndex');
      expect(gsi[0].Projection.ProjectionType).toBe('ALL');
    });

    it('should have point-in-time recovery enabled', () => {
      const table = template.Resources.WorkoutLogsTable;
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    it('should have SSE enabled', () => {
      const table = template.Resources.WorkoutLogsTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    it('should have DynamoDB stream enabled', () => {
      const table = template.Resources.WorkoutLogsTable;
      expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    it('should have correct tags', () => {
      const table = template.Resources.WorkoutLogsTable;
      expect(table.Properties.Tags).toContainEqual({ Key: 'Environment', Value: { Ref: 'EnvironmentSuffix' } });
      expect(table.Properties.Tags).toContainEqual({ Key: 'Application', Value: 'FitnessWorkoutAPI' });
    });
  });

  describe('IAM Resources', () => {
    it('should have WorkoutApiLambdaRole', () => {
      const role = template.Resources.WorkoutApiLambdaRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    it('should have correct assume role policy', () => {
      const role = template.Resources.WorkoutApiLambdaRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    it('should have AWSLambdaBasicExecutionRole managed policy', () => {
      const role = template.Resources.WorkoutApiLambdaRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });

    it('should have DynamoDB permissions policy', () => {
      const role = template.Resources.WorkoutApiLambdaRole;
      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(1);

      const dynamoPolicy = policies[0].PolicyDocument.Statement.find(
        (s: any) => s.Action && s.Action.includes('dynamodb:PutItem')
      );
      expect(dynamoPolicy).toBeDefined();
      expect(dynamoPolicy.Action).toContain('dynamodb:Query');
      expect(dynamoPolicy.Action).toContain('dynamodb:GetItem');
      expect(dynamoPolicy.Action).toContain('dynamodb:UpdateItem');
      expect(dynamoPolicy.Action).toContain('dynamodb:DeleteItem');
    });

    it('should have SSM parameter permissions', () => {
      const role = template.Resources.WorkoutApiLambdaRole;
      const ssmPolicy = role.Properties.Policies[0].PolicyDocument.Statement.find(
        (s: any) => s.Action && s.Action.includes('ssm:GetParameter')
      );
      expect(ssmPolicy).toBeDefined();
      expect(ssmPolicy.Action).toContain('ssm:GetParameters');
    });

    it('should have CloudWatch metrics permissions', () => {
      const role = template.Resources.WorkoutApiLambdaRole;
      const cwPolicy = role.Properties.Policies[0].PolicyDocument.Statement.find(
        (s: any) => s.Action && s.Action.includes('cloudwatch:PutMetricData')
      );
      expect(cwPolicy).toBeDefined();
    });
  });

  describe('Lambda Functions', () => {
    const lambdaFunctions = ['CreateWorkoutLogFunction', 'GetWorkoutLogsFunction', 'GetWorkoutStatsFunction'];

    lambdaFunctions.forEach(functionName => {
      describe(`${functionName}`, () => {
        it('should exist and have correct type', () => {
          const lambdaFn = template.Resources[functionName];
          expect(lambdaFn).toBeDefined();
          expect(lambdaFn.Type).toBe('AWS::Lambda::Function');
        });

        it('should have correct runtime and handler', () => {
          const lambdaFn = template.Resources[functionName];
          expect(lambdaFn.Properties.Runtime).toBe('python3.9');
          expect(lambdaFn.Properties.Handler).toBe('index.lambda_handler');
        });

        it('should have correct memory and timeout settings', () => {
          const lambdaFn = template.Resources[functionName];
          expect(lambdaFn.Properties.MemorySize).toBe(256);
          expect(lambdaFn.Properties.Timeout).toBe(30);
        });

        it('should reference the correct IAM role', () => {
          const lambdaFn = template.Resources[functionName];
          expect(lambdaFn.Properties.Role['Fn::GetAtt']).toEqual(['WorkoutApiLambdaRole', 'Arn']);
        });

        it('should have environment variables', () => {
          const lambdaFn = template.Resources[functionName];
          expect(lambdaFn.Properties.Environment.Variables.TABLE_NAME).toEqual({ Ref: 'WorkoutLogsTable' });
          expect(lambdaFn.Properties.Environment.Variables.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
        });

        it('should have inline code', () => {
          const lambdaFn = template.Resources[functionName];
          expect(lambdaFn.Properties.Code.ZipFile).toBeDefined();
          expect(typeof lambdaFn.Properties.Code.ZipFile).toBe('string');
        });
      });
    });

    it('should have Lambda permissions for API Gateway', () => {
      const permissions = ['CreateWorkoutLambdaPermission', 'GetWorkoutsLambdaPermission', 'GetStatsLambdaPermission'];
      permissions.forEach(permission => {
        const perm = template.Resources[permission];
        expect(perm).toBeDefined();
        expect(perm.Type).toBe('AWS::Lambda::Permission');
        expect(perm.Properties.Action).toBe('lambda:InvokeFunction');
        expect(perm.Properties.Principal).toBe('apigateway.amazonaws.com');
      });
    });
  });

  describe('API Gateway Resources', () => {
    it('should have WorkoutApi REST API', () => {
      const api = template.Resources.WorkoutApi;
      expect(api).toBeDefined();
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.Name['Fn::Sub']).toBe('workoutapi-${AWS::Region}-${EnvironmentSuffix}');
    });

    it('should have REGIONAL endpoint configuration', () => {
      const api = template.Resources.WorkoutApi;
      expect(api.Properties.EndpointConfiguration.Types).toEqual(['REGIONAL']);
    });

    it('should have workout and stats resources', () => {
      const workoutResource = template.Resources.WorkoutLogsResource;
      const statsResource = template.Resources.StatsResource;

      expect(workoutResource).toBeDefined();
      expect(workoutResource.Type).toBe('AWS::ApiGateway::Resource');
      expect(workoutResource.Properties.PathPart).toBe('workouts');

      expect(statsResource).toBeDefined();
      expect(statsResource.Type).toBe('AWS::ApiGateway::Resource');
      expect(statsResource.Properties.PathPart).toBe('stats');
    });

    it('should have POST method for creating workouts', () => {
      const method = template.Resources.CreateWorkoutMethod;
      expect(method).toBeDefined();
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('POST');
      expect(method.Properties.AuthorizationType).toBe('AWS_IAM');
    });

    it('should have GET method for retrieving workouts', () => {
      const method = template.Resources.GetWorkoutsMethod;
      expect(method).toBeDefined();
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('GET');
      expect(method.Properties.AuthorizationType).toBe('AWS_IAM');
    });

    it('should have GET method for workout statistics', () => {
      const method = template.Resources.GetStatsMethod;
      expect(method).toBeDefined();
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('GET');
      expect(method.Properties.AuthorizationType).toBe('AWS_IAM');
    });

    it('should have API deployment with correct stage', () => {
      const deployment = template.Resources.ApiDeployment;
      expect(deployment).toBeDefined();
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
      expect(deployment.Properties.StageName).toEqual({ Ref: 'ApiStageName' });
    });

    it('should have correct stage configuration', () => {
      const deployment = template.Resources.ApiDeployment;
      const stageDesc = deployment.Properties.StageDescription;
      expect(stageDesc.MetricsEnabled).toBe(true);
      expect(stageDesc.LoggingLevel).toBe('INFO');
      expect(stageDesc.DataTraceEnabled).toBe(true);
      expect(stageDesc.ThrottlingBurstLimit).toBe(100);
      expect(stageDesc.ThrottlingRateLimit).toBe(50);
    });

    it('should have correct dependencies for deployment', () => {
      const deployment = template.Resources.ApiDeployment;
      expect(deployment.DependsOn).toContain('CreateWorkoutMethod');
      expect(deployment.DependsOn).toContain('GetWorkoutsMethod');
      expect(deployment.DependsOn).toContain('GetStatsMethod');
    });
  });

  describe('CloudWatch Resources', () => {
    it('should have API Gateway log group', () => {
      const logGroup = template.Resources.ApiGatewayLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName['Fn::Sub']).toBe('/aws/apigateway/workoutapi-${AWS::Region}-${EnvironmentSuffix}');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    it('should have CloudWatch dashboard', () => {
      const dashboard = template.Resources.WorkoutApiDashboard;
      expect(dashboard).toBeDefined();
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
      expect(dashboard.Properties.DashboardName['Fn::Sub']).toBe('workoutapi-metrics-${AWS::Region}-${EnvironmentSuffix}');
    });

    it('should have API error alarm', () => {
      const alarm = template.Resources.ApiErrorAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.AlarmName['Fn::Sub']).toBe('workoutapi-errors-${AWS::Region}-${EnvironmentSuffix}');
      expect(alarm.Properties.MetricName).toBe('5XXError');
      expect(alarm.Properties.Threshold).toBe(10);
    });

    it('should have DynamoDB throttle alarm', () => {
      const alarm = template.Resources.DynamoDBThrottleAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.AlarmName['Fn::Sub']).toBe('workout-dynamodb-throttle-${AWS::Region}-${EnvironmentSuffix}');
      expect(alarm.Properties.MetricName).toBe('UserErrors');
      expect(alarm.Properties.Threshold).toBe(5);
    });
  });

  describe('SSM Parameters', () => {
    it('should have API endpoint parameter', () => {
      const param = template.Resources.ApiEndpointParameter;
      expect(param).toBeDefined();
      expect(param.Type).toBe('AWS::SSM::Parameter');
      expect(param.Properties.Name['Fn::Sub']).toBe('/fitness-app/${EnvironmentSuffix}/api-endpoint');
    });

    it('should have table name parameter', () => {
      const param = template.Resources.TableNameParameter;
      expect(param).toBeDefined();
      expect(param.Type).toBe('AWS::SSM::Parameter');
      expect(param.Properties.Name['Fn::Sub']).toBe('/fitness-app/${EnvironmentSuffix}/table-name');
      expect(param.Properties.Value).toEqual({ Ref: 'WorkoutLogsTable' });
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'ApiEndpoint',
      'DynamoDBTableName',
      'DashboardURL',
      'CreateWorkoutEndpoint',
      'GetWorkoutsEndpoint',
      'GetStatsEndpoint',
      'LambdaFunctionNames'
    ];

    expectedOutputs.forEach(outputName => {
      it(`should have ${outputName} output`, () => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
      });
    });

    it('should have correct export names with region and environment', () => {
      expect(template.Outputs.ApiEndpoint.Export.Name['Fn::Sub']).toBe('workoutapi-endpoint-${AWS::Region}-${EnvironmentSuffix}');
      expect(template.Outputs.DynamoDBTableName.Export.Name['Fn::Sub']).toBe('workout-table-name-${AWS::Region}-${EnvironmentSuffix}');
    });

    it('should have Lambda function names output', () => {
      const output = template.Outputs.LambdaFunctionNames;
      expect(output.Value['Fn::Sub']).toContain('create-workout-log-${AWS::Region}-${EnvironmentSuffix}');
      expect(output.Value['Fn::Sub']).toContain('get-workoutlogs-${AWS::Region}-${EnvironmentSuffix}');
      expect(output.Value['Fn::Sub']).toContain('get-workout-stats-${AWS::Region}-${EnvironmentSuffix}');
    });
  });

  describe('Resource Naming Convention', () => {
    it('should follow naming convention with region and environment suffix', () => {
      // Check various resources for proper naming
      const namingChecks = [
        { resource: 'WorkoutLogsTable', path: 'Properties.TableName', expected: 'workoutlogs-${AWS::Region}-${EnvironmentSuffix}' },
        { resource: 'CreateWorkoutLogFunction', path: 'Properties.FunctionName', expected: 'create-workout-log-${AWS::Region}-${EnvironmentSuffix}' },
        { resource: 'WorkoutApi', path: 'Properties.Name', expected: 'workoutapi-${AWS::Region}-${EnvironmentSuffix}' },
      ];

      namingChecks.forEach(check => {
        const resource = template.Resources[check.resource];
        const pathParts = check.path.split('.');
        let value = resource;
        pathParts.forEach(part => {
          value = value[part];
        });
        expect(value['Fn::Sub']).toBe(check.expected);
      });
    });
  });

  describe('Security Best Practices', () => {
    it('should use AWS_IAM authorization for all API methods', () => {
      const methods = ['CreateWorkoutMethod', 'GetWorkoutsMethod', 'GetStatsMethod'];
      methods.forEach(method => {
        expect(template.Resources[method].Properties.AuthorizationType).toBe('AWS_IAM');
      });
    });

    it('should have encryption enabled for DynamoDB', () => {
      const table = template.Resources.WorkoutLogsTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    it('should have point-in-time recovery for DynamoDB', () => {
      const table = template.Resources.WorkoutLogsTable;
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    it('should follow least privilege for IAM policies', () => {
      const role = template.Resources.WorkoutApiLambdaRole;
      const dynamoPolicy = role.Properties.Policies[0].PolicyDocument.Statement.find(
        (s: any) => s.Action && s.Action.includes('dynamodb:PutItem')
      );

      // Check that resources are specific, not wildcard
      expect(dynamoPolicy.Resource).toBeDefined();
      expect(Array.isArray(dynamoPolicy.Resource)).toBe(true);
      expect(dynamoPolicy.Resource.some((r: any) => r['Fn::GetAtt'] || r['Fn::Sub'])).toBe(true);
    });
  });

  describe('Cost Optimization', () => {
    it('should use on-demand billing for DynamoDB', () => {
      const table = template.Resources.WorkoutLogsTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    it('should have reasonable Lambda memory allocation', () => {
      const lambdaFunctions = ['CreateWorkoutLogFunction', 'GetWorkoutLogsFunction', 'GetWorkoutStatsFunction'];
      lambdaFunctions.forEach(functionName => {
        const lambdaFn = template.Resources[functionName];
        expect(lambdaFn.Properties.MemorySize).toBeLessThanOrEqual(256);
      });
    });

    it('should have log retention configured', () => {
      const logGroup = template.Resources.ApiGatewayLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('Monitoring and Observability', () => {
    it('should have CloudWatch dashboard configured', () => {
      const dashboard = template.Resources.WorkoutApiDashboard;
      expect(dashboard).toBeDefined();
      expect(dashboard.Properties.DashboardBody).toBeDefined();
    });

    it('should have alarms for critical metrics', () => {
      expect(template.Resources.ApiErrorAlarm).toBeDefined();
      expect(template.Resources.DynamoDBThrottleAlarm).toBeDefined();
    });

    it('should have metrics enabled for API Gateway stage', () => {
      const deployment = template.Resources.ApiDeployment;
      expect(deployment.Properties.StageDescription.MetricsEnabled).toBe(true);
      expect(deployment.Properties.StageDescription.LoggingLevel).toBe('INFO');
    });
  });
});