import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Serverless Workout Log Processing System - CloudFormation Template Unit Tests (LocalStack Compatible)', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    if (!fs.existsSync(templatePath)) {
      throw new Error(
        'TapStack.json not found. Run: pipenv run cfn-flip lib/TapStack.yml lib/TapStack.json'
      );
    }
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure Validation', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a comprehensive description for LocalStack', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Serverless Workout Log Processing System - LocalStack Compatible Version'
      );
    });

    test('should have valid JSON structure with all required sections', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should NOT have unsupported LocalStack resources', () => {
      const resourceTypes = Object.values(template.Resources).map((r: any) => r.Type);
      
      // These resources are NOT supported in LocalStack and should be removed
      expect(resourceTypes).not.toContain('AWS::ApplicationAutoScaling::ScalableTarget');
      expect(resourceTypes).not.toContain('AWS::ApplicationAutoScaling::ScalingPolicy');
      expect(resourceTypes).not.toContain('AWS::CloudWatch::Alarm');
      expect(resourceTypes).not.toContain('AWS::CloudWatch::Dashboard');
    });
  });

  describe('Parameters Validation', () => {
    test('should have EnvironmentSuffix parameter with correct configuration', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const envSuffixParam = template.Parameters.EnvironmentSuffix;

      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
    });

    test('should have exactly one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });
  });

  describe('DynamoDB Table Resource Validation', () => {
    test('should have WorkoutLogsTable resource with correct type', () => {
      expect(template.Resources.WorkoutLogsTable).toBeDefined();
      const table = template.Resources.WorkoutLogsTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should have correct table configuration', () => {
      const table = template.Resources.WorkoutLogsTable;
      const properties = table.Properties;

      expect(properties.TableName).toEqual({
        'Fn::Sub': 'WorkoutLogs-${EnvironmentSuffix}',
      });
      expect(properties.BillingMode).toBe('PROVISIONED');
    });

    test('should have correct attribute definitions', () => {
      const table = template.Resources.WorkoutLogsTable;
      const attributeDefinitions = table.Properties.AttributeDefinitions;

      expect(attributeDefinitions).toHaveLength(3);

      const userIdAttr = attributeDefinitions.find((attr: any) => attr.AttributeName === 'userId');
      const timestampAttr = attributeDefinitions.find((attr: any) => attr.AttributeName === 'workoutTimestamp');
      const typeAttr = attributeDefinitions.find((attr: any) => attr.AttributeName === 'workoutType');

      expect(userIdAttr.AttributeType).toBe('S');
      expect(timestampAttr.AttributeType).toBe('N');
      expect(typeAttr.AttributeType).toBe('S');
    });

    test('should have correct key schema for primary key', () => {
      const table = template.Resources.WorkoutLogsTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(2);

      const hashKey = keySchema.find((key: any) => key.KeyType === 'HASH');
      const rangeKey = keySchema.find((key: any) => key.KeyType === 'RANGE');

      expect(hashKey.AttributeName).toBe('userId');
      expect(rangeKey.AttributeName).toBe('workoutTimestamp');
    });

    test('should have Global Secondary Index configured correctly', () => {
      const table = template.Resources.WorkoutLogsTable;
      const gsiArray = table.Properties.GlobalSecondaryIndexes;

      expect(gsiArray).toHaveLength(1);

      const workoutTypeIndex = gsiArray[0];
      expect(workoutTypeIndex.IndexName).toBe('WorkoutTypeIndex');
      expect(workoutTypeIndex.Projection.ProjectionType).toBe('ALL');

      const gsiKeySchema = workoutTypeIndex.KeySchema;
      expect(gsiKeySchema).toHaveLength(2);

      const gsiHashKey = gsiKeySchema.find((key: any) => key.KeyType === 'HASH');
      const gsiRangeKey = gsiKeySchema.find((key: any) => key.KeyType === 'RANGE');

      expect(gsiHashKey.AttributeName).toBe('workoutType');
      expect(gsiRangeKey.AttributeName).toBe('workoutTimestamp');
    });

    test('should have provisioned throughput configured', () => {
      const table = template.Resources.WorkoutLogsTable;
      const throughput = table.Properties.ProvisionedThroughput;

      expect(throughput.ReadCapacityUnits).toBe(10);
      expect(throughput.WriteCapacityUnits).toBe(10);

      const gsiThroughput = table.Properties.GlobalSecondaryIndexes[0].ProvisionedThroughput;
      expect(gsiThroughput.ReadCapacityUnits).toBe(5);
      expect(gsiThroughput.WriteCapacityUnits).toBe(5);
    });

    test('should have DynamoDB Streams enabled for LocalStack', () => {
      const table = template.Resources.WorkoutLogsTable;
      const properties = table.Properties;

      expect(properties.StreamSpecification).toBeDefined();
      expect(properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('should NOT have PointInTimeRecovery (not supported in LocalStack)', () => {
      const table = template.Resources.WorkoutLogsTable;
      const properties = table.Properties;

      expect(properties.PointInTimeRecoverySpecification).toBeUndefined();
    });

    test('should have proper resource tags', () => {
      const table = template.Resources.WorkoutLogsTable;
      const tags = table.Properties.Tags;

      expect(tags).toHaveLength(2);

      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      const appTag = tags.find((tag: any) => tag.Key === 'Application');

      expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(appTag.Value).toBe('WorkoutLogSystem');
    });
  });

  describe('IAM Role Resource Validation', () => {
    test('should have Lambda execution role with correct configuration', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      const role = template.Resources.LambdaExecutionRole;

      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Version).toBe('2012-10-17');

      const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal.Service).toBe('lambda.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('should have correct managed policies attached', () => {
      const role = template.Resources.LambdaExecutionRole;
      const managedPolicies = role.Properties.ManagedPolicyArns;

      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });

    test('should have DynamoDB access policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      
      const dynamoPolicy = policies.find((p: any) => p.PolicyName === 'DynamoDBAccessPolicy');
      expect(dynamoPolicy).toBeDefined();
      
      const statement = dynamoPolicy.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toContain('dynamodb:PutItem');
      expect(statement.Action).toContain('dynamodb:GetItem');
      expect(statement.Action).toContain('dynamodb:Query');
      expect(statement.Action).toContain('dynamodb:Scan');
    });

    test('should have SSM parameter access policy (LocalStack compatible)', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      
      const ssmPolicy = policies.find((p: any) => p.PolicyName === 'SSMParameterAccessPolicy');
      expect(ssmPolicy).toBeDefined();
      
      const statement = ssmPolicy.PolicyDocument.Statement[0];
      expect(statement.Resource).toBe('*'); // Wildcard for LocalStack compatibility
    });

    test('should have CloudWatch metrics policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      
      const cwPolicy = policies.find((p: any) => p.PolicyName === 'CloudWatchMetricsPolicy');
      expect(cwPolicy).toBeDefined();
      
      const statement = cwPolicy.PolicyDocument.Statement[0];
      expect(statement.Action).toContain('cloudwatch:PutMetricData');
    });

    test('should have proper role tags', () => {
      const role = template.Resources.LambdaExecutionRole;
      const tags = role.Properties.Tags;

      expect(tags).toHaveLength(1);
      expect(tags[0].Key).toBe('Environment');
      expect(tags[0].Value).toEqual({ Ref: 'EnvironmentSuffix' });
    });
  });

  describe('Lambda Function Resource Validation', () => {
    test('should have ProcessWorkoutLogFunction with correct configuration', () => {
      expect(template.Resources.ProcessWorkoutLogFunction).toBeDefined();
      const lambdaFunction = template.Resources.ProcessWorkoutLogFunction;

      expect(lambdaFunction.Type).toBe('AWS::Lambda::Function');

      const properties = lambdaFunction.Properties;
      expect(properties.Runtime).toBe('python3.10');
      expect(properties.Handler).toBe('index.lambda_handler');
      expect(properties.Timeout).toBe(30);
      expect(properties.MemorySize).toBe(512);
    });

    test('should have GetWorkoutStatsFunction with correct configuration', () => {
      expect(template.Resources.GetWorkoutStatsFunction).toBeDefined();
      const lambdaFunction = template.Resources.GetWorkoutStatsFunction;

      expect(lambdaFunction.Type).toBe('AWS::Lambda::Function');
      expect(lambdaFunction.Properties.Runtime).toBe('python3.10');
      expect(lambdaFunction.Properties.Handler).toBe('index.lambda_handler');
      expect(lambdaFunction.Properties.Timeout).toBe(30);
      expect(lambdaFunction.Properties.MemorySize).toBe(512);
    });

    test('should have correct function names with environment suffix', () => {
      const processFunction = template.Resources.ProcessWorkoutLogFunction;
      expect(processFunction.Properties.FunctionName).toEqual({
        'Fn::Sub': 'ProcessWorkoutLog-${EnvironmentSuffix}'
      });

      const statsFunction = template.Resources.GetWorkoutStatsFunction;
      expect(statsFunction.Properties.FunctionName).toEqual({
        'Fn::Sub': 'GetWorkoutStats-${EnvironmentSuffix}'
      });
    });

    test('should have correct environment variables', () => {
      const processFunction = template.Resources.ProcessWorkoutLogFunction;
      const environment = processFunction.Properties.Environment.Variables;

      expect(environment.TABLE_NAME).toEqual({ Ref: 'WorkoutLogsTable' });
      expect(environment.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(environment.PARAMETER_PREFIX).toEqual({
        'Fn::Sub': '/workout-app/${EnvironmentSuffix}'
      });
    });

    test('should have correct IAM role reference', () => {
      const lambdaFunction = template.Resources.ProcessWorkoutLogFunction;
      const role = lambdaFunction.Properties.Role;

      expect(role).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn']
      });
    });

    test('should have inline code for Lambda functions', () => {
      const processFunction = template.Resources.ProcessWorkoutLogFunction;
      const code = processFunction.Properties.Code.ZipFile;

      expect(code).toBeDefined();
      expect(typeof code).toBe('string');
      expect(code).toContain('import json');
      expect(code).toContain('import boto3');
      expect(code).toContain('lambda_handler');
    });

    test('should have proper Lambda function tags', () => {
      const lambdaFunction = template.Resources.ProcessWorkoutLogFunction;
      const tags = lambdaFunction.Properties.Tags;

      expect(tags).toHaveLength(1);
      expect(tags[0].Key).toBe('Environment');
      expect(tags[0].Value).toEqual({ Ref: 'EnvironmentSuffix' });
    });
  });

  describe('API Gateway Resource Validation', () => {
    test('should have WorkoutLogApi with correct configuration', () => {
      expect(template.Resources.WorkoutLogApi).toBeDefined();
      const api = template.Resources.WorkoutLogApi;

      expect(api.Type).toBe('AWS::ApiGateway::RestApi');

      const properties = api.Properties;
      expect(properties.Name).toEqual({
        'Fn::Sub': 'WorkoutLogAPI-${EnvironmentSuffix}'
      });
      expect(properties.Description).toBe('API for processing workout logs');
      expect(properties.EndpointConfiguration.Types).toEqual(['REGIONAL']);
    });

    test('should have proper API Gateway tags', () => {
      const api = template.Resources.WorkoutLogApi;
      const tags = api.Properties.Tags;

      expect(tags).toHaveLength(1);
      expect(tags[0].Key).toBe('Environment');
      expect(tags[0].Value).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('should have workouts resource', () => {
      expect(template.Resources.WorkoutsResource).toBeDefined();
      const resource = template.Resources.WorkoutsResource;
      
      expect(resource.Type).toBe('AWS::ApiGateway::Resource');
      expect(resource.Properties.PathPart).toBe('workouts');
    });

    test('should have stats resource with userId path parameter', () => {
      expect(template.Resources.StatsResource).toBeDefined();
      expect(template.Resources.StatsUserIdResource).toBeDefined();
      
      const statsResource = template.Resources.StatsResource;
      expect(statsResource.Type).toBe('AWS::ApiGateway::Resource');
      expect(statsResource.Properties.PathPart).toBe('stats');

      const userIdResource = template.Resources.StatsUserIdResource;
      expect(userIdResource.Properties.PathPart).toBe('{userId}');
    });

    test('should have POST method for workouts with NONE authorization (LocalStack)', () => {
      expect(template.Resources.PostWorkoutMethod).toBeDefined();
      const method = template.Resources.PostWorkoutMethod;
      
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('POST');
      expect(method.Properties.AuthorizationType).toBe('NONE'); // LocalStack compatible
    });

    test('should have GET method for stats with NONE authorization (LocalStack)', () => {
      expect(template.Resources.GetStatsMethod).toBeDefined();
      const method = template.Resources.GetStatsMethod;
      
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('GET');
      expect(method.Properties.AuthorizationType).toBe('NONE'); // LocalStack compatible
    });

    test('should have API Gateway deployment', () => {
      expect(template.Resources.ApiDeployment).toBeDefined();
      const deployment = template.Resources.ApiDeployment;
      
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
      expect(deployment.DependsOn).toContain('PostWorkoutMethod');
      expect(deployment.DependsOn).toContain('GetStatsMethod');
    });

    test('should have API Gateway stage (LocalStack compatible)', () => {
      expect(template.Resources.ApiStage).toBeDefined();
      const stage = template.Resources.ApiStage;
      
      expect(stage.Type).toBe('AWS::ApiGateway::Stage');
      expect(stage.Properties.StageName).toEqual({ Ref: 'EnvironmentSuffix' });
      
      // Verify no X-Ray tracing (not supported in LocalStack)
      expect(stage.Properties.TracingEnabled).toBeUndefined();
      
      // Verify no detailed method settings (not fully supported in LocalStack)
      expect(stage.Properties.MethodSettings).toBeUndefined();
    });

    test('should have Lambda permissions for API Gateway', () => {
      expect(template.Resources.ProcessWorkoutInvokePermission).toBeDefined();
      expect(template.Resources.GetStatsInvokePermission).toBeDefined();
      
      const permission = template.Resources.ProcessWorkoutInvokePermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
    });
  });

  describe('SSM Parameters Validation', () => {
    test('should have MaxWorkoutDurationParameter', () => {
      expect(template.Resources.MaxWorkoutDurationParameter).toBeDefined();
      const param = template.Resources.MaxWorkoutDurationParameter;
      
      expect(param.Type).toBe('AWS::SSM::Parameter');
      expect(param.Properties.Type).toBe('String');
      expect(param.Properties.Value).toBe('240');
      expect(param.Properties.Name).toEqual({
        'Fn::Sub': '/workout-app/${EnvironmentSuffix}/max-workout-duration'
      });
    });

    test('should have SupportedWorkoutTypesParameter', () => {
      expect(template.Resources.SupportedWorkoutTypesParameter).toBeDefined();
      const param = template.Resources.SupportedWorkoutTypesParameter;
      
      expect(param.Type).toBe('AWS::SSM::Parameter');
      expect(param.Properties.Type).toBe('StringList');
      expect(param.Properties.Value).toBe('running,cycling,swimming,weightlifting,yoga,crossfit,hiking,walking');
    });
  });

  describe('CloudWatch Logs Validation', () => {
    test('should have ProcessWorkoutLogGroup', () => {
      expect(template.Resources.ProcessWorkoutLogGroup).toBeDefined();
      const logGroup = template.Resources.ProcessWorkoutLogGroup;
      
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/ProcessWorkoutLog-${EnvironmentSuffix}'
      });
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should have GetStatsLogGroup', () => {
      expect(template.Resources.GetStatsLogGroup).toBeDefined();
      const logGroup = template.Resources.GetStatsLogGroup;
      
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/GetWorkoutStats-${EnvironmentSuffix}'
      });
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('Outputs Validation', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ApiEndpoint',
        'WorkoutLogsTableName',
        'ProcessWorkoutLogFunctionArn',
        'GetWorkoutStatsFunctionArn',
        'PostWorkoutEndpoint',
        'GetStatsEndpoint'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have correct API endpoint output', () => {
      const output = template.Outputs.ApiEndpoint;
      expect(output.Description).toBe('API Gateway endpoint URL');
      expect(output.Value).toEqual({
        'Fn::Sub': 'https://${WorkoutLogApi}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentSuffix}'
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': 'WorkoutLogAPI-Endpoint-${EnvironmentSuffix}'
      });
    });

    test('should have correct table name output', () => {
      const output = template.Outputs.WorkoutLogsTableName;
      expect(output.Description).toBe('DynamoDB table name for workout logs');
      expect(output.Value).toEqual({ Ref: 'WorkoutLogsTable' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': 'WorkoutLogsTable-${EnvironmentSuffix}'
      });
    });

    test('should have correct Lambda function ARN outputs', () => {
      const processOutput = template.Outputs.ProcessWorkoutLogFunctionArn;
      expect(processOutput.Description).toBe('ARN of the Process Workout Log Lambda function');
      expect(processOutput.Value).toEqual({
        'Fn::GetAtt': ['ProcessWorkoutLogFunction', 'Arn']
      });

      const statsOutput = template.Outputs.GetWorkoutStatsFunctionArn;
      expect(statsOutput.Description).toBe('ARN of the Get Workout Stats Lambda function');
      expect(statsOutput.Value).toEqual({
        'Fn::GetAtt': ['GetWorkoutStatsFunction', 'Arn']
      });
    });

    test('should have correct endpoint outputs', () => {
      const postOutput = template.Outputs.PostWorkoutEndpoint;
      expect(postOutput.Description).toBe('POST endpoint for submitting workout logs');
      expect(postOutput.Value).toEqual({
        'Fn::Sub': 'https://${WorkoutLogApi}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentSuffix}/workouts'
      });

      const getOutput = template.Outputs.GetStatsEndpoint;
      expect(getOutput.Description).toBe('GET endpoint for retrieving workout statistics');
      expect(getOutput.Value).toEqual({
        'Fn::Sub': 'https://${WorkoutLogApi}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentSuffix}/stats/{userId}'
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resource names should follow environment suffix pattern', () => {
      const workoutLogsTable = template.Resources.WorkoutLogsTable;
      expect(workoutLogsTable.Properties.TableName).toEqual({
        'Fn::Sub': 'WorkoutLogs-${EnvironmentSuffix}'
      });

      const processFunction = template.Resources.ProcessWorkoutLogFunction;
      expect(processFunction.Properties.FunctionName).toEqual({
        'Fn::Sub': 'ProcessWorkoutLog-${EnvironmentSuffix}'
      });

      const statsFunction = template.Resources.GetWorkoutStatsFunction;
      expect(statsFunction.Properties.FunctionName).toEqual({
        'Fn::Sub': 'GetWorkoutStats-${EnvironmentSuffix}'
      });

      const api = template.Resources.WorkoutLogApi;
      expect(api.Properties.Name).toEqual({
        'Fn::Sub': 'WorkoutLogAPI-${EnvironmentSuffix}'
      });
    });
  });

  describe('Lambda Function Code Validation', () => {
    test('ProcessWorkoutLog function should contain required business logic', () => {
      const lambdaFunction = template.Resources.ProcessWorkoutLogFunction;
      const code = lambdaFunction.Properties.Code.ZipFile;

      // Check for required imports
      expect(code).toContain('import json');
      expect(code).toContain('import boto3');
      expect(code).toContain('from datetime import datetime');
      expect(code).toContain('from decimal import Decimal');

      // Check for AWS service clients
      expect(code).toContain('dynamodb = boto3.resource');
      expect(code).toContain('cloudwatch = boto3.client');

      // Check for validation logic
      expect(code).toContain('required_fields');
      expect(code).toContain('userId');
      expect(code).toContain('workoutType');
      expect(code).toContain('duration');
      expect(code).toContain('caloriesBurned');

      // Check for error handling
      expect(code).toContain('try:');
      expect(code).toContain('except Exception as e:');
      expect(code).toContain('statusCode');
    });

    test('ProcessWorkoutLog function should publish CloudWatch metrics', () => {
      const lambdaFunction = template.Resources.ProcessWorkoutLogFunction;
      const code = lambdaFunction.Properties.Code.ZipFile;

      expect(code).toContain('cloudwatch.put_metric_data');
      expect(code).toContain('WorkoutApp');
      expect(code).toContain('WorkoutLogsProcessed');
      expect(code).toContain('MetricName');
      expect(code).toContain('Dimensions');
    });

    test('GetWorkoutStats function should contain required query logic', () => {
      const lambdaFunction = template.Resources.GetWorkoutStatsFunction;
      const code = lambdaFunction.Properties.Code.ZipFile;

      // Check for required imports
      expect(code).toContain('import json');
      expect(code).toContain('import boto3');
      expect(code).toContain('from boto3.dynamodb.conditions import Key');
      expect(code).toContain('from decimal import Decimal');

      // Check for query logic
      expect(code).toContain('table.query');
      expect(code).toContain('KeyConditionExpression');
      expect(code).toContain('userId');

      // Check for statistics calculation
      expect(code).toContain('totalWorkouts');
      expect(code).toContain('totalDuration');
      expect(code).toContain('totalCaloriesBurned');
    });
  });

  describe('LocalStack Compatibility Verification', () => {
    test('should not contain unsupported auto-scaling resources', () => {
      expect(template.Resources.WorkoutLogsTableWriteScalingTarget).toBeUndefined();
      expect(template.Resources.WorkoutLogsTableWriteScalingPolicy).toBeUndefined();
      expect(template.Resources.WorkoutLogsTableReadScalingTarget).toBeUndefined();
      expect(template.Resources.WorkoutLogsTableReadScalingPolicy).toBeUndefined();
      expect(template.Resources.DynamoDBScalingRole).toBeUndefined();
    });

    test('should not contain unsupported monitoring resources', () => {
      expect(template.Resources.HighErrorRateAlarm).toBeUndefined();
      expect(template.Resources.DynamoDBThrottleAlarm).toBeUndefined();
      expect(template.Resources.WorkoutLogDashboard).toBeUndefined();
    });

    test('should use NONE authorization instead of AWS_IAM', () => {
      const postMethod = template.Resources.PostWorkoutMethod;
      const getMethod = template.Resources.GetStatsMethod;
      
      expect(postMethod.Properties.AuthorizationType).toBe('NONE');
      expect(getMethod.Properties.AuthorizationType).toBe('NONE');
    });

    test('should not have X-Ray tracing enabled', () => {
      const stage = template.Resources.ApiStage;
      expect(stage.Properties.TracingEnabled).toBeUndefined();
    });

    test('should have wildcard SSM resource for LocalStack', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const ssmPolicy = policies.find((p: any) => p.PolicyName === 'SSMParameterAccessPolicy');
      
      expect(ssmPolicy.PolicyDocument.Statement[0].Resource).toBe('*');
    });
  });

  describe('Resource Count Validation', () => {
    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(18); // Total resources in LocalStack-compatible template
    });

    test('should have correct resource types distribution', () => {
      const resources = template.Resources;
      const resourceTypes = Object.values(resources).map((r: any) => r.Type);
      
      expect(resourceTypes.filter(t => t === 'AWS::DynamoDB::Table')).toHaveLength(1);
      expect(resourceTypes.filter(t => t === 'AWS::Lambda::Function')).toHaveLength(2);
      expect(resourceTypes.filter(t => t === 'AWS::IAM::Role')).toHaveLength(1);
      expect(resourceTypes.filter(t => t === 'AWS::ApiGateway::RestApi')).toHaveLength(1);
      expect(resourceTypes.filter(t => t === 'AWS::ApiGateway::Resource')).toHaveLength(3);
      expect(resourceTypes.filter(t => t === 'AWS::ApiGateway::Method')).toHaveLength(2);
      expect(resourceTypes.filter(t => t === 'AWS::ApiGateway::Deployment')).toHaveLength(1);
      expect(resourceTypes.filter(t => t === 'AWS::ApiGateway::Stage')).toHaveLength(1);
      expect(resourceTypes.filter(t => t === 'AWS::Lambda::Permission')).toHaveLength(2);
      expect(resourceTypes.filter(t => t === 'AWS::SSM::Parameter')).toHaveLength(2);
      expect(resourceTypes.filter(t => t === 'AWS::Logs::LogGroup')).toHaveLength(2);
    });
  });
});
