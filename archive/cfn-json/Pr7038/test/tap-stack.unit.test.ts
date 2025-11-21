import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Serverless Cryptocurrency Alert System - CloudFormation Template', () => {
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
      expect(template.Description).toContain('cryptocurrency alert processing system');
    });

    test('should have required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have AlertEmailAddress parameter', () => {
      expect(template.Parameters.AlertEmailAddress).toBeDefined();
      expect(template.Parameters.AlertEmailAddress.Type).toBe('String');
    });
  });

  describe('DynamoDB Table', () => {
    test('should have AlertsTable resource', () => {
      expect(template.Resources.AlertsTable).toBeDefined();
      expect(template.Resources.AlertsTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('AlertsTable should have correct partition and sort keys', () => {
      const table = template.Resources.AlertsTable;
      const attributeDefinitions = table.Properties.AttributeDefinitions;
      const keySchema = table.Properties.KeySchema;

      expect(attributeDefinitions).toHaveLength(2);
      expect(attributeDefinitions[0].AttributeName).toBe('AlertId');
      expect(attributeDefinitions[0].AttributeType).toBe('S');
      expect(attributeDefinitions[1].AttributeName).toBe('Timestamp');
      expect(attributeDefinitions[1].AttributeType).toBe('N');

      expect(keySchema).toHaveLength(2);
      expect(keySchema[0].AttributeName).toBe('AlertId');
      expect(keySchema[0].KeyType).toBe('HASH');
      expect(keySchema[1].AttributeName).toBe('Timestamp');
      expect(keySchema[1].KeyType).toBe('RANGE');
    });

    test('AlertsTable should have point-in-time recovery enabled', () => {
      const table = template.Resources.AlertsTable;
      expect(table.Properties.PointInTimeRecoverySpecification).toBeDefined();
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('AlertsTable should have encryption enabled', () => {
      const table = template.Resources.AlertsTable;
      expect(table.Properties.SSESpecification).toBeDefined();
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('AlertsTable should have PAY_PER_REQUEST billing mode', () => {
      const table = template.Resources.AlertsTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('AlertsTable should have Retain deletion policy', () => {
      const table = template.Resources.AlertsTable;
      expect(table.DeletionPolicy).toBe('Retain');
    });

    test('AlertsTable name should use EnvironmentSuffix', () => {
      const table = template.Resources.AlertsTable;
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'crypto-alerts-${EnvironmentSuffix}'
      });
    });
  });

  describe('SNS Topic and Subscription', () => {
    test('should have CriticalAlertsTopic resource', () => {
      expect(template.Resources.CriticalAlertsTopic).toBeDefined();
      expect(template.Resources.CriticalAlertsTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('CriticalAlertsTopic should have Delete deletion policy', () => {
      expect(template.Resources.CriticalAlertsTopic.DeletionPolicy).toBe('Delete');
    });

    test('CriticalAlertsTopic name should use EnvironmentSuffix', () => {
      const topic = template.Resources.CriticalAlertsTopic;
      expect(topic.Properties.TopicName).toEqual({
        'Fn::Sub': 'critical-alerts-${EnvironmentSuffix}'
      });
    });

    test('should have AlertEmailSubscription resource', () => {
      expect(template.Resources.AlertEmailSubscription).toBeDefined();
      expect(template.Resources.AlertEmailSubscription.Type).toBe('AWS::SNS::Subscription');
    });

    test('AlertEmailSubscription should use email protocol', () => {
      const subscription = template.Resources.AlertEmailSubscription;
      expect(subscription.Properties.Protocol).toBe('email');
    });

    test('AlertEmailSubscription should reference CriticalAlertsTopic', () => {
      const subscription = template.Resources.AlertEmailSubscription;
      expect(subscription.Properties.TopicArn).toEqual({
        Ref: 'CriticalAlertsTopic'
      });
    });
  });

  describe('Dead Letter Queues', () => {
    test('should have IngestionDLQ resource', () => {
      expect(template.Resources.IngestionDLQ).toBeDefined();
      expect(template.Resources.IngestionDLQ.Type).toBe('AWS::SQS::Queue');
    });

    test('should have ProcessingDLQ resource', () => {
      expect(template.Resources.ProcessingDLQ).toBeDefined();
      expect(template.Resources.ProcessingDLQ.Type).toBe('AWS::SQS::Queue');
    });

    test('DLQs should have 14-day retention period', () => {
      const ingestionDLQ = template.Resources.IngestionDLQ;
      const processingDLQ = template.Resources.ProcessingDLQ;
      expect(ingestionDLQ.Properties.MessageRetentionPeriod).toBe(1209600);
      expect(processingDLQ.Properties.MessageRetentionPeriod).toBe(1209600);
    });

    test('DLQs should have Delete deletion policy', () => {
      expect(template.Resources.IngestionDLQ.DeletionPolicy).toBe('Delete');
      expect(template.Resources.ProcessingDLQ.DeletionPolicy).toBe('Delete');
    });

    test('DLQ names should use EnvironmentSuffix', () => {
      const ingestionDLQ = template.Resources.IngestionDLQ;
      const processingDLQ = template.Resources.ProcessingDLQ;
      expect(ingestionDLQ.Properties.QueueName).toEqual({
        'Fn::Sub': 'alert-ingestion-dlq-${EnvironmentSuffix}'
      });
      expect(processingDLQ.Properties.QueueName).toEqual({
        'Fn::Sub': 'alert-processing-dlq-${EnvironmentSuffix}'
      });
    });
  });

  describe('IAM Roles', () => {
    test('should have IngestionFunctionRole resource', () => {
      expect(template.Resources.IngestionFunctionRole).toBeDefined();
      expect(template.Resources.IngestionFunctionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have ProcessingFunctionRole resource', () => {
      expect(template.Resources.ProcessingFunctionRole).toBeDefined();
      expect(template.Resources.ProcessingFunctionRole.Type).toBe('AWS::IAM::Role');
    });

    test('IAM roles should have Lambda assume role policy', () => {
      const ingestionRole = template.Resources.IngestionFunctionRole;
      const processingRole = template.Resources.ProcessingFunctionRole;

      expect(ingestionRole.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(processingRole.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('IAM role names should use EnvironmentSuffix', () => {
      const ingestionRole = template.Resources.IngestionFunctionRole;
      const processingRole = template.Resources.ProcessingFunctionRole;
      expect(ingestionRole.Properties.RoleName).toEqual({
        'Fn::Sub': 'alert-ingestion-role-${EnvironmentSuffix}'
      });
      expect(processingRole.Properties.RoleName).toEqual({
        'Fn::Sub': 'alert-processing-role-${EnvironmentSuffix}'
      });
    });

    test('IngestionFunctionRole should have specific DynamoDB permissions', () => {
      const role = template.Resources.IngestionFunctionRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const dynamoStatement = policy.Statement.find((s: any) =>
        s.Action && s.Action.includes('dynamodb:PutItem')
      );

      expect(dynamoStatement).toBeDefined();
      expect(dynamoStatement.Action).toContain('dynamodb:PutItem');
      expect(dynamoStatement.Action).toContain('dynamodb:GetItem');
      expect(dynamoStatement.Resource).toEqual({
        'Fn::GetAtt': ['AlertsTable', 'Arn']
      });
    });

    test('ProcessingFunctionRole should have specific permissions', () => {
      const role = template.Resources.ProcessingFunctionRole;
      const policy = role.Properties.Policies[0].PolicyDocument;

      const dynamoStatement = policy.Statement.find((s: any) =>
        s.Action && s.Action.includes('dynamodb:Query')
      );
      const snsStatement = policy.Statement.find((s: any) =>
        s.Action && s.Action.includes('sns:Publish')
      );

      expect(dynamoStatement).toBeDefined();
      expect(dynamoStatement.Action).toContain('dynamodb:Query');
      expect(dynamoStatement.Action).toContain('dynamodb:GetItem');
      expect(dynamoStatement.Action).toContain('dynamodb:UpdateItem');

      expect(snsStatement).toBeDefined();
      expect(snsStatement.Action).toContain('sns:Publish');
      expect(snsStatement.Resource).toEqual({
        Ref: 'CriticalAlertsTopic'
      });
    });

    test('IAM roles should have no wildcard permissions', () => {
      const roles = [
        template.Resources.IngestionFunctionRole,
        template.Resources.ProcessingFunctionRole
      ];

      roles.forEach(role => {
        const policy = role.Properties.Policies[0].PolicyDocument;
        policy.Statement.forEach((statement: any) => {
          if (statement.Resource) {
            const resource = JSON.stringify(statement.Resource);
            expect(resource).not.toContain('"*"');
          }
        });
      });
    });

    test('IAM roles should have SQS send message permission for DLQ', () => {
      const ingestionRole = template.Resources.IngestionFunctionRole;
      const processingRole = template.Resources.ProcessingFunctionRole;

      const ingestionSqsStatement = ingestionRole.Properties.Policies[0].PolicyDocument.Statement.find((s: any) =>
        s.Action && s.Action.includes('sqs:SendMessage')
      );
      const processingSqsStatement = processingRole.Properties.Policies[0].PolicyDocument.Statement.find((s: any) =>
        s.Action && s.Action.includes('sqs:SendMessage')
      );

      expect(ingestionSqsStatement).toBeDefined();
      expect(ingestionSqsStatement.Resource).toEqual({
        'Fn::GetAtt': ['IngestionDLQ', 'Arn']
      });

      expect(processingSqsStatement).toBeDefined();
      expect(processingSqsStatement.Resource).toEqual({
        'Fn::GetAtt': ['ProcessingDLQ', 'Arn']
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should have IngestionLogGroup resource', () => {
      expect(template.Resources.IngestionLogGroup).toBeDefined();
      expect(template.Resources.IngestionLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have ProcessingLogGroup resource', () => {
      expect(template.Resources.ProcessingLogGroup).toBeDefined();
      expect(template.Resources.ProcessingLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('Log groups should have 3-day retention', () => {
      const ingestionLogGroup = template.Resources.IngestionLogGroup;
      const processingLogGroup = template.Resources.ProcessingLogGroup;
      expect(ingestionLogGroup.Properties.RetentionInDays).toBe(3);
      expect(processingLogGroup.Properties.RetentionInDays).toBe(3);
    });

    test('Log groups should have Delete deletion policy', () => {
      expect(template.Resources.IngestionLogGroup.DeletionPolicy).toBe('Delete');
      expect(template.Resources.ProcessingLogGroup.DeletionPolicy).toBe('Delete');
    });

    test('Log group names should use EnvironmentSuffix', () => {
      const ingestionLogGroup = template.Resources.IngestionLogGroup;
      const processingLogGroup = template.Resources.ProcessingLogGroup;
      expect(ingestionLogGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/alert-ingestion-${EnvironmentSuffix}'
      });
      expect(processingLogGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/alert-processing-${EnvironmentSuffix}'
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should have AlertIngestionFunction resource', () => {
      expect(template.Resources.AlertIngestionFunction).toBeDefined();
      expect(template.Resources.AlertIngestionFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should have AlertProcessingFunction resource', () => {
      expect(template.Resources.AlertProcessingFunction).toBeDefined();
      expect(template.Resources.AlertProcessingFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda functions should use ARM64 architecture', () => {
      const ingestionFunction = template.Resources.AlertIngestionFunction;
      const processingFunction = template.Resources.AlertProcessingFunction;
      expect(ingestionFunction.Properties.Architectures).toEqual(['arm64']);
      expect(processingFunction.Properties.Architectures).toEqual(['arm64']);
    });

    test('Lambda functions should use Python 3.11 runtime', () => {
      const ingestionFunction = template.Resources.AlertIngestionFunction;
      const processingFunction = template.Resources.AlertProcessingFunction;
      expect(ingestionFunction.Properties.Runtime).toBe('python3.11');
      expect(processingFunction.Properties.Runtime).toBe('python3.11');
    });

    test('Lambda functions should not have reserved concurrent executions (using unreserved pool)', () => {
      const ingestionFunction = template.Resources.AlertIngestionFunction;
      const processingFunction = template.Resources.AlertProcessingFunction;
      expect(ingestionFunction.Properties.ReservedConcurrentExecutions).toBeUndefined();
      expect(processingFunction.Properties.ReservedConcurrentExecutions).toBeUndefined();
    });

    test('Lambda functions should have dead letter queue configured', () => {
      const ingestionFunction = template.Resources.AlertIngestionFunction;
      const processingFunction = template.Resources.AlertProcessingFunction;

      expect(ingestionFunction.Properties.DeadLetterConfig).toBeDefined();
      expect(ingestionFunction.Properties.DeadLetterConfig.TargetArn).toEqual({
        'Fn::GetAtt': ['IngestionDLQ', 'Arn']
      });

      expect(processingFunction.Properties.DeadLetterConfig).toBeDefined();
      expect(processingFunction.Properties.DeadLetterConfig.TargetArn).toEqual({
        'Fn::GetAtt': ['ProcessingDLQ', 'Arn']
      });
    });

    test('Lambda functions should have environment variables', () => {
      const ingestionFunction = template.Resources.AlertIngestionFunction;
      const processingFunction = template.Resources.AlertProcessingFunction;

      expect(ingestionFunction.Properties.Environment.Variables.TABLE_NAME).toEqual({
        Ref: 'AlertsTable'
      });
      expect(ingestionFunction.Properties.Environment.Variables.SNS_TOPIC_ARN).toEqual({
        Ref: 'CriticalAlertsTopic'
      });

      expect(processingFunction.Properties.Environment.Variables.TABLE_NAME).toEqual({
        Ref: 'AlertsTable'
      });
      expect(processingFunction.Properties.Environment.Variables.SNS_TOPIC_ARN).toEqual({
        Ref: 'CriticalAlertsTopic'
      });
    });

    test('Lambda functions should have Delete deletion policy', () => {
      expect(template.Resources.AlertIngestionFunction.DeletionPolicy).toBe('Delete');
      expect(template.Resources.AlertProcessingFunction.DeletionPolicy).toBe('Delete');
    });

    test('Lambda function names should use EnvironmentSuffix', () => {
      const ingestionFunction = template.Resources.AlertIngestionFunction;
      const processingFunction = template.Resources.AlertProcessingFunction;
      expect(ingestionFunction.Properties.FunctionName).toEqual({
        'Fn::Sub': 'alert-ingestion-${EnvironmentSuffix}'
      });
      expect(processingFunction.Properties.FunctionName).toEqual({
        'Fn::Sub': 'alert-processing-${EnvironmentSuffix}'
      });
    });

    test('Lambda functions should have inline code', () => {
      const ingestionFunction = template.Resources.AlertIngestionFunction;
      const processingFunction = template.Resources.AlertProcessingFunction;
      expect(ingestionFunction.Properties.Code.ZipFile).toBeDefined();
      expect(ingestionFunction.Properties.Code.ZipFile.length).toBeGreaterThan(0);
      expect(processingFunction.Properties.Code.ZipFile).toBeDefined();
      expect(processingFunction.Properties.Code.ZipFile.length).toBeGreaterThan(0);
    });
  });

  describe('Lambda Event Invoke Configurations', () => {
    test('should have IngestionFunctionRetryConfig resource', () => {
      expect(template.Resources.IngestionFunctionRetryConfig).toBeDefined();
      expect(template.Resources.IngestionFunctionRetryConfig.Type).toBe('AWS::Lambda::EventInvokeConfig');
    });

    test('should have ProcessingFunctionRetryConfig resource', () => {
      expect(template.Resources.ProcessingFunctionRetryConfig).toBeDefined();
      expect(template.Resources.ProcessingFunctionRetryConfig.Type).toBe('AWS::Lambda::EventInvokeConfig');
    });

    test('EventInvokeConfig should have maximum retry attempts of 2 or less', () => {
      const ingestionConfig = template.Resources.IngestionFunctionRetryConfig;
      const processingConfig = template.Resources.ProcessingFunctionRetryConfig;
      expect(ingestionConfig.Properties.MaximumRetryAttempts).toBeLessThanOrEqual(2);
      expect(processingConfig.Properties.MaximumRetryAttempts).toBeLessThanOrEqual(2);
    });

    test('EventInvokeConfig should have on-failure destination to DLQ', () => {
      const ingestionConfig = template.Resources.IngestionFunctionRetryConfig;
      const processingConfig = template.Resources.ProcessingFunctionRetryConfig;

      expect(ingestionConfig.Properties.DestinationConfig.OnFailure.Destination).toEqual({
        'Fn::GetAtt': ['IngestionDLQ', 'Arn']
      });
      expect(processingConfig.Properties.DestinationConfig.OnFailure.Destination).toEqual({
        'Fn::GetAtt': ['ProcessingDLQ', 'Arn']
      });
    });
  });

  describe('Outputs', () => {
    test('should have AlertIngestionFunctionArn output', () => {
      expect(template.Outputs.AlertIngestionFunctionArn).toBeDefined();
      expect(template.Outputs.AlertIngestionFunctionArn.Value).toEqual({
        'Fn::GetAtt': ['AlertIngestionFunction', 'Arn']
      });
    });

    test('should have AlertProcessingFunctionArn output', () => {
      expect(template.Outputs.AlertProcessingFunctionArn).toBeDefined();
      expect(template.Outputs.AlertProcessingFunctionArn.Value).toEqual({
        'Fn::GetAtt': ['AlertProcessingFunction', 'Arn']
      });
    });

    test('should have AlertsTableName output', () => {
      expect(template.Outputs.AlertsTableName).toBeDefined();
      expect(template.Outputs.AlertsTableName.Value).toEqual({
        Ref: 'AlertsTable'
      });
    });

    test('should have CriticalAlertsTopicArn output', () => {
      expect(template.Outputs.CriticalAlertsTopicArn).toBeDefined();
      expect(template.Outputs.CriticalAlertsTopicArn.Value).toEqual({
        Ref: 'CriticalAlertsTopic'
      });
    });

    test('should have IngestionDLQUrl output', () => {
      expect(template.Outputs.IngestionDLQUrl).toBeDefined();
      expect(template.Outputs.IngestionDLQUrl.Value).toEqual({
        Ref: 'IngestionDLQ'
      });
    });

    test('should have ProcessingDLQUrl output', () => {
      expect(template.Outputs.ProcessingDLQUrl).toBeDefined();
      expect(template.Outputs.ProcessingDLQUrl.Value).toEqual({
        Ref: 'ProcessingDLQ'
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Description).toBeDefined();
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Export).toBeDefined();
        expect(template.Outputs[outputKey].Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('Lambda functions should depend on log groups', () => {
      const ingestionFunction = template.Resources.AlertIngestionFunction;
      const processingFunction = template.Resources.AlertProcessingFunction;
      expect(ingestionFunction.DependsOn).toContain('IngestionLogGroup');
      expect(processingFunction.DependsOn).toContain('ProcessingLogGroup');
    });
  });

  describe('Resource Naming Convention', () => {
    test('all named resources should use EnvironmentSuffix', () => {
      const namedResources = [
        'AlertsTable',
        'CriticalAlertsTopic',
        'IngestionDLQ',
        'ProcessingDLQ',
        'IngestionFunctionRole',
        'ProcessingFunctionRole',
        'IngestionLogGroup',
        'ProcessingLogGroup',
        'AlertIngestionFunction',
        'AlertProcessingFunction'
      ];

      namedResources.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties.TableName) {
          expect(JSON.stringify(resource.Properties.TableName)).toContain('EnvironmentSuffix');
        }
        if (resource.Properties.TopicName) {
          expect(JSON.stringify(resource.Properties.TopicName)).toContain('EnvironmentSuffix');
        }
        if (resource.Properties.QueueName) {
          expect(JSON.stringify(resource.Properties.QueueName)).toContain('EnvironmentSuffix');
        }
        if (resource.Properties.RoleName) {
          expect(JSON.stringify(resource.Properties.RoleName)).toContain('EnvironmentSuffix');
        }
        if (resource.Properties.LogGroupName) {
          expect(JSON.stringify(resource.Properties.LogGroupName)).toContain('EnvironmentSuffix');
        }
        if (resource.Properties.FunctionName) {
          expect(JSON.stringify(resource.Properties.FunctionName)).toContain('EnvironmentSuffix');
        }
      });
    });
  });

  describe('Deletion Policies', () => {
    test('only DynamoDB table should have Retain policy', () => {
      const alertsTable = template.Resources.AlertsTable;
      expect(alertsTable.DeletionPolicy).toBe('Retain');
    });

    test('all other resources should have Delete policy', () => {
      const deletableResources = [
        'CriticalAlertsTopic',
        'IngestionDLQ',
        'ProcessingDLQ',
        'IngestionLogGroup',
        'ProcessingLogGroup',
        'AlertIngestionFunction',
        'AlertProcessingFunction'
      ];

      deletableResources.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('Security Best Practices', () => {
    test('DynamoDB should have encryption at rest', () => {
      const table = template.Resources.AlertsTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('IAM policies should not have wildcard actions', () => {
      const roles = [
        template.Resources.IngestionFunctionRole,
        template.Resources.ProcessingFunctionRole
      ];

      roles.forEach(role => {
        const policy = role.Properties.Policies[0].PolicyDocument;
        policy.Statement.forEach((statement: any) => {
          if (Array.isArray(statement.Action)) {
            statement.Action.forEach((action: string) => {
              expect(action).not.toBe('*');
            });
          } else {
            expect(statement.Action).not.toBe('*');
          }
        });
      });
    });

    test('IAM policies should not have wildcard resources', () => {
      const roles = [
        template.Resources.IngestionFunctionRole,
        template.Resources.ProcessingFunctionRole
      ];

      roles.forEach(role => {
        const policy = role.Properties.Policies[0].PolicyDocument;
        policy.Statement.forEach((statement: any) => {
          if (statement.Resource === '*') {
            fail('Wildcard resource (*) found in IAM policy');
          }
        });
      });
    });
  });
});
