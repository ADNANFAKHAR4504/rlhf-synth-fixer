import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Trade Processing System', () => {
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
      expect(template.Description.toLowerCase()).toContain('trade processing');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
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
    });

    test('should not have Lambda image URI parameters (using zip-based deployment)', () => {
      expect(template.Parameters.ValidatorImageUri).toBeUndefined();
      expect(template.Parameters.EnricherImageUri).toBeUndefined();
      expect(template.Parameters.RecorderImageUri).toBeUndefined();
    });

    test('should not have reserved concurrency parameters (removed due to AWS account limits)', () => {
      expect(template.Parameters.ValidatorReservedConcurrency).toBeUndefined();
      expect(template.Parameters.EnricherReservedConcurrency).toBeUndefined();
      expect(template.Parameters.RecorderReservedConcurrency).toBeUndefined();
    });
  });

  describe('DLQ Resources', () => {
    test('should have all three DLQ resources', () => {
      expect(template.Resources.TradeValidatorDLQ).toBeDefined();
      expect(template.Resources.MetadataEnricherDLQ).toBeDefined();
      expect(template.Resources.ComplianceRecorderDLQ).toBeDefined();
    });

    test('all DLQs should be SQS queues', () => {
      expect(template.Resources.TradeValidatorDLQ.Type).toBe('AWS::SQS::Queue');
      expect(template.Resources.MetadataEnricherDLQ.Type).toBe('AWS::SQS::Queue');
      expect(template.Resources.ComplianceRecorderDLQ.Type).toBe('AWS::SQS::Queue');
    });

    test('all DLQs should have 14-day retention (1209600 seconds)', () => {
      expect(template.Resources.TradeValidatorDLQ.Properties.MessageRetentionPeriod).toBe(1209600);
      expect(template.Resources.MetadataEnricherDLQ.Properties.MessageRetentionPeriod).toBe(1209600);
      expect(template.Resources.ComplianceRecorderDLQ.Properties.MessageRetentionPeriod).toBe(1209600);
    });

    test('all DLQs should have deletion policies', () => {
      expect(template.Resources.TradeValidatorDLQ.DeletionPolicy).toBe('Delete');
      expect(template.Resources.MetadataEnricherDLQ.DeletionPolicy).toBe('Delete');
      expect(template.Resources.ComplianceRecorderDLQ.DeletionPolicy).toBe('Delete');
    });

    test('DLQ names should include environmentSuffix', () => {
      expect(template.Resources.TradeValidatorDLQ.Properties.QueueName).toEqual({
        'Fn::Sub': 'trade-validator-dlq-${EnvironmentSuffix}'
      });
      expect(template.Resources.MetadataEnricherDLQ.Properties.QueueName).toEqual({
        'Fn::Sub': 'metadata-enricher-dlq-${EnvironmentSuffix}'
      });
      expect(template.Resources.ComplianceRecorderDLQ.Properties.QueueName).toEqual({
        'Fn::Sub': 'compliance-recorder-dlq-${EnvironmentSuffix}'
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should have all three Lambda functions', () => {
      expect(template.Resources.TradeValidatorFunction).toBeDefined();
      expect(template.Resources.MetadataEnricherFunction).toBeDefined();
      expect(template.Resources.ComplianceRecorderFunction).toBeDefined();
    });

    test('all Lambda functions should have correct type', () => {
      expect(template.Resources.TradeValidatorFunction.Type).toBe('AWS::Lambda::Function');
      expect(template.Resources.MetadataEnricherFunction.Type).toBe('AWS::Lambda::Function');
      expect(template.Resources.ComplianceRecorderFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('all Lambda functions should use zip-based deployment with Python runtime', () => {
      expect(template.Resources.TradeValidatorFunction.Properties.Runtime).toBe('python3.11');
      expect(template.Resources.MetadataEnricherFunction.Properties.Runtime).toBe('python3.11');
      expect(template.Resources.ComplianceRecorderFunction.Properties.Runtime).toBe('python3.11');
      expect(template.Resources.TradeValidatorFunction.Properties.Handler).toBe('index.handler');
      expect(template.Resources.MetadataEnricherFunction.Properties.Handler).toBe('index.handler');
      expect(template.Resources.ComplianceRecorderFunction.Properties.Handler).toBe('index.handler');
    });

    test('all Lambda functions should use ARM64 architecture', () => {
      expect(template.Resources.TradeValidatorFunction.Properties.Architectures).toEqual(['arm64']);
      expect(template.Resources.MetadataEnricherFunction.Properties.Architectures).toEqual(['arm64']);
      expect(template.Resources.ComplianceRecorderFunction.Properties.Architectures).toEqual(['arm64']);
    });

    test('Lambda functions should not have reserved concurrent executions (removed due to AWS account limits)', () => {
      expect(template.Resources.TradeValidatorFunction.Properties.ReservedConcurrentExecutions).toBeUndefined();
      expect(template.Resources.MetadataEnricherFunction.Properties.ReservedConcurrentExecutions).toBeUndefined();
      expect(template.Resources.ComplianceRecorderFunction.Properties.ReservedConcurrentExecutions).toBeUndefined();
    });

    test('all Lambda functions should have DLQ configurations', () => {
      const validator = template.Resources.TradeValidatorFunction.Properties.DeadLetterConfig;
      const enricher = template.Resources.MetadataEnricherFunction.Properties.DeadLetterConfig;
      const recorder = template.Resources.ComplianceRecorderFunction.Properties.DeadLetterConfig;

      expect(validator).toBeDefined();
      expect(enricher).toBeDefined();
      expect(recorder).toBeDefined();
    });

    test('Lambda function names should include environmentSuffix', () => {
      expect(template.Resources.TradeValidatorFunction.Properties.FunctionName).toEqual({
        'Fn::Sub': 'trade-validator-${EnvironmentSuffix}'
      });
      expect(template.Resources.MetadataEnricherFunction.Properties.FunctionName).toEqual({
        'Fn::Sub': 'metadata-enricher-${EnvironmentSuffix}'
      });
      expect(template.Resources.ComplianceRecorderFunction.Properties.FunctionName).toEqual({
        'Fn::Sub': 'compliance-recorder-${EnvironmentSuffix}'
      });
    });

    test('all Lambda functions should have deletion policies', () => {
      expect(template.Resources.TradeValidatorFunction.DeletionPolicy).toBe('Delete');
      expect(template.Resources.MetadataEnricherFunction.DeletionPolicy).toBe('Delete');
      expect(template.Resources.ComplianceRecorderFunction.DeletionPolicy).toBe('Delete');
    });

    test('all Lambda functions should have X-Ray tracing enabled', () => {
      expect(template.Resources.TradeValidatorFunction.Properties.TracingConfig).toEqual({ Mode: 'Active' });
      expect(template.Resources.MetadataEnricherFunction.Properties.TracingConfig).toEqual({ Mode: 'Active' });
      expect(template.Resources.ComplianceRecorderFunction.Properties.TracingConfig).toEqual({ Mode: 'Active' });
    });

    // Lambda functions use zip-based deployment with inline code for simplicity
    test('Lambda functions should have inline code (ZipFile)', () => {
      expect(template.Resources.TradeValidatorFunction.Properties.Code.ZipFile).toBeDefined();
      expect(template.Resources.MetadataEnricherFunction.Properties.Code.ZipFile).toBeDefined();
      expect(template.Resources.ComplianceRecorderFunction.Properties.Code.ZipFile).toBeDefined();
    });
  });

  describe('DynamoDB Table', () => {
    test('should have TradeTable resource', () => {
      expect(template.Resources.TradeTable).toBeDefined();
    });

    test('TradeTable should be a DynamoDB table', () => {
      expect(template.Resources.TradeTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('TradeTable should have correct deletion policies', () => {
      expect(template.Resources.TradeTable.DeletionPolicy).toBe('Delete');
      expect(template.Resources.TradeTable.UpdateReplacePolicy).toBe('Delete');
    });

    test('TradeTable should use PAY_PER_REQUEST billing mode', () => {
      expect(template.Resources.TradeTable.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('TradeTable should have point-in-time recovery enabled', () => {
      const pitr = template.Resources.TradeTable.Properties.PointInTimeRecoverySpecification;
      expect(pitr.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('TradeTable should have stream enabled', () => {
      const stream = template.Resources.TradeTable.Properties.StreamSpecification;
      expect(stream.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('TradeTable name should include environmentSuffix', () => {
      expect(template.Resources.TradeTable.Properties.TableName).toEqual({
        'Fn::Sub': 'trade-processing-table-${EnvironmentSuffix}'
      });
    });

    test('TradeTable should have correct key schema', () => {
      const keySchema = template.Resources.TradeTable.Properties.KeySchema;
      expect(keySchema).toHaveLength(2);
      expect(keySchema[0].AttributeName).toBe('tradeId');
      expect(keySchema[0].KeyType).toBe('HASH');
      expect(keySchema[1].AttributeName).toBe('timestamp');
      expect(keySchema[1].KeyType).toBe('RANGE');
    });

    test('TradeTable should have SSE enabled', () => {
      const sse = template.Resources.TradeTable.Properties.SSESpecification;
      expect(sse.SSEEnabled).toBe(true);
    });

    test('TradeTable should have global secondary index', () => {
      const gsi = template.Resources.TradeTable.Properties.GlobalSecondaryIndexes;
      expect(gsi).toBeDefined();
      expect(gsi.length).toBeGreaterThan(0);
      expect(gsi[0].IndexName).toBe('SourceSystemIndex');
    });
  });

  describe('Step Functions State Machine', () => {
    test('should have TradeProcessingStateMachine resource', () => {
      expect(template.Resources.TradeProcessingStateMachine).toBeDefined();
    });

    test('state machine should have correct type', () => {
      expect(template.Resources.TradeProcessingStateMachine.Type).toBe('AWS::StepFunctions::StateMachine');
    });

    test('state machine should have deletion policy', () => {
      expect(template.Resources.TradeProcessingStateMachine.DeletionPolicy).toBe('Delete');
    });

    test('state machine name should include environmentSuffix', () => {
      expect(template.Resources.TradeProcessingStateMachine.Properties.StateMachineName).toEqual({
        'Fn::Sub': 'trade-processing-workflow-${EnvironmentSuffix}'
      });
    });

    test('state machine should have definition string', () => {
      const definition = template.Resources.TradeProcessingStateMachine.Properties.DefinitionString;
      expect(definition).toBeDefined();
    });

    test('state machine should have logging configuration', () => {
      const logging = template.Resources.TradeProcessingStateMachine.Properties.LoggingConfiguration;
      expect(logging).toBeDefined();
      expect(logging.Level).toBe('ALL');
    });

    test('state machine should have tracing enabled', () => {
      const tracing = template.Resources.TradeProcessingStateMachine.Properties.TracingConfiguration;
      expect(tracing).toBeDefined();
      expect(tracing.Enabled).toBe(true);
    });

    test('state machine should be STANDARD type', () => {
      expect(template.Resources.TradeProcessingStateMachine.Properties.StateMachineType).toBe('STANDARD');
    });
  });

  describe('EventBridge Rules', () => {
    test('should have all three source system rules', () => {
      expect(template.Resources.SourceSystem1EventRule).toBeDefined();
      expect(template.Resources.SourceSystem2EventRule).toBeDefined();
      expect(template.Resources.SourceSystem3EventRule).toBeDefined();
    });

    test('all EventBridge rules should have correct type', () => {
      expect(template.Resources.SourceSystem1EventRule.Type).toBe('AWS::Events::Rule');
      expect(template.Resources.SourceSystem2EventRule.Type).toBe('AWS::Events::Rule');
      expect(template.Resources.SourceSystem3EventRule.Type).toBe('AWS::Events::Rule');
    });

    test('all rules should be in ENABLED state', () => {
      expect(template.Resources.SourceSystem1EventRule.Properties.State).toBe('ENABLED');
      expect(template.Resources.SourceSystem2EventRule.Properties.State).toBe('ENABLED');
      expect(template.Resources.SourceSystem3EventRule.Properties.State).toBe('ENABLED');
    });

    test('rule names should include environmentSuffix', () => {
      expect(template.Resources.SourceSystem1EventRule.Properties.Name).toEqual({
        'Fn::Sub': 'trade-event-source-system-1-${EnvironmentSuffix}'
      });
      expect(template.Resources.SourceSystem2EventRule.Properties.Name).toEqual({
        'Fn::Sub': 'trade-event-source-system-2-${EnvironmentSuffix}'
      });
      expect(template.Resources.SourceSystem3EventRule.Properties.Name).toEqual({
        'Fn::Sub': 'trade-event-source-system-3-${EnvironmentSuffix}'
      });
    });

    test('all rules should target the state machine', () => {
      const rule1 = template.Resources.SourceSystem1EventRule.Properties;
      const rule2 = template.Resources.SourceSystem2EventRule.Properties;
      const rule3 = template.Resources.SourceSystem3EventRule.Properties;

      expect(rule1.Targets[0].Arn).toEqual({ Ref: 'TradeProcessingStateMachine' });
      expect(rule2.Targets[0].Arn).toEqual({ Ref: 'TradeProcessingStateMachine' });
      expect(rule3.Targets[0].Arn).toEqual({ Ref: 'TradeProcessingStateMachine' });
    });

    test('all rules should have retry policy', () => {
      expect(template.Resources.SourceSystem1EventRule.Properties.Targets[0].RetryPolicy).toBeDefined();
      expect(template.Resources.SourceSystem2EventRule.Properties.Targets[0].RetryPolicy).toBeDefined();
      expect(template.Resources.SourceSystem3EventRule.Properties.Targets[0].RetryPolicy).toBeDefined();
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have all three DLQ alarms', () => {
      expect(template.Resources.ValidatorDLQAlarm).toBeDefined();
      expect(template.Resources.EnricherDLQAlarm).toBeDefined();
      expect(template.Resources.RecorderDLQAlarm).toBeDefined();
    });

    test('all alarms should have correct type', () => {
      expect(template.Resources.ValidatorDLQAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(template.Resources.EnricherDLQAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(template.Resources.RecorderDLQAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('all alarms should monitor ApproximateNumberOfMessagesVisible metric', () => {
      expect(template.Resources.ValidatorDLQAlarm.Properties.MetricName).toBe('ApproximateNumberOfMessagesVisible');
      expect(template.Resources.EnricherDLQAlarm.Properties.MetricName).toBe('ApproximateNumberOfMessagesVisible');
      expect(template.Resources.RecorderDLQAlarm.Properties.MetricName).toBe('ApproximateNumberOfMessagesVisible');
    });

    test('all alarms should use AWS/SQS namespace', () => {
      expect(template.Resources.ValidatorDLQAlarm.Properties.Namespace).toBe('AWS/SQS');
      expect(template.Resources.EnricherDLQAlarm.Properties.Namespace).toBe('AWS/SQS');
      expect(template.Resources.RecorderDLQAlarm.Properties.Namespace).toBe('AWS/SQS');
    });

    test('alarm names should include environmentSuffix', () => {
      expect(template.Resources.ValidatorDLQAlarm.Properties.AlarmName).toEqual({
        'Fn::Sub': 'validator-dlq-depth-alarm-${EnvironmentSuffix}'
      });
      expect(template.Resources.EnricherDLQAlarm.Properties.AlarmName).toEqual({
        'Fn::Sub': 'enricher-dlq-depth-alarm-${EnvironmentSuffix}'
      });
      expect(template.Resources.RecorderDLQAlarm.Properties.AlarmName).toEqual({
        'Fn::Sub': 'recorder-dlq-depth-alarm-${EnvironmentSuffix}'
      });
    });

    test('all alarms should have TreatMissingData configured', () => {
      expect(template.Resources.ValidatorDLQAlarm.Properties.TreatMissingData).toBe('notBreaching');
      expect(template.Resources.EnricherDLQAlarm.Properties.TreatMissingData).toBe('notBreaching');
      expect(template.Resources.RecorderDLQAlarm.Properties.TreatMissingData).toBe('notBreaching');
    });
  });

  describe('SSM Parameters', () => {
    test('should have API endpoint parameters', () => {
      expect(template.Resources.ValidatorAPIEndpointParameter).toBeDefined();
      expect(template.Resources.EnricherAPIEndpointParameter).toBeDefined();
      expect(template.Resources.RecorderAPIEndpointParameter).toBeDefined();
    });

    test('should have threshold parameters', () => {
      expect(template.Resources.ValidationThresholdParameter).toBeDefined();
      expect(template.Resources.EnrichmentThresholdParameter).toBeDefined();
      expect(template.Resources.ComplianceThresholdParameter).toBeDefined();
    });

    test('all SSM parameters should have correct type', () => {
      expect(template.Resources.ValidatorAPIEndpointParameter.Type).toBe('AWS::SSM::Parameter');
      expect(template.Resources.ValidationThresholdParameter.Type).toBe('AWS::SSM::Parameter');
    });

    test('all SSM parameters should use String type', () => {
      expect(template.Resources.ValidatorAPIEndpointParameter.Properties.Type).toBe('String');
      expect(template.Resources.ValidationThresholdParameter.Properties.Type).toBe('String');
    });

    test('parameter names should include environmentSuffix', () => {
      const validatorParam = template.Resources.ValidatorAPIEndpointParameter.Properties.Name;
      expect(JSON.stringify(validatorParam)).toContain('EnvironmentSuffix');
    });
  });

  describe('ECR Repository', () => {
    test('should have ECRRepository resource', () => {
      expect(template.Resources.ECRRepository).toBeDefined();
    });

    test('ECR repository should have correct type', () => {
      expect(template.Resources.ECRRepository.Type).toBe('AWS::ECR::Repository');
    });

    test('ECR repository should have image scanning enabled', () => {
      const scanning = template.Resources.ECRRepository.Properties.ImageScanningConfiguration;
      expect(scanning.ScanOnPush).toBe(true);
    });

    test('ECR repository name should include environmentSuffix', () => {
      expect(template.Resources.ECRRepository.Properties.RepositoryName).toEqual({
        'Fn::Sub': 'trade-processing-images-${EnvironmentSuffix}'
      });
    });

    test('ECR repository should have deletion policy', () => {
      expect(template.Resources.ECRRepository.DeletionPolicy).toBe('Delete');
    });

    test('ECR repository should have lifecycle policy', () => {
      expect(template.Resources.ECRRepository.Properties.LifecyclePolicy).toBeDefined();
    });
  });

  describe('ECR Replication', () => {
    test('should have ECRReplicationConfiguration', () => {
      expect(template.Resources.ECRReplicationConfiguration).toBeDefined();
    });

    test('ECR replication should have correct type', () => {
      expect(template.Resources.ECRReplicationConfiguration.Type).toBe('AWS::ECR::ReplicationConfiguration');
    });
  });

  describe('IAM Roles', () => {
    test('should have LambdaExecutionRole', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have StepFunctionsExecutionRole', () => {
      expect(template.Resources.StepFunctionsExecutionRole).toBeDefined();
      expect(template.Resources.StepFunctionsExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have EventBridgeExecutionRole', () => {
      expect(template.Resources.EventBridgeExecutionRole).toBeDefined();
      expect(template.Resources.EventBridgeExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('LambdaExecutionRole should have Lambda Insights policy', () => {
      const role = template.Resources.LambdaExecutionRole.Properties;
      const hasManagedPolicy = role.ManagedPolicyArns.some((arn: string) =>
        arn.includes('CloudWatchLambdaInsightsExecutionRolePolicy')
      );
      expect(hasManagedPolicy).toBe(true);
    });

    test('role names should include environmentSuffix', () => {
      expect(template.Resources.LambdaExecutionRole.Properties.RoleName).toEqual({
        'Fn::Sub': 'trade-processing-lambda-role-${EnvironmentSuffix}'
      });
    });
  });

  describe('VPC Resources', () => {
    test('should have TradeProcessingVPC', () => {
      expect(template.Resources.TradeProcessingVPC).toBeDefined();
      expect(template.Resources.TradeProcessingVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should have VPC endpoints for DynamoDB and Step Functions', () => {
      expect(template.Resources.DynamoDBVPCEndpoint).toBeDefined();
      expect(template.Resources.StepFunctionsVPCEndpoint).toBeDefined();
    });

    test('VPC should have deletion policy', () => {
      expect(template.Resources.TradeProcessingVPC.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Global Table Configuration', () => {
    test('should have GlobalTableCustomResource', () => {
      expect(template.Resources.GlobalTableCustomResource).toBeDefined();
    });

    test('should have GlobalTableCustomResourceFunction', () => {
      expect(template.Resources.GlobalTableCustomResourceFunction).toBeDefined();
      expect(template.Resources.GlobalTableCustomResourceFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should have GlobalTableCustomResourceRole', () => {
      expect(template.Resources.GlobalTableCustomResourceRole).toBeDefined();
      expect(template.Resources.GlobalTableCustomResourceRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'TradeTableName',
        'TradeTableArn',
        'TradeTableStreamArn',
        'StateMachineArn',
        'ValidatorFunctionArn',
        'EnricherFunctionArn',
        'RecorderFunctionArn',
        'ValidatorDLQUrl',
        'EnricherDLQUrl',
        'RecorderDLQUrl',
        'ECRRepositoryUri',
        'VPCId',
        'StackName',
        'EnvironmentSuffix',
        'SecondaryRegion'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
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

    test('should have expected resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(25);
    });

    test('should have expected parameter count', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      // After removing ImageUri and ReservedConcurrency params, we have 8 parameters
      expect(parameterCount).toBeGreaterThanOrEqual(8);
    });

    test('should have expected output count', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Deletion Policies', () => {
    test('all major resources should have Delete deletion policies', () => {
      const resourcesWithPolicies = [
        'TradeValidatorDLQ',
        'MetadataEnricherDLQ',
        'ComplianceRecorderDLQ',
        'TradeTable',
        'TradeValidatorFunction',
        'MetadataEnricherFunction',
        'ComplianceRecorderFunction',
        'ECRRepository',
        'TradeProcessingStateMachine',
        'TradeProcessingVPC'
      ];

      resourcesWithPolicies.forEach(key => {
        const resource = template.Resources[key];
        expect(resource.DeletionPolicy).toBe('Delete');
      });
    });

    test('should not have any Retain policies', () => {
      const resourcesWithRetain = Object.keys(template.Resources).filter(key => {
        const resource = template.Resources[key];
        return resource.DeletionPolicy === 'Retain' || resource.UpdateReplacePolicy === 'Retain';
      });

      expect(resourcesWithRetain).toHaveLength(0);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all applicable resource names should include environmentSuffix', () => {
      const namableResources = [
        'TradeValidatorDLQ',
        'MetadataEnricherDLQ',
        'ComplianceRecorderDLQ',
        'TradeValidatorFunction',
        'MetadataEnricherFunction',
        'ComplianceRecorderFunction',
        'TradeTable',
        'TradeProcessingStateMachine',
        'ECRRepository'
      ];

      namableResources.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        const nameProperty = resource.Properties.QueueName ||
                            resource.Properties.FunctionName ||
                            resource.Properties.TableName ||
                            resource.Properties.StateMachineName ||
                            resource.Properties.RepositoryName;

        if (nameProperty) {
          expect(JSON.stringify(nameProperty)).toContain('EnvironmentSuffix');
        }
      });
    });
  });
});
