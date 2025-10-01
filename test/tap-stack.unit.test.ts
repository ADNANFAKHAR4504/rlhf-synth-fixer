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

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('TAP Stack');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have parameter groups in metadata', () => {
      const parameterGroups = template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
      expect(parameterGroups).toBeDefined();
      expect(parameterGroups.length).toBeGreaterThan(0);
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
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('should have ProjectName parameter', () => {
      expect(template.Parameters.ProjectName).toBeDefined();
      expect(template.Parameters.ProjectName.Type).toBe('String');
      expect(template.Parameters.ProjectName.Default).toBe('tap');
    });

    test('should have AlertEmail parameter', () => {
      expect(template.Parameters.AlertEmail).toBeDefined();
      expect(template.Parameters.AlertEmail.Type).toBe('String');
      expect(template.Parameters.AlertEmail.AllowedPattern).toBeDefined();
    });

    test('should have LogRetentionDays parameter', () => {
      expect(template.Parameters.LogRetentionDays).toBeDefined();
      expect(template.Parameters.LogRetentionDays.Type).toBe('Number');
      expect(template.Parameters.LogRetentionDays.Default).toBe(30);
    });

    test('should have DeletionProtectionEnabled parameter', () => {
      expect(template.Parameters.DeletionProtectionEnabled).toBeDefined();
      expect(template.Parameters.DeletionProtectionEnabled.Type).toBe('String');
      expect(template.Parameters.DeletionProtectionEnabled.AllowedValues).toEqual(['true', 'false']);
    });

    test('should have PointInTimeRecoveryEnabled parameter', () => {
      expect(template.Parameters.PointInTimeRecoveryEnabled).toBeDefined();
      expect(template.Parameters.PointInTimeRecoveryEnabled.Type).toBe('String');
      expect(template.Parameters.PointInTimeRecoveryEnabled.AllowedValues).toEqual(['true', 'false']);
    });
  });

  describe('Conditions', () => {
    test('should have EnableDeletionProtection condition', () => {
      expect(template.Conditions.EnableDeletionProtection).toBeDefined();
    });

    test('should have EnablePointInTimeRecovery condition', () => {
      expect(template.Conditions.EnablePointInTimeRecovery).toBeDefined();
    });
  });

  describe('KMS Resources', () => {
    test('should have KMS Key resource', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS Key should have proper key policy', () => {
      const keyPolicy = template.Resources.KMSKey.Properties.KeyPolicy;
      expect(keyPolicy).toBeDefined();
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toBeDefined();
      expect(keyPolicy.Statement.length).toBeGreaterThan(0);
    });

    test('KMS Key should allow root account permissions', () => {
      const keyPolicy = template.Resources.KMSKey.Properties.KeyPolicy;
      const rootStatement = keyPolicy.Statement.find(
        (s: any) => s.Sid === 'Enable IAM User Permissions'
      );
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Action).toBe('kms:*');
    });

    test('KMS Key should allow DynamoDB to use the key', () => {
      const keyPolicy = template.Resources.KMSKey.Properties.KeyPolicy;
      const dynamoStatement = keyPolicy.Statement.find(
        (s: any) => s.Sid === 'Allow DynamoDB to use the key'
      );
      expect(dynamoStatement).toBeDefined();
      expect(dynamoStatement.Principal.Service).toBe('dynamodb.amazonaws.com');
    });

    test('KMS Key should have proper tags', () => {
      const tags = template.Resources.KMSKey.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags.length).toBeGreaterThan(0);
      expect(tags.some((t: any) => t.Key === 'Environment')).toBe(true);
      expect(tags.some((t: any) => t.Key === 'Project')).toBe(true);
    });

    test('should have KMS Key Alias', () => {
      expect(template.Resources.KMSKeyAlias).toBeDefined();
      expect(template.Resources.KMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('KMS Key Alias should reference the KMS Key', () => {
      const alias = template.Resources.KMSKeyAlias.Properties;
      expect(alias.TargetKeyId).toEqual({ Ref: 'KMSKey' });
    });
  });

  describe('DynamoDB Table', () => {
    test('should have TurnAroundPromptTable resource', () => {
      expect(template.Resources.TurnAroundPromptTable).toBeDefined();
    });

    test('TurnAroundPromptTable should be a DynamoDB table', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('TurnAroundPromptTable should have correct deletion policies', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });

    test('TurnAroundPromptTable should have correct properties', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const properties = table.Properties;

      expect(properties.TableName).toEqual({
        'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}',
      });
      expect(properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('TurnAroundPromptTable should have KMS encryption enabled', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const sseSpec = table.Properties.SSESpecification;

      expect(sseSpec).toBeDefined();
      expect(sseSpec.SSEEnabled).toBe(true);
      expect(sseSpec.SSEType).toBe('KMS');
      expect(sseSpec.KMSMasterKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('TurnAroundPromptTable should have DynamoDB Streams enabled', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const streamSpec = table.Properties.StreamSpecification;

      expect(streamSpec).toBeDefined();
      expect(streamSpec.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('TurnAroundPromptTable should have TTL enabled', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const ttlSpec = table.Properties.TimeToLiveSpecification;

      expect(ttlSpec).toBeDefined();
      expect(ttlSpec.Enabled).toBe(true);
      expect(ttlSpec.AttributeName).toBe('ttl');
    });

    test('TurnAroundPromptTable should have Point-in-Time Recovery conditionally enabled', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const pitrSpec = table.Properties.PointInTimeRecoverySpecification;

      expect(pitrSpec).toBeDefined();
      expect(pitrSpec.PointInTimeRecoveryEnabled).toEqual({
        'Fn::If': ['EnablePointInTimeRecovery', true, false]
      });
    });

    test('TurnAroundPromptTable should have deletion protection conditionally enabled', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const deletionProtection = table.Properties.DeletionProtectionEnabled;

      expect(deletionProtection).toEqual({
        'Fn::If': ['EnableDeletionProtection', true, false]
      });
    });

    test('TurnAroundPromptTable should have correct attribute definitions', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const attributeDefinitions = table.Properties.AttributeDefinitions;

      expect(attributeDefinitions).toHaveLength(1);
      expect(attributeDefinitions[0].AttributeName).toBe('id');
      expect(attributeDefinitions[0].AttributeType).toBe('S');
    });

    test('TurnAroundPromptTable should have correct key schema', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('id');
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    test('TurnAroundPromptTable should have proper tags', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const tags = table.Properties.Tags;

      expect(tags).toBeDefined();
      expect(tags.some((t: any) => t.Key === 'Environment')).toBe(true);
      expect(tags.some((t: any) => t.Key === 'Project')).toBe(true);
      expect(tags.some((t: any) => t.Key === 'ManagedBy')).toBe(true);
    });
  });

  describe('SNS Topic', () => {
    test('should have SNS Topic resource', () => {
      expect(template.Resources.SNSTopic).toBeDefined();
      expect(template.Resources.SNSTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('SNS Topic should have KMS encryption', () => {
      const topic = template.Resources.SNSTopic.Properties;
      expect(topic.KmsMasterKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('SNS Topic should have email subscription', () => {
      const topic = template.Resources.SNSTopic.Properties;
      expect(topic.Subscription).toBeDefined();
      expect(topic.Subscription.length).toBeGreaterThan(0);
      expect(topic.Subscription[0].Protocol).toBe('email');
      expect(topic.Subscription[0].Endpoint).toEqual({ Ref: 'AlertEmail' });
    });

    test('SNS Topic should have proper naming', () => {
      const topic = template.Resources.SNSTopic.Properties;
      expect(topic.TopicName).toEqual({
        'Fn::Sub': '${ProjectName}-${EnvironmentSuffix}-alerts'
      });
    });

    test('SNS Topic should have proper tags', () => {
      const tags = template.Resources.SNSTopic.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags.some((t: any) => t.Key === 'Environment')).toBe(true);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have DynamoDB Throttle Alarm', () => {
      expect(template.Resources.DynamoDBThrottleAlarm).toBeDefined();
      expect(template.Resources.DynamoDBThrottleAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('DynamoDB Throttle Alarm should monitor UserErrors metric', () => {
      const alarm = template.Resources.DynamoDBThrottleAlarm.Properties;
      expect(alarm.MetricName).toBe('UserErrors');
      expect(alarm.Namespace).toBe('AWS/DynamoDB');
      expect(alarm.Statistic).toBe('Sum');
    });

    test('DynamoDB Throttle Alarm should have correct threshold', () => {
      const alarm = template.Resources.DynamoDBThrottleAlarm.Properties;
      expect(alarm.Threshold).toBe(10);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('DynamoDB Throttle Alarm should reference table', () => {
      const alarm = template.Resources.DynamoDBThrottleAlarm.Properties;
      expect(alarm.Dimensions).toBeDefined();
      expect(alarm.Dimensions[0].Name).toBe('TableName');
      expect(alarm.Dimensions[0].Value).toEqual({ Ref: 'TurnAroundPromptTable' });
    });

    test('DynamoDB Throttle Alarm should send to SNS topic', () => {
      const alarm = template.Resources.DynamoDBThrottleAlarm.Properties;
      expect(alarm.AlarmActions).toBeDefined();
      expect(alarm.AlarmActions[0]).toEqual({ Ref: 'SNSTopic' });
    });

    test('should have DynamoDB System Error Alarm', () => {
      expect(template.Resources.DynamoDBSystemErrorAlarm).toBeDefined();
      expect(template.Resources.DynamoDBSystemErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('DynamoDB System Error Alarm should monitor SystemErrors', () => {
      const alarm = template.Resources.DynamoDBSystemErrorAlarm.Properties;
      expect(alarm.MetricName).toBe('SystemErrors');
      expect(alarm.Namespace).toBe('AWS/DynamoDB');
    });

    test('should have DynamoDB Read Throttle Alarm', () => {
      expect(template.Resources.DynamoDBReadThrottleAlarm).toBeDefined();
      expect(template.Resources.DynamoDBReadThrottleAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('DynamoDB Read Throttle Alarm should monitor ReadThrottleEvents', () => {
      const alarm = template.Resources.DynamoDBReadThrottleAlarm.Properties;
      expect(alarm.MetricName).toBe('ReadThrottleEvents');
    });

    test('should have DynamoDB Write Throttle Alarm', () => {
      expect(template.Resources.DynamoDBWriteThrottleAlarm).toBeDefined();
      expect(template.Resources.DynamoDBWriteThrottleAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('DynamoDB Write Throttle Alarm should monitor WriteThrottleEvents', () => {
      const alarm = template.Resources.DynamoDBWriteThrottleAlarm.Properties;
      expect(alarm.MetricName).toBe('WriteThrottleEvents');
    });

    test('all alarms should treat missing data as notBreaching', () => {
      const alarms = [
        'DynamoDBThrottleAlarm',
        'DynamoDBSystemErrorAlarm',
        'DynamoDBReadThrottleAlarm',
        'DynamoDBWriteThrottleAlarm'
      ];

      alarms.forEach(alarmName => {
        const alarm = template.Resources[alarmName].Properties;
        expect(alarm.TreatMissingData).toBe('notBreaching');
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('should have CloudWatch Dashboard resource', () => {
      expect(template.Resources.CloudWatchDashboard).toBeDefined();
      expect(template.Resources.CloudWatchDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('CloudWatch Dashboard should have proper naming', () => {
      const dashboard = template.Resources.CloudWatchDashboard.Properties;
      expect(dashboard.DashboardName).toEqual({
        'Fn::Sub': '${ProjectName}-${EnvironmentSuffix}-dashboard'
      });
    });

    test('CloudWatch Dashboard should have valid JSON body', () => {
      const dashboard = template.Resources.CloudWatchDashboard.Properties;
      expect(dashboard.DashboardBody).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'TurnAroundPromptTableStreamArn',
        'KMSKeyId',
        'KMSKeyArn',
        'SNSTopicArn',
        'DashboardURL',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('TurnAroundPromptTableName output should be correct', () => {
      const output = template.Outputs.TurnAroundPromptTableName;
      expect(output.Description).toBe('Name of the DynamoDB table');
      expect(output.Value).toEqual({ Ref: 'TurnAroundPromptTable' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-TurnAroundPromptTableName',
      });
    });

    test('TurnAroundPromptTableArn output should be correct', () => {
      const output = template.Outputs.TurnAroundPromptTableArn;
      expect(output.Description).toBe('ARN of the DynamoDB table');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['TurnAroundPromptTable', 'Arn'],
      });
    });

    test('TurnAroundPromptTableStreamArn output should be correct', () => {
      const output = template.Outputs.TurnAroundPromptTableStreamArn;
      expect(output.Description).toBe('Stream ARN of the DynamoDB table');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['TurnAroundPromptTable', 'StreamArn'],
      });
    });

    test('KMSKeyId output should be correct', () => {
      const output = template.Outputs.KMSKeyId;
      expect(output.Description).toBe('KMS Key ID for encryption');
      expect(output.Value).toEqual({ Ref: 'KMSKey' });
    });

    test('KMSKeyArn output should be correct', () => {
      const output = template.Outputs.KMSKeyArn;
      expect(output.Description).toBe('KMS Key ARN for encryption');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['KMSKey', 'Arn'],
      });
    });

    test('SNSTopicArn output should be correct', () => {
      const output = template.Outputs.SNSTopicArn;
      expect(output.Description).toBe('SNS Topic ARN for alerts');
      expect(output.Value).toEqual({ Ref: 'SNSTopic' });
    });

    test('DashboardURL output should be correct', () => {
      const output = template.Outputs.DashboardURL;
      expect(output.Description).toBe('CloudWatch Dashboard URL');
      expect(output.Value).toBeDefined();
      expect(output.Value['Fn::Sub']).toContain('cloudwatch');
    });

    test('StackName output should be correct', () => {
      const output = template.Outputs.StackName;
      expect(output.Description).toBe('Name of this CloudFormation stack');
      expect(output.Value).toEqual({ Ref: 'AWS::StackName' });
    });

    test('EnvironmentSuffix output should be correct', () => {
      const output = template.Outputs.EnvironmentSuffix;
      expect(output.Description).toBe('Environment suffix used for this deployment');
      expect(output.Value).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (outputKey !== 'DashboardURL') {
          expect(output.Export).toBeDefined();
          expect(output.Export.Name).toBeDefined();
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

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(5);
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(6);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(9);
    });

    test('should have conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(Object.keys(template.Conditions).length).toBeGreaterThan(0);
    });
  });

  describe('Resource Naming Convention', () => {
    test('table name should follow naming convention with environment suffix', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const tableName = table.Properties.TableName;

      expect(tableName).toEqual({
        'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}',
      });
    });

    test('SNS topic name should follow naming convention', () => {
      const topic = template.Resources.SNSTopic;
      const topicName = topic.Properties.TopicName;

      expect(topicName).toEqual({
        'Fn::Sub': '${ProjectName}-${EnvironmentSuffix}-alerts'
      });
    });

    test('KMS alias should follow naming convention', () => {
      const alias = template.Resources.KMSKeyAlias;
      const aliasName = alias.Properties.AliasName;

      expect(aliasName).toEqual({
        'Fn::Sub': 'alias/${ProjectName}-${EnvironmentSuffix}'
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

  describe('Security Best Practices', () => {
    test('DynamoDB table should have encryption enabled', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const sseSpec = table.Properties.SSESpecification;

      expect(sseSpec.SSEEnabled).toBe(true);
      expect(sseSpec.SSEType).toBe('KMS');
    });

    test('SNS topic should have encryption enabled', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic.Properties.KmsMasterKeyId).toBeDefined();
    });

    test('KMS key should have proper key policy', () => {
      const keyPolicy = template.Resources.KMSKey.Properties.KeyPolicy;
      expect(keyPolicy).toBeDefined();
      expect(keyPolicy.Statement).toBeDefined();
      expect(keyPolicy.Statement.length).toBeGreaterThan(0);
    });

    test('all resources should have proper tags', () => {
      const resourcesWithTags = ['KMSKey', 'TurnAroundPromptTable', 'SNSTopic'];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        expect(resource.Properties.Tags.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Monitoring Best Practices', () => {
    test('should have multiple CloudWatch alarms', () => {
      const alarms = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::CloudWatch::Alarm'
      );
      expect(alarms.length).toBeGreaterThanOrEqual(4);
    });

    test('all alarms should send notifications to SNS', () => {
      const alarms = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::CloudWatch::Alarm'
      );

      alarms.forEach(alarmName => {
        const alarm = template.Resources[alarmName].Properties;
        expect(alarm.AlarmActions).toBeDefined();
        expect(alarm.AlarmActions.length).toBeGreaterThan(0);
      });
    });

    test('should have CloudWatch dashboard for monitoring', () => {
      const dashboards = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::CloudWatch::Dashboard'
      );
      expect(dashboards.length).toBe(1);
    });
  });

  describe('High Availability and Resilience', () => {
    test('DynamoDB should use on-demand billing for automatic scaling', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('DynamoDB should have streams enabled for data replication', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.StreamSpecification).toBeDefined();
      expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('DynamoDB should have TTL for automatic data cleanup', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.TimeToLiveSpecification).toBeDefined();
      expect(table.Properties.TimeToLiveSpecification.Enabled).toBe(true);
    });
  });
});
