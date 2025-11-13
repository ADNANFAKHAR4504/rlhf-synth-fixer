import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Compliance Analysis System CloudFormation Template', () => {
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

    test('should have description for compliance system', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Compliance Analysis System');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('should have ComplianceCheckSchedule parameter', () => {
      expect(template.Parameters.ComplianceCheckSchedule).toBeDefined();
      const param = template.Parameters.ComplianceCheckSchedule;
      expect(param.Default).toBe('rate(6 hours)');
    });

    test('should have ReportRetentionDays parameter', () => {
      expect(template.Parameters.ReportRetentionDays).toBeDefined();
      const param = template.Parameters.ReportRetentionDays;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(90);
    });

    test('should have SecondaryRegions parameter', () => {
      expect(template.Parameters.SecondaryRegions).toBeDefined();
      const param = template.Parameters.SecondaryRegions;
      expect(param.Type).toBe('CommaDelimitedList');
      expect(param.Default).toBe('us-west-2,eu-west-1');
    });
  });

  describe('KMS Key Resources', () => {
    test('should have ComplianceKMSKey', () => {
      expect(template.Resources.ComplianceKMSKey).toBeDefined();
      const key = template.Resources.ComplianceKMSKey;
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.KeyPolicy).toBeDefined();
    });

    test('ComplianceKMSKey should have proper key policy', () => {
      const key = template.Resources.ComplianceKMSKey;
      const policy = key.Properties.KeyPolicy;
      expect(policy.Statement).toBeInstanceOf(Array);
      expect(policy.Statement.length).toBeGreaterThan(0);
    });

    test('should have ComplianceKMSKeyAlias', () => {
      expect(template.Resources.ComplianceKMSKeyAlias).toBeDefined();
      const alias = template.Resources.ComplianceKMSKeyAlias;
      expect(alias.Type).toBe('AWS::KMS::Alias');
    });

    test('ComplianceKMSKeyAlias should use environment suffix', () => {
      const alias = template.Resources.ComplianceKMSKeyAlias;
      expect(alias.Properties.AliasName['Fn::Sub']).toContain('compliance-');
      expect(alias.Properties.AliasName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('S3 Bucket Resources', () => {
    test('should have ComplianceReportsBucket', () => {
      expect(template.Resources.ComplianceReportsBucket).toBeDefined();
      const bucket = template.Resources.ComplianceReportsBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('ComplianceReportsBucket should have versioning enabled', () => {
      const bucket = template.Resources.ComplianceReportsBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('ComplianceReportsBucket should have encryption configured', () => {
      const bucket = template.Resources.ComplianceReportsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration
      ).toBeDefined();
    });

    test('ComplianceReportsBucket should block public access', () => {
      const bucket = template.Resources.ComplianceReportsBucket;
      const config = bucket.Properties.PublicAccessBlockConfiguration;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });

    test('ComplianceReportsBucket should have lifecycle rules', () => {
      const bucket = template.Resources.ComplianceReportsBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeInstanceOf(Array);
      expect(bucket.Properties.LifecycleConfiguration.Rules.length).toBeGreaterThan(0);
    });

    test('should have ComplianceReportsBucketPolicy', () => {
      expect(template.Resources.ComplianceReportsBucketPolicy).toBeDefined();
      const policy = template.Resources.ComplianceReportsBucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('SNS Topic Resources', () => {
    test('should have ComplianceAlertTopic', () => {
      expect(template.Resources.ComplianceAlertTopic).toBeDefined();
      const topic = template.Resources.ComplianceAlertTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('ComplianceAlertTopic should use KMS encryption', () => {
      const topic = template.Resources.ComplianceAlertTopic;
      expect(topic.Properties.KmsMasterKeyId).toBeDefined();
    });

    test('ComplianceAlertTopic should include environment suffix in name', () => {
      const topic = template.Resources.ComplianceAlertTopic;
      expect(topic.Properties.TopicName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('AWS Config Rules', () => {
    test('should have RequiredTagsRule', () => {
      expect(template.Resources.RequiredTagsRule).toBeDefined();
      const rule = template.Resources.RequiredTagsRule;
      expect(rule.Type).toBe('AWS::Config::ConfigRule');
    });

    test('RequiredTagsRule should check for all required tags', () => {
      const rule = template.Resources.RequiredTagsRule;
      const params = rule.Properties.InputParameters;
      expect(params.tag1Key).toBe('Environment');
      expect(params.tag2Key).toBe('Owner');
      expect(params.tag3Key).toBe('CostCenter');
      expect(params.tag4Key).toBe('ComplianceLevel');
    });

    test('should have EncryptedVolumesRule', () => {
      expect(template.Resources.EncryptedVolumesRule).toBeDefined();
      const rule = template.Resources.EncryptedVolumesRule;
      expect(rule.Type).toBe('AWS::Config::ConfigRule');
      expect(rule.Properties.Source.SourceIdentifier).toBe('ENCRYPTED_VOLUMES');
    });

    test('should have S3BucketEncryptionRule', () => {
      expect(template.Resources.S3BucketEncryptionRule).toBeDefined();
      const rule = template.Resources.S3BucketEncryptionRule;
      expect(rule.Type).toBe('AWS::Config::ConfigRule');
      expect(rule.Properties.Source.SourceIdentifier).toBe(
        'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED'
      );
    });

    test('should have SecurityGroupRestrictedRule', () => {
      expect(template.Resources.SecurityGroupRestrictedRule).toBeDefined();
      const rule = template.Resources.SecurityGroupRestrictedRule;
      expect(rule.Type).toBe('AWS::Config::ConfigRule');
      expect(rule.Properties.Source.SourceIdentifier).toBe('RESTRICTED_INCOMING_TRAFFIC');
    });

    test('SecurityGroupRestrictedRule should block high-risk ports', () => {
      const rule = template.Resources.SecurityGroupRestrictedRule;
      const params = rule.Properties.InputParameters;
      expect(params.blockedPort1).toBe('22');
      expect(params.blockedPort2).toBe('3389');
      expect(params.blockedPort3).toBe('3306');
      expect(params.blockedPort4).toBe('5432');
    });
  });

  describe('Lambda Function Resources', () => {
    test('should have ComplianceLambdaRole', () => {
      expect(template.Resources.ComplianceLambdaRole).toBeDefined();
      const role = template.Resources.ComplianceLambdaRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('ComplianceLambdaRole should have necessary policies', () => {
      const role = template.Resources.ComplianceLambdaRole;
      expect(role.Properties.Policies).toBeDefined();
      expect(role.Properties.Policies).toBeInstanceOf(Array);
      expect(role.Properties.Policies.length).toBeGreaterThan(0);
    });

    test('should have ComplianceAnalysisFunction', () => {
      expect(template.Resources.ComplianceAnalysisFunction).toBeDefined();
      const func = template.Resources.ComplianceAnalysisFunction;
      expect(func.Type).toBe('AWS::Lambda::Function');
    });

    test('ComplianceAnalysisFunction should have 256MB memory', () => {
      const func = template.Resources.ComplianceAnalysisFunction;
      expect(func.Properties.MemorySize).toBe(256);
    });

    test('ComplianceAnalysisFunction should have environment variables', () => {
      const func = template.Resources.ComplianceAnalysisFunction;
      expect(func.Properties.Environment).toBeDefined();
      expect(func.Properties.Environment.Variables).toBeDefined();
    });

    test('ComplianceAnalysisFunction should use environment suffix in name', () => {
      const func = template.Resources.ComplianceAnalysisFunction;
      expect(func.Properties.FunctionName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('EventBridge Resources', () => {
    test('should have ComplianceScheduleRule', () => {
      expect(template.Resources.ComplianceScheduleRule).toBeDefined();
      const rule = template.Resources.ComplianceScheduleRule;
      expect(rule.Type).toBe('AWS::Events::Rule');
    });

    test('ComplianceScheduleRule should use schedule parameter', () => {
      const rule = template.Resources.ComplianceScheduleRule;
      expect(rule.Properties.ScheduleExpression).toBeDefined();
    });

    test('should have ComplianceSchedulePermission', () => {
      expect(template.Resources.ComplianceSchedulePermission).toBeDefined();
      const permission = template.Resources.ComplianceSchedulePermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  describe('CloudWatch Dashboard Resources', () => {
    test('should have ComplianceDashboard', () => {
      expect(template.Resources.ComplianceDashboard).toBeDefined();
      const dashboard = template.Resources.ComplianceDashboard;
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('ComplianceDashboard should have dashboard body', () => {
      const dashboard = template.Resources.ComplianceDashboard;
      expect(dashboard.Properties.DashboardBody).toBeDefined();
    });

    test('ComplianceDashboard should include environment suffix', () => {
      const dashboard = template.Resources.ComplianceDashboard;
      expect(dashboard.Properties.DashboardName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Outputs', () => {
    test('should have ComplianceReportsBucketName output', () => {
      expect(template.Outputs.ComplianceReportsBucketName).toBeDefined();
      const output = template.Outputs.ComplianceReportsBucketName;
      expect(output.Description).toBeDefined();
      expect(output.Export).toBeDefined();
    });

    test('should have ComplianceReportsBucketArn output', () => {
      expect(template.Outputs.ComplianceReportsBucketArn).toBeDefined();
    });

    test('should have ComplianceAlertTopicArn output', () => {
      expect(template.Outputs.ComplianceAlertTopicArn).toBeDefined();
    });

    test('should have ComplianceAnalysisFunctionArn output', () => {
      expect(template.Outputs.ComplianceAnalysisFunctionArn).toBeDefined();
    });

    test('should have ComplianceKMSKeyId output', () => {
      expect(template.Outputs.ComplianceKMSKeyId).toBeDefined();
    });

    test('should have ComplianceDashboardURL output', () => {
      expect(template.Outputs.ComplianceDashboardURL).toBeDefined();
    });

    test('should have StackName output', () => {
      expect(template.Outputs.StackName).toBeDefined();
    });

    test('should have EnvironmentSuffix output', () => {
      expect(template.Outputs.EnvironmentSuffix).toBeDefined();
      const output = template.Outputs.EnvironmentSuffix;
      expect(output.Value).toEqual({ Ref: 'EnvironmentSuffix' });
    });
  });

  describe('Resource Tagging', () => {
    const resourcesWithTags = [
      'ComplianceKMSKey',
      'ComplianceReportsBucket',
      'ComplianceAlertTopic',
      'ComplianceLambdaRole',
      'ComplianceAnalysisFunction',
    ];

    resourcesWithTags.forEach(resourceName => {
      test(`${resourceName} should have required tags`, () => {
        const resource = template.Resources[resourceName];
        if (resource) {
          expect(resource.Properties.Tags).toBeDefined();
          const tags = resource.Properties.Tags;
          const tagKeys = tags.map((tag: any) => tag.Key);
          expect(tagKeys).toContain('Environment');
          expect(tagKeys).toContain('Owner');
          expect(tagKeys).toContain('CostCenter');
          expect(tagKeys).toContain('ComplianceLevel');
        }
      });
    });
  });

  describe('Resource Naming Convention', () => {
    const resourcesWithDynamicNames = [
      'ComplianceKMSKeyAlias',
      'ComplianceReportsBucket',
      'ComplianceAlertTopic',
      'ComplianceLambdaRole',
      'ComplianceAnalysisFunction',
      'ComplianceScheduleRule',
      'ComplianceDashboard',
    ];

    resourcesWithDynamicNames.forEach(resourceName => {
      test(`${resourceName} should include EnvironmentSuffix in naming`, () => {
        const resource = template.Resources[resourceName];
        if (resource) {
          const nameProperty =
            resource.Properties.FunctionName ||
            resource.Properties.RoleName ||
            resource.Properties.TopicName ||
            resource.Properties.BucketName ||
            resource.Properties.AliasName ||
            resource.Properties.Name ||
            resource.Properties.DashboardName;

          if (nameProperty && typeof nameProperty === 'object') {
            expect(JSON.stringify(nameProperty)).toContain('EnvironmentSuffix');
          }
        }
      });
    });
  });

  describe('Security Configuration', () => {
    test('S3 bucket should enforce encryption in bucket policy', () => {
      const policy = template.Resources.ComplianceReportsBucketPolicy;
      const policyDoc = policy.Properties.PolicyDocument;
      const statements = policyDoc.Statement;

      const encryptionStatement = statements.find((s: any) =>
        s.Sid.includes('Unencrypted')
      );
      expect(encryptionStatement).toBeDefined();
      expect(encryptionStatement.Effect).toBe('Deny');
    });

    test('S3 bucket should enforce secure transport', () => {
      const policy = template.Resources.ComplianceReportsBucketPolicy;
      const policyDoc = policy.Properties.PolicyDocument;
      const statements = policyDoc.Statement;

      const secureTransportStatement = statements.find((s: any) =>
        s.Sid.includes('Insecure') || s.Sid.includes('SecureTransport')
      );
      expect(secureTransportStatement).toBeDefined();
      expect(secureTransportStatement.Effect).toBe('Deny');
    });

    test('Lambda role should not have wildcard permissions', () => {
      const role = template.Resources.ComplianceLambdaRole;
      const policies = role.Properties.Policies;

      policies.forEach((policy: any) => {
        policy.PolicyDocument.Statement.forEach((statement: any) => {
          if (Array.isArray(statement.Action)) {
            statement.Action.forEach((action: string) => {
              expect(action).not.toBe('*');
            });
          } else {
            expect(statement.Action).not.toBe('*');
          }
        });
      });
    });
  });

  describe('Deletion Protection', () => {
    test('resources should not have Retain deletion policy', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('S3 bucket should not have DeletionProtection enabled', () => {
      const bucket = template.Resources.ComplianceReportsBucket;
      expect(bucket.Properties.DeletionProtectionEnabled).not.toBe(true);
    });
  });
});
