import fs from 'fs';
import path from 'path';

describe('Webhook Processor CloudFormation Template', () => {
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
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all required sections', () => {
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
      expect(envSuffixParam.Description).toBeDefined();
      expect(envSuffixParam.MinLength).toBe(1);
    });
  });

  describe('KMS Key Resource', () => {
    test('should have KMSKey resource', () => {
      expect(template.Resources.KMSKey).toBeDefined();
    });

    test('KMSKey should be AWS::KMS::Key type', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMSKey should have description', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey.Properties.Description).toBeDefined();
      expect(kmsKey.Properties.Description).toContain('encrypt');
    });

    test('KMSKey should have key policy', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey.Properties.KeyPolicy).toBeDefined();
      expect(kmsKey.Properties.KeyPolicy.Version).toBe('2012-10-17');
      expect(kmsKey.Properties.KeyPolicy.Statement).toBeDefined();
      expect(Array.isArray(kmsKey.Properties.KeyPolicy.Statement)).toBe(true);
    });

    test('KMSKey should allow root account permissions', () => {
      const kmsKey = template.Resources.KMSKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;
      const rootStatement = statements.find((s: any) => s.Sid === 'Enable IAM User Permissions');

      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Action).toBe('kms:*');
      expect(rootStatement.Principal.AWS).toBeDefined();
    });

    test('KMSKey should allow CloudWatch Logs service', () => {
      const kmsKey = template.Resources.KMSKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;
      const logsStatement = statements.find((s: any) => s.Sid === 'Allow CloudWatch Logs');

      expect(logsStatement).toBeDefined();
      expect(logsStatement.Effect).toBe('Allow');
      expect(logsStatement.Principal.Service).toBeDefined();
      expect(logsStatement.Action).toContain('kms:Encrypt');
      expect(logsStatement.Action).toContain('kms:Decrypt');
    });

    test('KMSKey should allow Lambda service', () => {
      const kmsKey = template.Resources.KMSKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;
      const lambdaStatement = statements.find((s: any) => s.Sid === 'Allow Lambda');

      expect(lambdaStatement).toBeDefined();
      expect(lambdaStatement.Effect).toBe('Allow');
      expect(lambdaStatement.Principal.Service).toBe('lambda.amazonaws.com');
      expect(lambdaStatement.Action).toContain('kms:Decrypt');
    });
  });

  describe('KMS Key Alias Resource', () => {
    test('should have KMSKeyAlias resource', () => {
      expect(template.Resources.KMSKeyAlias).toBeDefined();
    });

    test('KMSKeyAlias should be AWS::KMS::Alias type', () => {
      const alias = template.Resources.KMSKeyAlias;
      expect(alias.Type).toBe('AWS::KMS::Alias');
    });

    test('KMSKeyAlias should include EnvironmentSuffix in name', () => {
      const alias = template.Resources.KMSKeyAlias;
      expect(alias.Properties.AliasName).toBeDefined();
      expect(alias.Properties.AliasName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('KMSKeyAlias should reference KMSKey', () => {
      const alias = template.Resources.KMSKeyAlias;
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'KMSKey' });
    });
  });

  describe('DynamoDB Table Resource', () => {
    test('should have TransactionTable resource', () => {
      expect(template.Resources.TransactionTable).toBeDefined();
    });

    test('TransactionTable should be AWS::DynamoDB::Table type', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('TransactionTable should include EnvironmentSuffix in name', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Properties.TableName).toBeDefined();
      expect(table.Properties.TableName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('TransactionTable should have transactionId as partition key', () => {
      const table = template.Resources.TransactionTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('transactionId');
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    test('TransactionTable should have correct attribute definitions', () => {
      const table = template.Resources.TransactionTable;
      const attributes = table.Properties.AttributeDefinitions;

      expect(attributes).toHaveLength(1);
      expect(attributes[0].AttributeName).toBe('transactionId');
      expect(attributes[0].AttributeType).toBe('S');
    });

    test('TransactionTable should use on-demand billing', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('TransactionTable should have point-in-time recovery enabled', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Properties.PointInTimeRecoverySpecification).toBeDefined();
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('TransactionTable should have encryption enabled', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Properties.SSESpecification).toBeDefined();
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });
  });

  describe('CloudWatch Log Group Resource', () => {
    test('should have WebhookLogGroup resource', () => {
      expect(template.Resources.WebhookLogGroup).toBeDefined();
    });

    test('WebhookLogGroup should be AWS::Logs::LogGroup type', () => {
      const logGroup = template.Resources.WebhookLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('WebhookLogGroup should include EnvironmentSuffix in name', () => {
      const logGroup = template.Resources.WebhookLogGroup;
      expect(logGroup.Properties.LogGroupName).toBeDefined();
      expect(logGroup.Properties.LogGroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('WebhookLogGroup should have 30-day retention', () => {
      const logGroup = template.Resources.WebhookLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('WebhookLogGroup should be encrypted with KMS', () => {
      const logGroup = template.Resources.WebhookLogGroup;
      expect(logGroup.Properties.KmsKeyId).toBeDefined();
      expect(logGroup.Properties.KmsKeyId['Fn::GetAtt']).toEqual(['KMSKey', 'Arn']);
    });
  });

  describe('IAM Role Resource', () => {
    test('should have LambdaExecutionRole resource', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
    });

    test('LambdaExecutionRole should be AWS::IAM::Role type', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('LambdaExecutionRole should include EnvironmentSuffix in name', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.RoleName).toBeDefined();
      expect(role.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('LambdaExecutionRole should have Lambda assume role policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;

      expect(assumePolicy).toBeDefined();
      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('LambdaExecutionRole should have DynamoDB write policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const dynamoPolicy = policies.find((p: any) => p.PolicyName === 'DynamoDBWritePolicy');

      expect(dynamoPolicy).toBeDefined();
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:PutItem');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:UpdateItem');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:GetItem');
    });

    test('DynamoDB policy should reference TransactionTable ARN', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const dynamoPolicy = policies.find((p: any) => p.PolicyName === 'DynamoDBWritePolicy');

      expect(dynamoPolicy.PolicyDocument.Statement[0].Resource).toEqual({
        'Fn::GetAtt': ['TransactionTable', 'Arn']
      });
    });

    test('LambdaExecutionRole should have CloudWatch Logs policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const logsPolicy = policies.find((p: any) => p.PolicyName === 'CloudWatchLogsPolicy');

      expect(logsPolicy).toBeDefined();
      expect(logsPolicy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogStream');
      expect(logsPolicy.PolicyDocument.Statement[0].Action).toContain('logs:PutLogEvents');
    });

    test('CloudWatch Logs policy should reference WebhookLogGroup ARN', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const logsPolicy = policies.find((p: any) => p.PolicyName === 'CloudWatchLogsPolicy');

      expect(logsPolicy.PolicyDocument.Statement[0].Resource).toEqual({
        'Fn::GetAtt': ['WebhookLogGroup', 'Arn']
      });
    });

    test('LambdaExecutionRole should have X-Ray policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const xrayPolicy = policies.find((p: any) => p.PolicyName === 'XRayPolicy');

      expect(xrayPolicy).toBeDefined();
      expect(xrayPolicy.PolicyDocument.Statement[0].Action).toContain('xray:PutTraceSegments');
      expect(xrayPolicy.PolicyDocument.Statement[0].Action).toContain('xray:PutTelemetryRecords');
    });

    test('LambdaExecutionRole should have KMS decrypt policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const kmsPolicy = policies.find((p: any) => p.PolicyName === 'KMSDecryptPolicy');

      expect(kmsPolicy).toBeDefined();
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:Decrypt');
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:DescribeKey');
    });

    test('KMS policy should reference KMSKey ARN', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const kmsPolicy = policies.find((p: any) => p.PolicyName === 'KMSDecryptPolicy');

      expect(kmsPolicy.PolicyDocument.Statement[0].Resource).toEqual({
        'Fn::GetAtt': ['KMSKey', 'Arn']
      });
    });
  });

  describe('Lambda Function Resource', () => {
    test('should have WebhookProcessorFunction resource', () => {
      expect(template.Resources.WebhookProcessorFunction).toBeDefined();
    });

    test('WebhookProcessorFunction should be AWS::Lambda::Function type', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('WebhookProcessorFunction should include EnvironmentSuffix in name', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      expect(lambda.Properties.FunctionName).toBeDefined();
      expect(lambda.Properties.FunctionName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('WebhookProcessorFunction should depend on WebhookLogGroup', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      expect(lambda.DependsOn).toBe('WebhookLogGroup');
    });

    test('WebhookProcessorFunction should use Python 3.11 runtime', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      expect(lambda.Properties.Runtime).toBe('python3.11');
    });

    test('WebhookProcessorFunction should have correct handler', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      expect(lambda.Properties.Handler).toBe('index.handler');
    });

    test('WebhookProcessorFunction should use ARM64 architecture', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      expect(lambda.Properties.Architectures).toEqual(['arm64']);
    });

    test('WebhookProcessorFunction should have 1GB memory', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      expect(lambda.Properties.MemorySize).toBe(1024);
    });

    test('WebhookProcessorFunction should have 30-second timeout', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      expect(lambda.Properties.Timeout).toBe(30);
    });

    test('WebhookProcessorFunction should have X-Ray tracing enabled', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      expect(lambda.Properties.TracingConfig).toBeDefined();
      expect(lambda.Properties.TracingConfig.Mode).toBe('Active');
    });

    test('WebhookProcessorFunction should reference LambdaExecutionRole', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn']
      });
    });

    test('WebhookProcessorFunction should have inline code', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      expect(lambda.Properties.Code).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(typeof lambda.Properties.Code.ZipFile).toBe('string');
      expect(lambda.Properties.Code.ZipFile.length).toBeGreaterThan(100);
    });

    test('WebhookProcessorFunction code should import required modules', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      const code = lambda.Properties.Code.ZipFile;

      expect(code).toContain('import json');
      expect(code).toContain('import boto3');
      expect(code).toContain('import os');
      expect(code).toContain('from datetime import datetime');
      expect(code).toContain('import logging');
    });

    test('WebhookProcessorFunction code should have handler function', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      const code = lambda.Properties.Code.ZipFile;

      expect(code).toContain('def handler(event, context):');
    });

    test('WebhookProcessorFunction should have environment variables', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      expect(lambda.Properties.Environment).toBeDefined();
      expect(lambda.Properties.Environment.Variables).toBeDefined();
    });

    test('WebhookProcessorFunction should have DYNAMODB_TABLE_NAME env var', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      const envVars = lambda.Properties.Environment.Variables;

      expect(envVars.DYNAMODB_TABLE_NAME).toBeDefined();
      expect(envVars.DYNAMODB_TABLE_NAME).toEqual({ Ref: 'TransactionTable' });
    });

    test('WebhookProcessorFunction should be encrypted with KMS', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      expect(lambda.Properties.KmsKeyArn).toBeDefined();
      expect(lambda.Properties.KmsKeyArn).toEqual({
        'Fn::GetAtt': ['KMSKey', 'Arn']
      });
    });
  });

  describe('Outputs', () => {
    test('should have LambdaFunctionArn output', () => {
      expect(template.Outputs.LambdaFunctionArn).toBeDefined();
    });

    test('LambdaFunctionArn output should have correct structure', () => {
      const output = template.Outputs.LambdaFunctionArn;

      expect(output.Description).toBeDefined();
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['WebhookProcessorFunction', 'Arn']
      });
      expect(output.Export).toBeDefined();
      expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
    });

    test('should have DynamoDBTableName output', () => {
      expect(template.Outputs.DynamoDBTableName).toBeDefined();
    });

    test('DynamoDBTableName output should have correct structure', () => {
      const output = template.Outputs.DynamoDBTableName;

      expect(output.Description).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'TransactionTable' });
      expect(output.Export).toBeDefined();
      expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
    });

    test('should have KMSKeyId output', () => {
      expect(template.Outputs.KMSKeyId).toBeDefined();
    });

    test('KMSKeyId output should have correct structure', () => {
      const output = template.Outputs.KMSKeyId;

      expect(output.Description).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'KMSKey' });
      expect(output.Export).toBeDefined();
      expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
    });

    test('should have LambdaFunctionName output', () => {
      expect(template.Outputs.LambdaFunctionName).toBeDefined();
    });

    test('LambdaFunctionName output should have correct structure', () => {
      const output = template.Outputs.LambdaFunctionName;

      expect(output.Description).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'WebhookProcessorFunction' });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all named resources should include EnvironmentSuffix', () => {
      const resources = template.Resources;
      const namedResources = [
        'KMSKeyAlias',
        'TransactionTable',
        'WebhookLogGroup',
        'LambdaExecutionRole',
        'WebhookProcessorFunction'
      ];

      namedResources.forEach(resourceName => {
        const resource = resources[resourceName];
        const nameProperty =
          resource.Properties.AliasName ||
          resource.Properties.TableName ||
          resource.Properties.LogGroupName ||
          resource.Properties.RoleName ||
          resource.Properties.FunctionName;

        expect(nameProperty).toBeDefined();
        if (typeof nameProperty === 'object' && nameProperty['Fn::Sub']) {
          expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('all output exports should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export) {
          expect(output.Export.Name).toBeDefined();
          expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
        }
      });
    });
  });

  describe('Security and Compliance', () => {
    test('should not have any DeletionPolicy: Retain', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('should not have UpdateReplacePolicy: Retain', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.UpdateReplacePolicy) {
          expect(resource.UpdateReplacePolicy).not.toBe('Retain');
        }
      });
    });

    test('DynamoDB table should not have deletion protection enabled', () => {
      const table = template.Resources.TransactionTable;
      if (table.Properties.DeletionProtectionEnabled !== undefined) {
        expect(table.Properties.DeletionProtectionEnabled).toBe(false);
      }
    });

    test('all IAM policies should use specific resource ARNs (not wildcards)', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;

      policies.forEach((policy: any) => {
        if (policy.PolicyName !== 'XRayPolicy') {
          policy.PolicyDocument.Statement.forEach((statement: any) => {
            if (statement.Resource !== '*') {
              expect(statement.Resource).toBeDefined();
              expect(typeof statement.Resource === 'object' || typeof statement.Resource === 'string').toBe(true);
            }
          });
        }
      });
    });
  });

  describe('Cost Optimization', () => {
    test('Lambda should use ARM64 architecture for cost savings', () => {
      const lambda = template.Resources.WebhookProcessorFunction;
      expect(lambda.Properties.Architectures).toContain('arm64');
    });

    test('DynamoDB should use on-demand billing', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('CloudWatch logs should have retention configured', () => {
      const logGroup = template.Resources.WebhookLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBeDefined();
      expect(logGroup.Properties.RetentionInDays).toBeGreaterThan(0);
    });
  });

  describe('Resource Count Validation', () => {
    test('should have exactly 6 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(6);
    });

    test('should have exactly 1 parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have exactly 4 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(4);
    });
  });
});
