import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('IaC - Serverless Healthcare App Stack Unit Tests', () => {
  let template: any;
  let resources: any;
  let outputs: any;
  let parameters: any;

  beforeAll(() => {
    // This custom schema is required to correctly parse CloudFormation intrinsic functions
    const cfnSchema = yaml.DEFAULT_SCHEMA.extend([
      new yaml.Type('!Ref', {
        kind: 'scalar',
        construct: data => ({ Ref: data }),
      }),
      new yaml.Type('!Sub', {
        kind: 'scalar',
        construct: data => ({ 'Fn::Sub': data }),
      }),
      new yaml.Type('!Sub', {
        kind: 'sequence',
        construct: data => ({ 'Fn::Sub': data }),
      }),
      new yaml.Type('!GetAtt', {
        kind: 'scalar',
        construct: data => ({ 'Fn::GetAtt': data.split('.') }),
      }),
    ]);

    // CORRECTED: Pointing to the correct file path assuming tests are in `test/` and lib is in `lib/`
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent, { schema: cfnSchema });
    resources = template.Resources;
    outputs = template.Outputs;
    parameters = template.Parameters;
  });

  // 1. Test Suite for Template Parameters
  describe('✅ Parameters', () => {
    test('should define ProjectName parameter correctly', () => {
      expect(parameters.ProjectName).toBeDefined();
      expect(parameters.ProjectName.Type).toBe('String');
      expect(parameters.ProjectName.Default).toBe('ServerlessHealthcareApp');
      expect(parameters.ProjectName.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    // CORRECTED: The EnvironmentSuffix parameter was removed as per requirements.
    test('should have exactly one parameter defined', () => {
      expect(Object.keys(parameters).length).toBe(1);
    });
  });

  // 2. Test Suite for Best Practices & Naming
  describe('✅ Best Practices & Naming', () => {
    // CORRECTED: The test now validates that resources ARE named according to the requirements.
    test('should contain required custom names for deployable resources', () => {
      expect(resources.PatientDataTable.Properties.TableName).toBeDefined();
      expect(resources.AnalyticsTaskQueue.Properties.QueueName).toBeDefined();
      expect(resources.PatientUpdatesTopic.Properties.TopicName).toBeDefined();
      expect(
        resources.ProcessPatientDataFunction.Properties.FunctionName
      ).toBeDefined();
    });

    test('should have a valid AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });
  });

  // 3. Test Suite for IAM Roles and Least Privilege
  describe('✅ IAM Roles & Least Privilege', () => {
    // CORRECTED: Validates the more secure logging permissions (no CreateLogGroup).
    test('ProcessPatientDataRole should have correct permissions', () => {
      const role = resources.ProcessPatientDataRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const actions = policy.Statement.map((p: any) => p.Action).flat();

      expect(actions).toContain('dynamodb:PutItem');
      expect(actions).toContain('sqs:SendMessage');
      expect(actions).toContain('logs:PutLogEvents');
      expect(actions).not.toContain('logs:CreateLogGroup'); // Important security check
      expect(actions).toHaveLength(4); // 2 for logs, 1 for DDB, 1 for SQS
    });

    test('ProcessPatientDataRole should NOT have unintended permissions', () => {
      const role = resources.ProcessPatientDataRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const actions = policy.Statement.map((p: any) => p.Action).flat();

      expect(actions).not.toContain('dynamodb:Scan');
      expect(actions).not.toContain('dynamodb:Query');
      expect(actions).not.toContain('sqs:ReceiveMessage');
    });

    // CORRECTED: Validates the more secure logging permissions.
    test('AnalyticsProcessingRole should have correct permissions', () => {
      const role = resources.AnalyticsProcessingRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const actions = policy.Statement.map((p: any) => p.Action).flat();

      expect(actions).toContain('sqs:ReceiveMessage');
      expect(actions).toContain('sqs:DeleteMessage');
      expect(actions).toContain('sqs:GetQueueAttributes');
      expect(actions).toHaveLength(5); // 3 for SQS, 2 for logs
    });

    // CORRECTED: Validates the more secure logging permissions.
    test('SendNotificationRole should have correct permissions', () => {
      const role = resources.SendNotificationRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const actions = policy.Statement.map((p: any) => p.Action).flat();

      expect(actions).toContain('sns:Publish');
      expect(actions).toHaveLength(3); // 1 for SNS, 2 for logs
    });

    test('All IAM roles should have the correct AssumeRolePolicy for Lambda', () => {
      const roles = [
        resources.ProcessPatientDataRole,
        resources.AnalyticsProcessingRole,
        resources.SendNotificationRole,
      ];
      roles.forEach(role => {
        const policy = role.Properties.AssumeRolePolicyDocument;
        expect(policy.Statement[0].Principal.Service).toBe(
          'lambda.amazonaws.com'
        );
        expect(policy.Statement[0].Action).toBe('sts:AssumeRole');
      });
    });
  });

  // 4. Test Suite for AWS Service Configurations
  describe('✅ AWS Service Configuration', () => {
    test('PatientDataTable should have PITR and SSE enabled', () => {
      const table = resources.PatientDataTable.Properties;
      expect(
        table.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled
      ).toBe(true);
      expect(table.SSESpecification.SSEEnabled).toBe(true);
    });

    test('PatientDataTable should have the correct primary key', () => {
      const table = resources.PatientDataTable.Properties;
      expect(table.KeySchema[0].AttributeName).toBe('PatientID');
      expect(table.KeySchema[0].KeyType).toBe('HASH');
      expect(table.AttributeDefinitions[0].AttributeName).toBe('PatientID');
      expect(table.AttributeDefinitions[0].AttributeType).toBe('S');
    });

    test('AnalyticsTaskQueue should have a DLQ configured correctly', () => {
      const queue = resources.AnalyticsTaskQueue.Properties;
      expect(queue.RedrivePolicy).toBeDefined();
      expect(queue.RedrivePolicy.maxReceiveCount).toBe(5);
      expect(queue.RedrivePolicy.deadLetterTargetArn).toEqual({
        'Fn::GetAtt': ['AnalyticsTaskDeadLetterQueue', 'Arn'],
      });
    });

    test('All Lambda functions should use the nodejs20.x runtime', () => {
      const functions = [
        resources.ProcessPatientDataFunction,
        resources.AnalyticsProcessingFunction,
        resources.SendNotificationFunction,
      ];
      functions.forEach(func => {
        expect(func.Properties.Runtime).toBe('nodejs20.x');
      });
    });

    test('ProcessPatientDataFunction should have correct environment variables', () => {
      const func = resources.ProcessPatientDataFunction.Properties;
      const envVars = func.Environment.Variables;
      expect(envVars.PATIENT_TABLE_NAME).toEqual({ Ref: 'PatientDataTable' });
      expect(envVars.ANALYTICS_QUEUE_URL).toEqual({
        Ref: 'AnalyticsTaskQueue',
      });
    });
  });

  // 5. Test Suite for Triggers and Permissions
  describe('✅ Triggers & Permissions', () => {
    test('AnalyticsQueueEventSourceMapping should link the correct queue and function', () => {
      const mapping = resources.AnalyticsQueueEventSourceMapping.Properties;
      expect(mapping.EventSourceArn).toEqual({
        'Fn::GetAtt': ['AnalyticsTaskQueue', 'Arn'],
      });
      expect(mapping.FunctionName).toEqual({
        'Fn::GetAtt': ['AnalyticsProcessingFunction', 'Arn'],
      });
      expect(mapping.BatchSize).toBe(10);
    });

    test('NotificationTopicSubscription should link the correct topic and function', () => {
      const sub = resources.NotificationTopicSubscription.Properties;
      expect(sub.Protocol).toBe('lambda');
      expect(sub.TopicArn).toEqual({ Ref: 'PatientUpdatesTopic' });
      expect(sub.Endpoint).toEqual({
        'Fn::GetAtt': ['SendNotificationFunction', 'Arn'],
      });
    });

    test('NotificationFunctionInvokePermission should grant SNS permission to invoke the function', () => {
      const perm = resources.NotificationFunctionInvokePermission.Properties;
      expect(perm.Action).toBe('lambda:InvokeFunction');
      expect(perm.Principal).toBe('sns.amazonaws.com');
      expect(perm.SourceArn).toEqual({ Ref: 'PatientUpdatesTopic' });
      expect(perm.FunctionName).toEqual({
        'Fn::GetAtt': ['SendNotificationFunction', 'Arn'],
      });
    });
  });

  // 6. Test Suite for Outputs
  describe('✅ Outputs', () => {
    // CORRECTED: The number of outputs is now 13 since EnvironmentSuffix was removed.
    test('should define all 13 required outputs', () => {
      const outputKeys = Object.keys(outputs);
      expect(outputKeys.length).toBe(13);
    });

    test('should correctly export key resource identifiers', () => {
      expect(outputs.PatientDataTableName).toBeDefined();
      expect(outputs.AnalyticsTaskQueueURL).toBeDefined();
      expect(outputs.PatientUpdatesTopicArn).toBeDefined();
      expect(outputs.ProcessPatientDataRoleName).toBeDefined();
    });

    test('should use the correct export naming convention', () => {
      const tableOutput = outputs.PatientDataTableName;
      expect(tableOutput.Export.Name['Fn::Sub']).toBe(
        '${AWS::StackName}-PatientDataTableName'
      );
      const topicOutput = outputs.PatientUpdatesTopicArn;
      expect(topicOutput.Export.Name['Fn::Sub']).toBe(
        '${AWS::StackName}-PatientUpdatesTopicArn'
      );
    });
  });
});
