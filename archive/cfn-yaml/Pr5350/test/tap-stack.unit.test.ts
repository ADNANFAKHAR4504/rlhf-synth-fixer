import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Compliance Infrastructure', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
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

    test('should not have undefined or null required sections', () => {
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
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toBeDefined();
      expect(param.AllowedPattern).toBeDefined();
      expect(param.ConstraintDescription).toBeDefined();
    });

    test('should have NotificationEmail parameter', () => {
      expect(template.Parameters.NotificationEmail).toBeDefined();
    });

    test('NotificationEmail parameter should have correct properties', () => {
      const param = template.Parameters.NotificationEmail;
      expect(param.Type).toBe('String');
      expect(param.Default).toBeDefined();
      expect(param.Description).toBeDefined();
      expect(param.AllowedPattern).toBeDefined();
    });

    test('parameters should have default values', () => {
      Object.keys(template.Parameters).forEach(paramName => {
        const param = template.Parameters[paramName];
        expect(param.Default).toBeDefined();
      });
    });

    test('should have exactly 2 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });
  });

  describe('KMS Key', () => {
    const kmsKey = () => template.Resources.ComplianceKMSKey;

    test('should exist and be of correct type', () => {
      expect(kmsKey()).toBeDefined();
      expect(kmsKey().Type).toBe('AWS::KMS::Key');
    });

    test('should have deletion policy set to Delete', () => {
      expect(kmsKey().DeletionPolicy).toBe('Delete');
      expect(kmsKey().UpdateReplacePolicy).toBe('Delete');
    });

    test('should have key rotation enabled', () => {
      expect(kmsKey().Properties.EnableKeyRotation).toBe(true);
    });

    test('should have description with EnvironmentSuffix', () => {
      expect(kmsKey().Properties.Description).toBeDefined();
      expect(kmsKey().Properties.Description['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have required tags', () => {
      const tags = kmsKey().Properties.Tags;
      expect(tags).toBeDefined();
      const projectTag = tags.find((t: any) => t.Key === 'project');
      const teamTag = tags.find((t: any) => t.Key === 'team-number');
      expect(projectTag).toBeDefined();
      expect(projectTag.Value).toBe('iac-rlhf-amazon');
      expect(teamTag).toBeDefined();
      expect(teamTag.Value).toBe(2);
    });

    test('should have key policy defined', () => {
      expect(kmsKey().Properties.KeyPolicy).toBeDefined();
      expect(kmsKey().Properties.KeyPolicy.Statement).toBeDefined();
    });

    test('should have key alias', () => {
      const alias = template.Resources.ComplianceKMSKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
    });

    test('key policy should allow root account access', () => {
      const statements = kmsKey().Properties.KeyPolicy.Statement;
      const rootStatement = statements.find((s: any) =>
        s.Sid === 'Enable IAM User Permissions'
      );
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');
    });
  });

  describe('S3 Buckets', () => {
    test('should have ComplianceLogBucket', () => {
      const bucket = template.Resources.ComplianceLogBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('ComplianceLogBucket should have deletion policy set to Delete', () => {
      const bucket = template.Resources.ComplianceLogBucket;
      expect(bucket.DeletionPolicy).toBe('Delete');
      expect(bucket.UpdateReplacePolicy).toBe('Delete');
    });

    test('ComplianceLogBucket should have KMS encryption', () => {
      const bucket = template.Resources.ComplianceLogBucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'ComplianceKMSKey' });
    });

    test('ComplianceLogBucket should block all public access', () => {
      const bucket = template.Resources.ComplianceLogBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('ComplianceLogBucket should have versioning enabled', () => {
      const bucket = template.Resources.ComplianceLogBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have ComplianceTemplateBucket', () => {
      const bucket = template.Resources.ComplianceTemplateBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('both S3 buckets should have required tags', () => {
      const buckets = ['ComplianceLogBucket', 'ComplianceTemplateBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const tags = bucket.Properties.Tags;
        const projectTag = tags.find((t: any) => t.Key === 'project');
        const teamTag = tags.find((t: any) => t.Key === 'team-number');
        expect(projectTag).toBeDefined();
        expect(projectTag.Value).toBe('iac-rlhf-amazon');
        expect(teamTag).toBeDefined();
        expect(teamTag.Value).toBe(2);
      });
    });

    test('S3 buckets should use EnvironmentSuffix in naming', () => {
      const logBucket = template.Resources.ComplianceLogBucket;
      const templateBucket = template.Resources.ComplianceTemplateBucket;
      expect(logBucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(templateBucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('S3 Bucket Policies', () => {
    test('should have ComplianceLogBucketPolicy', () => {
      const policy = template.Resources.ComplianceLogBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('ComplianceLogBucketPolicy should reference ComplianceLogBucket', () => {
      const policy = template.Resources.ComplianceLogBucketPolicy;
      expect(policy.Properties.Bucket).toEqual({ Ref: 'ComplianceLogBucket' });
    });

    test('ComplianceLogBucketPolicy should deny insecure transport', () => {
      const policy = template.Resources.ComplianceLogBucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      const denyStatement = statements.find((s: any) => s.Sid === 'DenyInsecureTransport');
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Effect).toBe('Deny');
      expect(denyStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
    });

    test('ComplianceLogBucketPolicy should allow AWS Config service access', () => {
      const policy = template.Resources.ComplianceLogBucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      const configStatements = statements.filter((s: any) =>
        s.Principal && s.Principal.Service === 'config.amazonaws.com'
      );
      expect(configStatements.length).toBeGreaterThan(0);
    });

    test('should have ComplianceTemplateBucketPolicy', () => {
      const policy = template.Resources.ComplianceTemplateBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('DynamoDB Table', () => {
    const table = () => template.Resources.ComplianceViolationsTable;

    test('should exist and be of correct type', () => {
      expect(table()).toBeDefined();
      expect(table().Type).toBe('AWS::DynamoDB::Table');
    });

    test('should have deletion policy set to Delete', () => {
      expect(table().DeletionPolicy).toBe('Delete');
      expect(table().UpdateReplacePolicy).toBe('Delete');
    });

    test('should use PAY_PER_REQUEST billing mode', () => {
      expect(table().Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should have KMS encryption enabled', () => {
      const sseSpec = table().Properties.SSESpecification;
      expect(sseSpec.SSEEnabled).toBe(true);
      expect(sseSpec.SSEType).toBe('KMS');
      expect(sseSpec.KMSMasterKeyId).toEqual({ Ref: 'ComplianceKMSKey' });
    });

    test('should have streams enabled', () => {
      expect(table().Properties.StreamSpecification).toBeDefined();
      expect(table().Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('should have TTL enabled', () => {
      const ttl = table().Properties.TimeToLiveSpecification;
      expect(ttl.Enabled).toBe(true);
      expect(ttl.AttributeName).toBe('TTL');
    });

    test('should have required tags', () => {
      const tags = table().Properties.Tags;
      const projectTag = tags.find((t: any) => t.Key === 'project');
      const teamTag = tags.find((t: any) => t.Key === 'team-number');
      expect(projectTag).toBeDefined();
      expect(projectTag.Value).toBe('iac-rlhf-amazon');
      expect(teamTag).toBeDefined();
      expect(teamTag.Value).toBe(2);
    });

    test('should use EnvironmentSuffix in table name', () => {
      expect(table().Properties.TableName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have correct attribute definitions', () => {
      const attrs = table().Properties.AttributeDefinitions;
      expect(attrs).toBeDefined();
      expect(Array.isArray(attrs)).toBe(true);
    });

    test('should have correct key schema', () => {
      const keySchema = table().Properties.KeySchema;
      expect(keySchema).toBeDefined();
      expect(Array.isArray(keySchema)).toBe(true);
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should have ComplianceLambdaLogGroup', () => {
      const logGroup = template.Resources.ComplianceLambdaLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('ComplianceLambdaLogGroup should have deletion policy set to Delete', () => {
      const logGroup = template.Resources.ComplianceLambdaLogGroup;
      expect(logGroup.DeletionPolicy).toBe('Delete');
      expect(logGroup.UpdateReplacePolicy).toBe('Delete');
    });

    test('ComplianceLambdaLogGroup should have correct properties', () => {
      const logGroup = template.Resources.ComplianceLambdaLogGroup;
      expect(logGroup.Properties).toBeDefined();
      expect(logGroup.Properties.LogGroupName).toBeDefined();
    });

    test('ComplianceLambdaLogGroup should have retention period', () => {
      const logGroup = template.Resources.ComplianceLambdaLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBeDefined();
      expect(typeof logGroup.Properties.RetentionInDays).toBe('number');
    });

    test('should have ComplianceConfigLogGroup', () => {
      const logGroup = template.Resources.ComplianceConfigLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('log groups should have required tags', () => {
      const logGroups = ['ComplianceLambdaLogGroup', 'ComplianceConfigLogGroup'];
      logGroups.forEach(logGroupName => {
        const logGroup = template.Resources[logGroupName];
        const tags = logGroup.Properties.Tags;
        const projectTag = tags.find((t: any) => t.Key === 'project');
        const teamTag = tags.find((t: any) => t.Key === 'team-number');
        expect(projectTag).toBeDefined();
        expect(projectTag.Value).toBe('iac-rlhf-amazon');
        expect(teamTag).toBeDefined();
        expect(teamTag.Value).toBe(2);
      });
    });
  });

  describe('SNS Topic', () => {
    const topic = () => template.Resources.ComplianceNotificationTopic;

    test('should exist and be of correct type', () => {
      expect(topic()).toBeDefined();
      expect(topic().Type).toBe('AWS::SNS::Topic');
    });

    test('should have KMS encryption', () => {
      expect(topic().Properties.KmsMasterKeyId).toEqual({ Ref: 'ComplianceKMSKey' });
    });

    test('should have subscription with NotificationEmail parameter', () => {
      const subscriptions = topic().Properties.Subscription;
      expect(subscriptions).toBeDefined();
      expect(Array.isArray(subscriptions)).toBe(true);
      expect(subscriptions.length).toBeGreaterThan(0);
      expect(subscriptions[0].Endpoint).toEqual({ Ref: 'NotificationEmail' });
    });

    test('should have required tags', () => {
      const tags = topic().Properties.Tags;
      const projectTag = tags.find((t: any) => t.Key === 'project');
      const teamTag = tags.find((t: any) => t.Key === 'team-number');
      expect(projectTag).toBeDefined();
      expect(projectTag.Value).toBe('iac-rlhf-amazon');
      expect(teamTag).toBeDefined();
      expect(teamTag.Value).toBe(2);
    });

    test('should use EnvironmentSuffix in topic name', () => {
      expect(topic().Properties.TopicName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have display name', () => {
      expect(topic().Properties.DisplayName).toBeDefined();
    });

    test('should have SNS topic policy', () => {
      const policy = template.Resources.ComplianceNotificationTopicPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::SNS::TopicPolicy');
    });

    test('SNS topic policy should have policy document', () => {
      const policy = template.Resources.ComplianceNotificationTopicPolicy;
      expect(policy.Properties.PolicyDocument).toBeDefined();
      expect(policy.Properties.PolicyDocument.Statement).toBeDefined();
      expect(Array.isArray(policy.Properties.PolicyDocument.Statement)).toBe(true);
    });
  });

  describe('IAM Roles', () => {
    test('should have ComplianceLambdaRole', () => {
      const role = template.Resources.ComplianceLambdaRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('ComplianceLambdaRole should have correct trust policy', () => {
      const role = template.Resources.ComplianceLambdaRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Effect).toBe('Allow');
      expect(trustPolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should have ConfigServiceRole', () => {
      const role = template.Resources.ConfigServiceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('ConfigServiceRole should use correct managed policy', () => {
      const role = template.Resources.ConfigServiceRole;
      const managedPolicies = role.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/service-role/AWS_ConfigRole');
    });

    test('ConfigServiceRole should have correct trust policy', () => {
      const role = template.Resources.ConfigServiceRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Effect).toBe('Allow');
      expect(trustPolicy.Statement[0].Principal.Service).toBe('config.amazonaws.com');
    });

    test('IAM roles should have required tags', () => {
      const roles = ['ComplianceLambdaRole', 'ConfigServiceRole'];
      roles.forEach(roleName => {
        const role = template.Resources[roleName];
        const tags = role.Properties.Tags;
        const projectTag = tags.find((t: any) => t.Key === 'project');
        const teamTag = tags.find((t: any) => t.Key === 'team-number');
        expect(projectTag).toBeDefined();
        expect(projectTag.Value).toBe('iac-rlhf-amazon');
        expect(teamTag).toBeDefined();
        expect(teamTag.Value).toBe(2);
      });
    });
  });

  describe('IAM Policies - Least Privilege', () => {
    test('ComplianceLambdaRole should have scoped permissions', () => {
      const role = template.Resources.ComplianceLambdaRole;
      const policies = role.Properties.Policies;
      expect(policies).toBeDefined();
      expect(Array.isArray(policies)).toBe(true);
    });

    test('ComplianceLambdaRole should have CloudWatch Logs permissions', () => {
      const role = template.Resources.ComplianceLambdaRole;
      const policies = role.Properties.Policies;
      const logsPolicy = policies.find((p: any) =>
        p.PolicyDocument.Statement.some((s: any) =>
          s.Action && s.Action.some && s.Action.some((a: string) => a.includes('logs:'))
        )
      );
      expect(logsPolicy).toBeDefined();
    });

    test('ComplianceLambdaRole should have DynamoDB permissions scoped to specific table', () => {
      const role = template.Resources.ComplianceLambdaRole;
      const policies = role.Properties.Policies;
      const dynamoPolicy = policies.find((p: any) =>
        p.PolicyDocument.Statement.some((s: any) =>
          s.Action && s.Action.some && s.Action.some((a: string) => a.includes('dynamodb:'))
        )
      );
      expect(dynamoPolicy).toBeDefined();
      if (dynamoPolicy) {
        const dynamoStatement = dynamoPolicy.PolicyDocument.Statement.find((s: any) =>
          s.Action && s.Action.some && s.Action.some((a: string) => a.includes('dynamodb:'))
        );
        expect(dynamoStatement.Resource).toBeDefined();
        // Resource can be an array of specific resources
        if (Array.isArray(dynamoStatement.Resource)) {
          expect(dynamoStatement.Resource.length).toBeGreaterThan(0);
          // Should reference specific table (can be Fn::GetAtt, Fn::Sub, or Ref)
          const firstResource = dynamoStatement.Resource[0];
          const hasSpecificResource = firstResource['Fn::GetAtt'] || firstResource['Fn::Sub'] || firstResource['Ref'];
          expect(hasSpecificResource).toBeDefined();
        } else {
          // Single resource reference
          const hasSpecificResource = dynamoStatement.Resource['Fn::GetAtt'] || dynamoStatement.Resource['Fn::Sub'] || dynamoStatement.Resource['Ref'];
          expect(hasSpecificResource).toBeDefined();
        }
      }
    });

    test('ConfigServiceRole should have scoped S3 permissions', () => {
      const role = template.Resources.ConfigServiceRole;
      const policies = role.Properties.Policies;
      expect(policies).toBeDefined();
      const s3Statements = policies[0].PolicyDocument.Statement.filter((s: any) =>
        s.Action && s.Action.some && s.Action.some((a: string) => a.includes('s3:'))
      );
      expect(s3Statements.length).toBeGreaterThan(0);
      // Should have separate statements for bucket and object permissions
      s3Statements.forEach((stmt: any) => {
        expect(stmt.Resource).toBeDefined();
      });
    });

    test('ConfigServiceRole should have KMS permissions scoped to specific key', () => {
      const role = template.Resources.ConfigServiceRole;
      const policies = role.Properties.Policies;
      const kmsStatement = policies[0].PolicyDocument.Statement.find((s: any) =>
        s.Action && s.Action.some && s.Action.some((a: string) => a.includes('kms:'))
      );
      expect(kmsStatement).toBeDefined();
      expect(kmsStatement.Resource).toBeDefined();
      expect(kmsStatement.Resource['Fn::GetAtt']).toBeDefined();
    });

    test('ConfigServiceRole should have SNS permissions scoped to specific topic', () => {
      const role = template.Resources.ConfigServiceRole;
      const policies = role.Properties.Policies;
      const snsStatement = policies[0].PolicyDocument.Statement.find((s: any) =>
        s.Action && s.Action.includes && s.Action.includes('sns:Publish')
      );
      expect(snsStatement).toBeDefined();
      expect(snsStatement.Resource).toEqual({ Ref: 'ComplianceNotificationTopic' });
    });

    test('IAM policies should not use wildcards for resources except where necessary', () => {
      const roles = ['ComplianceLambdaRole', 'ConfigServiceRole'];
      roles.forEach(roleName => {
        const role = template.Resources[roleName];
        const policies = role.Properties.Policies;
        policies.forEach((policy: any) => {
          policy.PolicyDocument.Statement.forEach((statement: any) => {
            if (statement.Resource === '*') {
              // Wildcard should only be used for specific actions that require it
              const allowedWildcardActions = [
                'cloudformation:ValidateTemplate',
                'logs:CreateLogGroup',
                'logs:CreateLogStream'
              ];
              const hasAllowedAction = statement.Action.some((action: string) =>
                allowedWildcardActions.some(allowed => action === allowed)
              );
              expect(hasAllowedAction).toBe(true);
            }
          });
        });
      });
    });

    test('all IAM statements should have explicit Effect', () => {
      const roles = ['ComplianceLambdaRole', 'ConfigServiceRole'];
      roles.forEach(roleName => {
        const role = template.Resources[roleName];
        const policies = role.Properties.Policies;
        policies.forEach((policy: any) => {
          policy.PolicyDocument.Statement.forEach((statement: any) => {
            expect(statement.Effect).toBeDefined();
            expect(['Allow', 'Deny']).toContain(statement.Effect);
          });
        });
      });
    });

    test('all IAM statements should have Sid for traceability', () => {
      const roles = ['ComplianceLambdaRole', 'ConfigServiceRole'];
      roles.forEach(roleName => {
        const role = template.Resources[roleName];
        const policies = role.Properties.Policies;
        policies.forEach((policy: any) => {
          policy.PolicyDocument.Statement.forEach((statement: any) => {
            expect(statement.Sid).toBeDefined();
            expect(typeof statement.Sid).toBe('string');
          });
        });
      });
    });
  });

  describe('Lambda Function', () => {
    const lambda = () => template.Resources.ComplianceScannerFunction;

    test('should exist and be of correct type', () => {
      expect(lambda()).toBeDefined();
      expect(lambda().Type).toBe('AWS::Lambda::Function');
    });

    test('should have correct runtime', () => {
      expect(lambda().Properties.Runtime).toBe('python3.11');
    });

    test('should reference ComplianceLambdaRole', () => {
      expect(lambda().Properties.Role).toEqual({ 'Fn::GetAtt': ['ComplianceLambdaRole', 'Arn'] });
    });

    test('should have handler defined', () => {
      expect(lambda().Properties.Handler).toBe('index.lambda_handler');
    });

    test('should have timeout configured', () => {
      expect(lambda().Properties.Timeout).toBeDefined();
      expect(typeof lambda().Properties.Timeout).toBe('number');
    });

    test('should have memory size configured', () => {
      expect(lambda().Properties.MemorySize).toBeDefined();
      expect(typeof lambda().Properties.MemorySize).toBe('number');
    });

    test('should have environment variables', () => {
      const envVars = lambda().Properties.Environment.Variables;
      expect(envVars).toBeDefined();
      expect(envVars.VIOLATIONS_TABLE).toEqual({ Ref: 'ComplianceViolationsTable' });
      expect(envVars.SNS_TOPIC_ARN).toEqual({ Ref: 'ComplianceNotificationTopic' });
      expect(envVars.ENVIRONMENT_SUFFIX).toBeDefined();
      expect(envVars.PARAMETER_PREFIX).toBeDefined();
    });

    test('should have inline code', () => {
      expect(lambda().Properties.Code.ZipFile).toBeDefined();
      expect(typeof lambda().Properties.Code.ZipFile).toBe('string');
    });

    test('should have required tags', () => {
      const tags = lambda().Properties.Tags;
      const projectTag = tags.find((t: any) => t.Key === 'project');
      const teamTag = tags.find((t: any) => t.Key === 'team-number');
      expect(projectTag).toBeDefined();
      expect(projectTag.Value).toBe('iac-rlhf-amazon');
      expect(teamTag).toBeDefined();
      expect(teamTag.Value).toBe(2);
    });

    test('should use EnvironmentSuffix in function name', () => {
      expect(lambda().Properties.FunctionName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have function name with EnvironmentSuffix', () => {
      expect(lambda().Properties.FunctionName).toBeDefined();
      expect(lambda().Properties.FunctionName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('AWS Config', () => {
    test('should have ConfigurationRecorder', () => {
      const recorder = template.Resources.ConfigurationRecorder;
      expect(recorder).toBeDefined();
      expect(recorder.Type).toBe('AWS::Config::ConfigurationRecorder');
    });

    test('ConfigurationRecorder should reference ConfigServiceRole', () => {
      const recorder = template.Resources.ConfigurationRecorder;
      expect(recorder.Properties.RoleARN).toEqual({ 'Fn::GetAtt': ['ConfigServiceRole', 'Arn'] });
    });

    test('ConfigurationRecorder should record all resources', () => {
      const recorder = template.Resources.ConfigurationRecorder;
      expect(recorder.Properties.RecordingGroup.AllSupported).toBe(true);
    });

    test('ConfigurationRecorder should include global resources', () => {
      const recorder = template.Resources.ConfigurationRecorder;
      expect(recorder.Properties.RecordingGroup.IncludeGlobalResourceTypes).toBe(true);
    });

    test('ConfigurationRecorder should use EnvironmentSuffix in name', () => {
      const recorder = template.Resources.ConfigurationRecorder;
      expect(recorder.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have DeliveryChannel', () => {
      const channel = template.Resources.DeliveryChannel;
      expect(channel).toBeDefined();
      expect(channel.Type).toBe('AWS::Config::DeliveryChannel');
    });

    test('DeliveryChannel should reference ComplianceLogBucket', () => {
      const channel = template.Resources.DeliveryChannel;
      expect(channel.Properties.S3BucketName).toEqual({ Ref: 'ComplianceLogBucket' });
    });

    test('DeliveryChannel should have S3KeyPrefix without trailing slash', () => {
      const channel = template.Resources.DeliveryChannel;
      expect(channel.Properties.S3KeyPrefix).toBe('config-logs');
      expect(channel.Properties.S3KeyPrefix).not.toMatch(/\/$/);
    });

    test('DeliveryChannel should reference SNS topic', () => {
      const channel = template.Resources.DeliveryChannel;
      expect(channel.Properties.SnsTopicARN).toEqual({ Ref: 'ComplianceNotificationTopic' });
    });

    test('ConfigurationRecorder should not have explicit DependsOn', () => {
      const recorder = template.Resources.ConfigurationRecorder;
      expect(recorder.DependsOn).toBeUndefined();
    });

    test('DeliveryChannel should not have explicit DependsOn', () => {
      const channel = template.Resources.DeliveryChannel;
      expect(channel.DependsOn).toBeUndefined();
    });
  });

  describe('AWS Config Rules', () => {
    test('should have S3BucketEncryptionRule', () => {
      const rule = template.Resources.S3BucketEncryptionRule;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Config::ConfigRule');
    });

    test('S3BucketEncryptionRule should depend on Config resources', () => {
      const rule = template.Resources.S3BucketEncryptionRule;
      expect(rule.DependsOn).toBeDefined();
      expect(rule.DependsOn).toContain('ConfigurationRecorder');
      expect(rule.DependsOn).toContain('DeliveryChannel');
    });

    test('should have RequiredTagsRule', () => {
      const rule = template.Resources.RequiredTagsRule;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Config::ConfigRule');
    });

    test('RequiredTagsRule should check for project and team-number tags', () => {
      const rule = template.Resources.RequiredTagsRule;
      const inputParams = JSON.parse(rule.Properties.InputParameters);
      expect(inputParams.tag1Key).toBe('project');
      expect(inputParams.tag2Key).toBe('team-number');
    });

    test('should have IAMPolicyNoWildcardRule', () => {
      const rule = template.Resources.IAMPolicyNoWildcardRule;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Config::ConfigRule');
    });

    test('should have S3PublicAccessBlockRule', () => {
      const rule = template.Resources.S3PublicAccessBlockRule;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Config::ConfigRule');
    });

    test('all config rules should use EnvironmentSuffix in naming', () => {
      const rules = ['S3BucketEncryptionRule', 'RequiredTagsRule', 'IAMPolicyNoWildcardRule', 'S3PublicAccessBlockRule'];
      rules.forEach(ruleName => {
        const rule = template.Resources[ruleName];
        expect(rule.Properties.ConfigRuleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have HighViolationCountAlarm', () => {
      const alarm = template.Resources.HighViolationCountAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('HighViolationCountAlarm should notify SNS topic', () => {
      const alarm = template.Resources.HighViolationCountAlarm;
      expect(alarm.Properties.AlarmActions).toContainEqual({ Ref: 'ComplianceNotificationTopic' });
    });

    test('should have LambdaErrorAlarm', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have DynamoDBThrottleAlarm', () => {
      const alarm = template.Resources.DynamoDBThrottleAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('all alarms should use EnvironmentSuffix in naming', () => {
      const alarms = ['HighViolationCountAlarm', 'LambdaErrorAlarm', 'DynamoDBThrottleAlarm'];
      alarms.forEach(alarmName => {
        const alarm = template.Resources[alarmName];
        expect(alarm.Properties.AlarmName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });
  });

  describe('SSM Parameters', () => {
    test('should have S3EncryptionRuleParameter', () => {
      const param = template.Resources.S3EncryptionRuleParameter;
      expect(param).toBeDefined();
      expect(param.Type).toBe('AWS::SSM::Parameter');
    });

    test('SSM parameters should use EnvironmentSuffix in naming', () => {
      const params = ['S3EncryptionRuleParameter', 'ComplianceRulesParameter',
                      'IAMWildcardRuleParameter', 'PublicAccessRuleParameter'];
      params.forEach(paramName => {
        const param = template.Resources[paramName];
        expect(param.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });

    test('SSM parameters should have required tags', () => {
      const params = ['S3EncryptionRuleParameter', 'ComplianceRulesParameter'];
      params.forEach(paramName => {
        const param = template.Resources[paramName];
        const tags = param.Properties.Tags;
        expect(tags).toBeDefined();
        // Tags is an object, not array
        expect(tags['project']).toBe('iac-rlhf-amazon');
        expect(tags['team-number']).toBe(2);
      });
    });

    test('SSM parameters should have type String', () => {
      const params = ['S3EncryptionRuleParameter', 'ComplianceRulesParameter',
                      'IAMWildcardRuleParameter', 'PublicAccessRuleParameter'];
      params.forEach(paramName => {
        const param = template.Resources[paramName];
        expect(param.Properties.Type).toBe('String');
      });
    });

    test('SSM parameters should have descriptions', () => {
      const params = ['S3EncryptionRuleParameter', 'ComplianceRulesParameter',
                      'IAMWildcardRuleParameter', 'PublicAccessRuleParameter'];
      params.forEach(paramName => {
        const param = template.Resources[paramName];
        expect(param.Properties.Description).toBeDefined();
      });
    });
  });

  describe('Outputs', () => {
    test('should have KMSKeyId output', () => {
      expect(template.Outputs.KMSKeyId).toBeDefined();
    });

    test('should have EnvironmentSuffix output', () => {
      expect(template.Outputs.EnvironmentSuffix).toBeDefined();
    });

    test('should have LambdaFunctionArn output', () => {
      expect(template.Outputs.LambdaFunctionArn).toBeDefined();
    });

    test('should have ConfigRecorderName output', () => {
      expect(template.Outputs.ConfigRecorderName).toBeDefined();
    });

    test('should have TemplateBucketName output', () => {
      expect(template.Outputs.TemplateBucketName).toBeDefined();
    });

    test('should have NotificationTopicArn output', () => {
      expect(template.Outputs.NotificationTopicArn).toBeDefined();
    });

    test('should have ViolationsTableName output', () => {
      expect(template.Outputs.ViolationsTableName).toBeDefined();
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(typeof output.Description).toBe('string');
      });
    });

    test('all outputs should have values', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Value).toBeDefined();
      });
    });

    test('outputs should reference correct resources', () => {
      expect(template.Outputs.LambdaFunctionArn.Value).toEqual({
        'Fn::GetAtt': ['ComplianceScannerFunction', 'Arn']
      });
      expect(template.Outputs.ConfigRecorderName.Value).toEqual({
        Ref: 'ConfigurationRecorder'
      });
      expect(template.Outputs.TemplateBucketName.Value).toEqual({
        Ref: 'ComplianceTemplateBucket'
      });
      expect(template.Outputs.NotificationTopicArn.Value).toEqual({
        Ref: 'ComplianceNotificationTopic'
      });
      expect(template.Outputs.ViolationsTableName.Value).toEqual({
        Ref: 'ComplianceViolationsTable'
      });
    });

    test('KMSKeyId output should reference KMS key', () => {
      expect(template.Outputs.KMSKeyId.Value).toEqual({
        Ref: 'ComplianceKMSKey'
      });
    });

    test('EnvironmentSuffix output should reference parameter', () => {
      expect(template.Outputs.EnvironmentSuffix.Value).toEqual({
        Ref: 'EnvironmentSuffix'
      });
    });
  });

  describe('Multi-Region Compatibility', () => {
    test('should use AWS::Region pseudo parameter where needed', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain('AWS::Region');
    });

    test('should use AWS::AccountId pseudo parameter where needed', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain('AWS::AccountId');
    });

    test('should not have hardcoded region references', () => {
      const templateStr = JSON.stringify(template);
      const regionPattern = /us-(east|west|gov)-(1|2)|eu-(west|central|north|south)-(1|2|3)|ap-(south|northeast|southeast)-(1|2|3)/g;
      const matches = templateStr.match(regionPattern);
      // Allow region in comments or descriptions, but not in actual ARNs or configurations
      if (matches) {
        matches.forEach(match => {
          // Check if it's in a description or comment context
          const context = templateStr.substring(templateStr.indexOf(match) - 50, templateStr.indexOf(match) + 50);
          expect(context.toLowerCase()).toMatch(/(description|comment)/i);
        });
      }
    });

    test('S3 bucket names should include AccountId for uniqueness', () => {
      const logBucket = template.Resources.ComplianceLogBucket;
      const templateBucket = template.Resources.ComplianceTemplateBucket;
      expect(logBucket.Properties.BucketName['Fn::Sub']).toContain('${AWS::AccountId}');
      expect(templateBucket.Properties.BucketName['Fn::Sub']).toContain('${AWS::AccountId}');
    });
  });

  describe('Security Best Practices', () => {
    test('all S3 buckets should have encryption enabled', () => {
      const buckets = ['ComplianceLogBucket', 'ComplianceTemplateBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
      });
    });

    test('all S3 buckets should block public access', () => {
      const buckets = ['ComplianceLogBucket', 'ComplianceTemplateBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });
    });

    test('DynamoDB table should have encryption enabled', () => {
      const table = template.Resources.ComplianceViolationsTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('SNS topic should have encryption enabled', () => {
      const topic = template.Resources.ComplianceNotificationTopic;
      expect(topic.Properties.KmsMasterKeyId).toBeDefined();
    });

    test('CloudWatch log groups should have proper configuration', () => {
      const logGroups = ['ComplianceLambdaLogGroup', 'ComplianceConfigLogGroup'];
      logGroups.forEach(logGroupName => {
        const logGroup = template.Resources[logGroupName];
        expect(logGroup.Properties).toBeDefined();
        expect(logGroup.Properties.LogGroupName).toBeDefined();
      });
    });

    test('all stateful resources should have DeletionPolicy set to Delete', () => {
      const statefulResources = [
        'ComplianceKMSKey',
        'ComplianceLogBucket',
        'ComplianceTemplateBucket',
        'ComplianceViolationsTable',
        'ComplianceLambdaLogGroup',
        'ComplianceConfigLogGroup'
      ];
      statefulResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('Resource Tagging', () => {
    test('all taggable resources should have required tags', () => {
      const taggableResources = [
        'ComplianceKMSKey',
        'ComplianceLogBucket',
        'ComplianceTemplateBucket',
        'ComplianceViolationsTable',
        'ComplianceLambdaLogGroup',
        'ComplianceConfigLogGroup',
        'ComplianceNotificationTopic',
        'ComplianceLambdaRole',
        'ConfigServiceRole',
        'ComplianceScannerFunction'
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties.Tags;
        expect(tags).toBeDefined();
        const projectTag = tags.find((t: any) => t.Key === 'project');
        const teamTag = tags.find((t: any) => t.Key === 'team-number');
        expect(projectTag).toBeDefined();
        expect(projectTag.Value).toBe('iac-rlhf-amazon');
        expect(teamTag).toBeDefined();
        expect(teamTag.Value).toBe(2);
      });
    });

    test('tags should use correct format', () => {
      const resource = template.Resources.ComplianceKMSKey;
      const tags = resource.Properties.Tags;
      tags.forEach((tag: any) => {
        expect(tag.Key).toBeDefined();
        expect(tag.Value).toBeDefined();
        expect(typeof tag.Key).toBe('string');
        // Value can be string or number (for team-number: 2)
        expect(['string', 'number', 'object']).toContain(typeof tag.Value);
      });
    });

    test('required tags should have exact values', () => {
      const resource = template.Resources.ComplianceKMSKey;
      const tags = resource.Properties.Tags;
      const projectTag = tags.find((t: any) => t.Key === 'project');
      const teamTag = tags.find((t: any) => t.Key === 'team-number');
      expect(projectTag.Value).toBe('iac-rlhf-amazon');
      expect(teamTag.Value).toBe(2);
    });
  });

  describe('Resource Count and Completeness', () => {
    test('should have exactly 2 parameters', () => {
      expect(Object.keys(template.Parameters).length).toBe(2);
    });

    test('should have at least 28 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(28);
    });

    test('should have exactly 7 outputs', () => {
      expect(Object.keys(template.Outputs).length).toBe(7);
    });

    test('should have all required resource types', () => {
      const resourceTypes = Object.values(template.Resources).map((r: any) => r.Type);
      const expectedTypes = [
        'AWS::KMS::Key',
        'AWS::S3::Bucket',
        'AWS::S3::BucketPolicy',
        'AWS::DynamoDB::Table',
        'AWS::Logs::LogGroup',
        'AWS::SNS::Topic',
        'AWS::IAM::Role',
        'AWS::Lambda::Function',
        'AWS::Config::ConfigurationRecorder',
        'AWS::Config::DeliveryChannel',
        'AWS::Config::ConfigRule',
        'AWS::CloudWatch::Alarm',
        'AWS::SSM::Parameter'
      ];

      expectedTypes.forEach(expectedType => {
        expect(resourceTypes).toContain(expectedType);
      });
    });

    test('should have correct number of S3 buckets', () => {
      const s3Buckets = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::S3::Bucket'
      );
      expect(s3Buckets.length).toBe(2);
    });

    test('should have correct number of Config Rules', () => {
      const configRules = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::Config::ConfigRule'
      );
      expect(configRules.length).toBe(4);
    });

    test('should have correct number of CloudWatch Alarms', () => {
      const alarms = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::CloudWatch::Alarm'
      );
      expect(alarms.length).toBe(3);
    });
  });
});
