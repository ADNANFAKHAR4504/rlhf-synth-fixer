import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Serverless Workout Log Processing System - CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure Validation', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a comprehensive description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Serverless Workout Log Processing System - Handles 3,000+ daily workout logs with auto-scaling, monitoring, and secure access'
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

    test('should have DynamoDB features enabled', () => {
      const table = template.Resources.WorkoutLogsTable;
      const properties = table.Properties;

      expect(properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
      expect(properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
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

    test('should have correct function name with environment suffix', () => {
      const lambdaFunction = template.Resources.ProcessWorkoutLogFunction;
      const functionName = lambdaFunction.Properties.FunctionName;

      expect(functionName).toEqual({
        'Fn::Sub': 'ProcessWorkoutLog-${EnvironmentSuffix}'
      });
    });

    test('should have correct environment variables', () => {
      const lambdaFunction = template.Resources.ProcessWorkoutLogFunction;
      const environment = lambdaFunction.Properties.Environment.Variables;

      expect(environment.TABLE_NAME).toEqual({ Ref: 'WorkoutLogsTable' });
      expect(environment.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('should have correct IAM role reference', () => {
      const lambdaFunction = template.Resources.ProcessWorkoutLogFunction;
      const role = lambdaFunction.Properties.Role;

      expect(role).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn']
      });
    });

    test('should have inline code for Lambda function', () => {
      const lambdaFunction = template.Resources.ProcessWorkoutLogFunction;
      const code = lambdaFunction.Properties.Code.ZipFile;

      expect(code).toBeDefined();
      expect(typeof code).toBe('string');
      expect(code).toContain('import json');
      expect(code).toContain('import boto3');
      expect(code).toContain('lambda_handler');
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
  });

  describe('Outputs Validation', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ApiEndpoint',
        'WorkoutLogsTableName',
        'ProcessWorkoutLogFunctionArn'
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

    test('should have correct Lambda function ARN output', () => {
      const output = template.Outputs.ProcessWorkoutLogFunctionArn;
      expect(output.Description).toBe('ARN of the Process Workout Log Lambda function');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ProcessWorkoutLogFunction', 'Arn']
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': 'ProcessWorkoutLogFunction-Arn-${EnvironmentSuffix}'
      });
    });

  });

  describe('Resource Naming Convention', () => {
    test('all resource names should follow environment suffix pattern', () => {
      const workoutLogsTable = template.Resources.WorkoutLogsTable;
      expect(workoutLogsTable.Properties.TableName).toEqual({
        'Fn::Sub': 'WorkoutLogs-${EnvironmentSuffix}'
      });

      const lambdaFunction = template.Resources.ProcessWorkoutLogFunction;
      expect(lambdaFunction.Properties.FunctionName).toEqual({
        'Fn::Sub': 'ProcessWorkoutLog-${EnvironmentSuffix}'
      });

      const api = template.Resources.WorkoutLogApi;
      expect(api.Properties.Name).toEqual({
        'Fn::Sub': 'WorkoutLogAPI-${EnvironmentSuffix}'
      });
    });

  });


  describe('Lambda Function Code Validation', () => {
    test('Lambda function code should contain required business logic', () => {
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

    test('Lambda function should publish CloudWatch metrics', () => {
      const lambdaFunction = template.Resources.ProcessWorkoutLogFunction;
      const code = lambdaFunction.Properties.Code.ZipFile;

      expect(code).toContain('cloudwatch.put_metric_data');
      expect(code).toContain('WorkoutApp');
      expect(code).toContain('WorkoutLogsProcessed');
      expect(code).toContain('MetricName');
      expect(code).toContain('Dimensions');
    });
  });
});
