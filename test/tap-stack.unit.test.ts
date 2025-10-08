import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Logistics Shipment Automation CloudFormation Template', () => {
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

    test('should have correct description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Serverless Logistics Shipment Automation System with EventBridge, Lambda, DynamoDB, CloudWatch, and SNS'
      );
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('prod');
      expect(param.Description).toContain('Environment suffix');
    });

    test('should have NotificationEmail parameter with validation', () => {
      expect(template.Parameters.NotificationEmail).toBeDefined();
      const param = template.Parameters.NotificationEmail;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('logistics-team@example.com');
      expect(param.AllowedPattern).toContain('@');
      expect(param.ConstraintDescription).toContain('valid email');
    });

    test('should have exactly 2 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have ShipmentLogsTable with correct configuration', () => {
      const table = template.Resources.ShipmentLogsTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');

      const props = table.Properties;
      expect(props.BillingMode).toBe('PAY_PER_REQUEST');
      expect(props.TableName).toEqual({
        'Fn::Sub': 'shipment-logs-${EnvironmentSuffix}'
      });
    });

    test('should have correct DynamoDB table structure', () => {
      const table = template.Resources.ShipmentLogsTable;
      const props = table.Properties;

      // Check attribute definitions
      expect(props.AttributeDefinitions).toHaveLength(3);
      const attrs = props.AttributeDefinitions.reduce((acc: any, attr: any) => {
        acc[attr.AttributeName] = attr.AttributeType;
        return acc;
      }, {});
      expect(attrs.shipmentId).toBe('S');
      expect(attrs.timestamp).toBe('N');
      expect(attrs.status).toBe('S');

      // Check key schema
      expect(props.KeySchema).toHaveLength(2);
      expect(props.KeySchema[0].AttributeName).toBe('shipmentId');
      expect(props.KeySchema[0].KeyType).toBe('HASH');
      expect(props.KeySchema[1].AttributeName).toBe('timestamp');
      expect(props.KeySchema[1].KeyType).toBe('RANGE');
    });

    test('should have Global Secondary Index configured correctly', () => {
      const table = template.Resources.ShipmentLogsTable;
      const props = table.Properties;

      expect(props.GlobalSecondaryIndexes).toHaveLength(1);
      const gsi = props.GlobalSecondaryIndexes[0];
      expect(gsi.IndexName).toBe('StatusIndex');
      expect(gsi.KeySchema[0].AttributeName).toBe('status');
      expect(gsi.KeySchema[0].KeyType).toBe('HASH');
      expect(gsi.KeySchema[1].AttributeName).toBe('timestamp');
      expect(gsi.KeySchema[1].KeyType).toBe('RANGE');
      expect(gsi.Projection.ProjectionType).toBe('ALL');
    });

    test('should have data protection features enabled', () => {
      const table = template.Resources.ShipmentLogsTable;
      const props = table.Properties;

      expect(props.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
      expect(props.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });
  });

  describe('Lambda Resources', () => {
    test('should have ShipmentProcessorFunction with correct runtime', () => {
      const lambda = template.Resources.ShipmentProcessorFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');

      const props = lambda.Properties;
      expect(props.Runtime).toBe('nodejs20.x');
      expect(props.Handler).toBe('index.handler');
      expect(props.Timeout).toBe(60);
      expect(props.MemorySize).toBe(512);
    });

    test('should have Lambda function with environment variables', () => {
      const lambda = template.Resources.ShipmentProcessorFunction;
      const props = lambda.Properties;

      expect(props.Environment.Variables).toBeDefined();
      expect(props.Environment.Variables.SHIPMENT_TABLE).toEqual({ Ref: 'ShipmentLogsTable' });
      expect(props.Environment.Variables.SNS_TOPIC_ARN).toEqual({ Ref: 'ShipmentAlertTopic' });
      expect(props.Environment.Variables.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('should have IAM role with correct policies', () => {
      const role = template.Resources.ShipmentProcessorRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');

      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(1);

      const policy = policies[0];
      expect(policy.PolicyName).toBe('ShipmentProcessorPolicy');

      const statements = policy.PolicyDocument.Statement;
      expect(statements).toHaveLength(3);

      // Check DynamoDB permissions
      const dynamoStatement = statements.find((s: any) =>
        s.Action.includes('dynamodb:PutItem')
      );
      expect(dynamoStatement).toBeDefined();
      expect(dynamoStatement.Effect).toBe('Allow');

      // Check SNS permissions
      const snsStatement = statements.find((s: any) =>
        s.Action.includes('sns:Publish')
      );
      expect(snsStatement).toBeDefined();

      // Check CloudWatch permissions
      const cwStatement = statements.find((s: any) =>
        s.Action.includes('cloudwatch:PutMetricData')
      );
      expect(cwStatement).toBeDefined();
    });
  });

  describe('EventBridge Resources', () => {
    test('should have EventBridge rule configured correctly', () => {
      const rule = template.Resources.ShipmentUpdateRule;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Events::Rule');

      const props = rule.Properties;
      expect(props.State).toBe('ENABLED');
      expect(props.EventPattern.source).toContain('logistics.shipments');
      expect(props.EventPattern['detail-type']).toContain('Shipment Update');
      expect(props.EventPattern['detail-type']).toContain('Shipment Status Change');
    });

    test('should have EventBridge rule with proper target configuration', () => {
      const rule = template.Resources.ShipmentUpdateRule;
      const props = rule.Properties;

      expect(props.Targets).toHaveLength(1);
      const target = props.Targets[0];
      expect(target.Arn).toEqual({ 'Fn::GetAtt': ['ShipmentProcessorFunction', 'Arn'] });
      expect(target.Id).toBe('ShipmentProcessorTarget');
      expect(target.RetryPolicy.MaximumRetryAttempts).toBe(2);
      expect(target.DeadLetterConfig.Arn).toEqual({ 'Fn::GetAtt': ['DeadLetterQueue', 'Arn'] });
    });

    test('should have Lambda permission for EventBridge', () => {
      const permission = template.Resources.EventBridgeLambdaPermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');

      const props = permission.Properties;
      expect(props.Action).toBe('lambda:InvokeFunction');
      expect(props.Principal).toBe('events.amazonaws.com');
      expect(props.SourceArn).toEqual({ 'Fn::GetAtt': ['ShipmentUpdateRule', 'Arn'] });
    });
  });

  describe('SNS Resources', () => {
    test('should have SNS topic and subscription configured', () => {
      const topic = template.Resources.ShipmentAlertTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.TopicName).toEqual({
        'Fn::Sub': 'shipment-alerts-${EnvironmentSuffix}'
      });

      const subscription = template.Resources.AlertEmailSubscription;
      expect(subscription).toBeDefined();
      expect(subscription.Type).toBe('AWS::SNS::Subscription');
      expect(subscription.Properties.Protocol).toBe('email');
    });
  });

  describe('SQS Resources', () => {
    test('should have Dead Letter Queue configured', () => {
      const queue = template.Resources.DeadLetterQueue;
      expect(queue).toBeDefined();
      expect(queue.Type).toBe('AWS::SQS::Queue');

      const props = queue.Properties;
      expect(props.QueueName).toEqual({
        'Fn::Sub': 'shipment-dlq-${EnvironmentSuffix}'
      });
      expect(props.MessageRetentionPeriod).toBe(1209600); // 14 days
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have Lambda error alarm', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');

      const props = alarm.Properties;
      expect(props.MetricName).toBe('Errors');
      expect(props.Namespace).toBe('AWS/Lambda');
      expect(props.Threshold).toBe(5);
      expect(props.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have Lambda throttle alarm', () => {
      const alarm = template.Resources.LambdaThrottleAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Properties.MetricName).toBe('Throttles');
      expect(alarm.Properties.Threshold).toBe(1);
    });

    test('should have DLQ alarm', () => {
      const alarm = template.Resources.DLQAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Properties.MetricName).toBe('ApproximateNumberOfMessagesVisible');
      expect(alarm.Properties.Namespace).toBe('AWS/SQS');
    });

    test('should have CloudWatch dashboard', () => {
      const dashboard = template.Resources.LogisticsDashboard;
      expect(dashboard).toBeDefined();
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
      expect(dashboard.Properties.DashboardName).toEqual({
        'Fn::Sub': 'logistics-automation-${EnvironmentSuffix}'
      });
    });

    test('should have Lambda log group', () => {
      const logGroup = template.Resources.ShipmentProcessorLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'DynamoDBTableName',
        'LambdaFunctionArn',
        'SNSTopicArn',
        'EventBridgeRuleName',
        'DashboardURL',
        'DeadLetterQueueURL'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });


    test('should have dashboard URL output with correct format', () => {
      const output = template.Outputs.DashboardURL;
      expect(output.Value).toEqual({
        'Fn::Sub': 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=logistics-automation-${EnvironmentSuffix}'
      });
    });
  });

  describe('Resource Count Validation', () => {

    test('should have all critical resource types', () => {
      const resourceTypes = Object.values(template.Resources).map((r: any) => r.Type);

      expect(resourceTypes).toContain('AWS::DynamoDB::Table');
      expect(resourceTypes).toContain('AWS::Lambda::Function');
      expect(resourceTypes).toContain('AWS::IAM::Role');
      expect(resourceTypes).toContain('AWS::Events::Rule');
      expect(resourceTypes).toContain('AWS::SNS::Topic');
      expect(resourceTypes).toContain('AWS::SQS::Queue');
      expect(resourceTypes).toContain('AWS::CloudWatch::Alarm');
      expect(resourceTypes).toContain('AWS::CloudWatch::Dashboard');
      expect(resourceTypes).toContain('AWS::Logs::LogGroup');
    });
  });

  describe('Naming Conventions', () => {
    test('should use environment suffix in resource names', () => {
      const table = template.Resources.ShipmentLogsTable;
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'shipment-logs-${EnvironmentSuffix}'
      });

      const topic = template.Resources.ShipmentAlertTopic;
      expect(topic.Properties.TopicName).toEqual({
        'Fn::Sub': 'shipment-alerts-${EnvironmentSuffix}'
      });

      const queue = template.Resources.DeadLetterQueue;
      expect(queue.Properties.QueueName).toEqual({
        'Fn::Sub': 'shipment-dlq-${EnvironmentSuffix}'
      });
    });

    test('should have consistent tagging strategy', () => {
      const resourcesWithTags = [
        'ShipmentLogsTable',
        'ShipmentAlertTopic',
        'ShipmentProcessorRole',
        'ShipmentProcessorFunction',
        'DeadLetterQueue'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const envTag = resource.Properties.Tags.find((tag: any) =>
            tag.Key === 'Environment'
          );
          expect(envTag).toBeDefined();
          expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
        }
      });
    });
  });
});
