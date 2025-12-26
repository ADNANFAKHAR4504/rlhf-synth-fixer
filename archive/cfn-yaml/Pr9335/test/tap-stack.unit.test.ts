import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Infrastructure Compliance Validation System - CloudFormation Template (LocalStack Compatible)', () => {
  let template: any;

  beforeAll(() => {
    // Convert YAML to JSON for testing
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

    test('should have LocalStack compatible description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Infrastructure Compliance Validation System');
      expect(template.Description).toContain('LocalStack Compatible');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
  });

  describe('Parameters', () => {
    test('should have exactly 2 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });

    describe('EnvironmentSuffix parameter', () => {
      test('should have correct type and properties', () => {
        expect(template.Parameters.EnvironmentSuffix).toBeDefined();
        const param = template.Parameters.EnvironmentSuffix;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('dev');
        expect(param.Description).toBeDefined();
      });

      test('should have correct pattern constraint', () => {
        const param = template.Parameters.EnvironmentSuffix;
        expect(param.AllowedPattern).toBe('^[a-z0-9-]+$');
        expect(param.ConstraintDescription).toContain('lowercase letters, numbers, and hyphens');
      });

      test('should validate pattern correctly', () => {
        const pattern = new RegExp(template.Parameters.EnvironmentSuffix.AllowedPattern);
        expect(pattern.test('dev')).toBe(true);
        expect(pattern.test('staging')).toBe(true);
        expect(pattern.test('prod-1')).toBe(true);
        expect(pattern.test('Dev')).toBe(false); // uppercase not allowed
        expect(pattern.test('dev_test')).toBe(false); // underscore not allowed
      });
    });

    describe('NotificationEmail parameter', () => {
      test('should have correct type and properties', () => {
        expect(template.Parameters.NotificationEmail).toBeDefined();
        const param = template.Parameters.NotificationEmail;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('compliance-team@example.com');
        expect(param.Description).toBeDefined();
      });

      test('should have email validation pattern', () => {
        const param = template.Parameters.NotificationEmail;
        expect(param.AllowedPattern).toBeDefined();
        expect(param.AllowedPattern).toContain('@');
      });

      test('should validate email pattern correctly', () => {
        const pattern = new RegExp(template.Parameters.NotificationEmail.AllowedPattern);
        expect(pattern.test('test@example.com')).toBe(true);
        expect(pattern.test('user.name@domain.co.uk')).toBe(true);
        expect(pattern.test('invalid-email')).toBe(false);
        expect(pattern.test('@example.com')).toBe(false);
      });
    });
  });

  describe('KMS Key Resources', () => {
    test('should have ComplianceKmsKey and Alias resources', () => {
      expect(template.Resources.ComplianceKmsKey).toBeDefined();
      const key = template.Resources.ComplianceKmsKey;
      expect(key.Type).toBe('AWS::KMS::Key');
      
      expect(template.Resources.ComplianceKmsKeyAlias).toBeDefined();
      const alias = template.Resources.ComplianceKmsKeyAlias;
      expect(alias.Type).toBe('AWS::KMS::Alias');
    });

    test('KMS key should be LocalStack compatible (no rotation, no Config)', () => {
      const key = template.Resources.ComplianceKmsKey;
      expect(key.Properties.EnableKeyRotation).toBeUndefined();
      
      const configStatement = key.Properties.KeyPolicy.Statement.find(
        (s: any) => s.Sid && s.Sid.includes('Config')
      );
      expect(configStatement).toBeUndefined();
    });

    test('KMS key should have proper policy with root and CloudWatch access', () => {
      const key = template.Resources.ComplianceKmsKey;
      expect(key.Properties.KeyPolicy).toBeDefined();
      expect(key.Properties.KeyPolicy.Statement.length).toBeGreaterThanOrEqual(2);
      
      const rootStatement = key.Properties.KeyPolicy.Statement.find(
        (s: any) => s.Sid === 'Enable IAM User Permissions'
      );
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Action).toBe('kms:*');
    });

    test('KMS alias should reference key and use EnvironmentSuffix', () => {
      const alias = template.Resources.ComplianceKmsKeyAlias;
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'ComplianceKmsKey' });
      expect(alias.Properties.AliasName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('S3 Bucket Resources', () => {
    test('should have ConfigBucket with encryption and versioning', () => {
      expect(template.Resources.ConfigBucket).toBeDefined();
      const bucket = template.Resources.ConfigBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.BucketKeyEnabled).toBeUndefined();
      
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('ConfigBucket should block all public access', () => {
      const bucket = template.Resources.ConfigBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('ConfigBucket should have lifecycle configuration without NoncurrentVersion', () => {
      const bucket = template.Resources.ConfigBucket;
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
      const rule = bucket.Properties.LifecycleConfiguration.Rules[0];
      expect(rule.Status).toBe('Enabled');
      expect(rule.ExpirationInDays).toBe(90);
      expect(rule.NoncurrentVersionExpirationInDays).toBeUndefined();
    });

    test('ConfigBucket name should use EnvironmentSuffix without AccountId', () => {
      const bucket = template.Resources.ConfigBucket;
      expect(bucket.Properties.BucketName['Fn::Sub']).not.toContain('${AWS::AccountId}');
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have ConfigBucketPolicy allowing Lambda (not Config)', () => {
      expect(template.Resources.ConfigBucketPolicy).toBeDefined();
      const policy = template.Resources.ConfigBucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.Bucket).toEqual({ Ref: 'ConfigBucket' });
      
      const statements = policy.Properties.PolicyDocument.Statement;
      const lambdaStatements = statements.filter((s: any) =>
        s.Principal && s.Principal.Service === 'lambda.amazonaws.com'
      );
      expect(lambdaStatements.length).toBeGreaterThan(0);
      
      const configStatement = statements.find((s: any) =>
        s.Principal && s.Principal.Service === 'config.amazonaws.com'
      );
      expect(configStatement).toBeUndefined();
    });

    test('ConfigBucketPolicy should deny unencrypted uploads', () => {
      const policy = template.Resources.ConfigBucketPolicy;
      const denyStatement = policy.Properties.PolicyDocument.Statement.find(
        (s: any) => s.Sid === 'DenyUnencryptedObjectUploads'
      );
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Effect).toBe('Deny');
    });
  });

  describe('SNS Topic Resources', () => {
    test('should have ComplianceNotificationTopic without KMS encryption', () => {
      expect(template.Resources.ComplianceNotificationTopic).toBeDefined();
      const topic = template.Resources.ComplianceNotificationTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.KmsMasterKeyId).toBeUndefined();
      expect(topic.Properties.DisplayName).toBe('Compliance Validation Notifications');
    });

    test('SNS topic should have email subscription with EnvironmentSuffix', () => {
      const topic = template.Resources.ComplianceNotificationTopic;
      expect(topic.Properties.Subscription).toBeDefined();
      const subscription = topic.Properties.Subscription[0];
      expect(subscription.Protocol).toBe('email');
      expect(subscription.Endpoint).toEqual({ Ref: 'NotificationEmail' });
      expect(topic.Properties.TopicName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have SNS TopicPolicy allowing Lambda (not Config)', () => {
      expect(template.Resources.ComplianceNotificationTopicPolicy).toBeDefined();
      const policy = template.Resources.ComplianceNotificationTopicPolicy;
      expect(policy.Type).toBe('AWS::SNS::TopicPolicy');
      
      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Principal.Service).toBe('lambda.amazonaws.com');
      
      const statements = policy.Properties.PolicyDocument.Statement;
      const configStatement = statements.find((s: any) =>
        s.Principal && s.Principal.Service === 'config.amazonaws.com'
      );
      expect(configStatement).toBeUndefined();
    });
  });

  describe('IAM Role Resources', () => {
    test('should NOT have ConfigRole (LocalStack - no AWS Config)', () => {
      expect(template.Resources.ConfigRole).toBeUndefined();
    });

    test('should have ComplianceLambdaRole with Lambda principal', () => {
      expect(template.Resources.ComplianceLambdaRole).toBeDefined();
      const role = template.Resources.ComplianceLambdaRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('ComplianceLambdaRole should have required inline policies', () => {
      const role = template.Resources.ComplianceLambdaRole;
      expect(role.Properties.Policies.length).toBeGreaterThanOrEqual(3);
      
      const loggingPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'LambdaLogging');
      expect(loggingPolicy).toBeDefined();
      
      const s3Policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3Access');
      expect(s3Policy).toBeDefined();
      
      const resourcePolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'ResourceAccess');
      expect(resourcePolicy).toBeDefined();
    });

    test('ComplianceLambdaRole should NOT have AWS Config managed policy', () => {
      const role = template.Resources.ComplianceLambdaRole;
      if (role.Properties.ManagedPolicyArns) {
        expect(role.Properties.ManagedPolicyArns).not.toContain(
          'arn:aws:iam::aws:policy/service-role/AWSConfigRulesExecutionRole'
        );
      }
    });
  });

  describe('AWS Config Resources (LocalStack Compatibility)', () => {
    test('should NOT have any AWS Config resources', () => {
      expect(template.Resources.ConfigRecorder).toBeUndefined();
      expect(template.Resources.ConfigDeliveryChannel).toBeUndefined();
      
      const configRules = Object.values(template.Resources).filter(
        (resource: any) => resource.Type === 'AWS::Config::ConfigRule'
      );
      expect(configRules.length).toBe(0);
    });

    test('should NOT have Config Rules (S3, RDS, EBS, Tags, VPC)', () => {
      expect(template.Resources.S3BucketEncryptionRule).toBeUndefined();
      expect(template.Resources.CustomComplianceRule).toBeUndefined();
      expect(template.Resources.RDSEncryptionRule).toBeUndefined();
      expect(template.Resources.EBSEncryptionRule).toBeUndefined();
      expect(template.Resources.RequiredTagsRule).toBeUndefined();
      expect(template.Resources.VPCFlowLogsRule).toBeUndefined();
      expect(template.Resources.S3BucketPublicAccessRule).toBeUndefined();
    });
  });

  describe('Lambda Function Resources', () => {
    test('should have CustomComplianceValidatorFunction with Python 3.11', () => {
      expect(template.Resources.CustomComplianceValidatorFunction).toBeDefined();
      const lambda = template.Resources.CustomComplianceValidatorFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.11');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
    });

    test('Lambda function should have inline code without Config dependencies', () => {
      const lambda = template.Resources.CustomComplianceValidatorFunction;
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toContain('def lambda_handler');
      expect(lambda.Properties.Code.ZipFile).not.toContain('config.put_evaluations');
      expect(lambda.Properties.Code.ZipFile).toContain('boto3.client');
    });

    test('Lambda function should have required environment variables', () => {
      const lambda = template.Resources.CustomComplianceValidatorFunction;
      const vars = lambda.Properties.Environment.Variables;
      expect(vars.SNS_TOPIC_ARN).toEqual({ Ref: 'ComplianceNotificationTopic' });
      expect(vars.CONFIG_BUCKET).toEqual({ Ref: 'ConfigBucket' });
      expect(vars.ENVIRONMENT_SUFFIX).toBeDefined();
    });

    test('Lambda function should have proper configuration', () => {
      const lambda = template.Resources.CustomComplianceValidatorFunction;
      expect(lambda.Properties.Timeout).toBe(300);
      expect(lambda.Properties.MemorySize).toBe(512);
      expect(lambda.Properties.Role['Fn::GetAtt'][0]).toBe('ComplianceLambdaRole');
    });

    test('should have EventBridge permission (not Config permission)', () => {
      expect(template.Resources.ComplianceLambdaEventPermission).toBeDefined();
      const permission = template.Resources.ComplianceLambdaEventPermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
      
      const configPermission = template.Resources.ComplianceLambdaPermission;
      if (configPermission) {
        expect(configPermission.Properties.Principal).not.toBe('config.amazonaws.com');
      }
    });

    test('Lambda code should have standalone compliance checking', () => {
      const lambda = template.Resources.CustomComplianceValidatorFunction;
      expect(lambda.Properties.Code.ZipFile).toContain('evaluate_s3_buckets');
      expect(lambda.Properties.Code.ZipFile).toContain('evaluate_security_groups');
      expect(lambda.Properties.Code.ZipFile).toContain('evaluate_ec2_instances');
    });
  });

  describe('EventBridge Resources (LocalStack Compatible)', () => {
    test('should have ComplianceScheduleRule running every 30 minutes', () => {
      expect(template.Resources.ComplianceScheduleRule).toBeDefined();
      const rule = template.Resources.ComplianceScheduleRule;
      expect(rule.Type).toBe('AWS::Events::Rule');
      expect(rule.Properties.ScheduleExpression).toBe('rate(30 minutes)');
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('EventBridge rule should target Lambda function with input', () => {
      const rule = template.Resources.ComplianceScheduleRule;
      expect(rule.Properties.Targets).toBeDefined();
      const target = rule.Properties.Targets[0];
      expect(target.Arn['Fn::GetAtt'][0]).toBe('CustomComplianceValidatorFunction');
      expect(target.Input).toBeDefined();
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have ComplianceLambdaLogGroup without KMS encryption', () => {
      expect(template.Resources.ComplianceLambdaLogGroup).toBeDefined();
      const logGroup = template.Resources.ComplianceLambdaLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(14);
      expect(logGroup.Properties.KmsKeyId).toBeUndefined();
    });

    test('should have NonCompliantResourcesAlarm with custom namespace', () => {
      expect(template.Resources.NonCompliantResourcesAlarm).toBeDefined();
      const alarm = template.Resources.NonCompliantResourcesAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.Namespace).toBe('ComplianceValidation');
      expect(alarm.Properties.MetricName).toBe('NonCompliantResources');
      expect(alarm.Properties.Threshold).toBe(1);
      expect(alarm.Properties.AlarmActions[0]).toEqual({ Ref: 'ComplianceNotificationTopic' });
    });

    test('should NOT have ConfigRecorderFailureAlarm (LocalStack)', () => {
      expect(template.Resources.ConfigRecorderFailureAlarm).toBeUndefined();
    });
  });

  describe('Resource Naming Convention', () => {
    test('all named resources should use EnvironmentSuffix', () => {
      const resourcesWithNames = [
        'ComplianceLambdaRole',
        'CustomComplianceValidatorFunction',
        'ComplianceScheduleRule',
        'ComplianceNotificationTopic',
        'NonCompliantResourcesAlarm',
        'ComplianceKmsKeyAlias'
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties) {
          const nameProperty =
            resource.Properties.RoleName ||
            resource.Properties.FunctionName ||
            resource.Properties.Name ||
            resource.Properties.TopicName ||
            resource.Properties.AlarmName ||
            resource.Properties.AliasName;

          if (nameProperty && nameProperty['Fn::Sub']) {
            expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });

    test('S3 bucket name should use EnvironmentSuffix without AccountId', () => {
      const bucket = template.Resources.ConfigBucket;
      expect(bucket.Properties.BucketName['Fn::Sub']).not.toContain('${AWS::AccountId}');
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Security Best Practices', () => {
    test('IAM role should have tags and no wildcard resource permissions', () => {
      const role = template.Resources.ComplianceLambdaRole;
      expect(role.Properties.Tags).toBeDefined();
      
      role.Properties.Policies.forEach((policy: any) => {
        policy.PolicyDocument.Statement.forEach((statement: any) => {
          if (statement.Action && Array.isArray(statement.Action)) {
            statement.Action.forEach((action: string) => {
              if (action.includes('*') && !action.includes('Describe') && !action.includes('Get') && !action.includes('List')) {
                if (statement.Resource === '*') {
                  fail(`Policy ${policy.PolicyName} has dangerous wildcard: ${action} on *`);
                }
              }
            });
          }
        });
      });
    });

    test('S3 bucket should have complete security configuration', () => {
      const bucket = template.Resources.ConfigBucket;
      const policy = template.Resources.ConfigBucketPolicy;
      
      // Encryption
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      
      // Public access blocking
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      
      // Deny unencrypted uploads
      const denyStatement = policy.Properties.PolicyDocument.Statement.find(
        (s: any) => s.Sid === 'DenyUnencryptedObjectUploads'
      );
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Effect).toBe('Deny');
    });
  });

  describe('Outputs', () => {
    test('should have all 7 required outputs with exports', () => {
      const expectedOutputs = [
        'ConfigBucketName',
        'ComplianceNotificationTopicArn',
        'CustomComplianceFunctionArn',
        'CustomComplianceFunctionName',
        'KmsKeyId',
        'KmsKeyArn',
        'ComplianceScheduleRuleArn'
      ];

      expect(Object.keys(template.Outputs).length).toBe(7);
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Export).toBeDefined();
      });
    });

    test('outputs should have correct values and references', () => {
      expect(template.Outputs.ConfigBucketName.Value).toEqual({ Ref: 'ConfigBucket' });
      expect(template.Outputs.ComplianceNotificationTopicArn.Value).toEqual({ Ref: 'ComplianceNotificationTopic' });
      expect(template.Outputs.CustomComplianceFunctionArn.Value['Fn::GetAtt'][0]).toBe('CustomComplianceValidatorFunction');
      expect(template.Outputs.CustomComplianceFunctionName.Value).toEqual({ Ref: 'CustomComplianceValidatorFunction' });
      expect(template.Outputs.KmsKeyId.Value).toEqual({ Ref: 'ComplianceKmsKey' });
      expect(template.Outputs.KmsKeyArn.Value['Fn::GetAtt'][0]).toBe('ComplianceKmsKey');
      expect(template.Outputs.ComplianceScheduleRuleArn.Value['Fn::GetAtt'][0]).toBe('ComplianceScheduleRule');
    });

    test('should NOT have Config-related outputs', () => {
      expect(template.Outputs.ConfigRecorderName).toBeUndefined();
      expect(template.Outputs.ComplianceRuleNames).toBeUndefined();
    });

    test('all output exports should use stack name', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid structure with all sections', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have only LocalStack-compatible resource types', () => {
      const localstackCompatibleTypes = [
        'AWS::KMS::Key',
        'AWS::KMS::Alias',
        'AWS::S3::Bucket',
        'AWS::S3::BucketPolicy',
        'AWS::SNS::Topic',
        'AWS::SNS::TopicPolicy',
        'AWS::IAM::Role',
        'AWS::Lambda::Function',
        'AWS::Lambda::Permission',
        'AWS::CloudWatch::Alarm',
        'AWS::Logs::LogGroup',
        'AWS::Events::Rule'
      ];

      Object.values(template.Resources).forEach((resource: any) => {
        expect(localstackCompatibleTypes).toContain(resource.Type);
      });
    });

    test('should NOT have AWS Config resource types', () => {
      const configResourceTypes = [
        'AWS::Config::ConfigurationRecorder',
        'AWS::Config::DeliveryChannel',
        'AWS::Config::ConfigRule'
      ];

      Object.values(template.Resources).forEach((resource: any) => {
        expect(configResourceTypes).not.toContain(resource.Type);
      });
    });

    test('should have correct resource counts', () => {
      expect(Object.keys(template.Resources).length).toBe(12);
      
      const resourceCounts = {
        'AWS::Lambda::Function': 1,
        'AWS::Events::Rule': 1,
        'AWS::S3::Bucket': 1,
        'AWS::SNS::Topic': 1,
        'AWS::KMS::Key': 1,
        'AWS::IAM::Role': 1,
        'AWS::Config::ConfigRule': 0
      };

      Object.entries(resourceCounts).forEach(([type, expectedCount]) => {
        const actualCount = Object.values(template.Resources).filter(
          (resource: any) => resource.Type === type
        ).length;
        expect(actualCount).toBe(expectedCount);
      });
    });

    test('all resource references should be valid', () => {
      const resourceNames = Object.keys(template.Resources);
      
      Object.values(template.Resources).forEach((resource: any) => {
        const resourceStr = JSON.stringify(resource);
        const refMatches = resourceStr.match(/"Ref":"([^"]+)"/g);
        if (refMatches) {
          refMatches.forEach(match => {
            const refName = match.match(/"Ref":"([^"]+)"/)?.[1];
            if (refName && !refName.startsWith('AWS::')) {
              expect(resourceNames.concat(Object.keys(template.Parameters))).toContain(refName);
            }
          });
        }
      });
    });
  });

  describe('LocalStack Compatibility Verification', () => {
    test('template should be clearly marked as LocalStack compatible', () => {
      expect(template.Description).toContain('LocalStack');
    });

    test('should not use any AWS Config services', () => {
      const templateStr = JSON.stringify(template.Resources);
      expect(templateStr).not.toContain('config.amazonaws.com');
      expect(templateStr).not.toContain('ConfigurationRecorder');
      expect(templateStr).not.toContain('DeliveryChannel');
    });

    test('should use EventBridge for scheduling and have standalone logic', () => {
      expect(template.Resources.ComplianceScheduleRule).toBeDefined();
      expect(template.Resources.ComplianceScheduleRule.Type).toBe('AWS::Events::Rule');
      
      const lambda = template.Resources.CustomComplianceValidatorFunction;
      expect(lambda.Properties.Code.ZipFile).not.toContain('config.put_evaluations');
      expect(lambda.Properties.Code.ZipFile).toContain('evaluate_s3_buckets');
      expect(lambda.Properties.Code.ZipFile).toContain('evaluate_security_groups');
      expect(lambda.Properties.Code.ZipFile).toContain('evaluate_ec2_instances');
    });
  });
});
