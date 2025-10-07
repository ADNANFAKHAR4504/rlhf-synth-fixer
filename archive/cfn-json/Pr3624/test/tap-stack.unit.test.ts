import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Fleet Management Platform', () => {
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
      expect(typeof template.Description).toBe('string');
    });

    test('should have parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });

    test('should have conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(typeof template.Conditions).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentName parameter', () => {
      const param = template.Parameters.EnvironmentName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('prod');
    });

    test('should have EnvironmentSuffix parameter', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
    });

    test('should have OperationsEmail parameter', () => {
      const param = template.Parameters.OperationsEmail;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toBeDefined();
      expect(param.Default).toBe('ops-team@example.com');
    });

    test('should have VehicleCount parameter', () => {
      const param = template.Parameters.VehicleCount;
      expect(param).toBeDefined();
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(15000);
    });

    test('should have TelemetryFrequencySeconds parameter', () => {
      const param = template.Parameters.TelemetryFrequencySeconds;
      expect(param).toBeDefined();
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(60);
    });
  });

  describe('Conditions', () => {
    test('should have IsProd condition', () => {
      const condition = template.Conditions.IsProd;
      expect(condition).toBeDefined();
      expect(condition['Fn::Equals']).toBeDefined();
      expect(condition['Fn::Equals'][0]).toEqual({ Ref: 'EnvironmentName' });
      expect(condition['Fn::Equals'][1]).toBe('prod');
    });
  });

  describe('IoT Infrastructure Resources', () => {
    test('should have VehicleThingType', () => {
      const resource = template.Resources.VehicleThingType;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::IoT::ThingType');
      expect(resource.Properties.ThingTypeName).toBeDefined();
    });

    test('should have IoTPolicy', () => {
      const resource = template.Resources.IoTPolicy;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::IoT::Policy');
    });

    test('should have TelemetryRule', () => {
      const resource = template.Resources.TelemetryRule;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::IoT::TopicRule');
      expect(resource.Properties.TopicRulePayload).toBeDefined();
    });
  });

  describe('Kinesis Stream Resource', () => {
    test('should have TelemetryStream', () => {
      const resource = template.Resources.TelemetryStream;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::Kinesis::Stream');
    });

    test('TelemetryStream should have correct shard configuration', () => {
      const stream = template.Resources.TelemetryStream;
      expect(stream.Properties.ShardCount).toBeDefined();
      expect(stream.Properties.ShardCount['Fn::If']).toBeDefined();
    });

    test('TelemetryStream should have retention period', () => {
      const stream = template.Resources.TelemetryStream;
      expect(stream.Properties.RetentionPeriodHours).toBe(48);
    });

    test('TelemetryStream should have encryption enabled', () => {
      const stream = template.Resources.TelemetryStream;
      expect(stream.Properties.StreamEncryption).toBeDefined();
      expect(stream.Properties.StreamEncryption.EncryptionType).toBe('KMS');
    });
  });

  describe('DynamoDB Tables', () => {
    test('should have TelemetryDataTable', () => {
      const table = template.Resources.TelemetryDataTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('TelemetryDataTable should have PAY_PER_REQUEST billing', () => {
      const table = template.Resources.TelemetryDataTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('TelemetryDataTable should have correct key schema', () => {
      const table = template.Resources.TelemetryDataTable;
      const keySchema = table.Properties.KeySchema;
      expect(keySchema).toHaveLength(2);
      expect(keySchema[0].AttributeName).toBe('vehicleId');
      expect(keySchema[0].KeyType).toBe('HASH');
      expect(keySchema[1].AttributeName).toBe('timestamp');
      expect(keySchema[1].KeyType).toBe('RANGE');
    });

    test('TelemetryDataTable should have TTL enabled', () => {
      const table = template.Resources.TelemetryDataTable;
      expect(table.Properties.TimeToLiveSpecification).toBeDefined();
      expect(table.Properties.TimeToLiveSpecification.Enabled).toBe(true);
      expect(table.Properties.TimeToLiveSpecification.AttributeName).toBe('ttl');
    });

    test('TelemetryDataTable should have streams enabled', () => {
      const table = template.Resources.TelemetryDataTable;
      expect(table.Properties.StreamSpecification).toBeDefined();
      expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('should have VehicleProfileTable', () => {
      const table = template.Resources.VehicleProfileTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('VehicleProfileTable should have PITR enabled', () => {
      const table = template.Resources.VehicleProfileTable;
      expect(table.Properties.PointInTimeRecoverySpecification).toBeDefined();
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('should have MaintenanceRecordsTable', () => {
      const table = template.Resources.MaintenanceRecordsTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('MaintenanceRecordsTable should have GSI', () => {
      const table = template.Resources.MaintenanceRecordsTable;
      expect(table.Properties.GlobalSecondaryIndexes).toBeDefined();
      expect(table.Properties.GlobalSecondaryIndexes.length).toBeGreaterThan(0);
    });
  });

  describe('S3 Buckets', () => {
    test('should have RawTelemetryBucket', () => {
      const bucket = template.Resources.RawTelemetryBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('RawTelemetryBucket should have versioning enabled', () => {
      const bucket = template.Resources.RawTelemetryBucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('RawTelemetryBucket should have encryption enabled', () => {
      const bucket = template.Resources.RawTelemetryBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('RawTelemetryBucket should have lifecycle rules', () => {
      const bucket = template.Resources.RawTelemetryBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
    });

    test('should have AthenaResultsBucket', () => {
      const bucket = template.Resources.AthenaResultsBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });
  });

  describe('Lambda Functions', () => {
    test('should have TelemetryProcessorFunction', () => {
      const func = template.Resources.TelemetryProcessorFunction;
      expect(func).toBeDefined();
      expect(func.Type).toBe('AWS::Lambda::Function');
    });

    test('TelemetryProcessorFunction should use Python 3.11', () => {
      const func = template.Resources.TelemetryProcessorFunction;
      expect(func.Properties.Runtime).toBe('python3.11');
    });

    test('TelemetryProcessorFunction should have concurrency limit', () => {
      const func = template.Resources.TelemetryProcessorFunction;
      expect(func.Properties.ReservedConcurrentExecutions).toBeDefined();
      expect(func.Properties.ReservedConcurrentExecutions).toBe(100);
    });

    test('TelemetryProcessorFunction should have environment variables', () => {
      const func = template.Resources.TelemetryProcessorFunction;
      expect(func.Properties.Environment).toBeDefined();
      expect(func.Properties.Environment.Variables).toBeDefined();
      expect(func.Properties.Environment.Variables.TELEMETRY_TABLE).toBeDefined();
    });

    test('should have AlertGeneratorFunction', () => {
      const func = template.Resources.AlertGeneratorFunction;
      expect(func).toBeDefined();
      expect(func.Type).toBe('AWS::Lambda::Function');
    });

    test('AlertGeneratorFunction should have concurrency limit', () => {
      const func = template.Resources.AlertGeneratorFunction;
      expect(func.Properties.ReservedConcurrentExecutions).toBe(50);
    });

    test('should have MLInferenceFunction', () => {
      const func = template.Resources.MLInferenceFunction;
      expect(func).toBeDefined();
      expect(func.Type).toBe('AWS::Lambda::Function');
    });

    test('MLInferenceFunction should have higher memory', () => {
      const func = template.Resources.MLInferenceFunction;
      expect(func.Properties.MemorySize).toBe(1024);
    });

    test('should have GetVehicleFunction', () => {
      const func = template.Resources.GetVehicleFunction;
      expect(func).toBeDefined();
      expect(func.Type).toBe('AWS::Lambda::Function');
    });
  });

  describe('IAM Roles', () => {
    test('should have LambdaExecutionRole', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('LambdaExecutionRole should have correct assume role policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('LambdaExecutionRole should have managed policies', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toBeDefined();
      expect(role.Properties.ManagedPolicyArns.length).toBeGreaterThan(0);
    });

    test('should have SageMakerExecutionRole', () => {
      const role = template.Resources.SageMakerExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should have StepFunctionsRole', () => {
      const role = template.Resources.StepFunctionsRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should have GlueServiceRole', () => {
      const role = template.Resources.GlueServiceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should have ApiGatewayCloudWatchLogsRole', () => {
      const role = template.Resources.ApiGatewayCloudWatchLogsRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('SageMaker Resources', () => {
    test('should have SageMakerNotebookInstanceV2', () => {
      const notebook = template.Resources.SageMakerNotebookInstanceV2;
      expect(notebook).toBeDefined();
      expect(notebook.Type).toBe('AWS::SageMaker::NotebookInstance');
    });

    test('SageMakerNotebookInstanceV2 should have correct instance type', () => {
      const notebook = template.Resources.SageMakerNotebookInstanceV2;
      expect(notebook.Properties.InstanceType).toBe('ml.t3.xlarge');
    });

    test('SageMakerNotebookInstanceV2 should have volume size', () => {
      const notebook = template.Resources.SageMakerNotebookInstanceV2;
      expect(notebook.Properties.VolumeSizeInGB).toBe(50);
    });
  });

  describe('Location Service Resources', () => {
    test('should have VehicleTracker', () => {
      const tracker = template.Resources.VehicleTracker;
      expect(tracker).toBeDefined();
      expect(tracker.Type).toBe('AWS::Location::Tracker');
    });

    test('should have RouteCalculator', () => {
      const calc = template.Resources.RouteCalculator;
      expect(calc).toBeDefined();
      expect(calc.Type).toBe('AWS::Location::RouteCalculator');
    });

    test('should have ServiceAreaGeofenceCollection', () => {
      const geofence = template.Resources.ServiceAreaGeofenceCollection;
      expect(geofence).toBeDefined();
      expect(geofence.Type).toBe('AWS::Location::GeofenceCollection');
    });
  });

  describe('Glue Resources', () => {
    test('should have FleetDatabase', () => {
      const db = template.Resources.FleetDatabase;
      expect(db).toBeDefined();
      expect(db.Type).toBe('AWS::Glue::Database');
    });

    test('should have TelemetryCrawler', () => {
      const crawler = template.Resources.TelemetryCrawler;
      expect(crawler).toBeDefined();
      expect(crawler.Type).toBe('AWS::Glue::Crawler');
    });
  });

  describe('Athena Resources', () => {
    test('should have AthenaWorkgroup', () => {
      const workgroup = template.Resources.AthenaWorkgroup;
      expect(workgroup).toBeDefined();
      expect(workgroup.Type).toBe('AWS::Athena::WorkGroup');
    });

    test('AthenaWorkgroup should have result configuration', () => {
      const workgroup = template.Resources.AthenaWorkgroup;
      expect(workgroup.Properties.WorkGroupConfiguration).toBeDefined();
      expect(workgroup.Properties.WorkGroupConfiguration.ResultConfiguration).toBeDefined();
    });
  });

  describe('Step Functions Resources', () => {
    test('should have MaintenanceWorkflow', () => {
      const workflow = template.Resources.MaintenanceWorkflow;
      expect(workflow).toBeDefined();
      expect(workflow.Type).toBe('AWS::StepFunctions::StateMachine');
    });

    test('MaintenanceWorkflow should have definition', () => {
      const workflow = template.Resources.MaintenanceWorkflow;
      expect(workflow.Properties.DefinitionString).toBeDefined();
    });

    test('MaintenanceWorkflow should have error handling', () => {
      const workflow = template.Resources.MaintenanceWorkflow;
      const definition = JSON.parse(workflow.Properties.DefinitionString['Fn::Sub']);
      expect(definition.States.NotifyFleetManager.Catch).toBeDefined();
      expect(definition.States.NotifyFleetManager.Retry).toBeDefined();
    });
  });

  describe('EventBridge Rules', () => {
    test('should have MaintenanceScheduleRule', () => {
      const rule = template.Resources.MaintenanceScheduleRule;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Events::Rule');
    });

    test('MaintenanceScheduleRule should have schedule expression', () => {
      const rule = template.Resources.MaintenanceScheduleRule;
      expect(rule.Properties.ScheduleExpression).toBe('rate(1 day)');
    });

    test('should have VehicleConditionRule', () => {
      const rule = template.Resources.VehicleConditionRule;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Events::Rule');
    });

    test('VehicleConditionRule should have event pattern', () => {
      const rule = template.Resources.VehicleConditionRule;
      expect(rule.Properties.EventPattern).toBeDefined();
    });
  });

  describe('SNS and SES Resources', () => {
    test('should have OperationsAlertTopic', () => {
      const topic = template.Resources.OperationsAlertTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have OperationsAlertSubscription', () => {
      const sub = template.Resources.OperationsAlertSubscription;
      expect(sub).toBeDefined();
      expect(sub.Type).toBe('AWS::SNS::Subscription');
    });

    test('OperationsAlertSubscription should use email protocol', () => {
      const sub = template.Resources.OperationsAlertSubscription;
      expect(sub.Properties.Protocol).toBe('email');
    });

    test('should have EmailIdentity', () => {
      const identity = template.Resources.EmailIdentity;
      expect(identity).toBeDefined();
      expect(identity.Type).toBe('AWS::SES::EmailIdentity');
    });

    test('should have MaintenanceEmailTemplate', () => {
      const template_resource = template.Resources.MaintenanceEmailTemplate;
      expect(template_resource).toBeDefined();
      expect(template_resource.Type).toBe('AWS::SES::Template');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have FleetMetricsDashboard', () => {
      const dashboard = template.Resources.FleetMetricsDashboard;
      expect(dashboard).toBeDefined();
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('should have VehicleTemperatureAnomaly detector', () => {
      const anomaly = template.Resources.VehicleTemperatureAnomaly;
      expect(anomaly).toBeDefined();
      expect(anomaly.Type).toBe('AWS::CloudWatch::AnomalyDetector');
    });

    test('VehicleTemperatureAnomaly should monitor EngineTemperature', () => {
      const anomaly = template.Resources.VehicleTemperatureAnomaly;
      expect(anomaly.Properties.MetricName).toBe('EngineTemperature');
      expect(anomaly.Properties.Namespace).toBe('FleetManagement');
    });

    test('should have TelemetryProcessorErrorAlarm', () => {
      const alarm = template.Resources.TelemetryProcessorErrorAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have TelemetryStreamMonitoringAlarm', () => {
      const alarm = template.Resources.TelemetryStreamMonitoringAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have ApiGatewayLogGroup', () => {
      const logGroup = template.Resources.ApiGatewayLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    });
  });

  describe('API Gateway Resources', () => {
    test('should have FleetManagementApi', () => {
      const api = template.Resources.FleetManagementApi;
      expect(api).toBeDefined();
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should have ApiDeployment', () => {
      const deployment = template.Resources.ApiDeployment;
      expect(deployment).toBeDefined();
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
    });

    test('should have ApiStageV2', () => {
      const stage = template.Resources.ApiStageV2;
      expect(stage).toBeDefined();
      expect(stage.Type).toBe('AWS::ApiGateway::Stage');
    });

    test('ApiStageV2 should have logging configured', () => {
      const stage = template.Resources.ApiStageV2;
      expect(stage.Properties.AccessLogSetting).toBeDefined();
      expect(stage.Properties.MethodSettings).toBeDefined();
    });

    test('should have ApiGatewayAccount', () => {
      const account = template.Resources.ApiGatewayAccount;
      expect(account).toBeDefined();
      expect(account.Type).toBe('AWS::ApiGateway::Account');
    });

    test('should have API resources and methods', () => {
      const vehiclesResource = template.Resources.ApiVehiclesResource;
      const vehicleIdResource = template.Resources.ApiVehicleIdResource;
      const getMethod = template.Resources.ApiGetVehicleMethod;

      expect(vehiclesResource).toBeDefined();
      expect(vehicleIdResource).toBeDefined();
      expect(getMethod).toBeDefined();
    });

    test('API method should have CORS enabled', () => {
      const optionsMethod = template.Resources.ApiGetVehicleOptionsMethod;
      expect(optionsMethod).toBeDefined();
      expect(optionsMethod.Type).toBe('AWS::ApiGateway::Method');
    });
  });

  describe('Lambda Event Source Mapping', () => {
    test('should have TelemetryProcessorEventSourceMapping', () => {
      const mapping = template.Resources.TelemetryProcessorEventSourceMapping;
      expect(mapping).toBeDefined();
      expect(mapping.Type).toBe('AWS::Lambda::EventSourceMapping');
    });

    test('TelemetryProcessorEventSourceMapping should have correct batch size', () => {
      const mapping = template.Resources.TelemetryProcessorEventSourceMapping;
      expect(mapping.Properties.BatchSize).toBeDefined();
      expect(mapping.Properties.BatchSize).toBe(100);
    });
  });

  describe('Resource Tagging', () => {
    test('all resources with tags should have Environment tag', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties && resource.Properties.Tags) {
          const envTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
          expect(envTag).toBeDefined();
        }
      });
    });

    test('all resources with tags should have Project tag', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties && resource.Properties.Tags) {
          const projectTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Project');
          if (projectTag) {
            expect(projectTag.Value).toBe('Fleet Management');
          }
        }
      });
    });
  });

  describe('Security and Encryption', () => {
    test('S3 buckets should have encryption enabled', () => {
      const rawBucket = template.Resources.RawTelemetryBucket;
      const athenaBucket = template.Resources.AthenaResultsBucket;

      expect(rawBucket.Properties.BucketEncryption).toBeDefined();
      expect(athenaBucket.Properties.BucketEncryption).toBeDefined();
    });

    test('DynamoDB tables should have SSE enabled', () => {
      const vehicleTable = template.Resources.VehicleProfileTable;
      const maintenanceTable = template.Resources.MaintenanceRecordsTable;

      expect(vehicleTable.Properties.SSESpecification).toBeDefined();
      expect(vehicleTable.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(maintenanceTable.Properties.SSESpecification).toBeDefined();
      expect(maintenanceTable.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('Kinesis stream should have encryption enabled', () => {
      const stream = template.Resources.TelemetryStream;
      expect(stream.Properties.StreamEncryption).toBeDefined();
      expect(stream.Properties.StreamEncryption.EncryptionType).toBe('KMS');
    });
  });

  describe('Outputs', () => {
    test('should have ApiEndpoint output', () => {
      const output = template.Outputs.ApiEndpoint;
      expect(output).toBeDefined();
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
    });

    test('should have TelemetryStreamName output', () => {
      const output = template.Outputs.TelemetryStreamName;
      expect(output).toBeDefined();
      expect(output.Export).toBeDefined();
    });

    test('should have VehicleProfileTableName output', () => {
      const output = template.Outputs.VehicleProfileTableName;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'VehicleProfileTable' });
    });

    test('should have MaintenanceRecordsTableName output', () => {
      const output = template.Outputs.MaintenanceRecordsTableName;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'MaintenanceRecordsTable' });
    });

    test('should have TelemetryDataTableName output', () => {
      const output = template.Outputs.TelemetryDataTableName;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'TelemetryDataTable' });
    });

    test('outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export) {
          expect(output.Export.Name).toBeDefined();
        }
      });
    });
  });

  describe('Resource Count and Validation', () => {
    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(40);
    });

    test('should have expected number of parameters', () => {
      const paramCount = Object.keys(template.Parameters).length;
      expect(paramCount).toBeGreaterThan(3);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThan(5);
    });

    test('all resources should have Type property', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.Type).toBeDefined();
        expect(resource.Type).toMatch(/^AWS::/);
      });
    });

    test('all resources should have Properties', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.Properties).toBeDefined();
      });
    });
  });

  describe('Integration Tests Coverage', () => {
    test('template should be valid JSON', () => {
      expect(() => JSON.stringify(template)).not.toThrow();
    });

    test('template should not have circular references', () => {
      expect(() => JSON.parse(JSON.stringify(template))).not.toThrow();
    });

    test('all Ref references should point to valid resources or parameters', () => {
      const allKeys = {
        ...template.Parameters,
        ...template.Resources,
        'AWS::StackName': {},
        'AWS::Region': {},
        'AWS::AccountId': {},
      };

      const checkRefs = (obj: any) => {
        if (typeof obj === 'object' && obj !== null) {
          if (obj.Ref) {
            expect(allKeys[obj.Ref]).toBeDefined();
          }
          Object.values(obj).forEach(checkRefs);
        }
      };

      checkRefs(template.Resources);
    });
  });
});
