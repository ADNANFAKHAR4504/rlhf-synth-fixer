import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Define comprehensive CloudFormation YAML types
const CloudFormationSchema = yaml.DEFAULT_SCHEMA.extend([
  new yaml.Type('!Ref', {
    kind: 'scalar',
    construct: (data) => ({ Ref: data }),
  }),
  new yaml.Type('!Sub', {
    kind: 'scalar',
    construct: (data) => ({ 'Fn::Sub': data }),
  }),
  new yaml.Type('!GetAtt', {
    kind: 'scalar',
    construct: (data) => {
      // Handle GetAtt with dot notation (e.g., !GetAtt Resource.Property)
      const parts = data.split('.');
      return { 'Fn::GetAtt': parts };
    },
  }),
  new yaml.Type('!Join', {
    kind: 'sequence',
    construct: (data) => ({ 'Fn::Join': data }),
  }),
  new yaml.Type('!Select', {
    kind: 'sequence',
    construct: (data) => ({ 'Fn::Select': data }),
  }),
  new yaml.Type('!Split', {
    kind: 'sequence',
    construct: (data) => ({ 'Fn::Split': data }),
  }),
  new yaml.Type('!Base64', {
    kind: 'scalar',
    construct: (data) => ({ 'Fn::Base64': data }),
  }),
  new yaml.Type('!GetAZs', {
    kind: 'scalar',
    construct: (data) => ({ 'Fn::GetAZs': data }),
  }),
  new yaml.Type('!ImportValue', {
    kind: 'scalar',
    construct: (data) => ({ 'Fn::ImportValue': data }),
  }),
  new yaml.Type('!FindInMap', {
    kind: 'sequence',
    construct: (data) => ({ 'Fn::FindInMap': data }),
  }),
  new yaml.Type('!Equals', {
    kind: 'sequence',
    construct: (data) => ({ 'Fn::Equals': data }),
  }),
  new yaml.Type('!If', {
    kind: 'sequence',
    construct: (data) => ({ 'Fn::If': data }),
  }),
  new yaml.Type('!Not', {
    kind: 'sequence',
    construct: (data) => ({ 'Fn::Not': data }),
  }),
  new yaml.Type('!And', {
    kind: 'sequence',
    construct: (data) => ({ 'Fn::And': data }),
  }),
  new yaml.Type('!Or', {
    kind: 'sequence',
    construct: (data) => ({ 'Fn::Or': data }),
  }),
]);

describe('IoT Analytics CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the YAML template with CloudFormation schema and safe options
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');

    try {
      template = yaml.load(templateContent, {
        schema: CloudFormationSchema,
        filename: templatePath
      });
    } catch (error) {
      console.error('Error parsing YAML template:', error);
      throw error;
    }
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'IoT Analytics and Dashboard System for Smart City Traffic Monitoring'
      );
    });

    test('should not contain hardcoded values', () => {
      const templateStr = JSON.stringify(template);
      // Check for common hardcoded patterns
      expect(templateStr).not.toMatch(/123456789/); // Account ID
      expect(templateStr).not.toMatch(/us-east-1(?!.*amazonaws\.com)/); // Region (except in service URLs)
      expect(templateStr).not.toMatch(/arn:aws:[^:]+:[^:]+:[0-9]{12}:/); // ARNs with hardcoded account
    });

    test('should have iac-rlhf-amazon tags on all taggable resources', () => {
      const taggableResources = [
        'TrafficDataStream', 'TrafficAnalyticsTable', 'TrafficProcessorFunction',
        'TrafficEventBus', 'TrafficAlertsTopic'
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource) {
          expect(resource.Properties.Tags).toBeDefined();
          const projectTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Project');
          expect(projectTag).toBeDefined();
          expect(projectTag.Value).toBe('iac-rlhf-amazon');
        }
      });
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'EnvironmentSuffix',
        'EnvironmentName',
        'KinesisShardCount',
        'DynamoDBReadCapacity',
        'DynamoDBWriteCapacity',
        'AlertThresholdCongestionIndex',
        'NotificationEmail'
      ];

      expectedParams.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });

    test('KinesisShardCount parameter should have correct constraints', () => {
      const param = template.Parameters.KinesisShardCount;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(10);
      expect(param.MinValue).toBe(1);
      expect(param.MaxValue).toBe(100);
    });

    test('AlertThresholdCongestionIndex parameter should have correct constraints', () => {
      const param = template.Parameters.AlertThresholdCongestionIndex;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(80);
      expect(param.MinValue).toBe(0);
      expect(param.MaxValue).toBe(100);
    });
  });

  describe('IoT Core Resources', () => {
    test('should have IoT Policy', () => {
      expect(template.Resources.IoTPolicy).toBeDefined();
      expect(template.Resources.IoTPolicy.Type).toBe('AWS::IoT::Policy');
      expect(template.Resources.IoTPolicy.DeletionPolicy).toBe('Delete');
    });

    test('should have IoT Topic Rule', () => {
      expect(template.Resources.IoTTopicRule).toBeDefined();
      expect(template.Resources.IoTTopicRule.Type).toBe('AWS::IoT::TopicRule');
      expect(template.Resources.IoTTopicRule.DeletionPolicy).toBe('Delete');
    });

    test('should have IoT Rule Role', () => {
      expect(template.Resources.IoTRuleRole).toBeDefined();
      expect(template.Resources.IoTRuleRole.Type).toBe('AWS::IAM::Role');
      expect(template.Resources.IoTRuleRole.DeletionPolicy).toBe('Delete');
    });

    test('IoT Policy should include environment suffix in name', () => {
      const policy = template.Resources.IoTPolicy;
      expect(policy.Properties.PolicyName).toEqual({
        'Fn::Sub': 'TapStack${EnvironmentSuffix}-TrafficSensorPolicy'
      });
    });
  });

  describe('Kinesis Resources', () => {
    test('should have Kinesis Data Stream', () => {
      expect(template.Resources.KinesisDataStream).toBeDefined();
      expect(template.Resources.KinesisDataStream.Type).toBe('AWS::Kinesis::Stream');
      expect(template.Resources.KinesisDataStream.DeletionPolicy).toBe('Delete');
    });

    test('Kinesis stream should have correct properties', () => {
      const stream = template.Resources.KinesisDataStream;
      expect(stream.Properties.Name).toEqual({
        'Fn::Sub': 'TapStack${EnvironmentSuffix}-TrafficDataStream'
      });
      expect(stream.Properties.ShardCount).toEqual({ Ref: 'KinesisShardCount' });
      expect(stream.Properties.RetentionPeriodHours).toBe(24);
    });

    test('Kinesis stream should have encryption enabled', () => {
      const stream = template.Resources.KinesisDataStream;
      expect(stream.Properties.StreamEncryption.EncryptionType).toBe('KMS');
      expect(stream.Properties.StreamEncryption.KeyId).toBe('alias/aws/kinesis');
    });
  });

  describe('Lambda Resources', () => {
    test('should have Lambda function', () => {
      expect(template.Resources.ProcessingLambdaFunction).toBeDefined();
      expect(template.Resources.ProcessingLambdaFunction.Type).toBe('AWS::Lambda::Function');
      expect(template.Resources.ProcessingLambdaFunction.DeletionPolicy).toBe('Delete');
    });

    test('should have Lambda execution role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
      expect(template.Resources.LambdaExecutionRole.DeletionPolicy).toBe('Delete');
    });

    test('should have Kinesis event source mapping', () => {
      expect(template.Resources.KinesisEventSourceMapping).toBeDefined();
      expect(template.Resources.KinesisEventSourceMapping.Type).toBe('AWS::Lambda::EventSourceMapping');
      expect(template.Resources.KinesisEventSourceMapping.DeletionPolicy).toBe('Delete');
    });

    test('Lambda function should have correct handler and runtime', () => {
      const lambda = template.Resources.ProcessingLambdaFunction;
      expect(lambda.Properties.Runtime).toBe('python3.9');
      expect(lambda.Properties.Handler).toBe('lambda_handler.lambda_handler');
      expect(lambda.Properties.FunctionName).toEqual({
        'Fn::Sub': 'TapStack${EnvironmentSuffix}-TrafficDataProcessor'
      });
    });

    test('should have dashboard metrics Lambda function', () => {
      expect(template.Resources.DashboardMetricsFunction).toBeDefined();
      expect(template.Resources.DashboardMetricsFunction.Type).toBe('AWS::Lambda::Function');
      expect(template.Resources.DashboardMetricsFunction.DeletionPolicy).toBe('Delete');
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have Traffic Analytics Table', () => {
      expect(template.Resources.TrafficAnalyticsTable).toBeDefined();
      expect(template.Resources.TrafficAnalyticsTable.Type).toBe('AWS::DynamoDB::Table');
      expect(template.Resources.TrafficAnalyticsTable.DeletionPolicy).toBe('Delete');
    });

    test('DynamoDB table should have correct naming and structure', () => {
      const table = template.Resources.TrafficAnalyticsTable;
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'TapStack${EnvironmentSuffix}-TrafficAnalytics'
      });
      expect(table.Properties.BillingMode).toBe('PROVISIONED');
    });

    test('DynamoDB table should have correct key schema', () => {
      const table = template.Resources.TrafficAnalyticsTable;
      const keySchema = table.Properties.KeySchema;
      expect(keySchema).toHaveLength(2);
      expect(keySchema[0]).toEqual({ AttributeName: 'sensor_id', KeyType: 'HASH' });
      expect(keySchema[1]).toEqual({ AttributeName: 'timestamp', KeyType: 'RANGE' });
    });

    test('DynamoDB table should have Global Secondary Index', () => {
      const table = template.Resources.TrafficAnalyticsTable;
      const gsis = table.Properties.GlobalSecondaryIndexes;
      expect(gsis).toHaveLength(1);
      expect(gsis[0].IndexName).toBe('zone-timestamp-index');
    });

    test('DynamoDB table should have TTL enabled', () => {
      const table = template.Resources.TrafficAnalyticsTable;
      expect(table.Properties.TimeToLiveSpecification.AttributeName).toBe('ttl');
      expect(table.Properties.TimeToLiveSpecification.Enabled).toBe(true);
    });
  });

  describe('EventBridge and SNS Resources', () => {
    test('should have EventBridge custom event bus', () => {
      expect(template.Resources.CongestionEventBus).toBeDefined();
      expect(template.Resources.CongestionEventBus.Type).toBe('AWS::Events::EventBus');
      expect(template.Resources.CongestionEventBus.DeletionPolicy).toBe('Delete');
    });

    test('should have EventBridge rule', () => {
      expect(template.Resources.CongestionAlertRule).toBeDefined();
      expect(template.Resources.CongestionAlertRule.Type).toBe('AWS::Events::Rule');
      expect(template.Resources.CongestionAlertRule.DeletionPolicy).toBe('Delete');
    });

    test('should have SNS topic', () => {
      expect(template.Resources.AlertTopic).toBeDefined();
      expect(template.Resources.AlertTopic.Type).toBe('AWS::SNS::Topic');
      expect(template.Resources.AlertTopic.DeletionPolicy).toBe('Delete');
    });

    test('should have SNS email subscription', () => {
      expect(template.Resources.AlertEmailSubscription).toBeDefined();
      expect(template.Resources.AlertEmailSubscription.Type).toBe('AWS::SNS::Subscription');
      expect(template.Resources.AlertEmailSubscription.DeletionPolicy).toBe('Delete');
    });

    test('EventBridge event bus should have correct name', () => {
      const eventBus = template.Resources.CongestionEventBus;
      expect(eventBus.Properties.Name).toEqual({
        'Fn::Sub': 'TapStack${EnvironmentSuffix}-CongestionAlerts'
      });
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have CloudWatch log groups', () => {
      expect(template.Resources.IoTErrorLogGroup).toBeDefined();
      expect(template.Resources.LambdaLogGroup).toBeDefined();
      expect(template.Resources.IoTErrorLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.LambdaLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have CloudWatch alarms', () => {
      expect(template.Resources.ProcessingErrorsAlarm).toBeDefined();
      expect(template.Resources.KinesisIncomingRecordsAlarm).toBeDefined();
      expect(template.Resources.ProcessingErrorsAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(template.Resources.KinesisIncomingRecordsAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('CloudWatch log groups should have correct retention', () => {
      const iotLogGroup = template.Resources.IoTErrorLogGroup;
      const lambdaLogGroup = template.Resources.LambdaLogGroup;
      expect(iotLogGroup.Properties.RetentionInDays).toBe(7);
      expect(lambdaLogGroup.Properties.RetentionInDays).toBe(7);
    });
  });

  describe('QuickSight Resources', () => {
    test('should have QuickSight data source role', () => {
      expect(template.Resources.QuickSightDataSourceRole).toBeDefined();
      expect(template.Resources.QuickSightDataSourceRole.Type).toBe('AWS::IAM::Role');
      expect(template.Resources.QuickSightDataSourceRole.DeletionPolicy).toBe('Delete');
    });

    test('QuickSight role should have correct name', () => {
      const role = template.Resources.QuickSightDataSourceRole;
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': 'TapStack${EnvironmentSuffix}-QuickSightDataSourceRole'
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'IoTEndpoint',
        'KinesisStreamArn',
        'DynamoDBTableName',
        'QuickSightDataSourceRoleArn',
        'AlertTopicArn',
        'DashboardMetricsNamespace',
        'LambdaFunctionName',
        'EventBusName'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('IoTEndpoint output should be correct', () => {
      const output = template.Outputs.IoTEndpoint;
      expect(output.Description).toBe('AWS IoT Core endpoint for device connections');
      expect(output.Value).toEqual({
        'Fn::Sub': 'https://${AWS::AccountId}.iot.${AWS::Region}.amazonaws.com'
      });
    });

    test('DynamoDBTableName output should be correct', () => {
      const output = template.Outputs.DynamoDBTableName;
      expect(output.Description).toBe('Name of the DynamoDB table storing analytics data');
      expect(output.Value).toEqual({ Ref: 'TrafficAnalyticsTable' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-DynamoDBTableName'
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

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(7);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should include environment suffix', () => {
      const resourcesWithSuffix = [
        'IoTPolicy',
        'IoTTopicRule',
        'IoTRuleRole',
        'KinesisDataStream',
        'LambdaExecutionRole',
        'ProcessingLambdaFunction',
        'TrafficAnalyticsTable',
        'CongestionEventBus',
        'CongestionAlertRule',
        'AlertTopic',
        'QuickSightDataSourceRole',
        'DashboardMetricsFunction',
        'MetricsScheduleRule'
      ];

      resourcesWithSuffix.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource).toBeDefined();
      });
    });

    test('all resources should have deletion policy', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).toBe('Delete');
        expect(resource.UpdateReplacePolicy).toBe('Delete');
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export) {
          expect(output.Export.Name).toEqual({
            'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
          });
        }
      });
    });
  });

  describe('Security Configuration', () => {
    test('DynamoDB should have encryption enabled', () => {
      const table = template.Resources.TrafficAnalyticsTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('SNS should have KMS encryption', () => {
      const topic = template.Resources.AlertTopic;
      expect(topic.Properties.KmsMasterKeyId).toBe('alias/aws/sns');
    });

    test('IAM roles should have least privilege policies', () => {
      const lambdaRole = template.Resources.LambdaExecutionRole;
      expect(lambdaRole.Properties.Policies).toBeDefined();
      expect(lambdaRole.Properties.Policies.length).toBeGreaterThan(0);
    });
  });
});
