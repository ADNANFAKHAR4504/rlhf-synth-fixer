import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Infrastructure Compliance Validation System - CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Convert YAML to JSON for testing
    // Run: pipenv run cfn-flip-to-json > lib/TapStack.json
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have appropriate description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Infrastructure Compliance Validation System');
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
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBeDefined();
    });

    test('should have NotificationEmail parameter', () => {
      expect(template.Parameters.NotificationEmail).toBeDefined();
      const param = template.Parameters.NotificationEmail;
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toBeDefined();
    });
  });

  describe('KMS Key Resources', () => {
    test('should have ComplianceKmsKey resource', () => {
      expect(template.Resources.ComplianceKmsKey).toBeDefined();
      const key = template.Resources.ComplianceKmsKey;
      expect(key.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have rotation enabled', () => {
      const key = template.Resources.ComplianceKmsKey;
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('KMS key should have proper policy', () => {
      const key = template.Resources.ComplianceKmsKey;
      expect(key.Properties.KeyPolicy).toBeDefined();
      expect(key.Properties.KeyPolicy.Statement).toBeDefined();
      expect(Array.isArray(key.Properties.KeyPolicy.Statement)).toBe(true);
    });

    test('should have ComplianceKmsKeyAlias resource', () => {
      expect(template.Resources.ComplianceKmsKeyAlias).toBeDefined();
      const alias = template.Resources.ComplianceKmsKeyAlias;
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName).toBeDefined();
    });
  });

  describe('S3 Bucket Resources', () => {
    test('should have ConfigBucket resource', () => {
      expect(template.Resources.ConfigBucket).toBeDefined();
      const bucket = template.Resources.ConfigBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('ConfigBucket should have encryption enabled', () => {
      const bucket = template.Resources.ConfigBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('ConfigBucket should block public access', () => {
      const bucket = template.Resources.ConfigBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('ConfigBucket should have versioning enabled', () => {
      const bucket = template.Resources.ConfigBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('ConfigBucket should have lifecycle configuration', () => {
      const bucket = template.Resources.ConfigBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
      expect(Array.isArray(bucket.Properties.LifecycleConfiguration.Rules)).toBe(true);
    });

    test('should have ConfigBucketPolicy resource', () => {
      expect(template.Resources.ConfigBucketPolicy).toBeDefined();
      const policy = template.Resources.ConfigBucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('ConfigBucketPolicy should allow Config service access', () => {
      const policy = template.Resources.ConfigBucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      const configStatement = statements.find((s: any) =>
        s.Principal && s.Principal.Service === 'config.amazonaws.com'
      );
      expect(configStatement).toBeDefined();
    });
  });

  describe('SNS Topic Resources', () => {
    test('should have ComplianceNotificationTopic resource', () => {
      expect(template.Resources.ComplianceNotificationTopic).toBeDefined();
      const topic = template.Resources.ComplianceNotificationTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('SNS topic should have KMS encryption', () => {
      const topic = template.Resources.ComplianceNotificationTopic;
      expect(topic.Properties.KmsMasterKeyId).toBeDefined();
    });

    test('SNS topic should have email subscription', () => {
      const topic = template.Resources.ComplianceNotificationTopic;
      expect(topic.Properties.Subscription).toBeDefined();
      expect(Array.isArray(topic.Properties.Subscription)).toBe(true);
      expect(topic.Properties.Subscription.length).toBeGreaterThan(0);
    });

    test('should have ComplianceNotificationTopicPolicy resource', () => {
      expect(template.Resources.ComplianceNotificationTopicPolicy).toBeDefined();
      const policy = template.Resources.ComplianceNotificationTopicPolicy;
      expect(policy.Type).toBe('AWS::SNS::TopicPolicy');
    });
  });

  describe('IAM Role Resources', () => {
    test('should not have ConfigRole resource (using existing Config setup)', () => {
      // ConfigRole not needed as we're using existing AWS Config in the account
      expect(template.Resources.ConfigRole).toBeUndefined();
    });

    test('should have ComplianceLambdaRole resource', () => {
      expect(template.Resources.ComplianceLambdaRole).toBeDefined();
      const role = template.Resources.ComplianceLambdaRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('ComplianceLambdaRole should have Lambda service principal', () => {
      const role = template.Resources.ComplianceLambdaRole;
      const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('ComplianceLambdaRole should have least-privilege policies', () => {
      const role = template.Resources.ComplianceLambdaRole;
      expect(role.Properties.Policies).toBeDefined();
      expect(Array.isArray(role.Properties.Policies)).toBe(true);
      expect(role.Properties.Policies.length).toBeGreaterThan(0);
    });
  });

  describe('AWS Config Resources', () => {
    test('should not have ConfigRecorder (using existing Config setup)', () => {
      // Using existing AWS Config Recorder: config-recorder-pr6611
      expect(template.Resources.ConfigRecorder).toBeUndefined();
    });

    test('should not have ConfigDeliveryChannel (using existing Config setup)', () => {
      // Using existing AWS Config Delivery Channel: config-delivery-pr6611
      expect(template.Resources.ConfigDeliveryChannel).toBeUndefined();
    });

    test('should have Config Rules that work with existing Config', () => {
      // Config Rules can be deployed even with existing Config infrastructure
      expect(template.Resources.S3BucketEncryptionRule).toBeDefined();
      expect(template.Resources.CustomComplianceRule).toBeDefined();
    });
  });

  describe('Lambda Function Resources', () => {
    test('should have CustomComplianceValidatorFunction resource', () => {
      expect(template.Resources.CustomComplianceValidatorFunction).toBeDefined();
      const lambda = template.Resources.CustomComplianceValidatorFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda function should use Python 3.11 runtime', () => {
      const lambda = template.Resources.CustomComplianceValidatorFunction;
      expect(lambda.Properties.Runtime).toBe('python3.11');
    });

    test('Lambda function should have inline code', () => {
      const lambda = template.Resources.CustomComplianceValidatorFunction;
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toContain('def lambda_handler');
    });

    test('Lambda function should have environment variables', () => {
      const lambda = template.Resources.CustomComplianceValidatorFunction;
      expect(lambda.Properties.Environment).toBeDefined();
      expect(lambda.Properties.Environment.Variables).toBeDefined();
    });

    test('Lambda function should have appropriate timeout', () => {
      const lambda = template.Resources.CustomComplianceValidatorFunction;
      expect(lambda.Properties.Timeout).toBe(300);
    });

    test('should have ComplianceLambdaPermission resource', () => {
      expect(template.Resources.ComplianceLambdaPermission).toBeDefined();
      const permission = template.Resources.ComplianceLambdaPermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
    });

    test('Lambda permission should allow Config service', () => {
      const permission = template.Resources.ComplianceLambdaPermission;
      expect(permission.Properties.Principal).toBe('config.amazonaws.com');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have ComplianceLambdaLogGroup resource', () => {
      expect(template.Resources.ComplianceLambdaLogGroup).toBeDefined();
      const logGroup = template.Resources.ComplianceLambdaLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('Log group should have retention policy', () => {
      const logGroup = template.Resources.ComplianceLambdaLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(14);
    });

    test('Log group should have KMS encryption', () => {
      const logGroup = template.Resources.ComplianceLambdaLogGroup;
      expect(logGroup.Properties.KmsKeyId).toBeDefined();
    });

    test('should have NonCompliantResourcesAlarm resource', () => {
      expect(template.Resources.NonCompliantResourcesAlarm).toBeDefined();
      const alarm = template.Resources.NonCompliantResourcesAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have ConfigRecorderFailureAlarm resource', () => {
      expect(template.Resources.ConfigRecorderFailureAlarm).toBeDefined();
      const alarm = template.Resources.ConfigRecorderFailureAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });
  });

  describe('Config Rules', () => {
    const expectedManagedRules = [
      'S3BucketEncryptionRule',
      'S3BucketPublicAccessRule',
      'RDSEncryptionRule',
      'EBSEncryptionRule',
      'RequiredTagsRule',
      'VPCFlowLogsRule'
    ];

    test.each(expectedManagedRules)('should have %s resource', (ruleName) => {
      expect(template.Resources[ruleName]).toBeDefined();
      const rule = template.Resources[ruleName];
      expect(rule.Type).toBe('AWS::Config::ConfigRule');
    });

    test('should have CustomComplianceRule resource', () => {
      expect(template.Resources.CustomComplianceRule).toBeDefined();
      const rule = template.Resources.CustomComplianceRule;
      expect(rule.Type).toBe('AWS::Config::ConfigRule');
    });

    test('CustomComplianceRule should use Lambda function', () => {
      const rule = template.Resources.CustomComplianceRule;
      expect(rule.Properties.Source.Owner).toBe('CUSTOM_LAMBDA');
      expect(rule.Properties.Source.SourceIdentifier).toBeDefined();
    });

    test('Config rules should not depend on ConfigRecorder (using existing)', () => {
      const rule = template.Resources.S3BucketEncryptionRule;
      // DependsOn ConfigRecorder removed since using existing Config infrastructure
      expect(rule.DependsOn).toBeUndefined();
    });

    test('Managed rules should use AWS-managed identifiers', () => {
      const rule = template.Resources.S3BucketEncryptionRule;
      expect(rule.Properties.Source.Owner).toBe('AWS');
      expect(rule.Properties.Source.SourceIdentifier).toBe('S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED');
    });
  });

  describe('Resource Naming Convention', () => {
    test('all named resources should use EnvironmentSuffix', () => {
      const resourcesWithNames = [
        // ConfigRole removed - using existing Config
        'ComplianceLambdaRole',
        'CustomComplianceValidatorFunction',
        // ConfigRecorder and ConfigDeliveryChannel removed - using existing Config
        'S3BucketEncryptionRule',
        'CustomComplianceRule'
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties) {
          const nameProperty =
            resource.Properties.RoleName ||
            resource.Properties.FunctionName ||
            resource.Properties.Name ||
            resource.Properties.ConfigRuleName;

          if (nameProperty) {
            expect(nameProperty).toHaveProperty('Fn::Sub');
            expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });

    test('S3 bucket name should include account ID', () => {
      const bucket = template.Resources.ConfigBucket;
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${AWS::AccountId}');
    });

    test('SNS topic name should use EnvironmentSuffix', () => {
      const topic = template.Resources.ComplianceNotificationTopic;
      expect(topic.Properties.TopicName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Security Best Practices', () => {
    test('all IAM roles should have appropriate tags', () => {
      const roles = ['ComplianceLambdaRole']; // ConfigRole removed - using existing Config
      roles.forEach(roleName => {
        const role = template.Resources[roleName];
        expect(role).toBeDefined();
        expect(role.Properties.Tags).toBeDefined();
        expect(Array.isArray(role.Properties.Tags)).toBe(true);
      });
    });

    test('Lambda function should not have wildcard permissions', () => {
      const role = template.Resources.ComplianceLambdaRole;
      role.Properties.Policies.forEach((policy: any) => {
        policy.PolicyDocument.Statement.forEach((statement: any) => {
          if (statement.Action && typeof statement.Action === 'string') {
            expect(statement.Action).not.toBe('*');
          }
        });
      });
    });

    test('S3 bucket policy should deny unencrypted uploads', () => {
      const policy = template.Resources.ConfigBucketPolicy;
      const denyStatement = policy.Properties.PolicyDocument.Statement.find(
        (s: any) => s.Sid === 'DenyUnencryptedObjectUploads'
      );
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Effect).toBe('Deny');
    });
  });

  describe('Outputs', () => {
    test('should have ConfigBucketName output', () => {
      expect(template.Outputs.ConfigBucketName).toBeDefined();
      const output = template.Outputs.ConfigBucketName;
      expect(output.Export).toBeDefined();
    });

    test('should have ComplianceNotificationTopicArn output', () => {
      expect(template.Outputs.ComplianceNotificationTopicArn).toBeDefined();
    });

    test('should have CustomComplianceFunctionArn output', () => {
      expect(template.Outputs.CustomComplianceFunctionArn).toBeDefined();
    });

    test('should not have ConfigRecorderName output (using existing Config)', () => {
      // ConfigRecorder output removed since using existing Config infrastructure
      expect(template.Outputs.ConfigRecorderName).toBeUndefined();
    });

    test('should have KmsKeyId output', () => {
      expect(template.Outputs.KmsKeyId).toBeDefined();
    });

    test('should have ComplianceRuleNames output', () => {
      expect(template.Outputs.ComplianceRuleNames).toBeDefined();
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (outputKey !== 'ComplianceRuleNames') {
          expect(output.Export).toBeDefined();
          expect(output.Export.Name).toBeDefined();
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have all expected resource types', () => {
      const expectedResourceTypes = [
        'AWS::KMS::Key',
        'AWS::S3::Bucket',
        'AWS::SNS::Topic',
        'AWS::IAM::Role',
        // Note: ConfigurationRecorder and DeliveryChannel removed - using existing Config
        'AWS::Lambda::Function',
        'AWS::Config::ConfigRule',
        'AWS::CloudWatch::Alarm',
        'AWS::Logs::LogGroup'
      ];

      expectedResourceTypes.forEach(type => {
        const hasType = Object.values(template.Resources).some(
          (resource: any) => resource.Type === type
        );
        expect(hasType).toBe(true);
      });
    });

    test('should have at least 7 Config Rules', () => {
      const configRules = Object.values(template.Resources).filter(
        (resource: any) => resource.Type === 'AWS::Config::ConfigRule'
      );
      expect(configRules.length).toBeGreaterThanOrEqual(7);
    });
  });
});
