import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Retail Order Processing Stack Unit Tests', () => {
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
      expect(template.Description).toContain('order processing system');
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
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
      expect(envSuffixParam.Description).toContain('Environment suffix');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-z0-9-]+$');
      expect(envSuffixParam.ConstraintDescription).toContain('lowercase letters, numbers, and hyphens');
    });
  });

  describe('SQS Resources', () => {
    test('should have OrderQueue resource', () => {
      expect(template.Resources.OrderQueue).toBeDefined();
      expect(template.Resources.OrderQueue.Type).toBe('AWS::SQS::Queue');
    });

    test('OrderQueue should have correct properties', () => {
      const queue = template.Resources.OrderQueue;
      const properties = queue.Properties;

      expect(properties.QueueName).toBeDefined();
      expect(properties.VisibilityTimeout).toBe(180);
      expect(properties.MessageRetentionPeriod).toBe(345600);
      expect(properties.ReceiveMessageWaitTimeSeconds).toBe(20);
      expect(properties.RedrivePolicy).toBeDefined();
      expect(properties.RedrivePolicy.maxReceiveCount).toBe(3);
    });

    test('should have OrderDLQ resource', () => {
      expect(template.Resources.OrderDLQ).toBeDefined();
      expect(template.Resources.OrderDLQ.Type).toBe('AWS::SQS::Queue');
    });

    test('OrderDLQ should have correct properties', () => {
      const dlq = template.Resources.OrderDLQ;
      const properties = dlq.Properties;

      expect(properties.QueueName).toBeDefined();
      expect(properties.MessageRetentionPeriod).toBe(1209600); // 14 days
    });

    test('OrderQueue should reference OrderDLQ in redrive policy', () => {
      const queue = template.Resources.OrderQueue;
      const redrivePolicy = queue.Properties.RedrivePolicy;

      expect(redrivePolicy.deadLetterTargetArn).toEqual({
        'Fn::GetAtt': ['OrderDLQ', 'Arn']
      });
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have OrderTable resource', () => {
      expect(template.Resources.OrderTable).toBeDefined();
      expect(template.Resources.OrderTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('OrderTable should have correct properties', () => {
      const table = template.Resources.OrderTable;
      const properties = table.Properties;

      expect(properties.TableName).toBeDefined();
      expect(properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
      expect(properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('OrderTable should have correct key schema', () => {
      const table = template.Resources.OrderTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('orderId');
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    test('OrderTable should have StatusIndex GSI', () => {
      const table = template.Resources.OrderTable;
      const gsi = table.Properties.GlobalSecondaryIndexes;

      expect(gsi).toHaveLength(1);
      expect(gsi[0].IndexName).toBe('StatusIndex');
      expect(gsi[0].KeySchema[0].AttributeName).toBe('status');
      expect(gsi[0].KeySchema[1].AttributeName).toBe('processedAt');
      expect(gsi[0].Projection.ProjectionType).toBe('ALL');
    });

    test('OrderTable should have correct attribute definitions', () => {
      const table = template.Resources.OrderTable;
      const attributeDefinitions = table.Properties.AttributeDefinitions;

      expect(attributeDefinitions).toHaveLength(3);

      const orderIdAttr = attributeDefinitions.find((attr: any) => attr.AttributeName === 'orderId');
      expect(orderIdAttr.AttributeType).toBe('S');

      const statusAttr = attributeDefinitions.find((attr: any) => attr.AttributeName === 'status');
      expect(statusAttr.AttributeType).toBe('S');

      const processedAtAttr = attributeDefinitions.find((attr: any) => attr.AttributeName === 'processedAt');
      expect(processedAtAttr.AttributeType).toBe('N');
    });
  });

  describe('Lambda Resources', () => {
    test('should have OrderProcessorFunction resource', () => {
      expect(template.Resources.OrderProcessorFunction).toBeDefined();
      expect(template.Resources.OrderProcessorFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('OrderProcessorFunction should have correct properties', () => {
      const lambda = template.Resources.OrderProcessorFunction;
      const properties = lambda.Properties;

      expect(properties.FunctionName).toBeDefined();
      expect(properties.Runtime).toBe('nodejs20.x');
      expect(properties.Handler).toBe('index.handler');
      expect(properties.Timeout).toBe(30);
      expect(properties.MemorySize).toBe(256);
      expect(properties.Code.ZipFile).toBeDefined();
      expect(properties.Code.ZipFile).toContain('DynamoDBClient');
    });

    test('OrderProcessorFunction should have environment variables', () => {
      const lambda = template.Resources.OrderProcessorFunction;
      const envVars = lambda.Properties.Environment.Variables;

      expect(envVars.ORDER_TABLE_NAME).toEqual({ Ref: 'OrderTable' });
      expect(envVars.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('should have OrderProcessorLogGroup resource', () => {
      expect(template.Resources.OrderProcessorLogGroup).toBeDefined();
      expect(template.Resources.OrderProcessorLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.OrderProcessorLogGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should have EventSourceMapping resource', () => {
      expect(template.Resources.OrderProcessorEventSourceMapping).toBeDefined();
      expect(template.Resources.OrderProcessorEventSourceMapping.Type).toBe('AWS::Lambda::EventSourceMapping');
    });

    test('EventSourceMapping should have correct configuration', () => {
      const esm = template.Resources.OrderProcessorEventSourceMapping;
      const properties = esm.Properties;

      expect(properties.BatchSize).toBe(10);
      expect(properties.MaximumBatchingWindowInSeconds).toBe(5);
      expect(properties.Enabled).toBe(true);
      expect(properties.FunctionResponseTypes).toContain('ReportBatchItemFailures');
    });
  });

  describe('IAM Resources', () => {
    test('should have OrderProcessorRole resource', () => {
      expect(template.Resources.OrderProcessorRole).toBeDefined();
      expect(template.Resources.OrderProcessorRole.Type).toBe('AWS::IAM::Role');
    });

    test('OrderProcessorRole should have correct assume role policy', () => {
      const role = template.Resources.OrderProcessorRole;
      const assumeRolePolicy = role.Properties.AssumeRolePolicyDocument;

      expect(assumeRolePolicy.Version).toBe('2012-10-17');
      expect(assumeRolePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumeRolePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('OrderProcessorRole should have correct managed policies', () => {
      const role = template.Resources.OrderProcessorRole;
      const managedPolicies = role.Properties.ManagedPolicyArns;

      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });

    test('OrderProcessorRole should have correct inline policies', () => {
      const role = template.Resources.OrderProcessorRole;
      const policies = role.Properties.Policies;

      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('OrderProcessorPolicy');

      const policyDocument = policies[0].PolicyDocument;
      expect(policyDocument.Version).toBe('2012-10-17');
      expect(policyDocument.Statement).toHaveLength(3);

      // Check SQS permissions
      const sqsStatement = policyDocument.Statement[0];
      expect(sqsStatement.Effect).toBe('Allow');
      expect(sqsStatement.Action).toContain('sqs:ReceiveMessage');
      expect(sqsStatement.Action).toContain('sqs:DeleteMessage');
      expect(sqsStatement.Action).toContain('sqs:GetQueueAttributes');

      // Check DynamoDB permissions
      const dynamoStatement = policyDocument.Statement[1];
      expect(dynamoStatement.Effect).toBe('Allow');
      expect(dynamoStatement.Action).toContain('dynamodb:PutItem');
      expect(dynamoStatement.Action).toContain('dynamodb:UpdateItem');
      expect(dynamoStatement.Action).toContain('dynamodb:GetItem');
      expect(dynamoStatement.Action).toContain('dynamodb:Query');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have LambdaErrorAlarm resource', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      expect(template.Resources.LambdaErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have DLQMessageAlarm resource', () => {
      expect(template.Resources.DLQMessageAlarm).toBeDefined();
      expect(template.Resources.DLQMessageAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have LambdaDurationAlarm resource', () => {
      expect(template.Resources.LambdaDurationAlarm).toBeDefined();
      expect(template.Resources.LambdaDurationAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have OrderProcessingDashboard resource', () => {
      expect(template.Resources.OrderProcessingDashboard).toBeDefined();
      expect(template.Resources.OrderProcessingDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('LambdaErrorAlarm should have correct configuration', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      const properties = alarm.Properties;

      expect(properties.MetricName).toBe('Errors');
      expect(properties.Namespace).toBe('AWS/Lambda');
      expect(properties.Statistic).toBe('Sum');
      expect(properties.Threshold).toBe(5);
      expect(properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('DLQMessageAlarm should have correct configuration', () => {
      const alarm = template.Resources.DLQMessageAlarm;
      const properties = alarm.Properties;

      expect(properties.MetricName).toBe('ApproximateNumberOfMessagesVisible');
      expect(properties.Namespace).toBe('AWS/SQS');
      expect(properties.Threshold).toBe(1);
      expect(properties.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'OrderQueueURL',
        'OrderQueueARN',
        'OrderDLQURL',
        'OrderTableName',
        'OrderProcessorFunctionName',
        'OrderProcessorFunctionARN',
        'DashboardURL',
        'TestCommand'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have correct export names', () => {
      const outputs = ['OrderQueueURL', 'OrderQueueARN', 'OrderDLQURL', 'OrderTableName',
        'OrderProcessorFunctionName', 'OrderProcessorFunctionARN'];

      outputs.forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputName}`
        });
      });
    });

    test('TestCommand output should contain correct CLI command', () => {
      const testCommand = template.Outputs.TestCommand;
      expect(testCommand.Description).toContain('AWS CLI command');
      expect(testCommand.Value['Fn::Sub']).toContain('aws sqs send-message');
      expect(testCommand.Value['Fn::Sub']).toContain('${OrderQueue}');
    });
  });

  describe('Resource Relationships', () => {
    test('Lambda function should reference correct IAM role', () => {
      const lambda = template.Resources.OrderProcessorFunction;
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['OrderProcessorRole', 'Arn']
      });
    });

    test('Event source mapping should reference correct resources', () => {
      const esm = template.Resources.OrderProcessorEventSourceMapping;
      expect(esm.Properties.EventSourceArn).toEqual({
        'Fn::GetAtt': ['OrderQueue', 'Arn']
      });
      expect(esm.Properties.FunctionName).toEqual({
        Ref: 'OrderProcessorFunction'
      });
    });

    test('CloudWatch alarms should reference correct resources', () => {
      const lambdaAlarm = template.Resources.LambdaErrorAlarm;
      expect(lambdaAlarm.Properties.Dimensions[0].Value).toEqual({
        Ref: 'OrderProcessorFunction'
      });

      const dlqAlarm = template.Resources.DLQMessageAlarm;
      expect(dlqAlarm.Properties.Dimensions[0].Value).toEqual({
        'Fn::GetAtt': ['OrderDLQ', 'QueueName']
      });
    });
  });

  describe('Resource Tagging', () => {
    test('resources should have environment and purpose tags', () => {
      const resourcesWithTags = ['OrderQueue', 'OrderDLQ', 'OrderTable', 'OrderProcessorRole', 'OrderProcessorFunction'];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();

        const envTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
        expect(envTag).toBeDefined();
        expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
      });
    });
  });

  describe('Template Completeness', () => {
    test('should have reasonable number of resources for the use case', () => {
      const resourceCount = Object.keys(template.Resources).length;
      // SQS (2) + DynamoDB (1) + Lambda (3) + IAM (1) + CloudWatch (4) + Dashboard (1) = 12
      expect(resourceCount).toBe(11);
    });

    test('should have all core components for order processing', () => {
      const coreResources = [
        'OrderQueue',        // Main SQS queue
        'OrderDLQ',          // Dead letter queue
        'OrderTable',        // DynamoDB table
        'OrderProcessorFunction', // Lambda function
        'OrderProcessorRole',    // IAM role
        'OrderProcessorEventSourceMapping' // Event source mapping
      ];

      coreResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });
  });
});
