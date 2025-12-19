import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('E-commerce Order Processing Monitoring System CloudFormation Template', () => {
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
      expect(template.Description).toBe('E-commerce Order Processing Monitoring System with comprehensive audit logging');
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
    });
  });

  describe('DynamoDB Table - OrderEventsTable', () => {
    test('should have OrderEventsTable resource', () => {
      expect(template.Resources.OrderEventsTable).toBeDefined();
    });

    test('OrderEventsTable should be a DynamoDB table', () => {
      const table = template.Resources.OrderEventsTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });


    test('OrderEventsTable should have correct table name with environment suffix', () => {
      const table = template.Resources.OrderEventsTable;
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'order-events-${EnvironmentSuffix}',
      });
    });

    test('OrderEventsTable should have correct attribute definitions', () => {
      const table = template.Resources.OrderEventsTable;
      const attributeDefinitions = table.Properties.AttributeDefinitions;

      expect(attributeDefinitions).toHaveLength(4);
      expect(attributeDefinitions).toContainEqual({
        AttributeName: 'orderId',
        AttributeType: 'S',
      });
      expect(attributeDefinitions).toContainEqual({
        AttributeName: 'timestamp',
        AttributeType: 'N',
      });
      expect(attributeDefinitions).toContainEqual({
        AttributeName: 'customerId',
        AttributeType: 'S',
      });
      expect(attributeDefinitions).toContainEqual({
        AttributeName: 'orderStatus',
        AttributeType: 'S',
      });
    });

    test('OrderEventsTable should have correct key schema', () => {
      const table = template.Resources.OrderEventsTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(2);
      expect(keySchema[0]).toEqual({
        AttributeName: 'orderId',
        KeyType: 'HASH',
      });
      expect(keySchema[1]).toEqual({
        AttributeName: 'timestamp',
        KeyType: 'RANGE',
      });
    });

    test('OrderEventsTable should have Global Secondary Indexes', () => {
      const table = template.Resources.OrderEventsTable;
      const gsi = table.Properties.GlobalSecondaryIndexes;

      expect(gsi).toHaveLength(2);
      expect(gsi[0].IndexName).toBe('CustomerIndex');
      expect(gsi[0].KeySchema).toEqual([
        { AttributeName: 'customerId', KeyType: 'HASH' },
        { AttributeName: 'timestamp', KeyType: 'RANGE' },
      ]);
      expect(gsi[0].Projection.ProjectionType).toBe('ALL');

      expect(gsi[1].IndexName).toBe('StatusIndex');
      expect(gsi[1].KeySchema).toEqual([
        { AttributeName: 'orderStatus', KeyType: 'HASH' },
        { AttributeName: 'timestamp', KeyType: 'RANGE' },
      ]);
      expect(gsi[1].Projection.ProjectionType).toBe('ALL');
    });

    test('OrderEventsTable should have PAY_PER_REQUEST billing mode', () => {
      const table = template.Resources.OrderEventsTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('OrderEventsTable should have DynamoDB Streams enabled', () => {
      const table = template.Resources.OrderEventsTable;
      expect(table.Properties.StreamSpecification).toBeDefined();
      expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('OrderEventsTable should have point-in-time recovery enabled', () => {
      const table = template.Resources.OrderEventsTable;
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('OrderEventsTable should have proper tags', () => {
      const table = template.Resources.OrderEventsTable;
      const tags = table.Properties.Tags;

      expect(tags).toContainEqual({
        Key: 'Name',
        Value: { 'Fn::Sub': 'order-events-table-${EnvironmentSuffix}' },
      });
    });
  });

  describe('S3 Bucket - AuditLogsBucket', () => {
    test('should have AuditLogsBucket resource', () => {
      expect(template.Resources.AuditLogsBucket).toBeDefined();
    });

    test('AuditLogsBucket should be an S3 bucket', () => {
      const bucket = template.Resources.AuditLogsBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('AuditLogsBucket should have correct bucket name with environment suffix', () => {
      const bucket = template.Resources.AuditLogsBucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'audit-logs-${EnvironmentSuffix}-${AWS::AccountId}-${AWS::Region}',
      });
    });

    test('AuditLogsBucket should have versioning enabled', () => {
      const bucket = template.Resources.AuditLogsBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('AuditLogsBucket should have encryption enabled', () => {
      const bucket = template.Resources.AuditLogsBucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('AuditLogsBucket should block all public access', () => {
      const bucket = template.Resources.AuditLogsBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('AuditLogsBucket should have lifecycle policy for old versions', () => {
      const bucket = template.Resources.AuditLogsBucket;
      const lifecycleRules = bucket.Properties.LifecycleConfiguration.Rules;

      expect(lifecycleRules).toHaveLength(1);
      expect(lifecycleRules[0].Id).toBe('DeleteOldVersions');
      expect(lifecycleRules[0].Status).toBe('Enabled');
      expect(lifecycleRules[0].NoncurrentVersionExpirationInDays).toBe(30);
    });

    test('AuditLogsBucket should have proper tags', () => {
      const bucket = template.Resources.AuditLogsBucket;
      const tags = bucket.Properties.Tags;

      expect(tags).toContainEqual({
        Key: 'Name',
        Value: { 'Fn::Sub': 'audit-logs-bucket-${EnvironmentSuffix}' },
      });
    });
  });

  describe('SNS Topic - OrderAlertsTopic', () => {
    test('should have OrderAlertsTopic resource', () => {
      expect(template.Resources.OrderAlertsTopic).toBeDefined();
    });

    test('OrderAlertsTopic should be an SNS topic', () => {
      const topic = template.Resources.OrderAlertsTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('OrderAlertsTopic should have correct topic name with environment suffix', () => {
      const topic = template.Resources.OrderAlertsTopic;
      expect(topic.Properties.TopicName).toEqual({
        'Fn::Sub': 'order-alerts-${EnvironmentSuffix}',
      });
    });

    test('OrderAlertsTopic should have proper tags', () => {
      const topic = template.Resources.OrderAlertsTopic;
      const tags = topic.Properties.Tags;

      expect(tags).toContainEqual({
        Key: 'Name',
        Value: { 'Fn::Sub': 'order-alerts-topic-${EnvironmentSuffix}' },
      });
    });
  });

  describe('IAM Role - OrderProcessorLambdaRole', () => {
    test('should have OrderProcessorLambdaRole resource', () => {
      expect(template.Resources.OrderProcessorLambdaRole).toBeDefined();
    });

    test('OrderProcessorLambdaRole should be an IAM role', () => {
      const role = template.Resources.OrderProcessorLambdaRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('OrderProcessorLambdaRole should have correct role name with environment suffix', () => {
      const role = template.Resources.OrderProcessorLambdaRole;
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': 'order-processor-lambda-role-${EnvironmentSuffix}',
      });
    });

    test('OrderProcessorLambdaRole should have Lambda assume role policy', () => {
      const role = template.Resources.OrderProcessorLambdaRole;
      const assumeRolePolicy = role.Properties.AssumeRolePolicyDocument;

      expect(assumeRolePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumeRolePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('OrderProcessorLambdaRole should have AWSLambdaBasicExecutionRole managed policy', () => {
      const role = template.Resources.OrderProcessorLambdaRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('OrderProcessorLambdaRole should have DynamoDB table permissions', () => {
      const role = template.Resources.OrderProcessorLambdaRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const dynamoDbTableStatement = policy.Statement[0];

      expect(dynamoDbTableStatement.Effect).toBe('Allow');
      expect(dynamoDbTableStatement.Action).toContain('dynamodb:GetItem');
      expect(dynamoDbTableStatement.Action).toContain('dynamodb:PutItem');
      expect(dynamoDbTableStatement.Action).toContain('dynamodb:UpdateItem');
      expect(dynamoDbTableStatement.Action).toContain('dynamodb:DeleteItem');
      expect(dynamoDbTableStatement.Action).toContain('dynamodb:Query');
      expect(dynamoDbTableStatement.Action).toContain('dynamodb:Scan');
    });

    test('OrderProcessorLambdaRole should have DynamoDB streams permissions', () => {
      const role = template.Resources.OrderProcessorLambdaRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const dynamoDbStreamStatement = policy.Statement[1];

      expect(dynamoDbStreamStatement.Effect).toBe('Allow');
      expect(dynamoDbStreamStatement.Action).toContain('dynamodb:GetRecords');
      expect(dynamoDbStreamStatement.Action).toContain('dynamodb:GetShardIterator');
      expect(dynamoDbStreamStatement.Action).toContain('dynamodb:DescribeStream');
      expect(dynamoDbStreamStatement.Action).toContain('dynamodb:ListStreams');
      expect(dynamoDbStreamStatement.Resource).toEqual([{
        'Fn::GetAtt': ['OrderEventsTable', 'StreamArn'],
      }]);
    });

    test('OrderProcessorLambdaRole should have S3 write permissions', () => {
      const role = template.Resources.OrderProcessorLambdaRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const s3Statement = policy.Statement[2];

      expect(s3Statement.Effect).toBe('Allow');
      expect(s3Statement.Action).toContain('s3:GetObject');
      expect(s3Statement.Action).toContain('s3:PutObject');
      expect(s3Statement.Action).toContain('s3:DeleteObject');
      expect(s3Statement.Resource).toEqual([{
        'Fn::Sub': '${AuditLogsBucket.Arn}/*',
      }]);
    });

    test('OrderProcessorLambdaRole should have SNS publish permissions', () => {
      const role = template.Resources.OrderProcessorLambdaRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const snsStatement = policy.Statement[3];

      expect(snsStatement.Effect).toBe('Allow');
      expect(snsStatement.Action).toContain('sns:Publish');
      expect(snsStatement.Resource).toEqual([{ Ref: 'OrderAlertsTopic' }]);
    });
  });

  describe('Lambda Function - OrderProcessorLambda', () => {
    test('should have OrderProcessorLambda resource', () => {
      expect(template.Resources.OrderProcessorLambda).toBeDefined();
    });

    test('OrderProcessorLambda should be a Lambda function', () => {
      const lambda = template.Resources.OrderProcessorLambda;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('OrderProcessorLambda should have correct function name with environment suffix', () => {
      const lambda = template.Resources.OrderProcessorLambda;
      expect(lambda.Properties.FunctionName).toEqual({
        'Fn::Sub': 'order-processor-${EnvironmentSuffix}',
      });
    });

    test('OrderProcessorLambda should use nodejs20.x runtime', () => {
      const lambda = template.Resources.OrderProcessorLambda;
      expect(lambda.Properties.Runtime).toBe('nodejs20.x');
    });

    test('OrderProcessorLambda should have correct handler', () => {
      const lambda = template.Resources.OrderProcessorLambda;
      expect(lambda.Properties.Handler).toBe('index.handler');
    });

    test('OrderProcessorLambda should reference the correct IAM role', () => {
      const lambda = template.Resources.OrderProcessorLambda;
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['OrderProcessorLambdaRole', 'Arn'],
      });
    });

    test('OrderProcessorLambda should have correct environment variables', () => {
      const lambda = template.Resources.OrderProcessorLambda;
      const envVars = lambda.Properties.Environment.Variables;

      expect(envVars.AUDIT_BUCKET_NAME).toEqual({ Ref: 'AuditLogsBucket' });
      expect(envVars.SNS_TOPIC_ARN).toEqual({ Ref: 'OrderAlertsTopic' });
    });

    test('OrderProcessorLambda should have correct timeout', () => {
      const lambda = template.Resources.OrderProcessorLambda;
      expect(lambda.Properties.Timeout).toBe(300);
    });

    test('OrderProcessorLambda should have correct memory size', () => {
      const lambda = template.Resources.OrderProcessorLambda;
      expect(lambda.Properties.MemorySize).toBe(512);
    });
  });

  describe('Lambda Event Source Mapping', () => {
    test('should have DynamoDBStreamEventSourceMapping resource', () => {
      expect(template.Resources.DynamoDBStreamEventSourceMapping).toBeDefined();
    });

    test('DynamoDBStreamEventSourceMapping should be an event source mapping', () => {
      const mapping = template.Resources.DynamoDBStreamEventSourceMapping;
      expect(mapping.Type).toBe('AWS::Lambda::EventSourceMapping');
    });

    test('DynamoDBStreamEventSourceMapping should reference DynamoDB stream', () => {
      const mapping = template.Resources.DynamoDBStreamEventSourceMapping;
      expect(mapping.Properties.EventSourceArn).toEqual({
        'Fn::GetAtt': ['OrderEventsTable', 'StreamArn'],
      });
    });

    test('DynamoDBStreamEventSourceMapping should reference Lambda function', () => {
      const mapping = template.Resources.DynamoDBStreamEventSourceMapping;
      expect(mapping.Properties.FunctionName).toEqual({ Ref: 'OrderProcessorLambda' });
    });

    test('DynamoDBStreamEventSourceMapping should have correct configuration', () => {
      const mapping = template.Resources.DynamoDBStreamEventSourceMapping;
      expect(mapping.Properties.StartingPosition).toBe('LATEST');
      expect(mapping.Properties.BatchSize).toBe(10);
      expect(mapping.Properties.MaximumBatchingWindowInSeconds).toBe(5);
    });
  });

  describe('CloudWatch Alarm - LambdaErrorAlarm', () => {
    test('should have LambdaErrorAlarm resource', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
    });

    test('LambdaErrorAlarm should be a CloudWatch alarm', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('LambdaErrorAlarm should have correct alarm name with environment suffix', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Properties.AlarmName).toEqual({
        'Fn::Sub': 'lambda-error-alarm-${EnvironmentSuffix}',
      });
    });

    test('LambdaErrorAlarm should monitor Lambda errors', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Statistic).toBe('Sum');
    });

    test('LambdaErrorAlarm should have correct threshold configuration', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Properties.Threshold).toBe(1);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(1);
    });

    test('LambdaErrorAlarm should monitor the correct Lambda function', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      const dimensions = alarm.Properties.Dimensions;

      expect(dimensions).toHaveLength(1);
      expect(dimensions[0].Name).toBe('FunctionName');
      expect(dimensions[0].Value).toEqual({ Ref: 'OrderProcessorLambda' });
    });

    test('LambdaErrorAlarm should send notifications to SNS', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Properties.AlarmActions).toContainEqual({ Ref: 'OrderAlertsTopic' });
    });
  });

  describe('CloudWatch Logs - OrderProcessorLambdaLogGroup', () => {
    test('should have OrderProcessorLambdaLogGroup resource', () => {
      expect(template.Resources.OrderProcessorLambdaLogGroup).toBeDefined();
    });

    test('OrderProcessorLambdaLogGroup should be a CloudWatch log group', () => {
      const logGroup = template.Resources.OrderProcessorLambdaLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('OrderProcessorLambdaLogGroup should have correct log group name', () => {
      const logGroup = template.Resources.OrderProcessorLambdaLogGroup;
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/order-processor-${EnvironmentSuffix}',
      });
    });

    test('OrderProcessorLambdaLogGroup should have 14 days retention', () => {
      const logGroup = template.Resources.OrderProcessorLambdaLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(14);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'OrderEventsTableName',
        'OrderEventsTableArn',
        'OrderEventsTableStreamArn',
        'AuditLogsBucketName',
        'AuditLogsBucketArn',
        'OrderProcessorLambdaName',
        'OrderProcessorLambdaArn',
        'OrderAlertsTopicArn',
        'LambdaErrorAlarmName',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have correct values and exports', () => {
      const outputs = template.Outputs;

      expect(outputs.OrderEventsTableName.Value).toEqual({ Ref: 'OrderEventsTable' });
      expect(outputs.OrderEventsTableArn.Value).toEqual({
        'Fn::GetAtt': ['OrderEventsTable', 'Arn'],
      });
      expect(outputs.AuditLogsBucketName.Value).toEqual({ Ref: 'AuditLogsBucket' });
      expect(outputs.OrderProcessorLambdaName.Value).toEqual({ Ref: 'OrderProcessorLambda' });
      expect(outputs.OrderAlertsTopicArn.Value).toEqual({ Ref: 'OrderAlertsTopic' });
      expect(outputs.LambdaErrorAlarmName.Value).toEqual({ Ref: 'LambdaErrorAlarm' });
    });
  });

  describe('Resource Count', () => {
    test('should have exactly 8 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(8);
    });

    test('should have exactly 11 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(11);
    });

    test('should have exactly 1 parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });
  });

  describe('Security Best Practices', () => {
    test('all resources should use environment suffix in naming', () => {
      const resources = template.Resources;
      const resourcesWithNames = [
        'OrderEventsTable',
        'AuditLogsBucket',
        'OrderAlertsTopic',
        'OrderProcessorLambdaRole',
        'OrderProcessorLambda',
        'LambdaErrorAlarm',
        'OrderProcessorLambdaLogGroup',
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = resources[resourceName];
        const nameProperty =
          resource.Properties?.TableName ||
          resource.Properties?.BucketName ||
          resource.Properties?.TopicName ||
          resource.Properties?.RoleName ||
          resource.Properties?.FunctionName ||
          resource.Properties?.AlarmName ||
          resource.Properties?.LogGroupName;

        if (nameProperty) {
          expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('no resources should have Retain deletion policy', () => {
      const resources = template.Resources;
      Object.keys(resources).forEach(resourceKey => {
        const resource = resources[resourceKey];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('all resources with tags should have Name tag', () => {
      const resources = template.Resources;
      const resourcesWithTags = [
        'OrderEventsTable',
        'AuditLogsBucket',
        'OrderAlertsTopic',
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = resources[resourceName];
        const tags = resource.Properties.Tags;

        expect(tags).toBeDefined();
        expect(tags.some((tag: any) => tag.Key === 'Name')).toBe(true);
      });
    });
  });
});
