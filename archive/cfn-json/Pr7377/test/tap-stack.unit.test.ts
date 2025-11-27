import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Helper function interfaces
interface CloudFormationTemplate {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Resources: Record<string, any>;
  Outputs?: Record<string, any>;
}

interface ResourceEntry {
  logicalId: string;
  resource: any;
}

// Helper functions defined inline
function loadTemplate(): CloudFormationTemplate {
  const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  return JSON.parse(templateContent);
}

function validateTemplate(template: CloudFormationTemplate): boolean {
  if (!template.AWSTemplateFormatVersion) {
    throw new Error('Missing AWSTemplateFormatVersion');
  }
  if (template.AWSTemplateFormatVersion !== '2010-09-09') {
    throw new Error('Invalid CloudFormation version');
  }
  if (!template.Resources || Object.keys(template.Resources).length === 0) {
    throw new Error('Template must have at least one resource');
  }
  return true;
}

function getResource(
  template: CloudFormationTemplate,
  logicalId: string
): any | undefined {
  return template.Resources?.[logicalId];
}

function getResourcesByType(
  template: CloudFormationTemplate,
  type: string
): ResourceEntry[] {
  const resources: ResourceEntry[] = [];
  if (template.Resources) {
    for (const [logicalId, resource] of Object.entries(template.Resources)) {
      if (resource.Type === type) {
        resources.push({ logicalId, resource });
      }
    }
  }
  return resources;
}

function validateResourceNaming(nameValue: any, suffix: string): boolean {
  if (typeof nameValue === 'string') {
    return nameValue.includes(suffix);
  }
  if (nameValue && typeof nameValue === 'object' && 'Fn::Sub' in nameValue) {
    const subValue = nameValue['Fn::Sub'];
    if (typeof subValue === 'string') {
      return subValue.includes('${EnvironmentSuffix}');
    }
  }
  return false;
}

function getParameterDefault(
  template: CloudFormationTemplate,
  paramName: string
): any | undefined {
  return template.Parameters?.[paramName]?.Default;
}

function validateResourceTags(
  template: CloudFormationTemplate,
  requiredTags: string[]
): string[] {
  const missingTags: string[] = [];
  if (template.Resources) {
    for (const [logicalId, resource] of Object.entries(template.Resources)) {
      const tags = resource.Properties?.Tags;
      if (tags && Array.isArray(tags)) {
        for (const requiredTag of requiredTags) {
          const hasTag = tags.some((tag: any) => tag.Key === requiredTag);
          if (!hasTag) {
            missingTags.push(`${logicalId} missing ${requiredTag}`);
          }
        }
      }
    }
  }
  return missingTags;
}

function hasRetainPolicy(resource: any): boolean {
  if (resource.DeletionPolicy === 'Retain') {
    return true;
  }
  if (resource.UpdateReplacePolicy === 'Retain') {
    return true;
  }
  if (resource.Properties?.DeletionProtectionEnabled === true) {
    return true;
  }
  return false;
}

function getOutputs(template: CloudFormationTemplate): string[] {
  if (template.Outputs) {
    return Object.keys(template.Outputs);
  }
  return [];
}

function validateEncryption(template: CloudFormationTemplate): string[] {
  const unencryptedResources: string[] = [];
  if (template.Resources) {
    for (const [logicalId, resource] of Object.entries(template.Resources)) {
      if (resource.Type === 'AWS::DynamoDB::Table') {
        const sseSpec = resource.Properties?.SSESpecification;
        if (!sseSpec || sseSpec.SSEEnabled !== true) {
          unencryptedResources.push(logicalId);
        }
      }
      if (resource.Type === 'AWS::S3::Bucket') {
        const encryption = resource.Properties?.BucketEncryption;
        if (!encryption) {
          unencryptedResources.push(logicalId);
        }
      }
    }
  }
  return unencryptedResources;
}

describe('TapStack CloudFormation Template - Fraud Detection Pipeline', () => {
  let template: any;

  beforeAll(() => {
    template = loadTemplate();
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Fraud Detection');
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should pass validation', () => {
      expect(validateTemplate(template)).toBe(true);
    });

    test('should throw error for invalid template version', () => {
      const invalidTemplate = { ...template, AWSTemplateFormatVersion: '2009-09-09' };
      expect(() => validateTemplate(invalidTemplate)).toThrow('Invalid CloudFormation version');
    });

    test('should throw error for missing resources', () => {
      const invalidTemplate = { ...template, Resources: {} };
      expect(() => validateTemplate(invalidTemplate)).toThrow('must have at least one resource');
    });

    test('should throw error for missing version', () => {
      const invalidTemplate = { ...template };
      delete invalidTemplate.AWSTemplateFormatVersion;
      expect(() => validateTemplate(invalidTemplate)).toThrow('Missing AWSTemplateFormatVersion');
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
      expect(envSuffixParam.AllowedPattern).toBeDefined();
      expect(envSuffixParam.ConstraintDescription).toBeDefined();
    });

    test('should get parameter default value', () => {
      const defaultValue = getParameterDefault(template, 'EnvironmentSuffix');
      expect(defaultValue).toBe('dev');
    });

    test('should return undefined for non-existent parameter', () => {
      const defaultValue = getParameterDefault(template, 'NonExistent');
      expect(defaultValue).toBeUndefined();
    });
  });

  describe('Resource Helper Functions', () => {
    test('should get resource by logical ID', () => {
      const table = getResource(template, 'TransactionTable');
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should return undefined for non-existent resource', () => {
      const resource = getResource(template, 'NonExistentResource');
      expect(resource).toBeUndefined();
    });

    test('should get resources by type', () => {
      const lambdaFunctions = getResourcesByType(template, 'AWS::Lambda::Function');
      expect(lambdaFunctions).toHaveLength(2);
      expect(lambdaFunctions[0].logicalId).toBeDefined();
      expect(lambdaFunctions[0].resource.Type).toBe('AWS::Lambda::Function');
    });

    test('should return empty array for non-existent resource type', () => {
      const resources = getResourcesByType(template, 'AWS::RDS::DBInstance');
      expect(resources).toHaveLength(0);
    });

    test('should get all outputs', () => {
      const outputs = getOutputs(template);
      expect(outputs).toHaveLength(6);
      expect(outputs).toContain('StateMachineArn');
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have TransactionTable resource', () => {
      expect(template.Resources.TransactionTable).toBeDefined();
    });

    test('TransactionTable should be a DynamoDB table', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('TransactionTable should have correct deletion policy', () => {
      const table = template.Resources.TransactionTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(hasRetainPolicy(table)).toBe(false);
    });

    test('TransactionTable should have correct table name with environment suffix', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'fraud-transactions-${EnvironmentSuffix}',
      });
      expect(validateResourceNaming(table.Properties.TableName, environmentSuffix)).toBe(true);
    });

    test('TransactionTable should use PAY_PER_REQUEST billing', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('TransactionTable should have correct attribute definitions', () => {
      const table = template.Resources.TransactionTable;
      const attributes = table.Properties.AttributeDefinitions;

      expect(attributes).toHaveLength(2);
      expect(attributes[0].AttributeName).toBe('transactionId');
      expect(attributes[0].AttributeType).toBe('S');
      expect(attributes[1].AttributeName).toBe('timestamp');
      expect(attributes[1].AttributeType).toBe('N');
    });

    test('TransactionTable should have correct key schema', () => {
      const table = template.Resources.TransactionTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(2);
      expect(keySchema[0].AttributeName).toBe('transactionId');
      expect(keySchema[0].KeyType).toBe('HASH');
      expect(keySchema[1].AttributeName).toBe('timestamp');
      expect(keySchema[1].KeyType).toBe('RANGE');
    });

    test('TransactionTable should have encryption enabled', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.SSESpecification.SSEType).toBe('KMS');
    });

    test('TransactionTable should have point-in-time recovery enabled', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });
  });

  describe('S3 Resources', () => {
    test('should have ArchiveBucket resource', () => {
      expect(template.Resources.ArchiveBucket).toBeDefined();
    });

    test('ArchiveBucket should be an S3 bucket', () => {
      const bucket = template.Resources.ArchiveBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('ArchiveBucket should have correct deletion policy', () => {
      const bucket = template.Resources.ArchiveBucket;
      expect(bucket.DeletionPolicy).toBe('Delete');
    });

    test('ArchiveBucket should have correct bucket name with environment suffix', () => {
      const bucket = template.Resources.ArchiveBucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'fraud-archive-${EnvironmentSuffix}-${AWS::AccountId}',
      });
      expect(validateResourceNaming(bucket.Properties.BucketName, environmentSuffix)).toBe(true);
    });

    test('ArchiveBucket should have versioning enabled', () => {
      const bucket = template.Resources.ArchiveBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('ArchiveBucket should have encryption enabled', () => {
      const bucket = template.Resources.ArchiveBucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('ArchiveBucket should block all public access', () => {
      const bucket = template.Resources.ArchiveBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('ArchiveBucket should have lifecycle configuration', () => {
      const bucket = template.Resources.ArchiveBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toHaveLength(1);

      const rule = bucket.Properties.LifecycleConfiguration.Rules[0];
      expect(rule.Status).toBe('Enabled');
      expect(rule.Transitions[0].TransitionInDays).toBe(90);
      expect(rule.Transitions[0].StorageClass).toBe('GLACIER');
    });

    test('ArchiveBucket should have intelligent tiering configuration', () => {
      const bucket = template.Resources.ArchiveBucket;
      expect(bucket.Properties.IntelligentTieringConfigurations).toBeDefined();
      expect(bucket.Properties.IntelligentTieringConfigurations).toHaveLength(1);

      const config = bucket.Properties.IntelligentTieringConfigurations[0];
      expect(config.Status).toBe('Enabled');
      expect(config.Tierings).toHaveLength(2);
    });
  });

  describe('SNS Resources', () => {
    test('should have ComplianceTopic resource', () => {
      expect(template.Resources.ComplianceTopic).toBeDefined();
    });

    test('ComplianceTopic should be an SNS topic', () => {
      const topic = template.Resources.ComplianceTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('ComplianceTopic should have correct topic name with environment suffix', () => {
      const topic = template.Resources.ComplianceTopic;
      expect(topic.Properties.TopicName).toEqual({
        'Fn::Sub': 'fraud-compliance-alerts-${EnvironmentSuffix}',
      });
    });

    test('ComplianceTopic should have display name', () => {
      const topic = template.Resources.ComplianceTopic;
      expect(topic.Properties.DisplayName).toBe('Fraud Detection Compliance Alerts');
    });
  });

  describe('Lambda Resources', () => {
    test('should have two Lambda functions', () => {
      const lambdaFunctions = getResourcesByType(template, 'AWS::Lambda::Function');
      expect(lambdaFunctions).toHaveLength(2);
    });

    test('should have TransactionProcessorFunction resource', () => {
      expect(template.Resources.TransactionProcessorFunction).toBeDefined();
    });

    test('should have PostProcessorFunction resource', () => {
      expect(template.Resources.PostProcessorFunction).toBeDefined();
    });

    test('TransactionProcessorFunction should be a Lambda function', () => {
      const fn = template.Resources.TransactionProcessorFunction;
      expect(fn.Type).toBe('AWS::Lambda::Function');
    });

    test('PostProcessorFunction should be a Lambda function', () => {
      const fn = template.Resources.PostProcessorFunction;
      expect(fn.Type).toBe('AWS::Lambda::Function');
    });

    test('TransactionProcessorFunction should have correct name with environment suffix', () => {
      const fn = template.Resources.TransactionProcessorFunction;
      expect(fn.Properties.FunctionName).toEqual({
        'Fn::Sub': 'fraud-processor-${EnvironmentSuffix}',
      });
    });

    test('PostProcessorFunction should have correct name with environment suffix', () => {
      const fn = template.Resources.PostProcessorFunction;
      expect(fn.Properties.FunctionName).toEqual({
        'Fn::Sub': 'fraud-post-processor-${EnvironmentSuffix}',
      });
    });

    test('TransactionProcessorFunction should use Python 3.11 runtime', () => {
      const fn = template.Resources.TransactionProcessorFunction;
      expect(fn.Properties.Runtime).toBe('python3.11');
    });

    test('PostProcessorFunction should use Python 3.11 runtime', () => {
      const fn = template.Resources.PostProcessorFunction;
      expect(fn.Properties.Runtime).toBe('python3.11');
    });

    test('TransactionProcessorFunction should have X-Ray tracing enabled', () => {
      const fn = template.Resources.TransactionProcessorFunction;
      expect(fn.Properties.TracingConfig.Mode).toBe('Active');
    });

    test('PostProcessorFunction should have X-Ray tracing enabled', () => {
      const fn = template.Resources.PostProcessorFunction;
      expect(fn.Properties.TracingConfig.Mode).toBe('Active');
    });

    test('TransactionProcessorFunction should not have reserved concurrency', () => {
      const fn = template.Resources.TransactionProcessorFunction;
      expect(fn.Properties.ReservedConcurrentExecutions).toBeUndefined();
    });

    test('PostProcessorFunction should not have reserved concurrency', () => {
      const fn = template.Resources.PostProcessorFunction;
      expect(fn.Properties.ReservedConcurrentExecutions).toBeUndefined();
    });

    test('TransactionProcessorFunction should have correct environment variables', () => {
      const fn = template.Resources.TransactionProcessorFunction;
      const env = fn.Properties.Environment.Variables;

      expect(env.TABLE_NAME).toEqual({ Ref: 'TransactionTable' });
      expect(env.SNS_TOPIC_ARN).toEqual({ Ref: 'ComplianceTopic' });
      expect(env.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('PostProcessorFunction should have correct environment variables', () => {
      const fn = template.Resources.PostProcessorFunction;
      const env = fn.Properties.Environment.Variables;

      expect(env.TABLE_NAME).toEqual({ Ref: 'TransactionTable' });
      expect(env.BUCKET_NAME).toEqual({ Ref: 'ArchiveBucket' });
      expect(env.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('TransactionProcessorFunction should have inline code', () => {
      const fn = template.Resources.TransactionProcessorFunction;
      expect(fn.Properties.Code.ZipFile).toBeDefined();
      expect(fn.Properties.Code.ZipFile['Fn::Join']).toBeDefined();
    });

    test('PostProcessorFunction should have inline code', () => {
      const fn = template.Resources.PostProcessorFunction;
      expect(fn.Properties.Code.ZipFile).toBeDefined();
      expect(fn.Properties.Code.ZipFile['Fn::Join']).toBeDefined();
    });

    test('Lambda functions should have correct memory and timeout', () => {
      const processor = template.Resources.TransactionProcessorFunction;
      const postProcessor = template.Resources.PostProcessorFunction;

      expect(processor.Properties.MemorySize).toBe(1024);
      expect(processor.Properties.Timeout).toBe(60);
      expect(postProcessor.Properties.MemorySize).toBe(512);
      expect(postProcessor.Properties.Timeout).toBe(60);
    });
  });

  describe('IAM Resources', () => {
    test('should have four IAM roles', () => {
      const iamRoles = getResourcesByType(template, 'AWS::IAM::Role');
      expect(iamRoles).toHaveLength(4);
    });

    test('should have TransactionProcessorRole resource', () => {
      expect(template.Resources.TransactionProcessorRole).toBeDefined();
    });

    test('should have PostProcessorRole resource', () => {
      expect(template.Resources.PostProcessorRole).toBeDefined();
    });

    test('should have StepFunctionsRole resource', () => {
      expect(template.Resources.StepFunctionsRole).toBeDefined();
    });

    test('should have EventBridgeRole resource', () => {
      expect(template.Resources.EventBridgeRole).toBeDefined();
    });

    test('TransactionProcessorRole should be an IAM role', () => {
      const role = template.Resources.TransactionProcessorRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('TransactionProcessorRole should have correct role name with environment suffix', () => {
      const role = template.Resources.TransactionProcessorRole;
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': 'fraud-processor-role-${EnvironmentSuffix}',
      });
    });

    test('TransactionProcessorRole should have Lambda assume role policy', () => {
      const role = template.Resources.TransactionProcessorRole;
      const policy = role.Properties.AssumeRolePolicyDocument;

      expect(policy.Statement[0].Effect).toBe('Allow');
      expect(policy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(policy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('TransactionProcessorRole should have X-Ray write access', () => {
      const role = template.Resources.TransactionProcessorRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess');
    });

    test('StepFunctionsRole should have correct assume role policy', () => {
      const role = template.Resources.StepFunctionsRole;
      const policy = role.Properties.AssumeRolePolicyDocument;

      expect(policy.Statement[0].Effect).toBe('Allow');
      expect(policy.Statement[0].Principal.Service).toBe('states.amazonaws.com');
      expect(policy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('EventBridgeRole should have correct assume role policy', () => {
      const role = template.Resources.EventBridgeRole;
      const policy = role.Properties.AssumeRolePolicyDocument;

      expect(policy.Statement[0].Effect).toBe('Allow');
      expect(policy.Statement[0].Principal.Service).toBe('events.amazonaws.com');
      expect(policy.Statement[0].Action).toBe('sts:AssumeRole');
    });
  });

  describe('CloudWatch Logs Resources', () => {
    test('should have two log groups', () => {
      const logGroups = getResourcesByType(template, 'AWS::Logs::LogGroup');
      expect(logGroups).toHaveLength(2);
    });

    test('should have TransactionProcessorLogGroup resource', () => {
      expect(template.Resources.TransactionProcessorLogGroup).toBeDefined();
    });

    test('should have PostProcessorLogGroup resource', () => {
      expect(template.Resources.PostProcessorLogGroup).toBeDefined();
    });

    test('TransactionProcessorLogGroup should be a CloudWatch log group', () => {
      const logGroup = template.Resources.TransactionProcessorLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('TransactionProcessorLogGroup should have correct retention', () => {
      const logGroup = template.Resources.TransactionProcessorLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('TransactionProcessorLogGroup should have correct deletion policy', () => {
      const logGroup = template.Resources.TransactionProcessorLogGroup;
      expect(logGroup.DeletionPolicy).toBe('Delete');
    });

    test('Log groups should have correct names with environment suffix', () => {
      const processor = template.Resources.TransactionProcessorLogGroup;
      const postProcessor = template.Resources.PostProcessorLogGroup;

      expect(processor.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/fraud-processor-${EnvironmentSuffix}',
      });
      expect(postProcessor.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/fraud-post-processor-${EnvironmentSuffix}',
      });
    });
  });

  describe('Step Functions Resources', () => {
    test('should have FraudDetectionStateMachine resource', () => {
      expect(template.Resources.FraudDetectionStateMachine).toBeDefined();
    });

    test('FraudDetectionStateMachine should be a Step Functions state machine', () => {
      const sm = template.Resources.FraudDetectionStateMachine;
      expect(sm.Type).toBe('AWS::StepFunctions::StateMachine');
    });

    test('FraudDetectionStateMachine should have correct name with environment suffix', () => {
      const sm = template.Resources.FraudDetectionStateMachine;
      expect(sm.Properties.StateMachineName).toEqual({
        'Fn::Sub': 'fraud-detection-workflow-${EnvironmentSuffix}',
      });
    });

    test('FraudDetectionStateMachine should have tracing enabled', () => {
      const sm = template.Resources.FraudDetectionStateMachine;
      expect(sm.Properties.TracingConfiguration.Enabled).toBe(true);
    });

    test('FraudDetectionStateMachine should have definition string', () => {
      const sm = template.Resources.FraudDetectionStateMachine;
      expect(sm.Properties.DefinitionString).toBeDefined();
      expect(sm.Properties.DefinitionString['Fn::Sub']).toBeDefined();
    });
  });

  describe('EventBridge Resources', () => {
    test('should have TransactionEventRule resource', () => {
      expect(template.Resources.TransactionEventRule).toBeDefined();
    });

    test('TransactionEventRule should be an EventBridge rule', () => {
      const rule = template.Resources.TransactionEventRule;
      expect(rule.Type).toBe('AWS::Events::Rule');
    });

    test('TransactionEventRule should have correct name with environment suffix', () => {
      const rule = template.Resources.TransactionEventRule;
      expect(rule.Properties.Name).toEqual({
        'Fn::Sub': 'fraud-transaction-rule-${EnvironmentSuffix}',
      });
    });

    test('TransactionEventRule should be enabled', () => {
      const rule = template.Resources.TransactionEventRule;
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('TransactionEventRule should have correct event pattern', () => {
      const rule = template.Resources.TransactionEventRule;
      const pattern = rule.Properties.EventPattern;

      expect(pattern.source).toEqual(['custom.frauddetection']);
      expect(pattern['detail-type']).toEqual(['Transaction Received']);
      expect(pattern.detail.amount[0].numeric).toEqual(['>=', 100]);
    });

    test('TransactionEventRule should have state machine target', () => {
      const rule = template.Resources.TransactionEventRule;
      const targets = rule.Properties.Targets;

      expect(targets).toHaveLength(1);
      expect(targets[0].Arn).toEqual({ Ref: 'FraudDetectionStateMachine' });
      expect(targets[0].Id).toBe('FraudDetectionTarget');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'StateMachineArn',
        'ArchiveBucketName',
        'ComplianceTopicArn',
        'TransactionTableName',
        'ProcessorFunctionArn',
        'PostProcessorFunctionArn',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('StateMachineArn output should be correct', () => {
      const output = template.Outputs.StateMachineArn;
      expect(output.Description).toContain('state machine');
      expect(output.Value).toEqual({ Ref: 'FraudDetectionStateMachine' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': 'FraudDetectionStateMachine-${EnvironmentSuffix}',
      });
    });

    test('ArchiveBucketName output should be correct', () => {
      const output = template.Outputs.ArchiveBucketName;
      expect(output.Description).toContain('S3 bucket');
      expect(output.Value).toEqual({ Ref: 'ArchiveBucket' });
    });

    test('ComplianceTopicArn output should be correct', () => {
      const output = template.Outputs.ComplianceTopicArn;
      expect(output.Description).toContain('SNS topic');
      expect(output.Value).toEqual({ Ref: 'ComplianceTopic' });
    });

    test('TransactionTableName output should be correct', () => {
      const output = template.Outputs.TransactionTableName;
      expect(output.Description).toContain('DynamoDB table');
      expect(output.Value).toEqual({ Ref: 'TransactionTable' });
    });

    test('Lambda function outputs should be correct', () => {
      const processor = template.Outputs.ProcessorFunctionArn;
      const postProcessor = template.Outputs.PostProcessorFunctionArn;

      expect(processor.Value).toEqual({
        'Fn::GetAtt': ['TransactionProcessorFunction', 'Arn'],
      });
      expect(postProcessor.Value).toEqual({
        'Fn::GetAtt': ['PostProcessorFunction', 'Arn'],
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have exactly 13 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(13);
    });

    test('should have exactly 1 parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have exactly 6 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(6);
    });
  });

  describe('Resource Dependencies', () => {
    test('TransactionProcessorFunction should depend on log group', () => {
      const fn = template.Resources.TransactionProcessorFunction;
      expect(fn.DependsOn).toContain('TransactionProcessorLogGroup');
    });

    test('PostProcessorFunction should depend on log group', () => {
      const fn = template.Resources.PostProcessorFunction;
      expect(fn.DependsOn).toContain('PostProcessorLogGroup');
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have Environment tag', () => {
      const resourcesWithTags = [
        'TransactionTable',
        'ArchiveBucket',
        'ComplianceTopic',
        'TransactionProcessorRole',
        'PostProcessorRole',
        'TransactionProcessorFunction',
        'PostProcessorFunction',
        'StepFunctionsRole',
        'FraudDetectionStateMachine',
        'EventBridgeRole',
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties.Tags;

        expect(tags).toBeDefined();
        const envTag = tags.find((tag: any) => tag.Key === 'Environment');
        expect(envTag).toBeDefined();
        expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
      });
    });

    test('should validate resource tags with helper function', () => {
      const missingTags = validateResourceTags(template, ['Environment']);
      // Filter out log groups which don't support tags
      const filteredMissing = missingTags.filter(
        item => !item.includes('LogGroup') && !item.includes('EventRule')
      );
      expect(filteredMissing).toHaveLength(0);
    });
  });

  describe('Security Validation', () => {
    test('all encryption-capable resources should be encrypted', () => {
      const unencrypted = validateEncryption(template);
      expect(unencrypted).toHaveLength(0);
    });

    test('no resources should have retain policies', () => {
      const table = template.Resources.TransactionTable;
      const bucket = template.Resources.ArchiveBucket;

      expect(hasRetainPolicy(table)).toBe(false);
      expect(hasRetainPolicy(bucket)).toBe(false);
    });

    test('should validate resource with DeletionProtection', () => {
      const mockResource = {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          DeletionProtectionEnabled: true,
        },
      };
      expect(hasRetainPolicy(mockResource)).toBe(true);
    });

    test('should validate resource naming with string value', () => {
      expect(validateResourceNaming('test-dev-resource', 'dev')).toBe(true);
      expect(validateResourceNaming('test-prod-resource', 'dev')).toBe(false);
    });

    test('should return false for invalid resource naming patterns', () => {
      expect(validateResourceNaming(123, 'dev')).toBe(false);
      expect(validateResourceNaming(null, 'dev')).toBe(false);
      expect(validateResourceNaming({ invalid: 'format' }, 'dev')).toBe(false);
    });

    test('should detect missing required tags', () => {
      const missingTags = validateResourceTags(template, ['Environment', 'NonExistentTag']);
      expect(missingTags.length).toBeGreaterThan(0);
      expect(missingTags.some(tag => tag.includes('missing NonExistentTag'))).toBe(true);
    });

    test('should detect resources without encryption', () => {
      const mockTemplate = {
        ...template,
        Resources: {
          UnencryptedTable: {
            Type: 'AWS::DynamoDB::Table',
            Properties: {
              TableName: 'test-table',
            },
          },
          UnencryptedBucket: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              BucketName: 'test-bucket',
            },
          },
        },
      };
      const unencrypted = validateEncryption(mockTemplate);
      expect(unencrypted).toContain('UnencryptedTable');
      expect(unencrypted).toContain('UnencryptedBucket');
    });

    test('should validate resource with UpdateReplacePolicy Retain', () => {
      const mockResource = {
        Type: 'AWS::S3::Bucket',
        UpdateReplacePolicy: 'Retain',
        Properties: {},
      };
      expect(hasRetainPolicy(mockResource)).toBe(true);
    });

    test('should validate resource with DeletionPolicy Retain', () => {
      const mockResource = {
        Type: 'AWS::S3::Bucket',
        DeletionPolicy: 'Retain',
        Properties: {},
      };
      expect(hasRetainPolicy(mockResource)).toBe(true);
    });
  });
});
