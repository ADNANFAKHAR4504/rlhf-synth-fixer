import fs from 'fs';
import path from 'path';

const environment = process.env.ENVIRONMENT || 'prod';

describe('Data Backup System CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the converted JSON template
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have correct description for backup system', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Automated Daily Backup System with S3, Lambda, and EventBridge'
      );
    });

    test('should have metadata section with parameter grouping', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
    });

    test('should have mappings section for environment configuration', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Mappings.EnvironmentConfig).toBeDefined();
      expect(template.Mappings.EnvironmentConfig.dev.RetentionDays).toBe(7);
      expect(template.Mappings.EnvironmentConfig.staging.RetentionDays).toBe(14);
      expect(template.Mappings.EnvironmentConfig.prod.RetentionDays).toBe(30);
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('prod');
      expect(envParam.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    test('should have BackupBucketName parameter with validation', () => {
      expect(template.Parameters.BackupBucketName).toBeDefined();
      const bucketParam = template.Parameters.BackupBucketName;
      expect(bucketParam.Type).toBe('String');
      expect(bucketParam.AllowedPattern).toBe('^[a-z0-9][a-z0-9-]*[a-z0-9]$');
      expect(bucketParam.MinLength).toBe(3);
      expect(bucketParam.MaxLength).toBe(63);
      expect(bucketParam.ConstraintDescription).toContain('valid S3 bucket name');
    });
  });

  describe('Security Resources', () => {
    test('should have KMS key for encryption', () => {
      expect(template.Resources.BackupKMSKey).toBeDefined();
      const kmsKey = template.Resources.BackupKMSKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.KeyPolicy).toBeDefined();
      expect(kmsKey.Properties.KeyPolicy.Version).toBe('2012-10-17');
    });

    test('KMS key should have proper permissions', () => {
      const kmsKey = template.Resources.BackupKMSKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;

      // Should have root permissions
      const rootStatement = statements.find((s: any) => s.Sid === 'Enable IAM User Permissions');
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Principal.AWS).toEqual({ 'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root' });

      // Should have Lambda permissions
      const lambdaStatement = statements.find((s: any) => s.Sid === 'Allow Lambda to use the key');
      expect(lambdaStatement).toBeDefined();
      expect(lambdaStatement.Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('KMS key should allow CloudWatch Logs encryption', () => {
      const kmsKey = template.Resources.BackupKMSKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;

      // Should have CloudWatch Logs permissions
      const logsStatement = statements.find((s: any) => s.Sid === 'Allow CloudWatch Logs to use the key');
      expect(logsStatement).toBeDefined();
      expect(logsStatement.Principal.Service).toEqual({ 'Fn::Sub': 'logs.${AWS::Region}.amazonaws.com' });

      // Should have required permissions
      const requiredActions = ['kms:Encrypt', 'kms:Decrypt', 'kms:ReEncrypt*', 'kms:GenerateDataKey*', 'kms:DescribeKey'];
      requiredActions.forEach(action => {
        expect(logsStatement.Action).toContain(action);
      });

      // Should have proper condition
      expect(logsStatement.Condition).toBeDefined();
      expect(logsStatement.Condition.ArnLike).toBeDefined();
      expect(logsStatement.Condition.ArnLike['kms:EncryptionContext:aws:logs:arn']).toEqual({
        'Fn::Sub': 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${Environment}-backup-function'
      });
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.BackupKMSKeyAlias).toBeDefined();
      const alias = template.Resources.BackupKMSKeyAlias;
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName).toEqual({ 'Fn::Sub': 'alias/${Environment}-backup-key' });
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'BackupKMSKey' });
    });

    test('should have IAM role for Lambda with least privilege', () => {
      expect(template.Resources.BackupLambdaRole).toBeDefined();
      const role = template.Resources.BackupLambdaRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });

    test('IAM role should have specific S3 and KMS permissions', () => {
      const role = template.Resources.BackupLambdaRole;
      const backupPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'BackupS3Access');
      expect(backupPolicy).toBeDefined();

      const statements = backupPolicy.PolicyDocument.Statement;

      // S3 object permissions
      const s3ObjectStatement = statements.find((s: any) =>
        s.Action.includes('s3:PutObject') &&
        Array.isArray(s.Resource) &&
        s.Resource[0]['Fn::Sub'] === '${BackupS3Bucket.Arn}/*'
      );
      expect(s3ObjectStatement).toBeDefined();

      // KMS permissions
      const kmsStatement = statements.find((s: any) => s.Action.includes('kms:Decrypt'));
      expect(kmsStatement).toBeDefined();
      expect(kmsStatement.Resource).toEqual([{ 'Fn::GetAtt': ['BackupKMSKey', 'Arn'] }]);
    });
  });

  describe('Storage Resources', () => {
    test('should have primary backup S3 bucket with encryption', () => {
      expect(template.Resources.BackupS3Bucket).toBeDefined();
      const bucket = template.Resources.BackupS3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName).toEqual({ 'Fn::Sub': '${BackupBucketName}-${AWS::AccountId}-${Environment}' });
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'BackupKMSKey' });
    });

    test('backup bucket should have versioning enabled', () => {
      const bucket = template.Resources.BackupS3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('backup bucket should have lifecycle policies', () => {
      const bucket = template.Resources.BackupS3Bucket;
      const lifecycleRules = bucket.Properties.LifecycleConfiguration.Rules;

      // Deletion rule based on environment
      const deleteRule = lifecycleRules.find((r: any) => r.Id === 'DeleteOldBackups');
      expect(deleteRule).toBeDefined();
      expect(deleteRule.Status).toBe('Enabled');
      expect(deleteRule.ExpirationInDays).toEqual({ 'Fn::FindInMap': ['EnvironmentConfig', { Ref: 'Environment' }, 'RetentionDays'] });

      // Multipart upload cleanup
      const multipartRule = lifecycleRules.find((r: any) => r.Id === 'AbortIncompleteMultipartUploads');
      expect(multipartRule).toBeDefined();
      expect(multipartRule.AbortIncompleteMultipartUpload.DaysAfterInitiation).toBe(1);
    });

    test('backup bucket should block public access', () => {
      const bucket = template.Resources.BackupS3Bucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should have logging bucket for access logs', () => {
      expect(template.Resources.LoggingBucket).toBeDefined();
      const loggingBucket = template.Resources.LoggingBucket;
      expect(loggingBucket.Type).toBe('AWS::S3::Bucket');
      expect(loggingBucket.Properties.BucketName).toEqual({ 'Fn::Sub': '${BackupBucketName}-${AWS::AccountId}-${Environment}-logs' });
      expect(loggingBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('logging bucket should have lifecycle policy for log cleanup', () => {
      const loggingBucket = template.Resources.LoggingBucket;
      const lifecycleRules = loggingBucket.Properties.LifecycleConfiguration.Rules;
      const deleteLogsRule = lifecycleRules.find((r: any) => r.Id === 'DeleteOldLogs');
      expect(deleteLogsRule).toBeDefined();
      expect(deleteLogsRule.ExpirationInDays).toBe(90);
    });
  });

  describe('Compute Resources', () => {
    test('should have Lambda function with proper configuration', () => {
      expect(template.Resources.BackupLambdaFunction).toBeDefined();
      const lambda = template.Resources.BackupLambdaFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.9');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
      expect(lambda.Properties.Timeout).toBe(900); // 15 minutes
      expect(lambda.Properties.MemorySize).toBe(512);
    });

    test('Lambda function should have proper environment variables', () => {
      const lambda = template.Resources.BackupLambdaFunction;
      const envVars = lambda.Properties.Environment.Variables;
      expect(envVars.BACKUP_BUCKET).toEqual({ Ref: 'BackupS3Bucket' });
      expect(envVars.ENVIRONMENT).toEqual({ Ref: 'Environment' });
      expect(envVars.KMS_KEY_ID).toEqual({ Ref: 'BackupKMSKey' });
    });

    test('Lambda function should have inline code for backup processing', () => {
      const lambda = template.Resources.BackupLambdaFunction;
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toContain('lambda_handler');
      expect(lambda.Properties.Code.ZipFile).toContain('generate_sample_documents');
      expect(lambda.Properties.Code.ZipFile).toContain('send_metric');
    });

    test('should have CloudWatch log group for Lambda', () => {
      expect(template.Resources.BackupLambdaLogGroup).toBeDefined();
      const logGroup = template.Resources.BackupLambdaLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName).toEqual({ 'Fn::Sub': '/aws/lambda/${Environment}-backup-function' });
      expect(logGroup.Properties.RetentionInDays).toBe(30);
      expect(logGroup.Properties.KmsKeyId).toEqual({ 'Fn::GetAtt': ['BackupKMSKey', 'Arn'] });
    });
  });

  describe('Scheduling and Monitoring', () => {
    test('should have EventBridge rule for daily scheduling', () => {
      expect(template.Resources.DailyBackupRule).toBeDefined();
      const rule = template.Resources.DailyBackupRule;
      expect(rule.Type).toBe('AWS::Events::Rule');
      expect(rule.Properties.ScheduleExpression).toBe('cron(0 2 * * ? *)'); // 2 AM UTC daily
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('EventBridge rule should target Lambda function with retry policy', () => {
      const rule = template.Resources.DailyBackupRule;
      const targets = rule.Properties.Targets;
      expect(targets).toHaveLength(1);
      expect(targets[0].Arn).toEqual({ 'Fn::GetAtt': ['BackupLambdaFunction', 'Arn'] });
      expect(targets[0].RetryPolicy.MaximumRetryAttempts).toBe(2);
      // MaximumEventAge is not configured in the template
    });

    test('should have Lambda invoke permission for EventBridge', () => {
      expect(template.Resources.LambdaInvokePermission).toBeDefined();
      const permission = template.Resources.LambdaInvokePermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.SourceArn).toEqual({ 'Fn::GetAtt': ['DailyBackupRule', 'Arn'] });
    });

    test('should have CloudWatch alarm for backup failures', () => {
      expect(template.Resources.BackupFailureAlarm).toBeDefined();
      const alarm = template.Resources.BackupFailureAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('BackupFailure');
      expect(alarm.Properties.Namespace).toBe('BackupSystem');
      expect(alarm.Properties.Threshold).toBe(1);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    });

    test('should have CloudWatch alarm for Lambda duration', () => {
      expect(template.Resources.LambdaDurationAlarm).toBeDefined();
      const alarm = template.Resources.LambdaDurationAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Duration');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Threshold).toBe(600000); // 10 minutes in milliseconds
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have iac-rlhf-amazon tag', () => {
      const resourcesWithTags = [
        'BackupKMSKey',
        'BackupS3Bucket',
        'LoggingBucket',
        'BackupLambdaRole',
        'BackupLambdaLogGroup',
        'BackupLambdaFunction',
        'DailyBackupRule',
        'BackupFailureAlarm',
        'LambdaDurationAlarm'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Tags || resource.Properties.Tags).toBeDefined();
        const tags = resource.Tags || resource.Properties.Tags;
        const iacTag = tags.find((t: any) => t.Key === 'iac-rlhf-amazon');
        expect(iacTag).toBeDefined();
        expect(iacTag.Value).toBe('true');
      });
    });

    test('all resources should have Environment and Purpose tags', () => {
      const resourcesWithTags = [
        'BackupKMSKey',
        'BackupS3Bucket',
        'LoggingBucket',
        'BackupLambdaRole',
        'BackupLambdaLogGroup',
        'BackupLambdaFunction',
        'DailyBackupRule',
        'BackupFailureAlarm',
        'LambdaDurationAlarm'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Tags || resource.Properties.Tags;

        const envTag = tags.find((t: any) => t.Key === 'Environment');
        expect(envTag).toBeDefined();
        expect(envTag.Value).toEqual({ Ref: 'Environment' });

        const purposeTag = tags.find((t: any) => t.Key === 'Purpose');
        expect(purposeTag).toBeDefined();
        expect(purposeTag.Value).toBeDefined();
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'BackupBucketName',
        'BackupLambdaArn',
        'EventBridgeRuleName',
        'KMSKeyId',
        'LoggingBucketName'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have proper export names for cross-stack references', () => {
      const expectedExportNames = {
        'BackupBucketName': 'backup-bucket',
        'BackupLambdaArn': 'backup-lambda-arn',
        'EventBridgeRuleName': 'daily-backup-rule',
        'KMSKeyId': 'kms-key-id',
        'LoggingBucketName': 'logging-bucket'
      };

      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${expectedExportNames[outputKey]}`
        });
      });
    });

    test('BackupBucketName output should reference the S3 bucket', () => {
      const output = template.Outputs.BackupBucketName;
      expect(output.Description).toContain('S3 backup bucket');
      expect(output.Value).toEqual({ Ref: 'BackupS3Bucket' });
    });

    test('BackupLambdaArn output should reference Lambda function ARN', () => {
      const output = template.Outputs.BackupLambdaArn;
      expect(output.Description).toContain('backup Lambda function');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['BackupLambdaFunction', 'Arn'] });
    });
  });

  describe('Cross-Account Compatibility', () => {
    test('should not contain hardcoded account IDs', () => {
      const templateString = JSON.stringify(template);
      const accountIdPattern = /\d{12}/g;
      const matches = templateString.match(accountIdPattern);

      // Filter out valid uses like retention days
      const invalidMatches = matches?.filter(match => {
        const context = templateString.substring(
          templateString.indexOf(match) - 50,
          templateString.indexOf(match) + 50
        );
        return !context.includes('RetentionDays') &&
          !context.includes('Threshold') &&
          !context.includes('Period') &&
          !context.includes('Timeout') &&
          !context.includes('MemorySize');
      });

      expect(invalidMatches?.length || 0).toBe(0);
    });

    test('should use AWS pseudo parameters', () => {
      const templateString = JSON.stringify(template);
      expect(templateString).toContain('AWS::AccountId');
      expect(templateString).toContain('AWS::Region');
      expect(templateString).toContain('AWS::StackName');
    });

    test('should not contain hardcoded region names', () => {
      const templateString = JSON.stringify(template);
      const regionPattern = /(us-east-1|us-west-2|eu-west-1|ap-southeast-1)/g;
      const matches = templateString.match(regionPattern);
      expect(matches?.length || 0).toBe(0);
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Mappings).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have correct number of resources for backup system', () => {
      const expectedResourceCount = 11; // KMS, KMSAlias, S3x2, IAM, LogGroup, Lambda, EventBridge, Permission, Alarmx2
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(expectedResourceCount);
    });

    test('should have environment-based configurations', () => {
      const mappings = template.Mappings.EnvironmentConfig;
      Object.keys(mappings).forEach(env => {
        expect(mappings[env].RetentionDays).toBeDefined();
        expect(typeof mappings[env].RetentionDays).toBe('number');
        expect(mappings[env].RetentionDays).toBeGreaterThan(0);
      });
    });
  });
});
