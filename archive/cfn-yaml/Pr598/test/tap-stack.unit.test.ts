import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON version of our YAML CloudFormation template
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
        'Serverless application with Lambda, API Gateway, DynamoDB, and monitoring'
      );
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('dev');
      expect(envParam.AllowedValues).toEqual(['dev', 'stage', 'prod']);
      expect(envParam.Description).toBe('Environment name');
    });

    test('should have LogLevel parameter', () => {
      expect(template.Parameters.LogLevel).toBeDefined();
    });

    test('LogLevel parameter should have correct properties', () => {
      const logLevelParam = template.Parameters.LogLevel;
      expect(logLevelParam.Type).toBe('String');
      expect(logLevelParam.Default).toBe('INFO');
      expect(logLevelParam.AllowedValues).toEqual(['INFO', 'WARN', 'ERROR']);
      expect(logLevelParam.Description).toBe('Log level for Lambda function');
    });
  });

  describe('Lambda Function Resources', () => {
    test('should have Lambda execution role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe(
        'AWS::IAM::Role'
      );
    });

    test('should have Lambda function', () => {
      expect(template.Resources.DataProcessorFunction).toBeDefined();
      expect(template.Resources.DataProcessorFunction.Type).toBe(
        'AWS::Lambda::Function'
      );
    });

    test('Lambda function should have correct runtime', () => {
      const lambda = template.Resources.DataProcessorFunction;
      expect(lambda.Properties.Runtime).toBe('python3.9');
    });

    test('Lambda function should have correct environment variables', () => {
      const lambda = template.Resources.DataProcessorFunction;
      const envVars = lambda.Properties.Environment.Variables;

      expect(envVars.STAGE).toEqual({ Ref: 'Environment' });
      expect(envVars.LOG_LEVEL).toEqual({ Ref: 'LogLevel' });
      expect(envVars.TABLE_NAME).toEqual({ Ref: 'DataTable' });
    });

    test('should have CloudWatch Log Group', () => {
      expect(template.Resources.LambdaLogGroup).toBeDefined();
      expect(template.Resources.LambdaLogGroup.Type).toBe(
        'AWS::Logs::LogGroup'
      );
    });
  });

  describe('API Gateway Resources', () => {
    test('should have API Gateway REST API', () => {
      expect(template.Resources.DataApi).toBeDefined();
      expect(template.Resources.DataApi.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should have API Gateway Resource', () => {
      expect(template.Resources.DataResource).toBeDefined();
      expect(template.Resources.DataResource.Type).toBe(
        'AWS::ApiGateway::Resource'
      );
    });

    test('should have API Gateway Method for POST', () => {
      expect(template.Resources.DataMethod).toBeDefined();
      expect(template.Resources.DataMethod.Type).toBe(
        'AWS::ApiGateway::Method'
      );
      expect(template.Resources.DataMethod.Properties.HttpMethod).toBe('POST');
    });

    test('should have API Gateway Deployment', () => {
      expect(template.Resources.ApiDeployment).toBeDefined();
      expect(template.Resources.ApiDeployment.Type).toBe(
        'AWS::ApiGateway::Deployment'
      );
    });

    test('should have Lambda permission for API Gateway', () => {
      expect(template.Resources.LambdaApiGatewayPermission).toBeDefined();
      expect(template.Resources.LambdaApiGatewayPermission.Type).toBe(
        'AWS::Lambda::Permission'
      );
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have DynamoDB table', () => {
      expect(template.Resources.DataTable).toBeDefined();
      expect(template.Resources.DataTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('DynamoDB table should have correct key schema', () => {
      const table = template.Resources.DataTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('id');
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    test('DynamoDB table should have correct provisioned throughput', () => {
      const table = template.Resources.DataTable;
      const throughput = table.Properties.ProvisionedThroughput;

      expect(throughput.ReadCapacityUnits).toBe(5);
      expect(throughput.WriteCapacityUnits).toBe(5);
    });

    test('should have DynamoDB auto scaling resources', () => {
      expect(
        template.Resources.ApplicationAutoScalingDynamoDBRole
      ).toBeDefined();
      expect(template.Resources.ReadCapacityScalableTarget).toBeDefined();
      expect(template.Resources.WriteCapacityScalableTarget).toBeDefined();
      expect(template.Resources.ReadScalingPolicy).toBeDefined();
      expect(template.Resources.WriteScalingPolicy).toBeDefined();
    });

    test('auto scaling targets should have correct capacity limits', () => {
      const readTarget = template.Resources.ReadCapacityScalableTarget;
      const writeTarget = template.Resources.WriteCapacityScalableTarget;

      expect(readTarget.Properties.MinCapacity).toBe(5);
      expect(readTarget.Properties.MaxCapacity).toBe(20);
      expect(writeTarget.Properties.MinCapacity).toBe(5);
      expect(writeTarget.Properties.MaxCapacity).toBe(20);
    });

    test('auto scaling policies should target 70% utilization', () => {
      const readPolicy = template.Resources.ReadScalingPolicy;
      const writePolicy = template.Resources.WriteScalingPolicy;

      expect(
        readPolicy.Properties.TargetTrackingScalingPolicyConfiguration
          .TargetValue
      ).toBe(70.0);
      expect(
        writePolicy.Properties.TargetTrackingScalingPolicyConfiguration
          .TargetValue
      ).toBe(70.0);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have Lambda error alarm', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      expect(template.Resources.LambdaErrorAlarm.Type).toBe(
        'AWS::CloudWatch::Alarm'
      );
    });

    test('error alarm should have correct threshold and evaluation', () => {
      const alarm = template.Resources.LambdaErrorAlarm;

      expect(alarm.Properties.Threshold).toBe(5);
      expect(alarm.Properties.EvaluationPeriods).toBe(1);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ApiEndpoint',
        'LambdaFunctionArn',
        'DynamoDBTableName',
        'DynamoDBTableArn',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ApiEndpoint output should be correct', () => {
      const output = template.Outputs.ApiEndpoint;
      expect(output.Description).toBe('API Gateway endpoint URL');
      expect(output.Value).toEqual({
        'Fn::Sub':
          'https://${DataApi}.execute-api.us-east-1.amazonaws.com/${Environment}/data',
      });
    });

    test('outputs should have export names', () => {
      const expectedExportNames: Record<
        | 'ApiEndpoint'
        | 'LambdaFunctionArn'
        | 'DynamoDBTableName'
        | 'DynamoDBTableArn',
        string
      > = {
        ApiEndpoint: 'ApiEndpoint',
        LambdaFunctionArn: 'LambdaArn',
        DynamoDBTableName: 'TableName',
        DynamoDBTableArn: 'TableArn',
      };

      (
        Object.keys(template.Outputs) as Array<keyof typeof expectedExportNames>
      ).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${expectedExportNames[outputKey]}`,
        });
      });
    });
  });

  describe('IAM Roles and Permissions', () => {
    test('Lambda execution role should have least privilege principles', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;

      expect(policies).toHaveLength(2);

      // CloudWatch Logs policy
      const logPolicy = policies.find(
        (p: any) => p.PolicyName === 'CloudWatchLogs'
      );
      expect(logPolicy).toBeDefined();
      expect(logPolicy.PolicyDocument.Statement[0].Action).toEqual([
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ]);

      // DynamoDB policy
      const dynamoPolicy = policies.find(
        (p: any) => p.PolicyName === 'DynamoDBAccess'
      );
      expect(dynamoPolicy).toBeDefined();
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toEqual([
        'dynamodb:PutItem',
      ]);
    });

    test('DynamoDB auto scaling role should have correct managed policy', () => {
      const role = template.Resources.ApplicationAutoScalingDynamoDBRole;
      expect(role.Properties.ManagedPolicyArns).toEqual([
        'arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess',
      ]);
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

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2); // Environment and LogLevel
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(4);
    });

    test('all resources should be destroyable (no Retain policies)', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).not.toBe('Retain');
        expect(resource.UpdateReplacePolicy).not.toBe('Retain');
      });
    });
  });
});
