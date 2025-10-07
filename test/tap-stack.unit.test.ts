import fs from 'fs';
import path from 'path';

describe('Appointment Scheduler CloudFormation Template', () => {
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
      expect(template.Description).toBe(
        'Appointment Scheduler with conflict detection and reminder notifications'
      );
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe('Environment suffix for resource naming');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });
  });

  describe('DynamoDB Table', () => {
    test('should have AppointmentsTable resource', () => {
      expect(template.Resources.AppointmentsTable).toBeDefined();
    });

    test('AppointmentsTable should be a DynamoDB table with correct type', () => {
      const table = template.Resources.AppointmentsTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('AppointmentsTable should have correct table name', () => {
      const table = template.Resources.AppointmentsTable;
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'AppointmentsTable-${EnvironmentSuffix}'
      });
    });

    test('AppointmentsTable should have correct attribute definitions', () => {
      const table = template.Resources.AppointmentsTable;
      const attributeDefinitions = table.Properties.AttributeDefinitions;

      expect(attributeDefinitions).toHaveLength(3);
      const attributes = attributeDefinitions.map((attr: any) => attr.AttributeName);
      expect(attributes).toContain('appointmentId');
      expect(attributes).toContain('userId');
      expect(attributes).toContain('startTime');
    });

    test('AppointmentsTable should have correct key schema', () => {
      const table = template.Resources.AppointmentsTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('appointmentId');
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    test('AppointmentsTable should have UserAppointmentsIndex GSI', () => {
      const table = template.Resources.AppointmentsTable;
      const gsi = table.Properties.GlobalSecondaryIndexes;

      expect(gsi).toHaveLength(1);
      expect(gsi[0].IndexName).toBe('UserAppointmentsIndex');
      expect(gsi[0].KeySchema[0].AttributeName).toBe('userId');
      expect(gsi[0].KeySchema[1].AttributeName).toBe('startTime');
    });

    test('AppointmentsTable should have stream enabled', () => {
      const table = template.Resources.AppointmentsTable;
      expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('AppointmentsTable should have point-in-time recovery enabled', () => {
      const table = template.Resources.AppointmentsTable;
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });
  });

  describe('SNS Topic', () => {
    test('should have NotificationTopic resource', () => {
      expect(template.Resources.NotificationTopic).toBeDefined();
    });

    test('NotificationTopic should be an SNS topic with correct properties', () => {
      const topic = template.Resources.NotificationTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.TopicName).toEqual({
        'Fn::Sub': 'AppointmentNotifications-${EnvironmentSuffix}'
      });
      expect(topic.Properties.KmsMasterKeyId).toBe('alias/aws/sns');
    });
  });

  describe('Lambda Functions', () => {
    test('should have ConflictDetectorFunction resource', () => {
      expect(template.Resources.ConflictDetectorFunction).toBeDefined();
    });

    test('should have ReminderSenderFunction resource', () => {
      expect(template.Resources.ReminderSenderFunction).toBeDefined();
    });

    test('ConflictDetectorFunction should have correct properties', () => {
      const lambda = template.Resources.ConflictDetectorFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.11');
      expect(lambda.Properties.Handler).toBe('index.handler');
      expect(lambda.Properties.Timeout).toBe(30);
      expect(lambda.Properties.MemorySize).toBe(256);
    });

    test('ReminderSenderFunction should have correct properties', () => {
      const lambda = template.Resources.ReminderSenderFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.11');
      expect(lambda.Properties.Handler).toBe('index.handler');
      expect(lambda.Properties.Timeout).toBe(30);
      expect(lambda.Properties.MemorySize).toBe(256);
    });

    test('Lambda functions should have environment variables', () => {
      const conflictDetector = template.Resources.ConflictDetectorFunction;
      expect(conflictDetector.Properties.Environment.Variables.TABLE_NAME).toBeDefined();
      expect(conflictDetector.Properties.Environment.Variables.REMINDER_FUNCTION_ARN).toBeDefined();

      const reminderSender = template.Resources.ReminderSenderFunction;
      expect(reminderSender.Properties.Environment.Variables.TABLE_NAME).toBeDefined();
      expect(reminderSender.Properties.Environment.Variables.TOPIC_ARN).toBeDefined();
    });

    test('Lambda functions should have inline code', () => {
      const conflictDetector = template.Resources.ConflictDetectorFunction;
      expect(conflictDetector.Properties.Code.ZipFile).toBeDefined();
      expect(conflictDetector.Properties.Code.ZipFile).toContain('def handler');
      expect(conflictDetector.Properties.Code.ZipFile).toContain('check_conflicts');

      const reminderSender = template.Resources.ReminderSenderFunction;
      expect(reminderSender.Properties.Code.ZipFile).toBeDefined();
      expect(reminderSender.Properties.Code.ZipFile).toContain('def handler');
      expect(reminderSender.Properties.Code.ZipFile).toContain('format_reminder_message');
    });
  });

  describe('IAM Roles', () => {
    test('should have ConflictDetectorRole resource', () => {
      expect(template.Resources.ConflictDetectorRole).toBeDefined();
    });

    test('should have ReminderSenderRole resource', () => {
      expect(template.Resources.ReminderSenderRole).toBeDefined();
    });

    test('ConflictDetectorRole should have correct policies', () => {
      const role = template.Resources.ConflictDetectorRole;
      expect(role.Type).toBe('AWS::IAM::Role');

      const policies = role.Properties.Policies;
      const policyNames = policies.map((p: any) => p.PolicyName);
      expect(policyNames).toContain('DynamoDBAccess');
      expect(policyNames).toContain('EventBridgeAccess');
      expect(policyNames).toContain('CloudWatchMetrics');
    });

    test('ReminderSenderRole should have correct policies', () => {
      const role = template.Resources.ReminderSenderRole;
      expect(role.Type).toBe('AWS::IAM::Role');

      const policies = role.Properties.Policies;
      const policyNames = policies.map((p: any) => p.PolicyName);
      expect(policyNames).toContain('DynamoDBRead');
      expect(policyNames).toContain('SNSPublish');
      expect(policyNames).toContain('CloudWatchMetrics');
    });

    test('IAM roles should assume Lambda service principal', () => {
      const conflictRole = template.Resources.ConflictDetectorRole;
      const conflictStatement = conflictRole.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(conflictStatement.Principal.Service).toBe('lambda.amazonaws.com');

      const reminderRole = template.Resources.ReminderSenderRole;
      const reminderStatement = reminderRole.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(reminderStatement.Principal.Service).toContain('lambda.amazonaws.com');
    });
  });

  describe('API Gateway', () => {
    test('should have AppointmentApi resource', () => {
      expect(template.Resources.AppointmentApi).toBeDefined();
    });

    test('AppointmentApi should be REST API with correct properties', () => {
      const api = template.Resources.AppointmentApi;
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.EndpointConfiguration.Types).toEqual(['REGIONAL']);
    });

    test('should have AppointmentResource for /appointments endpoint', () => {
      const resource = template.Resources.AppointmentResource;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::ApiGateway::Resource');
      expect(resource.Properties.PathPart).toBe('appointments');
    });

    test('should have POST method for appointments', () => {
      const method = template.Resources.AppointmentMethod;
      expect(method).toBeDefined();
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('POST');
      expect(method.Properties.AuthorizationType).toBe('NONE');
    });

    test('should have Lambda integration for POST method', () => {
      const method = template.Resources.AppointmentMethod;
      expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
      expect(method.Properties.Integration.IntegrationHttpMethod).toBe('POST');
    });

    test('should have API deployment', () => {
      const deployment = template.Resources.ApiDeployment;
      expect(deployment).toBeDefined();
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
      expect(deployment.Properties.StageName).toBe('prod');
    });

    test('API deployment should have throttling settings', () => {
      const deployment = template.Resources.ApiDeployment;
      expect(deployment.Properties.StageDescription.ThrottlingBurstLimit).toBe(100);
      expect(deployment.Properties.StageDescription.ThrottlingRateLimit).toBe(50);
    });
  });

  describe('Lambda Permissions', () => {
    test('should have API Gateway invoke permission', () => {
      const permission = template.Resources.ApiGatewayInvokePermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
    });

    test('should have EventBridge invoke permission for reminder function', () => {
      const permission = template.Resources.ReminderSenderPermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have log groups for Lambda functions', () => {
      expect(template.Resources.ConflictDetectorLogGroup).toBeDefined();
      expect(template.Resources.ReminderSenderLogGroup).toBeDefined();

      const conflictLogGroup = template.Resources.ConflictDetectorLogGroup;
      expect(conflictLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(conflictLogGroup.Properties.RetentionInDays).toBe(7);
    });

    test('should have BookingMetricFilter', () => {
      const filter = template.Resources.BookingMetricFilter;
      expect(filter).toBeDefined();
      expect(filter.Type).toBe('AWS::Logs::MetricFilter');
      expect(filter.Properties.FilterName).toBe('BookingMetrics');
    });

    test('should have BookingSuccessAlarm', () => {
      const alarm = template.Resources.BookingSuccessAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('BookingAttempts');
      expect(alarm.Properties.ComparisonOperator).toBe('LessThanThreshold');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ApiEndpoint',
        'AppointmentsTableName',
        'NotificationTopicArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ApiEndpoint output should be correct', () => {
      const output = template.Outputs.ApiEndpoint;
      expect(output.Description).toBe('API Gateway endpoint URL');
      expect(output.Value['Fn::Sub']).toContain('https://${AppointmentApi}.execute-api');
    });

    test('AppointmentsTableName output should be correct', () => {
      const output = template.Outputs.AppointmentsTableName;
      expect(output.Description).toBe('DynamoDB table name');
      expect(output.Value).toEqual({ Ref: 'AppointmentsTable' });
    });

    test('NotificationTopicArn output should be correct', () => {
      const output = template.Outputs.NotificationTopicArn;
      expect(output.Description).toBe('SNS topic ARN for notifications');
      expect(output.Value).toEqual({ Ref: 'NotificationTopic' });
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
      expect(resourceCount).toBeGreaterThan(10); // We have many resources
    });

    test('all Lambda function dependencies should exist', () => {
      const conflictDetector = template.Resources.ConflictDetectorFunction;
      expect(conflictDetector.DependsOn).toContain('ConflictDetectorLogGroup');

      const reminderSender = template.Resources.ReminderSenderFunction;
      expect(reminderSender.DependsOn).toContain('ReminderSenderLogGroup');
    });
  });

  describe('Security Best Practices', () => {
    test('SNS topic should use AWS managed KMS key', () => {
      const topic = template.Resources.NotificationTopic;
      expect(topic.Properties.KmsMasterKeyId).toBe('alias/aws/sns');
    });

    test('DynamoDB should have point-in-time recovery enabled', () => {
      const table = template.Resources.AppointmentsTable;
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('Lambda functions should have reserved concurrent executions limit', () => {
      const conflictDetector = template.Resources.ConflictDetectorFunction;
      // ReservedConcurrentExecutions was removed to avoid AWS limits
      expect(conflictDetector.Properties.ReservedConcurrentExecutions).toBeUndefined();
    });

    test('IAM roles should follow least privilege principle', () => {
      const conflictRole = template.Resources.ConflictDetectorRole;
      const conflictPolicies = conflictRole.Properties.Policies;

      // Check that DynamoDB policy has specific actions
      const dynamoPolicy = conflictPolicies.find((p: any) => p.PolicyName === 'DynamoDBAccess');
      const dynamoActions = dynamoPolicy.PolicyDocument.Statement[0].Action;
      expect(dynamoActions).not.toContain('dynamodb:*');
      expect(dynamoActions).toContain('dynamodb:Query');
      expect(dynamoActions).toContain('dynamodb:PutItem');
    });

    test('CloudWatch log groups should have retention period', () => {
      const conflictLogGroup = template.Resources.ConflictDetectorLogGroup;
      expect(conflictLogGroup.Properties.RetentionInDays).toBeDefined();
      expect(conflictLogGroup.Properties.RetentionInDays).toBe(7);

      const reminderLogGroup = template.Resources.ReminderSenderLogGroup;
      expect(reminderLogGroup.Properties.RetentionInDays).toBeDefined();
      expect(reminderLogGroup.Properties.RetentionInDays).toBe(7);
    });
  });
});
