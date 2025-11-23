import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Payment Processing Infrastructure CloudFormation Template', () => {
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
      expect(template.Description).toContain('Payment Processing Infrastructure');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have optimization rationale in metadata', () => {
      expect(template.Metadata.OptimizationRationale).toBeDefined();
      expect(template.Metadata.OptimizationRationale.DynamoDB).toBeDefined();
      expect(template.Metadata.OptimizationRationale.Lambda).toBeDefined();
      expect(template.Metadata.OptimizationRationale.DependencyChain).toBeDefined();
    });

    test('should have StackSet configuration in metadata', () => {
      expect(template.Metadata.StackSetConfiguration).toBeDefined();
      expect(template.Metadata.StackSetConfiguration.PermissionModel).toBe('SERVICE_MANAGED');
    });

    test('should have stack policy guidance', () => {
      expect(template.Metadata.StackPolicyGuidance).toBeDefined();
      expect(template.Metadata.StackPolicyGuidance.ProtectedResources).toContain('PaymentTransactionTable');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix should have correct validation pattern', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.Default).toBe('dev');
    });

    test('should have Environment parameter with allowed values', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.AllowedValues).toEqual(['dev', 'staging', 'prod']);
      expect(param.Default).toBe('dev');
    });


    test('should have AlertEmail parameter with email validation', () => {
      const param = template.Parameters.AlertEmail;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
      expect(param.Default).toBe('alerts@example.com');
    });
  });

  describe('Conditions', () => {
    test('should have environment-specific conditions', () => {
      expect(template.Conditions.IsProduction).toBeDefined();
    });

    test('IsProduction condition should check for prod environment', () => {
      expect(template.Conditions.IsProduction).toEqual({
        'Fn::Equals': [{ Ref: 'Environment' }, 'prod']
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('should have PaymentTransactionTable resource', () => {
      expect(template.Resources.PaymentTransactionTable).toBeDefined();
      expect(template.Resources.PaymentTransactionTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should have Retain deletion policy', () => {
      const table = template.Resources.PaymentTransactionTable;
      expect(table.DeletionPolicy).toBe('Retain');
      expect(table.UpdateReplacePolicy).toBe('Retain');
    });

    test('should have on-demand billing mode', () => {
      const table = template.Resources.PaymentTransactionTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should have point-in-time recovery enabled', () => {
      const table = template.Resources.PaymentTransactionTable;
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('should have table name with environment suffix', () => {
      const table = template.Resources.PaymentTransactionTable;
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'payment-transactions-${EnvironmentSuffix}'
      });
    });

    test('should have correct key schema', () => {
      const table = template.Resources.PaymentTransactionTable;
      expect(table.Properties.KeySchema).toHaveLength(2);
      expect(table.Properties.KeySchema[0]).toEqual({
        AttributeName: 'transactionId',
        KeyType: 'HASH'
      });
      expect(table.Properties.KeySchema[1]).toEqual({
        AttributeName: 'timestamp',
        KeyType: 'RANGE'
      });
    });

    test('should have SSE encryption enabled', () => {
      const table = template.Resources.PaymentTransactionTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('should have DynamoDB stream enabled', () => {
      const table = template.Resources.PaymentTransactionTable;
      expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('should have comprehensive tags', () => {
      const table = template.Resources.PaymentTransactionTable;
      const tags = table.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags.length).toBeGreaterThanOrEqual(5);

      const tagNames = tags.map((t: any) => t.Key);
      expect(tagNames).toContain('Environment');
      expect(tagNames).toContain('Project');
      expect(tagNames).toContain('Team');
      expect(tagNames).toContain('CostCenter');
    });
  });

  describe('SNS Topic', () => {
    test('should have PaymentAlertTopic resource', () => {
      expect(template.Resources.PaymentAlertTopic).toBeDefined();
      expect(template.Resources.PaymentAlertTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have topic name with environment suffix', () => {
      const topic = template.Resources.PaymentAlertTopic;
      expect(topic.Properties.TopicName).toEqual({
        'Fn::Sub': 'payment-alerts-${EnvironmentSuffix}'
      });
    });

    test('should have email subscription', () => {
      expect(template.Resources.PaymentAlertSubscription).toBeDefined();
      const sub = template.Resources.PaymentAlertSubscription;
      expect(sub.Type).toBe('AWS::SNS::Subscription');
      expect(sub.Properties.Protocol).toBe('email');
      expect(sub.Properties.Endpoint).toEqual({ Ref: 'AlertEmail' });
    });

    test('should have comprehensive tags', () => {
      const topic = template.Resources.PaymentAlertTopic;
      const tags = topic.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Dead Letter Queue', () => {
    test('should have PaymentValidationDLQ resource', () => {
      expect(template.Resources.PaymentValidationDLQ).toBeDefined();
      expect(template.Resources.PaymentValidationDLQ.Type).toBe('AWS::SQS::Queue');
    });

    test('should have queue name with environment suffix', () => {
      const queue = template.Resources.PaymentValidationDLQ;
      expect(queue.Properties.QueueName).toEqual({
        'Fn::Sub': 'payment-validation-dlq-${EnvironmentSuffix}'
      });
    });

    test('should have 14-day message retention', () => {
      const queue = template.Resources.PaymentValidationDLQ;
      expect(queue.Properties.MessageRetentionPeriod).toBe(1209600);
    });

    test('should have visibility timeout', () => {
      const queue = template.Resources.PaymentValidationDLQ;
      expect(queue.Properties.VisibilityTimeout).toBe(300);
    });

    test('should have comprehensive tags', () => {
      const queue = template.Resources.PaymentValidationDLQ;
      const tags = queue.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('IAM Role', () => {
    test('should have PaymentValidationRole resource', () => {
      expect(template.Resources.PaymentValidationRole).toBeDefined();
      expect(template.Resources.PaymentValidationRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have role name with environment suffix', () => {
      const role = template.Resources.PaymentValidationRole;
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': 'payment-validation-role-${EnvironmentSuffix}'
      });
    });

    test('should have Lambda assume role policy', () => {
      const role = template.Resources.PaymentValidationRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should have basic execution managed policy', () => {
      const role = template.Resources.PaymentValidationRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('should have DynamoDB access policy', () => {
      const role = template.Resources.PaymentValidationRole;
      const policies = role.Properties.Policies;
      const dynamoPolicy = policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');

      expect(dynamoPolicy).toBeDefined();
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:PutItem');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:GetItem');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:Query');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:UpdateItem');
    });

    test('should have SNS publish policy', () => {
      const role = template.Resources.PaymentValidationRole;
      const policies = role.Properties.Policies;
      const snsPolicy = policies.find((p: any) => p.PolicyName === 'SNSPublish');

      expect(snsPolicy).toBeDefined();
      expect(snsPolicy.PolicyDocument.Statement[0].Action).toContain('sns:Publish');
    });

    test('should have X-Ray access policy', () => {
      const role = template.Resources.PaymentValidationRole;
      const policies = role.Properties.Policies;
      const xrayPolicy = policies.find((p: any) => p.PolicyName === 'XRayAccess');

      expect(xrayPolicy).toBeDefined();
      expect(xrayPolicy.PolicyDocument.Statement[0].Action).toContain('xray:PutTraceSegments');
      expect(xrayPolicy.PolicyDocument.Statement[0].Action).toContain('xray:PutTelemetryRecords');
    });

    test('should have SQS DLQ access policy', () => {
      const role = template.Resources.PaymentValidationRole;
      const policies = role.Properties.Policies;
      const sqsPolicy = policies.find((p: any) => p.PolicyName === 'SQSDLQAccess');

      expect(sqsPolicy).toBeDefined();
      expect(sqsPolicy.PolicyDocument.Statement[0].Action).toContain('sqs:SendMessage');
    });

    test('should have comprehensive tags', () => {
      const role = template.Resources.PaymentValidationRole;
      const tags = role.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Lambda Function', () => {
    test('should have PaymentValidationFunction resource', () => {
      expect(template.Resources.PaymentValidationFunction).toBeDefined();
      expect(template.Resources.PaymentValidationFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should have function name with environment suffix', () => {
      const lambda = template.Resources.PaymentValidationFunction;
      expect(lambda.Properties.FunctionName).toEqual({
        'Fn::Sub': 'payment-validation-${EnvironmentSuffix}'
      });
    });

    test('should have 3GB memory allocation', () => {
      const lambda = template.Resources.PaymentValidationFunction;
      expect(lambda.Properties.MemorySize).toBe(3072);
    });

    test('should have 5-minute timeout', () => {
      const lambda = template.Resources.PaymentValidationFunction;
      expect(lambda.Properties.Timeout).toBe(300);
    });

    test('should use arm64 architecture', () => {
      const lambda = template.Resources.PaymentValidationFunction;
      expect(lambda.Properties.Architectures).toEqual(['arm64']);
    });

    test('should have X-Ray tracing enabled', () => {
      const lambda = template.Resources.PaymentValidationFunction;
      expect(lambda.Properties.TracingConfig.Mode).toBe('Active');
    });

    test('should have reserved concurrency', () => {
      const lambda = template.Resources.PaymentValidationFunction;
      expect(lambda.Properties.ReservedConcurrentExecutions).toBeDefined();
      expect(lambda.Properties.ReservedConcurrentExecutions['Fn::If']).toBeDefined();
    });

    test('should have dead letter queue configured', () => {
      const lambda = template.Resources.PaymentValidationFunction;
      expect(lambda.Properties.DeadLetterConfig).toBeDefined();
      expect(lambda.Properties.DeadLetterConfig.TargetArn).toEqual({
        'Fn::GetAtt': ['PaymentValidationDLQ', 'Arn']
      });
    });

    test('should have environment variables using Fn::Sub', () => {
      const lambda = template.Resources.PaymentValidationFunction;
      const envVars = lambda.Properties.Environment.Variables;

      expect(envVars.DYNAMODB_TABLE_NAME).toEqual({
        'Fn::Sub': '${PaymentTransactionTable}'
      });
      expect(envVars.SNS_TOPIC_ARN).toEqual({
        'Fn::Sub': '${PaymentAlertTopic}'
      });
      expect(envVars.ENVIRONMENT).toEqual({ Ref: 'Environment' });
      expect(envVars.REGION).toEqual({ Ref: 'AWS::Region' });
    });

    test('should have inline Python code', () => {
      const lambda = template.Resources.PaymentValidationFunction;
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toContain('def handler(event, context)');
      expect(lambda.Properties.Runtime).toBe('python3.11');
    });


    test('should have comprehensive tags', () => {
      const lambda = template.Resources.PaymentValidationFunction;
      const tags = lambda.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('EventBridge Rule', () => {
    test('should have PaymentBatchProcessingRule resource', () => {
      expect(template.Resources.PaymentBatchProcessingRule).toBeDefined();
      expect(template.Resources.PaymentBatchProcessingRule.Type).toBe('AWS::Events::Rule');
    });

    test('should have rule name with environment suffix', () => {
      const rule = template.Resources.PaymentBatchProcessingRule;
      expect(rule.Properties.Name).toEqual({
        'Fn::Sub': 'payment-batch-processing-${EnvironmentSuffix}'
      });
    });

    test('should have schedule expression', () => {
      const rule = template.Resources.PaymentBatchProcessingRule;
      expect(rule.Properties.ScheduleExpression).toBe('rate(1 hour)');
    });

    test('should have conditional state based on environment', () => {
      const rule = template.Resources.PaymentBatchProcessingRule;
      expect(rule.Properties.State).toBeDefined();
      expect(rule.Properties.State['Fn::If']).toEqual(['IsProduction', 'ENABLED', 'DISABLED']);
    });

    test('should target Lambda function', () => {
      const rule = template.Resources.PaymentBatchProcessingRule;
      expect(rule.Properties.Targets).toHaveLength(1);
      expect(rule.Properties.Targets[0].Arn).toEqual({
        'Fn::GetAtt': ['PaymentValidationFunction', 'Arn']
      });
    });

    test('should have Lambda permission for EventBridge', () => {
      expect(template.Resources.PaymentBatchProcessingPermission).toBeDefined();
      const permission = template.Resources.PaymentBatchProcessingPermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
    });

  });

  describe('CloudWatch Alarms', () => {
    test('should have Lambda error alarm', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
    });

    test('Lambda error alarm should have environment-specific threshold', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Properties.Threshold).toBeDefined();
      expect(alarm.Properties.Threshold['Fn::If']).toEqual(['IsProduction', 5, 10]);
    });

    test('should have Lambda throttle alarm', () => {
      expect(template.Resources.LambdaThrottleAlarm).toBeDefined();
      const alarm = template.Resources.LambdaThrottleAlarm;
      expect(alarm.Properties.MetricName).toBe('Throttles');
      expect(alarm.Properties.Threshold).toBe(1);
    });

    test('should have DynamoDB user errors alarm', () => {
      expect(template.Resources.DynamoDBUserErrorsAlarm).toBeDefined();
      const alarm = template.Resources.DynamoDBUserErrorsAlarm;
      expect(alarm.Properties.MetricName).toBe('UserErrors');
      expect(alarm.Properties.Namespace).toBe('AWS/DynamoDB');
    });

    test('should have DLQ message alarm', () => {
      expect(template.Resources.DLQMessageAlarm).toBeDefined();
      const alarm = template.Resources.DLQMessageAlarm;
      expect(alarm.Properties.MetricName).toBe('ApproximateNumberOfMessagesVisible');
      expect(alarm.Properties.Namespace).toBe('AWS/SQS');
    });

    test('all alarms should have SNS topic as alarm action', () => {
      ['LambdaErrorAlarm', 'LambdaThrottleAlarm', 'DynamoDBUserErrorsAlarm', 'DLQMessageAlarm'].forEach(alarmName => {
        const alarm = template.Resources[alarmName];
        expect(alarm.Properties.AlarmActions).toEqual([{ Ref: 'PaymentAlertTopic' }]);
      });
    });


    test('all alarms should have alarm names with environment suffix', () => {
      ['LambdaErrorAlarm', 'LambdaThrottleAlarm', 'DynamoDBUserErrorsAlarm', 'DLQMessageAlarm'].forEach(alarmName => {
        const alarm = template.Resources[alarmName];
        expect(alarm.Properties.AlarmName).toEqual({
          'Fn::Sub': expect.stringContaining('-${EnvironmentSuffix}')
        });
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('should have PaymentProcessingDashboard resource', () => {
      expect(template.Resources.PaymentProcessingDashboard).toBeDefined();
      expect(template.Resources.PaymentProcessingDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('should have dashboard name with environment suffix', () => {
      const dashboard = template.Resources.PaymentProcessingDashboard;
      expect(dashboard.Properties.DashboardName).toEqual({
        'Fn::Sub': 'payment-processing-${EnvironmentSuffix}'
      });
    });

    test('should have dashboard body with widgets', () => {
      const dashboard = template.Resources.PaymentProcessingDashboard;
      expect(dashboard.Properties.DashboardBody).toBeDefined();

      const bodyStr = dashboard.Properties.DashboardBody['Fn::Sub'];
      expect(bodyStr).toBeDefined();
      expect(bodyStr).toContain('widgets');
    });

    test('dashboard should include Lambda metrics widget', () => {
      const dashboard = template.Resources.PaymentProcessingDashboard;
      const bodyStr = dashboard.Properties.DashboardBody['Fn::Sub'];
      expect(bodyStr).toContain('Lambda Metrics');
      expect(bodyStr).toContain('Invocations');
      expect(bodyStr).toContain('Errors');
      expect(bodyStr).toContain('Throttles');
      expect(bodyStr).toContain('Duration');
    });

    test('dashboard should include DynamoDB metrics widget', () => {
      const dashboard = template.Resources.PaymentProcessingDashboard;
      const bodyStr = dashboard.Properties.DashboardBody['Fn::Sub'];
      expect(bodyStr).toContain('DynamoDB Metrics');
      expect(bodyStr).toContain('ConsumedReadCapacityUnits');
      expect(bodyStr).toContain('ConsumedWriteCapacityUnits');
    });

    test('dashboard should include SNS metrics widget', () => {
      const dashboard = template.Resources.PaymentProcessingDashboard;
      const bodyStr = dashboard.Properties.DashboardBody['Fn::Sub'];
      expect(bodyStr).toContain('SNS Metrics');
      expect(bodyStr).toContain('NumberOfMessagesPublished');
    });

    test('dashboard should include SQS DLQ metrics widget', () => {
      const dashboard = template.Resources.PaymentProcessingDashboard;
      const bodyStr = dashboard.Properties.DashboardBody['Fn::Sub'];
      expect(bodyStr).toContain('SQS DLQ Metrics');
      expect(bodyStr).toContain('ApproximateNumberOfMessagesVisible');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'PaymentTransactionTableName',
        'PaymentTransactionTableArn',
        'PaymentValidationFunctionArn',
        'PaymentValidationFunctionName',
        'PaymentAlertTopicArn',
        'PaymentAlertTopicName',
        'PaymentValidationDLQArn',
        'PaymentValidationDLQUrl',
        'PaymentProcessingDashboardName',
        'StackEnvironment',
        'StackRegion'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        expect(template.Outputs[outputName].Description).toBeDefined();
      });
    });

    test('outputs should use Fn::Sub for export names', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        const output = template.Outputs[outputName];
        if (output.Export) {
          expect(output.Export.Name).toBeDefined();
          expect(output.Export.Name['Fn::Sub']).toBeDefined();
        }
      });
    });

    test('Lambda function ARN output should include environment suffix in export', () => {
      const output = template.Outputs.PaymentValidationFunctionArn;
      expect(output.Export.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('SNS topic ARN output should include environment suffix in export', () => {
      const output = template.Outputs.PaymentAlertTopicArn;
      expect(output.Export.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Resource Count', () => {
    test('should have exactly 13 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(13);
    });

    test('should have all expected resource types', () => {
      const resourceTypes = Object.values(template.Resources).map((r: any) => r.Type);

      expect(resourceTypes).toContain('AWS::DynamoDB::Table');
      expect(resourceTypes).toContain('AWS::SNS::Topic');
      expect(resourceTypes).toContain('AWS::SNS::Subscription');
      expect(resourceTypes).toContain('AWS::SQS::Queue');
      expect(resourceTypes).toContain('AWS::IAM::Role');
      expect(resourceTypes).toContain('AWS::Lambda::Function');
      expect(resourceTypes).toContain('AWS::Events::Rule');
      expect(resourceTypes).toContain('AWS::Lambda::Permission');
      expect(resourceTypes).toContain('AWS::CloudWatch::Alarm');
      expect(resourceTypes).toContain('AWS::CloudWatch::Dashboard');
    });
  });

  describe('Naming Conventions', () => {
    test('all resource names should include environment suffix', () => {
      const resourcesWithNames = [
        'PaymentTransactionTable',
        'PaymentAlertTopic',
        'PaymentValidationDLQ',
        'PaymentValidationRole',
        'PaymentValidationFunction',
        'PaymentBatchProcessingRule',
        'LambdaErrorAlarm',
        'LambdaThrottleAlarm',
        'DynamoDBUserErrorsAlarm',
        'DLQMessageAlarm',
        'PaymentProcessingDashboard'
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameProperty = resource.Properties.TableName ||
                           resource.Properties.TopicName ||
                           resource.Properties.QueueName ||
                           resource.Properties.RoleName ||
                           resource.Properties.FunctionName ||
                           resource.Properties.Name ||
                           resource.Properties.AlarmName ||
                           resource.Properties.DashboardName;

        if (nameProperty && nameProperty['Fn::Sub']) {
          expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
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
  });
});
