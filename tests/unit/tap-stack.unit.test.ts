import * as lib from '../../lib/index';

describe('HIPAA Compliant Healthcare Monitoring Infrastructure Template', () => {
  let template: any;

  beforeAll(() => {
    template = lib.loadTemplate();
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have HIPAA compliance description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description.toLowerCase()).toContain('hipaa');
    });

    test('should have required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should validate successfully', () => {
      expect(lib.validateTemplate(template)).toBe(true);
    });

    test('should throw error for template without format version', () => {
      expect(() => lib.validateTemplate({})).toThrow('Template missing AWSTemplateFormatVersion');
    });

    test('should throw error for template without description', () => {
      expect(() => lib.validateTemplate({ AWSTemplateFormatVersion: '2010-09-09' })).toThrow('Template missing Description');
    });

    test('should throw error for template without parameters', () => {
      expect(() => lib.validateTemplate({
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Test'
      })).toThrow('Template missing Parameters');
    });

    test('should throw error for template without resources', () => {
      expect(() => lib.validateTemplate({
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Test',
        Parameters: {}
      })).toThrow('Template missing Resources');
    });

    test('should throw error for template without outputs', () => {
      expect(() => lib.validateTemplate({
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Test',
        Parameters: {},
        Resources: {}
      })).toThrow('Template missing Outputs');
    });
  });

  describe('Parameters', () => {
    test('should have environmentSuffix parameter', () => {
      expect(template.Parameters.environmentSuffix).toBeDefined();
      expect(template.Parameters.environmentSuffix.Type).toBe('String');
    });

    test('should have AlertEmail parameter', () => {
      expect(template.Parameters.AlertEmail).toBeDefined();
      expect(template.Parameters.AlertEmail.Type).toBe('String');
    });

    test('environmentSuffix should have proper validation', () => {
      const param = template.Parameters.environmentSuffix;
      expect(param.AllowedPattern).toBeDefined();
      expect(param.ConstraintDescription).toBeDefined();
    });
  });

  describe('KMS Resources', () => {
    test('should have KMS encryption key', () => {
      expect(template.Resources.HIPAAEncryptionKey).toBeDefined();
      expect(template.Resources.HIPAAEncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have key rotation enabled', () => {
      const key = template.Resources.HIPAAEncryptionKey;
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('KMS key should have proper policy', () => {
      const key = template.Resources.HIPAAEncryptionKey;
      expect(key.Properties.KeyPolicy).toBeDefined();
      expect(key.Properties.KeyPolicy.Version).toBe('2012-10-17');
      expect(key.Properties.KeyPolicy.Statement).toBeInstanceOf(Array);
      expect(key.Properties.KeyPolicy.Statement.length).toBeGreaterThan(0);
    });

    test('KMS key should have CloudWatch Logs permissions', () => {
      const key = template.Resources.HIPAAEncryptionKey;
      const statements = key.Properties.KeyPolicy.Statement;
      const logsStatement = statements.find((s: any) =>
        s.Sid === 'Allow CloudWatch Logs'
      );
      expect(logsStatement).toBeDefined();
    });

    test('KMS key should have HIPAA compliance tags', () => {
      const key = template.Resources.HIPAAEncryptionKey;
      const tags = key.Properties.Tags;
      const complianceTag = tags.find((t: any) => t.Key === 'Compliance');
      expect(complianceTag).toBeDefined();
      expect(complianceTag.Value).toBe('HIPAA');
    });

    test('should have KMS alias', () => {
      expect(template.Resources.HIPAAEncryptionKeyAlias).toBeDefined();
      expect(template.Resources.HIPAAEncryptionKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('KMS alias should use environmentSuffix', () => {
      const alias = template.Resources.HIPAAEncryptionKeyAlias;
      expect(alias.Properties.AliasName).toBeDefined();
      const aliasName = alias.Properties.AliasName['Fn::Sub'];
      expect(aliasName).toContain('${environmentSuffix}');
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should have patient data log group', () => {
      expect(template.Resources.PatientDataLogGroup).toBeDefined();
      expect(template.Resources.PatientDataLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have security log group', () => {
      expect(template.Resources.SecurityLogGroup).toBeDefined();
      expect(template.Resources.SecurityLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have audit log group', () => {
      expect(template.Resources.AuditLogGroup).toBeDefined();
      expect(template.Resources.AuditLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('patient data log group should have 90-day retention', () => {
      const logGroup = template.Resources.PatientDataLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(90);
    });

    test('security log group should have 365-day retention', () => {
      const logGroup = template.Resources.SecurityLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(365);
    });

    test('audit log group should have 7-year retention', () => {
      const logGroup = template.Resources.AuditLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(2557);
    });

    test('all log groups should be encrypted with KMS', () => {
      const logGroups = [
        'PatientDataLogGroup',
        'SecurityLogGroup',
        'AuditLogGroup'
      ];

      logGroups.forEach(lgName => {
        const lg = template.Resources[lgName];
        expect(lg.Properties.KmsKeyId).toBeDefined();
        expect(lg.Properties.KmsKeyId['Fn::GetAtt']).toEqual(['HIPAAEncryptionKey', 'Arn']);
      });
    });

    test('all log groups should have HIPAA compliance tags', () => {
      const logGroups = [
        'PatientDataLogGroup',
        'SecurityLogGroup',
        'AuditLogGroup'
      ];

      logGroups.forEach(lgName => {
        const lg = template.Resources[lgName];
        const complianceTag = lg.Properties.Tags.find((t: any) => t.Key === 'Compliance');
        expect(complianceTag).toBeDefined();
        expect(complianceTag.Value).toBe('HIPAA');
      });
    });

    test('all log groups should use environmentSuffix in naming', () => {
      const logGroups = [
        'PatientDataLogGroup',
        'SecurityLogGroup',
        'AuditLogGroup'
      ];

      logGroups.forEach(lgName => {
        const lg = template.Resources[lgName];
        const logGroupName = lg.Properties.LogGroupName['Fn::Sub'];
        expect(logGroupName).toContain('${environmentSuffix}');
      });
    });
  });

  describe('SNS Topic', () => {
    test('should have compliance alert topic', () => {
      expect(template.Resources.ComplianceAlertTopic).toBeDefined();
      expect(template.Resources.ComplianceAlertTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('SNS topic should be encrypted with KMS', () => {
      const topic = template.Resources.ComplianceAlertTopic;
      expect(topic.Properties.KmsMasterKeyId).toBeDefined();
      expect(topic.Properties.KmsMasterKeyId.Ref).toBe('HIPAAEncryptionKey');
    });

    test('SNS topic should use environmentSuffix in naming', () => {
      const topic = template.Resources.ComplianceAlertTopic;
      const topicName = topic.Properties.TopicName['Fn::Sub'];
      expect(topicName).toContain('${environmentSuffix}');
    });

    test('SNS topic should have HIPAA compliance tags', () => {
      const topic = template.Resources.ComplianceAlertTopic;
      const complianceTag = topic.Properties.Tags.find((t: any) => t.Key === 'Compliance');
      expect(complianceTag).toBeDefined();
      expect(complianceTag.Value).toBe('HIPAA');
    });

    test('should have SNS subscription', () => {
      expect(template.Resources.ComplianceAlertSubscription).toBeDefined();
      expect(template.Resources.ComplianceAlertSubscription.Type).toBe('AWS::SNS::Subscription');
    });

    test('SNS subscription should use email protocol', () => {
      const subscription = template.Resources.ComplianceAlertSubscription;
      expect(subscription.Properties.Protocol).toBe('email');
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have unauthorized access alarm', () => {
      expect(template.Resources.UnauthorizedAccessAlarm).toBeDefined();
      expect(template.Resources.UnauthorizedAccessAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have KMS key disabled alarm', () => {
      expect(template.Resources.KMSKeyDisabledAlarm).toBeDefined();
      expect(template.Resources.KMSKeyDisabledAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have security group changes alarm', () => {
      expect(template.Resources.SecurityGroupChangesAlarm).toBeDefined();
      expect(template.Resources.SecurityGroupChangesAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have IAM policy changes alarm', () => {
      expect(template.Resources.IAMPolicyChangesAlarm).toBeDefined();
      expect(template.Resources.IAMPolicyChangesAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('all alarms should send notifications to SNS topic', () => {
      const alarms = [
        'UnauthorizedAccessAlarm',
        'KMSKeyDisabledAlarm',
        'SecurityGroupChangesAlarm',
        'IAMPolicyChangesAlarm'
      ];

      alarms.forEach(alarmName => {
        const alarm = template.Resources[alarmName];
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(alarm.Properties.AlarmActions[0].Ref).toBe('ComplianceAlertTopic');
      });
    });

    test('all alarms should use environmentSuffix in naming', () => {
      const alarms = [
        'UnauthorizedAccessAlarm',
        'KMSKeyDisabledAlarm',
        'SecurityGroupChangesAlarm',
        'IAMPolicyChangesAlarm'
      ];

      alarms.forEach(alarmName => {
        const alarm = template.Resources[alarmName];
        const alarmNameValue = alarm.Properties.AlarmName['Fn::Sub'];
        expect(alarmNameValue).toContain('${environmentSuffix}');
      });
    });

    test('all alarms should have HIPAA compliance tags', () => {
      const alarms = [
        'UnauthorizedAccessAlarm',
        'KMSKeyDisabledAlarm',
        'SecurityGroupChangesAlarm',
        'IAMPolicyChangesAlarm'
      ];

      alarms.forEach(alarmName => {
        const alarm = template.Resources[alarmName];
        const complianceTag = alarm.Properties.Tags.find((t: any) => t.Key === 'Compliance');
        expect(complianceTag).toBeDefined();
        expect(complianceTag.Value).toBe('HIPAA');
      });
    });
  });

  describe('IAM Resources', () => {
    test('should have monitoring role', () => {
      expect(template.Resources.MonitoringRole).toBeDefined();
      expect(template.Resources.MonitoringRole.Type).toBe('AWS::IAM::Role');
    });

    test('monitoring role should use environmentSuffix in naming', () => {
      const role = template.Resources.MonitoringRole;
      const roleName = role.Properties.RoleName['Fn::Sub'];
      expect(roleName).toContain('${environmentSuffix}');
    });

    test('monitoring role should have Lambda service principal', () => {
      const role = template.Resources.MonitoringRole;
      const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
      const service = statement.Principal.Service;
      if (Array.isArray(service)) {
        expect(service).toContain('lambda.amazonaws.com');
      } else {
        expect(service).toBe('lambda.amazonaws.com');
      }
    });

    test('monitoring role should have HIPAA compliance tags', () => {
      const role = template.Resources.MonitoringRole;
      const complianceTag = role.Properties.Tags.find((t: any) => t.Key === 'Compliance');
      expect(complianceTag).toBeDefined();
      expect(complianceTag.Value).toBe('HIPAA');
    });

    test('should have monitoring policy', () => {
      expect(template.Resources.MonitoringPolicy).toBeDefined();
      expect(template.Resources.MonitoringPolicy.Type).toBe('AWS::IAM::Policy');
    });

    test('monitoring policy should grant CloudWatch Logs permissions', () => {
      const policy = template.Resources.MonitoringPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      const logsStatement = statements.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('logs:'))
      );
      expect(logsStatement).toBeDefined();
    });

    test('monitoring policy should grant KMS permissions', () => {
      const policy = template.Resources.MonitoringPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      const kmsStatement = statements.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('kms:'))
      );
      expect(kmsStatement).toBeDefined();
    });

    test('monitoring policy should grant SNS permissions', () => {
      const policy = template.Resources.MonitoringPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      const snsStatement = statements.find((s: any) =>
        s.Action.includes('sns:Publish')
      );
      expect(snsStatement).toBeDefined();
    });

    test('monitoring policy should use environmentSuffix in naming', () => {
      const policy = template.Resources.MonitoringPolicy;
      const policyName = policy.Properties.PolicyName['Fn::Sub'];
      expect(policyName).toContain('${environmentSuffix}');
    });
  });

  describe('Outputs', () => {
    test('should have KMS key ID output', () => {
      expect(template.Outputs.KMSKeyId).toBeDefined();
      expect(template.Outputs.KMSKeyId.Value.Ref).toBe('HIPAAEncryptionKey');
    });

    test('should have KMS key ARN output', () => {
      expect(template.Outputs.KMSKeyArn).toBeDefined();
      expect(template.Outputs.KMSKeyArn.Value['Fn::GetAtt']).toEqual(['HIPAAEncryptionKey', 'Arn']);
    });

    test('should have patient data log group output', () => {
      expect(template.Outputs.PatientDataLogGroupName).toBeDefined();
      expect(template.Outputs.PatientDataLogGroupName.Value.Ref).toBe('PatientDataLogGroup');
    });

    test('should have security log group output', () => {
      expect(template.Outputs.SecurityLogGroupName).toBeDefined();
      expect(template.Outputs.SecurityLogGroupName.Value.Ref).toBe('SecurityLogGroup');
    });

    test('should have audit log group output', () => {
      expect(template.Outputs.AuditLogGroupName).toBeDefined();
      expect(template.Outputs.AuditLogGroupName.Value.Ref).toBe('AuditLogGroup');
    });

    test('should have compliance alert topic output', () => {
      expect(template.Outputs.ComplianceAlertTopicArn).toBeDefined();
      expect(template.Outputs.ComplianceAlertTopicArn.Value.Ref).toBe('ComplianceAlertTopic');
    });

    test('should have monitoring role output', () => {
      expect(template.Outputs.MonitoringRoleArn).toBeDefined();
      expect(template.Outputs.MonitoringRoleArn.Value['Fn::GetAtt']).toEqual(['MonitoringRole', 'Arn']);
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Export).toBeDefined();
      });
    });
  });

  describe('Security and Compliance', () => {
    test('should not have any Retain deletion policies', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('all resources should use environmentSuffix for naming', () => {
      const resourcesRequiringSuffix = [
        'HIPAAEncryptionKeyAlias',
        'PatientDataLogGroup',
        'SecurityLogGroup',
        'AuditLogGroup',
        'ComplianceAlertTopic',
        'UnauthorizedAccessAlarm',
        'KMSKeyDisabledAlarm',
        'SecurityGroupChangesAlarm',
        'IAMPolicyChangesAlarm',
        'MonitoringRole',
        'MonitoringPolicy'
      ];

      resourcesRequiringSuffix.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(lib.usesEnvironmentSuffix(resource)).toBe(true);
      });
    });

    test('should identify KMS encrypted resources', () => {
      const encryptedResources = lib.getKmsEncryptedResources(template);
      expect(encryptedResources.length).toBeGreaterThan(0);
      expect(encryptedResources).toContain('HIPAAEncryptionKey');
      expect(encryptedResources).toContain('PatientDataLogGroup');
    });

    test('should identify HIPAA compliant resources', () => {
      const compliantResources = lib.getHipaaCompliantResources(template);
      expect(compliantResources.length).toBeGreaterThan(0);
      expect(compliantResources).toContain('HIPAAEncryptionKey');
    });

    test('should validate retention policies', () => {
      const retentionCheck = lib.validateRetentionPolicies(template);
      expect(retentionCheck.allValid).toBe(true);
      expect(retentionCheck.patientData).toBe(90);
      expect(retentionCheck.security).toBe(365);
      expect(retentionCheck.audit).toBe(2557);
    });

    test('should handle missing log groups in retention validation', () => {
      const emptyTemplate = { Resources: {} };
      const retentionCheck = lib.validateRetentionPolicies(emptyTemplate);
      expect(retentionCheck.allValid).toBe(false);
      expect(retentionCheck.patientData).toBe(0);
      expect(retentionCheck.security).toBe(0);
      expect(retentionCheck.audit).toBe(0);
    });

    test('should identify all CloudWatch alarms', () => {
      const alarms = lib.getAlarms(template);
      expect(alarms.length).toBe(4);
      expect(alarms.some((a: {name: string; metricName: string; threshold: number}) => a.name === 'UnauthorizedAccessAlarm')).toBe(true);
    });

    test('should validate all outputs have exports', () => {
      expect(lib.validateOutputExports(template)).toBe(true);
    });

    test('template should have exactly 22 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(22);
    });

    test('template should have exactly 10 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(10);
    });
  });

  describe('CloudTrail Integration', () => {
    test('should have CloudTrail resources configured', () => {
      const cloudtrailResources = lib.getCloudTrailResources(template);

      expect(cloudtrailResources.trail).toBeDefined();
      expect(cloudtrailResources.bucket).toBeDefined();
      expect(cloudtrailResources.logGroup).toBeDefined();
      expect(cloudtrailResources.metricFilters.length).toBe(4);
    });

    test('should validate CloudTrail compliance configuration', () => {
      const validation = lib.validateCloudTrailCompliance(template);

      expect(validation.hasTrail).toBe(true);
      expect(validation.isMultiRegion).toBe(true);
      expect(validation.hasLogFileValidation).toBe(true);
      expect(validation.hasEncryptedBucket).toBe(true);
      expect(validation.hasCloudWatchIntegration).toBe(true);
    });

    test('should have all required metric filters', () => {
      const filters = lib.getMetricFilters(template);

      expect(filters.length).toBe(4);

      const filterNames = filters.map(f => f.metricName);
      expect(filterNames).toContain('UnauthorizedAPICallsEventCount');
      expect(filterNames).toContain('DisableOrScheduleKeyDeletionEventCount');
      expect(filterNames).toContain('SecurityGroupEventCount');
      expect(filterNames).toContain('IAMPolicyEventCount');
    });

    test('should have CloudTrail bucket with encryption', () => {
      const bucket = template.Resources.CloudTrailBucket;

      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have CloudTrail bucket with lifecycle policy', () => {
      const bucket = template.Resources.CloudTrailBucket;

      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules.length).toBeGreaterThan(0);

      const rule = bucket.Properties.LifecycleConfiguration.Rules[0];
      expect(rule.Status).toBe('Enabled');
      expect(rule.ExpirationInDays).toBe(2557);
    });

    test('should have CloudTrail log group with encryption', () => {
      const logGroup = template.Resources.CloudTrailLogGroup;

      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.KmsKeyId).toBeDefined();
      expect(logGroup.Properties.RetentionInDays).toBe(365);
    });

    test('should have CloudTrail with multi-region support', () => {
      const trail = template.Resources.HIPAACloudTrail;

      expect(trail).toBeDefined();
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('should have CloudTrail outputs', () => {
      expect(template.Outputs.CloudTrailName).toBeDefined();
      expect(template.Outputs.CloudTrailBucketName).toBeDefined();
      expect(template.Outputs.CloudTrailLogGroupName).toBeDefined();
    });

    test('should handle template without CloudTrail resources', () => {
      const emptyTemplate = { Resources: {} };
      const validation = lib.validateCloudTrailCompliance(emptyTemplate);

      expect(validation.hasTrail).toBe(false);
      expect(validation.isMultiRegion).toBe(false);
      expect(validation.hasLogFileValidation).toBe(false);
      expect(validation.hasEncryptedBucket).toBe(false);
      expect(validation.hasCloudWatchIntegration).toBe(false);
    });

    test('should handle template with missing CloudTrail bucket', () => {
      const partialTemplate = {
        Resources: {
          HIPAACloudTrail: { Type: 'AWS::CloudTrail::Trail' }
        }
      };
      const validation = lib.validateCloudTrailCompliance(partialTemplate);

      expect(validation.hasTrail).toBe(false);
    });

    test('should handle template with missing CloudTrail trail', () => {
      const partialTemplate = {
        Resources: {
          CloudTrailBucket: { Type: 'AWS::S3::Bucket' }
        }
      };
      const validation = lib.validateCloudTrailCompliance(partialTemplate);

      expect(validation.hasTrail).toBe(false);
    });
  });
});
