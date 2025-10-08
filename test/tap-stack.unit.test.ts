import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Serverless API CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
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
        'Serverless API with API Gateway, Lambda, DynamoDB, CloudWatch, and Parameter Store'
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
      expect(envSuffixParam.Description).toContain('Environment suffix');
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have UserDataTable resource', () => {
      expect(template.Resources.UserDataTable).toBeDefined();
    });

    test('UserDataTable should be a DynamoDB table', () => {
      const table = template.Resources.UserDataTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('UserDataTable should have correct properties', () => {
      const table = template.Resources.UserDataTable;
      const properties = table.Properties;

      expect(properties.TableName).toEqual({
        'Fn::Sub': 'user-data-${EnvironmentSuffix}',
      });
      expect(properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('UserDataTable should have correct attribute definitions', () => {
      const table = template.Resources.UserDataTable;
      const attributeDefinitions = table.Properties.AttributeDefinitions;

      expect(attributeDefinitions).toHaveLength(2);
      expect(attributeDefinitions[0]).toEqual({
        AttributeName: 'userId',
        AttributeType: 'S'
      });
      expect(attributeDefinitions[1]).toEqual({
        AttributeName: 'timestamp',
        AttributeType: 'N'
      });
    });

    test('UserDataTable should have correct key schema', () => {
      const table = template.Resources.UserDataTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(2);
      expect(keySchema[0]).toEqual({
        AttributeName: 'userId',
        KeyType: 'HASH'
      });
      expect(keySchema[1]).toEqual({
        AttributeName: 'timestamp',
        KeyType: 'RANGE'
      });
    });

    test('UserDataTable should have security features enabled', () => {
      const table = template.Resources.UserDataTable;
      const properties = table.Properties;

      expect(properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
      expect(properties.SSESpecification.SSEEnabled).toBe(true);
      expect(properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });
  });

  describe('Lambda Resources', () => {
    test('should have Lambda execution role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have Lambda function', () => {
      expect(template.Resources.ApiLambdaFunction).toBeDefined();
      expect(template.Resources.ApiLambdaFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda function should have correct runtime and handler', () => {
      const lambda = template.Resources.ApiLambdaFunction;
      const properties = lambda.Properties;

      expect(properties.Runtime).toBe('python3.10');
      expect(properties.Handler).toBe('index.lambda_handler');
      expect(properties.Timeout).toBe(30);
      expect(properties.MemorySize).toBe(256);
    });

    test('Lambda function should have correct environment variables', () => {
      const lambda = template.Resources.ApiLambdaFunction;
      const envVars = lambda.Properties.Environment.Variables;

      expect(envVars.TABLE_NAME).toEqual({ Ref: 'UserDataTable' });
      expect(envVars.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(envVars.PARAMETER_PREFIX).toEqual({
        'Fn::Sub': '/serverless-api/${EnvironmentSuffix}'
      });
    });

    test('should have Lambda log group', () => {
      expect(template.Resources.ApiLambdaLogGroup).toBeDefined();
      expect(template.Resources.ApiLambdaLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('Lambda log group should have correct retention', () => {
      const logGroup = template.Resources.ApiLambdaLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('API Gateway Resources', () => {
    test('should have API Gateway REST API', () => {
      expect(template.Resources.ApiGateway).toBeDefined();
      expect(template.Resources.ApiGateway.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should have all required API resources', () => {
      const requiredResources = ['UsersResource', 'UserIdResource', 'HealthResource'];
      requiredResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
        expect(template.Resources[resourceName].Type).toBe('AWS::ApiGateway::Resource');
      });
    });

    test('should have all required API methods', () => {
      const requiredMethods = ['UsersPostMethod', 'UserIdGetMethod', 'HealthGetMethod'];
      requiredMethods.forEach(methodName => {
        expect(template.Resources[methodName]).toBeDefined();
        expect(template.Resources[methodName].Type).toBe('AWS::ApiGateway::Method');
      });
    });

    test('API methods should have correct HTTP methods', () => {
      expect(template.Resources.UsersPostMethod.Properties.HttpMethod).toBe('POST');
      expect(template.Resources.UserIdGetMethod.Properties.HttpMethod).toBe('GET');
      expect(template.Resources.HealthGetMethod.Properties.HttpMethod).toBe('GET');
    });

    test('should have API deployment and stage', () => {
      expect(template.Resources.ApiDeployment).toBeDefined();
      expect(template.Resources.ApiDeployment.Type).toBe('AWS::ApiGateway::Deployment');
      expect(template.Resources.ApiStage).toBeDefined();
      expect(template.Resources.ApiStage.Type).toBe('AWS::ApiGateway::Stage');
    });

    test('API stage should have monitoring enabled', () => {
      const stage = template.Resources.ApiStage;
      const methodSettings = stage.Properties.MethodSettings[0];

      expect(stage.Properties.TracingEnabled).toBe(true);
      expect(methodSettings.MetricsEnabled).toBe(true);
      expect(methodSettings.DataTraceEnabled).toBe(true);
      expect(methodSettings.LoggingLevel).toBe('INFO');
    });

    test('should have Lambda permission for API Gateway', () => {
      expect(template.Resources.LambdaApiGatewayPermission).toBeDefined();
      expect(template.Resources.LambdaApiGatewayPermission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have Lambda error alarm', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      expect(template.Resources.LambdaErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have API Gateway 5XX error alarm', () => {
      expect(template.Resources.ApiGateway5XXAlarm).toBeDefined();
      expect(template.Resources.ApiGateway5XXAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have CloudWatch dashboard', () => {
      expect(template.Resources.ApiDashboard).toBeDefined();
      expect(template.Resources.ApiDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('alarms should have correct thresholds', () => {
      const lambdaAlarm = template.Resources.LambdaErrorAlarm;
      const apiAlarm = template.Resources.ApiGateway5XXAlarm;

      expect(lambdaAlarm.Properties.Threshold).toBe(5);
      expect(lambdaAlarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(apiAlarm.Properties.Threshold).toBe(10);
      expect(apiAlarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });
  });

  describe('Parameter Store Resources', () => {
    test('should have all required SSM parameters', () => {
      const requiredParams = ['ApiConfigMaxRetries', 'ApiConfigTimeout', 'ApiConfigRateLimit'];
      requiredParams.forEach(paramName => {
        expect(template.Resources[paramName]).toBeDefined();
        expect(template.Resources[paramName].Type).toBe('AWS::SSM::Parameter');
      });
    });

    test('SSM parameters should have correct values', () => {
      expect(template.Resources.ApiConfigMaxRetries.Properties.Value).toBe('3');
      expect(template.Resources.ApiConfigTimeout.Properties.Value).toBe('30');
      expect(template.Resources.ApiConfigRateLimit.Properties.Value).toBe('1000');
    });
  });

  describe('IAM Security', () => {
    test('Lambda execution role should have correct policies', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies[0].PolicyDocument.Statement;

      expect(policies).toHaveLength(3);
      expect(policies[0].Action).toContain('dynamodb:PutItem');
      expect(policies[1].Action).toContain('ssm:GetParameter');
      expect(policies[2].Action).toContain('cloudwatch:PutMetricData');
    });

    test('IAM role should follow least privilege principle', () => {
      const role = template.Resources.LambdaExecutionRole;
      const dynamoPolicy = role.Properties.Policies[0].PolicyDocument.Statement[0];
      const ssmPolicy = role.Properties.Policies[0].PolicyDocument.Statement[1];

      expect(dynamoPolicy.Resource).toEqual({
        'Fn::GetAtt': ['UserDataTable', 'Arn']
      });
      expect(ssmPolicy.Resource).toEqual({
        'Fn::Sub': 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/serverless-api/${EnvironmentSuffix}/*'
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ApiUrl',
        'LambdaFunctionArn',
        'DynamoDBTableName',
        'DashboardURL',
        'ParameterStorePrefix'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('API URL output should be correct', () => {
      const output = template.Outputs.ApiUrl;
      expect(output.Description).toContain('API Gateway endpoint URL');
      expect(output.Value).toEqual({
        'Fn::Sub': 'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentSuffix}'
      });
    });

  });

  describe('Resource Tagging', () => {
    test('DynamoDB table should have environment tags', () => {
      const table = template.Resources.UserDataTable;
      const tags = table.Properties.Tags;

      expect(tags).toContainEqual({
        Key: 'Environment',
        Value: { Ref: 'EnvironmentSuffix' }
      });
      expect(tags).toContainEqual({
        Key: 'Application',
        Value: 'ServerlessAPI'
      });
    });

    test('Lambda function should have environment tags', () => {
      const lambda = template.Resources.ApiLambdaFunction;
      const tags = lambda.Properties.Tags;

      expect(tags).toContainEqual({
        Key: 'Environment',
        Value: { Ref: 'EnvironmentSuffix' }
      });
    });
  });

  describe('Resource Counting', () => {

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
    test('resources should follow naming convention with environment suffix', () => {
      const table = template.Resources.UserDataTable;
      const lambda = template.Resources.ApiLambdaFunction;
      const api = template.Resources.ApiGateway;

      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'user-data-${EnvironmentSuffix}',
      });
      expect(lambda.Properties.FunctionName).toEqual({
        'Fn::Sub': 'api-handler-${EnvironmentSuffix}',
      });
      expect(api.Properties.Name).toEqual({
        'Fn::Sub': 'serverless-api-${EnvironmentSuffix}',
      });
    });
  });
});
