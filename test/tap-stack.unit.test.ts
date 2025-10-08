import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Appointment Booking Notification System', () => {
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
      expect(template.Description).toContain('Appointment Booking Notification System');
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
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('should have SenderEmail parameter', () => {
      expect(template.Parameters.SenderEmail).toBeDefined();
      expect(template.Parameters.SenderEmail.Type).toBe('String');
    });
  });

  describe('DynamoDB Table', () => {
    test('should have AppointmentsTable resource', () => {
      expect(template.Resources.AppointmentsTable).toBeDefined();
      expect(template.Resources.AppointmentsTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('AppointmentsTable should have correct table name with environment suffix', () => {
      const table = template.Resources.AppointmentsTable;
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'Appointments-${EnvironmentSuffix}',
      });
    });

    test('AppointmentsTable should have correct attribute definitions', () => {
      const table = template.Resources.AppointmentsTable;
      const attributes = table.Properties.AttributeDefinitions;

      expect(attributes).toHaveLength(2);
      expect(attributes[0].AttributeName).toBe('appointmentId');
      expect(attributes[0].AttributeType).toBe('S');
      expect(attributes[1].AttributeName).toBe('appointmentTime');
      expect(attributes[1].AttributeType).toBe('N');
    });

    test('AppointmentsTable should have correct key schema', () => {
      const table = template.Resources.AppointmentsTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('appointmentId');
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    test('AppointmentsTable should have Global Secondary Index', () => {
      const table = template.Resources.AppointmentsTable;
      const gsi = table.Properties.GlobalSecondaryIndexes;

      expect(gsi).toHaveLength(1);
      expect(gsi[0].IndexName).toBe('AppointmentTimeIndex');
      expect(gsi[0].KeySchema[0].AttributeName).toBe('appointmentTime');
    });

    test('AppointmentsTable should have streams enabled', () => {
      const table = template.Resources.AppointmentsTable;
      expect(table.Properties.StreamSpecification).toBeDefined();
      expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('AppointmentsTable should have deletion protection disabled', () => {
      const table = template.Resources.AppointmentsTable;
      expect(table.Properties.DeletionProtectionEnabled).toBe(false);
    });
  });

  describe('SNS Topic', () => {
    test('should have NotificationTopic resource', () => {
      expect(template.Resources.NotificationTopic).toBeDefined();
      expect(template.Resources.NotificationTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('NotificationTopic should have correct topic name with environment suffix', () => {
      const topic = template.Resources.NotificationTopic;
      expect(topic.Properties.TopicName).toEqual({
        'Fn::Sub': 'AppointmentNotifications-${EnvironmentSuffix}',
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should have all required log groups', () => {
      expect(template.Resources.ProcessorLogGroup).toBeDefined();
      expect(template.Resources.EmailLogGroup).toBeDefined();
      expect(template.Resources.SmsLogGroup).toBeDefined();
      expect(template.Resources.StepFunctionsLogGroup).toBeDefined();
    });

    test('log groups should have correct retention period', () => {
      const logGroups = ['ProcessorLogGroup', 'EmailLogGroup', 'SmsLogGroup', 'StepFunctionsLogGroup'];
      logGroups.forEach(logGroupName => {
        const logGroup = template.Resources[logGroupName];
        expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
        expect(logGroup.Properties.RetentionInDays).toBe(7);
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should have all required Lambda functions', () => {
      expect(template.Resources.AppointmentProcessorFunction).toBeDefined();
      expect(template.Resources.EmailSenderFunction).toBeDefined();
      expect(template.Resources.SmsSenderFunction).toBeDefined();
      expect(template.Resources.StatusUpdaterFunction).toBeDefined();
    });

    test('Lambda functions should use Node.js 22 runtime', () => {
      const lambdaFunctions = [
        'AppointmentProcessorFunction',
        'EmailSenderFunction',
        'SmsSenderFunction',
        'StatusUpdaterFunction',
      ];

      lambdaFunctions.forEach(functionName => {
        const func = template.Resources[functionName];
        expect(func.Type).toBe('AWS::Lambda::Function');
        expect(func.Properties.Runtime).toBe('nodejs22.x');
      });
    });

    test('Lambda functions should have correct timeout and memory settings', () => {
      const lambdaFunctions = [
        'AppointmentProcessorFunction',
        'EmailSenderFunction',
        'SmsSenderFunction',
        'StatusUpdaterFunction',
      ];

      lambdaFunctions.forEach(functionName => {
        const func = template.Resources[functionName];
        expect(func.Properties.Timeout).toBe(30);
        expect(func.Properties.MemorySize).toBe(256);
      });
    });

    test('AppointmentProcessorFunction should have correct environment variables', () => {
      const func = template.Resources.AppointmentProcessorFunction;
      expect(func.Properties.Environment.Variables.APPOINTMENTS_TABLE).toEqual({
        Ref: 'AppointmentsTable',
      });
      expect(func.Properties.Environment.Variables.APPOINTMENT_TIME_INDEX).toBe('AppointmentTimeIndex');
    });

    test('EmailSenderFunction should have correct environment variables', () => {
      const func = template.Resources.EmailSenderFunction;
      expect(func.Properties.Environment.Variables.SENDER_EMAIL).toEqual({
        Ref: 'SenderEmail',
      });
    });

    test('SmsSenderFunction should have correct environment variables', () => {
      const func = template.Resources.SmsSenderFunction;
      expect(func.Properties.Environment.Variables.SNS_TOPIC_ARN).toEqual({
        Ref: 'NotificationTopic',
      });
    });

    test('StatusUpdaterFunction should have correct environment variables', () => {
      const func = template.Resources.StatusUpdaterFunction;
      expect(func.Properties.Environment.Variables.APPOINTMENTS_TABLE).toEqual({
        Ref: 'AppointmentsTable',
      });
    });

    test('Lambda functions should have inline code', () => {
      const lambdaFunctions = [
        'AppointmentProcessorFunction',
        'EmailSenderFunction',
        'SmsSenderFunction',
        'StatusUpdaterFunction',
      ];

      lambdaFunctions.forEach(functionName => {
        const func = template.Resources[functionName];
        expect(func.Properties.Code.ZipFile).toBeDefined();
        expect(func.Properties.Code.ZipFile.length).toBeGreaterThan(0);
      });
    });
  });

  describe('IAM Roles', () => {
    test('should have LambdaExecutionRole', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('LambdaExecutionRole should have correct assume role policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const assumeRole = role.Properties.AssumeRolePolicyDocument;
      expect(assumeRole.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumeRole.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('LambdaExecutionRole should have correct policies', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;

      expect(policies.length).toBeGreaterThanOrEqual(3);

      const policyNames = policies.map((p: any) => p.PolicyName);
      expect(policyNames).toContain('DynamoDBAccess');
      expect(policyNames).toContain('SNSPublish');
      expect(policyNames).toContain('SESAccess');
    });

    test('should have StepFunctionsExecutionRole', () => {
      expect(template.Resources.StepFunctionsExecutionRole).toBeDefined();
      expect(template.Resources.StepFunctionsExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('StepFunctionsExecutionRole should have correct assume role policy', () => {
      const role = template.Resources.StepFunctionsExecutionRole;
      const assumeRole = role.Properties.AssumeRolePolicyDocument;
      expect(assumeRole.Statement[0].Principal.Service).toBe('states.amazonaws.com');
    });

    test('should have EventBridgeExecutionRole', () => {
      expect(template.Resources.EventBridgeExecutionRole).toBeDefined();
      expect(template.Resources.EventBridgeExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have PipeRole', () => {
      expect(template.Resources.PipeRole).toBeDefined();
      expect(template.Resources.PipeRole.Type).toBe('AWS::IAM::Role');
    });

    test('PipeRole should have correct assume role policy', () => {
      const role = template.Resources.PipeRole;
      const assumeRole = role.Properties.AssumeRolePolicyDocument;
      expect(assumeRole.Statement[0].Principal.Service).toBe('pipes.amazonaws.com');
    });
  });

  describe('Step Functions State Machine', () => {
    test('should have NotificationWorkflow resource', () => {
      expect(template.Resources.NotificationWorkflow).toBeDefined();
      expect(template.Resources.NotificationWorkflow.Type).toBe('AWS::StepFunctions::StateMachine');
    });

    test('NotificationWorkflow should have correct state machine name', () => {
      const stateMachine = template.Resources.NotificationWorkflow;
      expect(stateMachine.Properties.StateMachineName).toEqual({
        'Fn::Sub': 'NotificationWorkflow-${EnvironmentSuffix}',
      });
    });

    test('NotificationWorkflow should have logging configuration', () => {
      const stateMachine = template.Resources.NotificationWorkflow;
      expect(stateMachine.Properties.LoggingConfiguration).toBeDefined();
      expect(stateMachine.Properties.LoggingConfiguration.Level).toBe('ALL');
    });

    test('NotificationWorkflow should have valid definition string', () => {
      const stateMachine = template.Resources.NotificationWorkflow;
      expect(stateMachine.Properties.DefinitionString).toBeDefined();

      const definition = JSON.parse(
        stateMachine.Properties.DefinitionString['Fn::Sub']
      );

      expect(definition.StartAt).toBe('ProcessAppointments');
      expect(definition.States).toBeDefined();
    });

    test('NotificationWorkflow definition should have ProcessAppointments state', () => {
      const stateMachine = template.Resources.NotificationWorkflow;
      const definition = JSON.parse(
        stateMachine.Properties.DefinitionString['Fn::Sub']
      );

      expect(definition.States.ProcessAppointments).toBeDefined();
      expect(definition.States.ProcessAppointments.Type).toBe('Task');
    });

    test('NotificationWorkflow definition should have retry logic', () => {
      const stateMachine = template.Resources.NotificationWorkflow;
      const definition = JSON.parse(
        stateMachine.Properties.DefinitionString['Fn::Sub']
      );

      const retryConfig = definition.States.ProcessAppointments.Retry;
      expect(retryConfig).toBeDefined();
      expect(retryConfig[0].MaxAttempts).toBe(3);
      expect(retryConfig[0].BackoffRate).toBe(2.0);
    });

    test('NotificationWorkflow definition should have parallel execution for SMS and email', () => {
      const stateMachine = template.Resources.NotificationWorkflow;
      const definition = JSON.parse(
        stateMachine.Properties.DefinitionString['Fn::Sub']
      );

      expect(definition.States.MapAppointments).toBeDefined();
      const iterator = definition.States.MapAppointments.Iterator;
      expect(iterator.States.SendNotifications.Type).toBe('Parallel');
      expect(iterator.States.SendNotifications.Branches).toHaveLength(2);
    });
  });

  describe('EventBridge Resources', () => {
    test('should have ScheduledNotificationRule', () => {
      expect(template.Resources.ScheduledNotificationRule).toBeDefined();
      expect(template.Resources.ScheduledNotificationRule.Type).toBe('AWS::Events::Rule');
    });

    test('ScheduledNotificationRule should have correct schedule expression', () => {
      const rule = template.Resources.ScheduledNotificationRule;
      expect(rule.Properties.ScheduleExpression).toBe('rate(1 hour)');
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('ScheduledNotificationRule should target Step Functions workflow', () => {
      const rule = template.Resources.ScheduledNotificationRule;
      expect(rule.Properties.Targets).toHaveLength(1);
      expect(rule.Properties.Targets[0].Arn).toEqual({
        'Fn::GetAtt': ['NotificationWorkflow', 'Arn'],
      });
    });

    test('should have AppointmentStreamPipe', () => {
      expect(template.Resources.AppointmentStreamPipe).toBeDefined();
      expect(template.Resources.AppointmentStreamPipe.Type).toBe('AWS::Pipes::Pipe');
    });

    test('AppointmentStreamPipe should have correct source and target', () => {
      const pipe = template.Resources.AppointmentStreamPipe;
      expect(pipe.Properties.Source).toEqual({
        'Fn::GetAtt': ['AppointmentsTable', 'StreamArn'],
      });
      expect(pipe.Properties.Target).toEqual({
        'Fn::GetAtt': ['NotificationWorkflow', 'Arn'],
      });
    });

    test('AppointmentStreamPipe should have correct source parameters', () => {
      const pipe = template.Resources.AppointmentStreamPipe;
      const sourceParams = pipe.Properties.SourceParameters.DynamoDBStreamParameters;

      expect(sourceParams.StartingPosition).toBe('LATEST');
      expect(sourceParams.BatchSize).toBe(10);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'AppointmentsTableName',
        'AppointmentsTableArn',
        'NotificationTopicArn',
        'NotificationWorkflowArn',
        'AppointmentProcessorFunctionArn',
        'EmailSenderFunctionArn',
        'SmsSenderFunctionArn',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('AppointmentsTableName output should be correct', () => {
      const output = template.Outputs.AppointmentsTableName;
      expect(output.Value).toEqual({ Ref: 'AppointmentsTable' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-AppointmentsTableName',
      });
    });

    test('NotificationWorkflowArn output should be correct', () => {
      const output = template.Outputs.NotificationWorkflowArn;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['NotificationWorkflow', 'Arn'],
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('resource names should include environment suffix', () => {
      const resourcesWithSuffix = [
        'AppointmentsTable',
        'NotificationTopic',
        'AppointmentProcessorFunction',
        'EmailSenderFunction',
        'SmsSenderFunction',
        'StatusUpdaterFunction',
        'NotificationWorkflow',
        'ScheduledNotificationRule',
        'AppointmentStreamPipe',
      ];

      resourcesWithSuffix.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const properties = resource.Properties;

        // Check if any property contains EnvironmentSuffix
        const hasEnvSuffix = JSON.stringify(properties).includes('EnvironmentSuffix');
        expect(hasEnvSuffix).toBe(true);
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(10);
    });
  });
});
