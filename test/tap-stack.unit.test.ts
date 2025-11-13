import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Transaction Processing', () => {
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

    test('should have a description for financial services', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Transaction Processing');
      expect(template.Description).toContain('financial services');
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const requiredParams = ['Environment', 'EnvironmentSuffix', 'LambdaMemorySize', 'CostCenter', 'Application'];
      requiredParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('Environment parameter should have correct values', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    test('LambdaMemorySize parameter should have allowed values', () => {
      const param = template.Parameters.LambdaMemorySize;
      expect(param.Type).toBe('Number');
      expect(param.AllowedValues).toEqual([512, 1024, 2048, 3008]);
      expect(param.Default).toBe(1024);
    });

    test('EnvironmentSuffix parameter should have pattern validation', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toBeDefined();
      expect(param.ConstraintDescription).toBeDefined();
    });

    test('CostCenter parameter should be required', () => {
      const param = template.Parameters.CostCenter;
      expect(param.Type).toBe('String');
      expect(param.Description).toContain('Cost center');
    });
  });

  describe('Mappings', () => {
    test('should have EnvironmentConfig mapping', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Mappings.EnvironmentConfig).toBeDefined();
    });

    test('EnvironmentConfig should have log retention for all environments', () => {
      const envConfig = template.Mappings.EnvironmentConfig;
      expect(envConfig.dev).toBeDefined();
      expect(envConfig.staging).toBeDefined();
      expect(envConfig.prod).toBeDefined();

      expect(envConfig.dev.LogRetentionDays).toBe(7);
      expect(envConfig.staging.LogRetentionDays).toBe(30);
      expect(envConfig.prod.LogRetentionDays).toBe(90);
    });
  });

  describe('Conditions', () => {
    test('should have IsProduction condition', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.IsProduction).toBeDefined();
    });

    test('IsProduction condition should check Environment parameter', () => {
      const condition = template.Conditions.IsProduction;
      expect(condition['Fn::Equals']).toBeDefined();
      expect(condition['Fn::Equals'][0]).toEqual({ Ref: 'Environment' });
      expect(condition['Fn::Equals'][1]).toBe('prod');
    });
  });

  describe('Resources - DynamoDB Table', () => {
    test('should have TransactionTable resource', () => {
      expect(template.Resources.TransactionTable).toBeDefined();
    });

    test('TransactionTable should be a DynamoDB table', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('TransactionTable should have Retain deletion policy', () => {
      const table = template.Resources.TransactionTable;
      expect(table.DeletionPolicy).toBe('Retain');
      expect(table.UpdateReplacePolicy).toBe('Retain');
    });

    test('TransactionTable should use environment suffix in name', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'transaction-table-${EnvironmentSuffix}'
      });
    });

    test('TransactionTable should have PAY_PER_REQUEST billing', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('TransactionTable should have encryption enabled', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Properties.SSESpecification).toBeDefined();
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('TransactionTable should have point-in-time recovery', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Properties.PointInTimeRecoverySpecification).toBeDefined();
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
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

    test('TransactionTable should have mandatory tags', () => {
      const table = template.Resources.TransactionTable;
      const tags = table.Properties.Tags;

      expect(tags).toBeDefined();
      expect(tags.length).toBeGreaterThanOrEqual(3);

      const tagKeys = tags.map((t: any) => t.Key);
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('CostCenter');
      expect(tagKeys).toContain('Application');
    });
  });

  describe('Resources - S3 Bucket', () => {
    test('should have AuditLogBucket resource', () => {
      expect(template.Resources.AuditLogBucket).toBeDefined();
    });

    test('AuditLogBucket should be an S3 bucket', () => {
      const bucket = template.Resources.AuditLogBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('AuditLogBucket should have Retain deletion policy', () => {
      const bucket = template.Resources.AuditLogBucket;
      expect(bucket.DeletionPolicy).toBe('Retain');
      expect(bucket.UpdateReplacePolicy).toBe('Retain');
    });

    test('AuditLogBucket should have encryption enabled', () => {
      const bucket = template.Resources.AuditLogBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('AuditLogBucket should block public access', () => {
      const bucket = template.Resources.AuditLogBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessBlock).toBeDefined();
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('AuditLogBucket should have versioning enabled', () => {
      const bucket = template.Resources.AuditLogBucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('AuditLogBucket should have conditional lifecycle policy', () => {
      const bucket = template.Resources.AuditLogBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration['Fn::If']).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration['Fn::If'][0]).toBe('IsProduction');
    });
  });

  describe('Resources - IAM Role', () => {
    test('should have LambdaExecutionRole resource', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
    });

    test('LambdaExecutionRole should be an IAM role', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('LambdaExecutionRole should have specific DynamoDB permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;

      const dynamoPolicy = policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');
      expect(dynamoPolicy).toBeDefined();

      const actions = dynamoPolicy.PolicyDocument.Statement[0].Action;
      expect(actions).toContain('dynamodb:GetItem');
      expect(actions).toContain('dynamodb:PutItem');
      expect(actions).toContain('dynamodb:UpdateItem');
      expect(actions).toContain('dynamodb:Query');
      expect(actions).toContain('dynamodb:Scan');
      expect(actions).not.toContain('dynamodb:*');
    });

    test('LambdaExecutionRole should have scoped DynamoDB resource permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;

      const dynamoPolicy = policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');
      const resources = dynamoPolicy.PolicyDocument.Statement[0].Resource;

      expect(resources).toBeDefined();
      expect(Array.isArray(resources)).toBe(true);
      expect(resources.length).toBeGreaterThan(0);
      expect(resources[0]).toHaveProperty('Fn::GetAtt');
    });

    test('LambdaExecutionRole should have S3 audit log permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;

      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3AuditLogAccess');
      expect(s3Policy).toBeDefined();

      const actions = s3Policy.PolicyDocument.Statement[0].Action;
      expect(actions).toContain('s3:PutObject');
    });

    test('LambdaExecutionRole should have CloudWatch Logs permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;

      const logsPolicy = policies.find((p: any) => p.PolicyName === 'CloudWatchLogsAccess');
      expect(logsPolicy).toBeDefined();
    });

    test('LambdaExecutionRole should have VPC execution permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toBeDefined();
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );
    });
  });

  describe('Resources - Lambda Function', () => {
    test('should have TransactionProcessorFunction resource', () => {
      expect(template.Resources.TransactionProcessorFunction).toBeDefined();
    });

    test('TransactionProcessorFunction should be a Lambda function', () => {
      const lambda = template.Resources.TransactionProcessorFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    // Test removed - DependsOn was removed as it's not needed when using GetAtt

    test('TransactionProcessorFunction should use parameterized memory size', () => {
      const lambda = template.Resources.TransactionProcessorFunction;
      expect(lambda.Properties.MemorySize).toEqual({ Ref: 'LambdaMemorySize' });
    });

    test('TransactionProcessorFunction should have environment variables', () => {
      const lambda = template.Resources.TransactionProcessorFunction;
      expect(lambda.Properties.Environment).toBeDefined();
      expect(lambda.Properties.Environment.Variables).toBeDefined();
      expect(lambda.Properties.Environment.Variables.TABLE_NAME).toEqual({ Ref: 'TransactionTable' });
      expect(lambda.Properties.Environment.Variables.BUCKET_NAME).toEqual({ Ref: 'AuditLogBucket' });
    });

    test('TransactionProcessorFunction should use Python runtime', () => {
      const lambda = template.Resources.TransactionProcessorFunction;
      expect(lambda.Properties.Runtime).toBe('python3.11');
    });
  });

  describe('Resources - CloudWatch Logs', () => {
    test('should have TransactionProcessorLogGroup resource', () => {
      expect(template.Resources.TransactionProcessorLogGroup).toBeDefined();
    });

    test('TransactionProcessorLogGroup should be a log group', () => {
      const logGroup = template.Resources.TransactionProcessorLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('TransactionProcessorLogGroup should use environment-specific retention', () => {
      const logGroup = template.Resources.TransactionProcessorLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBeDefined();
      expect(logGroup.Properties.RetentionInDays['Fn::FindInMap']).toBeDefined();

      const mapping = logGroup.Properties.RetentionInDays['Fn::FindInMap'];
      expect(mapping[0]).toBe('EnvironmentConfig');
      expect(mapping[2]).toBe('LogRetentionDays');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'LambdaFunctionArn',
        'DynamoDBTableName',
        'S3BucketName',
        'LambdaExecutionRoleArn',
        'EnvironmentSuffix'
      ];

      requiredOutputs.forEach(outputName => {
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

    test('LambdaFunctionArn output should use GetAtt', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Value).toHaveProperty('Fn::GetAtt');
      expect(output.Value['Fn::GetAtt'][0]).toBe('TransactionProcessorFunction');
      expect(output.Value['Fn::GetAtt'][1]).toBe('Arn');
    });

    test('DynamoDBTableName output should use Ref', () => {
      const output = template.Outputs.DynamoDBTableName;
      expect(output.Value).toEqual({ Ref: 'TransactionTable' });
    });
  });

  describe('Security Best Practices', () => {
    test('all resources with tags should have mandatory tags', () => {
      const resourcesWithTags = ['TransactionTable', 'AuditLogBucket', 'LambdaExecutionRole', 'TransactionProcessorFunction'];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const tagKeys = resource.Properties.Tags.map((t: any) => t.Key);
          expect(tagKeys).toContain('Environment');
          expect(tagKeys).toContain('CostCenter');
          expect(tagKeys).toContain('Application');
        }
      });
    });

    test('should not have any wildcard IAM permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;

      policies.forEach((policy: any) => {
        policy.PolicyDocument.Statement.forEach((statement: any) => {
          if (Array.isArray(statement.Action)) {
            statement.Action.forEach((action: string) => {
              expect(action).not.toMatch(/\*$/);
            });
          } else {
            expect(statement.Action).not.toMatch(/\*$/);
          }
        });
      });
    });

    test('S3 bucket should not allow public access', () => {
      const bucket = template.Resources.AuditLogBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('DynamoDB table should have encryption', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('S3 bucket should have encryption', () => {
      const bucket = template.Resources.AuditLogBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all required sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have correct resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(5); // Table, Bucket, Role, Lambda, LogGroup
    });

    test('should have correct parameter count', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(5); // Environment, EnvironmentSuffix, LambdaMemorySize, CostCenter, Application
    });

    test('should have correct output count', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(5); // LambdaArn, TableName, BucketName, RoleArn, EnvironmentSuffix
    });
  });
});
