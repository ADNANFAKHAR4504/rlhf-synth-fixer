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
      expect(template.Description).toContain('Document Automation System');
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
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });
  });

  describe('DynamoDB Tables', () => {
    test('should have TurnAroundPromptTable resource', () => {
      expect(template.Resources.TurnAroundPromptTable).toBeDefined();
      expect(template.Resources.TurnAroundPromptTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should have DocumentMetadataTable resource', () => {
      expect(template.Resources.DocumentMetadataTable).toBeDefined();
      expect(template.Resources.DocumentMetadataTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should have AuditTrailTable resource', () => {
      expect(template.Resources.AuditTrailTable).toBeDefined();
      expect(template.Resources.AuditTrailTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('DocumentMetadataTable should have correct schema', () => {
      const table = template.Resources.DocumentMetadataTable;
      const keySchema = table.Properties.KeySchema;
      expect(keySchema).toHaveLength(2);
      expect(keySchema[0].AttributeName).toBe('documentId');
      expect(keySchema[1].AttributeName).toBe('createdAt');
    });

    test('AuditTrailTable should have correct schema', () => {
      const table = template.Resources.AuditTrailTable;
      const keySchema = table.Properties.KeySchema;
      expect(keySchema).toHaveLength(2);
      expect(keySchema[0].AttributeName).toBe('auditId');
      expect(keySchema[1].AttributeName).toBe('timestamp');
    });

    test('DocumentMetadataTable should have encryption enabled', () => {
      const table = template.Resources.DocumentMetadataTable;
      expect(table.Properties.SSESpecification).toBeDefined();
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.SSESpecification.SSEType).toBe('KMS');
    });

    test('DocumentMetadataTable should have point-in-time recovery', () => {
      const table = template.Resources.DocumentMetadataTable;
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('DocumentMetadataTable should have GSI', () => {
      const table = template.Resources.DocumentMetadataTable;
      expect(table.Properties.GlobalSecondaryIndexes).toHaveLength(1);
      expect(table.Properties.GlobalSecondaryIndexes[0].IndexName).toBe('UserIdIndex');
    });
  });

  describe('KMS Resources', () => {
    test('should have DocumentEncryptionKey', () => {
      expect(template.Resources.DocumentEncryptionKey).toBeDefined();
      expect(template.Resources.DocumentEncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have DocumentEncryptionKeyAlias', () => {
      expect(template.Resources.DocumentEncryptionKeyAlias).toBeDefined();
      expect(template.Resources.DocumentEncryptionKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('KMS key should have proper policy', () => {
      const key = template.Resources.DocumentEncryptionKey;
      expect(key.Properties.KeyPolicy).toBeDefined();
      expect(key.Properties.KeyPolicy.Statement).toBeInstanceOf(Array);
      expect(key.Properties.KeyPolicy.Statement.length).toBeGreaterThan(0);
    });
  });

  describe('S3 Buckets', () => {
    test('should have TemplatesBucket', () => {
      expect(template.Resources.TemplatesBucket).toBeDefined();
      expect(template.Resources.TemplatesBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have GeneratedDocumentsBucket', () => {
      expect(template.Resources.GeneratedDocumentsBucket).toBeDefined();
      expect(template.Resources.GeneratedDocumentsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have AthenaResultsBucket', () => {
      expect(template.Resources.AthenaResultsBucket).toBeDefined();
      expect(template.Resources.AthenaResultsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('TemplatesBucket should have versioning enabled', () => {
      const bucket = template.Resources.TemplatesBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('GeneratedDocumentsBucket should have versioning enabled', () => {
      const bucket = template.Resources.GeneratedDocumentsBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 buckets should have encryption', () => {
      const buckets = [
        template.Resources.TemplatesBucket,
        template.Resources.GeneratedDocumentsBucket,
        template.Resources.AthenaResultsBucket,
      ];

      buckets.forEach(bucket => {
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      });
    });

    test('S3 buckets should block public access', () => {
      const buckets = [
        template.Resources.TemplatesBucket,
        template.Resources.GeneratedDocumentsBucket,
        template.Resources.AthenaResultsBucket,
      ];

      buckets.forEach(bucket => {
        const config = bucket.Properties.PublicAccessBlockConfiguration;
        expect(config.BlockPublicAcls).toBe(true);
        expect(config.BlockPublicPolicy).toBe(true);
        expect(config.IgnorePublicAcls).toBe(true);
        expect(config.RestrictPublicBuckets).toBe(true);
      });
    });
  });

  describe('IAM Roles', () => {
    test('should have DocumentGenerationRole', () => {
      expect(template.Resources.DocumentGenerationRole).toBeDefined();
      expect(template.Resources.DocumentGenerationRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have ApprovalStateMachineRole', () => {
      expect(template.Resources.ApprovalStateMachineRole).toBeDefined();
      expect(template.Resources.ApprovalStateMachineRole.Type).toBe('AWS::IAM::Role');
    });

    test('DocumentGenerationRole should have Lambda assume role policy', () => {
      const role = template.Resources.DocumentGenerationRole;
      const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Principal.Service).toBe('lambda.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('DocumentGenerationRole should have appropriate policies', () => {
      const role = template.Resources.DocumentGenerationRole;
      expect(role.Properties.Policies).toHaveLength(1);
      expect(role.Properties.Policies[0].PolicyName).toBe('DocumentGenerationPolicy');
    });
  });

  describe('Lambda Functions', () => {
    test('should have DocumentGenerationFunction', () => {
      expect(template.Resources.DocumentGenerationFunction).toBeDefined();
      expect(template.Resources.DocumentGenerationFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should have DocumentAnalysisFunction', () => {
      expect(template.Resources.DocumentAnalysisFunction).toBeDefined();
      expect(template.Resources.DocumentAnalysisFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda functions should use Node.js 22.x runtime', () => {
      const functions = [
        template.Resources.DocumentGenerationFunction,
        template.Resources.DocumentAnalysisFunction,
      ];

      functions.forEach(fn => {
        expect(fn.Properties.Runtime).toBe('nodejs22.x');
      });
    });

    test('Lambda functions should have environment variables', () => {
      const fn = template.Resources.DocumentGenerationFunction;
      expect(fn.Properties.Environment.Variables).toBeDefined();
      expect(fn.Properties.Environment.Variables.TEMPLATES_BUCKET).toBeDefined();
      expect(fn.Properties.Environment.Variables.METADATA_TABLE).toBeDefined();
    });

    test('Lambda functions should have appropriate timeouts', () => {
      const genFn = template.Resources.DocumentGenerationFunction;
      const analysisFn = template.Resources.DocumentAnalysisFunction;
      expect(genFn.Properties.Timeout).toBe(60);
      expect(analysisFn.Properties.Timeout).toBe(120);
    });
  });

  describe('API Gateway', () => {
    test('should have DocumentAPI', () => {
      expect(template.Resources.DocumentAPI).toBeDefined();
      expect(template.Resources.DocumentAPI.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should have DocumentsResource', () => {
      expect(template.Resources.DocumentsResource).toBeDefined();
      expect(template.Resources.DocumentsResource.Type).toBe('AWS::ApiGateway::Resource');
    });

    test('should have GenerateMethod', () => {
      expect(template.Resources.GenerateMethod).toBeDefined();
      expect(template.Resources.GenerateMethod.Type).toBe('AWS::ApiGateway::Method');
    });

    test('should have AnalyzeMethod', () => {
      expect(template.Resources.AnalyzeMethod).toBeDefined();
      expect(template.Resources.AnalyzeMethod.Type).toBe('AWS::ApiGateway::Method');
    });

    test('should have APIDeployment', () => {
      expect(template.Resources.APIDeployment).toBeDefined();
      expect(template.Resources.APIDeployment.Type).toBe('AWS::ApiGateway::Deployment');
    });

    test('API methods should use AWS_IAM authorization', () => {
      const methods = [
        template.Resources.GenerateMethod,
        template.Resources.AnalyzeMethod,
      ];

      methods.forEach(method => {
        expect(method.Properties.AuthorizationType).toBe('AWS_IAM');
      });
    });

    test('API methods should use AWS_PROXY integration', () => {
      const methods = [
        template.Resources.GenerateMethod,
        template.Resources.AnalyzeMethod,
      ];

      methods.forEach(method => {
        expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
      });
    });
  });

  describe('Step Functions', () => {
    test('should have ApprovalWorkflowStateMachine', () => {
      expect(template.Resources.ApprovalWorkflowStateMachine).toBeDefined();
      expect(template.Resources.ApprovalWorkflowStateMachine.Type).toBe('AWS::StepFunctions::StateMachine');
    });

    test('state machine should have definition string', () => {
      const stateMachine = template.Resources.ApprovalWorkflowStateMachine;
      expect(stateMachine.Properties.DefinitionString).toBeDefined();
    });
  });

  describe('SNS Topics', () => {
    test('should have SignatureRequestTopic', () => {
      expect(template.Resources.SignatureRequestTopic).toBeDefined();
      expect(template.Resources.SignatureRequestTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have DocumentNotificationsTopic', () => {
      expect(template.Resources.DocumentNotificationsTopic).toBeDefined();
      expect(template.Resources.DocumentNotificationsTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('SNS topics should have KMS encryption', () => {
      const topics = [
        template.Resources.SignatureRequestTopic,
        template.Resources.DocumentNotificationsTopic,
      ];

      topics.forEach(topic => {
        expect(topic.Properties.KmsMasterKeyId).toBeDefined();
      });
    });
  });

  describe('EventBridge Rules', () => {
    test('should have ComplianceDeadlineRule', () => {
      expect(template.Resources.ComplianceDeadlineRule).toBeDefined();
      expect(template.Resources.ComplianceDeadlineRule.Type).toBe('AWS::Events::Rule');
    });

    test('should have DocumentReminderRule', () => {
      expect(template.Resources.DocumentReminderRule).toBeDefined();
      expect(template.Resources.DocumentReminderRule.Type).toBe('AWS::Events::Rule');
    });

    test('ComplianceDeadlineRule should be enabled', () => {
      const rule = template.Resources.ComplianceDeadlineRule;
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('DocumentReminderRule should have cron schedule', () => {
      const rule = template.Resources.DocumentReminderRule;
      expect(rule.Properties.ScheduleExpression).toContain('cron');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have DocumentMetricsLogGroup', () => {
      expect(template.Resources.DocumentMetricsLogGroup).toBeDefined();
      expect(template.Resources.DocumentMetricsLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have DocumentProcessingAlarm', () => {
      expect(template.Resources.DocumentProcessingAlarm).toBeDefined();
      expect(template.Resources.DocumentProcessingAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('log group should have retention policy', () => {
      const logGroup = template.Resources.DocumentMetricsLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('Athena Resources', () => {
    test('should have AthenaWorkGroup', () => {
      expect(template.Resources.AthenaWorkGroup).toBeDefined();
      expect(template.Resources.AthenaWorkGroup.Type).toBe('AWS::Athena::WorkGroup');
    });

    test('AthenaWorkGroup should have result configuration', () => {
      const workGroup = template.Resources.AthenaWorkGroup;
      expect(workGroup.Properties.WorkGroupConfiguration.ResultConfiguration).toBeDefined();
      expect(workGroup.Properties.WorkGroupConfiguration.ResultConfiguration.EncryptionConfiguration).toBeDefined();
    });
  });

  describe('Glue Resources', () => {
    test('should have DocumentDatabase', () => {
      expect(template.Resources.DocumentDatabase).toBeDefined();
      expect(template.Resources.DocumentDatabase.Type).toBe('AWS::Glue::Database');
    });

    test('should have DocumentMetadataGlueTable', () => {
      expect(template.Resources.DocumentMetadataGlueTable).toBeDefined();
      expect(template.Resources.DocumentMetadataGlueTable.Type).toBe('AWS::Glue::Table');
    });
  });

  describe('Permissions', () => {
    test('should have LambdaAPIPermissionGenerate', () => {
      expect(template.Resources.LambdaAPIPermissionGenerate).toBeDefined();
      expect(template.Resources.LambdaAPIPermissionGenerate.Type).toBe('AWS::Lambda::Permission');
    });

    test('should have LambdaAPIPermissionAnalyze', () => {
      expect(template.Resources.LambdaAPIPermissionAnalyze).toBeDefined();
      expect(template.Resources.LambdaAPIPermissionAnalyze.Type).toBe('AWS::Lambda::Permission');
    });

    test('should have EventBridgeLambdaPermission', () => {
      expect(template.Resources.EventBridgeLambdaPermission).toBeDefined();
      expect(template.Resources.EventBridgeLambdaPermission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'DocumentMetadataTableName',
        'AuditTrailTableName',
        'DocumentAPIUrl',
        'TemplatesBucketName',
        'GeneratedDocumentsBucketName',
        'DocumentGenerationFunctionArn',
        'DocumentAnalysisFunctionArn',
        'ApprovalWorkflowStateMachineArn',
        'SignatureRequestTopicArn',
        'DocumentEncryptionKeyId',
        'AthenaWorkGroupName',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });

    test('outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should use environment suffix', () => {
      const resources = [
        template.Resources.DocumentMetadataTable,
        template.Resources.AuditTrailTable,
      ];

      resources.forEach(resource => {
        if (resource.Properties.TableName) {
          expect(JSON.stringify(resource.Properties.TableName)).toContain('EnvironmentSuffix');
        }
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(JSON.stringify(output.Export.Name)).toContain('AWS::StackName');
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

    test('should have multiple resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30);
    });

    test('all resources should have tags with Environment', () => {
      const taggedResourceTypes = [
        'AWS::DynamoDB::Table',
        'AWS::S3::Bucket',
        'AWS::Lambda::Function',
        'AWS::IAM::Role',
        'AWS::SNS::Topic',
        'AWS::KMS::Key',
      ];

      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (taggedResourceTypes.includes(resource.Type)) {
          if (resource.Properties.Tags) {
            const envTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
            expect(envTag).toBeDefined();
          }
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('DynamoDB tables should have encryption', () => {
      const encryptedTables = [
        template.Resources.DocumentMetadataTable,
        template.Resources.AuditTrailTable,
      ];

      encryptedTables.forEach(table => {
        expect(table.Properties.SSESpecification).toBeDefined();
        expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      });
    });

    test('S3 buckets should have lifecycle policies', () => {
      const buckets = [
        template.Resources.TemplatesBucket,
        template.Resources.GeneratedDocumentsBucket,
        template.Resources.AthenaResultsBucket,
      ];

      buckets.forEach(bucket => {
        expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
        expect(bucket.Properties.LifecycleConfiguration.Rules).toBeInstanceOf(Array);
      });
    });

    test('IAM roles should have assume role policies', () => {
      const roles = [
        template.Resources.DocumentGenerationRole,
        template.Resources.ApprovalStateMachineRole,
      ];

      roles.forEach(role => {
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
        expect(role.Properties.AssumeRolePolicyDocument.Statement).toBeInstanceOf(Array);
      });
    });
  });
});
