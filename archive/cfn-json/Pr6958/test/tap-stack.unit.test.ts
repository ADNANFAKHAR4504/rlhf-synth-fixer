import { TemplateLoader, loadTemplate } from '../lib/template-loader';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let loader: TemplateLoader;
  let template: any;

  beforeAll(() => {
    loader = loadTemplate();
    template = loader.getTemplate();
  });

  describe('Template Loader Functionality', () => {
    test('should load template successfully', () => {
      expect(loader).toBeDefined();
      expect(template).toBeDefined();
    });

    test('should handle invalid template path', () => {
      expect(() => new TemplateLoader('/nonexistent/path/template.json')).toThrow('Failed to load template');
    });

    test('should get template version', () => {
      expect(loader.getVersion()).toBe('2010-09-09');
    });

    test('should return empty string if version is missing', () => {
      const customTemplate = { ...template };
      delete customTemplate.AWSTemplateFormatVersion;
      const customLoader = new TemplateLoader();
      (customLoader as any).template = customTemplate;
      expect(customLoader.getVersion()).toBe('');
    });

    test('should get template description', () => {
      const description = loader.getDescription();
      expect(description).toBeDefined();
      expect(description).toContain('Multi-Region');
    });

    test('should return empty string if description is missing', () => {
      const customTemplate = { ...template };
      delete customTemplate.Description;
      const customLoader = new TemplateLoader();
      (customLoader as any).template = customTemplate;
      expect(customLoader.getDescription()).toBe('');
    });

    test('should validate template', () => {
      const validation = loader.validate();
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should return validation errors for invalid template', () => {
      const invalidLoader = new TemplateLoader();
      (invalidLoader as any).template = {};
      const validation = invalidLoader.validate();
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors).toContain('Missing AWSTemplateFormatVersion');
      expect(validation.errors).toContain('Missing Description');
      expect(validation.errors).toContain('No resources defined');
    });

    test('should get all parameters', () => {
      const params = loader.getParameters();
      expect(Object.keys(params).length).toBeGreaterThan(0);
    });

    test('should return empty object if parameters are missing', () => {
      const customTemplate = { ...template };
      delete customTemplate.Parameters;
      const customLoader = new TemplateLoader();
      (customLoader as any).template = customTemplate;
      expect(customLoader.getParameters()).toEqual({});
    });

    test('should get specific parameter', () => {
      const param = loader.getParameter('EnvironmentSuffix');
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
    });

    test('should return undefined for non-existent parameter', () => {
      expect(loader.getParameter('NonExistent')).toBeUndefined();
    });

    test('should get all resources', () => {
      const resources = loader.getResources();
      expect(Object.keys(resources).length).toBeGreaterThan(0);
    });

    test('should return empty object if resources are missing', () => {
      const customTemplate = { ...template };
      delete customTemplate.Resources;
      const customLoader = new TemplateLoader();
      (customLoader as any).template = customTemplate;
      expect(customLoader.getResources()).toEqual({});
    });

    test('should get specific resource', () => {
      const resource = loader.getResource('PaymentProcessorFunction');
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::Lambda::Function');
    });

    test('should return undefined for non-existent resource', () => {
      expect(loader.getResource('NonExistent')).toBeUndefined();
    });

    test('should get all outputs', () => {
      const outputs = loader.getOutputs();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('should return empty object if outputs are missing', () => {
      const customTemplate = { ...template };
      delete customTemplate.Outputs;
      const customLoader = new TemplateLoader();
      (customLoader as any).template = customTemplate;
      expect(customLoader.getOutputs()).toEqual({});
    });

    test('should get specific output', () => {
      const output = loader.getOutput('LambdaFunctionArn');
      expect(output).toBeDefined();
    });

    test('should return undefined for non-existent output', () => {
      expect(loader.getOutput('NonExistent')).toBeUndefined();
    });

    test('should get all conditions', () => {
      const conditions = loader.getConditions();
      expect(Object.keys(conditions).length).toBeGreaterThan(0);
    });

    test('should return empty object if conditions are missing', () => {
      const customTemplate = { ...template };
      delete customTemplate.Conditions;
      const customLoader = new TemplateLoader();
      (customLoader as any).template = customTemplate;
      expect(customLoader.getConditions()).toEqual({});
    });

    test('should get specific condition', () => {
      const condition = loader.getCondition('IsPrimaryRegion');
      expect(condition).toBeDefined();
    });

    test('should return undefined for non-existent condition', () => {
      expect(loader.getCondition('NonExistent')).toBeUndefined();
    });

    test('should check if resource exists', () => {
      expect(loader.hasResource('PaymentProcessorFunction')).toBe(true);
      expect(loader.hasResource('NonExistentResource')).toBe(false);
    });

    test('should check if parameter exists', () => {
      expect(loader.hasParameter('EnvironmentSuffix')).toBe(true);
      expect(loader.hasParameter('NonExistentParameter')).toBe(false);
    });

    test('should check if output exists', () => {
      expect(loader.hasOutput('LambdaFunctionArn')).toBe(true);
      expect(loader.hasOutput('NonExistentOutput')).toBe(false);
    });

    test('should check if condition exists', () => {
      expect(loader.hasCondition('IsPrimaryRegion')).toBe(true);
      expect(loader.hasCondition('NonExistentCondition')).toBe(false);
    });

    test('should get resource names', () => {
      const names = loader.getResourceNames();
      expect(names).toContain('PaymentProcessorFunction');
      expect(names).toContain('TransactionTable');
    });

    test('should get parameter names', () => {
      const names = loader.getParameterNames();
      expect(names).toContain('EnvironmentSuffix');
      expect(names).toContain('RegionType');
    });

    test('should get output names', () => {
      const names = loader.getOutputNames();
      expect(names).toContain('LambdaFunctionArn');
      expect(names).toContain('DynamoDBTableName');
    });

    test('should get condition names', () => {
      const names = loader.getConditionNames();
      expect(names).toContain('IsPrimaryRegion');
    });

    test('should count resources by type', () => {
      expect(loader.getResourceCountByType('AWS::Lambda::Function')).toBe(1);
      expect(loader.getResourceCountByType('AWS::DynamoDB::GlobalTable')).toBe(1);
      expect(loader.getResourceCountByType('AWS::CloudWatch::Alarm')).toBe(4);
    });

    test('should return 0 for non-existent resource type', () => {
      expect(loader.getResourceCountByType('AWS::NonExistent::Resource')).toBe(0);
    });

    test('should handle template with missing sections gracefully', () => {
      const customTemplate = { ...template };
      delete customTemplate.Parameters;
      delete customTemplate.Conditions;
      const customLoader = new TemplateLoader();
      (customLoader as any).template = customTemplate;

      expect(customLoader.hasParameter('EnvironmentSuffix')).toBe(false);
      expect(customLoader.hasCondition('IsPrimaryRegion')).toBe(false);
      expect(customLoader.getParameterNames()).toEqual([]);
      expect(customLoader.getConditionNames()).toEqual([]);
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Multi-Region');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });

    test('should have Conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.IsPrimaryRegion).toBeDefined();
    });
  });

  describe('Parameters Validation', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.MinLength).toBe(3);
      expect(template.Parameters.EnvironmentSuffix.MaxLength).toBe(20);
    });

    test('should have RegionType parameter with correct values', () => {
      expect(template.Parameters.RegionType).toBeDefined();
      expect(template.Parameters.RegionType.AllowedValues).toEqual(['primary', 'secondary']);
      expect(template.Parameters.RegionType.Default).toBe('primary');
    });

    test('should have NotificationEmail parameter with default', () => {
      expect(template.Parameters.NotificationEmail).toBeDefined();
      expect(template.Parameters.NotificationEmail.Default).toBe('admin@example.com');
      expect(template.Parameters.NotificationEmail.AllowedPattern).toBeDefined();
    });

    test('should have SecondaryRegion parameter', () => {
      expect(template.Parameters.SecondaryRegion).toBeDefined();
      expect(template.Parameters.SecondaryRegion.Default).toBe('us-west-2');
    });

    test('should have SecondaryRegionBucketName parameter', () => {
      expect(template.Parameters.SecondaryRegionBucketName).toBeDefined();
      expect(template.Parameters.SecondaryRegionBucketName.Default).toBe('');
    });

    test('should have HealthCheckDomain parameter', () => {
      expect(template.Parameters.HealthCheckDomain).toBeDefined();
      expect(template.Parameters.HealthCheckDomain.Default).toBe('example.com');
    });
  });

  describe('Lambda Function Configuration', () => {
    test('should have PaymentProcessorFunction resource', () => {
      expect(template.Resources.PaymentProcessorFunction).toBeDefined();
      expect(template.Resources.PaymentProcessorFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should use Python 3.11 runtime', () => {
      const runtime = template.Resources.PaymentProcessorFunction.Properties.Runtime;
      expect(runtime).toBe('python3.11');
    });

    test('should have reserved concurrent executions set to 100', () => {
      const concurrency = template.Resources.PaymentProcessorFunction.Properties.ReservedConcurrentExecutions;
      expect(concurrency).toBe(100);
    });

    test('should have correct timeout and memory size', () => {
      const props = template.Resources.PaymentProcessorFunction.Properties;
      expect(props.Timeout).toBe(30);
      expect(props.MemorySize).toBe(256);
    });

    test('should have environment variables configured', () => {
      const envVars = template.Resources.PaymentProcessorFunction.Properties.Environment.Variables;
      expect(envVars.AWS_REGION_NAME).toBeDefined();
      expect(envVars.REGION_TYPE).toBeDefined();
      expect(envVars.DYNAMODB_TABLE).toBeDefined();
      expect(envVars.S3_BUCKET).toBeDefined();
      expect(envVars.SECRET_ARN).toBeDefined();
    });

    test('should have function name with environmentSuffix', () => {
      const functionName = template.Resources.PaymentProcessorFunction.Properties.FunctionName;
      expect(functionName['Fn::Sub']).toContain('PaymentProcessor-${EnvironmentSuffix}');
    });

    test('should have tags with environment and region', () => {
      const tags = template.Resources.PaymentProcessorFunction.Properties.Tags;
      expect(tags).toHaveLength(2);
      expect(tags.find((t: any) => t.Key === 'Environment')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'Region')).toBeDefined();
    });
  });

  describe('IAM Role Configuration', () => {
    test('should have PaymentProcessorLambdaRole resource', () => {
      expect(template.Resources.PaymentProcessorLambdaRole).toBeDefined();
      expect(template.Resources.PaymentProcessorLambdaRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have correct assume role policy for Lambda', () => {
      const assumeRole = template.Resources.PaymentProcessorLambdaRole.Properties.AssumeRolePolicyDocument;
      expect(assumeRole.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumeRole.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should have DynamoDB access policy', () => {
      const policies = template.Resources.PaymentProcessorLambdaRole.Properties.Policies;
      const dynamoPolicy = policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');
      expect(dynamoPolicy).toBeDefined();
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:PutItem');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:GetItem');
    });

    test('should have Secrets Manager access policy', () => {
      const policies = template.Resources.PaymentProcessorLambdaRole.Properties.Policies;
      const secretsPolicy = policies.find((p: any) => p.PolicyName === 'SecretsManagerAccess');
      expect(secretsPolicy).toBeDefined();
      expect(secretsPolicy.PolicyDocument.Statement[0].Action).toContain('secretsmanager:GetSecretValue');
    });

    test('should have S3 access policy', () => {
      const policies = template.Resources.PaymentProcessorLambdaRole.Properties.Policies;
      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3Access');
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:PutObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
    });

    test('should have role name with environmentSuffix', () => {
      const roleName = template.Resources.PaymentProcessorLambdaRole.Properties.RoleName;
      expect(roleName['Fn::Sub']).toContain('PaymentProcessorLambdaRole-${EnvironmentSuffix}');
    });
  });

  describe('DynamoDB Global Table Configuration', () => {
    test('should have TransactionTable resource', () => {
      expect(template.Resources.TransactionTable).toBeDefined();
      expect(template.Resources.TransactionTable.Type).toBe('AWS::DynamoDB::GlobalTable');
    });

    test('should have correct key schema', () => {
      const keySchema = template.Resources.TransactionTable.Properties.KeySchema;
      expect(keySchema).toHaveLength(2);
      expect(keySchema[0].AttributeName).toBe('transaction_id');
      expect(keySchema[0].KeyType).toBe('HASH');
      expect(keySchema[1].AttributeName).toBe('timestamp');
      expect(keySchema[1].KeyType).toBe('RANGE');
    });

    test('should use PAY_PER_REQUEST billing mode', () => {
      const billingMode = template.Resources.TransactionTable.Properties.BillingMode;
      expect(billingMode).toBe('PAY_PER_REQUEST');
    });

    test('should have stream specification enabled', () => {
      const streamSpec = template.Resources.TransactionTable.Properties.StreamSpecification;
      expect(streamSpec.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('should have replicas in us-east-1 and us-west-2', () => {
      const replicas = template.Resources.TransactionTable.Properties.Replicas;
      expect(replicas).toHaveLength(2);
      expect(replicas[0].Region).toBe('us-east-1');
      expect(replicas[1].Region).toBe('us-west-2');
    });

    test('should have point-in-time recovery enabled for all replicas', () => {
      const replicas = template.Resources.TransactionTable.Properties.Replicas;
      replicas.forEach((replica: any) => {
        expect(replica.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
      });
    });

    test('should have table name with environmentSuffix', () => {
      const tableName = template.Resources.TransactionTable.Properties.TableName;
      expect(tableName['Fn::Sub']).toContain('Transactions-${EnvironmentSuffix}');
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should have TransactionLogsBucket resource', () => {
      expect(template.Resources.TransactionLogsBucket).toBeDefined();
      expect(template.Resources.TransactionLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have versioning enabled', () => {
      const versioning = template.Resources.TransactionLogsBucket.Properties.VersioningConfiguration;
      expect(versioning.Status).toBe('Enabled');
    });

    test('should have bucket name with environmentSuffix and region', () => {
      const bucketName = template.Resources.TransactionLogsBucket.Properties.BucketName;
      expect(bucketName['Fn::Sub']).toContain('transaction-logs-${EnvironmentSuffix}-${AWS::Region}');
    });

    test('should have conditional replication configuration', () => {
      const replicationConfig = template.Resources.TransactionLogsBucket.Properties.ReplicationConfiguration;
      expect(replicationConfig['Fn::If']).toBeDefined();
      expect(replicationConfig['Fn::If'][0]).toBe('EnableReplication');
    });

    test('should have tags with environment and region', () => {
      const tags = template.Resources.TransactionLogsBucket.Properties.Tags;
      expect(tags).toHaveLength(2);
      expect(tags.find((t: any) => t.Key === 'Environment')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'Region')).toBeDefined();
    });
  });

  describe('S3 Replication Role Configuration', () => {
    test('should have S3ReplicationRole resource', () => {
      expect(template.Resources.S3ReplicationRole).toBeDefined();
      expect(template.Resources.S3ReplicationRole.Type).toBe('AWS::IAM::Role');
    });

    test('should be conditional on EnableReplication', () => {
      expect(template.Resources.S3ReplicationRole.Condition).toBe('EnableReplication');
    });

    test('should have correct assume role policy for S3', () => {
      const assumeRole = template.Resources.S3ReplicationRole.Properties.AssumeRolePolicyDocument;
      expect(assumeRole.Statement[0].Principal.Service).toBe('s3.amazonaws.com');
      expect(assumeRole.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should have S3 replication policy with correct permissions', () => {
      const policies = template.Resources.S3ReplicationRole.Properties.Policies;
      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('S3ReplicationPolicy');

      const statements = policies[0].PolicyDocument.Statement;
      expect(statements).toHaveLength(3);

      // Check bucket-level permissions
      expect(statements[0].Action).toContain('s3:GetReplicationConfiguration');
      expect(statements[0].Action).toContain('s3:ListBucket');

      // Check object-level source permissions
      expect(statements[1].Action).toContain('s3:GetObjectVersionForReplication');

      // Check object-level destination permissions
      expect(statements[2].Action).toContain('s3:ReplicateObject');
    });
  });

  describe('Secrets Manager Configuration', () => {
    test('should have PaymentAPISecret resource', () => {
      expect(template.Resources.PaymentAPISecret).toBeDefined();
      expect(template.Resources.PaymentAPISecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('should have secret name with environmentSuffix', () => {
      const secretName = template.Resources.PaymentAPISecret.Properties.Name;
      expect(secretName['Fn::Sub']).toContain('PaymentAPISecret-${EnvironmentSuffix}');
    });

    test('should have conditional replica regions', () => {
      const replicaRegions = template.Resources.PaymentAPISecret.Properties.ReplicaRegions;
      expect(replicaRegions['Fn::If']).toBeDefined();
      expect(replicaRegions['Fn::If'][0]).toBe('IsPrimaryRegion');
    });

    test('should have description', () => {
      const description = template.Resources.PaymentAPISecret.Properties.Description;
      expect(description).toContain('API keys');
    });
  });

  describe('SNS Topic Configuration', () => {
    test('should have FailoverNotificationTopic resource', () => {
      expect(template.Resources.FailoverNotificationTopic).toBeDefined();
      expect(template.Resources.FailoverNotificationTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have topic name with environmentSuffix', () => {
      const topicName = template.Resources.FailoverNotificationTopic.Properties.TopicName;
      expect(topicName['Fn::Sub']).toContain('FailoverNotifications-${EnvironmentSuffix}');
    });

    test('should have email subscription', () => {
      const subscriptions = template.Resources.FailoverNotificationTopic.Properties.Subscription;
      expect(subscriptions).toHaveLength(1);
      expect(subscriptions[0].Protocol).toBe('email');
      expect(subscriptions[0].Endpoint.Ref).toBe('NotificationEmail');
    });

    test('should have display name', () => {
      const displayName = template.Resources.FailoverNotificationTopic.Properties.DisplayName;
      expect(displayName).toContain('Failover Notifications');
    });
  });

  describe('CloudWatch Alarms Configuration', () => {
    test('should have LambdaErrorAlarm resource', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      expect(template.Resources.LambdaErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have LambdaThrottleAlarm resource', () => {
      expect(template.Resources.LambdaThrottleAlarm).toBeDefined();
      expect(template.Resources.LambdaThrottleAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have DynamoDBThrottleAlarm resource', () => {
      expect(template.Resources.DynamoDBThrottleAlarm).toBeDefined();
      expect(template.Resources.DynamoDBThrottleAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('LambdaErrorAlarm should monitor errors metric', () => {
      const alarm = template.Resources.LambdaErrorAlarm.Properties;
      expect(alarm.MetricName).toBe('Errors');
      expect(alarm.Namespace).toBe('AWS/Lambda');
      expect(alarm.Threshold).toBe(5);
    });

    test('LambdaThrottleAlarm should monitor throttles metric', () => {
      const alarm = template.Resources.LambdaThrottleAlarm.Properties;
      expect(alarm.MetricName).toBe('Throttles');
      expect(alarm.Namespace).toBe('AWS/Lambda');
      expect(alarm.Threshold).toBe(1);
    });

    test('all alarms should send notifications to SNS topic', () => {
      const alarms = ['LambdaErrorAlarm', 'LambdaThrottleAlarm', 'DynamoDBThrottleAlarm'];
      alarms.forEach(alarmName => {
        const alarm = template.Resources[alarmName].Properties;
        expect(alarm.AlarmActions).toHaveLength(1);
        expect(alarm.AlarmActions[0].Ref).toBe('FailoverNotificationTopic');
      });
    });

    test('alarm names should include environmentSuffix', () => {
      const alarms = ['LambdaErrorAlarm', 'LambdaThrottleAlarm', 'DynamoDBThrottleAlarm'];
      alarms.forEach(alarmName => {
        const alarm = template.Resources[alarmName].Properties;
        expect(alarm.AlarmName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });
  });

  describe('Route 53 Health Check Configuration', () => {
    test('should have HealthCheck resource', () => {
      expect(template.Resources.HealthCheck).toBeDefined();
      expect(template.Resources.HealthCheck.Type).toBe('AWS::Route53::HealthCheck');
    });

    test('should use HTTPS protocol', () => {
      const config = template.Resources.HealthCheck.Properties.HealthCheckConfig;
      expect(config.Type).toBe('HTTPS');
      expect(config.Port).toBe(443);
    });

    test('should have health check path', () => {
      const config = template.Resources.HealthCheck.Properties.HealthCheckConfig;
      expect(config.ResourcePath).toBe('/health');
    });

    test('should have request interval and failure threshold', () => {
      const config = template.Resources.HealthCheck.Properties.HealthCheckConfig;
      expect(config.RequestInterval).toBe(30);
      expect(config.FailureThreshold).toBe(3);
    });

    test('should have health check alarm', () => {
      expect(template.Resources.HealthCheckAlarm).toBeDefined();
      expect(template.Resources.HealthCheckAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('HealthCheckAlarm should monitor HealthCheckStatus metric', () => {
      const alarm = template.Resources.HealthCheckAlarm.Properties;
      expect(alarm.MetricName).toBe('HealthCheckStatus');
      expect(alarm.Namespace).toBe('AWS/Route53');
      expect(alarm.Threshold).toBe(1);
      expect(alarm.ComparisonOperator).toBe('LessThanThreshold');
    });
  });

  describe('Conditions Logic', () => {
    test('should have IsPrimaryRegion condition', () => {
      expect(template.Conditions.IsPrimaryRegion).toBeDefined();
      expect(template.Conditions.IsPrimaryRegion['Fn::Equals']).toBeDefined();
    });

    test('should have HasSecondaryBucket condition', () => {
      expect(template.Conditions.HasSecondaryBucket).toBeDefined();
      expect(template.Conditions.HasSecondaryBucket['Fn::Not']).toBeDefined();
    });

    test('should have EnableReplication condition combining primary and bucket', () => {
      expect(template.Conditions.EnableReplication).toBeDefined();
      expect(template.Conditions.EnableReplication['Fn::And']).toBeDefined();
      expect(template.Conditions.EnableReplication['Fn::And']).toHaveLength(2);
    });
  });

  describe('Outputs Validation', () => {
    test('should have LambdaFunctionArn output', () => {
      expect(template.Outputs.LambdaFunctionArn).toBeDefined();
      expect(template.Outputs.LambdaFunctionArn.Value['Fn::GetAtt']).toEqual(['PaymentProcessorFunction', 'Arn']);
    });

    test('should have LambdaFunctionName output', () => {
      expect(template.Outputs.LambdaFunctionName).toBeDefined();
      expect(template.Outputs.LambdaFunctionName.Value.Ref).toBe('PaymentProcessorFunction');
    });

    test('should have DynamoDBTableName output', () => {
      expect(template.Outputs.DynamoDBTableName).toBeDefined();
      expect(template.Outputs.DynamoDBTableName.Value.Ref).toBe('TransactionTable');
    });

    test('should have DynamoDBTableArn output', () => {
      expect(template.Outputs.DynamoDBTableArn).toBeDefined();
      expect(template.Outputs.DynamoDBTableArn.Value['Fn::GetAtt']).toEqual(['TransactionTable', 'Arn']);
    });

    test('should have S3BucketName output', () => {
      expect(template.Outputs.S3BucketName).toBeDefined();
      expect(template.Outputs.S3BucketName.Value.Ref).toBe('TransactionLogsBucket');
    });

    test('should have S3BucketArn output', () => {
      expect(template.Outputs.S3BucketArn).toBeDefined();
      expect(template.Outputs.S3BucketArn.Value['Fn::GetAtt']).toEqual(['TransactionLogsBucket', 'Arn']);
    });

    test('should have SecretArn output', () => {
      expect(template.Outputs.SecretArn).toBeDefined();
      expect(template.Outputs.SecretArn.Value.Ref).toBe('PaymentAPISecret');
    });

    test('should have SNSTopicArn output', () => {
      expect(template.Outputs.SNSTopicArn).toBeDefined();
      expect(template.Outputs.SNSTopicArn.Value.Ref).toBe('FailoverNotificationTopic');
    });

    test('should have HealthCheckId output', () => {
      expect(template.Outputs.HealthCheckId).toBeDefined();
      expect(template.Outputs.HealthCheckId.Value.Ref).toBe('HealthCheck');
    });

    test('should have RegionType output', () => {
      expect(template.Outputs.RegionType).toBeDefined();
      expect(template.Outputs.RegionType.Value.Ref).toBe('RegionType');
    });

    test('all outputs should have exports with environmentSuffix', () => {
      const outputsWithExports = [
        'LambdaFunctionArn',
        'LambdaFunctionName',
        'DynamoDBTableName',
        'DynamoDBTableArn',
        'S3BucketName',
        'S3BucketArn',
        'SecretArn',
        'SNSTopicArn',
        'HealthCheckId'
      ];

      outputsWithExports.forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Resource Naming Consistency', () => {
    test('all named resources should include environmentSuffix', () => {
      const namedResources = [
        'PaymentProcessorLambdaRole',
        'PaymentProcessorFunction',
        'TransactionTable',
        'TransactionLogsBucket',
        'S3ReplicationRole',
        'PaymentAPISecret',
        'FailoverNotificationTopic',
        'LambdaErrorAlarm',
        'LambdaThrottleAlarm',
        'DynamoDBThrottleAlarm',
        'HealthCheckAlarm'
      ];

      namedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameProperty = resource.Properties.RoleName ||
                           resource.Properties.FunctionName ||
                           resource.Properties.TableName ||
                           resource.Properties.BucketName ||
                           resource.Properties.Name ||
                           resource.Properties.TopicName ||
                           resource.Properties.AlarmName;

        if (nameProperty && nameProperty['Fn::Sub']) {
          expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });

  describe('Tags Consistency', () => {
    test('all taggable resources should have Environment and Region tags', () => {
      const taggableResources = [
        'PaymentProcessorFunction',
        'TransactionLogsBucket',
        'PaymentAPISecret',
        'FailoverNotificationTopic'
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties.Tags;
        expect(tags).toBeDefined();
        expect(tags.find((t: any) => t.Key === 'Environment')).toBeDefined();
        expect(tags.find((t: any) => t.Key === 'Region')).toBeDefined();
      });
    });
  });

  describe('No Circular Dependencies', () => {
    test('should not have circular dependency between S3ReplicationRole and TransactionLogsBucket', () => {
      const role = template.Resources.S3ReplicationRole;
      const bucket = template.Resources.TransactionLogsBucket;

      // Check that role doesn't use Fn::GetAtt for bucket
      const rolePolicy = role.Properties.Policies[0].PolicyDocument.Statement[0].Resource;
      expect(rolePolicy['Fn::Sub']).toBeDefined();
      expect(rolePolicy['Fn::Sub']).not.toContain('TransactionLogsBucket.Arn');

      // Check that bucket uses Fn::GetAtt for role (which is OK in this direction)
      const replicationConfig = bucket.Properties.ReplicationConfiguration['Fn::If'][1];
      expect(replicationConfig.Role['Fn::GetAtt']).toBeDefined();
    });
  });
});
