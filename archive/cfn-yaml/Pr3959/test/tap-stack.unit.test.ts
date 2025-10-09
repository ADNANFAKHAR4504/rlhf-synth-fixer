import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Notification System CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Convert YAML template to JSON for testing
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have appropriate description for notification system', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Serverless Notification System');
      expect(template.Description).toContain('SNS, Lambda, DynamoDB, CloudWatch, and SES');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const envParam = template.Parameters.EnvironmentSuffix;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('dev');
      expect(envParam.Description).toContain('Environment suffix');
    });

    test('should have NotificationEmail parameter', () => {
      expect(template.Parameters.NotificationEmail).toBeDefined();
      const emailParam = template.Parameters.NotificationEmail;
      expect(emailParam.Type).toBe('String');
      expect(emailParam.Default).toBe('notifications@example.com');
      expect(emailParam.AllowedPattern).toBeDefined();
      expect(emailParam.ConstraintDescription).toContain('valid email address');
    });
  });

  describe('SNS Resources', () => {
    test('should have OrderNotificationTopic', () => {
      expect(template.Resources.OrderNotificationTopic).toBeDefined();
      const topic = template.Resources.OrderNotificationTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('OrderNotificationTopic should have correct properties', () => {
      const topic = template.Resources.OrderNotificationTopic.Properties;
      expect(topic.TopicName).toEqual({
        'Fn::Sub': 'order-notifications-${EnvironmentSuffix}'
      });
      expect(topic.DisplayName).toBe('Order Update Notifications');
      expect(topic.Subscription).toHaveLength(2);
    });

    test('should have OrderNotificationTopicPolicy', () => {
      expect(template.Resources.OrderNotificationTopicPolicy).toBeDefined();
      const policy = template.Resources.OrderNotificationTopicPolicy;
      expect(policy.Type).toBe('AWS::SNS::TopicPolicy');
    });

    test('SNS topic policy should allow publish from account', () => {
      const policy = template.Resources.OrderNotificationTopicPolicy.Properties.PolicyDocument;
      expect(policy.Statement[0].Effect).toBe('Allow');
      expect(policy.Statement[0].Action).toContain('SNS:Publish');
    });
  });

  describe('Lambda Resources', () => {
    test('should have NotificationProcessorFunction', () => {
      expect(template.Resources.NotificationProcessorFunction).toBeDefined();
      const lambda = template.Resources.NotificationProcessorFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda function should have correct configuration', () => {
      const lambda = template.Resources.NotificationProcessorFunction.Properties;
      expect(lambda.Runtime).toBe('nodejs22.x');
      expect(lambda.Handler).toBe('index.handler');
      expect(lambda.Timeout).toBe(30);
      expect(lambda.MemorySize).toBe(512);
    });

    test('Lambda function should have environment variables', () => {
      const lambda = template.Resources.NotificationProcessorFunction.Properties;
      expect(lambda.Environment.Variables.DYNAMODB_TABLE).toEqual({
        Ref: 'NotificationLogTable'
      });
      expect(lambda.Environment.Variables.SES_SOURCE_EMAIL).toEqual({
        Ref: 'NotificationEmail'
      });
    });

    test('should have NotificationProcessorInvokePermission', () => {
      expect(template.Resources.NotificationProcessorInvokePermission).toBeDefined();
      const permission = template.Resources.NotificationProcessorInvokePermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Principal).toBe('sns.amazonaws.com');
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have NotificationLogTable', () => {
      expect(template.Resources.NotificationLogTable).toBeDefined();
      const table = template.Resources.NotificationLogTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('DynamoDB table should have correct configuration', () => {
      const table = template.Resources.NotificationLogTable.Properties;
      expect(table.BillingMode).toBe('PAY_PER_REQUEST');
      expect(table.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
      expect(table.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('DynamoDB table should have correct key schema', () => {
      const table = template.Resources.NotificationLogTable.Properties;
      expect(table.KeySchema).toHaveLength(2);
      expect(table.KeySchema[0].AttributeName).toBe('notificationId');
      expect(table.KeySchema[0].KeyType).toBe('HASH');
      expect(table.KeySchema[1].AttributeName).toBe('timestamp');
      expect(table.KeySchema[1].KeyType).toBe('RANGE');
    });

    test('DynamoDB table should have Global Secondary Index', () => {
      const table = template.Resources.NotificationLogTable.Properties;
      expect(table.GlobalSecondaryIndexes).toHaveLength(1);
      const gsi = table.GlobalSecondaryIndexes[0];
      expect(gsi.IndexName).toBe('StatusIndex');
      expect(gsi.KeySchema[0].AttributeName).toBe('status');
    });
  });

  describe('IAM Resources', () => {
    test('should have NotificationProcessorRole', () => {
      expect(template.Resources.NotificationProcessorRole).toBeDefined();
      const role = template.Resources.NotificationProcessorRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('IAM role should have correct assume role policy', () => {
      const role = template.Resources.NotificationProcessorRole.Properties;
      const assumeRolePolicy = role.AssumeRolePolicyDocument;
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumeRolePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('IAM role should have required managed policies', () => {
      const role = template.Resources.NotificationProcessorRole.Properties;
      expect(role.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('IAM role should have DynamoDB permissions', () => {
      const role = template.Resources.NotificationProcessorRole.Properties;
      const policy = role.Policies[0].PolicyDocument;
      const dynamoStatement = policy.Statement.find((s: any) =>
        s.Action.includes('dynamodb:PutItem')
      );
      expect(dynamoStatement).toBeDefined();
      expect(dynamoStatement.Action).toContain('dynamodb:GetItem');
      expect(dynamoStatement.Action).toContain('dynamodb:UpdateItem');
    });

    test('IAM role should have SES permissions', () => {
      const role = template.Resources.NotificationProcessorRole.Properties;
      const policy = role.Policies[0].PolicyDocument;
      const sesStatement = policy.Statement.find((s: any) =>
        s.Action.includes('ses:SendEmail')
      );
      expect(sesStatement).toBeDefined();
      expect(sesStatement.Action).toContain('ses:SendRawEmail');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have NotificationFailureAlarm', () => {
      expect(template.Resources.NotificationFailureAlarm).toBeDefined();
      const alarm = template.Resources.NotificationFailureAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have LambdaErrorAlarm', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have LambdaThrottleAlarm', () => {
      expect(template.Resources.LambdaThrottleAlarm).toBeDefined();
      const alarm = template.Resources.LambdaThrottleAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have NotificationSystemDashboard', () => {
      expect(template.Resources.NotificationSystemDashboard).toBeDefined();
      const dashboard = template.Resources.NotificationSystemDashboard;
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('alarms should have correct thresholds', () => {
      const failureAlarm = template.Resources.NotificationFailureAlarm.Properties;
      expect(failureAlarm.Threshold).toBe(10);
      expect(failureAlarm.ComparisonOperator).toBe('GreaterThanThreshold');

      const errorAlarm = template.Resources.LambdaErrorAlarm.Properties;
      expect(errorAlarm.Threshold).toBe(5);

      const throttleAlarm = template.Resources.LambdaThrottleAlarm.Properties;
      expect(throttleAlarm.Threshold).toBe(1);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'SNSTopicArn',
        'SNSTopicName',
        'LambdaFunctionArn',
        'LambdaFunctionName',
        'DynamoDBTableName',
        'DynamoDBTableArn',
        'DashboardURL',
        'NotificationEmail'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have correct export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export) {
          expect(output.Export.Name).toEqual({
            'Fn::Sub': `\${AWS::StackName}-${outputKey}`
          });
        }
      });
    });
  });

  describe('Resource Tagging', () => {
    test('resources should have consistent tags', () => {
      const taggedResources = [
        'OrderNotificationTopic',
        'NotificationLogTable',
        'NotificationProcessorRole',
        'NotificationProcessorFunction'
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const envTag = tags.find((t: any) => t.Key === 'Environment');
          const appTag = tags.find((t: any) => t.Key === 'Application');

          expect(envTag).toBeDefined();
          expect(appTag).toBeDefined();
          expect(appTag.Value).toBe('NotificationSystem');
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all required sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should not have hardcoded environment suffix', () => {
      const templateString = JSON.stringify(template);
      // Ensure no hardcoded dev/prod/staging in resource names
      expect(templateString).not.toMatch(/order-notifications-dev/);
      expect(templateString).not.toMatch(/notification-logs-prod/);
    });
  });

  describe('Security Validation', () => {
    test('should not contain hardcoded credentials', () => {
      const templateString = JSON.stringify(template);
      expect(templateString).not.toMatch(/password/i);
      expect(templateString).not.toMatch(/secret/i);
      expect(templateString).not.toMatch(/key.*=.*[A-Za-z0-9]{20}/);
    });

    test('IAM role should follow principle of least privilege', () => {
      const role = template.Resources.NotificationProcessorRole.Properties;
      const policy = role.Policies[0].PolicyDocument;

      // Should not have * resources for sensitive actions
      const statements = policy.Statement;
      statements.forEach((statement: any) => {
        if (statement.Action.includes('dynamodb:')) {
          expect(statement.Resource).not.toBe('*');
        }
      });
    });
  });
});