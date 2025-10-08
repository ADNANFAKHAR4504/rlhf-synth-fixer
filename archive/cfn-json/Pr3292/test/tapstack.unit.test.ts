import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation Template Tests', () => {
  let template: any;
  const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');

  beforeAll(() => {
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have correct AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Healthcare appointment notification');
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
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have EmailDomain parameter', () => {
      expect(template.Parameters.EmailDomain).toBeDefined();
      expect(template.Parameters.EmailDomain.Type).toBe('String');
      expect(template.Parameters.EmailDomain.Default).toBe('example.com');
    });
  });

  describe('SNS Resources', () => {
    test('should have NotificationTopic resource', () => {
      expect(template.Resources.NotificationTopic).toBeDefined();
      expect(template.Resources.NotificationTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('NotificationTopic should use EnvironmentSuffix in name', () => {
      const topicName = template.Resources.NotificationTopic.Properties.TopicName;
      expect(topicName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('NotificationTopic should have required tags', () => {
      const tags = template.Resources.NotificationTopic.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'Environment')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'Application')).toBeDefined();
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have NotificationLogTable resource', () => {
      expect(template.Resources.NotificationLogTable).toBeDefined();
      expect(template.Resources.NotificationLogTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('NotificationLogTable should have DeletionPolicy set to Delete', () => {
      expect(template.Resources.NotificationLogTable.DeletionPolicy).toBe('Delete');
    });

    test('NotificationLogTable should use PAY_PER_REQUEST billing mode', () => {
      expect(template.Resources.NotificationLogTable.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('NotificationLogTable should have required attributes', () => {
      const attributes = template.Resources.NotificationLogTable.Properties.AttributeDefinitions;
      expect(attributes).toBeDefined();
      expect(attributes.find((a: any) => a.AttributeName === 'notificationId')).toBeDefined();
      expect(attributes.find((a: any) => a.AttributeName === 'timestamp')).toBeDefined();
      expect(attributes.find((a: any) => a.AttributeName === 'patientId')).toBeDefined();
    });

    test('NotificationLogTable should have GlobalSecondaryIndex', () => {
      const gsi = template.Resources.NotificationLogTable.Properties.GlobalSecondaryIndexes;
      expect(gsi).toBeDefined();
      expect(gsi.length).toBeGreaterThan(0);
      expect(gsi[0].IndexName).toBe('PatientIndex');
    });

    test('NotificationLogTable should have PointInTimeRecovery enabled', () => {
      const pitr = template.Resources.NotificationLogTable.Properties.PointInTimeRecoverySpecification;
      expect(pitr).toBeDefined();
      expect(pitr.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('NotificationLogTable should use EnvironmentSuffix in name', () => {
      const tableName = template.Resources.NotificationLogTable.Properties.TableName;
      expect(tableName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Lambda Resources', () => {
    test('should have NotificationProcessorFunction resource', () => {
      expect(template.Resources.NotificationProcessorFunction).toBeDefined();
      expect(template.Resources.NotificationProcessorFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda function should use Python 3.10 runtime', () => {
      expect(template.Resources.NotificationProcessorFunction.Properties.Runtime).toBe('python3.10');
    });

    test('Lambda function should have correct handler', () => {
      expect(template.Resources.NotificationProcessorFunction.Properties.Handler).toBe('index.lambda_handler');
    });

    test('Lambda function should have environment variables', () => {
      const envVars = template.Resources.NotificationProcessorFunction.Properties.Environment.Variables;
      expect(envVars).toBeDefined();
      expect(envVars.NOTIFICATION_TABLE).toBeDefined();
      expect(envVars.SNS_TOPIC_ARN).toBeDefined();
      expect(envVars.EMAIL_DOMAIN).toBeDefined();
    });

    test('Lambda function should have appropriate timeout', () => {
      expect(template.Resources.NotificationProcessorFunction.Properties.Timeout).toBe(300);
    });

    test('Lambda function should use EnvironmentSuffix in name', () => {
      const functionName = template.Resources.NotificationProcessorFunction.Properties.FunctionName;
      expect(functionName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('Lambda function should have Lambda Insights layer', () => {
      const layers = template.Resources.NotificationProcessorFunction.Properties.Layers;
      expect(layers).toBeDefined();
      expect(layers[0]['Fn::Sub']).toContain('LambdaInsightsExtension');
    });
  });

  describe('IAM Resources', () => {
    test('should have NotificationProcessorRole resource', () => {
      expect(template.Resources.NotificationProcessorRole).toBeDefined();
      expect(template.Resources.NotificationProcessorRole.Type).toBe('AWS::IAM::Role');
    });

    test('NotificationProcessorRole should have Lambda assume role policy', () => {
      const assumePolicy = template.Resources.NotificationProcessorRole.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy).toBeDefined();
      expect(assumePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('NotificationProcessorRole should have required managed policies', () => {
      const managedPolicies = template.Resources.NotificationProcessorRole.Properties.ManagedPolicyArns;
      expect(managedPolicies).toBeDefined();
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/CloudWatchLambdaInsightsExecutionRolePolicy');
    });

    test('NotificationProcessorRole should have inline policy with required permissions', () => {
      const policies = template.Resources.NotificationProcessorRole.Properties.Policies;
      expect(policies).toBeDefined();
      expect(policies.length).toBeGreaterThan(0);

      const policyDoc = policies[0].PolicyDocument;
      const statements = policyDoc.Statement;

      // Check SNS permissions
      const snsStatement = statements.find((s: any) => s.Action.includes('sns:Publish'));
      expect(snsStatement).toBeDefined();

      // Check DynamoDB permissions
      const ddbStatement = statements.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('dynamodb:'))
      );
      expect(ddbStatement).toBeDefined();

      // Check SES permissions
      const sesStatement = statements.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('ses:'))
      );
      expect(sesStatement).toBeDefined();

      // Check CloudWatch permissions
      const cwStatement = statements.find((s: any) =>
        s.Action.includes('cloudwatch:PutMetricData')
      );
      expect(cwStatement).toBeDefined();
    });

    test('should have SNSDeliveryStatusRole resource', () => {
      expect(template.Resources.SNSDeliveryStatusRole).toBeDefined();
      expect(template.Resources.SNSDeliveryStatusRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have DeliveryFailureAlarm resource', () => {
      expect(template.Resources.DeliveryFailureAlarm).toBeDefined();
      expect(template.Resources.DeliveryFailureAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('DeliveryFailureAlarm should monitor FailedNotifications metric', () => {
      const alarm = template.Resources.DeliveryFailureAlarm.Properties;
      expect(alarm.MetricName).toBe('FailedNotifications');
      expect(alarm.Namespace).toBe('HealthcareNotifications');
    });

    test('DeliveryFailureAlarm should have 5% threshold (115 out of 2300)', () => {
      const alarm = template.Resources.DeliveryFailureAlarm.Properties;
      expect(alarm.Threshold).toBe(115);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have LambdaErrorAlarm resource', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      expect(template.Resources.LambdaErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('LambdaErrorAlarm should monitor Lambda errors', () => {
      const alarm = template.Resources.LambdaErrorAlarm.Properties;
      expect(alarm.MetricName).toBe('Errors');
      expect(alarm.Namespace).toBe('AWS/Lambda');
    });

    test('should have NotificationLogGroup resource', () => {
      expect(template.Resources.NotificationLogGroup).toBeDefined();
      expect(template.Resources.NotificationLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('NotificationLogGroup should have 30 day retention', () => {
      expect(template.Resources.NotificationLogGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('EventBridge Resources', () => {
    test('should have EventRule resource', () => {
      expect(template.Resources.EventRule).toBeDefined();
      expect(template.Resources.EventRule.Type).toBe('AWS::Events::Rule');
    });

    test('EventRule should trigger daily', () => {
      const rule = template.Resources.EventRule.Properties;
      expect(rule.ScheduleExpression).toBe('rate(1 day)');
      expect(rule.State).toBe('ENABLED');
    });

    test('EventRule should target Lambda function', () => {
      const targets = template.Resources.EventRule.Properties.Targets;
      expect(targets).toBeDefined();
      expect(targets.length).toBeGreaterThan(0);
      expect(targets[0].Arn['Fn::GetAtt'][0]).toBe('NotificationProcessorFunction');
    });

    test('should have EventRulePermission resource', () => {
      expect(template.Resources.EventRulePermission).toBeDefined();
      expect(template.Resources.EventRulePermission.Type).toBe('AWS::Lambda::Permission');
    });

    test('EventRulePermission should allow EventBridge to invoke Lambda', () => {
      const permission = template.Resources.EventRulePermission.Properties;
      expect(permission.Action).toBe('lambda:InvokeFunction');
      expect(permission.Principal).toBe('events.amazonaws.com');
    });
  });

  describe('Outputs', () => {
    test('should have NotificationTopicArn output', () => {
      expect(template.Outputs.NotificationTopicArn).toBeDefined();
      expect(template.Outputs.NotificationTopicArn.Export.Name).toBe('NotificationTopicArn');
    });

    test('should have LambdaFunctionArn output', () => {
      expect(template.Outputs.LambdaFunctionArn).toBeDefined();
      expect(template.Outputs.LambdaFunctionArn.Export.Name).toBe('NotificationProcessorArn');
    });

    test('should have DynamoDBTableName output', () => {
      expect(template.Outputs.DynamoDBTableName).toBeDefined();
      expect(template.Outputs.DynamoDBTableName.Export.Name).toBe('NotificationLogTableName');
    });
  });

  describe('Resource Dependencies', () => {
    test('Lambda function should reference IAM role', () => {
      const roleRef = template.Resources.NotificationProcessorFunction.Properties.Role;
      expect(roleRef['Fn::GetAtt']).toBeDefined();
      expect(roleRef['Fn::GetAtt'][0]).toBe('NotificationProcessorRole');
    });

    test('Lambda environment should reference DynamoDB table', () => {
      const tableRef = template.Resources.NotificationProcessorFunction.Properties.Environment.Variables.NOTIFICATION_TABLE;
      expect(tableRef.Ref).toBe('NotificationLogTable');
    });

    test('Lambda environment should reference SNS topic', () => {
      const topicRef = template.Resources.NotificationProcessorFunction.Properties.Environment.Variables.SNS_TOPIC_ARN;
      expect(topicRef.Ref).toBe('NotificationTopic');
    });
  });

  describe('Security Best Practices', () => {
    test('IAM role should follow least privilege principle', () => {
      const policies = template.Resources.NotificationProcessorRole.Properties.Policies;
      const statements = policies[0].PolicyDocument.Statement;

      // Check that SNS publish is limited to specific topic
      const snsStatement = statements.find((s: any) => s.Action.includes('sns:Publish'));
      expect(snsStatement.Resource.Ref).toBe('NotificationTopic');

      // Check that SES has condition
      const sesStatement = statements.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('ses:'))
      );
      expect(sesStatement.Condition).toBeDefined();
    });

    test('All resources should have tags', () => {
      const taggedResources = ['NotificationTopic', 'NotificationLogTable',
        'NotificationProcessorRole', 'NotificationProcessorFunction'];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        expect(resource.Properties.Tags.length).toBeGreaterThan(0);
      });
    });

    test('DynamoDB table should not have retain deletion policy', () => {
      expect(template.Resources.NotificationLogTable.DeletionPolicy).not.toBe('Retain');
    });

    test('CloudWatch Log Group should not have retain deletion policy', () => {
      expect(template.Resources.NotificationLogGroup.DeletionPolicy).not.toBe('Retain');
    });
  });

  describe('Scalability and Performance', () => {
    test('Lambda should have appropriate memory allocation', () => {
      const memory = template.Resources.NotificationProcessorFunction.Properties.MemorySize;
      expect(memory).toBe(512);
      expect(memory).toBeGreaterThanOrEqual(128);
      expect(memory).toBeLessThanOrEqual(10240);
    });

    test('DynamoDB should use on-demand billing for cost optimization', () => {
      expect(template.Resources.NotificationLogTable.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });
  });
});
