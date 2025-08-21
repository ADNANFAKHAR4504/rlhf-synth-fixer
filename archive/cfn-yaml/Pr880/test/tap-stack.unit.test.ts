import fs from 'fs';
import path from 'path';

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

    test('should have serverless API description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('serverless API backend');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('prod');
      expect(envParam.Description).toBe('Environment name for resource naming');
      expect(envParam.AllowedValues).toContain('dev');
      expect(envParam.AllowedValues).toContain('staging');
      expect(envParam.AllowedValues).toContain('prod');
    });
  });

  describe('KMS Resources', () => {
    test('should have DynamoDB KMS key', () => {
      const key = template.Resources.DynamoDBKMSKey;
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.EnableKeyRotation).toBe(true);
      expect(key.Properties.KeyPolicy).toBeDefined();
    });

    test('should have KMS key alias', () => {
      const alias = template.Resources.DynamoDBKMSKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName['Fn::Sub']).toContain(
        'alias/dynamodb-${Environment}-key'
      );
    });

    test('should have proper KMS key policy', () => {
      const key = template.Resources.DynamoDBKMSKey;
      const policy = key.Properties.KeyPolicy;
      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Statement.length).toBeGreaterThanOrEqual(2);

      // Check for root permissions
      const rootStatement = policy.Statement.find(
        (s: any) => s.Sid === 'Enable IAM User Permissions'
      );
      expect(rootStatement).toBeDefined();

      // Check for DynamoDB service permissions
      const dynamoStatement = policy.Statement.find(
        (s: any) => s.Sid === 'Allow DynamoDB Service'
      );
      expect(dynamoStatement).toBeDefined();
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have items table with correct configuration', () => {
      const table = template.Resources.ItemsTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');

      // Check table name
      expect(table.Properties.TableName['Fn::Sub']).toContain(
        'items-table-${Environment}'
      );

      // Check primary key
      expect(table.Properties.AttributeDefinitions[0].AttributeName).toBe('id');
      expect(table.Properties.AttributeDefinitions[0].AttributeType).toBe('S');

      // Check key schema
      expect(table.Properties.KeySchema[0].AttributeName).toBe('id');
      expect(table.Properties.KeySchema[0].KeyType).toBe('HASH');
    });

    test('should have customer-managed KMS encryption', () => {
      const table = template.Resources.ItemsTable;
      const sseSpec = table.Properties.SSESpecification;
      expect(sseSpec).toBeDefined();
      expect(sseSpec.SSEEnabled).toBe(true);
      expect(sseSpec.KMSMasterKeyId).toBeDefined();
      expect(sseSpec.KMSMasterKeyId.Ref).toBe('DynamoDBKMSKey');
    });

    test('should have point-in-time recovery enabled', () => {
      const table = template.Resources.ItemsTable;
      const pitr = table.Properties.PointInTimeRecoverySpecification;
      expect(pitr).toBeDefined();
      expect(pitr.PointInTimeRecoveryEnabled).toBe(true);
    });
  });

  describe('IAM Resources', () => {
    test('should have Lambda execution role', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');

      // Check assume role policy
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement[0].Principal.Service).toBe(
        'lambda.amazonaws.com'
      );
    });

    test('should have least privilege IAM policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0];
      expect(policy).toBeDefined();
      expect(policy.PolicyName).toBe('LambdaExecutionPolicy');

      const statements = policy.PolicyDocument.Statement;
      expect(statements.length).toBeGreaterThanOrEqual(3);

      // Check CloudWatch Logs permissions
      const logsStatement = statements.find((s: any) =>
        s.Action.includes('logs:CreateLogGroup')
      );
      expect(logsStatement).toBeDefined();

      // Check DynamoDB permissions
      const dynamoStatement = statements.find((s: any) =>
        s.Action.includes('dynamodb:PutItem')
      );
      expect(dynamoStatement).toBeDefined();
      expect(dynamoStatement.Resource['Fn::GetAtt']).toBeDefined();

      // Check KMS permissions
      const kmsStatement = statements.find((s: any) =>
        s.Action.includes('kms:Decrypt')
      );
      expect(kmsStatement).toBeDefined();
    });
  });

  describe('Lambda Resources', () => {
    test('should have Lambda function with correct configuration', () => {
      const lambda = template.Resources.ItemsLambdaFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');

      // Check runtime
      expect(lambda.Properties.Runtime).toBe('python3.9');

      // Check handler
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');

      // Check environment variable
      const envVars = lambda.Properties.Environment.Variables;
      expect(envVars.TABLE_NAME).toBeDefined();
      expect(envVars.TABLE_NAME.Ref).toBe('ItemsTable');
    });

    test('should have inline Lambda code', () => {
      const lambda = template.Resources.ItemsLambdaFunction;
      const code = lambda.Properties.Code.ZipFile;
      expect(code).toBeDefined();
      expect(code).toContain('import json');
      expect(code).toContain('import boto3');
      expect(code).toContain('import uuid');
      expect(code).toContain('lambda_handler');
      expect(code).toContain('table.put_item');
    });

    test('should have CloudWatch Log Group', () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(14);
    });

    test('should have API Gateway permission', () => {
      const permission = template.Resources.LambdaApiGatewayPermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
    });
  });

  describe('API Gateway Resources', () => {
    test('should have REST API', () => {
      const api = template.Resources.ItemsRestApi;
      expect(api).toBeDefined();
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.Name['Fn::Sub']).toContain(
        'items-api-${Environment}'
      );
      expect(api.Properties.EndpointConfiguration.Types[0]).toBe('REGIONAL');
    });

    test('should have request validator', () => {
      const validator = template.Resources.ApiRequestValidator;
      expect(validator).toBeDefined();
      expect(validator.Type).toBe('AWS::ApiGateway::RequestValidator');
      expect(validator.Properties.ValidateRequestBody).toBe(true);
    });

    test('should have request model with JSON schema', () => {
      const model = template.Resources.ItemRequestModel;
      expect(model).toBeDefined();
      expect(model.Type).toBe('AWS::ApiGateway::Model');
      expect(model.Properties.ContentType).toBe('application/json');

      const schema = model.Properties.Schema;
      expect(schema.type).toBe('object');
      expect(schema.properties.name).toBeDefined();
      expect(schema.properties.name.type).toBe('string');
      expect(schema.required).toContain('name');
    });

    test('should have items resource', () => {
      const resource = template.Resources.ItemsResource;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::ApiGateway::Resource');
      expect(resource.Properties.PathPart).toBe('items');
    });

    test('should have POST method with validation', () => {
      const method = template.Resources.ItemsPostMethod;
      expect(method).toBeDefined();
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('POST');
      expect(method.Properties.AuthorizationType).toBe('NONE');

      // Check validation
      expect(method.Properties.RequestValidatorId).toBeDefined();
      expect(method.Properties.RequestModels).toBeDefined();

      // Check integration
      const integration = method.Properties.Integration;
      expect(integration.Type).toBe('AWS_PROXY');
      expect(integration.IntegrationHttpMethod).toBe('POST');
    });

    test('should have OPTIONS method for CORS', () => {
      const method = template.Resources.ItemsOptionsMethod;
      expect(method).toBeDefined();
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('OPTIONS');

      const integration = method.Properties.Integration;
      expect(integration.Type).toBe('MOCK');
    });

    test('should have deployment and stage', () => {
      const deployment = template.Resources.ApiDeployment;
      const stage = template.Resources.ApiStage;

      expect(deployment).toBeDefined();
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');

      expect(stage).toBeDefined();
      expect(stage.Type).toBe('AWS::ApiGateway::Stage');

      // Check method settings for metrics (logging removed due to account-level role requirement)
      const methodSettings = stage.Properties.MethodSettings[0];
      expect(methodSettings.MetricsEnabled).toBe(true);
      expect(methodSettings.ResourcePath).toBe('/*');
      expect(methodSettings.HttpMethod).toBe('*');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have SNS topic for alerts', () => {
      const topic = template.Resources.AlertsTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.TopicName['Fn::Sub']).toContain(
        'lambda-alerts-${Environment}'
      );
    });

    test('should have Lambda error alarm', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Threshold).toBe(1);
      expect(alarm.Properties.Period).toBe(60);
      expect(alarm.Properties.EvaluationPeriods).toBe(1);

      // Check alarm actions
      expect(alarm.Properties.AlarmActions).toBeDefined();
      expect(alarm.Properties.AlarmActions[0].Ref).toBe('AlertsTopic');
    });

    test('should have Lambda duration alarm', () => {
      const alarm = template.Resources.LambdaDurationAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Duration');
      expect(alarm.Properties.Threshold).toBe(25000);
    });
  });

  describe('Outputs', () => {
    test('should have API invoke URL output', () => {
      const output = template.Outputs.ApiInvokeUrl;
      expect(output).toBeDefined();
      expect(output.Description).toContain('API Gateway invocation URL');
      expect(output.Value['Fn::Sub']).toContain(
        'https://${ItemsRestApi}.execute-api.${AWS::Region}.amazonaws.com/${Environment}/items'
      );
    });

    test('should have DynamoDB table name output', () => {
      const output = template.Outputs.DynamoDBTableName;
      expect(output).toBeDefined();
      expect(output.Value.Ref).toBe('ItemsTable');
    });

    test('should have SNS topic ARN output', () => {
      const output = template.Outputs.SnsTopicArn;
      expect(output).toBeDefined();
      expect(output.Value.Ref).toBe('AlertsTopic');
    });

    test('should have all required outputs from PROMPT.md', () => {
      const requiredOutputs = [
        'ApiInvokeUrl',
        'DynamoDBTableName',
        'SnsTopicArn',
      ];
      requiredOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have additional useful outputs', () => {
      const additionalOutputs = ['LambdaFunctionArn', 'RestApiId', 'KMSKeyId'];
      additionalOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should have encrypted DynamoDB table', () => {
      const table = template.Resources.ItemsTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('should use customer-managed KMS key', () => {
      const table = template.Resources.ItemsTable;
      expect(table.Properties.SSESpecification.KMSMasterKeyId.Ref).toBe(
        'DynamoDBKMSKey'
      );
    });

    test('should have KMS key rotation enabled', () => {
      const key = template.Resources.DynamoDBKMSKey;
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have least privilege IAM permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0];
      const statements = policy.PolicyDocument.Statement;

      // Check DynamoDB permissions are scoped to specific table
      const dynamoStatement = statements.find((s: any) =>
        s.Action.includes('dynamodb:PutItem')
      );
      expect(dynamoStatement.Resource['Fn::GetAtt']).toBeDefined();

      // Check KMS permissions are scoped to specific key
      const kmsStatement = statements.find((s: any) =>
        s.Action.includes('kms:Decrypt')
      );
      expect(kmsStatement.Resource['Fn::GetAtt']).toBeDefined();
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(15);
    });

    test('should have exactly one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(6);
    });
  });

  describe('PROMPT.md Requirements Compliance', () => {
    test('should have DynamoDB table with string primary key named id', () => {
      const table = template.Resources.ItemsTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.AttributeDefinitions[0].AttributeName).toBe('id');
      expect(table.Properties.AttributeDefinitions[0].AttributeType).toBe('S');
    });

    test('should have customer-managed KMS key for DynamoDB encryption', () => {
      const key = template.Resources.DynamoDBKMSKey;
      const table = template.Resources.ItemsTable;
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(table.Properties.SSESpecification.KMSMasterKeyId.Ref).toBe(
        'DynamoDBKMSKey'
      );
    });

    test('should have Lambda execution role with least privilege', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      const policy = role.Properties.Policies[0];
      const statements = policy.PolicyDocument.Statement;

      // Check required permissions
      const hasLogsPermission = statements.some(
        (s: any) =>
          s.Action.includes('logs:CreateLogGroup') &&
          s.Action.includes('logs:CreateLogStream') &&
          s.Action.includes('logs:PutLogEvents')
      );
      expect(hasLogsPermission).toBe(true);

      const hasDynamoPermission = statements.some(
        (s: any) =>
          s.Action.includes('dynamodb:PutItem') &&
          s.Action.includes('dynamodb:GetItem')
      );
      expect(hasDynamoPermission).toBe(true);

      const hasKmsPermission = statements.some(
        (s: any) =>
          s.Action.includes('kms:Decrypt') &&
          s.Action.includes('kms:GenerateDataKey')
      );
      expect(hasKmsPermission).toBe(true);
    });

    test('should have Lambda function with Python 3.9 runtime', () => {
      const lambda = template.Resources.ItemsLambdaFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.9');
      expect(lambda.Properties.Environment.Variables.TABLE_NAME.Ref).toBe(
        'ItemsTable'
      );
    });

    test('should have API Gateway with POST method and validation', () => {
      const api = template.Resources.ItemsRestApi;
      const resource = template.Resources.ItemsResource;
      const method = template.Resources.ItemsPostMethod;
      const validator = template.Resources.ApiRequestValidator;
      const model = template.Resources.ItemRequestModel;

      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(resource.Properties.PathPart).toBe('items');
      expect(method.Properties.HttpMethod).toBe('POST');
      expect(validator.Properties.ValidateRequestBody).toBe(true);
      expect(model.Properties.Schema.properties.name.type).toBe('string');
      expect(model.Properties.Schema.required).toContain('name');
    });

    test('should have CloudWatch alarm for Lambda errors', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Threshold).toBe(1);
      expect(alarm.Properties.Period).toBe(60);
    });

    test('should have SNS topic for alarm notifications', () => {
      const topic = template.Resources.AlertsTopic;
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(alarm.Properties.AlarmActions[0].Ref).toBe('AlertsTopic');
    });

    test('should have all required outputs from PROMPT.md', () => {
      expect(template.Outputs.ApiInvokeUrl).toBeDefined();
      expect(template.Outputs.DynamoDBTableName).toBeDefined();
      expect(template.Outputs.SnsTopicArn).toBeDefined();
    });
  });
});
