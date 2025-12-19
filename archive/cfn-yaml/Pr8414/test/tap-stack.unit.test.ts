import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Payment Workflow Orchestration CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Convert YAML to JSON for CloudFormation projects
    // Run: pipenv run cfn-flip lib/TapStack.yml lib/TapStack.json
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
      expect(template.Description).toBe('Payment Workflow Orchestration System using Step Functions');
    });

    test('should not have metadata section (removed for LocalStack)', () => {
      expect(template.Metadata).toBeUndefined();
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('dev');
      expect(envParam.AllowedValues).toEqual(['dev', 'test', 'prod']);
      expect(envParam.Description).toBe('Environment name for resource naming');
    });

    test('should have AlertEmail parameter', () => {
      expect(template.Parameters.AlertEmail).toBeDefined();
      const alertParam = template.Parameters.AlertEmail;
      expect(alertParam.Type).toBe('String');
      expect(alertParam.Description).toBe('Email address for workflow failure alerts');
      expect(alertParam.AllowedPattern).toBe('[^@]+@[^@]+\\.[^@]+');
    });

    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe('Environment suffix for resource naming (e.g., dev, staging, prod)');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe('Must contain only alphanumeric characters');
    });
  });

  describe('DynamoDB Table', () => {
    test('should have DynamoDBTablePaymentTransactions resource', () => {
      expect(template.Resources.DynamoDBTablePaymentTransactions).toBeDefined();
    });

    test('should be a DynamoDB table', () => {
      const table = template.Resources.DynamoDBTablePaymentTransactions;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should have correct table properties', () => {
      const table = template.Resources.DynamoDBTablePaymentTransactions;
      const properties = table.Properties;

      expect(properties.TableName).toEqual({
        'Fn::Sub': '${Environment}-payment-transactions-${EnvironmentSuffix}'
      });
      expect(properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should NOT have encryption features (removed for LocalStack)', () => {
      const table = template.Resources.DynamoDBTablePaymentTransactions;
      const properties = table.Properties;

      expect(properties.PointInTimeRecoverySpecification).toBeUndefined();
      expect(properties.SSESpecification).toBeUndefined();
    });

    test('should have correct attribute definitions', () => {
      const table = template.Resources.DynamoDBTablePaymentTransactions;
      const attributeDefinitions = table.Properties.AttributeDefinitions;

      expect(attributeDefinitions).toHaveLength(2);
      expect(attributeDefinitions[0].AttributeName).toBe('paymentId');
      expect(attributeDefinitions[0].AttributeType).toBe('S');
      expect(attributeDefinitions[1].AttributeName).toBe('timestamp');
      expect(attributeDefinitions[1].AttributeType).toBe('S');
    });

    test('should have correct key schema', () => {
      const table = template.Resources.DynamoDBTablePaymentTransactions;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('paymentId');
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    test('should have Global Secondary Index', () => {
      const table = template.Resources.DynamoDBTablePaymentTransactions;
      const gsi = table.Properties.GlobalSecondaryIndexes;

      expect(gsi).toHaveLength(1);
      expect(gsi[0].IndexName).toBe('TimestampIndex');
      expect(gsi[0].KeySchema).toHaveLength(2);
      expect(gsi[0].KeySchema[0].AttributeName).toBe('timestamp');
      expect(gsi[0].KeySchema[0].KeyType).toBe('HASH');
      expect(gsi[0].KeySchema[1].AttributeName).toBe('paymentId');
      expect(gsi[0].KeySchema[1].KeyType).toBe('RANGE');
      expect(gsi[0].Projection.ProjectionType).toBe('ALL');
    });

    test('should have iac-rlhf-amazon tags', () => {
      const table = template.Resources.DynamoDBTablePaymentTransactions;
      const tags = table.Properties.Tags;

      expect(tags).toHaveLength(3);
      expect(tags.some((tag: any) => tag.Key === 'Project' && tag.Value === 'iac-rlhf-amazon')).toBe(true);
      expect(tags.some((tag: any) => tag.Key === 'Environment')).toBe(true);
      expect(tags.some((tag: any) => tag.Key === 'EnvironmentSuffix')).toBe(true);
    });
  });

  describe('SNS Topic', () => {
    test('should have SNSTopicPaymentWorkflowAlerts resource', () => {
      expect(template.Resources.SNSTopicPaymentWorkflowAlerts).toBeDefined();
    });

    test('should be an SNS topic', () => {
      const topic = template.Resources.SNSTopicPaymentWorkflowAlerts;
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have correct topic properties', () => {
      const topic = template.Resources.SNSTopicPaymentWorkflowAlerts;
      const properties = topic.Properties;

      expect(properties.TopicName).toEqual({
        'Fn::Sub': '${Environment}-payment-workflow-alerts-${EnvironmentSuffix}'
      });
      expect(properties.DisplayName).toBe('Payment Workflow Alerts');
    });

    test('should NOT have KMS encryption (removed for LocalStack)', () => {
      const topic = template.Resources.SNSTopicPaymentWorkflowAlerts;
      const properties = topic.Properties;

      expect(properties.KmsMasterKeyId).toBeUndefined();
    });

    test('should have email subscription', () => {
      const topic = template.Resources.SNSTopicPaymentWorkflowAlerts;
      const subscription = topic.Properties.Subscription;

      expect(subscription).toHaveLength(1);
      expect(subscription[0].Endpoint).toEqual({ Ref: 'AlertEmail' });
      expect(subscription[0].Protocol).toBe('email');
    });

    test('should have iac-rlhf-amazon tags', () => {
      const topic = template.Resources.SNSTopicPaymentWorkflowAlerts;
      const tags = topic.Properties.Tags;

      expect(tags).toHaveLength(3);
      expect(tags.some((tag: any) => tag.Key === 'Project' && tag.Value === 'iac-rlhf-amazon')).toBe(true);
    });
  });

  describe('IAM Roles', () => {
    test('should have StepFunctionsRole resource', () => {
      expect(template.Resources.StepFunctionsRole).toBeDefined();
    });

    test('should be an IAM role', () => {
      const role = template.Resources.StepFunctionsRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should have correct assume role policy', () => {
      const role = template.Resources.StepFunctionsRole;
      const assumeRolePolicy = role.Properties.AssumeRolePolicyDocument;

      expect(assumeRolePolicy.Version).toBe('2012-10-17');
      expect(assumeRolePolicy.Statement).toHaveLength(1);
      expect(assumeRolePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('states.amazonaws.com');
      expect(assumeRolePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should NOT have ManagedPolicyArns (removed for LocalStack)', () => {
      const role = template.Resources.StepFunctionsRole;
      expect(role.Properties.ManagedPolicyArns).toBeUndefined();
    });

    test('should have inline policies only', () => {
      const role = template.Resources.StepFunctionsRole;
      expect(role.Properties.Policies).toBeDefined();
      expect(role.Properties.Policies.length).toBeGreaterThan(0);
    });

    test('should have Lambda execution role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should have correct Lambda assume role policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const assumeRolePolicy = role.Properties.AssumeRolePolicyDocument;

      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('LambdaExecutionRole should NOT have ManagedPolicyArns (removed for LocalStack)', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toBeUndefined();
    });

    test('should have iac-rlhf-amazon tags on both roles', () => {
      const stepFunctionsRole = template.Resources.StepFunctionsRole;
      const lambdaRole = template.Resources.LambdaExecutionRole;

      expect(stepFunctionsRole.Properties.Tags.some((tag: any) => tag.Key === 'Project' && tag.Value === 'iac-rlhf-amazon')).toBe(true);
      expect(lambdaRole.Properties.Tags.some((tag: any) => tag.Key === 'Project' && tag.Value === 'iac-rlhf-amazon')).toBe(true);
    });
  });

  describe('Lambda Functions', () => {
    const lambdaFunctions = [
      'ValidatePaymentLambda',
      'ProcessPaymentLambda',
      'StoreTransactionLambda',
      'NotifyCustomerLambda'
    ];

    lambdaFunctions.forEach(functionName => {
      test(`should have ${functionName} resource`, () => {
        expect(template.Resources[functionName]).toBeDefined();
      });

      test(`${functionName} should be a Lambda function`, () => {
        const lambda = template.Resources[functionName];
        expect(lambda.Type).toBe('AWS::Lambda::Function');
      });

      test(`${functionName} should have correct runtime`, () => {
        const lambda = template.Resources[functionName];
        expect(lambda.Properties.Runtime).toBe('python3.9');
      });

      test(`${functionName} should have correct handler`, () => {
        const lambda = template.Resources[functionName];
        expect(lambda.Properties.Handler).toBe('index.handler');
      });

      test(`${functionName} should have correct role reference`, () => {
        const lambda = template.Resources[functionName];
        expect(lambda.Properties.Role).toEqual({ 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] });
      });

      test(`${functionName} should have iac-rlhf-amazon tags`, () => {
        const lambda = template.Resources[functionName];
        const tags = lambda.Properties.Tags;

        expect(tags).toHaveLength(3);
        expect(tags.some((tag: any) => tag.Key === 'Project' && tag.Value === 'iac-rlhf-amazon')).toBe(true);
      });
    });

    test('ValidatePaymentLambda should have correct timeout and memory', () => {
      const lambda = template.Resources.ValidatePaymentLambda;
      expect(lambda.Properties.Timeout).toBe(30);
      expect(lambda.Properties.MemorySize).toBe(256);
    });

    test('ProcessPaymentLambda should have correct timeout and memory', () => {
      const lambda = template.Resources.ProcessPaymentLambda;
      expect(lambda.Properties.Timeout).toBe(60);
      expect(lambda.Properties.MemorySize).toBe(512);
    });

    test('ProcessPaymentLambda should NOT have ReservedConcurrentExecutions (removed for LocalStack)', () => {
      const lambda = template.Resources.ProcessPaymentLambda;
      expect(lambda.Properties.ReservedConcurrentExecutions).toBeUndefined();
    });

    test('StoreTransactionLambda should have correct timeout and memory', () => {
      const lambda = template.Resources.StoreTransactionLambda;
      expect(lambda.Properties.Timeout).toBe(30);
      expect(lambda.Properties.MemorySize).toBe(256);
    });

    test('NotifyCustomerLambda should have correct timeout and memory', () => {
      const lambda = template.Resources.NotifyCustomerLambda;
      expect(lambda.Properties.Timeout).toBe(30);
      expect(lambda.Properties.MemorySize).toBe(128);
    });
  });

  describe('Step Functions State Machine', () => {
    test('should have PaymentWorkflowStateMachine resource', () => {
      expect(template.Resources.PaymentWorkflowStateMachine).toBeDefined();
    });

    test('should be a Step Functions state machine', () => {
      const stateMachine = template.Resources.PaymentWorkflowStateMachine;
      expect(stateMachine.Type).toBe('AWS::StepFunctions::StateMachine');
    });

    test('should have correct state machine properties', () => {
      const stateMachine = template.Resources.PaymentWorkflowStateMachine;
      const properties = stateMachine.Properties;

      expect(properties.StateMachineName).toEqual({
        'Fn::Sub': '${Environment}-payment-workflow-${EnvironmentSuffix}'
      });
      expect(properties.RoleArn).toEqual({ 'Fn::GetAtt': ['StepFunctionsRole', 'Arn'] });
    });

    test('should NOT have StateMachineType (removed for LocalStack)', () => {
      const stateMachine = template.Resources.PaymentWorkflowStateMachine;
      expect(stateMachine.Properties.StateMachineType).toBeUndefined();
    });

    test('should NOT have logging configuration (removed for LocalStack)', () => {
      const stateMachine = template.Resources.PaymentWorkflowStateMachine;
      expect(stateMachine.Properties.LoggingConfiguration).toBeUndefined();
    });

    test('should have state machine definition', () => {
      const stateMachine = template.Resources.PaymentWorkflowStateMachine;
      const definition = stateMachine.Properties.Definition;

      expect(definition.Comment).toBe('Payment processing workflow with retry logic');
      expect(definition.StartAt).toBe('ValidatePayment');
      expect(definition.States).toBeDefined();
    });

    test('should have all required states', () => {
      const stateMachine = template.Resources.PaymentWorkflowStateMachine;
      const states = stateMachine.Properties.Definition.States;

      const expectedStates = [
        'ValidatePayment',
        'CheckValidation',
        'ValidationFailed',
        'ProcessPayment',
        'CheckPaymentResult',
        'StoreSuccessTransaction',
        'PaymentFailed',
        'NotifySuccess',
        'NotifyValidationFailure',
        'NotifyAndAlert'
      ];

      expectedStates.forEach(stateName => {
        expect(states[stateName]).toBeDefined();
      });
    });

    test('should have iac-rlhf-amazon tags', () => {
      const stateMachine = template.Resources.PaymentWorkflowStateMachine;
      const tags = stateMachine.Properties.Tags;

      expect(tags).toHaveLength(3);
      expect(tags.some((tag: any) => tag.Key === 'Project' && tag.Value === 'iac-rlhf-amazon')).toBe(true);
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have StepFunctionsLogGroup resource', () => {
      expect(template.Resources.StepFunctionsLogGroup).toBeDefined();
    });

    test('should be a CloudWatch Log Group', () => {
      const logGroup = template.Resources.StepFunctionsLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('CloudWatch Log Group should NOT have RetentionInDays (removed for LocalStack)', () => {
      const logGroup = template.Resources.StepFunctionsLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBeUndefined();
    });

    test('should NOT have PaymentWorkflowDashboard (removed for LocalStack)', () => {
      expect(template.Resources.PaymentWorkflowDashboard).toBeUndefined();
    });

    test('should NOT have WorkflowFailureAlarm (removed for LocalStack)', () => {
      expect(template.Resources.WorkflowFailureAlarm).toBeUndefined();
    });

    test('should NOT have HighExecutionTimeAlarm (removed for LocalStack)', () => {
      expect(template.Resources.HighExecutionTimeAlarm).toBeUndefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'StateMachineArn',
        'DynamoDBTableName',
        'SNSTopicArn',
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix',
        'ValidatePaymentLambdaName',
        'ValidatePaymentLambdaArn',
        'ProcessPaymentLambdaName',
        'ProcessPaymentLambdaArn',
        'StoreTransactionLambdaName',
        'StoreTransactionLambdaArn',
        'NotifyCustomerLambdaName',
        'NotifyCustomerLambdaArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should NOT have DashboardURL output (removed for LocalStack)', () => {
      expect(template.Outputs.DashboardURL).toBeUndefined();
    });

    test('StateMachineArn output should be correct', () => {
      const output = template.Outputs.StateMachineArn;
      expect(output.Description).toBe('ARN of the Payment Workflow State Machine');
      expect(output.Value).toEqual({ Ref: 'PaymentWorkflowStateMachine' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-StateMachineArn'
      });
    });

    test('DynamoDBTableName output should be correct', () => {
      const output = template.Outputs.DynamoDBTableName;
      expect(output.Description).toBe('Name of the Payment Transactions DynamoDB table');
      expect(output.Value).toEqual({ Ref: 'DynamoDBTablePaymentTransactions' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-DynamoDBTableName'
      });
    });

    test('SNSTopicArn output should be correct', () => {
      const output = template.Outputs.SNSTopicArn;
      expect(output.Description).toBe('ARN of the SNS topic for alerts');
      expect(output.Value).toEqual({ Ref: 'SNSTopicPaymentWorkflowAlerts' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-SNSTopicArn'
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

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      // DynamoDB, SNS, 2 IAM roles, 4 Lambdas, Step Functions, Log Group = 10 resources
      expect(resourceCount).toBe(10);
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3); // Environment, AlertEmail, EnvironmentSuffix
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      // StateMachineArn, DynamoDBTableName, SNSTopicArn, TurnAroundPromptTableName, 
      // TurnAroundPromptTableArn, StackName, EnvironmentSuffix, 
      // + 8 Lambda outputs (4 Name + 4 Arn) = 15
      expect(outputCount).toBe(15);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resource names should follow naming convention with environment suffix', () => {
      const resources = template.Resources;

      Object.keys(resources).forEach(resourceName => {
        const resource = resources[resourceName];

        // Check if resource has a name property that uses environment suffix
        if (resource.Properties && resource.Properties.FunctionName) {
          const functionName = typeof resource.Properties.FunctionName === 'string'
            ? resource.Properties.FunctionName
            : JSON.stringify(resource.Properties.FunctionName);
          expect(functionName).toMatch(/\$\{Environment\}/);
        }
        if (resource.Properties && resource.Properties.TableName) {
          const tableName = typeof resource.Properties.TableName === 'string'
            ? resource.Properties.TableName
            : JSON.stringify(resource.Properties.TableName);
          expect(tableName).toMatch(/\$\{Environment\}/);
        }
        if (resource.Properties && resource.Properties.TopicName) {
          const topicName = typeof resource.Properties.TopicName === 'string'
            ? resource.Properties.TopicName
            : JSON.stringify(resource.Properties.TopicName);
          expect(topicName).toMatch(/\$\{Environment\}/);
        }
        if (resource.Properties && resource.Properties.StateMachineName) {
          const stateMachineName = typeof resource.Properties.StateMachineName === 'string'
            ? resource.Properties.StateMachineName
            : JSON.stringify(resource.Properties.StateMachineName);
          expect(stateMachineName).toMatch(/\$\{Environment\}/);
        }
        if (resource.Properties && resource.Properties.DashboardName) {
          const dashboardName = typeof resource.Properties.DashboardName === 'string'
            ? resource.Properties.DashboardName
            : JSON.stringify(resource.Properties.DashboardName);
          expect(dashboardName).toMatch(/\$\{Environment\}/);
        }
        if (resource.Properties && resource.Properties.AlarmName) {
          const alarmName = typeof resource.Properties.AlarmName === 'string'
            ? resource.Properties.AlarmName
            : JSON.stringify(resource.Properties.AlarmName);
          expect(alarmName).toMatch(/\$\{Environment\}/);
        }
        if (resource.Properties && resource.Properties.LogGroupName) {
          const logGroupName = typeof resource.Properties.LogGroupName === 'string'
            ? resource.Properties.LogGroupName
            : JSON.stringify(resource.Properties.LogGroupName);
          expect(logGroupName).toMatch(/\$\{Environment\}/);
        }
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export && output.Export.Name) {
          expect(output.Export.Name).toEqual({
            'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
          });
        }
      });
    });
  });

  describe('Security and Compliance', () => {
    test('all resources should have iac-rlhf-amazon tag', () => {
      const resources = template.Resources;

      Object.keys(resources).forEach(resourceName => {
        const resource = resources[resourceName];

        if (resource.Properties && resource.Properties.Tags) {
          const hasProjectTag = resource.Properties.Tags.some((tag: any) =>
            tag.Key === 'Project' && tag.Value === 'iac-rlhf-amazon'
          );
          expect(hasProjectTag).toBe(true);
        }
      });
    });

    test('DynamoDB table should NOT have encryption enabled (removed for LocalStack)', () => {
      const table = template.Resources.DynamoDBTablePaymentTransactions;
      expect(table.Properties.SSESpecification).toBeUndefined();
    });

    test('DynamoDB table should NOT have point-in-time recovery enabled (removed for LocalStack)', () => {
      const table = template.Resources.DynamoDBTablePaymentTransactions;
      expect(table.Properties.PointInTimeRecoverySpecification).toBeUndefined();
    });

    test('SNS topic should NOT use KMS encryption (removed for LocalStack)', () => {
      const topic = template.Resources.SNSTopicPaymentWorkflowAlerts;
      expect(topic.Properties.KmsMasterKeyId).toBeUndefined();
    });
  });

  describe('Cross-Account Compatibility', () => {
    test('should not have hardcoded account IDs', () => {
      const templateString = JSON.stringify(template);
      expect(templateString).not.toMatch(/\d{12}/); // No 12-digit account IDs
    });

    test('should not have hardcoded region names', () => {
      const templateString = JSON.stringify(template);
      expect(templateString).not.toMatch(/(us-east-1|us-west-2|eu-west-1)/);
    });

    test('should use parameterized resource names', () => {
      const templateString = JSON.stringify(template);
      expect(templateString).toMatch(/\$\{Environment\}/);
      expect(templateString).toMatch(/\$\{EnvironmentSuffix\}/);
    });
  });
});