import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Serverless Infrastructure', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Lambda Function Configuration', () => {
    test('RequestProcessorLambda should use Python 3.13 runtime', () => {
      const lambda = template.Resources.RequestProcessorLambda;
      expect(lambda.Properties.Runtime).toBe('python3.13');
    });

    test('RequestProcessorLambda should have 30 second timeout', () => {
      const lambda = template.Resources.RequestProcessorLambda;
      expect(lambda.Properties.Timeout).toBe(30);
    });

    test('RequestProcessorLambda should have 256 MB memory', () => {
      const lambda = template.Resources.RequestProcessorLambda;
      expect(lambda.Properties.MemorySize).toBe(256);
    });

    test('RequestProcessorLambda should have Dead Letter Queue configured', () => {
      const lambda = template.Resources.RequestProcessorLambda;
      expect(lambda.Properties.DeadLetterConfig).toBeDefined();
      expect(lambda.Properties.DeadLetterConfig.TargetArn).toEqual({
        'Fn::GetAtt': ['DeadLetterQueue', 'Arn']
      });
    });

    test('RequestProcessorLambda should have DynamoDB table name in environment variables', () => {
      const lambda = template.Resources.RequestProcessorLambda;
      expect(lambda.Properties.Environment.Variables.DYNAMODB_TABLE_NAME).toEqual({
        Ref: 'RequestDataTable'
      });
    });

    test('RequestProcessorLambda should be tagged with Environment Production', () => {
      const lambda = template.Resources.RequestProcessorLambda;
      const tags = lambda.Properties.Tags;
      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe('Production');
    });

    test('RequestProcessorLambda should have dynamic function name with stack name', () => {
      const lambda = template.Resources.RequestProcessorLambda;
      expect(lambda.Properties.FunctionName).toEqual({
        'Fn::Sub': '${AWS::StackName}-request-processor'
      });
    });
  });

  describe('DynamoDB Table Configuration', () => {
    test('RequestDataTable should have provisioned throughput with 5 RCU', () => {
      const table = template.Resources.RequestDataTable;
      expect(table.Properties.ProvisionedThroughput.ReadCapacityUnits).toBe(5);
    });

    test('RequestDataTable should have provisioned throughput with 5 WCU', () => {
      const table = template.Resources.RequestDataTable;
      expect(table.Properties.ProvisionedThroughput.WriteCapacityUnits).toBe(5);
    });

    test('RequestDataTable should have server-side encryption enabled with KMS', () => {
      const table = template.Resources.RequestDataTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.SSESpecification.SSEType).toBe('KMS');
      expect(table.Properties.SSESpecification.KMSMasterKeyId).toBe('alias/aws/dynamodb');
    });

    test('RequestDataTable should have composite key with RequestId as hash key', () => {
      const table = template.Resources.RequestDataTable;
      const keySchema = table.Properties.KeySchema;
      const hashKey = keySchema.find((key: any) => key.KeyType === 'HASH');
      expect(hashKey).toBeDefined();
      expect(hashKey.AttributeName).toBe('RequestId');
    });

    test('RequestDataTable should have Timestamp as range key', () => {
      const table = template.Resources.RequestDataTable;
      const keySchema = table.Properties.KeySchema;
      const rangeKey = keySchema.find((key: any) => key.KeyType === 'RANGE');
      expect(rangeKey).toBeDefined();
      expect(rangeKey.AttributeName).toBe('Timestamp');
    });

    test('RequestDataTable should have RequestId attribute as String type', () => {
      const table = template.Resources.RequestDataTable;
      const attributes = table.Properties.AttributeDefinitions;
      const requestIdAttr = attributes.find((attr: any) => attr.AttributeName === 'RequestId');
      expect(requestIdAttr).toBeDefined();
      expect(requestIdAttr.AttributeType).toBe('S');
    });

    test('RequestDataTable should have Timestamp attribute as String type', () => {
      const table = template.Resources.RequestDataTable;
      const attributes = table.Properties.AttributeDefinitions;
      const timestampAttr = attributes.find((attr: any) => attr.AttributeName === 'Timestamp');
      expect(timestampAttr).toBeDefined();
      expect(timestampAttr.AttributeType).toBe('S');
    });

    test('RequestDataTable should be tagged with Environment Production', () => {
      const table = template.Resources.RequestDataTable;
      const tags = table.Properties.Tags;
      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe('Production');
    });

    test('RequestDataTable should have dynamic table name with stack name', () => {
      const table = template.Resources.RequestDataTable;
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': '${AWS::StackName}-requests'
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('ApiLoggingBucket should have versioning enabled', () => {
      const bucket = template.Resources.ApiLoggingBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('ApiLoggingBucket should have AES256 encryption', () => {
      const bucket = template.Resources.ApiLoggingBucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('ApiLoggingBucket should have public access blocked', () => {
      const bucket = template.Resources.ApiLoggingBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('ApiLoggingBucket should have lifecycle rule to delete old logs after 90 days', () => {
      const bucket = template.Resources.ApiLoggingBucket;
      const lifecycleRules = bucket.Properties.LifecycleConfiguration.Rules;
      const deleteRule = lifecycleRules.find((rule: any) => rule.Id === 'DeleteOldLogs');
      expect(deleteRule).toBeDefined();
      expect(deleteRule.Status).toBe('Enabled');
      expect(deleteRule.ExpirationInDays).toBe(90);
    });

    test('ApiLoggingBucket should be tagged with Environment Production', () => {
      const bucket = template.Resources.ApiLoggingBucket;
      const tags = bucket.Properties.Tags;
      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe('Production');
    });

    test('ApiLoggingBucket should be created without explicit bucket name', () => {
      const bucket = template.Resources.ApiLoggingBucket;
      expect(bucket.Properties.BucketName).toBeUndefined();
    });
  });

  describe('S3 Bucket Policy Configuration', () => {
    test('ApiLoggingBucketPolicy should allow S3 logging service to write logs', () => {
      const bucketPolicy = template.Resources.ApiLoggingBucketPolicy;
      const statements = bucketPolicy.Properties.PolicyDocument.Statement;
      const writeStatement = statements.find((stmt: any) => stmt.Sid === 'AWSLogDeliveryWrite');
      expect(writeStatement).toBeDefined();
      expect(writeStatement.Effect).toBe('Allow');
      expect(writeStatement.Principal.Service).toBe('logging.s3.amazonaws.com');
      expect(writeStatement.Action).toBe('s3:PutObject');
    });

    test('ApiLoggingBucketPolicy should allow S3 logging service to check ACL', () => {
      const bucketPolicy = template.Resources.ApiLoggingBucketPolicy;
      const statements = bucketPolicy.Properties.PolicyDocument.Statement;
      const aclStatement = statements.find((stmt: any) => stmt.Sid === 'AWSLogDeliveryAclCheck');
      expect(aclStatement).toBeDefined();
      expect(aclStatement.Effect).toBe('Allow');
      expect(aclStatement.Principal.Service).toBe('logging.s3.amazonaws.com');
      expect(aclStatement.Action).toBe('s3:GetBucketAcl');
    });
  });

  describe('API Gateway Configuration', () => {
    test('HttpApi should be HTTP protocol type', () => {
      const api = template.Resources.HttpApi;
      expect(api.Properties.ProtocolType).toBe('HTTP');
    });

    test('HttpApi should have CORS enabled for all origins', () => {
      const api = template.Resources.HttpApi;
      const cors = api.Properties.CorsConfiguration;
      expect(cors.AllowOrigins).toEqual(['*']);
    });

    test('HttpApi should allow GET, POST, PUT, DELETE, OPTIONS methods', () => {
      const api = template.Resources.HttpApi;
      const cors = api.Properties.CorsConfiguration;
      expect(cors.AllowMethods).toContain('GET');
      expect(cors.AllowMethods).toContain('POST');
      expect(cors.AllowMethods).toContain('PUT');
      expect(cors.AllowMethods).toContain('DELETE');
      expect(cors.AllowMethods).toContain('OPTIONS');
    });

    test('HttpApi should have CORS max age of 86400 seconds', () => {
      const api = template.Resources.HttpApi;
      expect(api.Properties.CorsConfiguration.MaxAge).toBe(86400);
    });

    test('HttpApi should be tagged with Environment Production', () => {
      const api = template.Resources.HttpApi;
      expect(api.Properties.Tags.Environment).toBe('Production');
    });

    test('HttpApi should have dynamic name with stack name', () => {
      const api = template.Resources.HttpApi;
      expect(api.Properties.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-http-api'
      });
    });
  });

  describe('API Gateway Integration Configuration', () => {
    test('HttpApiIntegration should use AWS_PROXY integration type', () => {
      const integration = template.Resources.HttpApiIntegration;
      expect(integration.Properties.IntegrationType).toBe('AWS_PROXY');
    });

    test('HttpApiIntegration should use payload format version 2.0', () => {
      const integration = template.Resources.HttpApiIntegration;
      expect(integration.Properties.PayloadFormatVersion).toBe('2.0');
    });

    test('HttpApiIntegration should have correct Lambda integration URI format', () => {
      const integration = template.Resources.HttpApiIntegration;
      expect(integration.Properties.IntegrationUri).toEqual({
        'Fn::Sub': 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${RequestProcessorLambda.Arn}/invocations'
      });
    });
  });

  describe('API Gateway Stage Configuration', () => {
    test('HttpApiStage should use $default stage name', () => {
      const stage = template.Resources.HttpApiStage;
      expect(stage.Properties.StageName).toBe('$default');
    });

    test('HttpApiStage should have auto deploy enabled', () => {
      const stage = template.Resources.HttpApiStage;
      expect(stage.Properties.AutoDeploy).toBe(true);
    });

    test('HttpApiStage should be tagged with Environment Production', () => {
      const stage = template.Resources.HttpApiStage;
      expect(stage.Properties.Tags.Environment).toBe('Production');
    });
  });

  describe('CloudWatch Alarm Configuration', () => {
    test('ApiGateway5XXAlarm should monitor 5XXError metric', () => {
      const alarm = template.Resources.ApiGateway5XXAlarm;
      expect(alarm.Properties.MetricName).toBe('5XXError');
    });

    test('ApiGateway5XXAlarm should use AWS/ApiGateway namespace', () => {
      const alarm = template.Resources.ApiGateway5XXAlarm;
      expect(alarm.Properties.Namespace).toBe('AWS/ApiGateway');
    });

    test('ApiGateway5XXAlarm should use ApiId dimension', () => {
      const alarm = template.Resources.ApiGateway5XXAlarm;
      const dimensions = alarm.Properties.Dimensions;
      expect(dimensions).toHaveLength(1);
      expect(dimensions[0].Name).toBe('ApiId');
      expect(dimensions[0].Value).toEqual({ Ref: 'HttpApi' });
    });

    test('ApiGateway5XXAlarm should use Sum statistic', () => {
      const alarm = template.Resources.ApiGateway5XXAlarm;
      expect(alarm.Properties.Statistic).toBe('Sum');
    });

    test('ApiGateway5XXAlarm should have 300 second period', () => {
      const alarm = template.Resources.ApiGateway5XXAlarm;
      expect(alarm.Properties.Period).toBe(300);
    });

    test('ApiGateway5XXAlarm should evaluate for 2 periods', () => {
      const alarm = template.Resources.ApiGateway5XXAlarm;
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
    });

    test('ApiGateway5XXAlarm should have threshold of 10', () => {
      const alarm = template.Resources.ApiGateway5XXAlarm;
      expect(alarm.Properties.Threshold).toBe(10);
    });

    test('ApiGateway5XXAlarm should use GreaterThanThreshold comparison', () => {
      const alarm = template.Resources.ApiGateway5XXAlarm;
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('ApiGateway5XXAlarm should treat missing data as not breaching', () => {
      const alarm = template.Resources.ApiGateway5XXAlarm;
      expect(alarm.Properties.TreatMissingData).toBe('notBreaching');
    });

    test('ApiGateway5XXAlarm should have dynamic alarm name with stack name', () => {
      const alarm = template.Resources.ApiGateway5XXAlarm;
      expect(alarm.Properties.AlarmName).toEqual({
        'Fn::Sub': '${AWS::StackName}-api-5xx-errors'
      });
    });
  });

  describe('IAM Role Configuration', () => {
    test('RequestProcessorLambdaRole should allow Lambda service to assume role', () => {
      const role = template.Resources.RequestProcessorLambdaRole;
      const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal.Service).toBe('lambda.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('RequestProcessorLambdaRole should have AWSLambdaBasicExecutionRole managed policy', () => {
      const role = template.Resources.RequestProcessorLambdaRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('RequestProcessorLambdaRole should have DynamoDB access policy', () => {
      const role = template.Resources.RequestProcessorLambdaRole;
      const policies = role.Properties.Policies;
      const dynamoPolicy = policies.find((policy: any) => policy.PolicyName === 'DynamoDBAccessPolicy');
      expect(dynamoPolicy).toBeDefined();
      const statement = dynamoPolicy.PolicyDocument.Statement[0];
      expect(statement.Action).toContain('dynamodb:PutItem');
      expect(statement.Action).toContain('dynamodb:GetItem');
      expect(statement.Action).toContain('dynamodb:Query');
      expect(statement.Action).toContain('dynamodb:Scan');
    });

    test('RequestProcessorLambdaRole should have SQS SendMessage permission for DLQ', () => {
      const role = template.Resources.RequestProcessorLambdaRole;
      const policies = role.Properties.Policies;
      const dynamoPolicy = policies.find((policy: any) => policy.PolicyName === 'DynamoDBAccessPolicy');
      const statements = dynamoPolicy.PolicyDocument.Statement;
      const sqsStatement = statements.find((stmt: any) =>
        stmt.Action && stmt.Action.includes('sqs:SendMessage')
      );
      expect(sqsStatement).toBeDefined();
      expect(sqsStatement.Resource).toEqual({
        'Fn::GetAtt': ['DeadLetterQueue', 'Arn']
      });
    });

    test('RequestProcessorLambdaRole should be tagged with Environment Production', () => {
      const role = template.Resources.RequestProcessorLambdaRole;
      const tags = role.Properties.Tags;
      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe('Production');
    });
  });

  describe('Dead Letter Queue Configuration', () => {
    test('DeadLetterQueue should have message retention period of 1209600 seconds (14 days)', () => {
      const dlq = template.Resources.DeadLetterQueue;
      expect(dlq.Properties.MessageRetentionPeriod).toBe(1209600);
    });

    test('DeadLetterQueue should be tagged with Environment Production', () => {
      const dlq = template.Resources.DeadLetterQueue;
      const tags = dlq.Properties.Tags;
      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe('Production');
    });

    test('DeadLetterQueue should have dynamic queue name with stack name', () => {
      const dlq = template.Resources.DeadLetterQueue;
      expect(dlq.Properties.QueueName).toEqual({
        'Fn::Sub': '${AWS::StackName}-dlq'
      });
    });
  });

  describe('CloudWatch Events Rule Configuration', () => {
    test('ScheduledEventRule should run every 24 hours', () => {
      const rule = template.Resources.ScheduledEventRule;
      expect(rule.Properties.ScheduleExpression).toBe('rate(24 hours)');
    });

    test('ScheduledEventRule should be enabled', () => {
      const rule = template.Resources.ScheduledEventRule;
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('ScheduledEventRule should target RequestProcessorLambda', () => {
      const rule = template.Resources.ScheduledEventRule;
      const targets = rule.Properties.Targets;
      expect(targets).toHaveLength(1);
      expect(targets[0].Arn).toEqual({
        'Fn::GetAtt': ['RequestProcessorLambda', 'Arn']
      });
    });

    test('ScheduledEventRule should have dynamic rule name with stack name', () => {
      const rule = template.Resources.ScheduledEventRule;
      expect(rule.Properties.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-daily-schedule'
      });
    });
  });

  describe('Lambda Log Group Configuration', () => {
    test('LambdaLogGroup should have 7 day retention period', () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(7);
    });

    test('LambdaLogGroup should have log group name matching Lambda function', () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/${AWS::StackName}-request-processor'
      });
    });

    test('RequestProcessorLambda should depend on LambdaLogGroup', () => {
      const lambda = template.Resources.RequestProcessorLambda;
      expect(lambda.DependsOn).toBe('LambdaLogGroup');
    });
  });

  describe('Lambda Permissions Configuration', () => {
    test('LambdaApiGatewayPermission should allow API Gateway to invoke Lambda', () => {
      const permission = template.Resources.LambdaApiGatewayPermission;
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
    });

    test('LambdaSchedulePermission should allow CloudWatch Events to invoke Lambda', () => {
      const permission = template.Resources.LambdaSchedulePermission;
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
    });
  });
});
