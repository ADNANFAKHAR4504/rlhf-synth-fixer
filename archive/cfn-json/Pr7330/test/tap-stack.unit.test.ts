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
      expect(template.Description).toBe(
        'Multi-Region Disaster Recovery Infrastructure for Transaction Processing System'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

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
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-z0-9-]+$');
    });

    test('should have PrimaryRegion parameter', () => {
      expect(template.Parameters.PrimaryRegion).toBeDefined();
      expect(template.Parameters.PrimaryRegion.Default).toBe('us-east-1');
      expect(template.Parameters.PrimaryRegion.AllowedValues).toContain('us-east-1');
    });

    test('should have SecondaryRegion parameter', () => {
      expect(template.Parameters.SecondaryRegion).toBeDefined();
      expect(template.Parameters.SecondaryRegion.Default).toBe('us-west-2');
      expect(template.Parameters.SecondaryRegion.AllowedValues).toContain('us-west-2');
    });
  });

  describe('DynamoDB Global Table', () => {
    test('should have TransactionsTable resource', () => {
      expect(template.Resources.TransactionsTable).toBeDefined();
    });

    test('should be AWS::DynamoDB::GlobalTable type', () => {
      expect(template.Resources.TransactionsTable.Type).toBe('AWS::DynamoDB::GlobalTable');
    });

    test('should have correct deletion policies', () => {
      const table = template.Resources.TransactionsTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });

    test('should have correct table name with environment suffix', () => {
      const table = template.Resources.TransactionsTable;
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'transactions-table-${EnvironmentSuffix}',
      });
    });

    test('should use PAY_PER_REQUEST billing mode', () => {
      const table = template.Resources.TransactionsTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should have correct attribute definitions', () => {
      const table = template.Resources.TransactionsTable;
      const attrs = table.Properties.AttributeDefinitions;
      expect(attrs).toHaveLength(2);
      expect(attrs).toContainEqual({ AttributeName: 'transactionId', AttributeType: 'S' });
      expect(attrs).toContainEqual({ AttributeName: 'timestamp', AttributeType: 'N' });
    });

    test('should have correct key schema', () => {
      const table = template.Resources.TransactionsTable;
      const keySchema = table.Properties.KeySchema;
      expect(keySchema).toHaveLength(2);
      expect(keySchema).toContainEqual({ AttributeName: 'transactionId', KeyType: 'HASH' });
      expect(keySchema).toContainEqual({ AttributeName: 'timestamp', KeyType: 'RANGE' });
    });

    test('should have replicas in both regions', () => {
      const table = template.Resources.TransactionsTable;
      const replicas = table.Properties.Replicas;
      expect(replicas).toHaveLength(2);
      expect(replicas[0].Region).toEqual({ Ref: 'PrimaryRegion' });
      expect(replicas[1].Region).toEqual({ Ref: 'SecondaryRegion' });
    });

    test('should have point-in-time recovery enabled for all replicas', () => {
      const table = template.Resources.TransactionsTable;
      const replicas = table.Properties.Replicas;
      replicas.forEach((replica: any) => {
        expect(replica.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
        expect(replica.DeletionProtectionEnabled).toBe(false);
      });
    });

    test('should have SSE enabled with KMS', () => {
      const table = template.Resources.TransactionsTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.SSESpecification.SSEType).toBe('KMS');
    });

    test('should have stream enabled', () => {
      const table = template.Resources.TransactionsTable;
      expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });
  });

  describe('S3 Buckets', () => {
    test('should have PrimaryDocumentsBucket', () => {
      expect(template.Resources.PrimaryDocumentsBucket).toBeDefined();
      expect(template.Resources.PrimaryDocumentsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have SecondaryDocumentsBucket', () => {
      expect(template.Resources.SecondaryDocumentsBucket).toBeDefined();
      expect(template.Resources.SecondaryDocumentsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('buckets should have correct names with environment suffix', () => {
      expect(template.Resources.PrimaryDocumentsBucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'documents-primary-${EnvironmentSuffix}',
      });
      expect(template.Resources.SecondaryDocumentsBucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'documents-secondary-${EnvironmentSuffix}',
      });
    });

    test('buckets should have versioning enabled', () => {
      const primary = template.Resources.PrimaryDocumentsBucket;
      const secondary = template.Resources.SecondaryDocumentsBucket;
      expect(primary.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(secondary.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('buckets should have encryption enabled', () => {
      const primary = template.Resources.PrimaryDocumentsBucket;
      const secondary = template.Resources.SecondaryDocumentsBucket;
      expect(primary.Properties.BucketEncryption).toBeDefined();
      expect(secondary.Properties.BucketEncryption).toBeDefined();
    });

    test('buckets should have public access blocked', () => {
      const primary = template.Resources.PrimaryDocumentsBucket;
      const config = primary.Properties.PublicAccessBlockConfiguration;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });

    test('primary bucket should have replication configuration', () => {
      const primary = template.Resources.PrimaryDocumentsBucket;
      expect(primary.Properties.ReplicationConfiguration).toBeDefined();
      expect(primary.Properties.ReplicationConfiguration.Rules).toHaveLength(1);
      expect(primary.Properties.ReplicationConfiguration.Rules[0].Status).toBe('Enabled');
    });

    test('buckets should have deletion policy Delete', () => {
      expect(template.Resources.PrimaryDocumentsBucket.DeletionPolicy).toBe('Delete');
      expect(template.Resources.SecondaryDocumentsBucket.DeletionPolicy).toBe('Delete');
    });

    test('buckets should have Transfer Acceleration enabled', () => {
      const primary = template.Resources.PrimaryDocumentsBucket;
      const secondary = template.Resources.SecondaryDocumentsBucket;
      expect(primary.Properties.AccelerateConfiguration.AccelerationStatus).toBe('Enabled');
      expect(secondary.Properties.AccelerateConfiguration.AccelerationStatus).toBe('Enabled');
    });
  });

  describe('KMS Key', () => {
    test('should have PrimaryKMSKey', () => {
      expect(template.Resources.PrimaryKMSKey).toBeDefined();
      expect(template.Resources.PrimaryKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have key rotation enabled', () => {
      expect(template.Resources.PrimaryKMSKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have key alias', () => {
      expect(template.Resources.PrimaryKMSKeyAlias).toBeDefined();
      expect(template.Resources.PrimaryKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('alias should reference the key', () => {
      expect(template.Resources.PrimaryKMSKeyAlias.Properties.TargetKeyId).toEqual({
        Ref: 'PrimaryKMSKey',
      });
    });

    test('should have correct key policy structure', () => {
      const keyPolicy = template.Resources.PrimaryKMSKey.Properties.KeyPolicy;
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toBeDefined();
      expect(Array.isArray(keyPolicy.Statement)).toBe(true);
    });

    test('key policy should allow root account permissions', () => {
      const keyPolicy = template.Resources.PrimaryKMSKey.Properties.KeyPolicy;
      const rootStatement = keyPolicy.Statement.find((s: any) => s.Sid === 'Enable IAM User Permissions');
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');
    });

    test('key policy should allow Lambda service', () => {
      const keyPolicy = template.Resources.PrimaryKMSKey.Properties.KeyPolicy;
      const lambdaStatement = keyPolicy.Statement.find((s: any) => s.Sid === 'Allow Lambda service to use the key');
      expect(lambdaStatement).toBeDefined();
      expect(lambdaStatement.Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('key policy should allow DynamoDB service', () => {
      const keyPolicy = template.Resources.PrimaryKMSKey.Properties.KeyPolicy;
      const dynamoStatement = keyPolicy.Statement.find((s: any) => s.Sid === 'Allow DynamoDB service to use the key');
      expect(dynamoStatement).toBeDefined();
      expect(dynamoStatement.Principal.Service).toBe('dynamodb.amazonaws.com');
    });
  });

  describe('Lambda Functions', () => {
    test('should have PrimaryTransactionProcessor', () => {
      expect(template.Resources.PrimaryTransactionProcessor).toBeDefined();
      expect(template.Resources.PrimaryTransactionProcessor.Type).toBe('AWS::Lambda::Function');
    });

    test('should use correct runtime', () => {
      const lambda = template.Resources.PrimaryTransactionProcessor;
      expect(lambda.Properties.Runtime).toBe('nodejs22.x');
    });

    test('should have correct function name with environment suffix', () => {
      const lambda = template.Resources.PrimaryTransactionProcessor;
      expect(lambda.Properties.FunctionName).toEqual({
        'Fn::Sub': 'transaction-processor-primary-${EnvironmentSuffix}',
      });
    });

    test('should have correct timeout and memory', () => {
      const lambda = template.Resources.PrimaryTransactionProcessor;
      expect(lambda.Properties.Timeout).toBe(60);
      expect(lambda.Properties.MemorySize).toBe(512);
    });

    test('should not have reserved concurrent executions to allow account flexibility', () => {
      const primaryLambda = template.Resources.PrimaryTransactionProcessor;
      const secondaryLambda = template.Resources.SecondaryTransactionProcessor;
      // Reserved concurrency removed due to AWS account limits
      // AWS requires minimum 100 unreserved concurrent executions
      // Setting 100 on each function would violate this constraint
      expect(primaryLambda.Properties.ReservedConcurrentExecutions).toBeUndefined();
      expect(secondaryLambda.Properties.ReservedConcurrentExecutions).toBeUndefined();
    });

    test('should have environment variables', () => {
      const lambda = template.Resources.PrimaryTransactionProcessor;
      expect(lambda.Properties.Environment.Variables).toBeDefined();
      expect(lambda.Properties.Environment.Variables.TABLE_NAME).toEqual({ Ref: 'TransactionsTable' });
      expect(lambda.Properties.Environment.Variables.BUCKET_NAME).toEqual({ Ref: 'PrimaryDocumentsBucket' });
    });

    test('should have inline code', () => {
      const lambda = template.Resources.PrimaryTransactionProcessor;
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toContain('DynamoDBClient');
      expect(lambda.Properties.Code.ZipFile).toContain('S3Client');
    });

    test('should have log group', () => {
      expect(template.Resources.PrimaryTransactionProcessorLogGroup).toBeDefined();
      expect(template.Resources.PrimaryTransactionProcessorLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('log group should have correct name and retention', () => {
      const logGroup = template.Resources.PrimaryTransactionProcessorLogGroup;
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/transaction-processor-primary-${EnvironmentSuffix}',
      });
      expect(logGroup.Properties.RetentionInDays).toBe(7);
      expect(logGroup.DeletionPolicy).toBe('Delete');
    });
  });

  describe('IAM Roles', () => {
    test('should have PrimaryLambdaExecutionRole', () => {
      expect(template.Resources.PrimaryLambdaExecutionRole).toBeDefined();
      expect(template.Resources.PrimaryLambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have SecondaryLambdaExecutionRole', () => {
      expect(template.Resources.SecondaryLambdaExecutionRole).toBeDefined();
      expect(template.Resources.SecondaryLambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have S3ReplicationRole', () => {
      expect(template.Resources.S3ReplicationRole).toBeDefined();
      expect(template.Resources.S3ReplicationRole.Type).toBe('AWS::IAM::Role');
    });

    test('Lambda roles should have correct trust policy', () => {
      const role = template.Resources.PrimaryLambdaExecutionRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('Lambda roles should have basic execution policy', () => {
      const role = template.Resources.PrimaryLambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('Lambda roles should have inline policies for DynamoDB and S3', () => {
      const role = template.Resources.PrimaryLambdaExecutionRole;
      expect(role.Properties.Policies).toBeDefined();
      expect(role.Properties.Policies[0].PolicyName).toBe('LambdaExecutionPolicy');
      const statements = role.Properties.Policies[0].PolicyDocument.Statement;
      expect(statements.some((s: any) => s.Action.includes('dynamodb:GetItem'))).toBe(true);
      expect(statements.some((s: any) => s.Action.includes('s3:GetObject'))).toBe(true);
    });

    test('role names should include environment suffix', () => {
      expect(template.Resources.PrimaryLambdaExecutionRole.Properties.RoleName).toEqual({
        'Fn::Sub': 'lambda-execution-role-primary-${EnvironmentSuffix}',
      });
      expect(template.Resources.S3ReplicationRole.Properties.RoleName).toEqual({
        'Fn::Sub': 's3-replication-role-${EnvironmentSuffix}',
      });
    });
  });

  describe('SNS Topics', () => {
    test('should have PrimarySNSTopic', () => {
      expect(template.Resources.PrimarySNSTopic).toBeDefined();
      expect(template.Resources.PrimarySNSTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have SecondarySNSTopic', () => {
      expect(template.Resources.SecondarySNSTopic).toBeDefined();
      expect(template.Resources.SecondarySNSTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('topics should have correct names with environment suffix', () => {
      expect(template.Resources.PrimarySNSTopic.Properties.TopicName).toEqual({
        'Fn::Sub': 'dr-alerts-primary-${EnvironmentSuffix}',
      });
      expect(template.Resources.SecondarySNSTopic.Properties.TopicName).toEqual({
        'Fn::Sub': 'dr-alerts-secondary-${EnvironmentSuffix}',
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have DynamoDBThrottleAlarmPrimary', () => {
      expect(template.Resources.DynamoDBThrottleAlarmPrimary).toBeDefined();
      expect(template.Resources.DynamoDBThrottleAlarmPrimary.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have LambdaErrorAlarmPrimary', () => {
      expect(template.Resources.LambdaErrorAlarmPrimary).toBeDefined();
      expect(template.Resources.LambdaErrorAlarmPrimary.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have LambdaThrottleAlarmPrimary', () => {
      expect(template.Resources.LambdaThrottleAlarmPrimary).toBeDefined();
      expect(template.Resources.LambdaThrottleAlarmPrimary.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('alarms should reference SNS topic for actions', () => {
      const alarm = template.Resources.DynamoDBThrottleAlarmPrimary;
      expect(alarm.Properties.AlarmActions).toContainEqual({ Ref: 'PrimarySNSTopic' });
    });

    test('alarm names should include environment suffix', () => {
      expect(template.Resources.DynamoDBThrottleAlarmPrimary.Properties.AlarmName).toEqual({
        'Fn::Sub': 'dynamodb-throttle-primary-${EnvironmentSuffix}',
      });
    });

    test('alarms should have correct evaluation periods and thresholds', () => {
      const alarm = template.Resources.LambdaErrorAlarmPrimary;
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.Threshold).toBe(5);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });
  });

  describe('Route53 Configuration', () => {
    test('should have Route53 Hosted Zone', () => {
      expect(template.Resources.Route53HostedZone).toBeDefined();
      expect(template.Resources.Route53HostedZone.Type).toBe('AWS::Route53::HostedZone');
    });

    test('should have primary health check', () => {
      expect(template.Resources.PrimaryHealthCheck).toBeDefined();
      expect(template.Resources.PrimaryHealthCheck.Type).toBe('AWS::Route53::HealthCheck');
      expect(template.Resources.PrimaryHealthCheck.Properties.HealthCheckConfig.Type).toBe('HTTPS');
    });

    test('should have secondary health check', () => {
      expect(template.Resources.SecondaryHealthCheck).toBeDefined();
      expect(template.Resources.SecondaryHealthCheck.Type).toBe('AWS::Route53::HealthCheck');
      expect(template.Resources.SecondaryHealthCheck.Properties.HealthCheckConfig.Type).toBe('HTTPS');
    });

    test('should have failover DNS records', () => {
      expect(template.Resources.PrimaryFailoverRecord).toBeDefined();
      expect(template.Resources.SecondaryFailoverRecord).toBeDefined();
      expect(template.Resources.PrimaryFailoverRecord.Properties.Failover).toBe('PRIMARY');
      expect(template.Resources.SecondaryFailoverRecord.Properties.Failover).toBe('SECONDARY');
    });

    test('health checks should monitor every 30 seconds', () => {
      const primaryCheck = template.Resources.PrimaryHealthCheck;
      const secondaryCheck = template.Resources.SecondaryHealthCheck;
      expect(primaryCheck.Properties.HealthCheckConfig.RequestInterval).toBe(30);
      expect(secondaryCheck.Properties.HealthCheckConfig.RequestInterval).toBe(30);
    });

    test('health checks should have failure threshold of 3', () => {
      const primaryCheck = template.Resources.PrimaryHealthCheck;
      const secondaryCheck = template.Resources.SecondaryHealthCheck;
      expect(primaryCheck.Properties.HealthCheckConfig.FailureThreshold).toBe(3);
      expect(secondaryCheck.Properties.HealthCheckConfig.FailureThreshold).toBe(3);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'TransactionsTableName',
        'TransactionsTableArn',
        'PrimaryDocumentsBucketName',
        'SecondaryDocumentsBucketName',
        'PrimaryLambdaFunctionArn',
        'SecondaryLambdaFunctionArn',
        'PrimaryKMSKeyId',
        'PrimaryKMSKeyArn',
        'SecondaryKMSKeyId',
        'SecondaryKMSKeyArn',
        'PrimarySNSTopicArn',
        'SecondarySNSTopicArn',
        'Route53HostedZoneId',
        'Route53HostedZoneName',
        'PrimaryHealthCheckId',
        'SecondaryHealthCheckId',
        'PrimaryRegion',
        'SecondaryRegion',
      ];

      expectedOutputs.forEach((outputName) => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have exports', () => {
      const output = template.Outputs.TransactionsTableName;
      expect(output.Export).toBeDefined();
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-TransactionsTableName',
      });
    });

    test('outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach((key) => {
        expect(template.Outputs[key].Description).toBeDefined();
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(27); // All resources defined
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(18);
    });
  });

  describe('Deletion Policies', () => {
    test('no resources should have Retain policy', () => {
      Object.keys(template.Resources).forEach((key) => {
        const resource = template.Resources[key];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('stateful resources should have Delete policy', () => {
      expect(template.Resources.TransactionsTable.DeletionPolicy).toBe('Delete');
      expect(template.Resources.PrimaryDocumentsBucket.DeletionPolicy).toBe('Delete');
      expect(template.Resources.SecondaryDocumentsBucket.DeletionPolicy).toBe('Delete');
      expect(template.Resources.PrimaryTransactionProcessorLogGroup.DeletionPolicy).toBe('Delete');
      expect(template.Resources.SecondaryTransactionProcessorLogGroup.DeletionPolicy).toBe('Delete');
    });

    test('no resources should have DeletionProtection enabled', () => {
      Object.keys(template.Resources).forEach((key) => {
        const resource = template.Resources[key];
        if (resource.Properties && resource.Properties.DeletionProtectionEnabled !== undefined) {
          expect(resource.Properties.DeletionProtectionEnabled).toBe(false);
        }
      });
    });
  });

  describe('Environment Suffix Usage', () => {
    test('all resource names should include environment suffix', () => {
      const resourcesWithNames = [
        'TransactionsTable',
        'PrimaryDocumentsBucket',
        'SecondaryDocumentsBucket',
        'PrimaryKMSKeyAlias',
        'SecondaryKMSKeyAlias',
        'PrimaryTransactionProcessor',
        'SecondaryTransactionProcessor',
        'PrimaryTransactionProcessorLogGroup',
        'SecondaryTransactionProcessorLogGroup',
        'PrimaryLambdaExecutionRole',
        'SecondaryLambdaExecutionRole',
        'S3ReplicationRole',
        'PrimarySNSTopic',
        'SecondarySNSTopic',
        'DynamoDBThrottleAlarmPrimary',
        'LambdaErrorAlarmPrimary',
        'LambdaThrottleAlarmPrimary',
        'LambdaErrorAlarmSecondary',
        'LambdaThrottleAlarmSecondary',
        'S3ReplicationLatencyAlarm',
        'PrimaryHealthCheck',
        'SecondaryHealthCheck',
        'Route53HostedZone',
      ];

      resourcesWithNames.forEach((resourceName) => {
        const resource = template.Resources[resourceName];
        if (!resource) {
          throw new Error(`Resource ${resourceName} not found in template`);
        }
        const props = resource.Properties;
        const nameProperty = props.TableName || props.BucketName || props.FunctionName ||
                            props.LogGroupName || props.RoleName || props.TopicName ||
                            props.AlarmName || props.AliasName || props.Name ||
                            (props.HealthCheckTags && props.HealthCheckTags.find((t: any) => t.Key === 'Name')?.Value);

        if (nameProperty) {
          expect(nameProperty['Fn::Sub']).toBeDefined();
          expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });
});
