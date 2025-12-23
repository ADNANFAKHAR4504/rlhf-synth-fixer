import fs from 'fs';
import path from 'path';

const environment = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('LocalStack Compatible eBook Storage System CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the converted JSON template
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure Validation', () => {
    test('should have correct CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have LocalStack-compatible description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('LocalStack Compatible');
      expect(template.Description).toContain('Secure eBook Storage System');
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toHaveLength(2);
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should not have CloudFront or Route53 resources (removed for LocalStack)', () => {
      expect(template.Resources.CloudFrontOAI).toBeUndefined();
      expect(template.Resources.EbooksCloudFrontDistribution).toBeUndefined();
      expect(template.Resources.SSLCertificate).toBeUndefined();
      expect(template.Resources.Route53Record).toBeUndefined();
      expect(template.Resources.CloudFrontWebACL).toBeUndefined();
    });
  });

  describe('Parameters Validation', () => {
    test('should have all LocalStack-compatible parameters', () => {
      const expectedParams = [
        'Environment',
        'KmsKeyAlias',
        'EnableLogging'
      ];

      expectedParams.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('should not have removed parameters', () => {
      const removedParams = ['DomainName', 'HostedZoneId', 'EnableWAF', 'EnableLifecyclePolicies'];
      removedParams.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeUndefined();
      });
    });

    test('Environment parameter should have correct properties', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedValues).toEqual(['dev', 'test', 'prod']);
      expect(param.Description).toContain('Environment name');
    });

    test('KmsKeyAlias parameter should be optional', () => {
      const param = template.Parameters.KmsKeyAlias;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.Description).toContain('Existing KMS key alias');
    });

    test('EnableLogging parameter should have boolean-like allowed values', () => {
      const param = template.Parameters.EnableLogging;
      expect(param.Type).toBe('String');
      expect(param.AllowedValues).toEqual(['true', 'false']);
      expect(param.Default).toBe('true');
    });
  });

  describe('Conditions Validation', () => {
    test('should have all required conditions', () => {
      const expectedConditions = [
        'CreateKmsKey',
        'EnableLoggingCondition'
      ];

      expectedConditions.forEach(conditionName => {
        expect(template.Conditions[conditionName]).toBeDefined();
      });
    });

    test('should not have removed conditions', () => {
      const removedConditions = ['EnableWAFCondition', 'EnableLifecycleCondition', 'HasCustomDomain', 'HasHostedZone'];
      removedConditions.forEach(conditionName => {
        expect(template.Conditions[conditionName]).toBeUndefined();
      });
    });

    test('CreateKmsKey condition should check empty KmsKeyAlias', () => {
      const condition = template.Conditions.CreateKmsKey;
      expect(condition).toEqual({
        'Fn::Equals': [{ Ref: 'KmsKeyAlias' }, '']
      });
    });

    test('EnableLoggingCondition should check for logging parameter', () => {
      const condition = template.Conditions.EnableLoggingCondition;
      expect(condition).toEqual({
        'Fn::Equals': [{ Ref: 'EnableLogging' }, 'true']
      });
    });
  });

  describe('S3 Resources', () => {
    test('should have main S3 bucket for eBook storage', () => {
      expect(template.Resources.EbooksS3Bucket).toBeDefined();
      expect(template.Resources.EbooksS3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have simplified naming without AWS::AccountId', () => {
      const bucket = template.Resources.EbooksS3Bucket;
      const bucketName = bucket.Properties.BucketName;
      expect(bucketName['Fn::Sub']).toBe('ebooks-storage-${Environment}');
      expect(bucketName['Fn::Sub']).not.toContain('${AWS::AccountId}');
    });

    test('S3 bucket should have KMS encryption', () => {
      const bucket = template.Resources.EbooksS3Bucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toHaveLength(1);

      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toBeDefined();
    });

    test('S3 bucket should use conditional KMS key reference', () => {
      const bucket = template.Resources.EbooksS3Bucket;
      const kmsKeyId = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.KMSMasterKeyID;

      expect(kmsKeyId['Fn::If']).toBeDefined();
      expect(kmsKeyId['Fn::If'][0]).toBe('CreateKmsKey');
      expect(kmsKeyId['Fn::If'][1]).toEqual({ 'Fn::GetAtt': ['EbooksKmsKey', 'Arn'] });
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.EbooksS3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should block all public access', () => {
      const bucket = template.Resources.EbooksS3Bucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have conditional logging configuration', () => {
      const bucket = template.Resources.EbooksS3Bucket;
      const loggingConfig = bucket.Properties.LoggingConfiguration;

      expect(loggingConfig['Fn::If']).toBeDefined();
      expect(loggingConfig['Fn::If'][0]).toBe('EnableLoggingCondition');
    });

    test('S3 bucket should have proper tags', () => {
      const bucket = template.Resources.EbooksS3Bucket;
      const tags = bucket.Properties.Tags;

      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);

      const iacTag = tags.find((tag: any) => tag.Key === 'iac-rlhf-amazon');
      expect(iacTag).toBeDefined();
      expect(iacTag.Value).toBe('true');

      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag).toBeDefined();

      const purposeTag = tags.find((tag: any) => tag.Key === 'Purpose');
      expect(purposeTag.Value).toBe('eBook-storage');
    });

    test('should have conditional logging bucket', () => {
      const loggingBucket = template.Resources.LoggingBucket;
      expect(loggingBucket).toBeDefined();
      expect(loggingBucket.Condition).toBe('EnableLoggingCondition');
      expect(loggingBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('logging bucket should have AES256 encryption (not KMS)', () => {
      const loggingBucket = template.Resources.LoggingBucket;
      const encryption = loggingBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toBeUndefined();
    });

    test('logging bucket should block public access', () => {
      const loggingBucket = template.Resources.LoggingBucket;
      const publicAccessBlock = loggingBucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should have S3 bucket policy', () => {
      const bucketPolicy = template.Resources.EbooksS3BucketPolicy;
      expect(bucketPolicy).toBeDefined();
      expect(bucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
      expect(bucketPolicy.Properties.Bucket).toEqual({ Ref: 'EbooksS3Bucket' });
    });

    test('S3 bucket policy should allow IAM role access', () => {
      const bucketPolicy = template.Resources.EbooksS3BucketPolicy;
      const statements = bucketPolicy.Properties.PolicyDocument.Statement;

      expect(Array.isArray(statements)).toBe(true);
      expect(statements.length).toBeGreaterThan(0);

      const getObjectStatement = statements.find((s: any) => s.Sid === 'AllowGetObject');
      expect(getObjectStatement).toBeDefined();
      expect(getObjectStatement.Effect).toBe('Allow');
      expect(getObjectStatement.Principal.AWS).toEqual({ 'Fn::GetAtt': ['S3AccessRole', 'Arn'] });
    });
  });

  describe('KMS Resources', () => {
    test('should have conditional KMS key', () => {
      const kmsKey = template.Resources.EbooksKmsKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Condition).toBe('CreateKmsKey');
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have proper policy for LocalStack', () => {
      const kmsKey = template.Resources.EbooksKmsKey;
      const policy = kmsKey.Properties.KeyPolicy;

      expect(policy.Version).toBe('2012-10-17');
      expect(Array.isArray(policy.Statement)).toBe(true);
      expect(policy.Statement.length).toBeGreaterThanOrEqual(2);
    });

    test('KMS key should allow S3 to use it', () => {
      const kmsKey = template.Resources.EbooksKmsKey;
      const policy = kmsKey.Properties.KeyPolicy;

      const s3Statement = policy.Statement.find((stmt: any) => stmt.Sid === 'Allow S3 to use the key');
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Effect).toBe('Allow');
      expect(s3Statement.Principal.Service).toBe('s3.amazonaws.com');
      expect(s3Statement.Action).toContain('kms:Decrypt');
      expect(s3Statement.Action).toContain('kms:GenerateDataKey');
    });

    test('should have KMS key alias', () => {
      const kmsAlias = template.Resources.EbooksKmsKeyAlias;
      expect(kmsAlias).toBeDefined();
      expect(kmsAlias.Condition).toBe('CreateKmsKey');
      expect(kmsAlias.Type).toBe('AWS::KMS::Alias');
      expect(kmsAlias.Properties.TargetKeyId).toEqual({ Ref: 'EbooksKmsKey' });
    });

    test('KMS alias should have proper naming pattern', () => {
      const kmsAlias = template.Resources.EbooksKmsKeyAlias;
      expect(kmsAlias.Properties.AliasName['Fn::Sub']).toBe('alias/ebooks-kms-${Environment}');
    });
  });

  describe('IAM Resources', () => {
    test('should have S3 access IAM role', () => {
      const role = template.Resources.S3AccessRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('S3 access role should have proper trust policy', () => {
      const role = template.Resources.S3AccessRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;

      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement).toHaveLength(1);
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
      expect(assumePolicy.Statement[0].Principal.Service).toContain('lambda.amazonaws.com');
    });

    test('S3 access role should NOT use managed policy ARNs', () => {
      const role = template.Resources.S3AccessRole;
      expect(role.Properties.ManagedPolicyArns).toBeUndefined();
    });

    test('S3 access role should have inline policies', () => {
      const role = template.Resources.S3AccessRole;
      expect(role.Properties.Policies).toBeDefined();
      expect(Array.isArray(role.Properties.Policies)).toBe(true);
      expect(role.Properties.Policies.length).toBeGreaterThan(0);
    });

    test('S3 access role should have CloudWatch Logs permissions', () => {
      const role = template.Resources.S3AccessRole;
      const policies = role.Properties.Policies;
      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');

      expect(s3Policy).toBeDefined();
      const statements = s3Policy.PolicyDocument.Statement;
      const logsStatement = statements.find((s: any) => 
        s.Action && s.Action.includes('logs:CreateLogGroup')
      );
      expect(logsStatement).toBeDefined();
    });

    test('should have Storage Monitoring Lambda role', () => {
      const role = template.Resources.StorageMonitoringRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('Storage Monitoring role should NOT use managed policy ARNs', () => {
      const role = template.Resources.StorageMonitoringRole;
      expect(role.Properties.ManagedPolicyArns).toBeUndefined();
    });

    test('Storage Monitoring role should have inline CloudWatch Logs permissions', () => {
      const role = template.Resources.StorageMonitoringRole;
      const policies = role.Properties.Policies;
      const monitoringPolicy = policies.find((p: any) => p.PolicyName === 'StorageMonitoringPolicy');

      expect(monitoringPolicy).toBeDefined();
      const statements = monitoringPolicy.PolicyDocument.Statement;
      const logsStatement = statements.find((s: any) => 
        s.Action && s.Action.includes('logs:CreateLogGroup')
      );
      expect(logsStatement).toBeDefined();
    });

    test('Storage Monitoring role should have S3 permissions', () => {
      const role = template.Resources.StorageMonitoringRole;
      const policies = role.Properties.Policies;
      const monitoringPolicy = policies.find((p: any) => p.PolicyName === 'StorageMonitoringPolicy');

      const s3Statement = monitoringPolicy.PolicyDocument.Statement.find((s: any) => 
        s.Action && s.Action.includes('s3:ListBucket')
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Action).toContain('s3:GetObject');
    });

    test('Storage Monitoring role should have SNS permissions', () => {
      const role = template.Resources.StorageMonitoringRole;
      const policies = role.Properties.Policies;
      const monitoringPolicy = policies.find((p: any) => p.PolicyName === 'StorageMonitoringPolicy');

      const snsStatement = monitoringPolicy.PolicyDocument.Statement.find((s: any) => 
        s.Action && s.Action.includes('sns:Publish')
      );
      expect(snsStatement).toBeDefined();
      expect(snsStatement.Resource).toEqual({ Ref: 'SNSAlertTopic' });
    });

    test('Storage Monitoring role should have KMS permissions', () => {
      const role = template.Resources.StorageMonitoringRole;
      const policies = role.Properties.Policies;
      const monitoringPolicy = policies.find((p: any) => p.PolicyName === 'StorageMonitoringPolicy');

      const kmsStatement = monitoringPolicy.PolicyDocument.Statement.find((s: any) => 
        s.Action && s.Action.includes('kms:Decrypt')
      );
      expect(kmsStatement).toBeDefined();
      expect(kmsStatement.Action).toContain('kms:DescribeKey');
    });
  });

  describe('SNS Resources', () => {
    test('should have SNS topic for alerts', () => {
      const topic = template.Resources.SNSAlertTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('SNS topic should have proper naming', () => {
      const topic = template.Resources.SNSAlertTopic;
      expect(topic.Properties.TopicName['Fn::Sub']).toBe('eBook-Alerts-${Environment}');
    });

    test('SNS topic should have display name', () => {
      const topic = template.Resources.SNSAlertTopic;
      expect(topic.Properties.DisplayName).toContain('eBook Storage System Alerts');
    });

    test('SNS topic should have proper tags', () => {
      const topic = template.Resources.SNSAlertTopic;
      const tags = topic.Properties.Tags;

      const iacTag = tags.find((tag: any) => tag.Key === 'iac-rlhf-amazon');
      expect(iacTag).toBeDefined();
      expect(iacTag.Value).toBe('true');
    });
  });

  describe('Lambda Resources', () => {
    test('should have Storage Monitoring Lambda function', () => {
      const func = template.Resources.StorageMonitoringFunction;
      expect(func).toBeDefined();
      expect(func.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda function should use Python 3.11 runtime', () => {
      const func = template.Resources.StorageMonitoringFunction;
      expect(func.Properties.Runtime).toBe('python3.11');
    });

    test('Lambda function should have appropriate timeout', () => {
      const func = template.Resources.StorageMonitoringFunction;
      expect(func.Properties.Timeout).toBe(60);
      expect(func.Properties.Timeout).toBeLessThanOrEqual(900); // AWS Lambda max timeout
    });

    test('Lambda function should have required environment variables', () => {
      const func = template.Resources.StorageMonitoringFunction;
      const envVars = func.Properties.Environment.Variables;

      expect(envVars.S3_BUCKET).toEqual({ Ref: 'EbooksS3Bucket' });
      expect(envVars.SNS_TOPIC_ARN).toEqual({ Ref: 'SNSAlertTopic' });
      expect(envVars.ENVIRONMENT).toEqual({ Ref: 'Environment' });
    });

    test('Lambda function should have inline code', () => {
      const func = template.Resources.StorageMonitoringFunction;
      expect(func.Properties.Code.ZipFile).toBeDefined();
      expect(func.Properties.Code.ZipFile).toContain('def handler(event, context)');
      expect(func.Properties.Code.ZipFile).toContain('boto3');
    });

    test('Lambda function code should include S3 operations', () => {
      const func = template.Resources.StorageMonitoringFunction;
      const code = func.Properties.Code.ZipFile;

      expect(code).toContain('s3.list_objects_v2');
      expect(code).toContain('bucket_name');
    });

    test('Lambda function code should include SNS publishing', () => {
      const func = template.Resources.StorageMonitoringFunction;
      const code = func.Properties.Code.ZipFile;

      expect(code).toContain('sns.publish');
      expect(code).toContain('TopicArn');
    });

    test('Lambda function should have proper handler', () => {
      const func = template.Resources.StorageMonitoringFunction;
      expect(func.Properties.Handler).toBe('index.handler');
    });

    test('Lambda function should reference correct IAM role', () => {
      const func = template.Resources.StorageMonitoringFunction;
      expect(func.Properties.Role).toEqual({ 'Fn::GetAtt': ['StorageMonitoringRole', 'Arn'] });
    });

    test('Lambda function should have proper tags', () => {
      const func = template.Resources.StorageMonitoringFunction;
      const tags = func.Properties.Tags;

      const purposeTag = tags.find((tag: any) => tag.Key === 'Purpose');
      expect(purposeTag.Value).toBe('Storage-monitoring');
    });
  });

  describe('EventBridge Resources', () => {
    test('should have EventBridge schedule rule', () => {
      const rule = template.Resources.StorageMonitoringSchedule;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Events::Rule');
    });

    test('EventBridge rule should have daily schedule', () => {
      const rule = template.Resources.StorageMonitoringSchedule;
      expect(rule.Properties.ScheduleExpression).toBe('rate(1 day)');
    });

    test('EventBridge rule should be enabled', () => {
      const rule = template.Resources.StorageMonitoringSchedule;
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('EventBridge rule should target Lambda function', () => {
      const rule = template.Resources.StorageMonitoringSchedule;
      const targets = rule.Properties.Targets;

      expect(Array.isArray(targets)).toBe(true);
      expect(targets).toHaveLength(1);
      expect(targets[0].Arn).toEqual({ 'Fn::GetAtt': ['StorageMonitoringFunction', 'Arn'] });
      expect(targets[0].Id).toBe('StorageMonitoringTarget');
    });

    test('should have Lambda permission for EventBridge', () => {
      const permission = template.Resources.StorageMonitoringPermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
    });

    test('Lambda permission should allow EventBridge to invoke', () => {
      const permission = template.Resources.StorageMonitoringPermission;
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
      expect(permission.Properties.FunctionName).toEqual({ Ref: 'StorageMonitoringFunction' });
    });
  });

  describe('Removed Resources Verification', () => {
    test('should NOT have CloudWatch Alarms (not compatible with LocalStack)', () => {
      expect(template.Resources.HighErrorRateAlarm).toBeUndefined();
      expect(template.Resources.LowCacheHitRateAlarm).toBeUndefined();
      expect(template.Resources.BucketSizeAlarm).toBeUndefined();
      expect(template.Resources.ObjectCountAlarm).toBeUndefined();
    });

    test('should NOT have CloudWatch Dashboard', () => {
      expect(template.Resources.CloudWatchDashboard).toBeUndefined();
    });

    test('should NOT have CloudFront resources', () => {
      expect(template.Resources.CloudFrontOAI).toBeUndefined();
      expect(template.Resources.EbooksCloudFrontDistribution).toBeUndefined();
    });

    test('should NOT have Route53 resources', () => {
      expect(template.Resources.Route53Record).toBeUndefined();
    });

    test('should NOT have ACM Certificate', () => {
      expect(template.Resources.SSLCertificate).toBeUndefined();
    });

    test('should NOT have WAFv2 resources', () => {
      expect(template.Resources.CloudFrontWebACL).toBeUndefined();
    });

    test('should NOT have S3 Lifecycle Policies with GLACIER', () => {
      const bucket = template.Resources.EbooksS3Bucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeUndefined();
    });
  });

  describe('Resource Tagging', () => {
    test('all taggable resources should have iac-rlhf-amazon tag', () => {
      const resources = template.Resources;
      const taggableResources = Object.keys(resources).filter(key => {
        const resource = resources[key];
        return resource.Properties && resource.Properties.Tags;
      });

      expect(taggableResources.length).toBeGreaterThan(0);

      taggableResources.forEach(resourceName => {
        const resource = resources[resourceName];
        const tags = resource.Properties.Tags;
        const iacTag = tags.find((tag: any) => tag.Key === 'iac-rlhf-amazon');
        expect(iacTag).toBeDefined();
        expect(iacTag.Value).toBe('true');
      });
    });

    test('all taggable resources should have Environment tag', () => {
      const resources = template.Resources;
      const taggableResources = Object.keys(resources).filter(key => {
        const resource = resources[key];
        return resource.Properties && resource.Properties.Tags;
      });

      taggableResources.forEach(resourceName => {
        const resource = resources[resourceName];
        const tags = resource.Properties.Tags;
        const envTag = tags.find((tag: any) => tag.Key === 'Environment');
        expect(envTag).toBeDefined();
      });
    });

    test('all taggable resources should have Purpose tag', () => {
      const resources = template.Resources;
      const taggableResources = Object.keys(resources).filter(key => {
        const resource = resources[key];
        return resource.Properties && resource.Properties.Tags;
      });

      taggableResources.forEach(resourceName => {
        const resource = resources[resourceName];
        const tags = resource.Properties.Tags;
        const purposeTag = tags.find((tag: any) => tag.Key === 'Purpose');
        expect(purposeTag).toBeDefined();
      });
    });
  });

  describe('Outputs Validation', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'S3BucketName',
        'S3BucketArn',
        'S3BucketDomainName',
        'S3AccessRoleArn',
        'KmsKeyId',
        'SNSTopicArn',
        'StorageMonitoringFunctionArn',
        'StorageMonitoringFunctionName',
        'Environment'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should NOT have removed outputs', () => {
      const removedOutputs = [
        'CloudFrontDistributionDomain',
        'CloudFrontDistributionId',
        'Route53RecordName',
        'CloudFrontOAIId'
      ];

      removedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeUndefined();
      });
    });

    test('S3BucketName output should reference correct resource', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Value).toEqual({ Ref: 'EbooksS3Bucket' });
      expect(output.Description).toContain('S3 bucket storing eBooks');
    });

    test('S3BucketArn output should use GetAtt', () => {
      const output = template.Outputs.S3BucketArn;
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['EbooksS3Bucket', 'Arn'] });
    });

    test('S3BucketDomainName output should use GetAtt', () => {
      const output = template.Outputs.S3BucketDomainName;
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['EbooksS3Bucket', 'DomainName'] });
    });

    test('KMS key output should be conditional', () => {
      const kmsOutput = template.Outputs.KmsKeyId;
      expect(kmsOutput.Value['Fn::If']).toBeDefined();
      expect(kmsOutput.Value['Fn::If'][0]).toBe('CreateKmsKey');
    });

    test('KmsKeyArn output should exist and be conditional', () => {
      const kmsArnOutput = template.Outputs.KmsKeyArn;
      expect(kmsArnOutput).toBeDefined();
      expect(kmsArnOutput.Condition).toBe('CreateKmsKey');
      expect(kmsArnOutput.Value).toEqual({ 'Fn::GetAtt': ['EbooksKmsKey', 'Arn'] });
    });

    test('LoggingBucketName output should be conditional', () => {
      const loggingOutput = template.Outputs.LoggingBucketName;
      expect(loggingOutput).toBeDefined();
      expect(loggingOutput.Condition).toBe('EnableLoggingCondition');
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('LocalStack Compatibility Verification', () => {
    test('should not use AWS-managed policy ARNs', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).not.toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
      expect(templateStr).not.toContain('ManagedPolicyArns');
    });

    test('should use inline policies instead of managed policies', () => {
      const role1 = template.Resources.S3AccessRole;
      const role2 = template.Resources.StorageMonitoringRole;

      expect(role1.Properties.Policies).toBeDefined();
      expect(role2.Properties.Policies).toBeDefined();
      expect(Array.isArray(role1.Properties.Policies)).toBe(true);
      expect(Array.isArray(role2.Properties.Policies)).toBe(true);
    });

    test('should have simplified S3 bucket naming for LocalStack', () => {
      const bucket = template.Resources.EbooksS3Bucket;
      const bucketName = bucket.Properties.BucketName['Fn::Sub'];

      expect(bucketName).toBe('ebooks-storage-${Environment}');
      expect(bucketName).not.toContain('${AWS::AccountId}');
    });

    test('should only use LocalStack-compatible services', () => {
      const supportedTypes = [
        'AWS::S3::Bucket',
        'AWS::S3::BucketPolicy',
        'AWS::KMS::Key',
        'AWS::KMS::Alias',
        'AWS::IAM::Role',
        'AWS::Lambda::Function',
        'AWS::Lambda::Permission',
        'AWS::SNS::Topic',
        'AWS::Events::Rule'
      ];

      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(supportedTypes).toContain(resource.Type);
      });
    });

    test('total resource count should be reasonable for LocalStack', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(11); // Exact count of resources in LocalStack template
    });
  });

  describe('Security Best Practices', () => {
    test('all S3 buckets should have encryption', () => {
      const s3Buckets = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::S3::Bucket')
        .map(key => template.Resources[key]);

      s3Buckets.forEach(bucket => {
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
      });
    });

    test('all S3 buckets should block public access', () => {
      const s3Buckets = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::S3::Bucket')
        .map(key => template.Resources[key]);

      s3Buckets.forEach(bucket => {
        const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });
    });

    test('IAM roles should have proper trust policies', () => {
      const iamRoles = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::IAM::Role')
        .map(key => template.Resources[key]);

      iamRoles.forEach(role => {
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
        expect(role.Properties.AssumeRolePolicyDocument.Version).toBe('2012-10-17');
        expect(role.Properties.AssumeRolePolicyDocument.Statement).toBeDefined();
      });
    });

    test('should not have hardcoded secrets or credentials', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).not.toMatch(/password\s*[:=]\s*["'][^"']+["']/i);
      expect(templateStr).not.toMatch(/secret\s*[:=]\s*["'][^"']+["']/i);
      expect(templateStr).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS Access Key pattern
    });
  });

  describe('Template Completeness', () => {
    test('should have all core infrastructure components for eBook storage', () => {
      const coreResources = [
        'EbooksS3Bucket',
        'EbooksKmsKey',
        'EbooksKmsKeyAlias',
        'S3AccessRole',
        'SNSAlertTopic',
        'StorageMonitoringFunction',
        'StorageMonitoringRole'
      ];

      coreResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    test('should have monitoring and alerting setup', () => {
      expect(template.Resources.SNSAlertTopic).toBeDefined();
      expect(template.Resources.StorageMonitoringFunction).toBeDefined();
      expect(template.Resources.StorageMonitoringSchedule).toBeDefined();
    });

    test('should have proper Lambda integration with EventBridge', () => {
      expect(template.Resources.StorageMonitoringSchedule).toBeDefined();
      expect(template.Resources.StorageMonitoringPermission).toBeDefined();

      const permission = template.Resources.StorageMonitoringPermission;
      expect(permission.Properties.SourceArn).toEqual({
        'Fn::GetAtt': ['StorageMonitoringSchedule', 'Arn']
      });
    });
  });

  describe('Dynamic Resource References', () => {
    test('should use dynamic references for account ID', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain('${AWS::AccountId}');
    });

    test('should use dynamic references for region', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain('${AWS::Region}');
    });

    test('should use dynamic references for stack name', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain('${AWS::StackName}');
    });

    test('should not have hardcoded account IDs', () => {
      const templateStr = JSON.stringify(template);
      const hardcodedAccountPattern = /arn:aws:[^:]+:[^:]*:[0-9]{12}:/g;
      const matches = templateStr.match(hardcodedAccountPattern);
      expect(matches).toBeNull();
    });
  });

  describe('Intrinsic Functions Usage', () => {
    test('should use Fn::Sub for string substitution', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain('Fn::Sub');
    });

    test('should use Fn::GetAtt for attribute references', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain('Fn::GetAtt');
    });

    test('should use Fn::If for conditional resources', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain('Fn::If');
    });

    test('should use Ref for parameter and resource references', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain('Ref');
    });
  });
});

