import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Serverless Logistics Processing Stack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON template converted from YAML
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a proper description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Serverless Logistics Processing System with EventBridge, Lambda, DynamoDB, CloudWatch, and SNS'
      );
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have required parameters', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.AlertEmail).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter with correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-z0-9-]+$');
      expect(param.ConstraintDescription).toBe(
        'Must contain only lowercase letters, numbers, and hyphens'
      );
    });

    test('should have AlertEmail parameter with correct properties', () => {
      const param = template.Parameters.AlertEmail;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('test@test.com');
      expect(param.AllowedPattern).toBeDefined();
      expect(param.ConstraintDescription).toBe('Must be a valid email address');
    });
  });

  describe('Resources', () => {
    test('should have ShipmentLogsTable resource', () => {
      expect(template.Resources.ShipmentLogsTable).toBeDefined();
      const table = template.Resources.ShipmentLogsTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should have Lambda function resource', () => {
      expect(template.Resources.ShipmentProcessorFunction).toBeDefined();
      const func = template.Resources.ShipmentProcessorFunction;
      expect(func.Type).toBe('AWS::Lambda::Function');
      expect(func.Properties.Runtime).toBe('python3.10');
      expect(func.Properties.Handler).toBe('index.lambda_handler');
      expect(func.Properties.Timeout).toBe(30);
      expect(func.Properties.MemorySize).toBe(256);
    });

    test('should have EventBridge rule resource', () => {
      expect(template.Resources.ShipmentUpdateRule).toBeDefined();
      const rule = template.Resources.ShipmentUpdateRule;
      expect(rule.Type).toBe('AWS::Events::Rule');
      expect(rule.Properties.State).toBe('ENABLED');
      expect(rule.Properties.EventPattern.source).toContain('logistics.shipments');
      expect(rule.Properties.EventPattern['detail-type']).toContain('Shipment Update');
    });

    test('should have SNS topic and subscription', () => {
      expect(template.Resources.AlertTopic).toBeDefined();
      expect(template.Resources.AlertTopicSubscription).toBeDefined();
      
      const topic = template.Resources.AlertTopic;
      const subscription = template.Resources.AlertTopicSubscription;
      
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(subscription.Type).toBe('AWS::SNS::Subscription');
      expect(subscription.Properties.Protocol).toBe('email');
    });

    test('should have IAM role with proper permissions', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.Policies).toBeDefined();
      expect(role.Properties.Policies[0].PolicyDocument.Statement).toBeDefined();
    });

    test('should have CloudWatch alarms', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      expect(template.Resources.LambdaThrottleAlarm).toBeDefined();
      expect(template.Resources.LambdaDurationAlarm).toBeDefined();
      expect(template.Resources.DynamoDBThrottleAlarm).toBeDefined();
    });

    test('should have CloudWatch dashboard', () => {
      expect(template.Resources.LogisticsDashboard).toBeDefined();
      const dashboard = template.Resources.LogisticsDashboard;
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
      expect(dashboard.Properties.DashboardBody).toBeDefined();
    });

    test('should have Lambda invoke permission', () => {
      expect(template.Resources.LambdaInvokePermission).toBeDefined();
      const permission = template.Resources.LambdaInvokePermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'EventBridgeRuleName',
        'LambdaFunctionArn',
        'DynamoDBTableName',
        'SNSTopicArn',
        'DashboardURL',
        'EventBridgeTestCommand'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('EventBridgeRuleName output should be correct', () => {
      const output = template.Outputs.EventBridgeRuleName;
      expect(output.Description).toBe('Name of the EventBridge rule');
      expect(output.Value).toEqual({ Ref: 'ShipmentUpdateRule' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EventBridgeRule',
      });
    });

    test('LambdaFunctionArn output should be correct', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toBe('ARN of the Lambda function');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ShipmentProcessorFunction', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-LambdaArn',
      });
    });

    test('DynamoDBTableName output should be correct', () => {
      const output = template.Outputs.DynamoDBTableName;
      expect(output.Description).toBe('Name of the DynamoDB table');
      expect(output.Value).toEqual({ Ref: 'ShipmentLogsTable' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-TableName',
      });
    });

    test('SNSTopicArn output should be correct', () => {
      const output = template.Outputs.SNSTopicArn;
      expect(output.Description).toBe('ARN of the SNS alert topic');
      expect(output.Value).toEqual({ Ref: 'AlertTopic' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-SNSTopicArn',
      });
    });

    test('should have dashboard URL and test command', () => {
      expect(template.Outputs.DashboardURL).toBeDefined();
      expect(template.Outputs.EventBridgeTestCommand).toBeDefined();
      expect(template.Outputs.DashboardURL.Description).toBe('URL to the CloudWatch Dashboard');
      expect(template.Outputs.EventBridgeTestCommand.Description).toBe('AWS CLI command to test the system');
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

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(10); // We have many resources in logistics system
    });

    test('should have exactly two parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });

    test('should have six outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(6);
    });
  });

  describe('Resource Naming Convention', () => {
    test('DynamoDB table should follow naming convention with environment suffix', () => {
      const table = template.Resources.ShipmentLogsTable;
      const tableName = table.Properties.TableName;

      expect(tableName).toEqual({
        'Fn::Sub': 'shipment-logs-${EnvironmentSuffix}',
      });
    });

    test('Lambda function should follow naming convention', () => {
      const func = template.Resources.ShipmentProcessorFunction;
      const funcName = func.Properties.FunctionName;

      expect(funcName).toEqual({
        'Fn::Sub': 'shipment-processor-${EnvironmentSuffix}',
      });
    });

    test('EventBridge rule should follow naming convention', () => {
      const rule = template.Resources.ShipmentUpdateRule;
      const ruleName = rule.Properties.Name;

      expect(ruleName).toEqual({
        'Fn::Sub': 'shipment-update-rule-${EnvironmentSuffix}',
      });
    });

    test('SNS topic should follow naming convention', () => {
      const topic = template.Resources.AlertTopic;
      const topicName = topic.Properties.TopicName;

      expect(topicName).toEqual({
        'Fn::Sub': 'logistics-alerts-${EnvironmentSuffix}',
      });
    });
  });

  describe('DynamoDB Table Configuration', () => {
    test('should have correct key schema', () => {
      const table = template.Resources.ShipmentLogsTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(2);
      expect(keySchema[0].AttributeName).toBe('shipmentId');
      expect(keySchema[0].KeyType).toBe('HASH');
      expect(keySchema[1].AttributeName).toBe('timestamp');
      expect(keySchema[1].KeyType).toBe('RANGE');
    });

    test('should have correct attribute definitions', () => {
      const table = template.Resources.ShipmentLogsTable;
      const attributes = table.Properties.AttributeDefinitions;

      expect(attributes).toHaveLength(2);
      expect(attributes[0].AttributeName).toBe('shipmentId');
      expect(attributes[0].AttributeType).toBe('S');
      expect(attributes[1].AttributeName).toBe('timestamp');
      expect(attributes[1].AttributeType).toBe('N');
    });

    test('should have streams enabled', () => {
      const table = template.Resources.ShipmentLogsTable;
      expect(table.Properties.StreamSpecification).toBeDefined();
      expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('should have point-in-time recovery enabled', () => {
      const table = template.Resources.ShipmentLogsTable;
      expect(table.Properties.PointInTimeRecoverySpecification).toBeDefined();
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });
  });

  describe('Lambda Function Configuration', () => {
    test('should have correct environment variables', () => {
      const func = template.Resources.ShipmentProcessorFunction;
      const envVars = func.Properties.Environment.Variables;

      expect(envVars.DYNAMODB_TABLE).toEqual({ Ref: 'ShipmentLogsTable' });
      expect(envVars.SNS_TOPIC_ARN).toEqual({ Ref: 'AlertTopic' });
      expect(envVars.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('should have inline code with proper event processing', () => {
      const func = template.Resources.ShipmentProcessorFunction;
      const code = func.Properties.Code.ZipFile;

      expect(code).toContain('import json');
      expect(code).toContain('import boto3');
      expect(code).toContain('lambda_handler');
      expect(code).toContain('dynamodb');
      expect(code).toContain('sns');
      expect(code).toContain('cloudwatch');
    });
  });

  describe('CloudWatch Alarms Configuration', () => {
    test('Lambda error alarm should have correct configuration', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Threshold).toBe(5);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('Lambda throttle alarm should have correct configuration', () => {
      const alarm = template.Resources.LambdaThrottleAlarm;
      expect(alarm.Properties.MetricName).toBe('Throttles');
      expect(alarm.Properties.Threshold).toBe(1);
    });

    test('DynamoDB throttle alarm should have correct configuration', () => {
      const alarm = template.Resources.DynamoDBThrottleAlarm;
      expect(alarm.Properties.MetricName).toBe('UserErrors');
      expect(alarm.Properties.Namespace).toBe('AWS/DynamoDB');
    });
  });
});
