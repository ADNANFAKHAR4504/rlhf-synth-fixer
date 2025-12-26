import * as fs from 'fs';
import * as path from 'path';

describe('CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have Description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Cryptocurrency Price Alert');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Description).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have PriceAlertsTable', () => {
      expect(template.Resources.PriceAlertsTable).toBeDefined();
      expect(template.Resources.PriceAlertsTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('PriceAlertsTable should use PAY_PER_REQUEST billing mode', () => {
      expect(template.Resources.PriceAlertsTable.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('PriceAlertsTable should have correct key schema', () => {
      const keySchema = template.Resources.PriceAlertsTable.Properties.KeySchema;
      expect(keySchema).toHaveLength(2);
      expect(keySchema[0].AttributeName).toBe('userId');
      expect(keySchema[0].KeyType).toBe('HASH');
      expect(keySchema[1].AttributeName).toBe('alertId');
      expect(keySchema[1].KeyType).toBe('RANGE');
    });

    test('PriceAlertsTable should have GlobalSecondaryIndex', () => {
      const gsis = template.Resources.PriceAlertsTable.Properties.GlobalSecondaryIndexes;
      expect(gsis).toBeDefined();
      expect(gsis).toHaveLength(1);
      expect(gsis[0].IndexName).toBe('CryptocurrencyIndex');
    });

    test('PriceAlertsTable should have PointInTimeRecovery enabled', () => {
      const pitr = template.Resources.PriceAlertsTable.Properties.PointInTimeRecoverySpecification;
      expect(pitr.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('should have PriceHistoryTable', () => {
      expect(template.Resources.PriceHistoryTable).toBeDefined();
      expect(template.Resources.PriceHistoryTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('PriceHistoryTable should have stream enabled', () => {
      const stream = template.Resources.PriceHistoryTable.Properties.StreamSpecification;
      expect(stream).toBeDefined();
      expect(stream.StreamViewType).toBe('NEW_IMAGE');
    });

    test('PriceHistoryTable should have TTL enabled', () => {
      const ttl = template.Resources.PriceHistoryTable.Properties.TimeToLiveSpecification;
      expect(ttl.Enabled).toBe(true);
      expect(ttl.AttributeName).toBe('ttl');
    });
  });

  describe('KMS Resources', () => {
    test('should have KmsKey', () => {
      expect(template.Resources.KmsKey).toBeDefined();
      expect(template.Resources.KmsKey.Type).toBe('AWS::KMS::Key');
    });

    test('KmsKey should have key policy', () => {
      expect(template.Resources.KmsKey.Properties.KeyPolicy).toBeDefined();
      expect(template.Resources.KmsKey.Properties.KeyPolicy.Version).toBe('2012-10-17');
    });
  });

  describe('Lambda Functions', () => {
    test('should have ProcessWebhookFunction', () => {
      expect(template.Resources.ProcessWebhookFunction).toBeDefined();
      expect(template.Resources.ProcessWebhookFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('ProcessWebhookFunction should use nodejs22.x runtime', () => {
      expect(template.Resources.ProcessWebhookFunction.Properties.Runtime).toBe('nodejs22.x');
    });

    test('ProcessWebhookFunction should have correct configuration', () => {
      const func = template.Resources.ProcessWebhookFunction.Properties;
      expect(func.MemorySize).toBe(1024);
      expect(func.Timeout).toBe(30);
      expect(func.Architectures).toEqual(['arm64']);
      expect(func.ReservedConcurrentExecutions).toBe(5);
    });

    test('should have CheckAlertsFunction', () => {
      expect(template.Resources.CheckAlertsFunction).toBeDefined();
      expect(template.Resources.CheckAlertsFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('CheckAlertsFunction should have correct configuration', () => {
      const func = template.Resources.CheckAlertsFunction.Properties;
      expect(func.MemorySize).toBe(512);
      expect(func.Timeout).toBe(60);
      expect(func.ReservedConcurrentExecutions).toBe(3);
    });

    test('should have SendNotificationFunction', () => {
      expect(template.Resources.SendNotificationFunction).toBeDefined();
      expect(template.Resources.SendNotificationFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should have CleanupHistoryFunction', () => {
      expect(template.Resources.CleanupHistoryFunction).toBeDefined();
      expect(template.Resources.CleanupHistoryFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('all Lambda functions should use KMS key', () => {
      const functions = [
        'ProcessWebhookFunction',
        'CheckAlertsFunction',
        'SendNotificationFunction',
        'CleanupHistoryFunction',
      ];
      functions.forEach((funcName) => {
        const func = template.Resources[funcName];
        expect(func.Properties.KmsKeyArn).toBeDefined();
        expect(func.Properties.KmsKeyArn['Fn::GetAtt']).toEqual(['KmsKey', 'Arn']);
      });
    });
  });

  describe('IAM Roles', () => {
    test('should have ProcessWebhookRole', () => {
      expect(template.Resources.ProcessWebhookRole).toBeDefined();
      expect(template.Resources.ProcessWebhookRole.Type).toBe('AWS::IAM::Role');
    });

    test('ProcessWebhookRole should have Lambda assume role policy', () => {
      const assumeRole = template.Resources.ProcessWebhookRole.Properties.AssumeRolePolicyDocument;
      expect(assumeRole.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('should have CheckAlertsRole', () => {
      expect(template.Resources.CheckAlertsRole).toBeDefined();
      expect(template.Resources.CheckAlertsRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have SendNotificationRole', () => {
      expect(template.Resources.SendNotificationRole).toBeDefined();
      expect(template.Resources.SendNotificationRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have CleanupHistoryRole', () => {
      expect(template.Resources.CleanupHistoryRole).toBeDefined();
      expect(template.Resources.CleanupHistoryRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('Event Source Mapping', () => {
    test('should have CheckAlertsEventSourceMapping', () => {
      expect(template.Resources.CheckAlertsEventSourceMapping).toBeDefined();
      expect(template.Resources.CheckAlertsEventSourceMapping.Type).toBe('AWS::Lambda::EventSourceMapping');
    });

    test('EventSourceMapping should connect DynamoDB stream to Lambda', () => {
      const mapping = template.Resources.CheckAlertsEventSourceMapping.Properties;
      expect(mapping.EventSourceArn['Fn::GetAtt']).toEqual(['PriceHistoryTable', 'StreamArn']);
      expect(mapping.FunctionName['Fn::GetAtt']).toEqual(['CheckAlertsFunction', 'Arn']);
      expect(mapping.StartingPosition).toBe('LATEST');
      expect(mapping.BatchSize).toBe(10);
    });
  });

  describe('SNS Resources', () => {
    test('should have NotificationTopic', () => {
      expect(template.Resources.NotificationTopic).toBeDefined();
      expect(template.Resources.NotificationTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have SendNotificationSubscription', () => {
      expect(template.Resources.SendNotificationSubscription).toBeDefined();
      expect(template.Resources.SendNotificationSubscription.Type).toBe('AWS::SNS::Subscription');
      expect(template.Resources.SendNotificationSubscription.Properties.Protocol).toBe('lambda');
    });

    test('should have SendNotificationPermission', () => {
      expect(template.Resources.SendNotificationPermission).toBeDefined();
      expect(template.Resources.SendNotificationPermission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  describe('EventBridge Resources', () => {
    test('should have CleanupScheduleRule', () => {
      expect(template.Resources.CleanupScheduleRule).toBeDefined();
      expect(template.Resources.CleanupScheduleRule.Type).toBe('AWS::Events::Rule');
    });

    test('CleanupScheduleRule should have hourly schedule', () => {
      const rule = template.Resources.CleanupScheduleRule.Properties;
      expect(rule.ScheduleExpression).toBe('rate(1 hour)');
      expect(rule.State).toBe('ENABLED');
    });

    test('should have CleanupSchedulePermission', () => {
      expect(template.Resources.CleanupSchedulePermission).toBeDefined();
      expect(template.Resources.CleanupSchedulePermission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  describe('API Gateway Resources', () => {
    test('should have WebhookApi', () => {
      expect(template.Resources.WebhookApi).toBeDefined();
      expect(template.Resources.WebhookApi.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should have WebhookResource', () => {
      expect(template.Resources.WebhookResource).toBeDefined();
      expect(template.Resources.WebhookResource.Type).toBe('AWS::ApiGateway::Resource');
      expect(template.Resources.WebhookResource.Properties.PathPart).toBe('webhooks');
    });

    test('should have WebhookMethod', () => {
      expect(template.Resources.WebhookMethod).toBeDefined();
      expect(template.Resources.WebhookMethod.Type).toBe('AWS::ApiGateway::Method');
      expect(template.Resources.WebhookMethod.Properties.HttpMethod).toBe('POST');
      expect(template.Resources.WebhookMethod.Properties.ApiKeyRequired).toBe(true);
    });

    test('should have WebhookDeployment', () => {
      expect(template.Resources.WebhookDeployment).toBeDefined();
      expect(template.Resources.WebhookDeployment.Type).toBe('AWS::ApiGateway::Deployment');
    });

    test('should have WebhookApiKey', () => {
      expect(template.Resources.WebhookApiKey).toBeDefined();
      expect(template.Resources.WebhookApiKey.Type).toBe('AWS::ApiGateway::ApiKey');
    });

    test('should have WebhookUsagePlan', () => {
      expect(template.Resources.WebhookUsagePlan).toBeDefined();
      expect(template.Resources.WebhookUsagePlan.Type).toBe('AWS::ApiGateway::UsagePlan');
    });

    test('should have ApiGatewayInvokePermission', () => {
      expect(template.Resources.ApiGatewayInvokePermission).toBeDefined();
      expect(template.Resources.ApiGatewayInvokePermission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have ProcessWebhookErrorAlarm', () => {
      expect(template.Resources.ProcessWebhookErrorAlarm).toBeDefined();
      expect(template.Resources.ProcessWebhookErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('ProcessWebhookErrorAlarm should have correct configuration', () => {
      const alarm = template.Resources.ProcessWebhookErrorAlarm.Properties;
      expect(alarm.MetricName).toBe('Errors');
      expect(alarm.Namespace).toBe('AWS/Lambda');
      expect(alarm.Threshold).toBe(1);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have DynamoDBThrottleAlarm', () => {
      expect(template.Resources.DynamoDBThrottleAlarm).toBeDefined();
      expect(template.Resources.DynamoDBThrottleAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });
  });

  describe('Resource Naming', () => {
    test('all resources should include EnvironmentSuffix in names', () => {
      const resourcesWithNames = [
        'PriceAlertsTable',
        'PriceHistoryTable',
        'ProcessWebhookFunction',
        'CheckAlertsFunction',
        'SendNotificationFunction',
        'CleanupHistoryFunction',
        'NotificationTopic',
        'WebhookApi',
        'WebhookApiKey',
        'WebhookUsagePlan',
      ];

      resourcesWithNames.forEach((resourceName) => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.TableName || resource.Properties.FunctionName ||
          resource.Properties.TopicName || resource.Properties.Name) {
          const nameProp = resource.Properties.TableName ||
            resource.Properties.FunctionName ||
            resource.Properties.TopicName ||
            resource.Properties.Name;
          if (nameProp && nameProp['Fn::Sub']) {
            expect(nameProp['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should export WebhookApiUrl', () => {
      expect(template.Outputs.WebhookApiUrl).toBeDefined();
      expect(template.Outputs.WebhookApiUrl.Description).toBeDefined();
    });

    test('should export ApiKeyId', () => {
      expect(template.Outputs.ApiKeyId).toBeDefined();
      expect(template.Outputs.ApiKeyId.Description).toBeDefined();
    });

    test('should export PriceAlertsTableName', () => {
      expect(template.Outputs.PriceAlertsTableName).toBeDefined();
      expect(template.Outputs.PriceAlertsTableName.Description).toBeDefined();
    });

    test('should export PriceHistoryTableName', () => {
      expect(template.Outputs.PriceHistoryTableName).toBeDefined();
      expect(template.Outputs.PriceHistoryTableName.Description).toBeDefined();
    });
  });
});

