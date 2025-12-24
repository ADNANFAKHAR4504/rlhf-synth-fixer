import fs from 'fs';
import path from 'path';

const environment = process.env.ENVIRONMENT || 'prod';

describe('Data Backup System CloudFormation Template - LocalStack Compatible', () => {
  let template: any;

  beforeAll(() => {
    // Load the converted JSON template
    // Run: pipenv run cfn-flip lib/TapStack.yml lib/TapStack.json
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    if (!fs.existsSync(templatePath)) {
      throw new Error(
        'TapStack.json not found. Run: pipenv run cfn-flip lib/TapStack.yml lib/TapStack.json'
      );
    }
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have correct description for LocalStack compatible backup system', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Automated Daily Backup System');
      expect(template.Description).toContain('LocalStack Compatible');
    });

    test('should have all required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should not have Metadata section (simplified for LocalStack)', () => {
      expect(template.Metadata).toBeUndefined();
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('prod');
      expect(envParam.AllowedValues).toEqual(['dev', 'staging', 'prod']);
      expect(envParam.Description).toContain('Environment name');
    });

    test('should have BackupBucketName parameter with validation', () => {
      expect(template.Parameters.BackupBucketName).toBeDefined();
      const bucketParam = template.Parameters.BackupBucketName;
      expect(bucketParam.Type).toBe('String');
      expect(bucketParam.AllowedPattern).toBe('^[a-z0-9][a-z0-9-]*[a-z0-9]$');
      expect(bucketParam.MinLength).toBe(3);
      expect(bucketParam.MaxLength).toBe(63);
      expect(bucketParam.ConstraintDescription).toContain('valid S3 bucket name');
      expect(bucketParam.Default).toBe('backup-system-prod-12345');
    });

    test('should validate BackupBucketName pattern', () => {
      const pattern = new RegExp(template.Parameters.BackupBucketName.AllowedPattern);
      expect(pattern.test('backup-system-prod-12345')).toBe(true);
      expect(pattern.test('my-backup-bucket')).toBe(true);
      expect(pattern.test('backup123')).toBe(true);
      expect(pattern.test('Backup')).toBe(false); // uppercase not allowed
      expect(pattern.test('-backup')).toBe(false); // can't start with dash
      expect(pattern.test('backup-')).toBe(false); // can't end with dash
    });

    test('should have RetentionDays parameter', () => {
      expect(template.Parameters.RetentionDays).toBeDefined();
      const retentionParam = template.Parameters.RetentionDays;
      expect(retentionParam.Type).toBe('Number');
      expect(retentionParam.Default).toBe(30);
      expect(retentionParam.MinValue).toBe(1);
      expect(retentionParam.MaxValue).toBe(365);
      expect(retentionParam.Description).toContain('days to retain backups');
    });

    test('should have exactly 3 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });
  });

  describe('Storage Resources - S3 Bucket', () => {
    test('should have primary backup S3 bucket', () => {
      expect(template.Resources.BackupS3Bucket).toBeDefined();
      const bucket = template.Resources.BackupS3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have correct naming convention', () => {
      const bucket = template.Resources.BackupS3Bucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': '${BackupBucketName}-${Environment}'
      });
    });

    test('backup bucket should use AES256 encryption (LocalStack compatible)', () => {
      const bucket = template.Resources.BackupS3Bucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('backup bucket should NOT use KMS encryption (removed for LocalStack)', () => {
      const bucket = template.Resources.BackupS3Bucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toBeUndefined();
    });

    test('backup bucket should have versioning enabled', () => {
      const bucket = template.Resources.BackupS3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('backup bucket should have lifecycle policies', () => {
      const bucket = template.Resources.BackupS3Bucket;
      const lifecycleRules = bucket.Properties.LifecycleConfiguration.Rules;
      expect(lifecycleRules).toHaveLength(2);

      // Deletion rule using RetentionDays parameter
      const deleteRule = lifecycleRules.find((r: any) => r.Id === 'DeleteOldBackups');
      expect(deleteRule).toBeDefined();
      expect(deleteRule.Status).toBe('Enabled');
      expect(deleteRule.ExpirationInDays).toEqual({
        Ref: 'RetentionDays'
      });

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

    test('backup bucket should have required tags', () => {
      const bucket = template.Resources.BackupS3Bucket;
      const tags = bucket.Properties.Tags;
      expect(tags).toBeDefined();

      const envTag = tags.find((t: any) => t.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toEqual({ Ref: 'Environment' });

      const purposeTag = tags.find((t: any) => t.Key === 'Purpose');
      expect(purposeTag).toBeDefined();
      expect(purposeTag.Value).toBe('DailyBackups');

      const iacTag = tags.find((t: any) => t.Key === 'iac-rlhf-amazon');
      expect(iacTag).toBeDefined();
      expect(iacTag.Value).toBe('true');
    });

    test('backup bucket should NOT have MetricsConfigurations (removed for LocalStack)', () => {
      const bucket = template.Resources.BackupS3Bucket;
      expect(bucket.Properties.MetricsConfigurations).toBeUndefined();
    });

    test('backup bucket should NOT have LoggingConfiguration (removed for LocalStack)', () => {
      const bucket = template.Resources.BackupS3Bucket;
      expect(bucket.Properties.LoggingConfiguration).toBeUndefined();
    });
  });

  describe('IAM Resources', () => {
    test('should have IAM role for Lambda', () => {
      expect(template.Resources.BackupLambdaRole).toBeDefined();
      const role = template.Resources.BackupLambdaRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': '${Environment}-backup-lambda-role'
      });
    });

    test('IAM role should have correct assume role policy', () => {
      const role = template.Resources.BackupLambdaRole;
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('IAM role should have Lambda basic execution policy', () => {
      const role = template.Resources.BackupLambdaRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('IAM role should have S3 permissions', () => {
      const role = template.Resources.BackupLambdaRole;
      const backupPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'BackupS3Access');
      expect(backupPolicy).toBeDefined();

      const statements = backupPolicy.PolicyDocument.Statement;

      // S3 object permissions
      const s3ObjectStatement = statements.find((s: any) => s.Action.includes('s3:PutObject'));
      expect(s3ObjectStatement).toBeDefined();
      expect(s3ObjectStatement.Resource).toEqual([{ 'Fn::Sub': '${BackupS3Bucket.Arn}/*' }]);
      expect(s3ObjectStatement.Action).toContain('s3:PutObject');
      expect(s3ObjectStatement.Action).toContain('s3:GetObject');

      // S3 bucket permissions
      const s3BucketStatement = statements.find((s: any) => s.Action.includes('s3:ListBucket'));
      expect(s3BucketStatement).toBeDefined();
      expect(s3BucketStatement.Resource).toEqual([{ 'Fn::GetAtt': ['BackupS3Bucket', 'Arn'] }]);
    });

    test('IAM role should have CloudWatch permissions', () => {
      const role = template.Resources.BackupLambdaRole;
      const backupPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'BackupS3Access');
      const statements = backupPolicy.PolicyDocument.Statement;

      const cwStatement = statements.find((s: any) => s.Action.includes('cloudwatch:PutMetricData'));
      expect(cwStatement).toBeDefined();
      expect(cwStatement.Resource).toBe('*');
    });

    test('IAM role should NOT have KMS permissions (removed for LocalStack)', () => {
      const role = template.Resources.BackupLambdaRole;
      const backupPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'BackupS3Access');
      const statements = backupPolicy.PolicyDocument.Statement;

      const kmsStatement = statements.find((s: any) => 
        s.Action && s.Action.some && s.Action.some((action: string) => action.includes('kms:'))
      );
      expect(kmsStatement).toBeUndefined();
    });

    test('IAM role should have required tags', () => {
      const role = template.Resources.BackupLambdaRole;
      const tags = role.Properties.Tags;

      const envTag = tags.find((t: any) => t.Key === 'Environment');
      expect(envTag).toBeDefined();

      const purposeTag = tags.find((t: any) => t.Key === 'Purpose');
      expect(purposeTag).toBeDefined();
      expect(purposeTag.Value).toBe('BackupLambdaExecution');

      const iacTag = tags.find((t: any) => t.Key === 'iac-rlhf-amazon');
      expect(iacTag).toBeDefined();
    });
  });

  describe('CloudWatch Logs', () => {
    test('should have CloudWatch log group for Lambda', () => {
      expect(template.Resources.BackupLambdaLogGroup).toBeDefined();
      const logGroup = template.Resources.BackupLambdaLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/${Environment}-backup-function'
      });
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('log group should NOT have KMS encryption (removed for LocalStack)', () => {
      const logGroup = template.Resources.BackupLambdaLogGroup;
      expect(logGroup.Properties.KmsKeyId).toBeUndefined();
    });

    test('log group should have required tags', () => {
      const logGroup = template.Resources.BackupLambdaLogGroup;
      const tags = logGroup.Properties.Tags;
      
      const iacTag = tags.find((t: any) => t.Key === 'iac-rlhf-amazon');
      expect(iacTag).toBeDefined();
      expect(iacTag.Value).toBe('true');
    });
  });

  describe('Lambda Function', () => {
    test('should have Lambda function with proper configuration', () => {
      expect(template.Resources.BackupLambdaFunction).toBeDefined();
      const lambda = template.Resources.BackupLambdaFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.FunctionName).toEqual({
        'Fn::Sub': '${Environment}-backup-function'
      });
      expect(lambda.Properties.Runtime).toBe('python3.9');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
      expect(lambda.Properties.Timeout).toBe(900); // 15 minutes
      expect(lambda.Properties.MemorySize).toBe(512);
    });

    test('Lambda function should have proper environment variables (no KMS)', () => {
      const lambda = template.Resources.BackupLambdaFunction;
      const envVars = lambda.Properties.Environment.Variables;
      expect(envVars.BACKUP_BUCKET).toEqual({ Ref: 'BackupS3Bucket' });
      expect(envVars.ENVIRONMENT).toEqual({ Ref: 'Environment' });
      expect(envVars.KMS_KEY_ID).toBeUndefined(); // Removed for LocalStack
    });

    test('Lambda function should have inline code', () => {
      const lambda = template.Resources.BackupLambdaFunction;
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toContain('lambda_handler');
      expect(lambda.Properties.Code.ZipFile).toContain('generate_sample_documents');
      expect(lambda.Properties.Code.ZipFile).toContain('send_metric');
    });

    test('Lambda code should NOT use KMS encryption for S3 (LocalStack compatible)', () => {
      const lambda = template.Resources.BackupLambdaFunction;
      const code = lambda.Properties.Code.ZipFile;
      expect(code).not.toContain('ServerSideEncryption');
      expect(code).not.toContain('SSEKMSKeyId');
      expect(code).toContain('simplified for LocalStack');
    });

    test('Lambda function should have IAM role reference', () => {
      const lambda = template.Resources.BackupLambdaFunction;
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['BackupLambdaRole', 'Arn']
      });
    });

    test('Lambda function should have required tags', () => {
      const lambda = template.Resources.BackupLambdaFunction;
      const tags = lambda.Properties.Tags;

      const purposeTag = tags.find((t: any) => t.Key === 'Purpose');
      expect(purposeTag).toBeDefined();
      expect(purposeTag.Value).toBe('DailyBackupProcessor');

      const iacTag = tags.find((t: any) => t.Key === 'iac-rlhf-amazon');
      expect(iacTag).toBeDefined();
    });
  });

  describe('EventBridge Scheduling', () => {
    test('should have EventBridge rule for daily scheduling', () => {
      expect(template.Resources.DailyBackupRule).toBeDefined();
      const rule = template.Resources.DailyBackupRule;
      expect(rule.Type).toBe('AWS::Events::Rule');
      expect(rule.Properties.Name).toEqual({
        'Fn::Sub': '${Environment}-daily-backup-trigger'
      });
      expect(rule.Properties.ScheduleExpression).toBe('cron(0 2 * * ? *)'); // 2 AM UTC daily
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('EventBridge rule should target Lambda function', () => {
      const rule = template.Resources.DailyBackupRule;
      const targets = rule.Properties.Targets;
      expect(targets).toHaveLength(1);
      expect(targets[0].Arn).toEqual({
        'Fn::GetAtt': ['BackupLambdaFunction', 'Arn']
      });
      expect(targets[0].Id).toBe('1');
    });

    test('EventBridge rule should NOT have RetryPolicy (removed for LocalStack)', () => {
      const rule = template.Resources.DailyBackupRule;
      const targets = rule.Properties.Targets;
      expect(targets[0].RetryPolicy).toBeUndefined();
    });

    test('EventBridge rule should have required tags', () => {
      const rule = template.Resources.DailyBackupRule;
      const tags = rule.Properties.Tags;

      const iacTag = tags.find((t: any) => t.Key === 'iac-rlhf-amazon');
      expect(iacTag).toBeDefined();
      expect(iacTag.Value).toBe('true');
    });

    test('should have Lambda invoke permission for EventBridge', () => {
      expect(template.Resources.LambdaInvokePermission).toBeDefined();
      const permission = template.Resources.LambdaInvokePermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.FunctionName).toEqual({ Ref: 'BackupLambdaFunction' });
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.SourceArn).toEqual({
        'Fn::GetAtt': ['DailyBackupRule', 'Arn']
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have CloudWatch alarm for backup failures', () => {
      expect(template.Resources.BackupFailureAlarm).toBeDefined();
      const alarm = template.Resources.BackupFailureAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.AlarmName).toEqual({
        'Fn::Sub': '${Environment}-backup-failures'
      });
      expect(alarm.Properties.MetricName).toBe('BackupFailure');
      expect(alarm.Properties.Namespace).toBe('BackupSystem');
      expect(alarm.Properties.Threshold).toBe(1);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    });

    test('BackupFailureAlarm should have correct metric configuration', () => {
      const alarm = template.Resources.BackupFailureAlarm;
      expect(alarm.Properties.Statistic).toBe('Sum');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(1);
      expect(alarm.Properties.TreatMissingData).toBe('notBreaching');
    });

    test('BackupFailureAlarm should have Environment dimension', () => {
      const alarm = template.Resources.BackupFailureAlarm;
      const dimensions = alarm.Properties.Dimensions;
      expect(dimensions).toHaveLength(1);
      expect(dimensions[0].Name).toBe('Environment');
      expect(dimensions[0].Value).toEqual({ Ref: 'Environment' });
    });

    test('should have CloudWatch alarm for Lambda duration', () => {
      expect(template.Resources.LambdaDurationAlarm).toBeDefined();
      const alarm = template.Resources.LambdaDurationAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.AlarmName).toEqual({
        'Fn::Sub': '${Environment}-backup-duration-high'
      });
      expect(alarm.Properties.MetricName).toBe('Duration');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Threshold).toBe(600000); // 10 minutes in milliseconds
    });

    test('LambdaDurationAlarm should have correct metric configuration', () => {
      const alarm = template.Resources.LambdaDurationAlarm;
      expect(alarm.Properties.Statistic).toBe('Average');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('CloudWatch alarms should NOT have Tags (removed for LocalStack)', () => {
      const backupAlarm = template.Resources.BackupFailureAlarm;
      const durationAlarm = template.Resources.LambdaDurationAlarm;
      
      expect(backupAlarm.Properties.Tags).toBeUndefined();
      expect(backupAlarm.Tags).toBeUndefined();
      expect(durationAlarm.Properties.Tags).toBeUndefined();
      expect(durationAlarm.Tags).toBeUndefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'BackupBucketName',
        'BackupLambdaArn',
        'EventBridgeRuleName'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should NOT have KMS and LoggingBucket outputs (removed for LocalStack)', () => {
      expect(template.Outputs.KMSKeyId).toBeUndefined();
      expect(template.Outputs.LoggingBucketName).toBeUndefined();
    });

    test('outputs should have proper export names for cross-stack references', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toEqual({
          'Fn::Sub': expect.stringContaining('${AWS::StackName}')
        });
      });
    });

    test('BackupBucketName output should reference the S3 bucket', () => {
      const output = template.Outputs.BackupBucketName;
      expect(output.Description).toContain('S3 backup bucket');
      expect(output.Value).toEqual({ Ref: 'BackupS3Bucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-backup-bucket'
      });
    });

    test('BackupLambdaArn output should reference Lambda function ARN', () => {
      const output = template.Outputs.BackupLambdaArn;
      expect(output.Description).toContain('backup Lambda function');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['BackupLambdaFunction', 'Arn']
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-backup-lambda-arn'
      });
    });

    test('EventBridgeRuleName output should reference the rule', () => {
      const output = template.Outputs.EventBridgeRuleName;
      expect(output.Description).toContain('EventBridge rule');
      expect(output.Value).toEqual({ Ref: 'DailyBackupRule' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-daily-backup-rule'
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have correct number of resources for LocalStack-compatible backup system', () => {
      // S3 Bucket, IAM Role, Log Group, Lambda, EventBridge Rule, Lambda Permission, 2 Alarms
      const expectedResourceCount = 8;
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(expectedResourceCount);
    });

    test('should NOT have KMS resources (removed for LocalStack)', () => {
      expect(template.Resources.BackupKMSKey).toBeUndefined();
      expect(template.Resources.BackupKMSKeyAlias).toBeUndefined();
    });

    test('should NOT have Logging bucket (removed for LocalStack)', () => {
      expect(template.Resources.LoggingBucket).toBeUndefined();
    });
  });

  describe('LocalStack Compatibility Verification', () => {
    test('template should not contain KMS references', () => {
      const templateString = JSON.stringify(template);
      expect(templateString).not.toContain('AWS::KMS::Key');
      expect(templateString).not.toContain('AWS::KMS::Alias');
    });

    test('S3 encryption should use AES256 only', () => {
      const templateString = JSON.stringify(template);
      expect(templateString).toContain('AES256');
      expect(templateString).not.toContain('aws:kms');
    });

    test('template should not have S3 logging configuration', () => {
      const bucket = template.Resources.BackupS3Bucket;
      expect(bucket.Properties.LoggingConfiguration).toBeUndefined();
    });

    test('template should not have S3 metrics configuration', () => {
      const bucket = template.Resources.BackupS3Bucket;
      expect(bucket.Properties.MetricsConfigurations).toBeUndefined();
    });

    test('EventBridge rule should not have retry policy', () => {
      const rule = template.Resources.DailyBackupRule;
      const targets = rule.Properties.Targets;
      expect(targets[0].RetryPolicy).toBeUndefined();
    });

    test('template description should indicate LocalStack compatibility', () => {
      expect(template.Description).toContain('LocalStack Compatible');
    });
  });

  describe('Cross-Account and Region Compatibility', () => {
    test('should not contain hardcoded account IDs', () => {
      const templateString = JSON.stringify(template);
      const accountIdPattern = /\d{12}/g;
      const matches = templateString.match(accountIdPattern);

      // Filter out valid uses like retention days, timeouts, etc.
      const invalidMatches = matches?.filter(match => {
        const context = templateString.substring(
          templateString.indexOf(match) - 50,
          templateString.indexOf(match) + 50
        );
        return !context.includes('RetentionDays') &&
          !context.includes('Threshold') &&
          !context.includes('Period') &&
          !context.includes('Timeout') &&
          !context.includes('MemorySize') &&
          !context.includes('DaysAfterInitiation');
      });

      expect(invalidMatches?.length || 0).toBe(0);
    });

    test('should use AWS pseudo parameters where needed', () => {
      const templateString = JSON.stringify(template);
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

    test('all resource names should follow naming convention', () => {
      const resources = Object.keys(template.Resources);
      resources.forEach(resourceName => {
        // Should use PascalCase
        expect(resourceName).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
      });
    });

    test('all parameters should have descriptions', () => {
      Object.keys(template.Parameters).forEach(paramName => {
        const param = template.Parameters[paramName];
        expect(param.Description).toBeDefined();
        expect(param.Description.length).toBeGreaterThan(0);
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });

    test('RetentionDays parameter should be configurable', () => {
      const retentionParam = template.Parameters.RetentionDays;
      expect(retentionParam).toBeDefined();
      expect(retentionParam.Type).toBe('Number');
      expect(retentionParam.Default).toBe(30);
      expect(retentionParam.MinValue).toBe(1);
      expect(retentionParam.MaxValue).toBe(365);
    });
  });
});
