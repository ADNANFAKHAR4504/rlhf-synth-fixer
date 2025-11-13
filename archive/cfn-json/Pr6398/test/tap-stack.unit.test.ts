import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Infrastructure Compliance Analysis System');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have NotificationEmail parameter', () => {
      expect(template.Parameters.NotificationEmail).toBeDefined();
      expect(template.Parameters.NotificationEmail.Type).toBe('String');
      expect(template.Parameters.NotificationEmail.AllowedPattern).toBeDefined();
    });

    test('should have ConfigSnapshotFrequency parameter', () => {
      expect(template.Parameters.ConfigSnapshotFrequency).toBeDefined();
      expect(template.Parameters.ConfigSnapshotFrequency.Type).toBe('String');
      expect(template.Parameters.ConfigSnapshotFrequency.AllowedValues).toContain('TwentyFour_Hours');
    });

    test('EnvironmentSuffix should have valid pattern constraint', () => {
      expect(template.Parameters.EnvironmentSuffix.AllowedPattern).toBe('^[a-z0-9-]+$');
    });

    test('NotificationEmail should have email pattern', () => {
      const emailPattern = template.Parameters.NotificationEmail.AllowedPattern;
      expect(emailPattern).toContain('@');
    });
  });

  describe('S3 Resources', () => {
    test('should create ConfigBucket with encryption', () => {
      const bucket = template.Resources.ConfigBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('ConfigBucket should have versioning enabled', () => {
      const bucket = template.Resources.ConfigBucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('ConfigBucket should block public access', () => {
      const bucket = template.Resources.ConfigBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock).toBeDefined();
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('ConfigBucket should have lifecycle rules', () => {
      const bucket = template.Resources.ConfigBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toHaveLength(1);
      expect(bucket.Properties.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(90);
    });

    test('ConfigBucket name should use EnvironmentSuffix', () => {
      const bucket = template.Resources.ConfigBucket;
      expect(bucket.Properties.BucketName).toBeDefined();
      const bucketName = bucket.Properties.BucketName['Fn::Sub'];
      expect(bucketName).toContain('${EnvironmentSuffix}');
    });

    test('should create ConfigBucketPolicy with proper permissions', () => {
      const policy = template.Resources.ConfigBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.PolicyDocument.Statement).toBeDefined();
      expect(policy.Properties.PolicyDocument.Statement.length).toBeGreaterThan(0);
    });

    test('ConfigBucketPolicy should allow AWS Config service', () => {
      const policy = template.Resources.ConfigBucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      const configStatements = statements.filter((s: any) =>
        s.Principal?.Service === 'config.amazonaws.com'
      );
      expect(configStatements.length).toBeGreaterThan(0);
    });
  });

  describe('SNS Resources', () => {
    test('should create ComplianceNotificationTopic', () => {
      const topic = template.Resources.ComplianceNotificationTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.DisplayName).toBe('Compliance Violation Notifications');
    });

    test('ComplianceNotificationTopic name should use EnvironmentSuffix', () => {
      const topic = template.Resources.ComplianceNotificationTopic;
      const topicName = topic.Properties.TopicName['Fn::Sub'];
      expect(topicName).toContain('${EnvironmentSuffix}');
    });

    test('ComplianceNotificationTopic should have email subscription', () => {
      const topic = template.Resources.ComplianceNotificationTopic;
      expect(topic.Properties.Subscription).toBeDefined();
      expect(topic.Properties.Subscription).toHaveLength(1);
      expect(topic.Properties.Subscription[0].Protocol).toBe('email');
    });

    test('should create ComplianceNotificationTopicPolicy', () => {
      const policy = template.Resources.ComplianceNotificationTopicPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::SNS::TopicPolicy');
    });

    test('ComplianceNotificationTopicPolicy should allow Config service', () => {
      const policy = template.Resources.ComplianceNotificationTopicPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      expect(statements[0].Principal.Service).toBe('config.amazonaws.com');
      expect(statements[0].Action).toBe('SNS:Publish');
    });
  });

  describe('AWS Config Rules', () => {
    const expectedRules = [
      'S3BucketPublicReadProhibitedRule',
      'S3BucketPublicWriteProhibitedRule',
      'S3BucketServerSideEncryptionEnabledRule',
      'S3BucketVersioningEnabledRule',
      'EC2VolumeEncryptionRule',
      'RDSEncryptionEnabledRule',
      'IAMPasswordPolicyRule',
      'IAMRootAccessKeyCheckRule',
      'VPCFlowLogsEnabledRule',
      'CloudTrailEnabledRule'
    ];

    test('should have all 10 Config Rules', () => {
      expectedRules.forEach(ruleName => {
        expect(template.Resources[ruleName]).toBeDefined();
        expect(template.Resources[ruleName].Type).toBe('AWS::Config::ConfigRule');
      });
    });

    test('S3BucketPublicReadProhibitedRule should have correct source identifier', () => {
      const rule = template.Resources.S3BucketPublicReadProhibitedRule;
      expect(rule.Properties.Source.Owner).toBe('AWS');
      expect(rule.Properties.Source.SourceIdentifier).toBe('S3_BUCKET_PUBLIC_READ_PROHIBITED');
    });

    test('S3BucketPublicWriteProhibitedRule should have correct source identifier', () => {
      const rule = template.Resources.S3BucketPublicWriteProhibitedRule;
      expect(rule.Properties.Source.SourceIdentifier).toBe('S3_BUCKET_PUBLIC_WRITE_PROHIBITED');
    });

    test('S3BucketServerSideEncryptionEnabledRule should have correct source identifier', () => {
      const rule = template.Resources.S3BucketServerSideEncryptionEnabledRule;
      expect(rule.Properties.Source.SourceIdentifier).toBe('S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED');
    });

    test('S3BucketVersioningEnabledRule should have correct source identifier', () => {
      const rule = template.Resources.S3BucketVersioningEnabledRule;
      expect(rule.Properties.Source.SourceIdentifier).toBe('S3_BUCKET_VERSIONING_ENABLED');
    });

    test('EC2VolumeEncryptionRule should have correct source identifier', () => {
      const rule = template.Resources.EC2VolumeEncryptionRule;
      expect(rule.Properties.Source.SourceIdentifier).toBe('ENCRYPTED_VOLUMES');
    });

    test('RDSEncryptionEnabledRule should have correct source identifier', () => {
      const rule = template.Resources.RDSEncryptionEnabledRule;
      expect(rule.Properties.Source.SourceIdentifier).toBe('RDS_STORAGE_ENCRYPTED');
    });

    test('IAMPasswordPolicyRule should have correct source identifier', () => {
      const rule = template.Resources.IAMPasswordPolicyRule;
      expect(rule.Properties.Source.SourceIdentifier).toBe('IAM_PASSWORD_POLICY');
    });

    test('IAMPasswordPolicyRule should have input parameters', () => {
      const rule = template.Resources.IAMPasswordPolicyRule;
      expect(rule.Properties.InputParameters).toBeDefined();
      expect(rule.Properties.InputParameters.RequireUppercaseCharacters).toBe('true');
      expect(rule.Properties.InputParameters.MinimumPasswordLength).toBe('14');
    });

    test('IAMRootAccessKeyCheckRule should have correct source identifier', () => {
      const rule = template.Resources.IAMRootAccessKeyCheckRule;
      expect(rule.Properties.Source.SourceIdentifier).toBe('IAM_ROOT_ACCESS_KEY_CHECK');
    });

    test('VPCFlowLogsEnabledRule should have correct source identifier', () => {
      const rule = template.Resources.VPCFlowLogsEnabledRule;
      expect(rule.Properties.Source.SourceIdentifier).toBe('VPC_FLOW_LOGS_ENABLED');
    });

    test('CloudTrailEnabledRule should have correct source identifier', () => {
      const rule = template.Resources.CloudTrailEnabledRule;
      expect(rule.Properties.Source.SourceIdentifier).toBe('CLOUD_TRAIL_ENABLED');
    });

    test('all Config Rules should use EnvironmentSuffix in name', () => {
      expectedRules.forEach(ruleName => {
        const rule = template.Resources[ruleName];
        const configRuleName = rule.Properties.ConfigRuleName['Fn::Sub'];
        expect(configRuleName).toContain('${EnvironmentSuffix}');
      });
    });

    test('all Config Rules should have descriptions', () => {
      expectedRules.forEach(ruleName => {
        const rule = template.Resources[ruleName];
        expect(rule.Properties.Description).toBeDefined();
        expect(rule.Properties.Description.length).toBeGreaterThan(0);
      });
    });

    test('S3 Config Rules should have proper scope', () => {
      const s3Rules = [
        'S3BucketPublicReadProhibitedRule',
        'S3BucketPublicWriteProhibitedRule',
        'S3BucketServerSideEncryptionEnabledRule',
        'S3BucketVersioningEnabledRule'
      ];

      s3Rules.forEach(ruleName => {
        const rule = template.Resources[ruleName];
        expect(rule.Properties.Scope).toBeDefined();
        expect(rule.Properties.Scope.ComplianceResourceTypes).toContain('AWS::S3::Bucket');
      });
    });

    test('EC2VolumeEncryptionRule should have proper scope', () => {
      const rule = template.Resources.EC2VolumeEncryptionRule;
      expect(rule.Properties.Scope.ComplianceResourceTypes).toContain('AWS::EC2::Volume');
    });

    test('RDSEncryptionEnabledRule should have proper scope', () => {
      const rule = template.Resources.RDSEncryptionEnabledRule;
      expect(rule.Properties.Scope.ComplianceResourceTypes).toContain('AWS::RDS::DBInstance');
    });

    test('VPCFlowLogsEnabledRule should have proper scope', () => {
      const rule = template.Resources.VPCFlowLogsEnabledRule;
      expect(rule.Properties.Scope.ComplianceResourceTypes).toContain('AWS::EC2::VPC');
    });
  });

  describe('CloudWatch Logs', () => {
    test('should create ComplianceDashboardLogGroup', () => {
      const logGroup = template.Resources.ComplianceDashboardLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('ComplianceDashboardLogGroup should have 30 day retention', () => {
      const logGroup = template.Resources.ComplianceDashboardLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('ComplianceDashboardLogGroup name should use EnvironmentSuffix', () => {
      const logGroup = template.Resources.ComplianceDashboardLogGroup;
      const logGroupName = logGroup.Properties.LogGroupName['Fn::Sub'];
      expect(logGroupName).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Outputs', () => {
    test('should have ConfigBucketName output', () => {
      expect(template.Outputs.ConfigBucketName).toBeDefined();
      expect(template.Outputs.ConfigBucketName.Description).toContain('S3 bucket');
    });

    test('should have ConfigBucketArn output', () => {
      expect(template.Outputs.ConfigBucketArn).toBeDefined();
      expect(template.Outputs.ConfigBucketArn.Description).toContain('ARN');
    });

    test('should have ComplianceNotificationTopicArn output', () => {
      expect(template.Outputs.ComplianceNotificationTopicArn).toBeDefined();
      expect(template.Outputs.ComplianceNotificationTopicArn.Description).toContain('SNS topic');
    });

    test('should have ComplianceRulesDeployed output', () => {
      expect(template.Outputs.ComplianceRulesDeployed).toBeDefined();
      expect(template.Outputs.ComplianceRulesDeployed.Value).toBe('10');
    });

    test('should have ComplianceDashboardLogGroup output', () => {
      expect(template.Outputs.ComplianceDashboardLogGroup).toBeDefined();
      expect(template.Outputs.ComplianceDashboardLogGroup.Description).toContain('CloudWatch log group');
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Description).toBeDefined();
      });
    });

    test('ConfigBucketName should have export', () => {
      expect(template.Outputs.ConfigBucketName.Export).toBeDefined();
      expect(template.Outputs.ConfigBucketName.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
    });
  });

  describe('Resource Tags', () => {
    test('ConfigBucket should have tags', () => {
      const bucket = template.Resources.ConfigBucket;
      expect(bucket.Properties.Tags).toBeDefined();
      expect(bucket.Properties.Tags.length).toBeGreaterThan(0);
    });

    test('ComplianceNotificationTopic should have tags', () => {
      const topic = template.Resources.ComplianceNotificationTopic;
      expect(topic.Properties.Tags).toBeDefined();
      expect(topic.Properties.Tags.length).toBeGreaterThan(0);
    });

    test('ConfigBucket tags should include Name with EnvironmentSuffix', () => {
      const bucket = template.Resources.ConfigBucket;
      const nameTag = bucket.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Security and Compliance', () => {
    test('should not have any Retain deletion policies', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });

    test('ConfigBucket should have encryption enabled', () => {
      const bucket = template.Resources.ConfigBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('ConfigBucket should not allow public access', () => {
      const bucket = template.Resources.ConfigBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
    });

    test('S3 bucket policy should restrict access to specific account', () => {
      const policy = template.Resources.ConfigBucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      statements.forEach((statement: any) => {
        if (statement.Condition && statement.Condition.StringEquals) {
          expect(statement.Condition.StringEquals['AWS:SourceAccount']).toBeDefined();
        }
      });
    });
  });

  describe('Resource Count', () => {
    test('should have 6 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(6);
    });

    test('should have 3 parameters', () => {
      const paramCount = Object.keys(template.Parameters).length;
      expect(paramCount).toBe(3);
    });
  });
});
