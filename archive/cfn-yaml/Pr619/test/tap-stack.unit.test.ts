import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Serverless Application CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the converted JSON template
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have correct description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Serverless application infrastructure with Lambda, API Gateway, and DynamoDB'
      );
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('dev');
      expect(envParam.AllowedValues).toEqual(['dev', 'stage', 'prod']);
    });

    test('should have LogLevel parameter', () => {
      expect(template.Parameters.LogLevel).toBeDefined();
      const logParam = template.Parameters.LogLevel;
      expect(logParam.Type).toBe('String');
      expect(logParam.Default).toBe('INFO');
      expect(logParam.AllowedValues).toEqual(['INFO', 'WARN', 'ERROR']);
    });

    test('should have SNSEmail parameter', () => {
      expect(template.Parameters.SNSEmail).toBeDefined();
      const emailParam = template.Parameters.SNSEmail;
      expect(emailParam.Type).toBe('String');
      expect(emailParam.Default).toBe('no-reply@example.com');
    });
  });

  describe('KMS Resources', () => {
    test('should have DynamoDB encryption key', () => {
      expect(template.Resources.DynamoDBEncryptionKey).toBeDefined();
      const kmsKey = template.Resources.DynamoDBEncryptionKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
      expect(kmsKey.Properties.KeyPolicy).toBeDefined();
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.DynamoDBEncryptionKeyAlias).toBeDefined();
      const keyAlias = template.Resources.DynamoDBEncryptionKeyAlias;
      expect(keyAlias.Type).toBe('AWS::KMS::Alias');
      expect(keyAlias.Properties.TargetKeyId).toEqual({
        Ref: 'DynamoDBEncryptionKey',
      });
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have DataTable with correct configuration', () => {
      expect(template.Resources.DataTable).toBeDefined();
      const table = template.Resources.DataTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');

      // Check key schema
      expect(table.Properties.KeySchema).toHaveLength(2);
      expect(table.Properties.KeySchema[0]).toEqual({
        AttributeName: 'id',
        KeyType: 'HASH',
      });
      expect(table.Properties.KeySchema[1]).toEqual({
        AttributeName: 'timestamp',
        KeyType: 'RANGE',
      });

      // Check encryption
      expect(table.Properties.SSESpecification).toBeDefined();
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('DataTable should have provisioned throughput', () => {
      const table = template.Resources.DataTable;
      expect(table.Properties.ProvisionedThroughput).toEqual({
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      });
    });
  });

  describe('Lambda Resources', () => {
    test('should have Lambda execution role with correct policies', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.Policies).toHaveLength(3);

      // Check CloudWatch policy
      const cloudWatchPolicy = role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'CloudWatchLogsPolicy'
      );
      expect(cloudWatchPolicy).toBeDefined();

      // Check DynamoDB policy
      const dynamoPolicy = role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'DynamoDBPutItemPolicy'
      );
      expect(dynamoPolicy).toBeDefined();
    });

    test('should have Lambda function with correct configuration', () => {
      expect(template.Resources.DataProcessorFunction).toBeDefined();
      const lambda = template.Resources.DataProcessorFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.9');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
      expect(lambda.Properties.Environment.Variables.STAGE).toEqual({
        Ref: 'Environment',
      });
      expect(
        lambda.Properties.Environment.Variables.DYNAMODB_TABLE_NAME
      ).toEqual({ Ref: 'DataTable' });
    });

    test('should have Lambda permission for API Gateway', () => {
      expect(template.Resources.LambdaApiGatewayPermission).toBeDefined();
      const permission = template.Resources.LambdaApiGatewayPermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
    });
  });

  describe('API Gateway Resources', () => {
    test('should have REST API', () => {
      expect(template.Resources.DataApi).toBeDefined();
      const api = template.Resources.DataApi;
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.EndpointConfiguration.Types).toEqual(['REGIONAL']);
    });

    test('should have data resource path', () => {
      expect(template.Resources.DataResource).toBeDefined();
      const resource = template.Resources.DataResource;
      expect(resource.Type).toBe('AWS::ApiGateway::Resource');
      expect(resource.Properties.PathPart).toBe('data');
    });

    test('should have POST method with AWS_PROXY integration', () => {
      expect(template.Resources.DataPostMethod).toBeDefined();
      const method = template.Resources.DataPostMethod;
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('POST');
      expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
    });

    test('should have API deployment and stage', () => {
      expect(template.Resources.ApiDeployment).toBeDefined();
      expect(template.Resources.ApiStage).toBeDefined();

      const stage = template.Resources.ApiStage;
      expect(stage.Properties.MethodSettings[0].ThrottlingRateLimit).toBe(100);
      expect(stage.Properties.MethodSettings[0].ThrottlingBurstLimit).toBe(50);
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have log groups for Lambda and API Gateway', () => {
      expect(template.Resources.LambdaLogGroup).toBeDefined();
      expect(template.Resources.ApiGatewayLogGroup).toBeDefined();

      const lambdaLogGroup = template.Resources.LambdaLogGroup;
      expect(lambdaLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(lambdaLogGroup.Properties.RetentionInDays).toBe(14);
    });

    test('should have CloudWatch alarm for Lambda errors', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Threshold).toBe(0);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });
  });

  describe('SNS Resources', () => {
    test('should have SNS topic and subscription', () => {
      expect(template.Resources.AlarmNotificationTopic).toBeDefined();
      expect(template.Resources.AlarmNotificationSubscription).toBeDefined();

      const subscription = template.Resources.AlarmNotificationSubscription;
      expect(subscription.Properties.Protocol).toBe('email');
      expect(subscription.Properties.Endpoint).toEqual({ Ref: 'SNSEmail' });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ApiGatewayUrl',
        'LambdaFunctionArn',
        'DynamoDBTableName',
        'CloudWatchAlarmName',
        'KMSKeyId',
        'SNSTopicArn',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ApiGatewayUrl output should be correct', () => {
      const output = template.Outputs.ApiGatewayUrl;
      expect(output.Description).toBe('API Gateway endpoint URL');
      expect(output.Value['Fn::Sub']).toContain(
        '${DataApi}.execute-api.us-east-1.amazonaws.com'
      );
    });

    test('outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });
  });

  describe('Security Validation', () => {
    test('Lambda function should have least privilege IAM policies', () => {
      const role = template.Resources.LambdaExecutionRole;
      const dynamoPolicy = role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'DynamoDBPutItemPolicy'
      );

      // Should only have PutItem permission, not broader permissions
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toEqual([
        'dynamodb:PutItem',
      ]);
    });

    test('DynamoDB table should use KMS encryption', () => {
      const table = template.Resources.DataTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.SSESpecification.KMSMasterKeyId).toBeDefined();
    });

    test('KMS key should have proper key policy', () => {
      const kmsKey = template.Resources.DynamoDBEncryptionKey;
      const keyPolicy = kmsKey.Properties.KeyPolicy;

      expect(keyPolicy.Statement).toHaveLength(2);
      // Root account permissions
      expect(keyPolicy.Statement[0].Principal.AWS['Fn::Sub']).toContain('root');
      // DynamoDB service permissions
      expect(keyPolicy.Statement[1].Principal.Service).toBe(
        'dynamodb.amazonaws.com'
      );
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

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(16); // All serverless resources
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3); // Environment, LogLevel, SNSEmail
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(6); // All required outputs
    });
  });
});
