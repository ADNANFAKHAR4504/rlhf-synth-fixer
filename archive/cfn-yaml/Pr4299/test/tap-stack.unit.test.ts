import fs from 'fs';
import path from 'path';

describe('Manufacturing IoT Data Processing Pipeline - CloudFormation Template', () => {
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

    test('should have description for IoT pipeline', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe('Manufacturing IoT Data Processing Pipeline with Real-Time Analytics');
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
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe('Environment suffix for resource naming (e.g., dev, staging, prod)');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe('Must contain only alphanumeric characters');
    });
  });

  describe('S3 Bucket - RawDataBucket', () => {
    test('should exist and be of correct type', () => {
      expect(template.Resources.RawDataBucket).toBeDefined();
      expect(template.Resources.RawDataBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have correct deletion policies', () => {
      const bucket = template.Resources.RawDataBucket;
      expect(bucket.DeletionPolicy).toBe('Delete');
      expect(bucket.UpdateReplacePolicy).toBe('Delete');
    });

    test('should have bucket name with environment suffix', () => {
      const bucket = template.Resources.RawDataBucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'iot-raw-data-${EnvironmentSuffix}'
      });
    });

    test('should have encryption enabled', () => {
      const bucket = template.Resources.RawDataBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should have lifecycle configuration with transitions', () => {
      const bucket = template.Resources.RawDataBucket;
      const rules = bucket.Properties.LifecycleConfiguration.Rules;
      expect(rules).toHaveLength(1);
      expect(rules[0].Status).toBe('Enabled');
      expect(rules[0].Transitions).toHaveLength(2);
      expect(rules[0].Transitions[0].TransitionInDays).toBe(30);
      expect(rules[0].Transitions[0].StorageClass).toBe('STANDARD_IA');
      expect(rules[0].Transitions[1].TransitionInDays).toBe(90);
      expect(rules[0].Transitions[1].StorageClass).toBe('GLACIER');
    });

    test('should block public access', () => {
      const bucket = template.Resources.RawDataBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('DynamoDB Table - SensorDataTable', () => {
    test('should exist and be of correct type', () => {
      expect(template.Resources.SensorDataTable).toBeDefined();
      expect(template.Resources.SensorDataTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should have correct deletion policies', () => {
      const table = template.Resources.SensorDataTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });

    test('should have table name with environment suffix', () => {
      const table = template.Resources.SensorDataTable;
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'SensorData-${EnvironmentSuffix}'
      });
    });

    test('should use PAY_PER_REQUEST billing mode', () => {
      const table = template.Resources.SensorDataTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should have correct attribute definitions', () => {
      const table = template.Resources.SensorDataTable;
      const attributeDefinitions = table.Properties.AttributeDefinitions;
      expect(attributeDefinitions).toHaveLength(2);
      expect(attributeDefinitions[0].AttributeName).toBe('deviceId');
      expect(attributeDefinitions[0].AttributeType).toBe('S');
      expect(attributeDefinitions[1].AttributeName).toBe('timestamp');
      expect(attributeDefinitions[1].AttributeType).toBe('N');
    });

    test('should have correct key schema', () => {
      const table = template.Resources.SensorDataTable;
      const keySchema = table.Properties.KeySchema;
      expect(keySchema).toHaveLength(2);
      expect(keySchema[0].AttributeName).toBe('deviceId');
      expect(keySchema[0].KeyType).toBe('HASH');
      expect(keySchema[1].AttributeName).toBe('timestamp');
      expect(keySchema[1].KeyType).toBe('RANGE');
    });

    test('should have encryption enabled', () => {
      const table = template.Resources.SensorDataTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('should have TTL enabled', () => {
      const table = template.Resources.SensorDataTable;
      expect(table.Properties.TimeToLiveSpecification.Enabled).toBe(true);
      expect(table.Properties.TimeToLiveSpecification.AttributeName).toBe('ttl');
    });
  });

  describe('Kinesis Stream - SensorDataStream', () => {
    test('should exist and be of correct type', () => {
      expect(template.Resources.SensorDataStream).toBeDefined();
      expect(template.Resources.SensorDataStream.Type).toBe('AWS::Kinesis::Stream');
    });

    test('should have correct deletion policies', () => {
      const stream = template.Resources.SensorDataStream;
      expect(stream.DeletionPolicy).toBe('Delete');
      expect(stream.UpdateReplacePolicy).toBe('Delete');
    });

    test('should have stream name with environment suffix', () => {
      const stream = template.Resources.SensorDataStream;
      expect(stream.Properties.Name).toEqual({
        'Fn::Sub': 'sensor-data-stream-${EnvironmentSuffix}'
      });
    });

    test('should have correct shard count and retention', () => {
      const stream = template.Resources.SensorDataStream;
      expect(stream.Properties.ShardCount).toBe(1);
      expect(stream.Properties.RetentionPeriodHours).toBe(24);
    });

    test('should use PROVISIONED stream mode', () => {
      const stream = template.Resources.SensorDataStream;
      expect(stream.Properties.StreamModeDetails.StreamMode).toBe('PROVISIONED');
    });
  });

  describe('IAM Role - DataProcessorRole', () => {
    test('should exist and be of correct type', () => {
      expect(template.Resources.DataProcessorRole).toBeDefined();
      expect(template.Resources.DataProcessorRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have role name with environment suffix', () => {
      const role = template.Resources.DataProcessorRole;
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': 'IoTDataProcessorRole-${EnvironmentSuffix}'
      });
    });

    test('should have Lambda service as principal', () => {
      const role = template.Resources.DataProcessorRole;
      const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Principal.Service).toBe('lambda.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('should have AWSLambdaBasicExecutionRole managed policy', () => {
      const role = template.Resources.DataProcessorRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });

    test('should have Kinesis read permissions', () => {
      const role = template.Resources.DataProcessorRole;
      const policies = role.Properties.Policies;
      const kinesisPolicy = policies.find((p: any) => p.PolicyName === 'KinesisReadPolicy');
      expect(kinesisPolicy).toBeDefined();
      const actions = kinesisPolicy.PolicyDocument.Statement[0].Action;
      expect(actions).toContain('kinesis:GetRecords');
      expect(actions).toContain('kinesis:GetShardIterator');
      expect(actions).toContain('kinesis:DescribeStream');
    });

    test('should have DynamoDB write permissions', () => {
      const role = template.Resources.DataProcessorRole;
      const policies = role.Properties.Policies;
      const dynamoPolicy = policies.find((p: any) => p.PolicyName === 'DynamoDBWritePolicy');
      expect(dynamoPolicy).toBeDefined();
      const actions = dynamoPolicy.PolicyDocument.Statement[0].Action;
      expect(actions).toContain('dynamodb:PutItem');
      expect(actions).toContain('dynamodb:UpdateItem');
      expect(actions).toContain('dynamodb:BatchWriteItem');
    });

    test('should have S3 write permissions', () => {
      const role = template.Resources.DataProcessorRole;
      const policies = role.Properties.Policies;
      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3WritePolicy');
      expect(s3Policy).toBeDefined();
      const actions = s3Policy.PolicyDocument.Statement[0].Action;
      expect(actions).toContain('s3:PutObject');
      expect(actions).toContain('s3:PutObjectAcl');
    });

    test('should have CloudWatch metrics permissions', () => {
      const role = template.Resources.DataProcessorRole;
      const policies = role.Properties.Policies;
      const cwPolicy = policies.find((p: any) => p.PolicyName === 'CloudWatchMetricsPolicy');
      expect(cwPolicy).toBeDefined();
      const actions = cwPolicy.PolicyDocument.Statement[0].Action;
      expect(actions).toContain('cloudwatch:PutMetricData');
    });
  });

  describe('Lambda Function - DataProcessorFunction', () => {
    test('should exist and be of correct type', () => {
      expect(template.Resources.DataProcessorFunction).toBeDefined();
      expect(template.Resources.DataProcessorFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should have correct deletion policy', () => {
      const func = template.Resources.DataProcessorFunction;
      expect(func.DeletionPolicy).toBe('Delete');
    });

    test('should have function name with environment suffix', () => {
      const func = template.Resources.DataProcessorFunction;
      expect(func.Properties.FunctionName).toEqual({
        'Fn::Sub': 'iot-data-processor-${EnvironmentSuffix}'
      });
    });

    test('should use nodejs20.x runtime', () => {
      const func = template.Resources.DataProcessorFunction;
      expect(func.Properties.Runtime).toBe('nodejs20.x');
    });

    test('should have correct handler', () => {
      const func = template.Resources.DataProcessorFunction;
      expect(func.Properties.Handler).toBe('index.handler');
    });

    test('should have correct timeout and memory', () => {
      const func = template.Resources.DataProcessorFunction;
      expect(func.Properties.Timeout).toBe(60);
      expect(func.Properties.MemorySize).toBe(256);
    });

    test('should have required environment variables', () => {
      const func = template.Resources.DataProcessorFunction;
      const envVars = func.Properties.Environment.Variables;
      expect(envVars.DYNAMODB_TABLE).toBeDefined();
      expect(envVars.S3_BUCKET).toBeDefined();
      expect(envVars.ENVIRONMENT).toBeDefined();
      expect(envVars.TEMP_THRESHOLD_HIGH).toBe('80');
      expect(envVars.TEMP_THRESHOLD_LOW).toBe('10');
      expect(envVars.PRESSURE_THRESHOLD_HIGH).toBe('150');
      expect(envVars.PRESSURE_THRESHOLD_LOW).toBe('30');
      expect(envVars.VIBRATION_THRESHOLD).toBe('5.0');
    });

    test('should have inline code', () => {
      const func = template.Resources.DataProcessorFunction;
      expect(func.Properties.Code.ZipFile).toBeDefined();
      expect(func.Properties.Code.ZipFile.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Log Group - DataProcessorLogGroup', () => {
    test('should exist and be of correct type', () => {
      expect(template.Resources.DataProcessorLogGroup).toBeDefined();
      expect(template.Resources.DataProcessorLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have correct deletion policies', () => {
      const logGroup = template.Resources.DataProcessorLogGroup;
      expect(logGroup.DeletionPolicy).toBe('Delete');
      expect(logGroup.UpdateReplacePolicy).toBe('Delete');
    });

    test('should have log group name matching Lambda function', () => {
      const logGroup = template.Resources.DataProcessorLogGroup;
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/iot-data-processor-${EnvironmentSuffix}'
      });
    });

    test('should have 7-day retention', () => {
      const logGroup = template.Resources.DataProcessorLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(7);
    });
  });

  describe('Event Source Mapping - KinesisEventSourceMapping', () => {
    test('should exist and be of correct type', () => {
      expect(template.Resources.KinesisEventSourceMapping).toBeDefined();
      expect(template.Resources.KinesisEventSourceMapping.Type).toBe('AWS::Lambda::EventSourceMapping');
    });

    test('should reference Kinesis stream', () => {
      const mapping = template.Resources.KinesisEventSourceMapping;
      expect(mapping.Properties.EventSourceArn).toEqual({
        'Fn::GetAtt': ['SensorDataStream', 'Arn']
      });
    });

    test('should reference Lambda function', () => {
      const mapping = template.Resources.KinesisEventSourceMapping;
      expect(mapping.Properties.FunctionName).toEqual({
        'Fn::GetAtt': ['DataProcessorFunction', 'Arn']
      });
    });

    test('should have correct batch configuration', () => {
      const mapping = template.Resources.KinesisEventSourceMapping;
      expect(mapping.Properties.BatchSize).toBe(100);
      expect(mapping.Properties.MaximumBatchingWindowInSeconds).toBe(5);
      expect(mapping.Properties.MaximumRetryAttempts).toBe(3);
      expect(mapping.Properties.StartingPosition).toBe('LATEST');
    });

    test('should be enabled', () => {
      const mapping = template.Resources.KinesisEventSourceMapping;
      expect(mapping.Properties.Enabled).toBe(true);
    });
  });

  describe('IAM Role - IoTRuleRole', () => {
    test('should exist and be of correct type', () => {
      expect(template.Resources.IoTRuleRole).toBeDefined();
      expect(template.Resources.IoTRuleRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have IoT service as principal', () => {
      const role = template.Resources.IoTRuleRole;
      const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Principal.Service).toBe('iot.amazonaws.com');
    });

    test('should have Kinesis write permissions', () => {
      const role = template.Resources.IoTRuleRole;
      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('KinesisWritePolicy');
      const actions = policy.PolicyDocument.Statement[0].Action;
      expect(actions).toContain('kinesis:PutRecord');
      expect(actions).toContain('kinesis:PutRecords');
    });
  });

  describe('IoT Topic Rule - SensorDataRule', () => {
    test('should exist and be of correct type', () => {
      expect(template.Resources.SensorDataRule).toBeDefined();
      expect(template.Resources.SensorDataRule.Type).toBe('AWS::IoT::TopicRule');
    });

    test('should have rule name with environment suffix', () => {
      const rule = template.Resources.SensorDataRule;
      expect(rule.Properties.RuleName).toEqual({
        'Fn::Sub': 'SensorDataRule_${EnvironmentSuffix}'
      });
    });

    test('should have correct SQL query', () => {
      const rule = template.Resources.SensorDataRule;
      expect(rule.Properties.TopicRulePayload.Sql).toBe("SELECT *, timestamp() as timestamp FROM 'sensor/+/data'");
    });

    test('should be enabled', () => {
      const rule = template.Resources.SensorDataRule;
      expect(rule.Properties.TopicRulePayload.RuleDisabled).toBe(false);
    });

    test('should have Kinesis action', () => {
      const rule = template.Resources.SensorDataRule;
      const actions = rule.Properties.TopicRulePayload.Actions;
      expect(actions).toHaveLength(1);
      expect(actions[0].Kinesis).toBeDefined();
      expect(actions[0].Kinesis.PartitionKey).toBe('${deviceId}');
    });
  });

  describe('IoT Policy - SensorDevicePolicy', () => {
    test('should exist and be of correct type', () => {
      expect(template.Resources.SensorDevicePolicy).toBeDefined();
      expect(template.Resources.SensorDevicePolicy.Type).toBe('AWS::IoT::Policy');
    });

    test('should have policy name with environment suffix', () => {
      const policy = template.Resources.SensorDevicePolicy;
      expect(policy.Properties.PolicyName).toEqual({
        'Fn::Sub': 'SensorDevicePolicy-${EnvironmentSuffix}'
      });
    });

    test('should have Connect action', () => {
      const policy = template.Resources.SensorDevicePolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      const connectStatement = statements.find((s: any) => s.Action.includes('iot:Connect'));
      expect(connectStatement).toBeDefined();
    });

    test('should have Publish action', () => {
      const policy = template.Resources.SensorDevicePolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      const publishStatement = statements.find((s: any) => s.Action.includes('iot:Publish'));
      expect(publishStatement).toBeDefined();
    });

    test('should have Subscribe and Receive actions', () => {
      const policy = template.Resources.SensorDevicePolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      const subscribeStatement = statements.find((s: any) => s.Action.includes('iot:Subscribe'));
      const receiveStatement = statements.find((s: any) => s.Action.includes('iot:Receive'));
      expect(subscribeStatement).toBeDefined();
      expect(receiveStatement).toBeDefined();
    });
  });

  describe('IoT Thing - ManufacturingDevice', () => {
    test('should exist and be of correct type', () => {
      expect(template.Resources.ManufacturingDevice).toBeDefined();
      expect(template.Resources.ManufacturingDevice.Type).toBe('AWS::IoT::Thing');
    });

    test('should have thing name with environment suffix', () => {
      const thing = template.Resources.ManufacturingDevice;
      expect(thing.Properties.ThingName).toEqual({
        'Fn::Sub': 'manufacturing-device-${EnvironmentSuffix}'
      });
    });

    test('should have correct attributes', () => {
      const thing = template.Resources.ManufacturingDevice;
      const attributes = thing.Properties.AttributePayload.Attributes;
      expect(attributes.deviceType).toBe('sensor');
      expect(attributes.location).toBe('manufacturing-floor');
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have Lambda error alarm', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      expect(template.Resources.LambdaErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('Lambda error alarm should have correct configuration', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Threshold).toBe(5);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have anomaly alarm', () => {
      expect(template.Resources.AnomalyAlarm).toBeDefined();
      expect(template.Resources.AnomalyAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('Anomaly alarm should have correct configuration', () => {
      const alarm = template.Resources.AnomalyAlarm;
      expect(alarm.Properties.MetricName).toBe('AnomaliesDetected');
      expect(alarm.Properties.Namespace).toBe('IoT/Manufacturing');
      expect(alarm.Properties.Threshold).toBe(10);
    });

    test('should have Kinesis iterator age alarm', () => {
      expect(template.Resources.KinesisIteratorAgeAlarm).toBeDefined();
      expect(template.Resources.KinesisIteratorAgeAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('Kinesis iterator age alarm should have correct configuration', () => {
      const alarm = template.Resources.KinesisIteratorAgeAlarm;
      expect(alarm.Properties.MetricName).toBe('IteratorAge');
      expect(alarm.Properties.Namespace).toBe('AWS/Kinesis');
      expect(alarm.Properties.Threshold).toBe(60000);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'SensorDataTableName',
        'RawDataBucketName',
        'KinesisStreamName',
        'DataProcessorFunctionName',
        'DataProcessorFunctionArn',
        'IoTEndpoint',
        'IoTThingName',
        'IoTTopicPattern',
        'EnvironmentSuffix'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Description).toBeDefined();
      });
    });

    test('outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Export).toBeDefined();
        expect(template.Outputs[outputKey].Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Count and Structure', () => {
    test('should have exactly 14 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(14);
    });

    test('should have exactly 1 parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have exactly 9 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(9);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all named resources should use EnvironmentSuffix', () => {
      const resourcesWithNames = [
        'RawDataBucket',
        'SensorDataTable',
        'SensorDataStream',
        'DataProcessorRole',
        'DataProcessorFunction',
        'IoTRuleRole',
        'SensorDataRule',
        'SensorDevicePolicy',
        'ManufacturingDevice',
        'LambdaErrorAlarm',
        'AnomalyAlarm',
        'KinesisIteratorAgeAlarm'
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.BucketName) {
          expect(JSON.stringify(resource.Properties.BucketName)).toContain('EnvironmentSuffix');
        } else if (resource.Properties.TableName) {
          expect(JSON.stringify(resource.Properties.TableName)).toContain('EnvironmentSuffix');
        } else if (resource.Properties.Name) {
          expect(JSON.stringify(resource.Properties.Name)).toContain('EnvironmentSuffix');
        } else if (resource.Properties.RoleName) {
          expect(JSON.stringify(resource.Properties.RoleName)).toContain('EnvironmentSuffix');
        } else if (resource.Properties.FunctionName) {
          expect(JSON.stringify(resource.Properties.FunctionName)).toContain('EnvironmentSuffix');
        } else if (resource.Properties.RuleName) {
          expect(JSON.stringify(resource.Properties.RuleName)).toContain('EnvironmentSuffix');
        } else if (resource.Properties.PolicyName) {
          expect(JSON.stringify(resource.Properties.PolicyName)).toContain('EnvironmentSuffix');
        } else if (resource.Properties.ThingName) {
          expect(JSON.stringify(resource.Properties.ThingName)).toContain('EnvironmentSuffix');
        } else if (resource.Properties.AlarmName) {
          expect(JSON.stringify(resource.Properties.AlarmName)).toContain('EnvironmentSuffix');
        }
      });
    });
  });

  describe('Deletion Policies', () => {
    test('all stateful resources should have Delete policies', () => {
      const statefulResources = [
        'RawDataBucket',
        'SensorDataTable',
        'SensorDataStream',
        'DataProcessorFunction',
        'DataProcessorLogGroup'
      ];

      statefulResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).toBe('Delete');
      });
    });
  });
});
