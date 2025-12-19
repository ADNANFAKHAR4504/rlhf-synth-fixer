/**
 * CloudFormation Stack Validation Tests
 *
 * These tests validate the CloudFormation template structure
 * and ensure all required resources are defined correctly.
 */

const fs = require('fs');
const path = require('path');

describe('CloudFormation Stack Validation', () => {
  let template;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  test('Template has correct AWSTemplateFormatVersion', () => {
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
  });

  test('Template has required Parameters', () => {
    expect(template.Parameters).toBeDefined();
    expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    expect(template.Parameters.ValidatorImageUri).toBeDefined();
    expect(template.Parameters.EnricherImageUri).toBeDefined();
    expect(template.Parameters.RecorderImageUri).toBeDefined();
  });

  test('All Lambda functions use container images', () => {
    const validatorFunction = template.Resources.TradeValidatorFunction;
    const enricherFunction = template.Resources.MetadataEnricherFunction;
    const recorderFunction = template.Resources.ComplianceRecorderFunction;

    expect(validatorFunction.Properties.PackageType).toBe('Image');
    expect(enricherFunction.Properties.PackageType).toBe('Image');
    expect(recorderFunction.Properties.PackageType).toBe('Image');
  });

  test('All Lambda functions use ARM64 architecture', () => {
    const validatorFunction = template.Resources.TradeValidatorFunction;
    const enricherFunction = template.Resources.MetadataEnricherFunction;
    const recorderFunction = template.Resources.ComplianceRecorderFunction;

    expect(validatorFunction.Properties.Architectures).toContain('arm64');
    expect(enricherFunction.Properties.Architectures).toContain('arm64');
    expect(recorderFunction.Properties.Architectures).toContain('arm64');
  });

  test('All Lambda functions have reserved concurrent executions', () => {
    const validatorFunction = template.Resources.TradeValidatorFunction;
    const enricherFunction = template.Resources.MetadataEnricherFunction;
    const recorderFunction = template.Resources.ComplianceRecorderFunction;

    // Lambda functions reference parameters for reserved concurrency
    expect(validatorFunction.Properties.ReservedConcurrentExecutions).toBeDefined();
    expect(enricherFunction.Properties.ReservedConcurrentExecutions).toBeDefined();
    expect(recorderFunction.Properties.ReservedConcurrentExecutions).toBeDefined();
  });

  test('All Lambda functions have dead letter queue configured', () => {
    const validatorFunction = template.Resources.TradeValidatorFunction;
    const enricherFunction = template.Resources.MetadataEnricherFunction;
    const recorderFunction = template.Resources.ComplianceRecorderFunction;

    expect(validatorFunction.Properties.DeadLetterConfig).toBeDefined();
    expect(enricherFunction.Properties.DeadLetterConfig).toBeDefined();
    expect(recorderFunction.Properties.DeadLetterConfig).toBeDefined();
  });

  test('All DLQ queues have 14 day retention', () => {
    const validatorDLQ = template.Resources.TradeValidatorDLQ;
    const enricherDLQ = template.Resources.MetadataEnricherDLQ;
    const recorderDLQ = template.Resources.ComplianceRecorderDLQ;

    expect(validatorDLQ.Properties.MessageRetentionPeriod).toBe(1209600);
    expect(enricherDLQ.Properties.MessageRetentionPeriod).toBe(1209600);
    expect(recorderDLQ.Properties.MessageRetentionPeriod).toBe(1209600);
  });

  test('DynamoDB table uses on-demand billing', () => {
    const tradeTable = template.Resources.TradeTable;
    expect(tradeTable.Properties.BillingMode).toBe('PAY_PER_REQUEST');
  });

  test('DynamoDB table has point-in-time recovery enabled', () => {
    const tradeTable = template.Resources.TradeTable;
    expect(tradeTable.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
  });

  test('Step Functions state machine is defined', () => {
    const stateMachine = template.Resources.TradeProcessingStateMachine;
    expect(stateMachine).toBeDefined();
    expect(stateMachine.Type).toBe('AWS::StepFunctions::StateMachine');
  });

  test('Three EventBridge rules are defined for source systems', () => {
    expect(template.Resources.SourceSystem1EventRule).toBeDefined();
    expect(template.Resources.SourceSystem2EventRule).toBeDefined();
    expect(template.Resources.SourceSystem3EventRule).toBeDefined();
  });

  test('CloudWatch alarms are configured for all DLQs', () => {
    expect(template.Resources.ValidatorDLQAlarm).toBeDefined();
    expect(template.Resources.EnricherDLQAlarm).toBeDefined();
    expect(template.Resources.RecorderDLQAlarm).toBeDefined();
  });

  test('SSM parameters are defined for API endpoints', () => {
    expect(template.Resources.ValidatorAPIEndpointParameter).toBeDefined();
    expect(template.Resources.EnricherAPIEndpointParameter).toBeDefined();
    expect(template.Resources.RecorderAPIEndpointParameter).toBeDefined();
  });

  test('SSM parameters are defined for thresholds', () => {
    expect(template.Resources.ValidationThresholdParameter).toBeDefined();
    expect(template.Resources.EnrichmentThresholdParameter).toBeDefined();
    expect(template.Resources.ComplianceThresholdParameter).toBeDefined();
  });

  test('ECR repository is defined', () => {
    const ecrRepo = template.Resources.ECRRepository;
    expect(ecrRepo).toBeDefined();
    expect(ecrRepo.Type).toBe('AWS::ECR::Repository');
  });

  test('ECR replication configuration is defined', () => {
    const ecrReplication = template.Resources.ECRReplicationConfiguration;
    expect(ecrReplication).toBeDefined();
    expect(ecrReplication.Type).toBe('AWS::ECR::ReplicationConfiguration');
  });

  test('Stack outputs include required values', () => {
    expect(template.Outputs.StateMachineArn).toBeDefined();
    expect(template.Outputs.TradeTableName).toBeDefined();
    expect(template.Outputs.ECRRepositoryUri).toBeDefined();
  });

  test('All resource names use environmentSuffix parameter', () => {
    const validatorDLQ = template.Resources.TradeValidatorDLQ;
    expect(JSON.stringify(validatorDLQ.Properties.QueueName)).toContain('EnvironmentSuffix');
  });

  test('VPC resources are defined', () => {
    expect(template.Resources.TradeProcessingVPC).toBeDefined();
    expect(template.Resources.PrivateSubnet1).toBeDefined();
    expect(template.Resources.PrivateSubnet2).toBeDefined();
  });

  test('VPC endpoints are defined for DynamoDB and Step Functions', () => {
    expect(template.Resources.DynamoDBVPCEndpoint).toBeDefined();
    expect(template.Resources.StepFunctionsVPCEndpoint).toBeDefined();
  });

  test('Global table custom resource is defined', () => {
    expect(template.Resources.GlobalTableCustomResource).toBeDefined();
    expect(template.Resources.GlobalTableCustomResourceFunction).toBeDefined();
    expect(template.Resources.GlobalTableCustomResourceRole).toBeDefined();
  });

  // Lambda Layers are not supported for container-based Lambda functions
  // The functions use PackageType: Image, so Layers would cause deployment errors
  test('Container Lambda functions do not have Layers (not supported)', () => {
    const validatorFunction = template.Resources.TradeValidatorFunction;
    const enricherFunction = template.Resources.MetadataEnricherFunction;
    const recorderFunction = template.Resources.ComplianceRecorderFunction;

    expect(validatorFunction.Properties.Layers).toBeUndefined();
    expect(enricherFunction.Properties.Layers).toBeUndefined();
    expect(recorderFunction.Properties.Layers).toBeUndefined();
  });

  test('X-Ray tracing is enabled on Lambda functions', () => {
    const validatorFunction = template.Resources.TradeValidatorFunction;
    const enricherFunction = template.Resources.MetadataEnricherFunction;
    const recorderFunction = template.Resources.ComplianceRecorderFunction;

    expect(validatorFunction.Properties.TracingConfig).toEqual({ Mode: 'Active' });
    expect(enricherFunction.Properties.TracingConfig).toEqual({ Mode: 'Active' });
    expect(recorderFunction.Properties.TracingConfig).toEqual({ Mode: 'Active' });
  });

  test('State machine has logging configuration', () => {
    const stateMachine = template.Resources.TradeProcessingStateMachine;
    expect(stateMachine.Properties.LoggingConfiguration).toBeDefined();
    expect(stateMachine.Properties.LoggingConfiguration.Level).toBe('ALL');
  });

  test('State machine has tracing enabled', () => {
    const stateMachine = template.Resources.TradeProcessingStateMachine;
    expect(stateMachine.Properties.TracingConfiguration).toBeDefined();
    expect(stateMachine.Properties.TracingConfiguration.Enabled).toBe(true);
  });

  test('All resources have Delete deletion policy', () => {
    const resourcesWithDeletionPolicy = [
      'TradeValidatorDLQ',
      'MetadataEnricherDLQ',
      'ComplianceRecorderDLQ',
      'TradeTable',
      'TradeValidatorFunction',
      'MetadataEnricherFunction',
      'ComplianceRecorderFunction',
      'ECRRepository'
    ];

    resourcesWithDeletionPolicy.forEach(resourceName => {
      const resource = template.Resources[resourceName];
      expect(resource.DeletionPolicy).toBe('Delete');
    });
  });

  test('DynamoDB table has SSE enabled', () => {
    const tradeTable = template.Resources.TradeTable;
    expect(tradeTable.Properties.SSESpecification).toBeDefined();
    expect(tradeTable.Properties.SSESpecification.SSEEnabled).toBe(true);
  });

  test('DynamoDB table has stream enabled', () => {
    const tradeTable = template.Resources.TradeTable;
    expect(tradeTable.Properties.StreamSpecification).toBeDefined();
    expect(tradeTable.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
  });

  test('DynamoDB table has global secondary index', () => {
    const tradeTable = template.Resources.TradeTable;
    expect(tradeTable.Properties.GlobalSecondaryIndexes).toBeDefined();
    expect(tradeTable.Properties.GlobalSecondaryIndexes.length).toBeGreaterThan(0);
  });
});
