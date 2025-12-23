import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Serverless Transaction Validation System', () => {
  let template: any;

  beforeAll(() => {
    // If you're testing a yaml template, run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
      expect(template.Description).toBe(
        'Serverless Transaction Validation System - CloudFormation Template'
      );
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
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });

    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('development');
      expect(envParam.AllowedValues).toEqual(['development', 'staging', 'production']);
      expect(envParam.Description).toBe('Environment type for conditional resource creation');
    });
  });

  describe('Conditions', () => {
    test('should have IsProduction condition', () => {
      expect(template.Conditions.IsProduction).toBeDefined();
    });

    test('IsProduction condition should check for production environment', () => {
      const condition = template.Conditions.IsProduction;
      expect(condition).toEqual({
        'Fn::Equals': [{ Ref: 'Environment' }, 'production']
      });
    });
  });

  describe('KMS Key Resources', () => {
    test('should have LambdaKMSKey resource', () => {
      expect(template.Resources.LambdaKMSKey).toBeDefined();
    });

    test('LambdaKMSKey should be a KMS Key', () => {
      const key = template.Resources.LambdaKMSKey;
      expect(key.Type).toBe('AWS::KMS::Key');
    });

    test('LambdaKMSKey should have correct deletion policies', () => {
      const key = template.Resources.LambdaKMSKey;
      expect(key.DeletionPolicy).toBe('Delete');
      expect(key.UpdateReplacePolicy).toBe('Delete');
    });

    test('LambdaKMSKey should have key rotation enabled', () => {
      const key = template.Resources.LambdaKMSKey;
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('LambdaKMSKey should have correct key policy', () => {
      const key = template.Resources.LambdaKMSKey;
      const keyPolicy = key.Properties.KeyPolicy;
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toHaveLength(2);
    });

    test('should have LambdaKMSKeyAlias resource', () => {
      expect(template.Resources.LambdaKMSKeyAlias).toBeDefined();
    });

    test('LambdaKMSKeyAlias should reference LambdaKMSKey', () => {
      const alias = template.Resources.LambdaKMSKeyAlias;
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'LambdaKMSKey' });
      expect(alias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/transaction-processor-${EnvironmentSuffix}'
      });
    });
  });

  describe('DynamoDB Table Resources', () => {
    test('should have TransactionRecordsTable resource', () => {
      expect(template.Resources.TransactionRecordsTable).toBeDefined();
    });

    test('TransactionRecordsTable should be a DynamoDB table', () => {
      const table = template.Resources.TransactionRecordsTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('TransactionRecordsTable should have correct deletion policies', () => {
      const table = template.Resources.TransactionRecordsTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });

    test('TransactionRecordsTable should have correct table name with environment suffix', () => {
      const table = template.Resources.TransactionRecordsTable;
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'TransactionRecords-${EnvironmentSuffix}'
      });
    });

    test('TransactionRecordsTable should have correct attribute definitions', () => {
      const table = template.Resources.TransactionRecordsTable;
      const attributeDefinitions = table.Properties.AttributeDefinitions;

      expect(attributeDefinitions).toHaveLength(3);
      expect(attributeDefinitions).toContainEqual({
        AttributeName: 'transactionId',
        AttributeType: 'S'
      });
      expect(attributeDefinitions).toContainEqual({
        AttributeName: 'timestamp',
        AttributeType: 'N'
      });
      expect(attributeDefinitions).toContainEqual({
        AttributeName: 'status',
        AttributeType: 'S'
      });
    });

    test('TransactionRecordsTable should have correct key schema with partition and sort keys', () => {
      const table = template.Resources.TransactionRecordsTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(2);
      expect(keySchema).toContainEqual({
        AttributeName: 'transactionId',
        KeyType: 'HASH'
      });
      expect(keySchema).toContainEqual({
        AttributeName: 'timestamp',
        KeyType: 'RANGE'
      });
    });

    test('TransactionRecordsTable should use on-demand billing mode', () => {
      const table = template.Resources.TransactionRecordsTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('TransactionRecordsTable should have point-in-time recovery enabled', () => {
      const table = template.Resources.TransactionRecordsTable;
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('TransactionRecordsTable should have StatusIndex global secondary index', () => {
      const table = template.Resources.TransactionRecordsTable;
      const gsi = table.Properties.GlobalSecondaryIndexes;

      expect(gsi).toHaveLength(1);
      expect(gsi[0].IndexName).toBe('StatusIndex');
      expect(gsi[0].KeySchema).toContainEqual({
        AttributeName: 'status',
        KeyType: 'HASH'
      });
    });

    test('StatusIndex should project only specified attributes', () => {
      const table = template.Resources.TransactionRecordsTable;
      const gsi = table.Properties.GlobalSecondaryIndexes[0];

      expect(gsi.Projection.ProjectionType).toBe('INCLUDE');
      expect(gsi.Projection.NonKeyAttributes).toEqual(['transactionId', 'amount', 'timestamp']);
    });

    test('TransactionRecordsTable should have deletion protection disabled', () => {
      const table = template.Resources.TransactionRecordsTable;
      expect(table.Properties.DeletionProtectionEnabled).toBe(false);
    });
  });

  describe('SQS Queue Resources', () => {
    test('should have TransactionQueue resource', () => {
      expect(template.Resources.TransactionQueue).toBeDefined();
    });

    test('TransactionQueue should be an SQS Queue', () => {
      const queue = template.Resources.TransactionQueue;
      expect(queue.Type).toBe('AWS::SQS::Queue');
    });

    test('TransactionQueue should have correct deletion policies', () => {
      const queue = template.Resources.TransactionQueue;
      expect(queue.DeletionPolicy).toBe('Delete');
      expect(queue.UpdateReplacePolicy).toBe('Delete');
    });

    test('TransactionQueue should have correct queue name with environment suffix', () => {
      const queue = template.Resources.TransactionQueue;
      expect(queue.Properties.QueueName).toEqual({
        'Fn::Sub': 'TransactionQueue-${EnvironmentSuffix}'
      });
    });

    test('TransactionQueue should have 14-day message retention', () => {
      const queue = template.Resources.TransactionQueue;
      expect(queue.Properties.MessageRetentionPeriod).toBe(1209600);
    });

    test('TransactionQueue should have visibility timeout of 6 times Lambda timeout', () => {
      const queue = template.Resources.TransactionQueue;
      // Lambda timeout is 300 seconds, so 6 * 300 = 1800
      expect(queue.Properties.VisibilityTimeout).toBe(1800);
    });

    test('TransactionQueue should have conditional redrive policy', () => {
      const queue = template.Resources.TransactionQueue;
      expect(queue.Properties.RedrivePolicy).toBeDefined();
      expect(queue.Properties.RedrivePolicy['Fn::If']).toBeDefined();
    });

    test('should have TransactionDLQ resource', () => {
      expect(template.Resources.TransactionDLQ).toBeDefined();
    });

    test('TransactionDLQ should be an SQS Queue', () => {
      const dlq = template.Resources.TransactionDLQ;
      expect(dlq.Type).toBe('AWS::SQS::Queue');
    });

    test('TransactionDLQ should have IsProduction condition', () => {
      const dlq = template.Resources.TransactionDLQ;
      expect(dlq.Condition).toBe('IsProduction');
    });

    test('TransactionDLQ should have correct queue name with environment suffix', () => {
      const dlq = template.Resources.TransactionDLQ;
      expect(dlq.Properties.QueueName).toEqual({
        'Fn::Sub': 'TransactionDLQ-${EnvironmentSuffix}'
      });
    });

    test('TransactionDLQ should have 14-day message retention', () => {
      const dlq = template.Resources.TransactionDLQ;
      expect(dlq.Properties.MessageRetentionPeriod).toBe(1209600);
    });
  });

  describe('IAM Role Resources', () => {
    test('should have TransactionProcessorRole resource', () => {
      expect(template.Resources.TransactionProcessorRole).toBeDefined();
    });

    test('TransactionProcessorRole should be an IAM Role', () => {
      const role = template.Resources.TransactionProcessorRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('TransactionProcessorRole should have correct role name with environment suffix', () => {
      const role = template.Resources.TransactionProcessorRole;
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': 'TransactionProcessorRole-${EnvironmentSuffix}'
      });
    });

    test('TransactionProcessorRole should have Lambda service as trusted entity', () => {
      const role = template.Resources.TransactionProcessorRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;

      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('TransactionProcessorRole should have basic execution role attached', () => {
      const role = template.Resources.TransactionProcessorRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('TransactionProcessorRole should have DynamoDB access policy', () => {
      const role = template.Resources.TransactionProcessorRole;
      const policies = role.Properties.Policies;
      const dynamoPolicy = policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');

      expect(dynamoPolicy).toBeDefined();
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:PutItem');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:GetItem');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:UpdateItem');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:Query');
    });

    test('TransactionProcessorRole should have exact DynamoDB resource ARNs without wildcards', () => {
      const role = template.Resources.TransactionProcessorRole;
      const policies = role.Properties.Policies;
      const dynamoPolicy = policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');

      expect(dynamoPolicy.PolicyDocument.Statement[0].Resource).toHaveLength(2);
      expect(dynamoPolicy.PolicyDocument.Statement[0].Resource).toContainEqual({
        'Fn::GetAtt': ['TransactionRecordsTable', 'Arn']
      });
    });

    test('TransactionProcessorRole should have SQS access policy', () => {
      const role = template.Resources.TransactionProcessorRole;
      const policies = role.Properties.Policies;
      const sqsPolicy = policies.find((p: any) => p.PolicyName === 'SQSAccess');

      expect(sqsPolicy).toBeDefined();
      expect(sqsPolicy.PolicyDocument.Statement[0].Action).toContain('sqs:ReceiveMessage');
      expect(sqsPolicy.PolicyDocument.Statement[0].Action).toContain('sqs:DeleteMessage');
      expect(sqsPolicy.PolicyDocument.Statement[0].Action).toContain('sqs:GetQueueAttributes');
    });

    test('TransactionProcessorRole should have exact SQS resource ARN without wildcards', () => {
      const role = template.Resources.TransactionProcessorRole;
      const policies = role.Properties.Policies;
      const sqsPolicy = policies.find((p: any) => p.PolicyName === 'SQSAccess');

      expect(sqsPolicy.PolicyDocument.Statement[0].Resource).toEqual({
        'Fn::GetAtt': ['TransactionQueue', 'Arn']
      });
    });

    test('TransactionProcessorRole should have KMS access policy', () => {
      const role = template.Resources.TransactionProcessorRole;
      const policies = role.Properties.Policies;
      const kmsPolicy = policies.find((p: any) => p.PolicyName === 'KMSAccess');

      expect(kmsPolicy).toBeDefined();
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:Decrypt');
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:DescribeKey');
    });

    test('TransactionProcessorRole should have exact KMS resource ARN without wildcards', () => {
      const role = template.Resources.TransactionProcessorRole;
      const policies = role.Properties.Policies;
      const kmsPolicy = policies.find((p: any) => p.PolicyName === 'KMSAccess');

      expect(kmsPolicy.PolicyDocument.Statement[0].Resource).toEqual({
        'Fn::GetAtt': ['LambdaKMSKey', 'Arn']
      });
    });
  });

  describe('Lambda Function Resources', () => {
    test('should have TransactionProcessorFunction resource', () => {
      expect(template.Resources.TransactionProcessorFunction).toBeDefined();
    });

    test('TransactionProcessorFunction should be a Lambda Function', () => {
      const lambda = template.Resources.TransactionProcessorFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('TransactionProcessorFunction should have correct deletion policies', () => {
      const lambda = template.Resources.TransactionProcessorFunction;
      expect(lambda.DeletionPolicy).toBe('Delete');
      expect(lambda.UpdateReplacePolicy).toBe('Delete');
    });

    test('TransactionProcessorFunction should have correct function name with environment suffix', () => {
      const lambda = template.Resources.TransactionProcessorFunction;
      expect(lambda.Properties.FunctionName).toEqual({
        'Fn::Sub': 'TransactionProcessor-${EnvironmentSuffix}'
      });
    });

    test('TransactionProcessorFunction should use arm64 architecture', () => {
      const lambda = template.Resources.TransactionProcessorFunction;
      expect(lambda.Properties.Architectures).toEqual(['arm64']);
    });

    test('TransactionProcessorFunction should have 1024MB memory', () => {
      const lambda = template.Resources.TransactionProcessorFunction;
      expect(lambda.Properties.MemorySize).toBe(1024);
    });

    test('TransactionProcessorFunction should have 5 minute timeout', () => {
      const lambda = template.Resources.TransactionProcessorFunction;
      expect(lambda.Properties.Timeout).toBe(300);
    });

    test('TransactionProcessorFunction should have exactly 100 reserved concurrent executions', () => {
      const lambda = template.Resources.TransactionProcessorFunction;
      expect(lambda.Properties.ReservedConcurrentExecutions).toBe(100);
    });

    test('TransactionProcessorFunction should use customer-managed KMS key', () => {
      const lambda = template.Resources.TransactionProcessorFunction;
      expect(lambda.Properties.KmsKeyArn).toEqual({
        'Fn::GetAtt': ['LambdaKMSKey', 'Arn']
      });
    });

    test('TransactionProcessorFunction should have environment variables', () => {
      const lambda = template.Resources.TransactionProcessorFunction;
      const envVars = lambda.Properties.Environment.Variables;

      expect(envVars.TABLE_NAME).toEqual({ Ref: 'TransactionRecordsTable' });
      expect(envVars.QUEUE_URL).toEqual({ Ref: 'TransactionQueue' });
      expect(envVars.ENVIRONMENT).toEqual({ Ref: 'Environment' });
    });

    test('TransactionProcessorFunction should have inline code', () => {
      const lambda = template.Resources.TransactionProcessorFunction;
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toContain('exports.handler');
    });

    test('TransactionProcessorFunction should reference correct IAM role', () => {
      const lambda = template.Resources.TransactionProcessorFunction;
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['TransactionProcessorRole', 'Arn']
      });
    });
  });

  describe('Lambda Event Source Mapping', () => {
    test('should have TransactionProcessorEventSourceMapping resource', () => {
      expect(template.Resources.TransactionProcessorEventSourceMapping).toBeDefined();
    });

    test('TransactionProcessorEventSourceMapping should be an EventSourceMapping', () => {
      const mapping = template.Resources.TransactionProcessorEventSourceMapping;
      expect(mapping.Type).toBe('AWS::Lambda::EventSourceMapping');
    });

    test('TransactionProcessorEventSourceMapping should reference SQS queue', () => {
      const mapping = template.Resources.TransactionProcessorEventSourceMapping;
      expect(mapping.Properties.EventSourceArn).toEqual({
        'Fn::GetAtt': ['TransactionQueue', 'Arn']
      });
    });

    test('TransactionProcessorEventSourceMapping should reference Lambda function', () => {
      const mapping = template.Resources.TransactionProcessorEventSourceMapping;
      expect(mapping.Properties.FunctionName).toEqual({
        Ref: 'TransactionProcessorFunction'
      });
    });

    test('TransactionProcessorEventSourceMapping should have batch size of 10', () => {
      const mapping = template.Resources.TransactionProcessorEventSourceMapping;
      expect(mapping.Properties.BatchSize).toBe(10);
    });

    test('TransactionProcessorEventSourceMapping should be enabled', () => {
      const mapping = template.Resources.TransactionProcessorEventSourceMapping;
      expect(mapping.Properties.Enabled).toBe(true);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'TransactionProcessorFunctionName',
        'TransactionProcessorFunctionArn',
        'TransactionRecordsTableName',
        'TransactionRecordsTableArn',
        'TransactionQueueUrl',
        'TransactionQueueArn',
        'TransactionDLQUrl',
        'LambdaKMSKeyArn',
        'LambdaKMSKeyId',
        'StackName',
        'EnvironmentSuffix',
        'Environment'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('TransactionProcessorFunctionName output should be correct', () => {
      const output = template.Outputs.TransactionProcessorFunctionName;
      expect(output.Description).toBe('Name of the Transaction Processor Lambda function');
      expect(output.Value).toEqual({ Ref: 'TransactionProcessorFunction' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-TransactionProcessorFunctionName'
      });
    });

    test('TransactionRecordsTableName output should be correct', () => {
      const output = template.Outputs.TransactionRecordsTableName;
      expect(output.Description).toBe('Name of the DynamoDB TransactionRecords table');
      expect(output.Value).toEqual({ Ref: 'TransactionRecordsTable' });
    });

    test('TransactionQueueUrl output should be correct', () => {
      const output = template.Outputs.TransactionQueueUrl;
      expect(output.Description).toBe('URL of the Transaction SQS Queue');
      expect(output.Value).toEqual({ Ref: 'TransactionQueue' });
    });

    test('TransactionDLQUrl should have IsProduction condition', () => {
      const output = template.Outputs.TransactionDLQUrl;
      expect(output.Condition).toBe('IsProduction');
    });

    test('LambdaKMSKeyArn output should be correct', () => {
      const output = template.Outputs.LambdaKMSKeyArn;
      expect(output.Description).toBe('ARN of the KMS key for Lambda encryption');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['LambdaKMSKey', 'Arn'] });
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

    test('should have exactly 2 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });

    test('should have exactly 8 core resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(8); // KMS Key, Alias, Table, DLQ (conditional), Queue, Role, Function, EventSourceMapping
    });

    test('should have exactly 12 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(12);
    });

    test('should have exactly 1 condition', () => {
      const conditionCount = Object.keys(template.Conditions).length;
      expect(conditionCount).toBe(1);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resource names should follow naming convention with environment suffix', () => {
      const resources = [
        { resource: 'TransactionRecordsTable', property: 'TableName', expectedSuffix: 'TransactionRecords-${EnvironmentSuffix}' },
        { resource: 'TransactionQueue', property: 'QueueName', expectedSuffix: 'TransactionQueue-${EnvironmentSuffix}' },
        { resource: 'TransactionDLQ', property: 'QueueName', expectedSuffix: 'TransactionDLQ-${EnvironmentSuffix}' },
        { resource: 'TransactionProcessorFunction', property: 'FunctionName', expectedSuffix: 'TransactionProcessor-${EnvironmentSuffix}' },
        { resource: 'TransactionProcessorRole', property: 'RoleName', expectedSuffix: 'TransactionProcessorRole-${EnvironmentSuffix}' }
      ];

      resources.forEach(({ resource, property, expectedSuffix }) => {
        const resourceObj = template.Resources[resource];
        expect(resourceObj.Properties[property]).toEqual({
          'Fn::Sub': expectedSuffix
        });
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Condition !== 'IsProduction') {
          expect(output.Export.Name).toEqual({
            'Fn::Sub': `\${AWS::StackName}-${outputKey}`
          });
        }
      });
    });
  });

  describe('Mandatory Requirements Validation', () => {
    test('MANDATORY 1: Lambda function named TransactionProcessor with arm64 and 1024MB', () => {
      const lambda = template.Resources.TransactionProcessorFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Properties.FunctionName).toEqual({
        'Fn::Sub': 'TransactionProcessor-${EnvironmentSuffix}'
      });
      expect(lambda.Properties.Architectures).toEqual(['arm64']);
      expect(lambda.Properties.MemorySize).toBe(1024);
    });

    test('MANDATORY 2: DynamoDB table TransactionRecords with transactionId and timestamp keys', () => {
      const table = template.Resources.TransactionRecordsTable;
      expect(table).toBeDefined();
      expect(table.Properties.KeySchema).toContainEqual({
        AttributeName: 'transactionId',
        KeyType: 'HASH'
      });
      expect(table.Properties.KeySchema).toContainEqual({
        AttributeName: 'timestamp',
        KeyType: 'RANGE'
      });
    });

    test('MANDATORY 3: Global secondary index StatusIndex with correct projection', () => {
      const table = template.Resources.TransactionRecordsTable;
      const gsi = table.Properties.GlobalSecondaryIndexes[0];
      expect(gsi.IndexName).toBe('StatusIndex');
      expect(gsi.KeySchema).toContainEqual({
        AttributeName: 'status',
        KeyType: 'HASH'
      });
      expect(gsi.Projection.NonKeyAttributes).toEqual(['transactionId', 'amount', 'timestamp']);
    });

    test('MANDATORY 4: SQS queue TransactionQueue with 14-day retention and correct visibility', () => {
      const queue = template.Resources.TransactionQueue;
      expect(queue).toBeDefined();
      expect(queue.Properties.MessageRetentionPeriod).toBe(1209600);
      expect(queue.Properties.VisibilityTimeout).toBe(1800); // 6 * 300
    });

    test('MANDATORY 5: Lambda triggered by SQS with batch size of 10', () => {
      const mapping = template.Resources.TransactionProcessorEventSourceMapping;
      expect(mapping).toBeDefined();
      expect(mapping.Properties.BatchSize).toBe(10);
      expect(mapping.Properties.EventSourceArn).toEqual({
        'Fn::GetAtt': ['TransactionQueue', 'Arn']
      });
    });

    test('MANDATORY 6: Customer-managed KMS key for Lambda encryption', () => {
      const key = template.Resources.LambdaKMSKey;
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');

      const lambda = template.Resources.TransactionProcessorFunction;
      expect(lambda.Properties.KmsKeyArn).toEqual({
        'Fn::GetAtt': ['LambdaKMSKey', 'Arn']
      });
    });

    test('MANDATORY 7: IAM role with correct permissions for DynamoDB, SQS, and KMS', () => {
      const role = template.Resources.TransactionProcessorRole;
      expect(role).toBeDefined();

      const policies = role.Properties.Policies;
      expect(policies.some((p: any) => p.PolicyName === 'DynamoDBAccess')).toBe(true);
      expect(policies.some((p: any) => p.PolicyName === 'SQSAccess')).toBe(true);
      expect(policies.some((p: any) => p.PolicyName === 'KMSAccess')).toBe(true);
    });

    test('MANDATORY 8: CloudFormation Condition IsProduction for DLQ', () => {
      expect(template.Conditions.IsProduction).toBeDefined();

      const dlq = template.Resources.TransactionDLQ;
      expect(dlq.Condition).toBe('IsProduction');
    });
  });

  describe('Constraint Validation', () => {
    test('Lambda should have reserved concurrent executions of exactly 100', () => {
      const lambda = template.Resources.TransactionProcessorFunction;
      expect(lambda.Properties.ReservedConcurrentExecutions).toBe(100);
    });

    test('DynamoDB should use on-demand billing with point-in-time recovery', () => {
      const table = template.Resources.TransactionRecordsTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('Lambda should use arm64 architecture', () => {
      const lambda = template.Resources.TransactionProcessorFunction;
      expect(lambda.Properties.Architectures).toEqual(['arm64']);
    });

    test('Lambda environment variables should be encrypted with customer-managed KMS key', () => {
      const lambda = template.Resources.TransactionProcessorFunction;
      expect(lambda.Properties.KmsKeyArn).toBeDefined();
      expect(lambda.Properties.KmsKeyArn).toEqual({
        'Fn::GetAtt': ['LambdaKMSKey', 'Arn']
      });
    });

    test('GSI should project only specified attributes', () => {
      const table = template.Resources.TransactionRecordsTable;
      const gsi = table.Properties.GlobalSecondaryIndexes[0];
      expect(gsi.Projection.ProjectionType).toBe('INCLUDE');
      expect(gsi.Projection.NonKeyAttributes).toHaveLength(3);
    });

    test('Lambda should have maximum timeout of 5 minutes', () => {
      const lambda = template.Resources.TransactionProcessorFunction;
      expect(lambda.Properties.Timeout).toBe(300);
    });

    test('Lambda should have 1024MB memory', () => {
      const lambda = template.Resources.TransactionProcessorFunction;
      expect(lambda.Properties.MemorySize).toBe(1024);
    });

    test('IAM policies should specify exact resource ARNs without wildcards', () => {
      const role = template.Resources.TransactionProcessorRole;
      const policies = role.Properties.Policies;

      policies.forEach((policy: any) => {
        const resources = policy.PolicyDocument.Statement[0].Resource;
        if (Array.isArray(resources)) {
          resources.forEach((resource: any) => {
            expect(resource).not.toBe('*');
            expect(typeof resource).toBe('object');
          });
        } else {
          expect(resources).not.toBe('*');
          expect(typeof resources).toBe('object');
        }
      });
    });
  });
});
