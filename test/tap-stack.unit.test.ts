import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - LocalStack Compatible', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON template converted from YAML using: pipenv run cfn-flip lib/TapStack.yml lib/TapStack.json
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have correct description for email notification system', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Email Notification System with SNS, SES, Lambda, DynamoDB, and CloudWatch'
      );
    });

    test('should have metadata section with proper parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toHaveLength(1);
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const requiredParams = [
        'EnvironmentSuffix',
        'VerifiedDomain',
        'SesFromAddress',
        'EnableProductionSES',
        'TestEmailAddress'
      ];

      requiredParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toBe('Must contain only alphanumeric characters');
    });

    test('EnableProductionSES should have boolean string values', () => {
      const param = template.Parameters.EnableProductionSES;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('false');
      expect(param.AllowedValues).toEqual(['true', 'false']);
    });

    test('email parameters should have sensible defaults', () => {
      expect(template.Parameters.VerifiedDomain.Default).toBe('example.com');
      expect(template.Parameters.SesFromAddress.Default).toBe('no-reply@example.com');
      expect(template.Parameters.TestEmailAddress.Default).toBe('test@example.com');
    });
  });

  describe('SNS Topics - LocalStack Compatible', () => {
    test('should create order confirmations SNS topic', () => {
      const topic = template.Resources.SNSTopicOrderConfirmations;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('SNS topics should NOT have KMS encryption (LocalStack incompatible)', () => {
      const topic = template.Resources.SNSTopicOrderConfirmations;
      // Verify KMS encryption has been removed for LocalStack compatibility
      expect(topic.Properties.KmsMasterKeyId).toBeUndefined();
    });

    test('should create SES feedback SNS topics', () => {
      const feedbackTopics = [
        'SNSTopicSesDelivery',
        'SNSTopicSesBounce',
        'SNSTopicSesComplaint'
      ];

      feedbackTopics.forEach(topicName => {
        const topic = template.Resources[topicName];
        expect(topic).toBeDefined();
        expect(topic.Type).toBe('AWS::SNS::Topic');
        // Verify no KMS encryption
        expect(topic.Properties.KmsMasterKeyId).toBeUndefined();
      });
    });

    test('should create SNS alarm topic', () => {
      const topic = template.Resources.SNSTopicAlarms;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.TopicName).toEqual({
        'Fn::Sub': '${EnvironmentSuffix}-email-system-alarms'
      });
    });

    test('all SNS topics should have proper tagging', () => {
      const topics = [
        'SNSTopicOrderConfirmations',
        'SNSTopicSesDelivery',
        'SNSTopicSesBounce',
        'SNSTopicSesComplaint',
        'SNSTopicAlarms'
      ];

      topics.forEach(topicName => {
        const topic = template.Resources[topicName];
        expect(topic.Properties.Tags).toBeDefined();

        const tags = topic.Properties.Tags;
        const irlhfTag = tags.find((tag: any) => tag.Key === 'iac-rlhf-amazon');
        expect(irlhfTag).toBeDefined();
        expect(irlhfTag.Value).toBe('true');
      });
    });

    test('should have exactly 5 SNS topics', () => {
      const snsTopics = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::SNS::Topic'
      );
      expect(snsTopics).toHaveLength(5);
    });
  });

  describe('DynamoDB Tables - LocalStack Compatible', () => {
    test('should create email deliveries table with correct schema', () => {
      const table = template.Resources.EmailDeliveriesTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');

      // Check partition and sort keys
      const keySchema = table.Properties.KeySchema;
      expect(keySchema).toHaveLength(2);
      expect(keySchema[0].AttributeName).toBe('orderId');
      expect(keySchema[0].KeyType).toBe('HASH');
      expect(keySchema[1].AttributeName).toBe('messageId');
      expect(keySchema[1].KeyType).toBe('RANGE');
    });

    test('DynamoDB tables should NOT have encryption (LocalStack incompatible)', () => {
      const table = template.Resources.EmailDeliveriesTable;
      // Verify SSE/KMS has been removed for LocalStack compatibility
      expect(table.Properties.SSESpecification).toBeUndefined();
    });

    test('DynamoDB tables should NOT have Point-in-Time Recovery (LocalStack incompatible)', () => {
      const table = template.Resources.EmailDeliveriesTable;
      // Verify PITR has been removed for LocalStack compatibility
      expect(table.Properties.PointInTimeRecoverySpecification).toBeUndefined();
    });

    test('email deliveries table should have GSIs for querying', () => {
      const table = template.Resources.EmailDeliveriesTable;
      const gsis = table.Properties.GlobalSecondaryIndexes;

      expect(gsis).toHaveLength(2);
      expect(gsis[0].IndexName).toBe('EmailIndex');
      expect(gsis[1].IndexName).toBe('StatusIndex');

      // Verify EmailIndex schema
      expect(gsis[0].KeySchema[0].AttributeName).toBe('to');
      expect(gsis[0].KeySchema[0].KeyType).toBe('HASH');
      expect(gsis[0].KeySchema[1].AttributeName).toBe('timestamp');
      expect(gsis[0].KeySchema[1].KeyType).toBe('RANGE');

      // Verify StatusIndex schema
      expect(gsis[1].KeySchema[0].AttributeName).toBe('status');
      expect(gsis[1].KeySchema[0].KeyType).toBe('HASH');
      expect(gsis[1].KeySchema[1].AttributeName).toBe('timestamp');
      expect(gsis[1].KeySchema[1].KeyType).toBe('RANGE');
    });

    test('email deliveries table should have TTL enabled', () => {
      const table = template.Resources.EmailDeliveriesTable;
      expect(table.Properties.TimeToLiveSpecification).toBeDefined();
      expect(table.Properties.TimeToLiveSpecification.Enabled).toBe(true);
      expect(table.Properties.TimeToLiveSpecification.AttributeName).toBe('ttl');
    });

    test('should create TurnAroundPromptTable for backward compatibility', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      
      // Verify no deletion protection (LocalStack incompatible)
      expect(table.Properties.DeletionProtectionEnabled).toBeUndefined();
    });

    test('TurnAroundPromptTable should have correct key schema', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('id');
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    test('all DynamoDB tables should have proper tagging', () => {
      const tables = ['EmailDeliveriesTable', 'TurnAroundPromptTable'];

      tables.forEach(tableName => {
        const table = template.Resources[tableName];
        expect(table.Properties.Tags).toBeDefined();

        const tags = table.Properties.Tags;
        const irlhfTag = tags.find((tag: any) => tag.Key === 'iac-rlhf-amazon');
        expect(irlhfTag).toBeDefined();
        expect(irlhfTag.Value).toBe('true');
      });
    });

    test('should have exactly 2 DynamoDB tables', () => {
      const dynamoTables = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::DynamoDB::Table'
      );
      expect(dynamoTables).toHaveLength(2);
    });
  });

  describe('IAM Roles - LocalStack Compatible', () => {
    test('should create Lambda execution roles with proper trust policies', () => {
      const roles = [
        'LambdaSendOrderEmailRole',
        'LambdaSesFeedbackProcessorRole',
        'LambdaCostMonitoringRole'
      ];

      roles.forEach(roleName => {
        const role = template.Resources[roleName];
        expect(role).toBeDefined();
        expect(role.Type).toBe('AWS::IAM::Role');

        const trustPolicy = role.Properties.AssumeRolePolicyDocument;
        expect(trustPolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
        expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
        expect(trustPolicy.Statement[0].Effect).toBe('Allow');
      });
    });

    test('Lambda send email role should have correct permissions', () => {
      const role = template.Resources.LambdaSendOrderEmailRole;
      const policies = role.Properties.Policies;

      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('SendOrderEmailPolicy');

      const statements = policies[0].PolicyDocument.Statement;
      
      // SES permissions
      const sesStatement = statements.find((stmt: any) =>
        stmt.Action.includes('ses:SendEmail')
      );
      expect(sesStatement).toBeDefined();
      expect(sesStatement.Resource).toBe('*'); // Simplified for LocalStack

      // DynamoDB permissions
      const dynamoStatement = statements.find((stmt: any) =>
        stmt.Action.includes('dynamodb:PutItem')
      );
      expect(dynamoStatement).toBeDefined();
      expect(dynamoStatement.Resource).toBeDefined();
    });

    test('IAM policies should NOT have complex conditions (LocalStack issues)', () => {
      const role = template.Resources.LambdaSendOrderEmailRole;
      const policies = role.Properties.Policies;
      const statements = policies[0].PolicyDocument.Statement;

      // CloudWatch statement should not have conditions
      const cwStatement = statements.find((stmt: any) =>
        stmt.Action.includes('cloudwatch:PutMetricData')
      );
      expect(cwStatement).toBeDefined();
      // Verify condition has been removed for LocalStack compatibility
      expect(cwStatement.Condition).toBeUndefined();
    });

    test('feedback processor role should have DynamoDB and CloudWatch permissions', () => {
      const role = template.Resources.LambdaSesFeedbackProcessorRole;
      const policies = role.Properties.Policies;
      const statements = policies[0].PolicyDocument.Statement;

      // DynamoDB permissions
      const dynamoStatement = statements.find((stmt: any) =>
        stmt.Action.includes('dynamodb:UpdateItem')
      );
      expect(dynamoStatement).toBeDefined();

      // CloudWatch permissions without conditions
      const cwStatement = statements.find((stmt: any) =>
        stmt.Action.includes('cloudwatch:PutMetricData')
      );
      expect(cwStatement).toBeDefined();
      expect(cwStatement.Condition).toBeUndefined();
    });

    test('cost monitoring role should have comprehensive permissions', () => {
      const role = template.Resources.LambdaCostMonitoringRole;
      const policies = role.Properties.Policies;
      const statements = policies[0].PolicyDocument.Statement;

      // CloudWatch permissions
      const cwStatement = statements.find((stmt: any) =>
        stmt.Action.includes('cloudwatch:GetMetricStatistics')
      );
      expect(cwStatement).toBeDefined();

      // SNS permissions
      const snsStatement = statements.find((stmt: any) =>
        stmt.Action.includes('sns:Publish')
      );
      expect(snsStatement).toBeDefined();
      expect(snsStatement.Resource).toEqual({ Ref: 'SNSTopicOrderConfirmations' });

      // DynamoDB permissions
      const dynamoStatement = statements.find((stmt: any) =>
        stmt.Action.includes('dynamodb:Scan')
      );
      expect(dynamoStatement).toBeDefined();
    });

    test('all IAM roles should have basic Lambda execution policy', () => {
      const roles = [
        'LambdaSendOrderEmailRole',
        'LambdaSesFeedbackProcessorRole',
        'LambdaCostMonitoringRole'
      ];

      roles.forEach(roleName => {
        const role = template.Resources[roleName];
        expect(role.Properties.ManagedPolicyArns).toContain(
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        );
      });
    });

    test('all IAM roles should have proper tagging', () => {
      const roles = [
        'LambdaSendOrderEmailRole',
        'LambdaSesFeedbackProcessorRole',
        'LambdaCostMonitoringRole'
      ];

      roles.forEach(roleName => {
        const role = template.Resources[roleName];
        expect(role.Properties.Tags).toBeDefined();

        const tags = role.Properties.Tags;
        const irlhfTag = tags.find((tag: any) => tag.Key === 'iac-rlhf-amazon');
        expect(irlhfTag).toBeDefined();
        expect(irlhfTag.Value).toBe('true');
      });
    });

    test('should have exactly 3 IAM roles', () => {
      const iamRoles = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::IAM::Role'
      );
      expect(iamRoles).toHaveLength(3);
    });
  });

  describe('Lambda Functions', () => {
    test('should create all required Lambda functions', () => {
      const functions = [
        'LambdaSendOrderEmail',
        'LambdaSesFeedbackProcessor',
        'LambdaCostMonitoring'
      ];

      functions.forEach(functionName => {
        const func = template.Resources[functionName];
        expect(func).toBeDefined();
        expect(func.Type).toBe('AWS::Lambda::Function');
        expect(func.Properties.Runtime).toBe('python3.12');
      });
    });

    test('send order email function should have correct configuration', () => {
      const func = template.Resources.LambdaSendOrderEmail;
      
      expect(func.Properties.FunctionName).toEqual({
        'Fn::Sub': '${EnvironmentSuffix}-send-order-email'
      });
      expect(func.Properties.Handler).toBe('index.lambda_handler');
      expect(func.Properties.Timeout).toBe(30);
      expect(func.Properties.Role).toEqual({
        'Fn::GetAtt': ['LambdaSendOrderEmailRole', 'Arn']
      });
    });

    test('send email function should have proper environment variables (without SES_CONFIG_SET)', () => {
      const func = template.Resources.LambdaSendOrderEmail;
      const env = func.Properties.Environment.Variables;

      expect(env.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(env.VERIFIED_DOMAIN).toEqual({ Ref: 'VerifiedDomain' });
      expect(env.SES_FROM_ADDRESS).toEqual({ Ref: 'SesFromAddress' });
      expect(env.ENABLE_PRODUCTION_SES).toEqual({ Ref: 'EnableProductionSES' });
      expect(env.TEST_EMAIL_ADDRESS).toEqual({ Ref: 'TestEmailAddress' });
      expect(env.EMAIL_DELIVERIES_TABLE).toEqual({ Ref: 'EmailDeliveriesTable' });
      
      // Verify SES_CONFIG_SET has been removed (LocalStack incompatible)
      expect(env.SES_CONFIG_SET).toBeUndefined();
    });

    test('feedback processor function should have correct environment variables', () => {
      const func = template.Resources.LambdaSesFeedbackProcessor;
      const env = func.Properties.Environment.Variables;

      expect(env.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(env.EMAIL_DELIVERIES_TABLE).toEqual({ Ref: 'EmailDeliveriesTable' });
    });

    test('cost monitoring function should have longer timeout', () => {
      const func = template.Resources.LambdaCostMonitoring;
      expect(func.Properties.Timeout).toBe(300);
    });

    test('cost monitoring function should have SNS topic ARN in environment', () => {
      const func = template.Resources.LambdaCostMonitoring;
      const env = func.Properties.Environment.Variables;

      expect(env.SNS_TOPIC_ARN).toEqual({ Ref: 'SNSTopicOrderConfirmations' });
      expect(env.EMAIL_DELIVERIES_TABLE).toEqual({ Ref: 'EmailDeliveriesTable' });
    });

    test('all Lambda functions should have inline code (ZipFile)', () => {
      const functions = [
        'LambdaSendOrderEmail',
        'LambdaSesFeedbackProcessor',
        'LambdaCostMonitoring'
      ];

      functions.forEach(functionName => {
        const func = template.Resources[functionName];
        expect(func.Properties.Code.ZipFile).toBeDefined();
        expect(func.Properties.Code.ZipFile).toContain('lambda_handler');
      });
    });

    test('all Lambda functions should have proper tagging', () => {
      const functions = [
        'LambdaSendOrderEmail',
        'LambdaSesFeedbackProcessor',
        'LambdaCostMonitoring'
      ];

      functions.forEach(functionName => {
        const func = template.Resources[functionName];
        expect(func.Properties.Tags).toBeDefined();

        const tags = func.Properties.Tags;
        const irlhfTag = tags.find((tag: any) => tag.Key === 'iac-rlhf-amazon');
        expect(irlhfTag).toBeDefined();
        expect(irlhfTag.Value).toBe('true');
      });
    });

    test('should have exactly 3 Lambda functions', () => {
      const lambdaFunctions = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::Lambda::Function'
      );
      expect(lambdaFunctions).toHaveLength(3);
    });
  });

  describe('Lambda Permissions', () => {
    test('should create permission for order confirmations topic', () => {
      const permission = template.Resources.LambdaPermissionOrderConfirmations;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.FunctionName).toEqual({ Ref: 'LambdaSendOrderEmail' });
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('sns.amazonaws.com');
      expect(permission.Properties.SourceArn).toEqual({ Ref: 'SNSTopicOrderConfirmations' });
    });

    test('should create permissions for all SES feedback topics', () => {
      const permissions = [
        { resource: 'LambdaPermissionSesDelivery', topic: 'SNSTopicSesDelivery' },
        { resource: 'LambdaPermissionSesBounce', topic: 'SNSTopicSesBounce' },
        { resource: 'LambdaPermissionSesComplaint', topic: 'SNSTopicSesComplaint' }
      ];

      permissions.forEach(({ resource, topic }) => {
        const permission = template.Resources[resource];
        expect(permission).toBeDefined();
        expect(permission.Type).toBe('AWS::Lambda::Permission');
        expect(permission.Properties.FunctionName).toEqual({ Ref: 'LambdaSesFeedbackProcessor' });
        expect(permission.Properties.Principal).toBe('sns.amazonaws.com');
        expect(permission.Properties.SourceArn).toEqual({ Ref: topic });
      });
    });

    test('should have exactly 4 Lambda permissions', () => {
      const lambdaPermissions = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::Lambda::Permission'
      );
      expect(lambdaPermissions).toHaveLength(4);
    });
  });

  describe('SNS Subscriptions', () => {
    test('should subscribe Lambda to order confirmations topic', () => {
      const subscription = template.Resources.SNSSubscriptionOrderConfirmations;
      expect(subscription).toBeDefined();
      expect(subscription.Type).toBe('AWS::SNS::Subscription');
      expect(subscription.Properties.Protocol).toBe('lambda');
      expect(subscription.Properties.TopicArn).toEqual({ Ref: 'SNSTopicOrderConfirmations' });
      expect(subscription.Properties.Endpoint).toEqual({
        'Fn::GetAtt': ['LambdaSendOrderEmail', 'Arn']
      });
    });

    test('should subscribe feedback processor to all SES topics', () => {
      const subscriptions = [
        { resource: 'SNSSubscriptionSesDelivery', topic: 'SNSTopicSesDelivery' },
        { resource: 'SNSSubscriptionSesBounce', topic: 'SNSTopicSesBounce' },
        { resource: 'SNSSubscriptionSesComplaint', topic: 'SNSTopicSesComplaint' }
      ];

      subscriptions.forEach(({ resource, topic }) => {
        const subscription = template.Resources[resource];
        expect(subscription).toBeDefined();
        expect(subscription.Type).toBe('AWS::SNS::Subscription');
        expect(subscription.Properties.Protocol).toBe('lambda');
        expect(subscription.Properties.TopicArn).toEqual({ Ref: topic });
        expect(subscription.Properties.Endpoint).toEqual({
          'Fn::GetAtt': ['LambdaSesFeedbackProcessor', 'Arn']
        });
      });
    });

    test('should NOT have email subscription to alarm topic (LocalStack incompatible)', () => {
      const emailSubscription = template.Resources.SNSSubscriptionAlarms;
      // Verify email subscription has been removed
      expect(emailSubscription).toBeUndefined();
    });

    test('should have exactly 4 SNS subscriptions (all Lambda protocol)', () => {
      const snsSubscriptions = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::SNS::Subscription'
      );
      expect(snsSubscriptions).toHaveLength(4);

      // Verify all are Lambda protocol
      snsSubscriptions.forEach(subName => {
        const sub = template.Resources[subName];
        expect(sub.Properties.Protocol).toBe('lambda');
      });
    });
  });

  describe('SES Resources - LocalStack Compatibility', () => {
    test('should NOT have SES Configuration Set (LocalStack limited support)', () => {
      const configSet = template.Resources.SESConfigurationSet;
      expect(configSet).toBeUndefined();
    });

    test('should NOT have SES Event Destinations (LocalStack limited support)', () => {
      const eventDestinations = [
        'SESEventDestinationDelivery',
        'SESEventDestinationBounce',
        'SESEventDestinationComplaint'
      ];

      eventDestinations.forEach(destName => {
        expect(template.Resources[destName]).toBeUndefined();
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create high bounce rate alarm', () => {
      const alarm = template.Resources.AlarmHighBounceRate;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('BounceRate');
      expect(alarm.Properties.Statistic).toBe('Average');
      expect(alarm.Properties.Threshold).toBe(5);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should create email send failures alarm', () => {
      const alarm = template.Resources.AlarmEmailSendFailures;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('SendFailures');
      expect(alarm.Properties.Statistic).toBe('Sum');
      expect(alarm.Properties.Threshold).toBe(10);
    });

    test('alarms should publish to SNS alarm topic', () => {
      const alarms = ['AlarmHighBounceRate', 'AlarmEmailSendFailures'];

      alarms.forEach(alarmName => {
        const alarm = template.Resources[alarmName];
        expect(alarm.Properties.AlarmActions).toEqual([{ Ref: 'SNSTopicAlarms' }]);
      });
    });

    test('alarms should have proper tagging', () => {
      const alarms = ['AlarmHighBounceRate', 'AlarmEmailSendFailures'];

      alarms.forEach(alarmName => {
        const alarm = template.Resources[alarmName];
        expect(alarm.Properties.Tags).toBeDefined();

        const tags = alarm.Properties.Tags;
        const irlhfTag = tags.find((tag: any) => tag.Key === 'iac-rlhf-amazon');
        expect(irlhfTag).toBeDefined();
        expect(irlhfTag.Value).toBe('true');
      });
    });

    test('should have exactly 2 CloudWatch alarms', () => {
      const cloudwatchAlarms = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::CloudWatch::Alarm'
      );
      expect(cloudwatchAlarms).toHaveLength(2);
    });
  });

  describe('Outputs', () => {
    test('should export SNS topic ARN', () => {
      const output = template.Outputs.OrderConfirmationsTopicArn;
      expect(output).toBeDefined();
      expect(output.Description).toBe('ARN of the order confirmations SNS topic');
      expect(output.Value).toEqual({ Ref: 'SNSTopicOrderConfirmations' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-OrderConfirmationsTopicArn'
      });
    });

    test('should export email deliveries table details', () => {
      const nameOutput = template.Outputs.EmailDeliveriesTableName;
      const arnOutput = template.Outputs.EmailDeliveriesTableArn;

      expect(nameOutput.Value).toEqual({ Ref: 'EmailDeliveriesTable' });
      expect(arnOutput.Value).toEqual({
        'Fn::GetAtt': ['EmailDeliveriesTable', 'Arn']
      });
    });

    test('should export TurnAroundPromptTable details', () => {
      const nameOutput = template.Outputs.TurnAroundPromptTableName;
      const arnOutput = template.Outputs.TurnAroundPromptTableArn;

      expect(nameOutput).toBeDefined();
      expect(nameOutput.Value).toEqual({ Ref: 'TurnAroundPromptTable' });
      expect(arnOutput.Value).toEqual({
        'Fn::GetAtt': ['TurnAroundPromptTable', 'Arn']
      });
    });

    test('should export Lambda function ARNs', () => {
      const lambdaOutputs = [
        { output: 'SendOrderEmailFunctionArn', lambda: 'LambdaSendOrderEmail' },
        { output: 'SesFeedbackProcessorFunctionArn', lambda: 'LambdaSesFeedbackProcessor' },
        { output: 'CostMonitoringFunctionArn', lambda: 'LambdaCostMonitoring' }
      ];

      lambdaOutputs.forEach(({ output, lambda }) => {
        const outputDef = template.Outputs[output];
        expect(outputDef).toBeDefined();
        expect(outputDef.Value).toEqual({
          'Fn::GetAtt': [lambda, 'Arn']
        });
      });
    });

    test('should export stack metadata', () => {
      const stackNameOutput = template.Outputs.StackName;
      const envSuffixOutput = template.Outputs.EnvironmentSuffix;

      expect(stackNameOutput.Value).toEqual({ Ref: 'AWS::StackName' });
      expect(envSuffixOutput.Value).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`
        });
      });
    });

    test('should have exactly 10 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(10);
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

    test('should have correct total resource count for LocalStack deployment', () => {
      const resourceCount = Object.keys(template.Resources).length;
      // 5 SNS + 2 DynamoDB + 3 IAM Roles + 3 Lambda + 4 Permissions + 4 Subscriptions + 2 Alarms = 23
      expect(resourceCount).toBe(23);
    });

    test('should have all required resource types for email notification system', () => {
      const resourceTypes = new Set(
        Object.values(template.Resources).map((resource: any) => resource.Type)
      );

      const expectedTypes = [
        'AWS::SNS::Topic',
        'AWS::SNS::Subscription',
        'AWS::DynamoDB::Table',
        'AWS::IAM::Role',
        'AWS::Lambda::Function',
        'AWS::Lambda::Permission',
        'AWS::CloudWatch::Alarm'
      ];

      expectedTypes.forEach(type => {
        expect(resourceTypes.has(type)).toBe(true);
      });
    });

    test('should have consistent resource naming convention', () => {
      const resourceNames = Object.keys(template.Resources);
      
      // Check SNS topics follow naming
      const snsTopics = resourceNames.filter(name => name.startsWith('SNSTopic'));
      expect(snsTopics.length).toBeGreaterThan(0);

      // Check Lambda functions follow naming
      const lambdaFunctions = resourceNames.filter(name => name.startsWith('Lambda'));
      expect(lambdaFunctions.length).toBeGreaterThan(0);
    });

    test('should have all required tags on taggable resources', () => {
      const taggableTypes = [
        'AWS::SNS::Topic',
        'AWS::DynamoDB::Table',
        'AWS::IAM::Role',
        'AWS::Lambda::Function',
        'AWS::CloudWatch::Alarm'
      ];

      Object.entries(template.Resources).forEach(([name, resource]: [string, any]) => {
        if (taggableTypes.includes(resource.Type)) {
          expect(resource.Properties.Tags).toBeDefined();
          const tags = resource.Properties.Tags;
          const irlhfTag = tags.find((tag: any) => tag.Key === 'iac-rlhf-amazon');
          expect(irlhfTag).toBeDefined();
        }
      });
    });
  });

  describe('LocalStack Compatibility Summary', () => {
    test('template should be fully LocalStack Pro compatible', () => {
      // Verify all LocalStack incompatible features have been removed
      const incompatibleFeatures = [
        { name: 'KMS encryption on SNS', check: () => {
          const sns = template.Resources.SNSTopicOrderConfirmations;
          return sns.Properties.KmsMasterKeyId === undefined;
        }},
        { name: 'SSE/KMS on DynamoDB', check: () => {
          const table = template.Resources.EmailDeliveriesTable;
          return table.Properties.SSESpecification === undefined;
        }},
        { name: 'Point-in-Time Recovery', check: () => {
          const table = template.Resources.EmailDeliveriesTable;
          return table.Properties.PointInTimeRecoverySpecification === undefined;
        }},
        { name: 'Deletion Protection', check: () => {
          const table = template.Resources.TurnAroundPromptTable;
          return table.Properties.DeletionProtectionEnabled === undefined;
        }},
        { name: 'SES Configuration Set', check: () => {
          return template.Resources.SESConfigurationSet === undefined;
        }},
        { name: 'SES Event Destinations', check: () => {
          return template.Resources.SESEventDestinationDelivery === undefined;
        }},
        { name: 'Email SNS Subscription', check: () => {
          return template.Resources.SNSSubscriptionAlarms === undefined;
        }},
        { name: 'IAM Policy Conditions', check: () => {
          const role = template.Resources.LambdaSendOrderEmailRole;
          const statements = role.Properties.Policies[0].PolicyDocument.Statement;
          const cwStatement = statements.find((s: any) => s.Action.includes('cloudwatch:PutMetricData'));
          return cwStatement.Condition === undefined;
        }}
      ];

      incompatibleFeatures.forEach(({ name, check }) => {
        expect(check()).toBe(true);
      });
    });
  });
});
