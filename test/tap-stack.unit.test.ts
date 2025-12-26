import fs from 'fs';
import path from 'path';

describe('Healthcare Appointment Reminder CloudFormation Template', () => {
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

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Healthcare appointment reminder system');
    });

    test('should have parameters, resources, and outputs', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    const expectedParams = [
      'EnvironmentSuffix',
      'SenderEmail'
    ];

    test('should define all required parameters', () => {
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix should have default value and pattern', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('SenderEmail should have default value', () => {
      const param = template.Parameters.SenderEmail;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('noreply@healthcare.example.com');
    });
  });

  describe('SNS Resources', () => {
    test('should have AppointmentReminderTopic with correct properties', () => {
      const topic = template.Resources.AppointmentReminderTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.TopicName).toEqual({
        'Fn::Sub': 'appointment-reminders-${EnvironmentSuffix}'
      });
      expect(topic.Properties.DisplayName).toBe('Healthcare Appointment Reminders');
      expect(topic.Properties.KmsMasterKeyId).toBe('alias/aws/sns');
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have DeliveryLogsTable with correct structure', () => {
      const table = template.Resources.DeliveryLogsTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'sms-delivery-logs-${EnvironmentSuffix}'
      });
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('DeliveryLogsTable should have correct key schema', () => {
      const table = template.Resources.DeliveryLogsTable;
      const keySchema = table.Properties.KeySchema;
      expect(keySchema).toHaveLength(2);
      expect(keySchema[0]).toEqual({
        AttributeName: 'patientId',
        KeyType: 'HASH'
      });
      expect(keySchema[1]).toEqual({
        AttributeName: 'timestamp',
        KeyType: 'RANGE'
      });
    });

    test('DeliveryLogsTable should have TTL enabled', () => {
      const table = template.Resources.DeliveryLogsTable;
      expect(table.Properties.TimeToLiveSpecification.AttributeName).toBe('ttl');
      expect(table.Properties.TimeToLiveSpecification.Enabled).toBe(true);
    });
  });

  describe('IAM Resources', () => {
    test('should define NotificationHandlerRole with proper trust policy', () => {
      const role = template.Resources.NotificationHandlerRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('NotificationHandlerRole should have correct managed policies', () => {
      const role = template.Resources.NotificationHandlerRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });

    test('NotificationHandlerRole should have proper permissions', () => {
      const role = template.Resources.NotificationHandlerRole;
      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('NotificationHandlerPolicy');

      const statements = policy.PolicyDocument.Statement;

      // SNS permissions
      const snsStatement = statements.find((s: any) => s.Action.includes('sns:Publish'));
      expect(snsStatement).toBeDefined();
      expect(snsStatement.Action).toContain('sns:Publish');
      expect(snsStatement.Action).toContain('sns:SetSMSAttributes');

      // DynamoDB permissions
      const dynamoStatement = statements.find((s: any) => s.Action.includes('dynamodb:PutItem'));
      expect(dynamoStatement).toBeDefined();
      expect(dynamoStatement.Action).toContain('dynamodb:PutItem');
      expect(dynamoStatement.Action).toContain('dynamodb:Query');

      // SES permissions
      const sesStatement = statements.find((s: any) => s.Action.includes('ses:SendEmail'));
      expect(sesStatement).toBeDefined();
      expect(sesStatement.Action).toContain('ses:SendEmail');

      // CloudWatch permissions
      const cloudwatchStatement = statements.find((s: any) => s.Action.includes('cloudwatch:PutMetricData'));
      expect(cloudwatchStatement).toBeDefined();
    });
  });

  describe('Lambda Resources', () => {
    test('should define NotificationHandlerFunction with correct properties', () => {
      const func = template.Resources.NotificationHandlerFunction;
      expect(func.Type).toBe('AWS::Lambda::Function');
      expect(func.Properties.FunctionName).toEqual({
        'Fn::Sub': 'appointment-notification-handler-${EnvironmentSuffix}'
      });
      expect(func.Properties.Runtime).toBe('python3.9');
      expect(func.Properties.Handler).toBe('index.lambda_handler');
      expect(func.Properties.Timeout).toBe(300);
      expect(func.Properties.MemorySize).toBe(512);
      expect(func.Properties.ReservedConcurrentExecutions).toBe(10);
    });

    test('Lambda function should have correct environment variables', () => {
      const func = template.Resources.NotificationHandlerFunction;
      const envVars = func.Properties.Environment.Variables;
      expect(envVars.TABLE_NAME).toEqual({ Ref: 'DeliveryLogsTable' });
      expect(envVars.SENDER_EMAIL).toEqual({ Ref: 'SenderEmail' });
      expect(envVars.TOPIC_ARN).toEqual({ Ref: 'AppointmentReminderTopic' });
    });

    test('Lambda function should reference the correct IAM role', () => {
      const func = template.Resources.NotificationHandlerFunction;
      expect(func.Properties.Role).toEqual({
        'Fn::GetAtt': ['NotificationHandlerRole', 'Arn']
      });
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have NotificationLogGroup with correct properties', () => {
      const logGroup = template.Resources.NotificationLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/appointment-notification-handler-${EnvironmentSuffix}'
      });
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should have FailureRateAlarm with correct configuration', () => {
      const alarm = template.Resources.FailureRateAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.AlarmName).toEqual({
        'Fn::Sub': 'sms-failure-rate-${EnvironmentSuffix}'
      });
      expect(alarm.Properties.Namespace).toBe('AppointmentReminders');
      expect(alarm.Properties.MetricName).toBe('FailedSMS');
      expect(alarm.Properties.Threshold).toBe(0.05);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have DeliveryMetricQueryAlarm with metric math', () => {
      const alarm = template.Resources.DeliveryMetricQueryAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.Metrics).toHaveLength(3);

      const mathExpression = alarm.Properties.Metrics.find((m: any) => m.Id === 'e1');
      expect(mathExpression.Expression).toBe('m2/(m1+m2)*100');
      expect(mathExpression.ReturnData).toBe(true);
    });
  });

  describe('SES Resources', () => {
    test('should have SESEmailTemplate with correct structure', () => {
      const template_resource = template.Resources.SESEmailTemplate;
      expect(template_resource.Type).toBe('AWS::SES::Template');
      expect(template_resource.Properties.Template.TemplateName).toEqual({
        'Fn::Sub': 'appointment-reminder-${EnvironmentSuffix}'
      });
      expect(template_resource.Properties.Template.SubjectPart).toContain('{{appointment_date}}');
      expect(template_resource.Properties.Template.TextPart).toContain('{{patient_name}}');
      expect(template_resource.Properties.Template.HtmlPart).toContain('<html>');
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'LambdaFunctionArn',
      'DynamoDBTableName',
      'SNSTopicArn'
    ];

    test('should define all required outputs', () => {
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
        expect(template.Outputs[output].Value).toBeDefined();
        expect(template.Outputs[output].Description).toBeDefined();
      });
    });

    test('LambdaFunctionArn output should be correct', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toContain('Lambda function');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['NotificationHandlerFunction', 'Arn']
      });
    });

    test('DynamoDBTableName output should be correct', () => {
      const output = template.Outputs.DynamoDBTableName;
      expect(output.Description).toContain('DynamoDB');
      expect(output.Value).toEqual({ Ref: 'DeliveryLogsTable' });
    });

    test('SNSTopicArn output should be correct', () => {
      const output = template.Outputs.SNSTopicArn;
      expect(output.Description).toContain('SNS topic');
      expect(output.Value).toEqual({ Ref: 'AppointmentReminderTopic' });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(typeof template).toBe('object');
      expect(template.Resources).not.toBeNull();
    });

    test('should not have undefined required sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have at least 1 Lambda function', () => {
      const functions = Object.values(template.Resources).filter((res: any) => res.Type === 'AWS::Lambda::Function');
      expect(functions.length).toBeGreaterThanOrEqual(1);
    });

    test('should have at least 1 DynamoDB table', () => {
      const tables = Object.values(template.Resources).filter((res: any) => res.Type === 'AWS::DynamoDB::Table');
      expect(tables.length).toBeGreaterThanOrEqual(1);
    });

    test('should have at least 1 SNS topic', () => {
      const topics = Object.values(template.Resources).filter((res: any) => res.Type === 'AWS::SNS::Topic');
      expect(topics.length).toBeGreaterThanOrEqual(1);
    });

    test('should have at least 1 IAM role', () => {
      const roles = Object.values(template.Resources).filter((res: any) => res.Type === 'AWS::IAM::Role');
      expect(roles.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Resource Naming and References', () => {
    test('Lambda function name should use Fn::Sub with EnvironmentSuffix', () => {
      const func = template.Resources.NotificationHandlerFunction;
      expect(func.Properties.FunctionName).toEqual({
        'Fn::Sub': 'appointment-notification-handler-${EnvironmentSuffix}'
      });
    });

    test('DynamoDB table name should use Fn::Sub with EnvironmentSuffix', () => {
      const table = template.Resources.DeliveryLogsTable;
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'sms-delivery-logs-${EnvironmentSuffix}'
      });
    });

    test('Lambda function should reference DynamoDB table ARN correctly', () => {
      const role = template.Resources.NotificationHandlerRole;
      const dynamoPolicy = role.Properties.Policies[0].PolicyDocument.Statement.find((s: any) =>
        s.Action.includes('dynamodb:PutItem')
      );
      expect(dynamoPolicy.Resource).toEqual({
        'Fn::GetAtt': ['DeliveryLogsTable', 'Arn']
      });
    });

    test('CloudWatch alarms should have environment-specific names', () => {
      const failureAlarm = template.Resources.FailureRateAlarm;
      expect(failureAlarm.Properties.AlarmName).toEqual({
        'Fn::Sub': 'sms-failure-rate-${EnvironmentSuffix}'
      });

      const metricAlarm = template.Resources.DeliveryMetricQueryAlarm;
      expect(metricAlarm.Properties.AlarmName).toEqual({
        'Fn::Sub': 'sms-delivery-metrics-${EnvironmentSuffix}'
      });
    });
  });

  // Additional comprehensive tests from reference implementation
  describe('Advanced Template Validation', () => {
    test('should have no resources with Retain deletion policy', () => {
      Object.entries(template.Resources).forEach(([resourceName, resource]: [string, any]) => {
        const deletionPolicy = resource.DeletionPolicy || 'Delete';
        expect(deletionPolicy).not.toBe('Retain');
      });
    });

    test('should have proper resource dependencies', () => {
      const func = template.Resources.NotificationHandlerFunction;

      // Lambda should depend on IAM role being created
      expect(func.Properties.Role).toEqual({
        'Fn::GetAtt': ['NotificationHandlerRole', 'Arn']
      });

      // Lambda environment should reference DynamoDB table and SNS topic
      const envVars = func.Properties.Environment.Variables;
      expect(envVars.TABLE_NAME).toEqual({ Ref: 'DeliveryLogsTable' });
      expect(envVars.TOPIC_ARN).toEqual({ Ref: 'AppointmentReminderTopic' });
    });

    test('should have proper output exports for integration', () => {
      const outputs = template.Outputs;

      // Check essential outputs exist for cross-stack integration
      const essentialOutputs = ['LambdaFunctionArn', 'DynamoDBTableName', 'SNSTopicArn'];
      essentialOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        expect(outputs[outputKey].Value).toBeDefined();
        expect(outputs[outputKey].Description).toBeDefined();
      });
    });

    test('should validate CloudWatch alarm thresholds are reasonable', () => {
      const failureAlarm = template.Resources.FailureRateAlarm;
      const threshold = failureAlarm.Properties.Threshold;

      // Threshold should be between 0.01 (1%) and 1.0 (100%)
      expect(threshold).toBeGreaterThan(0);
      expect(threshold).toBeLessThanOrEqual(1.0);

      // Should use appropriate comparison operator
      expect(failureAlarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');

      // Should have proper evaluation periods
      expect(failureAlarm.Properties.EvaluationPeriods).toBeGreaterThan(0);
    });

    test('should validate DynamoDB table attribute definitions match key schema', () => {
      const table = template.Resources.DeliveryLogsTable;
      const attributeDefinitions = table.Properties.AttributeDefinitions;
      const keySchema = table.Properties.KeySchema;

      // Each key in keySchema should have corresponding attribute definition
      keySchema.forEach((key: any) => {
        const attrDef = attributeDefinitions.find((attr: any) => attr.AttributeName === key.AttributeName);
        expect(attrDef).toBeDefined();
        expect(attrDef.AttributeType).toBeDefined();
      });
    });

    test('should validate Lambda function has appropriate resource limits', () => {
      const func = template.Resources.NotificationHandlerFunction;
      const properties = func.Properties;

      // Memory should be reasonable (128-3008 MB)
      expect(properties.MemorySize).toBeGreaterThanOrEqual(128);
      expect(properties.MemorySize).toBeLessThanOrEqual(3008);

      // Timeout should be reasonable (1-900 seconds)
      expect(properties.Timeout).toBeGreaterThan(0);
      expect(properties.Timeout).toBeLessThanOrEqual(900);

      // Reserved concurrency should be set for production workloads
      expect(properties.ReservedConcurrentExecutions).toBeDefined();
      expect(properties.ReservedConcurrentExecutions).toBeGreaterThan(0);
    });

    test('should validate IAM policies follow least privilege principle', () => {
      const role = template.Resources.NotificationHandlerRole;
      const policies = role.Properties.Policies;

      expect(policies).toHaveLength(1);
      const policy = policies[0];
      const statements = policy.PolicyDocument.Statement;

      // Each statement should have specific resources where possible
      statements.forEach((statement: any) => {
        expect(statement.Effect).toBe('Allow');
        expect(statement.Action).toBeDefined();

        // DynamoDB statement should have specific resource ARN
        if (statement.Action.some((action: string) => action.startsWith('dynamodb:'))) {
          expect(statement.Resource).toEqual({
            'Fn::GetAtt': ['DeliveryLogsTable', 'Arn']
          });
        }
      });
    });

    test('should validate SNS topic has encryption enabled', () => {
      const topic = template.Resources.AppointmentReminderTopic;
      expect(topic.Properties.KmsMasterKeyId).toBe('alias/aws/sns');
    });

    test('should validate log group has appropriate retention', () => {
      const logGroup = template.Resources.NotificationLogGroup;
      const retention = logGroup.Properties.RetentionInDays;

      // Retention should be reasonable (1-3653 days)
      expect(retention).toBeGreaterThan(0);
      expect(retention).toBeLessThanOrEqual(3653);

      // For cost optimization, shouldn't be too high
      expect(retention).toBeLessThanOrEqual(365);
    });

    test('should validate SES template has required placeholder variables', () => {
      const sesTemplate = template.Resources.SESEmailTemplate;
      const templateProps = sesTemplate.Properties.Template;

      // Should have appointment-related placeholders
      expect(templateProps.SubjectPart).toContain('{{appointment_date}}');
      expect(templateProps.TextPart).toContain('{{patient_name}}');
      expect(templateProps.TextPart).toContain('{{appointment_date}}');
      expect(templateProps.TextPart).toContain('{{appointment_time}}');
      expect(templateProps.TextPart).toContain('{{location}}');

      // HTML part should have proper structure
      expect(templateProps.HtmlPart).toContain('<html>');
      expect(templateProps.HtmlPart).toContain('</html>');
    });
  });

  describe('Security and Compliance Validation', () => {
    test('should not have any hardcoded secrets or sensitive data', () => {
      const templateString = JSON.stringify(template);

      // Should not contain common sensitive patterns
      expect(templateString).not.toMatch(/password/i);
      expect(templateString).not.toMatch(/secret/i);
      expect(templateString).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS Access Key pattern
      expect(templateString).not.toMatch(/[0-9a-zA-Z/+]{40}/); // AWS Secret Key pattern
    });

    test('should use parameter references for sensitive configurations', () => {
      const func = template.Resources.NotificationHandlerFunction;
      const envVars = func.Properties.Environment.Variables;

      // Email should come from parameter, not hardcoded
      expect(envVars.SENDER_EMAIL).toEqual({ Ref: 'SenderEmail' });
    });

    test('should have proper resource naming to avoid conflicts', () => {
      // All resources that support naming should use environment suffix
      const resourcesWithNaming = [
        'AppointmentReminderTopic',
        'DeliveryLogsTable',
        'NotificationHandlerFunction',
        'NotificationLogGroup',
        'FailureRateAlarm',
        'DeliveryMetricQueryAlarm',
        'SESEmailTemplate'
      ];

      resourcesWithNaming.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameProperty = resource.Properties.TopicName ||
          resource.Properties.TableName ||
          resource.Properties.FunctionName ||
          resource.Properties.LogGroupName ||
          resource.Properties.AlarmName ||
          resource.Properties.Template?.TemplateName;

        if (nameProperty) {
          expect(nameProperty).toEqual(
            expect.objectContaining({
              'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}')
            })
          );
        }
      });
    });
  });
});