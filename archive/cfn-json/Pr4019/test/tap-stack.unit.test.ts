import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Lambda Function Configuration', () => {
    test('should configure Lambda with Python 3.13 runtime', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.Runtime).toBe('python3.13');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
    });

    test('should configure Lambda with correct timeout and memory', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.Timeout).toBe(30);
      expect(lambda.Properties.MemorySize).toBe(256);
    });

    test('should configure Lambda with reserved concurrent executions', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.ReservedConcurrentExecutions).toBe(10);
    });

    test('should configure Lambda with VPC settings in multiple subnets', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.VpcConfig.SubnetIds).toHaveLength(2);
      expect(lambda.Properties.VpcConfig.SubnetIds[0]).toEqual({ Ref: 'PrivateSubnet1' });
      expect(lambda.Properties.VpcConfig.SubnetIds[1]).toEqual({ Ref: 'PrivateSubnet2' });
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toHaveLength(1);
    });

    test('should configure Lambda with environment variables', () => {
      const lambda = template.Resources.LambdaFunction;
      const envVars = lambda.Properties.Environment.Variables;
      expect(envVars.DYNAMODB_TABLE_NAME).toEqual({ Ref: 'DynamoDBTable' });
      expect(envVars.S3_BUCKET_NAME).toEqual({ Ref: 'S3Bucket' });
      expect(envVars.SNS_TOPIC_ARN).toEqual({ Ref: 'SNSTopic' });
    });

    test('should configure Lambda with Dead Letter Queue', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.DeadLetterConfig.TargetArn).toEqual({
        'Fn::GetAtt': ['DeadLetterQueue', 'Arn']
      });
    });

    test('should configure Lambda with LoggingConfig', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.LoggingConfig.LogGroup).toEqual({
        Ref: 'LambdaLogGroup'
      });
    });
  });

  describe('API Gateway HTTP API Configuration', () => {
    test('should create HTTP API with correct protocol type', () => {
      const httpApi = template.Resources.HttpApi;
      expect(httpApi.Type).toBe('AWS::ApiGatewayV2::Api');
      expect(httpApi.Properties.ProtocolType).toBe('HTTP');
    });

    test('should configure CORS with all origins allowed', () => {
      const httpApi = template.Resources.HttpApi;
      const cors = httpApi.Properties.CorsConfiguration;
      expect(cors.AllowOrigins).toEqual(['*']);
      expect(cors.AllowMethods).toContain('GET');
      expect(cors.AllowMethods).toContain('POST');
      expect(cors.AllowMethods).toContain('OPTIONS');
      expect(cors.MaxAge).toBe(300);
    });

    test('should configure HTTP API stage with auto-deploy', () => {
      const stage = template.Resources.HttpApiStage;
      expect(stage.Properties.StageName).toBe('$default');
      expect(stage.Properties.AutoDeploy).toBe(true);
    });

    test('should configure HTTP API stage with access logging', () => {
      const stage = template.Resources.HttpApiStage;
      expect(stage.Properties.AccessLogSettings.DestinationArn).toEqual({
        'Fn::GetAtt': ['HttpApiLogGroup', 'Arn']
      });
    });

    test('should configure HTTP API stage with throttling limits', () => {
      const stage = template.Resources.HttpApiStage;
      const routeSettings = stage.Properties.DefaultRouteSettings;
      expect(routeSettings.DetailedMetricsEnabled).toBe(true);
      expect(routeSettings.ThrottlingBurstLimit).toBe(100);
      expect(routeSettings.ThrottlingRateLimit).toBe(50);
    });

    test('should configure Lambda integration with payload format version 2.0', () => {
      const integration = template.Resources.HttpApiIntegration;
      expect(integration.Properties.IntegrationType).toBe('AWS_PROXY');
      expect(integration.Properties.PayloadFormatVersion).toBe('2.0');
      expect(integration.Properties.IntegrationMethod).toBe('POST');
    });
  });

  describe('DynamoDB Table Configuration', () => {
    test('should configure DynamoDB with partition and sort keys', () => {
      const table = template.Resources.DynamoDBTable;
      const keySchema = table.Properties.KeySchema;
      expect(keySchema).toHaveLength(2);
      expect(keySchema[0].AttributeName).toBe('partitionKey');
      expect(keySchema[0].KeyType).toBe('HASH');
      expect(keySchema[1].AttributeName).toBe('sortKey');
      expect(keySchema[1].KeyType).toBe('RANGE');
    });

    test('should configure DynamoDB with attribute definitions', () => {
      const table = template.Resources.DynamoDBTable;
      const attributes = table.Properties.AttributeDefinitions;
      expect(attributes).toHaveLength(2);
      expect(attributes[0].AttributeName).toBe('partitionKey');
      expect(attributes[0].AttributeType).toBe('S');
      expect(attributes[1].AttributeName).toBe('sortKey');
      expect(attributes[1].AttributeType).toBe('S');
    });

    test('should configure DynamoDB with provisioned throughput', () => {
      const table = template.Resources.DynamoDBTable;
      expect(table.Properties.BillingMode).toBe('PROVISIONED');
      expect(table.Properties.ProvisionedThroughput.ReadCapacityUnits).toBe(5);
      expect(table.Properties.ProvisionedThroughput.WriteCapacityUnits).toBe(5);
    });

    test('should configure DynamoDB with KMS encryption', () => {
      const table = template.Resources.DynamoDBTable;
      const sseSpec = table.Properties.SSESpecification;
      expect(sseSpec.SSEEnabled).toBe(true);
      expect(sseSpec.SSEType).toBe('KMS');
      expect(sseSpec.KMSMasterKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('should configure DynamoDB with point-in-time recovery', () => {
      const table = template.Resources.DynamoDBTable;
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should configure S3 bucket with versioning enabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should configure S3 bucket with KMS encryption', () => {
      const bucket = template.Resources.S3Bucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'KMSKey' });
      expect(encryption.BucketKeyEnabled).toBe(true);
    });

    test('should configure S3 bucket with public access blocked', () => {
      const bucket = template.Resources.S3Bucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should configure S3 bucket with lifecycle policy for old versions', () => {
      const bucket = template.Resources.S3Bucket;
      const lifecycleRules = bucket.Properties.LifecycleConfiguration.Rules;
      expect(lifecycleRules).toHaveLength(1);
      expect(lifecycleRules[0].Status).toBe('Enabled');
      expect(lifecycleRules[0].NoncurrentVersionExpirationInDays).toBe(90);
    });
  });

  describe('VPC and Networking Configuration', () => {
    test('should configure VPC with DNS support enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should configure two private subnets in different availability zones', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;
      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(subnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
    });

    test('should configure S3 VPC endpoint with gateway type', () => {
      const endpoint = template.Resources.S3VPCEndpoint;
      expect(endpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(endpoint.Properties.ServiceName).toEqual({
        'Fn::Sub': 'com.amazonaws.${AWS::Region}.s3'
      });
      expect(endpoint.Properties.RouteTableIds).toHaveLength(1);
    });

    test('should configure S3 VPC endpoint policy with specific actions', () => {
      const endpoint = template.Resources.S3VPCEndpoint;
      const statement = endpoint.Properties.PolicyDocument.Statement[0];
      expect(statement.Action).toContain('s3:GetObject');
      expect(statement.Action).toContain('s3:GetObjectVersion');
      expect(statement.Action).toContain('s3:ListBucket');
      expect(statement.Action).toContain('s3:HeadObject');
    });

    test('should configure DynamoDB VPC endpoint with gateway type', () => {
      const endpoint = template.Resources.DynamoDBVPCEndpoint;
      expect(endpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(endpoint.Properties.ServiceName).toEqual({
        'Fn::Sub': 'com.amazonaws.${AWS::Region}.dynamodb'
      });
    });

    test('should configure Lambda security group with HTTPS egress only', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      const egress = sg.Properties.SecurityGroupEgress;
      expect(egress).toHaveLength(1);
      expect(egress[0].IpProtocol).toBe('tcp');
      expect(egress[0].FromPort).toBe(443);
      expect(egress[0].ToPort).toBe(443);
      expect(egress[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('should configure VPC Flow Logs with all traffic capture', () => {
      const flowLogs = template.Resources.VPCFlowLogs;
      expect(flowLogs.Properties.TrafficType).toBe('ALL');
      expect(flowLogs.Properties.LogDestinationType).toBe('cloud-watch-logs');
    });
  });

  describe('KMS Encryption Configuration', () => {
    test('should configure KMS key policy with root account permissions', () => {
      const kmsKey = template.Resources.KMSKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;
      const rootStatement = statements.find((s: any) => s.Sid === 'Enable IAM User Permissions');
      expect(rootStatement.Principal.AWS).toEqual({
        'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root'
      });
      expect(rootStatement.Action).toBe('kms:*');
    });

    test('should configure KMS key policy for CloudWatch Logs', () => {
      const kmsKey = template.Resources.KMSKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;
      const logsStatement = statements.find((s: any) => s.Sid === 'Allow CloudWatch Logs');
      expect(logsStatement.Principal.Service).toEqual({
        'Fn::Sub': 'logs.${AWS::Region}.amazonaws.com'
      });
      expect(logsStatement.Action).toContain('kms:Encrypt');
      expect(logsStatement.Action).toContain('kms:Decrypt');
      expect(logsStatement.Action).toContain('kms:GenerateDataKey*');
    });
  });

  describe('CloudWatch Logs Configuration', () => {
    test('should configure Lambda log group with 30-day retention', () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should configure Lambda log group with KMS encryption', () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup.Properties.KmsKeyId).toEqual({
        'Fn::GetAtt': ['KMSKey', 'Arn']
      });
    });

    test('should configure API Gateway log group with 30-day retention', () => {
      const logGroup = template.Resources.HttpApiLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should configure API Gateway log group with KMS encryption', () => {
      const logGroup = template.Resources.HttpApiLogGroup;
      expect(logGroup.Properties.KmsKeyId).toEqual({
        'Fn::GetAtt': ['KMSKey', 'Arn']
      });
    });

    test('should configure VPC Flow Logs log group with KMS encryption', () => {
      const logGroup = template.Resources.VPCFlowLogsLogGroup;
      expect(logGroup.Properties.KmsKeyId).toEqual({
        'Fn::GetAtt': ['KMSKey', 'Arn']
      });
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('IAM Role Configuration', () => {
    test('should configure Lambda execution role with VPC access policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );
    });

    test('should configure Lambda execution role with least privilege logging permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const logsStatement = policy.Statement.find((s: any) =>
        s.Action.includes('logs:CreateLogStream')
      );
      expect(logsStatement.Action).toContain('logs:CreateLogStream');
      expect(logsStatement.Action).toContain('logs:PutLogEvents');
      expect(logsStatement.Action).not.toContain('logs:CreateLogGroup');
    });

    test('should configure Lambda execution role with DynamoDB permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const dynamoStatement = policy.Statement.find((s: any) =>
        s.Action.includes('dynamodb:GetItem')
      );
      expect(dynamoStatement.Action).toContain('dynamodb:GetItem');
      expect(dynamoStatement.Action).toContain('dynamodb:PutItem');
      expect(dynamoStatement.Action).toContain('dynamodb:Query');
      expect(dynamoStatement.Action).toContain('dynamodb:Scan');
    });

    test('should configure Lambda execution role with S3 read permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const s3Statement = policy.Statement.find((s: any) =>
        s.Action.includes('s3:GetObject')
      );
      expect(s3Statement.Action).toContain('s3:GetObject');
      expect(s3Statement.Action).toContain('s3:GetObjectVersion');
      expect(s3Statement.Action).toContain('s3:ListBucket');
      expect(s3Statement.Action).not.toContain('s3:PutObject');
    });

    test('should configure Lambda execution role with SNS publish permission', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const snsStatement = policy.Statement.find((s: any) =>
        s.Action.includes('sns:Publish')
      );
      expect(snsStatement.Action).toEqual(['sns:Publish']);
    });

    test('should configure Lambda execution role with KMS permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const kmsStatement = policy.Statement.find((s: any) =>
        s.Action.includes('kms:Decrypt')
      );
      expect(kmsStatement.Action).toContain('kms:Decrypt');
      expect(kmsStatement.Action).toContain('kms:GenerateDataKey');
      expect(kmsStatement.Action).toContain('kms:DescribeKey');
    });
  });

  describe('SNS and SQS Configuration', () => {
    test('should configure SNS topic with KMS encryption', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic.Properties.KmsMasterKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('should configure SNS topic policy allowing Lambda to publish', () => {
      const policy = template.Resources.SNSTopicPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      const lambdaStatement = statements.find((s: any) => s.Sid === 'AllowLambdaPublish');
      expect(lambdaStatement.Principal.Service).toBe('lambda.amazonaws.com');
      expect(lambdaStatement.Action).toBe('sns:Publish');
      expect(lambdaStatement.Condition.ArnLike['aws:SourceArn']).toEqual({
        'Fn::GetAtt': ['LambdaFunction', 'Arn']
      });
    });

    test('should configure SNS topic policy allowing CloudWatch alarms', () => {
      const policy = template.Resources.SNSTopicPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      const cwStatement = statements.find((s: any) => s.Sid === 'AllowCloudWatchAlarms');
      expect(cwStatement.Principal.Service).toBe('cloudwatch.amazonaws.com');
      expect(cwStatement.Action).toBe('sns:Publish');
    });

    test('should configure Dead Letter Queue with KMS encryption', () => {
      const dlq = template.Resources.DeadLetterQueue;
      expect(dlq.Properties.KmsMasterKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('should configure Dead Letter Queue with 14-day retention', () => {
      const dlq = template.Resources.DeadLetterQueue;
      expect(dlq.Properties.MessageRetentionPeriod).toBe(1209600);
    });
  });

  describe('EventBridge Configuration', () => {
    test('should configure EventBridge rule with 24-hour schedule', () => {
      const rule = template.Resources.EventBridgeScheduleRule;
      expect(rule.Properties.ScheduleExpression).toBe('rate(24 hours)');
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('should configure EventBridge rule targeting Lambda function', () => {
      const rule = template.Resources.EventBridgeScheduleRule;
      const targets = rule.Properties.Targets;
      expect(targets).toHaveLength(1);
      expect(targets[0].Arn).toEqual({
        'Fn::GetAtt': ['LambdaFunction', 'Arn']
      });
    });
  });

  describe('CloudWatch Alarms Configuration', () => {
    test('should configure Lambda error alarm with correct threshold', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Statistic).toBe('Sum');
      expect(alarm.Properties.Threshold).toBe(1);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    });

    test('should configure Lambda error alarm to publish to SNS', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Properties.AlarmActions).toHaveLength(1);
      expect(alarm.Properties.AlarmActions[0]).toEqual({ Ref: 'SNSTopic' });
    });

    test('should configure DynamoDB read throttle alarm', () => {
      const alarm = template.Resources.DynamoDBReadThrottleAlarm;
      expect(alarm.Properties.MetricName).toBe('ReadThrottleEvents');
      expect(alarm.Properties.Namespace).toBe('AWS/DynamoDB');
      expect(alarm.Properties.Threshold).toBe(1);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should configure alarms to treat missing data as not breaching', () => {
      const lambdaAlarm = template.Resources.LambdaErrorAlarm;
      const dynamoAlarm = template.Resources.DynamoDBReadThrottleAlarm;
      expect(lambdaAlarm.Properties.TreatMissingData).toBe('notBreaching');
      expect(dynamoAlarm.Properties.TreatMissingData).toBe('notBreaching');
    });
  });

  describe('Resource Tagging', () => {
    test('should tag Lambda function with Environment and Project', () => {
      const lambda = template.Resources.LambdaFunction;
      const tags = lambda.Properties.Tags;
      expect(tags.find((t: any) => t.Key === 'Environment').Value).toEqual({
        Ref: 'EnvironmentSuffix'
      });
      expect(tags.find((t: any) => t.Key === 'Project').Value).toBe('ServerlessApp');
    });

    test('should tag DynamoDB table with Environment and Project', () => {
      const table = template.Resources.DynamoDBTable;
      const tags = table.Properties.Tags;
      expect(tags.find((t: any) => t.Key === 'Environment').Value).toEqual({
        Ref: 'EnvironmentSuffix'
      });
      expect(tags.find((t: any) => t.Key === 'Project').Value).toBe('ServerlessApp');
    });

    test('should tag S3 bucket with Environment and Project', () => {
      const bucket = template.Resources.S3Bucket;
      const tags = bucket.Properties.Tags;
      expect(tags.find((t: any) => t.Key === 'Environment').Value).toEqual({
        Ref: 'EnvironmentSuffix'
      });
      expect(tags.find((t: any) => t.Key === 'Project').Value).toBe('ServerlessApp');
    });

    test('should tag VPC with Environment and Project', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;
      expect(tags.find((t: any) => t.Key === 'Environment').Value).toEqual({
        Ref: 'EnvironmentSuffix'
      });
      expect(tags.find((t: any) => t.Key === 'Project').Value).toBe('ServerlessApp');
    });
  });

  describe('Parameter Configuration', () => {
    test('should configure EnvironmentSuffix parameter with lowercase constraint', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-z0-9]+$');
      expect(param.ConstraintDescription).toBe('Must contain only lowercase alphanumeric characters');
    });
  });
});
