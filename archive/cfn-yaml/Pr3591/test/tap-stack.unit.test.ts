import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Serverless Inventory Update Scheduling System CloudFormation Template', () => {
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
        'Serverless Inventory Update Scheduling System with EventBridge, Lambda, DynamoDB, CloudWatch, and SNS'
      );
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
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
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only lowercase letters, numbers, and hyphens'
      );
    });

    test('should have AlertEmail parameter', () => {
      const alertEmailParam = template.Parameters.AlertEmail;
      expect(alertEmailParam).toBeDefined();
      expect(alertEmailParam.Type).toBe('String');
      expect(alertEmailParam.Default).toBe('test@test.com');
      expect(alertEmailParam.Description).toBe('Email address for SNS alert notifications');
      expect(alertEmailParam.AllowedPattern).toBeDefined();
    });

    test('should have ScheduleExpression parameter', () => {
      const scheduleParam = template.Parameters.ScheduleExpression;
      expect(scheduleParam).toBeDefined();
      expect(scheduleParam.Type).toBe('String');
      expect(scheduleParam.Default).toBe('rate(1 hour)');
      expect(scheduleParam.Description).toContain('EventBridge schedule expression');
    });

    test('should have JobBatchSize parameter', () => {
      const batchSizeParam = template.Parameters.JobBatchSize;
      expect(batchSizeParam).toBeDefined();
      expect(batchSizeParam.Type).toBe('Number');
      expect(batchSizeParam.Default).toBe(50);
      expect(batchSizeParam.MinValue).toBe(1);
      expect(batchSizeParam.MaxValue).toBe(100);
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have InventoryTable resource', () => {
      expect(template.Resources.InventoryTable).toBeDefined();
      expect(template.Resources.InventoryTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('InventoryTable should have correct configuration', () => {
      const table = template.Resources.InventoryTable;
      const properties = table.Properties;

      expect(properties.TableName).toEqual({
        'Fn::Sub': 'inventory-data-${EnvironmentSuffix}',
      });
      expect(properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
      expect(properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('InventoryTable should have correct attribute definitions', () => {
      const table = template.Resources.InventoryTable;
      const attributeDefinitions = table.Properties.AttributeDefinitions;

      expect(attributeDefinitions).toHaveLength(2);
      expect(attributeDefinitions).toContainEqual({
        AttributeName: 'itemId',
        AttributeType: 'S'
      });
      expect(attributeDefinitions).toContainEqual({
        AttributeName: 'lastUpdated',
        AttributeType: 'N'
      });
    });

    test('InventoryTable should have correct key schema', () => {
      const table = template.Resources.InventoryTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(1);
      expect(keySchema[0]).toEqual({
        AttributeName: 'itemId',
        KeyType: 'HASH'
      });
    });

    test('InventoryTable should have Global Secondary Index', () => {
      const table = template.Resources.InventoryTable;
      const gsi = table.Properties.GlobalSecondaryIndexes;

      expect(gsi).toHaveLength(1);
      expect(gsi[0].IndexName).toBe('LastUpdatedIndex');
      expect(gsi[0].KeySchema).toEqual([{
        AttributeName: 'lastUpdated',
        KeyType: 'HASH'
      }]);
      expect(gsi[0].Projection.ProjectionType).toBe('ALL');
    });

    test('should have JobExecutionTable resource', () => {
      expect(template.Resources.JobExecutionTable).toBeDefined();
      expect(template.Resources.JobExecutionTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('JobExecutionTable should have TTL configured', () => {
      const table = template.Resources.JobExecutionTable;
      const ttl = table.Properties.TimeToLiveSpecification;

      expect(ttl.AttributeName).toBe('ttl');
      expect(ttl.Enabled).toBe(true);
    });
  });

  describe('Lambda Resources', () => {
    test('should have InventoryUpdateFunction resource', () => {
      expect(template.Resources.InventoryUpdateFunction).toBeDefined();
      expect(template.Resources.InventoryUpdateFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda function should have correct configuration', () => {
      const lambda = template.Resources.InventoryUpdateFunction;
      const properties = lambda.Properties;

      expect(properties.Runtime).toBe('python3.9');
      expect(properties.Handler).toBe('index.lambda_handler');
      expect(properties.Timeout).toBe(300);
      expect(properties.MemorySize).toBe(512);
      expect(properties.FunctionName).toEqual({
        'Fn::Sub': 'inventory-update-processor-${EnvironmentSuffix}'
      });
    });

    test('Lambda function should have required environment variables', () => {
      const lambda = template.Resources.InventoryUpdateFunction;
      const envVars = lambda.Properties.Environment.Variables;

      expect(envVars.INVENTORY_TABLE).toEqual({ Ref: 'InventoryTable' });
      expect(envVars.JOB_EXECUTION_TABLE).toEqual({ Ref: 'JobExecutionTable' });
      expect(envVars.ALERT_TOPIC_ARN).toEqual({ Ref: 'AlertTopic' });
      expect(envVars.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(envVars.BATCH_SIZE).toEqual({ Ref: 'JobBatchSize' });
    });

    test('Lambda function should have inline code', () => {
      const lambda = template.Resources.InventoryUpdateFunction;
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(typeof lambda.Properties.Code.ZipFile).toBe('string');
      expect(lambda.Properties.Code.ZipFile).toContain('lambda_handler');
      expect(lambda.Properties.Code.ZipFile).toContain('import boto3');
    });

    test('should have LambdaExecutionRole resource', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('Lambda execution role should have correct trust policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;

      expect(trustPolicy.Version).toBe('2012-10-17');
      expect(trustPolicy.Statement[0].Effect).toBe('Allow');
      expect(trustPolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should have InventoryUpdateLogGroup resource', () => {
      expect(template.Resources.InventoryUpdateLogGroup).toBeDefined();
      expect(template.Resources.InventoryUpdateLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('Log group should have correct retention', () => {
      const logGroup = template.Resources.InventoryUpdateLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(30);
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/inventory-update-processor-${EnvironmentSuffix}'
      });
    });
  });

  describe('SNS Resources', () => {
    test('should have AlertTopic resource', () => {
      expect(template.Resources.AlertTopic).toBeDefined();
      expect(template.Resources.AlertTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('SNS topic should have correct configuration', () => {
      const topic = template.Resources.AlertTopic;
      const properties = topic.Properties;

      expect(properties.TopicName).toEqual({
        'Fn::Sub': 'inventory-scheduler-alerts-${EnvironmentSuffix}'
      });
      expect(properties.DisplayName).toBe('Inventory Scheduler Alerts');
      expect(properties.Subscription).toHaveLength(1);
      expect(properties.Subscription[0].Protocol).toBe('email');
      expect(properties.Subscription[0].Endpoint).toEqual({ Ref: 'AlertEmail' });
    });
  });

  describe('EventBridge Resources', () => {
    test('should have EventBridgeRole resource', () => {
      expect(template.Resources.EventBridgeRole).toBeDefined();
      expect(template.Resources.EventBridgeRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have InventoryUpdateSchedule resource', () => {
      expect(template.Resources.InventoryUpdateSchedule).toBeDefined();
      expect(template.Resources.InventoryUpdateSchedule.Type).toBe('AWS::Events::Rule');
    });

    test('EventBridge rule should have correct configuration', () => {
      const rule = template.Resources.InventoryUpdateSchedule;
      const properties = rule.Properties;

      expect(properties.Name).toEqual({
        'Fn::Sub': 'inventory-update-schedule-${EnvironmentSuffix}'
      });
      expect(properties.Description).toBe('Scheduled trigger for inventory update jobs');
      expect(properties.ScheduleExpression).toEqual({ Ref: 'ScheduleExpression' });
      expect(properties.State).toBe('ENABLED');
      expect(properties.Targets).toHaveLength(1);
    });

    test('should have LambdaInvokePermission resource', () => {
      expect(template.Resources.LambdaInvokePermission).toBeDefined();
      expect(template.Resources.LambdaInvokePermission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have CloudWatch alarms', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      expect(template.Resources.LambdaDurationAlarm).toBeDefined();
      expect(template.Resources.LambdaThrottleAlarm).toBeDefined();
      expect(template.Resources.DynamoDBReadAlarm).toBeDefined();
    });

    test('Lambda error alarm should have correct configuration', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Threshold).toBe(5);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have MonitoringDashboard resource', () => {
      expect(template.Resources.MonitoringDashboard).toBeDefined();
      expect(template.Resources.MonitoringDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('Dashboard should have correct configuration', () => {
      const dashboard = template.Resources.MonitoringDashboard;
      expect(dashboard.Properties.DashboardName).toEqual({
        'Fn::Sub': 'inventory-scheduler-${EnvironmentSuffix}'
      });
      expect(dashboard.Properties.DashboardBody).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'InventoryTableName',
        'JobExecutionTableName',
        'LambdaFunctionName',
        'LambdaFunctionArn',
        'AlertTopicArn',
        'ScheduleRuleName',
        'DashboardURL',
        'MonitoringNamespace'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('InventoryTableName output should be correct', () => {
      const output = template.Outputs.InventoryTableName;
      expect(output.Description).toBe('Name of the DynamoDB inventory table');
      expect(output.Value).toEqual({ Ref: 'InventoryTable' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-InventoryTable',
      });
    });


    test('MonitoringNamespace output should be correct', () => {
      const output = template.Outputs.MonitoringNamespace;
      expect(output.Description).toBe('CloudWatch custom metrics namespace');
      expect(output.Value).toEqual({
        'Fn::Sub': 'InventoryScheduler/${EnvironmentSuffix}'
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

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8);
    });

    test('should have all expected resource types', () => {
      const resources = template.Resources;
      const resourceTypes = Object.values(resources).map((resource: any) => resource.Type);

      expect(resourceTypes).toContain('AWS::DynamoDB::Table');
      expect(resourceTypes).toContain('AWS::Lambda::Function');
      expect(resourceTypes).toContain('AWS::SNS::Topic');
      expect(resourceTypes).toContain('AWS::Events::Rule');
      expect(resourceTypes).toContain('AWS::CloudWatch::Alarm');
      expect(resourceTypes).toContain('AWS::CloudWatch::Dashboard');
      expect(resourceTypes).toContain('AWS::IAM::Role');
      expect(resourceTypes).toContain('AWS::Logs::LogGroup');
      expect(resourceTypes).toContain('AWS::Lambda::Permission');
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow naming convention with environment suffix', () => {
      const inventoryTable = template.Resources.InventoryTable;
      expect(inventoryTable.Properties.TableName).toEqual({
        'Fn::Sub': 'inventory-data-${EnvironmentSuffix}',
      });

      const jobTable = template.Resources.JobExecutionTable;
      expect(jobTable.Properties.TableName).toEqual({
        'Fn::Sub': 'job-execution-${EnvironmentSuffix}',
      });

      const lambda = template.Resources.InventoryUpdateFunction;
      expect(lambda.Properties.FunctionName).toEqual({
        'Fn::Sub': 'inventory-update-processor-${EnvironmentSuffix}',
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export) {
          expect(output.Export.Name).toBeDefined();
          expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
        }
      });
    });

    test('should have consistent tagging strategy', () => {
      const taggedResources = [
        'InventoryTable',
        'JobExecutionTable',
        'AlertTopic',
        'LambdaExecutionRole',
        'InventoryUpdateFunction',
        'EventBridgeRole'
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        expect(resource.Properties.Tags).toContainEqual({
          Key: 'Environment',
          Value: { Ref: 'EnvironmentSuffix' }
        });
        expect(resource.Properties.Tags).toContainEqual({
          Key: 'Application',
          Value: 'InventoryScheduler'
        });
      });
    });
  });

  describe('Security Configuration', () => {

    test('DynamoDB tables should have encryption enabled', () => {
      const inventoryTable = template.Resources.InventoryTable;
      expect(inventoryTable.Properties.SSESpecification.SSEEnabled).toBe(true);
    });
  });
});
